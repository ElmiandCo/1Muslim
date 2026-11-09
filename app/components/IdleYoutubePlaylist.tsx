"use client";
import {useEffect,useRef,useState} from "react";
import {createPortal} from "react-dom";
import {getRegistryVideos,isKidsVideo} from "./videoRegistry";
import ElmiTimedCommentsLayer from "./ElmiTimedCommentsLayer";
import HomeWordCaptions from "./HomeWordCaptions";
import {createClient} from "../../utils/supabase/client";

type YTPlayer={
  loadVideoById:(video:{videoId:string;startSeconds:number})=>void;
  mute:()=>void;
  unMute:()=>void;
  playVideo:()=>void;
  pauseVideo:()=>void;
  getCurrentTime:()=>number;
  destroy:()=>void;
};
type YTApi={Player:new(element:HTMLElement,options:{
  videoId:string;playerVars:Record<string,number>;
  events:{onReady:(event:{target:YTPlayer})=>void;onStateChange:(event:{data:number})=>void}
})=>YTPlayer};


export default function IdleYoutubePlaylist({format="desktop"}:{format?:"desktop"|"phone"}){
  const allVideos=getRegistryVideos(format);
  const categories=["All","Kids",...Array.from(new Set(allVideos.flatMap(video=>video.categories??[video.category])))];
  const [category,setCategory]=useState("All");
  const playlist=category==="All"?allVideos:allVideos.filter(video=>category==="Kids"?isKidsVideo(video):(video.categories??[video.category]).includes(category));
  useEffect(()=>{const onCategory=(event:Event)=>{const selection=(event as CustomEvent<{category:string;format:string}>).detail;if(selection?.format===format&&categories.includes(selection.category)){selectedIndexRef.current=null;setCategory(selection.category)}};window.addEventListener("oneMuslimCarouselCategory",onCategory);return()=>window.removeEventListener("oneMuslimCarouselCategory",onCategory)},[format]);
  const mountRef=useRef<HTMLDivElement>(null);
  const swipeStart=useRef<{x:number;y:number}|null>(null);
  const playerRef=useRef<YTPlayer|null>(null);
  useEffect(()=>{const pause=()=>{playerRef.current?.pauseVideo();setIsPaused(true);setIsPlaying(false)};const onMedia=(e:Event)=>{if(e.target instanceof HTMLMediaElement&&!e.target.muted)pause()};window.addEventListener("1muslim:audio-focus",pause);document.addEventListener("play",onMedia,true);return()=>{window.removeEventListener("1muslim:audio-focus",pause);document.removeEventListener("play",onMedia,true)}},[]);
  const [soundEnabled,setSoundEnabled]=useState(false);
  const [isPaused,setIsPaused]=useState(false);
  const [tapHint,setTapHint]=useState(true);
  const [signedIn,setSignedIn]=useState(false);
  useEffect(()=>{const db=createClient();let alive=true;void db.auth.getUser().then(({data})=>{if(alive)setSignedIn(Boolean(data.user))});const {data:{subscription}}=db.auth.onAuthStateChange((_event,session)=>{if(alive)setSignedIn(Boolean(session?.user))});return()=>{alive=false;subscription.unsubscribe()}},[]);

  const soundEnabledRef=useRef(false);
  const navigateRef=useRef<(step:number)=>void>(()=>{});
  const transitionTimerRef=useRef<ReturnType<typeof setTimeout>|null>(null);
  const [slideDirection,setSlideDirection]=useState<0|1|-1>(0);
  const [carouselPreview,setCarouselPreview]=useState<{from:string;to:string;direction:number}|null>(null);
  const [isPlaying,setIsPlaying]=useState(false);
  const [skipPrompt,setSkipPrompt]=useState(false);
  const [skipCountdown,setSkipCountdown]=useState(5);
  const continueVideoRef=useRef<()=>void>(()=>{});
  const nextVideoRef=useRef<()=>void>(()=>{});
  const [showArrows,setShowArrows]=useState(false);
  const [immersive,setImmersive]=useState(false);
  const [cinemaSettled,setCinemaSettled]=useState(false);
  const [spotlightsGathered,setSpotlightsGathered]=useState(false);
  const [cinemaEngaged,setCinemaEngaged]=useState(false);
  const [playerBounds,setPlayerBounds]=useState({x:0,y:0,w:0,h:0});
  const [timedVideoKey,setTimedVideoKey]=useState("");
  const [timedSeconds,setTimedSeconds]=useState(0);
  // Cross-origin YouTube iframes cannot be mirrored as live pixels. Use a soft,
  // vertically flipped video thumbnail beneath the existing comments instead.
  useEffect(()=>{
    const stage=mountRef.current?.closest(".oneMuslimLiveStage");
    const chat=stage?.querySelector<HTMLElement>(".oneMuslimLiveBottom");
    if(!chat)return;
    chat.classList.add("oneMuslimReflectiveChat");
    stage?.classList.toggle("oneMuslimShortsViewing",format==="phone");
    const reflection=document.createElement("div");
    reflection.className="oneMuslimVideoWaterReflection";
    reflection.setAttribute("aria-hidden","true");
    const image=document.createElement("div");
    image.className="oneMuslimVideoWaterReflectionImage";
    reflection.appendChild(image);
    chat.prepend(reflection);
    return()=>{reflection.remove();chat.classList.remove("oneMuslimReflectiveChat");stage?.classList.remove("oneMuslimShortsViewing")};
  },[format]);
  useEffect(()=>{
    const stage=mountRef.current?.closest(".oneMuslimLiveStage");
    const image=stage?.querySelector<HTMLElement>(".oneMuslimVideoWaterReflectionImage");
    if(image&&/^[a-zA-Z0-9_-]{11}$/.test(timedVideoKey))
      image.style.backgroundImage=`url("https://i.ytimg.com/vi/${timedVideoKey}/hqdefault.jpg")`;
  },[timedVideoKey,format]);
  useEffect(()=>{window.dispatchEvent(new CustomEvent("elmi-home-video-time",{detail:{videoKey:timedVideoKey,seconds:timedSeconds,format}}))},[timedVideoKey,timedSeconds,format]);
  useEffect(()=>{return ()=>{window.dispatchEvent(new CustomEvent("elmi-home-video-time",{detail:{videoKey:"",seconds:0,format}}));};},[format]);
  const arrowTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const engageCinema=()=>{setCinemaEngaged(true);setImmersive(false);setCinemaSettled(false);window.setTimeout(()=>setCinemaEngaged(false),150);};
  // YouTube iframe controls are cross-origin: mirror their interaction window
  // from parent-level gestures rather than claiming access to iframe UI state.
  const revealArrows=()=>{setShowArrows(true);if(arrowTimer.current)clearTimeout(arrowTimer.current);arrowTimer.current=setTimeout(()=>setShowArrows(false),2000);};
  useEffect(()=>{setShowArrows(false);if(arrowTimer.current)clearTimeout(arrowTimer.current);},[timedVideoKey,format]);
  useEffect(()=>{
    if(!isPlaying||isPaused){setImmersive(false);setCinemaSettled(false);return;}
    const timer=setTimeout(()=>setImmersive(true),5000);
    return()=>clearTimeout(timer);
  },[isPlaying,soundEnabled,isPaused,format,cinemaEngaged]);
  useEffect(()=>{if(!immersive)return;const timer=setTimeout(()=>setCinemaSettled(true),20000);return()=>clearTimeout(timer);},[immersive]);
  useEffect(()=>{setSpotlightsGathered(false);if(!immersive||!isPlaying||isPaused)return;const timer=window.setTimeout(()=>setSpotlightsGathered(true),6000);return()=>window.clearTimeout(timer)},[immersive,isPlaying,isPaused,timedVideoKey,format]);
  useEffect(()=>{window.dispatchEvent(new CustomEvent("1muslim:deep-watch-video",{detail:{active:immersive&&isPlaying&&!isPaused}}));return()=>{window.dispatchEvent(new CustomEvent("1muslim:deep-watch-video",{detail:{active:false}}));}},[immersive,isPlaying,isPaused]);
  // Track the visible video every animation frame: ResizeObserver alone misses CSS transforms,
  // carousel motion, the floating player's drift, and scroll-driven position changes.
  useEffect(()=>{
    let frame=0;let last="";let lastComments="";let lastCommentsAt=0;let focusYOffset=0;
    const track=()=>{
      const video=mountRef.current?.closest<HTMLElement>(".oneMuslimIdleYoutubePlayer");
      const rect=video?.getBoundingClientRect();
      // Timed comment flight animations depend on these bounds. PR #661 stopped
      // updating them, leaving the comments layer at its initial zero rectangle.
      if(rect){
        const now=performance.now();
        const commentKey=[rect.left,rect.top,rect.width,rect.height].map(n=>Math.round(n/3)).join(",");
        if(commentKey!==lastComments&&now-lastCommentsAt>100){
          lastComments=commentKey;lastCommentsAt=now;
          setPlayerBounds({x:rect.left,y:rect.top,w:rect.width,h:rect.height});
        }
      }
      const cutout=document.querySelector<HTMLElement>(".oneMuslimCinemaDimmer .cinema-video-cutout");
      if(rect&&cutout){
        // The visible video frame is authoritative in BOTH carousel states.
        // The YouTube iframe can be vertically cropped/oversized and is not a
        // reliable spotlight target. This rect follows the carousel's motion.
        const x=Math.max(0,rect.left),y=Math.max(0,rect.top);
        const right=Math.min(window.innerWidth,rect.right),bottom=Math.min(window.innerHeight,rect.bottom);
        const width=Math.max(0,right-x),height=Math.max(0,bottom-y);
        // Explicitly raise ONLY the Deep Watch light by 160px when the
        // carousel is hidden. Keep the expanded position untouched.
        // Ease the offset to avoid a jump during carousel transitions.
        const collapsed=!!video?.closest(".home-carousel-collapsed");
        const targetYOffset=collapsed?-320:0;
        focusYOffset+=(targetYOffset-focusYOffset)*0.16;
        if(Math.abs(targetYOffset-focusYOffset)<0.15)focusYOffset=targetYOffset;
        const key=[x,y,width,height,focusYOffset].map(n=>n.toFixed(1)).join(",");
        if(key!==last){
          last=key;
          const mask=cutout.parentElement;
          if(mask){
            mask.style.setProperty("--deep-focus-x",(x+width/2)+"px");
            window.dispatchEvent(new CustomEvent("1muslim:deep-watch-video-bounds",{detail:{x:x+width/2,y:y+height/2+focusYOffset,rx:width/2+30,ry:height/2+28}}));
            mask.style.setProperty("--deep-focus-y",(y+height/2+focusYOffset)+"px");
            mask.style.setProperty("--deep-focus-rx",(width/2+30)+"px");
            mask.style.setProperty("--deep-focus-ry",(height/2+28)+"px");
          }
        }
      }
      frame=window.requestAnimationFrame(track);
    };
    frame=window.requestAnimationFrame(track);
    return()=>window.cancelAnimationFrame(frame);
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
    let shortsSeen=0;
    let sessionStay=false;
    try{sessionStay=sessionStorage.getItem("oneMuslimShortsStaySessionV1")==="true";shortsSeen=Number(sessionStorage.getItem("oneMuslimShortsSeenSessionV1")||0)||0}catch{}
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
      if(format==="phone"){shortsSeen++;try{sessionStorage.setItem("oneMuslimShortsSeenSessionV1",String(shortsSeen))}catch{}}
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
    continueVideoRef.current=()=>{const id=playlist[index].videoId;void (async()=>{try{const {createClient}=await import("../../utils/supabase/client");const client=createClient();const {data:{user}}=await client.auth.getUser();if(user)await client.from("app_engagement_events").insert({user_id:user.id,section:"Home Video",event_type:"finish_watching_tap",video_id:id})}catch{}})();continuedIds.add(id);if(format==="phone"){sessionStay=true;try{sessionStorage.setItem("oneMuslimShortsStaySessionV1","true")}catch{}}else{try{localStorage.setItem("oneMuslimContinueVideoIdsV1",JSON.stringify([...continuedIds]))}catch{}}clearPrompt();};
    nextVideoRef.current=()=>next();
    navigateRef.current=(step)=>{
      if(disposed||!player||transitionTimerRef.current||!playlist.length)return;
      const current=selectedIndexRef.current??index;
      const target=(current+step+playlist.length)%playlist.length;
      const from=playlist[current]?.videoId,to=playlist[target]?.videoId;
      if(!from||!to)return;
      setCarouselPreview({from,to,direction:step>0?1:-1});
      setSlideDirection(step>0?1:-1);
      // Both panels are flush, with the destination arriving exactly as the
      // source exits. Swap the real YouTube iframe under the destination panel.
      transitionTimerRef.current=setTimeout(()=>{
        next(step);
        transitionTimerRef.current=setTimeout(()=>{
          transitionTimerRef.current=null;
          setSlideDirection(0);
          setCarouselPreview(null);
        },180);
      },420);
    };
    const create=()=>{
      if(disposed||!mountRef.current||!ytWindow.YT?.Player||player)return;
      player=new ytWindow.YT.Player(mountRef.current,{
        videoId:playlist[index].videoId,
        playerVars:{autoplay:1,mute:1,controls:1,playsinline:1,rel:0,start:Math.floor(initialSeconds),enablejsapi:1,cc_load_policy:0},
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
              setTimedSeconds(seconds);
              if(!(format==="phone"&&(sessionStay||shortsSeen%6>=2))&&(format==="phone"||!continuedIds.has(segment.videoId))&&seconds>=segmentStart+15){
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
  return <><div className={"oneMuslimFloatingPlayerRig"+(format==="phone"?" is-phone":"")} aria-label="Floating featured video player" onPointerMove={revealArrows} onPointerDown={()=>{revealArrows();engageCinema();}} onTouchStart={e=>{swipeStart.current={x:e.touches[0].clientX,y:e.touches[0].clientY}}} onTouchEnd={e=>{const start=swipeStart.current;swipeStart.current=null;if(!start)return;const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.15){navigate(dx<0?1:-1)}else if(format==="phone"&&Math.abs(dy)>65&&Math.abs(dy)>Math.abs(dx)*1.2){navigate(dy<0?1:-1)}}}>
    <div className="oneMuslimFloatingPlayerShadow" aria-hidden="true"/>
    <div className={"oneMuslimIdleYoutubePlayer"+(slideDirection?" is-switching "+(slideDirection>0?"is-next":"is-previous"):"")} aria-label="Featured video playlist while no broadcasts are live">
      {carouselPreview&&<div className={"oneMuslimSeamlessTrack"+(carouselPreview.direction>0?" is-forward":" is-backward")} aria-hidden="true">
        <div className="oneMuslimSeamlessPanel"><img src={`https://i.ytimg.com/vi/${carouselPreview.from}/maxresdefault.jpg`} alt="" onError={e=>{e.currentTarget.src=`https://i.ytimg.com/vi/${carouselPreview.from}/hqdefault.jpg`}}/></div>
        <div className="oneMuslimSeamlessPanel"><img src={`https://i.ytimg.com/vi/${carouselPreview.to}/maxresdefault.jpg`} alt="" onError={e=>{e.currentTarget.src=`https://i.ytimg.com/vi/${carouselPreview.to}/hqdefault.jpg`}}/></div>
      </div>}
      <div ref={mountRef} style={{width:"100%",height:"100%"}}/>
      {playlist[index]?.videoId&&<HomeWordCaptions videoId={playlist[index].videoId} seconds={timedSeconds}/>}
      {(!soundEnabled||isPaused)&&<button type="button" className="oneMuslimPlayerSoundActivator" onClick={enableSound} aria-label="Tap to enable video audio or resume playback" title="Tap to play with sound"/>}
      {(!soundEnabled||isPaused)&&tapHint&&<div className="oneMuslimThemeTapOverlay is-silver" aria-hidden="true"><span className="oneMuslimThemeTap">Tap</span></div>}
      {skipPrompt&&<div className="oneMuslimAutoSkipCard" role="group" aria-label="Next video countdown"><button type="button" aria-label="Tap to stay on this video" onClick={()=>continueVideoRef.current()}><span className="oneMuslimSkipLabel">{skipCountdown===5?"Next Video":"Tap To Stay"}</span><span className="oneMuslimSkipNumber">{skipCountdown}</span></button></div>}
      <span className="oneMuslimThemeBrand is-visible" aria-hidden="true">1Muslim</span>
      <button type="button" className={"oneMuslimPlaylistArrow is-left"+(showArrows?"":" is-idle")} aria-label="Previous YouTube video" onClick={()=>navigate(-1)}>‹</button>
      <button type="button" className={"oneMuslimPlaylistArrow is-right"+(showArrows?"":" is-idle")} aria-label="Next YouTube video" onClick={()=>navigate(1)}>›</button>
    </div>
    <style>{`
      .oneMuslimCarouselCategoryBar{width:100%;max-width:1400px;display:flex;gap:12px;align-items:center;overflow-x:auto;scrollbar-width:none;white-space:nowrap;padding:0 4px 5px;margin:0 auto 3px;min-height:21px}.oneMuslimCarouselCategoryBar::-webkit-scrollbar{display:none}.oneMuslimCarouselCategoryBar button{flex:none;border:0;background:transparent;color:color-mix(in srgb,var(--theme-text,#fff) 65%,transparent);font-size:11px;font-weight:400;line-height:18px;letter-spacing:.01em;padding:1px 3px;cursor:pointer}.oneMuslimCarouselCategoryBar button.is-selected{color:var(--theme-primary,#a9e7d5);font-weight:650;border-bottom:1px solid currentColor}.oneMuslimCarouselCategoryBar button:focus-visible{outline:2px solid var(--theme-primary,#a9e7d5);outline-offset:2px}
      .oneMuslimFloatingPlayerRig.is-phone{touch-action:pan-y;max-width:420px;aspect-ratio:9/16;max-height:100%;margin:0 auto 12px}
      .oneMuslimFloatingPlayerRig.is-phone .oneMuslimIdleYoutubePlayer{border-radius:22px}
      /* Shorts-only editorial crop: remove the upper 10% without changing player bounds. */
      /* Crop the actual YouTube iframe, not its mount wrapper: fixed viewport, top 10% discarded. */
      .oneMuslimFloatingPlayerRig.is-phone .oneMuslimIdleYoutubePlayer{overflow:hidden!important}
      .oneMuslimFloatingPlayerRig.is-phone .oneMuslimIdleYoutubePlayer>div:first-child{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;overflow:hidden!important;transform:none!important}
      .oneMuslimFloatingPlayerRig.is-phone .oneMuslimIdleYoutubePlayer>div:first-child iframe{position:absolute!important;left:0!important;top:-11.111%!important;width:100%!important;height:111.111%!important;max-width:none!important;transform:none!important;transition:top 650ms cubic-bezier(.2,.7,.2,1),height 650ms cubic-bezier(.2,.7,.2,1)!important}
      /* Shorts-only: 25% less glass blur on the comment surface (12px -> 9px). */
      .oneMuslimShortsViewing .oneMuslimLiveBottom>.homeLiveViewerConversation{backdrop-filter:blur(9px)!important;-webkit-backdrop-filter:blur(9px)!important;transition:backdrop-filter 650ms ease,-webkit-backdrop-filter 650ms ease!important}

      .oneMuslimFloatingPlayerRig{width:100%;max-width:1400px;aspect-ratio:16/8.75;max-height:100%;align-self:start;justify-self:center;position:relative;isolation:isolate;margin:0 auto 24px;animation:none}
      .oneMuslimIdleYoutubePlayer iframe{filter:none!important;-webkit-filter:none!important;mix-blend-mode:normal!important;opacity:1!important}\n      .oneMuslimIdleYoutubePlayer{mask-image:linear-gradient(90deg,transparent 0%,#000 5%,#000 95%,transparent 100%);-webkit-mask-image:linear-gradient(90deg,transparent 0%,#000 5%,#000 95%,transparent 100%);width:100%;height:100%;position:relative;z-index:1;overflow:hidden;border-radius:14px;background:#020b1d;box-shadow:0 7px 16px rgba(0,0,0,.28),0 18px 36px rgba(0,0,0,.16);animation:none}
      .oneMuslimFloatingPlayerShadow{position:absolute;z-index:0;left:7%;right:7%;height:26%;bottom:-10%;border-radius:50%;background:rgba(0,0,0,.65);filter:blur(19px);transform-origin:center;animation:none;pointer-events:none}
      .oneMuslimThemeTapOverlay{position:absolute;inset:0;z-index:3;pointer-events:none;background:transparent;border:1px solid transparent;border-radius:inherit;animation:oneMuslimOverlayBreath 3s ease-in-out infinite;display:grid;place-items:center;box-sizing:border-box}
      .oneMuslimThemeTapOverlay .oneMuslimThemeTap{position:absolute;top:32%;left:50%;transform:translate(-50%,-50%)}
      .oneMuslimThemeTapOverlay.is-silver{background:rgba(192,192,192,.05)!important;border-color:rgba(192,192,192,.05)!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
      [data-theme="obsidian"] .oneMuslimThemeTapOverlay.is-silver,[data-theme-name="obsidian"] .oneMuslimThemeTapOverlay.is-silver,.theme-obsidian .oneMuslimThemeTapOverlay.is-silver{background:rgba(0,0,0,.05)!important;border-color:rgba(0,0,0,.05)!important}
      .oneMuslimIdleYoutubePlayer::before,.oneMuslimIdleYoutubePlayer::after{background-color:transparent!important}
      .oneMuslimThemeTapOverlay .oneMuslimThemeTap{color:#e8e8e8!important;text-shadow:0 1px 6px #000a!important}
      .oneMuslimAutoSkipCard{position:absolute;z-index:9;left:50%;bottom:15%;transform:translateX(-50%);width:min(190px,50%);display:grid;place-items:center;border:0;border-radius:0;background:transparent!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;animation:oneMuslimSkipAppear .2s ease-out;box-shadow:none!important}
      .oneMuslimAutoSkipCard button{appearance:none;border:0;background:transparent!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;color:#fff;display:flex;flex-direction:column;align-items:center;gap:2px;padding:10px 24px;cursor:pointer;width:100%;text-shadow:0 2px 10px rgba(0,0,0,.7)}
      .oneMuslimSkipLabel{font-size:clamp(11px,2vw,15px);font-weight:600;letter-spacing:.04em}
      .oneMuslimSkipNumber{font-size:clamp(38px,7vw,62px);font-weight:700;line-height:1.1;font-variant-numeric:tabular-nums}
      @keyframes oneMuslimSkipAppear{from{opacity:0;transform:translate(-50%,7px)}to{opacity:1;transform:translate(-50%,0)}}
      .oneMuslimThemeBrand{position:absolute;z-index:12;bottom:clamp(10px,1.8vw,19px);right:clamp(12px,2vw,23px);pointer-events:none;user-select:none;font-family:"Palatino Linotype","Book Antiqua",Palatino,"URW Palladio L",Georgia,serif;font-size:clamp(12px,1.35vw,17px);font-style:italic;font-weight:600;letter-spacing:-.055em;text-transform:none;color:#e6e6e6;text-shadow:0 1px 4px rgba(0,0,0,.85);opacity:.88;white-space:nowrap;animation:none!important;transition:none!important}.oneMuslimThemeBrand.is-visible{opacity:.88}
      .oneMuslimThemeTap{font-size:clamp(25px,5vw,48px);font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:color-mix(in srgb,var(--theme-text,#fff) 38%,transparent);-webkit-text-stroke:1px color-mix(in srgb,var(--theme-primary,#a9a9cf) 55%,transparent);text-shadow:0 0 22px color-mix(in srgb,var(--theme-primary,#a9a9cf) 25%,transparent)}
      @keyframes oneMuslimOverlayBreath{0%,100%{opacity:1}50%{opacity:0}}
      
      .oneMuslimPlayerSoundActivator{position:absolute;inset:0;z-index:2;display:block;width:100%;height:100%;border:0;background:transparent;cursor:pointer;touch-action:manipulation}
      .oneMuslimPlaylistArrow{position:absolute;z-index:4;top:25%;transform:translateY(-50%);width:34px;height:44px;min-width:34px;min-height:44px;padding:0;border:0;border-radius:12px;background:transparent!important;color:#fff!important;font:300 25px/1 sans-serif;display:grid;place-items:center;cursor:pointer;backdrop-filter:none;-webkit-backdrop-filter:none;box-shadow:none!important;text-shadow:0 1px 3px rgba(0,0,0,.7);transition:opacity .45s ease!important}
      .oneMuslimPlaylistArrow.is-idle{opacity:0;pointer-events:none}\n      .oneMuslimPlaylistArrow:not(.is-idle){opacity:1}\n      .oneMuslimPlaylistArrow.is-left{left:0}.oneMuslimPlaylistArrow.is-right{right:0}
      .oneMuslimPlaylistArrow:hover,.oneMuslimPlaylistArrow:focus-visible{background:transparent!important;box-shadow:none!important;outline-offset:2px}
      /* Edge-to-edge carousel: two 100% width panels touch without gutters.
         Animate the strip and reveal the actual player after the center snap. */
      .oneMuslimIdleYoutubePlayer{overflow:hidden!important}
      .oneMuslimSeamlessTrack{position:absolute;inset:0 auto 0 0;width:200%;height:100%;z-index:8;display:flex;gap:0;pointer-events:none;will-change:transform;animation:oneMuslimCarouselForward 420ms cubic-bezier(.22,.78,.18,1) forwards}
      .oneMuslimSeamlessTrack.is-backward{flex-direction:row-reverse;left:-100%;animation:oneMuslimCarouselBackward 420ms cubic-bezier(.22,.78,.18,1) forwards}
      .oneMuslimSeamlessPanel{position:relative;flex:0 0 50%;width:50%;height:100%;overflow:hidden;background:#050505}
      .oneMuslimSeamlessPanel img{display:block;width:100%;height:100%;object-fit:cover}
      @keyframes oneMuslimCarouselForward{from{transform:translateX(0)}to{transform:translateX(-50%)}}
      @keyframes oneMuslimCarouselBackward{from{transform:translateX(0)}to{transform:translateX(50%)}}
      @media(prefers-reduced-motion:reduce){.oneMuslimSeamlessTrack{animation-duration:1ms!important}}
      .oneMuslimIdleYoutubePlayer>div:first-child{transition:transform .24s cubic-bezier(.2,.7,.2,1),opacity .24s ease}
      .oneMuslimIdleYoutubePlayer.is-switching.is-next>div:first-child{transform:translateX(-8%);opacity:.22}
      .oneMuslimIdleYoutubePlayer.is-switching.is-previous>div:first-child{transform:translateX(8%);opacity:.22}
      @keyframes oneMuslimRigLift{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(0,-7px,0)}}
      @keyframes oneMuslimRigShadow{0%,100%{transform:translate3d(0,0,0) scale(.96);opacity:.5;filter:blur(17px)}50%{transform:translate3d(0,2px,0) scale(1.04);opacity:.34;filter:blur(23px)}}
      @keyframes oneMuslimRigDrift{0%,100%{transform:translate3d(0,0,0)}25%{transform:translate3d(2px,-1px,0)}50%{transform:translate3d(-2px,1px,0)}75%{transform:translate3d(1px,2px,0)}}
      @media(prefers-reduced-motion:reduce){.oneMuslimFloatingPlayerRig,.oneMuslimIdleYoutubePlayer,.oneMuslimFloatingPlayerShadow,.oneMuslimThemeTapOverlay{animation:none!important}.oneMuslimIdleYoutubePlayer>div:first-child{transition:none!important}}
    `}</style>
  </div><ElmiTimedCommentsLayer videoKey={timedVideoKey} seconds={timedSeconds} playing={isPlaying&&!isPaused} bounds={playerBounds}/>{typeof document!=="undefined"&&createPortal(<div aria-hidden="true" className={"oneMuslimCinemaDimmer"+(false?" is-active":"")+(cinemaSettled?" is-settled":"")}>
    <span className="cinema-video-cutout" style={{left:0,top:0,width:0,height:0}}/>
  </div>,document.body)}<style>{`
    .oneMuslimReflectiveChat{position:relative;isolation:isolate;overflow:hidden}
    .oneMuslimReflectiveChat>.oneMuslimVideoWaterReflection{position:absolute;inset:0;z-index:0;overflow:hidden;pointer-events:none;opacity:.065;mask-image:linear-gradient(to bottom,rgba(0,0,0,.9),rgba(0,0,0,.45) 40%,transparent 100%);-webkit-mask-image:linear-gradient(to bottom,rgba(0,0,0,.9),rgba(0,0,0,.45) 40%,transparent 100%)}
    .oneMuslimVideoWaterReflectionImage{position:absolute;inset:-15% -4%;background-size:cover;background-position:center top;transform:scaleY(-1) scale(1.06);filter:blur(24px) saturate(.55);animation:oneMuslimReflectionRipple 12s ease-in-out infinite alternate}
    .oneMuslimReflectiveChat>:not(.oneMuslimVideoWaterReflection){position:relative;z-index:1}
    @keyframes oneMuslimReflectionRipple{from{transform:scaleY(-1) scale(1.06) translateX(-.5%)}to{transform:scaleY(-1) scale(1.075) translateX(.5%)}}
    @media(prefers-reduced-motion:reduce){.oneMuslimVideoWaterReflectionImage{animation:none}}
    /* Transparent tracked cutout: darken everything OUTSIDE the video, never the iframe. */
    /* Gradient spotlight follows the VIDEO frame in expanded and collapsed carousel states. */
    .oneMuslimCinemaDimmer{position:fixed;inset:0;z-index:9998;pointer-events:none;opacity:0;transition:opacity 2.8s ease,background-color 2.6s ease;overflow:hidden;isolation:isolate;background:rgba(0,0,0,.68);--deep-focus-x:50vw;--deep-focus-y:45vh;--deep-focus-rx:280px;--deep-focus-ry:180px;-webkit-mask-image:radial-gradient(ellipse var(--deep-focus-rx) var(--deep-focus-ry) at var(--deep-focus-x) var(--deep-focus-y),transparent 0%,transparent 66%,#000 100%);mask-image:radial-gradient(ellipse var(--deep-focus-rx) var(--deep-focus-ry) at var(--deep-focus-x) var(--deep-focus-y),transparent 0%,transparent 66%,#000 100%)}
    .oneMuslimCinemaDimmer.is-active{opacity:1}
    .oneMuslimCinemaDimmer.is-settled{background:rgba(0,0,0,.88)}
    .oneMuslimCinemaDimmer .cinema-video-cutout{display:none}
    @media(prefers-reduced-motion:reduce){.oneMuslimCinemaDimmer,.oneMuslimCinemaDimmer .cinema-video-cutout{transition:none!important}}
  `}</style></>;
}
