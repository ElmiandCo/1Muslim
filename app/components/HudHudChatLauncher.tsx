"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createClient } from "../../utils/supabase/client";

export default function HudHudChatLauncher() {
 const [open,setOpen]=useState(false);
 const [signedIn,setSignedIn]=useState(false);
 const [position,setPosition]=useState({x:20,y:170});
 const [dragged,setDragged]=useState(false);
 const drag=useRef<{x:number;y:number;px:number;py:number}|null>(null);
 useEffect(()=>{
  const supabase=createClient();
  let active=true;
  void supabase.auth.getUser().then(({data})=>{if(active)setSignedIn(!!data.user)});
  const {data:listener}=supabase.auth.onAuthStateChange((_event,session)=>setSignedIn(!!session?.user));
  return()=>{active=false;listener.subscription.unsubscribe()};
 },[]);
 const move=(e:React.PointerEvent<HTMLButtonElement>)=>{
  if(!drag.current)return;
  const d=drag.current;
  if(Math.abs(e.clientX-d.x)+Math.abs(e.clientY-d.y)>8)setDragged(true);
  setPosition({x:Math.max(8,Math.min(window.innerWidth-74,d.px+e.clientX-d.x)),y:Math.max(8,Math.min(window.innerHeight-74,d.py+e.clientY-d.y))});
 };
 return <>
  <button className="hh-chat-orb" style={{left:position.x,top:position.y}} aria-label="Start a chat with HudHud" title="Chat with HudHud"
   onPointerDown={e=>{drag.current={x:e.clientX,y:e.clientY,px:position.x,py:position.y};setDragged(false);e.currentTarget.setPointerCapture(e.pointerId)}}
   onPointerMove={move}
   onPointerUp={()=>{drag.current=null}}
   onClick={()=>{if(dragged){setDragged(false);return}setOpen(v=>!v)}}><img src="/assets/hudhud-logo.PNG" alt="" /><span className="hh-orb-glow" /></button>
  {open&&<aside className="hh-chat-panel" aria-label="HudHud assistant" data-no-translate="true">
   <header><img src="/assets/hudhud-logo.PNG" alt="" /><strong>Chat with HudHud ✨</strong><button onClick={()=>setOpen(false)} aria-label="Close HudHud">✕</button></header>
   <div className="hh-chat-body"><div className="hh-chat-welcome">🦅 Assalamu alaikum! Welcome to 1Muslim.</div>
    <p>{signedIn?"HudHud is here to help you explore. Full AI chat will be available once the assistant service is connected.":"Explore the site with me! Sign in to access member-only HudHud features."}</p>
    {!signedIn&&<Link href="/login" className="hh-chat-signin">Sign in to continue →</Link>}
   </div>
  </aside>}
  <style jsx>{`
   .hh-chat-orb{position:fixed;z-index:9990;width:64px;height:64px;display:grid;place-items:center;border-radius:50%;border:1px solid #7ce6ff;background:radial-gradient(circle,#19416a,#061427);box-shadow:0 0 22px #43b9ff80;cursor:grab;touch-action:none;animation:hhFloat 3.5s ease-in-out infinite}
   .hh-chat-orb:active{cursor:grabbing}.hh-chat-orb img{width:53px;height:53px;object-fit:contain;position:relative;z-index:2}.hh-orb-glow{position:absolute;inset:-6px;border-radius:50%;border:1px solid #78e9ff66;animation:hhPulse 2.8s ease-in-out infinite}
   .hh-chat-panel{position:fixed;z-index:9991;bottom:90px;left:clamp(10px,4vw,80px);width:min(92vw,365px);background:#071629f5;color:#fff;border:1px solid #63d3ff88;border-radius:22px;box-shadow:0 20px 60px #0009,0 0 25px #2e8ac744;overflow:hidden;animation:hhOpen .35s ease-out}
   .hh-chat-panel header{display:flex;align-items:center;gap:12px;padding:14px 16px;background:linear-gradient(110deg,#0c3359,#18234c)}.hh-chat-panel header img{width:34px;height:34px;object-fit:contain}.hh-chat-panel header strong{flex:1}.hh-chat-panel header button{background:none;border:0;color:#fff;cursor:pointer;font-size:19px}
   .hh-chat-body{padding:22px}.hh-chat-welcome{padding:14px;background:#16436b;border:1px solid #71c6ff55;border-radius:15px;animation:hhOpen .6s ease-out}.hh-chat-body p{line-height:1.55;color:#d4e4f4}.hh-chat-signin{display:block;text-align:center;margin-top:20px;background:#0c9cbd;color:white;text-decoration:none;border-radius:13px;padding:13px;font-weight:700}
   @keyframes hhFloat{50%{transform:translateY(-7px)}}@keyframes hhPulse{50%{box-shadow:0 0 20px #6be4ff99;transform:scale(1.09)}}@keyframes hhOpen{from{opacity:0;transform:translateY(16px) scale(.94)}to{opacity:1;transform:translateY(0) scale(1)}}
   @media(prefers-reduced-motion:reduce){.hh-chat-orb,.hh-orb-glow,.hh-chat-panel,.hh-chat-welcome{animation:none}}
  `}</style>
 </>;
}
