"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";

const LIBRARY="/learn/elm-tent/library";
const QURAN="/elm-tent/quran";
const SIGNUP="/auth?shahada=1";
const packets=Array.from({length:32},(_,i)=>({x:(i*37+13)%100,y:(i*61+19)%100,delay:(i%11)*.19,size:2+(i%4)*2}));
export default function ElmiLightJourney(){
 const pathname=usePathname();
 const responded=useRef(false);
 const [stage,setStage]=useState<"off"|"dark"|"path"|"library"|"quran">("off");
 useEffect(()=>{
  if(!pathname)return;
  // The cinematic journey replays on every home-page load/refresh.
  const excluded=["/auth","/welcome","/onboarding","/streaming/live","/streaming/watch"];
  if(excluded.some(p=>pathname.startsWith(p))){setStage("off");return}
  try{
   const done=localStorage.getItem("1muslim-elmi-journey-v1");
   if(pathname==="/"){setStage("dark");const timer=setTimeout(()=>setStage(s=>s==="dark"?"path":s),2200);return()=>clearTimeout(timer)}
   if(done==="done"){setStage("off");return}
   if(pathname===LIBRARY){setStage("library");return}
   if(pathname===QURAN||pathname==="/quran-studio"){setStage("quran");return}
   if(!done){setStage("dark");const timer=setTimeout(()=>setStage(s=>s==="dark"?"path":s),2200);return()=>clearTimeout(timer)}
  }catch{setStage("off")}
 },[pathname]);
 useEffect(()=>{if(pathname!=="/"||stage!=="path"||responded.current)return;const hide=window.setTimeout(()=>setStage("off"),10000);return()=>window.clearTimeout(hide)},[stage,pathname]);
 useEffect(()=>{if(pathname!=="/")return;const timer=window.setInterval(()=>{if(!responded.current)setStage(s=>s==="off"?"path":s)},180000);return()=>window.clearInterval(timer)},[pathname]);
 useEffect(()=>{const replay=()=>{if(pathname==="/"){responded.current=false;setStage("dark");window.setTimeout(()=>setStage("path"),2200)}else window.location.href="/"};window.addEventListener("1muslim:replay-intro",replay);return()=>window.removeEventListener("1muslim:replay-intro",replay)},[pathname]);
 const finish=()=>{responded.current=true;try{localStorage.setItem("1muslim-elmi-journey-v1","done")}catch{}setStage("off")};
 if(stage==="off")return null;
 const reduced=typeof window!=="undefined"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
 return <div className="eljRoot" role="dialog" aria-modal="true" aria-label="Elmi Light guided journey to the Qur'an">
  <div className="eljDark"/>
  {!reduced&&<div className="eljPackets" aria-hidden="true">{packets.map((p,i)=><i key={i} style={{left:p.x+"%",top:p.y+"%",width:p.size,height:p.size,animationDelay:p.delay+"s"}}/>)}</div>}
  <div className="eljCenter">
   <div className="eljLight" aria-hidden="true">✦</div>
   <div className="eljKicker">1MUSLIM · ELMI LIGHT</div>
   {stage==="dark"?<><h2>From darkness, a light.</h2><p>Follow the light toward knowledge.</p></>:stage==="path"?<><h2>Your journey begins with a choice.</h2><p>To sign up for 1Muslim, you’ll be asked to sincerely affirm the Shahada. You can begin now, or explore the homepage first.</p><div className="eljChoices"><Link className="eljPrimary" href={SIGNUP} onClick={finish}>Sign up · Shahada →</Link><button className="eljSecondary" type="button" onClick={finish}>Not now · Home page</button></div></>:stage==="library"?<><h2>The Library of Knowledge</h2><p>Explore the books and learning resources. Your next destination is the Qur'an.</p><Link className="eljPrimary" href={QURAN}>Continue to Qur'an Studio 📖 →</Link></>:<><h2>You've reached the Qur'an.</h2><div className="eljVerse" lang="ar" dir="rtl">هَٰذَا بَيَانٌ لِّلنَّاسِ وَهُدًى وَمَوْعِظَةٌ لِّلْمُتَّقِينَ</div><p>Qur'an 3:138 · Explore Allah's words with HudHud.</p><button className="eljPrimary" onClick={finish}>Open Qur'an Studio ✨</button></>}
  </div>
  <button className="eljSkip" onClick={finish} aria-label="Skip guided introduction">Skip intro ✕</button>
  <style jsx>{`
  .eljRoot{position:fixed;inset:0;z-index:10020;display:grid;place-items:center;isolation:isolate;color:#effff8;overflow:hidden;padding:24px;text-align:center}
  .eljDark{position:absolute;inset:0;z-index:-2;background:radial-gradient(ellipse at 50% 52%,#092c28 0%,#010609 64%,#000 100%);animation:eljFade .9s ease both}
  .eljPackets{position:absolute;inset:0;z-index:-1;pointer-events:none}
  .eljPackets i{position:absolute;border-radius:50%;background:#a5ffe1;box-shadow:0 0 14px 4px #48ffc47a,0 0 45px 9px #1bc4ff38;animation:eljPulse 3s ease-in-out infinite alternate}
  .eljCenter{width:min(600px,100%);padding:35px 22px;border:1px solid #7bffcc45;border-radius:30px;background:linear-gradient(145deg,#09231fbf,#010609bd);box-shadow:0 0 120px #40e7a02b;backdrop-filter:blur(12px);animation:eljRise .9s ease both}
  .eljLight{font-size:clamp(70px,16vw,125px);line-height:1;color:#ccffdf;text-shadow:0 0 22px #65ffc2,0 0 90px #23d7d0;animation:eljPulse 2.6s ease-in-out infinite alternate}
  .eljKicker{font-size:11px;letter-spacing:.3em;color:#95f4c6;margin:16px 0}
  .eljCenter h2{font-size:clamp(27px,6vw,44px);line-height:1.13;margin:14px 0;color:white}
  .eljCenter p{line-height:1.65;color:#b6dcd1;margin:14px auto 24px;max-width:420px}
  .eljVerse{font-family:serif;font-size:clamp(24px,5vw,37px);line-height:2;color:#f6f9e4;margin:20px 0}
  .eljPrimary{display:inline-block;cursor:pointer;border:1px solid #aaffd6;border-radius:999px;background:linear-gradient(100deg,#c6ffe1,#8be6d5);padding:15px 24px;color:#04221a;font-weight:800;text-decoration:none;box-shadow:0 0 35px #6afec65a}
  .eljChoices{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;align-items:center;margin-top:12px}.eljSecondary{cursor:pointer;border:1px solid #aaffd67a;border-radius:999px;background:rgba(13,53,41,.55);padding:15px 24px;color:#d5ffec;font-weight:800;backdrop-filter:blur(8px)}
  .eljSkip{position:absolute;right:18px;top:calc(18px + env(safe-area-inset-top));background:#102622a8;border:1px solid #d8ffe266;border-radius:999px;color:#d6fff0;padding:10px 16px;cursor:pointer}
  @keyframes eljPulse{to{opacity:.35;transform:scale(.8)}}@keyframes eljFade{from{opacity:0}to{opacity:1}}@keyframes eljRise{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
  @media(prefers-reduced-motion:reduce){.eljRoot *{animation:none!important;backdrop-filter:none!important}}
  `}</style>
 </div>
}
