"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import {useEffect,useMemo,useRef,useState,type TouchEvent} from "react";
import {createClient} from "../../utils/supabase/client";
import {useLiveDiscovery,type VerifiedLive} from "../../lib/live-discovery-client";
import styles from "./ummah-live-for-you.module.css";

// A single preview is mounted only near the viewport. Full participation,
// comments, reactions and guest controls remain in the established Live viewer.
const LiveKitViewer=dynamic(()=>import("../../components/LiveKitViewer"),{ssr:false});
type PublicHost={id:string;display_name:string|null;username:string|null;hide_1muslim_id:boolean|null;avatar_url:string|null};
function publicName(host:PublicHost|undefined){return host?.display_name?.trim()||(!host?.hide_1muslim_id&&host?.username)||"1Muslim creator"}
function mediaMode(live:VerifiedLive){
 const presence=Array.isArray(live.live_presence)?live.live_presence[0]:live.live_presence;
 return presence?.state==="READY_AUDIO"?"audio":"video";
}

export default function UmmahLiveForYou(){
 const {lives,presence}=useLiveDiscovery();
 const [index,setIndex]=useState(0);
 const [hosts,setHosts]=useState<Record<string,PublicHost>>({});
 const [inView,setInView]=useState(false);
 const [visible,setVisible]=useState(true);
 const container=useRef<HTMLElement|null>(null);
 const startTouch=useRef<{x:number;y:number}|null>(null);
 // The existing authenticated Live discovery client is the source of truth;
 // never synthesize LIVE cards from static posts or an unverified status flag.
 const current=useMemo(()=>lives.filter(live=>{
  const state=presence[live.id]?.state || (Array.isArray(live.live_presence)?live.live_presence[0]?.state:live.live_presence?.state);
  return (state==="READY_VIDEO"||state==="READY_AUDIO")&&
   (!live.scheduled_end_at||Date.parse(live.scheduled_end_at)>Date.now());
 }).sort((a,b)=>{
  const aVideo=mediaMode(a)==="video"?1:0,bVideo=mediaMode(b)==="video"?1:0;
  return bVideo-aVideo||(b.viewer_count||0)-(a.viewer_count||0)||b.started_at.localeCompare(a.started_at);
 }),[lives,presence]);
 const live=current[Math.min(index,Math.max(0,current.length-1))];
 const selectedId=live?.id||"";
 useEffect(()=>setIndex(n=>Math.min(n,Math.max(0,current.length-1))),[current.length]);
 useEffect(()=>{
  let active=true;
  const ids=[...new Set(current.map(item=>item.host_id).filter(Boolean))];
  if(!ids.length)return;
  void createClient().from("profiles").select("id,display_name,username,hide_1muslim_id,avatar_url").in("id",ids)
   .then(({data,error})=>{
    if(!active||error)return;
    const map:Record<string,PublicHost>={};
    for(const row of data||[])map[row.id]=row as PublicHost;
    setHosts(old=>({...old,...map}));
   });
  return()=>{active=false};
 },[current.map(item=>item.host_id).join("|")]);
 useEffect(()=>{
  const node=container.current;
  if(!node)return;
  const observer=new IntersectionObserver(([entry])=>setInView(entry.isIntersecting),{rootMargin:"200px 0px",threshold:0.01});
  observer.observe(node);
  return()=>observer.disconnect();
 },[current.length>0]);
 useEffect(()=>{
  const update=()=>setVisible(document.visibilityState==="visible");
  document.addEventListener("visibilitychange",update);
  return()=>document.removeEventListener("visibilitychange",update);
 },[]);
 const change=(delta:number)=>setIndex(previous=>current.length?(previous+delta+current.length)%current.length:0);
 const onTouchStart=(event:TouchEvent<HTMLElement>)=>{
  const target=event.target;
  if(target instanceof Element&&target.closest("a,button,input,textarea")){startTouch.current=null;return}
  const touch=event.touches[0];
  startTouch.current=touch?{x:touch.clientX,y:touch.clientY}:null;
 };
 const onTouchEnd=(event:TouchEvent<HTMLElement>)=>{
  const start=startTouch.current;
  startTouch.current=null;
  const touch=event.changedTouches[0];
  if(!start||!touch||current.length<2)return;
  const dx=touch.clientX-start.x,dy=touch.clientY-start.y;
  // Horizontal-only swipe: never steal normal vertical scrolling of Ummah Posts.
  if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.4)change(dx<0?1:-1);
 };
 const share=async()=>{
  if(!live)return;
  const url=window.location.origin+"/streaming/live/"+encodeURIComponent(live.id);
  try{if(navigator.share)await navigator.share({url,title:live.title});
      else await navigator.clipboard.writeText(url);}
  catch{/* Cancelled shares should leave the feed untouched. */}
 };
 if(!current.length)return null;
 const host=hosts[live.host_id];
 const avatar=host?.avatar_url?.startsWith("https://")?host.avatar_url:"/assets/avatars/default-male.jpg";
 const previewSrc=live.thumbnail_path?createClient().storage.from("live-recordings").getPublicUrl(live.thumbnail_path).data.publicUrl:null;
 const audio=mediaMode(live)==="audio";
 return <section ref={container} className={styles.section} aria-label="Live now in the Ummah" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
  <div className={styles.heading}>
   <span className={styles.headingTitle}><i aria-hidden="true"/> LIVE <span>For You</span></span>
   <Link href="/streaming" className={styles.allStreams}>All Lives ↗</Link>
  </div>
  <div className={styles.frame}>
   <div className={styles.backdrop} style={previewSrc?{backgroundImage:"url("+JSON.stringify(previewSrc)+")"}:undefined}/>
   {inView&&visible&&!audio&&<div className={styles.player} key={selectedId} aria-hidden="true"><LiveKitViewer embedded previewMuted smartMobileCrop streamId={live.id} roomName={live.room_name}/></div>}
   {audio&&<div className={styles.audioPortrait} aria-hidden="true"><img src={avatar} alt=""/><span>LIVE AUDIO</span></div>}
   <div className={styles.gradient} aria-hidden="true"/>
   <div className={styles.topBar}><span className={styles.liveBadge}>● LIVE</span><span className={styles.viewers} aria-label={(live.viewer_count||0)+" watching"}>{(live.viewer_count||0).toLocaleString()} watching</span></div>
   <div className={styles.rightActions}>
    <Link className={styles.hostAvatar} href={"/profile?section=muslimeen&member="+encodeURIComponent(live.host_id)} aria-label={"View "+publicName(host)+" profile"}><img src={avatar} alt=""/></Link>
    <Link className={styles.roundAction} href={"/streaming/live/"+encodeURIComponent(live.id)} aria-label="Join live conversation"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true"><path d="M5 6h14v10H9l-4 3V6Z"/><path d="M8 10h8M8 13h5"/></svg><small>Chat</small></Link>
    <button className={styles.roundAction} type="button" onClick={()=>void share()} aria-label="Share this live"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true"><path d="M12 16V4m0 0-4 4m4-4 4 4"/><path d="M5 13v6h14v-6"/></svg><small>Share</small></button>
   </div>
   <div className={styles.caption}><span>@{publicName(host).replace(/^@/,"")}</span><h3>{live.title||"Live with the Ummah"}</h3><p>{live.category||"Community"} · {audio?"Audio room":"Live video"}</p><Link href={"/streaming/live/"+encodeURIComponent(live.id)} className={styles.watch} aria-label={"Watch live: "+live.title}>Watch LIVE <span aria-hidden="true">↗</span></Link></div>
   {current.length>1&&<div className={styles.carouselControls} aria-label="Switch active Lives"><button type="button" onClick={()=>change(-1)} aria-label="Previous Live">‹</button><span>{index+1} / {current.length}</span><button type="button" onClick={()=>change(1)} aria-label="Next Live">›</button></div>}
  </div>
  <div className={styles.underneath}><span>{current.length} active {current.length===1?"Live":"Lives"} in the Ummah</span><span>Swipe sideways to explore · Tap to watch</span></div>
 </section>;
}
