"use client";

import {useEffect,useRef,useState,type KeyboardEvent,type PointerEvent} from "react";
import styles from "./SearchDraggableDisplayName.module.css";

type Layout={x:number;y:number;size:number};
type Point={x:number;y:number};
type Gesture=
 | {kind:"drag";pointerId:number;origin:Point;layout:Layout}
 | {kind:"pinch";distance:number;size:number};
type Props={
 memberId:string|null;
 displayName:string;
 visibleName:string;
 showHudLabel:boolean;
 onEdit:()=>void;
};

const MIN_SIZE=16;
const MAX_SIZE=40;
const initial:Layout={x:.5,y:.5,size:30};
const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));

/** Display name moves only inside this region. Stored coordinates are relative
 * to its box, so orientation changes never shift it into the header or search.
 */
export default function SearchDraggableDisplayName({
 memberId,displayName,visibleName,showHudLabel,onEdit
}:Props){
 const zone=useRef<HTMLDivElement>(null);
 const name=useRef<HTMLButtonElement>(null);
 const touches=useRef<Map<number,Point>>(new Map());
 const gesture=useRef<Gesture|null>(null);
 const moved=useRef(false);
 const layoutRef=useRef<Layout>(initial);
 const [layout,setLayout]=useState<Layout>(initial);
 const [loadedFor,setLoadedFor]=useState<string|null>(null);

 const bounds=(candidate:Layout):Layout=>{
  const box=zone.current?.getBoundingClientRect();
  const button=name.current;
  const size=clamp(Number.isFinite(candidate.size)?candidate.size:initial.size,MIN_SIZE,MAX_SIZE);
  if(!box||!button||!box.width||!box.height)return {...candidate,size};
  const edgeX=Math.min(.5,(button.offsetWidth/2+7)/box.width);
  const edgeY=Math.min(.5,(button.offsetHeight/2+6)/box.height);
  return {x:clamp(candidate.x,edgeX,1-edgeX),y:clamp(candidate.y,edgeY,1-edgeY),size};
 };
 const paint=(next:Layout)=>{layoutRef.current=next;setLayout(next)};
 const save=()=>{
  if(!memberId)return;
  try{localStorage.setItem("1muslim:home-name-layout:"+memberId,JSON.stringify(layoutRef.current))}catch{}
 };
 useEffect(()=>{
  touches.current.clear();gesture.current=null;moved.current=false;
  let next={...initial};
  if(memberId){
   try{
    const raw=JSON.parse(localStorage.getItem("1muslim:home-name-layout:"+memberId)||"null");
    if(raw&&Number.isFinite(raw.x)&&Number.isFinite(raw.y)&&Number.isFinite(raw.size)){
     next={x:clamp(raw.x,0,1),y:clamp(raw.y,0,1),size:clamp(raw.size,MIN_SIZE,MAX_SIZE)};
    }
   }catch{}
  }
  paint(next);setLoadedFor(memberId);
 },[memberId]);

 useEffect(()=>{
  const element=zone.current;
  if(!element||typeof ResizeObserver==="undefined")return;
  const observer=new ResizeObserver(()=>{
   const corrected=bounds(layoutRef.current);
   if(Math.abs(corrected.x-layoutRef.current.x)>.0001||Math.abs(corrected.y-layoutRef.current.y)>.0001){
    paint(corrected);save();
   }
  });
  observer.observe(element);
  return()=>observer.disconnect();
 },[memberId,visibleName,layout.size]);

 const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
 const start=(event:PointerEvent<HTMLButtonElement>)=>{
  if(event.pointerType==="mouse"&&event.button!==0)return;
  event.currentTarget.setPointerCapture(event.pointerId);
  touches.current.set(event.pointerId,{x:event.clientX,y:event.clientY});
  if(touches.current.size===1){
   moved.current=false;
   gesture.current={kind:"drag",pointerId:event.pointerId,origin:{x:event.clientX,y:event.clientY},layout:layoutRef.current};
  }else if(touches.current.size===2){
   moved.current=true;
   const [a,b]=[...touches.current.values()];
   gesture.current={kind:"pinch",distance:Math.max(distance(a,b),10),size:layoutRef.current.size};
  }
 };
 const move=(event:PointerEvent<HTMLButtonElement>)=>{
  if(!touches.current.has(event.pointerId))return;
  touches.current.set(event.pointerId,{x:event.clientX,y:event.clientY});
  const current=gesture.current;
  if(!current)return;
  if(touches.current.size>=2){
   const [a,b]=[...touches.current.values()];
   if(current.kind!=="pinch"){
    gesture.current={kind:"pinch",distance:Math.max(distance(a,b),10),size:layoutRef.current.size};
    moved.current=true;
    return;
   }
   const size=clamp(Math.round(current.size*distance(a,b)/current.distance),MIN_SIZE,MAX_SIZE);
   if(size!==layoutRef.current.size)paint(bounds({...layoutRef.current,size}));
   moved.current=true;
   return;
  }
  if(current.kind!=="drag"||current.pointerId!==event.pointerId)return;
  const dx=event.clientX-current.origin.x,dy=event.clientY-current.origin.y;
  if(Math.hypot(dx,dy)>5)moved.current=true;
  if(!moved.current)return;
  const box=zone.current?.getBoundingClientRect();
  if(!box||!box.width||!box.height)return;
  paint(bounds({...layoutRef.current,x:current.layout.x+dx/box.width,y:current.layout.y+dy/box.height}));
 };
 const end=(event:PointerEvent<HTMLButtonElement>)=>{
  if(!touches.current.has(event.pointerId))return;
  touches.current.delete(event.pointerId);
  try{if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId)}catch{}
  if(touches.current.size===1){
   const [pointerId,point]=[...touches.current.entries()][0];
   gesture.current={kind:"drag",pointerId,origin:point,layout:layoutRef.current};
   moved.current=true;
  }else if(touches.current.size===0){
   gesture.current=null;
   const corrected=bounds(layoutRef.current);
   paint(corrected);
   if(moved.current)save();
  }
 };
 const key=(event:KeyboardEvent<HTMLButtonElement>)=>{
  if(!event.altKey)return;
  const box=zone.current?.getBoundingClientRect();
  if(!box)return;
  const delta=event.shiftKey?20:8;
  let next={...layoutRef.current};
  switch(event.key){
   case "ArrowLeft":next.x-=delta/box.width;break;
   case "ArrowRight":next.x+=delta/box.width;break;
   case "ArrowUp":next.y-=delta/box.height;break;
   case "ArrowDown":next.y+=delta/box.height;break;
   case "+":case "=":next.size+=2;break;
   case "-":next.size-=2;break;
   default:return;
  }
  event.preventDefault();paint(bounds(next));save();
 };
 return <div ref={zone} className={styles.zone} aria-label="Draggable display name area">
  <button
   ref={name}
   type="button"
   className={styles.nameButton}
   style={{left:(layout.x*100)+"%",top:(layout.y*100)+"%",fontSize:layout.size+"px",fontWeight:740,lineHeight:1.08}}
   aria-label={"Edit "+displayName+". Drag to move, pinch to resize between 16 and 40 pixels."}
   title="Drag to position · pinch to resize · tap to edit"
   onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end}
   onLostPointerCapture={end}
   onKeyDown={key}
   onClick={event=>{if(moved.current||loadedFor!==memberId){event.preventDefault();return;}onEdit()}}
  >
   <span className={styles.nameText} dir="auto">{visibleName||"\u00a0"}</span>
   <span className={styles.hudLabel+(showHudLabel?" "+styles.visible:"")} aria-hidden="true">with HudHud</span>
  </button>
 </div>;
}
