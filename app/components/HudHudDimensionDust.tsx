"use client";
import {useEffect,useState} from "react";
import {usePathname} from "next/navigation";

/** Short, restrained entry shimmer. No persistent particle field or interaction blocking. */
export default function HudHudDimensionDust(){
 const pathname=usePathname();
 const [visible,setVisible]=useState(false);
 const [ending,setEnding]=useState(false);
 useEffect(()=>{
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  if(window.matchMedia("(prefers-reduced-data: reduce)").matches)return;
  if(pathname!=="/")return;
  const start=window.setTimeout(()=>setVisible(true),120);
  const fade=window.setTimeout(()=>setEnding(true),1550);
  const end=window.setTimeout(()=>setVisible(false),2300);
  return()=>{clearTimeout(start);clearTimeout(fade);clearTimeout(end)};
 },[pathname]);
 if(!visible)return null;
 return <div className={"hh-entry-light"+(ending?" isLeaving":"")} aria-hidden="true" data-no-tap-shimmer>
  <span className="hh-entry-halo"/><span className="hh-entry-ray"/><span className="hh-entry-line"/>
  <style jsx>{`
   .hh-entry-light{position:fixed;inset:0;z-index:60;overflow:hidden;pointer-events:none;opacity:1;transition:opacity .7s ease;contain:strict}
   .hh-entry-light.isLeaving{opacity:0}
   .hh-entry-halo{position:absolute;left:50%;top:42%;width:min(80vw,540px);aspect-ratio:1;border-radius:50%;transform:translate(-50%,-50%) scale(.7);background:radial-gradient(circle,#c8f8da16 0%,#66d6a50c 35%,transparent 72%);animation:hhHalo 1.8s cubic-bezier(.2,.8,.2,1) both}
   .hh-entry-ray{position:absolute;inset:-35%;background:conic-gradient(from 180deg at 50% 42%,transparent 0deg,transparent 148deg,#e2c78116 175deg,#92f0bb1b 185deg,transparent 211deg,transparent 360deg);transform:rotate(-18deg);animation:hhRay 2s ease-out both}
   .hh-entry-line{position:absolute;left:50%;top:42%;width:min(65vw,380px);height:1px;transform:translate(-50%,-50%) scaleX(0);background:linear-gradient(90deg,transparent,#d6bc7c,#a4f4c3,transparent);box-shadow:0 0 18px #d8c07d55;animation:hhLine 1.3s ease-out both}
   @keyframes hhHalo{0%{opacity:0;transform:translate(-50%,-50%) scale(.6)}50%{opacity:1}100%{opacity:.25;transform:translate(-50%,-50%) scale(1.25)}}
   @keyframes hhRay{from{opacity:0;transform:rotate(-18deg)}45%{opacity:.9}to{opacity:0;transform:rotate(14deg)}}
   @keyframes hhLine{0%{opacity:0;transform:translate(-50%,-50%) scaleX(0)}35%{opacity:.85}100%{opacity:0;transform:translate(-50%,-50%) scaleX(1)}}
   @media(prefers-reduced-motion:reduce){.hh-entry-light{display:none}}
  `}</style>
 </div>;
}
