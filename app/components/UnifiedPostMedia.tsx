"use client";
import OneMuslimVideo from "./OneMuslimVideo";
import {EmoTextComposer,EmoTextContent} from "./EmoTexts";
import Link from "next/link";
import {createPortal} from "react-dom";
import {createClient} from "../../utils/supabase/client";
import {useRef} from "react";
import {useCallback,useEffect,useMemo,useState,type FormEvent} from "react";

type Comment={id:string;body:string;name:string;created_at:string;author_id:string;parent_id:string|null;avatar_url?:string|null;image_url?:string|null;likes:number;liked:boolean;dislikes:number;disliked:boolean};
type Props={postId:string;mediaUrl?:string|null;mediaType?:string|null;youtubeId?:string|null;contentKind?:"post"|"magazine";showVideo?:boolean;focusCommentId?:string|null;sheetMode?:boolean;nightMode?:boolean;immersiveMode?:boolean};
const relative=(date:string)=>{const seconds=Math.max(0,Math.floor((Date.now()-new Date(date).getTime())/1000));if(seconds<60)return "now";if(seconds<3600)return Math.floor(seconds/60)+"m";if(seconds<86400)return Math.floor(seconds/3600)+"h";if(seconds<604800)return Math.floor(seconds/86400)+"d";return new Date(date).toLocaleDateString(undefined,{month:"short",day:"numeric"})};
function Icon({name}:{name:"heart"|"comment"|"save"|"share"|"reply"|"dislike"}){const paths={heart:<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>,comment:<path d="M20 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-4-.9L3 21l1.9-4.5a8.5 8.5 0 1 1 15.1-5Z"/>,save:<path d="M6 3h12v18l-6-4-6 4V3Z"/>,share:<path d="M12 16V3m0 0L7 8m5-5 5 5M4 14v6h16v-6"/>,reply:<path d="m9 17-5-5 5-5M4 12h10a6 6 0 0 1 6 6"/>,dislike:<path d="M17 14V2H6a3 3 0 0 0-2.8 2L1 11a3 3 0 0 0 2.8 4H9l-1 6 2 1 7-8Zm0-12h5v12h-5"/>};return <svg width="19" height="19" style={{width:19,height:19,minWidth:19,minHeight:19,maxWidth:19,maxHeight:19,display:"block",flexShrink:0}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>}
export default function UnifiedPostMedia({postId,mediaUrl,mediaType,youtubeId,contentKind="post",showVideo=true,focusCommentId=null,sheetMode=false,nightMode=false,immersiveMode=false}:Props){
 const articleMode=contentKind==="magazine";const commentsEndpoint=articleMode?"/api/qibla-social/comments":"/api/ummah-comments";const engagementEndpoint=articleMode?"/api/qibla-social/engagement":"/api/ummah-post-engagement";const reactionEndpoint=articleMode?"/api/qibla-social/comment-reactions":"";const entityPayload=articleMode?{articleId:postId}:{postId};
 const pendingReaction=useRef(new Set<"liked"|"saved">());
 const pendingCommentReaction=useRef(new Set<string>());
 const requestEpoch=useRef(0);
 const openedComment=useRef<string|null>(null);
 const imageInput=useRef<HTMLInputElement>(null);
 const commentTrigger=useRef<HTMLButtonElement>(null);
 const gestureStart=useRef<number|null>(null);
 const [sheetOpen,setSheetOpen]=useState(false),[sheetExpanded,setSheetExpanded]=useState(false),[keyboardInset,setKeyboardInset]=useState(0),[composerFocused,setComposerFocused]=useState(false);
 const closeSheet=()=>{
  if(document.activeElement instanceof HTMLElement&&document.activeElement.closest(".ummahCommentPortal"))document.activeElement.blur();
  setSheetOpen(false);setSheetExpanded(false);setComposerFocused(false);
  requestAnimationFrame(()=>commentTrigger.current?.focus());
 };
 const focusCommentComposer=()=>{
  // Reply must focus the real rich-text editor (contenteditable, not a textarea).
  requestAnimationFrame(()=>{
   const root=document.querySelector(".ummahCommentPortal")||document.querySelector(".immersiveSheet")||document.querySelector(".unifiedPostMedia");
   root?.querySelector<HTMLElement>('[contenteditable="true"]')?.focus();
  });
 };
 useEffect(()=>{
  if(!sheetMode||!sheetOpen)return;
  // Freeze the underlying feed while the real visual viewport is resized by
  // the iOS keyboard. Restore the exact scroll position on close.
  const body=document.body,scrollY=window.scrollY;
  const old={position:body.style.position,top:body.style.top,left:body.style.left,right:body.style.right,width:body.style.width,overflow:body.style.overflow};
  body.style.position="fixed";body.style.top=-scrollY+"px";body.style.left="0";body.style.right="0";body.style.width="100%";body.style.overflow="hidden";
  const viewport=window.visualViewport;
  const update=()=>setKeyboardInset(viewport?Math.max(0,Math.round(window.innerHeight-viewport.offsetTop-viewport.height)):0);
  const key=(e:KeyboardEvent)=>{if(e.key==="Escape"){e.preventDefault();closeSheet()}};
  update();viewport?.addEventListener("resize",update);viewport?.addEventListener("scroll",update);
  window.addEventListener("keydown",key);
  return()=>{
   Object.assign(body.style,old);
   viewport?.removeEventListener("resize",update);viewport?.removeEventListener("scroll",update);
   window.removeEventListener("keydown",key);window.scrollTo(0,scrollY);
  };
 },[sheetOpen,sheetMode]);const [image,setImage]=useState<File|null>(null),[imagePreview,setImagePreview]=useState<string|null>(null),[engagement,setEngagement]=useState({likes:0,saves:0,shares:0,comments:0}),[comments,setComments]=useState<Comment[]>([]),[expanded,setExpanded]=useState(false),[draft,setDraft]=useState(""),[replyTo,setReplyTo]=useState<Comment|null>(null),[repliesOpen,setRepliesOpen]=useState<Record<string,boolean>>({}),[busy,setBusy]=useState(false),[error,setError]=useState(""),[liked,setLiked]=useState(false),[saved,setSaved]=useState(false);
 const load=useCallback(async()=>{try{const r=await fetch(commentsEndpoint+"?"+(articleMode?"articleId=":"postId=")+encodeURIComponent(postId),{cache:"no-store"});if(r.ok){const j=await r.json();setComments(j.comments||[])}}catch{}},[postId,commentsEndpoint,articleMode]);
 useEffect(()=>{void load();const timer=setInterval(()=>void load(),15000);return()=>clearInterval(timer)},[load]);
 
 const loadEngagement=useCallback(async()=>{
 const version=requestEpoch.current;
 try{
  const r=await fetch(engagementEndpoint+"?"+(articleMode?"articleId=":"postId=")+encodeURIComponent(postId),{cache:"no-store"});
  if(!r.ok)return;
  const j=await r.json();
  // Do not replace a just-tapped optimistic heart with an older in-flight GET.
  if(version!==requestEpoch.current)return;
  setEngagement(current=>({
   likes:pendingReaction.current.has("liked")?current.likes:Number(j.likes)||0,
   saves:pendingReaction.current.has("saved")?current.saves:Number(j.saves)||0,
   shares:Number(j.shares)||0,comments:Number(j.comments)||0
  }));
  if(!pendingReaction.current.has("liked"))setLiked(!!j.liked);
  if(!pendingReaction.current.has("saved"))setSaved(!!j.saved);
 }catch{}
},[postId,engagementEndpoint,articleMode]);
 useEffect(()=>{void loadEngagement()},[loadEngagement]);
 useEffect(()=>{if(articleMode)return;const refresh=(event:Event)=>{if((event as CustomEvent<{postId:string}>).detail?.postId===postId)void loadEngagement()};window.addEventListener("ummah-post-engagement-changed",refresh);return()=>window.removeEventListener("ummah-post-engagement-changed",refresh)},[articleMode,postId,loadEngagement]);
 useEffect(()=>{if(!image){setImagePreview(null);return}const url=URL.createObjectURL(image);setImagePreview(url);return()=>URL.revokeObjectURL(url)},[image]);
 useEffect(()=>{
  if(!focusCommentId||openedComment.current===focusCommentId)return;
  const target=comments.find(c=>c.id===focusCommentId);
  if(!target)return;
  setExpanded(true);
  if(target.parent_id)setRepliesOpen(old=>({...old,[target.parent_id!]:true}));
  const timer=window.setTimeout(()=>{
    document.getElementById("1muslim-comment-"+focusCommentId)?.scrollIntoView({behavior:"smooth",block:"center"});
    openedComment.current=focusCommentId;
  },350);
  return()=>window.clearTimeout(timer);
 },[focusCommentId,comments]);
 const roots=useMemo(()=>comments.filter(c=>!c.parent_id),[comments]);
 const children=useMemo(()=>{const map=new Map<string,Comment[]>();for(const c of comments){if(c.parent_id){const a=map.get(c.parent_id)||[];a.push(c);map.set(c.parent_id,a)}}return map},[comments]);
 const toggle=async(key:"liked"|"saved")=>{
 if(pendingReaction.current.has(key))return;
 const before=key==="liked"?liked:saved;
 pendingReaction.current.add(key);
 requestEpoch.current++;
 setError("");
 if(key==="liked")setLiked(!before);else setSaved(!before);
 setEngagement(current=>({...current,[key==="liked"?"likes":"saves"]:Math.max(0,current[key==="liked"?"likes":"saves"]+(before?-1:1))}));
 try{
  const response=await fetch(engagementEndpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...entityPayload,kind:key==="liked"?"like":"save"})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(response.status===401?"Sign in to like and save posts.":data.error||"Could not save reaction");
  // Reconcile the server's answer, including a like changed in another tab.
  const confirmed=typeof data.active==="boolean"?data.active:!before;
  if(key==="liked")setLiked(confirmed);else setSaved(confirmed);
  setEngagement(current=>({...current,[key==="liked"?"likes":"saves"]:Math.max(0,current[key==="liked"?"likes":"saves"]+(confirmed===!before?0:confirmed?1:-1))}));
  if(!articleMode)window.dispatchEvent(new CustomEvent("ummah-post-engagement-changed",{detail:{postId}}));
 }catch(error){
  if(key==="liked")setLiked(before);else setSaved(before);
  setEngagement(current=>({...current,[key==="liked"?"likes":"saves"]:Math.max(0,current[key==="liked"?"likes":"saves"]+(before?1:-1))}));
  setError(error instanceof Error?error.message:"Could not save reaction.");
 }finally{
  pendingReaction.current.delete(key);
  requestEpoch.current++;
  void loadEngagement();
 }
};
 const dislikeComment=async(c:Comment)=>{setError("");try{const r=await fetch(articleMode?reactionEndpoint:"/api/ummah-comment-dislikes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(articleMode?{commentId:c.id,kind:"dislike"}:{commentId:c.id})});const j=await r.json();if(!r.ok)throw Error(j.error||"Could not dislike comment");setComments(old=>old.map(x=>x.id===c.id?{...x,disliked:j.disliked,dislikes:Math.max(0,(x.dislikes||0)+(j.disliked?1:-1))}:x))}catch(e){setError(e instanceof Error?e.message:"Unable to update dislike")}};
 const likeComment=async(c:Comment)=>{
 const key=c.id+":like";if(pendingCommentReaction.current.has(key))return;
 pendingCommentReaction.current.add(key);setError("");
 const before=c.liked;
 setComments(old=>old.map(x=>x.id===c.id?{...x,liked:!before,likes:Math.max(0,x.likes+(before?-1:1))}:x));
 try{
  const r=await fetch(articleMode?reactionEndpoint:"/api/ummah-comment-likes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(articleMode?{commentId:c.id,kind:"like"}:{commentId:c.id})});
  const data=await r.json();
  if(!r.ok)throw Error(data.error||"Could not like comment");
  if(typeof data.liked==="boolean"&&data.liked!==!before){
   setComments(old=>old.map(x=>x.id===c.id?{...x,liked:data.liked,likes:Math.max(0,x.likes+(data.liked?1:-1))}:x));
  }
 }catch(e){
  setComments(old=>old.map(x=>x.id===c.id?{...x,liked:before,likes:Math.max(0,x.likes+(before?1:-1))}:x));
  setError(e instanceof Error?e.message:"Unable to update like");
 }finally{pendingCommentReaction.current.delete(key)}
};
 async function send(e:FormEvent){e.preventDefault();if((!draft.trim()&&!image)||busy)return;setBusy(true);setError("");let imagePath="";try{if(image){const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user)throw Error("Sign in to attach an image");const ext=image.type==="image/png"?"png":image.type==="image/webp"?"webp":image.type==="image/gif"?"gif":"jpg";imagePath=user.id+"/comments/"+crypto.randomUUID()+"."+ext;const {error:uploadError}=await db.storage.from("community-media").upload(imagePath,image,{contentType:image.type,upsert:false});if(uploadError)throw Error("Image upload failed: "+uploadError.message)}
 const r=await fetch(commentsEndpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...entityPayload,body:draft.trim(),parentId:replyTo?(replyTo.parent_id||replyTo.id):null,imagePath})});const j=await r.json();if(!r.ok)throw Error(j.error||"Comment failed");if(replyTo){setRepliesOpen(old=>({...old,[replyTo.parent_id||replyTo.id]:true}));setExpanded(true)}setReplyTo(null);setDraft("");setImage(null);await load();await loadEngagement()}catch(e){setError(e instanceof Error?e.message:"Comment failed")}finally{setBusy(false)}}
 async function share(){const url=location.origin+(articleMode?"/qibla/newsroom/":"/posts/story/")+encodeURIComponent(postId);try{if(navigator.share)await navigator.share({url});else await navigator.clipboard.writeText(url);const r=await fetch("/api/ummah-post-engagement",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...entityPayload,kind:"share"})});if(r.ok)await loadEngagement()}catch{}}
 const renderComment=(c:Comment,child=false):React.ReactNode=><div key={c.id} id={"1muslim-comment-"+c.id} className={"socialComment unifiedCommentRow"+(child?" child":"")+(c.id===focusCommentId?" unifiedCommentFocused":"")}><Link href={"/profile?user="+encodeURIComponent(c.author_id)} className="commentAvatar" style={{width:28,height:28,minWidth:28,minHeight:28,maxWidth:28,maxHeight:28,flex:"0 0 28px",borderRadius:"50%",overflow:"hidden",display:"grid",placeItems:"center"}} aria-label={"View "+c.name+" profile"}>{c.avatar_url?<img src={c.avatar_url} alt="" style={{width:28,height:28,minWidth:28,minHeight:28,maxWidth:28,maxHeight:28,objectFit:"cover",borderRadius:"50%",display:"block"}}/>:c.name.slice(0,1).toUpperCase()}</Link><div className="commentMain unifiedCommentContent"><div className="commentByline"><Link href={"/profile?user="+encodeURIComponent(c.author_id)}>{c.name}</Link><time dateTime={c.created_at}>{relative(c.created_at)}</time></div><p><EmoTextContent text={c.body}/></p>{c.image_url&&<a href={c.image_url} target="_blank" rel="noopener noreferrer"><img className="commentImage" src={c.image_url} alt="Image attached to comment" loading="lazy" style={{maxWidth:"100%",width:"auto",maxHeight:180,objectFit:"contain",display:"block"}}/></a>}<div className="commentActions" ><button type="button" className="replyAction" onClick={()=>{setReplyTo(c);setExpanded(true);focusCommentComposer()}}>Reply</button><button type="button" className={c.liked?"commentLiked":""} aria-label={c.liked?"Unlike comment":"Like comment"} aria-pressed={c.liked} onClick={()=>void likeComment(c)}><Icon name="heart"/> {c.likes||""}</button><button type="button" className={c.disliked?"commentLiked":""} aria-label={c.disliked?"Remove dislike":"Dislike comment"} aria-pressed={!!c.disliked} onClick={()=>void dislikeComment(c)}><Icon name="dislike"/> {c.dislikes||""}</button></div>{!child&&!!children.get(c.id)?.length&&<><button className="viewReplies" type="button" onClick={()=>setRepliesOpen(old=>({...old,[c.id]:!old[c.id]}))}>{repliesOpen[c.id]?"Hide replies":"View "+children.get(c.id)!.length+" replies"} {repliesOpen[c.id]?"⌃":"⌄"}</button>{repliesOpen[c.id]&&children.get(c.id)!.map(reply=>renderComment(reply,true))}</>}</div></div>;
 const hasVideo=!!youtubeId||!!(mediaUrl&&mediaType?.startsWith("video/"));
 return <section className="unifiedPostMedia" aria-label="Post media and conversation">
 {showVideo&&hasVideo&&<OneMuslimVideo videoKey={"public-post:"+postId} src={mediaUrl||""} youtubeId={youtubeId} title="Public Post video"/>}
 <div className="socialActionBar"><button type="button" aria-label={liked?"Unlike post":"Like post"} aria-pressed={liked} className={liked?"selected":""} onClick={()=>toggle("liked")}><Icon name="heart"/><span>{engagement.likes}</span></button><button type="button" aria-label="Show comments" ref={commentTrigger} aria-expanded={sheetMode?sheetOpen:expanded} onClick={()=>{if(sheetMode){setSheetOpen(true);setExpanded(true)}else setExpanded(v=>!v)}}><Icon name="comment"/><span>{engagement.comments}</span></button><button type="button" aria-label={saved?"Unsave post":"Save post"} aria-pressed={saved} className={saved?"selected":""} onClick={()=>toggle("saved")}><Icon name="save"/><span>{engagement.saves}</span></button><button type="button" onClick={()=>void share()}><Icon name="share"/><span>{engagement.shares}</span></button></div>
 {sheetMode ? (sheetOpen&&typeof document!=="undefined"?createPortal(
  <div className={"ummahCommentPortal"+(nightMode?" ummahCommentsNight":"")+(keyboardInset>80||composerFocused?" ummahKeyboardActive":"")}
       onFocusCapture={e=>{if((e.target as HTMLElement).matches('[contenteditable="true"],input:not([type=file]),textarea')){setComposerFocused(true);setSheetExpanded(true)}}}
       onBlurCapture={e=>{if(!(e.relatedTarget instanceof Node&&e.currentTarget.contains(e.relatedTarget)))setComposerFocused(false)}}>
   <div className="ummahCommentBackdrop" onClick={closeSheet} aria-hidden="true"/>
   <section className="ummahCommentSheet" role="dialog" aria-modal="true" aria-label="Comments" style={{bottom:keyboardInset,height:sheetExpanded||keyboardInset>80||composerFocused
      ? `calc(100dvh - ${keyboardInset}px - env(safe-area-inset-top, 0px) - 9px)`
      : `min(75dvh, calc(100dvh - ${keyboardInset}px - 14px))`}}>
    <header className="ummahCommentHead" onPointerDown={e=>{gestureStart.current=e.clientY}} onPointerUp={e=>{if(gestureStart.current===null)return;const dy=e.clientY-gestureStart.current;gestureStart.current=null;if(dy<-52)setSheetExpanded(true);else if(dy>70){if(sheetExpanded)setSheetExpanded(false);else closeSheet()}}}>
     <span className="ummahSheetGrip" aria-hidden="true"/><strong>Comments</strong><button type="button" onClick={closeSheet} aria-label="Close comments">×</button>
    </header>
    <div className="ummahCommentMain"><div className="socialConversation"><div className="conversationTitle"><strong>{comments.length} {comments.length===1?"comment":"comments"}</strong>{roots.length>3&&<button type="button" onClick={()=>setExpanded(v=>!v)}>{expanded?"Show fewer":"View all comments"}</button>}</div>
 <div className="commentList">{roots.length?(expanded?roots:roots.slice(0,3)).map(c=>renderComment(c)): <p className="emptyComments">Be the first to join the conversation.</p>}</div>
 {replyTo&&<div className="replyNotice">Replying to {replyTo.name}<button type="button" onClick={()=>setReplyTo(null)} aria-label="Cancel reply">×</button></div>}
 {sheetMode&&<div className="ummahEmojiRow" aria-label="Add an emoji to your comment">{["❤️","🙌","🔥","👏","🥲","😍","😮","😂"].map(emoji=><button type="button" key={emoji} aria-label={"Add "+emoji+" reaction"} onClick={()=>setDraft(value=>value+emoji)}>{emoji}</button>)}</div>}
 <form className="commentComposer" onSubmit={e=>void send(e)}><EmoTextComposer ariaLabel={replyTo?"Write a reply":"Add a comment"} placeholder={replyTo?"Write a reply…":"Add a comment…"} value={draft} maxLength={1500} onChange={setDraft}/><input ref={imageInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={e=>{const f=e.target.files?.[0]||null;if(f&&(f.size>5*1024*1024||!["image/png","image/jpeg","image/webp","image/gif"].includes(f.type))){setError("Choose a PNG, JPEG, WebP or GIF under 5 MB");setImage(null)}else{setError("");setImage(f)}e.target.value=""}}/><button type="button" className="attachImage" aria-label="Attach image" onClick={()=>{if(imageInput.current){imageInput.current.accept="image/png,image/jpeg,image/webp,image/gif";imageInput.current.click()}}}><svg viewBox="0 0 24 24" width="18" height="18" style={{width:18,height:18,display:"block"}} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="8" cy="9" r="1.5"/><path d="m4 17 6-6 4 4 3-3 4 4"/></svg></button>{sheetMode&&<button type="button" className="attachGif" aria-label="Attach a GIF from your device" title="Choose GIF" onClick={()=>{if(imageInput.current){imageInput.current.accept="image/gif";imageInput.current.click()}}}>GIF</button>}<button type="submit" disabled={busy||(!draft.trim()&&!image)}>{busy?"Sending…":"Post"}</button></form>
 {imagePreview&&<div className="imagePreview"><img src={imagePreview} alt="Selected comment attachment"/><button type="button" onClick={()=>setImage(null)}>Remove image</button></div>}{error&&<p role="alert" className="commentError">{error}</p>}</div></div>
   </section>
  </div>,document.body):null) : (<div className="socialConversation"><div className="conversationTitle"><strong>{comments.length} {comments.length===1?"comment":"comments"}</strong>{roots.length>3&&<button type="button" onClick={()=>setExpanded(v=>!v)}>{expanded?"Show fewer":"View all comments"}</button>}</div>
 <div className="commentList">{roots.length?(expanded?roots:roots.slice(0,3)).map(c=>renderComment(c)): <p className="emptyComments">Be the first to join the conversation.</p>}</div>
 {replyTo&&<div className="replyNotice">Replying to {replyTo.name}<button type="button" onClick={()=>setReplyTo(null)} aria-label="Cancel reply">×</button></div>}
 {(sheetMode||immersiveMode)&&<div className="ummahEmojiRow" aria-label="Add an emoji to your comment">{["❤️","🙌","🔥","👏","🥲","😍","😮","😂"].map(emoji=><button type="button" key={emoji} aria-label={"Add "+emoji+" reaction"} onClick={()=>setDraft(value=>value+emoji)}>{emoji}</button>)}</div>}
 <form className="commentComposer" onSubmit={e=>void send(e)}><EmoTextComposer ariaLabel={replyTo?"Write a reply":"Add a comment"} placeholder={replyTo?"Write a reply…":"Add a comment…"} value={draft} maxLength={1500} onChange={setDraft}/><input ref={imageInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={e=>{const f=e.target.files?.[0]||null;if(f&&(f.size>5*1024*1024||!["image/png","image/jpeg","image/webp","image/gif"].includes(f.type))){setError("Choose a PNG, JPEG, WebP or GIF under 5 MB");setImage(null)}else{setError("");setImage(f)}e.target.value=""}}/><button type="button" className="attachImage" aria-label="Attach image" onClick={()=>{if(imageInput.current){imageInput.current.accept="image/png,image/jpeg,image/webp,image/gif";imageInput.current.click()}}}><svg viewBox="0 0 24 24" width="18" height="18" style={{width:18,height:18,display:"block"}} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="8" cy="9" r="1.5"/><path d="m4 17 6-6 4 4 3-3 4 4"/></svg></button>{(sheetMode||immersiveMode)&&<button type="button" className="attachGif" aria-label="Attach a GIF from your device" title="Choose GIF" onClick={()=>{if(imageInput.current){imageInput.current.accept="image/gif";imageInput.current.click()}}}>GIF</button>}<button type="submit" disabled={busy||(!draft.trim()&&!image)}>{busy?"Sending…":"Post"}</button></form>
 {imagePreview&&<div className="imagePreview"><img src={imagePreview} alt="Selected comment attachment"/><button type="button" onClick={()=>setImage(null)}>Remove image</button></div>}{error&&<p role="alert" className="commentError">{error}</p>}</div>)}
 <style jsx global>{`
 .unifiedPostMedia .unifiedCommentFocused{border-left:3px solid #bb985e!important;border-radius:8px!important;background:rgba(204,167,100,.12)!important;padding:8px!important;scroll-margin-block:38px!important}
 .unifiedPostMedia .unifiedCommentRow{display:flex!important;flex-flow:row nowrap!important;align-items:flex-start!important;gap:10px!important;min-width:0!important;text-align:left!important}
 .unifiedPostMedia .unifiedCommentRow>.commentAvatar{display:grid!important;position:static!important;float:none!important;flex:0 0 28px!important;width:28px!important;height:28px!important;min-width:28px!important;min-height:28px!important;max-width:28px!important;max-height:28px!important;margin:0!important}
 .unifiedPostMedia .unifiedCommentRow>.unifiedCommentContent{display:block!important;flex:1 1 0!important;min-width:0!important;margin:0!important;padding:0!important;text-align:left!important}
 .unifiedPostMedia .unifiedCommentContent>.commentByline{display:flex!important;flex-flow:row wrap!important;align-items:baseline!important;justify-content:flex-start!important;gap:8px!important;margin:0!important}
 .unifiedPostMedia .unifiedCommentContent>p{margin:3px 0 6px!important;line-height:1.45!important}
 .unifiedPostMedia .unifiedCommentContent>.commentActions{justify-content:flex-start!important}

 /* Override site-wide button rules; these are text actions, not pills. */
 .unifiedPostMedia .commentActions{display:flex!important;flex-flow:row nowrap!important;align-items:center!important;justify-content:flex-start!important;gap:16px!important;width:100%!important;height:24px!important;min-height:24px!important;max-height:24px!important;padding:0!important;margin:3px 0 0!important;overflow:visible!important}
 .unifiedPostMedia .commentActions>button,.unifiedPostMedia .commentActions>button:hover,.unifiedPostMedia .commentActions>button:focus-visible{appearance:none!important;-webkit-appearance:none!important;display:inline-flex!important;flex:0 0 auto!important;flex-direction:row!important;align-items:center!important;justify-content:center!important;vertical-align:middle!important;gap:4px!important;width:auto!important;min-width:0!important;max-width:none!important;height:24px!important;min-height:0!important;max-height:24px!important;padding:0!important;margin:0!important;border:0!important;border-radius:0!important;background:transparent!important;background-color:transparent!important;background-image:none!important;box-shadow:none!important;text-shadow:none!important;filter:none!important;transform:none!important;color:#818892!important;font:500 12px/20px Arial,Helvetica,sans-serif!important;letter-spacing:normal!important;white-space:nowrap!important;cursor:pointer!important}
 .unifiedPostMedia .commentActions>button.commentLiked{color:#e73568!important}
 .unifiedPostMedia .commentActions>button svg{display:block!important;width:17px!important;height:17px!important;min-width:17px!important;min-height:17px!important;max-width:17px!important;max-height:17px!important;flex:0 0 17px!important;transform:none!important;filter:none!important}
 .unifiedPostMedia .commentActions>button:focus-visible{outline:2px solid #477cbb!important;outline-offset:3px!important}
 .unifiedPostMedia .commentMain{min-width:0!important;flex:1 1 0!important}
 `}</style>
 <style jsx>{`
 .unifiedPostMedia{width:100%;color:#172d47;background:transparent;margin:0;font-family:Arial,Helvetica,sans-serif}.socialActionBar{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border-block:1px solid #e5e9ef;padding:4px 0;gap:2px;max-height:58px;overflow:hidden}.socialActionBar button{border:0!important;background:transparent!important;box-shadow:none!important;color:#33465d;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:4px 2px!important;min-width:0;min-height:0!important;height:48px!important;cursor:pointer;font-size:11px;font-weight:600;line-height:1.1}.socialActionBar button.selected{color:#e73568}.socialActionBar button :global(svg){width:19px!important;height:19px!important;min-width:19px!important;min-height:19px!important;max-width:19px!important;max-height:19px!important}.socialConversation{padding:10px 0 4px}.conversationTitle{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px}.conversationTitle strong{font-size:15px}.conversationTitle button,.viewReplies{border:0;background:none;color:#356ca4;font-size:12px;font-weight:700;cursor:pointer}.socialComment{display:flex;gap:9px;padding:8px 0;min-width:0;align-items:flex-start}.socialComment.child{padding:10px 0 4px}.commentAvatar{width:28px!important;height:28px!important;min-width:28px!important;min-height:28px!important;max-width:28px!important;max-height:28px!important;border-radius:50%;flex:none;background:#e5edf6;display:grid;place-items:center;text-decoration:none;color:#244b78;font-weight:800;overflow:hidden}.commentAvatar :global(img){width:28px!important;height:28px!important;min-width:28px!important;min-height:28px!important;max-width:28px!important;max-height:28px!important;object-fit:cover!important;border-radius:50%!important;display:block!important}.commentMain{flex:1;min-width:0}.commentByline{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.commentByline a{text-decoration:none;color:#243951;font-size:13px;font-weight:750}.commentByline time{font-size:11px;color:#8490a1}.commentMain p{font-size:14px;line-height:1.45;overflow-wrap:anywhere;margin:5px 0 8px;white-space:pre-wrap}.commentActions{display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:flex-start!important;gap:18px!important;flex-wrap:nowrap!important;width:100%;height:26px!important;max-height:26px!important;margin-top:3px}.commentActions button{display:inline-flex!important;flex-direction:row!important;align-items:center!important;justify-content:center!important;gap:4px!important;vertical-align:middle!important;appearance:none!important;-webkit-appearance:none!important;background:transparent!important;background-image:none!important;box-shadow:none!important;text-shadow:none!important;border:0!important;outline-offset:2px;border-radius:0!important;color:#818892!important;font-size:12px!important;font-weight:500!important;line-height:20px!important;cursor:pointer;padding:0!important;margin:0!important;min-width:0!important;min-height:0!important;width:auto!important;height:24px!important;max-height:24px!important;transform:none!important;position:static!important;white-space:nowrap!important}.commentActions button :global(svg){width:17px!important;height:17px!important;min-width:17px!important;min-height:17px!important;max-width:17px!important;max-height:17px!important;display:block!important;transform:none!important;stroke-width:1.6}.commentActions .commentLiked{color:#e73568!important}.viewReplies{margin:10px 0 2px;padding:5px 0}.commentComposer{display:flex;gap:6px;align-items:center;border-top:1px solid #e8edf2;padding-top:9px;margin-top:7px}.commentComposer input:not([type=file]){min-width:0;flex:1;border:0;border-radius:24px;background:#f1f3f6;padding:9px 12px;color:#182d44;font-size:14px;outline-offset:2px;height:38px;box-sizing:border-box}.commentComposer button{background:#235a93;border:0;border-radius:22px;padding:9px 12px;color:#fff;font-size:12px;font-weight:700;min-height:36px!important;height:36px!important;min-width:0!important;box-shadow:none!important}.commentComposer button:disabled{opacity:.5}.replyNotice{display:flex;justify-content:space-between;align-items:center;background:#edf4fb;border-radius:10px;padding:8px 12px;color:#245a91;font-size:12px}.replyNotice button{border:0;background:none;font-size:20px}.emptyComments{font-size:13px;color:#718096}.commentImage{max-width:min(100%,240px)!important;max-height:180px!important;border-radius:9px;object-fit:contain;display:block}.attachImage{background:#f1f3f6!important;color:#64748b!important;padding:8px!important;width:36px!important;height:36px!important;display:grid!important;place-items:center!important}.imagePreview{display:flex;align-items:center;gap:12px;margin-top:8px}.imagePreview img{max-height:90px;max-width:130px;border-radius:8px}.imagePreview button{border:0;background:none;color:#235a93}.commentError{font-size:12px;color:#a52d3c}@media(max-width:390px){.socialActionBar button{font-size:10px}.socialComment{gap:8px}}
 `}</style>
 <style jsx global>{`
 .ummahCommentPortal{position:fixed;inset:0;z-index:2147483000;font-family:system-ui,-apple-system,sans-serif;--sheet-bg:#fff;--sheet-text:#1d272b;--sheet-line:#e7eaec;--sheet-muted:#76808a;--sheet-input:#f3f5f6;color:var(--sheet-text)}
 .ummahCommentPortal.ummahCommentsNight{--sheet-bg:#191c20;--sheet-text:#f6f7f9;--sheet-line:#31363e;--sheet-muted:#a1aab7;--sheet-input:#242930;color-scheme:dark}
 .ummahCommentBackdrop{position:absolute;inset:0;background:rgba(0,0,0,.56);animation:ummahShade .24s ease both}
 .ummahCommentSheet{position:absolute;left:0;right:0;width:100%;max-width:780px;margin:0 auto;z-index:1;min-height:260px;display:flex;flex-direction:column;overflow:hidden;border-radius:30px 30px 0 0;background:var(--sheet-bg);color:var(--sheet-text);box-shadow:0 -18px 55px #0004;animation:ummahSlideUp .25s cubic-bezier(.2,.8,.2,1) both}
 .ummahCommentHead{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;min-height:77px;padding:10px 50px 13px;touch-action:pan-y;user-select:none;border-bottom:1px solid var(--sheet-line)}
 .ummahCommentHead .ummahSheetGrip{width:42px;height:4px;background:var(--sheet-muted);opacity:.76;border-radius:999px}
 .ummahCommentHead strong{font-size:17px;font-weight:750;letter-spacing:-.02em}
 .ummahCommentHead button{position:absolute;right:13px;top:22px;border:0;border-radius:50%;width:40px;height:40px;background:var(--sheet-input);color:var(--sheet-text);font-size:24px;display:grid;place-items:center}
 .ummahCommentMain{display:flex;flex:1 1 0;min-height:0;overflow:hidden}
 .ummahCommentPortal .unifiedPostMedia{width:100%;height:100%;min-height:0;color:var(--sheet-text)!important}
 .ummahCommentPortal .socialConversation{display:flex!important;flex-direction:column!important;height:100%!important;min-height:0!important;padding:0!important;margin:0!important;background:var(--sheet-bg)!important;box-shadow:none!important;border:0!important;color:var(--sheet-text)!important}
 .ummahCommentPortal .conversationTitle{display:none!important}
 .ummahCommentPortal .commentList{flex:1 1 0!important;min-height:0;overflow:auto;overscroll-behavior:contain;padding:12px 19px!important}
 .ummahCommentPortal .socialComment{border-bottom:1px solid var(--sheet-line);padding:11px 0!important}
 .ummahCommentPortal .commentByline a,.ummahCommentPortal .commentMain p{color:var(--sheet-text)!important}
 .ummahCommentPortal .commentByline time{color:var(--sheet-muted)!important}
 .ummahCommentPortal .emptyComments{color:var(--sheet-muted)!important;text-align:center;margin:clamp(55px,12vh,150px) auto}
 .ummahCommentPortal .replyNotice{margin:0 16px;background:var(--sheet-input)!important;color:var(--sheet-text)!important}
 .ummahCommentPortal .ummahEmojiRow{display:flex;gap:3px;justify-content:space-between;overflow-x:auto;scrollbar-width:none;flex:0 0 auto;padding:9px 13px 6px;border-top:1px solid var(--sheet-line)}
 .ummahCommentPortal .ummahEmojiRow button{background:none;border:0;flex:1 0 42px;min-width:42px;min-height:43px;border-radius:13px;font-size:25px;line-height:1;transition:transform .12s}
 .ummahCommentPortal .ummahEmojiRow button:active{transform:scale(.87)}
 .ummahCommentPortal .commentComposer{display:flex!important;flex-wrap:nowrap!important;flex:0 0 auto;border:0!important;border-top:1px solid var(--sheet-line)!important;margin:0!important;padding:8px 13px max(10px,env(safe-area-inset-bottom))!important;gap:6px;min-width:0;background:var(--sheet-bg)!important}
 .ummahCommentPortal .commentComposer input:not([type=file]),.ummahCommentPortal .commentComposer textarea{font-size:16px!important;background:var(--sheet-input)!important;color:var(--sheet-text)!important;border:1px solid var(--sheet-line)!important}
 .ummahCommentPortal .commentComposer button{border-radius:13px!important;min-width:34px!important;background:var(--sheet-input)!important;color:var(--sheet-text)!important}
 .ummahCommentPortal .commentComposer button[type=submit]{background:#27684b!important;color:#fff!important;min-width:44px!important}
 .ummahCommentPortal .commentComposer .attachGif{font-weight:830!important;font-size:11px!important;border:1px solid var(--sheet-muted)!important}
 .ummahCommentPortal .commentError{padding:5px 14px;font-size:12px}
 .ummahCommentPortal .imagePreview{padding:4px 14px}
 @keyframes ummahShade{from{opacity:0}to{opacity:1}}
 @keyframes ummahSlideUp{from{opacity:.7;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
 @media(prefers-reduced-motion:reduce){.ummahCommentPortal *{animation:none!important;transition:none!important}}
 `}</style>
</section>
}
