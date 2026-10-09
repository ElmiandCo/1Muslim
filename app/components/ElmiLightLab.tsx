"use client";
import {useCallback,useEffect,useRef,useState} from "react";
type P={x:number;y:number;vx:number;vy:number;ox:number;oy:number;life:number;h:number;size:number};
export default function ElmiLightLab({onClose}:{onClose:()=>void}){
 const canvas=useRef<HTMLCanvasElement>(null),particles=useRef<P[]>([]),touch=useRef<{x:number;y:number;down:boolean}>({x:0,y:0,down:false}),[mode,setMode]=useState<"show"|"touch">("show"),[progress,setProgress]=useState(0);
 const start=useRef(performance.now()),frame=useRef(0);
 const restart=useCallback((m:"show"|"touch")=>{setMode(m);start.current=performance.now();particles.current=[];setProgress(0)},[]);
 useEffect(()=>{
  const c=canvas.current;if(!c)return;const ctx=c.getContext("2d");if(!ctx)return;
  let active=true,last=0;
  const resize=()=>{const d=Math.min(devicePixelRatio||1,2);c.width=Math.round(innerWidth*d);c.height=Math.round(innerHeight*d);ctx.setTransform(d,0,0,d,0,0)};
  resize();addEventListener("resize",resize);
  const w=()=>innerWidth,h=()=>innerHeight;
  const make=(x:number,y:number,i:number):P=>({x,y,ox:x,oy:y,vx:(Math.random()-.5)*3,vy:(Math.random()-.5)*3,life:1,h:i%5===0?45:i%3===0?165:200,size:1+Math.random()*2.8});
  const tick=(now:number)=>{
   if(!active)return;frame.current=requestAnimationFrame(tick);if(now-last<16)return;last=now;
   ctx.clearRect(0,0,w(),h());ctx.fillStyle="#020710";ctx.fillRect(0,0,w(),h());
   const t=(now-start.current)/1000,phase=Math.min(t/5,1);
   if(mode==="show")setProgress(Math.min(100,Math.floor(phase*100)));
   const ps=particles.current;
   const target=mode==="show"?Math.min(550,Math.floor(w()*h()/1000)):Math.min(680,Math.floor(w()*h()/800));
   for(let i=ps.length;i<target;i++){const angle=i*2.39996,r=Math.sqrt(i/target)*Math.min(w(),h())*.45;ps.push(make(w()/2+Math.cos(angle)*r,h()/2+Math.sin(angle)*r,i))}
   ctx.globalCompositeOperation="lighter";
   const u=touch.current;
   ps.forEach((p,i)=>{
    const a=i*2.39996,ratio=i/ps.length,theta=t*1.7+ratio*12;
    let tx=w()/2,ty=h()/2;
    if(mode==="show"){
     const stage=t%5;
     if(stage<1.1){const radius=ratio*Math.min(w(),h())*.42;tx+=Math.cos(a+t)*radius;ty+=Math.sin(a+t)*radius}
     else if(stage<2.2){const branch=i%2?1:-1;tx+=branch*(40+ratio*w()*.42)+Math.sin(a+t)*30;ty+=Math.sin(ratio*18+t)*h()*.25}
     else if(stage<3.25){tx+=Math.cos(a)*w()*.7;ty+=Math.sin(a)*h()*.7}
     else if(stage<4.25){const radius=(1-ratio)*Math.min(w(),h())*.37;tx+=Math.cos(theta)*radius;ty+=Math.sin(theta)*radius}
     else {tx+=Math.sin(a)*8;ty+=Math.cos(a)*8}
    }else{
     const radius=Math.sqrt(ratio)*Math.min(w(),h())*.42;
     tx+=Math.cos(a+t*.25)*radius;ty+=Math.sin(a+t*.25)*radius;
     if(u.down){const dx=u.x-tx,dy=u.y-ty,dist=Math.hypot(dx,dy);const pull=Math.max(0,1-dist/Math.max(w(),h())*.9);const bend=Math.sin(t*5+ratio*9)*38;tx+=dx*pull*.85+Math.cos(a)*bend*pull;ty+=dy*pull*.85+Math.sin(a)*bend*pull}
    }
    p.vx=(p.vx+(tx-p.x)*.023)*.87;p.vy=(p.vy+(ty-p.y)*.023)*.87;p.x+=p.vx;p.y+=p.vy;
    ctx.beginPath();ctx.fillStyle=i%5===0?"#ffe6a1":i%3===0?"#8afee0":"#73c9ff";ctx.shadowBlur=14;ctx.shadowColor=ctx.fillStyle;ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();
    if(i%11===0){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*5,p.y-p.vy*5);ctx.strokeStyle=i%2?"#69e5ff88":"#ffdb8288";ctx.lineWidth=1.4;ctx.stroke()}
   });
   if(mode==="show"&&t>=5){start.current=now;setProgress(0)}
   ctx.globalCompositeOperation="source-over";ctx.shadowBlur=0;
  };
  frame.current=requestAnimationFrame(tick);
  return()=>{active=false;cancelAnimationFrame(frame.current);removeEventListener("resize",resize)};
 },[mode]);
 const pointer=(e:React.PointerEvent<HTMLCanvasElement>,down:boolean)=>{const r=e.currentTarget.getBoundingClientRect();touch.current={x:e.clientX-r.left,y:e.clientY-r.top,down};if(down&&mode!=="touch")restart("touch")};
 return <div className="elmi-lab" role="dialog" aria-modal="true" aria-label="Elmi Light exclusive laboratory">
  <canvas ref={canvas} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);pointer(e,true)}} onPointerMove={e=>{if(touch.current.down)pointer(e,true)}} onPointerUp={e=>pointer(e,false)} onPointerCancel={e=>pointer(e,false)} />
  <div className="elmi-lab-top"><div><strong>✦ ELMI LIGHT · PRIVATE LAB</strong><small>BEND · SPLIT · DISSOLVE · REFORM</small></div><button onClick={onClose} aria-label="Close Elmi Light lab">✕</button></div>
  <div className="elmi-lab-bottom"><p>{mode==="show"?"The 5-second symphony is playing. Watch the light split, dissolve and reform.":"TOUCH MODE · Press, hold and drag anywhere to bend the light. Release to watch it reform."}</p><div className="elmi-lab-controls"><button onClick={()=>restart("show")} className={mode==="show"?"selected":""}>▶ 5-Second Show</button><button onClick={()=>restart("touch")} className={mode==="touch"?"selected":""}>✋ Touch & Hold</button></div>{mode==="show"&&<div className="elmi-lab-progress"><span style={{width:progress+"%"}}/></div>}</div>
  <style jsx>{`
  .elmi-lab{position:fixed;inset:0;z-index:10050;background:#020710;color:white;overflow:hidden;touch-action:none}.elmi-lab canvas{width:100%;height:100%;display:block;touch-action:none}.elmi-lab-top{position:absolute;top:0;left:0;right:0;padding:calc(18px + env(safe-area-inset-top)) 20px 18px;display:flex;align-items:center;justify-content:space-between;gap:15px;background:linear-gradient(#020710e8,transparent);pointer-events:none}.elmi-lab-top div{display:grid;gap:5px}.elmi-lab-top strong{font-size:clamp(12px,3vw,17px);letter-spacing:.13em;color:#b7faff}.elmi-lab-top small{font-size:10px;letter-spacing:.17em;color:#f8df9a}.elmi-lab-top button{pointer-events:auto;border:1px solid #ffffff66;border-radius:14px;background:#ffffff1d;color:white;width:44px;height:44px;font-size:20px}.elmi-lab-bottom{position:absolute;bottom:0;left:0;right:0;padding:18px 16px calc(24px + env(safe-area-inset-bottom));background:linear-gradient(transparent,#020710e9 35%);text-align:center;pointer-events:none}.elmi-lab-bottom p{font-size:12px;color:#d6eaf4;max-width:560px;margin:0 auto 15px}.elmi-lab-controls{display:flex;gap:10px;justify-content:center;pointer-events:auto}.elmi-lab-controls button{border:1px solid #79dbed88;background:#0d253b;color:white;padding:13px 17px;border-radius:999px;font-weight:800;font-size:12px}.elmi-lab-controls button.selected{border-color:#ffde99;background:linear-gradient(110deg,#124a58,#3e3551);box-shadow:0 0 18px #6eeaff66}.elmi-lab-progress{height:3px;width:min(360px,75vw);background:#ffffff30;margin:17px auto 0;border-radius:5px;overflow:hidden}.elmi-lab-progress span{display:block;height:100%;background:linear-gradient(90deg,#62dfff,#ffe2a0);transition:width .1s linear}@media(prefers-reduced-motion:reduce){.elmi-lab canvas{opacity:.3}}
  `}</style>
 </div>
}
