"use client";

import {useCallback,useEffect,useMemo,useRef,useState,type FormEvent} from "react";
import {createPortal} from "react-dom";
import Link from "next/link";
import {createClient} from "../../utils/supabase/client";
import styles from "./UmmahConversation.module.css";

export type UmmahConversationPost={
 id:string;author_id:string;body:string;created_at:string;
 author_name?:string;author_handle?:string;avatar_url?:string|null;
};
type Comment={
 id:string;post_id:string;author_id:string;parent_id:string|null;body:string;created_at:string;
 name:string;username:string|null;avatar_url:string|null;image_path:string|null;image_url:string|null;
 likes:number;liked:boolean;
};
type Profile={id:string;display_name:string|null;username:string|null;avatar_url:string|null;bio:string|null;xp_total:number|null};
const MAX_IMAGE=5*1024*1024;
const TYPES=["image/png","image/jpeg","image/webp"];

function avatar(name:string,url:string|null|undefined){
 return <span className={styles.avatar}>{url?<img src={url} alt="" loading="lazy"/>:<span aria-hidden="true">{name.slice(0,1).toUpperCase()||"✦"}</span>}</span>;
}

export default function UmmahConversation({post,onClose}:{post:UmmahConversationPost;onClose:()=>void}){
 const [comments,setComments]=useState<Comment[]>([]);
 const [loading,setLoading]=useState(true);
 const [notice,setNotice]=useState("");
 const [draft,setDraft]=useState("");
 const [file,setFile]=useState<File|null>(null);
 const [preview,setPreview]=useState("");
 const [busy,setBusy]=useState(false);
 const [replyTo,setReplyTo]=useState<string|null>(null);
 const [collapsed,setCollapsed]=useState<Record<string,boolean>>({});
 const [stack,setStack]=useState<string[]>([]);
 const [profileId,setProfileId]=useState<string|null>(null);
 const [profile,setProfile]=useState<Profile|null>(null);
 const [likes,setLikes]=useState({count:0,liked:false});
 const [shares,setShares]=useState(0);
 const fileInput=useRef<HTMLInputElement>(null);
 const refreshTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const firstButton=useRef<HTMLButtonElement>(null);

 const refresh=useCallback(async()=>{
  try{
   const response=await fetch("/api/ummah-comments?postId="+encodeURIComponent(post.id),{cache:"no-store"});
   if(!response.ok)throw Error("Comments unavailable");
   const data=await response.json();
   setComments(data.comments||[]);
  }catch{setNotice("Comments could not be refreshed. Try again shortly.")}
  finally{setLoading(false)}
 },[post.id]);
 const refreshCounts=useCallback(async()=>{
  const [likeResult,shareResult]=await Promise.allSettled([
   fetch("/api/ummah-post-likes?postId="+encodeURIComponent(post.id),{cache:"no-store"}).then(r=>r.ok?r.json():null),
   fetch("/api/ummah-post-shares?postId="+encodeURIComponent(post.id),{cache:"no-store"}).then(r=>r.ok?r.json():null)
  ]);
  if(likeResult.status==="fulfilled"&&likeResult.value)setLikes({count:likeResult.value.count||0,liked:!!likeResult.value.liked});
  if(shareResult.status==="fulfilled"&&shareResult.value)setShares(shareResult.value.count||0);
 },[post.id]);

 useEffect(()=>{
  void refresh();void refreshCounts();
  const previous=document.body.style.overflow;
  document.body.style.overflow="hidden";
  firstButton.current?.focus();
  const db=createClient();
  const queue=()=>{if(refreshTimer.current)clearTimeout(refreshTimer.current);refreshTimer.current=setTimeout(()=>{void refresh();void refreshCounts()},300)};
  const channel=db.channel("ummah-posts3-"+post.id)
   .on("postgres_changes",{event:"*",schema:"public",table:"ummah_post_comments",filter:"post_id=eq."+post.id},queue)
   .on("postgres_changes",{event:"*",schema:"public",table:"ummah_comment_likes"},queue)
   .on("postgres_changes",{event:"*",schema:"public",table:"ummah_post_likes",filter:"post_id=eq."+post.id},queue)
   .on("postgres_changes",{event:"*",schema:"public",table:"ummah_post_shares",filter:"post_id=eq."+post.id},queue)
   .subscribe();
  const fallback=setInterval(queue,30000);
  return()=>{document.body.style.overflow=previous;clearInterval(fallback);if(refreshTimer.current)clearTimeout(refreshTimer.current);void db.removeChannel(channel)};
 },[post.id,refresh,refreshCounts]);

 useEffect(()=>{if(!file){setPreview("");return}const url=URL.createObjectURL(file);setPreview(url);return()=>URL.revokeObjectURL(url)},[file]);
 useEffect(()=>{if(!profileId){setProfile(null);return}let live=true;const db=createClient();void db.from("profiles").select("id,display_name,username,avatar_url,bio,xp_total").eq("id",profileId).maybeSingle().then(({data})=>{if(live)setProfile(data)});return()=>{live=false}},[profileId]);

 const byId=useMemo(()=>new Map(comments.map(c=>[c.id,c])),[comments]);
 const children=useMemo(()=>{
  const grouped=new Map<string,Comment[]>();
  for(const c of comments){const key=c.parent_id&&byId.has(c.parent_id)?c.parent_id:"root";grouped.set(key,[...(grouped.get(key)||[]),c])}
  return grouped;
 },[comments,byId]);
 const depthOf=useCallback((id:string)=>{
  let depth=1,at=byId.get(id),visited=new Set<string>([id]);
  while(at?.parent_id&&byId.has(at.parent_id)&&depth<5&&!visited.has(at.parent_id)){
   visited.add(at.parent_id);at=byId.get(at.parent_id);depth++;
  }
  return depth;
 },[byId]);
 const focus=stack.length?byId.get(stack[stack.length-1]):null;
 const replyTarget=replyTo?byId.get(replyTo):null;
 const send=async(event:FormEvent)=>{
  event.preventDefault();if(busy||(!draft.trim()&&!file))return;
  setBusy(true);setNotice("");let path:string|null=null;
  try{
   const db=createClient();
   if(file){
    const {data:{user}}=await db.auth.getUser();
    if(!user)throw Error("Sign in to attach an image.");
    if(!TYPES.includes(file.type)||file.size>MAX_IMAGE)throw Error("Choose a PNG, JPEG or WebP image up to 5 MB.");
    const ext=file.type==="image/png"?"png":file.type==="image/webp"?"webp":"jpg";
    path=user.id+"/ummah-comments/"+crypto.randomUUID()+"."+ext;
    const {error}=await db.storage.from("community-media").upload(path,file,{contentType:file.type,upsert:false});
    if(error)throw Error("Image upload failed.");
   }
   const response=await fetch("/api/ummah-comments",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({postId:post.id,parentId:replyTo,body:draft.trim(),imagePath:path})
   });
   const result=await response.json();
   if(!response.ok)throw Error(result.error||"Unable to publish comment.");
   setComments(old=>[...old,result.comment]);setDraft("");setFile(null);setReplyTo(null);
   if(replyTo)setCollapsed(old=>({...old,[replyTo]:false}));
   void refresh();
  }catch(error){
   if(path){const db=createClient();void db.storage.from("community-media").remove([path])}
   setNotice(error instanceof Error?error.message:"Unable to publish comment.");
  }finally{setBusy(false)}
 };
 const toggleCommentLike=async(id:string)=>{
  const current=byId.get(id);if(!current)return;
  setComments(rows=>rows.map(c=>c.id===id?{...c,liked:!c.liked,likes:Math.max(0,c.likes+(c.liked?-1:1))}:c));
  try{
   const response=await fetch("/api/ummah-comment-likes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({commentId:id})});
   if(!response.ok)throw Error("Sign in to like comments.");
  }catch{setComments(rows=>rows.map(c=>c.id===id?{...c,liked:current.liked,likes:current.likes}:c));setNotice("Could not save comment like.")}
 };
 const togglePostLike=async()=>{
  const was=likes;setLikes({liked:!was.liked,count:Math.max(0,was.count+(was.liked?-1:1))});
  try{
   const response=await fetch("/api/ummah-post-likes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({postId:post.id})});
   if(!response.ok)throw Error("Sign in to like posts.");
   const result=await response.json();if(typeof result.count==="number")setLikes({count:result.count,liked:result.liked});
  }catch{setLikes(was);setNotice("Could not save post like.")}
 };
 const share=async()=>{
  const url=location.origin+"/community#post-"+post.id;
  try{
   if(navigator.share)await navigator.share({title:"1Muslim community post",text:post.body.slice(0,140),url});
   else{await navigator.clipboard.writeText(url);setNotice("Post link copied.");}
   // Anonymous sharing remains possible; only authenticated events are counted.
   const db=createClient();const {data:{user}}=await db.auth.getUser();
   if(user){const response=await fetch("/api/ummah-post-shares",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({postId:post.id})});if(response.ok){const result=await response.json();if(typeof result.count==="number")setShares(result.count)}}
  }catch{/* Native share cancellation must not create a share event. */}
 };
 const back=()=>{if(profileId){setProfileId(null);return}if(stack.length){setStack(old=>old.slice(0,-1));return}onClose()};
 useEffect(()=>{
  const key=(event:KeyboardEvent)=>{if(event.key==="Escape"){event.preventDefault();back()}};
  document.addEventListener("keydown",key);return()=>document.removeEventListener("keydown",key);
 });
 const renderComment=(c:Comment,level:number):React.ReactNode=>{
  const replies=children.get(c.id)||[];
  const closed=collapsed[c.id]??level>1;
  return <div key={c.id} className={styles.commentWrap} style={{["--depth" as string]:Math.min(level-1,2)}}>
   <article className={styles.comment}>
    <button type="button" className={styles.avatarButton} aria-label={"View "+c.name+"'s profile"} onClick={()=>setProfileId(c.author_id)}>{avatar(c.name,c.avatar_url)}</button>
    <div className={styles.commentBody}>
     <div className={styles.commentHeader}><button type="button" onClick={()=>setProfileId(c.author_id)}>{c.name}</button><time>{new Date(c.created_at).toLocaleDateString()}</time></div>
     <button type="button" className={styles.commentText} onClick={()=>setStack(old=>[...old,c.id])} aria-label={"Open thread by "+c.name}>{c.body||"View image and replies"}</button>
     {c.image_url&&<button type="button" className={styles.imageButton} onClick={()=>setStack(old=>[...old,c.id])} aria-label="Open image comment"><img src={c.image_url} alt={"Image shared by "+c.name} loading="lazy"/></button>}
     <div className={styles.commentActions}>
      {level<3&&<button type="button" onClick={()=>setReplyTo(c.id)}>↩ Reply</button>}
      <button type="button" aria-pressed={c.liked} onClick={()=>void toggleCommentLike(c.id)}>{c.liked?"♥":"♡"} {c.likes}</button>
      {replies.length>0&&<button type="button" aria-expanded={!closed} onClick={()=>setCollapsed(old=>({...old,[c.id]:!closed}))}>{closed?"▸":"▾"} {replies.length} {replies.length===1?"reply":"replies"}</button>}
     </div>
    </div>
   </article>
   {!closed&&replies.map(child=>renderComment(child,level+1))}
  </div>;
 };
 const content=focus?[focus]:children.get("root")||[];
 const currentLevel=focus?depthOf(focus.id):1;
 const title=focus?"Thread":"Conversation";

 if(typeof document==="undefined")return null;
 return createPortal(<div className={styles.backdrop} role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}>
  <section className={styles.viewer} role="dialog" aria-modal="true" aria-label={"Post "+title.toLowerCase()}>
   <header className={styles.topbar}>
    <button ref={firstButton} type="button" className={styles.back} onClick={back} aria-label={stack.length?"Back to previous thread":"Close post"}>{stack.length?"←":"✕"}</button>
    <strong>{title}</strong><span className={styles.topCounter}>{comments.length} comments</span>
   </header>
   <div className={styles.scroller}>
    {!focus&&<article className={styles.post}>
     <div className={styles.postIdentity}>
      <button type="button" onClick={()=>setProfileId(post.author_id)}>{avatar(post.author_name||"Member",post.avatar_url)}</button>
      <div><button type="button" onClick={()=>setProfileId(post.author_id)}><strong>{post.author_name||"Community member"}</strong></button><small>{post.author_handle||"@member"} · {new Date(post.created_at).toLocaleDateString()}</small></div>
     </div>
     <p>{post.body}</p>
     <div className={styles.engagement}>
      <button type="button" aria-pressed={likes.liked} onClick={()=>void togglePostLike()}>{likes.liked?"♥":"♡"} {likes.count} Likes</button>
      <span>💬 {comments.length}</span>
      <button type="button" onClick={()=>void share()}>↗ {shares} Shares</button>
     </div>
    </article>}
    {focus&&<div className={styles.breadcrumb}><button type="button" onClick={()=>setStack([])}>All comments</button><span> / </span><span>Thread by {focus.name}</span></div>}
    <div className={styles.thread} aria-live="polite">
     {loading?<p className={styles.empty}>Loading comments…</p>:content.length?content.map(c=>renderComment(c,focus?currentLevel:1)):<p className={styles.empty}>Be the first to comment ✨</p>}
    </div>
   </div>
   <form className={styles.composer} onSubmit={send}>
    {replyTarget&&<div className={styles.replyIndicator}>Replying to {replyTarget.name} <button type="button" onClick={()=>setReplyTo(null)} aria-label="Cancel reply">✕</button></div>}
    {preview&&<div className={styles.preview}><img src={preview} alt="Image ready to attach"/><button type="button" onClick={()=>setFile(null)} aria-label="Remove attachment">✕</button></div>}
    <div className={styles.composeRow}>
     <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e=>{const next=e.target.files?.[0]||null;e.currentTarget.value="";if(next&&(!TYPES.includes(next.type)||next.size>MAX_IMAGE)){setNotice("Only PNG, JPEG or WebP up to 5 MB.");return}setFile(next)}}/>
     <button type="button" className={styles.attach} onClick={()=>fileInput.current?.click()} aria-label="Attach an image">＋</button>
     <textarea aria-label="Write a comment" value={draft} onChange={e=>setDraft(e.target.value)} placeholder={replyTarget?"Write a reply…":"Add to the conversation…"} maxLength={1500} rows={1}/>
     <button type="submit" disabled={busy||(!draft.trim()&&!file)}>{busy?"Sending…":"Send"}</button>
    </div>
    {notice&&<p role="status" className={styles.notice}>{notice}</p>}
   </form>
  </section>
  {profileId&&<div className={styles.profileOverlay} role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setProfileId(null)}}>
   <section role="dialog" aria-modal="true" aria-label="Member profile" className={styles.profileModal}>
    <button type="button" className={styles.profileClose} onClick={()=>setProfileId(null)} aria-label="Close profile">✕</button>
    {avatar(profile?.display_name||profile?.username||"Member",profile?.avatar_url)}
    <strong>{profile?.display_name||profile?.username||"Community member"}</strong>
    <small>{profile?.username?"@"+profile.username:"1Muslim member"}</small>
    {profile?.bio&&<p>{profile.bio}</p>}
    {profile?.xp_total!=null&&<small>✦ {profile.xp_total.toLocaleString()} XP</small>}
    <Link href={"/profile/"+profileId}>Open full profile ↗</Link>
   </section>
  </div>}
 </div>,document.body);
}
