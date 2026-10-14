"use client";
import {useEffect,useRef,useState,type ReactNode} from "react";
import {usePathname} from "next/navigation";
import "./hudhud-motion-shell.css";

/** Shared, opt-in page motion framework. Never alters page scroll ownership. */
const supported=["/community","/profile","/streaming","/videos"];
export default function HudHudMotionShell({children}:{children:ReactNode}){
 const pathname=usePathname()||"/";
 const eligible=supported.includes(pathname);
 const [collapsed,setCollapsed]=useState(false);
 const [moving,setMoving]=useState(false);
 const collapsedRef=useRef(false);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{
  if(!eligible)return;
  const toggle=()=>{
   collapsedRef.current=!collapsedRef.current;
   const next=collapsedRef.current;
   setCollapsed(next);setMoving(true);
   window.dispatchEvent(new CustomEvent("1muslim:hudhud-nav-state",{detail:{collapsed:next}}));
   if(timer.current)clearTimeout(timer.current);
   timer.current=setTimeout(()=>setMoving(false),2000);
  };
  window.addEventListener("1muslim:hudhud-nav-toggle",toggle);
  return()=>{window.removeEventListener("1muslim:hudhud-nav-toggle",toggle);if(timer.current)clearTimeout(timer.current)};
 },[eligible,pathname]);
 if(!eligible)return <>{children}</>;
 return <div className={"hh-motion-shell "+(collapsed?"hh-shell-collapsed ":"hh-shell-expanded ")+(moving?"hh-shell-moving":"")} data-hudhud-motion="2.0">{children}</div>;
}
