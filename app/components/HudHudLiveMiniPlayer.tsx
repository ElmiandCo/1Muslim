"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLiveDiscovery } from "../../lib/live-discovery-client";
import LiveKitViewer from "../../components/LiveKitViewer";

type Stream={id:string;title:string;room_name:string;visibility:string|null;started_at:string};
const DISMISSED="1muslim-live-mini-dismissed";
export default function HudHudLiveMiniPlayer(){
 const pathname=usePathname();
 const discovery=useLiveDiscovery();
 const isBroadcastScreen=pathname==="/"||pathname.startsWith("/streaming")||pathname.startsWith("/live");
 const [position,setPosition]=useState({x:0,y:0});
 const drag=useRef<{x:number;y:number;ox:number;oy:number}|null>(null);
 const [stream,setStream]=useState<Stream|null>(null);
 const [open,setOpen]=useState(false);
 const [minimized,setMinimized]=useState(false);
 const [exiting,setExiting]=useState(false);
 const [endedNotice,setEndedNotice]=useState(false);
 const exitTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const dismissWithMotion=(ended=false)=>{if(ended)setEndedNotice(true);setExiting(true);if(exitTimer.current)clearTimeout(exitTimer.current);exitTimer.current=setTimeout(()=>{setOpen(false);setStream(null);setExiting(false);setEndedNotice(false)},ended?3200:520)};
 useEffect(()=>{const onEnded=(event:Event)=>{const id=(event as CustomEvent<{streamId?:string}>).detail?.streamId;if(id&&stream?.id!==id)return;dismissWithMotion(true)};window.addEventListener("1muslim:live-ended",onEnded);return()=>{window.removeEventListener("1muslim:live-ended",onEnded);if(exitTimer.current)clearTimeout(exitTimer.current)}},[stream?.id]);
 const [initialized,setInitialized]=useState(false);
 const [loading,setLoading]=useState(true);
 const hadLive=useRef<boolean|null>(null);
 const dismissed=useRef(false);

 useEffect(()=>{
  dismissed.current=sessionStorage.getItem(DISMISSED)==="yes";
  const previous=stream;
  const previousState=previous?.id?discovery.presence[previous.id]?.state:undefined;
  // An existing viewer stays connected during temporary host turbulence.
  if(previous && previousState==="RECONNECTING"){
   setInitialized(true);setLoading(false);return;
  }
  const ready=discovery.lives.find(x=>x.id===previous?.id)??discovery.lives[0];
  const current=ready?{id:ready.id,title:ready.title,room_name:ready.room_name,visibility:"public",started_at:ready.started_at}:null;
  const isLive=!!current;
  if(!isLive && hadLive.current===true && discovery.ready){
   dismissed.current=false;sessionStorage.removeItem(DISMISSED);dismissWithMotion(true);
  }
  if(isLive && hadLive.current===false && !dismissed.current){setOpen(true);setMinimized(false)}
  if(hadLive.current===null && isLive && !dismissed.current)setOpen(true);
  if(discovery.ready)hadLive.current=isLive;
  if(isLive)setStream(old=>old?.id===current.id?old:current);
  else if(discovery.ready)setStream(null);
  setInitialized(discovery.ready);setLoading(!discovery.ready);
 },[discovery.lives,discovery.presence,discovery.ready]);

 const close=()=>{dismissed.current=true;sessionStorage.setItem(DISMISSED,"yes");dismissWithMotion()};
 if(isBroadcastScreen||!initialized||loading||!open||!stream)return null;
 return <aside className={"hudhud-live-mini"+(minimized?" is-minimized":"")+(exiting?" is-exiting":"")+(endedNotice?" is-live-ended":"")} aria-label="Live stream notification" data-no-translate="true" style={{transform:`translate3d(${position.x}px,${position.y}px,0)`,touchAction:"pan-y"}}>
  <div className="hudhud-live-mini-head" style={{touchAction:"none",cursor:"grab"}} onPointerDown={e=>{if((e.target as HTMLElement).closest("button,a"))return;drag.current={x:e.clientX,y:e.clientY,ox:position.x,oy:position.y};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(!drag.current)return;setPosition({x:Math.max(-window.innerWidth*.65,Math.min(window.innerWidth*.65,drag.current.ox+e.clientX-drag.current.x)),y:Math.max(-window.innerHeight*.65,Math.min(window.innerHeight*.65,drag.current.oy+e.clientY-drag.current.y))})}} onPointerUp={()=>{drag.current=null}} onPointerCancel={()=>{drag.current=null}}>
   <img src="/assets/hudhud-logo.PNG" alt="" className="hudhud-live-bird" onError={e=>{e.currentTarget.style.display="none"}} />
   <div className="hudhud-live-mini-copy"><span className="hudhud-live-mini-badge">● LIVE NOW</span><strong>HudHud found a live stream!</strong><small>Keep learning while you listen.</small></div>
   <button type="button" onClick={()=>setMinimized(v=>!v)} aria-label={minimized?"Expand mini player":"Minimize mini player"}>{minimized?"▢":"−"}</button>
   <button type="button" onClick={close} aria-label="Dismiss live notification">×</button>
  </div>
  {endedNotice&&<div className="hudhud-live-ended-toast" role="status" aria-live="polite"><span>✦ LIVE COMPLETE</span><strong>The host has ended this Live</strong><small>Closing your player…</small></div>}
  {!minimized&&!endedNotice&&<><div className="hudhud-live-mini-video"><LiveKitViewer key={stream.id} roomName={stream.room_name} streamId={stream.id} embedded /></div>
   <div className="hudhud-live-mini-bottom"><span title={stream.title}>{stream.title}</span><Link href={`/streaming/live/${stream.id}`}>Open stream ↗</Link></div>
   <p className="hudhud-live-mini-hint">🐦 Continue courses and explore 1Muslim with this player open. Tap Unmute to listen.</p></>}
 </aside>;
}
