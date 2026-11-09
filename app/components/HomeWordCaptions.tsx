"use client";
import {useEffect,useState} from "react";
export type TimedWord={word:string;start:number;end:number};
const cache=new Map<string,TimedWord[]>();
/** Renders ONLY actual word-level timestamps. Never guesses speech from playback time. */
export default function HomeWordCaptions({videoId,seconds}:{videoId:string;seconds:number}){
 const [words,setWords]=useState<TimedWord[]>([]);
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
 const active=words.filter(w=>w.start<=seconds&&w.end>seconds-.12).slice(-1);
 const current=active[0];
 if(!current)return null;
 return <div className="oneMuslimWordCaption" aria-live="off" aria-label="Spoken captions"><style>{`
 .oneMuslimWordCaption{position:absolute;left:50%;bottom:calc(100% + 10px);transform:translateX(-50%);z-index:90;pointer-events:none;color:white;font:700 clamp(18px,4vw,32px)/1.15 system-ui,sans-serif;text-align:center;text-shadow:0 2px 10px #000,0 0 15px #000;white-space:nowrap;max-width:95vw}
 .oneMuslimWordCaption span{animation:oneMuslimWordGlow .22s ease-out both}@keyframes oneMuslimWordGlow{from{opacity:.25;filter:blur(3px)}to{opacity:1;filter:blur(0)}}
 `}</style><span key={current.start}>{current.word}</span></div>;
}
