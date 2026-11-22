"use client";
import Link from "next/link";
import {cleanPostBody} from "../lib/cleanPostBody";
import {useEffect,useMemo,useRef,useState,type CSSProperties,type TouchEvent} from "react";
import {useRouter} from "next/navigation";
import {readWatchedPosts,storeImmersiveQueue,UMMAH_WATCH_UPDATED_EVENT,type WatchedPost} from "../lib/ummah-watch-history";
import UnifiedPostMedia from "../components/UnifiedPostMedia";
import OneMuslimVideo from "../components/OneMuslimVideo";
import {predictVideo,cachePublicImage} from "../../lib/smart-media";
import PostAuthorFollow from "../components/PostAuthorFollow";
import styles from "./posts-magazine.module.css";
type Post={id:string;body:string;author_name:string;author_handle:string;created_at:string;media_url:string|null;media_type:string|null;shahada_verified?:boolean;author_id:string;author_avatar_url?:string|null};
const youtubeId=(text:string)=>text.match(/(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?(?:[^#\s]*?&)?v=|shorts\/|embed\/|live\/))([\w-]{11})/)?.[1]||null;
const ytThumbnail=(id:string)=>`https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
const clean=(text:string)=>cleanPostBody(text).replace(/https?:\/\/\S+/g,"").trim();
// Avoid mounting dozens of individual comment fetchers and autoplay decoders at once.
// Near-viewport cards become interactive before the user actually reaches them.
function VisiblePostEngagement({postId,mediaUrl,mediaType,youtube}:{postId:string;mediaUrl:string|null;mediaType:string|null;youtube:string|null}){
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
  {near?<div ref={content}><UnifiedPostMedia postId={postId} mediaUrl={mediaUrl} mediaType={mediaType} youtubeId={youtube} showVideo={false}/></div>:null}
 </div>;
}
function VisiblePostVideo({postId,mediaUrl,youtube}:{postId:string;mediaUrl:string|null;youtube:string|null}){
 const node=useRef<HTMLDivElement|null>(null);
 const [near,setNear]=useState(false);
 useEffect(()=>{const el=node.current;if(!el)return;if(typeof IntersectionObserver==="undefined"){setNear(true);return}const o=new IntersectionObserver(([entry])=>setNear(entry.isIntersecting),{rootMargin:"800px 0px 800px 0px",threshold:0});o.observe(el);return()=>o.disconnect()},[]);
 return <div ref={node} className={styles.feedVideoStage}>{near?<OneMuslimVideo videoKey={"public-post:"+postId} src={mediaUrl||""} youtubeId={youtube} title="Ummah video"/>:<div className={styles.feedVideoPlaceholder}>{youtube?<img src={ytThumbnail(youtube)} alt="" loading="lazy"/>:<span aria-hidden="true">▶</span>}<small>Video ready to play</small></div>}</div>;
}

let cachedDiscover:{posts:Post[];viewerId:string|null;at:number}|null=null;
export default function PublicPostsSocial(){
 const router=useRouter();
 // Native proximity snapping stops a fling at the next post. Keep controls and comment
 // threads on the browser's normal touch/scroll path instead of hijacking gestures.
 useEffect(()=>{
  const root=document.scrollingElement as HTMLElement|null;
  if(!root)return;
  const previousType=root.style.scrollSnapType;
  const previousPadding=root.style.scrollPaddingTop;
  root.style.scrollSnapType="y proximity";
  root.style.scrollPaddingTop="16px";
  return()=>{root.style.scrollSnapType=previousType;root.style.scrollPaddingTop=previousPadding};
 },[]);

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
  const result=posts.filter(p=>(p.body+" "+p.author_name+" "+p.author_handle).toLowerCase().includes(search));
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
 },[posts,query,filter,history,scores]);
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
   if(item.media_url&&item.media_type?.startsWith("video/"))predictVideo(item.media_url);
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
  if(first.media_url&&first.media_type?.startsWith("video/"))predictVideo(first.media_url);
  router.push("/posts/story/"+encodeURIComponent(first.id)+"?play=1");
 };
 useEffect(()=>{
  // Warm the first two public native video candidates, without preloading full files.
  const upcoming=filtered.filter(p=>p.media_url&&(p.media_type?.startsWith("video/")||/\\.(mp4|webm)(?:\\?|$)/i.test(p.media_url))).slice(0,2);
  for(const post of upcoming)if(post.media_url)predictVideo(post.media_url);
  // Cache only public same-origin static images; signed user media is deliberately excluded.
  for(const post of filtered.slice(0,8))if(post.media_url&&post.media_type?.startsWith("image/"))void cachePublicImage(post.media_url);
 },[filtered]);
 const stories=useMemo(()=>{const seen=new Set<string>();return posts.filter(p=>{const key=p.author_handle||p.author_name;if(seen.has(key))return false;seen.add(key);return true}).slice(0,12)},[posts]);
 return <main className={styles.page+" "+styles.feedPage+" "+styles.discoverPage}><div className={styles.discoverHead}><div className={styles.discoverTitle}><h1>Discover</h1><span>✧</span><p>Explore your Ummah.</p></div><div className={styles.discoverActions}><Link href="/search" aria-label="Search 1Muslim">⌕</Link><Link href="/create">▣ Create</Link></div></div>
 <section className={styles.discoverPeople} aria-label="Discover community members"><div className={styles.feedStoryRail}><Link href="/create" className={styles.feedStoryPerson}><span className={styles.feedStoryRing}><span>＋</span></span><small>Your Story</small></Link>{stories.map(p=><Link href={`/profile?section=muslimeen&member=${encodeURIComponent(p.author_id)}`} className={styles.feedStoryPerson} key={p.id}><span className={styles.feedStoryRing}><span>{p.author_avatar_url?<img className={styles.authorAvatarImage} src={p.author_avatar_url} alt="" loading="lazy" referrerPolicy="no-referrer"/>:(p.author_name||"M").slice(0,1).toUpperCase()}</span></span><small>{p.author_handle||p.author_name}</small></Link>)}</div></section>
 <div className={styles.discoverFilters}><div className={styles.feedTabs} role="group" aria-label="Choose Discover feed">
 <button type="button" className={filter==="forYou"?styles.active:""} aria-pressed={filter==="forYou"} onClick={()=>setFilter("forYou")}>✧ For You</button>
 <button type="button" className={filter==="lastWatched"?styles.active:""} aria-pressed={filter==="lastWatched"} onClick={()=>setFilter("lastWatched")}>◷ Last Watched</button>
 <button type="button" className={filter==="popular"?styles.active:""} aria-pressed={filter==="popular"} onClick={()=>setFilter("popular")}>✦ Most Popular</button>
 <button type="button" className={styles.immersivePlayTab} aria-label="Play immersive swipe feed" title="Play full-screen swipe feed" disabled={!filtered.length} onClick={startImmersive}><svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" aria-hidden="true"><path d="M8.2 4.6c0-.9 1-1.4 1.8-.9l10.2 7.1c.8.5.8 1.5 0 2L10 20c-.8.5-1.8 0-1.8-.9V4.6Z"/></svg><span>Play</span></button></div><label className={styles.discoverSearch}><span className={styles.sr}>Search posts or people</span><input id="discover-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search posts or people…"/></label></div>
  {loading?<div className={styles.status}>LOADING YOUR FEED…</div>:error?<div className={styles.status} role="alert">{error}</div>:filter==="popular"&&rankStatus==="loading"?<div className={styles.status}>RANKING POSTS BY REAL ENGAGEMENT…</div>:filter==="popular"&&rankStatus==="error"?<div className={styles.status} role="alert">Popularity rankings are temporarily unavailable. Please try again shortly.</div>:!filtered.length?<div className={styles.status}>{filter==="lastWatched"?"No videos watched yet on this device. Open a video and play it to begin your history.":"NO POSTS FOUND YET."}</div>:<div ref={deckRoot} className={styles.feedStream+" "+styles.ummahSnapFeed} aria-label="Swipeable Ummah card deck">{filtered.map((p,index)=>{const video=youtubeId(p.body),isImage=!!p.media_url&&!!p.media_type?.startsWith("image/"),body=clean(p.body),long=body.length>220,hasVideo=!!video||!!p.media_type?.startsWith("video/");const nextPost=filtered[index+1];
 const nextVideoId=nextPost?youtubeId(nextPost.body):null;
 const nextPreview=nextPost?.media_type?.startsWith("image/")?nextPost.media_url:nextVideoId?ytThumbnail(nextVideoId):null;
 const poster=isImage?p.media_url:video?ytThumbnail(video):null;
 const state=deckMotion?(index===deckMotion.from?"leaving":index===deckMotion.to?"arriving":index===deckActive+1?"queued":index===deckActive-1?"past":"rest"):index===deckActive?"current":index===deckActive+1?"queued":index===deckActive-1?"past":"rest";
 const posterStyle=poster&&(index===deckActive||index===deckActive+1)?({"--ummah-poster":"url("+JSON.stringify(poster)+")"} as CSSProperties):undefined;
 return <article className={styles.feedPost} id={"ummah-post-"+p.id} data-ummah-index={index} data-deck-state={state} data-deck-direction={deckMotion?.direction===-1?"reverse":"forward"} style={posterStyle} onTouchStart={e=>onCardTouchStart(index,e)} onTouchEnd={e=>onCardTouchEnd(index,e)} onTouchCancel={()=>{deckTouch.current=null}} key={p.id} aria-label={"Post by "+(p.author_name||"Community member")}>
 {index<filtered.length-1&&<div aria-hidden="true" className={styles.feedNextGhost} style={index===deckActive&&nextPreview?{backgroundImage:"url("+JSON.stringify(nextPreview)+")"}:undefined}/>}

 <div className={styles.feedPostStage}>
 {isImage&&<Link href={`/posts/story/${encodeURIComponent(p.id)}`} className={styles.feedMediaLink}><img src={p.media_url!} alt="Community post" width={960} height={1200} loading={index<2?"eager":"lazy"} decoding="async" fetchPriority={index===0?"high":"auto"} style={{backgroundColor:"#f1f3f6"}}/></Link>}
 
 {hasVideo&&<VisiblePostVideo postId={p.id} mediaUrl={p.media_url} youtube={video}/>}
 {!isImage&&!hasVideo&&<div className={styles.feedTextCanvas} aria-hidden="true"><span>✧</span><strong>FROM THE UMMAH</strong><small>Voices of our community</small></div>}
 <div className={styles.feedPostGlass}>
  <Link href={"/profile?section=muslimeen&member="+encodeURIComponent(p.author_id)} className={styles.feedAvatarEdge} aria-label={"View "+(p.author_name||"member")+" profile"}><span className={styles.feedPostAvatar}>{p.author_avatar_url?<img className={styles.authorAvatarImage} src={p.author_avatar_url} alt="" loading="lazy" referrerPolicy="no-referrer"/>:(p.author_name||"M").slice(0,1).toUpperCase()}</span></Link>
  <div className={styles.feedPostHeader}><Link href={`/profile?section=muslimeen&member=${encodeURIComponent(p.author_id)}`} className={styles.feedPostIdentity}><span><strong>{p.author_name||"Community member"} {p.shahada_verified?"✦":""}</strong><small>{p.author_handle} · {new Date(p.created_at).toLocaleDateString(undefined,{month:"short",day:"numeric"})}</small></span></Link><PostAuthorFollow authorId={p.author_id} viewerId={viewerId}/><div className={styles.feedMenuWrap}><button type="button" className={styles.feedPostMore} aria-label="Post options" aria-expanded={menuId===p.id} onClick={()=>{setMenuId(v=>v===p.id?null:p.id);setActionError("")}}>•••</button>{menuId===p.id&&<div className={styles.feedPostMenu}><Link href={`/posts/story/${encodeURIComponent(p.id)}`}>View</Link>{viewerId===p.author_id&&<><button type="button" onClick={()=>{setEditingId(p.id);setEditText(p.body);setMenuId(null)}}>Edit</button><button type="button" disabled={actionBusy} onClick={async()=>{if(!window.confirm("Delete this post permanently?"))return;setActionBusy(true);setActionError("");try{const r=await fetch("/api/community-posts",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:p.id})});if(!r.ok)throw Error((await r.json()).error||"Could not delete post");setPosts(old=>old.filter(x=>x.id!==p.id));setMenuId(null)}catch(e){setActionError(e instanceof Error?e.message:"Delete failed")}finally{setActionBusy(false)}}}>Delete</button></>}</div>}</div></div>
 
  {body&&<div className={styles.feedPostCaption}><p>{long&&!expanded[p.id]?body.slice(0,220).trimEnd()+"…":body}</p>{long&&<button type="button" onClick={()=>setExpanded(old=>({...old,[p.id]:!old[p.id]}))}>{expanded[p.id]?"Show less":"Read more"}</button>}</div>}
 
 </div>
 </div>
 {editingId===p.id&&<div className={styles.feedEditBox}><textarea aria-label="Edit post text" value={editText} maxLength={2000} onChange={e=>setEditText(e.target.value)}/><div><button type="button" disabled={actionBusy} onClick={()=>setEditingId(null)}>Cancel</button><button type="button" disabled={actionBusy||!editText.trim()} onClick={async()=>{setActionBusy(true);setActionError("");try{const r=await fetch("/api/community-posts",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:p.id,text:editText})});if(!r.ok)throw Error((await r.json()).error||"Could not save post");setPosts(old=>old.map(x=>x.id===p.id?{...x,body:editText.trim()}:x));setEditingId(null)}catch(e){setActionError(e instanceof Error?e.message:"Save failed")}finally{setActionBusy(false)}}}>Save changes</button></div></div>}
 
 <div className={styles.feedPostEngagement}><VisiblePostEngagement postId={p.id} mediaUrl={p.media_url} mediaType={p.media_type} youtube={video}/></div>
 
 <div className={styles.feedPostBottom}>
  {index<filtered.length-1?<button type="button" className={styles.feedNext} onClick={()=>moveDeck(index,index+1)} aria-label="Go to next Ummah post">◇&nbsp; Swipe up for next post &nbsp;⌄</button>:<span>You're all caught up ✧</span>}
  <Link href={"/posts/story/"+encodeURIComponent(p.id)}>VIEW POST ↗</Link>
 </div></article>})}</div>}
 {actionError&&<p role="alert" className={styles.status}>{actionError}</p>}
 <footer className={styles.footer}><span>1MUSLIM / THE PEOPLE'S EDITION</span><Link href="/community">JOIN THE CONVERSATION ↗</Link></footer></main>;
}
