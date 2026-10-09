"use client";
import { useEffect, useRef, useState } from "react";

const KEY="1muslim-hudhud-home-intro-seen-v1";
export default function HudHudHomeIntro(){
 const [visible,setVisible]=useState(false);
 const video=useRef<HTMLVideoElement>(null);
 useEffect(()=>{
  try{if(sessionStorage.getItem(KEY))return;sessionStorage.setItem(KEY,"1");}catch{return;}
  setVisible(true);
 },[]);
 useEffect(()=>{if(!visible)return;const timeout=window.setTimeout(()=>setVisible(false),7500);return()=>window.clearTimeout(timeout)},[visible]);
 if(!visible)return null;
 return <div className="hudhudIntro" role="dialog" aria-label="HudHud welcome animation" aria-modal="false">
  <button className="hudhudSkip" onClick={()=>setVisible(false)} aria-label="Skip HudHud animation">Skip ✕</button>
  <video ref={video} autoPlay playsInline muted preload="auto" onEnded={()=>setVisible(false)} onError={()=>setVisible(false)} aria-label="HudHud flying in with a book">
   <source src="/videos/hudhud-intro-alpha.webm" type="video/webm" />
  </video>
  <div className="hudhudCaption">HudHud welcomes you to 1Muslim ✨</div>
  <style jsx>{`.hudhudIntro{position:fixed;inset:0;z-index:9999;pointer-events:none;display:flex;justify-content:center;align-items:center;background:rgba(2,10,15,.16);animation:appear .4s ease-out}.hudhudIntro video{height:min(85vh,760px);max-width:94vw;object-fit:contain;filter:drop-shadow(0 0 25px rgba(51,170,255,.2))}.hudhudSkip{position:absolute;right:clamp(14px,5vw,70px);top:clamp(16px,5vh,45px);z-index:2;pointer-events:auto;border:1px solid rgba(255,255,255,.3);background:rgba(4,12,23,.82);color:white;border-radius:999px;padding:11px 18px;cursor:pointer}.hudhudCaption{position:absolute;bottom:6vh;left:50%;transform:translateX(-50%);color:white;text-align:center;text-shadow:0 2px 12px #050e19;font-size:clamp(13px,2vw,19px);white-space:nowrap}@keyframes appear{from{opacity:0}to{opacity:1}}@media(prefers-reduced-motion:reduce){.hudhudIntro{animation:none}}`}</style>
 </div>
}
