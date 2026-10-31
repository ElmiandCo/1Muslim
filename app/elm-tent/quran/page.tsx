"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import Link from "next/link";
import {createClient} from "../../../utils/supabase/client";
import SiteNav from "../../components/SiteNav";
import VerseStudio from "./VerseStudio";
import VerseRecorder from "./VerseRecorder";
import VerseDMShare from "./VerseDMShare";
import VerseEngagement from "./VerseEngagement";
import InlineAnnotations from "./InlineAnnotations";
import VerseMediaTips from "./VerseMediaTips";
import HudHudVision from "./HudHudVision";
import HudHudSwipeRestore from "./HudHudSwipeRestore";
import HudHudHomeIntro from "../../components/HudHudHomeIntro";
import HudHudQuranText from "./HudHudQuranText";
import ElmiVerseMoment from "./ElmiVerseMoment";
import VersePostStudio from "./VersePostStudio";
import QuranFloatingSearch from "./QuranFloatingSearch";
import ReadingAtmosphere from "./ReadingAtmosphere";
import QuranLiveWidget from "../../components/QuranLiveWidget";
type Chapter={id:number;name_simple:string;name_arabic:string;verses_count:number;revelation_place?:string;revelation_order?:number;translated_name?:{name:string}};
type QuranWord={id:number;text_uthmani?:string;char_type_name?:string;translation?:{text:string};transliteration?:{text:string}};
type Verse={id:number;verse_key:string;text_uthmani?:string;words?:QuranWord[];translations?:{text:string}[]};
const API="https://api.quran.com/api/v4";
function StudioEntryTransition(){
 const [entering,setEntering]=useState(false);
 useEffect(()=>{try{if(sessionStorage.getItem("1muslim:quran-enter")==="1"){sessionStorage.removeItem("1muslim:quran-enter");setEntering(true);const timer=window.setTimeout(()=>setEntering(false),850);return ()=>window.clearTimeout(timer)}}catch{}},[]);
 return entering?<div className="quranStudioEntryCurtain" aria-hidden="true"><span>القرآن الكريم</span></div>:null;
}

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
 const [peaceMode,setPeaceMode]=useState(false);
 const [recitationActive,setRecitationActive]=useState(false);
 const [recitationPaused,setRecitationPaused]=useState(false);
 const recitationIdentity=useRef("");

 const [recitationWord,setRecitationWord]=useState(-1);
 const [recitationPreviousWord,setRecitationPreviousWord]=useState(-1);
 const [recitationComplete,setRecitationComplete]=useState(false);
 const recitationWordRef=useRef(-1);
 const recitationRun=useRef(0);
 const recitationCompleteTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const clearRecitationComplete=()=>{if(recitationCompleteTimer.current)clearTimeout(recitationCompleteTimer.current);recitationCompleteTimer.current=null;setRecitationComplete(false)};

 const [recitationEntrance,setRecitationEntrance]=useState(0);
 const recitationTiming=useRef<Array<{index:number;start:number;end:number}>>([]);
 const recitationFrame=useRef<number|null>(null);
 const syncRecitationGlow=(audio:HTMLAudioElement)=>{
  if(recitationFrame.current!==null)cancelAnimationFrame(recitationFrame.current);
  const tick=()=>{
   if(audio.paused||audio.ended){recitationFrame.current=null;return}
   const ms=audio.currentTime*1000;
   const word=recitationTiming.current.find(t=>ms>=t.start&&ms<t.end);
   const next=word?.index??-1;
   if(next!==recitationWordRef.current){
    setRecitationPreviousWord(recitationWordRef.current);
    recitationWordRef.current=next;
    setRecitationWord(next);
   }
   recitationFrame.current=requestAnimationFrame(tick);
  };
  tick();
 };
 useEffect(()=>()=>{if(recitationFrame.current!==null)cancelAnimationFrame(recitationFrame.current)},[]);
 const recitationPlayer=useRef<HTMLAudioElement|null>(null);
 const hudhudTapTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const hudhudLastTap=useRef(0);
 const stopQuranAudio=()=>{recitationIdentity.current="";setRecitationPaused(false);setRecitationActive(false);setRecitationWord(-1);setRecitationPreviousWord(-1);recitationWordRef.current=-1;clearRecitationComplete();recitationRun.current++;recitationTiming.current=[];if(recitationFrame.current!==null)cancelAnimationFrame(recitationFrame.current);recitationPlayer.current?.pause();if(recitationPlayer.current){recitationPlayer.current.currentTime=0;recitationPlayer.current=null}ambientAudio.current?.pause()};
 const onHudhudTap=()=>{const now=Date.now();if(now-hudhudLastTap.current<340){if(hudhudTapTimer.current)clearTimeout(hudhudTapTimer.current);hudhudTapTimer.current=null;hudhudLastTap.current=0;stopQuranAudio();setPeaceMode(v=>!v);return}hudhudLastTap.current=now;hudhudTapTimer.current=setTimeout(()=>{hudhudTapTimer.current=null;hudhudLastTap.current=0;nextVerseByOrb()},340)};
 const [studioSettingsOpen,setStudioSettingsOpen]=useState(false);
 const [readerBackground,setReaderBackground]=useState("original");
 const [previousBackground,setPreviousBackground]=useState<string|null>(null);
 const fadeBackgroundTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const chooseBackground=(next:string)=>{if(next===readerBackground)return;setPreviousBackground(readerBackground);setReaderBackground(next);if(fadeBackgroundTimer.current)clearTimeout(fadeBackgroundTimer.current);fadeBackgroundTimer.current=setTimeout(()=>setPreviousBackground(null),1400)};
 useEffect(()=>()=>{if(fadeBackgroundTimer.current)clearTimeout(fadeBackgroundTimer.current)},[]);

 const [arabicSize,setArabicSize]=useState(36);
 const [arabicColor,setArabicColor]=useState("#f5f1e7");
 const [verseGlow,setVerseGlow]=useState(35);
 const [readingFocus,setReadingFocus]=useState(true);
 const [readerBlur,setReaderBlur]=useState(10);
 const [readerDim,setReaderDim]=useState(12);
 const atmosphereGesture=useRef<{kind:"blur"|"dim";x:number;y:number;start:number}|null>(null);
 const updateAtmosphereGesture=(x:number)=>{const g=atmosphereGesture.current;if(!g)return;const width=Math.max(160,window.innerWidth*.7),delta=(x-g.x)/width*100;const value=Math.max(0,Math.min(100,Math.round(g.start+delta)));if(g.kind==="blur")setReaderBlur(value);else setReaderDim(value)};
 const [ambientSound,setAmbientSound]=useState("off");
 const [reciter,setReciter]=useState("ar.alafasy");
 const ambientAudio=useRef<HTMLAudioElement|null>(null);
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem("1muslim-quran-studio-preferences-v1")||"{}");if(["original","day","night"].includes(saved.background))setReaderBackground(saved.background);if(Number.isFinite(saved.size))setArabicSize(Math.min(64,Math.max(24,saved.size)));if(/^#[0-9a-fA-F]{6}$/.test(saved.color||""))setArabicColor(saved.color);if(Number.isFinite(saved.readerBlur))setReaderBlur(Math.max(0,Math.min(100,saved.readerBlur)));if(Number.isFinite(saved.readerDim))setReaderDim(Math.max(0,Math.min(100,saved.readerDim)));if(Number.isFinite(saved.verseGlow))setVerseGlow(Math.max(0,Math.min(100,saved.verseGlow)));if(typeof saved.readingFocus==="boolean")setReadingFocus(saved.readingFocus);if(["off","rain","ocean"].includes(saved.ambient))setAmbientSound(saved.ambient);if(["ar.alafasy","ar.abdurrahmaansudais","ar.husary"].includes(saved.reciter))setReciter(saved.reciter)}catch{}},[]);
 useEffect(()=>{try{localStorage.setItem("1muslim-quran-studio-preferences-v1",JSON.stringify({background:readerBackground,size:arabicSize,color:arabicColor,verseGlow,readingFocus,readerBlur,readerDim,ambient:ambientSound,reciter}))}catch{}},[readerBackground,arabicSize,arabicColor,verseGlow,readingFocus,readerBlur,readerDim,ambientSound,reciter]);
 useEffect(()=>{const audio=ambientAudio.current;if(!audio)return;audio.pause();if(ambientSound==="off"){audio.removeAttribute("src");audio.load();return}audio.src=ambientSound==="rain"?"/audio/rain.mp3":"/audio/ocean.mp3";audio.volume=.18;audio.loop=true;void audio.play().catch(()=>{});return()=>audio.pause()},[ambientSound]);
 const playSelectedRecitation=async()=>{const verse=verses[focusIndex]?.verse_key;if(!verse)return;const identity=reciter+":"+verse;const existing=recitationPlayer.current;
 if(existing&&recitationIdentity.current===identity&&!existing.ended){
  if(existing.paused){void existing.play().catch(()=>{});}else{existing.pause();}
  return;
 }
 recitationIdentity.current=identity;setRecitationPaused(false);const run=++recitationRun.current;clearRecitationComplete();recitationPlayer.current?.pause();setRecitationEntrance(v=>v+1);setRecitationActive(true);setRecitationWord(-1);setRecitationPreviousWord(-1);recitationWordRef.current=-1;recitationTiming.current=[];const [chapterNumber,verseNumber]=verse.split(":");
 // Load verified word timestamps for the exact selected reciter, if configured.
 // No guessed timing: a missing manifest means verse-level glow only.
 void fetch(`/api/quran-word-timings?reciter=${encodeURIComponent(reciter)}&chapter=${chapterNumber}&verse=${verseNumber}`)
  .then(res=>res.ok?res.json():null)
  .then(data=>{if(run!==recitationRun.current)return;if(data?.available&&Array.isArray(data.timings)&&data.timings.length===(verses[focusIndex]?.text_uthmani||"").trim().split(/\\s+/).length)recitationTiming.current=data.timings})
  .catch(()=>{});
 try{const response=await fetch(`/api/quran-audio?reciter=${encodeURIComponent(reciter)}&chapter=${chapterNumber}&verse=${verseNumber}`);if(!response.ok)throw new Error("Not yet hosted");const data=await response.json();if(run!==recitationRun.current)return;if(!data.available||!data.url)throw new Error("Not yet hosted");recitationPlayer.current?.pause();const player=new Audio(data.url);recitationPlayer.current=player;player.addEventListener("play",()=>{setRecitationPaused(false);syncRecitationGlow(player)});player.addEventListener("pause",()=>{if(!player.ended)setRecitationPaused(true)});player.addEventListener("ended",()=>{if(run!==recitationRun.current)return;setRecitationComplete(true);setRecitationPaused(false);setRecitationWord(-1);recitationCompleteTimer.current=setTimeout(()=>{setRecitationComplete(false);setRecitationActive(false)},600)});await player.play()}catch{if(run!==recitationRun.current)return;const audio=new Audio("https://cdn.islamic.network/quran/audio/128/"+reciter+"/"+verse.replace(":", "/")+".mp3");recitationPlayer.current=audio;audio.addEventListener("play",()=>{setRecitationPaused(false);syncRecitationGlow(audio)});audio.addEventListener("pause",()=>{if(!audio.ended)setRecitationPaused(true)});audio.addEventListener("ended",()=>{if(run!==recitationRun.current)return;setRecitationComplete(true);setRecitationWord(-1);recitationCompleteTimer.current=setTimeout(()=>{setRecitationComplete(false);setRecitationActive(false)},600)});void audio.play().catch(()=>{setRecitationActive(false)})}};

 const [readerIdle,setReaderIdle]=useState(false);
 const [cinemaPhase,setCinemaPhase]=useState<"off"|"spotlight"|"drift">("off");
 const cinemaTimers=useRef<ReturnType<typeof setTimeout>[]>([]);
 const orbTapTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const [orbitVisible,setOrbitVisible]=useState(true);
 const [orbitPosition,setOrbitPosition]=useState({x:0,y:0});
 const orbitDrag=useRef<{x:number;y:number;ox:number;oy:number;moved:boolean}|null>(null);
 const [orbitEnabled,setOrbitEnabled]=useState(true);
 const beginCinema=()=>{cinemaTimers.current.forEach(clearTimeout);cinemaTimers.current=[];setCinemaPhase("off");setReaderIdle(false);cinemaTimers.current.push(setTimeout(()=>{setReaderIdle(true);setCinemaPhase("spotlight")},2300),setTimeout(()=>setCinemaPhase("drift"),8500))};
 useEffect(()=>()=>{cinemaTimers.current.forEach(clearTimeout);if(orbTapTimer.current)clearTimeout(orbTapTimer.current)},[]);
 const nextChapterByOrb=()=>{if(chapter>=114)return;setChapter(chapter+1);setPage(1);setFocusIndex(0);setChapterFinish(false);setOrbOpen(false);setChapterNote("");beginCinema()};
 const nextVerseByOrb=()=>{if(chapterCount>0&&versePosition>=chapterCount&&page>=total){nextChapterByOrb();return}jump(focusIndex+1);beginCinema()};
 const idleTimeout=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{
  const wake=()=>{
   setReaderIdle(false);
   if(idleTimeout.current)clearTimeout(idleTimeout.current);
   idleTimeout.current=setTimeout(()=>{
    const focused=document.activeElement;
    if(focused instanceof HTMLInputElement||focused instanceof HTMLTextAreaElement||focused instanceof HTMLSelectElement)return;
    setReaderIdle(true);
   },2000);
  };
  wake();
  const events=["pointerdown","pointermove","touchstart","keydown","focusin","scroll"] as const;
  events.forEach(event=>window.addEventListener(event,wake,{passive:true}));
  return()=>{events.forEach(event=>window.removeEventListener(event,wake));if(idleTimeout.current)clearTimeout(idleTimeout.current)};
 },[]);

 const swipeStart=useRef<{x:number;y:number}|null>(null);
 const [backdropOffset,setBackdropOffset]=useState({x:0,y:0});
 const backdropStart=useRef<{x:number;y:number;ox:number;oy:number}|null>(null);
 const [compactStudio,setCompactStudio]=useState(true);
 const [verseMarkers,setVerseMarkers]=useState<Record<string,{id:number;x:number;y:number;size:number}[]>>({});
 const [markerSize,setMarkerSize]=useState(42);
 const markerDrag=useRef<{id:number;x:number;y:number;startX:number;startY:number;key:string}|null>(null);
 const activeVerseKey=verses[focusIndex]?.verse_key||chapter+":"+(focusIndex+1);
 // A verse must remain active and visible for two seconds before claiming XP.
 useEffect(()=>{
  const key=verses[focusIndex]?.verse_key;
  if(!key||busy||document.visibilityState!=="visible")return;
  let cancelled=false;
  const db=createClient();
  void db.rpc("begin_quran_verse_view",{p_verse_key:key}).then(({error})=>{
   if(error||cancelled)return;
   const timer=window.setTimeout(async()=>{
    if(cancelled||document.visibilityState!=="visible")return;
    const {data,error:claimError}=await db.rpc("claim_quran_verse_view_xp",{p_verse_key:key});
    if(!claimError&&Number((Array.isArray(data)?data[0]:data)?.awarded)>0)
     window.dispatchEvent(new Event("1muslim-xp-updated"));
   },2100);
   if(cancelled)clearTimeout(timer);
   else verseXpTimer.current=timer;
  });
  return()=>{cancelled=true;if(verseXpTimer.current!==null)clearTimeout(verseXpTimer.current);verseXpTimer.current=null};
 },[verses,focusIndex,busy]);
 const verseXpTimer=useRef<number|null>(null);

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
 const pendingVerse=useRef<string|null>(null);const progressReady=useRef(false);
 const [linkedQuestion,setLinkedQuestion]=useState<string|null>(null);
 useEffect(()=>{const params=new URLSearchParams(window.location.search);let key=params.get("verse")||(params.get("surah")&&params.get("ayah")?params.get("surah")+":"+params.get("ayah"):null);if(!key){try{const saved=JSON.parse(localStorage.getItem("1muslim-quran-progress")||"null");if(Number.isInteger(saved?.chapter)&&Number.isInteger(saved?.verse))key=saved.chapter+":"+saved.verse}catch{}}if(key&&/^([1-9]|[1-9][0-9]|1[01][0-4]):[1-9][0-9]{0,2}$/.test(key)){pendingVerse.current=key;const [ch,num]=key.split(":").map(Number);setChapter(ch);setPage(Math.ceil(num/50))}progressReady.current=true;setLinkedQuestion(params.get("question"));if(params.get("vision")==="1"){window.setTimeout(()=>window.dispatchEvent(new Event("1muslim:hudhud-vision-enable")),400)}},[]);
 const navigateVerse=(key:string)=>{const [ch,num]=key.split(":").map(Number);if(!Number.isInteger(ch)||ch<1||ch>114||!Number.isInteger(num)||num<1)return;pendingVerse.current=key;setChapter(ch);setPage(Math.ceil(num/50));};
 useEffect(()=>{if(busy||!verses.length||!pendingVerse.current)return;const target=pendingVerse.current;const index=verses.findIndex(v=>v.verse_key===target);if(index<0)return;pendingVerse.current=null;const id=window.setTimeout(()=>{verseArea.current?.querySelector<HTMLElement>('[data-verse-index="'+index+'"]')?.scrollIntoView({behavior:"smooth",block:"center"});setFocusIndex(index)},100);return()=>clearTimeout(id)},[busy,verses]);
 useEffect(()=>{setFocusIndex(0)},[chapter,page]);

 const jump=(index:number)=>{
  if(pageTurnTimer.current){clearTimeout(pageTurnTimer.current);pageTurnTimer.current=null;setTurningPage(null)}
  if(index>=0&&index<verses.length&&index!==focusIndex){
   const reduced=typeof window!=="undefined"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
   if(!reduced){
    setTurningPage({direction:index>focusIndex?"next":"previous",verse:verses[focusIndex],position:(page-1)*50+focusIndex+1});
    setFocusIndex(index);
    const key=verses[index]?.verse_key;if(key)setVisited(v=>({...v,[key]:true}));
    pageTurnTimer.current=setTimeout(()=>{setTurningPage(null);pageTurnTimer.current=null},1250);
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


 const [floatingEnabled,setFloatingEnabled]=useState(false);
 const enableFloatingStudio=()=>{
  const verse=verses[focusIndex];if(!verse)return;
  const annotations=verseNotes[verse.verse_key];
  const payload={key:verse.verse_key,arabic:verse.text_uthmani||"",translation:strip(verse.translations?.[0]?.text||""),chapter:chapters.find(c=>c.id===chapter)?.name_simple||"Quran",reciter,note:annotations?.note||"",highlights:annotations?.highlights?.length||0,underlines:annotations?.underlines?.length||0};
  try{sessionStorage.setItem("1muslim:quran-floating-session",JSON.stringify({verse:payload,mode:"mini"}))}catch{}
  window.dispatchEvent(new CustomEvent("1muslim:quran-floating-update",{detail:payload}));
  setFloatingEnabled(true);
 };
 useEffect(()=>{if(!floatingEnabled)return;const verse=verses[focusIndex];if(!verse)return;const annotations=verseNotes[verse.verse_key];const payload={key:verse.verse_key,arabic:verse.text_uthmani||"",translation:strip(verse.translations?.[0]?.text||""),chapter:chapters.find(c=>c.id===chapter)?.name_simple||"Quran",reciter,note:annotations?.note||"",highlights:annotations?.highlights?.length||0,underlines:annotations?.underlines?.length||0};try{sessionStorage.setItem("1muslim:quran-floating-session",JSON.stringify({verse:payload,mode:"mini"}))}catch{}window.dispatchEvent(new CustomEvent("1muslim:quran-floating-update",{detail:payload}))},[floatingEnabled,verses,focusIndex,verseNotes,reciter,chapters,chapter]);
 const versePosition=(page-1)*50+focusIndex+1;
 useEffect(()=>{if(!progressReady.current||pendingVerse.current||busy||!verses[focusIndex]||verses[focusIndex].verse_key!==chapter+":"+versePosition)return;try{localStorage.setItem("1muslim-quran-progress",JSON.stringify({chapter,verse:versePosition}))}catch{}},[chapter,versePosition,busy,verses,focusIndex]);
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
 const [studioNavCollapsed,setStudioNavCollapsed]=useState(false);
 useEffect(()=>{
  const onToggle=()=>setStudioNavCollapsed(previous=>!previous);
  const onState=(event:Event)=>setStudioNavCollapsed(Boolean((event as CustomEvent<{collapsed:boolean}>).detail?.collapsed));
  window.addEventListener("1muslim:hudhud-nav-toggle",onToggle);
  window.addEventListener("1muslim:hudhud-nav-state",onState);
  return()=>{window.removeEventListener("1muslim:hudhud-nav-toggle",onToggle);window.removeEventListener("1muslim:hudhud-nav-state",onState)};
 },[]);
 const filtered=useMemo(()=>chapters.filter(c=>String(c.id)===search.trim()||c.name_simple.toLowerCase().includes(search.toLowerCase())||c.name_arabic.includes(search)),[chapters,search]);
 const active=chapters.find(c=>c.id===chapter);
 return <> <style jsx global>{`@keyframes omRecitationHalo{0%{text-shadow:0 0 0 transparent;filter:brightness(1)}40%{text-shadow:0 0 8px rgba(92,185,255,.8),0 0 18px rgba(220,238,255,.5);filter:brightness(1.08)}100%{text-shadow:0 0 0 transparent;filter:brightness(1)}}.omRecitationGlowEntrance{animation:omRecitationHalo .8s ease-out both}.omRecitationPaused,.omRecitationPaused .omRecitationWordTrail{animation-play-state:paused!important;transition-duration:0s!important}.omRecitationGlowComplete{animation:omRecitationHalo .6s ease-out both}.omRecitationWordTrail{animation:omRecitationTrail .4s ease-out both}@keyframes omRecitationTrail{0%{text-shadow:0 0 7px rgba(95,190,255,.7)}100%{text-shadow:none}}.omRecitationWordActive{color:#e7f6ff;text-shadow:0 0 7px #61b9ff,0 0 15px rgba(90,176,255,.8);transition:color .14s,text-shadow .14s}@media(prefers-reduced-motion:reduce){ .omRecitationGlowEntrance,.omRecitationGlowComplete,.omRecitationWordTrail{animation:none}.omRecitationWordActive{transition:none}}`}</style><HudHudSwipeRestore/><StudioEntryTransition/><main style={{"--studio-arabic-size":arabicSize+"px","--studio-arabic-color":arabicColor} as React.CSSProperties} data-studio-background={readerBackground} data-cinema-phase={cinemaPhase} className={"omQuranPage "+(studioNavCollapsed?" omQuranHudHudExpanded":" omQuranHudHudResting")+" "+(readerIdle&&!orbOpen&&!studioSettingsOpen&&!cardBack&&!showFatihahIntro&&!chapterFinish?" omQuranReaderIdle":"")+" "+(hudhudMode?"omHudhudExperience":"omQuranSimpleMode")+(modeTransition?" omQuranModeChanging":"")}><div className="omQuranShell">{linkedQuestion&&<div style={{padding:12,border:"1px solid var(--line)",borderRadius:14,marginBottom:12}}><strong>🐦 HudHud · Question-to-verse study</strong><p>Read the verse and its context, then return to the question to check your understanding.</p><Link href={"/elm-tent/lessons?question="+encodeURIComponent(linkedQuestion)}>← Return to linked question</Link></div>}<header className="omQuranHero"><img src="/assets/HudHud-Quran.png" alt="HudHud Qur’an" width={44} height={44} style={{display:"block",width:44,height:44,objectFit:"contain",margin:"0 0 4px"}}/><Link href="/elm-tent">← Elm Tent</Link><span>🏕️ ELM TENT · QUR'AN LESSONS</span><h1>Every verse. A doorway to learning.</h1><p>Browse 114 surahs, explore the Arabic and translation, and share an ayah with the community. Verse references always link back to the Qur'an.</p></header><div className="omQuranLayout"><aside className="omQuranSidebar"><label htmlFor="omSurahSearch">Find a surah</label><input id="omSurahSearch" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name or number…"/><div className="omQuranChapters">{filtered.map(c=><button key={c.id} className={chapter===c.id?"active":""} onClick={()=>{setChapter(c.id);setPage(1)}}><b>{c.id}. {c.name_simple}</b><small>{c.verses_count} ayat</small></button>)}</div></aside><section className="omQuranVerses omQuranAppStage" ref={verseArea}><div className={"omQuranFirstReader "+(peaceMode?"omQuranPeaceMode":"")} style={{"--om-reader-blur":`${readerBlur*.12}px`,"--om-reader-dim":Math.min(1,readerDim/100+(peaceMode&&versePosition>=2?.27:0))} as React.CSSProperties}><div className="omQuranBackgroundOverlay" aria-hidden="true">{previousBackground&&<div key={previousBackground+"-"+readerBackground} className={"omQuranBackgroundLeaving omQuranBackground-"+previousBackground}/>}</div><div className="omQuranAtmosphereControls" aria-label="Reading atmosphere gesture controls"><div className="omQuranAtmosphereSwipe omQuranAtmosphereSwipeTop" role="slider" tabIndex={0} aria-label="Background blur" aria-valuemin={0} aria-valuemax={100} aria-valuenow={readerBlur} onKeyDown={e=>{if(e.key==="ArrowRight"||e.key==="ArrowLeft"){e.preventDefault();setReaderBlur(v=>Math.max(0,Math.min(100,v+(e.key==="ArrowRight"?5:-5))))}}} onPointerDown={e=>{atmosphereGesture.current={kind:"blur",x:e.clientX,y:e.clientY,start:readerBlur};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(atmosphereGesture.current?.kind==="blur")updateAtmosphereGesture(e.clientX)}} onPointerUp={()=>{atmosphereGesture.current=null}} onPointerCancel={()=>{atmosphereGesture.current=null}}><span>◌ Blur</span><span>{readerBlur}%</span></div></div><div className="omQuranGlassTop"><Link href="/elm-tent" className="omQuranStudioExit" aria-label="Quran Home and full Studio">⌂ <span>Quran Home</span></Link><select aria-label="Choose surah" value={chapter} onChange={e=>{setChapter(Number(e.target.value));setPage(1);setFocusIndex(0)}}>{chapters.map(c=><option key={c.id} value={c.id}>{c.name_simple}</option>)}</select><span className="omQuranVerseBadge" aria-live="polite"><span className="omQuranVerseBadgeLabel">الآية · Verse</span><strong>{verses[focusIndex]?.verse_key||chapter+":1"}</strong></span><button type="button" className="omQuranStudioSettings" title="Studio settings" aria-label="Open Quran Studio settings" onClick={()=>{setStudioSettingsOpen(v=>!v);setOrbOpen(false)}}>⋯</button></div><button type="button" className="omQuranEnableFloat" onClick={enableFloatingStudio} aria-label="Enable optional floating Quran Studio across 1Muslim">◈ Take Quran with me <span>Optional · Mini → Widget → Studio</span></button><audio ref={ambientAudio} aria-hidden="true" preload="none"/><div className="omQuranOrbitWidget" data-orbit-visible={orbitVisible&&orbitEnabled} style={{transform:`translate3d(${orbitPosition.x}px,${orbitPosition.y}px,0)`}} onPointerDown={e=>{if((e.target as HTMLElement).closest("button,select,input"))return;orbitDrag.current={x:e.clientX,y:e.clientY,ox:orbitPosition.x,oy:orbitPosition.y,moved:false};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{const d=orbitDrag.current;if(!d)return;const dx=e.clientX-d.x,dy=e.clientY-d.y;if(Math.abs(dx)+Math.abs(dy)>5)d.moved=true;setOrbitPosition({x:Math.max(-window.innerWidth*.4,Math.min(window.innerWidth*.4,d.ox+dx)),y:Math.max(-window.innerHeight*.35,Math.min(window.innerHeight*.35,d.oy+dy))})}} onPointerUp={()=>{orbitDrag.current=null}}><div className="omQuranOrbitHandle"><span>✦ CHAPTER · VERSE</span><button type="button" onClick={()=>setOrbitVisible(false)} aria-label="Hide chapter and verse widget">×</button></div><div className="omQuranOrbitPickers"><select aria-label="Orbit chapter" value={chapter} onChange={e=>{setChapter(Number(e.target.value));setPage(1);setFocusIndex(0);beginCinema()}}>{chapters.map(c=><option key={c.id} value={c.id}>{c.id}. {c.name_simple}</option>)}</select><input aria-label="Orbit verse number" type="number" min={1} max={chapterCount||1} value={versePosition} onChange={e=>{const n=Number(e.target.value);if(n>=1&&n<=(chapterCount||1)){navigateVerse(chapter+":"+n);beginCinema()}}}/></div></div><button type="button" className="omQuranOrbitDot" aria-label={orbitVisible?"Hide chapter and verse widget":"Show chapter and verse widget"} onClick={()=>{setOrbitEnabled(true);setOrbitVisible(v=>!v)}}>◈</button>{studioSettingsOpen&&<aside className="omQuranPreferences" aria-label="Quran Studio settings"><header><div className="omQuranPreferencesHeading"><span className="omQuranPreferencesEyebrow">QUR’AN STUDIO · PERSONALIZE</span><strong>Reading atmosphere</strong><span className="omQuranPreferencesSubtitle">Adjust visuals &amp; sounds</span></div><button type="button" onClick={()=>setStudioSettingsOpen(false)} aria-label="Close settings">×</button></header><div className="omQuranPreferencesSection"><span className="omQuranPreferencesSectionTitle">✧ Visuals</span><label><input type="checkbox" checked={orbitEnabled} onChange={e=>{setOrbitEnabled(e.target.checked);setOrbitVisible(e.target.checked)}}/> Movable chapter / verse widget</label><label>Background<select value={readerBackground} onChange={e=>chooseBackground(e.target.value)}><option value="original">Original artwork</option><option value="day">Sunlit courtyard</option><option value="night">Moonlit courtyard</option></select></label><label>Arabic size · {arabicSize}px<input type="range" min="24" max="64" value={arabicSize} onChange={e=>setArabicSize(Number(e.target.value))}/></label><label>Verse illumination · {verseGlow}%<input type="range" min="0" max="100" step="5" value={verseGlow} onChange={e=>setVerseGlow(Number(e.target.value))} aria-label="Arabic verse illumination"/></label><label><input type="checkbox" checked={readingFocus} onChange={e=>setReadingFocus(e.target.checked)}/> Reading focus · soften surrounding cards</label><label>Arabic color<input aria-label="Arabic text color" type="color" value={arabicColor} onChange={e=>setArabicColor(e.target.value)}/></label></div><div className="omQuranPreferencesSection"><span className="omQuranPreferencesSectionTitle">♫ Sounds</span><label>Ambient sounds<select value={ambientSound} onChange={e=>setAmbientSound(e.target.value)}><option value="off">Off</option><option value="rain">Rain</option><option value="ocean">Ocean</option></select></label><label>Reciter<select value={reciter} onChange={e=>setReciter(e.target.value)}><option value="ar.alafasy">Mishary Alafasy</option><option value="ar.abdurrahmaansudais">Abdurrahman As-Sudais</option><option value="ar.husary">Mahmoud Khalil Al-Husary</option></select></label><button type="button" className="omQuranPreviewRecitation" onClick={playSelectedRecitation}>▶ Listen to this verse</button></div><small>Preferences are saved on this device.</small></aside>}<div className={"omQuranStudioData omQuranStudyWidgets "+(readingFocus?"omQuranStudyDim":"")} key={verses[focusIndex]?.verse_key||"loading"} aria-label="Current verse study dashboard">
<div className="omQuranStudioDataCard omQuranStudioDataPrimary"><span>✦ CHAPTER · السورة</span><strong>{active?.name_simple||"Qur’an"}</strong><small lang="ar">{active?.name_arabic||""}</small></div>
<div className="omQuranStudioDataCard"><span>VERSE · الآية</span><strong>{versePosition} <small>/ {chapterCount||"—"}</small></strong><small>{active?.verses_count||"—"} verses in chapter</small></div>
<div className="omQuranStudioDataCard"><span>REVELATION · النزول</span><strong>{active?.revelation_place==="makkah"?"Makkah":active?.revelation_place==="madinah"?"Madinah":active?.revelation_place||"Not available"}</strong><small>{active?.revelation_order?"Order "+active.revelation_order:"Order not available"} · Historical dating varies</small></div>
<div className="omQuranStudioDataCard"><span>WORDS · الكلمات</span><strong>{verses[focusIndex]?.words?.filter(w=>w.char_type_name==="word").length||verses[focusIndex]?.text_uthmani?.trim().split(/\\s+/).filter(Boolean).length||0}</strong><small>Words in current verse</small></div>
<div className="omQuranStudioDataCard omQuranStudioDataProgress"><span>PROGRESS · التقدم</span><strong>{chapterPercent}%</strong><div className="omQuranStudioMiniTrack" role="progressbar" aria-label="Chapter reading progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={chapterPercent}><i style={{width:chapterPercent+"%"}}/></div><small>{versePosition} of {chapterCount||"—"} verses</small></div>
<button type="button" className="omQuranStudioDataCard omQuranStudioDataPlay" onClick={()=>void playSelectedRecitation()} aria-label="Play current verse recitation" title="Play the current verse"><span>RECITATION · التلاوة</span><strong>{recitationActive&&recitationIdentity.current===reciter+":"+verses[focusIndex]?.verse_key?(recitationPaused?"▶ Resume":"⏸ Pause"):"▶ Play"}</strong><small>Listen to this verse</small></button>
<div className="omQuranStudioDataCard omQuranStudioDataFuture"><span>CONTEXT · السياق</span><strong>Coming soon</strong><small>Hadith explanations · People mentioned · Historical notes</small></div>
</div><div className="omQuranQuickControls" role="group" aria-label="Quran verse controls" style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",maxWidth:640,margin:"-18px auto 6px",padding:"0 18px",position:"relative",zIndex:12}}><button type="button" onClick={()=>jump(focusIndex-1)} disabled={focusIndex===0&&page===1} aria-label="Previous verse" title="Previous verse" style={{width:54,height:54,borderRadius:"50%",border:"1px solid rgba(229,201,132,.65)",background:"rgba(4,54,45,.85)",color:"#f5e6bc",fontSize:34,cursor:"pointer"}}>‹</button><button type="button" onClick={()=>void playSelectedRecitation()} aria-label="Play current verse recitation" title="Play verse" style={{width:54,height:54,borderRadius:"50%",border:"1px solid rgba(229,201,132,.65)",background:"rgba(4,54,45,.85)",color:"#f5e6bc",fontSize:25,cursor:"pointer"}}>▶</button></div><div className={"omQuranGlassDeck omQuranLightDeck omQuranVerseFloat "+(turningPage?"omQuranVerseRefocusing ":"")+(peaceMode?"omQuranFloatPeace":"")} onTouchStart={e=>{const t=e.touches[0];swipeStart.current={x:t.clientX,y:t.clientY}}} onTouchEnd={e=>{const st=swipeStart.current;if(!st)return;const t=e.changedTouches[0];if(Math.abs(t.clientX-st.x)>55&&Math.abs(t.clientY-st.y)<100)jump(focusIndex+(t.clientX<st.x?1:-1));swipeStart.current=null}}><div className="omQuranLightField omQuranLightBack" aria-hidden="true" key={chapter+":"+(focusIndex)+"-back"}>{Array.from({length:24},(_,i)=><i key={i} style={{left:((i*37+17)%97)+"%",top:((i*29+9)%91)+"%",animationDelay:((i*0.37)%5)+"s",animationDuration:(3.4+(i%7)*.8)+"s",width:(2+i%4)+"px",height:(2+i%4)+"px"}}/>)}</div><div className="omQuranGlassGhost omQuranGlassGhostLeft" aria-hidden="true"/><div className="omQuranGlassGhost omQuranGlassGhostRight" aria-hidden="true"/>{turningPage&&<div className={"omQuranTurnSheet "+(turningPage.direction==="next"?"omQuranTurnNext":"omQuranTurnPrevious")} aria-hidden="true"><div className="omQuranTurnSheen"/><span className="omQuranTurnNumber">{turningPage.position}</span><p lang="ar" dir="rtl">{turningPage.verse.text_uthmani}</p></div>}<article key={verses[focusIndex]?.verse_key||"loading"} className={"omQuranGlassPage omQuranCollectible omQuranVerseFlow omQuranGentleVerse "+(spinning?"omQuranRouletteActive":"")} style={{transform:`rotateY(${spinAngle}deg)`}}>
 <div className="omQuranCardFront" onPointerDown={()=>{const el=document.querySelector(".omQuranVerseAtmosphere");if(el){el.classList.remove("omQuranAtmospherePulse");void (el as HTMLElement).offsetWidth;el.classList.add("omQuranAtmospherePulse")}}}>
  <div className="omQuranVerseAtmosphere" aria-hidden="true" key={"atmosphere-"+chapter+"-"+focusIndex}>
   <div className="omQuranAtmosphereAurora"/>
   <div className="omQuranAtmosphereOrbit omQuranAtmosphereOrbitOne"/>
   <div className="omQuranAtmosphereOrbit omQuranAtmosphereOrbitTwo"/>
   {Array.from({length:17},(_,i)=><i key={i} style={{left:((i*43+9)%94+3)+"%",top:((i*31+17)%86+7)+"%",width:(2+i%3)+"px",height:(2+i%3)+"px",animationDelay:((i*0.47)%7)+"s",animationDuration:(8+(i%6)*1.7)+"s"}}/>)}
  </div>
  <div className="omQuranGlassPageHead"><span>{versePosition}</span><button type="button" aria-label="Spin Quran verse card like roulette" className="omQuranFlipAction omQuranRouletteButton" onPointerDown={startCardSpin} onPointerMove={moveCardSpin} onPointerUp={endCardSpin} onPointerCancel={()=>{spinPointer.current=null}}><span className="omQuranRouletteIcon" style={{transform:`rotate(${spinAngle}deg)`}}>⟳</span> Spin</button></div>
  <p lang="ar" dir="rtl" className={"omQuranGlassArabic "+(recitationPaused?"omRecitationPaused ":"")+(recitationActive?"omRecitationGlowEntrance ":"")+(recitationComplete?"omRecitationGlowComplete":"")} key={String(verses[focusIndex]?.verse_key||"")+"-"+recitationEntrance}>{(verses[focusIndex]?.text_uthmani||"بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ").split(/\s+/).map((word,i)=><span key={i} className={"omQuranAnnotatedWord "+(recitationWord===i?"omRecitationWordActive ":"")+(recitationPreviousWord===i&&recitationWord!==i?"omRecitationWordTrail ":"")+((verseNotes[verses[focusIndex]?.verse_key||""]?.highlights||[]).includes(i)?"omQuranWordGlow ":"")+((verseNotes[verses[focusIndex]?.verse_key||""]?.underlines||[]).includes(i)?"omQuranWordUnderline":"")}>{word}{" "}</span>)}</p>
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
</article><div className="omQuranLightField omQuranLightFront" aria-hidden="true" key={chapter+":"+(focusIndex)+"-front"}>{Array.from({length:9},(_,i)=><i key={i} style={{left:((i*37+11)%97)+"%",top:((i*29+31)%91)+"%",animationDelay:((i*0.37)%5)+"s",animationDuration:(3.4+(i%7)*.8)+"s",width:(2+i%4)+"px",height:(2+i%4)+"px"}}/>)}</div><button type="button" className="omQuranGlassArrow omQuranGlassArrowLeft" onClick={()=>jump(focusIndex-1)} aria-label="Previous verse">‹</button><button type="button" className="omQuranGlassArrow omQuranGlassArrowRight" onClick={()=>jump(focusIndex+1)} aria-label="Next verse">›</button></div><div className="omQuranAtmosphereSwipe omQuranAtmosphereSwipeBottom" role="slider" tabIndex={0} aria-label="Reading light dimming" aria-valuemin={0} aria-valuemax={100} aria-valuenow={readerDim} onKeyDown={e=>{if(e.key==="ArrowRight"||e.key==="ArrowLeft"){e.preventDefault();setReaderDim(v=>Math.max(0,Math.min(100,v+(e.key==="ArrowRight"?5:-5))))}}} onPointerDown={e=>{atmosphereGesture.current={kind:"dim",x:e.clientX,y:e.clientY,start:readerDim};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(atmosphereGesture.current?.kind==="dim")updateAtmosphereGesture(e.clientX)}} onPointerUp={()=>{atmosphereGesture.current=null}} onPointerCancel={()=>{atmosphereGesture.current=null}}><span>☾ Dim</span><span>{readerDim}%</span></div><button type="button" className="omQuranCenterOrb" aria-label={chapterCount>0&&versePosition>=chapterCount&&page>=total?"Next Quran chapter":"Next Quran verse"} onClick={onHudhudTap}><img src="/assets/HudHud-Quran.png" alt="" width={48} height={48}/></button>{orbOpen&&<div className="omQuranOrbMenu"><button type="button" onClick={()=>{jump(focusIndex-1);setOrbOpen(false)}}>← Previous verse</button><button type="button" onClick={()=>{jump(focusIndex+1);setOrbOpen(false)}}>Next verse →</button><button type="button" onClick={()=>{setHudhudQuickOpen(true);setOrbOpen(false)}}>✦ Study tools</button><button type="button" onClick={()=>{setChapterFinish(true);setOrbOpen(false)}}>Chapter notes</button></div>}<div className="omQuranDualProgress" aria-label="Quran and chapter reading progress">
 <div className="omQuranDualLabels"><span>✦ {active?.name_simple||"Surah"} · {versePosition}/{chapterCount||"—"}</span><strong>{chapterPercent}%</strong></div>
 <div className="omQuranDualTrack" role="progressbar" aria-label="Current chapter progress" aria-valuemin={0} aria-valuemax={chapterCount||1} aria-valuenow={Math.min(versePosition,chapterCount||1)}><span className="omQuranDualChapterFill" style={{width:chapterPercent+"%"}}/></div>
 <div className="omQuranDualWhole"><span>Entire Quran · {readCount.toLocaleString()}/{totalQuranVerses.toLocaleString()} verses visited</span><strong>{quranReadPercent}%</strong></div>
 <div className="omQuranDualTrack omQuranDualTrackWhole" role="progressbar" aria-label="Entire Quran reading progress" aria-valuemin={0} aria-valuemax={totalQuranVerses} aria-valuenow={readCount}><span className="omQuranDualWholeFill" style={{width:(readCount/totalQuranVerses*100)+"%"}}/></div>
 </div></div>{showFatihahIntro&&chapter===1&&<div className="omQuranIntroCurtain" role="dialog" aria-modal="true" aria-label="Welcome to Al-Fatihah and Quran Studio Read Mode"><div className="omQuranIntroCard"><span className="omQuranIntroEyebrow">✦ QURAN STUDIO · READ MODE</span><h2>Welcome to Al-Fatihah 🌙</h2><p>Al-Fatihah means <strong>The Opening</strong>. These seven verses begin the Quran and are recited in every unit of salah. They teach us to praise Allah, ask for His help, and seek the straight path.</p><p><strong>📖 You're in Read Mode.</strong> Take your time, move verse by verse, and turn a verse card over to keep private notes and highlight words.</p><p><strong>🏠 Want the full Quran Studio?</strong> Tap <em>Quran Home</em> at the top to explore the wider Studio experience. You can return to Read Mode anytime.</p><div className="omQuranIntroActions"><button type="button" onClick={dismissFatihahIntro}>Bismillah · Start Reading →</button><Link href="/elm-tent" onClick={dismissFatihahIntro}>⌂ Quran Home</Link></div><small>One introduction, shown on your first visit to Al-Fatihah.</small></div></div>}{chapterFinish&&<div className="omQuranChapterCurtain" role="dialog" aria-modal="true" aria-label="Chapter reflection"><div className="omQuranChapterBlackPage"><span>✦ CHAPTER COMPLETE</span><h2>{chapter===1?"Congratulations! Your first chapter is complete!":"MashaAllah! Chapter "+chapter+" complete!"}</h2><p>{milestoneCheer}</p>{chapter<114?<><p><strong>📖 Coming next</strong><br/>{milestonePreview}</p><p><strong>💭 Think about it</strong><br/>{milestoneQuestion}</p></>:<p>You have reached the final surah. Reflect on your journey and revisit the verses that moved you most.</p>}<small>{active?.name_simple||"Surah"} · {chapter} · {chapterCount} verses</small><textarea aria-label="Chapter notes" placeholder="What did you learn or want to remember?" value={chapterNote} onChange={e=>setChapterNote(e.target.value)}/><div className="omQuranChapterActions"><button onClick={()=>{try{localStorage.setItem("1muslim-chapter-note-"+chapter,chapterNote)}catch{}setChapterFinish(false)}}>Save note</button><button onClick={async()=>{if(navigator.share){try{await navigator.share({title:active?.name_simple||"Quran",text:chapterNote||"Reflecting on Surah "+(active?.name_simple||chapter),url:window.location.href})}catch{}}else if(navigator.clipboard){await navigator.clipboard.writeText(window.location.href)}}}>Share ↗</button><button onClick={()=>{if(chapter<114){setChapter(chapter+1);setPage(1);setFocusIndex(0);setChapterNote("")}setChapterFinish(false)}}>{chapter===1?"Let’s Go → Al-Baqarah":chapter<114?"Next chapter →":"Finish Qur'an ✓"}</button><button onClick={()=>setChapterFinish(false)}>Return to verse</button></div></div></div>}<div className="omQuranAtmosphere" style={{transform:`translate3d(${backdropOffset.x}px,${backdropOffset.y}px,0)`}} onPointerDown={e=>{if(e.pointerType==="mouse"&&e.button!==0)return;backdropStart.current={x:e.clientX,y:e.clientY,ox:backdropOffset.x,oy:backdropOffset.y};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(!backdropStart.current)return;setBackdropOffset({x:Math.max(-95,Math.min(95,backdropStart.current.ox+(e.clientX-backdropStart.current.x)*.45)),y:Math.max(-90,Math.min(90,backdropStart.current.oy+(e.clientY-backdropStart.current.y)*.45))})}} onPointerUp={()=>{backdropStart.current=null}} onPointerCancel={()=>{backdropStart.current=null}} aria-hidden="true"><div className="omQuranAtmosphereOrb omQuranAtmosphereOrbA"/><div className="omQuranAtmosphereOrb omQuranAtmosphereOrbB"/></div><QuranFloatingSearch chapters={chapters} onSelect={navigateVerse}/><div className="omQuranMarkerToolbar"><span>✦ Verse layers</span><button type="button" onClick={addVerseMarker} aria-label="Add glowing marker">＋ Marker</button><button type="button" onClick={undoVerseMarker} disabled={!(verseMarkers[activeVerseKey]||[]).length} aria-label="Undo last marker">↶ Undo</button><label>Size <input aria-label="Marker size" type="range" min="24" max="110" value={markerSize} onChange={e=>setMarkerSize(Number(e.target.value))}/></label><button type="button" onClick={()=>setHudhudMode(v=>!v)}>{hudhudMode?"⤢ Exit HudHud":"⛶ HudHud fullscreen"}</button></div><div className="omQuranAppOverview"><div><small>QURAN STUDIO · SWIPE TO READ</small><strong>{active?.name_simple||"Qur'an"} <span>{verses[focusIndex]?.verse_key||chapter+":"+versePosition}</span></strong><p>One verse at a time · Swipe left or right to explore</p></div><button type="button" onClick={()=>setCompactStudio(v=>!v)} aria-pressed={compactStudio}>{compactStudio?"☷ Overview":"✦ Focus"}</button></div><div className="omQuranTitle"><div><span>Surah {chapter}</span><h2>{active?.name_simple||"Qur'an"} <small lang="ar" dir="rtl">{active?.name_arabic}</small></h2></div><label><input type="checkbox" checked={showTranslation} onChange={e=>setShowTranslation(e.target.checked)}/> Translation</label></div><div className="omQuranJourneyCards" aria-label="Quran completion dashboard"><div className="omQuranCompletionCard"><div className="omQuranRing" style={{"--progress":quranReadPercent+"%"} as React.CSSProperties}><div><span>📖</span><strong>{quranReadPercent}%</strong><small>Qur’an explored</small></div></div><p><strong>{readCount.toLocaleString()} / {totalQuranVerses.toLocaleString()}</strong> ayat visited on this device</p></div><div className="omQuranCompletionCard"><div className="omQuranRing omQuranRingChapter" style={{"--progress":chapterReadPercent+"%"} as React.CSSProperties}><div><span>✦</span><strong>{chapterReadPercent}%</strong><small>Chapter completed</small></div></div><p><strong>{chapterReadCount} / {chapterCount||"…"}</strong> ayat visited · {active?.name_simple||"Surah"}</p></div></div><div className="omFocusTracker" aria-label="Live reading progress"><div className="omFocusTop"><span>✦ YOUR READING JOURNEY</span><strong>{chapterPercent}% of this surah</strong></div><div className="omFocusTrack" role="progressbar" aria-valuenow={versePosition} aria-valuemin={0} aria-valuemax={chapterCount||1} aria-label="Verses reached in current surah"><span style={{width:chapterPercent+"%"}}/></div><div className="omFocusTimeline">{previousTopics.map(v=><button key={v.verse_key} onClick={()=>jump(verses.findIndex(x=>x.verse_key===v.verse_key))}>↶ {v.verse_key}<small>Earlier verse</small></button>)}<div className="omFocusCurrent"><span>NOW READING</span><strong>{verses[focusIndex]?.verse_key||chapter+":1"}</strong><small>{versePosition} of {chapterCount||"…"} ayat · {Object.keys(visited).length} visited this session</small></div><div className="omFocusNav" data-mode={hudhudMode?"hudhud":"normal"}><button type="button" onClick={()=>jump(focusIndex-1)} disabled={focusIndex===0&&page===1} aria-label="Previous verse">↑</button><button type="button" onClick={()=>jump(focusIndex+1)} disabled={focusIndex===verses.length-1&&page===total} aria-label="Next verse">↓</button></div></div></div><div className="omHudhudQuickWrap"><button type="button" className={"omHudhudQuickButton "+(hudhudQuickOpen?"is-open":"")} onClick={()=>setHudhudQuickOpen(v=>!v)} aria-expanded={hudhudQuickOpen} aria-controls="omHudhudQuickPanel" aria-label="HudHud Quran Studio controls">✦ <span>HudHud</span></button>{hudhudQuickOpen&&<div id="omHudhudQuickPanel" className="omHudhudQuickPanel" role="region" aria-label="HudHud Quran Studio controls"><div className="omHudhudQuickHead"><strong>✦ HudHud · Quran Studio</strong><button type="button" onClick={()=>setHudhudQuickOpen(false)} aria-label="Close HudHud controls">×</button></div><div key={hudhudQuickPage} className="omHudhudQuickSlide"><small>{hudhudQuickPage+1} / {hudhudQuickPages.length}</small><h3>{hudhudQuickPages[hudhudQuickPage].title}</h3><p>{hudhudQuickPages[hudhudQuickPage].detail}</p></div><div className="omHudhudQuickActions"><button type="button" onClick={()=>setHudhudQuickPage(p=>(p+hudhudQuickPages.length-1)%hudhudQuickPages.length)}>← Tip</button><button type="button" onClick={()=>jump(focusIndex-1)} disabled={focusIndex===0&&page===1}>↑ Verse</button><button type="button" onClick={()=>jump(focusIndex+1)} disabled={focusIndex===verses.length-1&&page===total}>↓ Verse</button><button type="button" onClick={()=>setHudhudQuickPage(p=>(p+1)%hudhudQuickPages.length)}>Tip →</button></div><button type="button" className="omHudhudQuickVision" onClick={()=>{setHudhudMode(v=>!v);window.dispatchEvent(new Event("1muslim:hudhud-vision-enable"))}}>✧ HudHud reading glow {hudhudMode?"ON":"OFF"}</button><div className="omHudhudQuickLinks"><Link href="/elm-tent/lessons">Lessons ↗</Link><Link href="/messages">Messages ↗</Link><Link href="/streaming">Live ↗</Link></div></div>}</div><ReadingAtmosphere verse={verses[focusIndex]?.verse_key||chapter+":"+versePosition} arabic={verses[focusIndex]?.text_uthmani||""}/><ElmiVerseMoment/><HudHudQuranText/><HudHudHomeIntro/><HudHudVision activeVerse={verses[focusIndex]?.verse_key||chapter+":"+versePosition} onNavigate={navigateVerse} onModeChange={setHudhudMode}/>{error&&<p role="alert">{error}</p>}{busy?<p>Loading verses…</p>:verses.filter((_,i)=>i===focusIndex).map((v)=><div className={"omQuranThreeLayer omQuranReadingFocus "+(readingFocus?"omQuranReadingFocusOn":"")} key={v.verse_key} style={{"--om-verse-glow-radius":`${verseGlow*.52}px`,"--om-verse-glow-inner":`${verseGlow*.32}px`,"--om-verse-glow-text":`${verseGlow*.12}px`,"--om-verse-glow-alpha":verseGlow/100} as React.CSSProperties}><div className="omQuranLayer omQuranLayerBack" aria-hidden="true"/><div className="omQuranLayer omQuranLayerMid" aria-hidden="true"/><article className={"omAyahCard omVerseTransition omAyahFocused omQuranFloatingVerse "+(compactStudio?"omQuranFloatingVerse--focus":"")} onTouchStart={e=>{const t=e.touches[0];swipeStart.current={x:t.clientX,y:t.clientY}}} onTouchEnd={e=>{const start=swipeStart.current;swipeStart.current=null;if(!start)return;const t=e.changedTouches[0];const dx=t.clientX-start.x,dy=t.clientY-start.y;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.4)jump(focusIndex+(dx<0?1:-1))}} data-verse-index={focusIndex} key={v.verse_key}><div className="omQuranMarkerCanvas">{(verseMarkers[v.verse_key]||[]).map(m=><button key={m.id} type="button" className="omQuranGlowMarker" aria-label={"Drag marker "+m.id} style={{left:m.x+"%",top:m.y+"%",width:m.size,height:m.size}} onPointerDown={e=>{e.stopPropagation();markerDrag.current={id:m.id,x:e.clientX,y:e.clientY,startX:m.x,startY:m.y,key:v.verse_key};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{const d=markerDrag.current;if(!d||d.id!==m.id)return;const rect=e.currentTarget.parentElement?.getBoundingClientRect();if(!rect)return;moveVerseMarker(m.id,d.startX+(e.clientX-d.x)/rect.width*100,d.startY+(e.clientY-d.y)/rect.height*100,d.key)}} onPointerUp={()=>{markerDrag.current=null}} onPointerCancel={()=>{markerDrag.current=null}}>✦</button>)}</div><div className="omAyahMeta"><strong>{v.verse_key}</strong><a href={"https://quran.com/"+v.verse_key} target="_blank" rel="noopener noreferrer">Study ↗</a></div><InlineAnnotations verse={v.verse_key} words={v.words} text={v.text_uthmani}/>{Boolean(v.words?.length)&&<div className="omQuranWordExplorer"><div className="omWordExplorerHeader"><strong>✧ Word Explorer</strong><small>Tap an Arabic word to explore it</small></div><div className="omWordChips" dir="rtl">{v.words?.filter(w=>w.text_uthmani).map(w=><button type="button" key={w.id} className={selectedWord?.id===w.id?"selected":""} onClick={()=>{setSelectedWord(w);setWordPanel("meaning")}} lang="ar">{w.text_uthmani}</button>)}</div>{selectedWord&&<div className="omWordDetail"><strong lang="ar" dir="rtl">{selectedWord.text_uthmani}</strong><span>{selectedWord.transliteration?.text||""}</span><div className="omWordTabs"><button className={wordPanel==="meaning"?"active":""} onClick={()=>setWordPanel("meaning")}>Meaning</button><button className={wordPanel==="root"?"active":""} onClick={()=>setWordPanel("root")}>Root</button><button className={wordPanel==="usage"?"active":""} onClick={()=>setWordPanel("usage")}>Usage</button></div><p>{wordPanel==="meaning"?(selectedWord.translation?.text||"Translation unavailable for this word."):"Verified root and usage data are not yet available for this word. Open the source for detailed linguistic study."}</p><a href={"https://quran.com/"+v.verse_key} target="_blank" rel="noopener noreferrer">Explore verse and context ↗</a></div>}</div>}{showTranslation&&<p className="omAyahEnglish">{strip(v.translations?.[0]?.text||"Translation not available.")}</p>}<div className="omAyahActions"><button onClick={()=>{const url="https://quran.com/"+v.verse_key;if(navigator.share)void navigator.share({title:"Qur'an "+v.verse_key,url}).catch(()=>{});else void navigator.clipboard.writeText(url)}}>↗ Share verse</button><a href={"https://quran.com/"+v.verse_key} target="_blank" rel="noopener noreferrer">📖 Read & listen</a></div><VerseEngagement verse={v.verse_key} onShare={()=>setShareVerse(v)}/><div className="omVerseLearningGrid"><div className="omVerseLearningMain"><VerseStudio verse={v.verse_key}/><VerseRecorder verse={v.verse_key}/><VerseDMShare verse={v.verse_key}/></div><VerseMediaTips verse={v.verse_key}/></div></article></div>)}</section></div>{shareVerse&&<VersePostStudio verse={shareVerse.verse_key} arabic={shareVerse.text_uthmani||shareVerse.words?.map(w=>w.text_uthmani||"").join(" ")||""} translation={shareVerse.translations?.[0]?.text||""} onClose={()=>setShareVerse(null)}/>}</div><style jsx global>{` .omQuranPage .omQuranDualProgress{flex:0 0 auto;width:min(90%,640px);margin:5px auto 8px;color:#e5ddff;font-size:11px;pointer-events:none}.omQuranPage .omQuranDualLabels,.omQuranPage .omQuranDualWhole{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 5px;letter-spacing:.02em}.omQuranPage .omQuranDualWhole{margin:8px 0 5px;color:#b8b7d6;font-size:10px}.omQuranPage .omQuranDualLabels strong{color:#b895ff}.omQuranPage .omQuranDualWhole strong{color:#67d3ef}.omQuranPage .omQuranDualTrack{height:7px;border-radius:20px;background:#42375eaa;overflow:hidden;box-shadow:inset 0 0 8px #08071a}.omQuranPage .omQuranDualTrack span{display:block;height:100%;border-radius:inherit;transition:width .65s cubic-bezier(.2,.8,.2,1)}.omQuranPage .omQuranDualChapterFill{background:linear-gradient(90deg,#a465ff,#d6a4ff);box-shadow:0 0 12px #a465ff}.omQuranPage .omQuranDualTrackWhole{height:4px;background:#213e49aa}.omQuranPage .omQuranDualWholeFill{background:linear-gradient(90deg,#218e9e,#50d3f6);box-shadow:0 0 10px #50d3f6}@media(prefers-reduced-motion:reduce){.omQuranPage .omQuranDualTrack span{transition:none}}
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

 /* Quiet reading: peripheral controls dissolve after two seconds; the single settings control stays discoverable. */
 .omQuranPage .omQuranGlassTop>*:not(.omQuranStudioSettings),
 .omQuranPage .omQuranGlassArrow,
 .omQuranPage .omQuranDualLabels,
 .omQuranPage .omQuranDualWhole,
 .omQuranPage .omQuranSimpleHint,
 .omQuranPage .omQuranGlassPageHead,
 .omQuranPage .omQuranCenterOrb{transition:opacity .7s ease,filter .7s ease,transform .7s ease!important}
 .omQuranReaderIdle .omQuranGlassTop>*:not(.omQuranStudioSettings),
 .omQuranReaderIdle .omQuranGlassArrow,
 .omQuranReaderIdle .omQuranDualLabels,
 .omQuranReaderIdle .omQuranDualWhole,
 .omQuranReaderIdle .omQuranSimpleHint,
 .omQuranReaderIdle .omQuranGlassPageHead,
 .omQuranReaderIdle .omQuranCenterOrb{opacity:.035!important;filter:blur(2px);pointer-events:none}
 .omQuranPage .omQuranStudioSettings{opacity:.32!important;background:rgba(20,60,45,.13)!important;border-color:rgba(221,201,150,.16)!important;backdrop-filter:blur(9px);animation:omQuranSettingsFloat 6s ease-in-out infinite}
 .omQuranPage .omQuranStudioSettings:focus-visible,.omQuranPage .omQuranStudioSettings:hover{opacity:1!important}
 @keyframes omQuranSettingsFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
 @media(prefers-reduced-motion:reduce){.omQuranPage .omQuranStudioSettings{animation:none}.omQuranPage .omQuranGlassTop>*,.omQuranPage .omQuranGlassArrow,.omQuranPage .omQuranCenterOrb{transition:none!important}}

 .omQuranPage .omQuranGlassArabic,.omQuranPage .omQuranSimpleVerse>p[lang="ar"]{font-size:var(--studio-arabic-size)!important;color:var(--studio-arabic-color)!important}
 .omQuranPage[data-studio-background="emerald"] .omQuranFirstReader{background:radial-gradient(circle at 65% 20%,#25644a,#061c16 75%)!important}
 .omQuranPage[data-studio-background="night"] .omQuranFirstReader{background:radial-gradient(circle at 75% 15%,#263f62,#080e21 75%)!important}
 .omQuranPage[data-studio-background="paper"] .omQuranFirstReader{background:linear-gradient(140deg,#3c3022,#201b16 70%)!important}
 .omQuranPage .omQuranPreferences{position:absolute;z-index:10020;top:55px;right:max(12px,env(safe-area-inset-right));width:min(320px,calc(100vw - 24px));max-height:calc(100dvh - 105px);overflow:auto;display:grid;gap:13px;padding:17px;border-radius:20px;border:1px solid #cbb57e70;background:#0b241ddf;backdrop-filter:blur(22px);box-shadow:0 15px 50px #0008;color:#f2ecd9}
 .omQuranPreferences header{display:flex;justify-content:space-between;align-items:center}.omQuranPreferences header button{border:0;background:transparent;color:inherit;font-size:24px}
 .omQuranPreferences label{display:grid;gap:6px;font-size:12px}.omQuranPreferences select,.omQuranPreferences input{width:100%;min-height:32px;accent-color:#cdb67b;background:#17382c;color:#fff;border:1px solid #bca77966;border-radius:9px;padding:5px}
 .omQuranPreferences .omQuranPreviewRecitation{background:#bba16b;color:#092017;border:0;border-radius:11px;padding:11px;font-weight:750}
 .omQuranPreferences small{opacity:.65}

.omQuranPage[data-studio-background="gold"] .omQuranFirstReader{background:linear-gradient(#081c16c9,#06140fdc),url("/assets/decorations/islamic-gold-ornament.PNG") center/contain no-repeat,#0a2119!important}
.omQuranPage[data-studio-background="white"] .omQuranFirstReader{background:linear-gradient(#081c16b8,#06140fcd),url("/assets/decorations/islamic-white-ornament.PNG") center/contain no-repeat,#0a2119!important}

.omQuranPage .omQuranFirstReader{isolation:isolate}
.omQuranPage .omQuranBackgroundOverlay{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:0}
.omQuranPage .omQuranBackgroundLeaving{position:absolute;inset:0;animation:omQuranImageDissolve 1.4s cubic-bezier(.2,.7,.2,1) forwards}
.omQuranPage .omQuranBackground-original{background:linear-gradient(#07131d55,#07131d55),url("/assets/quran-studio-background.PNG") center/cover no-repeat}
.omQuranPage .omQuranBackground-day{background:linear-gradient(#1029226e,#0920198c),url("/assets/control-center/backgrounds/workspace-day.PNG") center/cover no-repeat}
.omQuranPage .omQuranBackground-night{background:linear-gradient(#061b19a1,#041412ae),url("/assets/control-center/backgrounds/workspace-night.PNG") center/cover no-repeat}
@keyframes omQuranImageDissolve{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1.025)}}
@media(prefers-reduced-motion:reduce){.omQuranPage .omQuranBackgroundLeaving{animation:none;opacity:0}}

/* Qur'an Studio preferences: same emerald / champagne-gold design language as Home */
.omQuranPage .omQuranPreferences{color:#f6f6eb!important;background:radial-gradient(ellipse at 10% 0%,#235944 0%,transparent 58%),linear-gradient(150deg,#12382e,#071914 85%)!important;border:1px solid #bda97866!important;border-radius:24px!important;box-shadow:0 22px 70px #0009,inset 0 1px #ffffff22!important;backdrop-filter:blur(24px);padding:20px!important;font-family:inherit!important}
.omQuranPage .omQuranPreferences header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding-bottom:15px;margin-bottom:14px;border-bottom:1px solid #d7bf7d33}
.omQuranPage .omQuranPreferencesHeading{display:flex;flex-direction:column;gap:5px;min-width:0}
.omQuranPage .omQuranPreferencesEyebrow{font-size:9px!important;font-weight:800;letter-spacing:.19em;color:#dec88f!important}
.omQuranPage .omQuranPreferencesHeading strong{font-size:clamp(20px,4vw,27px)!important;letter-spacing:-.04em!important;font-weight:650!important;line-height:1.15;color:#f6f6eb!important}
.omQuranPage .omQuranPreferencesSubtitle{font-size:12px;color:#adc2b2}
.omQuranPage .omQuranPreferences header button{flex-shrink:0;display:grid;place-items:center;width:38px;height:38px;min-width:38px;border-radius:13px!important;background:#244b3eaa!important;border:1px solid #9c916866!important;color:#f6f6eb!important;font-size:23px;transition:transform .2s,border-color .2s}
.omQuranPage .omQuranPreferencesSection{display:grid;gap:12px;padding:14px;border:1px solid #bda97844;border-radius:19px;background:linear-gradient(145deg,#1c534188,#12372c99);margin:12px 0;box-shadow:inset 0 1px #ffffff14}
.omQuranPage .omQuranPreferencesSectionTitle{font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#dec88f}
.omQuranPage .omQuranPreferencesSection label{display:grid;gap:7px;font-size:12px;font-weight:650;color:#e4eadf;letter-spacing:.01em}
.omQuranPage .omQuranPreferencesSection select,.omQuranPage .omQuranPreferencesSection input[type="color"]{width:100%;min-height:43px;padding:10px 12px;border-radius:13px!important;border:1px solid #bda97855!important;background:#09231dd9!important;color:#f6f6eb!important;font:inherit;font-size:13px;outline-offset:3px}
.omQuranPage .omQuranPreferencesSection input[type="color"]{padding:5px;height:45px;cursor:pointer}
.omQuranPage .omQuranPreferencesSection input[type="range"]{width:100%;accent-color:#dec88f;min-height:24px;cursor:pointer}
.omQuranPage .omQuranPreferencesSection select:focus-visible,.omQuranPage .omQuranPreferences button:focus-visible{outline:2px solid #dec88f;outline-offset:3px}
.omQuranPage .omQuranPreferences .omQuranPreviewRecitation{width:100%;min-height:44px;border-radius:14px!important;border:1px solid #bca37388!important;background:#1b4236!important;color:#e9d8ad!important;font-weight:750!important;font-size:12px!important;letter-spacing:.03em;transition:background .2s,transform .2s}
.omQuranPage .omQuranPreferences button:active{transform:scale(.97)}
.omQuranPage .omQuranPreferences>small{display:block;text-align:center;color:#adc2b2!important;font-size:10px!important;margin-top:12px}
.omQuranPage .omQuranStudioSettings{border:1px solid #bca37388!important;background:#1b4236dd!important;color:#e9d8ad!important;border-radius:14px!important;transition:transform .2s,border-color .2s}
.omQuranPage .omQuranStudioSettings:hover{border-color:#e1c78a!important}
@media(max-width:520px){.omQuranPage .omQuranPreferences{padding:15px!important;border-radius:20px!important}.omQuranPage .omQuranPreferencesSection{padding:12px;gap:10px}}
@media(prefers-reduced-motion:reduce){.omQuranPage .omQuranPreferences button,.omQuranPage .omQuranStudioSettings{transition:none}}
/* Quran Studio preview: readable verse canvas and bilingual luminous top navigation. */
.omQuranPage .omQuranGlassTop{display:grid!important;grid-template-columns:auto minmax(0,1fr) auto auto!important;align-items:center!important;gap:clamp(5px,1.2vw,12px)!important;min-height:54px!important;padding:8px 10px!important;background:linear-gradient(145deg,#0a3026e6,#0b2336e5)!important;border:1px solid #e4cb8b85!important;border-radius:22px!important;backdrop-filter:blur(19px)!important;box-shadow:0 10px 30px #0007,inset 0 1px #fff3}
.omQuranPage .omQuranGlassTop>select{min-width:0!important;width:100%!important;max-width:100%!important;border-color:#d6bd7b91!important;text-overflow:ellipsis!important;color:#f9f4dc!important}
.omQuranPage .omQuranVerseBadge{display:flex!important;flex-direction:column;align-items:center;justify-content:center;gap:1px;min-width:48px;white-space:nowrap;color:#f7d88f;text-shadow:0 0 11px #f6d18d8c;animation:omQuranBadgeGlow 3.6s ease-in-out infinite}
.omQuranPage .omQuranVerseBadgeLabel{font-size:9px!important;letter-spacing:.01em;opacity:.9}
.omQuranPage .omQuranVerseBadge strong{font-size:13px;line-height:1.1}
@keyframes omQuranBadgeGlow{50%{text-shadow:0 0 20px #ffe9a7,0 0 6px #fff4d8}}
.omQuranPage .omQuranSimpleVerse{min-width:0!important;max-width:100%!important;gap:clamp(12px,2.5vh,28px)!important;justify-content:flex-start!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain;padding:14px 10px 28px!important}
.omQuranPage .omQuranSimpleVerse>p[lang="ar"],.omQuranPage .omQuranGlassArabic{font-size:clamp(26px,6vw,var(--studio-arabic-size))!important;line-height:1.95!important;max-width:100%!important;overflow-wrap:normal!important;word-break:normal!important;white-space:normal!important;hyphens:none!important;text-align:center!important}
.omQuranPage .omQuranSimpleTranslation,.omQuranPage .omQuranGlassTranslation{position:relative!important;max-width:100%!important;min-width:0!important;white-space:normal!important;overflow-wrap:break-word!important;font-size:clamp(14px,3.8vw,19px)!important;line-height:1.65!important;text-align:center!important}
@media(max-width:700px){.omQuranPage .omQuranGlassTop{grid-template-columns:auto minmax(0,1fr) auto auto!important;padding:7px!important;gap:5px!important}.omQuranPage .omQuranStudioExit{font-size:11px!important;padding:7px!important}.omQuranPage .omQuranStudioExit span{display:none!important}.omQuranPage .omQuranVerseBadgeLabel{font-size:8px!important}.omQuranPage .omQuranVerseBadge strong{font-size:12px!important}.omQuranPage .omQuranSimpleVerse{padding:10px 12px 95px!important}.omQuranPage .omQuranSimpleVerse>p[lang="ar"]{font-size:clamp(26px,7vw,42px)!important;line-height:1.9!important}.omQuranPage .omQuranSimpleTranslation{font-size:clamp(14px,3.9vw,18px)!important}}
@media(prefers-reduced-motion:reduce){.omQuranPage .omQuranVerseBadge{animation:none!important}}

/* Studio dashboard: existing reading card remains the centerpiece, facts are small companion cards. */
.omQuranPage .omQuranStudioData{position:relative;z-index:3;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;width:100%;margin:9px auto 12px;max-width:1000px}
.omQuranPage .omQuranStudioDataCard{display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:3px;min-width:0;min-height:72px;padding:11px 13px;border-radius:17px;border:1px solid #d8be825e;background:linear-gradient(140deg,#153e34dd,#0c2633db);box-shadow:0 8px 24px #0004,inset 0 1px #ffffff22;backdrop-filter:blur(14px);color:#f8f4e7;text-align:left;animation:omQuranDataArrive .85s cubic-bezier(.22,1,.36,1) both}
.omQuranPage .omQuranStudioDataCard:nth-child(2){animation-delay:.09s}.omQuranPage .omQuranStudioDataCard:nth-child(3){animation-delay:.18s}.omQuranPage .omQuranStudioDataCard:nth-child(4){animation-delay:.12s}.omQuranPage .omQuranStudioDataCard:nth-child(5){animation-delay:.22s}.omQuranPage .omQuranStudioDataCard:nth-child(6){animation-delay:.16s}.omQuranPage .omQuranStudioDataCard:nth-child(7){animation-delay:.28s}
.omQuranPage .omQuranStudioDataCard>span{font-size:9px;letter-spacing:.08em;color:#ddc892;font-weight:750}.omQuranPage .omQuranStudioDataCard>strong{font-size:clamp(13px,2vw,19px);line-height:1.22;color:#fff8d9;text-shadow:0 0 14px #e8c67d40}.omQuranPage .omQuranStudioDataCard>strong small{font-size:12px;opacity:.7}.omQuranPage .omQuranStudioDataCard>small{font-size:10px;line-height:1.35;color:#cad6c9;overflow-wrap:anywhere}.omQuranPage .omQuranStudioDataPrimary{background:linear-gradient(135deg,#235441e8,#102f30e8)}.omQuranPage .omQuranStudioDataPlay{cursor:pointer;transition:transform .28s ease,border-color .28s ease}.omQuranPage .omQuranStudioDataPlay:active{transform:scale(.97)}.omQuranPage .omQuranStudioDataPlay:focus-visible{outline:2px solid #f8dc9d;outline-offset:3px}.omQuranPage .omQuranStudioMiniTrack{height:5px;width:100%;border-radius:999px;background:#e7d9b332;overflow:hidden}.omQuranPage .omQuranStudioMiniTrack i{display:block;height:100%;background:linear-gradient(90deg,#8dba9e,#f5d58a);border-radius:inherit;transition:width .6s ease}
@keyframes omQuranDataArrive{from{opacity:0;transform:translateY(13px);filter:blur(3px)}to{opacity:1;transform:translateY(0);filter:blur(0)}}
@media(max-width:700px){.omQuranPage .omQuranStudioData{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:8px auto}.omQuranPage .omQuranStudioDataCard{min-height:68px;padding:9px 10px;border-radius:15px}.omQuranPage .omQuranStudioDataCard>span{font-size:8px}.omQuranPage .omQuranStudioDataCard>strong{font-size:14px}.omQuranPage .omQuranStudioDataFuture{grid-column:span 2}.omQuranPage .omQuranSimpleVerse{min-height:240px!important}}
@media(prefers-reduced-motion:reduce){.omQuranPage .omQuranStudioDataCard{animation:none!important}.omQuranPage .omQuranStudioMiniTrack i{transition:none!important}}

/* Stage 1 — visual excellence. Scoped to Quran Studio; original artwork unchanged. */
.omQuranPage .omQuranGlassTop{position:relative;z-index:8;width:min(100% - 20px,1060px);margin:clamp(10px,2vh,20px) auto 10px!important;background:linear-gradient(145deg,rgba(11,39,30,.88),rgba(7,23,23,.86))!important;border:1px solid rgba(222,195,133,.56)!important;border-radius:23px!important;box-shadow:0 20px 52px rgba(0,0,0,.64),0 6px 16px rgba(0,0,0,.34),inset 0 1px rgba(255,247,216,.13)!important;backdrop-filter:blur(24px) saturate(1.2)!important;animation:omQuranNavArrive .7s cubic-bezier(.22,1,.36,1) both,omQuranNavBreathe 8s ease-in-out .7s infinite}
@keyframes omQuranNavArrive{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
@keyframes omQuranNavBreathe{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
.omQuranPage .omQuranGlassTop>select{background:rgba(12,39,31,.7)!important;border-radius:12px!important;min-height:39px!important;font-size:clamp(12px,2.8vw,15px)!important}
.omQuranPage .omQuranSimpleVerse{width:min(100%,900px)!important;margin:10px auto!important;padding:clamp(20px,4vw,46px)!important;border:1px solid rgba(231,203,147,.4)!important;border-radius:clamp(22px,3vw,32px)!important;background:linear-gradient(145deg,rgba(12,42,35,.51),rgba(7,25,29,.48))!important;box-shadow:0 22px 65px rgba(0,0,0,.36),inset 0 1px rgba(255,255,255,.09)!important;backdrop-filter:blur(12px) saturate(1.12)!important}
.omQuranPage .omQuranSimpleVerse>p[lang="ar"]{text-shadow:0 2px 20px rgba(0,0,0,.38);line-height:2.05!important}
.omQuranPage .omQuranSimpleTranslation{border-top:1px solid rgba(225,199,142,.29);padding-top:clamp(14px,2vw,24px)!important;color:#f0eede!important}
.omQuranPage .omQuranGlassPage{border-color:rgba(226,197,139,.42)!important;box-shadow:0 22px 65px rgba(0,0,0,.42),inset 0 1px rgba(255,255,255,.09)!important}
.omQuranPage .omQuranStudioData{gap:clamp(8px,1.2vw,14px)!important;width:min(100% - 20px,1050px)!important;margin:12px auto 16px!important}
.omQuranPage .omQuranStudioDataCard{min-height:86px!important;padding:clamp(12px,1.4vw,18px)!important;gap:5px!important;border:1px solid rgba(220,192,130,.42)!important;border-radius:19px!important;background:linear-gradient(150deg,rgba(24,69,54,.78),rgba(8,33,38,.8))!important;box-shadow:0 10px 30px rgba(0,0,0,.28),inset 0 1px rgba(255,255,255,.1)!important;backdrop-filter:blur(18px) saturate(1.1)!important;animation:omQuranDataArrive .9s cubic-bezier(.22,1,.36,1) both,omQuranCardDrift var(--quran-card-duration,9s) ease-in-out var(--quran-card-delay,0s) infinite}
.omQuranPage .omQuranStudioDataCard:nth-child(2){--quran-card-duration:10.7s;--quran-card-delay:-3s;animation-delay:.09s,-3s}
.omQuranPage .omQuranStudioDataCard:nth-child(3){--quran-card-duration:8.8s;--quran-card-delay:-1s;animation-delay:.18s,-1s}
.omQuranPage .omQuranStudioDataCard:nth-child(4){--quran-card-duration:11.6s;--quran-card-delay:-5s;animation-delay:.12s,-5s}
.omQuranPage .omQuranStudioDataCard:nth-child(5){--quran-card-duration:9.6s;--quran-card-delay:-2s;animation-delay:.22s,-2s}
.omQuranPage .omQuranStudioDataCard:nth-child(6){--quran-card-duration:12.2s;--quran-card-delay:-6s;animation-delay:.16s,-6s}
.omQuranPage .omQuranStudioDataCard:nth-child(7){--quran-card-duration:10.2s;--quran-card-delay:-4s;animation-delay:.28s,-4s}
@keyframes omQuranCardDrift{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
.omQuranPage .omQuranStudioDataCard>span{font-size:clamp(9px,.9vw,11px)!important;line-height:1.4;letter-spacing:.11em!important}
.omQuranPage .omQuranStudioDataCard>strong{font-size:clamp(15px,1.6vw,20px)!important;line-height:1.25!important}
.omQuranPage .omQuranStudioDataCard>small{font-size:clamp(10px,1vw,12px)!important;line-height:1.5!important}
.omQuranPage .omQuranStudioDataPlay:hover{border-color:rgba(244,219,158,.85)!important;filter:brightness(1.08)}
@media(max-width:700px){.omQuranPage .omQuranGlassTop{width:calc(100% - 16px)!important;margin:10px auto 8px!important;border-radius:18px!important;min-height:50px!important}.omQuranPage .omQuranStudioData{width:calc(100% - 16px)!important;gap:8px!important}.omQuranPage .omQuranStudioDataCard{min-height:78px!important;padding:12px!important;border-radius:16px!important}.omQuranPage .omQuranSimpleVerse{width:calc(100% - 16px)!important;padding:clamp(18px,5vw,30px)!important;margin:8px auto!important;border-radius:22px!important}.omQuranPage .omQuranSimpleVerse>p[lang="ar"]{line-height:2!important}}
@media(max-width:360px){.omQuranPage .omQuranStudioData{grid-template-columns:1fr!important}.omQuranPage .omQuranStudioDataFuture{grid-column:auto!important}.omQuranPage .omQuranGlassTop{gap:4px!important;padding:6px!important}.omQuranPage .omQuranVerseBadge{min-width:42px!important}}
@media(prefers-reduced-motion:reduce){.omQuranPage .omQuranGlassTop,.omQuranPage .omQuranStudioDataCard{animation:none!important;transform:none!important}.omQuranPage .omQuranStudioDataPlay:hover{filter:none}}


/* Stage 2 — calm verse transitions, study context and integrated studio controls. */
.omQuranPage .omQuranVerseEnter{animation:omQuranVerseSettle .62s cubic-bezier(.2,.75,.22,1) both}
@keyframes omQuranVerseSettle{0%{opacity:0;transform:translateY(12px) scale(.992);filter:blur(3px)}65%{opacity:1;filter:blur(0)}100%{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}}
.omQuranPage .omQuranStudyContext{display:flex;align-items:center;justify-content:center;gap:9px;flex-wrap:wrap;width:100%;padding:0 0 13px;margin-bottom:5px;border-bottom:1px solid rgba(222,195,133,.26);color:#ead6a2;font-size:10px;letter-spacing:.12em;font-weight:750}
.omQuranPage .omQuranStudyContext small{font-size:10px;letter-spacing:0;color:#d4e4d5;border:1px solid rgba(221,197,143,.25);border-radius:999px;padding:4px 8px;background:rgba(11,43,32,.45)}
.omQuranPage .omQuranStudioDataCard{animation-name:omQuranDataArrive,omQuranCardDrift}
.omQuranPage .omQuranPreferences{position:relative;z-index:12;animation:omQuranSettingsArrive .38s cubic-bezier(.2,.8,.2,1) both;box-shadow:0 28px 85px rgba(0,0,0,.65),inset 0 1px rgba(255,255,255,.1)!important}
@keyframes omQuranSettingsArrive{from{opacity:0;transform:translateY(-8px) scale(.99)}to{opacity:1;transform:translateY(0) scale(1)}}
.omQuranPage .omQuranPreferencesSection{transition:border-color .25s ease,background .25s ease}
.omQuranPage .omQuranPreferencesSection:focus-within{border-color:rgba(238,211,149,.68);background:linear-gradient(145deg,rgba(35,89,67,.68),rgba(14,48,39,.82))}
.omQuranPage .omQuranStudioSettings:focus-visible,.omQuranPage .omQuranGlassTop>select:focus-visible{outline:2px solid #f1d69c;outline-offset:3px}
.omQuranPage .omQuranStudioMiniTrack i{transition:width .7s cubic-bezier(.2,.75,.2,1)}
@media(max-width:700px){.omQuranPage .omQuranStudyContext{gap:5px;padding-bottom:10px}.omQuranPage .omQuranStudyContext small{font-size:9px;padding:3px 6px}}
@media(prefers-reduced-motion:reduce){.omQuranPage .omQuranVerseEnter,.omQuranPage .omQuranPreferences,.omQuranPage .omQuranStudioDataCard{animation:none!important;filter:none!important;transform:none!important}.omQuranPage .omQuranStudioMiniTrack i,.omQuranPage .omQuranPreferencesSection{transition:none!important}}

.omQuranPage .omQuranEnableFloat{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;width:fit-content;max-width:calc(100% - 20px);margin:7px auto 10px;padding:9px 15px;border:1px solid #d9c38d88;border-radius:999px;background:linear-gradient(145deg,#184937c9,#0b2b2fdd);color:#f1dfaf;font-size:12px;font-weight:750;box-shadow:0 7px 24px #0005;cursor:pointer;transition:background .2s,transform .2s}
.omQuranPage .omQuranEnableFloat span{font-size:10px;color:#c3d5c4;font-weight:500}
.omQuranPage .omQuranEnableFloat:hover{background:#24523fe6}
.omQuranPage .omQuranEnableFloat:focus-visible{outline:2px solid #f2d89e;outline-offset:3px}
@media(prefers-reduced-motion:reduce){.omQuranPage .omQuranEnableFloat{transition:none}}


/* Quran Studio VerseFlow + cinematic focus; preserve original reading backgrounds. */
.omQuranPage .omQuranVerseFlow{animation:omVerseFlowIn 1.25s cubic-bezier(.18,.75,.22,1) both!important}
@keyframes omVerseFlowIn{0%{opacity:.05;filter:blur(9px);translate:0 24px}34%{opacity:.62;filter:blur(3px)}72%{opacity:1;filter:blur(0);translate:0 -2px}100%{opacity:1;filter:none;translate:0 0}}
.omQuranPage .omQuranVerseFlow:before{content:"";position:absolute;inset:0;pointer-events:none;z-index:4;background:linear-gradient(105deg,transparent 25%,#c3a2ff1b 47%,#f4e2ae25 52%,transparent 73%);animation:omVerseFlowLight 1.25s ease-out both}
@keyframes omVerseFlowLight{from{opacity:0;transform:translateX(-75%)}35%{opacity:1}to{opacity:0;transform:translateX(75%)}}
.omQuranPage .omQuranOrbitWidget{position:fixed;z-index:1002;right:12px;top:clamp(110px,19vh,190px);width:min(225px,44vw);border:1px solid #d7bb8c88;border-radius:17px;padding:10px;background:#17243acb;color:#f7efff;backdrop-filter:blur(17px);box-shadow:0 9px 30px #0008;touch-action:none;transition:opacity .8s,filter .8s;cursor:grab}
.omQuranPage .omQuranOrbitHandle{display:flex;align-items:center;justify-content:space-between;gap:6px;font-size:9px;letter-spacing:.08em;color:#dfc998}
.omQuranPage .omQuranOrbitHandle button{border:0;background:none;color:inherit;font-size:18px;cursor:pointer}
.omQuranPage .omQuranOrbitPickers{display:flex;gap:5px;margin-top:7px}
.omQuranPage .omQuranOrbitPickers select,.omQuranPage .omQuranOrbitPickers input{min-width:0;width:70%;border:1px solid #c4b0e866;border-radius:9px;padding:8px 5px;background:#11132f;color:white;font-size:11px}
.omQuranPage .omQuranOrbitPickers input{width:30%}
.omQuranPage .omQuranOrbitDot{position:fixed;z-index:1003;right:7px;top:26%;border:1px solid #c7b0fa77;border-radius:50%;background:#24204eaa;color:#e7d7ff;opacity:.55;width:24px;height:24px;cursor:pointer}
.omQuranPage .omQuranOrbitWidget[data-orbit-visible="false"]{opacity:0;pointer-events:none}
.omQuranPage.omQuranReaderIdle .omQuranOrbitWidget,.omQuranPage.omQuranReaderIdle .omQuranStudioData,.omQuranPage.omQuranReaderIdle .omQuranGlassTop,.omQuranPage.omQuranReaderIdle .omQuranDualProgress{opacity:0!important;pointer-events:none!important;filter:blur(9px);transition:opacity 1.4s ease,filter 1.4s ease,transform 1.4s ease!important}
.omQuranPage .omQuranSimpleReader,.omQuranPage .omQuranGlassDeck{transform-origin:50% 50%;transition:transform 6s cubic-bezier(.25,.1,.25,1),filter 6s ease}
.omQuranPage[data-cinema-phase="spotlight"] .omQuranSimpleReader,.omQuranPage[data-cinema-phase="spotlight"] .omQuranGlassDeck{transform:scale(1.014)}
.omQuranPage[data-cinema-phase="drift"] .omQuranSimpleReader,.omQuranPage[data-cinema-phase="drift"] .omQuranGlassDeck{transform:scale(1.023) translateX(-.3%)}
.omQuranPage[data-cinema-phase="spotlight"] .omQuranFirstReader:before,.omQuranPage[data-cinema-phase="drift"] .omQuranFirstReader:before{content:"";position:absolute;inset:0;pointer-events:none;z-index:0;background:radial-gradient(ellipse at 50% 44%,#d9c3ff16,transparent 56%);animation:omQuranSpotlight 6s ease-in-out both}
@keyframes omQuranSpotlight{from{opacity:0}to{opacity:1}}
@media(max-width:760px){.omQuranPage .omQuranOrbitWidget{top:22%;right:8px;width:min(190px,48vw)}.omQuranPage .omQuranOrbitDot{top:31%}}
@media(prefers-reduced-motion:reduce){.omQuranPage .omQuranVerseFlow,.omQuranPage .omQuranVerseFlow:before,.omQuranPage .omQuranFirstReader:before{animation:none!important}.omQuranPage .omQuranSimpleReader,.omQuranPage .omQuranGlassDeck{transform:none!important;transition:none!important}}


/* Quran Studio: three-depth atmosphere between the reading card glass and verse ink. */
.omQuranPage .omQuranCardFront{position:relative;isolation:isolate;overflow:hidden}
.omQuranPage .omQuranVerseAtmosphere{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden;border-radius:inherit;transform:scale(1);transition:transform 1.4s cubic-bezier(.2,.7,.2,1),filter 1.4s ease}
.omQuranPage .omQuranCardFront>.omQuranGlassPageHead,.omQuranPage .omQuranCardFront>.omQuranGlassArabic,.omQuranPage .omQuranCardFront>.omQuranGlassTranslation,.omQuranPage .omQuranCardFront>.omQuranGlassCitation{position:relative;z-index:1}
.omQuranPage .omQuranAtmosphereAurora{position:absolute;inset:-30%;background:radial-gradient(ellipse at 30% 42%,#a57cff20,transparent 42%),radial-gradient(ellipse at 70% 65%,#83b4ff16,transparent 42%);filter:blur(28px);animation:omQuranAuroraDrift 17s ease-in-out infinite alternate}
.omQuranPage .omQuranAtmosphereOrbit{position:absolute;left:50%;top:50%;width:72%;aspect-ratio:1;border-radius:50%;border:1px solid #d9c2ff13;box-shadow:0 0 40px #aa91ff0b;transform:translate(-50%,-50%) rotate(0);animation:omQuranOrbitDrift 28s linear infinite}
.omQuranPage .omQuranAtmosphereOrbitTwo{width:105%;animation-duration:39s;animation-direction:reverse;border-color:#94baff10}
.omQuranPage .omQuranVerseAtmosphere>i{position:absolute;display:block;border-radius:50%;background:#e2d2ff;box-shadow:0 0 10px 2px #c2a1ff7d;opacity:.2;animation:omQuranParticleRise 11s ease-in-out infinite alternate;will-change:transform,opacity}
.omQuranPage .omQuranGlassArabic{animation:omQuranInkBreath 11s ease-in-out infinite;transform-origin:center}
.omQuranPage .omQuranAtmospherePulse{animation:omQuranAtmosphereTap 1.25s ease-out both}
.omQuranPage .omQuranGlassDeck:active .omQuranVerseAtmosphere{transform:scale(1.06);filter:brightness(1.2)}
.omQuranPage:has(.omQuranLightShake) .omQuranVerseAtmosphere{transform:scale(1.09);filter:brightness(1.35)}
@keyframes omQuranAuroraDrift{from{transform:translate3d(-3%,2%,0) scale(1)}to{transform:translate3d(4%,-3%,0) scale(1.12)}}
@keyframes omQuranOrbitDrift{to{transform:translate(-50%,-50%) rotate(360deg)}}
@keyframes omQuranParticleRise{0%{transform:translate3d(0,9px,0) scale(.65);opacity:.12}55%{opacity:.48}100%{transform:translate3d(5px,-15px,0) scale(1.25);opacity:.17}}
@keyframes omQuranInkBreath{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
@keyframes omQuranAtmosphereTap{0%{filter:brightness(1);transform:scale(1)}32%{filter:brightness(1.7);transform:scale(1.08)}100%{filter:brightness(1);transform:scale(1)}}
@media(prefers-reduced-motion:reduce){.omQuranPage .omQuranVerseAtmosphere *,.omQuranPage .omQuranVerseAtmosphere,.omQuranPage .omQuranGlassArabic{animation:none!important;transition:none!important;transform:none!important}}

/* HudHud Motion 2.0 — Quran Studio choreography. Keep the verse ink readable. */
.omQuranPage .omQuranVerseAtmosphere{transition:transform 1.4s cubic-bezier(.16,.76,.22,1),filter 1.4s ease,opacity 1.4s ease}
.omQuranPage.omQuranHudHudExpanded .omQuranVerseAtmosphere{transform:scale(1.11);filter:brightness(1.24) saturate(1.12)}
.omQuranPage.omQuranHudHudExpanded .omQuranAtmosphereAurora{animation-duration:11s;opacity:.9}
.omQuranPage.omQuranHudHudExpanded .omQuranAtmosphereOrbitOne{animation-duration:19s}
.omQuranPage.omQuranHudHudExpanded .omQuranAtmosphereOrbitTwo{animation-duration:27s}
.omQuranPage.omQuranHudHudExpanded .omQuranVerseAtmosphere>i{animation-duration:6.8s;opacity:.48}
.omQuranPage .omQuranGlassArabic{transition:letter-spacing 1.2s ease,filter 1.2s ease}
.omQuranPage.omQuranHudHudExpanded .omQuranGlassArabic{filter:drop-shadow(0 0 9px #b9a0ff22)}
@media(prefers-reduced-motion:reduce){.omQuranPage.omQuranHudHudExpanded .omQuranVerseAtmosphere,.omQuranPage.omQuranHudHudExpanded .omQuranGlassArabic{animation:none!important;transition:none!important;filter:none!important;transform:none!important}}

/* Quran workspace redesign: home-inspired glass dashboard with independently scrollable facts.
   Keeps original reader, navigation, audio, progress and user-selected artwork intact. */
.omQuranPage .omQuranAppStage{isolation:isolate;overflow:visible;border:1px solid rgba(223,198,143,.48);border-radius:30px;box-shadow:0 18px 70px #0007,inset 0 1px #fff2;backdrop-filter:blur(4px)}
.omQuranPage .omQuranStudioData{box-sizing:border-box;grid-template-columns:repeat(2,minmax(0,1fr));gap:clamp(14px,2.2vw,24px)!important;padding:clamp(13px,2.2vw,25px);margin:16px auto 22px;max-width:1080px;max-height:min(48dvh,470px);overflow-y:auto;overscroll-behavior-y:contain;scrollbar-width:thin;scrollbar-color:#c9ae77aa transparent;border:1px solid #d7bf8259;border-radius:26px;background:linear-gradient(145deg,#08281fb3,#091e30a3);box-shadow:0 12px 38px #0005,inset 0 1px #fff2;backdrop-filter:blur(9px);-webkit-overflow-scrolling:touch;align-content:start}
.omQuranPage .omQuranStudioDataCard{min-height:clamp(115px,14dvh,158px);height:auto;box-sizing:border-box;gap:8px;padding:clamp(15px,2.8vw,23px);border-radius:22px;border-color:#d7bf8273;background:linear-gradient(140deg,#18473ec4,#0b2635c4);box-shadow:0 8px 22px #0003,inset 0 1px #ffffff2a;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
.omQuranPage .omQuranStudioDataCard>span{font-size:clamp(10px,1.3vw,13px);letter-spacing:.12em}
.omQuranPage .omQuranStudioDataCard>strong{font-size:clamp(19px,3vw,29px)}
.omQuranPage .omQuranStudioDataCard>small{font-size:clamp(12px,1.65vw,15px);line-height:1.45}
.omQuranPage .omQuranStudioDataFuture{grid-column:1/-1}
.omQuranPage .omQuranStudioDataPlay{transition:transform .4s cubic-bezier(.22,1,.36,1),box-shadow .4s ease,border-color .4s ease}
.omQuranPage .omQuranStudioDataPlay:hover{transform:translateY(-2px);border-color:#f1d69bb5;box-shadow:0 14px 34px #0005,0 0 18px #e6c47a22}
@media(max-width:650px){.omQuranPage .omQuranStudioData{max-height:46dvh;gap:14px!important;padding:13px;border-radius:24px}.omQuranPage .omQuranStudioDataCard{min-height:118px;padding:15px;border-radius:19px}.omQuranPage .omQuranStudioDataCard>strong{font-size:clamp(18px,4.3vw,24px)}}
@media(prefers-reduced-motion:reduce){.omQuranPage .omQuranStudioDataPlay{transition:none!important}}


/* Quran Studio serenity pass — only presentation, never verse or recitation state. */
.omQuranPage .omQuranStudioData{scroll-behavior:smooth;scroll-snap-type:y proximity;scroll-padding-block:16px;position:relative;isolation:isolate;transition:border-color .65s ease,box-shadow .65s ease,background-color .65s ease}
.omQuranPage .omQuranStudioData:focus-within{border-color:#eed59a9c;box-shadow:0 14px 45px #0005,inset 0 1px #fff3,0 0 25px #dfbf7722}
.omQuranPage .omQuranStudioDataCard{scroll-snap-align:start;position:relative;isolation:isolate;overflow:hidden;transition:transform .55s cubic-bezier(.22,1,.36,1),border-color .6s ease,box-shadow .6s ease,background-color .6s ease;will-change:auto}
.omQuranPage .omQuranStudioDataCard::after{content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;background:linear-gradient(112deg,transparent 24%,#f7dfa70b 44%,#fff3ce24 50%,#f7dfa70b 56%,transparent 75%);background-size:260% 100%;background-position:100% 0;animation:omQuranSereneShimmer 18s ease-in-out infinite}
.omQuranPage .omQuranStudioDataCard:nth-child(3n+2)::after{animation-delay:-6s}
.omQuranPage .omQuranStudioDataCard:nth-child(3n)::after{animation-delay:-12s}
.omQuranPage .omQuranStudioDataCard:hover,.omQuranPage .omQuranStudioDataCard:focus-within{transform:translateY(-2px);border-color:#f1d8a9a1;box-shadow:0 12px 28px #0005,inset 0 1px #fff3,0 0 18px #e6c9871b}
.omQuranPage .omQuranStudioDataCard:active{transform:scale(.988)}
.omQuranPage .omQuranStudioDataCard>strong,.omQuranPage .omQuranStudioDataCard>small{position:relative;z-index:1}
.omQuranPage .omQuranStudioMiniTrack{overflow:hidden;border-radius:999px}
.omQuranPage .omQuranStudioMiniTrack i{transition:width 1.1s cubic-bezier(.22,1,.36,1);box-shadow:0 0 13px #f4d99c7d}
@keyframes omQuranSereneShimmer{0%,65%,100%{background-position:100% 0;opacity:.15}82%{background-position:0 0;opacity:.65}}
@media(max-width:650px){.omQuranPage .omQuranStudioData{scroll-padding-block:12px;overscroll-behavior:contain}.omQuranPage .omQuranStudioDataCard{gap:7px;min-width:0}.omQuranPage .omQuranStudioDataCard>strong{overflow-wrap:anywhere}}
@media(prefers-reduced-motion:reduce){.omQuranPage .omQuranStudioData{scroll-behavior:auto!important}.omQuranPage .omQuranStudioDataCard,.omQuranPage .omQuranStudioDataCard::after,.omQuranPage .omQuranStudioMiniTrack i{animation:none!important;transition:none!important;transform:none!important}}


/* Calm reading focus: verse-only illumination, user-adjustable, no flashing. */
.omQuranPage .omQuranStudyDim .omQuranStudioDataCard{filter:brightness(.83) saturate(.86);transition:filter .7s ease,transform .55s ease,border-color .6s ease}
.omQuranPage .omQuranStudyDim .omQuranStudioDataCard:hover,.omQuranPage .omQuranStudyDim .omQuranStudioDataCard:focus-within{filter:brightness(1)}
.omQuranPage .omQuranReadingFocus .omInlineWords{position:relative;isolation:isolate;border-radius:22px;padding:clamp(16px,3vw,32px);transition:box-shadow .85s ease,background-color .85s ease}
.omQuranPage .omQuranReadingFocusOn .omInlineWords{background:rgba(15,24,31,.19);box-shadow:0 0 var(--om-verse-glow-radius) rgba(237,211,155,calc(var(--om-verse-glow-alpha) * .21)),inset 0 0 var(--om-verse-glow-inner) rgba(244,222,175,calc(var(--om-verse-glow-alpha) * .12))}
.omQuranPage .omQuranReadingFocusOn .omInlineWords .omInlineWord,.omQuranPage .omQuranReadingFocusOn .omInlineWords>p{filter:drop-shadow(0 0 var(--om-verse-glow-text) rgba(255,235,186,calc(var(--om-verse-glow-alpha) * .56)));transition:filter .8s ease}
.omQuranPage .omQuranThreeLayer.omQuranReadingFocus{animation:omQuranVerseArrival .65s cubic-bezier(.2,.65,.3,1) both}
@keyframes omQuranVerseArrival{from{opacity:0;transform:translateY(7px);filter:blur(2px)}to{opacity:1;transform:translateY(0);filter:blur(0)}}
@media(prefers-reduced-motion:reduce){.omQuranPage .omQuranThreeLayer.omQuranReadingFocus{animation:none!important}.omQuranPage .omQuranReadingFocus .omInlineWords,.omQuranPage .omQuranReadingFocusOn .omInlineWords .omInlineWord,.omQuranPage .omQuranStudyDim .omQuranStudioDataCard{transition:none!important}}


/* Swipe-controlled atmosphere; overlays never obscure the sacred Arabic text. */
.omQuranPage .omQuranFirstReader{isolation:isolate}
.omQuranPage .omQuranFirstReader::after{content:"";position:absolute;inset:0;pointer-events:none;background:rgba(0,0,0,calc(var(--om-reader-dim)*.55));z-index:0;transition:background-color .12s linear}
.omQuranPage .omQuranFirstReader .omQuranBackgroundOverlay{filter:blur(var(--om-reader-blur));transition:filter .15s linear}
.omQuranPage .omQuranFirstReader>.omQuranGlassTop,.omQuranPage .omQuranFirstReader>.omQuranAtmosphereControls,.omQuranPage .omQuranFirstReader>.omQuranAtmosphereSwipeBottom{position:relative;z-index:6}
.omQuranPage .omQuranAtmosphereSwipe{display:flex;justify-content:space-between;align-items:center;gap:12px;max-width:400px;margin:7px auto;padding:9px 18px;border:1px solid #d7bf8252;border-radius:999px;background:#061b20a6;backdrop-filter:blur(12px);color:#f3e7cc;font-size:11px;letter-spacing:.09em;touch-action:pan-y;user-select:none;cursor:ew-resize}
.omQuranPage .omQuranAtmosphereSwipe:focus-visible{outline:2px solid #e5cb8b;outline-offset:3px}
.omQuranPage .omQuranAtmosphereSwipeTop{margin-top:8px}
.omQuranPage .omQuranAtmosphereSwipeBottom{margin-bottom:10px}
@media(max-width:650px){.omQuranPage .omQuranAtmosphereSwipe{width:min(76%,330px);padding:8px 15px}}
@media(prefers-reduced-motion:reduce){.omQuranPage .omQuranFirstReader::after,.omQuranPage .omQuranFirstReader .omQuranBackgroundOverlay{transition:none!important}}


/* Phase 1: Quran-first hierarchy inspired by the Home glass workspace. */
.omQuranPage .omQuranFirstReader{display:flex!important;flex-direction:column!important;gap:clamp(12px,2vw,20px)!important;align-items:stretch}
.omQuranPage .omQuranFirstReader>.omQuranSimpleReader{order:2!important;display:flex!important;flex-direction:column!important;justify-content:center!important;min-height:clamp(290px,48dvh,610px)!important;padding:clamp(24px,5vw,55px)!important;border:1px solid #dfc58891!important;border-radius:30px!important;background:linear-gradient(160deg,#0b292a91,#0c1c2d9e)!important;backdrop-filter:blur(13px)!important;-webkit-backdrop-filter:blur(13px)!important;box-shadow:0 18px 48px #0006,inset 0 1px #fff3,0 0 28px #e6c88710!important;position:relative;z-index:2}
.omQuranPage .omQuranFirstReader>.omQuranSimpleReader .omQuranSimpleVerse{display:block!important;min-height:0!important;overflow:visible!important}
.omQuranPage .omQuranFirstReader>.omQuranSimpleReader .omQuranSimpleVerse>p[lang="ar"]{font-size:clamp(29px,5vw,54px)!important;line-height:2.15!important;text-align:center!important;text-shadow:0 0 18px #f1dfb53b!important}
.omQuranPage .omQuranFirstReader>.omQuranSimpleReader .omQuranSimpleTranslation{line-height:1.75!important;text-align:center!important}
.omQuranPage .omQuranFirstReader>.omQuranStudioData{order:4!important;max-height:290px!important;overflow-y:auto!important;scrollbar-width:thin!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important;margin:0 auto!important;width:100%!important;max-width:1080px!important}
.omQuranPage .omQuranFirstReader>.omQuranStudioData .omQuranStudioDataCard{min-height:115px!important;padding:14px!important}
.omQuranPage .omQuranFirstReader>.omQuranStudioData .omQuranStudioDataFuture{grid-column:1/-1!important}
.omQuranPage .omQuranFirstReader>.omQuranGlassTop{order:0!important}
.omQuranPage .omQuranFirstReader>.omQuranAtmosphereControls{order:1!important}
.omQuranPage .omQuranFirstReader>.omQuranGlassDeck{order:3!important}
.omQuranPage .omQuranFirstReader>.omQuranAtmosphereSwipeBottom{order:5!important}
.omQuranPage .omQuranFirstReader>.omQuranEnableFloat{order:6!important}
.omQuranPage .omQuranOrbitWidget{max-width:min(90vw,380px)!important}
@media(max-width:650px){.omQuranPage .omQuranFirstReader>.omQuranSimpleReader{min-height:43dvh!important;padding:20px 17px!important;border-radius:24px!important}.omQuranPage .omQuranFirstReader>.omQuranStudioData{max-height:245px!important;padding:10px!important}.omQuranPage .omQuranFirstReader>.omQuranStudioData .omQuranStudioDataCard{min-height:100px!important;padding:12px!important}.omQuranPage .omQuranFirstReader>.omQuranSimpleReader .omQuranSimpleVerse>p[lang="ar"]{font-size:clamp(28px,7vw,43px)!important}}


/* Phase 1.1: ONE primary Qur'an reader, not two competing verse panels. */
.omQuranPage .omQuranFirstReader{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:14px!important}
.omQuranPage .omQuranFirstReader>.omQuranGlassDeck{order:2!important;display:block!important;position:relative!important;z-index:3!important;margin:8px auto 0!important;width:100%!important;max-width:1080px!important;min-height:clamp(320px,53dvh,700px)!important}
.omQuranPage .omQuranGlassDeck .omQuranGlassPage{background:linear-gradient(160deg,#0a2926a8,#0b1b2ec0)!important;backdrop-filter:blur(12px)!important;-webkit-backdrop-filter:blur(12px)!important;border:1px solid #e3c88b91!important;border-radius:28px!important;box-shadow:0 16px 50px #0007,inset 0 1px #fff3,0 0 20px #e6c88715!important}
.omQuranPage .omQuranGlassDeck .omQuranGlassArabic{font-size:clamp(29px,4.8vw,56px)!important;line-height:2.15!important;text-align:center!important;max-height:none!important;overflow:visible!important}
.omQuranPage .omQuranGlassDeck .omQuranGlassTranslation{line-height:1.8!important}
.omQuranPage .omQuranFirstReader>.omQuranStudioData{order:5!important;position:relative!important;z-index:2!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important;max-height:270px!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;margin:0 auto!important;width:100%!important;max-width:1080px!important;scrollbar-width:thin!important}
.omQuranPage .omQuranFirstReader>.omQuranStudioData .omQuranStudioDataCard{min-height:100px!important;padding:14px!important;overflow:hidden!important}
.omQuranPage .omQuranFirstReader>.omQuranStudioData .omQuranStudioDataFuture{grid-column:1/-1!important}
.omQuranPage .omQuranFirstReader>.omQuranCenterOrb{order:3!important;position:relative!important;z-index:8!important;margin:0 auto!important;transform:none!important}
.omQuranPage .omQuranFirstReader>.omQuranGlassTop{order:0!important}
.omQuranPage .omQuranFirstReader>.omQuranAtmosphereControls{order:1!important}
.omQuranPage .omQuranFirstReader>.omQuranAtmosphereSwipeBottom{order:4!important}
.omQuranPage .omQuranFirstReader>.omQuranEnableFloat{order:6!important}
.omQuranPage .omQuranFirstReader>.omQuranOrbitWidget[data-orbit-visible="false"]{display:none!important}
@media(max-width:650px){.omQuranPage .omQuranFirstReader>.omQuranGlassDeck{min-height:42dvh!important}.omQuranPage .omQuranGlassDeck .omQuranGlassPage{border-radius:24px!important}.omQuranPage .omQuranGlassDeck .omQuranGlassArabic{font-size:clamp(28px,7vw,44px)!important}.omQuranPage .omQuranFirstReader>.omQuranStudioData{max-height:230px!important;padding:10px!important}.omQuranPage .omQuranFirstReader>.omQuranStudioData .omQuranStudioDataCard{min-height:96px!important;padding:12px!important}}


/* HudHud phase: double-tap pauses recitation and gently opens Peace Mode. */
.omQuranPage .omQuranFirstReader.omQuranPeaceMode>.omQuranGlassDeck{transform:scale(.965);transition:transform 1.1s cubic-bezier(.22,1,.36,1),filter 1.1s ease;filter:saturate(.78)}
.omQuranPage .omQuranFirstReader:not(.omQuranPeaceMode)>.omQuranGlassDeck{transform:scale(1);transition:transform 1.1s cubic-bezier(.22,1,.36,1),filter 1.1s ease}
.omQuranPage .omQuranFirstReader.omQuranPeaceMode .omQuranGlassPage{box-shadow:0 16px 55px #0008,inset 0 1px #fff2,0 0 45px #cdbb9b16!important;transition:box-shadow 1.2s ease,background 1.2s ease}
.omQuranPage .omQuranFirstReader.omQuranPeaceMode .omQuranCenterOrb{filter:drop-shadow(0 0 18px #e9d3a96b);transition:filter 1.2s ease,transform 1.2s ease}
@media(prefers-reduced-motion:reduce){.omQuranPage .omQuranFirstReader.omQuranPeaceMode>.omQuranGlassDeck,.omQuranPage .omQuranFirstReader:not(.omQuranPeaceMode)>.omQuranGlassDeck,.omQuranPage .omQuranFirstReader.omQuranPeaceMode .omQuranGlassPage{transition:none!important}}


/* Phase 3: a single floating glass reader; verse motion stays gentle and readable. */
.omQuranPage .omQuranVerseFloat{transform-origin:50% 48%;animation:omQuranFloatingStillness 13s ease-in-out infinite;will-change:auto;perspective:1400px}
.omQuranPage .omQuranVerseFloat.omQuranVerseRefocusing{animation:omQuranVerseRecenter 1.25s cubic-bezier(.22,1,.36,1) both!important}
.omQuranPage .omQuranVerseFloat.omQuranFloatPeace{animation-duration:18s}
.omQuranPage .omQuranGentleVerse{animation:omQuranVerseClarity 1.05s cubic-bezier(.22,1,.36,1) both;backface-visibility:hidden}
.omQuranPage .omQuranVerseFloat .omQuranGlassArabic,.omQuranPage .omQuranVerseFloat .omQuranGlassTranslation{animation:omQuranWordsArrive 1.1s ease-out both}
@keyframes omQuranFloatingStillness{0%,100%{translate:0 0;rotate:0deg}50%{translate:0 -4px;rotate:.16deg}}
@keyframes omQuranVerseRecenter{0%{translate:0 0;rotate:-.65deg;filter:blur(1.8px) brightness(.85)}40%{translate:0 -5px;rotate:.28deg;filter:blur(.7px) brightness(.95)}100%{translate:0 0;rotate:0deg;filter:blur(0) brightness(1)}}
@keyframes omQuranVerseClarity{0%{opacity:.45;filter:blur(2px)}60%{opacity:.9;filter:blur(.4px)}100%{opacity:1;filter:blur(0)}}
@keyframes omQuranWordsArrive{0%{opacity:.55;filter:blur(1px)}100%{opacity:1;filter:blur(0)}}
@media(prefers-reduced-motion:reduce){.omQuranPage .omQuranVerseFloat,.omQuranPage .omQuranVerseFloat.omQuranVerseRefocusing,.omQuranPage .omQuranGentleVerse,.omQuranPage .omQuranVerseFloat .omQuranGlassArabic,.omQuranPage .omQuranVerseFloat .omQuranGlassTranslation{animation:none!important;translate:none!important;rotate:none!important;filter:none!important}}

`}</style><QuranLiveWidget compact/></main><style>{`
.quranStudioEntryCurtain{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;pointer-events:none;background:linear-gradient(145deg,rgba(5,17,34,.65),rgba(24,12,57,.93));animation:quranStudioEntryOut .85s ease both}
.quranStudioEntryCurtain span{color:#f3dfad;font-size:clamp(34px,6vw,68px);text-shadow:0 0 24px rgba(229,196,132,.4)}
@keyframes quranStudioEntryOut{0%,22%{opacity:1}100%{opacity:0}}
@media(prefers-reduced-motion:reduce){.quranStudioEntryCurtain{animation:none;display:none}}
`}</style></>;
}