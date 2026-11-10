"use client";
import {useEffect,useRef} from "react";
import Link from "next/link";

type Point={x:number;y:number};
type Action={name:string;href:string;symbol:string};
const actions:Action[]=[
 {name:"DeepWatch",href:"/deepwatch",symbol:"▷"},
 {name:"Go Live",href:"/streaming",symbol:"◉"},
 {name:"Qibla",href:"/qibla/newsroom",symbol:"qibla"},
];
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
/** Elmi Light Labs Ascension touch-grab motion: elastic follower with two articulated joints per orb. */
export default function HudHudElasticOrbits({position,open,onClose}:{position:Point;open:boolean;onClose:()=>void}){
 const root=useRef<HTMLDivElement>(null);
 const physics=useRef(Array.from({length:3},()=>({x:0,y:0,vx:0,vy:0})));
 const progress=useRef(0);
 const current=useRef(position);
 const active=useRef(open);
 current.current=position;active.current=open;
 useEffect(()=>{
  let raf=0,last=0;
  const tick=(now:number)=>{
   const dt=clamp((now-(last||now))/16.667,.2,2);last=now;
   const host=root.current;
   if(host){
    const origin={x:current.current.x+27,y:current.current.y+27};
    const w=window.innerWidth,h=window.innerHeight;
    const side=origin.x<w*.28?"right":origin.x>w*.72?"left":"above";
    const radius=clamp(Math.min(w*.21,86),57,86);
    const destinations=side==="above"?[
     {x:origin.x-radius,y:origin.y-122},
     {x:origin.x,y:origin.y-152},
     {x:origin.x+radius,y:origin.y-122},
    ]:actions.map((_,i)=>({x:origin.x+(side==="right"?1:-1)*(105+(i===1?20:0)),y:origin.y+(i-1)*92}));
    const target=active.current?1:0;
    progress.current+=(target-progress.current)*Math.min(1,dt*(target? .17:.24));
    if(Math.abs(progress.current-target)<.001)progress.current=target;
    host.style.pointerEvents=progress.current>.75&&active.current?"auto":"none";
    host.style.visibility=progress.current<.002&&!active.current?"hidden":"visible";
    actions.forEach((_,i)=>{
     const state=physics.current[i];
     const dest=destinations[i];
     const t=progress.current;
     const targetX=origin.x+(dest.x-origin.x)*t;
     const targetY=origin.y+(dest.y-origin.y)*t;
     const spring=.078,damping=Math.pow(.77,dt);
     state.vx=(state.vx+(targetX-state.x)*spring*dt)*damping;
     state.vy=(state.vy+(targetY-state.y)*spring*dt)*damping;
     if(!state.x&&!state.y){state.x=origin.x;state.y=origin.y}
     state.x+=state.vx*dt;state.y+=state.vy*dt;
     const distance=Math.hypot(state.x-origin.x,state.y-origin.y);
     const max=side==="above"?174:185;
     if(distance>max){const ratio=max/distance;state.x=origin.x+(state.x-origin.x)*ratio;state.y=origin.y+(state.y-origin.y)*ratio;state.vx*=.35;state.vy*=.35}
     const node=host.querySelector<HTMLElement>('[data-elastic-orb="'+i+'"]');
     const arm=host.querySelector<SVGSVGElement>('[data-elastic-arm="'+i+'"]');
     if(node){node.style.setProperty("--hh-orb-delay",String(i*.37)+"s");node.style.transform="translate3d("+(state.x-28)+"px,"+(state.y-28)+"px,0) scale("+clamp(t,.01,1)+")";node.style.opacity=String(clamp(t*1.4,0,1));node.style.pointerEvents=active.current&&t>.8?"auto":"none";}
     if(arm){
      const dx=state.x-origin.x,dy=state.y-origin.y;
      const bend=(i-1)*9+clamp(state.vx,-12,12)*.7;
      const p1={x:origin.x+dx*.34+bend,y:origin.y+dy*.34};
      const p2={x:origin.x+dx*.68+bend,y:origin.y+dy*.68};
      const pathData="M "+origin.x+" "+origin.y+" Q "+p1.x+" "+p1.y+" "+p2.x+" "+p2.y+" T "+state.x+" "+state.y;
      arm.querySelectorAll("path").forEach(line=>line.setAttribute("d",pathData));
      const joints=arm.querySelectorAll("circle");
      joints[0]?.setAttribute("cx",String(p1.x));joints[0]?.setAttribute("cy",String(p1.y));
      joints[1]?.setAttribute("cx",String(p2.x));joints[1]?.setAttribute("cy",String(p2.y));
      arm.style.opacity=String(clamp(t,0,1));
     }
    });
   }
   raf=requestAnimationFrame(tick);
  };
  raf=requestAnimationFrame(tick);
  return()=>cancelAnimationFrame(raf);
 },[]);
 const qiblaIcon=<svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="hh-qibla-gradient" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#ff61ad"/><stop offset="50%" stopColor="#f07fb9"/><stop offset="50%" stopColor="#43d8cf"/><stop offset="100%" stopColor="#28bdbd"/></linearGradient></defs><path d="M16 3 27 9v14L16 29 5 23V9Z" stroke="url(#hh-qibla-gradient)" strokeWidth="2" fill="none"/><path d="M16 8v16M9 12l7-4 7 4M9 20l7 4 7-4" stroke="url(#hh-qibla-gradient)" strokeWidth="2" fill="none" strokeLinejoin="round"/><circle cx="16" cy="16" r="3" fill="url(#hh-qibla-gradient)"/></svg>;
 return <div ref={root} className="hh-elastic-orbits" role="group" aria-label="HudHud magnetic actions" aria-hidden={!open}>
 <style>{`
 .hh-elastic-orbits{position:fixed;inset:0;z-index:2147483003;pointer-events:none;overflow:hidden;visibility:hidden}
 .hh-elastic-dismiss{position:absolute;inset:0;background:transparent;border:0;cursor:default;pointer-events:auto}
 .hh-elastic-arm{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}
 .hh-elastic-arm path{fill:none;stroke:rgba(183,222,248,.38);stroke-width:1.1;stroke-linecap:round}
 .hh-elastic-arm .hh-energy-thread{stroke:rgba(196,231,255,.78);stroke-width:1.6;stroke-dasharray:2 36;animation:hh-energy-flow 3.2s linear infinite;filter:drop-shadow(0 0 3px rgba(170,225,255,.8))}
 @keyframes hh-energy-flow{to{stroke-dashoffset:-76}}
 .hh-elastic-arm circle{r:5;fill:rgba(178,221,247,.16);stroke:rgba(226,246,255,.65);stroke-width:1.1;filter:drop-shadow(0 0 4px rgba(145,207,255,.45))}
 .hh-elastic-action{position:absolute;left:0;top:0;width:56px;display:flex;flex-direction:column;align-items:center;gap:4px;will-change:transform,opacity;transform-origin:28px 28px}
 .hh-orb-float{display:flex;flex-direction:column;align-items:center;gap:4px}
 .hh-elastic-bubble{position:relative;isolation:isolate;overflow:hidden;width:56px;height:56px;border-radius:50%;display:grid;place-items:center;border:1px solid rgba(230,244,255,.5);color:#eefaff;text-decoration:none;font-size:27px;background:radial-gradient(ellipse at 29% 19%,rgba(255,255,255,.44),transparent 32%),radial-gradient(circle at 75% 82%,rgba(96,174,221,.17),transparent 53%),linear-gradient(140deg,rgba(147,185,208,.3),rgba(10,20,36,.74) 72%);box-shadow:inset 0 1px 3px rgba(255,255,255,.6),inset 0 -9px 17px rgba(5,13,26,.65),0 10px 23px #0009,0 0 13px rgba(142,216,255,.18);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
 .hh-elastic-bubble::before{content:"";position:absolute;inset:3px;border:1px solid rgba(216,240,255,.2);border-radius:50%;pointer-events:none}
 .hh-elastic-bubble::after{content:"";position:absolute;inset:-15%;border-radius:50%;border:1px dashed rgba(188,232,255,.25);animation:hh-orb-rotate 14s linear infinite;pointer-events:none}
 .hh-elastic-bubble>svg,.hh-elastic-bubble>.hh-orb-symbol{position:relative;z-index:1;filter:drop-shadow(0 0 5px rgba(214,244,255,.5))}
 .hh-orb-float{animation:hh-orb-float 4.6s ease-in-out infinite;animation-delay:var(--hh-orb-delay,0s)}
 @keyframes hh-orb-float{0%,100%{translate:0 0}50%{translate:0 -4px}}
 @keyframes hh-orb-rotate{to{transform:rotate(360deg)}}
 @media(hover:hover){.hh-elastic-bubble:hover{scale:1.08;box-shadow:inset 0 1px 4px #fff9,0 0 22px rgba(158,223,255,.5),0 10px 23px #0009}}
 .hh-elastic-bubble:focus-visible{outline:2px solid #d4f1ff;outline-offset:4px}
 .hh-elastic-bubble:active{scale:1.08}.hh-elastic-name{font-size:10px;font-weight:650;letter-spacing:.02em;color:white;text-shadow:0 2px 5px #000,0 0 8px #000;white-space:nowrap}
 @media(prefers-reduced-motion:reduce){.hh-elastic-action,.hh-elastic-arm{transition:none!important}.hh-orb-float,.hh-elastic-bubble::after,.hh-energy-thread{animation:none!important}}
 `}</style>
 {open&&<button type="button" className="hh-elastic-dismiss" aria-label="Close HudHud options" onClick={onClose}/>}
 {actions.map((a,i)=><svg key={"arm"+i} data-elastic-arm={i} className="hh-elastic-arm" aria-hidden="true"><path/><path className="hh-energy-thread"/><circle/><circle/></svg>)}
 {actions.map((a,i)=><div key={a.name} data-elastic-orb={i} className="hh-elastic-action"><div className="hh-orb-float"><Link className="hh-elastic-bubble" href={a.href} aria-label={a.name} onClick={onClose}>{a.symbol==="qibla"?qiblaIcon:<span className="hh-orb-symbol">{a.symbol}</span>}</Link><span className="hh-elastic-name">{a.name}</span></div></div>)}
 </div>;
}
