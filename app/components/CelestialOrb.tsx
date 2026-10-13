"use client";
import styles from "./celestial-orb.module.css";
export default function CelestialOrb({light,onToggle}:{light:boolean;onToggle:()=>void}){
 return <button type="button" className={[styles.orb,light?styles.day:styles.night].join(" ")} onClick={onToggle} aria-label={light?"Switch to night mode":"Switch to day mode"} aria-pressed={light} title={light?"Day mode · switch to night":"Night mode · switch to day"}>
 <svg className={styles.geometry} viewBox="0 0 48 48" aria-hidden="true" focusable="false"><circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth=".8" opacity=".6"/><path d="M24 3 L31 8 L40 8 L40 17 L45 24 L40 31 L40 40 L31 40 L24 45 L17 40 L8 40 L8 31 L3 24 L8 17 L8 8 L17 8 Z" fill="none" stroke="currentColor" strokeWidth=".8" opacity=".8"/><path d="M24 8 L35.3 12.7 L40 24 L35.3 35.3 L24 40 L12.7 35.3 L8 24 L12.7 12.7 Z" fill="none" stroke="currentColor" strokeWidth=".65" opacity=".55"/><circle cx="24" cy="24" r="14.5" fill="none" stroke="currentColor" strokeWidth=".7" opacity=".65"/></svg>
 <span className={styles.aura} aria-hidden="true"/><span className={styles.sparkField} aria-hidden="true"><i/><i/><i/><i/><i/><i/></span>
 <span className={styles.sky}><span className={styles.sun}/><span className={styles.moon}/><span className={styles.starOne}>✦</span><span className={styles.starTwo}>✧</span></span>
 </button>;
}
