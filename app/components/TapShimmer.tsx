"use client";
import { useEffect, useState } from "react";

type Ripple = { id:number;x:number;y:number;width:number;height:number;success:boolean;confirmed?:boolean };
type TouchLight = {id:number;x:number;y:number};
type Dust = { id:number;x:number;y:number;dx:number;dy:number;size:number;duration:number;delay:number };
const MAX=7;
export default function TapShimmer(){
 const [ripples,setRipples]=useState<Ripple[]>([]);
 const [dust,setDust]=useState<Dust[]>([]);
 const [touchLights,setTouchLights]=useState<TouchLight[]>([]);
 const [lightEnabled,setLightEnabled]=useState(true);
 useEffect(()=>{const sync=()=>{try{setLightEnabled(localStorage.getItem("1muslim-elmi-light")!=="off")}catch{setLightEnabled(true)}};sync();window.addEventListener("1muslim-elmi-light-updated",sync);return()=>window.removeEventListener("1muslim-elmi-light-updated",sync)},[]);
 useEffect(()=>{
  let seq=0;
  const timers=new Set<number>();
  const addDust=(x:number,y:number,count=6)=>{
   const particles=Array.from({length:count},(_,i)=>({
    id:++seq,x,y,dx:(Math.random()-.5)*100,dy:45+Math.random()*105,
    size:1.5+Math.random()*2.5,duration:950+Math.random()*800,delay:i*35
   }));
   setDust(old=>[...old.slice(-55),...particles]);
   const ids=new Set(particles.map(p=>p.id));
   const timer=window.setTimeout(()=>{setDust(old=>old.filter(p=>!ids.has(p.id)));timers.delete(timer)},2200);
   timers.add(timer);
  };
  const onTap=(event:PointerEvent)=>{
   try{if(localStorage.getItem("1muslim-elmi-light")==="off")return}catch{}
   if(!event.isPrimary||event.button!==0)return;
   const target=event.target;
   if(!(target instanceof Element)||target.closest("[data-no-tap-shimmer], [aria-disabled='true'], :disabled"))return;
   const actionable=target.closest("button,a,[role='button'],input,select,textarea,summary,[tabindex]");
   const success=!!actionable&&!actionable.matches(":disabled,[aria-disabled='true']");
   const rect=(actionable??target).getBoundingClientRect();
   const width=Math.min(360,Math.max(64,rect.width||110));
   const height=Math.min(120,Math.max(30,rect.height||44));
   const x=actionable?rect.left+rect.width/2:event.clientX;
   const y=actionable?rect.top+rect.height/2:event.clientY;
   const id=++seq;
   setRipples(old=>[...old.slice(-(MAX-1)),{id,x,y,width,height,success}]);
   addDust(event.clientX,event.clientY,6);
   setTouchLights(old=>[...old.slice(-19),{id,x:event.clientX,y:event.clientY}]);
   const timer=window.setTimeout(()=>{setRipples(old=>old.filter(r=>r.id!==id));setTouchLights(old=>old.filter(t=>t.id!==id));timers.delete(timer)},900);
   timers.add(timer);
  };
  const onConfirmed=(event:Event)=>{
   try{if(localStorage.getItem("1muslim-elmi-light")==="off")return}catch{}
   const detail=(event as CustomEvent<{x?:number;y?:number}>).detail;
   const x=detail?.x??window.innerWidth/2,y=detail?.y??window.innerHeight/2,id=++seq;
   setRipples(old=>[...old.slice(-(MAX-1)),{id,x,y,width:130,height:56,success:true,confirmed:true}]);
   addDust(x,y,10);
   const timer=window.setTimeout(()=>{setRipples(old=>old.filter(r=>r.id!==id));timers.delete(timer)},1100);
   timers.add(timer);
  };
  let lastMove=0;
  const onMove=(event:PointerEvent)=>{
   if(event.pointerType==="mouse" && event.buttons!==1)return;
   if(event.pointerType!=="mouse" && event.pressure===0)return;
   try{if(localStorage.getItem("1muslim-elmi-light")==="off")return}catch{}
   const now=performance.now();if(now-lastMove<38)return;lastMove=now;
   const id=++seq;
   setTouchLights(old=>[...old.slice(-22),{id,x:event.clientX,y:event.clientY}]);
   const timer=window.setTimeout(()=>{setTouchLights(old=>old.filter(t=>t.id!==id));timers.delete(timer)},850);timers.add(timer);
  };
  document.addEventListener("pointermove",onMove,{passive:true});
  document.addEventListener("pointerdown",onTap,{passive:true});
  window.addEventListener("1muslim:action-success",onConfirmed);
  return()=>{document.removeEventListener("pointermove",onMove);document.removeEventListener("pointerdown",onTap);window.removeEventListener("1muslim:action-success",onConfirmed);timers.forEach(clearTimeout)};
 },[]);
 if(!lightEnabled)return null;
 return <div className="tap-shimmer-layer" aria-hidden="true" data-no-tap-shimmer>
  {touchLights.map(t=><span key={t.id} className="elmi-touch-light" style={{left:t.x,top:t.y}}><i/></span>)}
  {ripples.map(r=><span key={r.id} className={r.confirmed?"tap-shimmer tap-confirmed":r.success?"tap-shimmer tap-success":"tap-shimmer"} style={{left:r.x,top:r.y,width:r.width,height:r.height}}>
   <i className="tap-shimmer-ring"/><i className="tap-shimmer-streak"/><i className="tap-shimmer-star"/>
  </span>)}
  {dust.map(p=><span key={p.id} className="tap-dust" style={{left:p.x,top:p.y,width:p.size,height:p.size,animationDuration:`${p.duration}ms`,animationDelay:`${p.delay}ms`,["--dx" as string]:`${p.dx}px`,["--dy" as string]:`${p.dy}px`}}/>)}
  <style jsx>{`
   .tap-confirmed::after{content:"";position:absolute;left:50%;top:50%;width:4px;height:100%;border-radius:100%;background:linear-gradient(transparent,#78f5ff,#fff1b3,#78f5ff,transparent);box-shadow:0 0 18px #75f5ff;transform:translate(-50%,-50%);animation:tapVertical 1s ease-out both}
   @keyframes tapVertical{0%{opacity:0;scale:.2 1}25%{opacity:1;scale:1 1}100%{opacity:0;scale:.3 1}}

   .elmi-touch-light{position:absolute;width:5px;height:70px;pointer-events:none;border-radius:100%;transform:translate(-50%,-50%);background:linear-gradient(transparent,#6be9ff,#fff1ba,#6be9ff,transparent);box-shadow:0 0 12px #78f9ff,0 0 20px #78f9ff55;animation:elmiTouchFade .85s ease-out both}.elmi-touch-light i{position:absolute;left:50%;top:50%;width:7px;height:7px;border-radius:50%;background:#fff8d5;box-shadow:0 0 12px 5px #84eaff88;transform:translate(-50%,-50%)}@keyframes elmiTouchFade{0%{opacity:.95;scale:1}100%{opacity:0;scale:.35;translate:0 -16px}}
   .tap-shimmer-layer{position:fixed;inset:0;z-index:2147483646;pointer-events:none;overflow:hidden}
   .tap-shimmer{position:absolute;pointer-events:none;--tap-color:#a7dfff;transform:translate(-50%,-50%);overflow:hidden;border-radius:12px}
   .tap-success{--tap-color:#79ffd7}.tap-confirmed{--tap-color:#f6dd7b}
   .tap-confirmed .tap-shimmer-ring{animation:tapRing .9s ease-out both;border-width:3px}
   .tap-confirmed .tap-shimmer-star{width:12px;height:12px;animation:tapStar 1s ease-out both}
   .tap-shimmer-ring{position:absolute;left:50%;top:50%;margin-left:-16px;margin-top:-16px;width:32px;height:32px;border:1.5px solid var(--tap-color);border-radius:50%;box-shadow:0 0 12px var(--tap-color);animation:tapRing .65s ease-out both}
   .tap-shimmer-streak{position:absolute;inset:0;width:38%;height:100%;background:linear-gradient(90deg,transparent,#b4eaff55,#fff,#b4eaff77,transparent);filter:blur(2px);box-shadow:0 0 16px var(--tap-color);transform:skewX(-22deg);animation:tapStreak .72s ease-in-out both}
   .tap-shimmer-star{position:absolute;left:50%;top:50%;margin-left:-3px;margin-top:-3px;width:6px;height:6px;background:white;transform:rotate(45deg);box-shadow:0 0 10px var(--tap-color);animation:tapStar .7s ease-out both}
   .tap-dust{position:absolute;border-radius:50%;background:#e8f7ff;box-shadow:0 0 6px #7bdbff,0 0 12px #99d8ff88;animation:tapDustFall ease-out both}
   @keyframes tapRing{from{opacity:1;transform:scale(.25)}to{opacity:0;transform:scale(2.2)}}
   @keyframes tapStreak{0%{opacity:0;left:-40%}12%{opacity:1}75%{opacity:1}100%{opacity:0;left:110%}}
   @keyframes tapStar{0%{opacity:1;transform:rotate(45deg) scale(1.4)}100%{opacity:0;transform:rotate(135deg) scale(.2)}}
   @keyframes tapDustFall{0%{opacity:0;transform:translate3d(0,0,0) scale(.4)}18%{opacity:.85}75%{opacity:.65}100%{opacity:0;transform:translate3d(var(--dx),var(--dy),0) scale(.3)}}
   @media(prefers-reduced-motion:reduce){.tap-shimmer-layer{display:none}}
  `}</style>
 </div>;
}
