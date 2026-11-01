import {NextResponse} from "next/server";
import {createClient as createServiceClient} from "@supabase/supabase-js";
import {createClient} from "../../../utils/supabase/server";

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const imagePath=/^[0-9a-f-]{36}\/ummah-comments\/[A-Za-z0-9._-]+\.(?:png|jpg|jpeg|webp)$/;
const noStore={"Cache-Control":"private, no-store"};
const MAX_IMAGE=5*1024*1024;
type Row={id:string;post_id:string;user_id:string;parent_id:string|null;body:string;image_path:string|null;created_at:string};
type Media={comment_id:string;user_id:string;storage_path:string;mime_type:string};
type Db=Awaited<ReturnType<typeof createClient>>;

async function signedImages(db:Db, rows:Row[], media:Media[]){
 const mediaByComment=new Map<string,string>();
 for(const m of media)if(m.mime_type.startsWith("image/")&&m.storage_path.startsWith(m.user_id+"/")&&!mediaByComment.has(m.comment_id))mediaByComment.set(m.comment_id,m.storage_path);
 const paths=new Map<string,string>();
 for(const c of rows){
  const p=c.image_path||mediaByComment.get(c.id);
  if(p&&p.startsWith(c.user_id+"/")&&(p===c.image_path?imagePath.test(p):true))paths.set(c.id,p);
 }
 if(!paths.size)return {urls:new Map<string,string>(),paths};
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 // Sign only storage paths attached to comments already RLS-readable from this post.
 const storage=url&&key?createServiceClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):db;
 const unique=[...new Set(paths.values())];
 const {data,error}=await storage.storage.from("community-media").createSignedUrls(unique,1800);
 if(error)return {urls:new Map<string,string>(),paths};
 const byPath=new Map(unique.flatMap((p,i)=>data?.[i]?.signedUrl?[[p,data[i].signedUrl] as const]:[]));
 return {urls:new Map([...paths].flatMap(([id,p])=>byPath.get(p)?[[id,byPath.get(p)!] as const]:[])),paths};
}

export async function GET(request:Request){
 const postId=new URL(request.url).searchParams.get("postId");
 if(!postId||!uuid.test(postId))return NextResponse.json({error:"Invalid post"},{status:400,headers:noStore});
 const db=await createClient();
 const {data:post,error:postError}=await db.from("posts").select("id").eq("id",postId).maybeSingle();
 if(postError)return NextResponse.json({error:"Posts unavailable"},{status:503,headers:noStore});
 if(!post)return NextResponse.json({error:"Post not found"},{status:404,headers:noStore});
 const {data,error}=await db.from("comments").select("id,post_id,user_id,parent_id,body,image_path,created_at").eq("post_id",postId).order("created_at",{ascending:true}).limit(500);
 if(error)return NextResponse.json({error:"Comments unavailable"},{status:503,headers:noStore});
 const rows=(data||[]) as Row[], ids=rows.map(c=>c.id);
 const authors=[...new Set(rows.map(c=>c.user_id))];
 const [profileResult,countsResult,authResult,mediaResult]=await Promise.all([
  authors.length?db.from("profiles").select("id,display_name,username,avatar_url").in("id",authors):Promise.resolve({data:[]}),
  ids.length?db.from("comment_like_counts").select("comment_id,like_count").in("comment_id",ids):Promise.resolve({data:[]}),
  db.auth.getUser(),
  ids.length?db.from("comment_media").select("comment_id,user_id,storage_path,mime_type").in("comment_id",ids):Promise.resolve({data:[]})
 ]);
 const mine=authResult.data.user&&ids.length
  ?await db.from("comment_likes").select("comment_id").in("comment_id",ids).eq("user_id",authResult.data.user.id)
  :{data:[]};
 const names=new Map((profileResult.data||[]).map(p=>[p.id,p]));
 const counts=new Map((countsResult.data||[]).map(l=>[l.comment_id,l.like_count]));
 const liked=new Set((mine.data||[]).map(l=>l.comment_id));
 const images=await signedImages(db,rows,(mediaResult.data||[]) as Media[]);
 return NextResponse.json({comments:rows.map(c=>({
  id:c.id,post_id:c.post_id,author_id:c.user_id,parent_id:c.parent_id,body:c.body,created_at:c.created_at,
  name:names.get(c.user_id)?.display_name||names.get(c.user_id)?.username||"Community member",
  username:names.get(c.user_id)?.username||null,avatar_url:names.get(c.user_id)?.avatar_url||null,
  image_path:c.image_path||images.paths.get(c.id)||null,image_url:images.urls.get(c.id)||null,
  likes:counts.get(c.id)||0,liked:liked.has(c.id)
 }))},{headers:noStore});
}

