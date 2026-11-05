"use client";
import {useEffect,useRef,useState} from "react";

const categories=["All","Qur'an","Dawah","Lessons","Community","Shorts"];
const demos=[
 {name:"Qur'an Reflections",category:"Qur'an",tone:0},
 {name:"Faith & Dialogue",category:"Dawah",tone:1},
 {name:"Learning Together",category:"Lessons",tone:2},
 {name:"Ummah Moments",category:"Community",tone:3},
 {name:"Daily Inspiration",category:"Shorts",tone:4},
 {name:"Verse of the Day",category:"Qur'an",tone:5}
];
export default function HomeVideoWheel(){
 const expanded=true;
 const [category,setCategory]=useState("All");
 const [position,setPosition]=useState(0);
 const direction=useRef(1);
 const pointer=useRef<{x:number;position:number}|null>(null);
 const paused=useRef(false);
 const [reduce,setReduce]=useState(false);
 const positionRef=useRef(0);
 useEffect(()=>{const media=window.matchMedia("(prefers-reduced-motion: reduce)");const update=()=>setReduce(media.matches);update();media.addEventListener("change",update);return()=>media.removeEventListener("change",update)},[]);
 useEffect(()=>{if(!expanded||reduce)return;let frame=0,last=0;const tick=(time:number)=>{if(last&&!paused.current){positionRef.current+=direction.current*Math.min(time-last,50)*.00015;setPosition(positionRef.current)}last=time;frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame)},[expanded,reduce,category]);
 const items=category==="All"?demos:demos.filter(item=>item.category===category);
 const count=items.length;
 const onMove=(x:number)=>{if(!pointer.current)return;const delta=(pointer.current.x-x)/145;positionRef.current=pointer.current.position+delta;setPosition(positionRef.current);if(Math.abs(delta)>.03)direction.current=delta>0?1:-1};
 return <div className="homeVideoWheel" data-expanded={expanded}>
 <style>{`
 .homeVideoWheel{position:relative;flex:0 0 auto;height:100%;min-height:0;width:100%;z-index:5;color:white;pointer-events:auto}

 .homeVideoWheelBody{height:0;opacity:0;overflow:hidden;pointer-events:none;transition:height .35s ease,opacity .35s ease}
 .homeVideoWheel[data-expanded="true"] .homeVideoWheelBody{height:100%;opacity:1;pointer-events:auto}
 .homeVideoWheelCategories{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none;padding:5px 8px;justify-content:safe center}
 .homeVideoWheelCategories button{white-space:nowrap;border:1px solid rgba(255,255,255,.27);border-radius:15px;padding:5px 10px;background:rgba(8,18,25,.25);color:inherit;font-size:11px}
 .homeVideoWheelCategories button[aria-pressed="true"]{background:rgba(255,255,255,.22);border-color:currentColor}
 .homeVideoWheelTrack{position:relative;height:calc(100% - 42px);overflow:hidden;touch-action:pan-y;user-select:none;cursor:grab;mask-image:linear-gradient(90deg,transparent,#000 13%,#000 87%,transparent)}
 .homeVideoWheelTrack:active{cursor:grabbing}
 .homeVideoWheelCard{position:absolute;top:5px;left:50%;height:calc(100% - 12px);width:clamp(95px,24%,175px);border:1px solid rgba(255,255,255,.35);border-radius:15px;box-shadow:0 12px 25px rgba(0,0,0,.25);display:flex;flex-direction:column;justify-content:end;padding:10px;box-sizing:border-box;overflow:hidden;will-change:transform,opacity;pointer-events:none}
 .homeVideoWheelCard small{font-size:10px;opacity:.8}.homeVideoWheelCard strong{font-size:12px;text-shadow:0 2px 5px #000}
 @media(max-width:767px){.homeVideoWheel[data-expanded="true"] .homeVideoWheelBody{height:100%}.homeVideoWheelCard{width:32%}}
 @media(prefers-reduced-motion:reduce){.homeVideoWheelBody{transition:none}}
 `}</style>
 
 <div className="homeVideoWheelBody" aria-hidden={!expanded}>
 {expanded&&<><div className="homeVideoWheelCategories" aria-label="Clip categories">{categories.map(c=><button key={c} type="button" aria-pressed={category===c} onClick={()=>{setCategory(c);positionRef.current=0;setPosition(0)}}>{c}</button>)}</div>
 <div className="homeVideoWheelTrack" aria-label="Preview carousel placeholders" onPointerDown={e=>{paused.current=true;pointer.current={x:e.clientX,position:positionRef.current};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>onMove(e.clientX)} onPointerUp={e=>{onMove(e.clientX);pointer.current=null;paused.current=false}} onPointerCancel={()=>{pointer.current=null;paused.current=false}}>
 {items.map((item,i)=>{let offset=((i-position)%count+count)%count;if(offset>count/2)offset-=count;const distance=Math.abs(offset);const scale=Math.max(.24,1-.25*distance*distance);return <div key={item.name} className="homeVideoWheelCard" style={{transform:`translateX(calc(-50% + ${offset*110}%)) perspective(550px) rotateY(${-offset*13}deg) scale(${scale})`,opacity:Math.max(.12,1-distance*.28),zIndex:Math.round(20-distance),background:`linear-gradient(145deg,hsla(${190+item.tone*27},65%,35%,.58),rgba(4,12,25,.8))`}}><small>{item.category} · Preview soon</small><strong>{item.name}</strong></div>})}
 </div></>}
 </div></div>;
}
