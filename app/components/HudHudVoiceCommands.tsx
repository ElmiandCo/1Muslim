"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
type SpeechResult={results:ArrayLike<ArrayLike<{transcript:string}>>};
type Recognition={lang:string;continuous:boolean;interimResults:boolean;onresult:((e:SpeechResult)=>void)|null;onerror:(()=>void)|null;onend:(()=>void)|null;start:()=>void;stop:()=>void};
type SpeechWindow=Window&{SpeechRecognition?:new()=>Recognition;webkitSpeechRecognition?:new()=>Recognition};
export default function HudHudVoiceCommands(){
 const router=useRouter(),recognition=useRef<Recognition|null>(null),[enabled,setEnabled]=useState(false),[listening,setListening]=useState(false),[feedback,setFeedback]=useState("");
 const [undocked,setUndocked]=useState(false),[orbPos,setOrbPos]=useState({x:0,y:0});
 const moving=useRef<{x:number;y:number;ox:number;oy:number;source:"orb"|"dock";moved:boolean}|null>(null);
 const dockRef=useRef<HTMLDivElement|null>(null);
 const dragStart=(e:React.PointerEvent<HTMLElement>,source:"orb"|"dock")=>{if(source==="dock"&&(e.target as HTMLElement).closest("button[data-voice-toggle]"))return;moving.current={x:e.clientX,y:e.clientY,ox:orbPos.x,oy:orbPos.y,source,moved:false};e.currentTarget.setPointerCapture(e.pointerId)};
 const dragMove=(e:React.PointerEvent<HTMLElement>)=>{const d=moving.current;if(!d)return;const dx=e.clientX-d.x,dy=e.clientY-d.y;if(Math.abs(dx)+Math.abs(dy)>12)d.moved=true;if(!d.moved)return;setUndocked(true);setOrbPos({x:Math.max(34,Math.min(innerWidth-34,(d.source==="dock"?innerWidth-90:d.ox)+dx)),y:Math.max(75,Math.min(innerHeight-95,(d.source==="dock"?innerHeight-145:d.oy)+dy))})};
 const dragEnd=(e:React.PointerEvent<HTMLElement>)=>{const d=moving.current;moving.current=null;if(!d?.moved)return;const rect=dockRef.current?.getBoundingClientRect();if(rect&&e.clientX>=rect.left-45&&e.clientX<=rect.right+45&&e.clientY>=rect.top-45&&e.clientY<=rect.bottom+45)setUndocked(false)};
 useEffect(()=>{setEnabled(localStorage.getItem("1muslim:hudhud-voice")==="on")},[]);
 useEffect(()=>{if(!enabled){recognition.current?.stop();setListening(false);return}const W=window as SpeechWindow;const Constructor=W.SpeechRecognition||W.webkitSpeechRecognition;if(!Constructor){setFeedback("Voice recognition is unavailable in this browser.");return}const rec=new Constructor();recognition.current=rec;rec.lang="en-US";rec.continuous=true;rec.interimResults=false;rec.onresult=e=>{const phrase=Array.from(e.results).map(row=>row[0]?.transcript||"").join(" ").toLowerCase();const command=phrase.includes("hudhud")?phrase.slice(phrase.lastIndexOf("hudhud")+6).trim():phrase;if(/(?:go to|open|show)(?: my)? messages/.test(command)){setFeedback("Opening messages");router.push("/messages")}else if(/(?:go to|open|show)(?: my)? (?:audio rooms|rooms)/.test(command)){setFeedback("Opening audio rooms");router.push("/audio-rooms")}else if(/(?:ready to record|start recording|let.s try again)/.test(command)){window.dispatchEvent(new Event("1muslim:quran-voice-record"));setFeedback("Starting practice recorder")}else if(command.includes("stop listening")){setEnabled(false);localStorage.setItem("1muslim:hudhud-voice","off")}};rec.onerror=()=>{setListening(false);setFeedback("Microphone or speech recognition unavailable. Tap to retry.")};rec.onend=()=>setListening(false);try{rec.start();setListening(true);setFeedback("HudHud is listening")}catch{setFeedback("Tap again to allow microphone access.")}return()=>{rec.onend=null;rec.stop();recognition.current=null}},[enabled,router]);
 return <>
  <div ref={dockRef} className="hhVoiceDock" onPointerDown={e=>dragStart(e,"dock")} onPointerMove={dragMove} onPointerUp={dragEnd} onPointerCancel={()=>moving.current=null} title="Drag to pull out HudHud Orb" aria-label="HudHud voice and secondary orb dock">
   <span className="hhVoiceGrip" aria-hidden="true">⠿</span><button data-voice-toggle type="button" onClick={()=>{localStorage.setItem("1muslim:hudhud-voice",enabled?"off":"on");setEnabled(!enabled)}} aria-pressed={enabled}>{listening?"🎙 Voice on":"🎙 Voice off"}</button>
  </div>
  {undocked&&<button type="button" className="hhSecondaryOrb" style={{left:orbPos.x,top:orbPos.y}} onPointerDown={e=>dragStart(e,"orb")} onPointerMove={dragMove} onPointerUp={dragEnd} onPointerCancel={()=>moving.current=null} onClick={()=>{if(!moving.current)window.dispatchEvent(new Event("1muslim:hudhud-vision-enable"))}} aria-label="Movable HudHud Vision orb. Drag to the voice dock to hide."><span className="hhSecondaryHalo"/><img src="/assets/hudhud-logo.PNG" alt="HudHud"/></button>}
  <style jsx>{`
  .hhVoiceDock{position:fixed;right:10px;bottom:calc(105px + env(safe-area-inset-bottom,0px));z-index:9400;display:flex;align-items:center;gap:5px;padding:5px 8px;border:1px solid #65dfc488;border-radius:999px;background:#092331e8;box-shadow:0 0 15px #6fffe022;touch-action:none;user-select:none;color:#9afde7;cursor:grab}
  .hhVoiceDock button{border:0;background:transparent;color:#e7fff8;font-size:12px;padding:6px;touch-action:manipulation}
  .hhVoiceGrip{font-size:19px;line-height:1}
  .hhSecondaryOrb{position:fixed;z-index:9401;width:65px;height:65px;transform:translate(-50%,-50%);border-radius:50%;border:1px solid #74ffe8;background:radial-gradient(circle,#173a46,#081420);box-shadow:0 0 25px #5bf9e866;display:grid;place-items:center;touch-action:none;cursor:grab;animation:hhSecondPulse 3s ease-in-out infinite}
  .hhSecondaryOrb img{width:85%;height:85%;object-fit:contain;pointer-events:none;filter:drop-shadow(0 0 8px #9d6aff)}
  .hhSecondaryHalo{position:absolute;inset:-5px;border:2px solid transparent;border-top-color:#70ffe3;border-right-color:#b58aff;border-radius:50%;animation:hhSecondSpin 4s linear infinite;pointer-events:none}
  @keyframes hhSecondSpin{to{transform:rotate(360deg)}}@keyframes hhSecondPulse{50%{box-shadow:0 0 36px #8c73ff99;filter:brightness(1.12)}}
  @media(prefers-reduced-motion:reduce){.hhSecondaryOrb,.hhSecondaryHalo{animation:none}}
  `}</style>
 </>;
}
