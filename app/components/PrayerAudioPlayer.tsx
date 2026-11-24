"use client";
import {useEffect,useRef,useState} from "react";
import type {SalahStep} from "./PrayerEducationData";

// Stream Qur'an recitation directly from the documented Al Quran Cloud CDN.
// Other Salah phrases use a device voice until verified recordings are supplied.
const QURAN_RECORDINGS:Record<string,string>={
 qiyam:"https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/1.mp3",
 surah:"https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/112.mp3"
};
type PlayerState="idle"|"starting"|"playing";
type AudioMode="recorded"|"device";
const clock=(value:number)=>{
 const safe=Number.isFinite(value)?Math.max(0,Math.floor(value)):0;
 return Math.floor(safe/60)+":"+String(safe%60).padStart(2,"0");
};

export default function PrayerAudioPlayer({step}:{step:SalahStep}){
 const recordings=useRef<Map<string,HTMLAudioElement>>(new Map());
 const voice=useRef<SpeechSynthesisVoice|null>(null);
 const speech=useRef<SpeechSynthesisUtterance|null>(null);
 const activeStep=useRef<string|null>(null);
 const fallback=useRef<Set<string>>(new Set());
 const delayedTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const [status,setStatus]=useState<PlayerState>("idle");
 const [mode,setMode]=useState<AudioMode>("device");
 const [elapsed,setElapsed]=useState(0);
 const [duration,setDuration]=useState(0);
 const [slowLoad,setSlowLoad]=useState(false);
 const [message,setMessage]=useState("");

 const clearSlowTimer=()=>{
  if(delayedTimer.current){clearTimeout(delayedTimer.current);delayedTimer.current=null;}
 };
 const stop=(clearUI=true)=>{
  activeStep.current=null;
  clearSlowTimer();
  recordings.current.forEach(audio=>{audio.pause();try{audio.currentTime=0;}catch{}});
  if(speech.current&&typeof window!=="undefined"&&"speechSynthesis" in window){
   window.speechSynthesis.cancel();
  }
  speech.current=null;
  if(clearUI){setStatus("idle");setElapsed(0);setDuration(0);setSlowLoad(false);}
 };

 useEffect(()=>{
  let live=true;
  const synth=typeof window!=="undefined"?window.speechSynthesis:undefined;
  const warmVoice=()=>{
   if(!live||!synth)return;
   const voices=synth.getVoices();
   voice.current=voices.find(v=>v.lang.toLowerCase().startsWith("ar-"))||
    voices.find(v=>v.lang.toLowerCase()==="ar")||null;
  };
  warmVoice();
  synth?.addEventListener?.("voiceschanged",warmVoice);
  return()=>{
   live=false;
   synth?.removeEventListener?.("voiceschanged",warmVoice);
   clearSlowTimer();
   recordings.current.forEach(audio=>{audio.pause();audio.removeAttribute("src");audio.load();});
   recordings.current.clear();
   if(speech.current&&synth)synth.cancel();
   speech.current=null;
   activeStep.current=null;
  };
 },[]);

 useEffect(()=>{
  // A new step always starts clean; never play the previous step underneath it.
  stop();
  setMessage("");
  // No playback starts without a user tap.
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[step.id]);

 const speak=(item:SalahStep)=>{
  if(typeof window==="undefined"||!("speechSynthesis" in window)){
   setMessage("Your browser does not support an Arabic device voice.");
   setStatus("idle");return;
  }
  const synth=window.speechSynthesis;
  const utterance=new SpeechSynthesisUtterance(item.arabic.replaceAll("۞","،"));
  utterance.lang="ar-SA";
  utterance.rate=.78;
  utterance.pitch=1;
  if(voice.current)utterance.voice=voice.current;
  speech.current=utterance;
  activeStep.current=item.id;
  setMode("device");
  setElapsed(0);setDuration(0);setSlowLoad(false);
  setMessage(voice.current?"":"Device voice selected. Pronunciation is computer-generated, not a named reciter.");
  // Both resume and speak are called within the original tap gesture on iOS.
  utterance.onstart=()=>{
   if(speech.current===utterance)setStatus("playing");
  };
  utterance.onend=()=>{
   if(speech.current!==utterance)return;
   speech.current=null;activeStep.current=null;setStatus("idle");
  };
  utterance.onerror=event=>{
   if(speech.current!==utterance)return;
   speech.current=null;activeStep.current=null;setStatus("idle");
   if(event.error!=="canceled"&&event.error!=="interrupted")
    setMessage("Device Arabic voice could not start. Try again or check your speech settings.");
  };
  setStatus("starting");
  try{
   synth.resume();
   synth.speak(utterance);
  }catch{
   speech.current=null;activeStep.current=null;
   setStatus("idle");
   setMessage("Device voice could not start on this device.");
  }
 };

 const getRecording=(id:string)=>{
   const url=QURAN_RECORDINGS[id];
   if(!url||fallback.current.has(id))return;
   const existing=recordings.current.get(id);
   if(existing)return existing;
   const audio=new Audio();
   audio.preload="none";
   audio.addEventListener("playing",()=>{
    if(activeStep.current!==id)return;
    clearSlowTimer();
    setSlowLoad(false);
    setStatus("playing");
   });
   audio.addEventListener("timeupdate",()=>{
    if(activeStep.current===id)setElapsed(audio.currentTime);
   });
   audio.addEventListener("loadedmetadata",()=>{
    if(activeStep.current===id)setDuration(Number.isFinite(audio.duration)?audio.duration:0);
   });
   audio.addEventListener("ended",()=>{
    if(activeStep.current!==id)return;
    activeStep.current=null;
    setStatus("idle");
    setElapsed(0);
   });
   audio.addEventListener("error",()=>{
    if(activeStep.current!==id)return;
    clearSlowTimer();
    fallback.current.add(id);
    activeStep.current=null;
    setStatus("idle");
    setMode("device");
    setSlowLoad(false);
    setMessage("Recording unavailable. Tap Hear Arabic to use your device voice instead.");
   });
   recordings.current.set(id,audio);
   audio.src=url;
   return audio;
 };

 const play=()=>{
  if(status!=="idle"){stop();setMessage("");return;}
  stop();
  setMessage("");
  window.dispatchEvent(new Event("1muslim:audio-focus"));
  const audio=getRecording(step.id);
  if(audio){
   activeStep.current=step.id;
   setMode("recorded");
   setStatus("starting");
   setElapsed(0);
   setDuration(Number.isFinite(audio.duration)?audio.duration:0);
   setSlowLoad(false);
   try{audio.currentTime=0;}catch{}
   delayedTimer.current=setTimeout(()=>{
    if(activeStep.current===step.id&&audio.paused)setSlowLoad(true);
   },1100);
   // This call is synchronous inside the tap handler: iOS keeps user activation.
   void audio.play().catch(()=>{
    if(activeStep.current!==step.id)return;
    clearSlowTimer();
    fallback.current.add(step.id);
    activeStep.current=null;
    setMode("device");setStatus("idle");setSlowLoad(false);
    setMessage("Recording unavailable. Tap again to play with your device's Arabic voice.");
   });
  }else speak(step);
 };
 const switchToDevice=()=>{
  fallback.current.add(step.id);
  stop();
  setMessage("");
  window.dispatchEvent(new Event("1muslim:audio-focus"));
  speak(step);
 };
 const hasRecording=!!QURAN_RECORDINGS[step.id]&&!fallback.current.has(step.id);
 const label=hasRecording?"Mishary Rashid Alafasy · recorded Qur’an":"Device Arabic voice · pronunciation aid";
 const active=status!=="idle";
 const progress=duration>0&&mode==="recorded"?Math.min(100,Math.max(0,elapsed/duration*100)):0;

 return <div className="prayerAudioDock">
  <button type="button" className="prayerAudioControl" onClick={play}
   aria-pressed={active} aria-label={active?"Stop Arabic playback":"Play Arabic for "+step.title}>
   <span className="prayerAudioToggle" aria-hidden="true">{active?"■":"▶"}</span>
   <span className={"prayerAudioBars"+(status==="playing"?" playing":"")} aria-hidden="true"><i/><i/><i/><i/><i/></span>
   <span className="prayerAudioTexts">
    <strong>{status==="starting"?"Starting audio…":status==="playing"?"Playing Arabic":"Hear Arabic"}</strong>
    <small>{mode==="recorded"&&active?label:hasRecording?label:"Device Arabic voice · pronunciation aid"}</small>
   </span>
   <span className="prayerAudioClock" aria-hidden="true">{mode==="recorded"&&duration>0?clock(elapsed)+" / "+clock(duration):active?"Stop ↗":"Listen"}</span>
  </button>
  {mode==="recorded"&&duration>0&&<div className="prayerAudioTrack" role="progressbar"
   aria-label="Recitation progress" aria-valuemin={0} aria-valuemax={Math.round(duration)}
   aria-valuenow={Math.round(elapsed)}><span style={{width:progress+"%"}}/></div>}
  {slowLoad&&status==="starting"&&<button type="button" className="prayerAudioFallback" onClick={switchToDevice}>
    Audio taking too long? Hear the device voice now →
  </button>}
  {message&&<p className="prayerAudioMessage" role="status">{message}</p>}
 </div>;
}
