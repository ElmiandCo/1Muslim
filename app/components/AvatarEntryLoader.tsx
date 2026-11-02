"use client";
import {useEffect,useRef,useState} from "react";
import "./AvatarEntryLoader.css";

// All assets come from the existing 1Muslim avatar collection.
// The final two frames intentionally show the default male and female.
const avatars=[
 ["Emerald Royalty","/assets/avatars/emerald-royalty-female.PNG"],
 ["Gold","/assets/avatars/gold-avatar-male.PNG"],
 ["Violet Sentinel","/assets/avatars/violet-sentinel-female.PNG"],
 ["Cosmic","/assets/avatars/cosmic-avatar-female.PNG"],
 ["Diamond","/assets/avatars/diamond-avatar-female.PNG"],
 ["Silver","/assets/avatars/silver-avatar-male.jpg"],
 ["Tina the Salafi","/assets/avatars/tina-the-salafi-female.PNG"],
 ["Water","/assets/avatars/water-avatar-male.PNG"],
 ["Floral","/assets/avatars/floral-avatar-female.PNG"],
 ["Cosmic","/assets/avatars/cosmic-avatar-male.PNG"],
 ["Gold","/assets/avatars/gold-avatar-female.PNG"],
 ["Default Male","/assets/avatars/default-male.jpg"],
 ["Default Female","/assets/avatars/Default-women.png"],
] as const;
const FRAME=520;
const CYCLE=avatars.length*FRAME;
export default function AvatarEntryLoader({ready,signedIn,onComplete,onSignUp,showSignUp}:{ready:boolean;signedIn:boolean;onComplete:()=>void;onSignUp:()=>void;showSignUp:boolean}){
 const [phase,setPhase]=useState<"waiting"|"orbit"|"black"|"reveal">("waiting");
 const started=useRef(false);
 const readyRef=useRef(ready);
 const signedInRef=useRef(signedIn);
 readyRef.current=ready;
 signedInRef.current=signedIn;
 const portraits=useRef<(HTMLDivElement|null)[]>([]);
 const elapsed=useRef(0);
 useEffect(()=>{
  const timer=window.setTimeout(()=>{
   if(readyRef.current&&signedInRef.current){setPhase("reveal");return;}
   started.current=true;
   setPhase("orbit");
  },1000);
  return()=>clearTimeout(timer);
 },[]);
 useEffect(()=>{
  if(!ready||!signedIn||!started.current)return;
  // Never force an authenticated visitor to watch a full carousel.
  setPhase(current=>current==="orbit"?"black":current);
 },[ready]);
 useEffect(()=>{
  if(phase!=="orbit")return;
  let raf=0;
  let previous=0;
  const tick=(now:number)=>{
   if(!previous)previous=now;
   elapsed.current+=Math.min(48,now-previous);
   if(readyRef.current&&!signedInRef.current&&elapsed.current>=CYCLE){setPhase("black");return;}
   previous=now;
   const progress=elapsed.current/FRAME;
   const width=Math.max(300,Math.min(520,window.innerWidth*.95));
   portraits.current.forEach((node,i)=>{
    if(!node)return;
    const angle=(i-progress)*Math.PI*2/avatars.length;
    const depth=Math.cos(angle);
    const x=Math.sin(angle)*width;
    const y=(1-depth)*70;
    const scale=.78+.22*(depth+1)/2;
    node.style.transform=`translate3d(${x}px,${y}px,0) scale(${scale})`;
    node.style.opacity=String(Math.max(0,Math.min(1,(depth-.02)*2.5)));
    node.style.zIndex=String(Math.round(50+depth*20));
   });
   raf=requestAnimationFrame(tick);
  };
  raf=requestAnimationFrame(tick);
  return()=>cancelAnimationFrame(raf);
 },[phase]);
 useEffect(()=>{
  if(phase!=="black")return;
  const fade=window.setTimeout(()=>setPhase("reveal"),500);
  return()=>clearTimeout(fade);
 },[phase]);
 useEffect(()=>{
  if(phase!=="reveal")return;
  const done=window.setTimeout(onComplete,1200);
  return()=>clearTimeout(done);
 },[phase,onComplete]);
 return <div className={`avatarEntry avatarEntry--${phase}`} role="status" aria-label="Preparing your 1Muslim experience">
  <div className="avatarEntryStage" aria-hidden="true">
   <div className="avatarEntryOrbitRing"/>
   <div className="avatarEntryOrbitRing avatarEntryOrbitRing--outer"/>
   <div className="avatarEntryOrbitRing avatarEntryOrbitRing--inner"/>
   <div className="avatarEntryOrbitSpark" />
   {avatars.map(([label,src],i)=><div key={src} ref={node=>{portraits.current[i]=node}} className="avatarEntryPortrait" title={label}>
     <img src={src} alt="" loading={i<6?"eager":"lazy"} onError={e=>{e.currentTarget.style.opacity="0"}}/>
   </div>)}
  </div>
  <strong className="avatarEntryBrand">1Muslim</strong>
  <span className="avatarEntryCaption">Preparing your space</span>
  <div className="avatarEntryProgress" aria-hidden="true"><i/></div>
  {showSignUp&&phase==="orbit"&&<div className="avatarEntrySignup">New Here and Muslim? <button type="button" onClick={onSignUp}>Sign Up →</button></div>}
 </div>;
}

