"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
type Verse={key:string;arabic:string;english:string;translation:string};
export default function HudHudVerseCard({verseKey,href}:{verseKey:string;href:string}){
 const [verse,setVerse]=useState<Verse|null>(null);
 useEffect(()=>{
  const controller=new AbortController();
  void fetch("/api/hudhud/verse?key="+encodeURIComponent(verseKey),{signal:controller.signal})
   .then(async r=>{if(!r.ok)throw Error("Verse unavailable");return await r.json() as Verse})
   .then(data=>{if(!controller.signal.aborted)setVerse(data)})
   .catch(()=>{});
  return()=>controller.abort();
 },[verseKey]);
 return <Link href={href} className="hudVerseCard">
  <span className="hudMatchKind">Qur’an · {verseKey}</span>
  {verse?<><strong className="hudVerseArabic" lang="ar" dir="rtl">{verse.arabic}</strong>
   <p className="hudVerseEnglish">{verse.english}</p><small>English: {verse.translation}</small></>
   :<small>View the verified verse in the Qur’an Reader</small>}
  <em>Read in Qur’an Studio ↗</em>
 </Link>;
}
