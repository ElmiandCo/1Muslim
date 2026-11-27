"use client";
import {usePathname} from "next/navigation";
import {useEffect} from "react";

/* One site-wide browser chrome color for Safari/PWA-capable browsers.
 * Pages own their internal styling; this syncs the document's background,
 * safe-area canvas and meta theme-color without overwriting route layouts.
 * The native iOS status bar and Safari toolbars remain under browser control.
 */
type RouteAppearance={route:string;night:boolean};
const EVENT="1muslim:route-appearance";
const LIGHT="#ffffff",DARK="#090c0b";

function savedAppearance(deviceDark:boolean){
 try{
  const mode=localStorage.getItem("1muslim-theme-mode");
  if(mode==="day")return false;
  if(mode==="night")return true;
  if(mode==="auto")return deviceDark;
  const fallback=localStorage.getItem("1muslim-theme");
  if(fallback==="light")return false;
  if(fallback==="dark")return true;
 }catch{}
 // A first-time visitor sees the white One Muslim home, not a dark wrapper.
 return false;
}
function requestedAppearance(path:string,deviceDark:boolean){
 if(path.startsWith("/search")){
  // Home is white, even when the Search Results tab was last left in night mode.
  const url=new URLSearchParams(window.location.search);
  const onResults=Boolean(url.get("q")?.trim());
  if(!onResults)return false;
  try{return localStorage.getItem("1muslim:search-results-theme")!=="day"}catch{return true}
 }
 if(path.startsWith("/deepwatch")){
  try{
   const mode=localStorage.getItem("1muslim:deepwatch:theme-mode");
   if(mode==="day")return false;
   if(mode==="night")return true;
  }catch{}
 }
 return savedAppearance(deviceDark);
}

export default function SiteChromeTheme(){
 const pathname=usePathname()||"/";
 useEffect(()=>{
  const query=window.matchMedia("(prefers-color-scheme: dark)");
  let override:boolean|null=null;
  const paint=()=>{
   const night=override??requestedAppearance(pathname,query.matches);
   const root=document.documentElement;
   root.dataset.oneChrome=night?"night":"day";
   root.style.colorScheme=night?"dark":"light";
   // Theme-color is a hint to supported browser/PWA chrome, not a way to
   // restyle iOS Safari's own toolbar or the phone's system status bar.
   let tags=Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'));
   if(!tags.length){
    const tag=document.createElement("meta");
    tag.name="theme-color";document.head.appendChild(tag);tags=[tag];
   }
   for(const tag of tags)tag.content=night?DARK:LIGHT;
  };
  const onRoute=(event:Event)=>{
   const detail=(event as CustomEvent<RouteAppearance>).detail;
   if(detail?.route===pathname&&typeof detail.night==="boolean"){
    override=detail.night;paint();
   }
  };
  const onPreference=()=>{override=null;paint()};
  const onStorage=(event:StorageEvent)=>{
   if(!event.key||/^(1muslim-theme-mode|1muslim-theme|1muslim:deepwatch:theme-mode|1muslim:search-results-theme)$/.test(event.key))
    onPreference();
  };
  paint();
  window.addEventListener(EVENT,onRoute);
  window.addEventListener("1muslim:appearance-updated",onPreference);
  window.addEventListener("1muslim:theme-changed",onPreference);
  window.addEventListener("1muslim:deepwatch-theme-updated",onPreference);
  window.addEventListener("storage",onStorage);
  window.addEventListener("popstate",onPreference);
  window.addEventListener("pageshow",onPreference);
  query.addEventListener("change",onPreference);
  return()=>{
   window.removeEventListener(EVENT,onRoute);
   window.removeEventListener("1muslim:appearance-updated",onPreference);
   window.removeEventListener("1muslim:theme-changed",onPreference);
   window.removeEventListener("1muslim:deepwatch-theme-updated",onPreference);
   window.removeEventListener("storage",onStorage);
   window.removeEventListener("popstate",onPreference);
   window.removeEventListener("pageshow",onPreference);
   query.removeEventListener("change",onPreference);
  };
 },[pathname]);
 return null;
}
