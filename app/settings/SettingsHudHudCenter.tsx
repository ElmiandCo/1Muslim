"use client";

import Link from "next/link";
import {useEffect,useState} from "react";

type ChatLine={role:"assistant"|"user";content:string};
type SavedSession={id:string;title:string;lines:ChatLine[]};
type MemoryState={signedIn:boolean;enabled:boolean;sessions:SavedSession[]};

const VOICE_KEY="1muslim:hudhud:voice-read-aloud";
const AUTO_KEY="1muslim:hudhud:auto-listen";
export default function SettingsHudHudCenter(){
 const [memory,setMemory]=useState<MemoryState>({signedIn:false,enabled:false,sessions:[]});
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [status,setStatus]=useState("");
 const [search,setSearch]=useState("");
 const [voice,setVoice]=useState(true);
 const [autoListen,setAutoListen]=useState(true);
 useEffect(()=>{
  let active=true;
  try{setVoice(localStorage.getItem(VOICE_KEY)!=="off");setAutoListen(localStorage.getItem(AUTO_KEY)!=="off")}catch{}
  void fetch("/api/hudhud/memory",{cache:"no-store"}).then(async response=>{
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw Error(typeof data.error==="string"?data.error:"Could not load your memory settings");
   return data;
  }).then(data=>{
   if(!active)return;
   const sessions:Array<SavedSession>=Array.isArray(data.sessions)?data.sessions.filter((s:unknown):s is SavedSession=>{
    if(!s||typeof s!=="object")return false;
    const v=s as Partial<SavedSession>;
    return typeof v.id==="string"&&typeof v.title==="string"&&Array.isArray(v.lines);
   }).slice(0,20):[];
   setMemory({signedIn:data.signedIn===true,enabled:data.enabled===true,sessions});
  }).catch(caught=>{if(active)setError(caught instanceof Error?caught.message:"Memory is temporarily unavailable")})
   .finally(()=>{if(active)setLoading(false)});
  return()=>{active=false};
 },[]);
 const mutate=async(payload:Record<string,unknown>)=>{
  const response=await fetch("/api/hudhud/memory",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(typeof data.error==="string"?data.error:"Could not update saved conversations");
  return data;
 };
 const updateMemory=async(value:boolean)=>{
  if(!memory.signedIn)return;
  setBusy(true);setError("");setStatus("");
  try{
   await mutate({action:"preference",enabled:value});
   setMemory(old=>({...old,enabled:value}));
   setStatus(value?"Account conversation memory is now on. Only future conversations are saved when HudHud is used.":"Memory is paused. Previously saved chats remain private until deleted.");
  }catch(caught){setError(caught instanceof Error?caught.message:"Could not change memory")}
  finally{setBusy(false)}
 };
 const deleteOne=async(id:string,title:string)=>{
  if(!window.confirm('Delete saved chat "'+title+'"? This cannot be undone.'))return;
  setBusy(true);setError("");setStatus("");
  try{
   await mutate({action:"delete",id});
   setMemory(old=>({...old,sessions:old.sessions.filter(s=>s.id!==id)}));
   setStatus("Conversation deleted.");
  }catch(caught){setError(caught instanceof Error?caught.message:"Could not delete this conversation")}
  finally{setBusy(false)}
 };
 const clearAll=async()=>{
  if(!window.confirm("Permanently delete ALL saved HudHud conversations from your account? Shahada verification is not affected."))return;
  setBusy(true);setError("");setStatus("");
  try{
   await mutate({action:"clear"});
   setMemory(old=>({...old,enabled:false,sessions:[]}));
   setStatus("Saved HudHud conversations deleted. Account memory is off.");
  }catch(caught){setError(caught instanceof Error?caught.message:"Could not clear memory")}
  finally{setBusy(false)}
 };
 const exportMine=()=>{
  const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),product:"1Muslim HudHud",sessions:memory.sessions},null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download="1muslim-hudhud-conversations.json";document.body.appendChild(a);a.click();a.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  setStatus("Your saved conversation export was prepared on this device.");
 };
 const switchAutoListen=(value:boolean)=>{
  setAutoListen(value);
  try{localStorage.setItem(AUTO_KEY,value?"on":"off")}catch{}
  setStatus(value?"Auto-listen will be on when you next open HudHud.":"Auto-listen disabled for HudHud. You can still tap the microphone to speak.");
 };
 const switchVoice=(value:boolean)=>{
  setVoice(value);
  try{localStorage.setItem(VOICE_KEY,value?"on":"off")}catch{}
  window.dispatchEvent(new Event("1muslim:hudhud-voice-preference"));
  setStatus(value?"HudHud voice replies enabled on this device.":"HudHud voice replies muted on this device.");
 };
 const matches=memory.sessions.filter(item=>(item.title+" "+item.lines.slice(-12).map(line=>line.content).join(" ")).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
 return <section id="hudhud-ai" className="scAiShell" aria-label="HudHud AI Control Center">
  <div className="scAiHeader"><div><span className="scAiEyebrow">HUDHUD · AI CONTROL CENTER</span><h2>Your HudHud, your control.</h2>
   <p>Find previous conversations, control what HudHud remembers, and adjust your voice experience without leaving Settings.</p></div>
   <Link href="/hudhud?settings=1">Open HudHud ↗</Link>
  </div>
  <div className="scAiGrid">
   <section className="scAiSection" aria-label="HudHud conversation history">
    <span className="scAiEyebrow">01 · YOUR CONVERSATIONS</span>
    <h3>Conversation history</h3>
    <p>{loading?"Checking your account…":memory.signedIn?"Search your private saved conversations. Only conversations saved with memory enabled appear here.":"Sign in to manage saved conversations."}</p>
    <input type="search" className="scAiSearch" placeholder="Search conversations" value={search} onChange={e=>setSearch(e.target.value)} aria-label="Search saved HudHud conversations" disabled={loading||!memory.signedIn}/>
    <div className="scAiHistory" role="list" aria-label="Saved HudHud conversations">
     {matches.map(session=><div className="scAiHistoryItem" role="listitem" key={session.id}>
      <Link href={"/hudhud?session="+encodeURIComponent(session.id)} title={"Open "+session.title}><span>{session.title}</span><small>{session.lines.length} messages · Open in HudHud</small></Link>
      <button type="button" disabled={busy} onClick={()=>void deleteOne(session.id,session.title)} aria-label={"Delete "+session.title}>Delete</button>
     </div>)}
     {!loading&&matches.length===0&&<div className="scAiEmpty">{memory.signedIn?(search?"No saved conversations match that search.":"No saved HudHud conversations yet. Enable memory to save future chats."):"Sign in to see your saved conversations."}</div>}
    </div>
    <div className="scAiActions">
     <button type="button" onClick={exportMine} disabled={busy||!memory.signedIn||!memory.sessions.length}>Export my chats</button>
     <button type="button" className="scDanger" onClick={()=>void clearAll()} disabled={busy||!memory.signedIn}>Delete all chats</button>
    </div>
   </section>
   <div style={{display:"grid",gap:16,alignContent:"start"}}>
    <section className="scAiSection" aria-label="HudHud account memory">
     <span className="scAiEyebrow">02 · ACCOUNT MEMORY</span><div className="scAiControls"><div><h3>Remember conversations</h3><p>Off by default. Private to your signed-in account.</p></div>
      <button type="button" className="scAiSwitch" aria-label="Save HudHud conversations to my account" aria-pressed={memory.enabled} disabled={busy||loading||!memory.signedIn} onClick={()=>void updateMemory(!memory.enabled)}>{memory.enabled?"ON":"OFF"}</button>
     </div>
     <div className="scAiNotice">History stores chat text and selected cards, not your raw microphone recordings. Turning memory off stops future saves; it does not erase earlier saved conversations.</div>
    </section>
    <section className="scAiSection" aria-label="HudHud voice settings">
     <span className="scAiEyebrow">03 · VOICE & ACCESS</span>
     <div className="scAiControls"><div><h3>Read replies aloud</h3><p>HudHud speaks its answers using your browser.</p></div>
      <button type="button" className="scAiSwitch" aria-label="HudHud spoken replies" aria-pressed={voice} onClick={()=>switchVoice(!voice)}>{voice?"ON":"OFF"}</button></div>
     <div className="scAiControls"><div><h3>Auto-listen in HudHud</h3><p>Automatically start when HudHud opens and the browser grants permission. Pauses during speech and typing.</p></div>
      <button type="button" className="scAiSwitch" aria-label="Automatically listen on HudHud page" aria-pressed={autoListen} onClick={()=>switchAutoListen(!autoListen)}>{autoListen?"ON":"OFF"}</button></div>
     <div className="scAiNotice"><strong>Microphone access</strong><br/>Your browser controls permission and speech recognition. Auto-listening works on HudHud’s own page; continuous listening across other 1Muslim pages is not yet available.</div>
     <div className="scAiActions"><Link href="/hudhud">Open microphone controls ↗</Link></div>
    </section>
   </div>
  </div>
  <p className="scAiPrivacy">Privacy: Only your authenticated account can access its saved HudHud history. Shahada verification recordings live in a separate private vault and are never deleted by these chat controls. Speech recognition may use your browser's speech service; no claim of offline speech processing is made.</p>
  {status&&<p className="scAiStatus" role="status">{status}</p>}
  {error&&<p className="scAiStatus" role="alert">{error}</p>}
 </section>;
}
