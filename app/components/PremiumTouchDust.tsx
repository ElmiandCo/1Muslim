"use client";
import {useEffect} from "react";
export default function PremiumTouchDust(){
 useEffect(()=>{
  const onTap=(e:PointerEvent)=>{
   if(e.pointerType==="mouse"&&e.button!==0)return;
   if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
   const target=e.target as Element|null;
   if(!target?.closest("button,a,[role=button],input[type=checkbox]"))return;
   if(target.closest("input[type=text],textarea,[contenteditable=true]"))return;
   const holder=document.createElement("span");holder.className="premium-touch-dust";
   holder.style.left=e.clientX+"px";holder.style.top=e.clientY+"px";
   for(let i=0;i<7;i++){
    const dot=document.createElement("i"),angle=(i*2.399963),radius=11+(i%3)*6;
    dot.style.setProperty("--dust-x",Math.cos(angle)*radius+"px");
    dot.style.setProperty("--dust-y",(Math.sin(angle)*radius-8)+"px");
    dot.style.animationDelay=i*18+"ms";holder.appendChild(dot);
   }
   document.body.appendChild(holder);setTimeout(()=>holder.remove(),950);
  };
  document.addEventListener("pointerup",onTap,{passive:true});
  return()=>document.removeEventListener("pointerup",onTap);
 },[]);
 return null;
}
