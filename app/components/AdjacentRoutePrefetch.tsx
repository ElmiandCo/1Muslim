"use client";
import {useEffect} from "react";
import {useRouter,usePathname} from "next/navigation";

/** Prefetch only likely next destinations after the first screen has become interactive. */
export default function AdjacentRoutePrefetch(){
 const router=useRouter();
 const pathname=usePathname();
 useEffect(()=>{
  if(pathname!=="/")return;
  let cancelled=false;
  let idleId:number|undefined;
  let timer:ReturnType<typeof setTimeout>|undefined;
  const prefetch=()=>{if(cancelled)return;router.prefetch("/elm-tent/quran");timer=setTimeout(()=>{if(!cancelled)router.prefetch("/community")},1200)};
  if("requestIdleCallback" in window)idleId=window.requestIdleCallback(prefetch,{timeout:3000});
  else timer=setTimeout(prefetch,1300);
  return()=>{cancelled=true;if(idleId!==undefined&&"cancelIdleCallback" in window)window.cancelIdleCallback(idleId);if(timer)clearTimeout(timer)};
 },[pathname,router]);
 return null;
}
