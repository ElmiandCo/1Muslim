"use client";
import {useEffect} from "react";

/** Restore the reading orb with a single background tap only after it is swiped away. */
export default function HudHudSwipeRestore(){
 useEffect(()=>{
  const orb=()=>document.querySelector<HTMLElement>(".omQuranPage .omQuranCenterOrb");
  let start:{x:number;y:number;id:number}|null=null;
  const interactive="button,a,input,select,textarea,[role='button'],[role='slider'],[contenteditable='true']";
  const down=(e:PointerEvent)=>{
   if(!orb()||!e.target||!(e.target instanceof Element))return;
   if(e.target.closest(".omQuranCenterOrb"))start={x:e.clientX,y:e.clientY,id:e.pointerId};
  };
  const up=(e:PointerEvent)=>{
   const el=orb();
   if(!el)return;
   if(start?.id===e.pointerId){
    const dx=e.clientX-start.x,dy=e.clientY-start.y;
    if(Math.hypot(dx,dy)>65){el.classList.add("omHudHudSwipedAway");e.preventDefault();e.stopPropagation()}
    start=null;return;
   }
   if(!el.classList.contains("omHudHudSwipedAway"))return;
   if(!(e.target instanceof Element)||e.target.closest(interactive))return;
   el.classList.remove("omHudHudSwipedAway");
  };
  const cancel=()=>{start=null};
  document.addEventListener("pointerdown",down,true);
  document.addEventListener("pointerup",up,true);
  document.addEventListener("pointercancel",cancel,true);
  return()=>{document.removeEventListener("pointerdown",down,true);document.removeEventListener("pointerup",up,true);document.removeEventListener("pointercancel",cancel,true)};
 },[]);
 return <style jsx global>{`
 .omQuranPage .omQuranCenterOrb{transition:opacity .3s ease,transform .4s cubic-bezier(.2,.8,.2,1);touch-action:none}
 .omQuranPage .omQuranCenterOrb.omHudHudSwipedAway{opacity:0!important;pointer-events:none!important;transform:translate3d(0,110vh,0) scale(.65)!important}
 @media(prefers-reduced-motion:reduce){.omQuranPage .omQuranCenterOrb{transition:none!important}}
 `}</style>;
}
