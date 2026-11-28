"use client";
import {useEffect,useState} from "react";

type Props={
 message:string;
 state:"checking"|"ready"|"permission"|"listening"|"recognized"|"saving"|"unavailable"|"complete";
 seconds:number;
 heardSpeech:boolean;
};
function phrase(text:string,limit=240){
 return text.replace(/\s+/g," ").trim().slice(0,limit);
}

/** A presentation-only companion to the animated Search Home typewriter.
 * This is deliberately NOT an input: nobody can accidentally search instead
 * of completing Shahada, and the recording/verification remains separate.
 */
export default function HudHudShahadaGuide({message,state,seconds,heardSpeech}:Props){
 const [typed,setTyped]=useState("");
 const text=phrase(message||(
  state==="checking"?"As-salamu alaykum. I'm HudHud. Preparing your Shahada.":
  state==="permission"?"Allow microphone access so I can listen.":
  state==="listening"?(heardSpeech?"I can hear you. Continue your Shahada.":"I'm listening. Begin whenever you're ready."):
  state==="recognized"?"MashaAllah. Your Shahada was recognized.":
  state==="saving"?"I'll save your Shahada securely.":
  state==="complete"?"As-salamu alaykum. Welcome to 1Muslim.":
  state==="unavailable"?"I'm here to help. Try again, or open Help.":
  "As-salamu alaykum. I'm HudHud. Ready when you are."
 ));
 useEffect(()=>{
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduced){setTyped(text);return;}
  setTyped("");
  let count=0;
  const id=window.setInterval(()=>{
   count=Math.min(text.length,count+1);
   setTyped(text.slice(0,count));
   if(count>=text.length)window.clearInterval(id);
  },Math.max(15,Math.min(36,2400/Math.max(1,text.length))));
  return()=>window.clearInterval(id);
 },[text]);
 const words=text.split(/\s+/).filter(Boolean).length;
 const scale=words<=4?"isShort":words<=12?"isMedium":"isLong";
 return <div className="hudV2GuideCard" aria-label="HudHud Shahada guidance">
  <div className="hudV2GuideTop"><span className="hudV2GuideBrand">HudHud</span>
   <span className="hudV2GuideMode" aria-label="This is guidance, not an interactive search">GUIDANCE</span>
  </div>
  <div className={"hudV2GuideTypewriter "+scale} role="status" aria-live="polite" aria-atomic="true">
   <span className="hudV2ScreenReaderOnly">{text}</span>
   <span aria-hidden="true" dir="auto">{typed}<span className={"hudV2TypeCaret"+(typed.length>=text.length?" isDone":"")}/></span>
  </div>
  <div className="hudV2GuideFoot" aria-live="off">
   {state==="listening"?<span className="hudV2GuideRecording"><span className="hudV2LiveDot" aria-hidden="true"/>Recording · {seconds}s</span>:
    state==="permission"?<span>Waiting for microphone permission</span>:
    state==="recognized"||state==="complete"?<span>Shahada recognized</span>:
    state==="saving"?<span>Securing your recording…</span>:
    <span>Shahada guidance</span>}
  </div>
 </div>;
}
