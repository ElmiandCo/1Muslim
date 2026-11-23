"use client";
import {useEffect,useRef,useState} from "react";
import {usePathname} from "next/navigation";
import QuranAscensionLight from "./QuranAscensionLight";

/** Elmi Layer X: spotlight only. Y stays with the player; Z stays with comments. */
type Focus={x:number;y:number;rx:number;ry:number};
const clamp=(n:number,a:number,b:number)=>Math.min(b,Math.max(a,n));
export default function ElmiLayerX(){
 const pathname=usePathname();
 const [active,setActive]=useState(false);
 const [expanded,setExpanded]=useState(false);
 const [focus,setFocus]=useState<Focus>({x:50,y:65,rx:38,ry:20});

 const [quran,setQuran]=useState(false);
 const start=useRef<{x:number;y:number;at:number;id:number}|null>(null);
 const suppressed=useRef(false);
 const activeRef=useRef(false);
 const pathnameRef=useRef(pathname);
 useEffect(()=>{pathnameRef.current=pathname},[pathname]);
 const positioned=useRef(false);
 const [videoMode,setVideoMode]=useState(false);
 const [softDim,setSoftDim]=useState(false);
 const settleTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{activeRef.current=active},[active]);
 useEffect(()=>{setActive(false);setExpanded(false);setQuran(false);setVideoMode(false);suppressed.current=false;positioned.current=false;setSoftDim(false);if(settleTimer.current)clearTimeout(settleTimer.current)},[pathname]);
 useEffect(()=>{
  const onVideo=()=>{}; // Video playback no longer activates DeepWatch.
  const onQuran=(e:Event)=>{const d=(e as CustomEvent<{playing?:boolean;target?:DOMRect}>).detail;if(typeof d?.playing!=="boolean")return;setQuran(d.playing);setVideoMode(false);if(!d.playing)suppressed.current=false;setActive(d.playing);if(!d.playing)setExpanded(false);if(d.playing&&d.target){const r=d.target;setFocus({x:clamp((r.left+r.width/2)/innerWidth*100,5,95),y:clamp((r.top+r.height/2)/innerHeight*100,5,95),rx:clamp(r.width/innerWidth*50+5,15,48),ry:clamp(r.height/innerHeight*50+5,8,45)})}};
  const onVideoBounds=(e:Event)=>{if(!activeRef.current||pathnameRef.current!=="/")return;const d=(e as CustomEvent<{x:number;y:number;rx:number;ry:number}>).detail;if(!d)return;setFocus(f=>({...f,x:positioned.current?f.x:clamp(d.x/innerWidth*100,5,95),y:positioned.current?f.y:clamp(d.y/innerHeight*100,5,95),rx:clamp(d.rx/innerWidth*100,15,48),ry:clamp(d.ry/innerHeight*100,8,45)}))};
  const exit=()=>{if(settleTimer.current)clearTimeout(settleTimer.current);setSoftDim(false);suppressed.current=true;setActive(false);setExpanded(false);setQuran(false);setVideoMode(false)};
  const onHudHudTap=()=>{if(!activeRef.current)return;setExpanded(v=>{if(v){queueMicrotask(exit);return false}return true})};
  const onHudHudMove=(e:Event)=>{if(!activeRef.current)return;const d=(e as CustomEvent<{x:number;y:number}>).detail;if(!d)return;if(settleTimer.current)clearTimeout(settleTimer.current);setSoftDim(false);positioned.current=true;setFocus(f=>({...f,x:clamp(d.x/innerWidth*100,5,95),y:clamp(d.y/innerHeight*100,5,95)}))};
  const onSettled=()=>{if(!activeRef.current)return;if(settleTimer.current)clearTimeout(settleTimer.current);settleTimer.current=setTimeout(()=>{if(activeRef.current)setSoftDim(true)},2000)};

  window.addEventListener("1muslim:deep-watch-video-bounds",onVideoBounds);window.addEventListener("1muslim:deep-watch-video",onVideo);window.addEventListener("1muslim:deep-watch-quran",onQuran);
  window.addEventListener("1muslim:deep-watch-exit",exit);
  return()=>{if(settleTimer.current)clearTimeout(settleTimer.current);window.removeEventListener("1muslim:deep-watch-video-bounds",onVideoBounds);window.removeEventListener("1muslim:deep-watch-video",onVideo);window.removeEventListener("1muslim:deep-watch-quran",onQuran);window.removeEventListener("1muslim:deep-watch-exit",exit);window.removeEventListener("1muslim:deep-watch-hudhud-tap",onHudHudTap);window.removeEventListener("1muslim:deep-watch-hudhud-move",onHudHudMove)};
 },[]);
 useEffect(()=>{
  if(!active)return;
  // Capture any first touch without blocking playback, scrolling or controls.
  const wake=()=>{suppressed.current=true;setActive(false);setVideoMode(false);};
  document.addEventListener("pointerdown",wake,{capture:true,passive:true,once:true});
  document.addEventListener("touchstart",wake,{capture:true,passive:true,once:true});
  return()=>{document.removeEventListener("pointerdown",wake,true);document.removeEventListener("touchstart",wake,true)};
 },[active]);
 const video=videoMode&&!quran;
 return <><QuranAscensionLight/><div data-elmi-layer="X" aria-hidden="true" className={"elmi-layer-x"+(false?" active":"")+(video?" video":"")} style={{"--x":focus.x+"%","--y":focus.y+"%","--rx":(expanded?Math.min(65,focus.rx*1.25):focus.rx)+"vw","--ry":(expanded?Math.min(55,focus.ry*1.75):focus.ry)+"vh","--mask":`rgba(0,0,0,0.38)`} as React.CSSProperties}><style>{`
 @property --rx{syntax:"<length>";inherits:false;initial-value:38vw}\n @property --ry{syntax:"<length>";inherits:false;initial-value:20vh}\n @property --x{syntax:"<percentage>";inherits:false;initial-value:50%}\n @property --y{syntax:"<percentage>";inherits:false;initial-value:65%}\n .elmi-layer-x{position:fixed;inset:0;z-index:9998;pointer-events:none;opacity:0;transition:opacity .65s ease,background-color .8s ease,--rx .8s cubic-bezier(.22,1,.36,1),--ry .8s cubic-bezier(.22,1,.36,1),--x .45s ease-out,--y .45s ease-out; background:var(--mask);mask-image:radial-gradient(ellipse var(--rx) var(--ry) at var(--x) var(--y),transparent 0%,transparent 65%,#000 100%);-webkit-mask-image:radial-gradient(ellipse var(--rx) var(--ry) at var(--x) var(--y),transparent 0%,transparent 65%,#000 100%)}
 .elmi-layer-x.active{opacity:1}
 .elmi-layer-x.video{display:block} body:has(.elmi-layer-x.video.active) .oneMuslimCinemaDimmer{opacity:0!important}
 @media(prefers-reduced-motion:reduce){.elmi-layer-x{transition:none}}
 `}</style></div></>;
}
