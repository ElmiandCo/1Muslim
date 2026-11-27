"use client";
import {useEffect,useState,type PointerEvent} from "react";
import "./hudhud-orb.css";
type Props={listening?:boolean;speaking?:boolean;thinking?:boolean;quiet?:boolean;compact?:boolean;level?:number;onClick?:()=>void};
export default function HudHudOrb({listening=false,speaking=false,thinking=false,quiet=false,compact=false,level=0,onClick}:Props){
 const [drift,setDrift]=useState({x:0,y:0});
 const [motion,setMotion]=useState(true);
 useEffect(()=>{const preference=matchMedia("(prefers-reduced-motion: reduce)");const update=()=>setMotion(!preference.matches);update();preference.addEventListener("change",update);return()=>preference.removeEventListener("change",update)},[]);
 const pointer=(event:PointerEvent<HTMLButtonElement>)=>{
  if(!motion)return;
  const bounds=event.currentTarget.getBoundingClientRect();
  const x=(event.clientX-bounds.left-bounds.width/2)/bounds.width;
  const y=(event.clientY-bounds.top-bounds.height/2)/bounds.height;
  setDrift({x:Math.max(-7,Math.min(7,x*10)),y:Math.max(-7,Math.min(7,y*10))});
 };
 return <button className={"hudV2Orb "+(compact?"hudV2OrbCompact ":"")+(listening?"isListening ":"")+(thinking?"isThinking ":"")+(speaking?"isSpeaking ":"")+(quiet?"isQuiet ":"")}
  type="button" onClick={onClick} onPointerMove={pointer} onPointerLeave={()=>setDrift({x:0,y:0})}
  style={{"--orb-tilt-x":drift.x+"deg","--orb-tilt-y":drift.y+"deg","--orb-level":String(Math.max(0,Math.min(1,level)))} as React.CSSProperties}
  aria-label={listening?"HudHud is listening":speaking?"HudHud is speaking":thinking?"HudHud is thinking":"HudHud voice assistant"} aria-pressed={listening}>
  <span className="hudV2MagneticField" aria-hidden="true"/>
  <span className="hudV2Sphere" aria-hidden="true">
   <i className="hudV2Layer hudV2LayerA"/><i className="hudV2Layer hudV2LayerB"/><i className="hudV2Layer hudV2LayerC"/>
   <i className="hudV2Core"/><i className="hudV2Highlight"/><i className="hudV2Noise"/>
  </span>
  <span className="hudV2OrbitSwarm" aria-hidden="true"><i className="hudV2OrbitNear"/><i className="hudV2OrbitFar"/><i className="hudV2Satellite hudV2SatelliteA"/><i className="hudV2Satellite hudV2SatelliteB"/><i className="hudV2Satellite hudV2SatelliteC"/></span>
  <span className="hudV2Particles" aria-hidden="true">{Array.from({length:9},(_,i)=><i key={i} style={{"--i":i} as React.CSSProperties}/>)}</span>
 </button>;
}
