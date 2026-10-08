"use client";
import { useEffect, useState } from "react";
export function playExpressionSound(kind:"send"|"reply"|"react") {
 try {
  if(localStorage.getItem("1muslim-expression-sounds")!=="on")return;
  const AudioContextType=window.AudioContext;
  if(!AudioContextType)return;
  const ctx=new AudioContextType();
  const notes=kind==="reply"?[587,784]:kind==="react"?[880,1175]:[523,659];
  notes.forEach((hz,i)=>{
   const oscillator=ctx.createOscillator(),gain=ctx.createGain(),start=ctx.currentTime+i*.075;
   oscillator.type="sine";oscillator.frequency.value=hz;
   gain.gain.setValueAtTime(.0001,start);
   gain.gain.exponentialRampToValueAtTime(.035,start+.015);
   gain.gain.exponentialRampToValueAtTime(.0001,start+.18);
   oscillator.connect(gain);gain.connect(ctx.destination);
   oscillator.start(start);oscillator.stop(start+.19);
  });
  window.setTimeout(()=>void ctx.close(),550);
 } catch {}
}
export function ExpressionCelebration({trigger,emoji="✨"}:{trigger:number;emoji?:string}){
 const [enabled,setEnabled]=useState(true);
 useEffect(()=>{try{setEnabled(localStorage.getItem("1muslim-expression-effects")!=="off")}catch{}},[trigger]);
 if(!trigger||!enabled)return null;
 return <div key={trigger} className="omScreenCelebration" aria-hidden="true">{Array.from({length:16},(_,i)=><span key={i} style={{left:`${(i*41)%100}%`,animationDelay:`${(i%6)*.065}s`}}>{emoji}</span>)}</div>;
}
export function ExpressionSettings(){
 const [sound,setSound]=useState(false),[effects,setEffects]=useState(true);
 useEffect(()=>{try{setSound(localStorage.getItem("1muslim-expression-sounds")==="on");setEffects(localStorage.getItem("1muslim-expression-effects")!=="off")}catch{}},[]);
 return <div style={{display:"flex",gap:12,flexWrap:"wrap",fontSize:12,padding:"6px 0"}}>
 <label><input type="checkbox" checked={effects} onChange={e=>{setEffects(e.target.checked);try{localStorage.setItem("1muslim-expression-effects",e.target.checked?"on":"off")}catch{}}}/> ✨ Effects</label>
 <label><input type="checkbox" checked={sound} onChange={e=>{setSound(e.target.checked);try{localStorage.setItem("1muslim-expression-sounds",e.target.checked?"on":"off")}catch{}}}/> 🔊 Sounds</label>
 </div>;
}
