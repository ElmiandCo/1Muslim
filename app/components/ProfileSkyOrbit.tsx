"use client";
import type {CSSProperties} from "react";
import {type LocalSky,type SkyBody} from "../lib/sky-orbit";
import styles from "./ProfileNextPrayer.module.css";

function location(body:SkyBody):CSSProperties{
 const x=7+86*body.progress;
 const y=80-55*Math.sin(Math.PI*body.progress);
 return {left:x.toFixed(2)+"%",top:y.toFixed(2)+"%"};
}
function lunarShape(fraction:number,waxing:boolean){
 const f=Math.min(1,Math.max(0,fraction));
 const control=16+(waxing?1:-1)*(1-2*f)*16;
 // Hemisphere facing the Sun: quarter, crescent and gibbous disks all follow
 // the measured illuminated fraction rather than a rotating decorative icon.
 return `M 16 8 A 8 8 0 0 ${waxing?1:0} 16 24 Q ${control.toFixed(2)} 16 16 8 Z`;
}

/** A miniature real-time sky, synchronized with the saved Prayer app city. */
export default function ProfileSkyOrbit({sky}:{sky:LocalSky}){
 const moon=sky.moon.aboveHorizon,sun=sky.sun.aboveHorizon;
 return <span className={styles.skyOrbit} aria-hidden="true">
  <svg className={styles.orbitPath} viewBox="0 0 240 28" preserveAspectRatio="none">
   <path d="M 9 25 Q 120 -8 231 25" fill="none" stroke="currentColor" strokeWidth=".9" strokeDasharray="2.5 5.5" strokeLinecap="round"/>
   <path d="M 9 25 H 231" fill="none" stroke="currentColor" strokeWidth=".4" strokeOpacity=".28"/>
   <circle cx="9" cy="25" r="1.2" fill="currentColor" opacity=".55"/>
   <circle cx="231" cy="25" r="1.2" fill="currentColor" opacity=".55"/>
  </svg>
  {sun&&<span className={styles.skySun} style={location(sky.sun)}>
   <svg viewBox="0 0 32 32" focusable="false">
    <g className={styles.skySunRays} fill="none" stroke="#fff3cb" strokeWidth="1.55" strokeLinecap="round">
     <path d="M16 2.7v3.6M16 25.7v3.6M2.7 16h3.6M25.7 16h3.6M6.6 6.6l2.55 2.55M22.85 22.85l2.55 2.55M25.4 6.6l-2.55 2.55M9.15 22.85 6.6 25.4"/>
    </g>
    <circle cx="16" cy="16" r="7.4" fill="#fff3cf" stroke="#fffaf0" strokeWidth="1.2"/>
    <circle cx="16" cy="16" r="4.4" fill="#ffe7a7" opacity=".48"/>
   </svg>
  </span>}
  {moon&&<span className={styles.skyMoon} style={location(sky.moon)}>
   <svg viewBox="0 0 32 32" focusable="false">
    <circle cx="16" cy="16" r="8" fill="#b4d8eb" opacity=".2" stroke="#e7f3fa" strokeWidth=".9"/>
    <path d={lunarShape(sky.illumination,sky.waxing)} fill="#f0f5f5"/>
    <circle cx="16" cy="16" r="8" fill="none" stroke="#f5f9fa" strokeOpacity=".8" strokeWidth=".6"/>
   </svg>
  </span>}
  {!moon&&!sun&&<span className={styles.skyDarkDot} aria-hidden="true">✦</span>}
 </span>;
}
