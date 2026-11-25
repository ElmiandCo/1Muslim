"use client";

import {useEffect,useRef,useState} from "react";
import {recognizeCompleteShahada,type ShahadaLanguage} from "../../lib/shahada-phrase";
import styles from "./ShahadaImmersiveEntry.module.css";

type SpeechLike = {
  lang:string; continuous:boolean; interimResults:boolean;
  start:()=>void; stop:()=>void; abort:()=>void;
  onresult:((event:any)=>void)|null;
  onerror:((event:any)=>void)|null;
  onend:(()=>void)|null;
};
type Props={
  onRecognized:(language:ShahadaLanguage)=>void;
  onFallback:()=>void;
  onExit:()=>void;
};

export default function ShahadaImmersiveEntry({onRecognized,onFallback,onExit}:Props){
  const [status,setStatus]=useState<"permission"|"tap"|"listening"|"success">("permission");
  const [level,setLevel]=useState(0);
  const alive=useRef(false);
  const mounted=useRef(false);
  const recognizer=useRef<SpeechLike|null>(null);
  const stream=useRef<MediaStream|null>(null);
  const audioContext=useRef<AudioContext|null>(null);
  const animation=useRef<number|null>(null);
  const windowTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const successTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const restartTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const attempt=useRef(0);
  const language=useRef<ShahadaLanguage>("en");
  const listeningSince=useRef(0);

  const stop=()=>{
    alive.current=false;
    attempt.current++;
    if(windowTimer.current){clearTimeout(windowTimer.current);windowTimer.current=null;}
    if(successTimer.current){clearTimeout(successTimer.current);successTimer.current=null;}
    if(restartTimer.current){clearTimeout(restartTimer.current);restartTimer.current=null;}
    const current=recognizer.current;
    recognizer.current=null;
    if(current){current.onend=null;current.onerror=null;current.onresult=null;try{current.abort();}catch{}}
    stream.current?.getTracks().forEach(track=>track.stop());
    stream.current=null;
    if(animation.current!==null){cancelAnimationFrame(animation.current);animation.current=null;}
    if(audioContext.current){void audioContext.current.close().catch(()=>{});audioContext.current=null;}
    if(mounted.current)setLevel(0);
  };
  const fallback=()=>{stop();onFallback();};
  const meter=(mic:MediaStream)=>{
    try{
      const context=new AudioContext();
      audioContext.current=context;
      const source=context.createMediaStreamSource(mic);
      const analyser=context.createAnalyser();
      analyser.fftSize=512;analyser.smoothingTimeConstant=.85;
      source.connect(analyser);
      const samples=new Uint8Array(analyser.fftSize);
      let last=0;
      const tick=(now:number)=>{
        if(!alive.current)return;
        if(now-last>90){
          analyser.getByteTimeDomainData(samples);
          let energy=0;
          for(const sample of samples){const v=(sample-128)/128;energy+=v*v;}
          setLevel(Math.min(1,Math.sqrt(energy/samples.length)*5));
          last=now;
        }
        animation.current=requestAnimationFrame(tick);
      };
      animation.current=requestAnimationFrame(tick);
    }catch{/* Audio visual feedback is optional; recognition still works. */}
  };

  const begin=async(auto:boolean)=>{
    if(alive.current)return;
    stop();
    const version=attempt.current;
    if(mounted.current)setStatus("permission");
    const scope=window as typeof window & {SpeechRecognition?:new()=>SpeechLike;webkitSpeechRecognition?:new()=>SpeechLike};
    const Speech=scope.SpeechRecognition||scope.webkitSpeechRecognition;
    if(!Speech||!navigator.mediaDevices?.getUserMedia){fallback();return;}
    try{
      const mic=await navigator.mediaDevices.getUserMedia({audio:true});
      if(!mounted.current||version!==attempt.current){mic.getTracks().forEach(track=>track.stop());return;}
      stream.current=mic;
      const rec=new Speech();
      recognizer.current=rec;
      alive.current=true;
      language.current=navigator.language.toLowerCase().startsWith("ar")?"ar":"en";
      rec.lang=language.current==="ar"?"ar-SA":"en-US";
      rec.continuous=true;
      rec.interimResults=true;
      listeningSince.current=Date.now();
      rec.onresult=(event:any)=>{
        if(!alive.current)return;
        const results=Array.from(event.results??[]) as Array<{[index:number]:{transcript?:string}}>;
        const heard=results.map(item=>item?.[0]?.transcript??"").join(" ").trim();
        const found=recognizeCompleteShahada(heard);
        if(!found)return;
        stop();
        if(!mounted.current)return;
        setStatus("success");
        successTimer.current=setTimeout(()=>{if(mounted.current)onRecognized(found);},950);
      };
      rec.onerror=(event:any)=>{
        if(!alive.current)return;
        const reason=String(event?.error||"");
        if(["no-speech","aborted"].includes(reason))return;
        fallback();
      };
      rec.onend=()=>{
        if(!alive.current||!mounted.current)return;
        restartTimer.current=setTimeout(()=>{
          if(!alive.current||!mounted.current)return;
          // The native API supports one locale per recognizer. Rotate the
          // listening locale after pauses, without ending the minute-long window.
          if(Date.now()-listeningSince.current>=12000){
            language.current=language.current==="en"?"ar":"en";
            listeningSince.current=Date.now();
          }
          rec.lang=language.current==="ar"?"ar-SA":"en-US";
          try{rec.start();}catch{fallback();}
        },220);
      };
      try{rec.start();}catch{
        stop();
        if(mounted.current)setStatus(auto?"tap":"tap");
        return;
      }
      setStatus("listening");
      meter(mic);
      // The clock starts AFTER permission has been granted and recognition starts.
      windowTimer.current=setTimeout(fallback,60000);
    }catch(err){
      if(!mounted.current||version!==attempt.current)return;
      stop();
      const name=err instanceof DOMException?err.name:"";
      // Safari can require a user gesture even if permissions are already granted.
      if(auto&&name!=="NotFoundError"&&name!=="NotReadableError"){setStatus("tap");return;}
      fallback();
    }
  };

  useEffect(()=>{
    mounted.current=true;
    void begin(true);
    return()=>{mounted.current=false;stop();};
    // A single session starts on mount; callbacks do not restart the microphone.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const active=status==="listening";
  return <main className={styles.scene} data-active={active} data-success={status==="success"}>
    <div className={styles.space} aria-hidden="true"/>
    <div className={styles.earth} aria-hidden="true"/>
    <div className={styles.horizon} aria-hidden="true"/>
    <button type="button" className={styles.close} onClick={()=>{stop();onExit();}} aria-label="Exit Shahada listening">×</button>
    <div className={styles.brand} aria-label="1Muslim"><span>1M</span></div>
    <div className={styles.center}>
      <div className={styles.waveLeft} aria-hidden="true"/>
      <div className={styles.waveRight} aria-hidden="true"/>
      <button type="button" className={styles.orb} style={{"--voice":level} as React.CSSProperties}
        onClick={()=>active?(stop(),setStatus("tap")):status!=="success"?void begin(false):undefined}
        aria-label={active?"Stop listening":status==="success"?"Shahada recognized":"Enable microphone and begin Shahada listening"}
        aria-pressed={active}>
        <span className={styles.ring} aria-hidden="true"/>
        <span className={styles.orbCore} aria-hidden="true"><img src="/assets/hudhud-logo.PNG" alt=""/></span>
      </button>
      <button type="button" className={styles.mic} onClick={()=>active?(stop(),setStatus("tap")):void begin(false)}
        disabled={status==="success"} aria-label={active?"Microphone on. Tap to stop.":"Turn on microphone and listen."}
        aria-pressed={active}>
        <svg width="31" height="36" viewBox="0 0 32 36" fill="none" aria-hidden="true">
          <rect x="11" y="3" width="10" height="20" rx="5" stroke="currentColor" strokeWidth="2.6"/>
          <path d="M5.5 17.5a10.5 10.5 0 0 0 21 0M16 28v5m-7 0h14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"/>
        </svg>
      </button>
      <span className={styles.srOnly} role="status" aria-live="polite">
        {status==="permission"?"Waiting for browser microphone access.":status==="tap"?"Tap HudHud or the microphone to begin.":status==="success"?"Shahada recognized.": "Listening for the complete Shahada in Arabic or English. You may stop at any time. Your audio is not saved in this step. Browser speech recognition may use a third-party service."}
      </span>
      <button className={styles.legacy} type="button" onClick={fallback} aria-label="Use the original Shahada recorder and touch declaration">⋯</button>
    </div>
    <div className={styles.reflection} aria-hidden="true"/>
  </main>;
}
