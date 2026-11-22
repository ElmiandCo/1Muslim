"use client";
import {useEffect,useRef,useState} from "react";
import styles from "./ProfileFirstPostPrompt.module.css";

const keyFor=(id:string)=>"1muslim:profile-first-post-dismissed:"+id;

/**
 * A gentle one-time invitation for members who have not yet posted.
 * Dismissal is local to the current profile and persists across reloads.
 * Posting itself uses the existing profile callback and keeps its error handling.
 */
export default function ProfileFirstPostPrompt({
 userId,text,onTextChange,posting,onPublish
}:{
 userId:string;text:string;onTextChange:(value:string)=>void;
 posting:boolean;onPublish:()=>void;
}){
 const [dismissed,setDismissed]=useState(false);
 const [expanded,setExpanded]=useState(false);
 const [hydrated,setHydrated]=useState(false);
 const input=useRef<HTMLTextAreaElement>(null);

 useEffect(()=>{
  try{setDismissed(localStorage.getItem(keyFor(userId))==="1")}catch{setDismissed(false)}
  setHydrated(true);
 },[userId]);
 useEffect(()=>{if(expanded)input.current?.focus()},[expanded]);
 const close=()=>{
  setExpanded(false);
  setDismissed(true);
  try{localStorage.setItem(keyFor(userId),"1")}catch{}
 };
 if(!hydrated||dismissed)return null;

 return <section className={styles.card} aria-label="Create your first Ummah post">
  <span className={styles.accentLine} aria-hidden="true"/>
  <div className={styles.row}>
   <span className={styles.symbol} aria-hidden="true"><svg viewBox="0 0 32 32" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="6.5" y="6.5" width="19" height="19" rx="6"/><path d="M11 21.5l3-8 6.5-5 3 3-5 6.5-7.5 3.5z"/><path d="m17.5 11.5 3 3"/></svg></span>
   <div className={styles.copy}>
    <span className={styles.eyebrow}>YOUR FIRST POST <span aria-hidden="true">✦</span></span>
    <h3>Share something with the Ummah</h3>
    {!expanded&&<p>A thought, reminder, or moment worth sharing.</p>}
   </div>
   {!expanded&&<button type="button" className={styles.start} onClick={()=>setExpanded(true)} aria-label="Write your first post">Write <span aria-hidden="true">↗</span></button>}
   <button type="button" className={styles.dismiss} onClick={close} aria-label="Dismiss first post invitation" title="Dismiss">×</button>
  </div>
  {expanded&&<div className={styles.composer}>
   <label htmlFor="profile-first-post-input" className={styles.visuallyHidden}>Write a post for the Ummah</label>
   <textarea id="profile-first-post-input" ref={input} value={text} maxLength={500} rows={3} placeholder="What would you like to share?" onChange={e=>onTextChange(e.target.value)} onKeyDown={e=>{if(e.key==="Escape")setExpanded(false)}}/>
   <div className={styles.actions}>
    <span className={styles.counter}>{text.length}/500</span>
    <div className={styles.actionButtons}>
     <button type="button" className={styles.cancel} onClick={()=>setExpanded(false)}>Collapse</button>
     <button type="button" className={styles.publish} disabled={!text.trim()||posting} onClick={onPublish}>{posting?"Posting…":"Post"} <span aria-hidden="true">↗</span></button>
    </div>
   </div>
  </div>}
 </section>;
}
