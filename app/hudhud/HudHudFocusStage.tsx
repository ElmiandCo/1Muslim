"use client";
import {useEffect,useRef,useState,type TouchEvent} from "react";
import Link from "next/link";
import HudHudVerseCard from "../components/HudHudVerseCard";
import type {HudHudPresentation} from "../lib/hudhud-presentation";
import "./hudhud-focus.css";

export type HudHudImage={title:string;imageUrl:string;thumbnailUrl:string;pageUrl:string;source:string;width?:number;height?:number};
export type HudHudMatch={id:string;kind:string;title:string;href:string;image?:string;description?:string};
export type HudHudLine={role:"user"|"assistant";content:string;matches?:HudHudMatch[];presentation?:HudHudPresentation;verses?:{key:string;arabic:string;english:string;translation:string;source?:string}[];images?:HudHudImage[]};
type Props={lines:HudHudLine[];sessionId:string;busy:boolean;speakingAt:{sessionId:string;index:number}|null;speechChar:number};

function Narration({text,spokenChars}:{text:string;spokenChars?:number}){
 const sentences=text.match(/[^.!?]+[.!?]*\s*/g)||[text];
 let offset=0;
 return <p className="hudNarratedReply">{sentences.map((part,index)=>{const start=offset;offset+=part.length;return <span key={index} className={spokenChars===undefined?"":spokenChars>=start?"hudNarratedHeard":"hudNarratedUpcoming"}>{part}</span>})}</p>;
}
function Answer({line,index,sessionId,speakingAt,speechChar,onImageOpen}:{line:HudHudLine;index:number;sessionId:string;speakingAt:Props["speakingAt"];speechChar:number;onImageOpen:()=>void}){
 const spoken=speakingAt?.sessionId===sessionId&&speakingAt.index===index?speechChar:undefined;
 const image=line.presentation?.kind==="image"?line.images?.[0]:undefined;
 if(image)return <button className="hudFocusImageButton" type="button" onClick={onImageOpen} aria-label={"More information about "+image.title}>
  <img src={image.imageUrl} alt={image.title||"Image search result"} loading="eager" onError={event=>{const target=event.currentTarget;if(target.src!==image.thumbnailUrl)target.src=image.thumbnailUrl}}/>
  <span>{image.title}<small>Tap for details · {image.source}</small></span>
 </button>;
 if(line.presentation?.kind==="verse"&&line.verses?.[0]){
  const verse=line.verses[0];
  return <div className="hudVersePresentation"><HudHudVerseCard featured verseKey={verse.key} verseData={verse} href={"/quran-library?verse="+encodeURIComponent(verse.key)} spokenChars={spoken===undefined?undefined:Math.max(0,spoken-line.content.indexOf(verse.english))}/></div>;
 }
 return <>
  <Narration text={line.content} spokenChars={spoken}/>
  {line.presentation?.kind==="results"&&line.matches&&line.matches.length>0&&<div className="hudMatches" role="list" aria-label="Verified search matches">{line.matches.slice(0,3).map(match=><div className="hudMatchCard" role="listitem" key={match.href}>{match.kind==="Qur’an"&&/^\d{1,3}:\d{1,3}$/.test(match.id)
   ?<HudHudVerseCard verseKey={match.id} href={match.href}/>
   :<Link href={match.href}>{match.image?.startsWith("https://")&&<img src={match.image} alt="" loading="lazy"/>}<span className="hudMatchKind">{match.kind}</span><strong>{match.title}</strong>{match.description&&<small>{match.description.slice(0,105)}</small>}<em>View source ↗</em></Link>}</div>)}</div>}
 </>;
}

