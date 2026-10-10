"use client";
import {useEffect,useState} from "react";
import {usePathname} from "next/navigation";
import {createClient} from "../../utils/supabase/client";
const DELAY=150000;
export default function GuestWelcomeGate(){
 const pathname=usePathname();
 const [show,setShow]=useState(false);
 const [training,setTraining]=useState(false);
 const [identity,setIdentity]=useState("guest");
 useEffect(()=>{
  const db=createClient();let active=true;
  void db.auth.getUser().then(({data})=>{if(active)setIdentity(data.user?.id||"guest")});
  return()=>{active=false};
 },[]);
 useEffect(()=>{
  setShow(false);
  if(pathname!=="/")return;
  const key="1muslim:training-dismissed:"+identity;
  try{
   localStorage.setItem("1muslim-elmi-light","on");
   if(localStorage.getItem("1muslim-hudhud-tactical-vision")!=="off")localStorage.setItem("1muslim-hudhud-tactical-vision","on");
   if(localStorage.getItem(key)==="1")return;
  }catch{}
  const timer=window.setTimeout(()=>{if(document.visibilityState==="visible")setShow(true)},DELAY);
  return()=>window.clearTimeout(timer);
 },[pathname,identity]);
 const dismiss=()=>{setShow(false);setTraining(false);try{localStorage.setItem("1muslim:training-dismissed:"+identity,"1")}catch{}window.dispatchEvent(new Event("1muslim:training-cancel"))};
 const begin=()=>{setShow(false);setTraining(true);window.dispatchEvent(new Event("1muslim:training-start"))};
 useEffect(()=>{const stop=()=>dismiss();window.addEventListener("1muslim:training-close",stop);window.addEventListener("1muslim:training-cancel",stop);return()=>{window.removeEventListener("1muslim:training-close",stop);window.removeEventListener("1muslim:training-cancel",stop)}},[identity]);
 if(!show&&!training)return null;
 return <div className="hhTrainingGate" role="dialog" aria-modal="false" aria-label="HudHud training">
 <button type="button" className="hhTrainingClose" aria-label="Cancel training everywhere" onClick={dismiss}>×</button>
 <img src="/assets/hudhud-logo.PNG" alt="" width={48} height={48}/>
 <strong>{training?"✦ HudHud Training Mode":"Ready to explore 1Muslim?"}</strong>
 <p>{training?"Explore the page with HudHud. Close this card to end training everywhere.":"Would you like HudHud to show you around? Your preferences are already enabled."}</p>
 <div><button onClick={training?()=>window.dispatchEvent(new Event("1muslim:training-next")):begin}>{training?"Next step →":"Turn on Training Mode"}</button><button onClick={dismiss}>{training?"Finish training":"Not now"}</button></div>
 <style jsx>{`
 .hhTrainingGate{position:fixed;bottom:calc(105px + env(safe-area-inset-bottom,0px));left:50%;transform:translateX(-50%);width:min(92vw,370px);z-index:10065;border:1px solid #75e9c4;border-radius:22px;background:#0d2334f5;box-shadow:0 18px 50px #0009;color:#f4fffb;padding:20px;display:grid;gap:10px;text-align:center;justify-items:center}
 .hhTrainingGate strong{font-size:17px}.hhTrainingGate p{font-size:13px;line-height:1.6;margin:0;color:#c6dedb}.hhTrainingGate>div{display:flex;flex-wrap:wrap;justify-content:center;gap:9px}.hhTrainingGate button{cursor:pointer;border:1px solid #82e8c7;border-radius:999px;background:#164b4b;color:white;padding:10px 14px}.hhTrainingGate .hhTrainingClose{position:absolute;right:9px;top:8px;border:0;background:transparent;font-size:23px;padding:4px 9px}
 `}</style></div>;
}
