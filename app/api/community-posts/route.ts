import {NextResponse} from "next/server";
import {createClient} from "../../../utils/supabase/server";
export async function GET(){
 const db=await createClient();
 const {data,error}=await db.from("community_posts").select("id,author_id,body,created_at").order("created_at",{ascending:false}).limit(100);
 if(error)return NextResponse.json({error:"Community feed unavailable"},{status:503});
 return NextResponse.json({posts:data||[]});
}
export async function POST(request:Request){
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({error:"Sign in to post"},{status:401});
 const body=await request.json().catch(()=>({}));
 const text=typeof body.text==="string"?body.text.trim():"";
 if(text.length<1||text.length>2000)return NextResponse.json({error:"Write a post between 1 and 2,000 characters"},{status:400});
 if(text.startsWith("✦ DAILY UMMAH ✦")){
  const now=new Date();const start=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate())).toISOString();
  const {data:today,error:checkError}=await db.from("community_posts").select("id,body").eq("author_id",user.id).gte("created_at",start);
  if(checkError)return NextResponse.json({error:"Could not verify today's daily post"},{status:503});
  if((today||[]).some(p=>p.body?.startsWith("✦ DAILY UMMAH ✦")))return NextResponse.json({error:"Your daily post is already published today"},{status:409});
 }
 const {data,error}=await db.from("community_posts").insert({author_id:user.id,body:text}).select("id,author_id,body,created_at").single();
 if(error)return NextResponse.json({error:"Could not publish your post"},{status:503});
 return NextResponse.json({post:data},{status:201});
}
