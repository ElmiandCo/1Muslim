"use client";
import {usePathname} from "next/navigation";
import {useEffect,useState} from "react";

/** Lightweight shared up/down affordance. Never intercepts content gestures. */
export default function SiteVerticalChevron(){
 const pathname=usePathname();
 const [lower,setLower]=useState(false);
 useEffect(()=>{setLower(false)},[pathname]);
 const toggle=()=>{
  if(pathname==="/"){
   window.dispatchEvent(new CustomEvent("1muslim:vertical-panel-toggle"));
   setLower(v=>!v);
   return;
  }
  const next=!lower;
  const target=next?Math.max(window.innerHeight*.82,window.scrollY+window.innerHeight*.82):0;
  window.scrollTo({top:target,behavior:"smooth"});
  setLower(next);
 };
 return <button type="button" className="siteVerticalChevron" aria-label={lower?"Show upper section":"Show lower section"} title={lower?"Go up":"Go down"} onClick={toggle}>
 <span aria-hidden="true" style={{display:"inline-block",transform:lower?"rotate(180deg)":"none",transition:"transform .25s ease"}}>⌄</span>
 <style jsx>{`
 .siteVerticalChevron{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 14px);transform:translateX(-50%);z-index:95;display:grid;place-items:center;width:38px;height:31px;border-radius:20px;border:1px solid rgba(235,224,193,.38);background:rgba(8,34,33,.25);color:#f4e9cc;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 4px 16px rgba(0,0,0,.12);font-size:27px;line-height:1;cursor:pointer;touch-action:manipulation}
 .siteVerticalChevron:focus-visible{outline:2px solid #f1d99e;outline-offset:3px}
 @media(min-width:900px){.siteVerticalChevron{bottom:20px}}
 @media(prefers-reduced-motion:reduce){.siteVerticalChevron span{transition:none!important}}
 `}</style>
 </button>;
}
