"use client";
import {useEffect,useRef,useState,type VideoHTMLAttributes} from "react";
import {observeVideo,recallPlayback,rememberPlayback,predictVideo} from "./smart-media";

type Props = Omit<VideoHTMLAttributes<HTMLVideoElement>,"src"> & {
 src:string; mediaId?:string; preloadDistance?:string;
};
/** One native-video lifecycle for full-screen posts and profile galleries. */
export default function SmartVideo({src,mediaId,preloadDistance="450px",onTimeUpdate,onLoadedMetadata,...props}:Props){
 const ref=useRef<HTMLVideoElement>(null);
 const [near,setNear]=useState(false);
 const key=mediaId||src;
 useEffect(()=>{
  const node=ref.current;if(!node)return;
  const observer=new IntersectionObserver(([entry])=>{setNear(entry.isIntersecting);if(entry.isIntersecting)predictVideo(src)},{rootMargin:preloadDistance});
  observer.observe(node);
  return()=>observer.disconnect();
 },[preloadDistance,src]);
 useEffect(()=>{
  const node=ref.current;if(!node)return;
  const cleanup=observeVideo(node);
  const save=()=>rememberPlayback(key,node.currentTime);
  node.addEventListener("pause",save);
  window.addEventListener("pagehide",save);
  return()=>{save();cleanup();node.removeEventListener("pause",save);window.removeEventListener("pagehide",save)};
 },[key]);
 return <video {...props} ref={ref} src={near?src:undefined} preload={near?"metadata":"none"} playsInline
   onLoadedMetadata={event=>{
     const node=event.currentTarget;
     const time=recallPlayback(key);
     if(time>0&&Number.isFinite(node.duration)&&node.duration>time+1)node.currentTime=time;
     onLoadedMetadata?.(event);
   }}
   onTimeUpdate={event=>{
     const node=event.currentTarget;
     if(Math.floor(node.currentTime)%5===0)rememberPlayback(key,node.currentTime);
     onTimeUpdate?.(event);
   }}/>;
}
