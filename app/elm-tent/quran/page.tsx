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
import ReadingAtmosphere from "./ReadingAtmosphere";
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
 const [modeTransition,setModeTransition]=useState(false);
 const [modeOrbPosition,setModeOrbPosition]=useState({x:0,y:0});
 const modeDrag=useRef<{x:number;y:number;originX:number;originY:number;moved:boolean}|null>(null);
 const modeTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const switchReadingMode=()=>{setModeTransition(true);setCardBack(false);setHudhudMode(v=>!v);if(modeTimer.current)clearTimeout(modeTimer.current);modeTimer.current=setTimeout(()=>setModeTransition(false),700)};
 useEffect(()=>()=>{if(modeTimer.current)clearTimeout(modeTimer.current)},[]);
 const [focusIndex,setFocusIndex]=useState(0);
 const [turningPage,setTurningPage]=useState<{direction:"next"|"previous";verse:Verse;position:number}|null>(null);
 const pageTurnTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>()=>{if(pageTurnTimer.current)clearTimeout(pageTurnTimer.current)},[]);
 const [cardBack,setCardBack]=useState(false);
 const [spinAngle,setSpinAngle]=useState(0);
 const [spinning,setSpinning]=useState(false);
 const spinAngleRef=useRef(0);
 const spinFrame=useRef<number|null>(null);
 const spinPointer=useRef<{x:number;time:number;angle:number;velocity:number;lastX:number;lastTime:number;moved:boolean}|null>(null);
 const spinAudio=useRef<AudioContext|null>(null);
 const lastSpinTick=useRef(-1);
 const tickSpin=()=>{try{if(typeof window==="undefined")return;const AudioCtor=window.AudioContext;if(!AudioCtor)return;const ctx=spinAudio.current||new AudioCtor();spinAudio.current=ctx;if(ctx.state==="suspended")void ctx.resume();const oscillator=ctx.createOscillator(),gain=ctx.createGain();oscillator.type="triangle";oscillator.frequency.setValueAtTime(820,ctx.currentTime);oscillator.frequency.exponentialRampToValueAtTime(340,ctx.currentTime+.035);gain.gain.setValueAtTime(.0001,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.025,ctx.currentTime+.003);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.05);oscillator.connect(gain);gain.connect(ctx.destination);oscillator.start();oscillator.stop(ctx.currentTime+.055)}catch{}};
 const setSpin=(angle:number)=>{spinAngleRef.current=angle;setSpinAngle(angle);const tick=Math.floor((angle+90)/180);if(tick!==lastSpinTick.current){if(lastSpinTick.current!==-1)tickSpin();lastSpinTick.current=tick}};
 const stopSpin=()=>{if(spinFrame.current!==null){cancelAnimationFrame(spinFrame.current);spinFrame.current=null}setSpinning(false)};
 const spinTo=(target:number,duration=1300)=>{stopSpin();setSpinning(true);const start=spinAngleRef.current,started=performance.now();const run=(now:number)=>{const t=Math.min(1,(now-started)/duration),ease=1-Math.pow(1-t,4);setSpin(start+(target-start)*ease);if(t<1){spinFrame.current=requestAnimationFrame(run)}else{spinFrame.current=null;setSpinning(false);setCardBack(Math.round(target/180)%2!==0)}};spinFrame.current=requestAnimationFrame(run)};
 const spinCard=()=>{const base=Math.ceil(spinAngleRef.current/360)*360;const turns=3+Math.floor(Math.random()*3);const side=Math.random()<.5?0:180;spinTo(base+turns*360+side,1900+turns*180)};
 const startCardSpin=(e:React.PointerEvent<HTMLElement>)=>{if((e.target as HTMLElement).closest("input,textarea,select,a,.omQuranWordEditor,.omQuranProjectLabel"))return;stopSpin();spinPointer.current={x:e.clientX,time:performance.now(),angle:spinAngleRef.current,velocity:0,lastX:e.clientX,lastTime:performance.now(),moved:false};e.currentTarget.setPointerCapture(e.pointerId)};
 const moveCardSpin=(e:React.PointerEvent<HTMLElement>)=>{const d=spinPointer.current;if(!d)return;const now=performance.now(),delta=e.clientX-d.lastX,elapsed=Math.max(1,now-d.lastTime);d.velocity=delta/elapsed;d.lastX=e.clientX;d.lastTime=now;if(Math.abs(e.clientX-d.x)>7)d.moved=true;if(d.moved)setSpin(d.angle+(e.clientX-d.x)*1.4)};
 const endCardSpin=()=>{const d=spinPointer.current;spinPointer.current=null;if(!d)return;if(!d.moved){spinCard();return}const momentum=Math.max(-1250,Math.min(1250,d.velocity*320));const estimated=spinAngleRef.current+momentum;const target=Math.round(estimated/180)*180;spinTo(target,Math.min(1900,Math.max(650,Math.abs(target-spinAngleRef.current)*1.8)))};
 useEffect(()=>()=>{if(spinFrame.current!==null)cancelAnimationFrame(spinFrame.current);void spinAudio.current?.close()},[]);

 const [readingProject,setReadingProject]=useState("Read Quran First Time");
 const [verseNotes,setVerseNotes]=useState<Record<string,{note:string;highlights:number[];underlines:number[]}>>({});
 useEffect(()=>{try{const p=localStorage.getItem("1muslim-quran-reading-project");if(p)setReadingProject(p);const n=localStorage.getItem("1muslim-quran-private-verse-notes");if(n)setVerseNotes(JSON.parse(n))}catch{}},[]);
 const updateVerseNote=(key:string,patch:Partial<{note:string;highlights:number[];underlines:number[]}>)=>setVerseNotes(prev=>{const next={...prev,[key]:{...(prev[key]||{note:"",highlights:[],underlines:[]}),...patch}};try{localStorage.setItem("1muslim-quran-private-verse-notes",JSON.stringify(next))}catch{}return next});
 const toggleWordMark=(key:string,index:number,kind:"highlights"|"underlines")=>{const current=verseNotes[key]?.[kind]||[];updateVerseNote(key,{[kind]:current.includes(index)?current.filter(i=>i!==index):[...current,index]})};
 useEffect(()=>{stopSpin();setSpinAngle(0);spinAngleRef.current=0;lastSpinTick.current=-1;setCardBack(false)},[chapter,page,focusIndex]);
 const [showFatihahIntro,setShowFatihahIntro]=useState(false);
 useEffect(()=>{try{if(chapter===1&&!localStorage.getItem("1muslim-fatihah-read-intro-v1"))setShowFatihahIntro(true)}catch{}},[]);
 const dismissFatihahIntro=()=>{setShowFatihahIntro(false);try{localStorage.setItem("1muslim-fatihah-read-intro-v1","seen")}catch{}};
 const [chapterFinish,setChapterFinish]=useState(false);
 const [chapterNote,setChapterNote]=useState("");
 const [orbOpen,setOrbOpen]=useState(false);
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
 const [wordPanel,setWordPanel]=useState<"meaning"|"root"|"usage">("meaning");
 const [selectedWord,setSelectedWord]=useState<QuranWord|null>(null);
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem("1muslim-quran-visited-v1")||"{}");if(saved&&typeof saved==="object"&&!Array.isArray(saved))setVisited(saved)}catch{}},[]);
 useEffect(()=>{try{localStorage.setItem("1muslim-quran-visited-v1",JSON.stringify(visited))}catch{}},[visited]);
 useEffect(()=>{const key=verses[focusIndex]?.verse_key;if(key)setVisited(prev=>prev[key]?prev:{...prev,[key]:true})},[verses,focusIndex]);

 const verseArea=useRef<HTMLElement>(null);
 const pendingVerse=useRef<string|null>(null);
 const [linkedQuestion,setLinkedQuestion]=useState<string|null>(null);
 useEffect(()=>{const params=new URLSearchParams(window.location.search);const key=params.get("verse")||(params.get("surah")&&params.get("ayah")?params.get("surah")+":"+params.get("ayah"):null);if(key&&/^([1-9]|[1-9][0-9]|1[01][0-4]):[1-9][0-9]{0,2}$/.test(key)){pendingVerse.current=key;const [ch,num]=key.split(":").map(Number);setChapter(ch);setPage(Math.ceil(num/50))}setLinkedQuestion(params.get("question"));if(params.get("vision")==="1"){window.setTimeout(()=>window.dispatchEvent(new Event("1muslim:hudhud-vision-enable")),400)}},[]);
 const navigateVerse=(key:string)=>{const [ch,num]=key.split(":").map(Number);if(!Number.isInteger(ch)||ch<1||ch>114||!Number.isInteger(num)||num<1)return;pendingVerse.current=key;setChapter(ch);setPage(Math.ceil(num/50));};
 useEffect(()=>{if(busy||!verses.length||!pendingVerse.current)return;const target=pendingVerse.current;const index=verses.findIndex(v=>v.verse_key===target);if(index<0)return;pendingVerse.current=null;const id=window.setTimeout(()=>{verseArea.current?.querySelector<HTMLElement>('[data-verse-index="'+index+'"]')?.scrollIntoView({behavior:"smooth",block:"center"});setFocusIndex(index)},100);return()=>clearTimeout(id)},[busy,verses]);
 useEffect(()=>{setFocusIndex(0)},[chapter,page]);

 const jump=(index:number)=>{
  if(turningPage)return;
  if(index>=0&&index<verses.length&&index!==focusIndex){
   const reduced=typeof window!=="undefined"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
   if(!reduced){
    setTurningPage({direction:index>focusIndex?"next":"previous",verse:verses[focusIndex],position:(page-1)*50+focusIndex+1});
    setFocusIndex(index);
    const key=verses[index]?.verse_key;if(key)setVisited(v=>({...v,[key]:true}));
    pageTurnTimer.current=setTimeout(()=>{setTurningPage(null);pageTurnTimer.current=null},510);
    return;
   }
  }

  if(index>=verses.length&&page>=total&&chapterCount>0&&versePosition>=chapterCount){setChapterFinish(true);return;}
  if(index>=0&&index<verses.length){setFocusIndex(index);const key=verses[index]?.verse_key;if(key)setVisited(v=>({...v,[key]:true}));return}
  if(index<0&&page>1){setPage(p=>p-1);pendingBoundary.current="last"}
  else if(index>=verses.length&&page<total){setPage(p=>p+1);pendingBoundary.current="first"}
 };
 const pendingBoundary=useRef<"first"|"last"|null>(null);
 useEffect(()=>{if(busy||!verses.length||!pendingBoundary.current)return;setFocusIndex(pendingBoundary.current==="last"?verses.length-1:0);pendingBoundary.current=null},[busy,verses]);

 const versePosition=(page-1)*50+focusIndex+1;
 useEffect(()=>{try{localStorage.setItem("1muslim-quran-progress",JSON.stringify({chapter,verse:versePosition}))}catch{}},[chapter,versePosition]);
 const chapterCount=activeChapterCount(chapters,chapter);
 const nextChapter=chapters.find(c=>c.id===chapter+1);
 const chapterMilestones:Record<number,{cheer:string;preview:string;question:string}>={
  1:{cheer:"You began with Al-Fatihah — the opening prayer you recite in salah. Every great journey begins with a first step. 🌟",preview:"Up next: Al-Baqarah, the longest surah (286 verses). It opens with guidance, belief, and the story of humanity learning to follow Allah's commands.",question:"As you read, ask: what does it mean to seek guidance and then live by it?"},
  2:{cheer:"You made it through the longest chapter! Consistency is stronger than speed. 🌿",preview:"Up next: Ali 'Imran. Explore faith, the family of 'Imran, Maryam, and lessons about holding firmly to truth through challenges.",question:"What helps your faith stay steady when life tests you?"},
  3:{cheer:"Another chapter complete. You're not just collecting verses — you're building understanding. ✨",preview:"Up next: An-Nisa. Reflect on justice, family responsibilities, protecting vulnerable people, and treating others fairly.",question:"Where can you practice more justice and compassion today?"},
  4:{cheer:"Beautiful progress! Learning becomes powerful when it changes how we treat people. 💜",preview:"Up next: Al-Ma'idah. Notice its themes of fulfilling commitments, lawful living, and moral responsibility.",question:"What promise or responsibility can you honor more carefully?"},
  5:{cheer:"Keep going! The Quran invites you to look closely at the world and your own choices. 🌙",preview:"Up next: Al-An'am. Reflect on Allah's oneness, signs in creation, and the importance of sincere worship.",question:"Which signs around you inspire gratitude?"}
 };
 const milestone=chapterMilestones[chapter];
 const nextChapterName=nextChapter?.name_simple||"the next surah";
 const nextChapterTheme=nextChapter?.translated_name?.name;
 const milestoneCheer=milestone?.cheer||["You completed another surah. Every verse you return to can reveal something new. ✨","A whole chapter explored! Take what you learned into your day. 🌱","One chapter at a time — your Quran journey is growing. 🌙","Well done! Curiosity and reflection make reading richer. 💎"][(chapter-1)%4];
 const milestonePreview=milestone?.preview||("Up next: "+nextChapterName+(nextChapterTheme?" (often translated as “"+nextChapterTheme+"”).":"." )+" Read with curiosity: notice the recurring ideas, questions, and lessons.");
 const milestoneQuestion=milestone?.question||"As you begin, what is one question you hope this surah will help you explore?";
 const chapterPercent=chapterCount?Math.min(100,Math.round(versePosition/chapterCount*100)):0;
 const totalQuranVerses=6236;
 const readCount=Object.keys(visited).filter(k=>visited[k]&&/^\\d+:\\d+$/.test(k)).length;
 const quranReadPercent=Math.min(100,Math.round(readCount/totalQuranVerses*100));
 const chapterReadCount=Object.keys(visited).filter(k=>visited[k]&&k.startsWith(chapter+":")).length;
 const chapterReadPercent=chapterCount?Math.min(100,Math.round(chapterReadCount/chapterCount*100)):0;

 const previousTopics=verses.slice(Math.max(0,focusIndex-2),focusIndex);
 const filtered=useMemo(()=>chapters.filter(c=>String(c.id)===search.trim()||c.name_simple.toLowerCase().includes(search.toLowerCase())||c.name_arabic.includes(search)),[chapters,search]);
 const active=chapters.find(c=>c.id===chapter);
 return <main className={"omQuranPage "+(hudhudMode?"omHudhudExperience":"omQuranSimpleMode")+(modeTransition?" omQuranModeChanging":"")}><div className="omQuranShell">{linkedQuestion&&<div style={{padding:12,border:"1px solid var(--line)",borderRadius:14,marginBottom:12}}><strong>🐦 HudHud · Question-to-verse study</strong><p>Read the verse and its context, then return to the question to check your understanding.</p><Link href={"/elm-tent/lessons?question="+encodeURIComponent(linkedQuestion)}>← Return to linked question</Link></div>}<header className="omQuranHero"><img src="/assets/HudHud-Quran.png" alt="HudHud Qur’an" width={44} height={44} style={{display:"block",width:44,height:44,objectFit:"contain",margin:"0 0 4px"}}/><Link href="/elm-tent">← Elm Tent</Link><span>🏕️ ELM TENT · QUR'AN LESSONS</span><h1>Every verse. A doorway to learning.</h1><p>Browse 114 surahs, explore the Arabic and translation, and share an ayah with the community. Verse references always link back to the Qur'an.</p></header><div className="omQuranLayout"><aside className="omQuranSidebar"><label htmlFor="omSurahSearch">Find a surah</label><input id="omSurahSearch" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name or number…"/><div className="omQuranChapters">{filtered.map(c=><button key={c.id} className={chapter===c.id?"active":""} onClick={()=>{setChapter(c.id);setPage(1)}}><b>{c.id}. {c.name_simple}</b><small>{c.verses_count} ayat</small></button>)}</div></aside><section className="omQuranVerses omQuranAppStage" ref={verseArea}><div className="omQuranFirstReader"><div className="omQuranGlassTop"><Link href="/elm-tent" className="omQuranStudioExit" aria-label="Quran Home and full Studio">⌂ <span>Quran Home</span></Link><select aria-label="Choose surah" value={chapter} onChange={e=>{setChapter(Number(e.target.value));setPage(1);setFocusIndex(0)}}>{chapters.map(c=><option key={c.id} value={c.id}>{c.name_simple}</option>)}</select><span>{verses[focusIndex]?.verse_key||"1:1"}</span><button type="button" className="omQuranStudioSettings" title="Studio settings" aria-label="Open Quran Studio settings" onClick={()=>setOrbOpen(v=>!v)}>⋯</button></div><div className="omQuranSimpleReader" aria-label="Quran Read Mode"><div className="omQuranSimpleHeading"><span>﷽</span><h2>{active?.name_arabic||"الْفَاتِحَة"}</h2><small>{active?.name_simple||"Al-Fatihah"} · {verses[focusIndex]?.verse_key||"1:1"}</small></div><div className="omQuranSimpleVerse" key={verses[focusIndex]?.verse_key||"loading"}><p lang="ar" dir="rtl">{verses[focusIndex]?.text_uthmani||"بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"}</p>{showTranslation&&<p className="omQuranSimpleTranslation">{strip(verses[focusIndex]?.translations?.[0]?.text||"")}</p>}</div><div className="omQuranSimpleHint">Tap the orb to continue · {versePosition} / {chapterCount||"—"}</div></div><div className={"omQuranGlassDeck omQuranLightDeck "+(turningPage?"omQuranLightShake":"")} onTouchStart={e=>{const t=e.touches[0];swipeStart.current={x:t.clientX,y:t.clientY}}} onTouchEnd={e=>{const st=swipeStart.current;if(!st)return;const t=e.changedTouches[0];if(Math.abs(t.clientX-st.x)>55&&Math.abs(t.clientY-st.y)<100)jump(focusIndex+(t.clientX<st.x?1:-1));swipeStart.current=null}}><div className="omQuranLightField omQuranLightBack" aria-hidden="true" key={chapter+":"+(focusIndex)+"-back"}>{Array.from({length:24},(_,i)=><i key={i} style={{left:((i*37+17)%97)+"%",top:((i*29+9)%91)+"%",animationDelay:((i*0.37)%5)+"s",animationDuration:(3.4+(i%7)*.8)+"s",width:(2+i%4)+"px",height:(2+i%4)+"px"}}/>)}</div><div className="omQuranGlassGhost omQuranGlassGhostLeft" aria-hidden="true"/><div className="omQuranGlassGhost omQuranGlassGhostRight" aria-hidden="true"/>{turningPage&&<div className={"omQuranTurnSheet "+(turningPage.direction==="next"?"omQuranTurnNext":"omQuranTurnPrevious")} aria-hidden="true"><div className="omQuranTurnSheen"/><span className="omQuranTurnNumber">{turningPage.position}</span><p lang="ar" dir="rtl">{turningPage.verse.text_uthmani}</p></div>}<article key={verses[focusIndex]?.verse_key||"loading"} className={"omQuranGlassPage omQuranCollectible "+(spinning?"omQuranRouletteActive":"")} style={{transform:`rotateY(${spinAngle}deg)`}}>
 <div className="omQuranCardFront">
  <div className="omQuranGlassPageHead"><span>{versePosition}</span><button type="button" aria-label="Spin Quran verse card like roulette" className="omQuranFlipAction omQuranRouletteButton" onPointerDown={startCardSpin} onPointerMove={moveCardSpin} onPointerUp={endCardSpin} onPointerCancel={()=>{spinPointer.current=null}}><span className="omQuranRouletteIcon" style={{transform:`rotate(${spinAngle}deg)`}}>⟳</span> Spin</button></div>
  <p lang="ar" dir="rtl" className="omQuranGlassArabic">{(verses[focusIndex]?.text_uthmani||"بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ").split(/\s+/).map((word,i)=><span key={i} className={"omQuranAnnotatedWord "+((verseNotes[verses[focusIndex]?.verse_key||""]?.highlights||[]).includes(i)?"omQuranWordGlow ":"")+((verseNotes[verses[focusIndex]?.verse_key||""]?.underlines||[]).includes(i)?"omQuranWordUnderline":"")}>{word}{" "}</span>)}</p>
  {showTranslation&&<p className="omQuranGlassTranslation">{strip(verses[focusIndex]?.translations?.[0]?.text||"In the name of Allah, the Entirely Merciful, the Especially Merciful.")}</p>}
  <small className="omQuranGlassCitation">— {active?.name_simple||"Al-Fatihah"} ({verses[focusIndex]?.verse_key||"1:1"})</small>
 </div>
 <div className="omQuranCardBack">
  <div className="omQuranCardBackHeader"><strong>✦ My Quran Journey</strong><button type="button" className="omQuranRouletteButton" aria-label="Spin back to Quran verse" onPointerDown={startCardSpin} onPointerMove={moveCardSpin} onPointerUp={endCardSpin} onPointerCancel={()=>{spinPointer.current=null}}><span className="omQuranRouletteIcon" style={{transform:`rotate(${spinAngle}deg)`}}>⟳</span> Spin</button></div>
  <label className="omQuranProjectLabel">Project<input aria-label="Reading project name" value={readingProject} maxLength={80} onChange={e=>{setReadingProject(e.target.value);try{localStorage.setItem("1muslim-quran-reading-project",e.target.value)}catch{}}}/></label>
  <div className="omQuranBackProgress"><span>Verse {versePosition} of {chapterCount||"—"}</span><span>{chapterPercent}% of Surah</span><div><i style={{width:chapterPercent+"%"}}/></div><small>{readCount} of 6,236 verses visited · {quranReadPercent}% of Quran</small></div>
  <label className="omQuranProjectLabel">Private notes<textarea placeholder="What did this verse teach you?" value={verseNotes[verses[focusIndex]?.verse_key||""]?.note||""} onChange={e=>updateVerseNote(verses[focusIndex]?.verse_key||"",{note:e.target.value})}/></label>
  <p className="omQuranMarkHelp">Tap a word to highlight ✨ · Tap its underline button to underline. Your marks glow on the front.</p>
  <div className="omQuranWordEditor" dir="rtl">{(verses[focusIndex]?.text_uthmani||"").split(/\s+/).map((word,i)=><span className="omQuranWordEdit" key={i}><button type="button" aria-label={"Highlight "+word} className={(verseNotes[verses[focusIndex]?.verse_key||""]?.highlights||[]).includes(i)?"marked":""} onClick={()=>toggleWordMark(verses[focusIndex]?.verse_key||"",i,"highlights")}>{word}</button><button type="button" className="omQuranUnderlineAction" aria-label={"Underline "+word} onClick={()=>toggleWordMark(verses[focusIndex]?.verse_key||"",i,"underlines")}>{(verseNotes[verses[focusIndex]?.verse_key||""]?.underlines||[]).includes(i)?"━":"﹏"}</button></span>)}</div>
  <small className="omQuranPrivateLabel">🔒 Saved privately on this device</small>
 </div>
