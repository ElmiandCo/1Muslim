"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {editHudHudSearchQuery} from "../lib/hudhud-search-voice-edit";
import "./search-results-hudhud-voice.css";

type RecognitionResult={isFinal:boolean;0:{transcript:string}};
type RecognitionEvent={resultIndex?:number;results:ArrayLike<RecognitionResult>};
type BrowserRecognition={
 lang:string;continuous:boolean;interimResults:boolean;
 onresult:((event:RecognitionEvent)=>void)|null;
 onerror:((event:{error:string})=>void)|null;
 onend:(()=>void)|null;
 onspeechstart:(()=>void)|null;
 onspeechend:(()=>void)|null;
 start:()=>void;stop:()=>void;abort:()=>void;
};
type SpeechWindow=Window&{SpeechRecognition?:new()=>BrowserRecognition;webkitSpeechRecognition?:new()=>BrowserRecognition};
type Props={query:string;onEdit:(value:string)=>void;onSearch:(value:string)=>void;onOpenHudHud:()=>void};

export default function SearchResultsHudHudVoice({query,onEdit,onSearch,onOpenHudHud}:Props){
 const [listening,setListening]=useState(false);
 const [hearing,setHearing]=useState(false);
 const [paused,setPaused]=useState(false);
 const [notice,setNotice]=useState("");
 const [unsupported,setUnsupported]=useState(false);
 const recognition=useRef<BrowserRecognition|null>(null);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const mounted=useRef(false);
 const pausedRef=useRef(false);
 const latest=useRef(query);latest.current=query;
 const previous=useRef<string|null>(null);
 const callbacks=useRef({onEdit,onSearch,onOpenHudHud});
 callbacks.current={onEdit,onSearch,onOpenHudHud};
 const beginRef=useRef<()=>void>(()=>{});

 const stop=useCallback(()=>{
  if(timer.current){clearTimeout(timer.current);timer.current=null}
  const rec=recognition.current;recognition.current=null;
  if(rec){
   rec.onresult=null;rec.onerror=null;rec.onend=null;rec.onspeechstart=null;rec.onspeechend=null;
   try{rec.abort()}catch{}
  }
  if(mounted.current){setListening(false);setHearing(false)}
 },[]);

 const begin=useCallback(()=>{
  if(!mounted.current||recognition.current||pausedRef.current||document.hidden)return;
  const W=window as SpeechWindow;
  const Constructor=W.SpeechRecognition||W.webkitSpeechRecognition;
  if(!Constructor){setUnsupported(true);setNotice("Voice editing is unavailable here. Type your search instead.");pausedRef.current=true;setPaused(true);return;}
  try{
   const rec=new Constructor();
   rec.lang="en-US";rec.continuous=true;rec.interimResults=true;
   rec.onspeechstart=()=>{if(mounted.current)setHearing(true)};
   rec.onspeechend=()=>{if(mounted.current)setHearing(false)};
   let processedFinal=0;
   rec.onresult=event=>{
    // Final speech segments are processed once. Interim/background noise
    // animates the visualizer but never edits or submits a query.
    for(let i=Math.max(processedFinal,event.resultIndex||0);i<event.results.length;i++){
     const item=event.results[i];
     if(!item?.isFinal)continue;
     processedFinal=i+1;
     const text=(item[0]?.transcript||"").trim();
     if(!text||text.length<2)continue;
     const before=latest.current;
     const change=editHudHudSearchQuery(text,before,previous.current);
     if(change.action==="search"){
      callbacks.current.onSearch(change.next);
      setNotice("");
     }else if(change.action==="edit"&&change.next!==before){
      previous.current=/^undo(?: that| the change)?[.!? ]*$/i.test(text)?null:before;
      latest.current=change.next;
      callbacks.current.onEdit(change.next);
      setNotice("");
     }
    }
   };
   rec.onerror=event=>{
    if(!mounted.current)return;
    setHearing(false);
    if(event.error==="no-speech"||event.error==="aborted")return;
    if(event.error==="not-allowed"||event.error==="service-not-allowed"||event.error==="audio-capture"){
     pausedRef.current=true;setPaused(true);
     setNotice("Tap the microphone to allow listening. You can still type.");
    }else if(event.error!=="network"){setNotice("Voice editing paused. Tap the microphone to retry.");pausedRef.current=true;setPaused(true);}
   };
   rec.onend=()=>{
    if(recognition.current!==rec)return;
    recognition.current=null;
    if(mounted.current){setListening(false);setHearing(false)}
    // No TTS or chimes are ever played by this controller.
    if(!pausedRef.current&&mounted.current&&!document.hidden)
     timer.current=setTimeout(()=>beginRef.current(),900);
   };
   rec.start();
   recognition.current=rec;
   setListening(true);setNotice("");
  }catch{
   pausedRef.current=true;setPaused(true);
   setNotice("Tap the microphone to start voice editing, or type your search.");
  }
 },[]);
 beginRef.current=begin;

 useEffect(()=>{
  mounted.current=true;
  const enabled=(()=>{try{return localStorage.getItem("1muslim:hudhud:auto-listen")!=="off"}catch{return false}})();
  pausedRef.current=!enabled;
  setPaused(!enabled);
  if(enabled)timer.current=setTimeout(()=>beginRef.current(),350);
  const visibility=()=>{
   if(document.hidden)stop();
   else if(!pausedRef.current)timer.current=setTimeout(()=>beginRef.current(),600);
  };
  document.addEventListener("visibilitychange",visibility);
  return()=>{document.removeEventListener("visibilitychange",visibility);mounted.current=false;stop()};
 },[stop]);
 const toggle=()=>{
  if(listening){pausedRef.current=true;setPaused(true);stop();return}
  pausedRef.current=false;setPaused(false);setUnsupported(false);setNotice("");
  beginRef.current();
 };
 const goToHudHud=()=>{
  pausedRef.current=true;stop();callbacks.current.onOpenHudHud();
 };
 return <div className={"dsHudVoiceDock"+(listening?" isListening":"")+(hearing?" isHearing":"")} aria-label="HudHud search voice">
  <button className="dsHudVoiceVisualizer" type="button" onClick={goToHudHud} aria-label="Open full HudHud assistant" title="Open HudHud">
   <span className="dsHudVoiceBars" aria-hidden="true"><i/><i/><i/><i/><i/></span>
   <span className="dsHudVoiceName" aria-hidden="true">HudHud</span>
  </button>
  <button className="dsHudVoiceMic" type="button" onClick={toggle} aria-label={listening?"Pause voice search editing":"Start voice search editing"} title={listening?"Pause listening":"Start listening"} aria-pressed={listening}>
   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"/></svg>
   <span className="dsHudVoiceDot" aria-hidden="true"/>
  </button>
  {(notice||unsupported)&&<span className="dsHudVoiceNotice" role="status">{notice}</span>}
  <span className="dsHudVoiceScreenreader" role="status" aria-live="off">{hearing?"Receiving speech":listening?"Listening for voice edits":paused?"Voice editing paused":"Voice editing idle"}</span>
 </div>;
}
