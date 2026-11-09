"use client";
import {useEffect,useState} from "react";
export type TimedWord={word:string;start:number;end:number};
const cache=new Map<string,TimedWord[]>();
/** Renders ONLY actual word-level timestamps. Never guesses speech from playback time. */
export default function HomeWordCaptions({videoId,seconds}:{videoId:string;seconds:number}){
 const [words,setWords]=useState<TimedWord[]>([]);
 const [revealed,setRevealed]=useState(false);
 useEffect(()=>{setRevealed(false);const onReady=()=>setRevealed(true);window.addEventListener("1muslim:enjoy-animation-complete",onReady);const existing=Array.from(document.querySelectorAll<HTMLElement>("*")).find(el=>el.children.length===0&&el.textContent?.trim().toLowerCase()==="enjoy"&&el.getBoundingClientRect().width>0);if(!existing){const fallback=window.setTimeout(onReady,900);return()=>{window.clearTimeout(fallback);window.removeEventListener("1muslim:enjoy-animation-complete",onReady)}}const complete=()=>{if(!existing.isConnected||getComputedStyle(existing).opacity==="0")onReady()};existing.addEventListener("animationend",onReady,{once:true});existing.addEventListener("transitionend",complete);const fallback=window.setTimeout(onReady,4500);return()=>{window.clearTimeout(fallback);existing.removeEventListener("animationend",onReady);existing.removeEventListener("transitionend",complete);window.removeEventListener("1muslim:enjoy-animation-complete",onReady)}},[videoId]);
 useEffect(()=>{
  let cancelled=false;
  if(cache.has(videoId)){setWords(cache.get(videoId)!);return;}
  setWords([]);
  fetch("/api/video-word-captions?videoId="+encodeURIComponent(videoId),{cache:"no-store"})
   .then(r=>r.ok?r.json():null).then(data=>{
    if(cancelled)return;
    const valid=Array.isArray(data?.words)?data.words.filter((w:TimedWord)=>typeof w.word==="string"&&Number.isFinite(w.start)&&Number.isFinite(w.end)&&w.end>w.start).sort((a:TimedWord,b:TimedWord)=>a.start-b.start):[];
    cache.set(videoId,valid);setWords(valid);
   }).catch(()=>{if(!cancelled)setWords([])});
  return()=>{cancelled=true};
 },[videoId]);
 const recent=words.filter(w=>w.start<=seconds&&w.end>=seconds-4).slice(-20);
 const upper=recent.slice(0,5),lower=recent.slice(5);
 if(!revealed||recent.length===0)return null;
 return <div className="oneMuslimCaptionHandoff" aria-live="off" aria-label="Spoken captions"><style>{`
 .oneMuslimCaptionHandoff{position:absolute;inset:0;z-index:90;pointer-events:none;overflow:visible;font-family:Inter,"Arial Narrow",system-ui,sans-serif;color:#f4f7fc;text-shadow:0 2px 9px #000,0 0 15px #000}
 .oneMuslimCaptionUpper{position:absolute;bottom:calc(100% + 9px);left:50%;width:min(90vw,420px);min-height:78px;transform:translateX(-50%);display:flex;justify-content:center;align-items:end;align-content:end;flex-wrap:wrap;gap:3px 9px;animation:oneMuslimCaptionAscend .85s cubic-bezier(.2,.8,.2,1) both}
 .oneMuslimCaptionUpper span{display:inline-block;font-weight:850;font-stretch:condensed;line-height:1.02;letter-spacing:-.045em;font-size:clamp(20px,5vw,38px);animation:oneMuslimCaptionStar .38s ease-out both}
 .oneMuslimCaptionUpper span:nth-child(3n+2){font-size:clamp(15px,3.5vw,27px);font-weight:650}.oneMuslimCaptionUpper span:nth-child(3n){font-size:clamp(24px,6vw,48px)}
 .oneMuslimCaptionLower{position:absolute;top:calc(100% + 10px);left:50%;width:min(92vw,560px);transform:translateX(-50%);display:flex;flex-wrap:wrap;justify-content:center;gap:4px 6px;font-size:clamp(15px,3.7vw,20px);font-weight:550;line-height:1.4;text-align:center}
 .oneMuslimCaptionLower span{animation:oneMuslimCaptionStar .3s ease-out both}
 @keyframes oneMuslimCaptionAscend{from{opacity:0;clip-path:inset(100% 0 0);translate:0 40px}to{opacity:1;clip-path:inset(0);translate:0 0}}
 @keyframes oneMuslimCaptionStar{from{opacity:0;filter:blur(3px)}to{opacity:1;filter:blur(0)}}
 @media(prefers-reduced-motion:reduce){.oneMuslimCaptionUpper,.oneMuslimCaptionUpper span,.oneMuslimCaptionLower span{animation:none}}
 `}</style><div className="oneMuslimCaptionUpper">{upper.map(w=><span key={w.start+":"+w.word}>{w.word}</span>)}</div><div className="oneMuslimCaptionLower">{lower.map(w=><span key={w.start+":"+w.word}>{w.word}</span>)}</div></div>;
}
