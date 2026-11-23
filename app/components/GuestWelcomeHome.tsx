"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import styles from "./GuestWelcomeHome.module.css";

/** A single lightweight public welcome. No legacy HUDHUD/Live workspace underneath. */
export default function GuestWelcomeHome(){
 const [visible,setVisible]=useState(false);
 useEffect(()=>{const frame=requestAnimationFrame(()=>setVisible(true));return()=>cancelAnimationFrame(frame)},[]);
 return <main className={styles.screen+" "+(visible?styles.entered:"")} aria-label="Welcome to 1Muslim">
  <header className={styles.topbar}><Link href="/" className={styles.wordmark}>1<span>MUSLIM</span></Link><div className={styles.topActions}><Link href="/auth?next=%2Fprofile">Sign In</Link><Link href="/auth?mode=signup&next=%2Fprofile" className={styles.topJoin}>Join 1Muslim ↗</Link></div></header>
  <section className={styles.hero}>
   <div className={styles.copy}><span className={styles.kicker}>ONE UMMAH · ONE HOME</span><h1>Your community,<br/><em>your journey.</em></h1><p>A welcoming space to connect with Muslims, discover the Qur’an, follow prayer times, share meaningful moments and grow together.</p><div className={styles.actions}><Link href="/auth?mode=signup&next=%2Fprofile" className={styles.primary}>Join 1Muslim <span>↗</span></Link><Link href="/auth?next=%2Fprofile" className={styles.secondary}>I already have an account</Link></div><p className={styles.assurance}>Free to explore. A place for every Muslim.</p></div>
   <div className={styles.visual} aria-label="Preview of the 1Muslim prayer experience">
    <div className={styles.orbit} aria-hidden="true"/><span className={styles.sun} aria-hidden="true">☀</span><span className={styles.moon} aria-hidden="true">☾</span><span className={styles.mapPin} aria-hidden="true">●</span>
    <div className={styles.device}><div className={styles.deviceFrame}>
      <div className={styles.sky}>
        <div className={styles.cloudOne}/><div className={styles.cloudTwo}/>
        <div className={styles.location}><span>⌖</span> Algiers, Algeria</div>
        <div className={styles.minaret}><span className={styles.towerRoof}/><span className={styles.towerBody}><i/><i/><i/><i/></span></div>
        <div className={styles.mosqueBase}/>
        <div className={styles.prayerRing}><span>☾</span><strong>Maghrib</strong><small>Prayer time approaches</small><b>18:50</b></div>
        <div className={styles.prayers}><i>✓</i><i>✓</i><i>✓</i><i>✓</i><i className={styles.next}>☾</i></div>
      </div>
      <nav className={styles.phoneNav} aria-label="App preview (decorative)"><span>◷<small>Time</small></span><span>▦<small>Prayers</small></span><span>◇<small>Qibla</small></span><span>▤<small>Qur’an</small></span><span>◉<small>Me</small></span></nav>
    </div></div>
   </div>
  </section>
  <footer className={styles.footer}><Link href="/deepwatch">Discover DeepWatch</Link><Link href="/quran-library">Explore Qur’an</Link><Link href="/community">Visit the Ummah</Link></footer>
 </main>;
}
