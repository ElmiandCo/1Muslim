"use client";
import {useEffect,useState} from "react";
import {createClient} from "../../utils/supabase/client";

type Stats={total_attempts:number;unique_learners:number;passing_attempts:number;first_pass_awarded:boolean};
export default function HudHudTajweedChallenge({surah,ayah,onPractice}:{surah:number;ayah:number;onPractice?:()=>void}){
 const [stats,setStats]=useState<Stats|null>(null);
 const [myAttempts,setMyAttempts]=useState<number|null>(null);
 useEffect(()=>{let cancelled=false;const db=createClient();void (async()=>{
  const {data}=await db.rpc("tajweed_verse_community_stats",{p_surah:surah,p_ayah:ayah});
  if(!cancelled&&Array.isArray(data))setStats((data[0] as Stats)||null);
  const {data:{user}}=await db.auth.getUser();
  if(user){const {count}=await db.from("tajweed_attempts").select("id",{head:true,count:"exact"}).eq("surah_number",surah).eq("ayah_number",ayah);if(!cancelled)setMyAttempts(count??null);}
 })();return()=>{cancelled=true}},[surah,ayah]);
 const first=stats&&stats.passing_attempts===0;
 return <section aria-label="HudHud Tajweed challenge" className="rounded-2xl border border-emerald-400/30 bg-slate-950/90 p-4 text-white">
  <p className="text-xs font-semibold tracking-widest text-emerald-300">🌀 HUDHUD · TAJWEED PRACTICE</p>
  <h3 className="mt-2 font-bold">{first?"🏅 Could you be the first to pass this verse?":"🎙️ Every attempt helps you improve."}</h3>
  <p className="mt-2 text-sm text-slate-300">{first?"No passing Tajweed attempt has been recorded here yet. A verified first pass earns the 1Muslim First Reciter rank badge.":"Listen to the reference recitation, practice, and improve one verse at a time."}</p>
  <p className="mt-2 text-xs text-slate-400">Verse {surah}:{ayah} · Your attempts: {myAttempts??"—"} · Community attempts: {stats?.total_attempts??"—"} · Passing attempts: {stats?.passing_attempts??"—"}</p>
  <button type="button" onClick={onPractice} disabled={!onPractice} className="mt-3 rounded-full bg-emerald-300 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-50">{onPractice?"Practice this verse →":"Practice available in HudHud Mode"}</button>
 </section>;
}
