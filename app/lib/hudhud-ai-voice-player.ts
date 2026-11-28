"use client";

/** Speak only the useful opening thought; keep the full text on screen. */
export function selectHudHudSpokenText(raw:string):string{
 const clean=raw.replace(/https?:\/\/\S+/g,"").replace(/\[[^\]]+\]\([^)]*\)/g,"").replace(/[\u0060*#_]/g,"")
  .replace(/\s+/g," ").trim();
 if(clean.length<=240)return clean;
 const sentences=clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[clean];
 let short="";
 for(const sentence of sentences){
  const next=sentence.trim();
  if(short&&short.length+next.length+1>225)break;
  short+=(short?" ":"")+next;
  if(short.length>=95)break;
 }
 if(short.length<55||short.length>255)
  short=clean.slice(0,225).replace(/\s+\S*$/,"").trim();
 return short;
}

export type HudHudMood="calm"|"warm"|"engaged"|"reflective";

/** One output at a time. The microphone owner must suspend recognition while
 * audio is being requested or played; this player never opens a microphone. */
export function createHudHudAiVoicePlayer(){
 let epoch=0;
 let request:AbortController|null=null;
 let audio:HTMLAudioElement|null=null;
 let objectUrl:string|null=null;
 let settle:((played:boolean)=>void)|null=null;
 let fallback:SpeechSynthesisUtterance|null=null;

 function stop(){
  epoch++;
  request?.abort();request=null;
  if(audio){
   audio.onplaying=null;audio.onended=null;audio.onerror=null;
   audio.pause();audio.removeAttribute("src");audio.load();audio=null;
  }
  if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null}
  if(fallback&&typeof window!=="undefined"&&"speechSynthesis" in window){window.speechSynthesis.cancel();fallback=null}
  const done=settle;settle=null;done?.(false);
 }

 // iOS may block delayed HTMLAudioElement.play() after a TTS fetch; use the
 // device's native voice as a last resort so HudHud need not become silent.
 // This fallback never requests mic access and never runs after a stop().
 function nativeSpeak(text:string,turn:number,onStart?:()=>void,mood:HudHudMood="warm"):Promise<boolean>{
  if(typeof window==="undefined"||!("speechSynthesis" in window)||!("SpeechSynthesisUtterance" in window)||epoch!==turn)return Promise.resolve(false);
  return new Promise<boolean>(resolve=>{
   const synth=window.speechSynthesis;
   const utterance=new SpeechSynthesisUtterance(text);
   fallback=utterance;
   utterance.lang="en-US";utterance.rate=mood==="calm"||mood==="reflective"?.92:mood==="engaged"?1.06:1;utterance.pitch=1;
   let done=false;
   const timer=window.setTimeout(()=>finish(false),Math.min(120000,Math.max(20000,text.length*125)));
   const finish=(ok:boolean)=>{if(done)return;done=true;window.clearTimeout(timer);if(fallback===utterance)fallback=null;settle=null;resolve(ok)};
   settle=finish;
   utterance.onstart=()=>{if(epoch===turn)onStart?.()};
   utterance.onend=()=>finish(true);
   utterance.onerror=()=>finish(false);
   try{synth.speak(utterance);synth.resume()}catch{finish(false)}
  });
 }
 async function play(text:string,onStart?:()=>void,mood:HudHudMood="warm"):Promise<boolean>{
  stop();
  const turn=epoch;
  const spoken=selectHudHudSpokenText(text);
  if(!spoken)return false;
  const signal=new AbortController();
  request=signal;
  try{
   const res=await fetch("/api/hudhud/speech",{
    method:"POST",credentials:"same-origin",cache:"no-store",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({text:spoken,mood}),signal:signal.signal
   });
   if(!res.ok||!res.headers.get("content-type")?.startsWith("audio/"))return await nativeSpeak(spoken,turn,onStart,mood);
   const bytes=await res.blob();
   if(signal.signal.aborted||epoch!==turn)return false;
   if(bytes.size===0)return await nativeSpeak(spoken,turn,onStart,mood);
   objectUrl=URL.createObjectURL(bytes);
   const player=new Audio(objectUrl);
   player.preload="auto";audio=player;
   const played=await new Promise<boolean>(resolve=>{
    settle=resolve;
    player.onplaying=()=>{if(epoch===turn)onStart?.()};
    player.onended=()=>resolve(true);
    player.onerror=()=>resolve(false);
    void player.play().catch(()=>resolve(false));
   });
   settle=null;
   if(!played&&epoch===turn&&!signal.signal.aborted)return await nativeSpeak(spoken,turn,onStart,mood);
   return played;
  }catch{return epoch===turn&&!signal.signal.aborted?await nativeSpeak(spoken,turn,onStart,mood):false}
  finally{if(epoch===turn)stop()}
 }
 return {play,stop};
}
