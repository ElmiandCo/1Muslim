"use client";
import {useEffect,useRef,useState} from "react";
import {createClient} from "../../utils/supabase/client";

/** Plays the original HudHud welcome recording on the first authenticated home visit. */
export default function FirstLoginIntroAudio(){
 const audioRef=useRef<HTMLAudioElement|null>(null);
 const [needsTap,setNeedsTap]=useState(false);
 const [userId,setUserId]=useState<string|null>(null);
 const [attempted,setAttempted]=useState(false);
 const key=(id:string)=>"1muslim:first-login-intro-played:"+id;
 useEffect(()=>{
  let active=true;
  const supabase=createClient();
  const check=async()=>{
   const {data:{user}}=await supabase.auth.getUser();
   if(!active||!user)return;
   if(localStorage.getItem(key(user.id))==="1")return;
   setUserId(user.id);
  };
  void check();
  const {data:{subscription}}=supabase.auth.onAuthStateChange(()=>{void check()});
  return()=>{active=false;subscription.unsubscribe()};
 },[]);
 useEffect(()=>{
  if(!userId||attempted)return;
  const media=audioRef.current;if(!media)return;
  setAttempted(true);
  media.volume=.75;
  media.muted=false;
  const start=async()=>{try{window.dispatchEvent(new Event("1muslim:hudhud-welcome"));await media.play();setNeedsTap(false)}catch{setNeedsTap(true)}};
  void start();
 },[userId,attempted]);
 const playFromTap=async()=>{const media=audioRef.current;if(!media)return;try{media.volume=.75;media.muted=false;window.dispatchEvent(new Event("1muslim:hudhud-welcome"));await media.play();setNeedsTap(false)}catch{setNeedsTap(true)}};
 const markPlayed=()=>{if(userId)localStorage.setItem(key(userId),"1");setNeedsTap(false)};
 if(!userId)return null;
 return <><audio ref={audioRef} src="/audio/hudhud-welcome.mp3" preload="auto" aria-hidden="true" style={{position:"fixed",width:1,height:1,opacity:0,pointerEvents:"none"}} onEnded={markPlayed} onError={()=>setNeedsTap(true)}/>{needsTap&&<button type="button" onClick={playFromTap} style={{position:"fixed",bottom:"max(90px,env(safe-area-inset-bottom))",left:"50%",transform:"translateX(-50%)",zIndex:2147482900,padding:"12px 18px",borderRadius:24,border:"1px solid #c9a96a",background:"#061713ee",color:"#f6e5b8",boxShadow:"0 8px 30px #0009"}}>🔊 Tap to hear your 1Muslim welcome</button>}</>;
}
