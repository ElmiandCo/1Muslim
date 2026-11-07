"use client";
import {useEffect,useRef,useState} from "react";
import {usePathname} from "next/navigation";

/** Elmi Layer X: spotlight only. Y stays with the player; Z stays with comments. */
type Focus={x:number;y:number;rx:number;ry:number};
const clamp=(n:number,a:number,b:number)=>Math.min(b,Math.max(a,n));
export default function ElmiLayerX(){
 const pathname=usePathname();
 const [active,setActive]=useState(false);
 const [expanded,setExpanded]=useState(false);
 const [focus,setFocus]=useState<Focus>({x:50,y:65,rx:38,ry:20});
 const [day,setDay]=useState(false);
 const [quran,setQuran]=useState(false);
 const start=useRef<{x:number;y:number;at:number}|null>(null);
 const activeRef=useRef(false);
 const positioned=useRef(false);
 useEffect(()=>{activeRef.current=active},[active]);
 useEffect(()=>{
  const syncTheme=()=>{const root=document.documentElement;setDay(root.classList.contains("light")||root.dataset.themeMode==="day"||localStorage.getItem("1muslim-theme")==="light")};
  syncTheme();const observer=new MutationObserver(syncTheme);observer.observe(document.documentElement,{attributes:true,attributeFilter:["class","data-theme-mode"]});
  window.addEventListener("storage",syncTheme);
  return()=>{observer.disconnect();window.removeEventListener("storage",syncTheme)};
 },[]);
 useEffect(()=>{setActive(false);setExpanded(false);setQuran(false)},[pathname]);
 useEffect(()=>{
  const onVideo=(e:Event)=>{const d=(e as CustomEvent<{active?:boolean}>).detail;if(typeof d?.active!=="boolean")return;setQuran(false);if(!d.active)positioned.current=false;setActive(d.active);if(!d.active)setExpanded(false)};
  const onQuran=(e:Event)=>{const d=(e as CustomEvent<{playing?:boolean;target?:DOMRect}>).detail;if(typeof d?.playing!=="boolean")return;setQuran(d.playing);setActive(d.playing);if(!d.playing)setExpanded(false);if(d.playing&&d.target){const r=d.target;setFocus({x:clamp((r.left+r.width/2)/innerWidth*100,5,95),y:clamp((r.top+r.height/2)/innerHeight*100,5,95),rx:clamp(r.width/innerWidth*50+5,15,48),ry:clamp(r.height/innerHeight*50+5,8,45)})}};
  const onVideoBounds=(e:Event)=>{if(!activeRef.current)return;const d=(e as CustomEvent<{x:number;y:number;rx:number;ry:number}>).detail;if(!d)return;setFocus(f=>({...f,x:positioned.current?f.x:clamp(d.x/innerWidth*100,5,95),y:positioned.current?f.y:clamp(d.y/innerHeight*100,5,95),rx:clamp(d.rx/innerWidth*100,15,48),ry:clamp(d.ry/innerHeight*100,8,45)}))};
  const exit=()=>{setActive(false);setExpanded(false);setQuran(false)};
  const onHudHudTap=()=>{if(!activeRef.current)return;setExpanded(v=>{if(v){queueMicrotask(exit);return false}return true})};
  const onHudHudMove=(e:Event)=>{if(!activeRef.current)return;const d=(e as CustomEvent<{x:number;y:number}>).detail;if(!d)return;positioned.current=true;setFocus(f=>({...f,x:clamp(d.x/innerWidth*100,5,95),y:clamp(d.y/innerHeight*100,5,95)}))};
  window.addEventListener("1muslim:deep-watch-video-bounds",onVideoBounds);window.addEventListener("1muslim:deep-watch-video",onVideo);window.addEventListener("1muslim:deep-watch-quran",onQuran);
  window.addEventListener("1muslim:deep-watch-exit",exit);window.addEventListener("1muslim:deep-watch-hudhud-tap",onHudHudTap);window.addEventListener("1muslim:deep-watch-hudhud-move",onHudHudMove);
  return()=>{window.removeEventListener("1muslim:deep-watch-video-bounds",onVideoBounds);window.removeEventListener("1muslim:deep-watch-video",onVideo);window.removeEventListener("1muslim:deep-watch-quran",onQuran);window.removeEventListener("1muslim:deep-watch-exit",exit);window.removeEventListener("1muslim:deep-watch-hudhud-tap",onHudHudTap);window.removeEventListener("1muslim:deep-watch-hudhud-move",onHudHudMove)};
 },[]);
 useEffect(()=>{
  if(!active)return;
  const down=(e:PointerEvent)=>{const el=e.target as Element;if(el.closest("button,a,input,textarea,[role=button],.hh-chat-orb"))return;start.current={x:e.clientX,y:e.clientY,at:performance.now()}};
  const up=(e:PointerEvent)=>{const s=start.current;start.current=null;if(!s)return;const dx=e.clientX-s.x,dy=e.clientY-s.y;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.3){window.dispatchEvent(new Event("1muslim:deep-watch-exit"));return}if(Math.abs(dy)<25||Math.abs(dy)<Math.abs(dx)*1.2||performance.now()-s.at<110)return;positioned.current=true;setFocus(f=>({...f,y:dy<0?f.y>65?50:25:f.y<40?50:72,ry:dy<0?20:20}))};
  document.addEventListener("pointerdown",down,{capture:true,passive:true});document.addEventListener("pointerup",up,{capture:true,passive:true});
  return()=>{document.removeEventListener("pointerdown",down,true);document.removeEventListener("pointerup",up,true)};
 },[active]);
 const video=!quran;
 return <div data-elmi-layer="X" aria-hidden="true" className={"elmi-layer-x"+(active?" active":"")+(video?" video":"")} style={{"--x":focus.x+"%","--y":focus.y+"%","--rx":(expanded?Math.min(65,focus.rx*1.25):focus.rx)+"vw","--ry":(expanded?Math.min(55,focus.ry*1.75):focus.ry)+"vh","--mask":day?"rgba(255,255,255,.8)":"rgba(0,0,0,.8)"} as React.CSSProperties}><style>{`
 .elmi-layer-x{position:fixed;inset:0;z-index:9998;pointer-events:none;opacity:0;transition:opacity .65s ease; background:var(--mask);mask-image:radial-gradient(ellipse var(--rx) var(--ry) at var(--x) var(--y),transparent 0%,transparent 65%,#000 100%);-webkit-mask-image:radial-gradient(ellipse var(--rx) var(--ry) at var(--x) var(--y),transparent 0%,transparent 65%,#000 100%)}
 .elmi-layer-x.active{opacity:1}
 .elmi-layer-x.video{display:block} .oneMuslimCinemaDimmer{opacity:0!important}
 @media(prefers-reduced-motion:reduce){.elmi-layer-x{transition:none}}
 `}</style></div>;
}
