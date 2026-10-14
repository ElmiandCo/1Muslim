"use client";
import {useEffect,useState} from "react";
import styles from "./ProductionUpgradeOverlay.module.css";

export default function ProductionUpgradeOverlay(){
 const [phase,setPhase]=useState<"waiting"|"dim"|"ready">("waiting");
 const [showCountdown,setShowCountdown]=useState(true);
 const [showSupport,setShowSupport]=useState(true);
 const [message,setMessage]=useState("");
 const [sending,setSending]=useState(false);
 const [status,setStatus]=useState("");
 useEffect(()=>{const a=setTimeout(()=>setPhase("dim"),350);const b=setTimeout(()=>setPhase("ready"),5350);return()=>{clearTimeout(a);clearTimeout(b)}},[]);
 async function submit(e:React.FormEvent){e.preventDefault();if(sending||message.trim().length<5)return;setSending(true);setStatus("");try{const response=await fetch("/api/upgrade-feedback",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:message.trim()})});if(!response.ok)throw Error("unavailable");setMessage("");setStatus("Message delivered. Thank you for helping shape 1Muslim.");}catch{setStatus("Message couldn't be delivered right now. Please try again later.");}finally{setSending(false)}}
 return <div className={styles.root} data-phase={phase}>
  <div className={styles.shade} aria-hidden="true"/>
  <section className={styles.hero} aria-label="1Muslim upgrade announcement">
   <span className={styles.eyebrow}>✦ 1MUSLIM · A NEW CHAPTER</span>
   <h1>We’re upgrading<span className={styles.ellipsis}>…</span></h1>
   <p className={styles.question}>What, you ask?</p>
   <strong className={styles.everything}>EVERYTHING.</strong>
   <p className={styles.detail}>A new experience is on its way. Built for the Ummah, with you.</p>
   <div className={styles.play}><span className={styles.triangle}>▶</span><span><small>COMING TO</small><b>Google Play</b></span></div>
  </section>
  <div className={styles.floats}>
   {showCountdown&&<aside className={styles.card}><button className={styles.close} onClick={()=>setShowCountdown(false)} aria-label="Close pre-registration card">×</button><span className={styles.kicker}>01 · FIRST LOOK</span><h2>Pre-registration update</h2><p>More information about Google Play pre-registration is coming soon.</p><span className={styles.chip}>Announcement pending</span></aside>}
   <aside className={styles.card}><span className={styles.kicker}>02 · THE LAUNCH</span><h2>Our Eid comeback 🌙</h2><p>We’re aiming for an Eid launch. The exact date will be announced when confirmed.</p></aside>
   {showSupport&&<aside className={styles.card}><button className={styles.close} onClick={()=>setShowSupport(false)} aria-label="Close message card">×</button><span className={styles.kicker}>03 · YOUR VOICE</span><h2>Send us a message</h2><p>Have an idea or question? Leave an anonymous note for the 1Muslim team.</p><form onSubmit={submit}><label className={styles.sr} htmlFor="upgrade-note">Your message</label><textarea id="upgrade-note" value={message} maxLength={700} onChange={e=>setMessage(e.target.value)} placeholder="Your thoughts…" rows={2} required minLength={5}/><button type="submit" disabled={sending||message.trim().length<5}>{sending?"Sending…":"Send message ↗"}</button></form>{status&&<p role="status" className={styles.status}>{status}</p>}</aside>}
  </div>
 </div>
}
