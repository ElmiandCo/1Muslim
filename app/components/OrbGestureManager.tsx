"use client";
import {useEffect,useState} from "react";
import Link from "next/link";

export const ORB_PREF_KEY="1muslim:orb-visibility-v1";
export const ORB_ITEMS=[
 {id:"light",label:"Day / Night orb",selector:".canvas-orb-floating-dock"},
 {id:"settings",label:"Settings orb",selector:".canvas-language-globe"},
 {id:"quran-back",label:"Qur’an previous-verse orb",selector:'[class*="quranHudHudPositionToggle"]'},
 {id:"quran-hudhud",label:"Qur’an HudHud orb",selector:'[data-orb-id="quran-hudhud"]'}
] as const;
type Notice={id:string;label:string;edge:"left"|"right"|"top"|"bottom";token:number};
const readPrefs=():Record<string,boolean>=>{try{return JSON.parse(localStorage.getItem(ORB_PREF_KEY)||"{}")}catch{return {}}};
export default function OrbGestureManager(){
 const [notice,setNotice]=useState<Notice|null>(null);
 useEffect(()=>{
  let current: {el:HTMLElement;id:string;pointer:number;x:number;y:number;left:number;top:number;start:number;lastX:number;lastY:number;lastT:number;moved:boolean}|null=null;
  const key=(id:string)=>"1muslim:orb-position:"+id;
  const targets=()=>ORB_ITEMS.flatMap(item=>Array.from(document.querySelectorAll<HTMLElement>(item.selector)).map(el=>({el,...item})));
  const refresh=()=>{
   const prefs=readPrefs();
   for(const {el,id} of targets()){
    el.dataset.orbGesture=id;
    el.classList.toggle("orb-gesture-hidden",prefs[id]===false);
    if(el.dataset.orbGestureReady==="1")continue;
    el.dataset.orbGestureReady="1";
    try{const p=JSON.parse(localStorage.getItem(key(id))||"null");if(p&&Number.isFinite(p.left)&&Number.isFinite(p.top)){el.style.setProperty("left",Math.max(8,Math.min(innerWidth-48,p.left))+"px","important");el.style.setProperty("top",Math.max(8,Math.min(innerHeight-48,p.top))+"px","important");el.classList.add("orb-gesture-positioned")}}catch{}
   }
  };
  refresh();
  const observer=new MutationObserver(refresh);observer.observe(document.body,{childList:true,subtree:true});
  const down=(e:PointerEvent)=>{
   if(e.button!==0)return;
   const el=(e.target as Element)?.closest<HTMLElement>("[data-orb-gesture]");
   if(!el||el.classList.contains("orb-gesture-hidden"))return;
   if((e.target as Element).closest("input,textarea,[role=menu]"))return;
   const rect=el.getBoundingClientRect();
   current={el,id:el.dataset.orbGesture!,pointer:e.pointerId,x:e.clientX,y:e.clientY,left:rect.left,top:rect.top,start:performance.now(),lastX:e.clientX,lastY:e.clientY,lastT:performance.now(),moved:false};
  };
  const move=(e:PointerEvent)=>{
   if(!current||current.pointer!==e.pointerId)return;
   const dx=e.clientX-current.x,dy=e.clientY-current.y;
   if(Math.hypot(dx,dy)>9)current.moved=true;
   if(!current.moved)return;
   e.preventDefault();
   const left=Math.max(0,Math.min(innerWidth-current.el.offsetWidth,current.left+dx));
   const top=Math.max(0,Math.min(innerHeight-current.el.offsetHeight,current.top+dy));
   current.el.classList.add("orb-gesture-positioned","orb-gesture-dragging");
   current.el.style.setProperty("left",left+"px","important");current.el.style.setProperty("top",top+"px","important");
   current.lastX=e.clientX;current.lastY=e.clientY;current.lastT=performance.now();
  };
  const up=(e:PointerEvent)=>{
   if(!current||current.pointer!==e.pointerId)return;
   const d=current;current=null;
   if(!d.moved)return;
   d.el.classList.remove("orb-gesture-dragging");
   const rect=d.el.getBoundingClientRect(),now=performance.now();
   const distance=Math.hypot(e.clientX-d.x,e.clientY-d.y);
   const speed=distance/Math.max(1,now-d.start);
   const corners=[{x:0,y:0},{x:innerWidth,y:0},{x:0,y:innerHeight},{x:innerWidth,y:innerHeight}];
   const closeToCorner=corners.some(p=>Math.hypot(e.clientX-p.x,e.clientY-p.y)<Math.min(145,innerWidth*.32));
   if(speed>.7&&distance>75&&closeToCorner){
    const edge:"left"|"right"|"top"|"bottom"=e.clientX<innerWidth*.35?"left":e.clientX>innerWidth*.65?"right":e.clientY<innerHeight*.5?"top":"bottom";
    const prefs=readPrefs();prefs[d.id]=false;localStorage.setItem(ORB_PREF_KEY,JSON.stringify(prefs));
    d.el.classList.add("orb-gesture-hidden");setNotice({id:d.id,label:ORB_ITEMS.find(i=>i.id===d.id)?.label||"Orb",edge,token:Date.now()});
    window.dispatchEvent(new Event("1muslim:orb-visibility-updated"));
   }else localStorage.setItem(key(d.id),JSON.stringify({left:rect.left,top:rect.top}));
   // A drag must not trigger the orb's underlying click action.
   const suppress=(click:MouseEvent)=>{click.preventDefault();click.stopImmediatePropagation();document.removeEventListener("click",suppress,true)};
   document.addEventListener("click",suppress,true);setTimeout(()=>document.removeEventListener("click",suppress,true),250);
  };
  const restore=()=>{refresh()};
  document.addEventListener("pointerdown",down,true);document.addEventListener("pointermove",move,{capture:true,passive:false});document.addEventListener("pointerup",up,true);document.addEventListener("pointercancel",up,true);
  window.addEventListener("1muslim:orb-visibility-updated",restore);
  return()=>{observer.disconnect();document.removeEventListener("pointerdown",down,true);document.removeEventListener("pointermove",move,true);document.removeEventListener("pointerup",up,true);document.removeEventListener("pointercancel",up,true);window.removeEventListener("1muslim:orb-visibility-updated",restore)};
 },[]);
 useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(null),4800);return()=>clearTimeout(t)},[notice]);
 const bringBack=()=>{if(!notice)return;const prefs=readPrefs();prefs[notice.id]=true;localStorage.setItem(ORB_PREF_KEY,JSON.stringify(prefs));window.dispatchEvent(new Event("1muslim:orb-visibility-updated"));setNotice(null)};
 return notice?<div key={notice.token} className={"orb-recovery-toast orb-recovery-"+notice.edge} role="status"><strong>{notice.label} hidden</strong><span>Restore anytime in <Link href="/settings">Settings → Orb visibility</Link>.</span><button type="button" onClick={bringBack}>Bring it back</button></div>:null;
}
