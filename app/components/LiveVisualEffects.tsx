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
export default function LiveVisualEffects({effect,onChange,live=false,onSound}:{effect:LiveEffect;onChange:(value:LiveEffect)=>void;live?:boolean;onSound?:(sound:"boom"|"crickets"|"laughter")=>void}){
 const [open,setOpen]=useState(false);
 const rootRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(!open)return;const dismiss=(event:PointerEvent)=>{if(rootRef.current&&!rootRef.current.contains(event.target as Node))setOpen(false)};const escape=(event:KeyboardEvent)=>{if(event.key==="Escape")setOpen(false)};document.addEventListener("pointerdown",dismiss);document.addEventListener("keydown",escape);return()=>{document.removeEventListener("pointerdown",dismiss);document.removeEventListener("keydown",escape)}},[open]);
 const [tab,setTab]=useState<"looks"|"sounds">("looks");
 const [intensity,setIntensity]=useState(70);
 const [everOpened,setEverOpened]=useState(false);
 const startY=useRef<number|null>(null);
 return <div className="lve-root" ref={rootRef}>
  {effect!=="off"&&<div className={`lve-layer lve-${effect}`} style={{opacity:intensity/100}} aria-hidden="true">
   {Array.from({length:effect==="waves"?5:26},(_,i)=><i key={i} style={{"--i":i,"--x":((i*47+13)%97)+"%","--delay":((i*7)%19)/-3+"s","--dur":(4+(i%7))+"s"} as React.CSSProperties}/>)}
  </div>}
  <button type="button" className="lve-trigger" aria-label={open?"Close Live Studio effects":"Open Live Studio effects"} aria-expanded={open} onClick={()=>{setEverOpened(true);setTab("looks");setOpen(v=>!v)}}><svg aria-hidden="true" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m4 20 11-11 3 3L7 23zM15 3v4M13 5h4M20 13v4M18 15h4M5 3v4M3 5h4"/></svg></button>

  {everOpened&&<section
   className={["lve-menu",open?"lve-menu-open":"lve-menu-closed"].join(" ")}
   role="dialog" aria-modal="false" aria-label="1Muslim Live Studio effects"
   aria-hidden={!open}
   onTouchStart={e=>{startY.current=e.touches[0]?.clientY??null}}
   onTouchEnd={e=>{const start=startY.current;startY.current=null;if(start!==null&&e.changedTouches[0]&&e.changedTouches[0].clientY-start>90&&e.currentTarget.scrollTop===0)setOpen(false)}}
  >
   <div className="lve-grab" aria-hidden="true"/>
   <header className="lve-heading">
    <div className="lve-titleGroup">
     <span className="lve-eyebrow">1MUSLIM / CREATOR TOOLS</span>
     <b>Studio Effects</b>
     <p>{live?"Customize your live preview":"Find your on-camera look"}</p>
    </div>
    <button type="button" onClick={()=>setOpen(false)} aria-label="Close Live Studio effects">×</button>
   </header>
   <div className="lve-tabs" role="tablist" aria-label="Creator tools">
    <button type="button" role="tab" aria-selected={tab==="looks"} onClick={()=>setTab("looks")}><span aria-hidden="true">✧</span> Looks</button>
    {live&&<button type="button" role="tab" aria-selected={tab==="sounds"} onClick={()=>setTab("sounds")}><span aria-hidden="true">♫</span> Sounds</button>}
   </div>
   {tab==="looks"?<>
    <div className="lve-sectionLabel"><strong>Choose an effect</strong><small>{effect==="off"?"Clean preview":options.find(o=>o.id===effect)?.label+" active"}</small></div>
    <div className="lve-options" role="group" aria-label="Live appearance effects">
     {options.map(o=><button type="button" key={o.id} aria-pressed={effect===o.id} aria-label={o.label} title={o.label} onClick={()=>onChange(o.id)}>
      <span className={["lve-thumb","lve-thumb-"+o.id].join(" ")}><span aria-hidden="true">{o.icon}</span></span>
      <span className="lve-optionName">{o.label}</span>{effect===o.id&&<b aria-hidden="true">✓</b>}
     </button>)}
    </div>
    <div className="lve-intensity">
     <label htmlFor="lve-intensity">Intensity</label>
     <input id="lve-intensity" type="range" min="0" max="100" value={intensity} disabled={effect==="off"} onChange={e=>setIntensity(Number(e.target.value))}/>
     <output htmlFor="lve-intensity">{effect==="off"?"Off":intensity+"%"}</output>
     <button type="button" onClick={()=>{onChange("off");setIntensity(70)}} aria-label="Reset effect to none">Reset ↺</button>
    </div>
    <p className="lve-previewNote"><span aria-hidden="true">ⓘ</span> Effects show in your host preview only, not in the viewer broadcast.</p>
   </>:<div className="lve-sounds">
    <p className="lve-soundHint">Tap to play a sound for everyone in the Live.</p>
    <div className="lve-soundsGrid" role="group" aria-label="Live sound effects">
     {(["boom","crickets","laughter"] as const).map(sound=><button type="button" key={sound} onClick={()=>onSound?.(sound)}>
      <span aria-hidden="true">{sound==="boom"?"◉":sound==="crickets"?"♫":"✦"}</span>
      {sound==="boom"?"Boom":sound==="crickets"?"Crickets":"Laughter"}
     </button>)}
    </div>
   </div>}
  </section>}
  <style jsx>{`
  .lve-sound-selector{position:absolute;bottom:12px;left:50%;transform:translateX(-50%);width:min(94%,440px);display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;pointer-events:auto;z-index:6;animation:lveSoundIn .3s ease-out}.lve-sound-selector button{padding:13px 4px;border:1px solid color-mix(in srgb,var(--theme-primary,#72e4bc) 55%,transparent);border-radius:16px;background:rgba(8,24,23,.55);backdrop-filter:blur(20px);color:white;font-weight:700;cursor:pointer}@keyframes lveSoundIn{from{opacity:0;transform:translate(-50%,18px)}to{opacity:1;transform:translate(-50%,0)}}
  .lve-root{position:absolute;inset:0;pointer-events:none;z-index:15;isolation:isolate}
  .lve-layer{position:absolute;inset:0;overflow:hidden;pointer-events:none;border-radius:inherit}
  .lve-layer i{position:absolute;left:var(--x);top:-10%;display:block;animation-duration:var(--dur);animation-delay:var(--delay);animation-iteration-count:infinite;animation-timing-function:linear;will-change:transform,opacity}
  .lve-dust i{width:3px;height:3px;background:#fff7d2;border-radius:50%;box-shadow:0 0 8px 2px #fff7d266;animation-name:lveFall}
  .lve-stars i{top:calc((var(--i) * 37%)/26 + 10%);width:3px;height:3px;background:white;border-radius:50%;box-shadow:0 0 12px 2px #e5f5ff;animation-name:lveTwinkle;animation-duration:calc(var(--dur) * .7)}
  .lve-waves i{left:-45%;top:calc(16% + var(--i) * 17%);width:90%;height:32px;border-radius:50%;border-top:2px solid #9dffe788;box-shadow:0 -12px 32px #5cffbd55;filter:blur(2px);animation-name:lveWave}
  .lve-fireflies i{top:80%;width:5px;height:5px;border-radius:50%;background:#a4ffd0;box-shadow:0 0 12px 4px #6effa088;animation-name:lveFloat}
  .lve-rain i{width:1px;height:25px;background:linear-gradient(transparent,#d7f8ff99);animation-name:lveFall}
  .lve-trigger{position:absolute;right:12px;bottom:212px;width:46px;height:46px;padding:0;pointer-events:auto;display:flex;align-items:center;justify-content:center;gap:0;border:1px solid #ffffff66;border-radius:999px;background:#0c252a99;color:#fff;backdrop-filter:blur(16px);font-size:12px;font-weight:700;cursor:pointer;z-index:2}
  .lve-menu{transform:translateY(105%);opacity:0;visibility:hidden;transition:transform .52s cubic-bezier(.16,1,.3,1),opacity .35s ease,visibility .52s;will-change:transform;\nposition:absolute;left:0;right:0;bottom:0;max-height:74%;overflow-y:auto;pointer-events:auto;border:1px solid #9ee9c377;border-radius:28px 28px 0 0;background:linear-gradient(155deg,#101e1bea,#050f0eef);backdrop-filter:blur(26px);-webkit-backdrop-filter:blur(26px);padding:12px 16px 24px;color:white;box-shadow:0 -16px 50px #0009;z-index:5}
  .lve-menu-open{transform:translateY(0);opacity:1;visibility:visible}.lve-menu-closed{pointer-events:none}\n  .lve-trigger{display:flex!important;align-items:center;justify-content:center;gap:0;border:1px solid #ffffff55!important;background:rgba(255,255,255,.09)!important;backdrop-filter:blur(16px)!important;color:#ffffff!important;box-shadow:0 4px 18px #0004!important}\n  .lve-grab{width:42px;height:5px;background:#ffffff88;border-radius:10px;margin:0 auto 14px}.lve-heading{display:flex;justify-content:space-between;align-items:start;gap:10px}.lve-heading b{font-size:22px}.lve-heading p{font-size:12px;color:#bdcfc7;margin:5px 0 14px}.lve-heading button{border:1px solid #ffffff55;background:#ffffff18;color:white;border-radius:50%;width:40px;height:40px;font-size:25px;cursor:pointer}
  .lve-tabs{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:3px;margin-bottom:16px}.lve-tabs button{min-width:0;display:flex;flex-direction:column;align-items:center;gap:5px;padding:9px 2px;border:1px solid transparent;border-radius:13px;background:#ffffff0c;color:#f1f6f2;font-size:clamp(9px,2.5vw,12px);cursor:pointer}.lve-tabs button span{font-size:22px}.lve-tabs button[aria-selected=true]{border-color:#42efad;background:#07543e;color:#b5ffdd}
  .lve-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.lve-options button{min-width:0;display:flex;flex-direction:column;align-items:center;gap:7px;padding:7px 4px 9px;border-radius:14px;border:1px solid #ffffff30;background:#ffffff0e;color:#fff;cursor:pointer;font-size:11px;position:relative}.lve-options button[aria-pressed=true]{border-color:#40f6b0;box-shadow:0 0 0 1px #40f6b0}.lve-thumb{width:100%;height:65px;display:grid;place-items:center;border-radius:10px;background:linear-gradient(140deg,#254e41,#141b22);font-size:32px;color:#b7ffe2}.lve-options button b{position:absolute;top:8px;right:8px;color:#42f6b2}
  .lve-thumb-dust{background:radial-gradient(circle at 30% 30%,#fff8c4 1px,transparent 3px),radial-gradient(circle at 65% 70%,#fff8c4 2px,transparent 4px),linear-gradient(130deg,#26302d,#6b5941)}.lve-thumb-stars{background:radial-gradient(circle at 50% 30%,#fff 1px,transparent 4px),radial-gradient(circle at 30% 75%,#e0f7ff 2px,transparent 5px),linear-gradient(140deg,#091026,#35234b)}.lve-thumb-waves{background:repeating-radial-gradient(ellipse at 10% 90%,transparent 0 9px,#5ce3db 11px 13px,transparent 15px 24px),linear-gradient(140deg,#102c3b,#16485b)}.lve-thumb-fireflies{background:radial-gradient(circle at 40% 35%,#9affc0 2px,transparent 8px),radial-gradient(circle at 70% 65%,#66ffae 3px,transparent 10px),linear-gradient(140deg,#082e22,#214c35)}.lve-thumb-rain{background:repeating-linear-gradient(115deg,transparent 0 12px,#b4dcff99 13px 14px,transparent 15px 24px),linear-gradient(140deg,#263746,#101c28)}\n  .lve-intensity{display:flex;align-items:center;gap:9px;margin-top:16px;padding:10px;border:1px solid #ffffff30;border-radius:16px;font-size:12px}.lve-intensity input{min-width:0;flex:1;accent-color:#35e9a4}.lve-intensity button{border:1px solid #ffffff55;background:#ffffff16;border-radius:18px;color:white;padding:8px;cursor:pointer}.lve-unavailable{padding:28px 10px;text-align:center;border:1px solid #ffffff22;border-radius:16px}.lve-unavailable p{color:#aebeb5;font-size:12px}.lve-menu small{display:block;color:#b3c6be;font-size:10px;line-height:1.5;margin-top:12px}
  @keyframes lveFall{0%{transform:translate3d(0,-10px,0);opacity:0}12%{opacity:.85}88%{opacity:.6}100%{transform:translate3d(24px,110vh,0);opacity:0}}
  @keyframes lveTwinkle{0%,100%{opacity:.1;transform:scale(.5)}50%{opacity:1;transform:scale(1.8)}}
  @keyframes lveWave{0%{transform:translateX(-20%);opacity:0}35%{opacity:.8}100%{transform:translateX(180%);opacity:0}}
  @keyframes lveFloat{0%{transform:translate3d(0,30px,0);opacity:0}30%{opacity:.9}100%{transform:translate3d(30px,-75vh,0);opacity:0}}
  @media(prefers-reduced-motion:reduce){.lve-layer i{animation:none;opacity:.25}.lve-menu{transition:none}}

  /* Live Studio 2026 — accessible, compact glass console rather than a full-screen stack. */
  .lve-root .lve-trigger{
   right:13px;bottom:clamp(98px,16dvh,190px);min-width:44px;width:44px;height:44px;
   padding:0!important;border-radius:14px!important;background:rgba(6,19,24,.72)!important;
   border:1px solid rgba(235,244,242,.37)!important;color:#fff!important;
   box-shadow:0 6px 19px #0006,inset 0 1px #ffffff30!important;
   backdrop-filter:blur(14px)!important;z-index:7;transition:border-color .2s,background-color .2s;
  }
  .lve-root .lve-trigger[aria-expanded="true"]{border-color:#b0e6d3!important;background:rgba(15,57,51,.92)!important}
  .lve-root .lve-menu{
   inset:auto 12px 12px 12px;
   width:auto;max-width:560px;margin:0 auto;max-height:min(50dvh,355px);
   padding:12px 13px 11px;color:#f8fbfb;
   display:flex;flex-direction:column;gap:7px;
   border:1px solid rgba(178,220,217,.36);border-radius:22px;
   background:linear-gradient(135deg,rgba(19,34,40,.96),rgba(6,16,23,.975));
   box-shadow:0 14px 50px #000b,inset 0 1px #ffffff22;
   -webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);
   transform:translateY(24px) scale(.98);opacity:0;visibility:hidden;
   transition:transform .26s cubic-bezier(.21,.8,.23,1),opacity .2s,visibility .26s;
   will-change:auto;overscroll-behavior:contain;overflow-x:hidden;overflow-y:auto;scrollbar-width:thin;
   z-index:10;
  }
  .lve-root .lve-menu-open{transform:translateY(0) scale(1);opacity:1;visibility:visible}
  .lve-root .lve-menu-closed{pointer-events:none}
  .lve-root .lve-grab{width:32px;height:3px;flex:0 0 auto;margin:0 auto 2px;background:rgba(232,244,238,.45)}
  .lve-root .lve-heading{align-items:center;gap:10px}
  .lve-root .lve-titleGroup{min-width:0}
  .lve-root .lve-eyebrow{display:block;color:#8fbbb8;font-size:8px;letter-spacing:.2em;font-weight:820;margin-bottom:2px}
  .lve-root .lve-heading b{font-size:18px;letter-spacing:-.04em;font-weight:820}
  .lve-root .lve-heading p{font-size:10px;color:#a5b7b9;margin:2px 0 0}
  .lve-root .lve-heading button{flex:0 0 36px;width:36px;height:36px;background:#ffffff12;border:1px solid #ffffff30;border-radius:12px;font-size:23px}
  .lve-root .lve-tabs{display:flex;align-items:center;gap:7px;margin:0}
  .lve-root .lve-tabs button{
   min-width:0;width:auto;flex:0 0 auto;flex-direction:row;
   border:1px solid #ffffff24;border-radius:10px;
   gap:6px;min-height:32px;padding:5px 13px;
   background:rgba(255,255,255,.055);color:#b9cacc;font-size:11px;font-weight:750;
  }
  .lve-root .lve-tabs button span{font-size:15px}
  .lve-root .lve-tabs button[aria-selected=true]{background:rgba(91,188,164,.14);border-color:#76ceb370;color:#d6fff0}
  .lve-root .lve-sectionLabel{display:flex;justify-content:space-between;align-items:center;gap:6px;min-width:0}
  .lve-root .lve-sectionLabel strong{font-size:11px;font-weight:760}
  .lve-root .lve-sectionLabel small{font-size:9px;color:#8ab7ab;max-width:50%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .lve-root .lve-options{
   grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:94px;
   gap:7px;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x proximity;
   padding:1px 2px 6px;scrollbar-width:thin;overscroll-behavior-x:contain;
  }
  .lve-root .lve-options button{
   min-height:99px;gap:5px;padding:4px 5px 7px;
   border-radius:12px;border:1px solid rgba(227,240,239,.19);
   background:rgba(255,255,255,.045);font-size:10px;
   scroll-snap-align:start;transition:border-color .2s,background-color .2s;
  }
  .lve-root .lve-options button[aria-pressed=true]{
   border-color:#97e4cd;box-shadow:inset 0 0 0 1px #8ed0bb44;
   background:#83dbbc17;
  }
  .lve-root .lve-options button:active{transform:scale(.98)}
  .lve-root .lve-options button b{
   top:5px;right:5px;width:17px;height:17px;display:grid;place-items:center;
   border-radius:50%;background:#8be2bc;color:#09271d;font-size:12px;
  }
  .lve-root .lve-thumb{width:100%;height:54px;flex:0 0 auto;border-radius:9px;font-size:22px}
  .lve-root .lve-optionName{font-size:10px;font-weight:660;line-height:1.1;text-align:center}
  .lve-root .lve-intensity{
   margin:0;padding:8px 9px;gap:8px;min-height:39px;
   display:flex;flex-wrap:nowrap;border:1px solid #ffffff23;border-radius:11px;
   background:#ffffff09;
  }
  .lve-root .lve-intensity label{font-size:10px;font-weight:750;white-space:nowrap}
  .lve-root .lve-intensity input{flex:1;min-width:28px;accent-color:#93dfc5}
  .lve-root .lve-intensity input:disabled{opacity:.3}
  .lve-root .lve-intensity output{font-size:10px;min-width:30px;text-align:right;font-variant-numeric:tabular-nums;color:#d9eeea}
  .lve-root .lve-intensity button{
   flex:0 0 auto;border-radius:8px;padding:5px 9px;font-size:10px;
   border:1px solid #ffffff2d;background:#ffffff12;color:#eaf8f5;
  }
  .lve-root .lve-previewNote{
   margin:0;color:#8fa6a9;font-size:9px;line-height:1.3;
   border:0;padding:0;white-space:normal;
  }
  .lve-root .lve-previewNote span{font-size:12px;margin-right:3px;color:#8fd4be}
  .lve-root .lve-sounds{display:grid;gap:9px;margin-top:3px}
  .lve-root .lve-soundHint{font-size:10px;color:#aabfbc;margin:0}
  .lve-root .lve-soundsGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
  .lve-root .lve-soundsGrid button{
   display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-height:67px;
   border-radius:12px;border:1px solid #ffffff35;background:#ffffff0d;
   color:#fff;font-size:11px;font-weight:750;cursor:pointer;
  }
  .lve-root .lve-soundsGrid button span{font-size:22px;color:#a7e9d1}
  .lve-root .lve-soundsGrid button:active{transform:scale(.97)}
  .lve-root .lve-menu button:focus-visible,.lve-root .lve-trigger:focus-visible{outline:2px solid #b7f7db;outline-offset:2px}
  @media(max-width:520px){
   .lve-root .lve-menu{left:9px;right:9px;bottom:calc(10px + env(safe-area-inset-bottom,0px));max-height:min(47dvh,330px);padding:10px 11px}
   .lve-root .lve-options{grid-auto-columns:86px;gap:6px}
   .lve-root .lve-options button{min-height:94px}
   .lve-root .lve-thumb{height:49px}
  }
  @media(max-height:650px){
   .lve-root .lve-menu{max-height:56dvh;padding:8px 10px}
   .lve-root .lve-thumb{height:43px}
   .lve-root .lve-options button{min-height:85px}
  }
  @media(prefers-reduced-motion:reduce){.lve-root .lve-menu,.lve-root .lve-options button{transition:none!important}}

  `}</style>
 </div>;
}
