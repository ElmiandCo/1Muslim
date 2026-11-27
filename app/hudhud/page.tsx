"use client";
import "./hudhud.css";
import AnimatedMuslimBrand from "../components/AnimatedMuslimBrand";
import HudHudFocusStage,{type HudHudLine} from "./HudHudFocusStage";
import {normalizeSpokenHudHudQuestion} from "../lib/hudhud-speech";
import {createHudHudAiVoicePlayer} from "../lib/hudhud-ai-voice-player";
import {getHudHudTopWebResult} from "../lib/hudhud-top-web";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useCallback,useEffect,useRef,useState,type FormEvent} from "react";

type Line=HudHudLine;
type Session={id:string;title:string;lines:Line[]};
type RecognitionEvent={results:ArrayLike<{isFinal:boolean;0:{transcript:string}}>} ;
type Recognition={lang:string;interimResults:boolean;continuous:boolean;onresult:((event:RecognitionEvent)=>void)|null;onerror:((event:{error:string})=>void)|null;onend:(()=>void)|null;start:()=>void;stop:()=>void;abort:()=>void};
type RecognitionWindow=Window&{SpeechRecognition?:new()=>Recognition;webkitSpeechRecognition?:new()=>Recognition};
const destinations=[
 {href:"/search",label:"Search 1Muslim",symbol:"⌕"},
 {href:"/quran-library",label:"Qur’an Library",symbol:"۞"},
 {href:"/widget-tools/prayer",label:"Prayer",symbol:"◷"},
 {href:"/profile",label:"My Profile",symbol:"◉"}
];

