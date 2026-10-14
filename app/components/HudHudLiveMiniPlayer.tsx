"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "../../utils/supabase/client";
import LiveKitViewer from "../../components/LiveKitViewer";

type Stream={id:string;title:string;room_name:string;visibility:string|null;started_at:string};
const DISMISSED="1muslim-live-mini-dismissed";
export default function HudHudLiveMiniPlayer(){
 const pathname=usePathname();
 const isBroadcastScreen=pathname.startsWith("/streaming/go-live")||pathname.startsWith("/streaming/live/");
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
 const supabase=useRef(createClient());
 useEffect(()=>{
  dismissed.current=sessionStorage.getItem(DISMISSED)==="yes";
  let active=true;
  const load=async()=>{
   const {data,error}=await supabase.current.from("live_streams")
    .select("id,title,room_name,visibility,started_at")
    .eq("status","live").eq("visibility","public")
    .gte("last_heartbeat_at",new Date(Date.now()-60_000).toISOString())
    .order("started_at",{ascending:false}).limit(1);
   if(!active||error)return;
   const current=(data?.[0]??null) as Stream|null;
   const isLive=!!current;
   // Dismissal applies to the entire current live period, not just one host.
   if(!isLive && hadLive.current===true){dismissed.current=false;sessionStorage.removeItem(DISMISSED);dismissWithMotion(true)}
   if(isLive && hadLive.current===false && !dismissed.current){setOpen(true);setMinimized(false)}
   if(hadLive.current===null && isLive && !dismissed.current){setOpen(true)}
   hadLive.current=isLive;
   if(isLive){setStream(old=>old?.id===current?.id?old:current)}
   else setStream(null);
   setInitialized(true);setLoading(false);
  };
  void load();
  const timer=window.setInterval(()=>void load(),10000);
  const channel=supabase.current.channel("hudhud-global-live-alert").on("postgres_changes",{event:"*",schema:"public",table:"live_streams"},()=>void load()).subscribe();
  return()=>{active=false;window.clearInterval(timer);void supabase.current.removeChannel(channel)};
 },[]);
 const close=()=>{dismissed.current=true;sessionStorage.setItem(DISMISSED,"yes");dismissWithMotion()};
 if(isBroadcastScreen||!initialized||loading||!open||!stream)return null;
 return <aside className={"hudhud-live-mini"+(minimized?" is-minimized":"")+(exiting?" is-exiting":"")+(endedNotice?" is-live-ended":"")} aria-label="Live stream notification" data-no-translate="true">
  <div className="hudhud-live-mini-head">
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
