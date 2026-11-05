"use client";
import {useEffect,useRef,useState,useLayoutEffect} from "react";
import {videoRegistry} from "./videoRegistry";

export default function HomeVideoWheel({format="desktop"}:{format?:"desktop"|"phone"}){
 const expanded=true;

 const [position,setPosition]=useState(0);
 const dragged=useRef(false);
 const direction=useRef(1);
 const pointer=useRef<{x:number;position:number}|null>(null);
 const paused=useRef(false);
 const slotRef=useRef<HTMLDivElement>(null);
 useLayoutEffect(()=>{
  const wheel=slotRef.current;
  const slot=wheel?.parentElement;
  const stage=slot?.closest(".oneMuslimLiveStage");
  const video=stage?.querySelector(".oneMuslimLiveVideo");
  const chat=stage?.querySelector(".oneMuslimLiveBottom");
  if(!slot||!stage||!video||!chat)return;
  let frame=0;
  const place=()=>{
   cancelAnimationFrame(frame);
   frame=requestAnimationFrame(()=>{
    const sr=stage.getBoundingClientRect();
    const player=video.querySelector(".oneMuslimIdleYoutubePlayer, .oneMuslimFloatingPlayerRig .oneMuslimIdleYoutubePlayer") || video.firstElementChild || video;
    const vr=player.getBoundingClientRect(),cr=chat.getBoundingClientRect();
    const top=Math.max(0,vr.bottom-sr.top+28);
    const bottom=Math.min(sr.height,cr.top-sr.top-8);
    const available=Math.max(0,bottom-top);
    slot.style.setProperty("top",top+"px","important");
    slot.style.setProperty("height",Math.min(115,available)+"px","important");
    slot.style.visibility=available>=48?"visible":"hidden";
   });
  };
  const observer=new ResizeObserver(place);
  [stage,video,chat].forEach(el=>observer.observe(el));
  window.addEventListener("resize",place);
  place();
  return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener("resize",place)};
 },[]);
 const [reduce,setReduce]=useState(false);
 const positionRef=useRef(0);
 useEffect(()=>{const media=window.matchMedia("(prefers-reduced-motion: reduce)");const update=()=>setReduce(media.matches);update();media.addEventListener("change",update);return()=>media.removeEventListener("change",update)},[]);
 useEffect(()=>{if(!expanded||reduce)return;let frame=0,last=0;const tick=(time:number)=>{if(last&&!paused.current){positionRef.current+=direction.current*Math.min(time-last,50)*.00015;setPosition(positionRef.current)}last=time;frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame)},[expanded,reduce]);
 const items=videoRegistry.filter(v=>v.format===format);
 const count=items.length;
 const onMove=(x:number)=>{if(!pointer.current)return;const delta=(pointer.current.x-x)/145;if(Math.abs(pointer.current.x-x)>8)dragged.current=true;positionRef.current=pointer.current.position+delta;setPosition(positionRef.current);if(Math.abs(delta)>.03)direction.current=delta>0?1:-1};
 return <div ref={slotRef} className="homeVideoWheel" data-expanded={expanded}>
 <style>{`
 .homeVideoWheel{position:relative;flex:0 0 auto;height:100%;min-height:0;width:100%;z-index:5;color:white;pointer-events:auto}

 .homeVideoWheelBody{height:0;opacity:0;overflow:hidden;pointer-events:none;transition:height .35s ease,opacity .35s ease}
 .homeVideoWheel[data-expanded="true"] .homeVideoWheelBody{height:100%;opacity:1;pointer-events:auto}
 .homeVideoWheelCategories{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none;padding:5px 8px;justify-content:safe center}
 .homeVideoWheelCategories button{white-space:nowrap;border:1px solid rgba(255,255,255,.27);border-radius:15px;padding:5px 10px;background:rgba(8,18,25,.25);color:inherit;font-size:11px}
 .homeVideoWheelCategories button[aria-pressed="true"]{background:rgba(255,255,255,.22);border-color:currentColor}
 .homeVideoWheelTrack{position:relative;height:100%;overflow:hidden;touch-action:none;overscroll-behavior:contain;user-select:none;cursor:grab;mask-image:linear-gradient(90deg,transparent,#000 13%,#000 87%,transparent)}
 .homeVideoWheelTrack:active{cursor:grabbing}
 .homeVideoWheelCard{position:absolute;top:5px;left:50%;height:calc(100% - 12px);width:clamp(140px,34%,235px);border:1px solid rgba(255,255,255,.35);border-radius:15px;box-shadow:0 12px 25px rgba(0,0,0,.25);display:flex;flex-direction:column;justify-content:end;padding:12px;box-sizing:border-box;overflow:hidden;will-change:transform,opacity;pointer-events:none}
 .homeVideoWheelCard small{font-size:12px;opacity:.8}.homeVideoWheelCard strong{font-size:17px;line-height:1.18;text-shadow:0 2px 5px #000}
 @media(max-width:767px){.homeVideoWheel[data-expanded="true"] .homeVideoWheelBody{height:100%}.homeVideoWheelCard{width:38%}}
 @media(prefers-reduced-motion:reduce){.homeVideoWheelBody{transition:none}}
 `}</style>
 
 <div className="homeVideoWheelBody" aria-hidden={!expanded}>
 {expanded&&<><div className="homeVideoWheelTrack" aria-label="Choose a video to play above" onTouchStart={e=>e.stopPropagation()} onTouchMove={e=>e.stopPropagation()} onTouchEnd={e=>e.stopPropagation()} onPointerDown={e=>{e.stopPropagation();paused.current=true;dragged.current=false;pointer.current={x:e.clientX,position:positionRef.current};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{e.stopPropagation();onMove(e.clientX)}} onPointerUp={e=>{e.stopPropagation();onMove(e.clientX);pointer.current=null;paused.current=false}} onPointerCancel={()=>{pointer.current=null;paused.current=false}}>
 {items.map((item,i)=>{let offset=((i-position)%count+count)%count;if(offset>count/2)offset-=count;const distance=Math.abs(offset);const scale=Math.max(.24,1-.25*distance*distance);return <div key={item.videoId} className="homeVideoWheelCard" role="button" tabIndex={0} aria-label={`Play ${item.title}`} onClick={()=>{if(dragged.current){dragged.current=false;return;}window.dispatchEvent(new CustomEvent("oneMuslimSelectCarouselVideo",{detail:{videoId:item.videoId,format:item.format}}))}} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();window.dispatchEvent(new CustomEvent("oneMuslimSelectCarouselVideo",{detail:{videoId:item.videoId,format:item.format}}))}}} style={{transform:`translateX(calc(-50% + ${offset*110}%)) perspective(550px) rotateY(${-offset*13}deg) scale(${scale})`,opacity:Math.max(.12,1-distance*.28),zIndex:Math.round(20-distance),background:`linear-gradient(145deg,hsla(${190+(i%6)*27},65%,35%,.58),rgba(4,12,25,.8))`}}><small>{item.category} · Play video</small><strong>{item.title}</strong></div>})}
 </div></>}
 </div></div>;
}
