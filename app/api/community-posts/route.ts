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
 const today=new Date().toISOString().slice(0,10);
 const {data:existing,error:checkError}=await db.from("community_posts").select("id").eq("author_id",user.id).gte("created_at",today+"T00:00:00.000Z").lt("created_at",new Date(Date.parse(today+"T00:00:00.000Z")+86400000).toISOString()).limit(1);
 if(checkError)return NextResponse.json({error:"Could not verify today’s posting limit"},{status:503});
 if(existing?.length)return NextResponse.json({error:"You have already shared your community post today. Come back tomorrow!"},{status:429});
 const {data,error}=await db.from("community_posts").insert({author_id:user.id,body:text}).select("id,author_id,body,created_at").single();
 if(error)return NextResponse.json({error:error.code==="23505"?"You have already posted today.":"Could not publish your post"},{status:error.code==="23505"?429:503});
 return NextResponse.json({post:data},{status:201});
}
