"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import Link from "next/link";
import SiteNav from "../components/SiteNav";
import "./quran-recitals.css";
type Item={id:string;chapter:number;title:string;author:string;authorId:string;avatar:string|null;duration:number;createdAt:string;audioUrl:string};
type Chapter={id:number;name_simple:string;name_arabic:string};
const fmt=(s:number)=>Math.floor(s/60).toString().padStart(2,"0")+":"+Math.floor(s%60).toString().padStart(2,"0");
export default function QuranRecitalsPage(){
 const [items,setItems]=useState<Item[]>([]);
 const [chapters,setChapters]=useState<Chapter[]>([]);
 const [chapter,setChapter]=useState(0);
 const [page,setPage]=useState(0);
 const [hasMore,setHasMore]=useState(false);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [activeId,setActiveId]=useState<string|null>(null);
 const [continuous,setContinuous]=useState(false);
 const audioRefs=useRef(new Map<string,HTMLAudioElement>());
 useEffect(()=>{
  let alive=true;
  void fetch("https://api.quran.com/api/v4/chapters?language=en",{cache:"force-cache"})
   .then(r=>r.ok?r.json():{chapters:[]})
   .then(j=>{if(alive)setChapters(Array.isArray(j.chapters)?j.chapters:[])})
   .catch(()=>{});
  return()=>{alive=false};
 },[]);
 const load=useCallback(async(c:number,p:number)=>{
  setLoading(true);setError("");
  try{
   const url="/api/quran-recitals?page="+p+(c?"&chapter="+c:"");
   const response=await fetch(url,{cache:"no-store"}),json=await response.json();
   if(!response.ok)throw Error(json.error||"Could not load recitations");
   setItems(old=>p===0?json.items:[...old,...json.items.filter((item:Item)=>!old.some(r=>r.id===item.id))]);
   setHasMore(Boolean(json.hasMore));
  }catch(e){setError(e instanceof Error?e.message:"Recitations are unavailable.");}
  finally{setLoading(false)}
 },[]);
 useEffect(()=>{setItems([]);setPage(0);setActiveId(null);void load(chapter,0)},[chapter,load]);
 const chapterMap=useMemo(()=>new Map(chapters.map(c=>[c.id,c])),[chapters]);
 const next=async(id:string)=>{
  if(!continuous)return;
  const i=items.findIndex(x=>x.id===id),n=items[i+1];
  if(!n){setActiveId(null);return;}
  setActiveId(n.id);
  const target=audioRefs.current.get(n.id);
  if(target)await target.play().catch(()=>{});
 };
 return <main className="qrlPage">
  <SiteNav/>
  <section className="qrlHero">
   <Link href="/elm-tent/quran" className="qrlBack">← Qur’an Reader</Link>
   <span className="qrlEyebrow">1MUSLIM · THE RECITATION LIBRARY</span>
   <h1>Voices of the Ummah<span>.</span></h1>
   <p>Every recording is shared by a member. Listen, reflect, or record your own Qur’an recitation without opening a Live room.</p>
   <div className="qrlHeroActions">
     <Link href="/elm-tent/quran" className="qrlPrimary">🎙 Record a recitation ↗</Link>
     <Link href="/streaming/go-live?topic=Qur%27an" className="qrlSecondary">● Recite Live ↗</Link>
   </div>
  </section>
  <section className="qrlResults" aria-labelledby="qrlTitle">
    <header className="qrlSectionHead"><div><span>COMMUNITY AUDIO</span><h2 id="qrlTitle">Recent recitations</h2></div><span className="qrlCount">{items.length} recordings</span></header>
    <div className="qrlToolbar">
      <label className="qrlFilter">Surah
        <select value={chapter} onChange={e=>setChapter(Number(e.target.value))} aria-label="Filter recitations by surah">
          <option value={0}>All chapters</option>
          {chapters.map(c=><option key={c.id} value={c.id}>{c.id}. {c.name_simple}</option>)}
        </select>
      </label>
      <label className="qrlAutoplay"><input type="checkbox" checked={continuous} onChange={e=>setContinuous(e.target.checked)}/> Play next</label>
    </div>
    {error&&<div className="qrlError" role="alert">{error}<button type="button" onClick={()=>void load(chapter,page)}>Retry</button></div>}
    {items.length>0?<div className="qrlGrid">{items.map(item=>{
      const surah=chapterMap.get(item.chapter);
      return <article key={item.id} className={"qrlCard"+(activeId===item.id?" playing":"")}>
       <div className="qrlArtwork"><span>القرآن الكريم</span><strong lang="ar" dir="rtl">{surah?.name_arabic||"﷽"}</strong><small>SURAH {String(item.chapter).padStart(3,"0")}</small></div>
       <div className="qrlCardBody">
         <div className="qrlCardTop"><span>QUR’AN RECITATION</span><small>{fmt(item.duration)}</small></div>
         <h3>{surah?.name_simple||item.title}</h3>
         <div className="qrlByline">
           {item.avatar?<img src={item.avatar} alt="" loading="lazy"/>:<span className="qrlAvatar" aria-hidden="true">{item.author.slice(0,1).toUpperCase()}</span>}
           <span>{item.author}</span>
           <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString()}</time>
         </div>
         <audio controls preload="none" src={item.audioUrl} ref={node=>{if(node)audioRefs.current.set(item.id,node);else audioRefs.current.delete(item.id)}}
          onPlay={()=>{for(const [id,other] of audioRefs.current)if(id!==item.id)other.pause();setActiveId(item.id)}}
          onEnded={()=>void next(item.id)} aria-label={"Listen to "+(surah?.name_simple||item.title)+" by "+item.author}/>
         <Link href={"/elm-tent/quran?chapter="+item.chapter} className="qrlRead">Read alongside →</Link>
       </div>
      </article>
    })}</div>:!loading&&!error?<div className="qrlEmpty"><span>✧</span><h3>Be among the first voices</h3><p>No public recitations here yet. You can record one from the Qur’an Reader.</p><Link href="/elm-tent/quran">Open Qur’an Reader →</Link></div>:null}
    {loading&&<p className="qrlLoading" role="status">Loading community recitations…</p>}
    {hasMore&&!loading&&<button className="qrlMore" type="button" onClick={()=>{const nextPage=page+1;setPage(nextPage);void load(chapter,nextPage)}}>More recitations ↓</button>}
  </section>
 </main>;
}
