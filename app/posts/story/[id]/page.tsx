"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {cleanPostBody} from "../../../lib/cleanPostBody";
import {useParams,useRouter} from "next/navigation";
import styles from "../../posts-magazine.module.css";
import UnifiedPostMedia from "../../../components/UnifiedPostMedia";
import {createClient} from "../../../../utils/supabase/client";
import PostAuthorFollow from "../../../components/PostAuthorFollow";
import {readImmersiveQueue,rememberWatchedPost} from "../../../lib/ummah-watch-history";
import {predictVideo,cachePublicImage} from "../../../../lib/smart-media";
type Post={id:string;body:string;author_name:string;author_handle:string;created_at:string;media_url:string|null;media_type:string|null;author_id:string};
const yt=(s:string)=>s.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/))([\w-]{11})/)?.[1];
type StoryFeed={posts:Post[];viewer_id:string|null};
let cachedStoryFeed:StoryFeed|null=null;
let feedCacheUntil=0;
let inflightFeed:Promise<StoryFeed>|null=null;
function getStoryFeed():Promise<StoryFeed>{
 if(cachedStoryFeed&&Date.now()<feedCacheUntil)return Promise.resolve(cachedStoryFeed);
 if(inflightFeed)return inflightFeed;
 inflightFeed=fetch("/api/community-posts",{cache:"no-store"}).then(async res=>{
  if(!res.ok)throw Error("Could not load community posts");
  const data=await res.json() as StoryFeed;
  cachedStoryFeed=data;feedCacheUntil=Date.now()+45000;return data;
 }).finally(()=>{inflightFeed=null});
 return inflightFeed;
}
export default function MagazineStory(){
 const router=useRouter(),touchStart=useRef<{x:number;y:number}|null>(null);const params=useParams(),id=String(params.id||"");const sheetDrag=useRef<{y:number;height:number;at:number}|null>(null);const [playMode,setPlayMode]=useState(false),[sheetDragging,setSheetDragging]=useState(false);const [sheetHeight,setSheetHeight]=useState(5),[post,setPost]=useState<Post|null>(null),[legacyPost,setLegacyPost]=useState(false),[viewerId,setViewerId]=useState<string|null>(null),[postIds,setPostIds]=useState<string[]>([]),[loading,setLoading]=useState(true);
 useEffect(()=>{
  let active=true;
  const mode=new URLSearchParams(window.location.search).get("play")==="1";
  setPlayMode(mode);setLoading(true);
  setYoutubePlaying(false);
  const apply=(d:StoryFeed)=>{
   if(!active)return;
   const items=d.posts||[];
   const found=items.find(p=>p.id===id)||null;
   setPost(found);setViewerId(d.viewer_id||null);setLegacyPost(false);
   const queue=mode?readImmersiveQueue().filter(postId=>items.some(p=>p.id===postId)):[];
   const ids=queue.length?queue:items.map(p=>p.id);
   if(found&&!ids.includes(found.id))ids.unshift(found.id);
   setPostIds(ids);
   if(!found){
    void (async()=>{
     const db=createClient();
     const {data:row}=await db.from("posts").select("id,body,created_at,user_id").eq("id",id).maybeSingle();
     if(!row||!active)return;
     const {data:author}=await db.from("profiles").select("display_name,username").eq("id",row.user_id).maybeSingle();
     if(active){setPost({id:row.id,body:row.body||"",created_at:row.created_at,author_id:row.user_id,author_name:author?.display_name||"1Muslim Member",author_handle:"@"+(author?.username||"member"),media_url:null,media_type:null});setLegacyPost(true)}
    })();
   }
  };
  if(cachedStoryFeed&&Date.now()<feedCacheUntil)apply(cachedStoryFeed);
  void getStoryFeed().then(apply).catch(()=>{}).finally(()=>{if(active)setLoading(false)});
  return()=>{active=false};
 },[id]);
 const lastMediaTap=useRef(0);
 const [heartVisible,setHeartVisible]=useState(false);const [rail,setRail]=useState({likes:0,comments:0,saves:0,shares:0,liked:false,saved:false});
 const likeFromMedia=async()=>{if(!post||legacyPost)return;setHeartVisible(true);window.setTimeout(()=>setHeartVisible(false),720);try{const r=await fetch("/api/ummah-post-engagement?postId="+encodeURIComponent(post.id),{cache:"no-store"});if(!r.ok)return;const data=await r.json();if(data.liked)return;const response=await fetch("/api/ummah-post-engagement",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({postId:post.id,kind:"like"})});if(response.ok)window.dispatchEvent(new CustomEvent("ummah-post-engagement-changed",{detail:{postId:post.id}}))}catch{}};
 const onMediaTap=()=>{const now=Date.now();if(now-lastMediaTap.current<340){lastMediaTap.current=0;void likeFromMedia()}else lastMediaTap.current=now};
 useEffect(()=>{if(!id)return;let active=true;const refresh=async()=>{try{const r=await fetch("/api/ummah-post-engagement?postId="+encodeURIComponent(id),{cache:"no-store"});if(r.ok&&active){const j=await r.json();setRail({likes:j.likes||0,comments:j.comments||0,saves:j.saves||0,shares:j.shares||0,liked:!!j.liked,saved:!!j.saved})}}catch{}};void refresh();const listener=(e:Event)=>{if((e as CustomEvent<{postId:string}>).detail?.postId===id)void refresh()};window.addEventListener("ummah-post-engagement-changed",listener);return()=>{active=false;window.removeEventListener("ummah-post-engagement-changed",listener)}},[id]);
 const railToggle=async(kind:"like"|"save")=>{if(!post||legacyPost)return;try{const r=await fetch("/api/ummah-post-engagement",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({postId:post.id,kind})});if(r.ok)window.dispatchEvent(new CustomEvent("ummah-post-engagement-changed",{detail:{postId:post.id}}))}catch{}};
 const railShare=async()=>{if(!post)return;const url=location.origin+"/posts/story/"+encodeURIComponent(post.id);try{if(navigator.share)await navigator.share({url});else await navigator.clipboard.writeText(url);await fetch("/api/ummah-post-engagement",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({postId:post.id,kind:"share"})});window.dispatchEvent(new CustomEvent("ummah-post-engagement-changed",{detail:{postId:post.id}}))}catch{}};
 const playerRef=useRef<HTMLVideoElement|null>(null),backdropCanvasRef=useRef<HTMLCanvasElement|null>(null);
 const [videoTime,setVideoTime]=useState(0),[videoDuration,setVideoDuration]=useState(0),[videoSeeking,setVideoSeeking]=useState(false),[playbackBoost,setPlaybackBoost]=useState<1|2|5>(1);
 const holdRef=useRef<{pointerId:number;x:number;y:number;timer:number|null;active:boolean;video:HTMLVideoElement}|null>(null);
 const suppressClickUntil=useRef(0),suppressNavUntil=useRef(0);
 const releaseHold=()=>{const g=holdRef.current;if(!g)return;if(g.timer!==null)window.clearTimeout(g.timer);g.video.playbackRate=1;holdRef.current=null;setPlaybackBoost(1)};
 const holdDown=(e:React.PointerEvent<HTMLVideoElement>)=>{
  if(e.pointerType==="mouse"&&e.button!==0)return;
  releaseHold();if(e.currentTarget.paused)return;
  const g={pointerId:e.pointerId,x:e.clientX,y:e.clientY,timer:null as number|null,active:false,video:e.currentTarget};
  g.timer=window.setTimeout(()=>{if(holdRef.current!==g||g.video.paused)return;g.active=true;g.video.playbackRate=2;setPlaybackBoost(2);suppressClickUntil.current=Date.now()+550;suppressNavUntil.current=Date.now()+550;try{g.video.setPointerCapture(g.pointerId)}catch{}},350);
  holdRef.current=g;
 };
 const holdMove=(e:React.PointerEvent<HTMLVideoElement>)=>{
  const g=holdRef.current;if(!g||g.pointerId!==e.pointerId)return;
  const dx=e.clientX-g.x,dy=e.clientY-g.y;
  if(!g.active){if(Math.abs(dx)>14||Math.abs(dy)>14)releaseHold();return}
  const rate:2|5=dx>=65?5:2;
  if(g.video.playbackRate!==rate){g.video.playbackRate=rate;setPlaybackBoost(rate)}
  suppressClickUntil.current=Date.now()+550;suppressNavUntil.current=Date.now()+550;
  if(e.cancelable)e.preventDefault();
 };
 const holdUp=()=>{if(holdRef.current?.active){suppressClickUntil.current=Date.now()+550;suppressNavUntil.current=Date.now()+550}releaseHold()};
 const seekStoryVideo=(seconds:number)=>{const el=playerRef.current;if(!el||!Number.isFinite(el.duration)||el.duration<=0)return;el.currentTime=Math.max(0,Math.min(seconds,el.duration));setVideoTime(el.currentTime)};
 useEffect(()=>{
  const release=()=>{const g=holdRef.current;if(!g)return;if(g.active){suppressClickUntil.current=Date.now()+550;suppressNavUntil.current=Date.now()+550}releaseHold()};
  window.addEventListener("pointerup",release);window.addEventListener("pointercancel",release);
  return()=>{window.removeEventListener("pointerup",release);window.removeEventListener("pointercancel",release);const g=holdRef.current;if(g){if(g.timer!==null)window.clearTimeout(g.timer);g.video.playbackRate=1;holdRef.current=null}};
 },[id]);
 const [muted,setMuted]=useState(true),[playing,setPlaying]=useState(true),[playFeedback,setPlayFeedback]=useState(false);
 const feedbackTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const watchedId=useRef<string|null>(null);
 const youtubeWatchTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{watchedId.current=null;return()=>{if(youtubeWatchTimer.current)clearTimeout(youtubeWatchTimer.current)}},[id]);
 useEffect(()=>()=>{if(feedbackTimer.current)clearTimeout(feedbackTimer.current)},[]);
 const togglePlayback=()=>{const player=playerRef.current;if(!player)return;if(player.paused){delete player.dataset.userPaused;void player.play().then(()=>setPlaying(true)).catch(()=>setPlaying(false))}else{player.dataset.userPaused="true";player.pause();setPlaying(false)}setPlayFeedback(true);if(feedbackTimer.current)clearTimeout(feedbackTimer.current);feedbackTimer.current=setTimeout(()=>setPlayFeedback(false),750)};
 const toggleSound=()=>{const next=!muted;setMuted(next);if(playerRef.current)playerRef.current.muted=next};
 // Mirror the foreground video into a low-resolution blurred canvas. No second decoder/player.
 useEffect(()=>{
  if(!post?.media_url||!post.media_type?.startsWith("video/"))return;
  let stopped=false,frame=0,lastPaint=0;
  const video=playerRef.current,canvas=backdropCanvasRef.current;
  if(!video||!canvas)return;
  const ctx=canvas.getContext("2d",{alpha:false});
  if(!ctx)return;
  canvas.width=192;canvas.height=320;
  const paint=(now:number)=>{
   if(stopped)return;
   if(!document.hidden&&video.readyState>=2&&now-lastPaint>=100){
    try{ctx.drawImage(video,0,0,canvas.width,canvas.height);lastPaint=now}catch{/* Keep last rendered frame if the source disallows drawing. */}
   }
   frame=requestAnimationFrame(paint);
  };
  frame=requestAnimationFrame(paint);
  return()=>{stopped=true;cancelAnimationFrame(frame)};
 },[post?.id,post?.media_url,post?.media_type]);
 const [youtubePlaying,setYoutubePlaying]=useState(false);
 const video=post?yt(post.body+" "+(post.media_url||"")):null;
 const index=postIds.indexOf(id);
 const navigate=(step:number)=>{const next=postIds[index+step];if(next)router.push("/posts/story/"+encodeURIComponent(next)+(playMode?"?play=1":""))};
 useEffect(()=>{
  if(!playMode||index<0)return;
  const upcoming=postIds.slice(index+1,index+3);
  for(const next of upcoming)router.prefetch("/posts/story/"+encodeURIComponent(next)+"?play=1");
  if(!upcoming.length)return;
  let alive=true;
  void getStoryFeed().then(d=>{
   if(!alive)return;
   for(const next of upcoming){
    const item=(d.posts||[]).find(p=>p.id===next);
    if(item?.media_url&&item.media_type?.startsWith("video/"))predictVideo(item.media_url);
    if(item?.media_url&&item.media_type?.startsWith("image/"))void cachePublicImage(item.media_url);
   }
  }).catch(()=>{});
  return()=>{alive=false};
 },[playMode,index,postIds,router]);
 useEffect(()=>{
  if(!playMode)return;
  let lastWheel=0;
  const keyboard=(event:KeyboardEvent)=>{
   if((event.target as HTMLElement)?.closest("input,textarea,[contenteditable=true],.unifiedPostMedia"))return;
   if(event.key==="ArrowDown"||event.key==="PageDown"){event.preventDefault();navigate(1)}
   if(event.key==="ArrowUp"||event.key==="PageUp"){event.preventDefault();navigate(-1)}
  };
  const wheel=(event:WheelEvent)=>{
   if((event.target as HTMLElement)?.closest(".immersiveSheet,.unifiedPostMedia"))return;
   if(Math.abs(event.deltaY)<18||Date.now()-lastWheel<600)return;
   lastWheel=Date.now();navigate(event.deltaY>0?1:-1);
  };
  window.addEventListener("keydown",keyboard);window.addEventListener("wheel",wheel,{passive:true});
  return()=>{window.removeEventListener("keydown",keyboard);window.removeEventListener("wheel",wheel)};
 },[playMode,id,postIds]);
 return <main className={`${styles.page} immersiveStoryPage`}>{loading?<div className={styles.status}>OPENING THE STORY…</div>:!post?<div className={styles.status}>STORY UNAVAILABLE · <Link href="/posts">BACK TO POSTS</Link></div>:<article className={`${styles.socialStory} immersiveStory`} style={{"--comments-height":`${sheetHeight}%`,"--rail-scale":String(1-.48*Math.min(1,Math.max(0,(sheetHeight-5)/65))),"--rail-opacity":String(1-Math.min(1,Math.max(0,(sheetHeight-48)/24))),"--rail-gap":`${17-9*Math.min(1,Math.max(0,(sheetHeight-5)/65))}px`,"--header-progress":String(Math.min(1,Math.max(0,(sheetHeight-5)/55))),"--avatar-scale":String(1-.42*Math.min(1,Math.max(0,(sheetHeight-5)/55)))} as React.CSSProperties} onTouchStart={e=>{const target=e.target as HTMLElement;if(target.closest("input,textarea,button,iframe,.unifiedPostMedia,.immersiveTimeline,[role=slider]")||!playMode&&target.closest("video"))return;touchStart.current={x:e.touches[0].clientX,y:e.touches[0].clientY}}} onTouchEnd={e=>{if(Date.now()<suppressNavUntil.current){touchStart.current=null;return}const start=touchStart.current;touchStart.current=null;if(!start)return;const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;if(playMode&&Math.abs(dy)>72&&Math.abs(dy)>Math.abs(dx)*1.2){navigate(dy<0?1:-1);return}if(Math.abs(dx)>85&&Math.abs(dx)>Math.abs(dy)*1.5)navigate(dx<0?1:-1)}}>
 <div className={styles.socialStoryEdition}><span>THE PEOPLE'S EDITION</span><span>{new Date(post.created_at).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}</span></div>
 <div className="immersiveMedia"><div className="immersiveMediaBackdrop" aria-hidden="true" style={{filter:`blur(${Math.max(2,(sheetHeight-4)*.24)}px)`,transform:"scale(1.08)"}}>{post.media_url&&post.media_type?.startsWith("image/")?<img src={post.media_url} alt=""/>:post.media_url&&post.media_type?.startsWith("video/")?<canvas ref={backdropCanvasRef} className="immersiveVideoBackdropCanvas" aria-hidden="true"/>:video?<img src={`https://i.ytimg.com/vi/${video}/hqdefault.jpg`} alt=""/>:null}</div><Link href="/posts" className="immersiveStoryClose" aria-label="Close post">×</Link><div className={styles.socialStoryHeader}><Link href={`/profile?section=muslimeen&member=${encodeURIComponent(post.author_id)}`} className="immersiveAuthorLink" aria-label={`View ${post.author_name} profile`}><div className={styles.socialAvatar} aria-hidden="true">{(post.author_name||"M").trim().slice(0,1).toUpperCase()}</div><div className={styles.socialIdentity}><strong>{post.author_name}</strong><span>{post.author_handle} · {new Date(post.created_at).toLocaleDateString(undefined,{month:"short",day:"numeric"})}</span></div></Link><PostAuthorFollow authorId={post.author_id} viewerId={viewerId}/></div>
 {cleanPostBody(post.body).replace(/https?:\/\/\S+/g,"").trim()&&<div className={styles.socialPostCopy}><p>{cleanPostBody(post.body).replace(/https?:\/\/\S+/g,"").trim()}</p></div>}
 {post.media_url&&post.media_type?.startsWith("image/")?<img className={styles.socialStoryImage} src={post.media_url} alt="Post media; double tap to like" loading="eager" fetchPriority="high" decoding="async" onClick={onMediaTap}/>:null}
 {post.media_url&&post.media_type?.startsWith("video/")&&<video ref={playerRef} className="immersiveStoryVideo" src={post.media_url} playsInline autoPlay loop muted={muted} preload="auto" onCanPlay={e=>{const player=e.currentTarget;if(player.paused&&!player.dataset.userPaused)void player.play().catch(()=>{})}} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onLoadedMetadata={e=>{setVideoDuration(Number.isFinite(e.currentTarget.duration)?e.currentTarget.duration:0);setVideoTime(e.currentTarget.currentTime)}} onDurationChange={e=>setVideoDuration(Number.isFinite(e.currentTarget.duration)?e.currentTarget.duration:0)} onTimeUpdate={e=>{setVideoTime(e.currentTarget.currentTime);if(post&&e.currentTarget.currentTime>=3&&!e.currentTarget.paused&&watchedId.current!==post.id){watchedId.current=post.id;rememberWatchedPost(post.id,post.author_id)}}} onPointerDown={holdDown} onPointerMove={holdMove} onPointerUp={holdUp} onPointerCancel={holdUp} onContextMenu={e=>e.preventDefault()} onClick={()=>{if(Date.now()<suppressClickUntil.current)return;togglePlayback()}} aria-label="Post video: tap to play or pause"/>}{post.media_url&&post.media_type?.startsWith("video/")&&videoDuration>0&&<div className={videoSeeking?"immersiveTimeline isSeeking":"immersiveTimeline"} onPointerDown={e=>e.stopPropagation()} onPointerMove={e=>e.stopPropagation()} onPointerUp={e=>e.stopPropagation()} onTouchStart={e=>e.stopPropagation()} onTouchMove={e=>e.stopPropagation()} onTouchEnd={e=>e.stopPropagation()}>
   <div className="immersiveTimelineTrack" aria-hidden="true"><span style={{width:`${Math.min(100,videoTime/videoDuration*100)}%`}}/></div>
   <input type="range" min={0} max={videoDuration} step={0.01} value={Math.min(videoTime,videoDuration)} aria-label="Scrub video timeline" aria-valuetext={`${Math.floor(videoTime/60)}:${String(Math.floor(videoTime%60)).padStart(2,"0")} of ${Math.floor(videoDuration/60)}:${String(Math.floor(videoDuration%60)).padStart(2,"0")}`} onPointerDown={()=>setVideoSeeking(true)} onPointerUp={()=>setVideoSeeking(false)} onPointerCancel={()=>setVideoSeeking(false)} onBlur={()=>setVideoSeeking(false)} onChange={e=>seekStoryVideo(Number(e.target.value))}/>
   {videoSeeking&&<output className="immersiveTimelineTime" aria-live="off">{Math.floor(videoTime/60)}:{String(Math.floor(videoTime%60)).padStart(2,"0")} / {Math.floor(videoDuration/60)}:{String(Math.floor(videoDuration%60)).padStart(2,"0")}</output>}
  </div>}{!post.media_url&&video&&(youtubePlaying?<div className="immersiveYouTubePlayer"><iframe src={`https://www.youtube-nocookie.com/embed/${video}?autoplay=1&playsinline=1&rel=0&loop=1&playlist=${video}` } title="YouTube video in Ummah post" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/></div>:<button type="button" className="immersiveYouTubeStart" onClick={()=>{setYoutubePlaying(true);if(youtubeWatchTimer.current)clearTimeout(youtubeWatchTimer.current);youtubeWatchTimer.current=setTimeout(()=>{if(post&&document.visibilityState==="visible"&&watchedId.current!==post.id){watchedId.current=post.id;rememberWatchedPost(post.id,post.author_id)}},3000)}} aria-label="Play YouTube video"><img src={`https://i.ytimg.com/vi/${video}/hqdefault.jpg`} alt="YouTube video thumbnail"/><span aria-hidden="true">▶</span></button>)}{post.media_url&&post.media_type?.startsWith("video/")&&playFeedback&&<span className="immersivePlaybackFeedback" aria-hidden="true">{playing?"▶":"Ⅱ"}</span>}{playbackBoost>1&&<div className="immersiveFastForward" aria-live="off"><strong>▶▶ {playbackBoost}×</strong>{playbackBoost===2&&<small>Slide right for 5×</small>}</div>}{heartVisible&&<span className="immersiveLikeHeart" aria-hidden="true">♥</span>}
 {!legacyPost&&<nav className="immersiveReactionRail" aria-hidden={sheetHeight>=72} aria-label="Post reactions">{post.media_url&&post.media_type?.startsWith("video/")&&<button type="button" className="immersiveSoundButton" aria-label={muted?"Unmute video":"Mute video"} aria-pressed={!muted} onClick={toggleSound}>{muted?"🔇":"🔊"}</button>}<button type="button" aria-label="Like post" aria-pressed={rail.liked} onClick={()=>void railToggle("like")}><span className={rail.liked?"railLiked":""}>♡</span><small>{rail.likes}</small></button><button type="button" aria-label="Open comments" onClick={()=>setSheetHeight(65)}><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-4-.9L3 21l1.9-4.5a8.5 8.5 0 1 1 15.1-5Z"/></svg><small>{rail.comments}</small></button><button type="button" aria-label="Save post" aria-pressed={rail.saved} onClick={()=>void railToggle("save")}><svg viewBox="0 0 24 24" width="27" height="27" fill={rail.saved?"currentColor":"none"} stroke="currentColor" strokeWidth="2"><path d="M6 3h12v18l-6-4-6 4V3Z"/></svg><small>{rail.saves}</small></button><button type="button" aria-label="Share post" onClick={()=>void railShare()}><svg viewBox="0 0 24 24" width="27" height="27" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 16V3m0 0L7 8m5-5 5 5M4 14v6h16v-6"/></svg><small>{rail.shares}</small></button></nav>}
 </div><div className={"immersiveSheet"+(sheetDragging?" isDragging":"")} style={{height:`${sheetHeight}%`}}><div className="immersiveSheetHandle" role="slider" tabIndex={0} aria-label="Adjust comments height" aria-valuemin={4} aria-valuemax={88} aria-valuenow={Math.round(sheetHeight)} onKeyDown={e=>{if(e.key==="ArrowUp")setSheetHeight(v=>Math.min(88,v+5));if(e.key==="ArrowDown")setSheetHeight(v=>Math.max(4,v-5));if(e.key==="Home")setSheetHeight(4);if(e.key==="End")setSheetHeight(88)}} onPointerDown={e=>{if(e.pointerType==="mouse"&&e.button!==0)return;e.stopPropagation();sheetDrag.current={y:e.clientY,height:sheetHeight,at:performance.now()};setSheetDragging(true);e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(!sheetDrag.current)return;e.stopPropagation();const {y,height}=sheetDrag.current;setSheetHeight(Math.min(88,Math.max(4,height+(y-e.clientY)/window.innerHeight*100)))}} onPointerUp={e=>{e.stopPropagation();const drag=sheetDrag.current;sheetDrag.current=null;setSheetDragging(false);if(drag){const delta=e.clientY-drag.y;const velocity=delta/Math.max(1,performance.now()-drag.at);if(Math.abs(delta)>38&&Math.abs(velocity)>.65)setSheetHeight(velocity>0?4:88);else setSheetHeight(v=>v<25?4:v<65?65:88)}if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId)}} onPointerCancel={()=>{sheetDrag.current=null;setSheetDragging(false)}}><span/></div><div className={styles.socialEngagement}>{legacyPost?<p style={{fontSize:13,color:"#667085"}}>1Muslim community post</p>:<UnifiedPostMedia postId={post.id} mediaUrl={post.media_url} mediaType={post.media_type} youtubeId={video} showVideo={false}/>}</div>
 </div><div className={styles.socialStoryFooter}><div className={styles.socialSwipeNav}><button type="button" disabled={index<=0} onClick={()=>navigate(-1)} aria-label="Previous post">← Previous</button><button type="button" disabled={index<0||index>=postIds.length-1} onClick={()=>navigate(1)} aria-label="Next post">Next →</button></div><Link href="/posts">← MORE POSTS</Link><Link href="/community">EXPLORE COMMUNITY ↗</Link></div></article>}<style jsx global>{`.immersiveStoryPage{position:fixed!important;inset:0!important;z-index:90!important;height:100dvh!important;width:100vw!important;overflow:hidden!important;display:flex;flex-direction:column;padding:0!important;margin:0!important;background:#090a0d!important}.immersiveStory{height:100%!important;min-height:0!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;position:relative!important;margin:0 auto!important;width:min(100%,820px)!important}.immersiveStory [class*="socialStoryEdition"]{display:none!important}.immersiveStoryClose{position:absolute;top:calc(env(safe-area-inset-top,0px) + 12px);right:16px;z-index:15;width:42px;height:42px;display:grid;place-items:center;border-radius:50%;background:#1c2027d9;color:white;text-decoration:none;font-size:32px;line-height:1}.immersiveMedia{position:relative;isolation:isolate}.immersiveMediaBackdrop{position:absolute;inset:0;z-index:0;overflow:hidden;pointer-events:none;transition:filter .06s linear}.immersiveVideoBackdropCanvas{display:block;width:100%;height:100%;object-fit:cover;opacity:.65;pointer-events:none}.immersiveMediaBackdrop img,.immersiveMediaBackdrop video{width:100%;height:100%;object-fit:cover;opacity:.65}.immersiveMedia > :not(.immersiveMediaBackdrop){position:relative;z-index:1}.immersiveStoryVideo{display:block;flex:1;min-height:0;width:100%;height:100%;object-fit:contain;background:transparent}.immersiveMedia{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden;background:#090a0d}.immersiveMedia [class*="socialStoryHeader"]{flex:0 0 auto;padding:calc(env(safe-area-inset-top,0px) + 8px) 62px 8px 14px!important;background:#fff}.immersiveMedia [class*="socialPostCopy"]{flex:0 0 auto;padding:6px 14px!important;max-height:16%;overflow:auto;background:#fff}.immersiveMedia [class*="socialStoryImage"]{display:block!important;flex:1!important;min-height:0!important;width:100%!important;height:100%!important;object-fit:contain!important;background:transparent}.immersiveSheet{position:relative;z-index:2;flex:0 0 auto;min-height:0;max-height:85%;background:#fff;color:#17202d;border-radius:22px 22px 0 0;display:flex;flex-direction:column;overflow:hidden;transition:height .24s ease}.immersiveSheetHandle{height:24px;flex:0 0 24px;display:grid;place-items:center;touch-action:none;cursor:ns-resize}.immersiveSheetHandle span{width:42px;height:5px;border-radius:99px;background:#c4c7cd}.immersiveSheet [class*="socialEngagement"]{min-height:0;flex:1;overflow:hidden;display:flex;flex-direction:column}.immersiveSheet .unifiedPostMedia{height:100%;min-height:0;display:flex;flex-direction:column}.immersiveSheet .socialActionBar{flex:0 0 auto}.immersiveSheet .socialConversation{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden}.immersiveSheet .commentList{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}.immersiveSheet .commentComposer{flex:0 0 auto}.immersiveStory [class*="socialStoryFooter"]{display:none!important}.immersiveStoryPage,.immersiveStoryPage:before,.immersiveStoryPage:after{border:0!important;border-top:0!important;border-radius:0!important;box-shadow:none!important}.immersiveStory{max-width:100vw!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:#090a0d!important;animation:none!important}.immersiveMedia{border:0!important;border-radius:0!important}.immersiveMedia [class*="socialStoryHeader"]{background:#090a0d!important;color:#fff!important;border:0!important;gap:10px!important;padding:calc(env(safe-area-inset-top,0px) + 10px) 62px 10px 14px!important}.immersiveMedia [class*="socialIdentity"] strong{color:#fff!important}.immersiveMedia [class*="socialIdentity"] span{color:#bfc3ca!important}.immersiveMedia [class*="socialPostCopy"]{background:#090a0d!important;color:#f5f5f5!important;border:0!important;max-height:12%!important}.immersiveMedia [class*="socialPostCopy"] p{font-family:Arial,Helvetica,sans-serif!important;color:#f5f5f5!important;font-size:15px!important;line-height:1.4!important;letter-spacing:0!important}.immersiveSheet{border:0!important;border-top:0!important;border-radius:20px 20px 0 0!important;box-shadow:none!important}.immersiveSheet .socialComment{display:flex!important;flex-direction:row!important;align-items:flex-start!important;gap:10px!important;padding:10px 0!important}.immersiveSheet .socialComment>.commentAvatar{position:static!important;flex:0 0 32px!important;width:32px!important;height:32px!important;min-width:32px!important;min-height:32px!important;max-width:32px!important;max-height:32px!important;margin:0!important;float:none!important}.immersiveSheet .socialComment>.commentAvatar img{width:32px!important;height:32px!important;object-fit:cover!important}.immersiveSheet .socialComment>.commentMain{display:block!important;flex:1 1 0!important;min-width:0!important;margin:0!important;padding:0!important;text-align:left!important}.immersiveSheet .commentByline{display:flex!important;flex-direction:row!important;align-items:baseline!important;justify-content:flex-start!important;gap:8px!important;min-height:18px!important;margin:0!important}.immersiveSheet .commentByline a{display:inline!important;font-size:13px!important;font-weight:700!important;line-height:18px!important}.immersiveSheet .commentByline time{display:inline!important;font-size:11px!important}.immersiveSheet .commentMain>p{margin:3px 0 5px!important;font-size:14px!important;line-height:1.45!important}.immersiveSheet .commentActions{margin:0!important;justify-content:flex-start!important}.immersiveSheet .socialComment.child{margin-left:22px!important}.immersiveSheet .commentComposer{position:relative!important;margin:0!important;padding:10px 10px calc(10px + env(safe-area-inset-bottom,0px))!important;background:#fff!important;border-top:1px solid #e6e8ed!important}.immersiveSheet .commentList{padding:0 12px!important}.immersiveSheet .socialConversation{padding:6px 0 0!important}.immersiveSheet .conversationTitle{padding:4px 12px 8px!important}.immersiveSheet .commentComposer input:not([type=file]){background:#f1f2f4!important}.immersiveSheet .commentComposer button[type=submit]{background:#1d2633!important}.immersiveStoryClose{top:calc(env(safe-area-inset-top,0px) + 8px)!important}
.immersiveAuthorLink{display:flex;align-items:center;gap:8px;min-width:0;flex:1;text-decoration:none;color:inherit;pointer-events:auto}.immersiveAuthorLink [class*="socialIdentity"]{flex:1;min-width:0}
.immersiveLikeHeart{position:absolute;top:42%;left:50%;z-index:14;transform:translate(-50%,-50%);font-size:clamp(90px,17vw,150px);line-height:1;color:#ff3d72;text-shadow:0 4px 30px #0009;pointer-events:none;animation:immersiveLikePop .72s ease-out both}@keyframes immersiveLikePop{0%{opacity:0;transform:translate(-50%,-50%) scale(.5)}22%{opacity:1;transform:translate(-50%,-50%) scale(1.16)}65%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-58%) scale(1.06)}}@media(prefers-reduced-motion:reduce){.immersiveLikeHeart{animation:none}}
/* Full-bleed immersive post: media owns the entire viewport, controls float above it. */
.immersiveStoryPage{background:#08090c!important}
.immersiveStory{position:relative!important;width:100vw!important;max-width:100vw!important;height:100dvh!important;border:0!important;border-radius:0!important;background:#08090c!important}
.immersiveMedia{position:absolute!important;inset:0!important;display:block!important;width:100%!important;height:100%!important;overflow:hidden!important;background:#08090c!important}
.immersiveMedia [class*="socialStoryHeader"]{position:absolute!important;top:0!important;left:0!important;right:0!important;z-index:12!important;display:flex!important;align-items:center!important;gap:10px!important;width:100%!important;min-height:90px!important;margin:0!important;padding:calc(env(safe-area-inset-top,0px) + 12px) 76px 18px 16px!important;border:0!important;background:linear-gradient(to bottom,rgba(0,0,0,.48),rgba(0,0,0,0))!important;color:#fff!important;box-shadow:none!important;pointer-events:none}
.immersiveMedia [class*="socialStoryHeader"]>*{pointer-events:auto}
.immersiveMedia [class*="socialAvatar"]{width:44px!important;height:44px!important;min-width:44px!important;flex:0 0 44px!important;box-shadow:none!important;border:2px solid #fff!important;background:#1b303d!important;opacity:1!important}
.immersiveMedia [class*="socialIdentity"]{min-width:0!important;flex:1 1 0!important;gap:3px!important;padding:5px 8px!important;border-radius:10px!important;background:rgba(0,0,0,.5)!important;backdrop-filter:blur(8px)!important;-webkit-backdrop-filter:blur(8px)!important}
.immersiveMedia [class*="socialIdentity"] strong{font-size:14px!important;color:#fff!important;line-height:1.15!important}
.immersiveMedia [class*="socialIdentity"] span{font-size:11px!important;color:#f1f2f4!important;line-height:1.3!important}
.immersiveMedia [class*="socialStoryHeader"] .postAuthorFollow{margin-left:auto!important;flex:0 0 auto!important}.immersiveMedia [class*="socialStoryHeader"] button{background:rgba(0,0,0,.5)!important;color:#fff!important;border:1px solid rgba(255,255,255,.4)!important;border-radius:999px!important;box-shadow:none!important;backdrop-filter:blur(8px)!important;-webkit-backdrop-filter:blur(8px)!important;white-space:nowrap!important}
.immersiveStoryClose{position:absolute!important;top:calc(env(safe-area-inset-top,0px) + 14px)!important;right:14px!important;z-index:20!important;width:42px!important;height:42px!important;background:rgba(0,0,0,.5)!important;color:#fff!important;border:1px solid rgba(255,255,255,.24)!important;backdrop-filter:blur(8px)!important;-webkit-backdrop-filter:blur(8px)!important;opacity:1!important}
.immersiveMedia [class*="socialPostCopy"]{position:absolute!important;z-index:10!important;left:0!important;right:0!important;bottom:calc(var(--comments-height,45%) - 3px)!important;width:100%!important;max-height:18%!important;margin:0!important;padding:24px 18px 14px!important;background:linear-gradient(transparent,rgba(0,0,0,.62))!important;color:#fff!important;pointer-events:none}
.immersiveMedia [class*="socialPostCopy"] p{color:#fff!important;font-family:Arial,Helvetica,sans-serif!important;font-size:15px!important;line-height:1.4!important;letter-spacing:0!important;text-shadow:0 1px 4px #0009!important}
.immersiveMedia [class*="socialStoryImage"]{position:absolute!important;inset:0!important;display:block!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;min-height:0!important;object-fit:contain!important;object-position:center center!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:#08090c!important;animation:none!important}
.immersiveSheet{position:absolute!important;bottom:0!important;left:0!important;right:0!important;z-index:15!important;width:100%!important;max-height:88%!important;margin:0!important;flex:none!important;border-radius:22px 22px 0 0!important;background:#fff!important;box-shadow:0 -8px 28px rgba(0,0,0,.12)!important}
.immersiveSheet .commentList{overscroll-behavior:contain!important}
.immersiveSheet.isDragging{transition:none!important}.immersiveSheetHandle{height:30px!important;flex-basis:30px!important;touch-action:none!important;user-select:none!important;-webkit-user-select:none!important}.immersiveMedia [class*="socialStoryImage"]{height:calc(100% - min(10%,var(--comments-height,45%)))!important;bottom:auto!important;object-fit:contain!important;background:#08090c!important;transition:height .18s ease!important}.immersiveStory:has(.immersiveSheet.isDragging) .immersiveMedia [class*="socialStoryImage"]{transition:none!important}.immersiveMedia [class*="socialPostCopy"]{transition:bottom .18s ease!important}.immersiveStory:has(.immersiveSheet.isDragging) .immersiveMedia [class*="socialPostCopy"]{transition:none!important}
@media(max-width:430px){.immersiveMedia [class*="socialStoryHeader"]{gap:7px!important;padding-left:12px!important;padding-right:64px!important}.immersiveMedia [class*="socialAvatar"]{width:38px!important;height:38px!important;min-width:38px!important;flex-basis:38px!important}.immersiveMedia [class*="socialIdentity"]{padding:4px 6px!important}.immersiveMedia [class*="socialIdentity"] strong{font-size:12px!important}.immersiveMedia [class*="socialIdentity"] span{font-size:10px!important}.immersiveStoryClose{right:9px!important;width:39px!important;height:39px!important}}
`}</style><style jsx global>{`
/* The media and comments are complementary regions: neither overlaps the other. */
.immersiveStory .immersiveMedia{height:calc(100% - var(--comments-height,5%))!important;bottom:auto!important;transition:height .25s cubic-bezier(.2,.8,.2,1)!important}
.immersiveStory:has(.immersiveSheet.isDragging) .immersiveMedia{transition:none!important}
.immersiveStory .immersiveMedia [class*="socialStoryImage"],.immersiveStory .immersiveStoryVideo{height:100%!important;max-height:100%!important;object-fit:contain!important}
.immersiveStory .immersiveMedia [class*="socialPostCopy"]{bottom:0!important;padding-right:76px!important}
.immersiveStory .immersiveSheet{height:var(--comments-height,5%)!important;min-height:0!important}
.immersiveStory .immersiveReactionRail{position:absolute;z-index:18;right:12px;bottom:20px;display:flex;flex-direction:column;align-items:center;gap:17px;opacity:1;transform:translateX(0);transition:opacity .22s ease,transform .22s ease;animation:railEnter .36s ease-out both}
.immersiveStory .immersiveReactionRail.railHidden{opacity:0;transform:translateX(24px);pointer-events:none}
.immersiveStory .immersiveReactionRail button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;width:52px;min-height:49px;padding:3px;border:0;background:transparent;color:white;text-shadow:0 2px 7px #000;filter:drop-shadow(0 2px 3px #0009);cursor:pointer}
.immersiveStory .immersiveReactionRail button>span{font-size:37px;line-height:1;font-family:Arial,sans-serif}.immersiveStory .immersiveReactionRail button>small{font-size:12px;font-weight:700}.immersiveStory .immersiveReactionRail .railLiked{color:#ff4b78}
.immersiveStory .immersiveReactionRail button:focus-visible{outline:2px solid white;border-radius:8px}
@keyframes railEnter{from{opacity:0;transform:translateX(18px) scale(.94)}to{opacity:1;transform:translateX(0) scale(1)}}
@media(prefers-reduced-motion:reduce){.immersiveStory .immersiveReactionRail,.immersiveStory .immersiveMedia{animation:none!important;transition:none!important}}
 .immersiveStory .immersiveReactionRail{gap:var(--rail-gap,17px)!important;opacity:var(--rail-opacity,1)!important;transform:scale(var(--rail-scale,1))!important;transform-origin:right bottom!important;transition:opacity .24s ease,transform .24s ease,gap .24s ease!important;animation:none!important;pointer-events:auto}.immersiveStory:has(.immersiveSheet.isDragging) .immersiveReactionRail{transition:none!important}.immersiveStory .immersiveReactionRail[aria-hidden="true"]{pointer-events:none!important}  .immersiveStory .immersiveMedia [class*="socialStoryHeader"]{position:absolute!important;z-index:21!important;top:calc(env(safe-area-inset-top,0px) + 8px)!important;left:10px!important;right:60px!important;width:auto!important;min-height:0!important;background:transparent!important;padding:0!important}
.immersiveStory .immersiveMedia [class*="socialAvatar"]{transform:scale(var(--avatar-scale,1))!important;transform-origin:top left!important;transition:transform .25s ease!important}
.immersiveStory .immersiveMedia [class*="socialIdentity"],.immersiveStory .immersiveMedia [class*="socialStoryHeader"] .postAuthorFollow,.immersiveStory .immersiveStoryClose{opacity:calc(1 - var(--header-progress,0))!important;transform:translateY(calc(-12px * var(--header-progress,0)))!important;transition:opacity .25s ease,transform .25s ease!important}
.immersiveStory:has(.immersiveSheet.isDragging) .immersiveMedia [class*="socialAvatar"],.immersiveStory:has(.immersiveSheet.isDragging) .immersiveMedia [class*="socialIdentity"],.immersiveStory:has(.immersiveSheet.isDragging) .immersiveMedia [class*="socialStoryHeader"] .postAuthorFollow,.immersiveStory:has(.immersiveSheet.isDragging) .immersiveStoryClose{transition:none!important}
`}</style><style jsx>{`.immersiveYouTubeStart,.immersiveYouTubePlayer{position:relative;width:100%;aspect-ratio:16/9;max-height:68dvh;background:#000;overflow:hidden;border:0;padding:0}.immersiveYouTubeStart{cursor:pointer;display:block}.immersiveYouTubeStart img{width:100%;height:100%;object-fit:contain;display:block}.immersiveYouTubeStart span{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:64px;height:64px;border-radius:50%;display:grid;place-items:center;background:#f00;color:#fff;font-size:26px;box-shadow:0 5px 20px #0008}.immersiveYouTubePlayer iframe{position:absolute;inset:0;width:100%;height:100%;border:0}`}</style><style jsx global>{`
/* Native full-screen playback: a slim 3px rail inside a 48px touch target. */
 .immersiveStory .immersiveMedia > .immersiveTimeline{position:absolute!important;left:10px!important;right:10px!important;bottom:0!important;height:48px!important;z-index:26!important;display:block!important;touch-action:none!important;pointer-events:auto!important}
 .immersiveTimelineTrack{position:absolute;left:0;right:0;bottom:2px;height:3px;border-radius:999px;background:#ffffff66;overflow:hidden;pointer-events:none;transition:height .12s ease}
 .immersiveTimelineTrack span{display:block;width:0;height:100%;background:#fff;border-radius:inherit;box-shadow:0 0 6px #fff8}
 .immersiveTimeline.isSeeking .immersiveTimelineTrack,.immersiveTimeline:focus-within .immersiveTimelineTrack{height:5px}
 .immersiveTimeline input{position:absolute;inset:0;width:100%;height:48px;margin:0;border:0;appearance:none;-webkit-appearance:none;background:transparent;cursor:pointer;touch-action:none}
 .immersiveTimeline input::-webkit-slider-runnable-track{height:48px;background:transparent}.immersiveTimeline input::-moz-range-track{height:48px;background:transparent}
 .immersiveTimeline input::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:18px;height:18px;margin-top:15px;background:transparent;border:0}
 .immersiveTimeline input::-moz-range-thumb{width:18px;height:18px;background:transparent;border:0}
 .immersiveTimeline input:focus-visible{outline:2px solid #fff;border-radius:8px}
 .immersiveTimelineTime{position:absolute;right:0;bottom:35px;z-index:1;background:#080d0bd9;color:#fff;border-radius:12px;padding:4px 9px;font-size:12px;font-weight:700;pointer-events:none}
 .immersiveStory .immersiveMedia [class*="socialPostCopy"]{bottom:50px!important}
 .immersiveFastForward{position:absolute!important;z-index:24!important;top:21%!important;left:50%!important;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:4px;background:#090d0dcc;backdrop-filter:blur(12px);color:#fff;padding:10px 18px;border:1px solid #ffffff55;border-radius:17px;white-space:nowrap;pointer-events:none}
 .immersiveFastForward strong{font-size:22px}.immersiveFastForward small{font-size:12px}
 /* Video uses this story route, not PostViewer. Strip its actual frame. */
.immersiveStoryPage:has(.immersiveStoryVideo),.immersiveStoryPage:has(.immersiveStoryVideo) .immersiveStory,.immersiveStoryPage:has(.immersiveStoryVideo) .immersiveMedia,.immersiveStoryPage:has(.immersiveStoryVideo) .immersiveStoryVideo{border:0!important;border-radius:0!important;outline:0!important;box-shadow:none!important;filter:none!important}
.immersiveStoryPage:has(.immersiveStoryVideo) .immersiveStory{width:100vw!important;max-width:none!important;margin:0!important;padding:0!important}
.immersiveStoryVideo{-webkit-appearance:none;appearance:none;cursor:pointer;touch-action:pan-y;-webkit-touch-callout:none;user-select:none;-webkit-user-select:none}
.immersiveStory .immersiveReactionRail .immersiveSoundButton{font-size:25px;line-height:1;min-height:45px;margin-bottom:1px;filter:drop-shadow(0 2px 5px #000c)}
.immersivePlaybackFeedback{position:absolute;z-index:16;top:50%;left:50%;transform:translate(-50%,-50%);font-size:64px;color:#fff;text-shadow:0 3px 15px #000b;pointer-events:none;animation:immersivePlaybackFade .75s ease-out forwards}
@keyframes immersivePlaybackFade{0%{opacity:1}65%{opacity:1}100%{opacity:0}}
@media(prefers-reduced-motion:reduce){.immersivePlaybackFeedback{animation:none;opacity:1}}
`}</style></main>;
}
