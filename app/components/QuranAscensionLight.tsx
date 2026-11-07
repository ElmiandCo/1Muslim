"use client";
import {useEffect,useRef,useState} from "react";

/** A single, particle-free Elmi Light beam, triggered only by successful Qur'an audio playback. */
export default function QuranAscensionLight(){
 const [beam,setBeam]=useState<{key:number;rect:{left:number;top:number;width:number;height:number}}|null>(null);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const sequence=useRef(0);
 useEffect(()=>{
  const clear=()=>{if(timer.current)clearTimeout(timer.current);timer.current=null;setBeam(null)};
  const onPlayback=(event:Event)=>{
   const detail=(event as CustomEvent<{playing?:boolean;target?:DOMRect}>).detail;
   if(!detail?.playing){clear();return}
   const target=detail.target;
   if(!target||target.width<=0||target.height<=0)return;
   clear();
   setBeam({key:++sequence.current,rect:{left:target.left,top:target.top,width:target.width,height:target.height}});
   timer.current=setTimeout(()=>setBeam(null),3000);
  };
  window.addEventListener("1muslim:deep-watch-quran",onPlayback);
  window.addEventListener("1muslim:deep-watch-exit",clear);
  return()=>{clear();window.removeEventListener("1muslim:deep-watch-quran",onPlayback);window.removeEventListener("1muslim:deep-watch-exit",clear)};
 },[]);
 return <>{beam&&<div key={beam.key} className="quran-ascension-viewport" aria-hidden="true" style={{left:beam.rect.left,top:beam.rect.top,width:beam.rect.width,height:beam.rect.height}}>
  <div className="quran-ascension-beam"/>
 </div>}<style jsx>{`
 .quran-ascension-viewport{position:fixed;z-index:9997;overflow:hidden;pointer-events:none;border-radius:20px;isolation:isolate}
 .quran-ascension-beam{position:absolute;left:50%;top:0;width:115%;height:75%;border-radius:50%;transform:translate(-50%,110%);opacity:0;will-change:transform,opacity;background:radial-gradient(ellipse at center,rgba(255,255,238,.24) 0%,rgba(170,225,255,.14) 26%,rgba(120,190,255,.06) 48%,transparent 72%);filter:blur(14px);animation:quran-light-ascend 3s cubic-bezier(.35,.05,.2,1) both}
 @keyframes quran-light-ascend{0%{transform:translate(-50%,110%) scale(.7);opacity:0}15%{opacity:.8}55%{opacity:.65}85%{opacity:.3}100%{transform:translate(-45%,-115%) scale(1.15);opacity:0}}
 @media(prefers-reduced-motion:reduce){.quran-ascension-beam{animation:none;opacity:.12;transform:translate(-50%,20%)}}
 `}</style></>;
}
