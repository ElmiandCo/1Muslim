"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
export default function HomePullDownGallery({active}:{active:boolean}){
 const [open,setOpen]=useState(false),[collapsed,setCollapsed]=useState(true),[pulse,setPulse]=useState(false);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const start=useRef<{x:number;y:number;target:Element}|null>(null);
 const flash=()=>{setPulse(true);if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>setPulse(false),2000)};
 useEffect(()=>{if(!active)setOpen(false)},[active]);
 useEffect(()=>{const onState=(e:Event)=>setCollapsed(!(e as CustomEvent<{expanded:boolean}>).detail?.expanded);window.addEventListener("oneMuslimHomeCarouselExpanded",onState);return()=>window.removeEventListener("oneMuslimHomeCarouselExpanded",onState)},[]);
 useEffect(()=>{if(!active||!collapsed)return;const stage=document.querySelector<HTMLElement>(".oneMuslimLiveStage");if(!stage)return;const onPointer=()=>flash();const onVideo=()=>flash();stage.addEventListener("pointerdown",onPointer);window.addEventListener("elmi-home-video-time",onVideo);return()=>{stage.removeEventListener("pointerdown",onPointer);window.removeEventListener("elmi-home-video-time",onVideo)}},[active,collapsed]);
 useEffect(()=>{const stage=document.querySelector<HTMLElement>(".oneMuslimLiveStage");if(!stage)return;stage.classList.toggle("oneMuslimAppGalleryOpen",active&&open);return()=>stage.classList.remove("oneMuslimAppGalleryOpen")},[active,open]);
 useEffect(()=>{if(!active)return;const stage=document.querySelector<HTMLElement>(".oneMuslimLiveStage");if(!stage)return;
 const down=(e:TouchEvent)=>{const t=e.touches[0],target=e.target as Element;if(!t||!target||target.closest("button,a,input,textarea,select,[role=dialog]"))return;start.current={x:t.clientX,y:t.clientY,target}};
 const move=(e:TouchEvent)=>{const s=start.current,t=e.touches[0];if(!s||!t||!e.cancelable)return;const dy=t.clientY-s.y,dx=t.clientX-s.x;const eligible=open?!!s.target.closest(".oneMuslimAppGallery,.oneMuslimLiveVideo"):!!s.target.closest(".oneMuslimLiveVideo");if(eligible&&Math.abs(dy)>12&&Math.abs(dy)>Math.abs(dx)*1.25&&dy<0)e.preventDefault()};
 const up=(e:TouchEvent)=>{const s=start.current;start.current=null;const t=e.changedTouches[0];if(!s||!t)return;const dx=t.clientX-s.x,dy=t.clientY-s.y;if(Math.abs(dy)<75||Math.abs(dy)<Math.abs(dx)*1.4)return;if(dy<0&&(!open?s.target.closest(".oneMuslimLiveVideo"):s.target.closest(".oneMuslimAppGallery,.oneMuslimLiveVideo"))){setOpen(v=>!v);flash()}};
 stage.addEventListener("touchstart",down,{passive:true});stage.addEventListener("touchmove",move,{passive:false});stage.addEventListener("touchend",up,{passive:true});return()=>{stage.removeEventListener("touchstart",down);stage.removeEventListener("touchmove",move);stage.removeEventListener("touchend",up)}},[active,open]);
 if(!active)return null;
 return <><style>{`
 .oneMuslimLiveStage .oneMuslimLiveVideo{touch-action:pan-x;overscroll-behavior:contain}
 .oneMuslimLiveStage.oneMuslimAppGalleryOpen .oneMuslimAppGallery{touch-action:pan-x;overscroll-behavior:contain}
 .oneMuslimAppGalleryOpen .oneMuslimLiveVideo{flex:0 0 auto!important;height:clamp(130px,24%,210px)!important;margin-top:8px!important;transform:scale(.92);transform-origin:center top;transition:height .55s cubic-bezier(.2,.8,.2,1),transform .55s cubic-bezier(.2,.8,.2,1),margin-top .55s ease!important}
 .oneMuslimLiveStage:not(.oneMuslimAppGalleryOpen) .oneMuslimLiveVideo{transition:height .55s cubic-bezier(.2,.8,.2,1),transform .55s cubic-bezier(.2,.8,.2,1),margin-top .55s ease}
 .oneMuslimAppGalleryOpen .oneMuslimLiveBottom{opacity:0;pointer-events:none;max-height:0!important;min-height:0!important;transition:opacity .35s,max-height .4s}
 .oneMuslimAppGalleryOpen .oneMuslimHomeWheelSlot{opacity:0;pointer-events:none}
 .oneMuslimAppGallery{position:absolute;inset:0;z-index:100;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:22px;padding:clamp(90px,18vh,180px) 18px 30px;box-sizing:border-box;overflow:auto;border-radius:0;background:transparent;backdrop-filter:none;opacity:0;transform:translateY(90px) scale(.9) perspective(600px) rotateX(9deg);pointer-events:none;transition:opacity .48s,transform .6s cubic-bezier(.18,.8,.2,1)}
 .oneMuslimAppGalleryOpen .oneMuslimAppGallery{opacity:1;transform:translateY(0) scale(1) perspective(600px) rotateX(0);pointer-events:auto}
 .oneMuslimAppGalleryOpen .oneMuslimLiveBottom{visibility:hidden}
 .oneMuslimAppGalleryGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(12px,4vw,36px);width:100%;max-width:580px}
 .oneMuslimAppGalleryTile{display:flex;flex-direction:column;align-items:center;gap:10px;color:white;text-decoration:none;text-align:center;font-size:clamp(11px,2.6vw,15px);font-weight:600}
 .oneMuslimAppGalleryIcon{width:100%;max-width:145px;aspect-ratio:1;border-radius:23%;display:grid;place-items:center;font-size:clamp(30px,9vw,65px);border:1px solid #ffffff44;box-shadow:0 16px 28px #0007,inset 0 1px 2px #fff4;transition:transform .22s}.oneMuslimAppGalleryTile:active .oneMuslimAppGalleryIcon{transform:scale(.9)}
 .oneMuslimAppGalleryTile:nth-child(1) .oneMuslimAppGalleryIcon{background:linear-gradient(140deg,#102b48,#3a276d)}.oneMuslimAppGalleryTile:nth-child(2) .oneMuslimAppGalleryIcon{background:linear-gradient(140deg,#b55d96,#4e368d)}.oneMuslimAppGalleryTile:nth-child(3) .oneMuslimAppGalleryIcon{background:linear-gradient(140deg,#1e6c87,#223d81)}
 .oneMuslimCarouselCenterControl{position:absolute;z-index:120;top:9px;left:50%;transform:translateX(-50%);border:1px solid rgba(205,174,255,.4);border-radius:13px;background:rgba(15,12,25,.48);color:#e4d5ff;padding:5px 14px;letter-spacing:3px;min-width:55px;min-height:33px;transition:box-shadow .25s,opacity .55s;opacity:.55}
 .oneMuslimCarouselCenterControl.pulse{opacity:1;box-shadow:0 0 13px #b88aff,0 0 26px #9452ff80;animation:oneMuslimCarouselPulse 2s ease-out}
 @keyframes oneMuslimCarouselPulse{0%{box-shadow:0 0 18px #c9a5ff}100%{box-shadow:0 0 0 transparent}}
 @media(prefers-reduced-motion:reduce){.oneMuslimAppGallery,.oneMuslimLiveVideo,.oneMuslimCarouselCenterControl{transition:none!important;animation:none!important}}
 `}</style>
 {collapsed&&<button className={"oneMuslimCarouselCenterControl"+(pulse?" pulse":"")} type="button" aria-label="Expand carousel" onClick={()=>{window.dispatchEvent(new Event("oneMuslimRequestCarouselExpand"));flash()}}>● ● ●</button>}
 <section className="oneMuslimAppGallery" aria-label="1Muslim app gallery" aria-hidden={!open}><strong style={{color:"#e8e4f2",fontSize:14}}>Explore 1Muslim</strong><div className="oneMuslimAppGalleryGrid"><Link className="oneMuslimAppGalleryTile" href="/deepwatch" tabIndex={open?0:-1}><span className="oneMuslimAppGalleryIcon">▶</span><span>DeepWatch</span></Link><Link className="oneMuslimAppGalleryTile" href="/qibla" tabIndex={open?0:-1}><span className="oneMuslimAppGalleryIcon">◈</span><span>Qibla</span></Link><Link className="oneMuslimAppGalleryTile" href="/quran" tabIndex={open?0:-1}><span className="oneMuslimAppGalleryIcon">۞</span><span>Quran Connect</span></Link></div><button type="button" onClick={()=>setOpen(false)} style={{border:"1px solid #ffffff55",background:"#ffffff15",color:"white",padding:"10px 22px",borderRadius:30}}>↑ Return to video</button></section>
 </>;
}