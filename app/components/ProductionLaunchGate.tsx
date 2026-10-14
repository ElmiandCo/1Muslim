"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {createClient} from "../../utils/supabase/client";

export default function ProductionLaunchGate(){
 const [status,setStatus]=useState<"checking"|"admin"|"visitor">("checking");
 const [stage,setStage]=useState(0);
 const [finished,setFinished]=useState(false);
 useEffect(()=>{
  if(window.location.hostname!=="1muslim.live"){setFinished(true);return;}
  let active=true;
  void createClient().auth.getUser().then(({data:{user}})=>{
   if(!active)return;
   setStatus(user?.email?.toLowerCase()==="hudhudbyelmi@gmail.com"&&!!user.email_confirmed_at?"admin":"visitor");
  }).catch(()=>{if(active)setStatus("visitor")});
  return()=>{active=false};
 },[]);
 useEffect(()=>{
  if(status==="checking"||finished)return;
  const timers=[
   window.setTimeout(()=>setStage(1),150),
   window.setTimeout(()=>{setStage(2);window.dispatchEvent(new Event("1muslim:hudhud-nav-toggle"))},1900),
   window.setTimeout(()=>setStage(3),4100),
   window.setTimeout(()=>{setStage(4);window.dispatchEvent(new Event("1muslim:hudhud-nav-toggle"))},6200),
   window.setTimeout(()=>{setStage(5);if(status==="admin")setFinished(true)},8000)
  ];
  return()=>timers.forEach(clearTimeout);
 },[status,finished]);
 if(finished)return null;
 return <div className={"launchGate launchGateStage"+stage} role="region" aria-label="1Muslim launch experience">
  <div className="launchGateVeil" aria-hidden="true"/>
  <div className="launchGateHalo" aria-hidden="true"/>
  <div className="launchGatePanel">
   <span className="launchGateEyebrow">✦ 1MUSLIM · بِسْمِ اللَّهِ</span>
   <span className="launchGateMark" aria-hidden="true">۞</span>
   <h2>{status==="admin"?"Welcome back.":"Something beautiful is coming."}</h2>
   <p>{status==="admin"?"Preparing your headquarters…":status==="checking"?"Preparing your experience…":"Our next chapter is almost here. You're invited to stay for the unveiling."}</p>
   {status==="visitor"&&<div className="launchGateActions"><Link href="/auth?login=1">Member sign in</Link><span>1Muslim · Coming soon</span></div>}
   <div className="launchGateProgress" aria-hidden="true"><i/></div>
  </div>
  <style jsx global>{`
   .launchGate{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;overflow:hidden;isolation:isolate;color:#f4e9d0;font-family:inherit}
   .launchGateVeil{position:absolute;inset:-8%;background:radial-gradient(ellipse at 52% 43%,rgba(17,56,43,.68),rgba(2,8,8,.94) 74%),rgba(0,0,0,.65);backdrop-filter:blur(2px) brightness(.6);opacity:.45;transform:scale(1.13);transition:opacity 7.8s cubic-bezier(.15,.65,.2,1),transform 7.8s cubic-bezier(.16,.7,.2,1),backdrop-filter 7.8s}
   .launchGateStage1 .launchGateVeil,.launchGateStage2 .launchGateVeil,.launchGateStage3 .launchGateVeil,.launchGateStage4 .launchGateVeil,.launchGateStage5 .launchGateVeil{opacity:.96;transform:scale(1);backdrop-filter:blur(15px) brightness(.2)}
   .launchGateHalo{position:absolute;width:min(105vw,960px);aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,rgba(203,167,92,.17),rgba(38,104,75,.08) 31%,transparent 65%);filter:blur(25px);transform:scale(1.3);opacity:.2;transition:transform 8s cubic-bezier(.12,.8,.18,1),opacity 5s}
   .launchGateStage2 .launchGateHalo,.launchGateStage3 .launchGateHalo,.launchGateStage4 .launchGateHalo,.launchGateStage5 .launchGateHalo{transform:scale(.7);opacity:.85}
   .launchGatePanel{position:relative;z-index:1;width:min(90vw,520px);padding:clamp(24px,5vw,56px);text-align:center;border:1px solid rgba(228,192,126,.3);border-radius:30px;background:linear-gradient(145deg,rgba(19,54,43,.55),rgba(4,13,14,.65));box-shadow:0 24px 110px #0009,inset 0 1px 1px #ffffff22;backdrop-filter:blur(25px);opacity:0;transform:translateY(35px) scale(.92);transition:opacity 1.5s ease,transform 5.5s cubic-bezier(.12,.78,.2,1)}
   .launchGateStage1 .launchGatePanel,.launchGateStage2 .launchGatePanel,.launchGateStage3 .launchGatePanel,.launchGateStage4 .launchGatePanel,.launchGateStage5 .launchGatePanel{opacity:1;transform:translateY(0) scale(1)}
   .launchGateEyebrow{font-size:10px;letter-spacing:.22em;color:#e2c58b}
   .launchGateMark{display:block;margin:16px auto;font-size:clamp(65px,13vw,110px);line-height:1;color:#ddc58f;text-shadow:0 0 65px #c8a85d66;animation:launchGateFloat 8s ease-in-out infinite}
   .launchGatePanel h2{font-size:clamp(25px,5vw,42px);letter-spacing:-.055em;line-height:1.1;margin:10px 0 14px}
   .launchGatePanel p{font-size:14px;line-height:1.6;color:#c3d2c8}
   .launchGateActions{display:grid;justify-items:center;gap:12px;margin-top:24px;font-size:11px;color:#c6b795}
   .launchGateActions a{color:#11291f;background:#e1c990;padding:13px 28px;border-radius:999px;text-decoration:none;font-weight:750}
   .launchGateProgress{height:2px;margin:27px auto 0;background:#ffffff24;overflow:hidden;border-radius:2px}
   .launchGateProgress i{display:block;width:100%;height:100%;background:linear-gradient(90deg,transparent,#d9c38e,#9ad9b5);transform:translateX(-100%);transition:transform 7.8s linear}
   .launchGateStage1 .launchGateProgress i,.launchGateStage2 .launchGateProgress i,.launchGateStage3 .launchGateProgress i,.launchGateStage4 .launchGateProgress i,.launchGateStage5 .launchGateProgress i{transform:translateX(0)}
   @keyframes launchGateFloat{50%{transform:translateY(-9px) scale(1.035)}}
   @media(prefers-reduced-motion:reduce){.launchGate *{animation:none!important;transition-duration:.01ms!important}}
  `}</style>
 </div>;
}
