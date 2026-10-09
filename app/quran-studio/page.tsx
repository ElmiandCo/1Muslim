"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Ayah = { numberInSurah: number; text: string; audio?: string };
const SURAHS = [{id:1,name:"Al-Fatihah"},{id:112,name:"Al-Ikhlas"},{id:113,name:"Al-Falaq"},{id:114,name:"An-Nas"}];

export default function QuranStudioPage() {
  const [surah,setSurah]=useState(112);
  const [ayahs,setAyahs]=useState<Ayah[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [playing,setPlaying]=useState<number|null>(null);
  const [audio,setAudio]=useState<HTMLAudioElement|null>(null);
  useEffect(()=>{
    const param=new URLSearchParams(window.location.search).get("surah");
    if(param && SURAHS.some(s=>s.id===Number(param))) setSurah(Number(param));
  },[]);
  useEffect(()=>{
    let active=true;
    setLoading(true);setError("");setAyahs([]);
    Promise.all([
      fetch(`https://api.alquran.cloud/v1/surah/${surah}/ar.alafasy`).then(r=>{if(!r.ok)throw Error("Recitation unavailable");return r.json()}),
      fetch(`https://api.alquran.cloud/v1/surah/${surah}/en.sahih`).then(r=>{if(!r.ok)throw Error("Translation unavailable");return r.json()})
    ]).then(([arabic,translation])=>{
      if(!active)return;
      if(arabic.code!==200 || translation.code!==200)throw Error("Qur’an service unavailable");
      setAyahs(arabic.data.ayahs.map((a:Ayah,i:number)=>({...a,translation:translation.data.ayahs[i]?.text})));
    }).catch(e=>{if(active)setError(e.message||"Unable to load verses");}).finally(()=>{if(active)setLoading(false)});
    return ()=>{active=false};
  },[surah]);
  useEffect(()=>()=>{audio?.pause()},[audio]);
  function play(ayah:Ayah){
    if(audio)audio.pause();
    if(playing===ayah.numberInSurah){setPlaying(null);return}
    if(!ayah.audio)return;
    const next=new Audio(ayah.audio);
    next.onended=()=>setPlaying(null);
    next.onerror=()=>setPlaying(null);
    setAudio(next);setPlaying(ayah.numberInSurah);
    void next.play().catch(()=>setPlaying(null));
  }
  return <main style={{maxWidth:880,margin:"0 auto",padding:"32px 20px 90px",color:"var(--text,#f5f2e8)"}}>
    <Link href="/" style={{color:"inherit"}}>← Home</Link>
    <p style={{letterSpacing:3,opacity:.7,marginTop:32}}>1MUSLIM · QUR’AN</p>
    <h1 style={{fontSize:"clamp(32px,6vw,54px)",marginBottom:8}}>Read. Reflect. Return.</h1>
    <p style={{opacity:.8}}>Qur’an Studio · verse-by-verse recitation and translation.</p>
    <label htmlFor="surah" style={{display:"block",marginTop:28,marginBottom:8}}>Choose a surah</label>
    <select id="surah" value={surah} onChange={e=>{audio?.pause();setPlaying(null);setSurah(Number(e.target.value));window.history.replaceState(null,"",`/quran-studio?surah=${e.target.value}`)}} style={{padding:12,borderRadius:10,width:"100%",background:"#17241e",color:"#fff",border:"1px solid #ad9862"}}>
      {SURAHS.map(s=><option value={s.id} key={s.id}>{s.id}. {s.name}</option>)}
    </select>
    {loading&&<p role="status">Loading verses…</p>}
    {error&&<p role="alert">{error} · Please retry later.</p>}
    {ayahs.map(a=><article key={a.numberInSurah} style={{border:"1px solid #665c40",borderRadius:18,padding:24,marginTop:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
        <span>{surah}:{a.numberInSurah}</span>
        <button type="button" onClick={()=>play(a)} disabled={!a.audio} aria-label={`Play verse ${a.numberInSurah}`} style={{padding:"10px 16px",borderRadius:24,border:"1px solid #ad9862",background:"#23382d",color:"#fff",cursor:"pointer"}}>{playing===a.numberInSurah?"■ Stop":"▶ Listen"}</button>
      </div>
      <p dir="rtl" lang="ar" style={{fontSize:"clamp(27px,4vw,38px)",lineHeight:2.1,textAlign:"right"}}>{a.text}</p>
      <p style={{lineHeight:1.8,opacity:.85}}>{(a as Ayah & {translation?:string}).translation}</p>
    </article>)}
    <p style={{fontSize:12,opacity:.65,marginTop:24}}>Recitation: Mishary Alafasy · Translation: Sahih International · Powered by AlQuran.cloud. Audio requires an internet connection.</p>
  </main>;
}
