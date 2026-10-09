"use client";
import {useEffect,useState} from "react";
import {usePathname,useRouter} from "next/navigation";
const key="1muslim-hudhud-guidance-visit-v1";
const stops=[
 {name:"Qur'an Studio",href:"/elm-tent/quran",hint:"Begin with the words of Allah."},
 {name:"Community Posts",href:"/#community",hint:"Read and reflect with the community."},
 {name:"Daily Video",href:"/#video-of-day",hint:"Watch today's featured lesson."},
 {name:"Main Live Stream",href:"/#live-now",hint:"Join the community live when a stream is available."}
];
const verses=[
 {arabic:"وَقُل رَّبِّ زِدْنِي عِلْمًا",translation:"My Lord, increase me in knowledge.",ref:"Qur'an 20:114"},
 {arabic:"فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",translation:"Indeed, with hardship comes ease.",ref:"Qur'an 94:5"},
 {arabic:"إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",translation:"Indeed, Allah is with the patient.",ref:"Qur'an 2:153"},
 {arabic:"وَهُوَ مَعَكُمْ أَيْنَ مَا كُنْتُمْ",translation:"He is with you wherever you are.",ref:"Qur'an 57:4"}
];
export default function HudHudGuidance(){
 const router=useRouter(),pathname=usePathname();
 const [active,setActive]=useState(false),[index,setIndex]=useState(0),[strength,setStrength]=useState(0);
 useEffect(()=>{const launch=()=>{
  let count=0;try{count=Math.max(0,Number(localStorage.getItem(key)||"0"))}catch{}
  const next=count%stops.length;try{localStorage.setItem(key,String(count+1))}catch{}
  setIndex(next);setStrength(Math.min(.75,.30*Math.pow(1.5,count)));setActive(true);
 };window.addEventListener("1muslim:hudhud-guidance",launch);return()=>window.removeEventListener("1muslim:hudhud-guidance",launch)},[]);
 useEffect(()=>{if(!active)return;const t=window.setTimeout(()=>setActive(false),9500);return()=>window.clearTimeout(t)},[active,index]);
 if(!active)return null;
 const verse=verses[index],stop=stops[index];
 const go=()=>{setActive(false);if(stop.href.includes("#")&&pathname==="/"){document.getElementById(stop.href.split("#")[1])?.scrollIntoView({behavior:"smooth",block:"center"})}else router.push(stop.href)};
 return <div className="hh-guide-root" role="dialog" aria-modal="true" aria-label="HudHud Guidance">
 <div className="hh-guide-dim" style={{background:`rgba(0,8,20,${strength})`}} onClick={()=>setActive(false)}/>
 <div className="hh-guide-lights" aria-hidden="true">{Array.from({length:65},(_,i)=><i key={i} style={{left:`${(i*47.1)%100}%`,top:`${(i*23.7)%100}%`,animationDelay:`${(i%13)*.12}s`}}/>)}</div>
 <section className="hh-guide-card"><img src="/assets/hudhud-logo.PNG" alt="HudHud"/><small>HUDHUD GUIDANCE · {index+1} / 4</small>
 <div className="hh-guide-arabic" lang="ar" dir="rtl">{verse.arabic}</div><p>{verse.translation}</p><small>{verse.ref}</small>
 <h2>Let's explore {stop.name}</h2><p>{stop.hint}</p>
 <div className="hh-guide-actions"><button type="button" onClick={()=>setActive(false)}>Not now</button><button type="button" onClick={go}>Take me there →</button></div>
 </section>
 <style jsx>{`
 .hh-guide-root{position:fixed;inset:0;z-index:10050;display:grid;place-items:center;pointer-events:none;color:white;padding:18px}
 .hh-guide-dim{position:absolute;inset:0;pointer-events:auto;backdrop-filter:brightness(.75);animation:guideFade .45s ease both}
 .hh-guide-lights{position:absolute;inset:0;overflow:hidden;pointer-events:none}
 .hh-guide-lights i{position:absolute;width:5px;height:5px;border-radius:50%;background:#a8ffe9;box-shadow:0 0 14px 5px #58ffd9aa,0 0 40px 12px #8d66ff66;animation:guideFlicker 3s ease-in-out infinite alternate}
 .hh-guide-card{position:relative;pointer-events:auto;width:min(440px,94vw);max-height:85dvh;overflow:auto;text-align:center;padding:23px;border:1px solid #79f3e7a6;border-radius:27px;background:linear-gradient(140deg,#0b2335ee,#1c1434f2);box-shadow:0 15px 90px #000a,0 0 55px #63eaff55;animation:guideAppear .5s cubic-bezier(.2,1.3,.3,1) both}
 .hh-guide-card img{width:76px;height:76px;object-fit:contain;filter:drop-shadow(0 0 20px #7a8cff)}
 .hh-guide-card small{display:block;color:#a5f2e8;font-size:11px;letter-spacing:.1em}
 .hh-guide-arabic{font-family:serif;font-size:clamp(26px,7vw,36px);line-height:1.8;margin:20px 0 8px;color:#f2ffda}
 .hh-guide-card p{color:#c7dfeb;line-height:1.55}
 .hh-guide-card h2{font-size:24px;margin:25px 0 8px}
 .hh-guide-actions{display:flex;gap:10px;justify-content:center;margin-top:20px}
 .hh-guide-actions button{border:1px solid #7be6f5;border-radius:14px;padding:13px;color:white;background:#16364e;cursor:pointer}
 .hh-guide-actions button:last-child{background:linear-gradient(110deg,#167c8d,#6548a3);font-weight:800}
 @keyframes guideAppear{from{opacity:0;transform:translateY(24px) scale(.88)}to{opacity:1;transform:none}}
 @keyframes guideFade{from{opacity:0}to{opacity:1}}
 @keyframes guideFlicker{from{opacity:.2;transform:translateY(18px) scale(.5)}to{opacity:1;transform:translateY(-24px) scale(1.4)}}
 @media(prefers-reduced-motion:reduce){.hh-guide-root *{animation:none!important}}
 `}</style>
 </div>
}
