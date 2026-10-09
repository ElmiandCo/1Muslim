"use client";
import {useState} from "react";

export type LiveEffect="off"|"dust"|"stars"|"waves"|"fireflies"|"rain";
const options:{id:LiveEffect;label:string;icon:string}[]=[
 {id:"off",label:"No effect",icon:"○"},
 {id:"dust",label:"Falling Dust",icon:"✧"},
 {id:"stars",label:"Twinkling Stars",icon:"✦"},
 {id:"waves",label:"Elmi Light Waves",icon:"〰"},
 {id:"fireflies",label:"Emerald Fireflies",icon:"◌"},
 {id:"rain",label:"Light Rain",icon:"╱"},
];
export default function LiveVisualEffects({effect,onChange}:{effect:LiveEffect;onChange:(value:LiveEffect)=>void}){
 const [open,setOpen]=useState(false);
 return <div className="lve-root">
  {effect!=="off"&&<div className={`lve-layer lve-${effect}`} aria-hidden="true">
   {Array.from({length:effect==="waves"?5:26},(_,i)=><i key={i} style={{"--i":i,"--x":((i*47+13)%97)+"%","--delay":((i*7)%19)/-3+"s","--dur":(4+(i%7))+"s"} as React.CSSProperties}/>)}
  </div>}
  <button type="button" className="lve-trigger" aria-label="Video effects settings" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>✦ <span>Effects</span></button>
  {open&&<div className="lve-menu"><div className="lve-heading"><b>✦ Video effects</b><button type="button" onClick={()=>setOpen(false)} aria-label="Close effects">×</button></div><p>Choose a continuous visual effect</p><div className="lve-options">{options.map(o=><button type="button" key={o.id} aria-pressed={effect===o.id} onClick={()=>{onChange(o.id);setOpen(false)}}><span>{o.icon}</span>{o.label}{effect===o.id&&<b>✓</b>}</button>)}</div><small>Studio preview effect. Viewer broadcast integration is not yet enabled.</small></div>}
  <style jsx>{`
  .lve-root{position:absolute;inset:0;pointer-events:none;z-index:15;isolation:isolate}
  .lve-layer{position:absolute;inset:0;overflow:hidden;pointer-events:none;border-radius:inherit}
  .lve-layer i{position:absolute;left:var(--x);top:-10%;display:block;animation-duration:var(--dur);animation-delay:var(--delay);animation-iteration-count:infinite;animation-timing-function:linear;will-change:transform,opacity}
  .lve-dust i{width:3px;height:3px;background:#fff7d2;border-radius:50%;box-shadow:0 0 8px 2px #fff7d266;animation-name:lveFall}
  .lve-stars i{top:calc((var(--i) * 37%)/26 + 10%);width:3px;height:3px;background:white;border-radius:50%;box-shadow:0 0 12px 2px #e5f5ff;animation-name:lveTwinkle;animation-duration:calc(var(--dur) * .7)}
  .lve-waves i{left:-45%;top:calc(16% + var(--i) * 17%);width:90%;height:32px;border-radius:50%;border-top:2px solid #9dffe788;box-shadow:0 -12px 32px #5cffbd55;filter:blur(2px);animation-name:lveWave}
  .lve-fireflies i{top:80%;width:5px;height:5px;border-radius:50%;background:#a4ffd0;box-shadow:0 0 12px 4px #6effa088;animation-name:lveFloat}
  .lve-rain i{width:1px;height:25px;background:linear-gradient(transparent,#d7f8ff99);animation-name:lveFall}
  .lve-trigger{position:absolute;right:12px;bottom:58px;pointer-events:auto;display:flex;align-items:center;gap:6px;border:1px solid #ffffff66;border-radius:999px;background:#0c252a77;color:#fff;padding:9px 13px;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);font-size:12px;font-weight:700;cursor:pointer;z-index:2}
  .lve-menu{position:absolute;right:10px;bottom:104px;width:min(270px,calc(100% - 20px));max-height:min(65vh,390px);overflow:auto;pointer-events:auto;border:1px solid #a4ffdf66;border-radius:20px;background:#091b1de8;backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);padding:14px;color:white;box-shadow:0 18px 50px #0008;z-index:3}
  .lve-heading{display:flex;justify-content:space-between;align-items:center}.lve-heading button{border:0;background:#ffffff18;color:white;border-radius:50%;width:29px;height:29px;font-size:20px;cursor:pointer}
  .lve-menu p{font-size:11px;color:#c8d9d3;margin:7px 0 10px}.lve-options{display:grid;gap:5px}.lve-options button{display:flex;align-items:center;gap:10px;text-align:left;padding:10px;border-radius:11px;border:1px solid transparent;background:#ffffff0e;color:#f0fff8;cursor:pointer;font-size:12px}.lve-options button[aria-pressed=true]{background:#4ee7a522;border-color:#7fffd499}.lve-options button span{width:21px;text-align:center;color:#a3ffe1}.lve-options button b{margin-left:auto}.lve-menu small{display:block;color:#b3c6be;font-size:10px;line-height:1.5;margin-top:10px}
  @keyframes lveFall{0%{transform:translate3d(0,-10px,0);opacity:0}12%{opacity:.85}88%{opacity:.6}100%{transform:translate3d(24px,110vh,0);opacity:0}}
  @keyframes lveTwinkle{0%,100%{opacity:.1;transform:scale(.5)}50%{opacity:1;transform:scale(1.8)}}
  @keyframes lveWave{0%{transform:translateX(-20%);opacity:0}35%{opacity:.8}100%{transform:translateX(180%);opacity:0}}
  @keyframes lveFloat{0%{transform:translate3d(0,30px,0);opacity:0}30%{opacity:.9}100%{transform:translate3d(30px,-75vh,0);opacity:0}}
  @media(prefers-reduced-motion:reduce){.lve-layer i{animation:none;opacity:.25}}
  `}</style>
 </div>;
}
