import {NextResponse} from "next/server";
import {createClient} from "../../../utils/supabase/server";
export async function GET(request:Request){
 const url=new URL(request.url);
 const limitInput=Number(url.searchParams.get("limit")||100);
 const offsetInput=Number(url.searchParams.get("offset")||0);
 const limit=Number.isInteger(limitInput)?Math.max(1,Math.min(100,limitInput)):100;
 const offset=Number.isInteger(offsetInput)?Math.max(0,Math.min(1000,offsetInput)):0;
 const db=await createClient();
 // The user lookup and initial post read are independent. The first page is intentionally
 // small on Discover: don't block the first screen on 100 posts and their video metadata.
 const [{data,error},{data:auth}]=await Promise.all([
  db.from("ummah_feed_posts").select("id,author_id,body,created_at,post_theme").order("created_at",{ascending:false}).range(offset,offset+limit-1),
  db.auth.getUser()
 ]);
 if(error)return NextResponse.json({error:"Community feed unavailable"},{status:503});
 const posts=data||[];
 const ids=[...new Set(posts.map(p=>p.author_id).filter((id):id is string=>typeof id==="string"))];
 // Both queries are independent. Preserve the safe legacy lookup for old uploads.
 const [{data:profiles},{data:mediaPosts}]=await Promise.all([
  ids.length?db.from("profiles").select("id,display_name,username,avatar_url,avatar_config,shahada_verified_at").in("id",ids):Promise.resolve({data:[]}),
  ids.length?db.from("posts").select("id,user_id,body,created_at").in("user_id",ids).order("created_at",{ascending:false}).limit(500):Promise.resolve({data:[]})
 ]);
 const authors=new Map((profiles||[]).map(p=>[p.id,p]));
 const candidates=new Map<string,Array<{id:string;user_id:string;body:string;created_at:string}>>();
 for(const p of mediaPosts||[]){const key=p.user_id+"|"+p.body;const arr=candidates.get(key)||[];arr.push(p);candidates.set(key,arr)}
 const links=new Map<string,string>(),claimed=new Set<string>();
 for(const p of posts){
  const matches=(candidates.get(p.author_id+"|"+p.body)||[]).filter(m=>Math.abs(Date.parse(m.created_at)-Date.parse(p.created_at))<=5000&&!claimed.has(m.id));
  if(matches.length===1){links.set(p.id,matches[0].id);claimed.add(matches[0].id)}
 }
 const mediaIds=[...links.values()];
 const [{data:attachments},{data:directAttachments}]=await Promise.all([
  mediaIds.length?db.from("post_media").select("post_id,storage_path,mime_type,community_post_id").in("post_id",mediaIds):Promise.resolve({data:[]}),
  posts.length?db.from("post_media").select("post_id,storage_path,mime_type,community_post_id").in("community_post_id",posts.map(p=>p.id)):Promise.resolve({data:[]})
 ]);
 const directByFeed=new Map((directAttachments||[]).map(a=>[a.community_post_id,a]));
 const attachmentByPost=new Map((attachments||[]).map(a=>[a.post_id,a]));
 // community-media is a PUBLIC Supabase Storage bucket. No per-video signing request
 // is needed: public URLs resolve through the CDN. The old path did one signing
 // network request per attachment, delaying the entire feed response.
 const bucket=db.storage.from("community-media");
 const output=posts.map(p=>{
  const attachment=directByFeed.get(p.id)||attachmentByPost.get(links.get(p.id)||"");
  const media_url=attachment?.storage_path?bucket.getPublicUrl(attachment.storage_path).data.publicUrl:null;
  const profile=authors.get(p.author_id);
  const config=profile?.avatar_config as Record<string,unknown>|null;
  const chosen=[config?.adminAvatarUrl,config?.customAvatarUrl,config?.selectedAvatarUrl,config?.avatarUrl].find(v=>typeof v==="string"&&/^(https:\/\/|\/assets\/avatars\/)/.test(v));
  return {...p,shahada_verified:!!profile?.shahada_verified_at,
   author_name:profile?.display_name||profile?.username||"Community member",
   author_handle:profile?.username?"@"+profile.username:"@member",
   author_avatar_url:chosen||profile?.avatar_url||null,
   media_url,media_type:attachment?.mime_type||null};
 });
 return NextResponse.json({posts:output,viewer_id:auth.user?.id||null,has_more:posts.length===limit},
  {headers:{"cache-control":"private, max-age=0, no-store"}});
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

export async function PATCH(request:Request){
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({error:"Sign in to edit posts"},{status:401});
 const input=await request.json().catch(()=>({}));const id=typeof input.id==="string"?input.id:"";const body=typeof input.text==="string"?input.text.trim():"";
 if(!/^[0-9a-f-]{36}$/i.test(id)||!body||body.length>2000)return NextResponse.json({error:"Invalid post or text"},{status:400});
 const {data,error}=await db.from("ummah_feed_posts").update({body}).eq("id",id).eq("author_id",user.id).select("id").maybeSingle();
 if(error)return NextResponse.json({error:"Could not update post"},{status:503});
 if(!data)return NextResponse.json({error:"Post not found or not owned by you"},{status:403});
 return NextResponse.json({ok:true});
}
export async function DELETE(request:Request){
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({error:"Sign in to delete posts"},{status:401});
 const input=await request.json().catch(()=>({}));const id=typeof input.id==="string"?input.id:"";
 if(!/^[0-9a-f-]{36}$/i.test(id))return NextResponse.json({error:"Invalid post"},{status:400});
 const {data:owned,error:lookupError}=await db.from("ummah_feed_posts").select("id").eq("id",id).eq("author_id",user.id).maybeSingle();
 if(lookupError)return NextResponse.json({error:"Could not verify ownership"},{status:503});
 if(!owned)return NextResponse.json({error:"Post not found or not owned by you"},{status:403});
 const {error}=await db.from("ummah_feed_posts").delete().eq("id",id).eq("author_id",user.id);
 if(error)return NextResponse.json({error:"Could not delete post"},{status:503});
 return NextResponse.json({ok:true});
}
