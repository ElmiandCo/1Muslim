"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import "./hudhud-personal-context.css";

type PersonalNote={id:string;text:string;savedAt:string;source:"user"|"hudhud"};
type Profile={displayName:string;username:string|null;bio:string|null;memberSince:string|null};
type PrivateContext={aboutMe:string;answerPreferences:string;notes:PersonalNote[];allowRememberRequests:boolean;updatedAt:string|null};
type Snapshot={signedIn:boolean;profile:Profile|null;privateContext:PrivateContext|null;storeReady?:boolean};
const api="/api/hudhud/context";
export default function HudHudPersonalContextPanel(){
 const [snapshot,setSnapshot]=useState<Snapshot|null>(null);
 const [aboutMe,setAboutMe]=useState("");
 const [answerPreferences,setAnswerPreferences]=useState("");
 const [allowRememberRequests,setAllowRememberRequests]=useState(false);
 const [newNote,setNewNote]=useState("");
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState("");
 const [error,setError]=useState("");

 useEffect(()=>{
  let live=true;
  void fetch(api,{cache:"no-store"}).then(async response=>{
   const data=await response.json();
   if(!response.ok)throw Error(data.error||"Your HudHud details are temporarily unavailable");
   return data as Snapshot;
  }).then(data=>{
   if(!live)return;
   setSnapshot(data);
   setAboutMe(data.privateContext?.aboutMe||"");
   setAnswerPreferences(data.privateContext?.answerPreferences||"");
   setAllowRememberRequests(data.privateContext?.allowRememberRequests===true);
  }).catch(e=>{if(live)setError(e instanceof Error?e.message:"Could not load private details")})
   .finally(()=>{if(live)setLoading(false)});
  return()=>{live=false};
 },[]);
 const send=async(payload:Record<string,unknown>)=>{
  const result=await fetch(api,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),cache:"no-store"});
  const data=await result.json().catch(()=>({}));
  if(!result.ok)throw Error(data.error||"HudHud couldn't save your changes");
  return data;
 };
 const save=async()=>{
  setBusy(true);setError("");setNotice("");
  try{
   await send({action:"update",aboutMe,answerPreferences,allowRememberRequests});
   setSnapshot(old=>old?{...old,privateContext:{aboutMe:aboutMe.trim(),answerPreferences:answerPreferences.trim(),
    notes:old.privateContext?.notes||[],allowRememberRequests,updatedAt:new Date().toISOString()}}:old);
   setNotice("HudHud's private context was updated.");
  }catch(e){setError(e instanceof Error?e.message:"Unable to save your information")}
  finally{setBusy(false)}
 };
 const addNote=async()=>{
  if(!newNote.trim())return;
  setBusy(true);setError("");setNotice("");
  try{
   const data=await send({action:"add-note",text:newNote});
   setSnapshot(old=>old&&old.privateContext?{...old,privateContext:{...old.privateContext,notes:data.notes||old.privateContext.notes}}:old);
   setNewNote("");
   setNotice(data.alreadySaved?"That detail is already in HudHud's notes.":"Saved to your private HudHud notes.");
  }catch(e){setError(e instanceof Error?e.message:"Unable to save your note")}
  finally{setBusy(false)}
 };
 const removeNote=async(id:string)=>{
  setBusy(true);setError("");setNotice("");
  try{
   const data=await send({action:"delete-note",id});
   setSnapshot(old=>old&&old.privateContext?{...old,privateContext:{...old.privateContext,notes:data.notes||[]}}:old);
   setNotice("Private note deleted.");
  }catch(e){setError(e instanceof Error?e.message:"Could not delete note")}
  finally{setBusy(false)}
 };
 const clear=async()=>{
  if(!window.confirm("Delete everything in HudHud's private About Me and Notes area? Your public profile and separately saved chats won't change."))return;
  setBusy(true);setError("");setNotice("");
  try{
   await send({action:"clear"});
   setAboutMe("");setAnswerPreferences("");setAllowRememberRequests(false);
   setSnapshot(old=>old?{...old,privateContext:{aboutMe:"",answerPreferences:"",notes:[],allowRememberRequests:false,updatedAt:null}}:old);
   setNotice("Your private HudHud details and notes have been deleted.");
  }catch(e){setError(e instanceof Error?e.message:"Could not delete your private context")}
  finally{setBusy(false)}
 };
 const exportPersonal=()=>{
  const content={exportedAt:new Date().toISOString(),profile:snapshot?.profile,privateContext:snapshot?.privateContext};
  const url=URL.createObjectURL(new Blob([JSON.stringify(content,null,2)],{type:"application/json"}));
  const a=document.createElement("a");a.href=url;a.download="1muslim-hudhud-about-me.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 const notes=snapshot?.privateContext?.notes||[];
 return <section className="hhPersonalShell" aria-label="What HudHud knows about me">
  <header className="hhPersonalHeading">
   <div><span className="scAiEyebrow">03 · YOUR PERSONAL HUDHUD</span><h3>What HudHud knows</h3>
    <p>Your profile, what you choose to share, and the private details HudHud remembers can work together to make answers relevant to you.</p></div>
  </header>
  <div className="hhVenn" role="img" aria-label="Three overlapping circles: your 1Muslim profile, personal details you share, and private HudHud notes. Their shared area produces relevant personal answers.">
   <span className="hhVennCircle hhVennProfile">Your <strong>Profile</strong></span>
   <span className="hhVennCircle hhVennShare">You <strong>Share</strong></span>
   <span className="hhVennCircle hhVennMemory">HudHud <strong>Remembers</strong></span>
   <span className="hhVennCore">Personal<br/>answers</span>
  </div>
  {loading?<p className="hhPersonalMessage">Checking your private HudHud details…</p>:
   snapshot&&!snapshot.signedIn?<p className="hhPersonalMessage">Sign in to link HudHud to your own profile. <Link href="/auth">Sign in ↗</Link></p>:
   snapshot?.signedIn&&snapshot.profile?<div className="hhPersonalDetails">
    <div className="hhPersonalVerified"><div><span className="scAiEyebrow">YOUR VERIFIED 1MUSLIM PROFILE</span><strong>{snapshot.profile.displayName}</strong>
     {snapshot.profile.username&&<small>@{snapshot.profile.username}</small>}
     {snapshot.profile.bio&&<p>{snapshot.profile.bio}</p>}</div><span>Connected</span></div>
    <div className="hhPersonalEditor">
     <label htmlFor="hhAboutMe"><strong>Tell HudHud about yourself</strong><small>Private to your account. Your own words, interests, projects, goals and things you want HudHud to understand.</small></label>
     <textarea id="hhAboutMe" rows={5} value={aboutMe} maxLength={6000} placeholder="What would help HudHud understand you better?" onChange={e=>setAboutMe(e.target.value)}/>
     <label htmlFor="hhAnswerPreferences"><strong>How should HudHud answer you?</strong><small>Writing preferences, tone, what to prioritize, what to avoid.</small></label>
     <textarea id="hhAnswerPreferences" rows={3} value={answerPreferences} maxLength={2000} placeholder="Keep it short, remember my projects, recommend useful 1Muslim features…" onChange={e=>setAnswerPreferences(e.target.value)}/>
     <label className="hhRememberToggle"><span><strong>Remember when I ask</strong><small>Let HudHud save a short private note when you explicitly say “remember that…”. Off by default.</small></span>
      <input type="checkbox" checked={allowRememberRequests} onChange={e=>setAllowRememberRequests(e.target.checked)} aria-label="Allow HudHud to remember explicit requests"/></label>
     <div className="hhPersonalButtons"><button onClick={()=>void save()} type="button" disabled={busy}>Save what HudHud knows</button><button onClick={exportPersonal} type="button" disabled={busy}>Export my details</button></div>
    </div>
    <div className="hhPersonalNotes">
     <h4>Private notes <small>{notes.length}/50</small></h4>
     <p>Notes you type here, plus the messages you explicitly ask HudHud to remember. Remove any detail at any time.</p>
     <div className="hhAddNote"><input type="text" value={newNote} maxLength={400} aria-label="A private note for HudHud" placeholder="Add something HudHud should remember" onChange={e=>setNewNote(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();void addNote()}}}/><button type="button" disabled={busy||!newNote.trim()} onClick={()=>void addNote()}>Add</button></div>
     {notes.length>0?<ul>{notes.slice().reverse().map(n=><li key={n.id}><span>{n.text}<small>{n.source==="hudhud"?"Saved at your request":"Added by you"}</small></span><button type="button" disabled={busy} onClick={()=>void removeNote(n.id)} aria-label={"Delete private HudHud note "+n.text.slice(0,35)}>Delete</button></li>)}</ul>:<p className="hhNotesEmpty">No private notes yet. HudHud knows your profile name, and anything you choose to add above.</p>}
     <button className="hhClearPrivate" type="button" disabled={busy} onClick={()=>void clear()}>Delete my private HudHud details</button>
    </div>
    <p className="hhPrivacy"><strong>Privacy:</strong> Your added details are not posted on your public profile. HudHud can use them in its AI answers, which involves sending relevant context to the configured AI provider. Never enter passwords, authentication codes, banking details or private keys. This is separate from saved chat history and Shahada verification.</p>
   </div>:null}
  {notice&&<p className="hhSuccess" role="status">{notice}</p>}
  {error&&<p className="hhFailure" role="alert">{error}</p>}
 </section>;
}
