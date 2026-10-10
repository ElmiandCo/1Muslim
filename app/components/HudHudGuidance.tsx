"use client";
import {useEffect,useRef,useState} from "react";
import {usePathname,useRouter} from "next/navigation";

type Stop={id:string;title:string;href:string;selector?:string;description:string;dwell:number};
const verse:Stop={id:"verse",title:"Read a verse",href:"/elm-tent/quran?surah=20&verse=114",description:"Qur'an 20:114 — My Lord, increase me in knowledge. Take a moment to read and reflect.",dwell:7000};
const community:Stop={id:"community",title:"Explore the community",href:"/#community",selector:"#community",description:"See how members discuss and share beneficial reminders.",dwell:6000};
const video:Stop={id:"video",title:"Watch a lesson",href:"/#video-of-day",selector:"#video-of-day",description:"Explore today's video and think about what you learned.",dwell:6500};
const share:Stop={id:"share",title:"Prepare a Verse Share",href:"/#community",selector:"#community",description:"Create a post about Qur'an 20:114. Review the verse and your own reflection before publishing.",dwell:6500};
const live:Stop={id:"live",title:"Explore Live",href:"/#live-now",selector:"#live-now",description:"Discover live learning and conversations. Joining is your choice.",dwell:6000};
const routes:Record<string,Stop[]>={reflect:[verse,community,share],watch:[verse,video,share],live:[verse,live,share]};
const storage="1muslim:hudhud-guidance-journey-v2";
export default function HudHudGuidance(){
 const router=useRouter(),pathname=usePathname();
 const [running,setRunning]=useState(false),[step,setStep]=useState(0),[route,setRoute]=useState("reflect"),[phase,setPhase]=useState<"travel"|"observe"|"question"|"finish">("travel"),[remaining,setRemaining]=useState(0),[paused,setPaused]=useState(false);
 const [answer,setAnswer]=useState<string|null>(null);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null),token=useRef(0);
 const stops=routes[route]||routes.reflect,stop=stops[Math.min(step,stops.length-1)];
 const cancelTimer=()=>{if(timer.current){clearTimeout(timer.current);timer.current=null}};
 const finish=()=>{cancelTimer();setPhase("finish");setPaused(false);try{sessionStorage.removeItem(storage)}catch{}};
 const close=()=>{cancelTimer();token.current++;setRunning(false);setPaused(false);try{sessionStorage.removeItem(storage)}catch{}window.dispatchEvent(new Event("1muslim:guidance-finished"))};
 const advance=()=>{cancelTimer();if(step>=stops.length-1){finish();return}setStep(s=>s+1);setPhase("travel");setAnswer(null)};
 useEffect(()=>{const launch=()=>{token.current++;cancelTimer();setRoute("reflect");setStep(0);setPhase("travel");setAnswer(null);setPaused(false);setRunning(true)};window.addEventListener("1muslim:hudhud-guidance",launch);return()=>{window.removeEventListener("1muslim:hudhud-guidance",launch);cancelTimer()}},[]);
 useEffect(()=>{if(!running||phase!=="travel")return;const current=token.current;const url=new URL(stop.href,window.location.origin);if(url.pathname!==pathname){router.push(stop.href);return}const id=stop.selector||url.hash;const node=id?document.querySelector<HTMLElement>(id):document.querySelector<HTMLElement>("main");if(id&&!node){finish();return}node?.scrollIntoView({behavior:"smooth",block:"center"});node?.classList.add("hudhud-guidance-target");timer.current=setTimeout(()=>{if(current!==token.current)return;node?.classList.remove("hudhud-guidance-target");setRemaining(stop.dwell);setPhase("observe")},950);return()=>{cancelTimer();node?.classList.remove("hudhud-guidance-target")}},[running,phase,pathname,step,route,router,stop.href,stop.selector,stop.dwell]);
 useEffect(()=>{if(!running||phase!=="observe"||paused)return;timer.current=setTimeout(()=>{if(step===0){setPhase("question")}else advance()},remaining||stop.dwell);return cancelTimer},[running,phase,paused,step,remaining,stop.dwell]);
 useEffect(()=>{if(!running||phase==="finish")return;try{sessionStorage.setItem(storage,JSON.stringify({route,step,phase}))}catch{}},[running,route,step,phase]);
 if(!running)return null;
 const choose=(choice:string)=>{setAnswer(choice);setRoute(choice);setStep(1);setPhase("travel")};
 return <div className="hh-trip-root" role="dialog" aria-modal="true" aria-label="HudHud Guided Journey">
 <div className="hh-trip-dim"/>
 <section className="hh-trip-card">
 <header><img src="/assets/hudhud-logo.PNG" alt="HudHud"/><div><small>HUDHUD GUIDED JOURNEY</small><strong>{phase==="finish"?"Journey complete":stop.title}</strong><small>{phase==="finish"?"All stops completed":`Stop ${step+1} of ${stops.length}`}</small></div><button type="button" onClick={close} aria-label="Exit guided journey">✕</button></header>
 {phase==="finish"?<><p>🎉 Your guided trip is over! You explored a Qur'an verse and discovered ways to learn and share. Nothing was posted automatically.</p><button type="button" onClick={close}>Finish journey ✓</button></>:
 phase==="question"?<><p>You've read Qur'an 20:114. Where would you like HudHud to take you next?</p><div className="hh-trip-options"><button onClick={()=>choose("reflect")}>Explore community discussion</button><button onClick={()=>choose("watch")}>Watch a related lesson</button><button onClick={()=>choose("live")}>See what's Live</button></div></>:
 <><p>{stop.description}</p><p className="hh-trip-hint">{phase==="travel"?"Moving to your next stop…":paused?"Paused — take your time.":"Take a few seconds to look at this section."}</p><div className="hh-trip-actions"><button type="button" onClick={()=>{setPaused(p=>!p);setRemaining(stop.dwell)}} disabled={phase!=="observe"}>{paused?"Resume":"Pause"}</button><button type="button" onClick={advance}>Next stop →</button></div></>}
 <footer><span>{answer?"Route: "+answer:"Your route can change after the first stop"}</span><button type="button" onClick={close}>End trip</button></footer>
 </section>
 <style jsx>{`
 .hh-trip-root{position:fixed;inset:0;z-index:10050;pointer-events:none;color:#fff;font-family:inherit}
 .hh-trip-dim{position:absolute;inset:0;background:rgba(0,8,18,.48);backdrop-filter:brightness(.76);pointer-events:none;animation:tripDim .4s ease both}
 .hh-trip-card{position:absolute;bottom:max(88px,env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);width:min(450px,calc(100vw - 28px));max-height:70dvh;overflow:auto;pointer-events:auto;padding:16px;border:1px solid #72daca88;border-radius:22px;background:#091c2af2;box-shadow:0 12px 60px #0009;animation:tripIn .4s ease both}
 .hh-trip-card header{display:flex;align-items:center;gap:12px}.hh-trip-card header img{width:48px;height:48px;object-fit:contain}.hh-trip-card header div{flex:1;display:grid;gap:3px}.hh-trip-card small{font-size:10px;color:#8be8d8}.hh-trip-card strong{font-size:17px}.hh-trip-card p{font-size:13px;line-height:1.6;color:#e4f0f2}.hh-trip-hint{color:#95c7c9!important}
 .hh-trip-card button{border:1px solid #66b8bb;border-radius:11px;background:#163f51;color:white;padding:9px 12px;cursor:pointer}.hh-trip-card button:disabled{opacity:.4}
 .hh-trip-actions,.hh-trip-options{display:flex;gap:8px;flex-wrap:wrap}.hh-trip-options{flex-direction:column}.hh-trip-card footer{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:12px;color:#8fb4c2;font-size:10px}
 @keyframes tripIn{from{opacity:0;translate:0 20px}to{opacity:1;translate:0 0}}@keyframes tripDim{from{opacity:0}to{opacity:1}}
 @media(prefers-reduced-motion:reduce){.hh-trip-root *{animation:none!important}}
 `}</style>
 </div>;
}