</article><div className="omQuranLightField omQuranLightFront" aria-hidden="true" key={chapter+":"+(focusIndex)+"-front"}>{Array.from({length:9},(_,i)=><i key={i} style={{left:((i*37+11)%97)+"%",top:((i*29+31)%91)+"%",animationDelay:((i*0.37)%5)+"s",animationDuration:(3.4+(i%7)*.8)+"s",width:(2+i%4)+"px",height:(2+i%4)+"px"}}/>)}</div><button type="button" className="omQuranGlassArrow omQuranGlassArrowLeft" onClick={()=>jump(focusIndex-1)} aria-label="Previous verse">‹</button><button type="button" className="omQuranGlassArrow omQuranGlassArrowRight" onClick={()=>jump(focusIndex+1)} aria-label="Next verse">›</button></div><button type="button" className="omQuranCenterOrb" aria-label={chapterCount>0&&versePosition>=chapterCount&&page>=total?"Next Quran chapter":"Next Quran verse"} onClick={()=>{if(chapterCount>0&&versePosition>=chapterCount&&page>=total&&chapter<114){setChapter(chapter+1);setPage(1);setFocusIndex(0);setChapterFinish(false);setOrbOpen(false);setChapterNote("");return}jump(focusIndex+1)}}><img src="/assets/HudHud-Quran.png" alt="" width={48} height={48}/></button>{orbOpen&&<div className="omQuranOrbMenu"><button type="button" onClick={()=>{jump(focusIndex-1);setOrbOpen(false)}}>← Previous verse</button><button type="button" onClick={()=>{jump(focusIndex+1);setOrbOpen(false)}}>Next verse →</button><button type="button" onClick={()=>{setHudhudQuickOpen(true);setOrbOpen(false)}}>✦ Study tools</button><button type="button" onClick={()=>{setChapterFinish(true);setOrbOpen(false)}}>Chapter notes</button></div>}<div className="omQuranDualProgress" aria-label="Quran and chapter reading progress">
 <div className="omQuranDualLabels"><span>✦ {active?.name_simple||"Surah"} · {versePosition}/{chapterCount||"—"}</span><strong>{chapterPercent}%</strong></div>
 <div className="omQuranDualTrack" role="progressbar" aria-label="Current chapter progress" aria-valuemin={0} aria-valuemax={chapterCount||1} aria-valuenow={Math.min(versePosition,chapterCount||1)}><span className="omQuranDualChapterFill" style={{width:chapterPercent+"%"}}/></div>
 <div className="omQuranDualWhole"><span>Entire Quran · {readCount.toLocaleString()}/{totalQuranVerses.toLocaleString()} verses visited</span><strong>{quranReadPercent}%</strong></div>
 <div className="omQuranDualTrack omQuranDualTrackWhole" role="progressbar" aria-label="Entire Quran reading progress" aria-valuemin={0} aria-valuemax={totalQuranVerses} aria-valuenow={readCount}><span className="omQuranDualWholeFill" style={{width:(readCount/totalQuranVerses*100)+"%"}}/></div>
 </div></div>{showFatihahIntro&&chapter===1&&<div className="omQuranIntroCurtain" role="dialog" aria-modal="true" aria-label="Welcome to Al-Fatihah and Quran Studio Read Mode"><div className="omQuranIntroCard"><span className="omQuranIntroEyebrow">✦ QURAN STUDIO · READ MODE</span><h2>Welcome to Al-Fatihah 🌙</h2><p>Al-Fatihah means <strong>The Opening</strong>. These seven verses begin the Quran and are recited in every unit of salah. They teach us to praise Allah, ask for His help, and seek the straight path.</p><p><strong>📖 You're in Read Mode.</strong> Take your time, move verse by verse, and turn a verse card over to keep private notes and highlight words.</p><p><strong>🏠 Want the full Quran Studio?</strong> Tap <em>Quran Home</em> at the top to explore the wider Studio experience. You can return to Read Mode anytime.</p><div className="omQuranIntroActions"><button type="button" onClick={dismissFatihahIntro}>Bismillah · Start Reading →</button><Link href="/elm-tent" onClick={dismissFatihahIntro}>⌂ Quran Home</Link></div><small>One introduction, shown on your first visit to Al-Fatihah.</small></div></div>}{chapterFinish&&<div className="omQuranChapterCurtain" role="dialog" aria-modal="true" aria-label="Chapter reflection"><div className="omQuranChapterBlackPage"><span>✦ CHAPTER COMPLETE</span><h2>{chapter===1?"Congratulations! Your first chapter is complete!":"MashaAllah! Chapter "+chapter+" complete!"}</h2><p>{milestoneCheer}</p>{chapter<114?<><p><strong>📖 Coming next</strong><br/>{milestonePreview}</p><p><strong>💭 Think about it</strong><br/>{milestoneQuestion}</p></>:<p>You have reached the final surah. Reflect on your journey and revisit the verses that moved you most.</p>}<small>{active?.name_simple||"Surah"} · {chapter} · {chapterCount} verses</small><textarea aria-label="Chapter notes" placeholder="What did you learn or want to remember?" value={chapterNote} onChange={e=>setChapterNote(e.target.value)}/><div className="omQuranChapterActions"><button onClick={()=>{try{localStorage.setItem("1muslim-chapter-note-"+chapter,chapterNote)}catch{}setChapterFinish(false)}}>Save note</button><button onClick={async()=>{if(navigator.share){try{await navigator.share({title:active?.name_simple||"Quran",text:chapterNote||"Reflecting on Surah "+(active?.name_simple||chapter),url:window.location.href})}catch{}}else if(navigator.clipboard){await navigator.clipboard.writeText(window.location.href)}}}>Share ↗</button><button onClick={()=>{if(chapter<114){setChapter(chapter+1);setPage(1);setFocusIndex(0);setChapterNote("")}setChapterFinish(false)}}>{chapter===1?"Let’s Go → Al-Baqarah":chapter<114?"Next chapter →":"Finish Qur'an ✓"}</button><button onClick={()=>setChapterFinish(false)}>Return to verse</button></div></div></div>}<div className="omQuranAtmosphere" style={{transform:`translate3d(${backdropOffset.x}px,${backdropOffset.y}px,0)`}} onPointerDown={e=>{if(e.pointerType==="mouse"&&e.button!==0)return;backdropStart.current={x:e.clientX,y:e.clientY,ox:backdropOffset.x,oy:backdropOffset.y};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(!backdropStart.current)return;setBackdropOffset({x:Math.max(-95,Math.min(95,backdropStart.current.ox+(e.clientX-backdropStart.current.x)*.45)),y:Math.max(-90,Math.min(90,backdropStart.current.oy+(e.clientY-backdropStart.current.y)*.45))})}} onPointerUp={()=>{backdropStart.current=null}} onPointerCancel={()=>{backdropStart.current=null}} aria-hidden="true"><div className="omQuranAtmosphereOrb omQuranAtmosphereOrbA"/><div className="omQuranAtmosphereOrb omQuranAtmosphereOrbB"/></div><QuranFloatingSearch chapters={chapters} onSelect={navigateVerse}/><div className="omQuranMarkerToolbar"><span>✦ Verse layers</span><button type="button" onClick={addVerseMarker} aria-label="Add glowing marker">＋ Marker</button><button type="button" onClick={undoVerseMarker} disabled={!(verseMarkers[activeVerseKey]||[]).length} aria-label="Undo last marker">↶ Undo</button><label>Size <input aria-label="Marker size" type="range" min="24" max="110" value={markerSize} onChange={e=>setMarkerSize(Number(e.target.value))}/></label><button type="button" onClick={()=>setHudhudMode(v=>!v)}>{hudhudMode?"⤢ Exit HudHud":"⛶ HudHud fullscreen"}</button></div><div className="omQuranAppOverview"><div><small>QURAN STUDIO · SWIPE TO READ</small><strong>{active?.name_simple||"Qur'an"} <span>{verses[focusIndex]?.verse_key||chapter+":"+versePosition}</span></strong><p>One verse at a time · Swipe left or right to explore</p></div><button type="button" onClick={()=>setCompactStudio(v=>!v)} aria-pressed={compactStudio}>{compactStudio?"☷ Overview":"✦ Focus"}</button></div><div className="omQuranTitle"><div><span>Surah {chapter}</span><h2>{active?.name_simple||"Qur'an"} <small lang="ar" dir="rtl">{active?.name_arabic}</small></h2></div><label><input type="checkbox" checked={showTranslation} onChange={e=>setShowTranslation(e.target.checked)}/> Translation</label></div><div className="omQuranJourneyCards" aria-label="Quran completion dashboard"><div className="omQuranCompletionCard"><div className="omQuranRing" style={{"--progress":quranReadPercent+"%"} as React.CSSProperties}><div><span>📖</span><strong>{quranReadPercent}%</strong><small>Qur’an explored</small></div></div><p><strong>{readCount.toLocaleString()} / {totalQuranVerses.toLocaleString()}</strong> ayat visited on this device</p></div><div className="omQuranCompletionCard"><div className="omQuranRing omQuranRingChapter" style={{"--progress":chapterReadPercent+"%"} as React.CSSProperties}><div><span>✦</span><strong>{chapterReadPercent}%</strong><small>Chapter completed</small></div></div><p><strong>{chapterReadCount} / {chapterCount||"…"}</strong> ayat visited · {active?.name_simple||"Surah"}</p></div></div><div className="omFocusTracker" aria-label="Live reading progress"><div className="omFocusTop"><span>✦ YOUR READING JOURNEY</span><strong>{chapterPercent}% of this surah</strong></div><div className="omFocusTrack" role="progressbar" aria-valuenow={versePosition} aria-valuemin={0} aria-valuemax={chapterCount||1} aria-label="Verses reached in current surah"><span style={{width:chapterPercent+"%"}}/></div><div className="omFocusTimeline">{previousTopics.map(v=><button key={v.verse_key} onClick={()=>jump(verses.findIndex(x=>x.verse_key===v.verse_key))}>↶ {v.verse_key}<small>Earlier verse</small></button>)}<div className="omFocusCurrent"><span>NOW READING</span><strong>{verses[focusIndex]?.verse_key||chapter+":1"}</strong><small>{versePosition} of {chapterCount||"…"} ayat · {Object.keys(visited).length} visited this session</small></div><div className="omFocusNav" data-mode={hudhudMode?"hudhud":"normal"}><button type="button" onClick={()=>jump(focusIndex-1)} disabled={focusIndex===0&&page===1} aria-label="Previous verse">↑</button><button type="button" onClick={()=>jump(focusIndex+1)} disabled={focusIndex===verses.length-1&&page===total} aria-label="Next verse">↓</button></div></div></div><div className="omHudhudQuickWrap"><button type="button" className={"omHudhudQuickButton "+(hudhudQuickOpen?"is-open":"")} onClick={()=>setHudhudQuickOpen(v=>!v)} aria-expanded={hudhudQuickOpen} aria-controls="omHudhudQuickPanel" aria-label="HudHud Quran Studio controls">✦ <span>HudHud</span></button>{hudhudQuickOpen&&<div id="omHudhudQuickPanel" className="omHudhudQuickPanel" role="region" aria-label="HudHud Quran Studio controls"><div className="omHudhudQuickHead"><strong>✦ HudHud · Quran Studio</strong><button type="button" onClick={()=>setHudhudQuickOpen(false)} aria-label="Close HudHud controls">×</button></div><div key={hudhudQuickPage} className="omHudhudQuickSlide"><small>{hudhudQuickPage+1} / {hudhudQuickPages.length}</small><h3>{hudhudQuickPages[hudhudQuickPage].title}</h3><p>{hudhudQuickPages[hudhudQuickPage].detail}</p></div><div className="omHudhudQuickActions"><button type="button" onClick={()=>setHudhudQuickPage(p=>(p+hudhudQuickPages.length-1)%hudhudQuickPages.length)}>← Tip</button><button type="button" onClick={()=>jump(focusIndex-1)} disabled={focusIndex===0&&page===1}>↑ Verse</button><button type="button" onClick={()=>jump(focusIndex+1)} disabled={focusIndex===verses.length-1&&page===total}>↓ Verse</button><button type="button" onClick={()=>setHudhudQuickPage(p=>(p+1)%hudhudQuickPages.length)}>Tip →</button></div><button type="button" className="omHudhudQuickVision" onClick={()=>{setHudhudMode(v=>!v);window.dispatchEvent(new Event("1muslim:hudhud-vision-enable"))}}>✧ HudHud reading glow {hudhudMode?"ON":"OFF"}</button><div className="omHudhudQuickLinks"><Link href="/elm-tent/lessons">Lessons ↗</Link><Link href="/messages">Messages ↗</Link><Link href="/streaming">Live ↗</Link></div></div>}</div><ReadingAtmosphere verse={verses[focusIndex]?.verse_key||chapter+":"+versePosition} arabic={verses[focusIndex]?.text_uthmani||""}/><ElmiVerseMoment/><HudHudQuranText/><HudHudHomeIntro/><HudHudVision activeVerse={verses[focusIndex]?.verse_key||chapter+":"+versePosition} onNavigate={navigateVerse} onModeChange={setHudhudMode}/>{error&&<p role="alert">{error}</p>}{busy?<p>Loading verses…</p>:verses.filter((_,i)=>i===focusIndex).map((v)=><div className="omQuranThreeLayer" key={v.verse_key}><div className="omQuranLayer omQuranLayerBack" aria-hidden="true"/><div className="omQuranLayer omQuranLayerMid" aria-hidden="true"/><article className={"omAyahCard omVerseTransition omAyahFocused omQuranFloatingVerse "+(compactStudio?"omQuranFloatingVerse--focus":"")} onTouchStart={e=>{const t=e.touches[0];swipeStart.current={x:t.clientX,y:t.clientY}}} onTouchEnd={e=>{const start=swipeStart.current;swipeStart.current=null;if(!start)return;const t=e.changedTouches[0];const dx=t.clientX-start.x,dy=t.clientY-start.y;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.4)jump(focusIndex+(dx<0?1:-1))}} data-verse-index={focusIndex} key={v.verse_key}><div className="omQuranMarkerCanvas">{(verseMarkers[v.verse_key]||[]).map(m=><button key={m.id} type="button" className="omQuranGlowMarker" aria-label={"Drag marker "+m.id} style={{left:m.x+"%",top:m.y+"%",width:m.size,height:m.size}} onPointerDown={e=>{e.stopPropagation();markerDrag.current={id:m.id,x:e.clientX,y:e.clientY,startX:m.x,startY:m.y,key:v.verse_key};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{const d=markerDrag.current;if(!d||d.id!==m.id)return;const rect=e.currentTarget.parentElement?.getBoundingClientRect();if(!rect)return;moveVerseMarker(m.id,d.startX+(e.clientX-d.x)/rect.width*100,d.startY+(e.clientY-d.y)/rect.height*100,d.key)}} onPointerUp={()=>{markerDrag.current=null}} onPointerCancel={()=>{markerDrag.current=null}}>✦</button>)}</div><div className="omAyahMeta"><strong>{v.verse_key}</strong><a href={"https://quran.com/"+v.verse_key} target="_blank" rel="noopener noreferrer">Study ↗</a></div><InlineAnnotations verse={v.verse_key} words={v.words} text={v.text_uthmani}/>{Boolean(v.words?.length)&&<div className="omQuranWordExplorer"><div className="omWordExplorerHeader"><strong>✧ Word Explorer</strong><small>Tap an Arabic word to explore it</small></div><div className="omWordChips" dir="rtl">{v.words?.filter(w=>w.text_uthmani).map(w=><button type="button" key={w.id} className={selectedWord?.id===w.id?"selected":""} onClick={()=>{setSelectedWord(w);setWordPanel("meaning")}} lang="ar">{w.text_uthmani}</button>)}</div>{selectedWord&&<div className="omWordDetail"><strong lang="ar" dir="rtl">{selectedWord.text_uthmani}</strong><span>{selectedWord.transliteration?.text||""}</span><div className="omWordTabs"><button className={wordPanel==="meaning"?"active":""} onClick={()=>setWordPanel("meaning")}>Meaning</button><button className={wordPanel==="root"?"active":""} onClick={()=>setWordPanel("root")}>Root</button><button className={wordPanel==="usage"?"active":""} onClick={()=>setWordPanel("usage")}>Usage</button></div><p>{wordPanel==="meaning"?(selectedWord.translation?.text||"Translation unavailable for this word."):"Verified root and usage data are not yet available for this word. Open the source for detailed linguistic study."}</p><a href={"https://quran.com/"+v.verse_key} target="_blank" rel="noopener noreferrer">Explore verse and context ↗</a></div>}</div>}{showTranslation&&<p className="omAyahEnglish">{strip(v.translations?.[0]?.text||"Translation not available.")}</p>}<div className="omAyahActions"><button onClick={()=>{const url="https://quran.com/"+v.verse_key;if(navigator.share)void navigator.share({title:"Qur'an "+v.verse_key,url}).catch(()=>{});else void navigator.clipboard.writeText(url)}}>↗ Share verse</button><a href={"https://quran.com/"+v.verse_key} target="_blank" rel="noopener noreferrer">📖 Read & listen</a></div><VerseEngagement verse={v.verse_key} onShare={()=>setShareVerse(v)}/><div className="omVerseLearningGrid"><div className="omVerseLearningMain"><VerseStudio verse={v.verse_key}/><VerseRecorder verse={v.verse_key}/><VerseDMShare verse={v.verse_key}/></div><VerseMediaTips verse={v.verse_key}/></div></article></div>)}</section></div>{shareVerse&&<VersePostStudio verse={shareVerse.verse_key} arabic={shareVerse.text_uthmani||shareVerse.words?.map(w=>w.text_uthmani||"").join(" ")||""} translation={shareVerse.translations?.[0]?.text||""} onClose={()=>setShareVerse(null)}/>}</div><style jsx global>{` .omQuranPage .omQuranDualProgress{flex:0 0 auto;width:min(90%,640px);margin:5px auto 8px;color:#e5ddff;font-size:11px;pointer-events:none}.omQuranPage .omQuranDualLabels,.omQuranPage .omQuranDualWhole{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 5px;letter-spacing:.02em}.omQuranPage .omQuranDualWhole{margin:8px 0 5px;color:#b8b7d6;font-size:10px}.omQuranPage .omQuranDualLabels strong{color:#b895ff}.omQuranPage .omQuranDualWhole strong{color:#67d3ef}.omQuranPage .omQuranDualTrack{height:7px;border-radius:20px;background:#42375eaa;overflow:hidden;box-shadow:inset 0 0 8px #08071a}.omQuranPage .omQuranDualTrack span{display:block;height:100%;border-radius:inherit;transition:width .65s cubic-bezier(.2,.8,.2,1)}.omQuranPage .omQuranDualChapterFill{background:linear-gradient(90deg,#a465ff,#d6a4ff);box-shadow:0 0 12px #a465ff}.omQuranPage .omQuranDualTrackWhole{height:4px;background:#213e49aa}.omQuranPage .omQuranDualWholeFill{background:linear-gradient(90deg,#218e9e,#50d3f6);box-shadow:0 0 10px #50d3f6}@media(prefers-reduced-motion:reduce){.omQuranPage .omQuranDualTrack span{transition:none}}
/* Immersive Quran glass-page foundation: reader owns the mobile viewport. */
@media(max-width:760px){
body:has(.omQuranPage){overflow:hidden!important}
body:has(.omQuranPage) nav:not(.omQuranGlassControls),body:has(.omQuranPage) [class*="bottomNav"],body:has(.omQuranPage) [class*="BottomNav"],body:has(.omQuranPage) [class*="XPTracker"],body:has(.omQuranPage) [class*="xpTracker"],body:has(.omQuranPage) [class*="hudhud-live-mini"]{display:none!important}
.omQuranPage{position:fixed!important;inset:0!important;z-index:999!important;overflow:hidden!important;background:radial-gradient(ellipse at 75% 19%,#644eab60,transparent 36%),linear-gradient(180deg,#080c26 0%,#10163c 48%,#070a20 100%)!important}
.omQuranPage .omQuranShell,.omQuranPage .omQuranLayout,.omQuranPage .omQuranVerses.omQuranAppStage{display:contents!important}
.omQuranPage .omQuranHero,.omQuranPage .omQuranSidebar,.omQuranPage .omQuranAppStage>:not(.omQuranFirstReader){display:none!important}
.omQuranPage .omQuranFirstReader{display:flex!important;flex-direction:column;position:absolute;inset:max(10px,env(safe-area-inset-top)) 0 max(8px,env(safe-area-inset-bottom))!important;padding:10px 0 8px!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:transparent!important;overflow:hidden!important;gap:8px!important}
.omQuranPage .omQuranGlassTop{display:flex;align-items:center;justify-content:center;gap:12px;padding:4px 17px;flex:0 0 auto}
.omQuranPage .omQuranGlassTop select{max-width:60%;border:1px solid #b49ce388;border-radius:99px;background:#0d1132e8;color:white;padding:10px 15px;font-size:16px;text-align:center}
.omQuranPage .omQuranGlassTop>span{color:#c3c8e8;font-size:13px}.omQuranPage .omQuranGlassTop button{margin-left:auto;background:#151b43d9;border:1px solid #7f75bd88;border-radius:50%;width:42px;height:42px;display:grid;place-items:center}
.omQuranPage .omQuranGlassDeck{position:relative;flex:1;min-height:0;display:flex;align-items:center;justify-content:center;isolation:isolate;padding:10px 31px}
.omQuranPage .omQuranGlassGhost{position:absolute;top:7%;bottom:7%;width:35%;border:1px solid #c2a9ff80;border-radius:25px;background:linear-gradient(145deg,#8777ba55,#193e6b55);backdrop-filter:blur(16px);box-shadow:0 0 25px #8a69d133}
.omQuranPage .omQuranGlassGhostLeft{left:1%;transform:perspective(600px) rotateY(17deg) scale(.95)}.omQuranPage .omQuranGlassGhostRight{right:1%;transform:perspective(600px) rotateY(-17deg) scale(.95)}
.omQuranPage .omQuranGlassPage{position:relative;z-index:2;width:100%;height:min(100%,680px);display:flex;flex-direction:column;justify-content:space-between;gap:10px;padding:18px 19px 24px;border:1px solid #d6b3ffd9;border-radius:27px;background:linear-gradient(145deg,#1e2446c7,#111f41bd 50%,#25214ebf);backdrop-filter:blur(25px) saturate(1.4);-webkit-backdrop-filter:blur(25px) saturate(1.4);box-shadow:0 0 0 1px #ffffff1a,inset 0 1px 18px #fff2,0 0 38px #9c64dd55,0 30px 75px #0009;animation:omGlassVerseEnter .36s ease-out both;overflow:auto;scrollbar-width:none}
.omQuranPage .omQuranGlassPageHead{display:flex;justify-content:space-between;align-items:center}.omQuranPage .omQuranGlassPageHead span{border:1px solid #e2c8ff8c;border-radius:50%;width:41px;height:41px;display:grid;place-items:center;background:#ffffff16}.omQuranPage .omQuranGlassPageHead button{border:0;background:#6549bd88;border-radius:14px;color:white;font-size:26px;padding:4px 10px}
.omQuranPage .omQuranGlassArabic{font-family:serif;font-size:clamp(27px,7vw,40px);line-height:2.05;text-align:center;margin:auto 0;color:#fff;text-shadow:0 2px 16px #c7aaff55;overflow-wrap:anywhere}
.omQuranPage .omQuranGlassTranslation{font-size:clamp(14px,3.8vw,18px);line-height:1.55;color:#f2efff;margin:0;max-height:28%;overflow:auto}
.omQuranPage .omQuranGlassCitation{text-align:right;color:#d6c9ed;font-size:12px}
.omQuranPage .omQuranGlassArrow{position:absolute;z-index:3;top:50%;transform:translateY(-50%);height:49px;width:37px;border:1px solid #a4bfff9c;border-radius:50%;background:#20264da8;color:white;font-size:35px;line-height:1}.omQuranPage .omQuranGlassArrowLeft{left:1px}.omQuranPage .omQuranGlassArrowRight{right:1px}
.omQuranPage .omQuranGlassControls{flex:0 0 59px;display:flex;align-items:center;justify-content:space-evenly;gap:3px;padding:0 8px}.omQuranPage .omQuranGlassControls button{background:#0b1033aa;color:#fff;border:1px solid #7774b077;border-radius:50%;width:39px;height:39px;font-size:19px}.omQuranPage .omQuranGlassControls .omQuranGlassPlay{height:55px;width:55px;border-color:#b895ff;box-shadow:0 0 18px #ad70ff66;font-size:23px}.omQuranPage .omQuranGlassControls span{color:#c6c3e9;font-size:12px;white-space:nowrap}.omQuranPage .omQuranGlassProgress{flex:0 0 3px;margin:0 28px;background:#38375e;border-radius:4px;overflow:hidden}.omQuranPage .omQuranGlassProgress span{display:block;height:100%;background:linear-gradient(90deg,#a465ff,#50d3f6);transition:width .45s ease}
@keyframes omGlassVerseEnter{from{opacity:.55;transform:translateX(24px) scale(.96)}to{opacity:1;transform:translateX(0) scale(1)}}
}
@media(max-width:760px){.omQuranPage .omQuranShell{padding-top:4px!important}.omQuranPage .omQuranHero{display:none!important}.omQuranPage .omQuranLayout{display:flex!important;flex-direction:column!important;gap:8px!important}.omQuranPage .omQuranSidebar{order:2!important}.omQuranPage .omQuranAppStage{order:1!important;display:flex!important;flex-direction:column!important;padding:10px!important;gap:12px!important}.omQuranPage .omQuranAppStage>.omQuranFirstReader{order:-100!important}.omQuranPage .omQuranAppStage>.omQuranAtmosphere{pointer-events:none!important}.omQuranPage .omQuranAppStage>.omQuranThreeLayer{order:-90!important}.omQuranPage .omQuranAppStage>.omQuranJourneyCards{order:-80!important}.omQuranPage .omQuranAppStage>.omFocusTracker{order:-79!important}.omQuranPage .omQuranAppStage>.omQuranAppOverview{order:20!important}.omQuranPage .omQuranAppStage>.omQuranMarkerToolbar{order:30!important}.omQuranPage .omQuranFirstReader{display:block;padding:15px 13px 17px;border:1px solid #9e7bfa80;border-radius:27px;background:radial-gradient(ellipse at 70% 5%,#5134a359,transparent 65%),linear-gradient(160deg,#0c1732f5,#08162df9);box-shadow:inset 0 1px #ffffff26,0 12px 38px #03050e99;color:#fff;overflow:hidden}.omQuranFirstHeader{display:flex;align-items:center;gap:9px;font-size:11px;letter-spacing:.12em;color:#b4d6fa}.omQuranFirstHeader strong{margin-left:auto;letter-spacing:0;font-size:12px;color:#fff}.omQuranFirstProgress{height:4px;border-radius:5px;background:#3c3a67;margin:13px 0 18px;overflow:hidden}.omQuranFirstProgress span{display:block;height:100%;background:linear-gradient(90deg,#7b58ef,#42d9f4);transition:width .45s ease}.omQuranFirstDeck{position:relative;padding-right:21px}.omQuranFirstVerse{border:1px solid #c8a4ff66;border-radius:24px;padding:18px 14px 22px;min-height:220px;background:linear-gradient(140deg,#151c42dc,#092739d9);box-shadow:0 9px 30px #0005,inset 0 1px #fff2;transition:transform .4s ease}.omQuranFirstBadge{display:inline-block;border:1px solid #a18ad777;border-radius:15px;padding:5px 10px;color:#c9b8ff;font-size:12px}.omQuranFirstVerse p{font-family:serif;font-size:clamp(31px,8vw,43px);line-height:2.1;text-align:center;margin:8px 0;color:#fff}.omQuranFirstVerse small{display:block;text-align:center;color:#c8d6f0}.omQuranNextPeek{position:absolute;right:-8px;top:21px;bottom:21px;width:18px;border:1px solid #a48ef5;border-radius:0 14px 14px 0;background:linear-gradient(#6440ba,#165a8d);box-shadow:0 0 16px #865aff55;writing-mode:vertical-rl;overflow:hidden;font-size:8px;color:transparent}.omQuranFirstActions{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:15px}.omQuranFirstActions button{padding:11px 14px;border:1px solid #8767e8;border-radius:999px;background:linear-gradient(120deg,#4930a5,#19528a);color:#fff;font-size:13px}.omQuranFirstActions button:disabled{opacity:.3}.omQuranFirstActions span{font-size:12px;color:#b7c9e5}.omQuranPage .omQuranJourneyCards{margin:2px 0!important}.omQuranPage .omQuranRing{width:95px!important}.omQuranPage .omQuranCompletionCard{padding:9px!important}.omQuranPage .omQuranCompletionCard p{font-size:10px!important}.omQuranPage .omQuranSidebar{max-height:240px;overflow:auto}.omQuranPage .omQuranFirstReader+.omQuranAtmosphere{display:none!important}}@media(min-width:761px){.omQuranFirstReader{display:none!important}}
.omQuranJourneyCards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:16px 0}.omQuranCompletionCard{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:20px 12px;border:1px solid #9278ff77;border-radius:22px;background:radial-gradient(ellipse at 80% 10%,#603d9c55,transparent 70%),linear-gradient(155deg,#0c1432,#10152e);color:#f6f3ff;box-shadow:inset 0 0 20px #ffffff08,0 8px 25px #0003}.omQuranCompletionCard p{margin:0;text-align:center;font-size:12px;color:#c9c8e9}.omQuranCompletionCard p strong{color:#fff}.omQuranRing{--progress:0%;width:min(100%,190px);aspect-ratio:1;border-radius:50%;padding:10px;background:conic-gradient(#39dbf5 0 var(--progress),#343a62 var(--progress) 100%);box-shadow:0 0 26px #39c5f52b}.omQuranRingChapter{background:conic-gradient(#aa78ff 0 var(--progress),#34304f var(--progress) 100%);box-shadow:0 0 26px #aa78ff33}.omQuranRing>div{height:100%;width:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;border-radius:50%;background:#090f25}.omQuranRing span{font-size:28px}.omQuranRing strong{font-size:clamp(25px,4vw,39px);line-height:1.2}.omQuranRing small{font-size:11px;color:#d0d7f2}.omQuranWordExplorer{margin:16px 0;padding:17px;border:1px solid #9870fa77;border-radius:20px;background:linear-gradient(145deg,#131331,#0c2032);color:#f4efff}.omWordExplorerHeader{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}.omWordExplorerHeader small{color:#c4bee0}.omWordChips{display:flex;flex-wrap:wrap;gap:8px;margin:15px 0}.omWordChips button{padding:8px 11px;border:1px solid #9580e355;border-radius:12px;background:#34305b99;color:#fff;font-size:23px;cursor:pointer}.omWordChips button.selected{background:#6c40be;border-color:#c29bff}.omWordDetail{padding:15px;border-radius:15px;background:#0c122c;border:1px solid #a67ff066}.omWordDetail>strong{display:block;font-size:37px}.omWordDetail>span{display:block;color:#b5d8ed}.omWordTabs{display:flex;gap:6px;margin-top:13px}.omWordTabs button{flex:1;padding:9px 5px;border:0;border-radius:12px;background:#252748;color:#eae5ff;cursor:pointer}.omWordTabs button.active{background:linear-gradient(100deg,#7442c5,#4549a9);color:#fff}.omWordDetail p{color:#d9d4e9;font-size:14px}.omWordDetail a{color:#94dafa}@media(max-width:480px){.omQuranJourneyCards{gap:8px}.omQuranCompletionCard{padding:12px 6px}.omQuranRing{width:min(100%,145px);padding:8px}.omQuranRing span{font-size:23px}.omQuranRing small{font-size:10px}.omQuranCompletionCard p{font-size:10px}}

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
`}
</style><style>{`
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
/* Quran reader: viewport-filling glass pages refinement */
@media(max-width:760px){
.omQuranPage{position:fixed!important;inset:0!important;height:100dvh!important;overflow:hidden!important;padding:0!important;z-index:999!important}
.omQuranPage .omQuranFirstReader{display:flex!important;position:fixed!important;inset:0!important;height:100dvh!important;box-sizing:border-box!important;padding:max(12px,env(safe-area-inset-top)) 0 max(12px,env(safe-area-inset-bottom))!important;gap:6px!important;border:0!important;border-radius:0!important;background:transparent!important;overflow:hidden!important}
.omQuranPage .omQuranGlassTop{flex:0 0 52px!important}
.omQuranPage .omQuranGlassDeck{flex:1 1 auto!important;min-height:0!important;height:auto!important;padding:3px 23px!important;align-items:stretch!important}
.omQuranPage .omQuranGlassPage{height:100%!important;max-height:none!important;min-height:0!important;box-sizing:border-box!important;padding:22px 22px 25px!important;justify-content:space-between!important;border-radius:27px!important}
.omQuranPage .omQuranGlassGhost{top:4%!important;bottom:4%!important}
.omQuranPage .omQuranGlassArabic{flex:1 1 auto!important;display:flex!important;align-items:center!important;justify-content:center!important;min-height:0!important;font-size:clamp(29px,7.3vw,43px)!important;line-height:2.1!important;margin:6px 0!important;overflow-y:auto!important;overflow-wrap:anywhere!important}
.omQuranPage .omQuranGlassTranslation{flex:0 0 auto!important;max-height:28%!important;overflow-y:auto!important;font-size:clamp(15px,3.9vw,19px)!important;line-height:1.65!important}
.omQuranPage .omQuranGlassControls{flex:0 0 66px!important}
.omQuranPage .omQuranGlassProgress{flex:0 0 4px!important;margin-bottom:4px!important}
.omQuranPage .omQuranGlassArrow{top:50%!important}
.omQuranPage .omQuranLegalNote,.omQuranPage .omQuranDisclaimer{display:none!important}
}


@media(max-width:760px){
.omQuranPage .omQuranGlassPage{animation:omGlassVerseEnter .4s ease-out both,omQuranFloat 6s ease-in-out .4s infinite!important;transform-origin:center center}
.omQuranPage .omQuranGlassDeck{padding-bottom:7px!important}
.omQuranPage .omQuranGlassControls{padding-bottom:8px!important}
.omQuranPage .omQuranCenterOrb{position:absolute;bottom:15px;left:50%;transform:translateX(-50%);z-index:12;width:58px;height:58px;display:grid;place-items:center;border:1px solid #b4a0ff;border-radius:50%;background:#12152de8;box-shadow:0 0 22px #9b72ff77;cursor:pointer;animation:omOrbBreath 5s ease-in-out infinite}
.omQuranPage .omQuranCenterOrb img{width:46px;height:46px;object-fit:contain}
.omQuranPage .omQuranGlassControls{padding-bottom:65px!important;flex-basis:120px!important}
.omQuranPage .omQuranOrbMenu{position:absolute;z-index:13;bottom:84px;left:50%;transform:translateX(-50%);width:min(270px,85vw);display:grid;gap:7px;padding:13px;border:1px solid #a88bfa;border-radius:20px;background:#10132de9;backdrop-filter:blur(22px)}
.omQuranPage .omQuranOrbMenu button{border:1px solid #9d86de66;border-radius:12px;background:#ffffff12;color:white;padding:12px}
.omQuranPage .omQuranChapterCurtain{position:fixed;inset:0;z-index:30;display:grid;place-items:center;padding:22px;background:#000d;animation:omBlackPageIn .5s ease both}
.omQuranPage .omQuranChapterBlackPage{width:100%;max-width:470px;min-height:65dvh;padding:26px 22px;border:1px solid #9b83c5;border-radius:26px;background:linear-gradient(140deg,#030307,#0d0a17);box-shadow:0 0 55px #a46bfa44;color:#fff;display:flex;flex-direction:column;gap:17px}
.omQuranPage .omQuranChapterBlackPage>span{color:#bda7e9;letter-spacing:.15em;font-size:12px}
.omQuranPage .omQuranChapterBlackPage textarea{flex:1;min-height:140px;resize:vertical;border:1px solid #695783;border-radius:15px;background:#ffffff0b;color:#fff;padding:15px;font:inherit}
.omQuranPage .omQuranChapterActions{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.omQuranPage .omQuranChapterActions button{border:1px solid #8e79b4;border-radius:13px;background:#221a39;color:white;padding:12px 7px}
@keyframes omQuranFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes omOrbBreath{0%,100%{box-shadow:0 0 14px #9b72ff66}50%{box-shadow:0 0 30px #9b72ffbb}}
@keyframes omBlackPageIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}
}
@media(prefers-reduced-motion:reduce){.omQuranPage .omQuranGlassPage,.omQuranPage .omQuranCenterOrb{animation:none!important}}

/* Full-screen Quran Studio: no site header; compact floating studio navigation. */
body:has(.omQuranPage){overflow:hidden!important}
body:has(.omQuranPage) header:has(nav),body:has(.omQuranPage) [class*="bottomNav"],body:has(.omQuranPage) [class*="BottomNav"]{display:none!important}
.omQuranPage{position:fixed!important;inset:0!important;width:100%!important;height:100dvh!important;overflow:hidden!important;z-index:999!important}
.omQuranPage .omQuranStudioExit{display:inline-flex!important;align-items:center;gap:4px;flex:0 0 auto;text-decoration:none;color:#e7ddff;font-size:14px;border:1px solid #a897d288;background:#10132ac9;border-radius:99px;padding:8px 11px;white-space:nowrap}
.omQuranPage .omQuranStudioSettings{flex:0 0 37px!important;width:37px!important;height:37px!important;margin-left:0!important;border-radius:50%!important;color:#fff!important;font-size:25px!important}
@media(max-width:760px){
.omQuranPage .omQuranFirstReader{top:0!important;bottom:0!important;padding-top:max(8px,env(safe-area-inset-top))!important}
.omQuranPage .omQuranGlassTop{flex:0 0 44px!important;gap:8px!important;padding:0 12px!important;justify-content:space-between!important}
.omQuranPage .omQuranGlassTop select{min-width:0!important;max-width:50%!important;flex:1 1 auto!important;padding:8px!important;font-size:14px!important}
.omQuranPage .omQuranGlassTop>span{flex:0 0 auto!important;white-space:nowrap!important}
.omQuranPage .omQuranGlassDeck{flex:1 1 auto!important;min-height:0!important}
}

/* Refined page transition: reveal the destination immediately under a lightweight departing sheet. */
.omQuranPage .omQuranGlassDeck{perspective:1600px;transform-style:preserve-3d}
.omQuranPage .omQuranTurnSheet{position:absolute;z-index:8;inset:3px 23px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:20px;padding:25px;border:1px solid #d4b8ff9c;border-radius:27px;background:linear-gradient(115deg,#252748f0,#17203ff0 55%,#2c2850f0);box-shadow:0 12px 35px #0006;backface-visibility:hidden;transform-style:preserve-3d;overflow:hidden;pointer-events:none;will-change:transform,opacity}
.omQuranPage .omQuranTurnSheet p{color:#fff;text-align:center;font-size:clamp(28px,6.5vw,44px);line-height:2;max-height:65%;overflow:hidden}
.omQuranPage .omQuranTurnNumber{position:absolute;top:25px;left:25px;border:1px solid #c8b7ff88;border-radius:50%;width:40px;height:40px;display:grid;place-items:center;color:white}
.omQuranPage .omQuranTurnNext{transform-origin:right center;animation:omQuranTurnRTL .52s cubic-bezier(.22,.68,.25,1) both}
.omQuranPage .omQuranTurnPrevious{transform-origin:left center;animation:omQuranTurnLTR .52s cubic-bezier(.22,.68,.25,1) both}
.omQuranPage .omQuranTurnSheen{position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,#ddd0ff12 53%,transparent 68%);pointer-events:none}
@keyframes omQuranTurnRTL{0%{transform:rotateY(0) translateZ(1px);opacity:1}65%{transform:rotateY(48deg) translateZ(1px);opacity:.75}100%{transform:rotateY(72deg) translateZ(1px);opacity:0}}
@keyframes omQuranTurnLTR{0%{transform:rotateY(0) translateZ(1px);opacity:1}65%{transform:rotateY(-48deg) translateZ(1px);opacity:.75}100%{transform:rotateY(-72deg) translateZ(1px);opacity:0}}
@media(prefers-reduced-motion:reduce){.omQuranPage .omQuranTurnSheet{animation:none!important}}

/* Clean reading surface: bottom controls removed; keep the HudHud Orb unchanged. */
@media(max-width:760px){
.omQuranPage .omQuranGlassDeck{flex:1 1 auto!important;min-height:0!important}
.omQuranPage .omQuranGlassProgress{margin-bottom:5px!important}
}

/* Collectible-style rotating verse card, with private notes and word annotations. */
.omQuranPage .omQuranCollectible{transform-style:preserve-3d;transition:transform .72s cubic-bezier(.2,.72,.2,1)!important;animation:none!important;overflow:visible!important;position:relative}
.omQuranPage .omQuranCollectibleFlipped{transform:rotateY(180deg)!important}
.omQuranPage .omQuranCardFront,.omQuranPage .omQuranCardBack{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:space-between;gap:10px;padding:inherit;backface-visibility:hidden;-webkit-backface-visibility:hidden;overflow-y:auto;scrollbar-width:none;border-radius:inherit}
.omQuranPage .omQuranCardBack{transform:rotateY(180deg);justify-content:flex-start;gap:16px;background:linear-gradient(155deg,#211a48fa,#151b3df9 55%,#32204afa);color:#fff;padding:24px}
.omQuranPage .omQuranCardFront{padding:24px}
.omQuranPage .omQuranFlipAction,.omQuranPage .omQuranCardBackHeader button{color:#e8d9ff;background:#694ab266;border:1px solid #bda7f188;border-radius:16px;padding:9px 12px;width:auto;height:auto;font-size:14px}
.omQuranPage .omQuranCardBackHeader{display:flex;align-items:center;justify-content:space-between}
.omQuranPage .omQuranProjectLabel{display:flex;flex-direction:column;gap:7px;font-size:12px;color:#cbbcff}
.omQuranPage .omQuranProjectLabel input,.omQuranPage .omQuranProjectLabel textarea{width:100%;box-sizing:border-box;background:#0c1439b8;border:1px solid #9f83d18a;border-radius:12px;color:white;padding:11px;font:inherit;font-size:15px}
.omQuranPage .omQuranProjectLabel textarea{min-height:95px;resize:vertical}
.omQuranPage .omQuranBackProgress{display:grid;gap:8px;font-size:14px}
.omQuranPage .omQuranBackProgress>div{height:6px;border-radius:99px;background:#ffffff24;overflow:hidden}
.omQuranPage .omQuranBackProgress i{display:block;height:100%;background:linear-gradient(90deg,#a76dff,#65d7ff)}
.omQuranPage .omQuranBackProgress small,.omQuranPage .omQuranPrivateLabel{color:#c9bfe6}
.omQuranPage .omQuranMarkHelp{font-size:12px;color:#bdb4e6;margin:0}
.omQuranPage .omQuranWordEditor{display:flex;flex-wrap:wrap;gap:9px;align-content:flex-start}
.omQuranPage .omQuranWordEdit{display:inline-flex;flex-direction:column;align-items:center;gap:1px}
.omQuranPage .omQuranWordEdit button{border:0;background:#ffffff0c;color:white;border-radius:8px;padding:5px;font-size:clamp(19px,4.5vw,26px)}
.omQuranPage .omQuranWordEdit button.marked{background:#b978ff66;text-shadow:0 0 12px #cba6ff}
.omQuranPage .omQuranWordEdit .omQuranUnderlineAction{font-size:16px;padding:0 12px;color:#83d9ff}
.omQuranPage .omQuranAnnotatedWord{display:inline;white-space:pre-wrap}
.omQuranPage .omQuranWordGlow{background:#ae7cff23;text-shadow:0 0 13px #c09aff,0 0 24px #8c6dff;animation:omQuranWordPulse 4s ease-in-out infinite}
.omQuranPage .omQuranWordUnderline{text-decoration:underline;text-decoration-color:#75d8ff;text-decoration-thickness:2px;text-underline-offset:9px}
@keyframes omQuranWordPulse{50%{text-shadow:0 0 5px #aa85ff,0 0 15px #8c6dff}}
@media(prefers-reduced-motion:reduce){.omQuranPage .omQuranCollectible{transition:none!important}.omQuranPage .omQuranWordGlow{animation:none!important}}

/* First-time Al-Fatihah welcome: immersive and dismissible, without changing reading controls. */
.omQuranPage .omQuranIntroCurtain{position:fixed;inset:0;z-index:10030;display:flex;align-items:center;justify-content:center;padding:22px;background:#050719e8;backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
.omQuranPage .omQuranIntroCard{width:min(100%,520px);max-height:calc(100dvh - 55px);overflow-y:auto;display:flex;flex-direction:column;gap:15px;padding:clamp(23px,5vw,35px);border:1px solid #b89bfaad;border-radius:28px;background:linear-gradient(145deg,#1d1a43,#101e42 65%,#251a43);color:#f3edff;box-shadow:0 0 65px #7d54d655,0 30px 90px #0009;animation:omQuranIntroEnter .48s ease-out both}
.omQuranPage .omQuranIntroEyebrow{font-size:11px;letter-spacing:.2em;color:#c5a8ff;font-weight:800}
.omQuranPage .omQuranIntroCard h2{font-size:clamp(27px,7vw,37px);line-height:1.15;margin:0}
.omQuranPage .omQuranIntroCard p{font-size:15px;line-height:1.7;margin:0;color:#ddd9f4}
.omQuranPage .omQuranIntroCard strong{color:white}
.omQuranPage .omQuranIntroActions{display:flex;flex-wrap:wrap;gap:10px;margin-top:6px}
.omQuranPage .omQuranIntroActions button,.omQuranPage .omQuranIntroActions a{display:inline-flex;align-items:center;justify-content:center;min-height:46px;border-radius:15px;padding:11px 17px;text-decoration:none;color:white;font-size:14px;font-weight:750;border:1px solid #aa94e0;background:linear-gradient(115deg,#7349bd,#3357b2);cursor:pointer}
.omQuranPage .omQuranIntroActions a{background:#ffffff12}
.omQuranPage .omQuranIntroCard small{color:#b9b0d8}
@keyframes omQuranIntroEnter{from{opacity:0;transform:translateY(18px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
@media(prefers-reduced-motion:reduce){.omQuranPage .omQuranIntroCard{animation:none}}

/* Quran Studio: simple reading by default; existing glass cards only in HudHud Mode. */
.omQuranPage .omQuranSimpleReader{display:none}
.omQuranPage .omQuranModeOrb{position:fixed;z-index:1005;right:12px;top:39%;width:69px;min-height:72px;border:1px solid #a8bfff;border-radius:20px;background:#11152cd9;box-shadow:0 0 23px #8e61ff80;display:flex;align-items:center;flex-direction:column;justify-content:center;gap:2px;touch-action:none;cursor:grab;color:#e7dfff;font-size:9px;font-weight:700;user-select:none}
.omQuranPage .omQuranModeOrb img{width:45px;height:45px;object-fit:contain;pointer-events:none}
.omQuranPage.omQuranSimpleMode .omQuranGlassDeck{display:none!important}
.omQuranPage.omQuranSimpleMode .omQuranSimpleReader{display:flex;flex:1 1 auto;min-height:0;flex-direction:column;align-items:center;justify-content:space-between;gap:10px;width:100%;padding:clamp(12px,4vw,30px) 13% 15px;box-sizing:border-box;overflow-y:auto;scrollbar-width:none;text-align:center}
.omQuranPage.omQuranSimpleMode .omQuranFirstReader{background:linear-gradient(180deg,rgba(3,6,18,.48) 0%,rgba(7,8,24,.18) 36%,rgba(5,5,20,.58) 100%),url("/assets/quran-studio-background.PNG") center center / cover no-repeat!important;background-color:#080d24!important}
.omQuranPage .omQuranSimpleHeading{display:grid;gap:6px;place-items:center;color:#fff;text-shadow:0 0 15px #c5a7ff77}
.omQuranPage .omQuranSimpleHeading>span{font-size:23px;color:#e2c6ff}
.omQuranPage .omQuranSimpleHeading h2{font-size:clamp(30px,7vw,47px);font-weight:500;margin:0;line-height:1.35}
.omQuranPage .omQuranSimpleHeading small{letter-spacing:.12em;color:#ddd2ff}
.omQuranPage .omQuranSimpleVerse{display:flex;flex-direction:column;justify-content:center;gap:28px;flex:1 1 auto;min-height:0;animation:omSimpleVerseEnter .4s ease-out both}
.omQuranPage .omQuranSimpleVerse>p:first-child{font-size:clamp(29px,7.3vw,49px);line-height:2.15;color:white;text-shadow:0 2px 24px #b69aff55;margin:0}
.omQuranPage .omQuranSimpleTranslation{font-size:clamp(16px,4.1vw,21px);line-height:1.8;color:#f3ecff;margin:0}
.omQuranPage .omQuranSimpleHint{color:#d5c6ff;font-size:12px;letter-spacing:.04em}
.omQuranPage.omQuranModeChanging .omQuranFirstReader:after{content:"";position:absolute;inset:0;z-index:1002;pointer-events:none;background:radial-gradient(circle at 50% 50%,#a47dff88,transparent 68%);animation:omModeRipple .7s ease-out both}
@keyframes omModeRipple{0%{opacity:0;transform:scale(.7)}38%{opacity:.85;transform:scale(1.05)}100%{opacity:0;transform:scale(1.25)}}
@keyframes omSimpleVerseEnter{from{opacity:0;transform:translateY(13px);filter:blur(5px)}to{opacity:1;transform:translateY(0);filter:blur(0)}}
@media(max-width:760px){.omQuranPage .omQuranModeOrb{right:10px;top:35%;width:60px;min-height:66px}.omQuranPage.omQuranSimpleMode .omQuranSimpleReader{padding:20px 11% 12px}.omQuranPage.omQuranSimpleMode .omQuranGlassTop{flex-shrink:0!important}}
@media(prefers-reduced-motion:reduce){.omQuranPage .omQuranSimpleVerse,.omQuranPage.omQuranModeChanging .omQuranFirstReader:after{animation:none!important}}

/* HudHud-only multi-depth light field: passive behind and occasional foreground glints. */
.omQuranPage .omQuranLightDeck{isolation:isolate;transform-style:preserve-3d}
.omQuranPage .omQuranLightField{position:absolute;inset:0;pointer-events:none;overflow:hidden;border-radius:24px}
.omQuranPage .omQuranLightBack{z-index:1}
.omQuranPage .omQuranLightFront{z-index:6;opacity:.38;mix-blend-mode:screen}
.omQuranPage .omQuranLightField i{position:absolute;display:block;border-radius:50%;background:#e7d6ff;box-shadow:0 0 8px 2px #a78bfa,0 0 20px 5px #738cff55;opacity:0;animation:omQuranLightDrift 5s ease-in-out infinite;will-change:transform,opacity}
.omQuranPage .omQuranLightFront i{background:#fff;box-shadow:0 0 5px 1px #d5b7ff,0 0 13px 2px #80baff}
.omQuranPage .omQuranLightShake{animation:omQuranLightImpact .46s cubic-bezier(.2,.7,.3,1) both}
.omQuranPage.omQuranModeChanging.omHudhudExperience .omQuranLightField{animation:omQuranLightBloom .7s ease-out both}
@keyframes omQuranLightDrift{0%{opacity:0;transform:translate3d(0,14px,0) scale(.5)}35%{opacity:.7}75%{opacity:.35}100%{opacity:0;transform:translate3d(9px,-34px,0) scale(1.2)}}
@keyframes omQuranLightImpact{0%{filter:brightness(1);transform:translateX(0)}18%{filter:brightness(1.16);transform:translateX(-2px)}38%{transform:translateX(2px)}60%{transform:translateX(-1px)}100%{filter:brightness(1);transform:translateX(0)}}
@keyframes omQuranLightBloom{0%{opacity:0;filter:brightness(2)}50%{opacity:1;filter:brightness(1.4)}100%{opacity:1;filter:brightness(1)}}
@media(prefers-reduced-motion:reduce){.omQuranPage .omQuranLightField i,.omQuranPage .omQuranLightShake,.omQuranPage.omQuranModeChanging.omHudhudExperience .omQuranLightField{animation:none!important}.omQuranPage .omQuranLightField i{opacity:.35!important}}

/* Roulette-style free spin: pointer drag and momentum, audible detents, rotating spin icon. */
.omQuranPage .omQuranCollectible{transition:none!important;animation:none!important;will-change:transform}
.omQuranPage .omQuranRouletteButton{touch-action:none;user-select:none;cursor:grab;display:inline-flex;align-items:center;gap:7px;justify-content:center;min-height:42px}
.omQuranPage .omQuranRouletteButton:active{cursor:grabbing}
.omQuranPage .omQuranRouletteIcon{display:inline-block;transition:none;line-height:1;font-size:23px;will-change:transform}
.omQuranPage .omQuranRouletteActive{filter:drop-shadow(0 0 15px #b18aff88)}
@media(prefers-reduced-motion:reduce){.omQuranPage .omQuranRouletteActive{filter:none}}
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
`}</style></main>;
}