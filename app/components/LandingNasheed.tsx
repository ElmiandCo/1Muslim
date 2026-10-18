"use client";
import {useEffect} from "react";

/** A short, softly faded Nasheed greeting on the initial landing visit. */
export default function LandingNasheed(){
 useEffect(()=>{
  const audio=new Audio("/audio/NasheedLoop.mp3");
  audio.preload="auto";
  audio.volume=0;
  let frame=0,stopped=false,startedAt=0;
  const duration=9000,fade=3000;
  const tick=()=>{
   if(stopped)return;
   const elapsed=performance.now()-startedAt;
   audio.volume=Math.max(0,Math.min(0.45,0.45*elapsed/fade,0.45*(duration-elapsed)/fade));
   if(elapsed>=duration){audio.pause();audio.currentTime=0;return}
   frame=requestAnimationFrame(tick);
  };
  // Browsers may block audible autoplay; never interrupt the visitor with an overlay.
  void audio.play().then(()=>{if(!stopped){startedAt=performance.now();frame=requestAnimationFrame(tick)}}).catch(()=>{});
  const onWelcome=()=>{stopped=true;cancelAnimationFrame(frame);audio.pause()};
  window.addEventListener("1muslim:hudhud-welcome",onWelcome);
  return()=>{stopped=true;cancelAnimationFrame(frame);audio.pause();window.removeEventListener("1muslim:hudhud-welcome",onWelcome)};
 },[]);
 return null;
}
