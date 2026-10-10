"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
type Journey={started:boolean;questionId:string|null;round:number;level:number;streak:number;lastActive:number;lastAnswered:number;tracking:boolean};
const KEY="1muslim:elm-journey:v1";
const fresh:Journey={started:false,questionId:null,round:0,level:1,streak:0,lastActive:Date.now(),lastAnswered:0,tracking:false};
export function readJourney():Journey{if(typeof window==="undefined")return fresh;try{return {...fresh,...JSON.parse(localStorage.getItem(KEY)||"{}")}}catch{return fresh}}
export function saveJourney(change:Partial<Journey>):Journey{const next={...readJourney(),...change,lastActive:Date.now()};try{localStorage.setItem(KEY,JSON.stringify(next));window.dispatchEvent(new Event("1muslim:journey-updated"))}catch{}return next}
export default function HudHudLearningNudge(){const [journey,setJourney]=useState<Journey|null>(null),[dismissed,setDismissed]=useState(false);
useEffect(()=>{const update=()=>setJourney(readJourney());update();window.addEventListener("1muslim:journey-updated",update);return()=>window.removeEventListener("1muslim:journey-updated",update)},[]);
if(!journey?.started||!journey.tracking||dismissed||!journey.lastAnswered||Date.now()-journey.lastAnswered<48*60*60*1000)return null;
return <aside style={{border:"1px solid #a8b57a",borderRadius:16,padding:15,margin:"12px",background:"var(--panel)",color:"var(--text)"}}><button style={{float:"right"}} onClick={()=>setDismissed(true)} aria-label="Dismiss HudHud learning reminder">×</button><b>🐦 HudHud checking in!</b><p>That question still has your name on it. Should I warm up the answer for you? 😄</p><Link href="/elm-tent/lessons">Resume your question →</Link></aside>
}
