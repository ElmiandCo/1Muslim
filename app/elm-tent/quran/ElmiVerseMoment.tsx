"use client";
import {useEffect,useRef,useState} from "react";
import {createClient} from "../../../utils/supabase/client";
const VERSE="فَإِنَّ مَعَ الْعُسْرِ يُسْرًا"; // Qur'an 94:5; text is never modified.
type Phase="float"|"holding"|"charged"|"converge"|"reveal";
type AudioWindow=Window & {webkitAudioContext?:typeof AudioContext};
function elmiChime(ctx:AudioContext,frequency:number,at:number,duration:number,volume:number,kind:OscillatorType="sine"){
 const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=kind;osc.frequency.setValueAtTime(frequency,at);
 gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),at+.025);
 gain.gain.exponentialRampToValueAtTime(.0001,at+duration);osc.connect(gain);gain.connect(ctx.destination);
 osc.start(at);osc.stop(at+duration+.01);
}
function playElmiSequence(){
 if(typeof window==="undefined"||localStorage.getItem("1muslim-elmi-light-sound")!=="on"||localStorage.getItem("1muslim-elmi-light")==="off")return;
 try{
  const AudioCtor=window.AudioContext||(window as AudioWindow).webkitAudioContext;if(!AudioCtor)return;
  const ctx=new AudioCtor();const t=ctx.currentTime+.03;
  // Gentle suspense, converging sparkles, and a soft glass-pop. No speech or recitation.
  elmiChime(ctx,392,t,.35,.018);
  elmiChime(ctx,523.25,t+.23,.4,.018);
  elmiChime(ctx,659.25,t+.49,.25,.024);
  elmiChime(ctx,1046.5,t+.68,.3,.038);
  elmiChime(ctx,783.99,t+.73,.5,.019);
  elmiChime(ctx,1318.5,t+.86,.75,.022);
  window.setTimeout(()=>{void ctx.close().catch(()=>{})},2500);
 }catch{/* Audio unavailable or blocked: animation remains silent. */}
}
const motes=Array.from({length:15},(_,i)=>({id:i,angle:i*137.5,radius:60+(i%5)*21,delay:(i%7)*42}));
export default function ElmiVerseMoment(){
 const [phase,setPhase]=useState<Phase>("float");
 const [lightEnabled,setLightEnabled]=useState(true);
 const timers=useRef<number[]>([]);
 const held=useRef(false);
 const started=useRef(0);
 const [progress,setProgress]=useState(0);
 const [explained,setExplained]=useState(false);
 const [reward,setReward]=useState("");
 const readyToClaim=useRef(false);
 const startedOnServer=useRef(false);
 const chargeTimer=useRef<number|undefined>(undefined);
 const chargeFrame=useRef<number|undefined>(undefined);
 const clearCharge=()=>{if(chargeTimer.current!==undefined)clearTimeout(chargeTimer.current);if(chargeFrame.current!==undefined)cancelAnimationFrame(chargeFrame.current);chargeTimer.current=undefined;chargeFrame.current=undefined;};
 const release=()=>{if(!held.current)return;held.current=false;clearCharge();setProgress(0);
  if(readyToClaim.current && startedOnServer.current){void createClient().rpc("claim_elmi_verse_hold").then(({data,error})=>{const result=Array.isArray(data)?data[0]:data;if(!error&&Number(result?.awarded)===10000){setReward("🎉 +10,000 XP! Check your profile for your new level and badges.");window.dispatchEvent(new Event("1muslim-xp-updated"));}else if(error){setReward("XP could not be awarded: "+error.message)}else{setReward("Verse reward already claimed. ✨")}})}
  readyToClaim.current=false;startedOnServer.current=false;
  if(!lightEnabled){setPhase("float");return}
  timers.current.forEach(clearTimeout);timers.current=[];
  setPhase("converge");playElmiSequence();
  timers.current.push(window.setTimeout(()=>setPhase("reveal"),540));
  timers.current.push(window.setTimeout(()=>{setPhase("float");setExplained(false)},3300));
 };
 const press=(e:React.PointerEvent<HTMLButtonElement>)=>{if(phase==="converge"||phase==="reveal"||held.current)return;
  e.currentTarget.setPointerCapture(e.pointerId);
  held.current=true;started.current=performance.now();setProgress(0);setExplained(false);setReward("");setPhase("holding");
  readyToClaim.current=false;startedOnServer.current=false;
  void createClient().rpc("begin_elmi_verse_hold").then(({error})=>{if(!error&&held.current)startedOnServer.current=true});
  const tick=()=>{if(!held.current)return;const elapsed=performance.now()-started.current;setProgress(Math.min(100,elapsed/50));if(elapsed>=5200)readyToClaim.current=true;chargeFrame.current=requestAnimationFrame(tick)};chargeFrame.current=requestAnimationFrame(tick);
  chargeTimer.current=window.setTimeout(()=>{if(held.current){setPhase("charged");setExplained(true)}},900);
 };
 const keyboardActivate=(e:React.KeyboardEvent<HTMLButtonElement>)=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();if(!held.current){held.current=true;setPhase("charged");setExplained(true);release()}}};
 useEffect(()=>{const sync=()=>{try{setLightEnabled(localStorage.getItem("1muslim-elmi-light")!=="off")}catch{setLightEnabled(true)}};sync();window.addEventListener("1muslim-elmi-light-updated",sync);window.addEventListener("storage",sync);return()=>{held.current=false;clearCharge();timers.current.forEach(clearTimeout);window.removeEventListener("1muslim-elmi-light-updated",sync);window.removeEventListener("storage",sync)}},[]);
 return <section className={"evmStage evm-"+(lightEnabled?phase:"disabled")} aria-label="Interactive Elmi Light Qur'an verse animation">
  <div className="evmAurora" aria-hidden="true"/>
  <div className="evmOrbit evmOrbitOne" aria-hidden="true"/><div className="evmOrbit evmOrbitTwo" aria-hidden="true"/>
  <div className="evmMotes" aria-hidden="true">{motes.map(m=><span key={m.id} className="evmMote" style={{["--a" as string]:m.angle+"deg",["--r" as string]:m.radius+"px",["--d" as string]:m.delay+"ms",["--n" as string]:m.id}}/>)}</div>
  <div className="evmFlash" aria-hidden="true"/>
  <button type="button" className="evmBubble" onPointerDown={press} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release} onKeyDown={keyboardActivate} onContextMenu={e=>e.preventDefault()} aria-label="Press and hold the Quran verse bubble, then release to activate Elmi Light" style={{["--charge" as string]:progress+"%"}}>
   <span className="evmGlass" aria-hidden="true"/><span className="evmShimmer" aria-hidden="true"/>
   <span className="evmArabic" lang="ar" dir="rtl">{VERSE}</span>
   <span className="evmReference">سورة الشرح · 94:5</span>
  </button>
  {explained && (phase==="holding"||phase==="charged") && <div className="evmMeaning" role="status"><strong>94:5 · Ash-Sharh</strong><span>Indeed, with hardship comes ease.</span><small>Release to let Elmi Light meet the verse ✨</small></div>}
  {(phase==="holding"||phase==="charged")&&<div className="evmProgress" role="progressbar" aria-label="Hold for five seconds to earn ten thousand XP" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.floor(progress)}><div style={{width:progress+"%"}}/><span>{Math.min(5,Math.floor(progress/20))}/5 seconds · 10,000 XP</span></div>}
  {reward&&<div className="evmReward" role="status">{reward}</div>}
  <span className="evmCaption" aria-live="polite">{phase==="holding"?"✦ Keep holding to discover its meaning…":phase==="charged"?"✦ Fully charged · Release!":phase==="converge"?"✦ Elmi Light rushes in!":phase==="reveal"?"✦ فَإِنَّ مَعَ الْعُسْرِ يُسْرًا":"✧ Press and hold the floating verse"}</span>
  <style jsx>{`\n.evmProgress{position:absolute;z-index:8;bottom:41px;left:12%;right:12%;height:22px;border-radius:14px;background:#0b1927c9;border:1px solid #b9ffe188;overflow:hidden}.evmProgress>div{height:100%;background:linear-gradient(90deg,#50f5b0,#f6eaa0);transition:width .08s linear}.evmProgress span{position:absolute;inset:0;display:grid;place-items:center;font-size:10px;color:#fff;text-shadow:0 1px 3px #000}.evmReward{position:absolute;z-index:9;top:8px;left:5%;right:5%;text-align:center;border:1px solid #ffeeb6;background:#123d36e8;color:#fff9d7;padding:9px;border-radius:14px;font-size:12px}\n\n.evmBubble{touch-action:none;--charge:0%}\n.evm-holding .evmBubble,.evm-charged .evmBubble{animation:none;transform:translate3d(0,-5px,0) scale(1.045);box-shadow:0 0 32px #b6ffe26b,inset 0 0 32px #fff6d633;transition:transform .16s ease-out}\n.evm-holding .evmMote,.evm-charged .evmMote{animation:evmHoldBack 1.1s ease-in-out infinite alternate;animation-delay:var(--d)}\n.evm-charged .evmBubble{transform:translateY(-8px) scale(1.075);border-color:#fff4bc}\n.evmMeaning{position:absolute;z-index:7;top:8px;left:8%;right:8%;display:flex;flex-direction:column;align-items:center;gap:3px;text-align:center;color:#f8fff7;font-size:13px;text-shadow:0 1px 8px #000;background:#0d2939c9;border:1px solid #c8ffda88;border-radius:16px;padding:9px;backdrop-filter:blur(5px)}\n.evmMeaning small{font-size:10px;color:#c9ffe5}\n@keyframes evmHoldBack{0%{transform:rotate(var(--a)) translateX(calc(var(--r) + 30px)) scale(.6);opacity:.45}100%{transform:rotate(var(--a)) translateX(calc(var(--r) + 10px)) scale(1.4);opacity:1}}\n.evm-converge .evmBubble{animation:evmAirPop .54s cubic-bezier(.2,.8,.25,1) both}\n@keyframes evmAirPop{0%{transform:scale(1.07)}32%{transform:scale(.78)}64%{transform:scale(1.16)}100%{transform:scale(1)}}
.evmStage{contain:layout paint;--mint:#a1ffe0;position:relative;isolation:isolate;overflow:hidden;display:grid;place-items:center;min-height:335px;margin:20px 0;border-radius:30px;border:1px solid #b1e6da38;background:radial-gradient(ellipse at 48% 75%,#3a667655,transparent 65%),linear-gradient(140deg,#071a25,#101a35 55%,#122b2c);perspective:850px}
.evmAurora{pointer-events:none;position:absolute;inset:-35%;background:conic-gradient(from 35deg at 50% 50%,transparent,#83fbd322,transparent,#a7a0ff25,transparent,#e7c77d21,transparent);filter:blur(20px);animation:evmAurora 18s linear infinite}
.evmOrbit{position:absolute;width:290px;height:190px;border:1px solid #b4ffe529;border-radius:50%;transform:rotate(-22deg);filter:drop-shadow(0 0 12px #93ffd340);animation:evmOrbitA 9s ease-in-out infinite}
.evmOrbitTwo{width:340px;height:165px;transform:rotate(28deg);border-color:#a8a4ff32;animation:evmOrbitB 11s ease-in-out infinite}
.evmBubble{-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none;transform:translateZ(0);backface-visibility:hidden;position:relative;z-index:4;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;width:min(82%,520px);min-height:182px;padding:26px 20px;border:1px solid #d5fff5a3;border-radius:50% 48% 49% 51% / 48% 52% 48% 52%;color:#fffbed;background:radial-gradient(ellipse at 25% 12%,#ffffff2c,transparent 45%),radial-gradient(ellipse at 80% 90%,#70f6c91c,transparent 52%),linear-gradient(130deg,#b8eaff1c,#b8b4ff12 55%,#ffd49d15);box-shadow:inset 0 0 25px #f3ffff29,inset 0 -16px 25px #82f7d514,0 18px 50px #0007,0 0 34px #9bf6df1f;backdrop-filter:blur(9px) saturate(1.3);-webkit-backdrop-filter:blur(9px) saturate(1.3);cursor:pointer;touch-action:manipulation;animation:evmFloat 6.5s ease-in-out infinite;transition:border-color .3s,box-shadow .3s}
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
@media(max-width:560px){.evmStage{min-height:275px;border-radius:22px}.evmBubble{min-height:160px;width:91%;padding:20px 12px;backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px)}.evmOrbit{width:220px}.evmAurora{filter:blur(12px);animation-duration:24s}.evmMote:nth-child(n+10){display:none}.evmArabic{font-size:clamp(25px,7vw,38px)}}
@media(hover:hover){.evmBubble:hover{border-color:#f7ffec}}
@media(hover:none){.evmBubble{min-height:165px}}
.evm-disabled .evmAurora,.evm-disabled .evmOrbit,.evm-disabled .evmMotes,.evm-disabled .evmFlash,.evm-disabled .evmShimmer{display:none}.evm-disabled .evmBubble{animation:none;transform:none;box-shadow:inset 0 0 20px #ffffff1b}.evm-disabled .evmCaption{opacity:.55}
@media(prefers-reduced-transparency:reduce){.evmBubble{backdrop-filter:none;-webkit-backdrop-filter:none;background:#23363e}}
@media(prefers-reduced-motion:reduce){.evmStage *, .evmStage{animation:none!important;transition:none!important}.evmBubble{transform:none!important}.evmMote{opacity:.5}.evmFlash{display:none}}
`}</style>
 </section>
}
