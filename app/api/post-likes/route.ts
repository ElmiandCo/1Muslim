import {NextResponse} from "next/server";
import {createClient} from "../../../utils/supabase/server";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const headers={"Cache-Control":"private, no-store"};
async function state(postId:string){
 const db=await createClient(),{data:{user}}=await db.auth.getUser();
 const [count,mine]=await Promise.all([
  db.from("post_like_counts").select("like_count").eq("post_id",postId).maybeSingle(),
  user?db.from("post_likes").select("post_id").eq("post_id",postId).eq("user_id",user.id).maybeSingle():Promise.resolve({data:null,error:null})
 ]);
 if(count.error||mine.error)throw Error("Likes unavailable");
 return {count:count.data?.like_count||0,liked:!!mine.data};
}
export async function GET(request:Request){
 const postId=new URL(request.url).searchParams.get("postId");
 if(!postId||!uuid.test(postId))return NextResponse.json({error:"Invalid post"},{status:400,headers});
 // Match /api/post-comments: canonical posts remain authenticated-only by RLS.
 const db=await createClient();
 const {data:post,error:postError}=await db.from("posts").select("id").eq("id",postId).maybeSingle();
 if(postError)return NextResponse.json({error:"Posts unavailable"},{status:503,headers});
 if(!post)return NextResponse.json({error:"Post not found"},{status:404,headers});
 try{return NextResponse.json(await state(postId),{headers})}
 catch{return NextResponse.json({error:"Likes unavailable"},{status:503,headers})}
}
export async function POST(request:Request){
 const origin=request.headers.get("origin");
 if(origin&&origin!==new URL(request.url).origin)return NextResponse.json({error:"Invalid origin"},{status:403,headers});
 const db=await createClient(),{data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({error:"Sign in to like"},{status:401,headers});
 const {postId}=await request.json().catch(()=>({}));
 if(typeof postId!=="string"||!uuid.test(postId))return NextResponse.json({error:"Invalid post"},{status:400,headers});
 const {data:post,error:postError}=await db.from("posts").select("id").eq("id",postId).maybeSingle();
 if(postError)return NextResponse.json({error:"Posts unavailable"},{status:503,headers});
 if(!post)return NextResponse.json({error:"Post not found"},{status:404,headers});
 const {data:existing,error:readError}=await db.from("post_likes").select("post_id").eq("post_id",postId).eq("user_id",user.id).maybeSingle();
 if(readError)return NextResponse.json({error:"Likes unavailable"},{status:503,headers});
 // INSERT, not UPSERT: existing RLS grants INSERT/DELETE but not UPDATE.
 // A concurrent duplicate insert is already a like; read back the actual state.
 const {error}=existing
  ?await db.from("post_likes").delete().eq("post_id",postId).eq("user_id",user.id)
  :await db.from("post_likes").insert({post_id:postId,user_id:user.id});
 if(error&&error.code!=="23505")return NextResponse.json({error:"Unable to update like"},{status:503,headers});
 try{return NextResponse.json(await state(postId),{headers})}
 catch{return NextResponse.json({liked:!existing,count:null},{headers})}
}
