"use client";

/** One output at a time. The microphone owner must suspend recognition while
 * audio is being requested or played; this player never opens a microphone. */
export function createHudHudAiVoicePlayer(){
 let epoch=0;
 let request:AbortController|null=null;
 let audio:HTMLAudioElement|null=null;
 let objectUrl:string|null=null;
 let settle:((played:boolean)=>void)|null=null;

 function stop(){
  epoch++;
  request?.abort();request=null;
  if(audio){
   audio.onplaying=null;audio.onended=null;audio.onerror=null;
   audio.pause();audio.removeAttribute("src");audio.load();audio=null;
  }
  if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null}
  const done=settle;settle=null;done?.(false);
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
   if(!res.ok||!res.headers.get("content-type")?.startsWith("audio/"))return false;
   const bytes=await res.blob();
   if(signal.signal.aborted||epoch!==turn||bytes.size===0)return false;
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
   return played;
  }catch{return false}
  finally{if(epoch===turn)stop()}
 }
 return {play,stop};
}
