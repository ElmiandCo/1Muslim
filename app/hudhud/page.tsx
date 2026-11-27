"use client";
import "./hudhud.css";
import HudHudOrb from "../components/HudHudOrb";
import HudHudVerseCard from "../components/HudHudVerseCard";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useCallback,useEffect,useRef,useState,type FormEvent} from "react";

type Match={id:string;kind:string;title:string;href:string;image?:string;description?:string};
type Line={role:"user"|"assistant";content:string;matches?:Match[]};
type Session={id:string;title:string;lines:Line[]};
type RecognitionEvent={results:ArrayLike<{isFinal:boolean;0:{transcript:string}}>} ;
type Recognition={lang:string;interimResults:boolean;continuous:boolean;onresult:((event:RecognitionEvent)=>void)|null;onerror:((event:{error:string})=>void)|null;onend:(()=>void)|null;start:()=>void;stop:()=>void;abort:()=>void};
type RecognitionWindow=Window&{SpeechRecognition?:new()=>Recognition;webkitSpeechRecognition?:new()=>Recognition};
const destinations=[
 {href:"/search",label:"Search 1Muslim",symbol:"⌕"},
 {href:"/quran-library",label:"Qur’an Library",symbol:"۞"},
 {href:"/widget-tools/prayer",label:"Prayer",symbol:"◷"},
 {href:"/profile",label:"My Profile",symbol:"◉"}
];

