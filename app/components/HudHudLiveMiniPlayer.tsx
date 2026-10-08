"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createClient } from "../../utils/supabase/client";
import LiveKitViewer from "../../components/LiveKitViewer";

type Stream={id:string;title:string;room_name:string;visibility:string|null;started_at:string};
const DISMISSED="1muslim-live-mini-dismissed";
export default function HudHudLiveMiniPlayer(){
 const [stream,setStream]=useState<Stream|null>(null);
 const [open,setOpen]=useState(false);
 const [minimized,setMinimized]=useState(false);
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
   if(!isLive && hadLive.current===true){dismissed.current=false;sessionStorage.removeItem(DISMISSED);setOpen(false);setStream(null)}
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
 const close=()=>{dismissed.current=true;sessionStorage.setItem(DISMISSED,"yes");setOpen(false)};
 if(!initialized||loading||!open||!stream)return null;
 return <aside className={"hudhud-live-mini"+(minimized?" is-minimized":"")} aria-label="Live stream notification" data-no-translate="true">
  <div className="hudhud-live-mini-head">
   <img src="/assets/hudhud-logo.PNG" alt="" className="hudhud-live-bird" onError={e=>{e.currentTarget.style.display="none"}} />
   <div className="hudhud-live-mini-copy"><span className="hudhud-live-mini-badge">● LIVE NOW</span><strong>HudHud found a live stream!</strong><small>Keep learning while you listen.</small></div>
   <button type="button" onClick={()=>setMinimized(v=>!v)} aria-label={minimized?"Expand mini player":"Minimize mini player"}>{minimized?"▢":"−"}</button>
   <button type="button" onClick={close} aria-label="Dismiss live notification">×</button>
  </div>
  {!minimized&&<><div className="hudhud-live-mini-video"><LiveKitViewer key={stream.id} roomName={stream.room_name} streamId={stream.id} embedded /></div>
   <div className="hudhud-live-mini-bottom"><span title={stream.title}>{stream.title}</span><Link href={`/streaming/live/${stream.id}`}>Open stream ↗</Link></div>
   <p className="hudhud-live-mini-hint">🐦 Continue courses and explore 1Muslim with this player open. Tap Unmute to listen.</p></>}
 </aside>;
}
