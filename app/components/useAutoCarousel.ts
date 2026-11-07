"use client";
import {useEffect,useRef} from "react";
export function useAutoCarousel<T extends HTMLElement>(count:number,delay=4200){
 const ref=useRef<T|null>(null);
 useEffect(()=>{
  const el=ref.current;
  if(!el||count<2||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  let resumeAt=Date.now()+delay;
  const pause=()=>{resumeAt=Date.now()+2000};
  const advance=()=>{
   if(document.hidden||Date.now()<resumeAt||el.scrollWidth<=el.clientWidth+3)return;
   const cards=Array.from(el.children) as HTMLElement[];
   if(cards.length<2)return;
   const current=el.scrollLeft;
   const next=cards.find(card=>card.offsetLeft-cards[0].offsetLeft>current+12);
   el.scrollTo({left:next?next.offsetLeft-cards[0].offsetLeft:0,behavior:"smooth"});
  };
  const timer=window.setInterval(advance,delay);
  el.addEventListener("pointerdown",pause);el.addEventListener("wheel",pause,{passive:true});el.addEventListener("focusin",pause);
  return()=>{clearInterval(timer);el.removeEventListener("pointerdown",pause);el.removeEventListener("wheel",pause);el.removeEventListener("focusin",pause)};
 },[count,delay]);
 return ref;
}
