"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import Link from "next/link";
import "./quran-magazine.css";
type Chapter={id:number;name_simple:string;name_arabic:string;verses_count:number;revelation_order?:number;translated_name?:{name:string}};
type Verse={verse_key:string;arabic:string;english?:string};
const API="https://api.quran.com/api/v4";
export default function QuranMagazine(){
 const [chapters,setChapters]=useState<Chapter[]>([]),[search,setSearch]=useState(""),[tab,setTab]=useState<"compiled"|"revealed"|"tafsir">("compiled");
 const [selected,setSelected]=useState<number|null>(null),[verses,setVerses]=useState<Verse[]>([]),[loading,setLoading]=useState(false);
 const [galleryFloating,setGalleryFloating]=useState(false);const gallerySettle=useRef<ReturnType<typeof setTimeout>|null>(null);
 const [lastVerse,setLastVerse]=useState(""),[englishFirst,setEnglishFirst]=useState(false),[showEnglish,setShowEnglish]=useState(true),[floating,setFloating]=useState(false);
 const reader=useRef<HTMLDivElement>(null),settle=useRef<ReturnType<typeof setTimeout>|null>(null),land=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{try{setLastVerse(localStorage.getItem("1muslim:quran-magazine-last")||"")}catch{}},[]);
 useEffect(()=>{let alive=true;fetch(API+"/chapters?language=en").then(r=>r.json()).then(d=>{if(alive)setChapters(d.chapters||[])}).catch(()=>{});return()=>{alive=false}},[]);
 useEffect(()=>{if(selected!==null)return;let frame=0;const update=()=>{frame=0;setGalleryFloating(false);if(gallerySettle.current)clearTimeout(gallerySettle.current);gallerySettle.current=setTimeout(()=>setGalleryFloating(true),1100);const center=window.innerHeight/2;document.querySelectorAll<HTMLElement>(".qm-chapter").forEach(card=>{const rect=card.getBoundingClientRect();const distance=(rect.top+rect.height/2-center)/(window.innerHeight*.5);const tilt=Math.max(-24,Math.min(24,distance*24));card.style.setProperty("--qm-number-tilt",tilt.toFixed(2)+"deg")})};const schedule=()=>{if(!frame)frame=requestAnimationFrame(update)};update();window.addEventListener("scroll",schedule,{passive:true});window.addEventListener("resize",schedule);return()=>{window.removeEventListener("scroll",schedule);window.removeEventListener("resize",schedule);if(frame)cancelAnimationFrame(frame);if(gallerySettle.current)clearTimeout(gallerySettle.current)}},[selected,chapters.length,tab,search]);
 useEffect(()=>{if(selected===null)return;let alive=true;const controller=new AbortController();setLoading(true);setVerses([]);
 const load=async()=>{
  const signal=controller.signal;
  const local=async():Promise<Verse[]>=>{const r=await fetch("/quran-data/"+selected+".json",{signal});if(!r.ok)throw Error("Local corpus unavailable");const rows=await r.json();if(!Array.isArray(rows)||!rows.length)throw Error("Empty local corpus");return rows};
  const primary=async():Promise<Verse[]>=>{
   const output:Verse[]=[];let page=1;let pages=1;
   do{const url=API+"/verses/by_chapter/"+selected+"?language=en&fields=text_uthmani&translations=131&per_page=50&page="+page;
    const r=await fetch(url,{signal});if(!r.ok)throw Error("Quran.com verse request failed");const data=await r.json();
    const rows=data.verses||[];if(!Array.isArray(rows)||!rows.length)throw Error("Empty Quran.com verses");
    output.push(...rows.map((v:{verse_key:string;text_uthmani?:string;translations?:{text:string}[]})=>({verse_key:v.verse_key,arabic:v.text_uthmani||"",english:v.translations?.[0]?.text?.replace(/<[^>]*>/g,"")||""})));
    pages=Math.min(20,Number(data.pagination?.total_pages)||1);page++;
   }while(page<=pages);
   if(!output.length||output.some(v=>!v.arabic))throw Error("Incomplete Quran.com corpus");
   return output;
  };
  const backup=async():Promise<Verse[]>=>{
   const base="https://api.alquran.cloud/v1/surah/"+selected+"/";
   const [arResponse,enResponse]=await Promise.all([fetch(base+"quran-uthmani",{signal}),fetch(base+"en.sahih",{signal})]);
   if(!arResponse.ok||!enResponse.ok)throw Error("Backup Quran source unavailable");
   const [ar,en]=await Promise.all([arResponse.json(),enResponse.json()]);
   const arabic=ar?.data?.ayahs||[],english=en?.data?.ayahs||[];
   if(!arabic.length)throw Error("Backup Quran source returned no verses");
   const translations=new Map<number,string>(english.map((v:{numberInSurah:number;text:string})=>[v.numberInSurah,v.text]));
   return arabic.map((v:{numberInSurah:number;text:string})=>({verse_key:selected+":"+v.numberInSurah,arabic:v.text,english:translations.get(v.numberInSurah)||""}));
  };
  try{let rows:Verse[];try{rows=await local()}catch{try{rows=await primary()}catch{rows=await backup()}}
   if(alive)setVerses(rows);
  }catch{if(alive)setVerses([])}finally{if(alive)setLoading(false)}
 };
 void load();return()=>{alive=false;controller.abort()};
},[selected]);
 const open=(id:number,verse?:number)=>{setSelected(id);if(verse){setTimeout(()=>document.getElementById("ayah-"+id+"-"+verse)?.scrollIntoView({behavior:"smooth",block:"start"}),850)}setFloating(false);try{localStorage.setItem("1muslim:quran-magazine-chapter",String(id))}catch{};window.scrollTo({top:0,behavior:"instant"})};
 const chapter=chapters.find(c=>c.id===selected);
 const ordered=useMemo(()=>{const s=search.trim().toLowerCase();const verseQuery=s.match(/^(\d{1,3}):(\d{1,3})$/);let list=chapters.filter(c=>!s||(verseQuery?c.id===Number(verseQuery[1]):false)||String(c.id)===s||c.name_simple.toLowerCase().includes(s)||c.name_arabic.includes(s)||(c.translated_name?.name||"").toLowerCase().includes(s));if(tab==="revealed")list=[...list].sort((a,b)=>(a.revelation_order||a.id)-(b.revelation_order||b.id));return list},[chapters,search,tab]);
 const onScroll=()=>{setFloating(false);if(settle.current)clearTimeout(settle.current);if(land.current)clearTimeout(land.current);settle.current=setTimeout(()=>{setFloating(true)},1500)};
 useEffect(()=>{if(selected===null)return;const el=reader.current;if(!el)return;const t=setTimeout(()=>setFloating(true),1500);return()=>{clearTimeout(t);if(settle.current)clearTimeout(settle.current);if(land.current)clearTimeout(land.current)}},[selected,verses.length]);
 return <main className="qm-page"><header className="qm-top"><Link href="/" aria-label="Home">← 1Muslim</Link><span>QUR’AN</span><Link href="/elm-tent/quran">Studio ↗</Link></header>
 {selected===null?<><section className="qm-hero"><div className="qm-bismillah" lang="ar" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div><h1>THE HOLY QUR’AN</h1><p>114 chapters · A lifetime of reflection</p><label className="qm-search"><span>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search chapters or verse references (e.g. 2:255)" aria-label="Search the Qur’an" onKeyDown={e=>{if(e.key==="Enter"){const match=search.trim().match(/^(\d{1,3}):(\d{1,3})$/);if(match){const id=Number(match[1]);if(id>=1&&id<=114)open(id,Number(match[2]))}}}}/></label>{lastVerse&&<button className="qm-continue" onClick={()=>{const [id,verse]=lastVerse.split(":").map(Number);if(id>=1&&id<=114)open(id,verse)}}><span className="qm-continue-icon">↗</span><span><small>CONTINUE READING</small><strong>{chapters.find(c=>c.id===Number(lastVerse.split(":")[0]))?.name_simple||"Qur’an"} · Verse {lastVerse.split(":")[1]}</strong></span><span className="qm-continue-arrow">→</span></button>}</section>
 <nav className="qm-tabs" aria-label="Qur’an order"><button className={tab==="compiled"?"active":""} onClick={()=>setTab("compiled")}>Compiled</button><button className={tab==="revealed"?"active":""} onClick={()=>setTab("revealed")}>Revealed</button><button className={tab==="tafsir"?"active":""} onClick={()=>setTab("tafsir")}>Tafsir</button></nav>
 <div className="qm-section"><div className="qm-heading"><span>{tab==="revealed"?"REVELATION ORDER":tab==="tafsir"?"EXPLORE TAFSIR":"THE 114 CHAPTERS"}</span><span>{ordered.length} Surahs</span></div>
 <div className="qm-list">{ordered.map(c=><button className={"qm-chapter"+(galleryFloating?" qm-gallery-floating":"")} key={c.id} onClick={()=>open(c.id)}><span className="qm-number"><span>{c.id}</span></span><span className="qm-name"><strong>{c.name_simple}</strong><small>{c.translated_name?.name||"Surah"}</small></span><span className="qm-arabic"><strong lang="ar">{c.name_arabic}</strong><small>{c.verses_count} Ayahs</small></span><span className="qm-arrow">↗</span></button>)}</div></div></>:
 <><div className="qm-readerbar"><button onClick={()=>{setSelected(null);setFloating(false)}}>← Chapters</button><strong>{chapter?.name_simple||"Surah "+selected}</strong><button onClick={()=>setEnglishFirst(v=>!v)} title="Swap Arabic and English order">⇅ Order</button><button onClick={()=>setShowEnglish(v=>!v)}>{showEnglish?"EN On":"EN Off"}</button></div>
 <div className="qm-reader" ref={reader} onScroll={onScroll}><div className="qm-readerintro"><span>CHAPTER {selected} · {chapter?.verses_count||verses.length} VERSES</span><h1>{chapter?.name_simple}</h1><div lang="ar" dir="rtl" className="qm-bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div></div>
 {loading?<p className="qm-status">Loading the Qur’an…</p>:verses.length===0?<p className="qm-status">This chapter is temporarily unavailable. Please use Qur’an Studio.</p>:verses.map(v=><article className={"qm-verse"+(floating?" is-floating":"")} key={v.verse_key} id={"ayah-"+v.verse_key.replace(":","-")}><div className="qm-verse-tools"><span>{v.verse_key}</span><button onClick={()=>{try{localStorage.setItem("1muslim:quran-magazine-last",v.verse_key);setLastVerse(v.verse_key)}catch{}}} aria-label={"Bookmark verse "+v.verse_key}>☆</button><button onClick={()=>navigator.clipboard?.writeText(v.arabic+"\n"+(v.english||""))} aria-label={"Copy verse "+v.verse_key}>⧉</button><Link href={"/elm-tent/quran?verse="+v.verse_key} aria-label={"Open verse "+v.verse_key+" in studio"}>↗ Studio</Link></div><div className={"qm-verse-content"+(englishFirst?" english-first":"")}><p className="qm-verse-arabic" dir="rtl" lang="ar">{v.arabic}</p>{showEnglish&&v.english&&<p className="qm-verse-english">{v.english}</p>}</div></article>)}
 </div></>}
 </main>;
}
