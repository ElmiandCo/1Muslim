"use client";
import Link from "next/link";
import Image from "next/image";
import type {ReactNode} from "react";
import type {SalahStage} from "./PrayerEducationData";

export function PrayerShell({title,back="/",children,eyebrow}:{title:string;back?:string;children:ReactNode;eyebrow?:string}){
 return <main className="prayerExperience">
  <div className="prayerPageShell">
   <header className="prayerPageHeader">
    <Link href={back} className="prayerHeaderBack" aria-label="Go back one page">← <span>{title}</span></Link>
    <Link className="prayerPageBrand" href="/" aria-label="1Muslim home"><span>☪</span>1Muslim</Link>
    <span className="prayerHeaderBadge" aria-hidden="true">✦</span>
   </header>
   {eyebrow&&<div className="prayerPageEyebrow">{eyebrow}</div>}
   {children}
   <footer className="prayerPageFooter"><strong>1Muslim · Ṣalāh Studio</strong><span>Learn with understanding. Pray with presence.</span></footer>
  </div>
 </main>;
}

export function PrayerScene({night=false}:{night?:boolean}){
 return <svg className="prayerScene" viewBox="0 0 560 280" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
 <defs>
  <linearGradient id={night?"storySky":"prayerSky"} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={night?"#06182d":"#163b40"}/><stop offset=".56" stopColor={night?"#143452":"#b18354"}/><stop offset="1" stopColor={night?"#ba7644":"#eeb86d"}/></linearGradient>
  <linearGradient id="prayerStone" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#f4d595"/><stop offset="1" stopColor="#986c38"/></linearGradient>
 </defs>
 <rect width="560" height="280" fill={night?"url(#storySky)":"url(#prayerSky)"}/>
 <circle cx="452" cy="54" r="43" fill="#fbe8aa" opacity=".18"/><circle cx="452" cy="54" r="25" fill="#ffdfa2" opacity=".65"/>
 <path d="M0 191 L110 109 L186 179 L280 130 L369 179 L447 108 L560 187 V280 H0" fill="#0e383d" opacity=".4"/>
 <path d="M0 217 L105 173 L185 205 L290 165 L409 208 L560 167 V280 H0" fill="#062e2d" opacity=".5"/>
 {night&&<g fill="#f7dba4">{[[68,44],[115,18],[224,40],[287,60],[375,20],[499,94],[526,27],[330,92],[183,75]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r={i%3===0?2.2:1.2}/>)}</g>}
 <g transform="translate(180 43)">
 <rect x="20" y="165" width="340" height="70" fill="#142d2b" opacity=".55"/>
 <rect x="51" y="140" width="275" height="99" fill="url(#prayerStone)" stroke="#ebc681" strokeWidth="2"/>
 <rect x="71" y="137" width="236" height="13" fill="#b88748"/>
 <path d="M110 140 Q123 66 189 56 Q255 66 270 140Z" fill="#d7aa62" stroke="#f6dda3" strokeWidth="3"/>
 <path d="M154 79 Q190 40 228 79" fill="none" stroke="#ffe0a2" strokeWidth="4"/>
 <rect x="185" y="39" width="8" height="18" rx="2" fill="#e9c67d"/><circle cx="189" cy="36" r="8" fill="#f3c975"/>
 {Array.from({length:7},(_,i)=><g key={i}><path d={"M"+(78+i*31)+" 239 V194 Q"+(78+i*31)+" 171 "+(93+i*31)+" 171 Q"+(109+i*31)+" 171 "+(109+i*31)+" 194 V239"} fill="#3c332c" stroke="#f2d597" strokeWidth="4"/><rect x={84+i*31} y="197" width="19" height="40" fill="#ffdf87" opacity=".55"/></g>)}
 {[36,330].map(x=><g key={x}><rect x={x} y="64" width="18" height="175" fill="url(#prayerStone)"/><rect x={x-7} y="92" width="32" height="12" fill="#b18144"/><rect x={x-4} y="51" width="26" height="15" fill="#e4be7d"/><path d={"M"+(x-5)+" 52 Q"+(x+9)+" 20 "+(x+23)+" 52Z"} fill="#d4a55b"/><rect x={x+7} y="18" width="4" height="12" fill="#fff0ba"/><circle cx={x+9} cy="16" r="5" fill="#eed28c"/><rect x={x+7} y="124" width="5" height="25" fill="#fbe5a2"/></g>)}
 </g>
 </svg>;
}

/** Official user-uploaded Salah illustrations, already merged on main by PR #1512.
 * Filenames in /public/assets are case-sensitive on Vercel.
 * A single figure and art style is reused throughout the preview cards and lesson.
 */
const SALAH_ILLUSTRATIONS = {
 takbir: "/assets/takbir.PNG",
 qiyam: "/assets/qiyam.PNG",
 ruku: "/assets/ruku.PNG",
 sujud: "/assets/sujud.PNG",
 tashahhud: "/assets/tashahhud.PNG",
 taslim: "/assets/taslim.PNG"
} as const;

export function PositionIllustration({stage,stepId}:{stage:SalahStage;stepId?:string}){
 const pose=stepId==="takbir"?"takbir":stepId==="salam"?"taslim":
  (stage==="bow"?"ruku":stage==="prostrate"?"sujud":stage==="sit"?"tashahhud":"qiyam");
 const title=({
  takbir:"Raising both hands to begin Salah",
  qiyam:"Standing in Salah (Qiyām)",
  ruku:"Bowing for Rukūʿ",
  sujud:"Prostrating for Sujūd",
  tashahhud:"Sitting during Tashahhud",
  taslim:"Completing Salah with Taslīm"
 } as const)[pose];
 return <Image
  className="prayerPositionIllustration"
  src={SALAH_ILLUSTRATIONS[pose]}
  alt={title}
  width={680}
  height={840}
  sizes="(max-width: 480px) 62vw, (max-width: 720px) 40vw, 240px"
  loading="lazy"
 />;
}