export async function POST(request:Request){
 const origin=request.headers.get("origin");
 if(origin&&origin!==new URL(request.url).origin)return NextResponse.json({error:"Invalid request origin"},{status:403,headers:noStore});
 const db=await createClient(),{data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({error:"Sign in to comment"},{status:401,headers:noStore});
 const payload=await request.json().catch(()=>({}));
 const body=typeof payload.body==="string"?payload.body.trim():"";
 const image=typeof payload.imagePath==="string"?payload.imagePath:null;
 if(!uuid.test(payload.postId||"")||body.length>1500||(!body&&!image))
  return NextResponse.json({error:"Enter a comment up to 1,500 characters or attach an image"},{status:400,headers:noStore});
 if(payload.parentId!=null&&!uuid.test(payload.parentId))
  return NextResponse.json({error:"Invalid reply target"},{status:400,headers:noStore});
 if(image){
  if(image.length>300||!imagePath.test(image)||!image.startsWith(user.id+"/ummah-comments/"))
   return NextResponse.json({error:"Invalid image path"},{status:400,headers:noStore});
  const {data:info,error:infoError}=await db.storage.from("community-media").info(image);
  const meta=info?.metadata as {mimetype?:string;mimeType?:string;size?:number|string}|undefined;
  const mime=String(meta?.mimetype||meta?.mimeType||"").toLowerCase(),size=Number(meta?.size||0);
  if(infoError||!["image/png","image/jpeg","image/webp"].includes(mime)||!Number.isFinite(size)||size<=0||size>MAX_IMAGE)
   return NextResponse.json({error:"Only PNG, JPEG or WebP up to 5 MB"},{status:400,headers:noStore});
 }
 const {data:post,error:postError}=await db.from("posts").select("id,user_id").eq("id",payload.postId).maybeSingle();
 if(postError)return NextResponse.json({error:"Posts unavailable"},{status:503,headers:noStore});
 if(!post)return NextResponse.json({error:"Post not found"},{status:404,headers:noStore});
 if(payload.parentId){
  const {data:parent}=await db.from("comments").select("id,parent_id").eq("id",payload.parentId).eq("post_id",post.id).maybeSingle();
  if(!parent)return NextResponse.json({error:"Reply target not found"},{status:400,headers:noStore});
  if(parent.parent_id){
   const {data:grandparent}=await db.from("comments").select("parent_id").eq("id",parent.parent_id).eq("post_id",post.id).maybeSingle();
   if(!grandparent||grandparent.parent_id)return NextResponse.json({error:"Maximum three comment levels"},{status:400,headers:noStore});
  }
 }
 const {data,error}=await db.from("comments").insert({post_id:post.id,user_id:user.id,parent_id:payload.parentId||null,body,image_path:image})
  .select("id,post_id,user_id,parent_id,body,image_path,created_at").single();
 if(error)return NextResponse.json({error:error.code==="23514"?"Reply depth or image rejected":"Unable to save comment"},{status:error.code==="23514"?400:503,headers:noStore});
 const {data:profile}=await db.from("profiles").select("display_name,username,avatar_url").eq("id",user.id).maybeSingle();
 const images=await signedImages(db,[data as Row],[]);
 return NextResponse.json({comment:{
  id:data.id,post_id:data.post_id,author_id:data.user_id,parent_id:data.parent_id,body:data.body,created_at:data.created_at,
  name:profile?.display_name||profile?.username||"You",username:profile?.username||null,avatar_url:profile?.avatar_url||null,
  image_path:image,image_url:images.urls.get(data.id)||null,likes:0,liked:false
 }},{status:201,headers:noStore});
}
