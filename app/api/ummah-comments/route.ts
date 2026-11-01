import {NextResponse} from "next/server";
import {createClient as createServiceClient} from "@supabase/supabase-js";
import {createClient} from "../../../utils/supabase/server";

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const imagePath=/^[0-9a-f-]{36}\/ummah-comments\/[A-Za-z0-9._-]+\.(?:png|jpg|jpeg|webp)$/;
const maxImageBytes=5*1024*1024;
type CommentRow={id:string;post_id:string;author_id:string;parent_id:string|null;body:string;image_path:string|null;created_at:string};
const noStore={"Cache-Control":"private, no-store"};

async function signCommentImages(db:Awaited<ReturnType<typeof createClient>>,comments:CommentRow[]){
 const valid=comments.filter(c=>c.image_path&&imagePath.test(c.image_path)&&c.image_path.startsWith(c.author_id+"/ummah-comments/"));
 if(!valid.length)return new Map<string,string>();
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 // Service key signs ONLY paths already linked to an RLS-readable comment, never arbitrary user input.
 const storage=url&&key?createServiceClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):db;
 const paths=[...new Set(valid.map(c=>c.image_path!))];
 const {data,error}=await storage.storage.from("community-media").createSignedUrls(paths,1800);
 if(error)return new Map<string,string>();
 return new Map(paths.flatMap((p,i)=>{const signed=data?.[i]?.signedUrl;return signed?[[p,signed] as const]:[]}));
}

export async function GET(request:Request){
 const db=await createClient();
 const postId=new URL(request.url).searchParams.get("postId");
 if(postId&&!uuid.test(postId))return NextResponse.json({error:"Invalid post"},{status:400,headers:noStore});
 let query=db.from("ummah_post_comments").select("id,post_id,author_id,parent_id,body,image_path,created_at").order("created_at",{ascending:true}).limit(500);
 if(postId)query=query.eq("post_id",postId);
 const {data,error}=await query;
 if(error)return NextResponse.json({error:"Comments unavailable"},{status:503,headers:noStore});
 const comments=(data||[]) as CommentRow[];
 const authorIds=[...new Set(comments.map(c=>c.author_id))];
 const commentIds=comments.map(c=>c.id);
 const [{data:profiles},{data:likes},{data:auth},images]=await Promise.all([
  authorIds.length?db.from("profiles").select("id,display_name,username,avatar_url").in("id",authorIds):Promise.resolve({data:[]}),
  commentIds.length?db.from("ummah_comment_likes").select("comment_id,user_id").in("comment_id",commentIds):Promise.resolve({data:[]}),
  db.auth.getUser(),
  signCommentImages(db,comments)
 ]);
 const names=new Map((profiles||[]).map(p=>[p.id,p]));
 const counts=new Map<string,number>(),mine=new Set<string>();
 for(const l of likes||[]){counts.set(l.comment_id,(counts.get(l.comment_id)||0)+1);if(l.user_id===auth.user?.id)mine.add(l.comment_id)}
 return NextResponse.json({comments:comments.map(c=>({
  ...c,name:names.get(c.author_id)?.display_name||names.get(c.author_id)?.username||"Community member",
  username:names.get(c.author_id)?.username||null,
  avatar_url:names.get(c.author_id)?.avatar_url||null,
  image_url:c.image_path?images.get(c.image_path)||null:null,
  likes:counts.get(c.id)||0,liked:mine.has(c.id)
 }))},{headers:noStore});
}

export async function POST(request:Request){
 const origin=request.headers.get("origin");
 if(origin&&origin!==new URL(request.url).origin)return NextResponse.json({error:"Invalid request origin"},{status:403});
 const db=await createClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({error:"Sign in to comment"},{status:401});
 const payload=await request.json().catch(()=>({}));
 const body=typeof payload.body==="string"?payload.body.trim():"";
 const image=typeof payload.imagePath==="string"?payload.imagePath:null;
 if(!uuid.test(payload.postId||"")||body.length>1500||(!body&&!image))
  return NextResponse.json({error:"Enter a comment up to 1,500 characters or attach an image"},{status:400});
 if(payload.parentId!=null&&!uuid.test(payload.parentId))
  return NextResponse.json({error:"Invalid reply target"},{status:400});
 if(image){
  if(image.length>300||!imagePath.test(image)||!image.startsWith(user.id+"/ummah-comments/"))
   return NextResponse.json({error:"Invalid image path"},{status:400});
  const {data:info,error:infoError}=await db.storage.from("community-media").info(image);
  const metadata=info?.metadata as {mimetype?:string;mimeType?:string;size?:number|string}|undefined;
  const mime=String(metadata?.mimetype||metadata?.mimeType||"").toLowerCase();
  const size=Number(metadata?.size||0);
  if(infoError||!["image/png","image/jpeg","image/webp"].includes(mime)||!Number.isFinite(size)||size<=0||size>maxImageBytes)
   return NextResponse.json({error:"Only PNG, JPEG or WebP images up to 5 MB are allowed"},{status:400});
 }
 const {data:post}=await db.from("ummah_feed_posts").select("id,author_id").eq("id",payload.postId).maybeSingle();
 if(!post)return NextResponse.json({error:"Post not found"},{status:404});
 if(payload.parentId){
  const {data:parent}=await db.from("ummah_post_comments").select("id,parent_id").eq("id",payload.parentId).eq("post_id",post.id).maybeSingle();
  if(!parent)return NextResponse.json({error:"Reply target not found"},{status:400});
  if(parent.parent_id){
   const {data:ancestor}=await db.from("ummah_post_comments").select("parent_id").eq("id",parent.parent_id).eq("post_id",post.id).maybeSingle();
   if(!ancestor||ancestor.parent_id)return NextResponse.json({error:"Maximum three comment levels"},{status:400});
  }
 }
 const {data,error}=await db.from("ummah_post_comments").insert({
  post_id:post.id,author_id:user.id,parent_id:payload.parentId||null,body,image_path:image
 }).select("id,post_id,author_id,parent_id,body,image_path,created_at").single();
 if(error)return NextResponse.json({error:error.code==="23514"?"Reply depth or image rejected":"Unable to save comment"},{status:error.code==="23514"?400:503});
 if(post.author_id&&post.author_id!==user.id){
  await db.from("notifications").insert({recipient_id:post.author_id,actor_id:user.id,type:"post_comment",title:"New comment on your post",body:(body||"Shared an image").slice(0,180),entity_type:"ummah_post",entity_id:post.id}).then(()=>{});
 }
 const {data:profile}=await db.from("profiles").select("display_name,username,avatar_url").eq("id",user.id).maybeSingle();
 const signed=await signCommentImages(db,[data as CommentRow]);
 return NextResponse.json({comment:{
  ...data,name:profile?.display_name||profile?.username||"You",username:profile?.username||null,
  avatar_url:profile?.avatar_url||null,image_url:image?signed.get(image)||null:null,likes:0,liked:false
 }},{status:201,headers:noStore});
}