function Glyph({name}:{name:"menu"|"settings"|"mic"|"plus"|"close"|"send"|"new"|"back"}){
 const paths={
  menu:<><path d="M5 7h14M5 15h9"/></>,
  settings:<><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="#fff"/><circle cx="16" cy="17" r="3" fill="#fff"/></>,
  mic:<><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8"/></>,
  plus:<path d="M12 4v16M4 12h16"/>,
  close:<path d="M5 5l14 14M19 5 5 19"/>,
  send:<path d="M12 19V5m-6 6 6-6 6 6"/>,
  new:<><path d="M5 17V5h12M9 19h10V9"/><path d="M14 4h6v6"/></>,
  back:<path d="m15 5-7 7 7 7"/>
 };
 return <svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export default function HudHudPage(){
 const router=useRouter();
 const [sessions,setSessions]=useState<Session[]>([{id:"first",title:"New chat",lines:[]}]);
 const [activeId,setActiveId]=useState("first");
 const [draft,setDraft]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [remaining,setRemaining]=useState<number|null>(null);
 const [unlocked,setUnlocked]=useState(false);
 const [listening,setListening]=useState(false);
 const [menuOpen,setMenuOpen]=useState(false);
 const [settingsOpen,setSettingsOpen]=useState(false);
 const [actionsOpen,setActionsOpen]=useState(false);
 const [readAloud,setReadAloud]=useState(true);
 const [speaking,setSpeaking]=useState(false);
 const [exiting,setExiting]=useState(false);
 const [touchStart,setTouchStart]=useState<{x:number;y:number}|null>(null);
 const [stillOrb,setStillOrb]=useState(false);
 const [focused,setFocused]=useState(false);
 const [queryContext,setQueryContext]=useState("");
 const [viewport,setViewport]=useState<{height:number;top:number}|null>(null);
 const recognizer=useRef<Recognition|null>(null);
 const chatEnd=useRef<HTMLDivElement>(null);
 const input=useRef<HTMLInputElement>(null);
 const voiceTranscript=useRef("");
 const askRef=useRef<(message:string)=>void>(()=>{});
 const originRef=useRef("/search");
 const safeReturn=(s:string)=>s.startsWith("/")&&!s.startsWith("//")&&!s.startsWith("/\\")&&!s.includes("://")&&!s.startsWith("/hudhud")&&!s.startsWith("/auth")?s:"/search";
 const current=sessions.find(x=>x.id===activeId)||sessions[0];
 const lines=current.lines;
 const exhausted=remaining===0;

 const stopVoice=useCallback((abort=false)=>{
  const rec=recognizer.current;
  recognizer.current=null;
  if(rec){rec.onend=null;rec.onerror=null;rec.onresult=null;try{if(abort)rec.abort();else rec.stop()}catch{}}
  setListening(false);
 },[]);
 useEffect(()=>{
  const controller=new AbortController();
  const params=new URLSearchParams(window.location.search);
  setQueryContext((params.get("q")||"").trim().slice(0,90));
  let referring="/search";
  try{const url=new URL(document.referrer);if(url.origin===window.location.origin)referring=url.pathname+url.search}catch{}
  let remembered="";
  try{remembered=sessionStorage.getItem("1muslim:hudhud:return")||""}catch{}
  const source=params.get("from")||remembered||referring;
  originRef.current=safeReturn(source);
  void fetch("/api/discover/ask",{cache:"no-store",signal:controller.signal})
   .then(async res=>{const data=await res.json();if(!res.ok)throw Error(data.error||"HudHud is unavailable");return data})
   .then(data=>{if(!controller.signal.aborted){setRemaining(typeof data.remaining==="number"?data.remaining:null);setUnlocked(Boolean(data.unlocked))}})
   .catch(()=>{if(!controller.signal.aborted)setError("Could not check HudHud availability. You can try again.")});
  return()=>controller.abort();
 },[]);
 useEffect(()=>{
  const visual=window.visualViewport;
  if(!visual)return;
  const sync=()=>setViewport({height:visual.height,top:visual.offsetTop});
  sync();visual.addEventListener("resize",sync);visual.addEventListener("scroll",sync);
  return()=>{visual.removeEventListener("resize",sync);visual.removeEventListener("scroll",sync)};
 },[]);
 useEffect(()=>{chatEnd.current?.scrollIntoView({block:"end",behavior:busy?"instant":"smooth"});},[lines.length,busy,activeId]);
 useEffect(()=>{
  const onHidden=()=>{if(document.hidden){stopVoice(true);window.speechSynthesis?.cancel()}};
  const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape"){setMenuOpen(false);setSettingsOpen(false);setActionsOpen(false);stopVoice(true)}};
  document.addEventListener("visibilitychange",onHidden);window.addEventListener("keydown",onKey);
  return()=>{document.removeEventListener("visibilitychange",onHidden);window.removeEventListener("keydown",onKey);stopVoice(true);window.speechSynthesis?.cancel()};
 },[stopVoice]);

 const newChat=()=>{
  if(busy)return;
  stopVoice(true);window.speechSynthesis?.cancel();
  const id="chat-"+Date.now();
  setSessions(old=>[{id,title:"New chat",lines:[]},...old].slice(0,20));
  setActiveId(id);setDraft("");setError("");setMenuOpen(false);setActionsOpen(false);
  input.current?.focus();
 };
 const ask=async(event?:FormEvent,spokenMessage?:string)=>{
  event?.preventDefault();
  const message=(spokenMessage||draft).trim();if(!message||busy||exhausted)return;
  stopVoice();
  const conversationId=activeId;
  const history=lines.slice(-6).map(x=>({role:x.role,content:x.content}));
  setSessions(old=>old.map(s=>s.id===conversationId?{...s,title:s.lines.length?s.title:message.slice(0,40),lines:[...s.lines,{role:"user",content:message}]}:s));
  setDraft("");setError("");setBusy(true);setActionsOpen(false);
  try{
   const response=await fetch("/api/discover/ask",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:queryContext,message,history})});
   const data=await response.json();
   if(typeof data.remaining==="number")setRemaining(data.remaining);
   if(data.unlocked)setUnlocked(true);
   if(!response.ok)throw Error(data.error||"HudHud could not reply.");
   const reply=String(data.reply||"").trim();
   if(!reply)throw Error("HudHud sent an empty reply.");
   setSessions(old=>old.map(s=>s.id===conversationId?{...s,lines:[...s.lines,{role:"assistant",content:reply,matches:Array.isArray(data.matches)?data.matches:[]}]}:s));
   if(readAloud&&"speechSynthesis" in window){
    window.speechSynthesis.cancel();
    const speech=new SpeechSynthesisUtterance(reply);
    speech.lang="en-US";speech.rate=1.07;speech.volume=.8;
    speech.onstart=()=>setSpeaking(true);speech.onend=()=>setSpeaking(false);speech.onerror=()=>setSpeaking(false);
    window.speechSynthesis.speak(speech);
   }
  }catch(caught){
   setSessions(old=>old.map(s=>s.id===conversationId?{...s,lines:s.lines.slice(0,-1)}:s));
   setDraft(message);
   setError(caught instanceof Error?caught.message:"HudHud is unavailable. Please try again.");
  }finally{setBusy(false)}
 };
 askRef.current=(message:string)=>{void ask(undefined,message)};
 const startVoice=()=>{
  if(listening){stopVoice();return;}
  // Prevent the assistant from transcribing its own just-spoken reply.
  window.speechSynthesis?.cancel();setSpeaking(false);
  setError("");setActionsOpen(false);
  const host=window as RecognitionWindow;
  const Voice=host.SpeechRecognition||host.webkitSpeechRecognition;
  if(!Voice){setError("Voice dictation is not supported in this browser. You can type your question instead.");return}
  try{
   const rec=new Voice();
   const prefix=draft.trim();voiceTranscript.current="";
   rec.lang="en-US";rec.interimResults=true;rec.continuous=false;
   rec.onresult=event=>{
    let transcript="";
    for(let i=0;i<event.results.length;i++)transcript+=event.results[i][0].transcript+" ";
    voiceTranscript.current=(prefix?prefix+" ":"")+transcript.trim();
    setDraft(voiceTranscript.current);
   };
   rec.onerror=event=>{
    recognizer.current=null;setListening(false);
    if(event.error!=="aborted"&&event.error!=="no-speech")setError(event.error==="not-allowed"?"Microphone permission was denied. Enable it in browser settings to dictate.":"Voice dictation stopped. Please try again.");
   };
   rec.onend=()=>{
    recognizer.current=null;setListening(false);
    const text=voiceTranscript.current.trim();
    if(text.length>2)window.setTimeout(()=>askRef.current(text),190);
   };
   rec.start();recognizer.current=rec;setListening(true);
  }catch{setListening(false);setError("Could not start the microphone. Check browser permissions and try again.")}
 };
 const close=()=>{
  stopVoice(true);window.speechSynthesis?.cancel();setSpeaking(false);setExiting(true);
  window.setTimeout(()=>router.push(safeReturn(originRef.current)),180);
 };

 return <main onTouchStart={event=>{
    const t=event.target as HTMLElement;
    if(t.closest("input,.hudMessages,.hudMatches,.hudDrawer,.hudActionPop"))return;
    setTouchStart({x:event.touches[0]?.clientX||0,y:event.touches[0]?.clientY||0});
   }} onTouchEnd={event=>{
    if(!touchStart)return;
    const dx=(event.changedTouches[0]?.clientX||0)-touchStart.x;
    const dy=(event.changedTouches[0]?.clientY||0)-touchStart.y;
    setTouchStart(null);if(dx< -100&&Math.abs(dy)<65)close();
   }} className={"hudPage"+(exiting?" hudExiting":"")+(speaking?" hudSpeaking":"")+(focused?" hudTyping":"")+(stillOrb?" hudStill":"")+(listening?" hudListening":"")+(busy?" hudThinking":"")} style={viewport?{height:viewport.height,top:viewport.top}:undefined} aria-label="HudHud chat">
  <header className="hudHeader">
   <button className="hudBackBrand" type="button" aria-label="Return to previous page" onClick={close}>One Muslim<span>.live</span></button>
   <div className="hudTitle" aria-label="HudHud — One Muslim voice assistant">HudHud</div>
   <div className="hudHeaderActions"><button className="hudCircle" type="button" aria-label={readAloud?"Mute HudHud voice":"Enable HudHud voice"} aria-pressed={readAloud} onClick={()=>{setReadAloud(v=>!v);window.speechSynthesis?.cancel();setSpeaking(false)}}>
    <svg viewBox="0 0 24 24" width="19" height="19" stroke="currentColor" fill="none" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4"/>{readAloud?<path d="M16 8q4 4 0 8M18 5q7 7 0 14"/>:<path d="m16 9 5 6m0-6-5 6"/>}</svg>
   </button><button className="hudCircle" type="button" aria-label="HudHud menu" aria-expanded={menuOpen} onClick={()=>{setMenuOpen(true);setSettingsOpen(false)}}><Glyph name="menu"/></button><button className="hudCircle" type="button" aria-label="HudHud settings" aria-expanded={settingsOpen} onClick={()=>{setSettingsOpen(!settingsOpen);setMenuOpen(false)}}><Glyph name="settings"/></button></div>
  </header>

  <section className={"hudMain"+(lines.length?" hudHasChat":"")} aria-label="Conversation">
   {lines.length===0&&<div className="hudOrbStage">
     <HudHudOrb listening={listening} speaking={speaking} thinking={busy} quiet={stillOrb} onClick={()=>{if(listening)stopVoice(true);else if(!busy)startVoice()}}/>
     <p aria-live="polite">{listening?"Listening…":busy?"One moment…":"As-salāmu ʿalaykum"}</p>
   </div>}
   {lines.length>0&&<div className="hudMessages">
     {lines.map((line,index)=><article key={current.id+"-"+index} className={"hudMessage "+(line.role==="user"?"hudUser":"hudAssistant")}>
       {line.role==="assistant"&&<span className="hudTinyOrb" aria-hidden="true"/>}
       <div className="hudMessageBody"><p>{line.content}</p>
        {line.matches&&line.matches.length>0&&<div className="hudMatches" role="list" aria-label="HudHud search suggestions">
 {line.matches.slice(0,6).map(item=><div className="hudMatchCard" role="listitem" key={item.href}>
  {item.kind==="Qur’an"&&/^\d{1,3}:\d{1,3}$/.test(item.id)
   ?<HudHudVerseCard verseKey={item.id} href={item.href}/>
   :<Link href={item.href}>
    {item.image?.startsWith("https://")&&<img src={item.image} alt="" loading="lazy"/>}
    <span className="hudMatchKind">{item.kind}</span>
    <strong>{item.title}</strong>
    {item.description&&<small>{item.description.slice(0,105)}</small>}
    <em>View source ↗</em>
   </Link>}
  </div>)}
 </div>}
 {line.matches&&line.matches.length>0&&<div className="hudQuickChoices" aria-label="Follow-up suggestions">
  <span>Explore these results?</span>
  <button type="button" onClick={()=>{setDraft("Yes, show me more about these results.");input.current?.focus()}}>Yes</button>
  <button type="button" onClick={()=>{setDraft("No, try another approach and explain why.");input.current?.focus()}}>No</button>
 </div>}
       </div>
     </article>)}
     {busy&&<div className="hudPending" role="status"><span className="hudTinyOrb" aria-hidden="true"/> HudHud is thinking <span className="hudDots">•••</span></div>}
     <div ref={chatEnd}/>
    </div>}
  </section>

  {error&&<p className="hudError" role="alert">{error}</p>}
  {exhausted&&<aside className="hudUpgrade"><strong>Your HudHud exploration is complete for now.</strong><Link href="/search">Explore 1Muslim Search ↗</Link></aside>}
  <div className="hudComposerArea">
   {queryContext&&<span className="hudContext">Searching for: {queryContext}</span>}
   <form className="hudComposer" onSubmit={ask}>
    <div className="hudInputPill">
     <button className="hudPlus" type="button" aria-label="More HudHud actions" aria-expanded={actionsOpen} onClick={()=>setActionsOpen(!actionsOpen)}><Glyph name="plus"/></button>
     <input ref={input} type="text" inputMode="text" value={draft} maxLength={900} autoComplete="off" aria-label="Ask HudHud" placeholder={exhausted?"Explore search instead":"Ask HudHud"} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} onChange={event=>setDraft(event.target.value)} disabled={busy||exhausted}/>
    </div>
    {draft.trim()&&!exhausted?<button className="hudMic hudSend" aria-label="Send question" type="submit" disabled={busy}><Glyph name="send"/></button>:<button className={"hudMic"+(listening?" isActive":"")} type="button" aria-label={listening?"Stop listening":"Dictate question with microphone"} aria-pressed={listening} onClick={startVoice} disabled={busy||exhausted}><Glyph name="mic"/></button>}
    <button className="hudEnd" type="button" aria-label="Close HudHud" onClick={close}><Glyph name="close"/></button>
   </form>
   
  </div>

  {actionsOpen&&<div className="hudActionPop" role="menu" aria-label="HudHud shortcuts">
    {destinations.map(item=><Link key={item.href} href={item.href} role="menuitem"><span aria-hidden="true">{item.symbol}</span>{item.label}</Link>)}
   </div>}
  {settingsOpen&&<div className="hudSettings" role="dialog" aria-label="HudHud settings">
    <h2>HudHud settings</h2>
    <label><span>Read replies aloud<small>Uses your browser's voice</small></span><input type="checkbox" checked={readAloud} onChange={e=>{setReadAloud(e.target.checked);if(!e.target.checked)window.speechSynthesis?.cancel()}}/></label>
    <label><span>Reduce orb motion<small>Keep the emerald orb still</small></span><input type="checkbox" checked={stillOrb} onChange={e=>setStillOrb(e.target.checked)}/></label>
    <p>Voice turns send when you finish speaking. You can mute spoken replies. Chats here are temporary.</p>
    <button type="button" onClick={()=>setSettingsOpen(false)}>Close settings</button>
   </div>}
  {menuOpen&&<div className="hudDrawerCover" onMouseDown={e=>{if(e.target===e.currentTarget)setMenuOpen(false)}}>
    <aside className="hudDrawer" role="dialog" aria-modal="true" aria-label="HudHud menu">
     <div className="hudDrawerTop"><strong>HudHud</strong><button type="button" aria-label="Close menu" onClick={()=>setMenuOpen(false)}><Glyph name="close"/></button></div>
     <button className="hudNewChat" type="button" onClick={newChat} disabled={busy}><Glyph name="new"/> New chat</button>
     <nav aria-label="1Muslim destinations">{destinations.map(item=><Link href={item.href} key={item.href}><span aria-hidden="true">{item.symbol}</span>{item.label}</Link>)}</nav>
     <h2>This visit</h2>
     <div className="hudSessionList">{sessions.map(s=><button type="button" key={s.id} className={s.id===activeId?"isActive":""} onClick={()=>{setActiveId(s.id);setMenuOpen(false)}}><span>{s.title}</span></button>)}</div>
     <p>Conversations aren't saved to your account on this page.</p>
    </aside>
   </div>}
 </main>;
}
