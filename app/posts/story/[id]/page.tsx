"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {cleanPostBody} from "../../../lib/cleanPostBody";
import {useParams,useRouter} from "next/navigation";
import styles from "../../posts-magazine.module.css";
import UnifiedPostMedia from "../../../components/UnifiedPostMedia";
import {youtubeIdFromPost,youtubeThumbnail} from "../../../lib/ummah-youtube";
import ImmersiveYouTubePlayer from "../../../components/ImmersiveYouTubePlayer";
import {createClient} from "../../../../utils/supabase/client";
import PostAuthorFollow from "../../../components/PostAuthorFollow";
import {readImmersiveQueue,rememberWatchedPost} from "../../../lib/ummah-watch-history";
import {predictVideo,cachePublicImage} from "../../../../lib/smart-media";
type PostMedia={url:string;type:string};
type Post={id:string;body:string;author_name:string;author_handle:string;created_at:string;media_url:string|null;media_type:string|null;media_items?:PostMedia[];author_id:string};

type StoryFeed={posts:Post[];viewer_id:string|null};
function StoryAlbum({media}:{media:PostMedia[]}){
 const [index,setIndex]=useState(0);
 const touch=useRef<number|null>(null);
 const item=media[index]||media[0];
 const move=(direction:number)=>setIndex(value=>(value+direction+media.length)%media.length);
 return <div className={styles.storyAlbum} aria-label={"Post with "+media.length+" media items"} onTouchStart={event=>{touch.current=event.touches[0]?.clientX??null}} onTouchEnd={event=>{if(touch.current===null)return;const change=event.changedTouches[0]?.clientX-touch.current;touch.current=null;if(Math.abs(change)>44)move(change<0?1:-1)}}>
  {item.type.startsWith("video/")?<video key={item.url} src={item.url} controls playsInline preload="metadata" className={styles.storyAlbumMedia}/>:<img key={item.url} src={item.url} alt={"Gallery photo "+(index+1)} className={styles.storyAlbumMedia}/>}
  <div className={styles.storyAlbumControls}><button type="button" aria-label="Previous gallery media" onClick={()=>move(-1)}>‹</button><span>{index+1} / {media.length}</span><button type="button" aria-label="Next gallery media" onClick={()=>move(1)}>›</button></div>
 </div>;
}
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
 const router=useRouter(),touchStart=useRef<{x:number;y:number}|null>(null);const params=useParams(),id=String(params.id||"");const sheetDrag=useRef<{y:number;height:number;at:number}|null>(null);const sheetBeforeKeyboard=useRef<number|null>(null);const [playMode,setPlayMode]=useState(false),[focusCommentId,setFocusCommentId]=useState<string|null>(null),[sheetDragging,setSheetDragging]=useState(false);const [visualViewportSize,setVisualViewportSize]=useState<{height:number;top:number}|null>(null);const [sheetHeight,setSheetHeight]=useState(5),[post,setPost]=useState<Post|null>(null),[legacyPost,setLegacyPost]=useState(false),[viewerId,setViewerId]=useState<string|null>(null),[postIds,setPostIds]=useState<string[]>([]),[loading,setLoading]=useState(true);
 useEffect(()=>{
  let active=true;
  const mode=new URLSearchParams(window.location.search).get("play")==="1";
  setPlayMode(mode);setLoading(true);
  const linkedComment=new URLSearchParams(window.location.search).get("comment");
  const validComment=linkedComment&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(linkedComment)?linkedComment:null;
  setFocusCommentId(validComment);
  if(validComment)setSheetHeight(75);

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
     // Discover can link to posts older than the latest feed page. Load that exact post.
     const {data:ummah}=await db.from("ummah_feed_posts").select("id,body,created_at,author_id").eq("id",id).maybeSingle();
     if(!active)return;
     if(ummah){
      const [profile,attachment]=await Promise.all([
       db.from("profiles").select("display_name,username,hide_1muslim_id").eq("id",ummah.author_id).maybeSingle(),
       db.from("post_media").select("storage_path,mime_type").eq("community_post_id",id).order("storage_path",{ascending:true})
      ]);
      if(!active)return;
      const assets=attachment.data||[];
      const media=assets[0];
      const media_items=assets.map(asset=>({url:db.storage.from("community-media").getPublicUrl(asset.storage_path).data.publicUrl,type:asset.mime_type}));
      const mediaUrl=media_items[0]?.url||null;
      setPost({id:ummah.id,body:ummah.body||"",created_at:ummah.created_at,author_id:ummah.author_id,
       author_name:profile.data?.display_name||(!profile.data?.hide_1muslim_id?profile.data?.username:null)||"1Muslim Member",
       author_handle:!profile.data?.hide_1muslim_id&&profile.data?.username?"@"+profile.data.username:"",media_url:mediaUrl,media_type:media?.mime_type||null,media_items});
      setLegacyPost(false);
      setPostIds(current=>current.includes(id)?current:[id,...current]);
      return;
     }
     const {data:row}=await db.from("posts").select("id,body,created_at,user_id").eq("id",id).maybeSingle();
     if(!row||!active)return;
     const {data:author}=await db.from("profiles").select("display_name,username,hide_1muslim_id").eq("id",row.user_id).maybeSingle();
     if(active){setPost({id:row.id,body:row.body||"",created_at:row.created_at,author_id:row.user_id,author_name:author?.display_name||"1Muslim Member",author_handle:!author?.hide_1muslim_id&&author?.username?"@"+author.username:"",media_url:null,media_type:null});setLegacyPost(true)}
    })();
   }
  };
  if(cachedStoryFeed&&Date.now()<feedCacheUntil)apply(cachedStoryFeed);
  void getStoryFeed().then(apply).catch(()=>{}).finally(()=>{if(active)setLoading(false)});
  return()=>{active=false};
 },[id]);
 const introDone=useRef(false);
 useEffect(()=>{
  if(!post?.id||focusCommentId||typeof window==="undefined")return;
  introDone.current=false;setSheetHeight(5);
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const up=window.setTimeout(()=>{if(!introDone.current)setSheetHeight(15)},210);
  const down=window.setTimeout(()=>{if(!introDone.current)setSheetHeight(5)},1260);
  return()=>{clearTimeout(up);clearTimeout(down)};
 },[post?.id,focusCommentId]);
 const lastMediaTap=useRef(0);
 const [heartVisible,setHeartVisible]=useState(false);const [rail,setRail]=useState({likes:0,comments:0,saves:0,shares:0,liked:false,saved:false});
 const likeFromMedia=async()=>{if(!post||legacyPost)return;setHeartVisible(true);window.setTimeout(()=>setHeartVisible(false),720);try{const r=await fetch("/api/ummah-post-engagement?postId="+encodeURIComponent(post.id),{cache:"no-store"});if(!r.ok)return;const data=await r.json();if(data.liked)return;const response=await fetch("/api/ummah-post-engagement",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({postId:post.id,kind:"like"})});if(response.ok)window.dispatchEvent(new CustomEvent("ummah-post-engagement-changed",{detail:{postId:post.id}}))}catch{}};
 const onMediaTap=()=>{const now=Date.now();if(now-lastMediaTap.current<340){lastMediaTap.current=0;void likeFromMedia()}else lastMediaTap.current=now};
 useEffect(()=>{if(!id)return;let active=true;const refresh=async()=>{try{const r=await fetch("/api/ummah-post-engagement?postId="+encodeURIComponent(id),{cache:"no-store"});if(r.ok&&active){const j=await r.json();setRail({likes:j.likes||0,comments:j.comments||0,saves:j.saves||0,shares:j.shares||0,liked:!!j.liked,saved:!!j.saved})}}catch{}};void refresh();const listener=(e:Event)=>{if((e as CustomEvent<{postId:string}>).detail?.postId===id)void refresh()};window.addEventListener("ummah-post-engagement-changed",listener);return()=>{active=false;window.removeEventListener("ummah-post-engagement-changed",listener)}},[id]);
 const railToggle=async(kind:"like"|"save")=>{if(!post||legacyPost)return;try{const r=await fetch("/api/ummah-post-engagement",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({postId:post.id,kind})});if(r.ok)window.dispatchEvent(new CustomEvent("ummah-post-engagement-changed",{detail:{postId:post.id}}))}catch{}};
 const railShare=async()=>{if(!post)return;const url=location.origin+"/posts/story/"+encodeURIComponent(post.id);try{if(navigator.share)await navigator.share({url});else await navigator.clipboard.writeText(url);await fetch("/api/ummah-post-engagement",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({postId:post.id,kind:"share"})});window.dispatchEvent(new CustomEvent("ummah-post-engagement-changed",{detail:{postId:post.id}}))}catch{}};
 const playerRef=useRef<HTMLVideoElement|null>(null),backdropCanvasRef=useRef<HTMLCanvasElement|null>(null);
 const scrubRef=useRef<{pointerId:number;time:number}|null>(null);
 const lastScrubSeekAt=useRef(0);
 const [scrubPreview,setScrubPreview]=useState<number|null>(null);
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
 const seekStoryVideo=(seconds:number)=>{const el=playerRef.current;if(!el||!Number.isFinite(el.duration)||el.duration<=0)return;const next=Math.max(0,Math.min(seconds,el.duration));el.currentTime=next;setVideoTime(next)};
 const timelineTimeAt=(clientX:number,rect:DOMRect)=>videoDuration*Math.min(1,Math.max(0,(clientX-rect.left)/Math.max(1,rect.width)));
 const scrubTo=(clientX:number,rect:DOMRect,commit=false)=>{
  const next=timelineTimeAt(clientX,rect);
  if(scrubRef.current)scrubRef.current.time=next;
  // Keep the visible line and thumb under the finger, even if remote seeking lags.
  setScrubPreview(next);
  if(commit||performance.now()-lastScrubSeekAt.current>110){
   seekStoryVideo(next);lastScrubSeekAt.current=performance.now();
  }
 };
 const finishScrub=(element:HTMLDivElement,pointerId:number)=>{
  const scrub=scrubRef.current;
  if(!scrub||scrub.pointerId!==pointerId)return;
  seekStoryVideo(scrub.time);
  scrubRef.current=null;setVideoSeeking(false);setScrubPreview(null);
  if(element.hasPointerCapture(pointerId))element.releasePointerCapture(pointerId);
 };
 const onTimelineDown=(e:React.PointerEvent<HTMLDivElement>)=>{
  if(e.pointerType==="mouse"&&e.button!==0)return;
  const player=playerRef.current;
  if(!player||!Number.isFinite(videoDuration)||videoDuration<=0)return;
  e.preventDefault();e.stopPropagation();
  scrubRef.current={pointerId:e.pointerId,time:0};setVideoSeeking(true);
  lastScrubSeekAt.current=0;
  e.currentTarget.setPointerCapture(e.pointerId);
  scrubTo(e.clientX,e.currentTarget.getBoundingClientRect(),true);
 };
 const onTimelineMove=(e:React.PointerEvent<HTMLDivElement>)=>{
  if(scrubRef.current?.pointerId!==e.pointerId)return;
  e.preventDefault();e.stopPropagation();
  scrubTo(e.clientX,e.currentTarget.getBoundingClientRect());
 };
 const onTimelineUp=(e:React.PointerEvent<HTMLDivElement>)=>{
  if(scrubRef.current?.pointerId!==e.pointerId)return;
  e.preventDefault();e.stopPropagation();
  scrubTo(e.clientX,e.currentTarget.getBoundingClientRect(),true);
  finishScrub(e.currentTarget,e.pointerId);
 };
 const onTimelineCancel=(e:React.PointerEvent<HTMLDivElement>)=>{
  e.stopPropagation();
  finishScrub(e.currentTarget,e.pointerId);
 };
 useEffect(()=>{scrubRef.current=null;setScrubPreview(null);setVideoSeeking(false);setVideoTime(0);setVideoDuration(0)},[id]);
 useEffect(()=>{
  const release=()=>{const g=holdRef.current;if(!g)return;if(g.active){suppressClickUntil.current=Date.now()+550;suppressNavUntil.current=Date.now()+550}releaseHold()};
  window.addEventListener("pointerup",release);window.addEventListener("pointercancel",release);
  return()=>{window.removeEventListener("pointerup",release);window.removeEventListener("pointercancel",release);const g=holdRef.current;if(g){if(g.timer!==null)window.clearTimeout(g.timer);g.video.playbackRate=1;holdRef.current=null}};
 },[id]);
 // Muted autoplay is required by mobile browsers. A user gesture explicitly
 // unlocks the track; tapping a playing, muted video should NOT pause it.
 const [muted,setMuted]=useState(true),[playerHint,setPlayerHint]=useState("");
 const feedbackTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const firstPlaybackHint=useRef<string|null>(null);
 const watchedId=useRef<string|null>(null);
 const showPlayerHint=(message:string)=>{
  setPlayerHint(message);
  if(feedbackTimer.current)clearTimeout(feedbackTimer.current);
  feedbackTimer.current=setTimeout(()=>setPlayerHint(""),1000);
 };
 useEffect(()=>{watchedId.current=null;firstPlaybackHint.current=null;setMuted(true);setPlayerHint("")},[id]);
 useEffect(()=>()=>{if(feedbackTimer.current)clearTimeout(feedbackTimer.current)},[]);
 const unmutePlayer=(player:HTMLVideoElement)=>{
  player.muted=false;player.defaultMuted=false;setMuted(false);
 };
 const togglePlayback=()=>{
  const player=playerRef.current;if(!player)return;
  if(player.paused){
   delete player.dataset.userPaused;
   if(player.muted)unmutePlayer(player);
   void player.play().catch(()=>showPlayerHint("Tap to play"));
   showPlayerHint("Playing with sound");
  }else if(player.muted){
   unmutePlayer(player);
   showPlayerHint("Sound on");
  }else{
   player.dataset.userPaused="true";player.pause();
   showPlayerHint("Tap to play");
  }
 };
 const toggleSound=()=>{
  const player=playerRef.current;if(!player)return;
  if(player.muted){unmutePlayer(player);showPlayerHint("Sound on")}
  else{player.muted=true;player.defaultMuted=true;setMuted(true);showPlayerHint("Tap for sound")}
 };
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
 const hasGallery=!!post?.media_items&&post.media_items.length>1;
 const video=post&&!post.media_type?.startsWith("video/")&&!hasGallery?youtubeIdFromPost(post.body,post.media_url):null;
 const seekDisplayTime=scrubPreview===null?videoTime:scrubPreview;
 const seekPercent=videoDuration>0?Math.max(0,Math.min(100,seekDisplayTime/videoDuration*100)):0;
 const fmtPlayback=(time:number)=>Math.floor(time/60)+":"+String(Math.floor(time%60)).padStart(2,"0");
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
 // Use the visible viewport, not the layout viewport: when iOS opens the
 // keyboard, the video stays mounted and the existing slide-up sheet grows
 // upward while the composer stays directly above the keys.
 useEffect(()=>{
  const vv=window.visualViewport;
  if(!vv)return;
  let frame=0;
  const update=()=>{
   if(frame)cancelAnimationFrame(frame);
   frame=requestAnimationFrame(()=>{
    setVisualViewportSize(previous=>{
     const height=Math.round(vv.height),top=Math.round(vv.offsetTop);
     return previous?.height===height&&previous.top===top?previous:{height,top};
    });
    frame=0;
   });
  };
  update();vv.addEventListener("resize",update);vv.addEventListener("scroll",update);
  return()=>{vv.removeEventListener("resize",update);vv.removeEventListener("scroll",update);if(frame)cancelAnimationFrame(frame)};
 },[]);
 const onComposerFocus=(target:EventTarget)=>{
  if(!(target instanceof HTMLElement)||!target.matches('[contenteditable="true"],textarea,input:not([type="file"])')||!target.closest(".immersiveSheet"))return;
  if(sheetBeforeKeyboard.current===null)sheetBeforeKeyboard.current=sheetHeight;
  introDone.current=true;setSheetHeight(82);
 };
 const onComposerBlur=()=>{
  window.setTimeout(()=>{
   if(document.activeElement instanceof HTMLElement&&document.activeElement.closest(".immersiveSheet [contenteditable='true'],.immersiveSheet textarea,.immersiveSheet input:not([type=file])"))return;
   if(sheetBeforeKeyboard.current!==null){setSheetHeight(Math.max(60,sheetBeforeKeyboard.current));sheetBeforeKeyboard.current=null;}
  },160);
 };
 return <main className={`${styles.page} immersiveStoryPage`} style={{"--imm-visual-height":visualViewportSize?visualViewportSize.height+"px":"100dvh","--imm-visual-top":visualViewportSize?visualViewportSize.top+"px":"0px"} as React.CSSProperties} onFocusCapture={e=>onComposerFocus(e.target)} onBlurCapture={onComposerBlur}>{loading?<div className={styles.status}>OPENING THE STORY…</div>:!post?<div className={styles.status}>STORY UNAVAILABLE · <Link href="/posts">BACK TO POSTS</Link></div>:<article className={`${styles.socialStory} immersiveStory`} style={{"--comments-height":`${sheetHeight}%`,"--rail-scale":String(1-.48*Math.min(1,Math.max(0,(sheetHeight-5)/65))),"--rail-opacity":String(1-Math.min(1,Math.max(0,(sheetHeight-48)/24))),"--rail-gap":`${17-9*Math.min(1,Math.max(0,(sheetHeight-5)/65))}px`,"--header-progress":String(Math.min(1,Math.max(0,(sheetHeight-5)/55))),"--avatar-scale":String(1-.42*Math.min(1,Math.max(0,(sheetHeight-5)/55)))} as React.CSSProperties} onTouchStart={e=>{const target=e.target as HTMLElement;if(target.closest("input,textarea,button,iframe,.unifiedPostMedia,.immersiveTimeline,[role=slider],[class*=storyAlbum]")||!playMode&&target.closest("video"))return;touchStart.current={x:e.touches[0].clientX,y:e.touches[0].clientY}}} onTouchEnd={e=>{if(Date.now()<suppressNavUntil.current){touchStart.current=null;return}const start=touchStart.current;touchStart.current=null;if(!start)return;const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;if(playMode&&Math.abs(dy)>72&&Math.abs(dy)>Math.abs(dx)*1.2){navigate(dy<0?1:-1);return}if(Math.abs(dx)>85&&Math.abs(dx)>Math.abs(dy)*1.5)navigate(dx<0?1:-1)}}>
 <div className={styles.socialStoryEdition}><span>THE PEOPLE'S EDITION</span><span>{new Date(post.created_at).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}</span></div>
 <div className="immersiveMedia"><div className="immersiveMediaBackdrop" aria-hidden="true" style={{filter:`blur(${Math.max(2,(sheetHeight-4)*.24)}px)`,transform:"scale(1.08)"}}>{video?<img src={youtubeThumbnail(video)} alt=""/>:post.media_url&&post.media_type?.startsWith("image/")?<img src={post.media_url} alt=""/>:post.media_url&&post.media_type?.startsWith("video/")?<canvas ref={backdropCanvasRef} className="immersiveVideoBackdropCanvas" aria-hidden="true"/>:null}</div><Link href="/posts" className="immersiveStoryClose" aria-label="Close post">×</Link><div className={styles.socialStoryHeader}><Link href={`/profile?section=muslimeen&member=${encodeURIComponent(post.author_id)}`} className="immersiveAuthorLink" aria-label={`View ${post.author_name} profile`}><div className={styles.socialAvatar} aria-hidden="true">{(post.author_name||"M").trim().slice(0,1).toUpperCase()}</div><div className={styles.socialIdentity}><strong>{post.author_name}</strong><span>{post.author_handle} · {new Date(post.created_at).toLocaleDateString(undefined,{month:"short",day:"numeric"})}</span></div></Link><PostAuthorFollow authorId={post.author_id} viewerId={viewerId}/></div>
 
 {hasGallery&&post.media_items&&<StoryAlbum media={post.media_items}/>}
 {!hasGallery&&!video&&post.media_url&&post.media_type?.startsWith("image/")?<img className={styles.socialStoryImage} src={post.media_url} alt="Post media; double tap to like" loading="eager" fetchPriority="high" decoding="async" onClick={onMediaTap}/>:null}
 {!hasGallery&&post.media_url&&post.media_type?.startsWith("video/")&&<video ref={playerRef} className="immersiveStoryVideo" src={post.media_url} playsInline autoPlay loop muted={muted} preload="auto" onCanPlay={e=>{const player=e.currentTarget;if(player.paused&&!player.dataset.userPaused)void player.play().catch(()=>showPlayerHint("Tap to play"))}}
 onPlay={e=>{if(firstPlaybackHint.current!==post.id){firstPlaybackHint.current=post.id;showPlayerHint(e.currentTarget.muted?"Tap for sound":"Playing")}}}
 onPause={e=>{if(!e.currentTarget.dataset.userPaused)showPlayerHint("Tap to play")}} onLoadedMetadata={e=>{setVideoDuration(Number.isFinite(e.currentTarget.duration)?e.currentTarget.duration:0);setVideoTime(e.currentTarget.currentTime)}} onDurationChange={e=>setVideoDuration(Number.isFinite(e.currentTarget.duration)?e.currentTarget.duration:0)} onTimeUpdate={e=>{if(!scrubRef.current)setVideoTime(e.currentTarget.currentTime);if(post&&e.currentTarget.currentTime>=3&&!e.currentTarget.paused&&watchedId.current!==post.id){watchedId.current=post.id;rememberWatchedPost(post.id,post.author_id)}}} onPointerDown={holdDown} onPointerMove={holdMove} onPointerUp={holdUp} onPointerCancel={holdUp} onContextMenu={e=>e.preventDefault()} onClick={()=>{if(Date.now()<suppressClickUntil.current)return;togglePlayback()}} aria-label="Post video: tap to play or pause"/>}{!hasGallery&&post.media_url&&post.media_type?.startsWith("video/")&&videoDuration>0&&
  <div className={videoSeeking?"immersiveTimeline isSeeking":"immersiveTimeline"}
    onPointerDown={onTimelineDown} onPointerMove={onTimelineMove} onPointerUp={onTimelineUp} onPointerCancel={onTimelineCancel}
    onLostPointerCapture={e=>{if(scrubRef.current)finishScrub(e.currentTarget,scrubRef.current.pointerId)}}
    onTouchStart={e=>e.stopPropagation()} onTouchMove={e=>e.stopPropagation()} onTouchEnd={e=>e.stopPropagation()}>
   <div className="immersiveTimelineTrack" aria-hidden="true"><span style={{width:seekPercent+"%"}}/></div>
   <span className="immersiveTimelineThumb" style={{left:seekPercent+"%"}} aria-hidden="true"/>
   <input type="range" min={0} max={videoDuration} step={0.01} value={Math.min(seekDisplayTime,videoDuration)}
     aria-label="Scrub video timeline" aria-valuetext={fmtPlayback(seekDisplayTime)+" of "+fmtPlayback(videoDuration)}
     onChange={e=>{const next=Number(e.target.value);setScrubPreview(next);seekStoryVideo(next);setScrubPreview(null)}}
     onKeyDown={e=>e.stopPropagation()}/>
   {videoSeeking&&<output className="immersiveTimelineTime" style={{left:`clamp(44px, ${seekPercent}%, calc(100% - 44px))`}} aria-live="off">{fmtPlayback(seekDisplayTime)} / {fmtPlayback(videoDuration)}</output>}
  </div>}{video&&<ImmersiveYouTubePlayer key={video} videoId={video} postId={post.id} authorId={post.author_id}/>}{post.media_url&&post.media_type?.startsWith("video/")&&playerHint&&<span className="immersivePlayerHint" aria-live="off">{playerHint}</span>}{playbackBoost>1&&<div className="immersiveFastForward" aria-live="off"><strong>▶▶ {playbackBoost}×</strong>{playbackBoost===2&&<small>Slide right for 5×</small>}</div>}{heartVisible&&<span className="immersiveLikeHeart" aria-hidden="true">♥</span>}
 {!legacyPost&&<nav className="immersiveReactionRail" aria-hidden={sheetHeight>6} inert={sheetHeight>6} aria-label="Post reactions">{!hasGallery&&post.media_url&&post.media_type?.startsWith("video/")&&<button type="button" className="immersiveSoundButton" data-muted={muted} aria-label={muted?"Unmute video":"Mute video"} aria-pressed={!muted} onClick={toggleSound}><svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z"/>{muted?<path d="m17 9 5 6m0-6-5 6"/>:<><path d="M16 9.2a4.1 4.1 0 0 1 0 5.6"/><path d="M18.6 6.4a8 8 0 0 1 0 11.2"/></>}</svg></button>}<button type="button" aria-label="Like post" aria-pressed={rail.liked} onClick={()=>void railToggle("like")}><svg viewBox="0 0 24 24" width="24" height="24" fill={rail.liked?"currentColor":"none"} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={rail.liked?"railLiked":""} aria-hidden="true"><path d="M20.6 8.2c0 4.7-8.6 10.7-8.6 10.7S3.4 12.9 3.4 8.2a4.4 4.4 0 0 1 8.6-1 4.4 4.4 0 0 1 8.6 1Z"/></svg><small>{rail.likes}</small></button><button type="button" aria-label="Open comments" onClick={()=>{introDone.current=true;setSheetHeight(65)}}><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-4-.9L3 21l1.9-4.5a8.5 8.5 0 1 1 15.1-5Z"/></svg><small>{rail.comments}</small></button><button type="button" aria-label="Save post" aria-pressed={rail.saved} onClick={()=>void railToggle("save")}><svg viewBox="0 0 24 24" width="27" height="27" fill={rail.saved?"currentColor":"none"} stroke="currentColor" strokeWidth="2"><path d="M6 3h12v18l-6-4-6 4V3Z"/></svg><small>{rail.saves}</small></button><button type="button" aria-label="Share post" onClick={()=>void railShare()}><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 19c6.8 0 11-5.6 16-13"/><path d="M12.5 5.5H20V13"/></svg><small>{rail.shares}</small></button></nav>}
 </div><div className={"immersiveSheet"+(sheetDragging?" isDragging":"")} style={{height:`${sheetHeight}%`}}><div className="immersiveSheetHandle" role="slider" tabIndex={0} aria-label="Comments tab. Tap to open, drag to resize" aria-valuemin={4} aria-valuemax={88} aria-valuenow={Math.round(sheetHeight)} onKeyDown={e=>{introDone.current=true;if(e.key==="Enter"||e.key===" "){e.preventDefault();setSheetHeight(v=>v<=10?65:5);return}if(e.key==="ArrowUp")setSheetHeight(v=>Math.min(88,v+5));if(e.key==="ArrowDown")setSheetHeight(v=>Math.max(4,v-5));if(e.key==="Home")setSheetHeight(4);if(e.key==="End")setSheetHeight(88)}} onPointerDown={e=>{if(e.pointerType==="mouse"&&e.button!==0)return;e.stopPropagation();introDone.current=true;sheetDrag.current={y:e.clientY,height:sheetHeight,at:performance.now()};setSheetDragging(true);e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(!sheetDrag.current)return;e.stopPropagation();const {y,height}=sheetDrag.current;setSheetHeight(Math.min(88,Math.max(4,height+(y-e.clientY)/window.innerHeight*100)))}} onPointerUp={e=>{e.stopPropagation();const drag=sheetDrag.current;sheetDrag.current=null;setSheetDragging(false);if(drag){const delta=e.clientY-drag.y;const velocity=delta/Math.max(1,performance.now()-drag.at);if(Math.abs(delta)<11)setSheetHeight(v=>v<=10?65:5);else if(Math.abs(delta)>38&&Math.abs(velocity)>.65)setSheetHeight(velocity>0?5:88);else setSheetHeight(v=>v<25?5:v<65?65:88)}if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId)}} onPointerCancel={()=>{sheetDrag.current=null;setSheetDragging(false)}}><span className="immersiveGrip" aria-hidden="true"/><div className="immersiveCaptionTab"><span className="immersiveCaptionTitle">{cleanPostBody(post.body).replace(/https?:\/\/\S+/g,"").trim()||"Ummah post"}</span><span className="immersiveCaptionOpen">{sheetHeight<=10?"Comments ↑":"Comments ↓"}</span></div></div><div className={styles.socialEngagement}>{legacyPost?<p style={{fontSize:13,color:"#667085"}}>1Muslim community post</p>:<UnifiedPostMedia postId={post.id} mediaUrl={post.media_url} mediaType={post.media_type} youtubeId={video} showVideo={false} focusCommentId={focusCommentId} immersiveMode/>}</div>
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
`}</style><style jsx global>{`.immersiveStory .immersiveMedia .immersiveYouTubePlayer{position:absolute!important;inset:0!important;display:grid!important;place-items:center!important;width:100%!important;height:100%!important;background:#07090f!important;overflow:hidden!important;isolation:isolate;z-index:2}.immersiveStory .immersiveMedia .immersiveYouTubeMount{display:grid!important;place-items:center!important;width:100%!important;height:100%!important;min-width:0;overflow:hidden}.immersiveStory .immersiveMedia .immersiveYouTubePlayer iframe{display:block!important;position:relative!important;width:100%!important;height:auto!important;max-height:100%!important;aspect-ratio:16/9!important;border:0!important;background:#000!important}`}</style><style jsx global>{`
/* Native full-screen playback: a slim 3px rail inside a 48px touch target. */
 .immersiveStory .immersiveMedia >
 .immersiveTimeline{position:absolute!important;left:10px!important;right:10px!important;bottom:0!important;height:48px!important;z-index:26!important;display:block!important;touch-action:none!important;pointer-events:auto!important;cursor:ew-resize}
 .immersiveTimelineTrack{position:absolute;left:0;right:0;bottom:2px;height:3px;border-radius:999px;background:#ffffff64;pointer-events:none;transition:height .14s ease}
 .immersiveTimelineTrack span{display:block;width:0;height:100%;background:#f7fbff;border-radius:inherit;box-shadow:0 0 7px #c7e6ff6b}
 .immersiveTimelineThumb{position:absolute;bottom:3.5px;width:14px;height:14px;border:2px solid #fff;border-radius:50%;background:#d9f2ff;transform:translate(-50%,50%) scale(.8);box-shadow:0 0 0 3px #0e294988,0 0 14px #e6f7ff99;pointer-events:none;opacity:.8;transition:transform .13s ease,opacity .13s ease}
 .immersiveTimeline.isSeeking .immersiveTimelineTrack,.immersiveTimeline:focus-within .immersiveTimelineTrack{height:5px}
 .immersiveTimeline.isSeeking .immersiveTimelineThumb,.immersiveTimeline:focus-within .immersiveTimelineThumb{transform:translate(-50%,50%) scale(1.3);opacity:1}
 .immersiveTimeline input{position:absolute;inset:0;width:100%;height:48px;margin:0;border:0;appearance:none;-webkit-appearance:none;background:transparent;cursor:ew-resize;touch-action:none;opacity:0}
 .immersiveTimeline input::-webkit-slider-runnable-track{height:48px;background:transparent}
 .immersiveTimeline input::-moz-range-track{height:48px;background:transparent}
 .immersiveTimeline input::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:18px;height:18px;margin-top:15px;border:0}
 .immersiveTimeline input::-moz-range-thumb{width:18px;height:18px;border:0}
 .immersiveTimeline input:focus-visible{outline:2px solid #fff;border-radius:8px;opacity:.03}
 .immersiveTimelineTime{position:absolute;bottom:36px;transform:translateX(-50%);z-index:28;background:#081320db;color:#fff;border:1px solid #ffffff45;box-shadow:0 5px 16px #0007;border-radius:12px;padding:5px 9px;font-size:12px;font-weight:700;white-space:nowrap;pointer-events:none}
 .immersiveStory .immersiveMedia [class*="socialPostCopy"]{bottom:50px!important}
 .immersiveFastForward{position:absolute!important;z-index:24!important;top:21%!important;left:50%!important;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:4px;background:#090d0dcc;backdrop-filter:blur(12px);color:#fff;padding:10px 18px;border:1px solid #ffffff55;border-radius:17px;white-space:nowrap;pointer-events:none}
 .immersiveFastForward strong{font-size:22px}.immersiveFastForward small{font-size:12px}
 /* Video uses this story route, not PostViewer. Strip its actual frame. */
.immersiveStoryPage:has(.immersiveStoryVideo),.immersiveStoryPage:has(.immersiveStoryVideo) .immersiveStory,.immersiveStoryPage:has(.immersiveStoryVideo) .immersiveMedia,.immersiveStoryPage:has(.immersiveStoryVideo) .immersiveStoryVideo{border:0!important;border-radius:0!important;outline:0!important;box-shadow:none!important;filter:none!important}
.immersiveStoryPage:has(.immersiveStoryVideo) .immersiveStory{width:100vw!important;max-width:none!important;margin:0!important;padding:0!important}
.immersiveStoryVideo{-webkit-appearance:none;appearance:none;cursor:pointer;touch-action:pan-y;-webkit-touch-callout:none;user-select:none;-webkit-user-select:none}
.immersiveStory .immersiveReactionRail .immersiveSoundButton{font-size:25px;line-height:1;min-height:45px;margin-bottom:1px;filter:drop-shadow(0 2px 5px #000c)}
.immersivePlayerHint{position:absolute!important;z-index:27!important;left:50%;bottom:79px;transform:translateX(-50%);border-radius:999px;background:#071322cc;border:1px solid #ffffff5c;backdrop-filter:blur(10px);color:#fff;font-size:13px;font-weight:700;letter-spacing:.02em;padding:9px 14px;box-shadow:0 6px 25px #0006;pointer-events:none;white-space:nowrap;animation:immersiveHintFade 1s ease-out both}
@keyframes immersiveHintFade{0%{opacity:0;transform:translate(-50%,6px)}14%{opacity:1;transform:translate(-50%,0)}73%{opacity:1}100%{opacity:0}}
@media(prefers-reduced-motion:reduce){.immersivePlayerHint{animation:none;opacity:1}}
`}</style><style jsx global>{`
/* Streamlined Ummah viewer: caption lives on the sheet handle; never shade video. */
.immersiveStory .immersiveMedia [class*="socialPostCopy"]{display:none!important;background:none!important}
.immersiveStory .immersiveSheetHandle{
 box-sizing:border-box;min-height:0;height:min(5dvh,52px)!important;flex:0 0 min(5dvh,52px)!important;
 display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;
 padding:3px 14px 4px!important;gap:2px!important;touch-action:none!important;cursor:pointer!important;
 background:linear-gradient(180deg,#fff,#fcfdfe)!important;border-bottom:1px solid #d9e1e927;
}
.immersiveStory .immersiveSheetHandle .immersiveGrip{width:35px!important;height:4px!important;min-height:4px!important;border-radius:50px!important;background:#c4c9d1!important;flex:0 0 4px!important}
.immersiveStory .immersiveCaptionTab{display:flex;align-items:center;justify-content:space-between;gap:9px;width:100%;min-width:0;color:#293b51}
/* Override the old generic grip-span rule for actual caption text. */
.immersiveStory .immersiveSheetHandle .immersiveCaptionTab>span{
 width:auto!important;height:auto!important;min-height:0!important;
 display:block!important;border-radius:0!important;background:transparent!important;
}
.immersiveStory .immersiveSheetHandle .immersiveCaptionTab>.immersiveCaptionOpen{
 background:#edf4fa!important;border-radius:999px!important;
}
.immersiveStory .immersiveCaptionTitle{
 min-width:0;flex:1;font-size:clamp(11px,2.9vw,13px);font-weight:730;line-height:1.25;
 overflow:hidden;white-space:nowrap;text-overflow:ellipsis;letter-spacing:-.012em;text-align:left
}
.immersiveStory .immersiveCaptionOpen{
 color:#597da0;flex:0 0 auto;font-size:10px;letter-spacing:.02em;font-weight:800;
 padding:2px 7px;border-radius:999px;background:#edf4fa;white-space:nowrap
}
.immersiveStory .immersiveReactionRail{
 gap:11px!important;right:9px!important;bottom:25px!important;
 padding:8px 5px!important;border-radius:20px!important;
 width:43px!important;background:transparent!important;
 backdrop-filter:none!important;-webkit-backdrop-filter:none!important;
 transform:none!important;opacity:1!important;
 transition:opacity .18s ease,transform .18s ease!important;animation:railEnter .24s both!important;
}
.immersiveStory .immersiveReactionRail[aria-hidden="true"]{
 opacity:0!important;visibility:hidden!important;
 transform:translateX(10px) scale(.92)!important;
 pointer-events:none!important;animation:none!important;
}
.immersiveStory .immersiveReactionRail button{
 min-width:38px!important;width:38px!important;min-height:43px!important;
 padding:4px 1px!important;gap:2px!important;color:#fff!important;
 background:transparent!important;filter:none!important;text-shadow:0 2px 6px #0009!important;
 border:0!important;touch-action:manipulation!important;transition:transform .18s ease!important;
}
.immersiveStory .immersiveReactionRail button:active{transform:scale(.88)!important}
.immersiveStory .immersiveReactionRail button>svg{width:24px!important;height:24px!important;filter:drop-shadow(0 2px 3px #0009)}
.immersiveStory .immersiveReactionRail button>small{font-size:10px!important;line-height:1.1!important;text-shadow:0 1px 5px #000c;font-weight:760!important}
.immersiveStory .immersiveReactionRail button>svg.railLiked{color:#ff4d78;filter:drop-shadow(0 0 6px #ff4d7880)!important}
.immersiveStory .immersiveReactionRail .immersiveSoundButton{
 min-height:40px!important;border-radius:13px!important;
 background:rgba(255,255,255,.13)!important;color:#fff!important;
 border:1px solid rgba(255,255,255,.4)!important;backdrop-filter:blur(9px)!important;
}
.immersiveStory .immersiveReactionRail .immersiveSoundButton[data-muted="true"]{
 color:#ff6870!important;border-color:#ff899269!important;background:#4c1517a3!important
}
.immersiveStory .immersiveReactionRail .immersiveSoundButton>svg{width:21px!important;height:21px!important}
.immersiveStory .immersiveMediaBackdrop{opacity:.42!important}
.immersiveStory .immersiveMedia [class*="socialStoryImage"],.immersiveStory .immersiveStoryVideo{
 filter:none!important;opacity:1!important;box-shadow:none!important
}
@media(max-width:390px){
 .immersiveStory .immersiveSheetHandle{padding:3px 10px 4px!important}
 .immersiveStory .immersiveCaptionOpen{font-size:9px!important}
 .immersiveStory .immersiveReactionRail{right:5px!important}
}
@media(prefers-reduced-motion:reduce){
 .immersiveStory .immersiveReactionRail{transition:none!important;animation:none!important}
}
`}</style></main>;
}
