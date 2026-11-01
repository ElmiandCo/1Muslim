import {NextResponse} from "next/server";
import {createClient} from "../../../utils/supabase/server";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const headers={"Cache-Control":"private, no-store"};
async function state(postId:string){
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 const [{data:aggregate,error},{data:mine,error:mineError}]=await Promise.all([
  db.from("ummah_post_like_counts").select("like_count").eq("post_id",postId).maybeSingle(),
  user?db.from("ummah_post_likes").select("post_id").eq("post_id",postId).eq("user_id",user.id).maybeSingle():Promise.resolve({data:null,error:null})
 ]);
 if(error||mineError)throw Error("Likes unavailable");
 return {count:aggregate?.like_count||0,liked:!!mine};
}
export async function GET(request:Request){
 const postId=new URL(request.url).searchParams.get("postId");
 if(!postId||!uuid.test(postId))return NextResponse.json({error:"Invalid post"},{status:400});
 try{return NextResponse.json(await state(postId),{headers})}
 catch{return NextResponse.json({error:"Likes unavailable"},{status:503,headers})}
}
export async function POST(request:Request){
 const origin=request.headers.get("origin");
 if(origin&&origin!==new URL(request.url).origin)return NextResponse.json({error:"Invalid origin"},{status:403});
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({error:"Sign in to like"},{status:401});
 const {postId}=await request.json().catch(()=>({}));
 if(typeof postId!=="string"||!uuid.test(postId))return NextResponse.json({error:"Invalid post"},{status:400});
 const {data:post}=await db.from("ummah_feed_posts").select("id").eq("id",postId).maybeSingle();
 if(!post)return NextResponse.json({error:"Post not found"},{status:404});
 const {data:existing}=await db.from("ummah_post_likes").select("post_id").eq("post_id",postId).eq("user_id",user.id).maybeSingle();
 const {error}=existing
  ?await db.from("ummah_post_likes").delete().eq("post_id",postId).eq("user_id",user.id)
  :await db.from("ummah_post_likes").upsert({post_id:postId,user_id:user.id},{onConflict:"post_id,user_id"});
 if(error)return NextResponse.json({error:"Unable to update like"},{status:503});
 try{return NextResponse.json(await state(postId),{headers})}
 catch{return NextResponse.json({liked:!existing,count:null},{headers})}
}
