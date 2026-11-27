"use client";
import {useEffect,useState} from "react";
import Link from "next/link";

type Verse={key:string;arabic:string;english:string;translation:string;source?:string};
export default function HudHudVerseCard({verseKey,href,verseData,featured=false,spokenChars}:{verseKey:string;href:string;verseData?:Verse;featured?:boolean;spokenChars?:number}){
 const [loaded,setLoaded]=useState<Verse|null>(verseData||null);
 useEffect(()=>{
  if(verseData){setLoaded(verseData);return}
  const controller=new AbortController();
  void fetch("/api/hudhud/verse?key="+encodeURIComponent(verseKey),{signal:controller.signal})
   .then(async response=>{if(!response.ok)throw Error("Verse unavailable");return response.json() as Promise<Verse>})
   .then(data=>{if(!controller.signal.aborted)setLoaded(data)})
   .catch(()=>{if(!controller.signal.aborted)setLoaded(null)});
  return()=>controller.abort();
 },[verseKey,verseData]);
 return <Link href={href} className={"hudVerseCard"+(featured?" hudVerseHero":"")}>
  <span className="hudMatchKind">THE QUR’AN · {verseKey}</span>
  {loaded?<><strong className="hudVerseArabic" lang="ar" dir="rtl">{loaded.arabic}</strong>
    <p className="hudVerseEnglish" lang="en">{spokenChars===undefined?loaded.english:(()=>{
      let offset=0;
      return loaded.english.split(/(\s+)/).map((part,i)=>{
        const start=offset;offset+=part.length;
        return <span key={i} className={part.trim()&&spokenChars>=start?"hudWordSpoken":""}>{part}</span>;
      });
    })()}</p>
    <small>English translation: {loaded.translation}</small></>
    :<small>The verified text is temporarily unavailable. Open the Qur’an Reader to try again.</small>}
  <em>Read in Qur’an Library ↗</em>
 </Link>;
}
