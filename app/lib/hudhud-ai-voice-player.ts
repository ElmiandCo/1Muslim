"use client";

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
 function nativeSpeak(text:string,turn:number,onStart?:()=>void):Promise<boolean>{
  if(typeof window==="undefined"||!("speechSynthesis" in window)||!("SpeechSynthesisUtterance" in window)||epoch!==turn)return Promise.resolve(false);
  return new Promise<boolean>(resolve=>{
   const synth=window.speechSynthesis;
   const utterance=new SpeechSynthesisUtterance(text);
   fallback=utterance;
   utterance.lang="en-US";utterance.rate=1;utterance.pitch=1;
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
 async function play(text:string,onStart?:()=>void):Promise<boolean>{
  stop();
  const turn=epoch;
  if(!text.trim())return false;
  const signal=new AbortController();
  request=signal;
  try{
   const res=await fetch("/api/hudhud/speech",{
    method:"POST",credentials:"same-origin",cache:"no-store",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({text:text.trim().slice(0,1800)}),signal:signal.signal
   });
   if(!res.ok||!res.headers.get("content-type")?.startsWith("audio/"))return await nativeSpeak(text,turn,onStart);
   const bytes=await res.blob();
   if(signal.signal.aborted||epoch!==turn)return false;
   if(bytes.size===0)return await nativeSpeak(text,turn,onStart);
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
   if(!played&&epoch===turn&&!signal.signal.aborted)return await nativeSpeak(text,turn,onStart);
   return played;
  }catch{return epoch===turn&&!signal.signal.aborted?await nativeSpeak(text,turn,onStart):false}
  finally{if(epoch===turn)stop()}
 }
 return {play,stop};
}
