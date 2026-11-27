"use client";
import {useEffect} from "react";
import {usePathname} from "next/navigation";

// Coordinate the page-edge / PWA chrome with the active One Muslim theme.
// This is not a replacement for each feature's established day/night UI.
export default function SiteChromeTheme(){
 const pathname=usePathname();
 useEffect(()=>{
  const media=window.matchMedia("(prefers-color-scheme: dark)");
  const themeKey="1muslim-theme";
  const select=()=>{
   let saved="",mode="auto",deepwatch="auto",searchResults="";
   try{
    saved=localStorage.getItem(themeKey)||"";
    mode=localStorage.getItem("1muslim-theme-mode")||"auto";
    deepwatch=localStorage.getItem("1muslim:deepwatch:theme-mode")||"auto";
    searchResults=localStorage.getItem("1muslim:search-results-theme")||"";
   }catch{}
   let night:boolean;
   if(pathname?.startsWith("/search")){
    // Search Home is always the clean white landing; results keep their own mode.
    const onResults=!!document.querySelector(".dsResultsMode");
    night=onResults?(searchResults==="night"||(!searchResults)):false;
   }else if(pathname?.startsWith("/deepwatch")){
    night=deepwatch==="night"||(deepwatch==="auto"&&media.matches);
   }else{
    night=mode==="night"||(mode==="auto"?(saved==="dark"||(!saved&&media.matches)):mode!=="day"&&saved==="dark");
   }
   const color=night?"#0d1013":"#ffffff";
   document.documentElement.dataset.oneChromeTheme=night?"night":"day";
   document.documentElement.style.backgroundColor=color;
   document.body.style.setProperty("--one-chrome-surface",color);
   const meta=document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
   meta?.setAttribute("content",color);
   const apple=document.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-status-bar-style"]');
   apple?.setAttribute("content",night?"black-translucent":"default");
  };
  const onChange=()=>window.requestAnimationFrame(select);
  select();
  const onStorage=(event:StorageEvent)=>{
   if(!event.key||/theme/.test(event.key))onChange();
  };
  media.addEventListener("change",onChange);
  window.addEventListener("1muslim:theme-changed",onChange);
  window.addEventListener("1muslim:deepwatch-theme-updated",onChange);
  window.addEventListener("popstate",onChange);
  window.addEventListener("storage",onStorage);
  // Search toggles between Home and results without a navigation event.
  // Watch only its primary main element, never the entire app DOM.
  const page=document.querySelector(".dsPage");
  const observer=page?new MutationObserver(onChange):null;
  if(page&&observer)observer.observe(page,{attributes:true,attributeFilter:["class"]});
  return()=>{
   observer?.disconnect();media.removeEventListener("change",onChange);
   window.removeEventListener("1muslim:theme-changed",onChange);
   window.removeEventListener("1muslim:deepwatch-theme-updated",onChange);
   window.removeEventListener("popstate",onChange);
   window.removeEventListener("storage",onStorage);
  };
 },[pathname]);
 return null;
}
