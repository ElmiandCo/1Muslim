"use client";
import {useEffect,useRef} from "react";

type YTPlayer={
  loadVideoById:(video:{videoId:string;startSeconds:number})=>void;
  mute:()=>void;
  playVideo:()=>void;
  getCurrentTime:()=>number;
  destroy:()=>void;
};
type YTApi={Player:new(element:HTMLElement,options:{
  videoId:string;playerVars:Record<string,number>;
  events:{onReady:(event:{target:YTPlayer})=>void;onStateChange:(event:{data:number})=>void}
})=>YTPlayer};
declare global {interface Window {YT?:YTApi;onYouTubeIframeAPIReady?:(()=>void)|undefined}}

const playlist=[
  {videoId:"gF7RjyK8gQ0",startSeconds:28,endSeconds:null},
  {videoId:"eZVppeK0BMk",startSeconds:15,endSeconds:120}
] as const;

export default function IdleYoutubePlaylist(){
  const mountRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    let disposed=false;
    let player:YTPlayer|undefined;
    let index=0;
    let timer:ReturnType<typeof setInterval>|undefined;
    const next=()=>{
      if(disposed||!player)return;
      index=(index+1)%playlist.length;
      const video=playlist[index];
      player.loadVideoById({videoId:video.videoId,startSeconds:video.startSeconds});
      player.mute();
    };
    const create=()=>{
      if(disposed||!mountRef.current||!window.YT?.Player||player)return;
      player=new window.YT.Player(mountRef.current,{
        videoId:playlist[0].videoId,
        playerVars:{autoplay:1,mute:1,controls:1,playsinline:1,rel:0,start:28,enablejsapi:1},
        events:{
          onReady:({target})=>{
            if(disposed)return;
            target.mute();
            target.playVideo();
            timer=setInterval(()=>{
              if(disposed||!player)return;
              const segment=playlist[index];
              if(segment.endSeconds!==null&&player.getCurrentTime()>=segment.endSeconds)next();
            },250);
          },
          onStateChange:({data})=>{if(data===0)next();}
        }
      });
    };
    const previousReady=window.onYouTubeIframeAPIReady;
    if(window.YT?.Player)create();
    else{
      window.onYouTubeIframeAPIReady=()=>{previousReady?.();create();};
      if(!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')){
        const script=document.createElement("script");
        script.src="https://www.youtube.com/iframe_api";
        script.async=true;
        document.head.appendChild(script);
      }
    }
    return ()=>{
      disposed=true;
      if(timer)clearInterval(timer);
      if(window.onYouTubeIframeAPIReady!==previousReady)window.onYouTubeIframeAPIReady=previousReady;
      player?.destroy();
    };
  },[]);
  return <div className="oneMuslimIdleYoutubePlayer" aria-label="Featured video playlist while no broadcasts are live" style={{width:"100%",maxWidth:"1400px",aspectRatio:"16 / 9",maxHeight:"100%",alignSelf:"start",justifySelf:"center",position:"relative",overflow:"hidden",borderRadius:14,background:"#020b1d",boxShadow:"0 8px 24px rgba(0,0,0,.24)"}}>
    <div ref={mountRef} style={{width:"100%",height:"100%"}}/>
  </div>;
}