/** One visual response at a time; keep the complete chat in pull-down history. */
export default function HudHudFocusStage({lines,sessionId,busy,speakingAt,speechChar}:Props){
 const latestIndex=lines.reduce((last,line,index)=>line.role==="assistant"?index:last,-1);
 const latest=latestIndex>=0?lines[latestIndex]:null;
 const answerKey=sessionId+":"+(latestIndex<0?"none":latestIndex+":"+latest?.content.slice(0,80));
 const observed=useRef<string|null>(null);
 const asked=useRef(false);
 const touch=useRef<{x:number;y:number;scrollTop:number}|null>(null);
 const lastActivity=useRef(0);
 const cardRef=useRef<HTMLDivElement>(null);
 const [visible,setVisible]=useState(false);
 const [idle,setIdle]=useState(false);
 const [historyOpen,setHistoryOpen]=useState(false);
 const [imageInfoOpen,setImageInfoOpen]=useState(false);
 const [revealCount,setRevealCount]=useState(0);
 const [activity,setActivity]=useState(0);
 const markActivity=()=>{const now=Date.now();if(now-lastActivity.current>550){lastActivity.current=now;setActivity(n=>n+1)}};
 useEffect(()=>{if(busy){asked.current=true;setImageInfoOpen(false);setHistoryOpen(false)}},[busy]);
 useEffect(()=>{
  if(observed.current===null){observed.current=answerKey;return}
  const changed=observed.current!==answerKey;
  if(changed){
   observed.current=answerKey;
   if(asked.current&&latest){setVisible(true);setIdle(false);setRevealCount(n=>n+1)}
   else{setVisible(false);setIdle(false)}
  }
  if(!busy&&asked.current&&!changed)setVisible(false);
  if(!busy)asked.current=false;
 },[answerKey,busy,latest]);
 useEffect(()=>{
  if(!visible||idle||historyOpen||busy||speakingAt?.sessionId===sessionId&&speakingAt?.index===latestIndex)return;
  const timer=window.setTimeout(()=>setIdle(true),20_000);
  return()=>window.clearTimeout(timer);
 },[visible,idle,historyOpen,busy,sessionId,latestIndex,answerKey,speakingAt,activity]);
 useEffect(()=>{
  const open=()=>{if(lines.length)setHistoryOpen(true)};
  window.addEventListener("1muslim:hudhud-show-history",open);
  return()=>window.removeEventListener("1muslim:hudhud-show-history",open);
 },[lines.length]);
 useEffect(()=>{
  const onEscape=(event:KeyboardEvent)=>{if(event.key==="Escape"){setImageInfoOpen(false);setHistoryOpen(false)}};
  window.addEventListener("keydown",onEscape);
  return()=>window.removeEventListener("keydown",onEscape);
 },[]);
 const reveal=()=>{if(!latest||busy)return;setVisible(true);setIdle(false);setRevealCount(n=>n+1)};
 const onTouchStart=(event:TouchEvent<HTMLElement>)=>{
  markActivity();
  if(event.touches.length!==1){touch.current=null;return}
  const t=event.touches[0];
  touch.current={x:t.clientX,y:t.clientY,scrollTop:cardRef.current?.scrollTop||0};
 };
 const onTouchEnd=(event:TouchEvent<HTMLElement>)=>{
  const start=touch.current;touch.current=null;
  if(imageInfoOpen)return;
  if(!start||event.changedTouches.length!==1)return;
  const t=event.changedTouches[0],dx=t.clientX-start.x,dy=t.clientY-start.y;
  if(Math.abs(dx)>65||Math.abs(dy)<75)return;
  if(dy>0&&!historyOpen&&start.scrollTop<3&&lines.length){setHistoryOpen(true);setImageInfoOpen(false)}
  if(dy<0&&historyOpen&&(event.target as HTMLElement).closest(".hudHistoryTop"))setHistoryOpen(false);
 };
 const image=latest?.presentation?.kind==="image"?latest.images?.[0]:undefined;
 return <div className={"hudFocusSurface"+(historyOpen?" hudHistoryIsOpen":"")} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}onClick={event=>{markActivity();if((idle||!visible)&&!busy&&event.target===event.currentTarget)reveal()}} aria-label="HudHud current answer. Swipe down to view previous answers.">
  {latest&&visible&&<div key={answerKey+":"+revealCount} ref={cardRef} onScroll={markActivity} className={"hudFocusCard"+(busy?" hudFocusLeaving":"")+(idle?" hudFocusIdle":"")+(revealCount%2?" hudFrameFromCenter":" hudFrameFromLeft")} onClick={()=>{if(idle)reveal()}} aria-live="polite">
   <div className="hudFocusContent"><Answer line={latest} index={latestIndex} sessionId={sessionId} speakingAt={speakingAt} speechChar={speechChar} onImageOpen={()=>{setImageInfoOpen(true);setIdle(false)}}/></div>
  </div>}
  {latest&&idle&&!busy&&!historyOpen&&<button type="button" className="hudFocusRestore" aria-label="Show the last HudHud answer again" onClick={reveal}/>}
  {busy&&<div className="hudFocusWorking" role="status"><span className="hudFocusLoadingLine"/><span className="hudSrOnly">HudHud is preparing the next answer.</span></div>}
  {historyOpen&&<div className="hudHistoryOverlay" role="dialog" aria-modal="true" aria-label="Earlier HudHud conversation">
   <div className="hudHistoryTop"><div><small>PREVIOUS CONVERSATION</small><h2>History</h2></div><button type="button" onClick={()=>setHistoryOpen(false)} aria-label="Close conversation history">Close</button></div>
   <div className="hudHistoryList">{lines.map((line,index)=><article className={"hudHistoryItem "+(line.role==="user"?"hudHistoryQuestion":"hudHistoryAnswer")} key={sessionId+":"+index}><small>{line.role==="user"?"YOU":"HUDHUD"}</small>
    <p>{line.presentation?.kind==="verse"&&line.verses?.[0]?line.verses[0].english:line.content}</p>
    {line.presentation?.kind==="verse"&&line.verses?.[0]&&<span>Qur’an · {line.verses[0].key}</span>}
    {line.images?.[0]&&<img src={line.images[0].thumbnailUrl} alt={line.images[0].title} loading="lazy"/>}
   </article>)}</div>
  </div>}
  {imageInfoOpen&&image&&<div className="hudImageInfoBackdrop" onClick={()=>setImageInfoOpen(false)}><section className="hudImageInfoPanel" role="dialog" aria-modal="true" aria-label="Image information" onClick={event=>event.stopPropagation()}>
   <button className="hudImageInfoClose" type="button" onClick={()=>setImageInfoOpen(false)} aria-label="Close image information">×</button>
   <img src={image.thumbnailUrl} alt={image.title} loading="eager"/><h2>{image.title}</h2><p>Image source: {image.source}</p>
   {image.width&&image.height&&<p>Original dimensions: {image.width} × {image.height}</p>}
   <a href={image.pageUrl} target="_blank" rel="noopener noreferrer">Visit original image source ↗</a>
  </section></div>}
 </div>;
}
