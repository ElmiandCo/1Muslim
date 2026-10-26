"use client";
import {useEffect,useRef,useState} from "react";
import {usePathname} from "next/navigation";
import {createClient} from "../../utils/supabase/client";
import LiveHomePreview from "./LiveHomePreview";

type Clip={id:string;postId?:string;src:string;caption:string;creator:string;liveRoom?:string;liveId?:string};
const shuffleClips=(items:Clip[])=>{const result=[...items];for(let i=result.length-1;i>0;i--){const bytes=new Uint32Array(1);crypto.getRandomValues(bytes);const j=bytes[0]%(i+1);[result[i],result[j]]=[result[j],result[i]]}return result};
const DEMO:Clip={id:"demo",src:"/videos/prelive-intro.mp4",caption:"Welcome to 1Muslim · Preview video",creator:"1Muslim"};
export default function ImmersiveVideoEntry(){
 const pathname=usePathname();
 const [open,setOpen]=useState(false),[clips,setClips]=useState<Clip[]>([DEMO]),[index,setIndex]=useState(0),[muted,setMuted]=useState(false),[soundPrompt,setSoundPrompt]=useState(false);
 const [liveClips,setLiveClips]=useState<Clip[]>([]);
 const [likes,setLikes]=useState<Record<string,number>>({}),[liked,setLiked]=useState<Record<string,boolean>>({}),[commentCounts,setCommentCounts]=useState<Record<string,number>>({}),[commentsOpen,setCommentsOpen]=useState(false),[comments,setComments]=useState<{id:string;body:string}[]>([]),[draft,setDraft]=useState(""),[sending,setSending]=useState(false),[engagementError,setEngagementError]=useState("");
 const video=useRef<HTMLVideoElement>(null),touch=useRef<{x:number;y:number}|null>(null);
 const soundPreference=useRef(true);
 useEffect(()=>{soundPreference.current=true;setMuted(false);try{localStorage.setItem("1muslim:video-sound","on")}catch{}},[]);
 const chooseSound=(enabled:boolean)=>{soundPreference.current=enabled;setMuted(!enabled);setSoundPrompt(false);try{localStorage.setItem("1muslim:video-sound",enabled?"on":"off")}catch{}const el=video.current;if(el){el.muted=!enabled;el.defaultMuted=!enabled;void el.play().catch(()=>{if(enabled){setSoundPrompt(true)}})}};
 useEffect(()=>{if(pathname!=="/"){setOpen(false);return}try{setOpen(sessionStorage.getItem("1muslim:video-entry-dismissed")!=="1")}catch{setOpen(true)}},[pathname]);
 useEffect(()=>{let alive=true;const load=async()=>{try{
  const db=createClient();
  const {data:media,error}=await db.from("post_media").select("id,post_id,user_id,storage_path,created_at").ilike("mime_type","video/%").order("created_at",{ascending:false}).limit(30);
  if(error||!media?.length)return;
  const {data:posts}=await db.from("posts").select("id,user_id,body").in("id",[...new Set(media.map(m=>m.post_id))]);
  const byId=new Map((posts||[]).map(p=>[p.id,p]));
  const valid=media.filter(m=>byId.get(m.post_id)?.user_id===m.user_id);
  if(!valid.length)return;
  const {data:urls}=await db.storage.from("community-media").createSignedUrls(valid.map(m=>m.storage_path),3600);
  const found=valid.flatMap((m,i)=>urls?.[i]?.signedUrl?[{id:m.id,postId:m.post_id,src:urls[i].signedUrl,caption:byId.get(m.post_id)?.body||"1Muslim community video",creator:"Community"}]:[]);
  if(alive&&found.length){setIndex(0);setClips(shuffleClips(found));}
 }catch{}};void load();return()=>{alive=false}},[]);
 useEffect(()=>{let active=true;const refresh=async()=>{const {data}=await createClient().from("live_streams").select("id,title,room_name,viewer_count").eq("status","live").order("started_at",{ascending:false}).limit(20);if(!active)return;setLiveClips((data||[]).filter(x=>x.room_name).map(x=>({id:"live:"+x.id,liveId:x.id,liveRoom:x.room_name,src:"",creator:"LIVE · "+(x.viewer_count||0)+" watching",caption:x.title||"1Muslim Live"})))};void refresh();const timer=window.setInterval(()=>{if(open)void refresh()},30000);return()=>{active=false;window.clearInterval(timer)}},[open]);
 const mixedClips=useRef<Clip[]>([]);
 const [feed,setFeed]=useState<Clip[]>([DEMO]);
 useEffect(()=>{const previous=mixedClips.current;const ids=new Set([...clips,...liveClips].map(x=>x.id));const existing=previous.filter(x=>ids.has(x.id));const oldIds=new Set(existing.map(x=>x.id));const fresh=shuffleClips([...clips,...liveClips].filter(x=>!oldIds.has(x.id)));const merged=existing.length?[...existing,...fresh]:shuffleClips([...clips,...liveClips]);mixedClips.current=merged;setFeed(merged);setIndex(i=>Math.min(i,Math.max(0,merged.length-1)))},[clips,liveClips]);
 useEffect(()=>{if(!open)return;const old=document.body.style.overflow;document.body.style.overflow="hidden";return()=>{document.body.style.overflow=old}},[open]);
 useEffect(()=>{if(!open||feed[index]?.liveRoom)return;const el=video.current;if(!el)return;let cancelled=false;const start=async()=>{if(cancelled)return;const wantsSound=soundPreference.current;el.muted=!wantsSound;el.defaultMuted=!wantsSound;try{await el.play();if(!cancelled){setMuted(!wantsSound);setSoundPrompt(false)}}catch{if(!wantsSound||cancelled)return;if(!cancelled){setMuted(false);setSoundPrompt(true)}}};void start();const resume=()=>{if(!document.hidden)void start()};document.addEventListener("visibilitychange",resume);return()=>{cancelled=true;document.removeEventListener("visibilitychange",resume);el.pause()}},[index,open,feed]);

 useEffect(()=>{let live=true;const ids=clips.map(x=>x.postId).filter((x):x is string=>!!x);if(!ids.length)return;const load=async()=>{const db=createClient();const [{data:allLikes},{data:allComments},{data:auth}]=await Promise.all([db.from("post_likes").select("post_id,user_id").in("post_id",ids),db.from("comments").select("post_id").in("post_id",ids),db.auth.getUser()]);if(!live)return;const counts:Record<string,number>={},mine:Record<string,boolean>={},commentTotal:Record<string,number>={};for(const x of allLikes||[]){counts[x.post_id]=(counts[x.post_id]||0)+1;if(auth.user?.id===x.user_id)mine[x.post_id]=true}for(const x of allComments||[])commentTotal[x.post_id]=(commentTotal[x.post_id]||0)+1;setLikes(counts);setLiked(mine);setCommentCounts(commentTotal)};void load();return()=>{live=false}},[clips]);
 const toggleLike=async()=>{const postId=feed[index]?.postId;if(!postId)return;const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user){setEngagementError("Sign in to like videos.");return}const was=!!liked[postId];setLiked(p=>({...p,[postId]:!was}));setLikes(p=>({...p,[postId]:Math.max(0,(p[postId]||0)+(was?-1:1))}));const {error}=was?await db.from("post_likes").delete().eq("post_id",postId).eq("user_id",user.id):await db.from("post_likes").insert({post_id:postId,user_id:user.id});if(error){setLiked(p=>({...p,[postId]:was}));setLikes(p=>({...p,[postId]:Math.max(0,(p[postId]||0)+(was?1:-1))}));setEngagementError("Could not update like.")}};
 const openComments=async()=>{setCommentsOpen(true);setEngagementError("");const postId=feed[index]?.postId;if(!postId){setComments([]);return}const {data}=await createClient().from("comments").select("id,body").eq("post_id",postId).order("created_at",{ascending:false}).limit(80);setComments(data||[])};
 const sendComment=async()=>{const postId=feed[index]?.postId;if(!postId||!draft.trim()||sending)return;setSending(true);const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user){setEngagementError("Sign in to comment.");setSending(false);return}const {data,error}=await db.from("comments").insert({post_id:postId,user_id:user.id,body:draft.trim()}).select("id,body").single();if(error){setEngagementError("Comment could not be posted.")}else if(data){setComments(p=>[data,...p]);setCommentCounts(p=>({...p,[postId]:(p[postId]||0)+1}));setDraft("")}setSending(false)};
 const shareClip=async()=>{const src=feed[index]?.liveId?`${window.location.origin}/streaming/live/${feed[index].liveId}`:feed[index]?.postId?`${window.location.origin}/?post=${feed[index].postId}`:feed[index]?.src;if(!src)return;try{if(navigator.share)await navigator.share({title:"1Muslim video",url:src});else{await navigator.clipboard.writeText(src);setEngagementError("Video link copied.")}}catch{}};

 const close=()=>{setOpen(false);video.current?.pause();try{sessionStorage.setItem("1muslim:video-entry-dismissed","1")}catch{}};
 const step=(n:number)=>{setCommentsOpen(false);setEngagementError("");if(n<0&&index===0&&feed.length>1){window.location.reload();return}setIndex(i=>Math.max(0,Math.min(feed.length-1,i+n)))};
 useEffect(()=>{if(!open)return;const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape")close();if(e.key==="ArrowDown")step(1);if(e.key==="ArrowUp")step(-1)};window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey)},[open,feed.length]);
 if(!open||pathname!=="/")return null;
 const clip=feed[index]||DEMO;
 return <div className="imv-root" role="dialog" aria-modal="true" aria-label="1Muslim full-screen video feed"
 onTouchStart={e=>{touch.current={x:e.touches[0].clientX,y:e.touches[0].clientY}}}
 onTouchEnd={e=>{const start=touch.current;if(!start)return;const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;touch.current=null;if(Math.abs(dy)>65&&Math.abs(dy)>Math.abs(dx)*1.3){if(soundPreference.current&&video.current?.muted)chooseSound(true);step(dy<0?1:-1)}}}>
  {!clip.liveRoom&&<div className="imv-video-backdrop" style={{backgroundImage:`url("${clip.src.replace(/"/g,"%22")}")`}} aria-hidden="true"/>}
  {clip.liveRoom?<div className="imv-live-player"><LiveHomePreview roomName={clip.liveRoom}/><div className="imv-live-label">● LIVE NOW</div><a href={`/streaming/live/${clip.liveId}`} className="imv-join-live">Join live · Chat & interact →</a></div>:<video key={clip.id} ref={video} src={clip.src} autoPlay muted={muted} playsInline loop preload="auto" onLoadedData={e=>{if(e.currentTarget.paused)void e.currentTarget.play().catch(()=>{})}} onClick={e=>{const v=e.currentTarget;if(v.muted){chooseSound(true);return}if(v.paused)void v.play();else v.pause()}} />}
  <div className="imv-shade"/>
  <button className="imv-close" type="button" onClick={close} aria-label="Close videos and go home">✕ <span>Home</span></button>
  <div className="imv-brand">☪ <strong>1MUSLIM</strong><span>For You</span></div>
  <div className="imv-caption"><strong>@{clip.creator}</strong><p>{clip.caption.replace(/\\n/g," ")}</p><small>Swipe up or down</small></div>
  {soundPrompt&&<button type="button" className="imv-enable-sound" onClick={()=>chooseSound(true)}>🔊 Tap to enable sound</button>}
  <div className="imv-actions">
  <button type="button" className="imv-creator" aria-label="1Muslim community"><span>1M</span><b>+</b></button>
  <button type="button" onClick={toggleLike} disabled={!clip.postId} aria-label="Like video" aria-pressed={!!(clip.postId&&liked[clip.postId])}><span className={clip.postId&&liked[clip.postId]?"imv-heart active":"imv-heart"}>♥</span><small>{clip.postId?likes[clip.postId]||0:"—"}</small></button>
  <button type="button" onClick={openComments} aria-label="View comments"><span className="imv-comment-icon">▢</span><small>{clip.postId?commentCounts[clip.postId]||0:"—"}</small></button>
  <button type="button" onClick={shareClip} aria-label="Share video"><span>➤</span><small>Share</small></button>
  <button type="button" onClick={()=>chooseSound(muted)} aria-label={muted?"Unmute":"Mute"}><span>{muted?"◖̸":"◖))"}</span><small>Sound</small></button>
 </div>
 {engagementError&&<div className="imv-notice" role="status" onClick={()=>setEngagementError("")}>{engagementError}</div>}
 {commentsOpen&&<div className="imv-comments" role="dialog" aria-label="Video comments"><header><span>Comments · {clip.postId?commentCounts[clip.postId]||0:0}</span><button type="button" onClick={()=>setCommentsOpen(false)} aria-label="Close comments">✕</button></header><div className="imv-comment-list">{comments.length?comments.map(x=><p key={x.id}>{x.body}</p>):<p>No comments yet. Start the conversation.</p>}</div><form onSubmit={e=>{e.preventDefault();void sendComment()}}><input aria-label="Write a comment" placeholder="Add a comment…" value={draft} onChange={e=>setDraft(e.target.value)} maxLength={1000}/><button type="submit" disabled={sending||!draft.trim()}>Send</button></form></div>}
  <style jsx>{`
   .imv-root{position:fixed;inset:0;z-index:2147483000;background:#020705;color:white;overflow:hidden;touch-action:pan-y;overscroll-behavior:contain;font-family:inherit}
   video{width:100%;height:100%;object-fit:contain;object-position:center center;position:absolute;inset:0;z-index:1;background:transparent}.imv-video-backdrop{position:absolute;inset:-24px;background-size:cover;background-position:center;filter:blur(36px) brightness(.32);transform:scale(1.08);opacity:.8;pointer-events:none}
   .imv-live-player{position:absolute;inset:0;z-index:1}.imv-live-player>span{height:100%!important;border-radius:0!important}.imv-live-label{position:absolute;top:94px;left:20px;background:#e52348;color:#fff;font-weight:900;border-radius:6px;padding:8px 12px}.imv-join-live{position:absolute;bottom:27%;left:50%;transform:translateX(-50%);white-space:nowrap;background:#087d5b;color:#fff;text-decoration:none;border:1px solid #e5c67d;border-radius:28px;padding:13px 19px;font-weight:800;z-index:5}
   .imv-shade{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,#00180f99,transparent 24%,transparent 52%,#00150dcc)}
   .imv-close{position:absolute;top:max(22px,env(safe-area-inset-top));right:18px;border:1px solid #dfc58b9e;border-radius:24px;background:#073d30c9;color:#fff;padding:10px 14px;font-size:20px;z-index:3;backdrop-filter:blur(12px);cursor:pointer}
   .imv-close span{font-size:12px;margin-left:5px}
   .imv-brand{position:absolute;top:max(28px,env(safe-area-inset-top));left:18px;display:flex;align-items:center;gap:10px;color:#f2d995;text-shadow:0 2px 8px #000}
   .imv-brand span{margin-left:10px;border-bottom:2px solid #e7c777;color:white;font-size:14px}
   .imv-caption{position:absolute;left:20px;right:85px;bottom:max(42px,calc(env(safe-area-inset-bottom) + 24px));text-shadow:0 2px 8px #000}
   .imv-caption strong{color:#f5e5b8}.imv-caption p{font-size:16px;line-height:1.35;margin:9px 0}.imv-caption small{color:#e0e9e3}
   .imv-enable-sound{position:absolute;left:50%;top:48%;transform:translate(-50%,-50%);z-index:4;border:1px solid #e7c777;border-radius:30px;background:#073d30e8;color:#fff;padding:15px 24px;font-size:16px;font-weight:700;white-space:nowrap;box-shadow:0 8px 30px #0008;cursor:pointer}
   .imv-actions{position:absolute;right:12px;bottom:max(120px,calc(env(safe-area-inset-bottom) + 90px));display:flex;flex-direction:column;align-items:center;gap:17px;z-index:3}
   .imv-actions button{border:0;border-radius:0;width:54px;min-height:52px;background:transparent;color:white;font-size:32px;display:flex;align-items:center;flex-direction:column;justify-content:center;gap:1px;filter:drop-shadow(0 2px 5px #000b);cursor:pointer}.imv-actions button small{font-size:12px;font-weight:700;color:#fff}.imv-actions .imv-creator{position:relative;border-radius:50%;width:49px;height:49px;border:2px solid white;background:linear-gradient(135deg,#063c32,#0f735a);font-size:17px;font-weight:900;margin-bottom:6px}.imv-creator b{position:absolute;bottom:-9px;background:#0fb77b;border-radius:50%;font-size:15px;line-height:18px;width:19px;height:19px}.imv-heart{font-size:39px;line-height:39px}.imv-heart.active{color:#ff4b79}.imv-comments{position:absolute;bottom:0;left:0;right:0;height:min(43vh,410px);background:rgba(8,29,27,.76);border-radius:25px 25px 0 0;z-index:6;display:flex;flex-direction:column;padding:18px 16px max(20px,env(safe-area-inset-bottom));box-shadow:0 -10px 35px #0008;backdrop-filter:blur(18px)}.imv-comments header{display:flex;align-items:center;justify-content:space-between;font-weight:800;padding:0 4px 16px;border-bottom:1px solid #ffffff22}.imv-comments header button{border:0;background:transparent;color:white;font-size:24px}.imv-comment-list{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:10px 5px}.imv-comment-list p{padding:12px;border-bottom:1px solid #ffffff19;overflow-wrap:anywhere}.imv-comments form{display:flex;gap:8px}.imv-comments input{flex:1;min-width:0;border:1px solid #d8c58c66;border-radius:25px;background:#ffffff12;color:white;padding:12px}.imv-comments form button{border:0;border-radius:22px;background:#0b956d;color:white;padding:0 16px;font-weight:700}.imv-notice{position:absolute;bottom:100px;left:15px;right:75px;z-index:8;background:#073d30e9;padding:12px;border-radius:12px;font-size:14px}
   .imv-actions button:disabled{opacity:.3}.imv-actions button{transition:transform .16s ease,opacity .16s ease}.imv-actions button:active{transform:scale(.86)}.imv-comment-icon{display:block;font-size:36px;line-height:37px;transform:rotate(0deg)}.imv-caption{z-index:2}.imv-shade{z-index:1}.imv-brand{z-index:2}.imv-actions{z-index:4}
   @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
  `}</style>
 </div>;
}
