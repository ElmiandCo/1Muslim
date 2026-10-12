"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import Link from "next/link";
import SiteNav from "../../components/SiteNav";
import VerseStudio from "./VerseStudio";
import VerseRecorder from "./VerseRecorder";
import VerseDMShare from "./VerseDMShare";
import VerseEngagement from "./VerseEngagement";
import InlineAnnotations from "./InlineAnnotations";
import VerseMediaTips from "./VerseMediaTips";
import HudHudVision from "./HudHudVision";
import HudHudHomeIntro from "../../components/HudHudHomeIntro";
import HudHudQuranText from "./HudHudQuranText";
import ElmiVerseMoment from "./ElmiVerseMoment";
import VersePostStudio from "./VersePostStudio";
import QuranFloatingSearch from "./QuranFloatingSearch";
type Chapter={id:number;name_simple:string;name_arabic:string;verses_count:number;translated_name?:{name:string}};
type QuranWord={id:number;text_uthmani?:string;char_type_name?:string;translation?:{text:string};transliteration?:{text:string}};
type Verse={id:number;verse_key:string;text_uthmani?:string;words?:QuranWord[];translations?:{text:string}[]};
const API="https://api.quran.com/api/v4";
const FALLBACK="https://api.alquran.cloud/v1";
const activeChapterCount=(chapters:Chapter[],id:number)=>chapters.find(c=>c.id===id)?.verses_count||0;
const strip=(s:string)=>s.replace(/<[^>]*>/g,"").replace(/&[^;]+;/g," ");
export default function QuranLessons(){
 const [chapters,setChapters]=useState<Chapter[]>([]),[chapter,setChapter]=useState(()=>{const params=typeof window!=="undefined"?new URLSearchParams(window.location.search):new URLSearchParams();const n=Number(params.get("chapter")||params.get("verse")?.split(":")[0]||1);return Number.isInteger(n)&&n>=1&&n<=114?n:1}),[page,setPage]=useState(1),[verses,setVerses]=useState<Verse[]>([]),[total,setTotal]=useState(0),[search,setSearch]=useState(""),[busy,setBusy]=useState(true),[error,setError]=useState(""),[showTranslation,setShowTranslation]=useState(true);
 useEffect(()=>{let live=true;fetch(API+"/chapters?language=en").then(r=>{if(!r.ok)throw Error("Qur'an chapter service unavailable");return r.json()}).then(d=>{if(live)setChapters(d.chapters||[])}).catch(()=>{if(live)setError("Could not load chapters. Please try again.")});return()=>{live=false}},[]);
 useEffect(()=>{
  let live=true;
  setBusy(true);setError("");setVerses([]);
  const load=async()=>{
   const first=(page-1)*50;
   const normalize=(items:Verse[])=>items.map(v=>({...v,words:v.words?.filter(w=>w.char_type_name!=="end"&&!!w.text_uthmani)}));
   const local=async()=>{
    const response=await fetch("/quran-data/"+chapter+".json");
    if(!response.ok)throw Error("Local corpus not available");
    const all=await response.json() as {verse_key:string;arabic:string;english?:string}[];
    if(!Array.isArray(all)||!all.length)throw Error("Invalid local corpus");
    return {items:all.slice(first,first+50).map((v,i)=>({id:first+i+1,verse_key:v.verse_key,text_uthmani:v.arabic,translations:v.english?[{text:v.english}]:[]})) as Verse[],pages:Math.ceil(all.length/50)};
   };
   const primary=async()=>{
    const response=await fetch(API+"/verses/by_chapter/"+chapter+"?language=en&words=true&word_fields=text_uthmani&word_translation_language=en&fields=text_uthmani&translations=131&per_page=50&page="+page);
    if(!response.ok)throw Error("Primary source unavailable");
    const data=await response.json();
    const items:Verse[]=normalize(data.verses||[]);
    if(!items.length)throw Error("No verses returned");
    return {items,pages:data.pagination?.total_pages||1};
   };
   const backup=async()=>{
    const [arResponse,enResponse]=await Promise.all([fetch(FALLBACK+"/surah/"+chapter+"/quran-uthmani"),fetch(FALLBACK+"/surah/"+chapter+"/en.sahih")]);
    if(!arResponse.ok||!enResponse.ok)throw Error("Backup source unavailable");
    const [ar,en]=await Promise.all([arResponse.json(),enResponse.json()]);
    const arabic=ar?.data?.ayahs||[],english=en?.data?.ayahs||[];
    if(!arabic.length)throw Error("No backup verses");
    const translated=new Map<number,string>(english.map((a:{numberInSurah:number;text:string})=>[a.numberInSurah,a.text]));
    return {items:arabic.slice(first,first+50).map((a:{number:number;numberInSurah:number;text:string})=>({id:a.number,verse_key:chapter+":"+a.numberInSurah,text_uthmani:a.text,translations:[{text:translated.get(a.numberInSurah)||""}]})) as Verse[],pages:Math.ceil(arabic.length/50)};
   };
   try{
    let result:{items:Verse[];pages:number};
    try{result=await local()}catch{try{result=await primary()}catch{result=await backup()}}
    // Always supply full Arabic text: some primary API responses only contain word metadata.
    const missing=result.items.some(v=>!v.text_uthmani&&!v.words?.some(w=>w.text_uthmani)||!v.translations?.[0]?.text);
    if(missing){
     try{
      const fallback=await backup();
      const byKey=new Map(fallback.items.map(v=>[v.verse_key,v]));
      result.items=result.items.map(v=>{const other=byKey.get(v.verse_key);return {...v,text_uthmani:v.text_uthmani||other?.text_uthmani||"",translations:v.translations?.[0]?.text?v.translations:other?.translations||[]}})
     }catch{/* Keep primary verses visible when backup is temporarily unavailable. */}
    }
    if(live){setVerses(result.items);setTotal(result.pages)}
   }catch{if(live)setError("Could not load verses from either Qur'an source. Please retry.")}
   finally{if(live)setBusy(false)}
  };
  void load();
  return()=>{live=false};
 },[chapter,page]);
 const [shareVerse,setShareVerse]=useState<Verse|null>(null);
 const [hudhudMode,setHudhudMode]=useState(false);
 const glassMotion=useRef<{x:number;y:number;frame:number}>({x:50,y:40,frame:0});
 const moveGlass=(e:React.PointerEvent<HTMLElement>)=>{
  if(e.pointerType==="touch"||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const el=e.currentTarget,r=el.getBoundingClientRect();
  glassMotion.current.x=Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100));
  glassMotion.current.y=Math.max(0,Math.min(100,(e.clientY-r.top)/r.height*100));
  if(glassMotion.current.frame)return;
  glassMotion.current.frame=requestAnimationFrame(()=>{
   el.style.setProperty("--glass-x",glassMotion.current.x+"%");
   el.style.setProperty("--glass-y",glassMotion.current.y+"%");
   el.style.setProperty("--glass-tilt-x",((glassMotion.current.y-50)*-.045)+"deg");
   el.style.setProperty("--glass-tilt-y",((glassMotion.current.x-50)*.045)+"deg");
   glassMotion.current.frame=0;
  });
 };
 const resetGlass=(e:React.PointerEvent<HTMLElement>)=>{
  const el=e.currentTarget;
  for(const key of ["--glass-x","--glass-y","--glass-tilt-x","--glass-tilt-y"])el.style.removeProperty(key);
 };

 const [focusIndex,setFocusIndex]=useState(0);
 const swipeStart=useRef<{x:number;y:number}|null>(null);
 const [backdropOffset,setBackdropOffset]=useState({x:0,y:0});
 const backdropStart=useRef<{x:number;y:number;ox:number;oy:number}|null>(null);
 const [compactStudio,setCompactStudio]=useState(true);
 const [verseMarkers,setVerseMarkers]=useState<Record<string,{id:number;x:number;y:number;size:number}[]>>({});
 const [markerSize,setMarkerSize]=useState(42);
 const markerDrag=useRef<{id:number;x:number;y:number;startX:number;startY:number;key:string}|null>(null);
 const activeVerseKey=verses[focusIndex]?.verse_key||chapter+":"+(focusIndex+1);
 const addVerseMarker=()=>setVerseMarkers(prev=>({...prev,[activeVerseKey]:[...(prev[activeVerseKey]||[]),{id:Date.now(),x:50,y:50,size:markerSize}]}));
 const undoVerseMarker=()=>setVerseMarkers(prev=>({...prev,[activeVerseKey]:(prev[activeVerseKey]||[]).slice(0,-1)}));
 const moveVerseMarker=(id:number,x:number,y:number,key:string)=>setVerseMarkers(prev=>({...prev,[key]:(prev[key]||[]).map(m=>m.id===id?{...m,x:Math.max(4,Math.min(96,x)),y:Math.max(4,Math.min(96,y))}:m)}));

 const [hudhudQuickOpen,setHudhudQuickOpen]=useState(false);
 const [hudhudQuickPage,setHudhudQuickPage]=useState(0);
 const hudhudQuickPages=[
  {title:"Read",detail:"One verse at a time. Use the arrows to move through the Qur’an."},
  {title:"Understand",detail:"Tap an Arabic word to explore its meaning. Toggle translation above."},
  {title:"Create",detail:"Record, annotate, or share your reflection using the verse studio."},
  {title:"HudHud Vision",detail:"Switch on HudHud Vision for guided controls and verse connections."}
 ];

 const [visited,setVisited]=useState<Record<string,boolean>>({});
 const verseArea=useRef<HTMLElement>(null);
 const pendingVerse=useRef<string|null>(null);
 const [linkedQuestion,setLinkedQuestion]=useState<string|null>(null);
 useEffect(()=>{const params=new URLSearchParams(window.location.search);const key=params.get("verse")||(params.get("surah")&&params.get("ayah")?params.get("surah")+":"+params.get("ayah"):null);if(key&&/^([1-9]|[1-9][0-9]|1[01][0-4]):[1-9][0-9]{0,2}$/.test(key)){pendingVerse.current=key;const [ch,num]=key.split(":").map(Number);setChapter(ch);setPage(Math.ceil(num/50))}setLinkedQuestion(params.get("question"));if(params.get("vision")==="1"){window.setTimeout(()=>window.dispatchEvent(new Event("1muslim:hudhud-vision-enable")),400)}},[]);
 const navigateVerse=(key:string)=>{const [ch,num]=key.split(":").map(Number);if(!Number.isInteger(ch)||ch<1||ch>114||!Number.isInteger(num)||num<1)return;pendingVerse.current=key;setChapter(ch);setPage(Math.ceil(num/50));};
 useEffect(()=>{if(busy||!verses.length||!pendingVerse.current)return;const target=pendingVerse.current;const index=verses.findIndex(v=>v.verse_key===target);if(index<0)return;pendingVerse.current=null;const id=window.setTimeout(()=>{verseArea.current?.querySelector<HTMLElement>('[data-verse-index="'+index+'"]')?.scrollIntoView({behavior:"smooth",block:"center"});setFocusIndex(index)},100);return()=>clearTimeout(id)},[busy,verses]);
 useEffect(()=>{setFocusIndex(0)},[chapter,page]);

 const jump=(index:number)=>{
  if(index>=0&&index<verses.length){setFocusIndex(index);const key=verses[index]?.verse_key;if(key)setVisited(v=>({...v,[key]:true}));return}
  if(index<0&&page>1){setPage(p=>p-1);pendingBoundary.current="last"}
  else if(index>=verses.length&&page<total){setPage(p=>p+1);pendingBoundary.current="first"}
 };
 const pendingBoundary=useRef<"first"|"last"|null>(null);
 useEffect(()=>{if(busy||!verses.length||!pendingBoundary.current)return;setFocusIndex(pendingBoundary.current==="last"?verses.length-1:0);pendingBoundary.current=null},[busy,verses]);

 const versePosition=(page-1)*50+focusIndex+1;
 useEffect(()=>{try{localStorage.setItem("1muslim-quran-progress",JSON.stringify({chapter,verse:versePosition}))}catch{}},[chapter,versePosition]);
 const chapterCount=activeChapterCount(chapters,chapter);
 const chapterPercent=chapterCount?Math.min(100,Math.round(versePosition/chapterCount*100)):0;
 const previousTopics=verses.slice(Math.max(0,focusIndex-2),focusIndex);
 const filtered=useMemo(()=>chapters.filter(c=>String(c.id)===search.trim()||c.name_simple.toLowerCase().includes(search.toLowerCase())||c.name_arabic.includes(search)),[chapters,search]);
 const active=chapters.find(c=>c.id===chapter);
 return <main className={"omQuranPage "+(hudhudMode?"omHudhudExperience":"")}><SiteNav/><div className="omQuranShell">{linkedQuestion&&<div style={{padding:12,border:"1px solid var(--line)",borderRadius:14,marginBottom:12}}><strong>🐦 HudHud · Question-to-verse study</strong><p>Read the verse and its context, then return to the question to check your understanding.</p><Link href={"/elm-tent/lessons?question="+encodeURIComponent(linkedQuestion)}>← Return to linked question</Link></div>}<header className="omQuranHero"><img src="/assets/HudHud-Quran.png" alt="HudHud Qur’an" width={120} height={120} style={{display:"block",width:120,height:120,objectFit:"contain",margin:"0 auto 12px"}}/><Link href="/elm-tent">← Elm Tent</Link><span>🏕️ ELM TENT · QUR'AN LESSONS</span><h1>Every verse. A doorway to learning.</h1><p>Browse 114 surahs, explore the Arabic and translation, and share an ayah with the community. Verse references always link back to the Qur'an.</p></header><div className="omQuranLayout"><aside className="omQuranSidebar"><label htmlFor="omSurahSearch">Find a surah</label><input id="omSurahSearch" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name or number…"/><div className="omQuranChapters">{filtered.map(c=><button key={c.id} className={chapter===c.id?"active":""} onClick={()=>{setChapter(c.id);setPage(1)}}><b>{c.id}. {c.name_simple}</b><small>{c.verses_count} ayat</small></button>)}</div></aside><section className="omQuranVerses omQuranAppStage" ref={verseArea}><div className="omQuranAtmosphere" style={{transform:`translate3d(${backdropOffset.x}px,${backdropOffset.y}px,0)`}} onPointerDown={e=>{if(e.pointerType==="mouse"&&e.button!==0)return;backdropStart.current={x:e.clientX,y:e.clientY,ox:backdropOffset.x,oy:backdropOffset.y};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(!backdropStart.current)return;setBackdropOffset({x:Math.max(-95,Math.min(95,backdropStart.current.ox+(e.clientX-backdropStart.current.x)*.45)),y:Math.max(-90,Math.min(90,backdropStart.current.oy+(e.clientY-backdropStart.current.y)*.45))})}} onPointerUp={()=>{backdropStart.current=null}} onPointerCancel={()=>{backdropStart.current=null}} aria-hidden="true"><div className="omQuranAtmosphereOrb omQuranAtmosphereOrbA"/><div className="omQuranAtmosphereOrb omQuranAtmosphereOrbB"/></div><QuranFloatingSearch chapters={chapters} onSelect={navigateVerse}/><div className="omQuranMarkerToolbar"><span>✦ Verse layers</span><button type="button" onClick={addVerseMarker} aria-label="Add glowing marker">＋ Marker</button><button type="button" onClick={undoVerseMarker} disabled={!(verseMarkers[activeVerseKey]||[]).length} aria-label="Undo last marker">↶ Undo</button><label>Size <input aria-label="Marker size" type="range" min="24" max="110" value={markerSize} onChange={e=>setMarkerSize(Number(e.target.value))}/></label><button type="button" onClick={()=>setHudhudMode(v=>!v)}>{hudhudMode?"⤢ Exit HudHud":"⛶ HudHud fullscreen"}</button></div><div className="omQuranAppOverview"><div><small>QURAN STUDIO · SWIPE TO READ</small><strong>{active?.name_simple||"Qur'an"} <span>{verses[focusIndex]?.verse_key||chapter+":"+versePosition}</span></strong><p>One verse at a time · Swipe left or right to explore</p></div><button type="button" onClick={()=>setCompactStudio(v=>!v)} aria-pressed={compactStudio}>{compactStudio?"☷ Overview":"✦ Focus"}</button></div><div className="omQuranTitle"><div><span>Surah {chapter}</span><h2>{active?.name_simple||"Qur'an"} <small lang="ar" dir="rtl">{active?.name_arabic}</small></h2></div><label><input type="checkbox" checked={showTranslation} onChange={e=>setShowTranslation(e.target.checked)}/> Translation</label></div><div className="omFocusTracker" aria-label="Live reading progress"><div className="omFocusTop"><span>✦ YOUR READING JOURNEY</span><strong>{chapterPercent}% of this surah</strong></div><div className="omFocusTrack" role="progressbar" aria-valuenow={versePosition} aria-valuemin={0} aria-valuemax={chapterCount||1} aria-label="Verses reached in current surah"><span style={{width:chapterPercent+"%"}}/></div><div className="omFocusTimeline">{previousTopics.map(v=><button key={v.verse_key} onClick={()=>jump(verses.findIndex(x=>x.verse_key===v.verse_key))}>↶ {v.verse_key}<small>Earlier verse</small></button>)}<div className="omFocusCurrent"><span>NOW READING</span><strong>{verses[focusIndex]?.verse_key||chapter+":1"}</strong><small>{versePosition} of {chapterCount||"…"} ayat · {Object.keys(visited).length} visited this session</small></div><div className="omFocusNav" data-mode={hudhudMode?"hudhud":"normal"}><button type="button" onClick={()=>jump(focusIndex-1)} disabled={focusIndex===0&&page===1} aria-label="Previous verse">↑</button><button type="button" onClick={()=>jump(focusIndex+1)} disabled={focusIndex===verses.length-1&&page===total} aria-label="Next verse">↓</button></div></div></div><div className="omHudhudQuickWrap"><button type="button" className={"omHudhudQuickButton "+(hudhudQuickOpen?"is-open":"")} onClick={()=>setHudhudQuickOpen(v=>!v)} aria-expanded={hudhudQuickOpen} aria-controls="omHudhudQuickPanel" aria-label="HudHud Quran Studio controls">✦ <span>HudHud</span></button>{hudhudQuickOpen&&<div id="omHudhudQuickPanel" className="omHudhudQuickPanel" role="region" aria-label="HudHud Quran Studio controls"><div className="omHudhudQuickHead"><strong>✦ HudHud · Quran Studio</strong><button type="button" onClick={()=>setHudhudQuickOpen(false)} aria-label="Close HudHud controls">×</button></div><div key={hudhudQuickPage} className="omHudhudQuickSlide"><small>{hudhudQuickPage+1} / {hudhudQuickPages.length}</small><h3>{hudhudQuickPages[hudhudQuickPage].title}</h3><p>{hudhudQuickPages[hudhudQuickPage].detail}</p></div><div className="omHudhudQuickActions"><button type="button" onClick={()=>setHudhudQuickPage(p=>(p+hudhudQuickPages.length-1)%hudhudQuickPages.length)}>← Tip</button><button type="button" onClick={()=>jump(focusIndex-1)} disabled={focusIndex===0&&page===1}>↑ Verse</button><button type="button" onClick={()=>jump(focusIndex+1)} disabled={focusIndex===verses.length-1&&page===total}>↓ Verse</button><button type="button" onClick={()=>setHudhudQuickPage(p=>(p+1)%hudhudQuickPages.length)}>Tip →</button></div><button type="button" className="omHudhudQuickVision" onClick={()=>{setHudhudMode(v=>!v);window.dispatchEvent(new Event("1muslim:hudhud-vision-enable"))}}>✧ HudHud reading glow {hudhudMode?"ON":"OFF"}</button><div className="omHudhudQuickLinks"><Link href="/elm-tent/lessons">Lessons ↗</Link><Link href="/messages">Messages ↗</Link><Link href="/streaming">Live ↗</Link></div></div>}</div><ElmiVerseMoment/><HudHudQuranText/><HudHudHomeIntro/><HudHudVision activeVerse={verses[focusIndex]?.verse_key||chapter+":"+versePosition} onNavigate={navigateVerse} onModeChange={setHudhudMode}/>{error&&<p role="alert">{error}</p>}{busy?<p>Loading verses…</p>:verses.filter((_,i)=>i===focusIndex).map((v)=><div className="omQuranThreeLayer" key={v.verse_key}><div className="omQuranLayer omQuranLayerBack" aria-hidden="true"/><div className="omQuranLayer omQuranLayerMid" aria-hidden="true"/><article className={"omAyahCard omVerseTransition omAyahFocused omQuranFloatingVerse "+(compactStudio?"omQuranFloatingVerse--focus":"")} onPointerMove={moveGlass} onPointerLeave={resetGlass} onTouchStart={e=>{const t=e.touches[0];swipeStart.current={x:t.clientX,y:t.clientY}}} onTouchEnd={e=>{const start=swipeStart.current;swipeStart.current=null;if(!start)return;const t=e.changedTouches[0];const dx=t.clientX-start.x,dy=t.clientY-start.y;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.4)jump(focusIndex+(dx<0?1:-1))}} data-verse-index={focusIndex} key={v.verse_key}><div className="omQuranMarkerCanvas">{(verseMarkers[v.verse_key]||[]).map(m=><button key={m.id} type="button" className="omQuranGlowMarker" aria-label={"Drag marker "+m.id} style={{left:m.x+"%",top:m.y+"%",width:m.size,height:m.size}} onPointerDown={e=>{e.stopPropagation();markerDrag.current={id:m.id,x:e.clientX,y:e.clientY,startX:m.x,startY:m.y,key:v.verse_key};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{const d=markerDrag.current;if(!d||d.id!==m.id)return;const rect=e.currentTarget.parentElement?.getBoundingClientRect();if(!rect)return;moveVerseMarker(m.id,d.startX+(e.clientX-d.x)/rect.width*100,d.startY+(e.clientY-d.y)/rect.height*100,d.key)}} onPointerUp={()=>{markerDrag.current=null}} onPointerCancel={()=>{markerDrag.current=null}}>✦</button>)}</div><div className="omAyahMeta"><strong>{v.verse_key}</strong><a href={"https://quran.com/"+v.verse_key} target="_blank" rel="noopener noreferrer">Study ↗</a></div><InlineAnnotations verse={v.verse_key} words={v.words} text={v.text_uthmani}/>{showTranslation&&<p className="omAyahEnglish">{strip(v.translations?.[0]?.text||"Translation not available.")}</p>}<div className="omAyahActions"><button onClick={()=>{const url="https://quran.com/"+v.verse_key;if(navigator.share)void navigator.share({title:"Qur'an "+v.verse_key,url}).catch(()=>{});else void navigator.clipboard.writeText(url)}}>↗ Share verse</button><a href={"https://quran.com/"+v.verse_key} target="_blank" rel="noopener noreferrer">📖 Read & listen</a></div><VerseEngagement verse={v.verse_key} onShare={()=>setShareVerse(v)}/><div className="omVerseLearningGrid"><div className="omVerseLearningMain"><VerseStudio verse={v.verse_key}/><VerseRecorder verse={v.verse_key}/><VerseDMShare verse={v.verse_key}/></div><VerseMediaTips verse={v.verse_key}/></div></article></div>)}</section></div>{shareVerse&&<VersePostStudio verse={shareVerse.verse_key} arabic={shareVerse.text_uthmani||shareVerse.words?.map(w=>w.text_uthmani||"").join(" ")||""} translation={shareVerse.translations?.[0]?.text||""} onClose={()=>setShareVerse(null)}/>}<p className="omQuranCredit">Arabic and English translation are requested from Quran.com API. English translation ID 131 is selected; verify translation attribution and licensing before public release. This is a verse browser, not AI-generated tafsir.</p></div><style jsx global>{`
