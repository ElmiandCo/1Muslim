"use client";
import {useEffect} from "react";
import {usePathname} from "next/navigation";
import {createClient} from "../../utils/supabase/client";
export default function SitePresenceHeartbeat(){
 const pathname=usePathname();
 useEffect(()=>{
  const db=createClient();const sessionId=crypto.randomUUID();let signedIn=false;let lastInteraction=Date.now();let stopped=false;
  const activity=()=>{lastInteraction=Date.now()};
  const send=async()=>{if(stopped||!signedIn||document.visibilityState!=="visible")return;try{await fetch("/api/presence",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId,page:location.pathname,lastActive:lastInteraction}),cache:"no-store",keepalive:true})}catch{}};
  const init=async()=>{const {data:{user}}=await db.auth.getUser();signedIn=!!user;if(signedIn)void send()};
  void init();const {data:{subscription}}=db.auth.onAuthStateChange((_event,session)=>{signedIn=!!session?.user;if(signedIn)void send()});
  const timer=setInterval(()=>void send(),30000);
  for(const event of ["pointerdown","keydown","scroll","touchstart"]){window.addEventListener(event,activity,{passive:true})}
  const visible=()=>{if(document.visibilityState==="visible")void send()};
  document.addEventListener("visibilitychange",visible);
  return()=>{stopped=true;clearInterval(timer);subscription.unsubscribe();document.removeEventListener("visibilitychange",visible);for(const event of ["pointerdown","keydown","scroll","touchstart"])window.removeEventListener(event,activity)};
 },[]);
 useEffect(()=>{window.dispatchEvent(new Event("1muslim:presence-route"))},[pathname]);
 return null;
}
