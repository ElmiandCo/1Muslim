"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";

const discoveries=[
 {icon:"✨",title:"Bismillah",arabic:"بِسْمِ ٱللَّٰهِ",meaning:"In the name of Allah",detail:"A beautiful phrase to begin good things. Try saying it before eating or starting a task.",action:"Practice one small habit today."},
 {icon:"🌙",title:"As-salamu alaykum",arabic:"السَّلَامُ عَلَيْكُمْ",meaning:"Peace be upon you",detail:"A greeting of peace. The reply is Wa alaykum as-salam — and upon you be peace.",action:"Try greeting someone with peace."},
 {icon:"🤲",title:"Alhamdulillah",arabic:"ٱلْحَمْدُ لِلَّٰهِ",meaning:"All praise belongs to Allah",detail:"A phrase of gratitude, often said when something goes well and throughout everyday life.",action:"Name one thing you are grateful for."},
 {icon:"💚",title:"Tawhid",arabic:"التَّوْحِيد",meaning:"The oneness of Allah",detail:"A central belief in Islam: Allah is One. Surah Al-Ikhlas (112) is a short place to start learning about this.",action:"Read Surah Al-Ikhlas and its translation."}
];
export default function DiscoveryHold(){
 const [active,setActive]=useState<number|null>(null);
 const [seen,setSeen]=useState<number[]>([]);
 const [xp,setXp]=useState(0);
 const [signedIn,setSignedIn]=useState(false);
 const [sound,setSound]=useState(true);
 const [rewardNotice,setRewardNotice]=useState("");
 const [holding,setHolding]=useState<number|null>(null);
 const [celebrate,setCelebrate]=useState(false);
 const ids=["bismillah","salam","alhamdulillah","tawhid"];
 const playChime=()=>{
   if(!sound)return;
   try{
     const AC=window.AudioContext;
     if(!AC)return;
     const ctx=new AC();const now=ctx.currentTime;
     [523.25,659.25,783.99].forEach((frequency,i)=>{
       const oscillator=ctx.createOscillator();const gain=ctx.createGain();
       oscillator.type="sine";oscillator.frequency.value=frequency;
       gain.gain.setValueAtTime(0,now+i*.11);
       gain.gain.linearRampToValueAtTime(.055,now+i*.11+.02);
       gain.gain.exponentialRampToValueAtTime(.001,now+i*.11+.3);
       oscillator.connect(gain).connect(ctx.destination);
       oscillator.start(now+i*.11);oscillator.stop(now+i*.11+.31);
     });
     setTimeout(()=>void ctx.close(),900);
   }catch{}
 };
 useEffect(()=>{void fetch("/api/discovery").then(r=>r.json()).then(d=>{
   setSignedIn(!!d.signedIn);setXp(d.xp??0);
   if(Array.isArray(d.completed))setSeen(ids.flatMap((id,i)=>d.completed.includes(id)?[i]:[]));
 }).catch(()=>{})},[]);
 const claim=async(i:number)=>{
   if(!signedIn)return;
   try{
     const response=await fetch("/api/discovery",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lesson:ids[i]})});
     if(!response.ok){setRewardNotice("Rewards will activate when the learning database is configured.");return;}
     const result=await response.json();
     setXp(Number(result.total_xp)||0);
     setRewardNotice(result.awarded?"+25 Discovery XP earned! ✨":"You've already discovered this lesson 💚");
   }catch{setRewardNotice("Could not save reward. Try again later.");}
 };
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const point=useRef<{x:number;y:number}|null>(null);
 const cancel=()=>{if(timer.current)clearTimeout(timer.current);timer.current=null;point.current=null;setHolding(null)};
 const reveal=(i:number)=>{cancel();setActive(i);setRewardNotice("");setSeen(s=>s.includes(i)?s:[...s,i]);setCelebrate(true);setTimeout(()=>setCelebrate(false),1800);navigator.vibrate?.(15);playChime();void claim(i)};
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current)},[]);
 useEffect(()=>{if(active===null)return;const key=(e:KeyboardEvent)=>{if(e.key==="Escape")setActive(null)};window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key)},[active]);
 return <section className="discoverySection" aria-label="Interactive learning discoveries">
 <style jsx>{`.discoverySection{position:relative;isolation:isolate;overflow:hidden;padding:clamp(22px,4vw,42px)!important;border-radius:32px!important;background:radial-gradient(ellipse at 80% 0%,#1e4b3c 0%,transparent 45%),radial-gradient(ellipse at 0% 100%,#193f32 0%,transparent 48%),linear-gradient(135deg,#0a2019,#122c2b 70%,#0a2019)!important;border:1px solid #c4a76b65!important;box-shadow:inset 0 1px #ffffff20,0 24px 70px #061b1730}.discoverySection:before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.11;background-image:repeating-linear-gradient(45deg,transparent 0 48px,#c6b379 49px,transparent 50px),repeating-linear-gradient(-45deg,transparent 0 48px,#c6b379 49px,transparent 50px);mask-image:linear-gradient(90deg,#000,transparent 60%);z-index:-1}.discoveryAmbient{position:absolute;inset:0;pointer-events:none;overflow:hidden}.discoveryAmbient span{position:absolute;color:#e5c37c;opacity:.3;font-size:22px;animation:discoveryDrift 9s ease-in-out infinite}.discoveryAmbient span:nth-child(1){left:9%;top:12%}.discoveryAmbient span:nth-child(2){left:82%;top:16%;animation-delay:-3s}.discoveryAmbient span:nth-child(3){left:65%;bottom:9%;animation-delay:-6s}.discoveryEyebrow{display:block;color:#d7c48d;font-size:11px;letter-spacing:.25em;font-weight:900}.discoveryHeading{position:relative;z-index:1;align-items:end}.discoveryHeading h2{font-size:clamp(27px,4vw,44px);letter-spacing:-.04em;line-height:1.14;max-width:720px;margin:14px 0!important}.discoveryHeading h2 em{font-style:normal;color:#d9c58f}.discoveryHeading p{color:#c6d7ca;font-size:14px;line-height:1.7}.discoveryProgress{border:1px solid #c7ae7559;border-radius:99px;padding:9px 14px;color:#e7e1c7;background:#ffffff0b;white-space:nowrap;font-size:12px}.discoveryProgress b{font-size:18px}.discoveryProgress b small{font-size:12px;color:#a8bfae}.discoveryProgress>span{color:#e8c37a}.discoveryCelebrate{animation:discoveryReward 1.4s ease}.discoveryTrack{height:4px;margin-top:18px;border-radius:99px;background:#ffffff1c;overflow:hidden}.discoveryTrack>span{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#49cb90,#e4c77c);transition:width .7s cubic-bezier(.2,.8,.2,1)}.discoveryGrid{grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:25px}.discoveryCard{position:relative;overflow:hidden;min-height:205px;padding:23px 12px!important;border:1px solid #8ba7815b!important;border-radius:24px!important;background:linear-gradient(160deg,#ffffff13,#ffffff05)!important;box-shadow:inset 0 1px #ffffff1d,0 12px 30px #00000012;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;transition:transform .35s,border-color .35s,box-shadow .35s!important}.discoveryCard:before{content:"";position:absolute;inset:-2px;border-radius:inherit;pointer-events:none;background:linear-gradient(135deg,transparent 15%,#f5df9c18 50%,transparent 85%);transform:translateX(-110%);transition:transform .6s}.discoveryCard:hover:before,.discoveryCard.isHolding:before{transform:translateX(110%)}.discoveryCard:hover{transform:translateY(-5px);border-color:#e0c37a!important;box-shadow:0 14px 35px #0004,0 0 25px #e6d28c15}.discoveryCard .icon{font-size:34px;margin:0;filter:drop-shadow(0 0 15px #f1d69b33);animation:discoveryIconFloat 5s ease-in-out infinite}.discoveryCard strong{font-size:clamp(14px,1.6vw,19px);letter-spacing:-.02em}.discoveryCard small{font-size:11px;color:#c6d8ca;opacity:.85;margin:0}.discoveryArabic{font-size:clamp(16px,2vw,24px);line-height:1.5;color:#e7ce8f;direction:rtl}.discoveryAura{position:absolute;width:120px;height:120px;top:6px;left:calc(50% - 60px);border-radius:50%;background:radial-gradient(circle,#d5c87b16,transparent 70%);pointer-events:none;animation:discoveryBreathe 4s ease-in-out infinite}.discoveryCard1 .discoveryAura{background:radial-gradient(circle,#9cc9ed20,transparent 70%)}.discoveryCard2 .discoveryAura{background:radial-gradient(circle,#f6c88120,transparent 70%)}.discoveryCard3 .discoveryAura{background:radial-gradient(circle,#64dcaa24,transparent 70%)}.discoveryHoldRing{position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:2;background:conic-gradient(from -90deg,#e5c57c 0,#53d6a2 100%);opacity:0;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude;padding:3px}.isHolding .discoveryHoldRing{opacity:1;animation:discoveryRing 1s linear both}.isDiscovered{border-color:#c8ac70!important}.isDiscovered:after{content:"✓";position:absolute;right:14px;top:12px;color:#e9d093;font-size:15px}.discoveryModal{border-color:#d4bc83!important;box-shadow:0 30px 90px #000b,0 0 60px #d3b57323!important}.discoveryModal .arabic{color:#e7cf95}@keyframes discoveryDrift{50%{transform:translate(18px,-22px);opacity:.55}}@keyframes discoveryIconFloat{50%{transform:translateY(-7px)}}@keyframes discoveryBreathe{50%{transform:scale(1.3);opacity:.45}}@keyframes discoveryRing{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}@keyframes discoveryReward{40%{transform:scale(1.07);box-shadow:0 0 35px #d4bd7766}}@media(max-width:800px){.discoveryGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.discoveryCard{min-height:185px}}@media(max-width:420px){.discoverySection{padding:20px 14px!important}.discoveryGrid{gap:10px}.discoveryCard{min-height:170px;padding:16px 6px!important}.discoveryHeading h2{font-size:29px}}@media(prefers-reduced-motion:reduce){.discoveryAmbient span,.discoveryCard .icon,.discoveryAura,.discoveryCelebrate,.discoveryHoldRing{animation:none!important}.discoveryCard:hover{transform:none}}
 .discoverySection{padding:22px 16px;margin:16px 0;border-radius:22px;background:linear-gradient(130deg,#12261b,#182d35);color:#f3fff4;border:1px solid #406b53}
 .discoveryHeading{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap}
 .discoveryHeading h2{font-size:clamp(21px,3vw,30px);margin:5px 0}.discoveryHeading p{font-size:13px;opacity:.8;margin:0}
 .discoveryGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:18px}
 .discoveryCard{touch-action:pan-y;user-select:none;-webkit-user-select:none;border:1px solid #4a755a;background:#ffffff0d;border-radius:16px;min-height:125px;padding:14px 8px;color:inherit;cursor:pointer;transition:transform .22s,border-color .22s,background .22s}
 .discoveryCard:hover,.discoveryCard:focus-visible{transform:translateY(-4px);border-color:#c6e8a9;background:#ffffff18}
 .discoveryCard .icon{font-size:28px;display:block;margin-bottom:7px}.discoveryCard strong{display:block;font-size:13px}.discoveryCard small{display:block;font-size:10px;opacity:.72;margin-top:7px}
 .discoveryBackdrop{position:fixed;inset:0;background:#000b;z-index:10020;display:grid;place-items:center;padding:20px;animation:discoveryFade .25s ease-out}
 .discoveryModal{position:relative;overflow:hidden;width:min(100%,420px);background:linear-gradient(155deg,#203c2c,#0e2018);border:1px solid #b4dca6;border-radius:26px;padding:26px;text-align:center;box-shadow:0 30px 90px #000b;animation:discoveryPop .42s cubic-bezier(.2,.85,.25,1.15)}
 .discoveryModal .spark{position:absolute;opacity:.55;animation:discoveryFloat 2.2s ease-in-out infinite alternate;pointer-events:none}
 .discoveryModal .arabic{font-size:36px;line-height:1.8;direction:rtl;margin:12px 0}.discoveryModal h3{font-size:26px;margin:8px 0}.discoveryModal p{font-size:14px;line-height:1.65}
 .discoveryModal button,.discoveryModal a{display:inline-block;margin:6px;padding:10px 15px;border:1px solid #8bb79a;border-radius:999px;background:#d8edbf;color:#132519;font-weight:800;cursor:pointer;text-decoration:none}
 @keyframes discoveryFade{from{opacity:0}to{opacity:1}}@keyframes discoveryPop{from{opacity:0;transform:translateY(24px) scale(.9)}to{opacity:1;transform:translateY(0) scale(1)}}
 @keyframes discoveryFloat{from{transform:translateY(0) rotate(-12deg)}to{transform:translateY(-24px) rotate(20deg)}}
 @media(max-width:540px){.discoveryGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}
 @media(prefers-reduced-motion:reduce){.discoveryCard,.discoveryBackdrop,.discoveryModal,.discoveryModal .spark{animation:none;transition:none}}
 `}</style>
 <div className="discoveryAmbient" aria-hidden="true"><span>✦</span><span>✧</span><span>✦</span></div><div className="discoveryHeading"><div><span className="discoveryEyebrow">✦ YOUR JOURNEY BEGINS HERE</span><h2>Four discoveries. <em>One beautiful beginning.</em></h2><p>Hold a card for one second. Discover a little piece of Islam, at your own pace.</p></div><span className={"discoveryProgress "+(celebrate?"discoveryCelebrate":"")}><b>{seen.length}<small>/4</small></b> discovered <span>✦</span> {xp} XP</span></div><div className="discoveryTrack" aria-label={`${seen.length} of 4 discoveries complete`}><span style={{width:`${seen.length*25}%`}}/></div>
 <div style={{display:"flex",alignItems:"center",gap:12,marginTop:12,flexWrap:"wrap"}}>
 <button type="button" onClick={()=>setSound(v=>!v)} style={{background:"transparent",border:"1px solid #678b6e",color:"inherit",borderRadius:20,padding:"7px 12px"}}>{sound?"🔊 Sound on":"🔇 Sound off"}</button>
 <Link href="/discovery-files" style={{color:"#d8edbf",fontSize:12}}>📁 My learning files & rewards ↗</Link>
 {!signedIn&&<span style={{fontSize:11,opacity:.75}}>Sign in to save XP and unlock rewards.</span>}
 </div>
 <div className="discoveryGrid">{discoveries.map((item,i)=><button key={item.title} type="button" className={"discoveryCard discoveryCard"+i+(seen.includes(i)?" isDiscovered":"")+(holding===i?" isHolding":"")} aria-label={"Discover "+item.title+"; press and hold for one second or click"}
 onPointerDown={e=>{if(e.pointerType==="mouse"&&e.button!==0)return;cancel();point.current={x:e.clientX,y:e.clientY};setHolding(i);timer.current=setTimeout(()=>reveal(i),1000)}}
 onPointerMove={e=>{if(point.current&&Math.hypot(e.clientX-point.current.x,e.clientY-point.current.y)>12)cancel()}}
 onPointerUp={cancel} onPointerCancel={cancel} onPointerLeave={cancel}
 onClick={e=>{if(e.detail===0)reveal(i)}}
 onContextMenu={e=>{e.preventDefault()}}><span className="discoveryHoldRing" aria-hidden="true"/><span className="discoveryAura" aria-hidden="true"/><span className="icon">{seen.includes(i)?"✦":item.icon}</span><span className="discoveryArabic" lang="ar">{item.arabic}</span><strong>{item.title}</strong><small>{seen.includes(i)?"✓ Discovered · Explore again":"Hold to reveal ✧"}</small></button>)}</div>
 {active!==null&&<div className="discoveryBackdrop" onClick={()=>setActive(null)}><div className="discoveryModal" role="dialog" aria-modal="true" aria-label={discoveries[active].title} onClick={e=>e.stopPropagation()}>
 <span className="spark" style={{left:22,top:28}}>✦</span><span className="spark" style={{right:28,top:48,animationDelay:".5s"}}>✧</span><span className="spark" style={{left:50,bottom:60,animationDelay:"1s"}}>✨</span>
 <div style={{fontSize:38}}>🎉</div><small style={{color:"#d8edbf",fontWeight:800}}>YOU DISCOVERED SOMETHING NEW</small>
 <h3>{discoveries[active].title}</h3><div className="arabic" lang="ar">{discoveries[active].arabic}</div>
 <strong>{discoveries[active].meaning}</strong><p>{discoveries[active].detail}</p>
 <p style={{color:"#d8edbf"}}>🌱 {discoveries[active].action}</p>
 {rewardNotice&&<p role="status" style={{fontWeight:800,color:"#d8edbf"}}>{rewardNotice}</p>}
 <button type="button" onClick={()=>setActive(null)}>Keep exploring ✨</button><Link href="/learn/elm-tent#sessions">Explore lessons ↗</Link>
 </div></div>}
 </section>;
}
