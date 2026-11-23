"use client";
import {useEffect} from "react";
import {usePathname} from "next/navigation";

/** Single white, atomic reveal boundary shared by every route.
 * Hides the retired loading shells, navigation and HUD overlays until content is usable.
 */
export default function AppShellLifecycle(){
 const pathname=usePathname()||"/";
 useEffect(()=>{
  let active=true;
  const root=document.documentElement;
  let revealTimer:ReturnType<typeof setTimeout>|null=null;
  let timeout:ReturnType<typeof setTimeout>|null=null;
  let frame=0;
  root.dataset.oneShellReady="false";
  const reveal=()=>{
   if(!active||revealTimer)return;
   revealTimer=window.setTimeout(()=>{if(active)root.dataset.oneShellReady="true"},pathname==="/profile"?230:110);
  };
  const onReady=()=>reveal();
  window.addEventListener("1muslim:profile-ready",onReady);
  if(pathname==="/profile"){
   // Keep a solid white surface during a cold auth/profile fetch.
   const check=()=>{if(document.querySelector(".profileCommandPage, .profileEmpty.isError"))reveal()};
   frame=requestAnimationFrame(check);
   const observer=new MutationObserver(check);
   observer.observe(document.body,{childList:true,subtree:true});
   timeout=window.setTimeout(()=>{observer.disconnect();reveal()},12500);
   return()=>{active=false;window.removeEventListener("1muslim:profile-ready",onReady);observer.disconnect();if(frame)cancelAnimationFrame(frame);if(timeout)clearTimeout(timeout);if(revealTimer)clearTimeout(revealTimer)};
  }
  frame=requestAnimationFrame(()=>{frame=requestAnimationFrame(reveal)});
  return()=>{active=false;window.removeEventListener("1muslim:profile-ready",onReady);if(frame)cancelAnimationFrame(frame);if(timeout)clearTimeout(timeout);if(revealTimer)clearTimeout(revealTimer)};
 },[pathname]);
 useEffect(()=>{
  // Some older clients rendered escaped line breaks as stray text nodes.
  // Only remove an entire orphan node consisting of literal \\n / \\r escapes.
  const clean=()=>{
   const visit=(node:Node,depth:number)=>{
    for(const child of Array.from(node.childNodes)){
     if(child.nodeType===Node.TEXT_NODE&&/^(?:\\[nr]\s*)+$/.test((child.textContent||"").trim())){child.parentNode?.removeChild(child);continue}
     if(depth<2&&child.nodeType===Node.ELEMENT_NODE&&!(child as Element).matches("script,style,textarea,pre,code"))visit(child,depth+1);
    }
   };
   visit(document.body,0);
  };
  clean();
  const observer=new MutationObserver(clean);
  observer.observe(document.body,{childList:true});
  return()=>observer.disconnect();
 },[]);
 return null;
}
