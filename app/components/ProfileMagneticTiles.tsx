"use client";

import {useEffect,useLayoutEffect,useRef,useState} from "react";
import type {CSSProperties,KeyboardEvent as ReactKeyboardEvent,PointerEvent as ReactPointerEvent,ReactNode,RefObject} from "react";

type LauncherItem={label:string;href:string;icon:string;tone:string};
type DragPress={
 label:string;pointerId:number;touch:boolean;active:boolean;
 startX:number;startY:number;x:number;y:number;offsetX:number;offsetY:number;
 timer:number|null;dx:number;dy:number;
};
const STORE_KEY="1muslim:profile-explore-magnetic-order:v1";
const reorder=(order:string[],from:number,to:number)=>{
 if(from<0||to<0||from===to)return order;
 const next=[...order];const [moving]=next.splice(from,1);next.splice(to,0,moving);return next;
};
const isReduced=()=>typeof window!=="undefined"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The parent owns the original grid and Link handlers, including Qur'an,
 * Compass, Post and authentication. This component only adds reorder gestures.
 * Browser scroll and ordinary taps remain the default interaction.
 */
export default function ProfileMagneticTiles({items,expanded,gridRef,renderTile}:{
 items:LauncherItem[];
 expanded:boolean;
 gridRef:RefObject<HTMLDivElement|null>;
 renderTile:(item:LauncherItem)=>ReactNode;
}){
 const labels=items.map(x=>x.label);
 const [order,setOrder]=useState<string[]>(labels);
 const [activeLabel,setActiveLabel]=useState<string|null>(null);
 const currentOrder=useRef(order);
 const cells=useRef(new Map<string,HTMLDivElement>());
 const pressed=useRef<DragPress|null>(null);
 const beforeRects=useRef<Map<string,DOMRect>|null>(null);
 const frame=useRef<number|null>(null);
 const suppressClick=useRef<string|null>(null);
 currentOrder.current=order;

 useEffect(()=>{
  try{
   const saved=JSON.parse(localStorage.getItem(STORE_KEY)||"null");
   if(!Array.isArray(saved))return;
   const valid=new Set(labels);
   const restored=[...new Set(saved.filter((v:unknown):v is string=>typeof v==="string"&&valid.has(v)))];
   for(const label of labels){if(!restored.includes(label))restored.push(label)}
   if(restored.length===labels.length){currentOrder.current=restored;setOrder(restored)}
  }catch{}
 // Only load persisted ordering on mount, not on every badge refresh.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);

 const remember=(value:string[])=>{try{localStorage.setItem(STORE_KEY,JSON.stringify(value))}catch{}};
 const measure=()=>{
  const rects=new Map<string,DOMRect>();
  cells.current.forEach((element,key)=>rects.set(key,element.getBoundingClientRect()));
  return rects;
 };

 const paint=()=>{
  frame.current=null;
  const drag=pressed.current,grid=gridRef.current;
  if(!drag?.active||!grid)return;
  const el=cells.current.get(drag.label);
  if(!el)return;
  const box=grid.getBoundingClientRect();
  const dx=drag.x-drag.offsetX-box.left-el.offsetLeft;
  const dy=drag.y-drag.offsetY-box.top-el.offsetTop;
  drag.dx=dx;drag.dy=dy;
  el.style.transform=`translate3d(${dx}px,${dy}px,0) scale(1.05)`;
  grid.style.setProperty("--magnet-slot-x",el.offsetLeft+"px");
  grid.style.setProperty("--magnet-slot-y",el.offsetTop+"px");
  grid.style.setProperty("--magnet-slot-w",el.offsetWidth+"px");
  grid.style.setProperty("--magnet-slot-h",el.offsetHeight+"px");

  // Position-based closest slot: it opens automatically; all other tiles
  // spring away using a FLIP transform, without a layout-thrashing React
  // state update on every pointer event.
  const x=drag.x,y=drag.y;
  let closest=drag.label,best=Infinity;
  cells.current.forEach((node,label)=>{
   const cx=box.left+node.offsetLeft+node.offsetWidth/2;
   const cy=box.top+node.offsetTop+node.offsetHeight/2;
   const distance=(cx-x)**2+(cy-y)**2;
   if(distance<best){best=distance;closest=label}
  });
  const from=currentOrder.current.indexOf(drag.label);
  const to=currentOrder.current.indexOf(closest);
  if(closest!==drag.label&&from!==to){
   const next=reorder(currentOrder.current,from,to);
   beforeRects.current=measure();
   currentOrder.current=next;
   setOrder(next);
   try{if(navigator.vibrate)navigator.vibrate(6)}catch{}
  }
 };
 const requestPaint=()=>{if(frame.current===null)frame.current=requestAnimationFrame(paint)};

 const begin=(drag:DragPress)=>{
  if(pressed.current!==drag||drag.active||!expanded)return;
  drag.active=true;
  if(drag.timer!==null){clearTimeout(drag.timer);drag.timer=null}
  const grid=gridRef.current,el=cells.current.get(drag.label);
  if(!grid||!el)return;
  grid.classList.add("profileMagneticGridActive");
  el.style.zIndex="20";
  el.style.willChange="transform";
  // Pointer capture keeps the tile attached to the finger beyond its bounds.
  try{el.setPointerCapture(drag.pointerId)}catch{}
  setActiveLabel(drag.label);
  requestPaint();
  try{if(navigator.vibrate)navigator.vibrate(9)}catch{}
 };

 const finish=(cancel=false)=>{
  const drag=pressed.current;
  if(!drag)return;
  if(drag.timer!==null)clearTimeout(drag.timer);
  pressed.current=null;
  if(frame.current!==null){cancelAnimationFrame(frame.current);frame.current=null}
  if(!drag.active)return;
  const el=cells.current.get(drag.label);
  const grid=gridRef.current;
  grid?.classList.remove("profileMagneticGridActive");
  if(grid){["--magnet-slot-x","--magnet-slot-y","--magnet-slot-w","--magnet-slot-h"].forEach(x=>grid.style.removeProperty(x))}
  suppressClick.current=drag.label;
  window.setTimeout(()=>{if(suppressClick.current===drag.label)suppressClick.current=null},480);
  if(el){
   const previous=el.style.transform;
   el.style.transform="";
   el.style.zIndex="";
   el.style.willChange="";
   try{if(el.hasPointerCapture(drag.pointerId))el.releasePointerCapture(drag.pointerId)}catch{}
   if(!isReduced()&&!cancel&&previous){
    el.animate([{transform:previous,filter:"drop-shadow(0 10px 14px rgba(35,60,85,.19))"},{transform:"none",filter:"none"}],{
     duration:385,easing:"cubic-bezier(.17,.92,.25,1.14)"
    });
   }
  }
  setActiveLabel(null);
  if(cancel){
   // A cancelled browser gesture must never navigate or persist a partial drag.
   return;
  }
  remember(currentOrder.current);
 };

 useLayoutEffect(()=>{
  const prior=beforeRects.current;
  if(!prior)return;
  beforeRects.current=null;
  const reduce=isReduced();
  cells.current.forEach((el,id)=>{
   if(id===pressed.current?.label)return;
   const rect=prior.get(id),next=el.getBoundingClientRect();
   if(!rect)return;
   const dx=rect.left-next.left,dy=rect.top-next.top;
   if(reduce||Math.abs(dx)+Math.abs(dy)<1)return;
   for(const animation of el.getAnimations())animation.cancel();
   el.animate([
    {transform:`translate3d(${dx}px,${dy}px,0) scale(.975)`},
    {transform:"translate3d(0,0,0) scale(1)"}
   ],{duration:320,easing:"cubic-bezier(.18,.82,.22,1.14)"});
  });
  if(pressed.current?.active)requestPaint();
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[order]);

 useEffect(()=>{
  // Safari: cancel page scrolling only *after* deliberate drag activation.
  const stopScroll=(event:TouchEvent)=>{if(pressed.current?.active&&event.cancelable)event.preventDefault()};
  document.addEventListener("touchmove",stopScroll,{passive:false});
  const release=()=>finish(true);
  window.addEventListener("blur",release);
  return()=>{
   document.removeEventListener("touchmove",stopScroll);
   window.removeEventListener("blur",release);
   if(pressed.current?.timer!==null&&pressed.current?.timer!==undefined)clearTimeout(pressed.current.timer);
   if(frame.current!==null)cancelAnimationFrame(frame.current);
  };
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);

 const down=(event:ReactPointerEvent<HTMLDivElement>,label:string)=>{
  if(!expanded||event.button!==0||pressed.current)return;
  const box=event.currentTarget.getBoundingClientRect();
  const drag:DragPress={
   label,pointerId:event.pointerId,touch:event.pointerType!=="mouse",active:false,
   startX:event.clientX,startY:event.clientY,x:event.clientX,y:event.clientY,
   offsetX:event.clientX-box.left,offsetY:event.clientY-box.top,timer:null,dx:0,dy:0
  };
  pressed.current=drag;
  // A short hold gives iPhone users a drag affordance without hijacking
  // vertical page scrolling. Horizontal intent can engage sooner.
  if(drag.touch)drag.timer=window.setTimeout(()=>begin(drag),155);
 };
 const move=(event:ReactPointerEvent<HTMLDivElement>)=>{
  const drag=pressed.current;
  if(!drag||drag.pointerId!==event.pointerId)return;
  drag.x=event.clientX;drag.y=event.clientY;
  if(!drag.active){
   const dx=drag.x-drag.startX,dy=drag.y-drag.startY;
   if(drag.touch){
    if(Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy)*1.25)begin(drag);
    else if(Math.abs(dy)>12&&Math.abs(dy)>=Math.abs(dx)){if(drag.timer!==null)clearTimeout(drag.timer);pressed.current=null}
   }else if(Math.hypot(dx,dy)>5)begin(drag);
  }
  if(drag.active){event.preventDefault();requestPaint()}
 };
 const keyMove=(event:ReactKeyboardEvent<HTMLDivElement>,label:string)=>{
  if(!expanded||!event.shiftKey)return;
  const delta:Record<string,number>={ArrowLeft:-1,ArrowRight:1,ArrowUp:-3,ArrowDown:3};
  const step=delta[event.key];if(step===undefined)return;
  event.preventDefault();
  const from=currentOrder.current.indexOf(label);
  const to=Math.max(0,Math.min(currentOrder.current.length-1,from+step));
  if(from===to)return;
  beforeRects.current=measure();
  const next=reorder(currentOrder.current,from,to);
  currentOrder.current=next;setOrder(next);remember(next);
 };
 const byId=new Map(items.map(item=>[item.label,item]));
 return <>
  {currentOrder.current.map((id,index)=>{
   const item=byId.get(id);
   if(!item)return null;
   return <div key={id}
    ref={node=>{if(node)cells.current.set(id,node);else cells.current.delete(id)}}
    className={"profileMagneticCell"+(activeLabel===id?" profileMagneticDragging":"")}
    data-magnetic-id={id}
    style={{"--magnet-index":index} as CSSProperties}
    onPointerDown={event=>down(event,id)}
    onPointerMove={move}
    onPointerUp={()=>finish()}
    onPointerCancel={()=>finish(true)}
    onLostPointerCapture={()=>{if(pressed.current?.active)finish(true)}}
    onClickCapture={event=>{if(suppressClick.current===id){event.preventDefault();event.stopPropagation();suppressClick.current=null}}}
    onKeyDownCapture={event=>keyMove(event,id)}
    aria-label={expanded?id+" app, press and drag to rearrange; Shift and arrow keys also move it":undefined}
   >{renderTile(item)}</div>;
  })}
 </>;
}