.omQuranPage{transition:background-color .7s ease,color .7s ease,filter .7s ease}.omQuranPage .omQuranHero,.omQuranPage .omQuranSidebar,.omQuranPage .omQuranVerses,.omQuranPage .omAyahCard,.omQuranPage .omFocusTracker{transition:background .7s ease,border-color .7s ease,box-shadow .7s ease,color .7s ease,transform .7s ease}.omQuranPage.omHudhudExperience{background:radial-gradient(ellipse at 85% 5%,#32205b55,transparent 45%),radial-gradient(ellipse at 8% 65%,#064f5550,transparent 55%),#090e23;color:#eeeaff;min-height:100vh}.omHudhudExperience .omQuranHero{background:linear-gradient(130deg,#251448,#122a50,#092c34)!important;border-color:#7655ba!important;color:#f3eaff!important}.omHudhudExperience .omQuranSidebar,.omHudhudExperience .omQuranVerses{background:linear-gradient(150deg,#15132d,#0a2236)!important;border-color:#6357a0!important;color:#eeeaff!important}.omHudhudExperience .omAyahCard{background:linear-gradient(145deg,#1b1635,#0b2536)!important;border-color:#6353a3!important;color:#f0eaff!important}.omHudhudExperience .omAyahCard.omAyahFocused{border-color:#50f3ae!important;box-shadow:0 0 0 1px #55e8b966,0 0 32px #33d7a42b,inset 0 0 24px #6e46b322!important}.omHudhudExperience .omFocusTracker{background:#211b40f0!important;border-color:#6fddbe!important;color:#efffff!important}.omHudhudExperience .omFocusTrack>span{background:linear-gradient(90deg,#745bff,#45eeb1)}.omHudhudExperience .omQuranTitle,.omHudhudExperience .omAyahMeta,.omHudhudExperience .omAyahEnglish{color:#f1edff!important}.omHudhudExperience .omQuranChapters button{color:#e9e8ff!important}.omHudhudExperience .omQuranChapters button.active{background:#493c8b!important;color:#fff!important}.omHudhudExperience .omQuranCredit{color:#bfc8db!important}@media(prefers-reduced-motion:reduce){.omQuranPage,.omQuranPage .omQuranHero,.omQuranPage .omQuranSidebar,.omQuranPage .omQuranVerses,.omQuranPage .omAyahCard,.omQuranPage .omFocusTracker{transition:none!important}}
.omFocusTracker{position:sticky;top:68px;z-index:12;margin:0 0 18px;padding:15px 17px;border-radius:17px;background:color-mix(in srgb,var(--panel) 92%,transparent);backdrop-filter:blur(22px);border:1px solid #c4a35b66;box-shadow:0 10px 30px #00000012}.omFocusTop{display:flex;justify-content:space-between;gap:8px;font-size:10px;letter-spacing:.09em;color:var(--muted)}.omFocusTop strong{color:#c4a35b}.omFocusTrack{height:5px;background:#bca76a33;border-radius:20px;overflow:hidden;margin:10px 0}.omFocusTrack>span{display:block;height:100%;border-radius:20px;background:linear-gradient(90deg,#bca76a,#6ea79c);transition:width .5s ease}.omFocusTimeline{display:flex;align-items:center;gap:8px}.omFocusTimeline>button{border:1px solid var(--line);border-radius:10px;background:var(--panel2);color:var(--text);padding:7px 9px;font-size:12px;cursor:pointer;display:grid;text-align:left}.omFocusTimeline>button small{font-size:9px;opacity:.6}.omFocusCurrent{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;min-width:0}.omFocusCurrent span{font-size:9px;letter-spacing:.12em;color:#c4a35b}.omFocusCurrent strong{font-size:19px}.omFocusCurrent small{font-size:10px;color:var(--muted);text-align:center}.omFocusNav{display:flex;gap:5px}.omFocusNav button{border:1px solid var(--line);border-radius:9px;background:var(--panel2);color:var(--text);padding:8px 11px;cursor:pointer}.omFocusNav button:disabled{opacity:.3}
.omFocusNav[data-mode="normal"] button{background:var(--panel2);border:1px solid var(--line);color:var(--text);box-shadow:none;border-radius:10px;transition:background .2s ease,transform .2s ease}
.omFocusNav[data-mode="hudhud"]{padding:4px;border-radius:17px;background:linear-gradient(125deg,#743dff44,#138eff44);box-shadow:0 0 22px #803dff55,0 0 30px #208aff33}
.omFocusNav[data-mode="hudhud"] button{color:#fff;border:1px solid #a782ff;border-radius:12px;background:linear-gradient(145deg,#6629d9,#1955d7 75%,#09a6fa);box-shadow:0 0 12px #9b56ff88,inset 0 0 12px #a9aaff44;transition:transform .2s ease,box-shadow .2s ease}
.omFocusNav[data-mode="hudhud"] button:not(:disabled):active{transform:scale(.94)}
@media(prefers-reduced-motion:reduce){.omFocusNav button{transition:none!important}}.omVerseTransition{scroll-margin-top:225px;transition:transform .35s ease,box-shadow .35s ease,border-color .35s ease}.omAyahFocused{border-color:#c4a35b99;box-shadow:0 7px 25px #bba46d22}.omAyahFocused .omStudioToggle{animation:omStudioNudge .8s ease-out 1}@keyframes omStudioNudge{0%{transform:translateY(7px);opacity:.6}100%{transform:translateY(0);opacity:1}}@media(max-width:750px){.omFocusTracker{top:60px;padding:10px}.omFocusTimeline>button{padding:5px;font-size:10px}.omFocusCurrent small{font-size:9px}}@media(prefers-reduced-motion:reduce){.omVerseTransition,.omFocusTrack>span{transition:none}.omAyahFocused .omStudioToggle{animation:none}}.omVerseLearningGrid{display:grid;grid-template-columns:minmax(0,1fr) minmax(190px,245px);gap:14px;align-items:start;margin-top:10px}.omVerseLearningMain{min-width:0}@media(max-width:900px){.omVerseLearningGrid{grid-template-columns:1fr}.omVerseTips{max-width:100%}}.omQuranPage{background:var(--bg);color:var(--text);min-height:100vh}.omQuranShell{max-width:1120px;margin:auto;padding:24px 18px 70px}.omQuranHero{padding:28px 0 36px}.omQuranHero>a{display:block;color:var(--accent);margin-bottom:25px}.omQuranHero>span,.omQuranTitle span{font-size:11px;letter-spacing:.14em;color:#b79d5e;font-weight:900}.omQuranHero h1{font-size:clamp(30px,5vw,53px);letter-spacing:-.045em;margin:10px 0}.omQuranHero p{max-width:640px;color:var(--muted);line-height:1.7}.omQuranLayout{display:grid;grid-template-columns:265px minmax(0,1fr);gap:26px}.omQuranSidebar{position:sticky;top:85px;align-self:start;background:var(--panel);padding:15px;border:1px solid var(--line);border-radius:19px}.omQuranSidebar label{display:block;font-size:12px;margin-bottom:8px}.omQuranSidebar input{width:100%;padding:12px;border:1px solid var(--line);border-radius:11px;background:var(--panel2);color:var(--text)}.omQuranChapters{max-height:65vh;overflow:auto;margin-top:10px}.omQuranChapters button{display:flex;justify-content:space-between;gap:8px;width:100%;padding:12px 9px;border:0;border-radius:10px;background:transparent;color:var(--text);text-align:left;cursor:pointer}.omQuranChapters button.active{background:#a6b96c33;box-shadow:inset 3px 0 #c4a35b}.omQuranChapters small{color:var(--muted);white-space:nowrap}.omQuranTitle{display:flex;justify-content:space-between;align-items:center;gap:15px;margin-bottom:17px}.omQuranTitle h2{margin:5px 0;font-size:26px}.omQuranTitle h2 small{font-size:20px;margin-left:8px;color:#c6a763}.omQuranTitle label{font-size:12px}.omAyahCard{border:1px solid var(--line);background:var(--panel);border-radius:19px;padding:23px;margin-bottom:13px;transition:box-shadow .25s ease,transform .25s ease}.omAyahCard:hover{box-shadow:0 12px 36px #a8995330;transform:translateY(-2px)}.omAyahMeta,.omAyahActions{display:flex;align-items:center;justify-content:space-between;gap:9px;flex-wrap:wrap}.omAyahMeta strong{color:#c6a763}.omAyahMeta a,.omAyahActions a,.omAyahActions button{color:var(--text);text-decoration:none;font-size:12px}.omAyahArabic{font-family:serif;font-size:clamp(25px,3vw,35px);line-height:2.2;text-align:right;padding:12px 0}.omAyahEnglish{font-size:15px;line-height:1.85;color:var(--muted)}.omAyahActions{justify-content:flex-start;margin-top:18px}.omAyahActions a,.omAyahActions button,.omQuranPages button{border:1px solid #b99c5570;border-radius:999px;padding:10px 14px;background:var(--panel2);cursor:pointer}.omQuranPages{display:flex;justify-content:center;align-items:center;gap:18px;padding:18px}.omQuranPages button:disabled{opacity:.35}.omQuranCredit{font-size:11px;color:var(--muted);margin-top:30px}@media(max-width:750px){.omQuranLayout{grid-template-columns:1fr}.omQuranSidebar{position:static}.omQuranChapters{display:flex;gap:6px;overflow-x:auto;max-height:100px}.omQuranChapters button{min-width:150px}.omAyahCard{padding:16px}}
.omWordLine{display:flex;flex-wrap:wrap;justify-content:flex-start;gap:8px 5px}.omWordWrap{position:relative;display:inline-flex}.omWord{position:relative;cursor:pointer;border:0;background:transparent;color:inherit;font:inherit;line-height:inherit;padding:0 3px;border-radius:9px;transition:background .2s,transform .2s}.omWord:hover,.omWord:focus-visible{background:#c4a35b26;transform:translateY(-2px);outline:2px solid #c4a35b66;outline-offset:2px}.omWordTooltip{position:absolute;bottom:calc(100% + 10px);left:50%;transform:translate(-50%,8px) scale(.96);width:max-content;max-width:min(250px,80vw);min-width:150px;white-space:normal;direction:ltr;text-align:center;display:flex;flex-direction:column;gap:5px;z-index:8;background:#142c25;color:#fff;padding:13px 15px;border:1px solid #d2b76e88;border-radius:15px;box-shadow:0 16px 35px #0006;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .2s,transform .2s,visibility .2s;font:14px/1.5 system-ui}.omWordTooltip b{color:#e4c67e;font-size:13px}.omWordTooltip small{font-size:16px}.omWordTooltip em{font-size:10px;font-style:normal;color:#d7d9d2}.omWord:hover .omWordTooltip,.omWord:focus .omWordTooltip{opacity:1;visibility:visible;transform:translate(-50%,0) scale(1)}.omVerseEnd{font-size:23px;color:#c6a763}.omAyahCard{overflow:visible}@media(prefers-reduced-motion:reduce){.omWord,.omWordTooltip{transition:none!important}.omWord:hover{transform:none}.omAyahCard{transition:none}.omAyahCard:hover{transform:none}}
/* Quran Studio: mobile-first, one-column editing canvas without desktop overflow */
.omQuranPage,.omQuranPage *{box-sizing:border-box}
.omQuranPage{width:100%;max-width:100%;overflow-x:clip}
.omQuranShell,.omQuranLayout,.omQuranVerses,.omAyahCard,.omVerseLearningGrid{min-width:0;max-width:100%}
.omQuranChapters{overscroll-behavior-inline:contain}
.omQuranPage .omInlineWords{min-height:unset;overflow-wrap:anywhere}
.omQuranPage .omInlineWords:empty{display:none}
.omQuranPage .omAyahEnglish{overflow-wrap:anywhere}
@media(max-width:750px){
 .omQuranShell{width:100%;padding:14px 12px calc(110px + env(safe-area-inset-bottom))}
 .omQuranHero{padding:14px 0 20px}.omQuranHero h1{font-size:clamp(25px,7vw,35px);line-height:1.15}
 .omQuranLayout{display:flex;flex-direction:column;gap:14px;width:100%}
 .omQuranSidebar{width:100%;padding:12px;position:relative;top:auto;overflow:hidden}
 .omQuranSidebar input{max-width:100%;min-width:0}
 .omQuranChapters{display:flex;flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;max-height:none;width:100%;padding-bottom:6px;-webkit-overflow-scrolling:touch;scroll-snap-type:x proximity}
 .omQuranChapters button{flex:0 0 148px;min-width:148px;max-width:148px;scroll-snap-align:start}
 .omQuranVerses{width:100%;overflow:visible}
 .omFocusTracker{position:relative;top:auto;z-index:1;width:100%;padding:12px;margin-bottom:12px}
 .omFocusTimeline{flex-wrap:wrap}.omFocusCurrent{min-width:125px}
 .omAyahCard{width:100%;padding:16px 13px;border-radius:16px;transform:none!important}
 .omQuranPage .omInlineWords{font-size:clamp(25px,7vw,34px);line-height:2.1;direction:rtl;max-width:100%}
 .omQuranPage .omInlineWord{max-width:100%;overflow-wrap:anywhere}
 .omVerseLearningGrid{display:flex;flex-direction:column;gap:10px}
 .omVerseLearningMain,.omVerseTips{width:100%;max-width:100%}
 .omQuranPages{gap:8px;flex-wrap:wrap}.omQuranPages button{padding:9px}
 .omVerseTransition{scroll-margin-top:85px}
}
`}</style><style>{`
.omQuranMarkerToolbar{position:relative;z-index:20!important;display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 12px;padding:9px;border:1px solid #a59fff55;border-radius:18px;background:#101c35d9;backdrop-filter:blur(18px);color:#e9edff}
.omQuranMarkerToolbar span{font-weight:800;font-size:12px;margin-right:auto}
.omQuranMarkerToolbar button{border:1px solid #a58aff66;border-radius:999px;background:#6142b933;color:#fff;padding:8px 11px;cursor:pointer}
.omQuranMarkerToolbar button:disabled{opacity:.4}
.omQuranMarkerToolbar label{display:flex;align-items:center;gap:5px;font-size:11px}
.omQuranMarkerToolbar input{width:76px;accent-color:#a879ff}
.omQuranFloatingVerse{position:relative!important;isolation:isolate}
.omQuranMarkerCanvas{position:absolute;inset:0;z-index:5;pointer-events:none}
.omQuranGlowMarker{position:absolute;pointer-events:auto;transform:translate(-50%,-50%);border-radius:50%;border:2px solid #ddc8ff;box-shadow:0 0 0 5px #a765ff33,0 0 25px 8px #965bff99,inset 0 0 12px #c6abff;color:white;background:radial-gradient(circle,#aa91ffb5,#5434b777);font-size:20px;cursor:grab;touch-action:none;user-select:none}
.omQuranGlowMarker:active{cursor:grabbing}
.omHudhudExperience .omQuranAppStage{position:fixed!important;inset:0;z-index:9999;width:100vw;max-width:100vw;height:100dvh;overflow-y:auto;border-radius:0!important;padding:clamp(12px,3vw,28px)!important;background:#080e1ff5!important;animation:omQuranFullScan .9s ease-out both}
.omHudhudExperience .omQuranAppStage:after{content:"";position:fixed;inset:0;z-index:100;pointer-events:none;background:linear-gradient(180deg,transparent 42%,#b1e6ff77 49%,#8a65ff88 50%,transparent 57%);animation:omQuranScanLine 1.2s ease-out forwards}
.omHudhudExperience .omQuranFloatingVerse{max-width:780px;margin:16px auto!important;min-height:55dvh}
.omHudhudExperience .omQuranAppOverview,.omHudhudExperience .omQuranMarkerToolbar{max-width:900px;margin-left:auto;margin-right:auto}
@keyframes omQuranFullScan{0%{filter:brightness(2) saturate(1.7)}100%{filter:brightness(1) saturate(1)}}
@keyframes omQuranScanLine{0%{opacity:0;transform:translateY(-95vh)}15%{opacity:1}90%{opacity:1}100%{opacity:0;transform:translateY(95vh)}}
@media(prefers-reduced-motion:reduce){.omHudhudExperience .omQuranAppStage,.omHudhudExperience .omQuranAppStage:after{animation:none}}
`}</style>
 <style>{`
.omQuranAppStage{position:relative;isolation:isolate;overflow:hidden;border:1px solid #ffffff2a;border-radius:30px;padding:clamp(12px,2vw,25px);background:linear-gradient(135deg,#0a1227f2,#0a2430eb 60%,#10162bed);box-shadow:0 22px 65px #0008;min-height:70dvh}
.omQuranAppStage>*:not(.omQuranAtmosphere){position:relative;z-index:1}
.omQuranAtmosphere{position:absolute!important;inset:-110px;z-index:0!important;touch-action:none;cursor:grab;pointer-events:auto;transition:transform .16s ease-out}
.omQuranAtmosphere:active{cursor:grabbing}
.omQuranAtmosphereOrb{position:absolute;width:50%;aspect-ratio:1;border-radius:50%;filter:blur(48px);opacity:.34;pointer-events:none}
.omQuranAtmosphereOrbA{top:10%;left:2%;background:radial-gradient(circle,#7246ff,transparent 70%)}
.omQuranAtmosphereOrbB{right:0;bottom:5%;background:radial-gradient(circle,#10c2c0,transparent 70%)}
.omQuranAppOverview{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:15px 16px;margin-bottom:16px;border:1px solid #ffffff2a;border-radius:21px;background:#ffffff0c;backdrop-filter:blur(22px);box-shadow:0 10px 30px #0005;color:#f4f7ff}
.omQuranAppOverview small{display:block;color:#92dfd8;font-size:10px;letter-spacing:.14em;font-weight:800}
.omQuranAppOverview strong{display:block;font-size:clamp(18px,3vw,25px);margin:5px 0}
.omQuranAppOverview strong span{color:#d6bafc;font-size:14px}
.omQuranAppOverview p{margin:0;color:#c6d3e6;font-size:12px}
.omQuranAppOverview button{flex-shrink:0;border:1px solid #a8bcff66;background:#ffffff16;border-radius:999px;padding:9px 12px;color:#fff;cursor:pointer}
.omQuranFloatingVerse{background:linear-gradient(145deg,#172542b8,#182b3db5)!important;backdrop-filter:blur(25px) saturate(140%);-webkit-backdrop-filter:blur(25px) saturate(140%);border:1px solid #ffffff42!important;border-radius:28px!important;box-shadow:0 22px 48px #000a,0 3px 12px #0007,0 1px 0 #ffffff26 inset!important;color:#f9f8ff!important;animation:omQuranVerseEnter .48s cubic-bezier(.2,.85,.2,1) both;touch-action:pan-y}
.omQuranFloatingVerse .omAyahEnglish{color:#e5e7f5!important}
.omQuranFloatingVerse .omAyahMeta,.omQuranFloatingVerse .omAyahActions{color:#f9f8ff!important}
.omQuranFloatingVerse .omAyahActions a,.omQuranFloatingVerse .omAyahActions button{color:#eef6ff!important}
.omQuranFloatingVerse--focus{min-height:260px}
.omQuranAppStage .omFocusTracker{background:#14243bc9!important;backdrop-filter:blur(22px);color:#f4f7ff!important;border-color:#ffffff33}
.omQuranAppStage .omFocusCurrent strong{color:#fff}
.omQuranAppStage .omQuranTitle{color:#f4f7ff!important}
.omQuranAppStage .omQuranTitle h2{color:#fff}
@keyframes omQuranVerseEnter{from{opacity:0;transform:translateX(24px) translateY(9px) scale(.975);filter:blur(7px)}to{opacity:1;transform:translateX(0) translateY(0) scale(1);filter:blur(0)}}
@media(max-width:750px){.omQuranShell{padding:10px 10px 110px!important}.omQuranHero{padding:8px 4px 12px!important}.omQuranHero h1{font-size:24px!important}.omQuranHero p{display:none}.omQuranAppStage{min-height:calc(100dvh - 135px);border-radius:25px;padding:11px}.omQuranAppOverview{padding:12px}.omQuranFloatingVerse{padding:20px 15px!important;min-height:45dvh}.omQuranAppStage .omFocusTracker{top:auto}.omQuranAppStage .omAyahCard:hover{transform:none!important}}
@media(prefers-reduced-motion:reduce){.omQuranFloatingVerse{animation:none}.omQuranAtmosphere{transition:none}}
`}</style>
 <style>{`
.omHudhudQuickWrap{position:relative;margin:8px 0 16px;isolation:isolate}.omHudhudQuickButton{display:inline-flex;align-items:center;gap:8px;padding:10px 16px;border:1px solid #9d85ff99;border-radius:999px;background:linear-gradient(115deg,#302269,#173b77);color:white;font-weight:800;box-shadow:0 0 16px #7863ef55;cursor:pointer;transition:transform .25s,box-shadow .25s}.omHudhudQuickButton:hover,.omHudhudQuickButton.is-open{transform:translateY(-2px);box-shadow:0 0 24px #8c63ff99}.omHudhudQuickPanel{position:relative;z-index:15;margin-top:10px;padding:16px;border:1px solid #aa91ff77;border-radius:22px;background:linear-gradient(145deg,#15142df5,#142c44f5);color:#f8f7ff;box-shadow:0 22px 60px #08091a88;animation:omHudhudQuickPop .38s cubic-bezier(.2,.9,.2,1) both}.omHudhudQuickHead,.omHudhudQuickActions,.omHudhudQuickLinks{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}.omHudhudQuickHead button{border:0;background:#ffffff24;color:white;border-radius:50%;width:30px;height:30px;font-size:21px;cursor:pointer}.omHudhudQuickSlide{min-height:110px;padding:12px 0;animation:omHudhudQuickPop .34s ease both}.omHudhudQuickSlide small{color:#a9caff}.omHudhudQuickSlide h3{margin:5px 0;font-size:19px}.omHudhudQuickSlide p{margin:0;line-height:1.5;color:#d7d9f6}.omHudhudQuickActions button,.omHudhudQuickVision{border:1px solid #b8b5ff66;border-radius:12px;background:#ffffff16;color:#fff;padding:9px 12px;cursor:pointer}.omHudhudQuickActions button:disabled{opacity:.3}.omHudhudQuickVision{width:100%;margin:12px 0;background:linear-gradient(100deg,#6246b9,#155ba4)}.omHudhudQuickLinks a{color:#b4e8ff;font-size:13px}@keyframes omHudhudQuickPop{from{opacity:0;transform:translateY(12px) scale(.97);filter:blur(5px)}to{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}}@media(prefers-reduced-motion:reduce){.omHudhudQuickPanel,.omHudhudQuickSlide{animation:none}.omHudhudQuickButton{transition:none}}
`}</style><style>{`
/* Premium glass folios */
.omQuranAppStage{background:radial-gradient(ellipse at 15% 0%,#22645b55,transparent 50%),radial-gradient(ellipse at 85% 95%,#65408c44,transparent 55%),#091822!important;border:1px solid #c3e8de55!important;box-shadow:inset 0 1px #ffffff36,0 24px 70px #0009!important}
.omQuranFloatingVerse{position:relative;isolation:isolate;overflow:hidden!important;background:linear-gradient(145deg,#ffffff24,#a5dfdb10 45%,#c8b6fa18)!important;border:1px solid #e0f4e2a6!important;border-radius:30px!important;box-shadow:inset 0 2px #ffffff48,0 20px 55px #0009,0 0 32px #9ad6dc22!important;backdrop-filter:blur(28px) saturate(145%)!important;-webkit-backdrop-filter:blur(28px) saturate(145%)!important}
.omQuranFloatingVerse:before{content:"";position:absolute;inset:1px;z-index:0;pointer-events:none;border-radius:inherit;background:linear-gradient(120deg,#ffffff24,transparent 30%,transparent 70%,#b8dfff12)}
.omQuranFloatingVerse>*{position:relative;z-index:1}
.omQuranFloatingVerse .omAyahEnglish{color:#f0f5f5!important;line-height:1.9;text-shadow:0 1px 1px #0006}
.omQuranFloatingVerse .omInlineWords,.omQuranFloatingVerse .omAyahArabic,.omQuranFloatingVerse .omWord{color:#fff9eb!important;text-shadow:0 1px 2px #0008}
.omQuranAppOverview,.omQuranAppStage .omFocusTracker{background:linear-gradient(140deg,#e8fff01e,#a8d6ef0e)!important;border:1px solid #e1f7e75c!important;backdrop-filter:blur(24px);box-shadow:inset 0 1px #ffffff2d,0 12px 30px #0005}
.omQuranFloatingVerse :is(button,a):focus-visible{outline:2px solid #f4d38e;outline-offset:3px}
@media(max-width:750px){.omQuranFloatingVerse{border-radius:23px!important;padding:19px 15px!important}.omQuranAppStage{border-radius:22px}}
`}</style><style>{`
/* Gently responsive glass: pointer-driven refraction, slow floating layers. */
.omQuranFloatingVerse{--glass-x:50%;--glass-y:40%;--glass-tilt-x:0deg;--glass-tilt-y:0deg;transform:perspective(1100px) rotateX(var(--glass-tilt-x)) rotateY(var(--glass-tilt-y));transform-style:preserve-3d;transition:transform .42s cubic-bezier(.18,.8,.2,1),box-shadow .42s ease;will-change:auto}
.omQuranFloatingVerse:before{background:radial-gradient(ellipse 42% 36% at var(--glass-x) var(--glass-y),#fff8e43a,transparent 85%),linear-gradient(120deg,#ffffff1b,transparent 30%,transparent 70%,#b8dfff12);transition:background .15s ease}
.omQuranFloatingVerse:hover{box-shadow:inset 0 2px #ffffff66,0 24px 60px #000a,0 0 42px #a4e9e238!important}
.omQuranLayerBack{animation:omGlassDriftBack 8s ease-in-out infinite alternate}
.omQuranLayerMid{animation:omGlassDriftMid 11s ease-in-out infinite alternate}
@keyframes omGlassDriftBack{from{translate:-4px 2px;rotate:-.5deg}to{translate:5px -5px;rotate:.7deg}}
@keyframes omGlassDriftMid{from{translate:3px -2px;rotate:.5deg}to{translate:-5px 4px;rotate:-.6deg}}
@media(hover:none),(pointer:coarse){.omQuranFloatingVerse{transform:none!important}.omQuranFloatingVerse:active{box-shadow:inset 0 2px #ffffff6b,0 16px 50px #0009,0 0 44px #a6e9e14d!important}}
@media(prefers-reduced-motion:reduce){.omQuranFloatingVerse{transform:none!important;transition:none!important}.omQuranLayerBack,.omQuranLayerMid{animation:none!important}}
`}</style></main>;
}