"use client";
import {useEffect,useState} from "react";
import styles from "./HomeQuranNavigation.module.css";

type Surah={number:number;name:string;englishName:string;numberOfAyahs:number};
const COUNTS=[7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
const fallback:Surah[]=COUNTS.map((numberOfAyahs,i)=>({number:i+1,name:"",englishName:"Surah "+(i+1),numberOfAyahs}));
export default function HomeQuranNavigation({chapter,verse,loading,onNavigate}:{chapter:number;verse:number;loading:boolean;onNavigate:(chapter:number,verse:number)=>void}){
 const [surahs,setSurahs]=useState<Surah[]>(fallback);
 useEffect(()=>{const controller=new AbortController();fetch("https://api.alquran.cloud/v1/meta",{signal:controller.signal}).then(r=>r.ok?r.json():null).then(json=>{const list=json?.data?.surahs?.references;if(Array.isArray(list)&&list.length===114)setSurahs(list.map((s:Surah,i:number)=>({...s,numberOfAyahs:COUNTS[i]})))}).catch(()=>{});return()=>controller.abort()},[]);
 const max=COUNTS[chapter-1]||1;
 const navigate=(c:number,v:number)=>{if(loading)return;onNavigate(c,v)};
 const move=(direction:-1|1)=>{let c=chapter,v=verse+direction;if(v<1){c=chapter===1?114:chapter-1;v=COUNTS[c-1]}else if(v>max){c=chapter===114?1:chapter+1;v=1}navigate(c,v)};
 return <nav className={styles.navigation} aria-label="Quran verse navigation">
  <button type="button" className={styles.chevron} onClick={()=>move(-1)} disabled={loading} aria-label="Previous Quran verse">‹</button>
  <label className={styles.chapter}><span className={styles.srOnly}>Select surah</span><select value={chapter} disabled={loading} onChange={e=>navigate(Number(e.target.value),1)} aria-label="Select surah">{surahs.map(s=><option key={s.number} value={s.number}>{s.number}. {s.englishName}{s.name?" · "+s.name:""}</option>)}</select></label>
  <label className={styles.verse}><span className={styles.srOnly}>Select ayah</span><select value={Math.min(verse,max)} disabled={loading} onChange={e=>navigate(chapter,Number(e.target.value))} aria-label="Select ayah">{Array.from({length:max},(_,i)=><option key={i+1} value={i+1}>Ayah {i+1} / {max}</option>)}</select></label>
  <button type="button" className={styles.chevron} onClick={()=>move(1)} disabled={loading} aria-label="Next Quran verse">›</button>
 </nav>
}
