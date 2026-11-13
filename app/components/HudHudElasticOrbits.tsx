"use client";
import {useEffect,useState} from "react";
import Link from "next/link";

type Point={x:number;y:number};
const actions=[
 {name:"DeepWatch",href:"/deepwatch",icon:<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="6" width="26" height="20" rx="5"/><path d="m13 11 9 5-9 5z"/></svg>},
 {name:"Go Live",href:"/streaming",icon:<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="16" cy="16" r="5"/><path d="M8 8a11 11 0 0 0 0 16M24 8a11 11 0 0 1 0 16"/></svg>},
 {name:"Qibla",href:"/qibla/newsroom",icon:<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M16 3 28 10v12L16 29 4 22V10Z"/><path d="m10 12 6-4 6 4v8l-6 4-6-4zM16 8v16"/></svg>}
];
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
export default function HudHudElasticOrbits({position,open,onClose}:{position:Point;open:boolean;onClose:()=>void}){
 const [viewport,setViewport]=useState({w:390,h:780});
 useEffect(()=>{const sync=()=>setViewport({w:innerWidth,h:innerHeight});sync();window.addEventListener("resize",sync);return()=>window.removeEventListener("resize",sync)},[]);
 useEffect(()=>{if(!open)return;const timer=window.setTimeout(onClose,5000);return()=>window.clearTimeout(timer)},[open,onClose]);
 const width=Math.min(viewport.w-24,336);
 const height=134;
 const centerX=position.x+27;
 const above=position.y>height+28;
 const left=clamp(centerX-width/2,12,Math.max(12,viewport.w-width-12));
 const top=above?Math.max(12,position.y-height-16):Math.min(viewport.h-height-12,position.y+70);
 return <div className={"hh-hub-layer"+(open?" is-open":"")} aria-hidden={!open}>
 <button type="button" className="hh-hub-dismiss" aria-label="Close HudHud quick actions" tabIndex={open?0:-1} onClick={onClose}/>
 <section className="hh-hub-panel" role="group" aria-label="HudHud quick actions" style={{left,top,width}} onPointerDown={e=>e.stopPropagation()}>
 <div className="hh-hub-actions">{actions.map((action,index)=><Link key={action.name} href={action.href} tabIndex={open?0:-1} onClick={onClose} className={"hh-hub-action hh-hub-action-"+index}><span className="hh-hub-icon">{action.icon}</span><span className="hh-hub-label">{action.name}</span></Link>)}</div>
 <div className="hh-hub-caption">QUICK ACCESS</div>
 </section>
 <style jsx global>{`
 .hh-hub-layer{position:fixed;inset:0;z-index:2147483003;pointer-events:none;visibility:hidden}.hh-hub-layer.is-open{visibility:visible}
 .hh-hub-dismiss{position:absolute;inset:0;border:0;background:transparent;pointer-events:none}.hh-hub-layer.is-open .hh-hub-dismiss{pointer-events:auto}
 .hh-hub-panel{position:absolute;box-sizing:border-box;padding:13px 12px 10px;border-radius:23px;background:linear-gradient(145deg,rgba(24,38,56,.94),rgba(12,20,32,.96));border:1px solid rgba(204,229,250,.36);box-shadow:0 15px 45px #0008,inset 0 1px #ffffff3a;backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);transform:translateY(14px) scale(.9);opacity:0;transition:transform .35s cubic-bezier(.2,.8,.2,1),opacity .25s ease;pointer-events:none}
 .hh-hub-layer.is-open .hh-hub-panel{transform:translateY(0) scale(1);opacity:1;pointer-events:auto}
 .hh-hub-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
 .hh-hub-action{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;min-width:0;text-decoration:none;color:#f1f7ff;opacity:0;transform:translateY(15px) scale(.84);transition:opacity .26s ease,transform .35s cubic-bezier(.2,.8,.2,1);transition-delay:0ms}
 .hh-hub-layer.is-open .hh-hub-action{opacity:1;transform:translateY(0) scale(1)}.hh-hub-layer.is-open .hh-hub-action-1{transition-delay:55ms}.hh-hub-layer.is-open .hh-hub-action-2{transition-delay:110ms}
 .hh-hub-icon{width:57px;height:57px;border-radius:18px;display:grid;place-items:center;background:linear-gradient(145deg,#ffffff3b,#6289ac25);border:1px solid #d3ebff66;box-shadow:inset 0 1px #ffffff55,0 6px 13px #0007;color:#b7e4ff}
 .hh-hub-action-1 .hh-hub-icon{color:#e8d3a5}.hh-hub-action-2 .hh-hub-icon{color:#e0a8df}.hh-hub-icon svg{width:30px;height:30px;filter:drop-shadow(0 2px 4px #0007)}
 .hh-hub-label{font-size:11px;font-weight:700;white-space:nowrap;text-shadow:0 1px 3px #000a}.hh-hub-caption{text-align:center;font-size:8px;letter-spacing:.25em;color:#d5e9fa9c;margin-top:9px}
 .hh-hub-action:focus-visible .hh-hub-icon{outline:2px solid #b8e7ff;outline-offset:3px}.hh-hub-action:active .hh-hub-icon{transform:scale(.95)}
 @media(prefers-reduced-motion:reduce){.hh-hub-panel,.hh-hub-action{transition:none!important;transition-delay:0ms!important}}
 `}</style>
 </div>;
}
