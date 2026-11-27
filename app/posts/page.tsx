"use client";
import Link from "next/link";
import {cleanPostBody} from "../lib/cleanPostBody";
import {useEffect,useMemo,useRef,useState,type CSSProperties,type TouchEvent} from "react";
import {useRouter} from "next/navigation";
import {readWatchedPosts,storeImmersiveQueue,UMMAH_WATCH_UPDATED_EVENT,type WatchedPost} from "../lib/ummah-watch-history";
import UnifiedPostMedia from "../components/UnifiedPostMedia";
import {youtubeIdFromPost,youtubeThumbnail} from "../lib/ummah-youtube";
import OneMuslimVideo from "../components/OneMuslimVideo";
import PostAuthorFollow from "../components/PostAuthorFollow";
import styles from "./posts-magazine.module.css";
type PostMedia={url:string;type:string};
type Post={id:string;body:string;author_name:string;author_handle:string;created_at:string;media_url:string|null;media_type:string|null;media_items?:PostMedia[];shahada_verified?:boolean;author_id:string;author_avatar_url?:string|null};
const youtubeId=youtubeIdFromPost;
const ytThumbnail=youtubeThumbnail;
const clean=(text:string)=>cleanPostBody(text).replace(/https?:\/\/\S+/g,"").trim();
// Small transparent topic suggestions until HudHud AI classification and user-selected labels
// are available on the post API. Never present these heuristics as verified AI labels.
const TOPICS=["All","Qur’an","Prayer","Learning","Community","Daily Life","Video"] as const;
type Topic=(typeof TOPICS)[number];
const suggestedTopic=(p:Post):Exclude<Topic,"All">=>{
 const value=(p.body||"").toLowerCase();
 if(/qur[’']?an|surah|ayah|verse|recitation/.test(value))return "Qur’an";
 if(/salah|prayer|adhan|dua|du'a|supplication/.test(value))return "Prayer";
 if(/hadith|lesson|learning|study|teacher|knowledge/.test(value))return "Learning";
 if(/ummah|community|brother|sister|family|mosque/.test(value))return "Community";
 if(p.media_type?.startsWith("video/")||youtubeIdFromPost(p.body,p.media_url))return "Video";
 return "Daily Life";
};
// Avoid mounting dozens of individual comment fetchers and autoplay decoders at once.
// Near-viewport cards become interactive before the user actually reaches them.
function VisiblePostEngagement({postId,mediaUrl,mediaType,youtube,night}:{postId:string;mediaUrl:string|null;mediaType:string|null;youtube:string|null;night:boolean}){
 const container=useRef<HTMLDivElement|null>(null);
 const content=useRef<HTMLDivElement|null>(null);
 const [near,setNear]=useState(false);
 // Preserve the engagement region's last measured height when it is virtualized.
 // Previously every offscreen card collapsed back to 54px, pulling scroll position
 // under the user's finger and triggering iOS Safari scroll anchoring jumps.
 const [reservedHeight,setReservedHeight]=useState(154);
 useEffect(()=>{
  const node=container.current;if(!node)return;
  const observer=new IntersectionObserver(([entry])=>setNear(entry.isIntersecting),{rootMargin:"650px 0px 650px 0px",threshold:0});
  observer.observe(node);return()=>observer.disconnect();
 },[]);
 useEffect(()=>{
  if(!near||!content.current)return;
  const node=content.current;
  const measure=()=>{const height=Math.ceil(node.getBoundingClientRect().height);if(height>0)setReservedHeight(height)};
  measure();
  const resize=new ResizeObserver(measure);
  resize.observe(node);
  return()=>resize.disconnect();
 },[near]);
 return <div ref={container} style={near?{minHeight:reservedHeight}:{height:reservedHeight}}>
  {near?<div ref={content}><UnifiedPostMedia postId={postId} mediaUrl={mediaUrl} mediaType={mediaType} youtubeId={youtube} showVideo={false} sheetMode nightMode={night}/></div>:null}
 </div>;
}
function useVisibleMedia(){
 const node=useRef<HTMLDivElement|null>(null);
 const [visible,setVisible]=useState(false);
 useEffect(()=>{const el=node.current;if(!el)return;if(typeof IntersectionObserver==="undefined"){setVisible(true);return}const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{threshold:0});observer.observe(el);return()=>observer.disconnect()},[]);
 return {node,visible};
}
function VisiblePostVideo({postId,mediaUrl,active}:{postId:string;mediaUrl:string|null;active:boolean}){
 const {node,visible}=useVisibleMedia();
 return <div ref={node} className={styles.feedVideoStage}>{active&&visible?<OneMuslimVideo videoKey={"public-post:"+postId} src={mediaUrl||""} title="Ummah video"/>:<div className={styles.feedVideoPlaceholder}><span aria-hidden="true">▶</span><small>Video ready to play</small></div>}</div>;
}

function PostMediaGallery({items,active}:{items:PostMedia[];active:boolean}){
 const {node,visible}=useVisibleMedia();
 const [index,setIndex]=useState(0);
 const [start,setStart]=useState<number|null>(null);
 const current=items[index]||items[0];
 const go=(delta:number)=>setIndex(previous=>(previous+delta+items.length)%items.length);
 return <div ref={node} className={styles.feedMediaGallery} aria-label={"Post gallery with "+items.length+" items"} onTouchStart={event=>setStart(event.touches[0]?.clientX??null)} onTouchEnd={event=>{if(start===null)return;const distance=event.changedTouches[0]?.clientX-start;setStart(null);if(Math.abs(distance)>42)go(distance<0?1:-1)}}>
  {current.type.startsWith("video/")?(active&&visible?<video key={current.url} src={current.url} playsInline controls preload="metadata" className={styles.feedMediaGalleryMedia}/>:<div className={styles.feedVideoPlaceholder}><span aria-hidden="true">▶</span><small>Video ready to play</small></div>):<img key={current.url} src={current.url} alt={"Gallery item "+(index+1)} className={styles.feedMediaGalleryMedia} loading="lazy"/>}
  <div className={styles.feedMediaGalleryControls}><button type="button" aria-label="Previous gallery item" onClick={()=>go(-1)}>‹</button><span>{index+1} / {items.length}</span><button type="button" aria-label="Next gallery item" onClick={()=>go(1)}>›</button></div>
  <div className={styles.feedMediaGalleryDots} aria-hidden="true">{items.map((item,i)=><span className={i===index?styles.feedMediaGalleryDotActive:""} key={item.url}/>)}</div>
 </div>
}

let cachedDiscover:{posts:Post[];viewerId:string|null;at:number}|null=null;
export default function PublicPostsSocial(){
 const router=useRouter();
 const [view,setView]=useState<"feed"|"explore">("feed");
 const [night,setNight]=useState(false);
 useEffect(()=>{
  const media=window.matchMedia("(prefers-color-scheme: dark)");
  const update=()=>{
   let chosen="auto",theme="";
   try{chosen=localStorage.getItem("1muslim-theme-mode")||"auto";theme=localStorage.getItem("1muslim-theme")||""}catch{}
   setNight(chosen==="night"||(chosen==="auto"?(theme==="dark"?true:theme==="light"?false:media.matches):chosen!=="day"&&theme==="dark"));
  };
  update();media.addEventListener("change",update);
  window.addEventListener("1muslim:theme-changed",update);
  window.addEventListener("storage",update);
  return()=>{media.removeEventListener("change",update);window.removeEventListener("1muslim:theme-changed",update);window.removeEventListener("storage",update)};
 },[]);
 const [topic,setTopic]=useState<Topic>("All");
 // Native proximity snapping stops a fling at the next post. Keep controls and comment
 // threads on the browser's normal touch/scroll path instead of hijacking gestures.
 useEffect(()=>{
  if(view!=="feed")return;
  const root=document.scrollingElement as HTMLElement|null;
  if(!root)return;
  const previousType=root.style.scrollSnapType;
  const previousPadding=root.style.scrollPaddingTop;
  root.style.scrollSnapType="none";
  root.style.scrollPaddingTop="16px";
  return()=>{root.style.scrollSnapType=previousType;root.style.scrollPaddingTop=previousPadding};
 },[view]);

 const [posts,setPosts]=useState<Post[]>([]),[query,setQuery]=useState(""),[filter,setFilter]=useState<"forYou"|"lastWatched"|"popular">("forYou"),[loading,setLoading]=useState(true),[error,setError]=useState(""),[expanded,setExpanded]=useState<Record<string,boolean>>({}),[viewerId,setViewerId]=useState<string|null>(null),[history,setHistory]=useState<WatchedPost[]>([]),[scores,setScores]=useState<Record<string,{likes:number;comments:number;shares:number;saves:number;score:number}>>({}),[rankStatus,setRankStatus]=useState<"loading"|"ready"|"error">("loading"),[menuId,setMenuId]=useState<string|null>(null),[editingId,setEditingId]=useState<string|null>(null),[editText,setEditText]=useState(""),[actionBusy,setActionBusy]=useState(false),[actionError,setActionError]=useState("");
 // A real card deck: swipe artwork or the card surface, never the native video,
 // follow/menu buttons, comments, keyboard or other interactive controls.
 const deckRoot=useRef<HTMLDivElement|null>(null);
 const [deckActive,setDeckActive]=useState(0);
 const [deckMotion,setDeckMotion]=useState<{from:number;to:number;direction:1|-1}|null>(null);
 const activeDeckRef=useRef(0);
 const deckLocked=useRef(false);
 const deckTimer=useRef<number|null>(null);
 const deckTouch=useRef<{index:number;x:number;y:number}|null>(null);
 useEffect(()=>()=>{if(deckTimer.current)clearTimeout(deckTimer.current)},[]);
 useEffect(()=>{
  let frame=0;
  const sync=()=>{
   if(deckLocked.current||!deckRoot.current)return;
   const found=document.elementFromPoint(window.innerWidth*.5,Math.min(window.innerHeight*.46,450))?.closest<HTMLElement>("[data-ummah-index]");
   if(!found||!deckRoot.current.contains(found))return;
   const index=Number(found.dataset.ummahIndex);
   if(Number.isInteger(index)&&index>=0&&index!==activeDeckRef.current){activeDeckRef.current=index;setDeckActive(index)}
  };
  const onScroll=()=>{if(frame)return;frame=requestAnimationFrame(()=>{frame=0;sync()})};
  window.addEventListener("scroll",onScroll,{passive:true});
  window.addEventListener("resize",onScroll,{passive:true});
  const init=requestAnimationFrame(sync);
  return()=>{window.removeEventListener("scroll",onScroll);window.removeEventListener("resize",onScroll);cancelAnimationFrame(init);if(frame)cancelAnimationFrame(frame)};
 },[]);
 useEffect(()=>{activeDeckRef.current=0;setDeckActive(0);setDeckMotion(null);deckLocked.current=false},[filter,query]);
 useEffect(()=>{
  let active=true;
  let moreTimer:number|undefined;
  if(cachedDiscover&&Date.now()-cachedDiscover.at<90000){
   setPosts(cachedDiscover.posts);
   setViewerId(cachedDiscover.viewerId);
   setLoading(false);
  }else cachedDiscover=null;
  const merge=(fresh:Post[],replace=false)=>{
   if(!active)return;
   setPosts(old=>{
    const rows=replace||old.length===0?fresh:[...fresh,...old];
    const unique=[...new Map(rows.map(row=>[row.id,row])).values()];
    const ordered=unique.sort((a,b)=>b.created_at.localeCompare(a.created_at));
    cachedDiscover={posts:ordered,viewerId:cachedDiscover?.viewerId||null,at:Date.now()};
    return ordered;
   });
  };
  const load=async()=>{
   try{
    // The first 18 posts are enough to paint a usable feed. The rest loads
    // unobtrusively after first paint. No 100-video signing waterfall.
    const response=await fetch("/api/community-posts?limit=18&offset=0",{cache:"no-store"});
    if(!response.ok)throw Error("Unable to load community posts");
    const data=await response.json();
    if(!active)return;
    merge(Array.isArray(data.posts)?data.posts:[],!(cachedDiscover?.posts.length));
    setViewerId(data.viewer_id||null);
    if(cachedDiscover)cachedDiscover.viewerId=data.viewer_id||null;
    setError("");
    setLoading(false);
    if(data.has_more)moreTimer=window.setTimeout(()=>{
     void fetch("/api/community-posts?limit=82&offset=18",{cache:"no-store"})
      .then(async res=>res.ok?res.json():null)
      .then(page=>{if(active&&Array.isArray(page?.posts))merge(page.posts)})
      .catch(()=>{/* Initial feed remains usable if the background request fails. */});
    },600);
   }catch(err){
    if(active&&!cachedDiscover)setError(err instanceof Error?err.message:"Could not load posts");
   }finally{if(active)setLoading(false)}
  };
  void load();
  // Background refresh never blanks an already visible feed.
  const refresh=window.setInterval(()=>{if(document.visibilityState==="visible")void load()},90000);
  return()=>{active=false;clearInterval(refresh);if(moreTimer!==undefined)clearTimeout(moreTimer)};
 },[]);
 // Watched means actually played in the immersive viewer; history is kept on this device.
 useEffect(()=>{
  const sync=()=>setHistory(readWatchedPosts());sync();
  window.addEventListener(UMMAH_WATCH_UPDATED_EVENT,sync);
  window.addEventListener("storage",sync);
  const onVisibility=()=>{if(document.visibilityState==="visible")sync()};
  document.addEventListener("visibilitychange",onVisibility);
  return()=>{window.removeEventListener(UMMAH_WATCH_UPDATED_EVENT,sync);window.removeEventListener("storage",sync);document.removeEventListener("visibilitychange",onVisibility)};
 },[]);
 const postKey=posts.map(p=>p.id).join("|");
 const stableForYouOrder=useRef<string[]>([]);
 useEffect(()=>{
  if(!postKey){setScores({});setRankStatus("ready");return}
  const abort=new AbortController();
  setRankStatus("loading");
  void fetch("/api/ummah-discovery-ranking",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({ids:postKey.split("|")}),signal:abort.signal,cache:"no-store"})
   .then(async response=>{if(!response.ok)throw Error("Popularity unavailable");return response.json()})
   .then(data=>{if(!abort.signal.aborted){setScores(data.scores||{});setRankStatus("ready")}})
   .catch(()=>{if(!abort.signal.aborted)setRankStatus("error")});
  return()=>abort.abort();
 },[postKey]);
 const filtered=useMemo(()=>{
  const search=query.trim().toLowerCase();
  const result=posts.filter(p=>(p.body+" "+p.author_name+" "+p.author_handle).toLowerCase().includes(search)&&(topic==="All"||suggestedTopic(p)===topic));
  if(filter==="lastWatched"){
   const index=new Map(history.map((v,i)=>[v.id,i]));
   return result.filter(p=>index.has(p.id)).sort((a,b)=>(index.get(a.id)??999)-(index.get(b.id)??999));
  }
  if(filter==="popular")return result.sort((a,b)=>(scores[b.id]?.score??0)-(scores[a.id]?.score??0)||b.created_at.localeCompare(a.created_at));
  // Calculate the rank for newly arrived cards, but NEVER reorder cards that are
  // already rendered. Engagement scores arrive asynchronously and the second
  // batch arrives after 600ms: re-sorting the visible list on each arrival
  // visibly teleports the feed while somebody is swiping.
  const authors=new Set(history.slice(0,18).map(item=>item.authorId));
  const rank=(p:Post)=>{
   const ageHours=Math.max(0,(Date.now()-Date.parse(p.created_at))/3600000);
   const freshness=22/(1+ageHours/48);
   return freshness+Math.log1p(scores[p.id]?.score??0)*4+(authors.has(p.author_id)?9:0);
  };
  const valid=new Set(posts.map(p=>p.id));
  const previous=stableForYouOrder.current.filter(id=>valid.has(id));
  const already=new Set(previous);
  const newcomers=posts.filter(p=>!already.has(p.id))
   .sort((a,b)=>rank(b)-rank(a)||b.created_at.localeCompare(a.created_at))
   .map(p=>p.id);
  const ordered=previous.concat(newcomers);
  stableForYouOrder.current=ordered;
  const position=new Map(ordered.map((id,index)=>[id,index]));
  return result.sort((a,b)=>(position.get(a.id)??Infinity)-(position.get(b.id)??Infinity));
 },[posts,query,filter,history,scores,topic]);
 const moveDeck=(from:number,to:number)=>{
  if(deckLocked.current||to<0||to>=filtered.length||from===to)return;
  const item=filtered[to],node=document.getElementById("ummah-post-"+item.id);
  if(!node)return;
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  deckLocked.current=true;
  if(deckTimer.current)clearTimeout(deckTimer.current);
  setDeckMotion(reduced?null:{from,to,direction:to>from?1:-1});
  activeDeckRef.current=to;
  setDeckActive(to);
  // The old card flies off as the next card grows from its blurred preview.
  window.setTimeout(()=>{
   node.scrollIntoView({behavior:reduced?"auto":"smooth",block:"start"});
  },reduced?0:56);
  deckTimer.current=window.setTimeout(()=>{setDeckMotion(null);deckLocked.current=false},reduced?90:760);
 };
 const onCardTouchStart=(index:number,event:TouchEvent<HTMLElement>)=>{
  const element=event.target;
  if(!(element instanceof Element))return;
  const link=element.closest("a");
  if((link&&!link.classList.contains(styles.feedMediaLink))||
     element.closest("button,input,textarea,select,video,audio,iframe,[contenteditable='true']")||
     element.closest("[class*='feedPostEngagement'],[class*='feedVideoStage'],[class*='feedEditBox']")){deckTouch.current=null;return}
  const point=event.touches[0];
  if(!point)return;
  deckTouch.current={index,x:point.clientX,y:point.clientY};
 };
 const onCardTouchEnd=(index:number,event:TouchEvent<HTMLElement>)=>{
  const start=deckTouch.current;deckTouch.current=null;
  if(!start||start.index!==index||event.changedTouches.length===0)return;
  const point=event.changedTouches[0],dy=point.clientY-start.y,dx=point.clientX-start.x;
  if(Math.abs(dy)<65||Math.abs(dy)<Math.abs(dx)*1.35)return;
  moveDeck(index,index+(dy<0?1:-1));
 };
 const startImmersive=()=>{
  if(!filtered.length)return;
  storeImmersiveQueue(filtered.map(p=>p.id));
  const first=filtered[0];
  router.push("/posts/story/"+encodeURIComponent(first.id)+"?play=1");
 };
 const stories=useMemo(()=>{const seen=new Set<string>();return posts.filter(p=>{const key=p.author_handle||p.author_name;if(seen.has(key))return false;seen.add(key);return true}).slice(0,12)},[posts]);
 return <main className={styles.page+" "+styles.feedPage+" "+styles.discoverPage+" "+styles.igUmmah+(night?" "+styles.igNight:"")}>
 <header className={styles.igTop} aria-label="Ummah Posts navigation">
  <div className={styles.igTopRow}>
   <Link href="/posts" className={styles.igBrand} aria-label="One Muslim Ummah Posts">One Muslim<span>.live</span></Link>
   <div className={styles.igTopActions}><Link href="/create" aria-label="Create post" title="Create post">＋</Link><Link href="/notifications" aria-label="Notifications" title="Notifications">♡</Link></div>
  </div>
  <nav className={styles.igViewTabs} aria-label="Feed or Explore">
   <button type="button" aria-pressed={view==="feed"} className={view==="feed"?styles.igViewActive:""} onClick={()=>setView("feed")}>⌂ <span>Feed</span></button>
   <button type="button" aria-pressed={view==="explore"} className={view==="explore"?styles.igViewActive:""} onClick={()=>setView("explore")}>⌕ <span>Search & Explore</span></button>
  </nav>
 </header>
 {view==="feed"?<>
 <section className={styles.discoverPeople} aria-label="Discover community members"><div className={styles.feedStoryRail}><Link href="/create" className={styles.feedStoryPerson}><span className={styles.feedStoryRing}><span>＋</span></span><small>Your Story</small></Link>{stories.map(p=><Link href={`/profile?section=muslimeen&member=${encodeURIComponent(p.author_id)}`} className={styles.feedStoryPerson} key={p.id}><span className={styles.feedStoryRing}><span>{p.author_avatar_url?<img className={styles.authorAvatarImage} src={p.author_avatar_url} alt="" loading="lazy" referrerPolicy="no-referrer"/>:(p.author_name||"M").slice(0,1).toUpperCase()}</span></span><small>{p.author_handle||p.author_name}</small></Link>)}</div></section>
 <div className={styles.discoverFilters}><div className={styles.feedTabs} role="group" aria-label="Choose Discover feed">
 <button type="button" className={filter==="forYou"?styles.active:""} aria-pressed={filter==="forYou"} onClick={()=>setFilter("forYou")}>✧ For You</button>
 <button type="button" className={filter==="lastWatched"?styles.active:""} aria-pressed={filter==="lastWatched"} onClick={()=>setFilter("lastWatched")}>◷ Last Watched</button>
 <button type="button" className={filter==="popular"?styles.active:""} aria-pressed={filter==="popular"} onClick={()=>setFilter("popular")}>✦ Most Popular</button>
 <button type="button" className={styles.immersivePlayTab} aria-label="Play immersive swipe feed" title="Play full-screen swipe feed" disabled={!filtered.length} onClick={startImmersive}><svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" aria-hidden="true"><path d="M8.2 4.6c0-.9 1-1.4 1.8-.9l10.2 7.1c.8.5.8 1.5 0 2L10 20c-.8.5-1.8 0-1.8-.9V4.6Z"/></svg><span>Play</span></button></div><label className={styles.discoverSearch}><span className={styles.sr}>Search posts or people</span><input id="discover-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search posts or people…"/></label></div>
  {loading?<div className={styles.status}>LOADING YOUR FEED…</div>:error?<div className={styles.status} role="alert">{error}</div>:filter==="popular"&&rankStatus==="loading"?<div className={styles.status}>RANKING POSTS BY REAL ENGAGEMENT…</div>:filter==="popular"&&rankStatus==="error"?<div className={styles.status} role="alert">Popularity rankings are temporarily unavailable. Please try again shortly.</div>:!filtered.length?<div className={styles.status}>{filter==="lastWatched"?"No videos watched yet on this device. Open a video and play it to begin your history.":"NO POSTS FOUND YET."}</div>:<div ref={deckRoot} className={styles.feedStream+" "+styles.ummahSnapFeed} aria-label="Swipeable Ummah card deck">{filtered.map((p,index)=>{const isNativeVideo=!!p.media_url&&!!p.media_type?.startsWith("video/"),video=isNativeVideo?null:youtubeIdFromPost(p.body,p.media_url),isImage=!!p.media_url&&!!p.media_type?.startsWith("image/"),body=clean(p.body),long=body.length>220,hasVideo=isNativeVideo;const nextPost=filtered[index+1];
 const nextVideoId=nextPost&&!nextPost.media_type?.startsWith("video/")?youtubeIdFromPost(nextPost.body,nextPost.media_url):null;
 const nextPreview=nextPost?.media_type?.startsWith("image/")?nextPost.media_url:nextVideoId?ytThumbnail(nextVideoId):null;
 const poster=isImage?p.media_url:video?ytThumbnail(video):null;
 const hasGallery=!!p.media_items&&p.media_items.length>1;
 const state=deckMotion?(index===deckMotion.from?"leaving":index===deckMotion.to?"arriving":index===deckActive+1?"queued":index===deckActive-1?"past":"rest"):index===deckActive?"current":index===deckActive+1?"queued":index===deckActive-1?"past":"rest";
 const posterStyle=poster&&(index===deckActive||index===deckActive+1)?({"--ummah-poster":"url("+JSON.stringify(poster)+")"} as CSSProperties):undefined;
 return <article className={styles.feedPost} id={"ummah-post-"+p.id} data-ummah-index={index} data-deck-state={state} data-deck-direction={deckMotion?.direction===-1?"reverse":"forward"} style={posterStyle} key={p.id} aria-label={"Post by "+(p.author_name||"Community member")}>
 {index<filtered.length-1&&<div aria-hidden="true" className={styles.feedNextGhost} style={index===deckActive&&nextPreview?{backgroundImage:"url("+JSON.stringify(nextPreview)+")"}:undefined}/>}

 <div className={styles.feedPostStage}>
 {!hasGallery&&poster&&<Link href={`/posts/story/${encodeURIComponent(p.id)}${video?"?play=1":""}`} className={styles.feedMediaLink+(video?" "+styles.feedYoutubeThumbnail:"")} aria-label={video?"Play YouTube video in full Ummah post":"View community post"}><img src={poster} alt={video?"YouTube video thumbnail":"Community post"} width={960} height={1200} loading={index<2?"eager":"lazy"} decoding="async" fetchPriority={index===0?"high":"auto"} style={{backgroundColor:"#f1f3f6"}}/>{video&&<span className={styles.feedYoutubePlay} aria-hidden="true">▶</span>}</Link>}
 
 {hasGallery&&<PostMediaGallery items={p.media_items!} active={index===deckActive}/>}
 {hasVideo&&!hasGallery&&<VisiblePostVideo postId={p.id} mediaUrl={p.media_url} active={index===deckActive}/>}
 {!hasGallery&&!poster&&!hasVideo&&<div className={styles.feedTextCanvas} aria-hidden="true"><span>✧</span><strong>FROM THE UMMAH</strong><small>Voices of our community</small></div>}
 <div className={styles.feedPostGlass}>
  <Link href={"/profile?section=muslimeen&member="+encodeURIComponent(p.author_id)} className={styles.feedAvatarEdge} aria-label={"View "+(p.author_name||"member")+" profile"}><span className={styles.feedPostAvatar}>{p.author_avatar_url?<img className={styles.authorAvatarImage} src={p.author_avatar_url} alt="" loading="lazy" referrerPolicy="no-referrer"/>:(p.author_name||"M").slice(0,1).toUpperCase()}</span></Link>
  <div className={styles.feedPostHeader}><Link href={`/profile?section=muslimeen&member=${encodeURIComponent(p.author_id)}`} className={styles.feedPostIdentity}><span><strong>{p.author_name||"Community member"} {p.shahada_verified?"✦":""}</strong><small>{p.author_handle?p.author_handle+" · ":""}{new Date(p.created_at).toLocaleDateString(undefined,{month:"short",day:"numeric"})}</small></span></Link><PostAuthorFollow authorId={p.author_id} viewerId={viewerId}/><div className={styles.feedMenuWrap}><button type="button" className={styles.feedPostMore} aria-label="Post options" aria-expanded={menuId===p.id} onClick={()=>{setMenuId(v=>v===p.id?null:p.id);setActionError("")}}>•••</button>{menuId===p.id&&<div className={styles.feedPostMenu}><Link href={`/posts/story/${encodeURIComponent(p.id)}`}>View</Link>{viewerId===p.author_id&&<><button type="button" onClick={()=>{setEditingId(p.id);setEditText(p.body);setMenuId(null)}}>Edit</button><button type="button" disabled={actionBusy} onClick={async()=>{if(!window.confirm("Delete this post permanently?"))return;setActionBusy(true);setActionError("");try{const r=await fetch("/api/community-posts",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:p.id})});if(!r.ok)throw Error((await r.json()).error||"Could not delete post");setPosts(old=>old.filter(x=>x.id!==p.id));setMenuId(null)}catch(e){setActionError(e instanceof Error?e.message:"Delete failed")}finally{setActionBusy(false)}}}>Delete</button></>}</div>}</div></div>
 
  {body&&<div className={styles.feedPostCaption}><span className={styles.igSuggestedTopic}>{suggestedTopic(p)}</span><p>{long&&!expanded[p.id]?body.slice(0,220).trimEnd()+"…":body}</p>{long&&<button type="button" onClick={()=>setExpanded(old=>({...old,[p.id]:!old[p.id]}))}>{expanded[p.id]?"Show less":"Read more"}</button>}</div>}
 
 </div>
 </div>
 {editingId===p.id&&<div className={styles.feedEditBox}><textarea aria-label="Edit post text" value={editText} maxLength={2000} onChange={e=>setEditText(e.target.value)}/><div><button type="button" disabled={actionBusy} onClick={()=>setEditingId(null)}>Cancel</button><button type="button" disabled={actionBusy||!editText.trim()} onClick={async()=>{setActionBusy(true);setActionError("");try{const r=await fetch("/api/community-posts",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:p.id,text:editText})});if(!r.ok)throw Error((await r.json()).error||"Could not save post");setPosts(old=>old.map(x=>x.id===p.id?{...x,body:editText.trim()}:x));setEditingId(null)}catch(e){setActionError(e instanceof Error?e.message:"Save failed")}finally{setActionBusy(false)}}}>Save changes</button></div></div>}
 
 <div className={styles.feedPostEngagement}><VisiblePostEngagement postId={p.id} mediaUrl={p.media_url} mediaType={p.media_type} youtube={video} night={night}/></div>
 
 <div className={styles.feedPostBottom}>
  {index<filtered.length-1?<button type="button" className={styles.feedNext} onClick={()=>moveDeck(index,index+1)} aria-label="Go to next Ummah post">◇&nbsp; Swipe up for next post &nbsp;⌄</button>:<span>You're all caught up ✧</span>}
  <Link href={"/posts/story/"+encodeURIComponent(p.id)}>VIEW POST ↗</Link>
 </div></article>})}</div>}
 </>:<section className={styles.igExplorePanel} aria-label="Explore Ummah posts">
  <div className={styles.igExploreSearch}><label className={styles.sr} htmlFor="ig-explore-input">Search posts or people</label><input id="ig-explore-input" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search posts or people…" autoComplete="off"/><span aria-hidden="true">⌕</span></div>
  <div className={styles.igTopicFilters} role="group" aria-label="Filter by suggested topic">{TOPICS.map(label=><button type="button" key={label} aria-pressed={topic===label} className={topic===label?styles.igTopicActive:""} onClick={()=>setTopic(label)}>{label}</button>)}</div>
  <p className={styles.igTopicNote}>Topics are suggested from post content. No hashtags required.</p>
  {loading?<p className={styles.status}>Loading posts…</p>:error?<p className={styles.status} role="alert">{error}</p>:!filtered.length?<p className={styles.status}>No posts match this search.</p>:<div className={styles.igExploreGrid}>{filtered.slice(0,72).map(p=>{
   const poster=p.media_items?.find(item=>item.type.startsWith("image/"))?.url||(p.media_type?.startsWith("image/")?p.media_url:youtubeIdFromPost(p.body,p.media_url)?ytThumbnail(youtubeIdFromPost(p.body,p.media_url)!):null);
   const moving=p.media_type?.startsWith("video/")||p.media_items?.some(item=>item.type.startsWith("video/"))||!!youtubeIdFromPost(p.body,p.media_url);
   return <Link href={"/posts/story/"+encodeURIComponent(p.id)+(moving?"?play=1":"")} className={styles.igExploreTile} key={p.id} aria-label={"View "+suggestedTopic(p)+" post by "+p.author_name}>
    <div className={styles.igExploreVisual}>{poster?<img src={poster} alt="" loading="lazy"/>:p.media_url&&p.media_type?.startsWith("video/")?<video src={p.media_url} muted playsInline preload="metadata" aria-hidden="true"/>:<span className={styles.igTextTile}>{clean(p.body).slice(0,130)||"From the Ummah"}</span>}{moving&&<span className={styles.igVideoBadge} aria-hidden="true">▶</span>}</div><span className={styles.igTileTopic}>{suggestedTopic(p)}</span>
   </Link>;
  })}</div>}
 </section>}
 {actionError&&<p role="alert" className={styles.status}>{actionError}</p>}
 <footer className={styles.footer}><span>1MUSLIM / THE PEOPLE'S EDITION</span><Link href="/community">JOIN THE CONVERSATION ↗</Link></footer></main>;
}
