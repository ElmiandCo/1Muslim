"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import QiblaIcon from "./icons/QiblaIcon";
export default function HomePullDownGallery({active}:{active:boolean}){
 const [open,setOpen]=useState(false),[collapsed,setCollapsed]=useState(true),[pulse,setPulse]=useState(false);
 const [navReady,setNavReady]=useState(false);
 const [hudHudOpen,setHudHudOpen]=useState(false);
 const [slide,setSlide]=useState(0);
 const [videoCount,setVideoCount]=useState<number|null>(null);
 const navigateWorkspace=(page:number)=>{setOpen(false);window.dispatchEvent(new CustomEvent("1muslim:gallery-navigate-workspace",{detail:{page}}))};
 const phrases=["Explore More","1Muslim","Movies","News","Live Stream","Messenger","Games","Qur’an","Connect","And More"];
 useEffect(()=>{if(!active)return;const sync=()=>{const expanded=!!document.querySelector('[data-hudhud-expanded="true"],[data-hudhud-open="true"],.hudhud-expanded,.hudhud-open');setHudHudOpen(expanded)};sync();const observer=new MutationObserver(sync);observer.observe(document.body,{attributes:true,subtree:true,attributeFilter:["class","data-hudhud-expanded","data-hudhud-open"]});return()=>observer.disconnect()},[active]);
 useEffect(()=>{if(!active)return;let live=true;const update=async()=>{const base=process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;if(!base||!anon)return;try{const res=await fetch(`${base}/rest/v1/islamic_video_registry?select=video_id&status=eq.approved&limit=10000`,{headers:{apikey:anon,Authorization:`Bearer ${anon}`},cache:"no-store"});if(!res.ok)return;const data=await res.json();if(live&&Array.isArray(data))setVideoCount(new Set(data.map((v:{video_id:string})=>v.video_id)).size)}catch{}};update();const interval=window.setInterval(update,30000);return()=>{live=false;clearInterval(interval)}},[active]);
 const showExplore=false; // Temporarily hide Explore More; swipe-up still opens the gallery.
 const slides=videoCount===null?[...phrases,"DeepWatch","Swipe Up For Menu ↑"]:[...phrases,videoCount.toLocaleString(),"Muslim Videos","DeepWatch","Swipe Up For Menu ↑"];
 useEffect(()=>{if(!showExplore)return;const interval=window.setInterval(()=>setSlide(v=>(v+1)%slides.length),1800);return()=>clearInterval(interval)},[showExplore,slides.length]);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const start=useRef<{x:number;y:number;target:Element}|null>(null);
 const flash=()=>{setPulse(true);if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>setPulse(false),2000)};
 useEffect(()=>{if(!active){setOpen(false);setNavReady(false);return}setNavReady(false);const timer=window.setTimeout(()=>setNavReady(true),3600);const onReady=()=>{window.clearTimeout(timer);setNavReady(true)};window.addEventListener("oneMuslimTopNavAnimationComplete",onReady);return()=>{window.clearTimeout(timer);window.removeEventListener("oneMuslimTopNavAnimationComplete",onReady)}},[active]);
 useEffect(()=>{const onState=(e:Event)=>setCollapsed(!(e as CustomEvent<{expanded:boolean}>).detail?.expanded);window.addEventListener("oneMuslimHomeCarouselExpanded",onState);return()=>window.removeEventListener("oneMuslimHomeCarouselExpanded",onState)},[]);
 useEffect(()=>{if(!active||!collapsed||!navReady)return;const stage=document.querySelector<HTMLElement>(".oneMuslimLiveStage");if(!stage)return;const onPointer=()=>flash();const onVideo=()=>flash();stage.addEventListener("pointerdown",onPointer);window.addEventListener("elmi-home-video-time",onVideo);return()=>{stage.removeEventListener("pointerdown",onPointer);window.removeEventListener("elmi-home-video-time",onVideo)}},[active,collapsed,navReady]);
 useEffect(()=>{const stage=document.querySelector<HTMLElement>(".oneMuslimLiveStage");if(!stage)return;stage.classList.toggle("oneMuslimAppGalleryOpen",active&&open&&navReady);return()=>stage.classList.remove("oneMuslimAppGalleryOpen")},[active,open,navReady]);
 useEffect(()=>{if(!active||!navReady)return;const stage=document.querySelector<HTMLElement>(".oneMuslimLiveStage");if(!stage)return;
 const down=(e:TouchEvent)=>{const t=e.touches[0],target=e.target as Element;if(!t||!target||target.closest("button,a,input,textarea,select,[role=dialog]"))return;start.current={x:t.clientX,y:t.clientY,target}};
 const move=(e:TouchEvent)=>{const s=start.current,t=e.touches[0];if(!s||!t||!e.cancelable)return;const dy=t.clientY-s.y,dx=t.clientX-s.x;const eligible=open?!!s.target.closest(".oneMuslimAppGallery,.oneMuslimLiveVideo"):!!s.target.closest(".oneMuslimLiveVideo");if(eligible&&Math.abs(dy)>12&&Math.abs(dy)>Math.abs(dx)*1.2&&((!open&&dy<0)||(open&&dy>0)))e.preventDefault()};
 const up=(e:TouchEvent)=>{const s=start.current;start.current=null;const t=e.changedTouches[0];if(!s||!t)return;const dx=t.clientX-s.x,dy=t.clientY-s.y;if(Math.abs(dy)<35||Math.abs(dy)<Math.abs(dx)*1.2)return;if(dy<0&&!open&&s.target.closest(".oneMuslimLiveVideo")){setOpen(true);flash()}else if(dy>0&&open&&s.target.closest(".oneMuslimAppGallery,.oneMuslimLiveVideo")){setOpen(false)}};
 stage.addEventListener("touchstart",down,{passive:true});stage.addEventListener("touchmove",move,{passive:false});stage.addEventListener("touchend",up,{passive:true});return()=>{stage.removeEventListener("touchstart",down);stage.removeEventListener("touchmove",move);stage.removeEventListener("touchend",up)}},[active,open,navReady]);
 if(!active)return null;
 return <><style>{`
 .oneMuslimLiveStage .oneMuslimLiveVideo{touch-action:pan-x;overscroll-behavior:contain}
 .oneMuslimLiveStage.oneMuslimAppGalleryOpen .oneMuslimAppGallery{touch-action:pan-x;overscroll-behavior:contain}
 .oneMuslimAppGalleryOpen .oneMuslimLiveVideo{flex:0 0 auto!important;height:clamp(130px,24%,210px)!important;margin-top:8px!important;transform:scale(.92);transform-origin:center top;transition:height .55s cubic-bezier(.2,.8,.2,1),transform .55s cubic-bezier(.2,.8,.2,1),margin-top .55s ease!important}
 .oneMuslimLiveStage:not(.oneMuslimAppGalleryOpen) .oneMuslimLiveVideo{transition:height .55s cubic-bezier(.2,.8,.2,1),transform .55s cubic-bezier(.2,.8,.2,1),margin-top .55s ease}
 .oneMuslimAppGalleryOpen .oneMuslimLiveBottom{opacity:0;pointer-events:none;max-height:0!important;min-height:0!important;transition:opacity .35s,max-height .4s}
 .oneMuslimAppGalleryOpen .oneMuslimHomeWheelSlot{opacity:0;pointer-events:none}
 .oneMuslimAppGallery{position:absolute;inset:0;z-index:240;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:22px;padding:clamp(30px,7vh,75px) 18px 30px;box-sizing:border-box;overflow:auto;border-radius:0;background:transparent;backdrop-filter:none;opacity:0;transform:translateY(90px) scale(.9) perspective(600px) rotateX(9deg);pointer-events:none;transition:opacity .48s,transform .6s cubic-bezier(.18,.8,.2,1)}
 .oneMuslimAppGalleryOpen .oneMuslimAppGallery{opacity:1;transform:translateY(0) scale(1) perspective(600px) rotateX(0);pointer-events:auto}
 .oneMuslimAppGalleryOpen .oneMuslimLiveBottom{visibility:hidden}
 .oneMuslimAppGalleryGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(12px,4vw,36px);width:100%;max-width:580px}
 .oneMuslimAppGalleryTile{display:flex;flex-direction:column;align-items:center;gap:10px;color:white;text-decoration:none;text-align:center;font-size:clamp(11px,2.6vw,15px);font-weight:600}
 .oneMuslimAppGalleryIcon{width:100%;max-width:145px;aspect-ratio:1;border-radius:23%;display:grid;place-items:center;font-size:clamp(30px,9vw,65px);border:1px solid #ffffff44;box-shadow:0 16px 28px #0007,inset 0 1px 2px #fff4;transition:transform .22s}.oneMuslimAppGalleryTile:active .oneMuslimAppGalleryIcon{transform:scale(.9)}
 .oneMuslimAppGalleryIcon img{width:85%;height:85%;object-fit:contain;display:block}
 .oneMuslimAppGalleryIcon svg{width:54%;height:54%}
 .oneMuslimAppGalleryTile:nth-child(4) .oneMuslimAppGalleryIcon{background:linear-gradient(140deg,#155847,#164e68)}
 .oneMuslimAppGalleryTile:nth-child(5) .oneMuslimAppGalleryIcon{background:linear-gradient(140deg,#282d51,#111c31)}
 .oneMuslimAppGalleryTile:nth-child(6) .oneMuslimAppGalleryIcon{background:linear-gradient(140deg,#594477,#232a49)}
 .oneMuslimAppGalleryTile:nth-child(1) .oneMuslimAppGalleryIcon{background:linear-gradient(140deg,#102b48,#3a276d)}.oneMuslimAppGalleryTile:nth-child(2) .oneMuslimAppGalleryIcon{background:linear-gradient(140deg,#b55d96,#4e368d)}.oneMuslimAppGalleryTile:nth-child(3) .oneMuslimAppGalleryIcon{background:linear-gradient(140deg,#1e6c87,#223d81)}
 .oneMuslimExplorePrompt{position:absolute;z-index:244;top:54%;left:50%;width:min(74vw,310px);min-height:46px;transform:translateX(-50%);border:0;border-radius:0;background:transparent;color:#f3f4f7;box-shadow:none;backdrop-filter:none;display:grid;place-items:center;overflow:visible;cursor:pointer;opacity:0;pointer-events:none;transition:opacity .65s ease,transform .65s ease}
 .oneMuslimExplorePrompt.visible{opacity:1;pointer-events:auto}
 .oneMuslimExplorePrompt .phrase{position:relative;z-index:2;grid-area:1/1;font-size:clamp(12px,3vw,16px);font-weight:600;letter-spacing:.12em;text-shadow:0 2px 15px #000a;animation:oneMuslimExplorePhrase 2.8s ease-in-out both}
 .oneMuslimExplorePrompt .livePhrase{color:#ff4545}
 .oneMuslimExploreParticles{position:absolute;inset:-65px -35px;z-index:0;pointer-events:none;overflow:hidden}
 .oneMuslimExploreParticles i{position:absolute;left:var(--x);top:var(--y);width:3px;height:3px;border-radius:50%;background:#e7eaf2;opacity:.32;box-shadow:0 0 9px #fff8;animation:oneMuslimParticleDrift var(--d) ease-in-out infinite alternate}
 @keyframes oneMuslimExplorePhrase{0%{opacity:0;transform:translateY(5px)}18%,79%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-5px)}}
 @keyframes oneMuslimParticleDrift{from{transform:translate3d(0,6px,0)}to{transform:translate3d(5px,-9px,0)}}
 .oneMuslimCarouselCenterControl{position:absolute;z-index:245;top:34px;left:50%;transform:translateX(-50%);border:1px solid rgba(205,174,255,.4);border-radius:6px;background:rgba(15,12,25,.48);color:#e4d5ff;padding:2px 5px;letter-spacing:1px;font-size:7px;line-height:1;min-width:22px;min-height:13px;transition:box-shadow .25s,opacity .55s;opacity:.55}
 .oneMuslimExplorePrompt:not(.visible){visibility:hidden;transition:opacity .65s ease,visibility 0s linear .65s}
 .oneMuslimCarouselCenterControl.pulse{opacity:1;box-shadow:0 0 13px #b88aff,0 0 26px #9452ff80;animation:oneMuslimCarouselPulse 2s ease-out}
 @keyframes oneMuslimCarouselPulse{0%{box-shadow:0 0 18px #c9a5ff}100%{box-shadow:0 0 0 transparent}}
 @media(prefers-reduced-motion:reduce){.oneMuslimAppGallery,.oneMuslimLiveVideo,.oneMuslimCarouselCenterControl,.oneMuslimExplorePrompt,.oneMuslimExplorePrompt .phrase,.oneMuslimExploreParticles i{transition:none!important;animation:none!important}}
 `}</style>
 <button className={"oneMuslimExplorePrompt"+(showExplore?" visible":"")} type="button" aria-label="Explore 1Muslim apps" aria-hidden={!showExplore} tabIndex={showExplore?0:-1} onClick={()=>{setOpen(true);flash()}}><span className="oneMuslimExploreParticles" aria-hidden="true">{Array.from({length:13},(_,i)=><i key={i} style={{"--x":`${(i*37)%100}%`,"--y":`${(i*23)%100}%`,"--d":`${2.6+i*.23}s`} as React.CSSProperties}/>)}</span><span key={slide} className={"phrase"+(slides[slide]==="Live Stream"?" livePhrase":"")}>{slides[slide%slides.length]}</span></button>
 {navReady&&collapsed&&<button className={"oneMuslimCarouselCenterControl"+(pulse?" pulse":"")} type="button" aria-label="Expand carousel" onClick={()=>{window.dispatchEvent(new Event("oneMuslimRequestCarouselExpand"));flash()}}>● ● ●</button>}
 <section className="oneMuslimAppGallery" aria-label="1Muslim app gallery" aria-hidden={!open} onClick={e=>{if(open&&!(e.target as HTMLElement).closest(".oneMuslimAppGalleryGrid"))setOpen(false)}}><strong style={{color:"#e8e4f2",fontSize:14}}>Explore 1Muslim</strong><div className="oneMuslimAppGalleryGrid">
 <Link className="oneMuslimAppGalleryTile" href="/deepwatch" tabIndex={open?0:-1}><span className="oneMuslimAppGalleryIcon"><img src="/assets/deepwatch-icon-2.PNG" alt="" onError={e=>{e.currentTarget.style.display="none";e.currentTarget.parentElement?.insertAdjacentText("beforeend","▶")}}/></span><span>DeepWatch</span></Link>
 <Link className="oneMuslimAppGalleryTile" href="/qibla/newsroom" tabIndex={open?0:-1}><span className="oneMuslimAppGalleryIcon"><QiblaIcon/></span><span>Qibla</span></Link>
 <button type="button" className="oneMuslimAppGalleryTile" tabIndex={open?0:-1} onClick={()=>{window.location.assign("/quran-library")}}><span className="oneMuslimAppGalleryIcon">۞</span><span>Qur’an</span></button>
 <button type="button" className="oneMuslimAppGalleryTile" tabIndex={open?0:-1} onClick={()=>navigateWorkspace(0)}><span className="oneMuslimAppGalleryIcon">◉</span><span>Live</span></button>
 <button type="button" className="oneMuslimAppGalleryTile" tabIndex={open?0:-1} onClick={()=>navigateWorkspace(0)}><span className="oneMuslimAppGalleryIcon">⌂</span><span>Home</span></button>
 <button type="button" className="oneMuslimAppGalleryTile" tabIndex={open?0:-1} onClick={()=>navigateWorkspace(6)}><span className="oneMuslimAppGalleryIcon">◉</span><span>Profile</span></button></div></section>
 </>;
}