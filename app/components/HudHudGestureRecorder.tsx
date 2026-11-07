"use client";
import {useCallback,useEffect,useRef,useState} from "react";

type Sample={t:number;x:number;y:number;pressure:number;area:number;pointerId:number;pointerType:string};
type Stroke={id:number;kind:string;duration:number;distance:number;velocity:number;peakVelocity:number;maxArea:number;maxPressure:number;samples:Sample[]};
const MAX_SAMPLES=6000;
const MAX_STROKES=24;
// PointerEvent contact geometry and pressure are optional browser estimates.
const finite=(value:number,fallback=0)=>Number.isFinite(value)?value:fallback;
const pressureOf=(p:{pointerType:string;buttons:number;pressure:number})=>p.pointerType==="mouse"?(p.buttons?0.5:0):Math.max(0,Math.min(1,finite(p.pressure)));
const areaOf=(p:{width:number;height:number})=>Math.min(100000,Math.max(0,finite(p.width))*Math.max(0,finite(p.height)));
const classify=(dx:number,dy:number,duration:number)=>{const dist=Math.hypot(dx,dy);if(dist<15)return duration>450?"Long press":"Tap";if(Math.abs(dx)>Math.abs(dy)*1.4)return dx>0?"Swipe right":"Swipe left";if(Math.abs(dy)>Math.abs(dx)*1.4)return dy>0?"Swipe down":"Swipe up";return "Diagonal swipe";};
export default function HudHudGestureRecorder({onClose}:{onClose:()=>void}){
 const canvas=useRef<HTMLCanvasElement>(null);
 const active=useRef(new Map<number,Sample[]>());
 const strokes=useRef<Stroke[]>([]);
 const frame=useRef<number|null>(null);
 const playback=useRef<number|null>(null);
 const [history,setHistory]=useState<Stroke[]>([]);
 const [live,setLive]=useState({speed:0,pressure:0,area:0,distance:0,duration:0,pointers:0});
 const [status,setStatus]=useState("Touch the tray to record. Traces remain visible until release.");
 const [replaying,setReplaying]=useState(false);
 const [sessionName,setSessionName]=useState("Gesture test");
 const draw=useCallback((current:Sample[][],fade=1)=>{
   const el=canvas.current;if(!el)return;const ctx=el.getContext("2d");if(!ctx)return;
   const w=el.clientWidth,h=el.clientHeight,dpr=Math.min(window.devicePixelRatio||1,2);
   if(el.width!==Math.round(w*dpr)||el.height!==Math.round(h*dpr)){el.width=Math.round(w*dpr);el.height=Math.round(h*dpr);}
   ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
   for(const samples of current){if(!samples.length)continue;ctx.save();ctx.globalAlpha=fade;ctx.lineJoin="round";ctx.lineCap="round";
     for(let i=1;i<samples.length;i++){const a=samples[i-1],b=samples[i],dt=Math.max(1,b.t-a.t),speed=Math.hypot(b.x-a.x,b.y-a.y)/dt*1000;
       ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
       ctx.strokeStyle="#19baff";ctx.shadowColor="#009dff";ctx.shadowBlur=Math.min(38,10+speed/65);ctx.lineWidth=Math.min(19,3+b.pressure*8+Math.sqrt(b.area)/5);ctx.stroke();
       ctx.shadowBlur=0;ctx.strokeStyle="#d4faff";ctx.lineWidth=1.5;ctx.stroke();
     }
     const p=samples[samples.length-1];ctx.beginPath();ctx.arc(p.x,p.y,Math.min(40,10+p.pressure*13+Math.sqrt(p.area)/3),0,Math.PI*2);
     ctx.fillStyle="#42d5ff88";ctx.shadowColor="#13baff";ctx.shadowBlur=35;ctx.fill();ctx.restore();
   }
 },[]);
 const stopFrame=()=>{if(frame.current!==null){cancelAnimationFrame(frame.current);frame.current=null}};
 const stopPlayback=()=>{if(playback.current!==null)cancelAnimationFrame(playback.current);playback.current=null;setReplaying(false)};
 useEffect(()=>()=>{if(frame.current!==null)cancelAnimationFrame(frame.current);if(playback.current!==null)cancelAnimationFrame(playback.current)},[]);
 useEffect(()=>{const old=document.body.style.overflow;document.body.style.overflow="hidden";return()=>{document.body.style.overflow=old}},[]);
 const point=(e:React.PointerEvent<HTMLCanvasElement>):Sample=>{const r=e.currentTarget.getBoundingClientRect();return {t:e.timeStamp,x:e.clientX-r.left,y:e.clientY-r.top,pressure:pressureOf(e),area:areaOf(e),pointerId:e.pointerId,pointerType:e.pointerType}};
 const paint=()=>{draw(Array.from(active.current.values()));};
 const down=(e:React.PointerEvent<HTMLCanvasElement>)=>{if(replaying)return;stopFrame();try{e.currentTarget.setPointerCapture(e.pointerId)}catch{};active.current.set(e.pointerId,[point(e)]);paint();setLive(v=>({...v,pointers:active.current.size}));setStatus("Recording gesture…")};
 const move=(e:React.PointerEvent<HTMLCanvasElement>)=>{const list=active.current.get(e.pointerId);if(!list||replaying)return;
   const coalesced=typeof e.nativeEvent.getCoalescedEvents==="function"?e.nativeEvent.getCoalescedEvents():[];
   const events=coalesced.length?coalesced:[e.nativeEvent];
   for(const p of events){if(list.length>=MAX_SAMPLES)break;const r=e.currentTarget.getBoundingClientRect();const last=list[list.length-1];const t=finite(p.timeStamp,last.t);if(t<last.t)continue;const x=finite(p.clientX-r.left,last.x),y=finite(p.clientY-r.top,last.y);list.push({t,x,y,pressure:pressureOf(p),area:areaOf(p),pointerId:e.pointerId,pointerType:p.pointerType||e.pointerType});}
   if(frame.current===null)frame.current=requestAnimationFrame(()=>{frame.current=null;paint();const a=list[0],b=list[list.length-1],prev=list[Math.max(0,list.length-2)];setLive({speed:Math.round(Math.hypot(b.x-prev.x,b.y-prev.y)/Math.max(1,b.t-prev.t)*1000),pressure:Math.round(b.pressure*100),area:Math.round(b.area),distance:Math.round(Math.hypot(b.x-a.x,b.y-a.y)),duration:Math.round(b.t-a.t),pointers:active.current.size})});
 };
 const end=(e:React.PointerEvent<HTMLCanvasElement>,cancelled=false)=>{const list=active.current.get(e.pointerId);if(!list)return;const last=point(e);if(!cancelled&&list.length<MAX_SAMPLES)list.push({...last,t:Math.max(last.t,list[list.length-1].t)});active.current.delete(e.pointerId);
   const a=list[0],b=list[list.length-1],duration=Math.max(1,b.t-a.t),distance=Math.hypot(b.x-a.x,b.y-a.y);
   if(!cancelled){let peak=0;for(let i=1;i<list.length;i++)peak=Math.max(peak,Math.hypot(list[i].x-list[i-1].x,list[i].y-list[i-1].y)/Math.max(1,list[i].t-list[i-1].t)*1000);
     const stroke:Stroke={id:Date.now()+Math.random(),kind:classify(b.x-a.x,b.y-a.y,duration),duration:Math.round(duration),distance:Math.round(distance),velocity:Math.round(distance/duration*1000),peakVelocity:Math.round(peak),maxArea:Math.round(Math.max(...list.map(p=>p.area))),maxPressure:Math.round(Math.max(...list.map(p=>p.pressure))*100),samples:list.map(p=>({...p,t:Math.round(p.t-a.t)}))};
     strokes.current=[stroke,...strokes.current].slice(0,MAX_STROKES);setHistory([...strokes.current]);setStatus(stroke.kind+" captured · "+stroke.samples.length+" samples");
   }else setStatus("Gesture cancelled; incomplete stroke discarded.");
   if(active.current.size){paint();return;}
   const snapshot=list.slice();const started=performance.now();const fade=()=>{if(active.current.size)return;const opacity=Math.max(0,1-(performance.now()-started)/900);draw([snapshot],opacity);if(opacity>0)frame.current=requestAnimationFrame(fade);else frame.current=null};stopFrame();frame.current=requestAnimationFrame(fade);
   setLive(v=>({...v,pointers:0}));
 };
 const replay=(stroke:Stroke)=>{stopPlayback();stopFrame();active.current.clear();setReplaying(true);setStatus("Replaying captured samples at original timing");const start=performance.now();const step=()=>{const elapsed=performance.now()-start;const visible=stroke.samples.filter(p=>p.t<=elapsed);draw([visible]);if(elapsed<stroke.duration+250)playback.current=requestAnimationFrame(step);else{playback.current=null;setReplaying(false);setStatus("Replay complete — compare movement and timing.")}};playback.current=requestAnimationFrame(step)};
 const demoSwipe=()=>{stopPlayback();if(active.current.size){setStatus("Finish your touch gesture before running a demo.");return}const el=canvas.current;if(!el)return;const w=el.clientWidth,h=el.clientHeight;const samples:Sample[]=Array.from({length:31},(_,i)=>({t:i*16,x:w*0.5+Math.sin(i/30*Math.PI)*12,y:h*0.82-(h*0.64*i/30),pressure:0.5,area:0,pointerId:-1,pointerType:"synthetic"}));const stroke:Stroke={id:Date.now()+Math.random(),kind:"Synthetic swipe up",duration:480,distance:Math.round(h*0.64),velocity:Math.round(h*0.64/0.48),peakVelocity:Math.round(h*0.64/0.48),maxArea:0,maxPressure:50,samples};strokes.current=[stroke,...strokes.current].slice(0,MAX_STROKES);setHistory([...strokes.current]);setStatus("Synthetic keyboard-accessible sample captured; not real touch data.");replay(stroke)};
 const exportData=()=>{const blob=new Blob([JSON.stringify({format:"1muslim-gesture-studio-v1",name:sessionName,exportedAt:new Date().toISOString(),coordinateSystem:"CSS pixels relative to test tray",strokes:strokes.current},null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="gesture-studio-session.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 const clear=()=>{stopPlayback();stopFrame();active.current.clear();strokes.current=[];setHistory([]);draw([]);setStatus("Session cleared.")};
 return <div className="hh-record-overlay" role="dialog" aria-modal="true" aria-label="Full screen gesture recording studio">
   <header className="hh-record-header"><div><strong>🔵 Gesture Test Space</strong><small>Device-local session · no global gestures changed</small></div><button type="button" onClick={()=>{stopPlayback();stopFrame();onClose()}}>✕ Close</button></header>
   <div className="hh-record-body"><div className="hh-record-toolbar"><label>Session name <input value={sessionName} maxLength={50} onChange={e=>setSessionName(e.target.value)}/></label><button type="button" onClick={demoSwipe}>Demo swipe (synthetic)</button><button type="button" onClick={exportData} disabled={!history.length}>Export JSON</button><button type="button" onClick={clear}>Clear</button></div>
   <div className="hh-record-tray"><canvas ref={canvas} aria-label="Gesture recording touch surface" onPointerDown={down} onPointerMove={move} onPointerUp={e=>end(e)} onPointerCancel={e=>end(e,true)} onLostPointerCapture={e=>end(e,true)}/><span className="hh-record-hint" aria-hidden="true">TOUCH · SWIPE · TRACE</span></div>
   <div className="hh-record-metrics" aria-live="off"><span>Velocity <b>{live.speed} px/s</b></span><span>Pressure <b>{live.pressure}%</b></span><span>Contact <b>{live.area} px²</b></span><span>Distance <b>{live.distance} px</b></span><span>Duration <b>{live.duration} ms</b></span><span>Fingers <b>{live.pointers}</b></span></div>
   <p className="hh-record-status" role="status">{status}</p>
   <div className="hh-record-history"><strong>Captured strokes ({history.length}/{MAX_STROKES})</strong><p>Each stroke stores timestamped pointer samples, position, speed-derived motion, pressure and contact area. Replay reproduces recorded position and timing, not physical pressure. Synthetic demo strokes are labeled and must not be used as device stability evidence.</p>{history.map(s=><div className="hh-record-row" key={s.id}><span>{s.kind} · {s.duration} ms · {s.distance} px · avg {s.velocity} px/s · peak {s.peakVelocity} px/s · {s.samples.length} points</span><button type="button" onClick={()=>{replay(s)}} disabled={replaying}>Replay</button></div>)}</div>
   </div><style jsx>{`
   .hh-record-overlay{position:fixed;inset:0;z-index:2147483000;background:#030b19;color:#e6f8ff;display:flex;flex-direction:column;font-family:inherit}
   .hh-record-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;background:#07172d;border-bottom:1px solid #248aff66}.hh-record-header div{display:grid;gap:3px}.hh-record-header strong{font-size:17px}.hh-record-header small{font-size:11px;color:#b5d8f2}
   button{cursor:pointer;border:1px solid #38adff88;background:#0a3154;color:#fff;border-radius:10px;min-height:42px;padding:8px 12px}button:disabled{opacity:.5;cursor:default}button:focus-visible,input:focus-visible{outline:2px solid #b4efff;outline-offset:2px}
   .hh-record-body{flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:10px;padding:10px 14px 22px}
   .hh-record-toolbar{display:flex;gap:9px;align-items:end;flex-wrap:wrap}.hh-record-toolbar label{display:grid;gap:3px;font-size:12px}.hh-record-toolbar input{min-width:0;max-width:190px;background:#102e4c;color:#fff;border:1px solid #389df7;border-radius:8px;padding:9px;font-size:16px}
   .hh-record-tray{position:relative;flex:1;min-height:230px;max-height:65vh;border:1px solid #18b7ff;border-radius:18px;overflow:hidden;background:radial-gradient(ellipse at center,#123e77,#020c1c 85%);box-shadow:inset 0 0 55px #007bff66}
   .hh-record-tray canvas{display:block;width:100%;height:100%;touch-action:none;cursor:crosshair}.hh-record-hint{pointer-events:none;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);color:#b5dcff66;font-size:12px;letter-spacing:3px;white-space:nowrap}
   .hh-record-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.hh-record-metrics span{background:#09223b;border:1px solid #175586;border-radius:9px;padding:7px;font-size:11px;display:grid;gap:3px}.hh-record-metrics b{font-size:14px;color:#70d9ff}
   .hh-record-status{margin:0;color:#aee4ff;font-size:12px}.hh-record-history{display:grid;gap:7px}.hh-record-history>p{margin:0;color:#b6c9d8;font-size:11px}.hh-record-row{display:flex;align-items:center;justify-content:space-between;gap:10px;border-bottom:1px solid #1d4767;padding:5px 0;font-size:11px}.hh-record-row span{min-width:0}
   @media(max-width:390px){.hh-record-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.hh-record-header strong{font-size:14px}}
   @media(prefers-reduced-motion:reduce){.hh-record-overlay *{animation:none!important;transition:none!important}}
   `}</style></div>;
}
