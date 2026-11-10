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
 const scrollEnergy=useRef(0);
 current.current=position;active.current=open;
 useEffect(()=>{
  let raf=0,last=0;
  const onScroll=()=>{scrollEnergy.current=Math.min(1,scrollEnergy.current+.32)};
  window.addEventListener("scroll",onScroll,true);
  window.addEventListener("wheel",onScroll,{passive:true});
  const tick=(now:number)=>{
   const dt=clamp((now-(last||now))/16.667,.2,2);last=now;
   scrollEnergy.current*=Math.pow(.93,dt);
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
     if(node){node.style.transform="translate3d("+(state.x-28)+"px,"+(state.y-28)+"px,0) scale("+clamp(t,.01,1)+")";node.style.opacity=String(clamp(t*1.4,0,1));node.style.pointerEvents=active.current&&t>.8?"auto":"none";}
     if(arm){
      const dx=state.x-origin.x,dy=state.y-origin.y;
      const bend=(i-1)*9+clamp(state.vx,-12,12)*.7+Math.sin(now/240+i*2)*scrollEnergy.current*15;
      const p1={x:origin.x+dx*.34+bend,y:origin.y+dy*.34};
      const p2={x:origin.x+dx*.68+bend,y:origin.y+dy*.68};
      const line=arm.querySelector("path");if(line)line.setAttribute("d","M "+origin.x+" "+origin.y+" Q "+p1.x+" "+p1.y+" "+p2.x+" "+p2.y+" T "+state.x+" "+state.y);
      const joints=arm.querySelectorAll("circle");
      joints[0]?.setAttribute("cx",String(p1.x));joints[0]?.setAttribute("cy",String(p1.y));
      joints[1]?.setAttribute("cx",String(p2.x));joints[1]?.setAttribute("cy",String(p2.y));
      arm.style.opacity=String(clamp(t,0,1));
      const dust=arm.querySelectorAll<SVGCircleElement>(".hh-elastic-dust");
      dust.forEach((particle,j)=>{const phase=(now*.00019*(1+j%3)+i*.17+j/dust.length)%1;const x=origin.x+dx*phase+Math.sin(phase*Math.PI*2+j)*((1-phase)*10+scrollEnergy.current*16);const y=origin.y+dy*phase+Math.cos(phase*Math.PI*2+j)*((1-phase)*9+scrollEnergy.current*16);particle.setAttribute("cx",String(x));particle.setAttribute("cy",String(y));particle.setAttribute("r",String(1.3+(j%3)*.7));particle.style.opacity=String(clamp(t*(.35+.6*Math.sin(phase*Math.PI)),0,1))});
     }
    });
   }
   raf=requestAnimationFrame(tick);
  };
  raf=requestAnimationFrame(tick);
  return()=>{cancelAnimationFrame(raf);window.removeEventListener("scroll",onScroll,true);window.removeEventListener("wheel",onScroll)};
 },[]);
 const qiblaIcon=<svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="hh-qibla-gradient" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#ff61ad"/><stop offset="50%" stopColor="#f07fb9"/><stop offset="50%" stopColor="#43d8cf"/><stop offset="100%" stopColor="#28bdbd"/></linearGradient></defs><path d="M16 3 27 9v14L16 29 5 23V9Z" stroke="url(#hh-qibla-gradient)" strokeWidth="2" fill="none"/><path d="M16 8v16M9 12l7-4 7 4M9 20l7 4 7-4" stroke="url(#hh-qibla-gradient)" strokeWidth="2" fill="none" strokeLinejoin="round"/><circle cx="16" cy="16" r="3" fill="url(#hh-qibla-gradient)"/></svg>;
 return <div ref={root} className="hh-elastic-orbits" role="group" aria-label="HudHud magnetic actions" aria-hidden={!open}>
 <style>{`
 .hh-elastic-orbits{position:fixed;inset:0;z-index:2147483003;pointer-events:none;overflow:hidden;visibility:hidden}
 .hh-elastic-dismiss{position:absolute;inset:0;background:transparent;border:0;cursor:default;pointer-events:auto}
 .hh-elastic-arm{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}
 .hh-elastic-arm path{fill:none;stroke:rgba(183,222,248,.38);stroke-width:1.5;stroke-linecap:round}
 .hh-elastic-arm circle:not(.hh-elastic-dust){r:5;fill:rgba(178,221,247,.16);stroke:rgba(226,246,255,.65);stroke-width:1.1;filter:drop-shadow(0 0 4px rgba(145,207,255,.45))}\n .hh-elastic-arm .hh-elastic-dust{fill:#9deeff;stroke:none;filter:drop-shadow(0 0 5px #78eaff)}\n .hh-elastic-arm .hh-elastic-dust:nth-of-type(3n){fill:#fff1b5;filter:drop-shadow(0 0 5px #ffe7a1)}
 .hh-elastic-action{position:absolute;left:0;top:0;width:56px;display:flex;flex-direction:column;align-items:center;gap:4px;will-change:transform,opacity;transform-origin:28px 28px}
 .hh-elastic-bubble{width:56px;height:56px;border-radius:50%;display:grid;place-items:center;border:1px solid rgba(230,244,255,.5);color:#eefaff;text-decoration:none;font-size:27px;background:radial-gradient(circle at 30% 22%,rgba(245,252,255,.23),rgba(104,169,205,.13) 50%,rgba(8,19,36,.68));box-shadow:inset 0 0 13px rgba(230,248,255,.15),0 7px 18px #0007;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
 .hh-elastic-bubble::after{content:"";position:absolute;inset:-6px;border-radius:50%;border:1px solid #a5eaff77;box-shadow:0 0 13px #7beaff44;pointer-events:none;animation:hhJointBreath 3.2s ease-in-out infinite}\n @keyframes hhJointBreath{50%{transform:scale(1.12);opacity:.38}}\n .hh-elastic-bubble:active{scale:.91}.hh-elastic-name{font-size:10px;font-weight:650;letter-spacing:.02em;color:white;text-shadow:0 2px 5px #000,0 0 8px #000;white-space:nowrap}
 @media(prefers-reduced-motion:reduce){.hh-elastic-action,.hh-elastic-arm{transition:none!important}}
 `}</style>
 {open&&<button type="button" className="hh-elastic-dismiss" aria-label="Close HudHud options" onClick={onClose}/>}
 {actions.map((a,i)=><svg key={"arm"+i} data-elastic-arm={i} className="hh-elastic-arm" aria-hidden="true"><path/><circle/><circle/>{Array.from({length:22},(_,j)=><circle key={j} className="hh-elastic-dust" r="2"/>)}</svg>)}
 {actions.map((a,i)=><div key={a.name} data-elastic-orb={i} className="hh-elastic-action"><Link className="hh-elastic-bubble" href={a.href} aria-label={a.name} onClick={onClose}>{a.symbol==="qibla"?qiblaIcon:a.symbol}</Link><span className="hh-elastic-name">{a.name}</span></div>)}
 </div>;
}
