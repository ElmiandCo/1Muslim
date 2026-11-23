"use client";
import {useState} from "react";
import Link from "next/link";
import styles from "../newsroom.module.css";

const roles = [
  { level: "L1", title: "Member", description: "Read published stories and take part in the 1Muslim community." },
  { level: "L2", title: "Writer", description: "Draft original articles and submit them for editorial review." },
  { level: "L3", title: "Editor", description: "Review submissions, refine articles, and send work for approval." },
  { level: "L4", title: "Approver", description: "Complete final reviews and authorize articles for publication." },
] as const;

export default function QiblaApplicationInformation() {
  const [publication,setPublication]=useState<"magazine"|"newsletter">("magazine");
  return (
    <main className={styles.root} style={{background:"#090a0e",color:"#f5f3f5","--accent":publication==="magazine"?"#e5a5ce":"#8fc9f6","--line":publication==="magazine"?"rgba(209,125,181,.55)":"rgba(106,168,221,.55)","--panel2":publication==="magazine"?"linear-gradient(140deg,#281a2a,#15131b)":"linear-gradient(140deg,#152b41,#111823)","--muted":"#aeb5bd"} as React.CSSProperties}>
      <div style={{maxWidth:880,margin:"0 auto",padding:"clamp(20px,5vw,64px)"}}>
        <nav style={{display:"flex",gap:20,flexWrap:"wrap",marginBottom:38,fontSize:13}}>
          <Link className={styles.homeLink} href="/qibla/newsroom">← 1Muslim Qibla</Link>
          <Link className={styles.homeLink} href="/">1Muslim Home</Link>
        </nav>
        <span className={styles.eyebrow}>JOIN THE 1QIBLA EDITORIAL COMMUNITY</span>
        <section aria-label="Choose publication" style={{marginTop:24,display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12}}>{(["magazine","newsletter"] as const).map(p=><button key={p} type="button" aria-pressed={publication===p} onClick={()=>setPublication(p)} style={{minHeight:88,textAlign:"left",padding:16,borderRadius:16,border:publication===p?"2px solid #f0d7a4":"1px solid #69616b",background:p==="magazine"?"linear-gradient(120deg,#50304e,#231c33)":"linear-gradient(120deg,#254a6c,#14243b)",color:"#fff",boxShadow:publication===p?"0 8px 24px rgba(0,0,0,.4)":"none",cursor:"pointer"}}><span style={{display:"block",fontSize:11,opacity:.8,marginBottom:8}}>{publication===p?"✓ SELECTED":"SELECT"}</span><strong style={{fontFamily:p==="magazine"?"Georgia,serif":"Arial,sans-serif",fontSize:"clamp(17px,3vw,25px)"}}>The {p==="magazine"?"Magazine":"Newsletter"}</strong></button>)}</section>
        <p style={{color:"#c6c4c8",lineHeight:1.6,margin:"16px 0 0"}}>Interested in contributing to <strong style={{color:"#fff"}}>The {publication==="magazine"?"Magazine":"Newsletter"}</strong>? Explore the roles below. Your publication choice changes this page’s theme; applications are not yet open.</p>
        <h1 style={{fontSize:"clamp(36px,6vw,68px)",letterSpacing:"-.05em",margin:"12px 0"}}>Find your place at 1Qibla.</h1>
        <p className={styles.subhead} style={{lineHeight:1.7,maxWidth:650}}>Every member starts with a voice. Explore the editorial roles and the responsibilities that come with each level.</p>
        <section aria-label="Editorial levels" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:14,marginTop:34}}>
          {roles.map(role => <article key={role.level} className={styles.railCard} style={{padding:22}}>
            <span className={styles.eyebrow}>{role.level}</span>
            <h2 style={{fontSize:23,margin:"10px 0"}}>{role.title}</h2>
            <p style={{margin:0}}>{role.description}</p>
          </article>)}
        </section>
        <div className={styles.railCard} style={{padding:24,marginTop:22}}>
          <h2 style={{marginTop:0,fontSize:22}}>Interested in contributing?</h2>
          <p>Writer, Editor, and Approver positions require review and approval. You selected The {publication === "magazine" ? "Magazine" : "Newsletter"}. Applications will open when the secure editorial application workflow is ready.</p>
          <Link href="/qibla/newsroom">Explore published stories →</Link>
        </div>
      </div>
    </main>
  );
}
