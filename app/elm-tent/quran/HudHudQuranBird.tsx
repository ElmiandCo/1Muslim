"use client";
import {useEffect,useRef,useState} from "react";
import "./hudhud-quran-bird.css";

type QuranWord={text_uthmani?:string;translation?:{text:string};char_type_name?:string};
type Props={verseKey:string;chapterName:string;words?:QuranWord[];paused?:boolean};
const KEY="1muslim:hudhud-quran-page-awareness:v1";
const NO_WORDS:QuranWord[]=[];
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
const normalize=(text:string)=>text.normalize("NFKD").replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g,"").replace(/[^\u0621-\u064A]/g,"");
const short=(value:string,size=34)=>value.length>size?value.slice(0,size-1)+"…":value;

export default function HudHudQuranBird({verseKey,chapterName,words=NO_WORDS,paused=false}:Props){
 const [ready,setReady]=useState(false);
 const [enabled,setEnabled]=useState(false);
 const [bubble,setBubble]=useState(true);
 const [position,setPosition]=useState({x:14,y:180});
 const [hoverWord,setHoverWord]=useState("");
 const [meaning,setMeaning]=useState("");
 const [reduceMotion,setReduceMotion]=useState(false);
 const dismissTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const hoverTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const positionRef=useRef(position);
 const lastPointer=useRef({x:0,y:0});

 const place=(x:number,y:number)=>{
   positionRef.current={x,y};
   setPosition(prior=>Math.abs(prior.x-x)<4&&Math.abs(prior.y-y)<4?prior:{x,y});
 };
 const park=(pointer?:{x:number;y:number})=>{
   if(typeof window==="undefined")return;
   const width=window.innerWidth,height=window.innerHeight;
   const side=(pointer?.x??0)>=width/2?"left":"right";
   const x=side==="left"?12:Math.max(12,width-65);
   const natural=clamp(Math.round(height*.43),125,Math.max(125,height-170));
   const avoidPointer=pointer&&Math.abs(pointer.y-natural)<125&&Math.abs(pointer.x-x)<180;
   const y=avoidPointer?clamp(pointer.y>height*.50?natural-120:natural+135,130,Math.max(130,height-175)):natural;
   place(x,y);
 };
 const scheduleClose=(duration=7200)=>{
   if(dismissTimer.current)clearTimeout(dismissTimer.current);
   dismissTimer.current=window.setTimeout(()=>setBubble(false),duration);
 };
 useEffect(()=>{
   try{const stored=localStorage.getItem(KEY);setEnabled(stored==="on")}catch{}
   const query=window.matchMedia("(prefers-reduced-motion: reduce)");
   const sync=()=>setReduceMotion(query.matches);
   sync();query.addEventListener?.("change",sync);
   park();
   setReady(true);
   scheduleClose(7200);
   return()=>{query.removeEventListener?.("change",sync);if(dismissTimer.current)clearTimeout(dismissTimer.current)};
 },[]);
 useEffect(()=>{
   if(!ready||!enabled||paused)return;
   setHoverWord("");setMeaning("");
   // Remind, then return the verse to a distraction-free reading surface.
   setBubble(true);scheduleClose(4300);
 },[verseKey,ready,enabled,paused]);
 useEffect(()=>{
   if(!ready||!enabled||paused)return;
   let pending=false,lastAt=0;
   const inspect=(event:PointerEvent)=>{
     if(event.pointerType==="touch")return;
     lastPointer.current={x:event.clientX,y:event.clientY};
     if(pending||performance.now()-lastAt<180)return;
     pending=true;
     window.requestAnimationFrame(()=>{
       pending=false;lastAt=performance.now();
       const target=event.target;
       if(!(target instanceof Element))return;
       if(target.closest(".hqbRoot,[role=dialog],input,textarea,select"))return;
       const element=target.closest(".omWord,.omQuranAnnotatedWord,[data-quran-word]") as HTMLElement|null;
       const text=element?.textContent?.trim().replace(/\s+/g," ").slice(0,35)||"";
       if(text){
         const match=words.find(word=>word.char_type_name==="word"&&normalize(word.text_uthmani||"")===normalize(text));
         setHoverWord(short(text));
         setMeaning(match?.translation?.text?.replace(/<[^>]*>/g,"").slice(0,80)||"");
       }else{setHoverWord("");setMeaning("")}
       const bird=positionRef.current;
       // Only move if the reading pointer actually approaches HudHud; never chase.
       if(Math.hypot(event.clientX-(bird.x+27),event.clientY-(bird.y+27))<124)park(lastPointer.current);
     });
   };
   const settle=()=>{
     if(hoverTimer.current)clearTimeout(hoverTimer.current);
     hoverTimer.current=window.setTimeout(()=>park(lastPointer.current),450);
   };
   window.addEventListener("pointermove",inspect,{passive:true});
   window.addEventListener("scroll",settle,{passive:true,capture:true});
   window.addEventListener("resize",settle,{passive:true});
   return()=>{
     window.removeEventListener("pointermove",inspect);
     window.removeEventListener("scroll",settle,true);
     window.removeEventListener("resize",settle);
     if(hoverTimer.current)clearTimeout(hoverTimer.current);
   };
 },[ready,enabled,paused,verseKey,words]);
 const setAwareness=(value:boolean)=>{
   setEnabled(value);
   try{localStorage.setItem(KEY,value?"on":"off")}catch{}
   if(value)park();
   setBubble(true);scheduleClose(6400);
 };
 const open=()=>{setBubble(value=>!value);scheduleClose(16000)};
 const ask=()=>{
   window.dispatchEvent(new CustomEvent("1muslim:hudhud-open-quran",{
     detail:{verse:verseKey,chapter:chapterName,word:hoverWord||undefined}
   }));
   setBubble(false);
 };
 if(!ready||paused)return null;
 return <aside className={"hqbRoot"+(enabled?" hqbAware":"")+(reduceMotion?" hqbStill":"")}
   style={{left:position.x,top:position.y}} aria-label="HudHud Qur’an companion">
   <button className="hqbBird" type="button" onClick={open} aria-label={bubble?"Close HudHud's small speech bubble":"Open HudHud's small speech bubble"} aria-expanded={bubble}>
     <img src="/assets/hudhud-logo.PNG" alt="" aria-hidden="true"/>
     <span className="hqbHalo" aria-hidden="true"/>
   </button>
   {bubble&&<div className="hqbBubble" role="group" aria-label="HudHud reading assistance"
      data-side={position.x<window.innerWidth/2?"left":"right"}>
     <div className="hqbBubbleTop"><strong>HudHud <span aria-hidden="true">✦</span></strong>
       <button type="button" onClick={()=>setBubble(false)} aria-label="Close HudHud speech bubble">×</button></div>
     {!enabled?
       <><p>Assalamu alaikum 🌙 Shall I follow your reading and pointer on this Qur’an page?</p>
         <button className="hqbPrimary" type="button" onClick={()=>setAwareness(true)}>Yes, join me</button>
         <small>Only this page, on your device. No screen recording or cursor uploads.</small></>
       :
       <><p>{hoverWord
           ? <>You're pointing at <b dir="rtl" lang="ar">{hoverWord}</b>. {meaning?<>Word meaning: <strong>{meaning}</strong></>:"Tap it to explore its meaning."}</>
           : <>I'm here with you at <strong>{verseKey}</strong> · {short(chapterName,24)}. Ask me when you're ready.</>}</p>
         <button className="hqbPrimary" type="button" onClick={ask}>Ask about this āyah ↗</button>
         <button className="hqbQuiet" type="button" onClick={()=>setAwareness(false)}>Turn page awareness off</button>
         <small>Page context only. HudHud never records the screen or pointer.</small></>}
   </div>}
 </aside>;
}
