"use client";

import type {SVGProps} from "react";

/**
 * A bespoke, consistent line-icon family for the 1Muslim prayer experience.
 * These show daylight, shadows, and worship — no crescent-and-star emblems.
 */
export type PrayerTimeName="Fajr"|"Sunrise"|"Dhuhr"|"Asr"|"Maghrib"|"Isha";
type BaseProps=Omit<SVGProps<SVGSVGElement>,"children">;
type PrayerIconProps=BaseProps&{prayer:PrayerTimeName};

export function PrayerTimeIcon({prayer,className="",...props}:PrayerIconProps){
 const base={viewBox:"0 0 48 48",fill:"none",stroke:"currentColor",strokeWidth:2.15,strokeLinecap:"round" as const,strokeLinejoin:"round" as const,"aria-hidden":true as const,focusable:"false" as const,...props};
 return <svg {...base} className={["prayerTimeSvg","prayerTimeSvg-"+prayer.toLowerCase(),className].filter(Boolean).join(" ")}>
  {prayer==="Fajr"&&<g>
    <path d="M7 32H41M11 37H37" opacity=".55"/>
    <path d="M14 32A10 10 0 0 1 34 32"/>
    <path className="prayerIconRay" d="M24 8V14M10 17l4 4M38 17l-4 4M5 27h6M43 27h-6"/>
    <path d="M18 38h12" opacity=".36"/>
  </g>}
  {prayer==="Sunrise"&&<g>
    <path d="M6 32H42M11 37H37" opacity=".58"/>
    <path d="M14 32A10 10 0 0 1 34 32" fill="currentColor" fillOpacity=".10"/>
    <path className="prayerIconRay" d="M24 6V13M10.5 16.5l5 5M37.5 16.5l-5 5M5 24h7M43 24h-7M17 10l2.5 5M31 10l-2.5 5"/>
  </g>}
  {prayer==="Dhuhr"&&<g>
    <circle cx="24" cy="22" r="9.5" fill="currentColor" fillOpacity=".09"/>
    <path className="prayerIconRay" d="M24 4V9M24 35v5M6 22h5M37 22h5M11 9l4 4M33 31l4 4M37 9l-4 4M15 31l-4 4"/>
    <path d="M14 43h20" opacity=".26"/>
  </g>}
  {prayer==="Asr"&&<g>
    <circle cx="33" cy="15" r="8" fill="currentColor" fillOpacity=".09"/>
    <path className="prayerIconRay" d="M33 3v3M33 24v3M20 15h4M42 15h3M24 6l3 3M39 21l3 3"/>
    <path d="M8 37H41M14 34v-9M14 25h8M14 34l13 7" />
    <path d="M7 41h29" opacity=".38"/>
  </g>}
  {prayer==="Maghrib"&&<g>
    <path d="M5 31H43M11 37h26" opacity=".76"/>
    <path d="M15 31a9 9 0 0 1 18 0" fill="currentColor" fillOpacity=".09"/>
    <path className="prayerIconRay" d="M24 7v7M9 19l6 5M39 19l-6 5M7 27h5M41 27h-5"/>
    <path d="M20 41h8" opacity=".34"/>
  </g>}
  {prayer==="Isha"&&<g>
    <path d="M12 40V22q12-12 24 0v18M10 40h28" />
    <path d="M18 40v-8a6 6 0 0 1 12 0v8"/>
    <path d="M24 6v6M17 13l2 2M31 13l-2 2" opacity=".6"/>
    <path d="M9 9h4M35 9h4" opacity=".4"/>
    <path d="M21 23h6" opacity=".64"/>
  </g>}
 </svg>;
}

export function PrayerUiIcon({kind,className="",...props}:BaseProps&{kind:"location"|"calendar"|"time"|"compass"|"next"|"back"}){
 return <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={["prayerUiSvg",className].filter(Boolean).join(" ")} {...props}>
  {kind==="location"&&<><path d="M16 28s9-9.5 9-16a9 9 0 1 0-18 0c0 6.5 9 16 9 16Z"/><circle cx="16" cy="12" r="3.25"/></>}
  {kind==="calendar"&&<><rect x="5" y="7" width="22" height="21" rx="3"/><path d="M10 4v6M22 4v6M5 13h22M10 18h3M19 18h3M10 23h3M19 23h3"/></>}
  {kind==="time"&&<><circle cx="16" cy="16" r="12"/><path d="M16 8v8l5 3"/></>}
  {kind==="compass"&&<><circle cx="16" cy="16" r="12"/><circle cx="16" cy="16" r="2"/><path d="m21 10-3 8-8 3 3-8z"/></>}
  {kind==="next"&&<><path d="M6 16h20M19 9l7 7-7 7"/></>}
  {kind==="back"&&<><path d="M20 7 11 16l9 9M11 16h17"/></>}
 </svg>;
}
