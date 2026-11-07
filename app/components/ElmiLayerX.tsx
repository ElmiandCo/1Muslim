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
 const start=useRef<{x:number;y:number;at:number;id:number}|null>(null);
 const suppressed=useRef(false);
 const activeRef=useRef(false);
 const positioned=useRef(false);
 const [videoMode,setVideoMode]=useState(false);
 const [softDim,setSoftDim]=useState(false);
 const settleTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{activeRef.current=active},[active]);
 useEffect(()=>{
  const syncTheme=()=>{const root=document.documentElement;setDay(root.classList.contains("light")||root.dataset.themeMode==="day"||localStorage.getItem("1muslim-theme")==="light")};
  syncTheme();const observer=new MutationObserver(syncTheme);observer.observe(document.documentElement,{attributes:true,attributeFilter:["class","data-theme-mode"]});
  window.addEventListener("storage",syncTheme);
  return()=>{observer.disconnect();window.removeEventListener("storage",syncTheme)};
 },[]);
 useEffect(()=>{setActive(false);setExpanded(false);setQuran(false);setVideoMode(false);suppressed.current=false;positioned.current=false;setSoftDim(false);if(settleTimer.current)clearTimeout(settleTimer.current)},[pathname]);
 useEffect(()=>{
  const onVideo=(e:Event)=>{const d=(e as CustomEvent<{active?:boolean}>).detail;if(typeof d?.active!=="boolean")return;setQuran(false);setVideoMode(d.active&&!suppressed.current);if(!d.active){positioned.current=false;suppressed.current=false}setActive(d.active&&!suppressed.current);if(!d.active)setExpanded(false)};
  const onQuran=(e:Event)=>{const d=(e as CustomEvent<{playing?:boolean;target?:DOMRect}>).detail;if(typeof d?.playing!=="boolean")return;setQuran(d.playing&&!suppressed.current);setVideoMode(false);if(!d.playing)suppressed.current=false;setActive(d.playing&&!suppressed.current);if(!d.playing)setExpanded(false);if(d.playing&&d.target){const r=d.target;setFocus({x:clamp((r.left+r.width/2)/innerWidth*100,5,95),y:clamp((r.top+r.height/2)/innerHeight*100,5,95),rx:clamp(r.width/innerWidth*50+5,15,48),ry:clamp(r.height/innerHeight*50+5,8,45)})}};
  const onVideoBounds=(e:Event)=>{if(!activeRef.current)return;const d=(e as CustomEvent<{x:number;y:number;rx:number;ry:number}>).detail;if(!d)return;setFocus(f=>({...f,x:positioned.current?f.x:clamp(d.x/innerWidth*100,5,95),y:positioned.current?f.y:clamp(d.y/innerHeight*100,5,95),rx:clamp(d.rx/innerWidth*100,15,48),ry:clamp(d.ry/innerHeight*100,8,45)}))};
  const exit=()=>{if(settleTimer.current)clearTimeout(settleTimer.current);setSoftDim(false);suppressed.current=true;setActive(false);setExpanded(false);setQuran(false);setVideoMode(false)};
  const onHudHudTap=()=>{if(!activeRef.current)return;setExpanded(v=>{if(v){queueMicrotask(exit);return false}return true})};
  const onHudHudMove=(e:Event)=>{if(!activeRef.current)return;const d=(e as CustomEvent<{x:number;y:number}>).detail;if(!d)return;if(settleTimer.current)clearTimeout(settleTimer.current);setSoftDim(false);positioned.current=true;setFocus(f=>({...f,x:clamp(d.x/innerWidth*100,5,95),y:clamp(d.y/innerHeight*100,5,95)}))};
  const onReleased=()=>{if(!activeRef.current)return;positioned.current=true;if(settleTimer.current)clearTimeout(settleTimer.current);settleTimer.current=setTimeout(()=>{if(activeRef.current)setSoftDim(true)},2000)};
  window.addEventListener("1muslim:deep-watch-hudhud-released",onReleased);
  window.addEventListener("1muslim:deep-watch-video-bounds",onVideoBounds);window.addEventListener("1muslim:deep-watch-video",onVideo);window.addEventListener("1muslim:deep-watch-quran",onQuran);
  window.addEventListener("1muslim:deep-watch-exit",exit);window.addEventListener("1muslim:deep-watch-hudhud-tap",onHudHudTap);window.addEventListener("1muslim:deep-watch-hudhud-move",onHudHudMove);
  return()=>{if(settleTimer.current)clearTimeout(settleTimer.current);window.removeEventListener("1muslim:deep-watch-hudhud-released",onReleased);window.removeEventListener("1muslim:deep-watch-video-bounds",onVideoBounds);window.removeEventListener("1muslim:deep-watch-video",onVideo);window.removeEventListener("1muslim:deep-watch-quran",onQuran);window.removeEventListener("1muslim:deep-watch-exit",exit);window.removeEventListener("1muslim:deep-watch-hudhud-tap",onHudHudTap);window.removeEventListener("1muslim:deep-watch-hudhud-move",onHudHudMove)};
 },[]);
 useEffect(()=>{
  if(!active)return;
  // Observe only deliberate gestures on inert, non-scrollable backdrop.
  // Never preventDefault, capture pointers, or interfere with native page navigation.
  const blocked="button,a,input,textarea,select,[contenteditable],[role=button],[role=slider],[data-no-deep-watch],.hh-chat-orb,.oneMuslimIdleYoutubePlayer,.quranFloat";
  const down=(e:PointerEvent)=>{
   start.current=null;
   if(!e.isPrimary||e.button!==0)return;
   const el=e.target;
   if(!(el instanceof Element)||el.closest(blocked))return;
   if(el.closest('[data-widget],[data-workspace-page],[class*="quranVerseArticle"],[class*="Comments"],[class*="chat"],[class*="carousel"]'))return;
   for(let node:Element|null=el;node&&node!==document.body;node=node.parentElement){
    const css=getComputedStyle(node);
    if(/auto|scroll/.test(css.overflowY+css.overflowX)&&(node.scrollHeight>node.clientHeight+2||node.scrollWidth>node.clientWidth+2))return;
   }
   start.current={x:e.clientX,y:e.clientY,at:performance.now(),id:e.pointerId};
  };
  const cancel=()=>{start.current=null};
  const up=(e:PointerEvent)=>{
   const s=start.current;start.current=null;
   if(!s||s.id!==e.pointerId)return;
   const dx=e.clientX-s.x,dy=e.clientY-s.y,elapsed=performance.now()-s.at;
   if(elapsed<140||elapsed>1100||Math.abs(dy)<65||Math.abs(dy)<Math.abs(dx)*1.7)return;
   positioned.current=true;
   setFocus(f=>({...f,y:dy<0?(f.y>60?50:25):(f.y<40?50:75)}));
  };
  document.addEventListener("pointerdown",down,{capture:true,passive:true});
  document.addEventListener("pointerup",up,{capture:true,passive:true});
  document.addEventListener("pointercancel",cancel,{capture:true,passive:true});
  window.addEventListener("blur",cancel);
  return()=>{
   document.removeEventListener("pointerdown",down,true);
   document.removeEventListener("pointerup",up,true);
   document.removeEventListener("pointercancel",cancel,true);
   window.removeEventListener("blur",cancel);
  };
 },[active]);
 const video=videoMode&&!quran;
 return <div data-elmi-layer="X" aria-hidden="true" className={"elmi-layer-x"+(active?" active":"")+(video?" video":"")} style={{"--x":focus.x+"%","--y":focus.y+"%","--rx":(expanded?Math.min(65,focus.rx*1.25):focus.rx)+"vw","--ry":(expanded?Math.min(55,focus.ry*1.75):focus.ry)+"vh","--mask":day?`rgba(255,255,255,${softDim?.5:.8})`:`rgba(0,0,0,${softDim?.5:.8})`} as React.CSSProperties}><style>{`
 @property --rx{syntax:"<length>";inherits:false;initial-value:38vw}\n @property --ry{syntax:"<length>";inherits:false;initial-value:20vh}\n @property --x{syntax:"<percentage>";inherits:false;initial-value:50%}\n @property --y{syntax:"<percentage>";inherits:false;initial-value:65%}\n .elmi-layer-x{position:fixed;inset:0;z-index:9998;pointer-events:none;opacity:0;transition:opacity .65s ease,background-color .8s ease,--rx .8s cubic-bezier(.22,1,.36,1),--ry .8s cubic-bezier(.22,1,.36,1),--x .45s ease-out,--y .45s ease-out; background:var(--mask);mask-image:radial-gradient(ellipse var(--rx) var(--ry) at var(--x) var(--y),transparent 0%,transparent 65%,#000 100%);-webkit-mask-image:radial-gradient(ellipse var(--rx) var(--ry) at var(--x) var(--y),transparent 0%,transparent 65%,#000 100%)}
 .elmi-layer-x.active{opacity:1}
 .elmi-layer-x.video{display:block} body:has(.elmi-layer-x.video.active) .oneMuslimCinemaDimmer{opacity:0!important}
 @media(prefers-reduced-motion:reduce){.elmi-layer-x{transition:none}}
 `}</style></div>;
}
