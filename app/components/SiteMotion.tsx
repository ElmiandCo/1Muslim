"use client";
import {useEffect} from "react";
const CARD_SELECTORS=[
 ".lessonCard",".exploreCard",".definition",".termCard",".railCard",
 ".discoveryCard",".liveDiscoverCard",".bookTile",".personCard",
 ".findSection",".storyCard",".profileCard",".badgeCard",
 ".featureCard",".topicCard",".pathCard",".streamCard"
].join(",");
export default function SiteMotion(){
 useEffect(()=>{
  const reduce=window.matchMedia("(prefers-reduced-motion: reduce)");
  if(reduce.matches)return;
  const seen=new WeakSet<Element>();
  const apply=()=>{
   document.querySelectorAll<HTMLElement>(CARD_SELECTORS).forEach(el=>{
    if(seen.has(el)||el.closest("[data-motion-off]"))return;
    seen.add(el);el.classList.add("motion-card");
   });
  };
  apply();
  const observer=new MutationObserver(()=>apply());
  observer.observe(document.body,{childList:true,subtree:true});
  return()=>observer.disconnect();
 },[]);
 return null;
}
