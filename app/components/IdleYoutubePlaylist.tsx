"use client";
import {useEffect,useRef,useState} from "react";

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


const playlist=[
  {videoId:"gF7RjyK8gQ0",startSeconds:28,endSeconds:null},
  {videoId:"eZVppeK0BMk",startSeconds:15,endSeconds:120}
] as const;

export default function IdleYoutubePlaylist(){
  const mountRef=useRef<HTMLDivElement>(null);
  const playerRef=useRef<YTPlayer|null>(null);
  const [soundEnabled,setSoundEnabled]=useState(false);
  const soundEnabledRef=useRef(false);
  const navigateRef=useRef<(step:number)=>void>(()=>{});
  const transitionTimerRef=useRef<ReturnType<typeof setTimeout>|null>(null);
  const [slideDirection,setSlideDirection]=useState<0|1|-1>(0);
  const navigate=(step:number)=>navigateRef.current(step);
  const enableSound=()=>{soundEnabledRef.current=true;setSoundEnabled(true);playerRef.current?.unMute();playerRef.current?.playVideo();};
  useEffect(()=>{
    const ytWindow=window as unknown as {YT?:YTApi;onYouTubeIframeAPIReady?:(()=>void)|undefined};
    let disposed=false;
    let player:YTPlayer|undefined;
    const storageKey="oneMuslimIdleYoutubePlaylistPosition";
    let saved:{index:number;seconds:number}|null=null;
    try{const raw=sessionStorage.getItem(storageKey);if(raw){const value=JSON.parse(raw);if(Number.isInteger(value.index)&&value.index>=0&&value.index<playlist.length&&Number.isFinite(value.seconds))saved=value;}}catch{}
    let index=saved?.index??0;
    const initialSeconds=saved?Math.max(playlist[index].startSeconds,Math.min(saved.seconds,playlist[index].endSeconds??Number.MAX_SAFE_INTEGER)):playlist[0].startSeconds;
    let timer:ReturnType<typeof setInterval>|undefined;
    const next=(step=1)=>{
      if(disposed||!player)return;
      index=(index+step+playlist.length)%playlist.length;
      const video=playlist[index];
      player.loadVideoById({videoId:video.videoId,startSeconds:video.startSeconds});
      if(!soundEnabledRef.current)player.mute();
      try{sessionStorage.setItem(storageKey,JSON.stringify({index,seconds:video.startSeconds}));}catch{}
    };
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
          onStateChange:({data})=>{if(data===0)next();}
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
      navigateRef.current=()=>{};
      if(transitionTimerRef.current){clearTimeout(transitionTimerRef.current);transitionTimerRef.current=null;}
      if(timer)clearInterval(timer);
      if(ytWindow.onYouTubeIframeAPIReady!==previousReady)ytWindow.onYouTubeIframeAPIReady=previousReady;
      playerRef.current=null;
      if(player){try{sessionStorage.setItem(storageKey,JSON.stringify({index,seconds:player.getCurrentTime()}));}catch{};player.destroy();}
    };
  },[]);
  return <div className="oneMuslimFloatingPlayerRig" aria-label="Floating featured video player">
    <div className="oneMuslimFloatingPlayerShadow" aria-hidden="true"/>
    <div className={"oneMuslimIdleYoutubePlayer"+(slideDirection?" is-switching "+(slideDirection>0?"is-next":"is-previous"):"")} aria-label="Featured video playlist while no broadcasts are live">
      <div ref={mountRef} style={{width:"100%",height:"100%"}}/>
      {!soundEnabled&&<button type="button" className="oneMuslimPlayerSoundActivator" onClick={enableSound} aria-label="Turn on video audio" title="Tap to enable audio"/>}
      <button type="button" className="oneMuslimPlaylistArrow is-left" aria-label="Previous YouTube video" onClick={()=>navigate(-1)}>‹</button>
      <button type="button" className="oneMuslimPlaylistArrow is-right" aria-label="Next YouTube video" onClick={()=>navigate(1)}>›</button>
    </div>
    <style>{`
      .oneMuslimFloatingPlayerRig{width:100%;max-width:1400px;aspect-ratio:16/9;max-height:100%;align-self:start;justify-self:center;position:relative;isolation:isolate;margin:0 auto 24px}
      .oneMuslimIdleYoutubePlayer{width:100%;height:100%;position:relative;z-index:1;overflow:hidden;border-radius:14px;background:#020b1d;box-shadow:0 7px 16px rgba(0,0,0,.28),0 18px 36px rgba(0,0,0,.16);animation:none}
      .oneMuslimFloatingPlayerShadow{position:absolute;z-index:0;left:7%;right:7%;height:26%;bottom:-10%;border-radius:50%;background:rgba(0,0,0,.65);filter:blur(19px);transform-origin:center;animation:none;pointer-events:none}
      .oneMuslimPlayerSoundActivator{position:absolute;inset:0;z-index:2;display:block;width:100%;height:100%;border:0;background:transparent;cursor:pointer;touch-action:manipulation}
      .oneMuslimPlaylistArrow{position:absolute;z-index:4;top:50%;transform:translateY(-50%);width:25px;height:44px;padding:0;border:1px solid rgba(255,255,255,.22);border-radius:18px;background:rgba(5,15,28,.23);color:rgba(255,255,255,.83);font:300 27px/1 sans-serif;display:grid;place-items:center;cursor:pointer;backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);transition:background .25s ease,opacity .25s ease}
      .oneMuslimPlaylistArrow.is-left{left:5px}.oneMuslimPlaylistArrow.is-right{right:5px}
      .oneMuslimPlaylistArrow:hover,.oneMuslimPlaylistArrow:focus-visible{background:rgba(5,15,28,.65);outline-offset:2px}
      .oneMuslimIdleYoutubePlayer>div:first-child{transition:transform .24s cubic-bezier(.2,.7,.2,1),opacity .24s ease}
      .oneMuslimIdleYoutubePlayer.is-switching.is-next>div:first-child{transform:translateX(-8%);opacity:.22}
      .oneMuslimIdleYoutubePlayer.is-switching.is-previous>div:first-child{transform:translateX(8%);opacity:.22}
      @keyframes oneMuslimRigLift{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(0,-7px,0)}}
      @keyframes oneMuslimRigShadow{0%,100%{transform:translate3d(0,0,0) scale(.96);opacity:.5;filter:blur(17px)}50%{transform:translate3d(0,2px,0) scale(1.04);opacity:.34;filter:blur(23px)}}
      @keyframes oneMuslimRigDrift{0%,100%{transform:translate3d(0,0,0)}25%{transform:translate3d(2px,-1px,0)}50%{transform:translate3d(-2px,1px,0)}75%{transform:translate3d(1px,2px,0)}}
      @media(prefers-reduced-motion:reduce){.oneMuslimFloatingPlayerRig,.oneMuslimIdleYoutubePlayer,.oneMuslimFloatingPlayerShadow{animation:none!important}.oneMuslimIdleYoutubePlayer>div:first-child{transition:none!important}}
    `}</style>
  </div>;
}
