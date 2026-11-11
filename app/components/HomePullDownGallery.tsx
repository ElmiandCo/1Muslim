"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import QiblaIcon from "./icons/QiblaIcon";
export default function HomePullDownGallery({active}:{active:boolean}){
 const [open,setOpen]=useState(false),[collapsed,setCollapsed]=useState(true),[pulse,setPulse]=useState(false);
 const [navReady,setNavReady]=useState(false);
 const [hudHudOpen,setHudHudOpen]=useState(false);
 const [hudHudDocked,setHudHudDocked]=useState(false);
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
 useEffect(()=>{if(!active||!open){setHudHudDocked(false);return}setHudHudDocked(false);const id=window.setTimeout(()=>setHudHudDocked(true),1550);return()=>window.clearTimeout(id)},[active,open]);
 // Automatically reveal the gallery one second after the landing navigation is ready.
 // Do not interrupt someone already interacting with the page.
 useEffect(()=>{
  if(!active||!navReady)return;
  let interacted=false;
  const mark=()=>{interacted=true};
  window.addEventListener("pointerdown",mark,{once:true,passive:true});
  window.addEventListener("touchstart",mark,{once:true,passive:true});
  const timer=window.setTimeout(()=>{if(!interacted)setOpen(true)},1000);
  return()=>{window.clearTimeout(timer);window.removeEventListener("pointerdown",mark);window.removeEventListener("touchstart",mark)};
 },[active,navReady]);
 // The first non-interactive tap anywhere on the landing canvas opens Explore.
 // Wait for pointerup so a swipe or scroll never counts as a tap.
 useEffect(()=>{
  if(!active||!navReady||open)return;
  const stage=document.querySelector<HTMLElement>(".oneMuslimLiveStage");
  if(!stage)return;
  let origin:{x:number;y:number}|null=null;
  const down=(e:PointerEvent)=>{
   const target=e.target;
   if(!(target instanceof Element)||!stage.contains(target)||target.closest("button,a,input,textarea,select,[role=dialog],[contenteditable=true],.oneMuslimAppGallery")){origin=null;return}
   origin={x:e.clientX,y:e.clientY};
  };
  const up=(e:PointerEvent)=>{
   const point=origin;origin=null;
   if(!point||Math.hypot(e.clientX-point.x,e.clientY-point.y)>12)return;
   setOpen(true);flash();
  };
  document.addEventListener("pointerdown",down,true);
  document.addEventListener("pointerup",up,true);
  return()=>{document.removeEventListener("pointerdown",down,true);document.removeEventListener("pointerup",up,true)};
 },[active,navReady,open]);
 // Capture vertical gestures across the entire landing canvas, not just the video rectangle.
 useEffect(()=>{
  if(!active||!navReady)return;
  const stage=document.querySelector<HTMLElement>(".oneMuslimLiveStage");
  if(!stage)return;
  const down=(e:TouchEvent)=>{
   const t=e.touches[0],target=e.target;
   if(!t||!(target instanceof Element)||!stage.contains(target)||target.closest("button,a,input,textarea,select,[role=dialog],[contenteditable=true]")){start.current=null;return}
   start.current={x:t.clientX,y:t.clientY,target};
  };
  const up=(e:TouchEvent)=>{
   const origin=start.current;start.current=null;
   const t=e.changedTouches[0];if(!origin||!t)return;
   const dx=t.clientX-origin.x,dy=t.clientY-origin.y;
   if(Math.abs(dy)<35||Math.abs(dy)<Math.abs(dx)*1.2)return;
   if(dy<0&&!open){setOpen(true);flash()}
   else if(dy>0&&open){setOpen(false)}
  };
  document.addEventListener("touchstart",down,{capture:true,passive:true});
  document.addEventListener("touchend",up,{capture:true,passive:true});
  return()=>{document.removeEventListener("touchstart",down,true);document.removeEventListener("touchend",up,true);start.current=null};
 },[active,open,navReady]);
 if(!active)return null;
 return <><style>{`
 .oneMuslimLiveStage .oneMuslimLiveVideo{touch-action:pan-x;overscroll-behavior:contain}
 .oneMuslimLiveStage.oneMuslimAppGalleryOpen .oneMuslimAppGallery{touch-action:pan-x;overscroll-behavior:contain}
 .oneMuslimAppGalleryOpen .oneMuslimLiveVideo{flex:0 0 auto!important;height:clamp(130px,24%,210px)!important;margin-top:8px!important;transform:scale(.92);transform-origin:center top;transition:height .55s cubic-bezier(.2,.8,.2,1),transform .55s cubic-bezier(.2,.8,.2,1),margin-top .55s ease!important}
 .oneMuslimLiveStage:not(.oneMuslimAppGalleryOpen) .oneMuslimLiveVideo{transition:height .55s cubic-bezier(.2,.8,.2,1),transform .55s cubic-bezier(.2,.8,.2,1),margin-top .55s ease}
 .oneMuslimAppGalleryOpen .oneMuslimLiveBottom{opacity:0;pointer-events:none;max-height:0!important;min-height:0!important;transition:opacity .35s,max-height .4s}
 .oneMuslimAppGalleryOpen .oneMuslimHomeWheelSlot{opacity:0;pointer-events:none}
 .oneMuslimAppGalleryOpen .oneMuslimAppGallery{padding-top:clamp(175px,25vh,270px)}
 .oneMuslimAppGalleryGrid{position:relative;isolation:isolate}
 .oneMuslimAppGalleryTile{position:relative;--launch-x:0px;--launch-y:110px;--launch-delay:0ms;opacity:0;transform:translate(var(--launch-x),var(--launch-y)) scale(.18);transition:transform 950ms cubic-bezier(.18,1.35,.32,1),opacity 280ms ease;transition-delay:0ms}
 .oneMuslimAppGalleryOpen .oneMuslimAppGalleryTile{opacity:1;transform:translate(0,0) scale(1);transition-delay:var(--launch-delay)}
 .oneMuslimAppGalleryTile:nth-child(1){--launch-x:110px;--launch-y:190px;--launch-delay:70ms}
 .oneMuslimAppGalleryTile:nth-child(2){--launch-x:0px;--launch-y:190px;--launch-delay:130ms}
 .oneMuslimAppGalleryTile:nth-child(3){--launch-x:-110px;--launch-y:190px;--launch-delay:190ms}
 .oneMuslimAppGalleryTile:nth-child(4){--launch-x:110px;--launch-y:65px;--launch-delay:230ms}
 .oneMuslimAppGalleryTile:nth-child(5){--launch-x:0px;--launch-y:65px;--launch-delay:0ms}
 .oneMuslimAppGalleryTile:nth-child(6){--launch-x:-110px;--launch-y:65px;--launch-delay:270ms}
 .oneMuslimAppGalleryIcon{border-radius:50%!important;position:relative;overflow:hidden;background:radial-gradient(circle at 32% 18%,#3e658b88,#101b30 60%,#070d19)!important;box-shadow:inset 0 2px 12px #b6e9ff40,0 0 0 1px #8bc9ff5a,0 0 18px #389fff3a!important}
 .oneMuslimAppGalleryTile:focus-visible{outline:2px solid #94d6ff;outline-offset:5px;border-radius:16px}
 .oneMuslimAppGalleryTile:nth-child(6) .oneMuslimAppGalleryIcon svg{transition:opacity .28s}
 .oneMuslimAppGalleryTile:nth-child(6).hudhudDocked .oneMuslimAppGalleryIcon svg{opacity:0}
 .hudhudProfileBird{position:absolute;width:78%;height:78%;object-fit:contain;opacity:0;transform:scale(.7);transition:opacity .22s,transform .35s;pointer-events:none;filter:drop-shadow(0 0 10px #7ad9ff66)}
 .hudhudDocked .hudhudProfileBird{opacity:1;transform:scale(1)}
 .hudhudLaunchBird{position:absolute;z-index:10;left:50%;bottom:-90px;width:clamp(52px,15vw,85px);aspect-ratio:1;object-fit:contain;pointer-events:none;filter:drop-shadow(0 0 14px #72d7ff);opacity:0;transform:translate(-50%,0) scale(.6)}
 .oneMuslimAppGalleryOpen .hudhudLaunchBird{animation:hudhudProfileFlight 1500ms cubic-bezier(.16,.8,.2,1) both}
 @keyframes hudhudProfileFlight{0%{opacity:0;transform:translate(-50%,0) scale(.6)}12%{opacity:1}75%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + min(32vw,195px)),calc(-100% - 115px)) scale(.9)}}
 .oneMuslimAppGallery{position:absolute;inset:0;z-index:240;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:22px;padding:clamp(135px,17vh,190px) 18px 30px;box-sizing:border-box;overflow:auto;border-radius:0;background:transparent;backdrop-filter:none;opacity:0;transform:translateY(90px) scale(.9) perspective(600px) rotateX(9deg);pointer-events:none;transition:opacity .48s,transform .6s cubic-bezier(.18,.8,.2,1)}
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
 @media(prefers-reduced-motion:reduce){.hudhudLaunchBird{display:none!important}.oneMuslimAppGalleryTile{opacity:1!important;transform:none!important;transition:none!important}.hudhudProfileBird{opacity:1!important;transform:none!important}.oneMuslimAppGallery,.oneMuslimLiveVideo,.oneMuslimCarouselCenterControl,.oneMuslimExplorePrompt,.oneMuslimExplorePrompt .phrase,.oneMuslimExploreParticles i{transition:none!important;animation:none!important}}
 `}</style>
 <button className={"oneMuslimExplorePrompt"+(showExplore?" visible":"")} type="button" aria-label="Explore 1Muslim apps" aria-hidden={!showExplore} tabIndex={showExplore?0:-1} onClick={()=>{setOpen(true);flash()}}><span className="oneMuslimExploreParticles" aria-hidden="true">{Array.from({length:13},(_,i)=><i key={i} style={{"--x":`${(i*37)%100}%`,"--y":`${(i*23)%100}%`,"--d":`${2.6+i*.23}s`} as React.CSSProperties}/>)}</span><span key={slide} className={"phrase"+(slides[slide]==="Live Stream"?" livePhrase":"")}>{slides[slide%slides.length]}</span></button>
 {navReady&&collapsed&&<button className={"oneMuslimCarouselCenterControl"+(pulse?" pulse":"")} type="button" aria-label="Expand carousel" onClick={()=>{window.dispatchEvent(new Event("oneMuslimRequestCarouselExpand"));flash()}}>● ● ●</button>}
 <section className="oneMuslimAppGallery" aria-label="1Muslim app gallery" aria-hidden={!open} onClick={e=>{if(open&&!(e.target as HTMLElement).closest(".oneMuslimAppGalleryGrid"))setOpen(false)}}><strong style={{color:"#e8e4f2",fontSize:14}}>Explore 1Muslim</strong><div className="oneMuslimAppGalleryGrid"><img className="hudhudLaunchBird" src="/assets/hudhud-logo.PNG" alt="" aria-hidden="true"/>
 <Link className="oneMuslimAppGalleryTile" href="/deepwatch" tabIndex={open?0:-1}><span className="oneMuslimAppGalleryIcon"><img src="/assets/deepwatch-icon-2.PNG" alt="" onError={e=>{e.currentTarget.style.display="none";e.currentTarget.parentElement?.insertAdjacentText("beforeend","▶")}}/></span><span>DeepWatch</span></Link>
 <Link className="oneMuslimAppGalleryTile" href="/qibla/newsroom" tabIndex={open?0:-1}><span className="oneMuslimAppGalleryIcon"><QiblaIcon/></span><span>Qibla</span></Link>
 <button type="button" className="oneMuslimAppGalleryTile" tabIndex={open?0:-1} onClick={()=>{window.location.assign("/quran-library")}}><span className="oneMuslimAppGalleryIcon"><svg viewBox="0 0 100 100" fill="none" aria-hidden="true"><defs><linearGradient id="quranBook" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff3b5"/><stop offset="1" stopColor="#91e9f7"/></linearGradient></defs><path d="M50 25C37 17 23 19 12 24v52c15-6 27-4 38 3 11-7 23-9 38-3V24c-11-5-25-7-38 1Z" stroke="url(#quranBook)" strokeWidth="4" strokeLinejoin="round"/><path d="M50 25v54M19 34c10-3 18-2 25 2M19 43c10-3 18-2 25 2M56 36c7-4 15-5 25-2M56 45c7-4 15-5 25-2" stroke="#d9f8ff" strokeWidth="2.5" strokeLinecap="round"/><path d="m50 36 4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1Z" fill="#ffe6a4" stroke="#fff" strokeWidth="1.5"/></svg></span><span>Qur’an</span></button>
 <button type="button" className="oneMuslimAppGalleryTile" tabIndex={open?0:-1} onClick={()=>navigateWorkspace(0)}><span className="oneMuslimAppGalleryIcon"><svg viewBox="0 0 100 100" fill="none" aria-hidden="true"><defs><linearGradient id="liveLens" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#d0fff9"/><stop offset="1" stopColor="#5bd0f4"/></linearGradient></defs><rect x="17" y="30" width="52" height="42" rx="11" stroke="url(#liveLens)" strokeWidth="4"/><path d="m69 43 17-10v36L69 59" stroke="#b7fff0" strokeWidth="4" strokeLinejoin="round"/><circle cx="43" cy="51" r="12" stroke="#eaffff" strokeWidth="3"/><circle cx="43" cy="51" r="5" fill="#eaffff"/><path d="M20 20h16M64 20h16" stroke="#8af8e5" strokeWidth="3" strokeLinecap="round"/><circle cx="78" cy="20" r="5" fill="#ff7d90"/></svg></span><span>Live</span></button>
 <button type="button" className="oneMuslimAppGalleryTile" tabIndex={open?0:-1} onClick={()=>navigateWorkspace(0)}><span className="oneMuslimAppGalleryIcon"><svg viewBox="0 0 100 100" fill="none" aria-hidden="true"><defs><linearGradient id="homeRoof" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f9f4ff"/><stop offset="1" stopColor="#b8c8ff"/></linearGradient></defs><path d="m14 48 36-30 36 30v34H14V48Z" stroke="url(#homeRoof)" strokeWidth="4" strokeLinejoin="round"/><path d="m24 47 26-21 26 21" stroke="#dce7ff" strokeWidth="3" strokeLinecap="round"/><path d="M41 82V59a9 9 0 0 1 18 0v23" stroke="#c9d9ff" strokeWidth="3"/><path d="M24 59h10v11H24zM66 59h10v11H66z" fill="#b6cfff"/><path d="M50 9v8" stroke="#f7d7ff" strokeWidth="3" strokeLinecap="round"/></svg></span><span>Home</span></button>
 <button type="button" className={"oneMuslimAppGalleryTile"+(hudHudDocked?" hudhudDocked":"")} tabIndex={open?0:-1} onClick={()=>window.location.assign("/profile")}><span className="oneMuslimAppGalleryIcon"><svg viewBox="0 0 100 100" fill="none" aria-hidden="true"><defs><linearGradient id="profileGlow" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f4d9ff"/><stop offset="1" stopColor="#c3baff"/></linearGradient></defs><circle cx="50" cy="50" r="39" stroke="url(#profileGlow)" strokeWidth="3"/><circle cx="50" cy="39" r="14" stroke="#f9edff" strokeWidth="4"/><path d="M25 76c3-15 13-22 25-22s22 7 25 22" stroke="#e3d2ff" strokeWidth="4" strokeLinecap="round"/><path d="m18 22 4-4m60 4-4-4" stroke="#e3d2ff" strokeWidth="3" strokeLinecap="round"/><circle cx="50" cy="50" r="45" stroke="#d4c4ff" strokeOpacity=".25" strokeWidth="2" strokeDasharray="3 7"/></svg><img className="hudhudProfileBird" src="/assets/hudhud-logo.PNG" alt=""/></span><span>Profile</span></button></div></section>
 </>;
}