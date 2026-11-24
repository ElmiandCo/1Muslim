"use client";
import {useEffect} from "react";
import {usePathname} from "next/navigation";

/** Initial reveal boundary shared by every route.
 * Once revealed, route changes leave the existing shell visible while Next navigates.
 */
export default function AppShellLifecycle(){
 const pathname=usePathname()||"/";
 useEffect(()=>{
  let active=true;
  const root=document.documentElement;
  let revealTimer:number|null=null;
  let timeout:number|null=null;
  let frame=0;
  let profileObserver:MutationObserver|null=null;
  root.dataset.oneRoute=pathname==="/"?"welcome":"app";
  if(root.dataset.oneShellReady==="true")return;
  root.dataset.oneShellReady="false";
  const reveal=()=>{
   if(!active||revealTimer)return;
   profileObserver?.disconnect();
   if(timeout)clearTimeout(timeout);
   revealTimer=window.setTimeout(()=>{if(active)root.dataset.oneShellReady="true"},pathname==="/profile"?230:110);
  };
  const onReady=()=>reveal();
  window.addEventListener("1muslim:profile-ready",onReady);
  if(pathname==="/profile"){
   // Keep a solid white surface during a cold auth/profile fetch.
   const check=()=>{if(document.querySelector(".profileCommandPage, .profileEmpty.isError, .profileEmpty.isAuth"))reveal()};
   frame=requestAnimationFrame(check);
   profileObserver=new MutationObserver(check);
   profileObserver.observe(document.body,{childList:true,subtree:true});
   timeout=window.setTimeout(()=>reveal(),12500);
   return()=>{active=false;window.removeEventListener("1muslim:profile-ready",onReady);profileObserver?.disconnect();if(frame)cancelAnimationFrame(frame);if(timeout)clearTimeout(timeout);if(revealTimer)clearTimeout(revealTimer)};
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
