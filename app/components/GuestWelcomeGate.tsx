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
   if(!session){timer=setTimeout(()=>{if(!active)return;setFade(true);setTimeout(()=>{if(active)router.push("/welcome")},1700)},60000)}
  };
  void check();
  const {data:{subscription}}=db.auth.onAuthStateChange((_event,session)=>{if(session){if(timer)clearTimeout(timer);setFade(false)}});
  return()=>{active=false;if(timer)clearTimeout(timer);subscription.unsubscribe()};
 },[pathname,router]);
 return fade?<div className="guestGateFade" role="status" aria-live="polite"><div className="guestGateBird">🦅</div><div>HudHud is guiding you to the next step…</div><style jsx>{`.guestGateFade{position:fixed;inset:0;z-index:9999;display:grid;place-content:center;gap:20px;text-align:center;background:#000;color:#b9ffe6;animation:guestFade 1.6s ease forwards;font-size:16px;letter-spacing:.04em}.guestGateBird{font-size:74px;animation:guestBird 1.4s ease-in-out both;filter:drop-shadow(0 0 25px #73ffe5)}@keyframes guestFade{from{opacity:0}to{opacity:1}}@keyframes guestBird{0%{transform:translateY(45px) scale(.6);opacity:0}60%{opacity:1}100%{transform:translateY(-12px) scale(1)}}@media(prefers-reduced-motion:reduce){.guestGateFade,.guestGateBird{animation:none}}`}</style></div>:null;
}
