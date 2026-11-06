"use client";
import {useEffect,useRef,useState} from "react";
import {getRegistryVideos} from "./videoRegistry";
import ElmiTimedCommentsLayer from "./ElmiTimedCommentsLayer";
import {createClient} from "../../utils/supabase/client";

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
  const allVideos=getRegistryVideos(format);
  const categories=["All",...Array.from(new Set(allVideos.map(video=>video.category)))];
  const [category,setCategory]=useState("All");
  const playlist=category==="All"?allVideos:allVideos.filter(video=>video.category===category);
  useEffect(()=>{const onCategory=(event:Event)=>{const selection=(event as CustomEvent<{category:string;format:string}>).detail;if(selection?.format===format&&categories.includes(selection.category)){selectedIndexRef.current=null;setCategory(selection.category)}};window.addEventListener("oneMuslimCarouselCategory",onCategory);return()=>window.removeEventListener("oneMuslimCarouselCategory",onCategory)},[format]);
  const mountRef=useRef<HTMLDivElement>(null);
  const swipeStart=useRef<{x:number;y:number}|null>(null);
  const playerRef=useRef<YTPlayer|null>(null);
  const [soundEnabled,setSoundEnabled]=useState(false);
  const [isPaused,setIsPaused]=useState(false);
  const [tapHint,setTapHint]=useState(true);
  const [signedIn,setSignedIn]=useState(false);
  useEffect(()=>{const db=createClient();let alive=true;void db.auth.getUser().then(({data})=>{if(alive)setSignedIn(Boolean(data.user))});const {data:{subscription}}=db.auth.onAuthStateChange((_event,session)=>{if(alive)setSignedIn(Boolean(session?.user))});return()=>{alive=false;subscription.unsubscribe()}},[]);

  const soundEnabledRef=useRef(false);
  const navigateRef=useRef<(step:number)=>void>(()=>{});
  const transitionTimerRef=useRef<ReturnType<typeof setTimeout>|null>(null);
  const [slideDirection,setSlideDirection]=useState<0|1|-1>(0);
  const [isPlaying,setIsPlaying]=useState(false);
  const [skipPrompt,setSkipPrompt]=useState(false);
  const [skipCountdown,setSkipCountdown]=useState(5);
  const continueVideoRef=useRef<()=>void>(()=>{});
  const nextVideoRef=useRef<()=>void>(()=>{});
  const [showArrows,setShowArrows]=useState(true);
  const [immersive,setImmersive]=useState(false);
  const [cinemaSettled,setCinemaSettled]=useState(false);
  const [cinemaEngaged,setCinemaEngaged]=useState(false);
  const [playerBounds,setPlayerBounds]=useState({x:0,y:0,w:0,h:0});
  const [timedVideoKey,setTimedVideoKey]=useState("");
  const [timedSeconds,setTimedSeconds]=useState(0);
  // YouTube iframe pixels cannot be mirrored cross-origin. Mirror its thumbnail instead.
  // The Home chat is mounted asynchronously, so retry attachment when it becomes available.
  useEffect(()=>{
    let chat:HTMLElement|null=null;
    let reflection:HTMLDivElement|null=null;
    const attach=()=>{
      const stage=mountRef.current?.closest(".oneMuslimLiveStage");
      const target=stage?.querySelector<HTMLElement>(".oneMuslimLiveBottom");
      if(!target||!target.isConnected)return;
      if(target===chat&&reflection?.isConnected)return;
      reflection?.remove();
      chat?.classList.remove("oneMuslimReflectiveChat");
      chat=target;
      chat.classList.add("oneMuslimReflectiveChat");
      reflection=document.createElement("div");
      reflection.className="oneMuslimVideoWaterReflection";
      reflection.setAttribute("aria-hidden","true");
      const image=document.createElement("div");
      image.className="oneMuslimVideoWaterReflectionImage";
      reflection.appendChild(image);
      image.style.backgroundImage=/^[a-zA-Z0-9_-]{11}$/.test(timedVideoKey)\n        ?`url("https://i.ytimg.com/vi/${timedVideoKey}/hqdefault.jpg")`:"none";
      chat.prepend(reflection);
    };
    attach();
    const observer=new MutationObserver(attach);
    observer.observe(document.body,{childList:true,subtree:true});
    return()=>{observer.disconnect();reflection?.remove();chat?.classList.remove("oneMuslimReflectiveChat")};
  },[format,timedVideoKey]);
  // The decorative iframe is muted and follows the primary player. It never drives navigation.
  useEffect(()=>{
    const stage=mountRef.current?.closest(".oneMuslimLiveStage");
    const mirror=stage?.querySelector<HTMLIFrameElement>(".oneMuslimVideoWaterReflectionMirror");
    if(!mirror?.contentWindow)return;
    const command=(func:string,args:unknown[]=[])=>mirror.contentWindow?.postMessage(JSON.stringify({event:"command",func,args}),"https://www.youtube-nocookie.com");
    command("mute");
    command(isPlaying&&!isPaused?"playVideo":"pauseVideo");
    // Correct drift only when a real playback position is available.
    if(isPlaying&&!isPaused&&Number.isFinite(timedSeconds)&&timedSeconds>0&&timedSeconds%8===0)command("seekTo",[timedSeconds,true]);
  },[timedSeconds,isPlaying,isPaused,format]);
  useEffect(()=>{
    const stage=mountRef.current?.closest(".oneMuslimLiveStage");
    const image=stage?.querySelector<HTMLElement>(".oneMuslimVideoWaterReflectionImage");
    if(image)image.style.backgroundImage=/^[a-zA-Z0-9_-]{11}$/.test(timedVideoKey)
      ?`url("https://i.ytimg.com/vi/${timedVideoKey}/hqdefault.jpg")`:"none";
  },[timedVideoKey,format]);
  useEffect(()=>{window.dispatchEvent(new CustomEvent("elmi-home-video-time",{detail:{videoKey:timedVideoKey,seconds:timedSeconds,format}}))},[timedVideoKey,timedSeconds,format]);
  useEffect(()=>{return ()=>{window.dispatchEvent(new CustomEvent("elmi-home-video-time",{detail:{videoKey:"",seconds:0,format}}));};},[format]);
  const arrowTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const engageCinema=()=>{setCinemaEngaged(true);setImmersive(false);setCinemaSettled(false);window.setTimeout(()=>setCinemaEngaged(false),150);};
  const revealArrows=()=>{setShowArrows(true);if(arrowTimer.current)clearTimeout(arrowTimer.current);arrowTimer.current=setTimeout(()=>setShowArrows(false),5000);};
  useEffect(()=>{if(!isPlaying){setShowArrows(true);return;}setShowArrows(false);const show=window.setTimeout(()=>{setShowArrows(true);arrowTimer.current=setTimeout(()=>setShowArrows(false),5000)},3000);return()=>{window.clearTimeout(show);if(arrowTimer.current)window.clearTimeout(arrowTimer.current)};},[isPlaying,format]);
  useEffect(()=>{
    if(!isPlaying||isPaused){setImmersive(false);setCinemaSettled(false);return;}
    const timer=setTimeout(()=>setImmersive(true),10000);
    return()=>clearTimeout(timer);
  },[isPlaying,soundEnabled,isPaused,format,cinemaEngaged]);
  useEffect(()=>{if(!immersive)return;const timer=setTimeout(()=>setCinemaSettled(true),23000);return()=>clearTimeout(timer);},[immersive]);
  useEffect(()=>{
    const update=()=>{const rect=mountRef.current?.closest(".oneMuslimIdleYoutubePlayer")?.getBoundingClientRect();if(rect)setPlayerBounds({x:rect.left,y:rect.top,w:rect.width,h:rect.height});};
    update();window.addEventListener("resize",update);window.addEventListener("scroll",update,true);
    return()=>{window.removeEventListener("resize",update);window.removeEventListener("scroll",update,true);};
  },[format]);
  useEffect(()=>()=>{if(arrowTimer.current)clearTimeout(arrowTimer.current);},[]);
  const navigate=(step:number)=>navigateRef.current(step);
  const enableSound=()=>{soundEnabledRef.current=true;setSoundEnabled(true);setIsPaused(false);setTapHint(false);setIsPlaying(false);setImmersive(false);setCinemaEngaged(false);setCinemaSettled(false);playerRef.current?.unMute();playerRef.current?.playVideo();};
  const selectedIndexRef=useRef<number|null>(null);
  useEffect(()=>{
    const ytWindow=window as unknown as {YT?:YTApi;onYouTubeIframeAPIReady?:(()=>void)|undefined};
    let disposed=false;
    let player:YTPlayer|undefined;
    const storageKey=format==="phone"?"oneMuslimPhoneShortsPlaylistPositionV6":"oneMuslimIdleYoutubePlaylistPositionV2";
    let saved:{index:number;seconds:number}|null=null;
    try{const raw=sessionStorage.getItem(storageKey);if(raw){const value=JSON.parse(raw);if(Number.isInteger(value.index)&&value.index>=0&&value.index<playlist.length&&Number.isFinite(value.seconds))saved=value;}}catch{}
    // Resume the exact previously playing video only after escaping a broken Live.
    // Ordinary homepage visits retain the existing fresh-video selection behavior.
    let resumeAfterLive=false;
    try{const marker=Number(sessionStorage.getItem("oneMuslimResumeAfterLiveError"));resumeAfterLive=marker>0&&Date.now()-marker<120000;if(resumeAfterLive)sessionStorage.removeItem("oneMuslimResumeAfterLiveError");}catch{}
    let index=resumeAfterLive&&saved?saved.index:selectedIndexRef.current!==null&&selectedIndexRef.current<playlist.length?selectedIndexRef.current:Math.floor(Math.random()*playlist.length);
    selectedIndexRef.current=index;
    setTimedVideoKey(playlist[index].videoId);
    const initialSeconds=resumeAfterLive&&saved?Math.max(playlist[index].startSeconds,saved.seconds):playlist[index].startSeconds;
    let timer:ReturnType<typeof setInterval>|undefined;
    let segmentStart=resumeAfterLive&&saved?initialSeconds:playlist[index].startSeconds;
    let promptStartedAt:number|null=null;
    let autoSkipHandled=false;
    const continuedIds=new Set<string>();
    try{const ids=JSON.parse(localStorage.getItem("oneMuslimContinueVideoIdsV1")||"[]");if(Array.isArray(ids))ids.forEach((id:unknown)=>{if(typeof id==="string")continuedIds.add(id)})}catch{}
    const clearPrompt=()=>{promptStartedAt=null;autoSkipHandled=false;setSkipPrompt(false);setSkipCountdown(5)};
    const next=(step=1)=>{
      if(disposed||!player)return;
      index=((selectedIndexRef.current??index)+step+playlist.length)%playlist.length;
      selectedIndexRef.current=index;
      setTimedVideoKey(playlist[index].videoId);
      const video=playlist[index];
      segmentStart=video.startSeconds;clearPrompt();
      player.loadVideoById({videoId:video.videoId,startSeconds:video.startSeconds});
      setTapHint(true);setIsPaused(false);setIsPlaying(false);setImmersive(false);
      if(!soundEnabledRef.current)player.mute();
      try{sessionStorage.setItem(storageKey,JSON.stringify({index,seconds:video.startSeconds}));}catch{}
    };
    const selectVideo=(event:Event)=>{
      const videoId=(event as CustomEvent<{videoId:string}>).detail?.videoId;
      const nextIndex=playlist.findIndex(v=>v.videoId===videoId);
      if(nextIndex<0||!player)return;
      index=nextIndex;selectedIndexRef.current=index;setTimedVideoKey(playlist[index].videoId);
      const selected=playlist[index];
      segmentStart=selected.startSeconds;clearPrompt();
      player.loadVideoById({videoId:selected.videoId,startSeconds:selected.startSeconds});
      setIsPaused(false);setTapHint(false);
    };
    window.addEventListener("oneMuslimSelectCarouselVideo",selectVideo);
    continueVideoRef.current=()=>{const id=playlist[index].videoId;void (async()=>{try{const {createClient}=await import("../../utils/supabase/client");const client=createClient();const {data:{user}}=await client.auth.getUser();if(user)await client.from("app_engagement_events").insert({user_id:user.id,section:"Home Video",event_type:"finish_watching_tap",video_id:id})}catch{}})();continuedIds.add(id);try{localStorage.setItem("oneMuslimContinueVideoIdsV1",JSON.stringify([...continuedIds]))}catch{}clearPrompt();};
    nextVideoRef.current=()=>next();
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
              if(!Number.isFinite(seconds))return;
              setTimedSeconds(Math.floor(seconds));
              if(!continuedIds.has(segment.videoId)&&seconds>=segmentStart+15){
                if(promptStartedAt===null){promptStartedAt=performance.now();setSkipPrompt(true);setSkipCountdown(5)}
                const elapsed=(performance.now()-promptStartedAt)/1000;
                const remaining=5-elapsed;
                setSkipCountdown(Math.max(1,5-Math.floor(elapsed)));
                if(remaining<=0&&!autoSkipHandled){autoSkipHandled=true;next();return;}
              }
              // Homepage player rules override editorial endSeconds: always offer the 15s choice.
              // A remembered Finish Watching selection plays through the natural YouTube ending.
              // Registry endSeconds remains available for other player contexts.
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
      navigateRef.current=()=>{};continueVideoRef.current=()=>{};nextVideoRef.current=()=>{};
      if(transitionTimerRef.current){clearTimeout(transitionTimerRef.current);transitionTimerRef.current=null;}
      if(timer)clearInterval(timer);
      if(ytWindow.onYouTubeIframeAPIReady!==previousReady)ytWindow.onYouTubeIframeAPIReady=previousReady;
      playerRef.current=null;
      if(player){try{sessionStorage.setItem(storageKey,JSON.stringify({index,seconds:player.getCurrentTime()}));}catch{};player.destroy();}
    };
  },[format,category]);
  return <><div className={"oneMuslimFloatingPlayerRig"+(format==="phone"?" is-phone":"")} aria-label="Floating featured video player" onPointerMove={revealArrows} onPointerDown={()=>{revealArrows();engageCinema();}} onTouchStart={e=>{if(format==="phone")swipeStart.current={x:e.touches[0].clientX,y:e.touches[0].clientY}}} onTouchEnd={e=>{const start=swipeStart.current;swipeStart.current=null;if(format!=="phone"||!start)return;const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;if(Math.abs(dy)>65&&Math.abs(dy)>Math.abs(dx)*1.2)navigate(dy<0?1:-1)}}>
    <div className="oneMuslimFloatingPlayerShadow" aria-hidden="true"/>
    <div className={"oneMuslimIdleYoutubePlayer"+(slideDirection?" is-switching "+(slideDirection>0?"is-next":"is-previous"):"")} aria-label="Featured video playlist while no broadcasts are live">
      <div ref={mountRef} style={{width:"100%",height:"100%"}}/>
      {(!soundEnabled||isPaused)&&<button type="button" className="oneMuslimPlayerSoundActivator" onClick={enableSound} aria-label="Tap to enable video audio or resume playback" title="Tap to play with sound"/>}
      {(!soundEnabled||isPaused)&&tapHint&&<div className="oneMuslimThemeTapOverlay is-clear" aria-hidden="true"><span className="oneMuslimThemeTap">Tap</span></div>}
      {skipPrompt&&<div className="oneMuslimAutoSkipCard" role="group" aria-label="Next video countdown"><button type="button" aria-label="Tap to stay on this video" onClick={()=>continueVideoRef.current()}><span className="oneMuslimSkipLabel">{skipCountdown===5?"Next Video":"Tap To Stay"}</span><span className="oneMuslimSkipNumber">{skipCountdown}</span></button></div>}
      <span className="oneMuslimThemeBrand" aria-hidden="true">1Muslim</span>
      <button type="button" className={"oneMuslimPlaylistArrow is-left"+(showArrows||!soundEnabled||!isPlaying?"":" is-idle")} aria-label="Previous YouTube video" onClick={()=>navigate(-1)}>‹</button>
      <button type="button" className={"oneMuslimPlaylistArrow is-right"+(showArrows||!soundEnabled||!isPlaying?"":" is-idle")} aria-label="Next YouTube video" onClick={()=>navigate(1)}>›</button>
    </div>
    <style>{`
      .oneMuslimCarouselCategoryBar{width:100%;max-width:1400px;display:flex;gap:12px;align-items:center;overflow-x:auto;scrollbar-width:none;white-space:nowrap;padding:0 4px 5px;margin:0 auto 3px;min-height:21px}.oneMuslimCarouselCategoryBar::-webkit-scrollbar{display:none}.oneMuslimCarouselCategoryBar button{flex:none;border:0;background:transparent;color:color-mix(in srgb,var(--theme-text,#fff) 65%,transparent);font-size:11px;font-weight:400;line-height:18px;letter-spacing:.01em;padding:1px 3px;cursor:pointer}.oneMuslimCarouselCategoryBar button.is-selected{color:var(--theme-primary,#a9e7d5);font-weight:650;border-bottom:1px solid currentColor}.oneMuslimCarouselCategoryBar button:focus-visible{outline:2px solid var(--theme-primary,#a9e7d5);outline-offset:2px}
      .oneMuslimFloatingPlayerRig.is-phone{touch-action:pan-y;max-width:420px;aspect-ratio:9/16;max-height:100%;margin:0 auto 12px}
      .oneMuslimFloatingPlayerRig.is-phone .oneMuslimIdleYoutubePlayer{border-radius:22px}
      .oneMuslimFloatingPlayerRig{width:100%;max-width:1400px;aspect-ratio:16/8.75;max-height:100%;align-self:start;justify-self:center;position:relative;isolation:isolate;margin:0 auto 24px;animation:none}
      .oneMuslimIdleYoutubePlayer{mask-image:linear-gradient(90deg,transparent 0%,#000 5%,#000 95%,transparent 100%);-webkit-mask-image:linear-gradient(90deg,transparent 0%,#000 5%,#000 95%,transparent 100%);width:100%;height:100%;position:relative;z-index:1;overflow:hidden;border-radius:14px;background:#020b1d;box-shadow:0 7px 16px rgba(0,0,0,.28),0 18px 36px rgba(0,0,0,.16);animation:none}
      .oneMuslimFloatingPlayerShadow{position:absolute;z-index:0;left:7%;right:7%;height:26%;bottom:-10%;border-radius:50%;background:rgba(0,0,0,.65);filter:blur(19px);transform-origin:center;animation:none;pointer-events:none}
      .oneMuslimThemeTapOverlay{position:absolute;inset:0;z-index:3;pointer-events:none;background:transparent;border:1px solid transparent;border-radius:inherit;animation:oneMuslimOverlayBreath 3s ease-in-out infinite;display:grid;place-items:center;box-sizing:border-box}
      .oneMuslimThemeTapOverlay.is-clear{background:transparent!important;border-color:transparent!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
      .oneMuslimAutoSkipCard{position:absolute;z-index:9;left:50%;bottom:15%;transform:translateX(-50%);width:min(190px,50%);display:grid;place-items:center;border:0;border-radius:24px;background:color-mix(in srgb,var(--theme-primary,#65bcb9) 13%,rgba(7,18,28,.22));backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);animation:oneMuslimSkipAppear .2s ease-out,oneMuslimOverlayBreath 3s ease-in-out infinite;box-shadow:0 0 24px color-mix(in srgb,var(--theme-primary,#65bcb9) 16%,transparent)}
      .oneMuslimAutoSkipCard button{appearance:none;border:0;background:transparent;color:#fff;display:flex;flex-direction:column;align-items:center;gap:2px;padding:10px 24px;cursor:pointer;width:100%;text-shadow:0 2px 10px rgba(0,0,0,.7)}
      .oneMuslimSkipLabel{font-size:clamp(11px,2vw,15px);font-weight:600;letter-spacing:.04em}
      .oneMuslimSkipNumber{font-size:clamp(38px,7vw,62px);font-weight:700;line-height:1.1;font-variant-numeric:tabular-nums}
      @keyframes oneMuslimSkipAppear{from{opacity:0;transform:translate(-50%,7px)}to{opacity:1;transform:translate(-50%,0)}}
      .oneMuslimThemeBrand{position:absolute;z-index:5;bottom:clamp(10px,1.8vw,19px);right:clamp(12px,2vw,23px);pointer-events:none;user-select:none;font-family:"Palatino Linotype","Book Antiqua",Palatino,"URW Palladio L",Georgia,serif;font-size:clamp(12px,1.35vw,17px);font-style:italic;font-weight:600;letter-spacing:-.055em;text-transform:none;color:color-mix(in srgb,var(--theme-primary,#b9d8ff) 24%,#fff);text-shadow:0 1px 4px rgba(0,0,0,.85),0 0 12px color-mix(in srgb,var(--theme-primary,#b9d8ff) 24%,transparent);opacity:.88;white-space:nowrap;animation:none!important;transition:none!important}
      .oneMuslimThemeTap{font-size:clamp(25px,5vw,48px);font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:color-mix(in srgb,var(--theme-text,#fff) 38%,transparent);-webkit-text-stroke:1px color-mix(in srgb,var(--theme-primary,#a9a9cf) 55%,transparent);text-shadow:0 0 22px color-mix(in srgb,var(--theme-primary,#a9a9cf) 25%,transparent)}
      @keyframes oneMuslimOverlayBreath{0%,100%{opacity:1}50%{opacity:0}}
      
      .oneMuslimPlayerSoundActivator{position:absolute;inset:0;z-index:2;display:block;width:100%;height:100%;border:0;background:transparent;cursor:pointer;touch-action:manipulation}
      .oneMuslimPlaylistArrow{position:absolute;z-index:4;top:10px;transform:none;width:24px;height:24px;min-width:24px;min-height:24px;padding:0;border:1px solid color-mix(in srgb,var(--theme-primary,#75bfff) 12%,transparent);border-radius:50%;background:color-mix(in srgb,var(--theme-primary,#75bfff) 1%,transparent);color:color-mix(in srgb,var(--theme-primary,#75bfff) 25%,white);font:300 19px/1 sans-serif;display:grid;place-items:center;cursor:pointer;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);box-shadow:0 0 7px color-mix(in srgb,var(--theme-primary,#75bfff) 5%,transparent);transition:background .25s ease,box-shadow .25s ease,color .25s ease}
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
  </div><ElmiTimedCommentsLayer videoKey={timedVideoKey} seconds={timedSeconds} playing={isPlaying&&!isPaused} bounds={playerBounds}/><div aria-hidden="true" className={"oneMuslimCinemaDimmer"+(immersive?" is-active":"")+(cinemaSettled?" is-settled":"")} style={{"--cinema-left":Math.max(0,playerBounds.x)+"px","--cinema-top":Math.max(0,playerBounds.y+playerBounds.h*.12)+"px","--cinema-right":Math.max(0,(typeof window!=="undefined"?window.innerWidth:0)-playerBounds.x-playerBounds.w)+"px","--cinema-bottom":Math.max(0,(typeof window!=="undefined"?window.innerHeight:0)-playerBounds.y-playerBounds.h*.88)+"px"} as React.CSSProperties}>
    <span className="cinema-edge is-top"/><span className="cinema-edge is-bottom"/><span className="cinema-edge is-left"/><span className="cinema-edge is-right"/>
  </div><style>{`
    .oneMuslimReflectiveChat{position:relative;isolation:isolate;overflow:hidden}
    .oneMuslimReflectiveChat>.oneMuslimVideoWaterReflection{position:absolute;inset:0;z-index:0;overflow:hidden;pointer-events:none;opacity:.24;mask-image:linear-gradient(to bottom,rgba(0,0,0,.95),rgba(0,0,0,.48) 42%,transparent 100%);-webkit-mask-image:linear-gradient(to bottom,rgba(0,0,0,.95),rgba(0,0,0,.48) 42%,transparent 100%)}
    .oneMuslimVideoWaterReflectionMirror{position:absolute;inset:-25% -25%;width:150%;height:150%;border:0;pointer-events:none;transform:scaleY(-1) scale(1.12);filter:blur(32px) saturate(.65);opacity:.8}\n    .oneMuslimVideoWaterReflectionImage{position:absolute;inset:-15% -4%;background-size:cover;background-position:center top;transform:scaleY(-1) scale(1.06);filter:blur(16px) saturate(.65);animation:oneMuslimReflectionRipple 12s ease-in-out infinite alternate}
    .oneMuslimReflectiveChat>:not(.oneMuslimVideoWaterReflection){position:relative;z-index:1}
    @keyframes oneMuslimReflectionRipple{from{transform:scaleY(-1) scale(1.06) translateX(-.5%)}to{transform:scaleY(-1) scale(1.075) translateX(.5%)}}
    @media(prefers-reduced-motion:reduce){.oneMuslimVideoWaterReflectionImage{animation:none}}
    .oneMuslimCinemaDimmer{position:fixed;inset:0;z-index:9998;pointer-events:none;opacity:0;transition:opacity 2.8s ease}
    .oneMuslimCinemaDimmer.is-active{opacity:1;transition:opacity 2.6s ease}
    .oneMuslimCinemaDimmer.is-settled{opacity:.85;transition:opacity 2.6s ease}\n    .oneMuslimCinemaDimmer .cinema-edge{position:absolute;display:block;pointer-events:none}
    .oneMuslimCinemaDimmer .cinema-edge.is-top{top:0;left:0;right:0;height:var(--cinema-top);background:linear-gradient(to bottom,rgba(0,0,0,.90) 0%,rgba(0,0,0,.83) 76%,rgba(0,0,0,.18) 100%)}
    .oneMuslimCinemaDimmer .cinema-edge.is-bottom{bottom:0;left:0;right:0;height:var(--cinema-bottom);background:linear-gradient(to top,rgba(0,0,0,.76) 0%,rgba(0,0,0,.62) 76%,rgba(0,0,0,.10) 100%)}
    .oneMuslimCinemaDimmer .cinema-edge.is-left{top:var(--cinema-top);bottom:var(--cinema-bottom);left:0;width:var(--cinema-left);background:linear-gradient(to right,rgba(0,0,0,.82),rgba(0,0,0,.66))}
    .oneMuslimCinemaDimmer .cinema-edge.is-right{top:var(--cinema-top);bottom:var(--cinema-bottom);right:0;width:var(--cinema-right);background:linear-gradient(to left,rgba(0,0,0,.62),rgba(0,0,0,.48))}
    /* Feather the cutout so the bright player and its floating shadow remain the focal point. */\n    .oneMuslimCinemaDimmer .cinema-edge{filter:blur(9px)}\n    @media(prefers-reduced-motion:reduce){.oneMuslimCinemaDimmer,.oneMuslimCinemaDimmer.is-active{transition:none}}
  `}</style></>;
}
