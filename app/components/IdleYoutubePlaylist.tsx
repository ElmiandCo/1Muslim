"use client";
import {useEffect,useRef,useState} from "react";
import {getRegistryVideos} from "./videoRegistry";

type YTPlayer={
  loadVideoById:(video:{videoId:string;startSeconds:number})=>void;
  mute:()=>void;
  unMute:()=>void;
  playVideo:()=>void;
  getCurrentTime:()=>number;
  destroy:()=>void;
};
type YTApi={Player:new(element:HTMLElement,options:{
  videoId:string;playerVars:Record<string,number>;
  events:{onReady:(event:{target:YTPlayer})=>void;onStateChange:(event:{data:number})=>void}
})=>YTPlayer};


export default function IdleYoutubePlaylist({format="desktop"}:{format?:"desktop"|"phone"}){
  const playlist=getRegistryVideos(format);
  const mountRef=useRef<HTMLDivElement>(null);
  const swipeStart=useRef<{x:number;y:number}|null>(null);
  const playerRef=useRef<YTPlayer|null>(null);
  const [soundEnabled,setSoundEnabled]=useState(false);
  const [isPaused,setIsPaused]=useState(false);
  const [tapHint,setTapHint]=useState(true);
  const soundEnabledRef=useRef(false);
  const navigateRef=useRef<(step:number)=>void>(()=>{});
  const transitionTimerRef=useRef<ReturnType<typeof setTimeout>|null>(null);
  const [slideDirection,setSlideDirection]=useState<0|1|-1>(0);
  const [isPlaying,setIsPlaying]=useState(false);
  const [showArrows,setShowArrows]=useState(true);
  const [immersive,setImmersive]=useState(false);
  const [playerBounds,setPlayerBounds]=useState({x:0,y:0,w:0,h:0});
  const arrowTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const revealArrows=()=>{setShowArrows(true);if(arrowTimer.current)clearTimeout(arrowTimer.current);arrowTimer.current=setTimeout(()=>setShowArrows(false),1800);};
  useEffect(()=>{
    if(!isPlaying||!soundEnabled||isPaused){setImmersive(false);return;}
    const timer=setTimeout(()=>setImmersive(true),5000);
    return()=>clearTimeout(timer);
  },[isPlaying,soundEnabled,isPaused,format]);
  useEffect(()=>{
    if(!immersive)return;
    const update=()=>{const rect=mountRef.current?.parentElement?.getBoundingClientRect();if(rect)setPlayerBounds({x:rect.left,y:rect.top,w:rect.width,h:rect.height});};
    update();window.addEventListener("resize",update);window.addEventListener("scroll",update,true);
    return()=>{window.removeEventListener("resize",update);window.removeEventListener("scroll",update,true);};
  },[immersive]);
  useEffect(()=>()=>{if(arrowTimer.current)clearTimeout(arrowTimer.current);},[]);
  const navigate=(step:number)=>navigateRef.current(step);
  const enableSound=()=>{soundEnabledRef.current=true;setSoundEnabled(true);setIsPaused(false);setTapHint(false);setIsPlaying(false);setImmersive(false);playerRef.current?.unMute();playerRef.current?.playVideo();};
  const selectedIndexRef=useRef<number|null>(null);
  useEffect(()=>{
    const ytWindow=window as unknown as {YT?:YTApi;onYouTubeIframeAPIReady?:(()=>void)|undefined};
    let disposed=false;
    let player:YTPlayer|undefined;
    const storageKey=format==="phone"?"oneMuslimPhoneShortsPlaylistPositionV6":"oneMuslimIdleYoutubePlaylistPositionV2";
    let saved:{index:number;seconds:number}|null=null;
    try{const raw=sessionStorage.getItem(storageKey);if(raw){const value=JSON.parse(raw);if(Number.isInteger(value.index)&&value.index>=0&&value.index<playlist.length&&Number.isFinite(value.seconds))saved=value;}}catch{}
    // Pick a fresh featured video on page load instead of resuming the last one.
    // Keep the selection stable for this mounted player until the viewer navigates.
    let index=selectedIndexRef.current??Math.floor(Math.random()*playlist.length);
    selectedIndexRef.current=index;
    const initialSeconds=playlist[index].startSeconds;
    let timer:ReturnType<typeof setInterval>|undefined;
    const next=(step=1)=>{
      if(disposed||!player)return;
      index=((selectedIndexRef.current??index)+step+playlist.length)%playlist.length;
      selectedIndexRef.current=index;
      const video=playlist[index];
      player.loadVideoById({videoId:video.videoId,startSeconds:video.startSeconds});
      setTapHint(true);setIsPaused(false);setIsPlaying(false);setImmersive(false);
      if(!soundEnabledRef.current)player.mute();
      try{sessionStorage.setItem(storageKey,JSON.stringify({index,seconds:video.startSeconds}));}catch{}
    };
    const selectVideo=(event:Event)=>{
      const videoId=(event as CustomEvent<{videoId:string}>).detail?.videoId;
      const nextIndex=playlist.findIndex(v=>v.videoId===videoId);
      if(nextIndex<0||!player)return;
      index=nextIndex;selectedIndexRef.current=index;
      const selected=playlist[index];
      player.loadVideoById({videoId:selected.videoId,startSeconds:selected.startSeconds});
      setIsPaused(false);setTapHint(false);
    };
    window.addEventListener("oneMuslimSelectCarouselVideo",selectVideo);
    navigateRef.current=(step)=>{
      if(disposed||!player||transitionTimerRef.current)return;
      setSlideDirection(step>0?1:-1);
      transitionTimerRef.current=setTimeout(()=>{
        transitionTimerRef.current=null;
        next(step);
        setSlideDirection(0);
      },240);
    };
    const create=()=>{
      if(disposed||!mountRef.current||!ytWindow.YT?.Player||player)return;
      player=new ytWindow.YT.Player(mountRef.current,{
        videoId:playlist[index].videoId,
        playerVars:{autoplay:1,mute:1,controls:1,playsinline:1,rel:0,start:Math.floor(initialSeconds),enablejsapi:1},
        events:{
          onReady:({target})=>{
            if(disposed)return;
            playerRef.current=target;
            if(!soundEnabledRef.current)target.mute();
            target.playVideo();
            timer=setInterval(()=>{
              if(disposed||!player)return;
              const segment=playlist[index];
              const seconds=player.getCurrentTime();
              if(segment.endSeconds!==null&&seconds>=segment.endSeconds){next();return;}
              try{sessionStorage.setItem(storageKey,JSON.stringify({index,seconds}));}catch{}
            },250);
          },
          onStateChange:({data})=>{if(data===0)next();else if(data===2){setIsPlaying(false);setIsPaused(true);setTapHint(true)}else if(data===1){setIsPlaying(true);setIsPaused(false)}else if(data===3){setIsPlaying(false)}}
        }
      });
    };
    const previousReady=ytWindow.onYouTubeIframeAPIReady;
    if(ytWindow.YT?.Player)create();
    else{
      ytWindow.onYouTubeIframeAPIReady=()=>{previousReady?.();create();};
      if(!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')){
        const script=document.createElement("script");
        script.src="https://www.youtube.com/iframe_api";
        script.async=true;
        document.head.appendChild(script);
      }
    }
    return ()=>{
      disposed=true;
      window.removeEventListener("oneMuslimSelectCarouselVideo",selectVideo);
      navigateRef.current=()=>{};
      if(transitionTimerRef.current){clearTimeout(transitionTimerRef.current);transitionTimerRef.current=null;}
      if(timer)clearInterval(timer);
      if(ytWindow.onYouTubeIframeAPIReady!==previousReady)ytWindow.onYouTubeIframeAPIReady=previousReady;
      playerRef.current=null;
      if(player){try{sessionStorage.setItem(storageKey,JSON.stringify({index,seconds:player.getCurrentTime()}));}catch{};player.destroy();}
    };
  },[format]);
  return <><div className={"oneMuslimFloatingPlayerRig"+(format==="phone"?" is-phone":"")} aria-label="Floating featured video player" onPointerMove={revealArrows} onPointerDown={revealArrows} onTouchStart={e=>{if(format==="phone")swipeStart.current={x:e.touches[0].clientX,y:e.touches[0].clientY}}} onTouchEnd={e=>{const start=swipeStart.current;swipeStart.current=null;if(format!=="phone"||!start)return;const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;if(Math.abs(dy)>65&&Math.abs(dy)>Math.abs(dx)*1.2)navigate(dy<0?1:-1)}}>
    <div className="oneMuslimFloatingPlayerShadow" aria-hidden="true"/>
    <div className={"oneMuslimIdleYoutubePlayer"+(slideDirection?" is-switching "+(slideDirection>0?"is-next":"is-previous"):"")} aria-label="Featured video playlist while no broadcasts are live">
      <div ref={mountRef} style={{width:"100%",height:"100%"}}/>
      {(!soundEnabled||isPaused)&&<button type="button" className="oneMuslimPlayerSoundActivator" onClick={enableSound} aria-label="Tap to enable video audio or resume playback" title="Tap to play with sound"/>}
      {(!soundEnabled||isPaused)&&tapHint&&<div className="oneMuslimThemeTapOverlay" aria-hidden="true"><span className="oneMuslimThemeTap">Tap</span></div>}
      <span className="oneMuslimThemeBrand" aria-hidden="true">1Muslim</span>
      <button type="button" className={"oneMuslimPlaylistArrow is-left"+(showArrows||!soundEnabled||!isPlaying?"":" is-idle")} aria-label="Previous YouTube video" onClick={()=>navigate(-1)}>‹</button>
      <button type="button" className={"oneMuslimPlaylistArrow is-right"+(showArrows||!soundEnabled||!isPlaying?"":" is-idle")} aria-label="Next YouTube video" onClick={()=>navigate(1)}>›</button>
    </div>
    <style>{`
      .oneMuslimFloatingPlayerRig.is-phone{touch-action:pan-y;max-width:420px;aspect-ratio:9/16;max-height:100%;margin:0 auto 12px}
      .oneMuslimFloatingPlayerRig.is-phone .oneMuslimIdleYoutubePlayer{border-radius:22px}
      .oneMuslimFloatingPlayerRig{width:100%;max-width:1400px;aspect-ratio:16/9;max-height:100%;align-self:start;justify-self:center;position:relative;isolation:isolate;margin:0 auto 24px;animation:none}
      .oneMuslimIdleYoutubePlayer{width:100%;height:100%;position:relative;z-index:1;overflow:hidden;border-radius:14px;background:#020b1d;box-shadow:0 7px 16px rgba(0,0,0,.28),0 18px 36px rgba(0,0,0,.16);animation:none}
      .oneMuslimFloatingPlayerShadow{position:absolute;z-index:0;left:7%;right:7%;height:26%;bottom:-10%;border-radius:50%;background:rgba(0,0,0,.65);filter:blur(19px);transform-origin:center;animation:none;pointer-events:none}
      .oneMuslimThemeTapOverlay{position:absolute;inset:0;z-index:3;pointer-events:none;background:color-mix(in srgb,var(--theme-primary,var(--theme-accent,#7e7e9c)) 18%,transparent);border:1px solid color-mix(in srgb,var(--theme-primary,var(--theme-accent,#7e7e9c)) 25%,transparent);border-radius:inherit;animation:oneMuslimOverlayBreath 3s ease-in-out infinite;display:grid;place-items:center;box-sizing:border-box}
      .oneMuslimThemeBrand{position:absolute;z-index:5;bottom:clamp(10px,1.8vw,19px);right:clamp(12px,2vw,23px);pointer-events:none;user-select:none;font-family:"Palatino Linotype","Book Antiqua",Palatino,"URW Palladio L",Georgia,serif;font-size:clamp(12px,1.35vw,17px);font-style:italic;font-weight:600;letter-spacing:-.055em;text-transform:none;color:color-mix(in srgb,var(--theme-primary,#b9d8ff) 24%,#fff);text-shadow:0 1px 4px rgba(0,0,0,.85),0 0 12px color-mix(in srgb,var(--theme-primary,#b9d8ff) 24%,transparent);opacity:.88;white-space:nowrap;animation:none!important;transition:none!important}
      .oneMuslimThemeTap{font-size:clamp(25px,5vw,48px);font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:color-mix(in srgb,var(--theme-text,#fff) 38%,transparent);-webkit-text-stroke:1px color-mix(in srgb,var(--theme-primary,#a9a9cf) 55%,transparent);text-shadow:0 0 22px color-mix(in srgb,var(--theme-primary,#a9a9cf) 25%,transparent)}
      @keyframes oneMuslimOverlayBreath{0%,100%{opacity:1}50%{opacity:0}}
      
      .oneMuslimPlayerSoundActivator{position:absolute;inset:0;z-index:2;display:block;width:100%;height:100%;border:0;background:transparent;cursor:pointer;touch-action:manipulation}
      .oneMuslimPlaylistArrow{position:absolute;z-index:4;top:10px;transform:none;width:24px;height:24px;min-width:24px;min-height:24px;padding:0;border:1px solid color-mix(in srgb,var(--theme-primary,#75bfff) 19%,transparent);border-radius:50%;background:color-mix(in srgb,var(--theme-primary,#75bfff) 3%,transparent);color:color-mix(in srgb,var(--theme-primary,#75bfff) 25%,white);font:300 19px/1 sans-serif;display:grid;place-items:center;cursor:pointer;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);box-shadow:0 0 7px color-mix(in srgb,var(--theme-primary,#75bfff) 11%,transparent);transition:background .25s ease,box-shadow .25s ease,color .25s ease}
      .oneMuslimPlaylistArrow.is-idle{opacity:0;pointer-events:none;transition:opacity 1s ease,background .25s ease,box-shadow .25s ease,color .25s ease}\n      .oneMuslimPlaylistArrow:not(.is-idle){opacity:1;transition:opacity .3s ease,background .25s ease,box-shadow .25s ease,color .25s ease}\n      .oneMuslimPlaylistArrow.is-left{left:10px}.oneMuslimPlaylistArrow.is-right{right:10px}
      .oneMuslimPlaylistArrow:hover,.oneMuslimPlaylistArrow:focus-visible{background:color-mix(in srgb,var(--theme-primary,#75bfff) 9%,transparent);box-shadow:0 0 10px color-mix(in srgb,var(--theme-primary,#75bfff) 18%,transparent);outline-offset:2px}
      .oneMuslimIdleYoutubePlayer>div:first-child{transition:transform .24s cubic-bezier(.2,.7,.2,1),opacity .24s ease}
      .oneMuslimIdleYoutubePlayer.is-switching.is-next>div:first-child{transform:translateX(-8%);opacity:.22}
      .oneMuslimIdleYoutubePlayer.is-switching.is-previous>div:first-child{transform:translateX(8%);opacity:.22}
      @keyframes oneMuslimRigLift{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(0,-7px,0)}}
      @keyframes oneMuslimRigShadow{0%,100%{transform:translate3d(0,0,0) scale(.96);opacity:.5;filter:blur(17px)}50%{transform:translate3d(0,2px,0) scale(1.04);opacity:.34;filter:blur(23px)}}
      @keyframes oneMuslimRigDrift{0%,100%{transform:translate3d(0,0,0)}25%{transform:translate3d(2px,-1px,0)}50%{transform:translate3d(-2px,1px,0)}75%{transform:translate3d(1px,2px,0)}}
      @media(prefers-reduced-motion:reduce){.oneMuslimFloatingPlayerRig,.oneMuslimIdleYoutubePlayer,.oneMuslimFloatingPlayerShadow,.oneMuslimThemeTapOverlay{animation:none!important}.oneMuslimIdleYoutubePlayer>div:first-child{transition:none!important}}
    `}</style>
  </div><div aria-hidden="true" className={"oneMuslimCinemaDimmer"+(immersive?" is-active":"")} style={{"--cinema-left":Math.max(0,playerBounds.x)+"px","--cinema-top":Math.max(0,playerBounds.y)+"px","--cinema-right":Math.max(0,window.innerWidth-playerBounds.x-playerBounds.w)+"px","--cinema-bottom":Math.max(0,window.innerHeight-playerBounds.y-playerBounds.h)+"px"} as React.CSSProperties}>
    <span className="cinema-edge is-top"/><span className="cinema-edge is-bottom"/><span className="cinema-edge is-left"/><span className="cinema-edge is-right"/>
  </div><style>{`
    .oneMuslimCinemaDimmer{position:fixed;inset:0;z-index:9998;pointer-events:none;opacity:0;transition:opacity 2.8s ease}
    .oneMuslimCinemaDimmer.is-active{opacity:1;transition:opacity 13s ease}
    .oneMuslimCinemaDimmer .cinema-edge{position:absolute;display:block;pointer-events:none}
    .oneMuslimCinemaDimmer .cinema-edge.is-top{top:0;left:0;right:0;height:var(--cinema-top);background:linear-gradient(to bottom,rgba(0,0,0,.62),rgba(0,0,0,.48))}
    .oneMuslimCinemaDimmer .cinema-edge.is-bottom{bottom:0;left:0;right:0;height:var(--cinema-bottom);background:linear-gradient(to top,rgba(0,0,0,.62),rgba(0,0,0,.48))}
    .oneMuslimCinemaDimmer .cinema-edge.is-left{top:var(--cinema-top);bottom:var(--cinema-bottom);left:0;width:var(--cinema-left);background:linear-gradient(to right,rgba(0,0,0,.62),rgba(0,0,0,.48))}
    .oneMuslimCinemaDimmer .cinema-edge.is-right{top:var(--cinema-top);bottom:var(--cinema-bottom);right:0;width:var(--cinema-right);background:linear-gradient(to left,rgba(0,0,0,.62),rgba(0,0,0,.48))}
    @media(prefers-reduced-motion:reduce){.oneMuslimCinemaDimmer,.oneMuslimCinemaDimmer.is-active{transition:none}}
  `}</style></>;
}
