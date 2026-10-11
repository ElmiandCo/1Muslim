import {NextResponse} from "next/server";
import {createClient} from "../../../utils/supabase/server";
export async function GET(){
 const db=await createClient();
 const {data,error}=await db.from("community_posts").select("id,author_id,body,created_at").order("created_at",{ascending:false}).limit(100);
 if(error)return NextResponse.json({error:"Community feed unavailable"},{status:503});
 const posts=data||[];
 const ids=[...new Set(posts.map(p=>p.author_id).filter((id):id is string=>typeof id==="string"))];
 const {data:profiles}=ids.length?await db.from("profiles").select("id,display_name,username").in("id",ids):{data:[]};
 const authors=new Map((profiles||[]).map(p=>[p.id,p]));
 return NextResponse.json({posts:posts.map(p=>({...p,author_name:authors.get(p.author_id)?.display_name||authors.get(p.author_id)?.username||"Community member",author_handle:authors.get(p.author_id)?.username?"@"+authors.get(p.author_id)?.username:"@member"}))});
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
 const profanity=/(^|[^a-z])f[\\W_]*u[\\W_]*c[\\W_]*k(?:[\\W_]*(?:s|e[\\W_]*d|i[\\W_]*n[\\W_]*g))?(?=$|[^a-z])/i.test(text.normalize("NFKC"));
 const {data,error}=await db.from("community_posts").insert({author_id:user.id,body:text}).select("id,author_id,body,created_at").single();
 if(error)return NextResponse.json({error:"Could not publish your post"},{status:503});
 if(profanity){
  // A submitted post is briefly accepted, then immediately removed server-side.
  const {error:removeError}=await db.from("community_posts").delete().eq("id",data.id).eq("author_id",user.id);
  if(removeError)return NextResponse.json({error:"Post flagged; removal pending moderator review",flagged:true},{status:503});
  // Persist a review record where the moderation table is provisioned.
  const {error:flagError}=await db.from("moderation_flags").insert({user_id:user.id,post_id:data.id,reason:"profanity",status:"pending"});
  if(flagError)console.error("Moderation flag could not be persisted",flagError.message);
  return NextResponse.json({post:data,flagged:true,removed:true,flagRecorded:!flagError},{status:201});
 }
 return NextResponse.json({post:data},{status:201});
}
