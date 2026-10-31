"use client";
import {useEffect,useRef,useState} from "react";

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
 const rootRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(!open)return;const dismiss=(event:PointerEvent)=>{if(rootRef.current&&!rootRef.current.contains(event.target as Node))setOpen(false)};const escape=(event:KeyboardEvent)=>{if(event.key==="Escape")setOpen(false)};document.addEventListener("pointerdown",dismiss);document.addEventListener("keydown",escape);return()=>{document.removeEventListener("pointerdown",dismiss);document.removeEventListener("keydown",escape)}},[open]);
 const [tab,setTab]=useState<"filters"|"backgrounds"|"themes"|"ar"|"general">("filters");
 const [intensity,setIntensity]=useState(70);
 const [everOpened,setEverOpened]=useState(false);
 return <div className="lve-root" ref={rootRef}>
  {effect!=="off"&&<div className={`lve-layer lve-${effect}`} style={{opacity:intensity/100}} aria-hidden="true">
   {Array.from({length:effect==="waves"?5:26},(_,i)=><i key={i} style={{"--i":i,"--x":((i*47+13)%97)+"%","--delay":((i*7)%19)/-3+"s","--dur":(4+(i%7))+"s"} as React.CSSProperties}/>)}
  </div>}
  <button type="button" className="lve-trigger" aria-label="Video effects settings" aria-expanded={open} onClick={()=>{setEverOpened(true);setOpen(v=>!v)}}>✦ <span>Effects</span></button>
  {everOpened&&<div className={`lve-menu ${open?"lve-menu-open":"lve-menu-closed"}`} role="dialog" aria-modal="false" aria-label="Live effects"><div className="lve-grab"/><div className="lve-heading"><div><b>✧ Effects</b><p>Customize your live studio preview</p></div><button type="button" onClick={()=>setOpen(false)} aria-label="Close effects">×</button></div><div className="lve-tabs" role="tablist" aria-label="Effect categories">{([["filters","✦","Filters"],["backgrounds","▧","Backgrounds"],["themes","◉","Themes"],["ar","⬡","AR"],["general","•••","General"]] as const).map(([id,icon,label])=><button type="button" role="tab" aria-selected={tab===id} key={id} onClick={()=>setTab(id)}><span>{icon}</span>{label}</button>)}</div>{tab==="filters"?<><div className="lve-options">{options.map(o=><button type="button" key={o.id} aria-pressed={effect===o.id} onClick={()=>onChange(o.id)}><span className={`lve-thumb lve-thumb-${o.id}`}><span>{o.icon}</span></span><span>{o.label}</span>{effect===o.id&&<b>✓</b>}</button>)}</div><div className="lve-intensity"><label htmlFor="lve-intensity">Intensity</label><input id="lve-intensity" type="range" min="0" max="100" value={intensity} onChange={e=>setIntensity(Number(e.target.value))}/><output>{intensity}%</output><button type="button" onClick={()=>{onChange("off");setIntensity(70)}}>↻ Reset</button></div></>:<div className="lve-unavailable"><strong>{tab==="backgrounds"?"Backgrounds":tab==="themes"?"Themes":tab==="ar"?"AR Effects":"General Effects"}</strong><p>Coming soon. Current live effects are available under Filters.</p></div>}<small>Visual effects currently appear in the host preview only; they are not yet transmitted to viewers. Intensity controls the host preview overlay.</small></div>}
  <style jsx>{`
  .lve-root{position:absolute;inset:0;pointer-events:none;z-index:15;isolation:isolate}
  .lve-layer{position:absolute;inset:0;overflow:hidden;pointer-events:none;border-radius:inherit}
  .lve-layer i{position:absolute;left:var(--x);top:-10%;display:block;animation-duration:var(--dur);animation-delay:var(--delay);animation-iteration-count:infinite;animation-timing-function:linear;will-change:transform,opacity}
  .lve-dust i{width:3px;height:3px;background:#fff7d2;border-radius:50%;box-shadow:0 0 8px 2px #fff7d266;animation-name:lveFall}
  .lve-stars i{top:calc((var(--i) * 37%)/26 + 10%);width:3px;height:3px;background:white;border-radius:50%;box-shadow:0 0 12px 2px #e5f5ff;animation-name:lveTwinkle;animation-duration:calc(var(--dur) * .7)}
  .lve-waves i{left:-45%;top:calc(16% + var(--i) * 17%);width:90%;height:32px;border-radius:50%;border-top:2px solid #9dffe788;box-shadow:0 -12px 32px #5cffbd55;filter:blur(2px);animation-name:lveWave}
  .lve-fireflies i{top:80%;width:5px;height:5px;border-radius:50%;background:#a4ffd0;box-shadow:0 0 12px 4px #6effa088;animation-name:lveFloat}
  .lve-rain i{width:1px;height:25px;background:linear-gradient(transparent,#d7f8ff99);animation-name:lveFall}
  .lve-trigger{position:absolute;right:12px;bottom:58px;pointer-events:auto;display:flex;align-items:center;gap:6px;border:1px solid #ffffff66;border-radius:999px;background:#0c252a99;color:#fff;padding:9px 13px;backdrop-filter:blur(16px);font-size:12px;font-weight:700;cursor:pointer;z-index:2}
  .lve-menu{transform:translateY(105%);opacity:0;visibility:hidden;transition:transform .36s cubic-bezier(.2,.8,.2,1),opacity .26s ease,visibility .36s;will-change:transform;\nposition:absolute;left:0;right:0;bottom:0;max-height:74%;overflow-y:auto;pointer-events:auto;border:1px solid #9ee9c377;border-radius:28px 28px 0 0;background:linear-gradient(155deg,#101e1bea,#050f0eef);backdrop-filter:blur(26px);-webkit-backdrop-filter:blur(26px);padding:12px 16px 24px;color:white;box-shadow:0 -16px 50px #0009;z-index:5}
  .lve-menu-open{transform:translateY(0);opacity:1;visibility:visible}.lve-menu-closed{pointer-events:none}\n  .lve-grab{width:42px;height:5px;background:#ffffff88;border-radius:10px;margin:0 auto 14px}.lve-heading{display:flex;justify-content:space-between;align-items:start;gap:10px}.lve-heading b{font-size:22px}.lve-heading p{font-size:12px;color:#bdcfc7;margin:5px 0 14px}.lve-heading button{border:1px solid #ffffff55;background:#ffffff18;color:white;border-radius:50%;width:40px;height:40px;font-size:25px;cursor:pointer}
  .lve-tabs{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:3px;margin-bottom:16px}.lve-tabs button{min-width:0;display:flex;flex-direction:column;align-items:center;gap:5px;padding:9px 2px;border:1px solid transparent;border-radius:13px;background:#ffffff0c;color:#f1f6f2;font-size:clamp(9px,2.5vw,12px);cursor:pointer}.lve-tabs button span{font-size:22px}.lve-tabs button[aria-selected=true]{border-color:#42efad;background:#07543e;color:#b5ffdd}
  .lve-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.lve-options button{min-width:0;display:flex;flex-direction:column;align-items:center;gap:7px;padding:7px 4px 9px;border-radius:14px;border:1px solid #ffffff30;background:#ffffff0e;color:#fff;cursor:pointer;font-size:11px;position:relative}.lve-options button[aria-pressed=true]{border-color:#40f6b0;box-shadow:0 0 0 1px #40f6b0}.lve-thumb{width:100%;height:65px;display:grid;place-items:center;border-radius:10px;background:linear-gradient(140deg,#254e41,#141b22);font-size:32px;color:#b7ffe2}.lve-options button b{position:absolute;top:8px;right:8px;color:#42f6b2}
  .lve-thumb-dust{background:radial-gradient(circle at 30% 30%,#fff8c4 1px,transparent 3px),radial-gradient(circle at 65% 70%,#fff8c4 2px,transparent 4px),linear-gradient(130deg,#26302d,#6b5941)}.lve-thumb-stars{background:radial-gradient(circle at 50% 30%,#fff 1px,transparent 4px),radial-gradient(circle at 30% 75%,#e0f7ff 2px,transparent 5px),linear-gradient(140deg,#091026,#35234b)}.lve-thumb-waves{background:repeating-radial-gradient(ellipse at 10% 90%,transparent 0 9px,#5ce3db 11px 13px,transparent 15px 24px),linear-gradient(140deg,#102c3b,#16485b)}.lve-thumb-fireflies{background:radial-gradient(circle at 40% 35%,#9affc0 2px,transparent 8px),radial-gradient(circle at 70% 65%,#66ffae 3px,transparent 10px),linear-gradient(140deg,#082e22,#214c35)}.lve-thumb-rain{background:repeating-linear-gradient(115deg,transparent 0 12px,#b4dcff99 13px 14px,transparent 15px 24px),linear-gradient(140deg,#263746,#101c28)}\n  .lve-intensity{display:flex;align-items:center;gap:9px;margin-top:16px;padding:10px;border:1px solid #ffffff30;border-radius:16px;font-size:12px}.lve-intensity input{min-width:0;flex:1;accent-color:#35e9a4}.lve-intensity button{border:1px solid #ffffff55;background:#ffffff16;border-radius:18px;color:white;padding:8px;cursor:pointer}.lve-unavailable{padding:28px 10px;text-align:center;border:1px solid #ffffff22;border-radius:16px}.lve-unavailable p{color:#aebeb5;font-size:12px}.lve-menu small{display:block;color:#b3c6be;font-size:10px;line-height:1.5;margin-top:12px}
  @keyframes lveFall{0%{transform:translate3d(0,-10px,0);opacity:0}12%{opacity:.85}88%{opacity:.6}100%{transform:translate3d(24px,110vh,0);opacity:0}}
  @keyframes lveTwinkle{0%,100%{opacity:.1;transform:scale(.5)}50%{opacity:1;transform:scale(1.8)}}
  @keyframes lveWave{0%{transform:translateX(-20%);opacity:0}35%{opacity:.8}100%{transform:translateX(180%);opacity:0}}
  @keyframes lveFloat{0%{transform:translate3d(0,30px,0);opacity:0}30%{opacity:.9}100%{transform:translate3d(30px,-75vh,0);opacity:0}}
  @media(prefers-reduced-motion:reduce){.lve-layer i{animation:none;opacity:.25}}
  `}</style>
 </div>;
}
