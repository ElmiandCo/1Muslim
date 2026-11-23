"use client";

import {useEffect,useRef} from "react";
import {rememberWatchedPost} from "../lib/ummah-watch-history";

type PlayerStateEvent={data:number};
type ReadyEvent={target:{mute:()=>void;playVideo:()=>void}};
type YoutubeApiPlayer={destroy:()=>void;getPlayerState:()=>number;getCurrentTime:()=>number;getPlaybackRate?:()=>number};
type YoutubeApi={Player:new(frame:HTMLIFrameElement,options:{
 events:{
  onReady?:(event:ReadyEvent)=>void;
  onStateChange?:(event:PlayerStateEvent)=>void;
 }
})=>YoutubeApiPlayer};

/**
 * YouTube runs inside the same immersive Ummah player and comment overlay as
 * native uploads. Watch history is recorded only after YouTube actually reports
 * continuous playback for three seconds; merely opening a thumbnail is not a view.
 */
export default function ImmersiveYouTubePlayer({videoId,postId,authorId}:{videoId:string;postId:string;authorId:string}){
 const mountRef=useRef<HTMLDivElement|null>(null);

 useEffect(()=>{
  let live=true,player:YoutubeApiPlayer|null=null,watched=false;
  let timer:ReturnType<typeof setTimeout>|null=null;
  const clearTimer=()=>{if(timer!==null){clearTimeout(timer);timer=null}};
  const mount=mountRef.current;
  if(!mount)return;
  // YouTube SDK may replace or remove the iframe. Keep it outside React-owned DOM.
  const frame=document.createElement("iframe");
  frame.title="YouTube video in Ummah post";
  frame.allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share";
  frame.allowFullscreen=true;
  frame.referrerPolicy="strict-origin-when-cross-origin";
  frame.loading="eager";
  const src=new URL("https://www.youtube-nocookie.com/embed/"+encodeURIComponent(videoId));
  for(const [k,v] of Object.entries({autoplay:"1",mute:"1",playsinline:"1",controls:"1",rel:"0",enablejsapi:"1",origin:window.location.origin})){
   src.searchParams.set(k,v);
  }
  frame.src=src.toString();
  mount.replaceChildren(frame);
  const playback=()=>{
   try{
    if(!player||player.getPlayerState()!==1)return null;
    const time=player.getCurrentTime();
    if(!Number.isFinite(time))return null;
    const rate=player.getPlaybackRate?.()||1;
    return {time,rate:Number.isFinite(rate)&&rate>0?rate:1};
   }catch{return null}
  };
  // Opening the viewer or seeking is not a watch: require three visible,
  // uninterrupted seconds AND actual video-time progress.
  const scheduleWatch=()=>{
   clearTimer();
   if(!live||watched||document.hidden)return;
   const start=playback();
   if(!start)return;
   const startedAt=performance.now();
   timer=setTimeout(()=>{
    timer=null;
    if(!live||watched||document.hidden)return;
    const end=playback();
    if(!end)return;
    const elapsed=(performance.now()-startedAt)/1000;
    const moved=end.time-start.time;
    // Allow YouTube's playback rates (including 2x), but reject a seek jump
    // masquerading as three seconds watched.
    const maxProgress=elapsed*Math.max(start.rate,end.rate,1)*1.7+.3;
    const minProgress=elapsed*Math.max(.25,Math.min(start.rate,end.rate))*.4;
    if(elapsed>=2.9&&moved>=minProgress&&moved<=maxProgress){
     watched=true;
     rememberWatchedPost(postId,authorId);
    }else if(playback()){
     // Buffering, slow-start or a scrub: begin a fresh verified interval.
     scheduleWatch();
    }
   },3200);
  };
  const onStateChange=(event:PlayerStateEvent)=>{
   if(event.data===1)scheduleWatch();
   else clearTimer();
  };
  const onVisibility=()=>{
   if(document.hidden){clearTimer();return}
   // Returning to a playing video need not emit a new PLAYING event.
   if(playback())scheduleWatch();
  };
  document.addEventListener("visibilitychange",onVisibility);
  const attach=()=>{
   if(!live||player||!frame.isConnected)return;
   const api=window.YT as unknown as YoutubeApi|undefined;
   if(!api?.Player)return;
   try{
    player=new api.Player(frame,{
     events:{
      onReady:(e:ReadyEvent)=>{if(!live)return;try{e.target.mute();e.target.playVideo()}catch{/* The built-in YouTube controls remain usable. */}},
      onStateChange
     }
    });
   }catch{/* Fall back to the directly embedded YouTube iframe. */}
  };
  let previous:typeof window.onYouTubeIframeAPIReady;
  let ready:typeof window.onYouTubeIframeAPIReady;
  if(window.YT?.Player)attach();
  else{
   previous=window.onYouTubeIframeAPIReady;
   ready=()=>{previous?.();attach()};
   window.onYouTubeIframeAPIReady=ready;
   if(!document.querySelector("script[data-yt-iframe-api]")){
    const script=document.createElement("script");
    script.src="https://www.youtube.com/iframe_api";
    script.dataset.ytIframeApi="true";
    script.async=true;
    document.head.appendChild(script);
   }
  }
  return()=>{
   live=false;clearTimer();document.removeEventListener("visibilitychange",onVisibility);
   if(ready&&window.onYouTubeIframeAPIReady===ready)window.onYouTubeIframeAPIReady=previous;
   try{player?.destroy()}catch{/* A removed iframe is safe on cleanup. */}
   mount.replaceChildren();
  };
 },[videoId,postId,authorId]);

 return <div className="immersiveYouTubePlayer"><div className="immersiveYouTubeMount" ref={mountRef}/></div>;
}
