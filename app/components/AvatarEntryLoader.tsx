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
const INTRO_MS=3000;
export default function AvatarEntryLoader({ready,signedIn,onComplete,onSignUp,showSignUp}:{ready:boolean;signedIn:boolean;onComplete:()=>void;onSignUp:()=>void;showSignUp:boolean}){
 const [phase,setPhase]=useState<"waiting"|"orbit"|"reveal">("waiting");
 const [loaded,setLoaded]=useState<number[]>([]);
 const portraits=useRef<(HTMLDivElement|null)[]>([]);
 const elapsed=useRef(0);
 const readyRef=useRef(ready);
 const signedInRef=useRef(signedIn);
 readyRef.current=ready;
 signedInRef.current=signedIn;
 useEffect(()=>{window.dispatchEvent(new Event("1muslim:prepare-for-you"))},[]);
 useEffect(()=>{
  let cancelled=false;
  // Decode images BEFORE the first animation frame. Never animate an empty portrait.
  Promise.all(avatars.map(([,src],index)=>new Promise<number|null>(resolve=>{
   const image=new window.Image();
   let settled=false;
   const finish=(ok:boolean)=>{if(settled)return;settled=true;resolve(ok?index:null)};
   image.onload=()=>{if(image.decode){image.decode().then(()=>finish(true)).catch(()=>finish(true))}else finish(true)};
   image.onerror=()=>finish(false);
   image.src=src;
   if(image.complete)finish(image.naturalWidth>0);
  }))).then(indices=>{if(cancelled)return;setLoaded(indices.filter((n):n is number=>n!==null));setPhase("orbit")});
  return()=>{cancelled=true};
 },[]);
 useEffect(()=>{
  if(phase!=="orbit")return;
  if(signedInRef.current&&readyRef.current){setPhase("reveal");return;}
  const started=performance.now();
  let raf=0;
  const tick=(now:number)=>{
   elapsed.current=Math.min(INTRO_MS,now-started);
   const width=Math.max(320,window.innerWidth);
   const spacing=Math.min(170,Math.max(108,width*.28));
   const count=loaded.length;
   // First avatar starts completely off the right edge, then glides left.
   const travel=elapsed.current/INTRO_MS*(count+2)*spacing;
   portraits.current.forEach((node,i)=>{
    if(!node)return;
    const order=loaded.indexOf(i);
    if(order<0){node.style.opacity="0";return}
    const x=width/2+110+order*spacing-travel;
    const visible=x<width/2+70&&x>-(width/2+100);
    const center=Math.max(0,1-Math.abs(x)/(width*.8));
    node.style.transform=`translate3d(${x}px,0,0) scale(${.88+.12*center})`;
    node.style.opacity=visible?String(Math.min(1,(width/2+70-x)/65,(x+width/2+100)/65)): "0";
    node.style.zIndex=String(50+Math.round(center*10));
   });
   if(elapsed.current<INTRO_MS)raf=requestAnimationFrame(tick);
   else if(readyRef.current)setPhase("reveal");
  };
  raf=requestAnimationFrame(tick);
  return()=>cancelAnimationFrame(raf);
 },[phase,loaded]);
 useEffect(()=>{
  if(phase!=="orbit"||elapsed.current<INTRO_MS||!ready)return;
  setPhase("reveal");
 },[ready,phase]);
 useEffect(()=>{
  if(phase!=="reveal")return;
  const done=window.setTimeout(onComplete,650);
  return()=>clearTimeout(done);
 },[phase,onComplete]);
 return <div className={`avatarEntry avatarEntry--${phase}`} role="status" aria-label="Preparing your 1Muslim experience">
  <div className="avatarEntryStage" aria-hidden="true">
   <div className="avatarEntryOrbitRing"/>
   <div className="avatarEntryOrbitRing avatarEntryOrbitRing--outer"/>
   <div className="avatarEntryOrbitRing avatarEntryOrbitRing--inner"/>
   <div className="avatarEntryOrbitSpark" />
   {avatars.map(([label,src],i)=><div key={src} ref={node=>{portraits.current[i]=node}} className="avatarEntryPortrait" title={label}>
     <img src={src} alt="" loading="eager" decoding="async" style={{opacity:loaded.includes(i)?1:0}}/>
   </div>)}
  </div>
  <strong className="avatarEntryBrand">1Muslim</strong>
  <span className="avatarEntryCaption">Preparing your space</span>
  <div className="avatarEntryProgress" aria-hidden="true"><i/></div>
  {showSignUp&&phase==="orbit"&&<div className="avatarEntrySignup">New Here and Muslim? <button type="button" onClick={onSignUp}>Sign Up →</button></div>}
 </div>;
}

