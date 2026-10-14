"use client";
import { useEffect, useState } from "react";
type Props = { tone?: "blue" | "green"; density?: "ambient" | "focused" };
export default function RisingEnergyOrbs({tone="blue",density="focused"}:Props){
 const [reduce,setReduce]=useState(false);
 useEffect(()=>{const q=window.matchMedia("(prefers-reduced-motion: reduce)");const sync=()=>setReduce(q.matches);sync();q.addEventListener("change",sync);return()=>q.removeEventListener("change",sync)},[]);
 const count=reduce?5:density==="ambient"?12:18;
 const rgb=tone==="green"?"67,225,150":"38,152,255";
 return <div className="risingEnergyField" aria-hidden="true" data-tone={tone}>
  {Array.from({length:count},(_,i)=>{
   const front=i%6===0;
   const size=front?8+(i%3)*5:12+(i*11)%27;
   return <i key={i} className={front?"energyOrb front":"energyOrb"} style={{
    left:`${(i*37+11)%96}%`,width:size,height:size,
    animationDuration:`${12+(i*7)%15}s`,
    animationDelay:`${-((i*13)%25)}s`,
    opacity:front?.18:.12+(i%4)*.055,
    background:`radial-gradient(circle at 35% 30%,rgba(230,255,255,.85),rgba(${rgb},.85) 35%,rgba(${rgb},0) 74%)`,
    boxShadow:`0 0 ${front?12:22}px rgba(${rgb},.36)`,
    filter:front?"blur(1px)":"blur(3px)"
   }}/>)}
  <style jsx>{`
   .risingEnergyField{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:0;isolation:isolate}
   .energyOrb{position:absolute;bottom:-12%;border-radius:50%;animation:energyAscend linear infinite;will-change:transform}
   .energyOrb.front{z-index:2}
   @keyframes energyAscend{0%{transform:translate3d(0,20px,0) scale(.7)}50%{transform:translate3d(13px,-52vh,0) scale(1)}100%{transform:translate3d(-10px,-108vh,0) scale(.5)}}
   @media(prefers-reduced-motion:reduce){.energyOrb{animation:none;bottom:20%;opacity:.1!important}}
  `}</style>
 </div>
}
