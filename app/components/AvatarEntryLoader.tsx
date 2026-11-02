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
const FRAME=650;
const CYCLE=avatars.length*FRAME;
export default function AvatarEntryLoader({ready,onComplete}:{ready:boolean;onComplete:()=>void}){
 const [phase,setPhase]=useState<"orbit"|"black"|"reveal">("orbit");
 const [frame,setFrame]=useState(0);
 const exitArmed=useRef(false);
 const exitTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>()=>{if(exitTimer.current)clearTimeout(exitTimer.current)},[]);
 useEffect(()=>{
  if(phase!=="orbit")return;
  const id=window.setInterval(()=>setFrame(v=>(v+1)%avatars.length),FRAME);
  return()=>clearInterval(id);
 },[phase]);
 useEffect(()=>{
  if(!ready||exitArmed.current)return;
  exitArmed.current=true;
  // Never cut the carousel off mid-sequence: complete its current lap,
  // ending on both default avatars before transitioning.
  const remaining=((avatars.length-1-frame+avatars.length)%avatars.length)*FRAME+FRAME;
  exitTimer.current=window.setTimeout(()=>setPhase("black"),remaining);
 },[ready,frame]);
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
   {avatars.map(([label,src],i)=>{
    const offset=(i-frame+avatars.length)%avatars.length;
    const signed=offset>avatars.length/2?offset-avatars.length:offset;
    const x=Math.sin(signed*.46)*Math.min(270,windowWidth());
    const y=(1-Math.cos(signed*.46))*35;
    const scale=Math.max(.42,1-Math.abs(signed)*.12);
    return <div key={src} className="avatarEntryPortrait" style={{transform:`translate3d(${x}px,${y}px,0) scale(${scale})`,opacity:Math.abs(signed)>5?0:1,zIndex:20-Math.abs(signed)}} title={label}>
     <img src={src} alt="" loading={i<6?"eager":"lazy"} onError={e=>{e.currentTarget.style.opacity="0"}}/>
    </div>;
   })}
  </div>
  <strong className="avatarEntryBrand">1Muslim</strong>
  <span className="avatarEntryCaption">Preparing your space</span>
  <div className="avatarEntryProgress" aria-hidden="true"><i/></div>
 </div>;
}
function windowWidth(){return typeof window==="undefined"?130:Math.min(130,window.innerWidth*.25)}
