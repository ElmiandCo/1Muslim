"use client";
import {useEffect,useState} from "react";
import {usePathname,useRouter} from "next/navigation";
import {createClient} from "../../utils/supabase/client";
export default function GuestWelcomeGate(){
 const pathname=usePathname(),router=useRouter();
 const [fade,setFade]=useState(false);
 useEffect(()=>{
  if(!pathname||pathname.startsWith("/auth")||pathname.startsWith("/welcome")||pathname.startsWith("/onboarding")||pathname.startsWith("/terms")||pathname.startsWith("/privacy"))return;
  let active=true;let timer:ReturnType<typeof setTimeout>|undefined;
  const db=createClient();
  const check=async()=>{
   const {data:{session}}=await db.auth.getSession();
   if(!active)return;
   if(!session){timer=setTimeout(()=>{if(!active)return;setFade(true)},60000)}
  };
  void check();
  const {data:{subscription}}=db.auth.onAuthStateChange((_event,session)=>{if(session){if(timer)clearTimeout(timer);setFade(false)}});
  return()=>{active=false;if(timer)clearTimeout(timer);subscription.unsubscribe()};
 },[pathname,router]);
 return fade?<div className="guestGateFade" role="dialog" aria-modal="true" aria-label="HudHud welcome">
 <button type="button" className="guestGateClose" aria-label="Close HudHud guidance" onClick={()=>setFade(false)}>✕</button>
 <div className="guestGateContent"><img className="guestGateBird" src="/assets/hudhud-logo.PNG" alt="HudHud"/><div>HudHud is ready to guide you 💚</div>
 <div className="guestGateActions"><button type="button" onClick={()=>setFade(false)}>Stay here</button><button type="button" onClick={()=>{setFade(false);router.push("/welcome")}}>Continue →</button></div></div>
 <style jsx>{`
 .guestGateFade{position:fixed;inset:0;z-index:10060;display:grid;place-items:center;padding:24px;text-align:center;background:#000e;color:#b9ffe6;animation:guestFade .35s ease both;font-size:clamp(16px,4vw,22px);letter-spacing:.02em}
 .guestGateContent{display:grid;justify-items:center;gap:22px;max-width:460px}
 .guestGateBird{width:110px;height:110px;object-fit:contain;filter:drop-shadow(0 0 25px #73ffe588);animation:guestBird 1.5s ease-in-out both}
 .guestGateClose{position:absolute;top:calc(20px + env(safe-area-inset-top,0px));right:20px;width:48px;height:48px;border-radius:50%;border:1px solid #a4ffe4a8;background:#123a34;color:#e7fff7;font-size:23px;cursor:pointer;box-shadow:0 0 20px #6effc544;z-index:1}
 .guestGateActions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
 .guestGateActions button{padding:12px 19px;border-radius:999px;border:1px solid #8dffe4;background:#102b29;color:#eafff7;font-size:14px;font-weight:700;cursor:pointer}
 .guestGateActions button:last-child{background:#a5ffe3;color:#07322a}
 @keyframes guestFade{from{opacity:0}to{opacity:1}}@keyframes guestBird{0%{transform:translateY(20px) scale(.8);opacity:0}100%{transform:translateY(0) scale(1);opacity:1}}
 @media(prefers-reduced-motion:reduce){.guestGateFade,.guestGateBird{animation:none}}
 `}</style></div>:null;
}
