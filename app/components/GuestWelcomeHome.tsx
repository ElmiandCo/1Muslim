"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import styles from "./GuestWelcomeHome.module.css";

const destinations=[
 {label:"DeepWatch",icon:"▣",href:"/videos",detail:"Movies & series"},
 {label:"News",icon:"▤",href:"/qibla/newsroom",detail:"Qibla magazine"},
 {label:"Qur’an",icon:"۞",href:"/elm-tent/quran",detail:"Read & learn"},
 {label:"Live",icon:"◉",href:"/streaming",detail:"Connect live"},
 {label:"Ummah",icon:"✧",href:"/community",detail:"Community posts"},
 {label:"Messages",icon:"✉",href:"/messages",detail:"Stay connected"}
];
export default function GuestWelcomeHome({onExplore}:{onExplore:()=>void}){
 const [arrived,setArrived]=useState(false);
 useEffect(()=>{const timer=requestAnimationFrame(()=>setArrived(true));return()=>cancelAnimationFrame(timer)},[]);
 return <section className={styles.screen} aria-label="Welcome to 1Muslim">
  <div className={styles.shell+" "+(arrived?styles.arrived:"")}>
   <div className={styles.hero}>
    <div className={styles.cover}><span className={styles.brandPill}>1Muslim</span><span className={styles.coverLabel}>ONE UMMAH · ONE HOME</span></div>
    <div className={styles.identity}>
     <div className={styles.avatar} aria-label="1Muslim logo"><span>1M</span></div>
     <div className={styles.identityText}><p className={styles.eyebrow}>AS-SALAMU ALAYKUM</p><h1>Welcome to 1Muslim</h1><p className={styles.handle}>Your community begins here</p></div>
     <p className={styles.message}>One Ummah. One Community. One Muslim.</p>
     <p className={styles.submessage}>Explore stories, connect with Muslims, and grow in faith together.</p>
     <div className={styles.actions}><Link className={styles.primary} href="/auth?mode=signup&next=%2Fprofile">Join 1Muslim <span aria-hidden="true">↗</span></Link><Link className={styles.secondary} href="/auth?next=%2Fprofile">Sign In</Link></div>
    </div>
   </div>
   <div className={styles.exploreHeader}><div><p className={styles.eyebrow}>DISCOVER YOUR SPACE</p><h2>Explore 1Muslim</h2></div><button type="button" onClick={onExplore} className={styles.openHome}>Open live homepage <span aria-hidden="true">↗</span></button></div>
   <div className={styles.grid}>{destinations.map((item,i)=><Link key={item.label} href={item.href} className={styles.tile} style={{animationDelay:`${180+i*65}ms`}}><span className={styles.tileIcon} aria-hidden="true">{item.icon}</span><strong>{item.label}</strong><small>{item.detail}</small></Link>)}</div>
   <p className={styles.footer}>Discover freely. Join when you're ready.</p>
  </div>
 </section>;
}
