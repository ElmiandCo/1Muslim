"use client";
import {useEffect,useRef,useState,useLayoutEffect} from "react";
import {createPortal} from "react-dom";
import {videoRegistry,isKidsVideo} from "./videoRegistry";

export default function HomeVideoWheel({format="desktop"}:{format?:"desktop"|"phone"}){
 const [expanded,setExpanded]=useState(true);
 const [canExpand,setCanExpand]=useState(false);
 const firstOpen=useRef(true);
 const [exploreStage,setExploreStage]=useState<HTMLElement|null>(null);
 useEffect(()=>{if(expanded){setCanExpand(false);if(!firstOpen.current)return;firstOpen.current=false;const timer=window.setTimeout(()=>setExpanded(false),1000);return()=>clearTimeout(timer)}const timer=window.setTimeout(()=>setCanExpand(true),30000);return()=>clearTimeout(timer)},[expanded]);
 const [stageNode,setStageNode]=useState<HTMLElement|null>(null);
 useEffect(()=>{if(!stageNode)return;stageNode.classList.toggle("home-carousel-collapsed",!expanded);return()=>stageNode.classList.remove("home-carousel-collapsed")},[stageNode,expanded]);

 const [expandHintVisible,setExpandHintVisible]=useState(false);
 const expandHintTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{
  if(expanded||!canExpand||!stageNode){setExpandHintVisible(false);return;}
  const reveal=()=>{setExpandHintVisible(true);if(expandHintTimer.current)clearTimeout(expandHintTimer.current);expandHintTimer.current=setTimeout(()=>setExpandHintVisible(false),3000);};
  reveal();
  stageNode.addEventListener("pointerdown",reveal);
  return()=>{stageNode.removeEventListener("pointerdown",reveal);if(expandHintTimer.current)clearTimeout(expandHintTimer.current);};
 },[expanded,canExpand,stageNode]);
 const [position,setPosition]=useState(0);
 const [category,setCategory]=useState("All");
 const [videoSearch,setVideoSearch]=useState("");
 useEffect(()=>{const onSearch=(e:Event)=>setVideoSearch(String((e as CustomEvent<{query:string}>).detail?.query??""));window.addEventListener("oneMuslimCarouselSearch",onSearch);return()=>window.removeEventListener("oneMuslimCarouselSearch",onSearch)},[]);
 useEffect(()=>{window.dispatchEvent(new CustomEvent("oneMuslimHomeCarouselExpanded",{detail:{expanded}}));return()=>{window.dispatchEvent(new CustomEvent("oneMuslimHomeCarouselExpanded",{detail:{expanded:false}}))}},[expanded]);
 const [controlsVisible,setControlsVisible]=useState(false);
 const controlsWindow=useRef(0);
 const controlsTimers=useRef<ReturnType<typeof setTimeout>[]>([]);
 const lastGesture=useRef(0);
 const clearControlsTimers=()=>{controlsTimers.current.forEach(clearTimeout);controlsTimers.current=[]};
 const engageControls=()=>{
  const now=Date.now();
  // A burst of gestures shares its original three-second deadline.
  if(now>=controlsWindow.current){
   clearControlsTimers();
   controlsWindow.current=now+3000;
   setControlsVisible(true);
   controlsTimers.current.push(setTimeout(()=>setControlsVisible(false),3000));
  }
  lastGesture.current=now;
  const deadline=controlsWindow.current;
  controlsTimers.current.push(setTimeout(()=>{
   if(lastGesture.current!==now||Date.now()>=deadline)return;
   setControlsVisible(true);
   controlsTimers.current.push(setTimeout(()=>setControlsVisible(false),Math.min(1500,Math.max(0,deadline-Date.now()))));
  },1000));
 };
 useEffect(()=>()=>clearControlsTimers(),[]);
 const dragged=useRef(false);
 const direction=useRef(1);
 const pointer=useRef<{x:number;position:number}|null>(null);
 const paused=useRef(false);
 const resumeTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const slotRef=useRef<HTMLDivElement>(null);
 useLayoutEffect(()=>{
  const wheel=slotRef.current;
  const slot=wheel?.parentElement;
  const stage=slot?.closest(".oneMuslimLiveStage");
  const video=stage?.querySelector(".oneMuslimLiveVideo");
  const nav=stage?.querySelector(".oneMuslimLiveFormatGlassNav");
  const chat=stage?.querySelector(".oneMuslimLiveBottom");
  if(!slot||!stage||!video||!chat)return;
  setStageNode(stage as HTMLElement);
  setExploreStage(stage as HTMLElement);
  let frame=0;
  const place=()=>{
   cancelAnimationFrame(frame);
   frame=requestAnimationFrame(()=>{
    const sr=stage.getBoundingClientRect();
    const player=video.querySelector(".oneMuslimIdleYoutubePlayer, .oneMuslimFloatingPlayerRig .oneMuslimIdleYoutubePlayer") || video.firstElementChild || video;
    const vr=player.getBoundingClientRect(),cr=chat.getBoundingClientRect();
    // Carousel sits in the reserved space immediately below format navigation, above video.
    const navBottom=nav?.getBoundingClientRect().bottom??sr.top;
    const top=Math.max(0,navBottom-sr.top-2);
    const available=Math.max(0,vr.top-sr.top-top-3);
    const guestHome=document.documentElement.dataset.guestHome==="true";
    const safeHeight=expanded?Math.max(0,Math.min(guestHome?104:130,available)):0;
    slot.style.setProperty("top",top+"px","important");
    slot.style.setProperty("height",safeHeight+"px","important");
    slot.style.setProperty("visibility","visible","important");
   });
  };
  const observer=new ResizeObserver(place);
  [stage,video,chat].forEach(el=>observer.observe(el));
  window.addEventListener("resize",place);
  place();
  return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener("resize",place)};
 },[expanded]);
 const [reduce,setReduce]=useState(false);
 const positionRef=useRef(0);
 useEffect(()=>{const media=window.matchMedia("(prefers-reduced-motion: reduce)");const update=()=>setReduce(media.matches);update();media.addEventListener("change",update);return()=>media.removeEventListener("change",update)},[]);
 useEffect(()=>{if(!expanded||reduce)return;let frame=0,last=0;const tick=(time:number)=>{if(last&&!paused.current){positionRef.current+=direction.current*Math.min(time-last,50)*.00015;setPosition(positionRef.current)}last=time;frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame)},[expanded,reduce]);
 const items=videoRegistry.filter(v=>v.format===format&&(category==="All"||(category==="Kids"?isKidsVideo(v):v.category===category))&&(!videoSearch.trim()||v.title.toLowerCase().includes(videoSearch.trim().toLowerCase())));
 const count=items.length;
 const onMove=(x:number)=>{if(!pointer.current)return;const delta=(pointer.current.x-x)/145;if(Math.abs(pointer.current.x-x)>8)dragged.current=true;if(!dragged.current)return;positionRef.current=pointer.current.position+delta;setPosition(positionRef.current);if(Math.abs(delta)>.03)direction.current=delta>0?1:-1};
 const settle=()=>{pointer.current=null;if(resumeTimer.current)clearTimeout(resumeTimer.current);resumeTimer.current=setTimeout(()=>{paused.current=false;dragged.current=false},500)};
 useEffect(()=>()=>{if(resumeTimer.current)clearTimeout(resumeTimer.current)},[]);
 return <div ref={slotRef} className="homeVideoWheel" data-expanded={expanded}>
 <style>{`
 .homeCarouselExploreLabel{position:absolute;left:50%;top:calc(50% + 5px);transform:translate(-50%,-50%);z-index:38;pointer-events:none;white-space:nowrap;font:600 clamp(12px,3vw,16px) Georgia,serif;letter-spacing:.12em;text-transform:uppercase;color:#f5e9d1;text-shadow:0 2px 10px #000,0 0 14px rgba(222,204,160,.55);opacity:.9;animation:homeExploreReveal 1.2s ease-out both}.homeCarouselExploreLabel span{font-size:9px;opacity:.65}@keyframes homeExploreReveal{from{opacity:0;filter:blur(5px);transform:translate(-50%,-50%) translateY(7px)}to{opacity:.9;filter:blur(0);transform:translate(-50%,-50%)}}
 .homeVideoWheel{transition:height 550ms cubic-bezier(.2,.75,.2,1),opacity 450ms ease;position:relative;flex:0 0 auto;height:100%;min-height:0;width:100%;z-index:5;color:white;pointer-events:auto}

 .homeVideoWheel[data-expanded="false"]{pointer-events:none!important;opacity:0}
 .homeVideoWheelBody{height:0;opacity:0;overflow:hidden;pointer-events:none;transition:height .35s ease,opacity .35s ease}
 .homeVideoWheel[data-expanded="true"] .homeVideoWheelBody{height:100%;opacity:1;pointer-events:auto}
 .homeVideoWheelCategories{position:absolute;z-index:8;left:0;right:0;bottom:0;display:flex;align-items:center;gap:8px;padding:2px 8px;background:transparent;min-width:0}
 .homeVideoWheelCollapse{position:absolute;right:8px;top:3px;z-index:30;width:30px;height:30px;border:1px solid rgba(255,255,255,.45);border-radius:10px;background:rgba(0,0,0,.22);color:white;font-size:25px;line-height:1;display:grid;place-items:center;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);cursor:pointer;transition:background .3s ease,transform .3s ease}
 .homeVideoWheelCollapse:active{transform:scale(.92)}
 .homeVideoWheelControls{opacity:0;transition:opacity 450ms ease;pointer-events:none}
 .homeVideoWheelControls[data-visible="true"]{opacity:1;pointer-events:auto}
 /* The invisible close hit target remains available without displaying its icon. */
 .homeVideoWheelCollapse.homeVideoWheelControls{pointer-events:auto}
 @media(prefers-reduced-motion:reduce){.homeVideoWheelControls{transition:none}}
 .homeVideoWheelExpandHint.is-visible{animation:homeWheelHintGlow 2.2s ease-in-out infinite;box-shadow:0 0 10px rgba(205,179,255,.5),0 0 20px rgba(149,84,255,.22)}\n @keyframes homeWheelHintGlow{0%,100%{box-shadow:0 0 7px rgba(205,179,255,.28),0 0 14px rgba(149,84,255,.13)}50%{box-shadow:0 0 14px rgba(221,200,255,.68),0 0 25px rgba(149,84,255,.35)}}\n @media(prefers-reduced-motion:reduce){.homeVideoWheelExpandHint.is-visible{animation:none}}\n .homeVideoWheelKids{flex:0 0 auto;margin-left:auto}
 .homeVideoWheelCategories button{white-space:nowrap;border:0;border-radius:0;padding:2px 4px;background:transparent;color:inherit;font-size:10px;font-weight:400;text-shadow:0 1px 4px #000}
 .homeVideoWheelCategories button{transition:transform .18s ease,color .18s ease;transform-origin:center center}
 .homeVideoWheelCategories button[aria-pressed="true"]{color:var(--theme-primary,#a9e7d5);border-bottom:1px solid currentColor;transform:scale(1.05)}
 .homeVideoWheelTrack{position:relative;height:calc(100% - 20px);overflow:hidden;touch-action:none;overscroll-behavior:contain;user-select:none;cursor:grab}
 .homeVideoWheelTrack:active{cursor:grabbing}
 .homeVideoWheelCard{position:absolute;top:0;left:50%;height:100%;width:clamp(140px,34%,235px);border:1px solid rgba(255,255,255,.35);border-radius:15px;box-shadow:0 12px 25px rgba(0,0,0,.25);display:flex;flex-direction:column;justify-content:end;padding:12px;box-sizing:border-box;overflow:hidden;will-change:transform,opacity;pointer-events:auto;cursor:pointer;-webkit-tap-highlight-color:transparent}
 .homeVideoWheelCard::after{content:"";position:absolute;inset:38% 0 0;background:linear-gradient(to bottom,transparent,rgba(0,0,0,.78));pointer-events:none;z-index:0}.homeVideoWheelCard img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0}.homeVideoWheelCard strong{position:relative;z-index:1;font-size:14px;line-height:1.2;text-shadow:0 1px 5px #000,0 2px 9px #000;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
 @media(max-width:767px){.homeVideoWheel[data-expanded="true"] .homeVideoWheelBody{height:100%}.homeVideoWheelCard{width:38%}}
 @media(prefers-reduced-motion:reduce){.homeVideoWheelBody{transition:none}}
 `}</style>
 
 <button type="button" className="homeVideoWheelCollapse homeVideoWheelControls" data-visible={controlsVisible} onClick={()=>setExpanded(false)} aria-label="Collapse video carousel" title="Collapse carousel">×</button>
 <div className="homeVideoWheelCategories homeVideoWheelControls" data-visible={controlsVisible} role="group" aria-label="Video categories">{(["All","Kids"] as const).map(item=><button key={item} className={item==="Kids"?"homeVideoWheelKids":undefined} type="button" aria-pressed={category===item} onClick={()=>{engageControls();setCategory(item);positionRef.current=0;setPosition(0);window.dispatchEvent(new CustomEvent("oneMuslimCarouselCategory",{detail:{category:item,format}}))}}>{item}</button>)}</div>

 <div className="homeVideoWheelBody" aria-hidden={!expanded}>
 {expanded&&<>{count===0&&<p role="status" style={{textAlign:"center",fontSize:13,padding:12}}>No videos match your search.</p>}<div className="homeVideoWheelTrack" aria-label="Choose a video to play above" onTouchStart={e=>e.stopPropagation()} onTouchMove={e=>e.stopPropagation()} onTouchEnd={e=>e.stopPropagation()} onPointerDown={e=>{engageControls();e.stopPropagation();if(resumeTimer.current)clearTimeout(resumeTimer.current);paused.current=true;dragged.current=false;pointer.current={x:e.clientX,position:positionRef.current}}} onPointerMove={e=>{e.stopPropagation();onMove(e.clientX)}} onPointerUp={e=>{engageControls();e.stopPropagation();onMove(e.clientX);settle()}} onPointerCancel={()=>{settle()}}>
 {items.map((item,i)=>{let offset=((i-position)%count+count)%count;if(offset>count/2)offset-=count;const distance=Math.abs(offset);const scale=Math.max(.24,1-.25*distance*distance);return <div key={item.videoId} className="homeVideoWheelCard" role="button" tabIndex={0} aria-label={`Play ${item.title}`} onClick={()=>{engageControls();if(dragged.current){return;}paused.current=true;if(resumeTimer.current)clearTimeout(resumeTimer.current);resumeTimer.current=setTimeout(()=>{paused.current=false},500);window.dispatchEvent(new CustomEvent("oneMuslimSelectCarouselVideo",{detail:{videoId:item.videoId,format:item.format}}))}} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();engageControls();window.dispatchEvent(new CustomEvent("oneMuslimSelectCarouselVideo",{detail:{videoId:item.videoId,format:item.format}}))}}} style={{transform:`translateX(calc(-50% + ${offset*110}%)) perspective(550px) rotateY(${-offset*13}deg) scale(${scale})`,opacity:Math.max(.12,1-distance*.28),zIndex:Math.round(20-distance),background:`linear-gradient(145deg,hsla(${190+(i%6)*27},65%,35%,.58),rgba(4,12,25,.8))`}}><img src={`https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`} alt="" loading="lazy" draggable={false} referrerPolicy="no-referrer" onError={e=>{e.currentTarget.style.display="none"}}/><strong>{item.title}</strong></div>})}
 </div></>}
 </div>{!expanded&&exploreStage&&createPortal(<div className="homeCarouselExploreLabel" aria-hidden="true">✦ Explore More <span>✦</span></div>,exploreStage)}{!expanded&&canExpand&&stageNode&&createPortal(<button type="button" onClick={()=>setExpanded(true)} aria-label="Expand video carousel" title="Show carousel" className={"homeVideoWheelExpandHint"+(expandHintVisible?" is-visible":"")} style={{position:"absolute",right:14,top:43,zIndex:40,border:"1px solid rgba(255,255,255,.32)",borderRadius:9,background:"rgba(0,0,0,.22)",color:"#fff",fontSize:12,width:27,height:27,padding:0,display:"grid",placeItems:"center",backdropFilter:"blur(5px)",cursor:"pointer",opacity:expandHintVisible?1:0,transform:expandHintVisible?"translateY(0) scale(1)":"translateY(1px) scale(.76)",transition:"opacity 650ms ease,transform 650ms cubic-bezier(.2,.8,.2,1)",pointerEvents:"auto"}}>▤</button>,stageNode)}</div>;
}
