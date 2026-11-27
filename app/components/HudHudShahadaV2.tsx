"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "../../utils/supabase/client";
import HudHudOrb from "./HudHudOrb";
import {hasShahada,SHAHADA_ARABIC,SHAHADA_ENGLISH,type ShahadaLanguage} from "../lib/shahada-recognition";
import "./hudhud-shahada-v2.css";

type WebRecognition={
 lang:string;continuous:boolean;interimResults:boolean;
 start:()=>void;stop:()=>void;abort:()=>void;
 onresult:((event:{results:ArrayLike<{0:{transcript:string}}>} )=>void)|null;
 onerror:((event:{error:string})=>void)|null;
 onend:(()=>void)|null;
};
type Status="checking"|"ready"|"permission"|"listening"|"recognized"|"saving"|"help"|"unavailable"|"complete";
type Props={embedded?:boolean;returnTo?:string;onComplete?:()=>void;onExit?:()=>void};
function safeDestination(value:string){
 return value.startsWith("/")&&!value.startsWith("//")&&!value.startsWith("/\\")&&!value.includes("://")&&!value.startsWith("/auth")?value:"/search";
}
export default function HudHudShahadaV2({embedded=false,returnTo="/search",onComplete,onExit}:Props){
 const router=useRouter();
 const [state,setState]=useState<Status>("checking");
 const [language,setLanguage]=useState<ShahadaLanguage>("ar");
 const [message,setMessage]=useState("");
 const [transcript,setTranscript]=useState("");
 const [muted,setMuted]=useState(false);
 const [spoken,setSpoken]=useState(false);
 const [level,setLevel]=useState(0);
 const [seconds,setSeconds]=useState(60);
 const [manual,setManual]=useState(false);
 const [terms,setTerms]=useState(false);
 const [heardError,setHeardError]=useState(false);
 const [speaking,setSpeaking]=useState(false);
 const session=useRef<{stream:MediaStream;recorder:MediaRecorder;recognition:WebRecognition|null;meter:AudioContext|null;frame:number;chunks:BlobPart[]}|null>(null);
 const active=useRef(false),done=useRef(false),recognized=useRef(false),startedAt=useRef(0);
 const timer=useRef<ReturnType<typeof setInterval>|null>(null);
 const reminders=useRef<Array<ReturnType<typeof setTimeout>>>([]);
 const voiceRef=useRef<(()=>Promise<void>)|null>(null);
 const saved=useRef(false),mounted=useRef(true),userId=useRef("");
 const stopGuidance=()=>{try{window.speechSynthesis?.cancel()}catch{};setSpeaking(false)};
 const guide=useCallback((sentence:string)=>{
  if(muted||document.hidden||!("speechSynthesis" in window))return;
  try{
   window.speechSynthesis.cancel();
   const u=new SpeechSynthesisUtterance(sentence);
   u.lang="en-US";u.rate=1.06;u.pitch=1;u.volume=.75;
   u.onstart=()=>{if(mounted.current)setSpeaking(true)};
   u.onend=()=>{if(mounted.current)setSpeaking(false)};
   u.onerror=()=>{if(mounted.current)setSpeaking(false)};
   window.speechSynthesis.speak(u);
  }catch{setSpeaking(false)}
 },[muted]);
 const resetTimers=()=>{
  if(timer.current){clearInterval(timer.current);timer.current=null}
  reminders.current.forEach(clearTimeout);reminders.current=[];
 };
 const stop=useCallback((accept=false)=>{
  if(!active.current)return;
  active.current=false;recognized.current=accept;
  resetTimers();
  const s=session.current;if(!s)return;
  if(s.frame)cancelAnimationFrame(s.frame);
  if(s.meter)void s.meter.close().catch(()=>{});
  try{s.recognition?.abort()}catch{}
  s.recognition=null;
  // Stop recorder first: onstop assembles the full, untrimmed recording.
  if(s.recorder.state!=="inactive"){try{s.recorder.stop()}catch{}}
  s.stream.getTracks().forEach(t=>t.stop());
  setLevel(0);
 },[]);
 const finalize=useCallback(async(method:"speech-recognition-semantic-match"|"self-attested-checkbox",clip?:Blob)=>{
  if(saved.current)return;saved.current=true;setState("saving");setMessage("Saving your Shahada securely…");
  const db=createClient();
  try{
   const {data:{user},error:userError}=await db.auth.getUser();
   if(userError||!user)throw Error("Your session needs to be refreshed. Sign in and try again.");
   let path:string|null=null;
   if(method==="speech-recognition-semantic-match"){
    if(!clip?.size)throw Error("We couldn't capture your audio. Please try again.");
    const ext=clip.type.includes("mp4")?"m4a":clip.type.includes("wav")?"wav":"webm";
    path=user.id+"/shahada-"+Date.now()+"."+ext;
    const {error}=await db.storage.from("shahada-safe-vault").upload(path,clip,{upsert:false,contentType:clip.type||"audio/webm"});
    if(error)throw Error("Recording couldn't be securely saved. Please try again.");
   }
   const record:Record<string,string|null>={
    shahada_verified_at:new Date().toISOString(),shahada_verification_method:method,
    shahada_language:language
   };
   if(path){record.shahada_audio_path=path;record.shahada_audio_recorded_at=new Date().toISOString()}
   const {error:updateError}=await db.from("profiles").update(record).eq("id",user.id);
   if(updateError){
    if(path)await db.storage.from("shahada-safe-vault").remove([path]);
    throw Error("Couldn't complete your verification. Please try again.");
   }
   // Never strand a verified member on an unrelated badge-service failure.
   try{await db.rpc("award_profile_badge",{p_badge_key:"shahadah",p_badge_name:"Shahada Verified",p_description:"Completed Shahada verification during onboarding."})}catch{}
   if(!mounted.current)return;
   setState("complete");setMessage("Shahada recognized");
   try{sessionStorage.setItem("1muslim:shahada-welcome","yes")}catch{}
   window.dispatchEvent(new Event("1muslim:profile-saved"));
   window.setTimeout(()=>{
    if(!mounted.current)return;
    if(onComplete){onComplete();return}
    let next=returnTo;
    try{next=sessionStorage.getItem("1muslim:auth-return")||returnTo;sessionStorage.removeItem("1muslim:auth-return")}catch{}
    router.replace(safeDestination(next));
   },600);
  }catch(e){
   if(!mounted.current)return;
   saved.current=false;setMessage(e instanceof Error?e.message:"Couldn't save your Shahada. Please retry.");
   setState("unavailable");
  }
 },[language,onComplete,returnTo,router]);
 const finalizeRef=useRef(finalize);finalizeRef.current=finalize;
 useEffect(()=>{
  mounted.current=true;let activeComponent=true;
  (async()=>{
   const db=createClient();const {data:{user}}=await db.auth.getUser();
   if(!activeComponent)return;
   if(!user){setState("unavailable");setMessage("Please sign in before Shahada verification.");return}
   userId.current=user.id;
   const {data:profile}=await db.from("profiles").select("shahada_verified_at").eq("id",user.id).maybeSingle();
   if(!activeComponent)return;
   if(profile?.shahada_verified_at){setState("complete");setMessage("You're already verified.");
    window.setTimeout(()=>{if(!mounted.current)return;if(onComplete)onComplete();else router.replace(safeDestination(returnTo))},420);
    return;
   }
   setState("ready");
   // Request automatically on arrival. iOS Safari may require a direct tap;
   // the same orb then provides the gesture-gated retry without a popup.
   const id=setTimeout(()=>{if(activeComponent)void voiceRef.current?.()},160);
   reminders.current.push(id);
  })().catch(()=>{if(activeComponent){setState("unavailable");setMessage("We couldn't prepare HudHud. Please refresh or retry.")}});
  return()=>{
   activeComponent=false;mounted.current=false;
   stop(false);resetTimers();try{window.speechSynthesis?.cancel()}catch{}
  };
 // The session initializer must run once; language changes restart by choice.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);
 const begin=useCallback(async()=>{
  if(active.current||saved.current||!userId.current)return;
  setHeardError(false);setTranscript("");setSeconds(60);setState("permission");setMessage("");
  const navigatorMedia=navigator.mediaDevices;
  if(!navigatorMedia?.getUserMedia||typeof MediaRecorder==="undefined"){
   setState("unavailable");setMessage("Microphone recording isn't available here. Tap Help for a written declaration.");return;
  }
  let granted:MediaStream|null=null;
  try{
   const stream=await navigatorMedia.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
   granted=stream;
   if(!mounted.current){stream.getTracks().forEach(t=>t.stop());return}
   const mime=["audio/mp4","audio/webm;codecs=opus","audio/webm"].find(x=>MediaRecorder.isTypeSupported(x));
   const recorder=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);
   const s={stream,recorder,recognition:null as WebRecognition|null,meter:null as AudioContext|null,frame:0,chunks:[] as BlobPart[]};
   session.current=s;active.current=true;done.current=false;recognized.current=false;startedAt.current=Date.now();
   recorder.ondataavailable=e=>{if(e.data.size)s.chunks.push(e.data)};
   recorder.onstop=()=>{
    s.stream.getTracks().forEach(t=>t.stop());
    if(session.current===s)session.current=null;
    if(recognized.current&&mounted.current){
     const blob=new Blob(s.chunks,{type:recorder.mimeType||mime||"audio/webm"});
     void finalizeRef.current("speech-recognition-semantic-match",blob);
    }
   };
   recorder.start(250);
   setState("listening");setMessage("Say your Shahada whenever you're ready.");
   try{
    const AudioCtx=window.AudioContext;
    if(AudioCtx){
     const ctx=new AudioCtx(),source=ctx.createMediaStreamSource(stream),analyser=ctx.createAnalyser();
     analyser.fftSize=512;analyser.smoothingTimeConstant=.85;source.connect(analyser);
     s.meter=ctx;
     const bytes=new Uint8Array(analyser.fftSize);
     const frame=()=>{
      if(!active.current||session.current!==s)return;
      analyser.getByteTimeDomainData(bytes);
      let sum=0;for(const x of bytes){const p=(x-128)/128;sum+=p*p}
      const loudness=Math.min(1,Math.sqrt(sum/bytes.length)*5);
      setLevel(loudness);s.frame=requestAnimationFrame(frame);
     };s.frame=requestAnimationFrame(frame);
    }
   }catch{/* Voice recognition and recording are independent of the visual meter. */}
   const w=window as Window&{SpeechRecognition?:new()=>WebRecognition;webkitSpeechRecognition?:new()=>WebRecognition};
   const Voice=w.SpeechRecognition||w.webkitSpeechRecognition;
   if(Voice){
    const recognizer=new Voice();s.recognition=recognizer;
    let previousText="",currentText="";
    let nudgeSent=false,nudgeTimer:ReturnType<typeof setTimeout>|null=null;
    recognizer.lang=language==="ar"?"ar-SA":"en-US";recognizer.continuous=true;recognizer.interimResults=true;
    recognizer.onresult=event=>{
     if(!active.current||session.current!==s)return;
     const parts=[];for(let i=0;i<event.results.length;i++)parts.push(event.results[i][0]?.transcript||"");
     currentText=parts.join(" ").trim();
     const value=[previousText,currentText].filter(Boolean).join(" ").slice(-850);
     if(value){setSpoken(true);setTranscript(value)}
     if(nudgeTimer)clearTimeout(nudgeTimer);
     // A single fast, friendly response after a genuine pause, never a
     // repetitive loop and never reciting the declaration into the mic.
     if(value&&!nudgeSent&&Date.now()-startedAt.current>4000){
      nudgeTimer=setTimeout(()=>{
       if(active.current&&!done.current){nudgeSent=true;guide("I'm here. You can say the full Shahada whenever you're ready.")}
      },1700);
      reminders.current.push(nudgeTimer);
     }
     if(hasShahada(value)&&!done.current){
      done.current=true;setState("recognized");setMessage("Shahada recognized");
      stop(true);
     }
    };
    recognizer.onerror=e=>{
     if(["not-allowed","service-not-allowed","audio-capture"].includes(e.error)){
      setHeardError(true);setMessage("Speech recognition isn't available. Help offers a secure written declaration.");
     }
    };
    recognizer.onend=()=>{
     if(currentText){previousText=[previousText,currentText].filter(Boolean).join(" ").slice(-850);currentText="";}
     if(!active.current||session.current!==s||done.current)return;
     setTimeout(()=>{if(active.current&&session.current===s)try{recognizer.start()}catch{}},180);
    };
    try{recognizer.start()}catch{setHeardError(true)}
   }else{setHeardError(true);setMessage("This browser can't transcribe speech. Tap Help for the written declaration.");}
   timer.current=setInterval(()=>{
    if(!active.current)return;
    const elapsed=Math.floor((Date.now()-startedAt.current)/1000);
    setSeconds(Math.max(0,60-elapsed));
    if(elapsed>=60&&!done.current){
     done.current=true;stop(false);setState("ready");setMessage("We'll try again. Tap HudHud when you're ready.");
    }
   },300);
   reminders.current.push(setTimeout(()=>{
    if(active.current&&!done.current)guide("Assalamu alaikum. Welcome to One Muslim. Say your Shahada whenever you're ready.");
   },950));
   reminders.current.push(setTimeout(()=>{
    if(active.current&&!done.current&&!spoken)guide("Take your time. I'm listening. Say your Shahada when you're ready.");
   },30000));
  }catch(e){
   granted?.getTracks().forEach(track=>track.stop());
   active.current=false;setState("unavailable");
   const permission=e instanceof DOMException&&["NotAllowedError","PermissionDeniedError"].includes(e.name);
   setMessage(permission?"Allow microphone access in your browser, then tap the orb to try again. You can also use Help.":"The microphone isn't ready. Tap HudHud to retry or open Help.");
  }
 },[guide,language,stop,spoken]);
 voiceRef.current=begin;
 const openHelp=()=>{stop(false);stopGuidance();setState("help");setManual(false);setTerms(false);setMessage("")};
 const back=()=>{setState("ready");setMessage("");setManual(false);setTerms(false)};
 const completeManual=()=>{
  if(!manual||!terms)return;
  stop(false);stopGuidance();void finalizeRef.current("self-attested-checkbox");
 };
 const exit=()=>{
  stop(false);stopGuidance();
  if(onExit){onExit();return}
  let next=returnTo;
  try{next=sessionStorage.getItem("1muslim:auth-return")||returnTo}catch{}
  router.replace(safeDestination(next));
 };
 return <section className={"hudV2Shahada "+(embedded?"isEmbedded":"")} aria-label="HudHud Shahada">
  {!embedded&&<header className="hudV2Brand"><button type="button" onClick={exit} aria-label="Back to One Muslim Search Home">One Muslim<span>.live</span></button></header>}
  <div className="hudV2ShahadaBody">
   <h1 aria-live="polite">{state==="recognized"||state==="complete"?"Shahada recognized":state==="saving"?"One Muslim":state==="help"?"Shahada":"Shahada"}</h1>
   {state==="help"?<div className="hudV2Help">
     <p>The Shahada is the declaration of belief in Allah and His Messenger. You can speak it in Arabic or English, or personally affirm it here if recording isn't possible.</p>
     <p className="hudV2Arabic" lang="ar" dir="rtl">{SHAHADA_ARABIC}</p><p>{SHAHADA_ENGLISH}</p>
     <label className="hudV2Check"><input type="checkbox" checked={manual} onChange={e=>setManual(e.target.checked)}/> I sincerely affirm this Shahada myself.</label>
     <label className="hudV2Check"><input type="checkbox" checked={terms} onChange={e=>setTerms(e.target.checked)}/> I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">community terms</a>.</label>
     <div className="hudV2HelpActions"><button onClick={back} type="button">← Back</button><button className="isPrimary" disabled={!manual||!terms||saved.current} onClick={completeManual} type="button">Continue →</button></div>
    </div>:<>
    <div className="hudV2OrbZone">
      <HudHudOrb compact listening={state==="listening"} thinking={state==="saving"||state==="permission"} speaking={speaking} level={level}
       onClick={()=>{if(state==="ready"||state==="unavailable")void begin();else if(state==="listening"){stop(false);setState("ready");setMessage("Ready when you are.");}}} />
      {state==="listening"&&<span className="hudV2ListeningPulse" aria-live="off">Listening · {seconds}s</span>}
      {state==="permission"&&<span className="hudV2ListeningPulse">Allow microphone</span>}
    </div>
    <p className="hudV2ShahadaStatus" role="status" aria-live="polite">{state==="checking"?"Preparing HudHud…":message|| (state==="ready"?"Allow microphone to begin":state==="listening"?"I'm listening.":state==="complete"?"Welcome to One Muslim.":"")}</p>
    {heardError&&state==="listening"&&<small className="hudV2Gentle">Your browser can't automatically recognize speech right now. Try Help.</small>}
    <div className="hudV2ShahadaActions">
     {(state==="ready"||state==="unavailable")&&<button type="button" className="hudV2Primary" onClick={()=>void begin()}>Enable microphone</button>}
     <button type="button" className="hudV2QuietButton" onClick={openHelp} disabled={state==="saving"||state==="recognized"||state==="complete"}>Help</button>
     <button type="button" className="hudV2QuietButton" aria-label={muted?"Unmute HudHud guidance":"Mute HudHud guidance"} aria-pressed={muted} onClick={()=>{setMuted(x=>!x);stopGuidance()}}>{muted?"Unmute":"Mute"}</button>
    </div>
    </>}
   {state!=="help"&&state!=="recognized"&&state!=="complete"&&state!=="saving"&&<div className="hudV2Language" aria-label="Language preference">
     <button type="button" aria-pressed={language==="ar"} onClick={()=>{stop(false);setLanguage("ar");setState("ready")}}>العربية</button>
     <button type="button" aria-pressed={language==="en"} onClick={()=>{stop(false);setLanguage("en");setState("ready")}}>English</button>
    </div>}
  </div>
  {embedded&&<button type="button" className="hudV2ShahadaExit" onClick={exit} aria-label="Close Shahada">✕</button>}
 </section>;
}
