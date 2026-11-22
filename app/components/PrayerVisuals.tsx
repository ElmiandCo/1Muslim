"use client";
import Link from "next/link";
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

export function PositionIllustration({stage}:{stage:SalahStage}){
 const colors={robe:"#1b5c4b",shadow:"#0e4135",outline:"#164035",skin:"#c38d65",cap:"#f4e7c8"};
 return <svg className="prayerPositionIllustration" viewBox="0 0 200 160" role="img" aria-label={{stand:"Person standing for prayer",bow:"Person bowing for rukūʿ",rise:"Person standing after bowing",prostrate:"Person in sujūd",sit:"Person sitting for tashahhud"}[stage]}>
 <ellipse cx="103" cy="146" rx="69" ry="6" fill="#cbbca6" opacity=".44"/>
 {stage==="stand"||stage==="rise"?<g>
  <path d="M80 72 Q100 64 122 73 L134 138 H66Z" fill={colors.robe} stroke={colors.outline} strokeWidth="2"/>
  <path d="M91 68 V45 H109 V68" fill={colors.skin}/><ellipse cx="100" cy="42" rx="16" ry="20" fill={colors.skin}/>
  <path d="M84 32 Q100 16 116 32 L116 36 H84Z" fill={colors.cap} stroke="#a8a69b" strokeWidth="1.5"/>
  <path d="M86 51 Q99 72 113 50 Q109 62 102 64 L94 63Z" fill="#2b2c25"/>
  {stage==="stand"?<g><path d="M83 78 L98 93 L117 82" fill="none" stroke={colors.skin} strokeWidth="10" strokeLinecap="round"/><path d="M119 79 L105 96 L89 85" fill="none" stroke={colors.skin} strokeWidth="8" strokeLinecap="round"/></g>:<g><path d="M79 79 L73 117 M121 79 L129 117" stroke={colors.skin} strokeWidth="9" strokeLinecap="round"/></g>}
  <path d="M81 138 V150 M119 138 V150" stroke={colors.skin} strokeWidth="11" strokeLinecap="round"/>
 </g>:null}
 {stage==="bow"?<g>
  <path d="M76 93 L80 140 M107 94 L112 142" stroke={colors.robe} strokeWidth="21" strokeLinecap="round"/>
  <path d="M53 68 Q76 60 126 75 L128 95 Q85 98 54 91Z" fill={colors.robe} stroke={colors.outline} strokeWidth="2"/>
  <path d="M118 78 L143 73" stroke={colors.skin} strokeWidth="15" strokeLinecap="round"/>
  <ellipse cx="150" cy="76" rx="16" ry="13" fill={colors.skin}/><path d="M135 67 Q145 54 161 66 L164 72 H135Z" fill={colors.cap}/>
  <path d="M160 84 L150 90 L139 84" stroke="#342920" strokeWidth="5" fill="none"/>
  <path d="M74 88 L85 107 M107 91 L116 107" stroke={colors.skin} strokeWidth="8" strokeLinecap="round"/>
  <path d="M80 140 L73 149 M113 141 L125 149" stroke={colors.skin} strokeWidth="9" strokeLinecap="round"/>
 </g>:null}
 {stage==="prostrate"?<g>
  <path d="M42 133 L54 112 Q67 74 95 88 Q119 96 129 120 L150 133Z" fill={colors.robe} stroke={colors.outline} strokeWidth="2.5"/>
  <path d="M55 116 L54 140 M91 103 L93 139" stroke={colors.robe} strokeWidth="15" strokeLinecap="round"/>
  <path d="M125 120 L146 138 M110 113 L121 137" stroke={colors.skin} strokeWidth="9" strokeLinecap="round"/>
  <ellipse cx="155" cy="126" rx="17" ry="12" fill={colors.skin} transform="rotate(22 155 126)"/>
  <path d="M143 113 Q159 101 169 117 L168 120 H145Z" fill={colors.cap}/>
  <path d="M39 140 H67 M83 141 H106" stroke={colors.skin} strokeWidth="9" strokeLinecap="round"/>
 </g>:null}
 {stage==="sit"?<g>
  <path d="M80 67 Q100 62 117 69 L124 121 L81 123Z" fill={colors.robe} stroke={colors.outline} strokeWidth="2"/>
  <path d="M91 65 V49 H107 V66" fill={colors.skin}/><ellipse cx="99" cy="42" rx="16" ry="20" fill={colors.skin}/>
  <path d="M82 33 Q98 15 115 33 V38 H82Z" fill={colors.cap} stroke="#b0a99b" strokeWidth="1.5"/>
  <path d="M85 50 Q99 68 111 49" stroke="#302a23" strokeWidth="5" fill="none"/>
  <path d="M84 119 Q111 104 142 130 L152 139 H65 Q65 128 84 119Z" fill={colors.robe} stroke={colors.outline} strokeWidth="2"/>
  <path d="M78 77 L73 115 L91 122 M120 76 L128 116 L111 126" stroke={colors.skin} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M71 142 H145" stroke={colors.skin} strokeWidth="8" strokeLinecap="round"/>
 </g>:null}
 </svg>;
}
