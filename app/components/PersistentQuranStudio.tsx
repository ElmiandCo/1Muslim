"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";

type VerseSnapshot={key:string;arabic:string;translation:string;chapter:string;reciter:string;note?:string;highlights?:number;underlines?:number};
type Mode="mini"|"widget";
const STORAGE="1muslim:quran-floating-session";
const EVENT="1muslim:quran-floating-update";
const safe=(value:unknown):VerseSnapshot|null=>{
 if(!value||typeof value!=="object")return null;
 const v=value as Partial<VerseSnapshot>;
 if(!/^([1-9]|[1-9][0-9]|1[01][0-4]):[1-9][0-9]*$/.test(v.key||""))return null;
 return {key:v.key!,arabic:String(v.arabic||"").slice(0,2500),translation:String(v.translation||"").slice(0,2500),chapter:String(v.chapter||"Quran").slice(0,100),reciter:String(v.reciter||"ar.alafasy"),note:String(v.note||"").slice(0,180),highlights:Number(v.highlights)||0,underlines:Number(v.underlines)||0};
};
export default function PersistentQuranStudio(){
 const pathname=usePathname();
 const [verse,setVerse]=useState<VerseSnapshot|null>(null),[mode,setMode]=useState<Mode>("mini"),[playing,setPlaying]=useState(false);
 const audio=useRef<HTMLAudioElement|null>(null);
 const studio=pathname?.startsWith("/elm-tent/quran");
 const stop=useCallback(()=>{audio.current?.pause();audio.current=null;setPlaying(false)},[]);
 useEffect(()=>{
  try{const saved=sessionStorage.getItem(STORAGE);if(saved){const state=JSON.parse(saved);setVerse(safe(state.verse));setMode(state.mode==="widget"?"widget":"mini")}}catch{}
  const onUpdate=(event:Event)=>{const detail=(event as CustomEvent<VerseSnapshot>).detail;const next=safe(detail);if(!next)return;setVerse(next);setMode("mini")};
  window.addEventListener(EVENT,onUpdate);
  return()=>window.removeEventListener(EVENT,onUpdate);
 },[]);
 useEffect(()=>{if(!verse)return;try{sessionStorage.setItem(STORAGE,JSON.stringify({verse,mode}))}catch{}},[verse,mode]);
 const close=()=>{stop();setVerse(null);try{sessionStorage.removeItem(STORAGE)}catch{}};
 const play=async()=>{
  if(playing){stop();return}
  if(!verse)return;
  stop();
  const key=verse.key;const reciter=verse.reciter;
  let url="https://cdn.islamic.network/quran/audio/128/"+encodeURIComponent(reciter)+"/"+key.replace(":","/")+".mp3";
  try{const [chapter,ayah]=key.split(":");const response=await fetch("/api/quran-audio?reciter="+encodeURIComponent(reciter)+"&chapter="+chapter+"&verse="+ayah);if(response.ok){const result=await response.json();if(result.available&&result.url)url=result.url}}catch{}
  const next=new Audio(url);audio.current=next;next.onended=()=>{if(audio.current===next){audio.current=null;setPlaying(false)}};next.onerror=()=>{if(audio.current===next){audio.current=null;setPlaying(false)}};try{await next.play();setPlaying(true)}catch{setPlaying(false)}
 };
 useEffect(()=>{return()=>{audio.current?.pause();audio.current=null}},[]);
 if(!verse||studio)return null;
 const href="/elm-tent/quran?verse="+encodeURIComponent(verse.key);
 return <aside className={"quranFloat "+(mode==="widget"?"quranFloatExpanded":"")} aria-label="Your Quran Studio widget">
  <div className="quranFloatHeader"><span className="quranFloatIcon" aria-hidden="true">۞</span><div><strong>{verse.chapter}</strong><small>{verse.key} · Qur’an Studio</small></div><button type="button" onClick={()=>setMode(mode==="mini"?"widget":"mini")} aria-label={mode==="mini"?"Expand Quran widget":"Minimize Quran widget"}>{mode==="mini"?"▢":"−"}</button><button type="button" onClick={close} aria-label="Close Quran widget">×</button></div>
  {mode==="widget"&&<div className="quranFloatBody"><p lang="ar" dir="rtl">{verse.arabic}</p><p>{verse.translation}</p>{(verse.note||verse.highlights||verse.underlines)?<small>✦ Your study {verse.note?"· Note saved":""}{verse.highlights?" · "+verse.highlights+" highlights":""}{verse.underlines?" · "+verse.underlines+" underlines":""}</small>:null}</div>}
  <div className="quranFloatActions"><button type="button" onClick={()=>void play()} aria-label={playing?"Pause recitation":"Play verse recitation"}>{playing?"Ⅱ Pause":"▶ Listen"}</button><Link href={href} aria-label="Open full Quran Studio at this verse">Full Studio ↗</Link></div>
  <style jsx>{`
   .quranFloat{position:fixed;right:clamp(10px,2vw,24px);bottom:calc(118px + env(safe-area-inset-bottom,0px));z-index:890;max-width:calc(100vw - 20px);width:min(285px,calc(100vw - 20px));border:1px solid #d9c38d99;border-radius:20px;background:linear-gradient(145deg,#143c30f5,#091e22f6);box-shadow:0 20px 65px #000a,inset 0 1px #fff2;color:#f4f0dc;backdrop-filter:blur(22px);overflow:hidden;animation:quranFloatArrive .35s ease both}
   .quranFloatExpanded{width:min(370px,calc(100vw - 20px))}
   .quranFloatHeader{display:flex;align-items:center;gap:9px;padding:10px 12px}.quranFloatIcon{display:grid;place-items:center;flex:none;width:32px;height:32px;border-radius:12px;background:#d7c48e22;color:#f3d99c;font-size:20px}.quranFloatHeader div{min-width:0;flex:1;display:grid;gap:1px}.quranFloatHeader strong{font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.quranFloatHeader small{font-size:10px;color:#b6d0bd}.quranFloatHeader button{flex:none;border:1px solid #e4d19b44;border-radius:10px;background:#ffffff0c;color:#f5ecd4;min-width:30px;height:30px;cursor:pointer}
   .quranFloatBody{padding:4px 16px 12px;max-height:min(38vh,280px);overflow:auto;border-top:1px solid #ffffff17}.quranFloatBody p[lang=ar]{font-size:clamp(23px,5vw,30px);line-height:2;text-align:center;color:#f8f0d9}.quranFloatBody p:not([lang]){font-size:12px;line-height:1.7;color:#d2dfd4}.quranFloatBody small{display:block;font-size:10px;color:#e6cb93}
   .quranFloatActions{display:flex;gap:8px;padding:8px 12px 12px}.quranFloatActions button,.quranFloatActions :global(a){flex:1;text-align:center;border:1px solid #d8be8066;border-radius:12px;background:#ffffff0d;color:#f5e7c1;padding:9px 7px;font:inherit;font-size:11px;font-weight:750;text-decoration:none;cursor:pointer}.quranFloatActions button:focus-visible,.quranFloatHeader button:focus-visible,.quranFloatActions :global(a:focus-visible){outline:2px solid #f7da98;outline-offset:2px}
   @keyframes quranFloatArrive{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
   @media(max-width:700px){.quranFloat{right:10px;bottom:calc(105px + env(safe-area-inset-bottom,0px));width:min(260px,calc(100vw - 20px))}.quranFloatExpanded{width:min(340px,calc(100vw - 20px))}}
   @media(prefers-reduced-motion:reduce){.quranFloat{animation:none}}
  `}</style>
 </aside>;
}
