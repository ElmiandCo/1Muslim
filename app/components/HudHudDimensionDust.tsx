"use client";
import { useEffect, useState } from "react";

type Speck = { id:number; left:number; delay:number; duration:number; size:number; drift:number; opacity:number };
const specks:Speck[] = Array.from({length:95},(_,id)=>({
 id,left:(id*37.73)%100,delay:-((id*1.87)%17),duration:12+(id*7.31)%15,
 size:2+(id%6),drift:-65+(id*29)%130,opacity:.38+(id%5)*.105
}));
export default function HudHudDimensionDust(){
 const [active,setActive]=useState(true);
 const [opening,setOpening]=useState(false);
 useEffect(()=>{
  setOpening(true);
  const timeout=window.setTimeout(()=>setOpening(false),16000);
  const query=window.matchMedia("(prefers-reduced-motion: reduce)");
  const update=()=>setActive(!query.matches);
  update();query.addEventListener("change",update);
  return()=>{window.clearTimeout(timeout);query.removeEventListener("change",update)};
 },[]);
 if(!active||!opening)return null;
 return <div className="hh-dimension-dust" aria-hidden="true" data-no-tap-shimmer>
  {specks.map(p=><span key={p.id} className="hh-dust-speck" style={{
   left:`${p.left}%`,width:p.size,height:p.size,
   opacity:p.opacity,animationDelay:`${Math.max(0,(p.id%9)*.22)}s`,animationDuration:`${6+(p.id%6)*.6}s`,
   ["--hh-drift" as string]:`${p.drift}px`
  }}/>)}
  <style jsx>{`
   .hh-dimension-dust{position:fixed;inset:0;z-index:900;pointer-events:none;overflow:hidden;contain:strict}
   .hh-dust-speck{position:absolute;top:-5vh;border-radius:50%;background:linear-gradient(135deg,#dfffff,#55eaff,#a66bff);box-shadow:0 0 10px 3px #42dfffaa,0 0 28px #ad78ff99;animation:hhDustFall linear 1 both;will-change:transform}
   @keyframes hhDustFall{0%{transform:translate3d(0,-10vh,0);opacity:0}10%{opacity:var(--dust-opacity,.5)}85%{opacity:var(--dust-opacity,.5)}100%{transform:translate3d(var(--hh-drift),115vh,0);opacity:0}}
   @media(prefers-reduced-motion:reduce){.hh-dimension-dust{display:none}}
  `}</style>
 </div>;
}
