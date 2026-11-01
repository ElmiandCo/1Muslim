import {NextResponse} from "next/server";
import {createClient} from "../../../utils/supabase/server";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const headers={"Cache-Control":"private, no-store"};
async function count(postId:string){
 const db=await createClient();
 const {count,error}=await db.from("ummah_post_shares").select("id",{count:"exact",head:true}).eq("post_id",postId);
 if(error)throw Error("Shares unavailable");
 return count||0;
}
export async function GET(request:Request){
 const postId=new URL(request.url).searchParams.get("postId");
 if(!postId||!uuid.test(postId))return NextResponse.json({error:"Invalid post"},{status:400});
 try{return NextResponse.json({count:await count(postId)},{headers})}
 catch{return NextResponse.json({error:"Shares unavailable"},{status:503,headers})}
}
export async function POST(request:Request){
 const origin=request.headers.get("origin");
 if(origin&&origin!==new URL(request.url).origin)return NextResponse.json({error:"Invalid origin"},{status:403});
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({error:"Sign in to track shares"},{status:401});
 const {postId}=await request.json().catch(()=>({}));
 if(typeof postId!=="string"||!uuid.test(postId))return NextResponse.json({error:"Invalid post"},{status:400});
 const {data:post}=await db.from("ummah_feed_posts").select("id").eq("id",postId).maybeSingle();
 if(!post)return NextResponse.json({error:"Post not found"},{status:404});
 const {error}=await db.from("ummah_post_shares").insert({post_id:postId,user_id:user.id});
 if(error)return NextResponse.json({error:"Share count unavailable"},{status:503});
 return NextResponse.json({count:await count(postId).catch(()=>null)},{headers});
}
