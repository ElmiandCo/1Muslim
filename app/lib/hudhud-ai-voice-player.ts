"use client";

/** HudHud owns one audible reply at a time. Recognition is suspended by the
 * caller before playback; this player never opens a microphone.
 *
 * On an iPhone a TTS HTTP response can outlive the tap that requested it.
 * Prime WebAudio during a real tap, stream 24 kHz PCM once the answer exists,
 * and only fall back to HTMLAudio / system speech when necessary.
 * Silent hardware or browser-autoplay restrictions cannot be overridden. */
export function createHudHudAiVoicePlayer(){
 let epoch=0;
 let request:AbortController|null=null;
 let audio:HTMLAudioElement|null=null;
 let objectUrl:string|null=null;
 let settle:((played:boolean)=>void)|null=null;
 let fallback:SpeechSynthesisUtterance|null=null;
 let context:AudioContext|null=null;
 const sources=new Set<AudioBufferSourceNode>();
 let primed=false;

 function prime(){
  if(typeof window==="undefined")return;
  const WebAudio=window.AudioContext||(window as Window&{webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
  if(!WebAudio)return;
  try{
   if(!context)context=new WebAudio();
   const ctx=context;
   // resume() MUST run synchronously in the user's tap/keypress handler.
   if(ctx.state==="suspended")void ctx.resume().catch(()=>{});
   if(!primed){
    const silent=ctx.createBuffer(1,128,24000);
    const source=ctx.createBufferSource();source.buffer=silent;
    source.connect(ctx.destination);source.start(0);
    primed=true;
   }
  }catch{/* Some browsers do not expose a usable AudioContext. */}
 }

 function stop(){
  epoch++;
  request?.abort();request=null;
  for(const source of sources){try{source.stop()}catch{}try{source.disconnect()}catch{}}
  sources.clear();
  if(audio){
   audio.onplaying=null;audio.onended=null;audio.onerror=null;
   audio.pause();audio.removeAttribute("src");audio.load();audio=null;
  }
  if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null}
  if(fallback&&typeof window!=="undefined"&&"speechSynthesis" in window){window.speechSynthesis.cancel();fallback=null}
  const done=settle;settle=null;done?.(false);
 }

 // Uses the browser's local voice only when cloud voice couldn't play.
 function nativeSpeak(text:string,turn:number,onStart?:()=>void):Promise<boolean>{
  if(typeof window==="undefined"||!("speechSynthesis" in window)||!("SpeechSynthesisUtterance" in window)||epoch!==turn)return Promise.resolve(false);
  return new Promise<boolean>(resolve=>{
   const synth=window.speechSynthesis;
   const utterance=new SpeechSynthesisUtterance(text);fallback=utterance;
   utterance.lang="en-US";utterance.rate=1;utterance.pitch=1;
   let done=false;
   const timer=window.setTimeout(()=>finish(false),Math.min(120000,Math.max(20000,text.length*125)));
   const finish=(ok:boolean)=>{if(done)return;done=true;window.clearTimeout(timer);if(fallback===utterance)fallback=null;settle=null;resolve(ok)};
   settle=finish;
   utterance.onstart=()=>{if(epoch===turn)onStart?.()};
   utterance.onend=()=>finish(true);utterance.onerror=()=>finish(false);
   try{synth.speak(utterance);synth.resume()}catch{finish(false)}
  });
 }

 const postVoice=(text:string,signal:AbortSignal,stream:boolean)=>fetch("/api/hudhud/speech",{
  method:"POST",credentials:"same-origin",cache:"no-store",
  headers:{"Content-Type":"application/json"},
  body:JSON.stringify({text:text.trim().slice(0,1800),stream}),signal
 });

 // Chunked PCM can become audible before the entire reply has been synthesized.
 // Keep small sample buffers scheduled back-to-back to prevent Safari gaps.
 async function playStream(text:string,turn:number,onStart?:()=>void):Promise<{played:boolean;started:boolean}>{
  const ctx=context;
  if(!ctx||ctx.state!=="running"||epoch!==turn)return {played:false,started:false};
  let started=false;
  const signal=new AbortController();request=signal;
  try{
   const response=await postVoice(text,signal.signal,true);
   if(!response.ok||!response.body||!response.headers.get("content-type")?.startsWith("audio/L16"))return {played:false,started:false};
   const reader=response.body.getReader();
   let queued=new Uint8Array(0),nextAt=ctx.currentTime+0.05,last:AudioBufferSourceNode|null=null;
   const schedule=(bytes:Uint8Array)=>{
    if(bytes.byteLength<2||epoch!==turn)return;
    const samples=Math.floor(bytes.byteLength/2);
    const buffer=ctx.createBuffer(1,samples,24000),channel=buffer.getChannelData(0);
    const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
    for(let i=0;i<samples;i++)channel[i]=view.getInt16(i*2,true)/32768;
    const source=ctx.createBufferSource();source.buffer=buffer;source.connect(ctx.destination);
    sources.add(source);source.onended=()=>{sources.delete(source);try{source.disconnect()}catch{}};
    nextAt=Math.max(nextAt,ctx.currentTime+0.025);
    source.start(nextAt);nextAt+=buffer.duration;last=source;
    if(!started){started=true;onStart?.()}
   };
   while(epoch===turn){
    const {value,done}=await reader.read();
    if(done)break;
    if(!value?.byteLength)continue;
    const joined=new Uint8Array(queued.length+value.length);
    joined.set(queued);joined.set(value,queued.length);queued=joined;
    while(queued.length>=4800){schedule(queued.slice(0,4800));queued=queued.slice(4800)}
   }
   if(epoch!==turn)return {played:false,started};
   if(queued.length>=2)schedule(queued.slice(0,queued.length-queued.length%2));
   if(!last)return {played:false,started};
   const finalSource:AudioBufferSourceNode=last;
   const played=await new Promise<boolean>(resolve=>{
    let done=false;
    const timer=window.setTimeout(()=>finish(false),Math.min(120000,Math.max(15000,(nextAt-ctx.currentTime)*1000+5000)));
    const finish=(value:boolean)=>{if(done)return;done=true;window.clearTimeout(timer);settle=null;resolve(value)};
    settle=finish;
    finalSource.addEventListener("ended",()=>finish(epoch===turn),{once:true});
   });
   return {played,started};
  }catch{return {played:false,started}}
  finally{if(request===signal)request=null}
 }

 async function playMp3(text:string,turn:number,onStart?:()=>void):Promise<boolean>{
  const signal=new AbortController();request=signal;
  try{
   const res=await postVoice(text,signal.signal,false);
   if(!res.ok||!res.headers.get("content-type")?.startsWith("audio/"))return await nativeSpeak(text,turn,onStart);
   const bytes=await res.blob();
   if(signal.signal.aborted||epoch!==turn)return false;
   if(bytes.size===0)return await nativeSpeak(text,turn,onStart);
   objectUrl=URL.createObjectURL(bytes);
   const player=new Audio(objectUrl);
   player.preload="auto";player.setAttribute("playsinline","");audio=player;
   const played=await new Promise<boolean>(resolve=>{
    settle=resolve;
    player.onplaying=()=>{if(epoch===turn)onStart?.()};
    player.onended=()=>resolve(true);player.onerror=()=>resolve(false);
    void player.play().catch(()=>resolve(false));
   });
   settle=null;
   if(!played&&epoch===turn&&!signal.signal.aborted)return await nativeSpeak(text,turn,onStart);
   return played;
  }catch{return epoch===turn&&!signal.signal.aborted?await nativeSpeak(text,turn,onStart):false}
  finally{if(request===signal)request=null}
 }

 async function play(text:string,onStart?:()=>void):Promise<boolean>{
  stop();
  const turn=epoch;
  if(!text.trim())return false;
  try{
   // A primed context continues to work after the initiating gesture expires.
   if(context){
    if(context.state==="suspended"){
     await Promise.race([context.resume().catch(()=>{}),new Promise(resolve=>setTimeout(resolve,250))]);
    }
    if(context.state==="running"){
     const result=await playStream(text,turn,onStart);
     if(result.played)return true;
     if(result.started||epoch!==turn)return false; // Do not repeat partial speech.
    }
   }
   return epoch===turn?await playMp3(text,turn,onStart):false;
  }catch{return false}
  finally{if(epoch===turn)stop()}
 }
 function dispose(){
  stop();
  const ctx=context;context=null;
  if(ctx)void ctx.close().catch(()=>{});
 }
 return {play,stop,prime,dispose};
}
