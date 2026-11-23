"use client";
import {useRef,useState,type ReactNode,type PointerEvent as ReactPointerEvent,type MouseEvent as ReactMouseEvent,type KeyboardEvent as ReactKeyboardEvent} from "react";
import "./SwipeMemberRail.css";

/** Dedicated swipe surface: horizontal gestures move cards, vertical gestures still scroll the page.
 * The main profile's global swipe handler must not eat these interactions. */
export default function SwipeMemberRail({id,children,label}:{id:string;children:ReactNode;label:string}){
 const ref=useRef<HTMLDivElement|null>(null);
 const gesture=useRef<{pointer:number;x:number;y:number;startScroll:number;active:boolean}|null>(null);
 const consumed=useRef(false);
 const [dragging,setDragging]=useState(false);
 const moveTo=(dir:number)=>{
  const el=ref.current;if(!el)return;
  const first=el.firstElementChild as HTMLElement|null;
  const width=(first?.getBoundingClientRect().width||160)+(parseFloat(getComputedStyle(el).columnGap)||12);
  const amount=Math.round(el.scrollLeft/width+dir)*width;
  el.scrollTo({left:Math.max(0,amount),behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});
 };
 const down=(e:ReactPointerEvent<HTMLDivElement>)=>{
  if(e.pointerType==="mouse"&&e.button!==0)return;
  gesture.current={pointer:e.pointerId,x:e.clientX,y:e.clientY,startScroll:e.currentTarget.scrollLeft,active:false};
 };
 const move=(e:ReactPointerEvent<HTMLDivElement>)=>{
  const g=gesture.current;if(!g||g.pointer!==e.pointerId)return;
  const deltaX=e.clientX-g.x,deltaY=e.clientY-g.y;
  if(!g.active){
   if(Math.abs(deltaX)<7||Math.abs(deltaX)<Math.abs(deltaY)*1.2)return;
   g.active=true;consumed.current=true;setDragging(true);
   try{e.currentTarget.setPointerCapture(e.pointerId)}catch{}
  }
  e.currentTarget.scrollLeft=g.startScroll-deltaX;
 };
 const finish=(e:ReactPointerEvent<HTMLDivElement>)=>{
  const g=gesture.current;if(!g||g.pointer!==e.pointerId)return;
  const wasDrag=g.active;gesture.current=null;setDragging(false);
  if(wasDrag){
   try{e.currentTarget.releasePointerCapture(e.pointerId)}catch{}
   const el=e.currentTarget;
   const first=el.firstElementChild as HTMLElement|null;
   const step=(first?.getBoundingClientRect().width||160)+(parseFloat(getComputedStyle(el).columnGap)||12);
   const startingCard=Math.round(g.startScroll/step);
   const nearestCard=Math.round(el.scrollLeft/step);
   const travel=e.clientX-g.x;
   // A short intentional flick must advance at least one card on mobile.
   const targetCard=travel < -28?Math.max(startingCard+1,nearestCard):travel>28?Math.min(startingCard-1,nearestCard):nearestCard;
   const left=Math.max(0,targetCard*step);
   el.scrollTo({left,behavior:"smooth"});
   window.setTimeout(()=>{consumed.current=false},140);
  }
 };
 const captureClick=(e:ReactMouseEvent<HTMLDivElement>)=>{
  if(consumed.current){e.preventDefault();e.stopPropagation();consumed.current=false}
 };
 const handleKeys=(e:ReactKeyboardEvent<HTMLDivElement>)=>{
  if(e.target!==e.currentTarget)return;
  if(e.key==="ArrowRight"||e.key==="ArrowLeft"){e.preventDefault();moveTo(e.key==="ArrowRight"?1:-1)}
 };
 return <div ref={ref} id={id} className={"muslimeenRailTrack swipeMemberRail"+(dragging?" isDragging":"")} aria-label={label} role="region" tabIndex={0} onPointerDown={down} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} onClickCapture={captureClick} onKeyDown={handleKeys}>{children}</div>;
}