function Glyph({name}:{name:"menu"|"settings"|"mic"|"plus"|"close"|"send"|"new"|"back"}){
 const paths={
  menu:<><path d="M5 7h14M5 15h9"/></>,
  settings:<><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="#fff"/><circle cx="16" cy="17" r="3" fill="#fff"/></>,
  mic:<><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8"/></>,
  plus:<path d="M12 4v16M4 12h16"/>,
  close:<path d="M5 5l14 14M19 5 5 19"/>,
  send:<path d="M12 19V5m-6 6 6-6 6 6"/>,
  new:<><path d="M5 17V5h12M9 19h10V9"/><path d="M14 4h6v6"/></>,
  back:<path d="m15 5-7 7 7 7"/>
 };
 return <svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export default function HudHudPage(){
 const router=useRouter();
 const [sessions,setSessions]=useState<Session[]>([{id:"first",title:"New chat",lines:[]}]);
 const [activeId,setActiveId]=useState("first");
 const [draft,setDraft]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [remaining,setRemaining]=useState<number|null>(null);
 const [unlocked,setUnlocked]=useState(false);
 const [listening,setListening]=useState(false);
 // Listening starts after microphone permission, as in the Shahada flow.
 // It can be paused at any time; mic audio is never stored by this page.
 const [autoListening,setAutoListening]=useState(true);
 useEffect(()=>{
  try{const on=localStorage.getItem("1muslim:hudhud:auto-listen")!=="off";setAutoListening(on);if(!on)setMicPaused(true)}catch{}
 },[]);
 const [micPaused,setMicPaused]=useState(false);
 const [speechPending,setSpeechPending]=useState(false);
 const [audioCooldown,setAudioCooldown]=useState(false);
 const [pageVisible,setPageVisible]=useState(true);
 const [micAccess,setMicAccess]=useState<"checking"|"granted"|"denied"|"needs-tap"|"unavailable">("checking");
 const [menuOpen,setMenuOpen]=useState(false);
 const [settingsOpen,setSettingsOpen]=useState(false);
 const [actionsOpen,setActionsOpen]=useState(false);
 const [readAloud,setReadAloud]=useState(true);
 const voicePlayer=useRef<ReturnType<typeof createHudHudAiVoicePlayer>|null>(null);
 const voiceEpoch=useRef(0);
 const audioCooldownTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{
  const read=()=>{try{setReadAloud(localStorage.getItem("1muslim:hudhud:voice-read-aloud")!=="off")}catch{}};
  read();window.addEventListener("1muslim:hudhud-voice-preference",read);
  return()=>window.removeEventListener("1muslim:hudhud-voice-preference",read);
 },[]);
 const saveVoice= (next:boolean)=>{
  setReadAloud(next);
  try{localStorage.setItem("1muslim:hudhud:voice-read-aloud",next?"on":"off")}catch{}
  if(!next){voiceEpoch.current++;voicePlayer.current?.stop();setSpeaking(false);setSpeakingAt(null);setSpeechPending(false)}
 };
 const [memoryEnabled,setMemoryEnabled]=useState(false);
 const [memorySignedIn,setMemorySignedIn]=useState(false);
 const [memoryPending,setMemoryPending]=useState(false);
 const [memoryNotice,setMemoryNotice]=useState("");
 const [speaking,setSpeaking]=useState(false);
 const [speakingAt,setSpeakingAt]=useState<{sessionId:string;index:number}|null>(null);
 const [speechChar,setSpeechChar]=useState(0);
 const [voiceBeat,setVoiceBeat]=useState(false);
 const voiceBeatTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const [exiting,setExiting]=useState(false);
 const [touchStart,setTouchStart]=useState<{x:number;y:number}|null>(null);
 const [focused,setFocused]=useState(false);
 const [queryContext,setQueryContext]=useState("");
 const [viewport,setViewport]=useState<{height:number;top:number}|null>(null);
 const recognizer=useRef<Recognition|null>(null);
 const micPermissionRequest=useRef(0);
 const input=useRef<HTMLInputElement>(null);
 const voiceTranscript=useRef("");
 const askRef=useRef<(message:string)=>void>(()=>{});
 const originRef=useRef("/search");
 const safeReturn=(s:string)=>s.startsWith("/")&&!s.startsWith("//")&&!s.startsWith("/\\")&&!s.includes("://")&&!s.startsWith("/hudhud")&&!s.startsWith("/auth")?s:"/search";
 const current=sessions.find(x=>x.id===activeId)||sessions[0];
 const lines=current.lines;
 const exhausted=remaining===0;

 const memorySave=useCallback(async(session:Session)=>{
  const response=await fetch("/api/hudhud/memory",{method:"POST",headers:{"Content-Type":"application/json"},
   body:JSON.stringify({action:"save",id:session.id,title:session.title,lines:session.lines.slice(-40)})});
  if(!response.ok)throw Error("Could not save this conversation");
 },[]);
 useEffect(()=>{
  const controller=new AbortController();
  void fetch("/api/hudhud/memory",{cache:"no-store",signal:controller.signal})
   .then(async response=>{if(!response.ok)throw Error("Memory unavailable");return response.json()})
   .then(data=>{
     if(controller.signal.aborted)return;
     setMemorySignedIn(data.signedIn===true);
     setMemoryEnabled(data.enabled===true);
     const selectedSession=new URLSearchParams(window.location.search).get("session");
     if(Array.isArray(data.sessions)&&data.sessions.length>0&&(data.enabled===true||Boolean(selectedSession))){
       const saved:Session[]=data.sessions.filter((row:unknown):row is Session=>{
         if(!row||typeof row!=="object")return false;
         const r=row as Partial<Session>;
         return typeof r.id==="string"&&typeof r.title==="string"&&Array.isArray(r.lines);
       }).slice(0,20);
       const selected=saved.find(item=>item.id===selectedSession);
       if(saved.length&&(data.enabled===true||selected)){
         setSessions(old=>old.length===1&&old[0].lines.length===0?saved:old);
         setActiveId(old=>old==="first"?(selected?.id||saved[0].id):old);
       }
     }
   }).catch(()=>{if(!controller.signal.aborted)setMemoryNotice("Account memory is temporarily unavailable.")});
  return()=>controller.abort();
 },[]);
 const updateMemory=async(enabled:boolean)=>{
  if(!memorySignedIn){setMemoryNotice("Sign in to save your conversations.");return}
  setMemoryPending(true);setMemoryNotice("");
  try{
   const response=await fetch("/api/hudhud/memory",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"preference",enabled})});
   if(!response.ok)throw Error("Could not change memory preference");
   setMemoryEnabled(enabled);
   if(enabled){
     const active=sessions.find(x=>x.id===activeId);
     if(active&&active.lines.length)await memorySave(active);
     setMemoryNotice("Your account will remember conversations.");
   }else setMemoryNotice("Memory paused. Saved chats remain until cleared.");
  }catch{setMemoryNotice("Could not update memory. Please try again.")}
  finally{setMemoryPending(false)}
 };
 const clearMemory=async()=>{
  if(!window.confirm("Delete all saved HudHud chats? This cannot be undone."))return;
  setMemoryPending(true);setMemoryNotice("");
  try{
   const response=await fetch("/api/hudhud/memory",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"clear"})});
   if(!response.ok)throw Error("Could not delete saved history");
   setMemoryEnabled(false);
   const id="chat-"+Date.now();setSessions([{id,title:"New chat",lines:[]}]);setActiveId(id);
   setMemoryNotice("Saved conversations deleted. Memory is off.");
  }catch{setMemoryNotice("Could not delete saved chats. Please try again.")}
  finally{setMemoryPending(false)}
 };
 const requestMicrophonePermission=useCallback(async()=>{
  // Ask for microphone permission on entry, just like Shahada. Recognition
  // starts only after browser permission; no raw microphone audio is saved.
  // On restrictive iOS browsers the user can use the mic button.
  const request=++micPermissionRequest.current;
  if(!navigator.mediaDevices?.getUserMedia){setMicAccess("unavailable");return}
  try{
   const stream=await navigator.mediaDevices.getUserMedia({audio:true});
   stream.getTracks().forEach(track=>track.stop());
   if(request===micPermissionRequest.current)setMicAccess("granted");
  }catch(caught){
   if(request!==micPermissionRequest.current)return;
   const name=caught instanceof Error?caught.name:"";
   setMicAccess(name==="NotAllowedError"||name==="PermissionDeniedError"?"denied":"needs-tap");
  }
 },[]);
 useEffect(()=>{
  void requestMicrophonePermission();
  return()=>{micPermissionRequest.current+=1};
 },[requestMicrophonePermission]);
 const stopVoice=useCallback((abort=false)=>{
  const rec=recognizer.current;
  recognizer.current=null;
  if(rec){rec.onend=null;rec.onerror=null;rec.onresult=null;try{if(abort)rec.abort();else rec.stop()}catch{}}
  setListening(false);
 },[]);
 useEffect(()=>{
  const controller=new AbortController();
  const params=new URLSearchParams(window.location.search);
  const incomingQuestion=(params.get("q")||"").trim().slice(0,900);
  setQueryContext(incomingQuestion.slice(0,90));
  if(incomingQuestion)setDraft(incomingQuestion);
  if(params.get("settings")==="1")setSettingsOpen(true);
  let referring="/search";
  try{const url=new URL(document.referrer);if(url.origin===window.location.origin)referring=url.pathname+url.search}catch{}
  let remembered="";
  try{remembered=sessionStorage.getItem("1muslim:hudhud:return")||""}catch{}
  const source=params.get("from")||remembered||referring;
  originRef.current=safeReturn(source);
  void fetch("/api/discover/ask",{cache:"no-store",signal:controller.signal})
   .then(async res=>{const data=await res.json();if(!res.ok)throw Error(data.error||"HudHud is unavailable");return data})
   .then(data=>{if(!controller.signal.aborted){setRemaining(typeof data.remaining==="number"?data.remaining:null);setUnlocked(Boolean(data.unlocked))}})
   .catch(()=>{if(!controller.signal.aborted)setError("Could not check HudHud availability. You can try again.")});
  return()=>controller.abort();
 },[]);
 useEffect(()=>{
  const visual=window.visualViewport;
  if(!visual)return;
  const sync=()=>setViewport({height:visual.height,top:visual.offsetTop});
  sync();visual.addEventListener("resize",sync);visual.addEventListener("scroll",sync);
  return()=>{visual.removeEventListener("resize",sync);visual.removeEventListener("scroll",sync)};
 },[]);
 useEffect(()=>{
  const onHidden=()=>{
   setPageVisible(!document.hidden);
   if(document.hidden){stopVoice(true);voiceEpoch.current++;voicePlayer.current?.stop();setSpeaking(false);setSpeakingAt(null);setSpeechPending(false)}
  };
  const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape"){setMenuOpen(false);setSettingsOpen(false);setActionsOpen(false);stopVoice(true)}};
  document.addEventListener("visibilitychange",onHidden);window.addEventListener("keydown",onKey);
  return()=>{document.removeEventListener("visibilitychange",onHidden);window.removeEventListener("keydown",onKey);stopVoice(true);voiceEpoch.current++;voicePlayer.current?.stop();if(voiceBeatTimer.current)clearTimeout(voiceBeatTimer.current);if(audioCooldownTimer.current)clearTimeout(audioCooldownTimer.current)};
 },[stopVoice]);

 const newChat=()=>{
  if(busy)return;
  stopVoice(true);voiceEpoch.current++;voicePlayer.current?.stop();setSpeaking(false);setSpeakingAt(null);setSpeechPending(false);
  const id="chat-"+Date.now();
  setSessions(old=>[{id,title:"New chat",lines:[]},...old].slice(0,20));
  setActiveId(id);setDraft("");setError("");setMenuOpen(false);setActionsOpen(false);
  input.current?.focus();
 };
 const ask=async(event?:FormEvent,spokenMessage?:string)=>{
  event?.preventDefault();
  const message=(spokenMessage||draft).trim();if(!message||busy||exhausted)return;
  stopVoice(true);voiceEpoch.current++;voicePlayer.current?.stop();setSpeaking(false);setSpeakingAt(null);setSpeechPending(false);
  const conversationId=activeId;
  const history=lines.slice(-6).map(x=>({role:x.role,content:x.content}));
  setSessions(old=>old.map(s=>s.id===conversationId?{...s,title:s.lines.length?s.title:message.slice(0,40),lines:[...s.lines,{role:"user",content:message}]}:s));
  setDraft("");setError("");setBusy(true);setActionsOpen(false);
  try{
   const response=await fetch("/api/discover/ask",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:queryContext,message,history})});
   const data=await response.json();
   if(typeof data.remaining==="number")setRemaining(data.remaining);
   if(data.unlocked)setUnlocked(true);
   if(!response.ok)throw Error(data.error||"HudHud could not reply.");
   const reply=String(data.reply||"").trim();
   if(!reply)throw Error("HudHud sent an empty reply.");
   const assistantLine:Line={role:"assistant",content:reply,matches:Array.isArray(data.matches)?data.matches:[],presentation:data.presentation,verses:Array.isArray(data.verses)?data.verses:[],images:Array.isArray(data.images)?data.images.slice(0,1):[]};
   const savedSession:Session={id:conversationId,title:current.lines.length?current.title:message.slice(0,40),lines:[...lines,({role:"user",content:message} satisfies Line),assistantLine].slice(-40)};
   setSessions(old=>old.map(s=>s.id===conversationId?savedSession:s));
   if(memoryEnabled&&memorySignedIn)void memorySave(savedSession).catch(()=>setMemoryNotice("Could not save this reply. Try again later."));
   // A useful independent website can join the current answer without
   // delaying HudHud's response, audio, or the existing smooth animation.
   // Never append irrelevant search links to a verse, photo or greeting.
   const isDirectPresentation=data.presentation?.kind==="verse"||data.presentation?.kind==="image";
   const isGreeting=/^(hi|hello|hey|salaam|salam|thanks|thank you)[!.,? ]*$/i.test(message);
   if(!isDirectPresentation&&!isGreeting&&message.length>=4){
    void getHudHudTopWebResult(message).then(webResult=>{
      if(!webResult)return;
      setSessions(old=>old.map(session=>session.id!==conversationId?session:{
       ...session,lines:session.lines.map((line,index)=>index===lines.length+1&&line.role==="assistant"
        &&line.content===reply?{...line,webResult}:line)
      }));
    }).catch(()=>{});
   }
   if(readAloud){
    // Suspend recognition BEFORE audio generation; release only after playback
    // and a 1.4s acoustic tail, so HudHud cannot answer its own voice.
    stopVoice(true);
    const epoch=++voiceEpoch.current;
    const target={sessionId:conversationId,index:lines.length+1};
    setSpeechPending(true);setSpeaking(false);setSpeakingAt(null);
    const player=voicePlayer.current||(voicePlayer.current=createHudHudAiVoicePlayer());
    void player.play(reply,()=>{
     if(epoch!==voiceEpoch.current)return;
     setSpeechPending(false);setSpeaking(true);setSpeakingAt(target);setSpeechChar(0);
    }).then(played=>{
     if(epoch!==voiceEpoch.current)return;
     setSpeechPending(false);setSpeaking(false);setSpeakingAt(null);setVoiceBeat(false);
     setAudioCooldown(true);
     if(audioCooldownTimer.current)clearTimeout(audioCooldownTimer.current);
     audioCooldownTimer.current=setTimeout(()=>setAudioCooldown(false),1400);
     if(!played)setError("HudHud's AI voice is temporarily unavailable. You can still read the answer.");
    });
   }
  }catch(caught){
   setSpeechPending(false);
   setSessions(old=>old.map(s=>s.id===conversationId?{...s,lines:s.lines.slice(0,-1)}:s));
   setDraft(message);
   setError(caught instanceof Error?caught.message:"HudHud is unavailable. Please try again.");
  }finally{setBusy(false)}
 };
 askRef.current=(message:string)=>{void ask(undefined,message)};
 const startVoice=useCallback((mode:"auto"|"manual"="manual")=>{
  // Manual mic button toggles a real pause. Automatic listening only starts
  // with permission, while the page is visible and no voice reply is active.
  if(recognizer.current){if(mode==="manual"){setMicPaused(true);stopVoice(true)}return}
  if(mode==="manual")setMicPaused(false);
  if(busy||exhausted||focused||speaking||speechPending||audioCooldown||document.hidden)return;
  const host=window as RecognitionWindow;
  const Voice=host.SpeechRecognition||host.webkitSpeechRecognition;
  if(!Voice){
   setMicAccess("unavailable");
   if(mode==="manual")setError("Voice recognition is not supported in this browser. You can type your question.");
   return;
  }
  try{
   const rec=new Voice();
   const prefix=mode==="manual"?draft.trim():"";
   voiceTranscript.current="";
   rec.lang="en-US";rec.interimResults=true;rec.continuous=false;
   let completed=false;
   rec.onresult=event=>{
    let transcript="",hasFinal=false;
    for(let i=0;i<event.results.length;i++){
     transcript+=(event.results[i][0]?.transcript||"")+" ";
     if(event.results[i].isFinal)hasFinal=true;
    }
    const normalized=normalizeSpokenHudHudQuestion((prefix?prefix+" ":"")+transcript.trim());
    voiceTranscript.current=normalized;
    setDraft(normalized);
    // A complete utterance should send once, without requiring the user to tap.
    if(hasFinal&&!completed&&normalized.length>2){
     completed=true;
     try{rec.stop()}catch{}
    }
   };
   rec.onerror=event=>{
    if(recognizer.current!==rec)return;
    recognizer.current=null;setListening(false);
    if(event.error==="aborted"||event.error==="no-speech")return;
    // Avoid infinite permission loops when Safari requires another tap.
    if(event.error==="not-allowed"||event.error==="service-not-allowed"){
     setMicAccess("needs-tap");setMicPaused(true);
     setError("Speech recognition needs microphone permission. Tap the mic to try again.");
    }else if(event.error==="audio-capture"){
     setMicAccess("denied");setMicPaused(true);
     setError("The microphone is unavailable. Check browser settings or type your question.");
    }else{
     setMicPaused(true);
     setError("Voice recognition stopped. Tap the mic or type your question.");
    }
   };
   rec.onend=()=>{
    if(recognizer.current!==rec)return;
    recognizer.current=null;setListening(false);
    const text=normalizeSpokenHudHudQuestion(voiceTranscript.current.trim());
    if(text.length>2)window.setTimeout(()=>askRef.current(text),130);
    // An empty utterance is retried by the auto-listen effect, subject to
    // permission and pause controls. No empty API calls are made.
   };
   rec.start();recognizer.current=rec;setListening(true);setError("");
  }catch{
   setListening(false);
   // iOS may reject programmatic SpeechRecognition.start without a gesture.
   // Keep typed questions usable and provide a manual start instead of looping.
   setMicPaused(true);setMicAccess("needs-tap");
   setError("Tap the microphone to enable speech recognition, or type your question.");
  }
 },[busy,exhausted,focused,speaking,speechPending,audioCooldown,draft,stopVoice]);
 useEffect(()=>{
  if(!autoListening||micPaused||micAccess!=="granted"||audioCooldown||!pageVisible||
     listening||busy||speaking||speechPending||exhausted||focused||exiting||
     menuOpen||settingsOpen||draft.trim()||recognizer.current)return;
  const timer=setTimeout(()=>startVoice("auto"),350);
  return()=>clearTimeout(timer);
 },[autoListening,micPaused,micAccess,audioCooldown,pageVisible,listening,busy,speaking,speechPending,
    exhausted,focused,exiting,menuOpen,settingsOpen,draft,startVoice]);
 const close=()=>{
  setMicPaused(true);stopVoice(true);voiceEpoch.current++;voicePlayer.current?.stop();setSpeaking(false);setSpeakingAt(null);setSpeechPending(false);setExiting(true);
  window.setTimeout(()=>router.push(safeReturn(originRef.current)),180);
 };

 return <main onTouchStart={event=>{
    const t=event.target as HTMLElement;
    if(t.closest("input,.hudFocusSurface,.hudHistoryOverlay,.hudMatches,.hudDrawer,.hudActionPop"))return;
    setTouchStart({x:event.touches[0]?.clientX||0,y:event.touches[0]?.clientY||0});
   }} onTouchEnd={event=>{
    if(!touchStart)return;
    const dx=(event.changedTouches[0]?.clientX||0)-touchStart.x;
    const dy=(event.changedTouches[0]?.clientY||0)-touchStart.y;
    setTouchStart(null);if(dx< -100&&Math.abs(dy)<65)close();
   }} className={"hudPage"+(exiting?" hudExiting":"")+(speaking?" hudSpeaking":"")+(voiceBeat?" hudVoiceBeat":"")+(focused?" hudTyping":"")+(listening?" hudListening":"")+(busy?" hudThinking":"")} style={viewport?{height:viewport.height,top:viewport.top}:undefined} aria-label="HudHud chat">
  <header className="hudHeader">
   <div className="hudBrandSlot">
    <button className="hudBackBrand" type="button" aria-label="Return to previous page" onClick={close}><AnimatedMuslimBrand/><span className="hudBrandSuffix">.Live</span></button>
   </div>
   <div className="hudTitle" aria-label="HudHud — 1Muslim voice assistant">HudHud</div>
   <div className="hudHeaderActions"><button className="hudCircle" type="button" aria-label={readAloud?"Mute HudHud voice":"Enable HudHud voice"} aria-pressed={readAloud} onClick={()=>saveVoice(!readAloud)}>
    <svg viewBox="0 0 24 24" width="19" height="19" stroke="currentColor" fill="none" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4"/>{readAloud?<path d="M16 8q4 4 0 8M18 5q7 7 0 14"/>:<path d="m16 9 5 6m0-6-5 6"/>}</svg>
   </button><button className="hudCircle" type="button" aria-label="HudHud menu" aria-expanded={menuOpen} onClick={()=>{setMenuOpen(true);setSettingsOpen(false)}}><Glyph name="menu"/></button><button className="hudCircle" type="button" aria-label="HudHud settings" aria-expanded={settingsOpen} onClick={()=>{setSettingsOpen(!settingsOpen);setMenuOpen(false)}}><Glyph name="settings"/></button></div>
  </header>

  <section className={"hudMain"+(lines.length?" hudHasChat":"")} aria-label="Conversation">
   <HudHudFocusStage lines={lines} sessionId={activeId} busy={busy} speakingAt={speakingAt} speechChar={speechChar}/>
  </section>

  {error&&<p className="hudError" role="alert">{error}</p>}
  {exhausted&&<aside className="hudUpgrade"><strong>Your HudHud exploration is complete for now.</strong><Link href="/search">Explore 1Muslim Search ↗</Link></aside>}
  <div className="hudComposerArea">
   {listening&&<span className="hudListeningStatus" role="status"><i aria-hidden="true"/>Listening…</span>}
   {queryContext&&<span className="hudContext">Searching for: {queryContext}</span>}
   <form className="hudComposer" onSubmit={ask}>
    <div className="hudInputPill">
     <button className="hudPlus" type="button" aria-label="More HudHud actions" aria-expanded={actionsOpen} onClick={()=>setActionsOpen(!actionsOpen)}><Glyph name="plus"/></button>
     <input ref={input} type="text" inputMode="text" value={draft} maxLength={900} autoComplete="off" aria-label="Ask HudHud" placeholder={exhausted?"Explore search instead":"Ask HudHud"} onFocus={()=>{setFocused(true);stopVoice(true)}} onBlur={()=>setFocused(false)} onChange={event=>setDraft(event.target.value)} disabled={busy||exhausted}/>
    </div>
    {draft.trim()&&!exhausted?<button className="hudMic hudSend" aria-label="Send question" type="submit" disabled={busy}><Glyph name="send"/></button>:<button className={"hudMic"+(listening?" isActive":"")} type="button" aria-label={listening?"Pause HudHud listening":micPaused?"Resume HudHud listening":"Start listening"} aria-pressed={listening} onClick={()=>startVoice("manual")} disabled={busy||exhausted}><Glyph name="mic"/></button>}
    <button className="hudEnd" type="button" aria-label="Close HudHud" onClick={close}><Glyph name="close"/></button>
   </form>
   {(micAccess==="denied"||micAccess==="needs-tap"||micAccess==="unavailable")&&<div className="hudMicAccessHint" role="status">
    <span>{micAccess==="unavailable"?"Microphone access is unavailable here. You can still type.":micAccess==="denied"?"Microphone access is blocked. Allow it in your browser settings, or type instead.":"Tap to allow microphone access. You can still type."}</span>
    {micAccess!=="unavailable"&&<button type="button" onClick={()=>void requestMicrophonePermission()}>Enable mic</button>}
   </div>}
  </div>

  {actionsOpen&&<div className="hudActionPop" role="menu" aria-label="HudHud shortcuts">
    {destinations.map(item=><Link key={item.href} href={item.href} role="menuitem"><span aria-hidden="true">{item.symbol}</span>{item.label}</Link>)}
   </div>}
  {settingsOpen&&<div className="hudSettings" role="dialog" aria-label="HudHud settings">
    <h2>HudHud settings</h2>
    <label><span>Read replies aloud<small>Uses your browser's voice</small></span><input type="checkbox" checked={readAloud} onChange={e=>saveVoice(e.target.checked)}/></label>
    <label><span>Auto-listen<small>Start after permission; pauses while HudHud speaks or you type. Browser recognition may process audio; HudHud does not store raw audio.</small></span><input type="checkbox" checked={autoListening} onChange={e=>{setAutoListening(e.target.checked);setMicPaused(!e.target.checked);try{localStorage.setItem("1muslim:hudhud:auto-listen",e.target.checked?"on":"off")}catch{}if(!e.target.checked)stopVoice(true)}}/></label>
    <div className="hudMicSettings"><span>Microphone access<small>{micAccess==="granted"?(autoListening&&!micPaused?"Allowed · auto-listening is on":"Allowed · tap microphone to speak"):micAccess==="checking"?"Checking browser permission…":"Not enabled · you can still type"}</small></span><button type="button" onClick={()=>void requestMicrophonePermission()}>Enable mic</button></div>
    {memorySignedIn?<><label><span>Remember conversations<small>Private to your account. Off by default.</small></span><input type="checkbox" checked={memoryEnabled} disabled={memoryPending} onChange={e=>void updateMemory(e.target.checked)}/></label>
      <button type="button" disabled={memoryPending} onClick={()=>void clearMemory()}>Clear saved conversations</button></>
      :<p>Sign in to enable private conversation memory. Guest chats are temporary.</p>}
    <Link href="/settings#hudhud-ai" className="hudSettingsControlLink">Open HudHud AI Control Center ↗</Link>
    <p>With auto-listen enabled, HudHud can listen on this page after permission. Browser speech recognition does not guarantee persistent listening across other pages.</p>
    {memoryNotice&&<p role="status">{memoryNotice}</p>}
    <button type="button" onClick={()=>setSettingsOpen(false)}>Close settings</button>
   </div>}
  {menuOpen&&<div className="hudDrawerCover" onMouseDown={e=>{if(e.target===e.currentTarget)setMenuOpen(false)}}>
    <aside className="hudDrawer" role="dialog" aria-modal="true" aria-label="HudHud menu">
     <div className="hudDrawerTop"><strong>HudHud</strong><button type="button" aria-label="Close menu" onClick={()=>setMenuOpen(false)}><Glyph name="close"/></button></div>
     <button className="hudNewChat" type="button" onClick={newChat} disabled={busy}><Glyph name="new"/> New chat</button>
      <button className="hudNewChat" type="button" disabled={!lines.length} onClick={()=>{setMenuOpen(false);window.dispatchEvent(new Event("1muslim:hudhud-show-history"))}}>↓ Previous answers</button>
     <nav aria-label="1Muslim destinations">{destinations.map(item=><Link href={item.href} key={item.href}><span aria-hidden="true">{item.symbol}</span>{item.label}</Link>)}</nav>
     <h2>{memoryEnabled?"Your conversations":"This visit"}</h2>
     <div className="hudSessionList">{sessions.map(s=><button type="button" key={s.id} className={s.id===activeId?"isActive":""} onClick={()=>{setActiveId(s.id);setMenuOpen(false)}}><span>{s.title}</span></button>)}</div>
     <p>{memoryEnabled?"Saved privately to your account. Clear them in settings.":"Chats here are temporary unless you enable account memory in settings."}</p>
    </aside>
   </div>}
 </main>;
}
