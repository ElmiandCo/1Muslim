"use client";
import {useEffect,useRef,useState} from "react";
export default function HudHudVoiceOrb(){
 const [enabled,setEnabled]=useState(false),[state,setState]=useState("OFF"),[error,setError]=useState(""),[level,setLevel]=useState(0),[touch,setTouch]=useState({x:50,y:50});
 const pc=useRef<RTCPeerConnection|null>(null),stream=useRef<MediaStream|null>(null),audio=useRef<HTMLAudioElement|null>(null),ctx=useRef<AudioContext|null>(null),frame=useRef<number>(0);
 const stop=()=>{if(frame.current)cancelAnimationFrame(frame.current);pc.current?.close();pc.current=null;stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;audio.current?.remove();audio.current=null;void ctx.current?.close();ctx.current=null;setLevel(0);setEnabled(false);setState("OFF")};
 useEffect(()=>()=>{if(frame.current)cancelAnimationFrame(frame.current);pc.current?.close();stream.current?.getTracks().forEach(t=>t.stop());audio.current?.remove();void ctx.current?.close()},[]);
 async function start(){
  if(enabled){stop();return}
  setError("");setState("CONNECTING");
  try{
   const mic=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});stream.current=mic;
   const response=await fetch("/api/admin/hudhud-voice",{method:"POST",cache:"no-store"});
   const data=await response.json();if(!response.ok)throw Error(data.error||"Voice unavailable");
   const peer=new RTCPeerConnection();pc.current=peer;
   const output=document.createElement("audio");output.autoplay=true;output.setAttribute("playsinline","");audio.current=output;
   peer.ontrack=e=>{output.srcObject=e.streams[0];void output.play().catch(()=>{})};
   peer.onconnectionstatechange=()=>{if(peer.connectionState==="failed"||peer.connectionState==="disconnected"){setError("Voice connection lost");stop()}};
   mic.getTracks().forEach(t=>peer.addTrack(t,mic));
   const channel=peer.createDataChannel("oai-events");
   channel.onopen=()=>setState("LISTENING");
   channel.onmessage=e=>{try{const event=JSON.parse(e.data);if(event.type==="response.created")setState("HUDHUD SPEAKING");if(event.type==="response.done")setState("LISTENING")}catch{}};
   const offer=await peer.createOffer();await peer.setLocalDescription(offer);
   const sdp=await fetch("https://api.openai.com/v1/realtime/calls",{method:"POST",headers:{"Authorization":`Bearer ${data.clientSecret}`,"Content-Type":"application/sdp"},body:offer.sdp});
   if(!sdp.ok)throw Error("Realtime voice handshake failed");
   await peer.setRemoteDescription({type:"answer",sdp:await sdp.text()});
   const ac=new AudioContext();ctx.current=ac;const source=ac.createMediaStreamSource(mic),analyser=ac.createAnalyser();analyser.fftSize=512;source.connect(analyser);
   const bins=new Uint8Array(analyser.frequencyBinCount);
   const tick=()=>{analyser.getByteFrequencyData(bins);const avg=bins.reduce((a,b)=>a+b,0)/bins.length;setLevel(Math.min(1,avg/90));frame.current=requestAnimationFrame(tick)};tick();
   setEnabled(true);setState("LISTENING");
  }catch(e){const message=e instanceof Error?e.message:"Unable to start voice";stop();setError(message)}
 }
 return <div className="hudhud-voice-stage"><div className="hudhud-voice-orb" role="img" aria-label="HudHud voice reactive orb" onPointerMove={e=>{const r=e.currentTarget.getBoundingClientRect();setTouch({x:Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100)),y:Math.max(0,Math.min(100,(e.clientY-r.top)/r.height*100))})}} style={{"--voice":level,"--tx":touch.x+"%","--ty":touch.y+"%"} as React.CSSProperties}><div className="hudhud-voice-sheen"/><div className="hudhud-voice-center">HUDHUD<small>1M COMMAND CORE</small></div></div><div className="hudhud-voice-controls"><button type="button" onClick={()=>void start()} aria-pressed={enabled}>{enabled?"■ End voice":"🎙 Mic + OpenAI On"}</button><span aria-live="polite">{state}</span></div>{error&&<p role="alert" className="hudhud-voice-error">{error}</p>}<p className="hudhud-voice-note">Private voice session · Mic off until enabled · No admin write access</p><style jsx>{`
 .hudhud-voice-stage{display:flex;flex-direction:column;align-items:center;gap:10px;min-width:0}
 .hudhud-voice-orb{position:relative;width:clamp(145px,25vw,230px);aspect-ratio:1;border-radius:50%;overflow:hidden;touch-action:pan-y;isolation:isolate;border:1px solid #b8e8ff66;background:radial-gradient(circle at var(--tx) var(--ty),#fff9 0%,transparent 23%),radial-gradient(circle at 36% 28%,#d5efff,#638af1 20%,#1b2f87 44%,#080d31 71%,#020414);box-shadow:0 0 calc(23px + var(--voice)*42px) #619eff77,inset -15px -20px 38px #02031d, inset 9px 10px 32px #ffffff45;transform:scale(calc(1 + var(--voice)*.06));transition:transform .13s ease,box-shadow .16s ease}
 .hudhud-voice-orb:before,.hudhud-voice-orb:after{content:"";position:absolute;inset:9%;border-radius:50%;border:1px solid #c7d8ff77;box-shadow:0 0 22px #c9aaff77;transform:rotate(35deg) scaleX(.66);animation:voice-orbit 9s ease-in-out infinite alternate}
 .hudhud-voice-orb:after{inset:14%;border-color:#fff6;transform:rotate(-48deg) scaleX(.85);animation-delay:-4s;animation-duration:7s}
 .hudhud-voice-sheen{position:absolute;inset:5%;border-radius:50%;background:conic-gradient(from 20deg,#7ddcff55,transparent 23%,#c4aaffaa 40%,transparent 61%,#d0f7ff88 78%,transparent);filter:blur(13px);animation:voice-orbit 12s linear infinite}
 .hudhud-voice-center{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;z-index:2;color:#fff;font-weight:900;font-size:clamp(15px,3vw,24px);letter-spacing:.17em;text-shadow:0 2px 15px #001a57}
 .hudhud-voice-center small{font-size:8px;letter-spacing:.1em;margin-top:7px}
 .hudhud-voice-controls{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:center;font-size:10px;letter-spacing:.12em;color:#c3eaff}
 .hudhud-voice-controls button{border:1px solid #a8d7ff88;border-radius:24px;padding:9px 14px;background:#172c57;color:white;font-weight:700;cursor:pointer}
 .hudhud-voice-note{font-size:10px;opacity:.65;text-align:center;margin:0}.hudhud-voice-error{color:#ffb4b4;font-size:11px}
 @keyframes voice-orbit{to{transform:rotate(330deg) scaleX(.7)}}
 @media(prefers-reduced-motion:reduce){.hudhud-voice-orb:before,.hudhud-voice-orb:after,.hudhud-voice-sheen{animation:none}}
 `}</style></div>
}
