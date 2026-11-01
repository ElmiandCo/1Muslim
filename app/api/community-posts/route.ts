import {NextResponse} from "next/server";
import {createClient} from "../../../utils/supabase/server";
export async function GET(){
 const db=await createClient();
 const {data,error}=await db.from("ummah_feed_posts").select("id,author_id,body,created_at").order("created_at",{ascending:false}).limit(100);
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
 const media=body.media&&typeof body.media.storage_path==="string"?body.media:null;
 if(media&&(!media.storage_path.startsWith(user.id+"/")||!/^((image|video)\/)\S+$/.test(media.mime_type||"")))return NextResponse.json({error:"Invalid media attachment"},{status:400});
 if((text.length<1&&!media)||text.length>2000)return NextResponse.json({error:"Write a post between 1 and 2,000 characters"},{status:400});
 if(text.startsWith("✦ DAILY UMMAH ✦")){
  const now=new Date();const start=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate())).toISOString();
  const {data:today,error:checkError}=await db.from("ummah_feed_posts").select("id,body").eq("author_id",user.id).gte("created_at",start);
  if(checkError){console.error("daily-post-check",checkError.code,checkError.message);return NextResponse.json({error:"Daily Post check failed. Please try again shortly.",code:"DAILY_CHECK_FAILED"},{status:503})}
  if((today||[]).some(p=>p.body?.startsWith("✦ DAILY UMMAH ✦")))return NextResponse.json({error:"You already shared your Daily Ummah Post today. Come back tomorrow for your next daily post.",code:"DAILY_ALREADY_POSTED"},{status:409});
 }
 const profanity=/(^|[^a-z])f[\\W_]*u[\\W_]*c[\\W_]*k(?:[\\W_]*(?:s|e[\\W_]*d|i[\\W_]*n[\\W_]*g))?(?=$|[^a-z])/i.test(text.normalize("NFKC"));
 // Uploaded media uses one canonical posts row, shared by Community, For You and All Videos.
 // The post_media row is attachment metadata, not a second content post.
 if(media&&!profanity){
  const {data:post,error:postError}=await db.from("posts").insert({user_id:user.id,body:text||"Shared a video"}).select("id").single();
  if(postError)return NextResponse.json({error:"Media post could not be created; your uploaded file remains saved.",code:postError.code},{status:503});
  const {error:attachError}=await db.from("post_media").insert({post_id:post.id,user_id:user.id,storage_path:media.storage_path,file_name:String(media.file_name||"upload").slice(0,255),mime_type:media.mime_type});
  if(attachError){await db.from("posts").delete().eq("id",post.id).eq("user_id",user.id);return NextResponse.json({error:"Media attachment could not be published; your upload remains saved.",code:attachError.code},{status:503})}
  return NextResponse.json({post,source:"posts"},{status:201});
 }
 const {data,error}=await db.from("ummah_feed_posts").insert({author_id:user.id,body:text}).select("id,author_id,body,created_at").single();
 if(error){console.error("community-post-insert",error.code,error.message);const permission=error.code==="42501";return NextResponse.json({error:permission?"Posting is blocked by database permissions. Please contact 1Muslim support.":"Publishing failed on the server. Your draft is safe; please try again.",code:error.code||"POST_INSERT_FAILED"},{status:permission?403:503})}
 if(profanity){
  // A submitted post is briefly accepted, then immediately removed server-side.
  const {error:removeError}=await db.from("ummah_feed_posts").delete().eq("id",data.id).eq("author_id",user.id);
  if(removeError)return NextResponse.json({error:"Post flagged; removal pending moderator review",flagged:true},{status:503});
  // Persist a review record where the moderation table is provisioned.
  const {error:flagError}=await db.from("moderation_flags").insert({user_id:user.id,post_id:data.id,reason:"profanity",status:"pending"});
  if(flagError)console.error("Moderation flag could not be persisted",flagError.message);
  return NextResponse.json({post:data,flagged:true,removed:true,flagRecorded:!flagError},{status:201});
 }
 return NextResponse.json({post:data},{status:201});
}
