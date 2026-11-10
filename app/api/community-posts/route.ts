import {NextResponse} from "next/server";
import {createClient} from "../../../utils/supabase/server";
export async function GET(){
 const db=await createClient();
 const {data,error}=await db.from("ummah_feed_posts").select("id,author_id,body,created_at,post_theme").order("created_at",{ascending:false}).limit(100);
 if(error)return NextResponse.json({error:"Community feed unavailable"},{status:503});
 const posts=data||[];
 const ids=[...new Set(posts.map(p=>p.author_id).filter((id):id is string=>typeof id==="string"))];
 const {data:profiles}=ids.length?await db.from("profiles").select("id,display_name,username,shahada_verified_at").in("id",ids):{data:[]};
 const authors=new Map((profiles||[]).map(p=>[p.id,p]));
 // Historical uploads were saved in posts/post_media separately from the feed row.
 // Match only the same author, identical body and a tight creation-time window.
 // Ambiguous matches are intentionally omitted rather than attaching someone else's media.
 const authorIds=ids;
 const {data:mediaPosts}=authorIds.length?await db.from("posts").select("id,user_id,body,created_at").in("user_id",authorIds).order("created_at",{ascending:false}).limit(500):{data:[]};
 const candidates=new Map<string,typeof mediaPosts>();
 for(const p of mediaPosts||[]){const key=p.user_id+"|"+p.body;const arr=candidates.get(key)||[];arr.push(p);candidates.set(key,arr)}
 const links=new Map<string,string>();
 const claimed=new Set<string>();
 for(const p of posts){
  const options=(candidates.get(p.author_id+"|"+p.body)||[]).filter(m=>Math.abs(new Date(m.created_at).getTime()-new Date(p.created_at).getTime())<=5000&&!claimed.has(m.id));
  if(options.length===1){links.set(p.id,options[0].id);claimed.add(options[0].id)}
 }
 const mediaIds=[...links.values()];
 const {data:attachments}=mediaIds.length?await db.from("post_media").select("post_id,storage_path,mime_type,community_post_id").in("post_id",mediaIds):{data:[]};
 const {data:directAttachments}=posts.length?await db.from("post_media").select("post_id,storage_path,mime_type,community_post_id").in("community_post_id",posts.map(p=>p.id)):{data:[]};
 const directByFeed=new Map((directAttachments||[]).map(a=>[a.community_post_id,a]));
 const attachmentByPost=new Map((attachments||[]).map(a=>[a.post_id,a]));
 const output=await Promise.all(posts.map(async p=>{
  const attachment=directByFeed.get(p.id)||attachmentByPost.get(links.get(p.id)||"");
  let media_url:string|null=null;
  if(attachment?.storage_path){
   const {data:signed,error:signError}=await db.storage.from("community-media").createSignedUrl(attachment.storage_path,3600);
   if(!signError)media_url=signed?.signedUrl||null;
  }
  return {...p,shahada_verified:!!authors.get(p.author_id)?.shahada_verified_at,author_name:authors.get(p.author_id)?.display_name||authors.get(p.author_id)?.username||"Community member",author_handle:authors.get(p.author_id)?.username?"@"+authors.get(p.author_id)?.username:"@member",media_url,media_type:attachment?.mime_type||null};
 }));
 return NextResponse.json({posts:output});
}
export async function POST(request:Request){
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({error:"Sign in to post"},{status:401});
 const body=await request.json().catch(()=>({}));
 const validThemes=new Set(["emerald","sapphire","ruby","amethyst","titanium","obsidian"]);
  const requestedTheme=typeof body.post_theme==="string"?body.post_theme:typeof user.user_metadata?.theme==="string"?user.user_metadata.theme:"emerald";
  const post_theme=validThemes.has(requestedTheme)?requestedTheme:"emerald";
  const text=typeof body.text==="string"?body.text.trim():"";
 const media=body.media&&typeof body.media.storage_path==="string"?body.media:null;
 if(media&&(!media.storage_path.startsWith(user.id+"/")||!/^((image|video)\/)\S+$/.test(media.mime_type||"")))return NextResponse.json({error:"Invalid media attachment"},{status:400});
 if((text.length<1&&!media)||text.length>2000)return NextResponse.json({error:"Write a post between 1 and 2,000 characters"},{status:400});

 const profanity=/(^|[^a-z])f[\\W_]*u[\\W_]*c[\\W_]*k(?:[\\W_]*(?:s|e[\\W_]*d|i[\\W_]*n[\\W_]*g))?(?=$|[^a-z])/i.test(text.normalize("NFKC"));
 const {data,error}=await db.from("ummah_feed_posts").insert({author_id:user.id,body:text,post_theme}).select("id,author_id,body,created_at,post_theme").single();
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
 if(media){
  // Community media belongs directly to the Ummah post. Do not create a duplicate
  // legacy posts row: its trigger chain can fail and block an otherwise valid upload.
  const {error:attachError}=await db.from("post_media").insert({community_post_id:data.id,user_id:user.id,storage_path:media.storage_path,file_name:String(media.file_name||"upload").slice(0,255),mime_type:media.mime_type});
  if(attachError){await db.from("ummah_feed_posts").delete().eq("id",data.id).eq("author_id",user.id);console.error("community-media-attachment-insert",{code:attachError.code,message:attachError.message,details:attachError.details,hint:attachError.hint});return NextResponse.json({error:"Media attachment could not be published; your upload remains saved.",code:attachError.code||"MEDIA_ATTACHMENT_INSERT_FAILED"},{status:503})}
 }
 // The server awards XP only after the complete post (including media) is published.
 // RPC is idempotent by post ID and updates profiles.xp_total atomically.
 const {data:xpRows,error:xpError}=await db.rpc("claim_community_post_xp",{p_post_id:data.id});
 if(xpError)console.error("community-post-xp",xpError.code,xpError.message);
 const xp=Array.isArray(xpRows)?xpRows[0]:xpRows;
 return NextResponse.json({post:data,xp_awarded:xp?.awarded??0,xp_total:xp?.xp_total??null},{status:201});
}
