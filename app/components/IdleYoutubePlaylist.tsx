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


const playlist=[
  {videoId:"gF7RjyK8gQ0",startSeconds:28,endSeconds:null},
  {videoId:"eZVppeK0BMk",startSeconds:15,endSeconds:120}
] as const;

export default function IdleYoutubePlaylist(){
  const mountRef=useRef<HTMLDivElement>(null);
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
    const next=()=>{
      if(disposed||!player)return;
      index=(index+1)%playlist.length;
      const video=playlist[index];
      player.loadVideoById({videoId:video.videoId,startSeconds:video.startSeconds});
      player.mute();
      try{sessionStorage.setItem(storageKey,JSON.stringify({index,seconds:video.startSeconds}));}catch{}
    };
    const create=()=>{
      if(disposed||!mountRef.current||!ytWindow.YT?.Player||player)return;
      player=new ytWindow.YT.Player(mountRef.current,{
        videoId:playlist[index].videoId,
        playerVars:{autoplay:1,mute:1,controls:1,playsinline:1,rel:0,start:Math.floor(initialSeconds),enablejsapi:1},
        events:{
          onReady:({target})=>{
            if(disposed)return;
            target.mute();
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
      if(timer)clearInterval(timer);
      if(ytWindow.onYouTubeIframeAPIReady!==previousReady)ytWindow.onYouTubeIframeAPIReady=previousReady;
      if(player){try{sessionStorage.setItem(storageKey,JSON.stringify({index,seconds:player.getCurrentTime()}));}catch{};player.destroy();}
    };
  },[]);
  return <div className="oneMuslimIdleYoutubePlayer" aria-label="Featured video playlist while no broadcasts are live" style={{width:"100%",maxWidth:"1400px",aspectRatio:"16 / 9",maxHeight:"100%",alignSelf:"start",justifySelf:"center",position:"relative",overflow:"hidden",borderRadius:14,background:"#020b1d",boxShadow:"0 8px 24px rgba(0,0,0,.24)"}}>
    <div ref={mountRef} style={{width:"100%",height:"100%"}}/>
  </div>;
}
