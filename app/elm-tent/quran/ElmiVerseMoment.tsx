"use client";
import {useEffect,useRef,useState} from "react";
const VERSE="فَإِنَّ مَعَ الْعُسْرِ يُسْرًا"; // Qur'an 94:5; text is never modified.
type Phase="float"|"anticipate"|"converge"|"reveal";
const motes=Array.from({length:15},(_,i)=>({id:i,angle:i*137.5,radius:60+(i%5)*21,delay:(i%7)*42}));
export default function ElmiVerseMoment(){
 const [phase,setPhase]=useState<Phase>("float"),[count,setCount]=useState(0);
 const timers=useRef<number[]>([]);
 const start=()=>{if(phase==="anticipate"||phase==="converge")return;
  timers.current.forEach(clearTimeout);timers.current=[];
  setCount(n=>n+1);setPhase("anticipate");
  timers.current.push(window.setTimeout(()=>setPhase("converge"),680));
  timers.current.push(window.setTimeout(()=>setPhase("reveal"),1240));
  timers.current.push(window.setTimeout(()=>setPhase("float"),3100));
 };
 useEffect(()=>()=>timers.current.forEach(clearTimeout),[]);
 return <section className={"evmStage evm-"+phase} aria-label="Interactive Elmi Light Qur'an verse animation">
  <div className="evmAurora" aria-hidden="true"/>
  <div className="evmOrbit evmOrbitOne" aria-hidden="true"/><div className="evmOrbit evmOrbitTwo" aria-hidden="true"/>
  <div className="evmMotes" aria-hidden="true">{motes.map(m=><span key={m.id} className="evmMote" style={{["--a" as string]:m.angle+"deg",["--r" as string]:m.radius+"px",["--d" as string]:m.delay+"ms",["--n" as string]:m.id}}/>)}</div>
  <div className="evmFlash" aria-hidden="true"/>
  <button type="button" className="evmBubble" onClick={start} aria-label="Touch the floating Quran verse bubble to activate Elmi Light">
   <span className="evmGlass" aria-hidden="true"/><span className="evmShimmer" aria-hidden="true"/>
   <span className="evmArabic" lang="ar" dir="rtl">{VERSE}</span>
   <span className="evmReference">سورة الشرح · 94:5</span>
  </button>
  <span className="evmCaption" aria-live="polite">{phase==="anticipate"?"✦ Elmi Light is gathering…":phase==="converge"?"✦ Light meets the words":phase==="reveal"?"✦ سبحان الله":"✧ Touch the floating verse"}</span>
  <style jsx>{`
.evmStage{--mint:#a1ffe0;position:relative;isolation:isolate;overflow:hidden;display:grid;place-items:center;min-height:335px;margin:20px 0;border-radius:30px;border:1px solid #b1e6da38;background:radial-gradient(ellipse at 48% 75%,#3a667655,transparent 65%),linear-gradient(140deg,#071a25,#101a35 55%,#122b2c);perspective:850px}
.evmAurora{position:absolute;inset:-35%;background:conic-gradient(from 35deg at 50% 50%,transparent,#83fbd322,transparent,#a7a0ff25,transparent,#e7c77d21,transparent);filter:blur(33px);animation:evmAurora 13s linear infinite}
.evmOrbit{position:absolute;width:290px;height:190px;border:1px solid #b4ffe529;border-radius:50%;transform:rotate(-22deg);filter:drop-shadow(0 0 12px #93ffd340);animation:evmOrbitA 9s ease-in-out infinite}
.evmOrbitTwo{width:340px;height:165px;transform:rotate(28deg);border-color:#a8a4ff32;animation:evmOrbitB 11s ease-in-out infinite}
.evmBubble{position:relative;z-index:4;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;width:min(82%,520px);min-height:182px;padding:26px 20px;border:1px solid #d5fff5a3;border-radius:50% 48% 49% 51% / 48% 52% 48% 52%;color:#fffbed;background:radial-gradient(ellipse at 25% 12%,#ffffff2c,transparent 45%),radial-gradient(ellipse at 80% 90%,#70f6c91c,transparent 52%),linear-gradient(130deg,#b8eaff1c,#b8b4ff12 55%,#ffd49d15);box-shadow:inset 0 0 25px #f3ffff29,inset 0 -16px 25px #82f7d514,0 18px 50px #0007,0 0 34px #9bf6df1f;backdrop-filter:blur(14px) saturate(1.5);-webkit-backdrop-filter:blur(14px) saturate(1.5);cursor:pointer;touch-action:manipulation;animation:evmFloat 6.5s ease-in-out infinite;transition:border-color .3s,box-shadow .3s}
.evmBubble:focus-visible{outline:3px solid #fff0b0;outline-offset:5px}
.evmGlass{position:absolute;inset:5px;border-radius:inherit;border:1px solid #ffffff25;pointer-events:none}
.evmShimmer{position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:linear-gradient(105deg,transparent 28%,#ffffff20 44%,transparent 59%);background-size:230% 100%;animation:evmShimmer 6s linear infinite}
.evmArabic{position:relative;z-index:1;font-family:"Amiri Quran","Amiri","Noto Naskh Arabic",serif;font-size:clamp(26px,4.3vw,48px);line-height:1.85;text-align:center;text-shadow:0 0 17px #c9ffde88}
.evmReference{z-index:1;font-size:11px;letter-spacing:.08em;color:#c3e9e0}
.evmCaption{position:absolute;z-index:6;bottom:15px;left:10px;right:10px;text-align:center;font-size:12px;letter-spacing:.08em;color:#d6f6e8;pointer-events:none}
.evmMotes{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none;z-index:3}
.evmMote{position:absolute;width:5px;height:5px;border-radius:50%;background:#faffde;box-shadow:0 0 9px 4px #8fffe4,0 0 25px 8px #9c8eff66;transform:rotate(var(--a)) translateX(var(--r));opacity:.75;animation:evmMoteFloat calc(4s + var(--n)*.13s) ease-in-out infinite alternate}
.evmMote:nth-child(3n){background:#ffe7a0;box-shadow:0 0 12px 5px #ffdd98a0}
.evmMote:nth-child(4n){background:#d9c3ff;box-shadow:0 0 12px 5px #a2a4ff99}
.evmFlash{position:absolute;inset:0;z-index:5;pointer-events:none;opacity:0;background:radial-gradient(circle at center,#fffefaaf,#a6ffe960 18%,transparent 65%)}
.evm-anticipate .evmBubble{animation:evmReact .68s cubic-bezier(.2,.9,.3,1) both;border-color:#fff6ca;box-shadow:0 0 25px #9bffe9,0 0 65px #b6a0ff7a,inset 0 0 36px #ffffff6b}
.evm-anticipate .evmMote{animation:evmGather .7s ease-in forwards;animation-delay:var(--d)}
.evm-converge .evmBubble{animation:evmImpact .53s cubic-bezier(.1,.85,.25,1) both}
.evm-converge .evmMote{animation:evmCollapse .42s ease-in both;animation-delay:calc(var(--d)*.3)}
.evm-converge .evmFlash{animation:evmBurst .58s ease-out both}
.evm-converge{animation:evmStageShake .42s ease-out}
.evm-reveal .evmBubble{animation:evmAfterglow 1.6s ease-out both}
.evm-reveal .evmArabic{text-shadow:0 0 12px #fff,0 0 27px #9affd8,0 0 60px #c4a7ff}
.evm-reveal .evmMote{animation:evmScatter 1.4s ease-out both;animation-delay:var(--d)}
@keyframes evmFloat{0%,100%{transform:translate3d(0,2px,0) rotate(-1.1deg)}35%{transform:translate3d(9px,-11px,0) rotate(.7deg)}70%{transform:translate3d(-7px,4px,0) rotate(1deg)}}
@keyframes evmAurora{to{transform:rotate(360deg)}}
@keyframes evmOrbitA{50%{transform:rotate(-13deg) translateY(-8px)}}
@keyframes evmOrbitB{50%{transform:rotate(37deg) translateY(8px)}}
@keyframes evmShimmer{to{background-position:-230% 0}}
@keyframes evmMoteFloat{to{transform:rotate(calc(var(--a) + 14deg)) translateX(calc(var(--r) + 18px)) scale(.65);opacity:.35}}
@keyframes evmReact{0%{transform:translateY(0) scale(1)}25%{transform:translate(12px,-13px) scale(.96) rotate(3deg)}65%{transform:translate(-8px,7px) scale(1.04) rotate(-2deg)}100%{transform:translate(0,-3px) scale(1.01)}}
@keyframes evmGather{to{transform:rotate(var(--a)) translateX(20px) scale(1.7);opacity:1}}
@keyframes evmImpact{0%{transform:scale(1.01)}28%{transform:scale(.89) rotate(-1.5deg)}65%{transform:scale(1.09) rotate(1.2deg)}100%{transform:scale(1.01)}}
@keyframes evmCollapse{0%{transform:rotate(var(--a)) translateX(var(--r));opacity:1}100%{transform:rotate(var(--a)) translateX(0) scale(.1);opacity:0}}
@keyframes evmBurst{15%{opacity:.95}100%{opacity:0}}
@keyframes evmStageShake{0%,100%{transform:translate(0)}20%{transform:translate(4px,-3px)}38%{transform:translate(-6px,2px)}55%{transform:translate(3px,3px)}75%{transform:translate(-2px,-1px)}}
@keyframes evmAfterglow{0%{transform:scale(1.04);filter:brightness(1.8)}100%{transform:scale(1);filter:brightness(1)}}
@keyframes evmScatter{0%{transform:translate(0);opacity:1}100%{transform:rotate(var(--a)) translateX(calc(var(--r) + 85px)) scale(.2);opacity:0}}
@media(max-width:560px){.evmStage{min-height:275px}.evmBubble{min-height:160px;width:91%;padding:20px 12px}.evmOrbit{width:220px}}
@media(prefers-reduced-motion:reduce){.evmStage *, .evmStage{animation:none!important;transition:none!important}.evmBubble{transform:none!important}.evmMote{opacity:.5}.evmFlash{display:none}}
`}</style>
 </section>
}
