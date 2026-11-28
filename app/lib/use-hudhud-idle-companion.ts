"use client";
import {useEffect,useRef} from "react";

type Options={
 enabled:boolean;
 canPrompt:boolean;
 signedIn:boolean;
 listeningAvailable:boolean;
 onPrompt:(text:string,sequence:number)=>void;
};
export const HUDHUD_IDLE_DELAY_MS=15_000;
export const HUDHUD_MAX_UNANSWERED_PROMPTS=5;

export function hudHudQuietReflection(sequence:number,signedIn:boolean,listeningAvailable:boolean){
 const available=listeningAvailable?"You can speak whenever you'd like.":"You can type anytime.";
 const reflections=[
  "As-salamu alaykum. I'm still here if you need anything. "+available,
  signedIn
   ?"No rush. Is there something you want to explore on One Muslim?"
   :"If you're just visiting, you're welcome here. You can sign in or join 1Muslim whenever you're ready.",
  "A gentle thought, if you wish: Allah reminds us that remembrance of Him is greater, in Surah Al-Ankabut, chapter twenty-nine, verse forty-five.",
  "I'm here to help with questions, the Qur'an Reader, or a little inspiration. Only if you'd like.",
  "Perhaps you've stepped away. I'll be quiet now. You can turn off my voice or microphone anytime."
 ];
 return reflections[Math.max(0,Math.min(reflections.length-1,sequence-1))];
}

/** 15-second idle reflections, capped at five unanswered messages per page
 * visit. No audio recording, storage or transmission happens in this hook.
 * Playback is delegated to the existing mic-safe voice player. Any user
 * activity resets the sequence; after five, silence until user returns.
 */
export function useHudHudIdleCompanion(options:Options){
 const settings=useRef(options);settings.current=options;
 const lastInteraction=useRef(0);
 const count=useRef(0);
 useEffect(()=>{
  lastInteraction.current=Date.now();
  const mark=()=>{lastInteraction.current=Date.now();count.current=0};
  const key=(event:KeyboardEvent)=>{if(!event.repeat)mark()};
  const pointer=()=>mark();
  const onVisible=()=>{if(document.visibilityState==="visible")lastInteraction.current=Date.now()};
  document.addEventListener("pointerdown",pointer,{passive:true});
  document.addEventListener("keydown",key);
  document.addEventListener("visibilitychange",onVisible);
  const timer=window.setInterval(()=>{
   const status=settings.current;
   if(!status.enabled||!status.canPrompt||document.hidden||count.current>=HUDHUD_MAX_UNANSWERED_PROMPTS)return;
   if(Date.now()-lastInteraction.current<HUDHUD_IDLE_DELAY_MS)return;
   lastInteraction.current=Date.now();
   count.current++;
   status.onPrompt(hudHudQuietReflection(count.current,status.signedIn,status.listeningAvailable),count.current);
  },1000);
  return()=>{window.clearInterval(timer);document.removeEventListener("pointerdown",pointer);document.removeEventListener("keydown",key);document.removeEventListener("visibilitychange",onVisible)};
 },[]);
 return {
  noteActivity:()=>{
   lastInteraction.current=Date.now();
   count.current=0;
  }
 };
}
