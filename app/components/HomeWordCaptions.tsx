"use client";
import {useEffect,useMemo,useState} from "react";
type Word={word:string;start:number;end:number};
export default function HomeWordCaptions({videoId,seconds}:{videoId:string;seconds:number}){
 const [words,setWords]=useState<Word[]>([]);
 const [enabled,setEnabled]=useState(false);
 useEffect(()=>{let active=true;const load=async()=>{try{const r=await fetch("/api/admin/speechsync",{cache:"no-store"});const d=await r.json();if(active)setEnabled(r.ok&&d.enabled===true)}catch{if(active)setEnabled(false)}};void load();const timer=setInterval(()=>void load(),15000);return()=>{active=false;clearInterval(timer)}},[]);
 useEffect(()=>{let active=true;setWords([]);if(!enabled)return;fetch("/api/video-word-captions?videoId="+encodeURIComponent(videoId),{cache:"no-store"}).then(r=>r.ok?r.json():null).then(d=>{if(active)setWords(Array.isArray(d?.words)?d.words.filter((w:Word)=>typeof w.word==="string"&&Number.isFinite(w.start)&&Number.isFinite(w.end)&&w.end>w.start).sort((a:Word,b:Word)=>a.start-b.start):[])}).catch(()=>{if(active)setWords([])});return()=>{active=false}},[videoId,enabled]);
 const activeIndex=useMemo(()=>words.findIndex(w=>w.start<=seconds&&w.end>seconds),[words,seconds]);
 if(!enabled||activeIndex<0)return null;
 const current=words[activeIndex];
 const phrase=words.slice(Math.max(0,activeIndex-2),activeIndex+3);
 const progress=Math.min(1,Math.max(0,(seconds-current.start)/Math.max(.15,current.end-current.start)));
 const lane=activeIndex%4;
 return <div className="elmiCinemaTypography" aria-label="Cinematic speech typography" aria-live="off">
 <style>{`
 .elmiCinemaTypography{position:fixed;inset:0;z-index:95;pointer-events:none;overflow:hidden;color:#fff;font-family:Inter,Arial,system-ui,sans-serif;font-weight:900;text-shadow:0 4px 3px #000,0 10px 25px #000,0 0 40px #000;letter-spacing:-.055em}
 .elmiCinemaTypography:before{content:"";position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.95) 0%,rgba(0,0,0,.94) 24%,transparent 25%,transparent 45%,rgba(0,0,0,.95) 46%,#000 100%);z-index:-1}
 .elmiCinemaTypography .elmiUpper{position:absolute;top:10%;height:15%;width:100%;display:flex;justify-content:center;align-items:center;gap:.4em;font-size:clamp(24px,5vw,68px);text-transform:uppercase}
 .elmiCinemaTypography .elmiHero{position:absolute;top:48%;height:30%;width:100%;display:flex;justify-content:center;align-items:center;padding:0 5%;text-align:center;font-size:clamp(42px,10vw,130px);line-height:.96}
 .elmiCinemaTypography .elmiLower{position:absolute;top:80%;height:20%;width:100%;display:flex;justify-content:center;align-items:center;font-size:clamp(22px,4vw,52px);text-align:center;padding:0 6%}
 .elmiCinemaTypography .elmiHero strong{display:block;animation:elmiWordEnter .36s cubic-bezier(.12,.85,.2,1) both;filter:drop-shadow(0 8px 15px #000)}
 .elmiCinemaTypography .elmiUpper span{animation:elmiWordEnter .5s ease-out both}
 .elmiCinemaTypography .elmiLower span{animation:elmiWordEnter .42s ease-out both}
 .elmiCinemaTypography .elmiParticle{position:absolute;top:calc(50% + var(--y));left:var(--x);width:3px;height:3px;border-radius:50%;background:#fff;box-shadow:0 0 12px #fff;animation:elmiParticleDrift .8s ease-out both}
 @keyframes elmiWordEnter{from{opacity:0;transform:translate3d(0,25px,0) scale(.85);filter:blur(2px)}to{opacity:1;transform:translate3d(0,0,0) scale(1);filter:blur(0)}}
 @keyframes elmiParticleDrift{from{opacity:0;transform:translateY(25px) scale(.5)}40%{opacity:.9}to{opacity:0;transform:translateY(-65px) scale(1.5)}}
 @media(prefers-reduced-motion:reduce){.elmiCinemaTypography *{animation:none!important}}
 `}</style>
 <div className="elmiUpper" key={"upper"+activeIndex}>{phrase.slice(0,2).map((w,i)=><span key={i}>{w.word}</span>)}</div>
 <div className="elmiHero" key={"hero"+activeIndex}><strong style={{transform:lane%2?"translateX(2%)":"translateX(-2%)",opacity:progress>.86?Math.max(.05,(1-progress)/.14):1}}>{current.word}</strong></div>
 <div className="elmiLower" key={"lower"+activeIndex}><span>{phrase.slice(2).map(w=>w.word).join(" ")}</span></div>
 {Array.from({length:9},(_,i)=><i key={activeIndex+"-"+i} className="elmiParticle" style={{["--x" as string]:((i*23+activeIndex*7)%90+5)+"%",["--y" as string]:((i*17)%130-65)+"px",animationDelay:i*35+"ms"}}/>)}
 </div>
}
