"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import styles from "./ElmTentAlphabet.module.css";

const LETTERS=[
["ا","Alif"],["ب","Bā"],["ت","Tā"],["ث","Thā"],["ج","Jīm"],["ح","Ḥā"],["خ","Khā"],
["د","Dāl"],["ذ","Dhāl"],["ر","Rā"],["ز","Zāy"],["س","Sīn"],["ش","Shīn"],["ص","Ṣād"],
["ض","Ḍād"],["ط","Ṭā"],["ظ","Ẓā"],["ع","ʿAyn"],["غ","Ghayn"],["ف","Fā"],["ق","Qāf"],
["ك","Kāf"],["ل","Lām"],["م","Mīm"],["ن","Nūn"],["ه","Hā"],["و","Wāw"],["ي","Yā"]
] as const;
const KEY="1muslim:elm-tent:alphabet-practice:v1";
const LESSON_COUNT=8;
export default function ElmTentAlphabet(){
 const [selected,setSelected]=useState(0);
 const [lesson,setLesson]=useState(0);
 const [lessonWindow,setLessonWindow]=useState(0);
 const [hudhudPlayed,setHudhudPlayed]=useState(false);
 const swipeStart=useRef<number|null>(null);
 const [practiced,setPracticed]=useState<number[]>([]);
 const [ready,setReady]=useState(false);
 const [playing,setPlaying]=useState(false);
 const [audioMessage,setAudioMessage]=useState("");
 const [showAll,setShowAll]=useState(false);
 const speech=useRef<SpeechSynthesisUtterance|null>(null);
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem(KEY)||"[]");if(Array.isArray(saved))setPracticed(saved.filter((x:unknown)=>Number.isInteger(x)&&Number(x)>=0&&Number(x)<LETTERS.length))}catch{}setReady(true);return()=>{if(typeof window!=="undefined"&&"speechSynthesis" in window)window.speechSynthesis.cancel()}},[]);
 const mark=()=>setPracticed(current=>{const next=current.includes(selected)?current:current.concat(selected);try{localStorage.setItem(KEY,JSON.stringify(next))}catch{}return next});
 const hear=()=>{
  if(typeof window==="undefined"||!("speechSynthesis" in window)){setAudioMessage("Audio preview is not available on this device.");return}
  window.speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(LETTERS[selected][0]);utterance.lang="ar-SA";utterance.rate=.72;utterance.pitch=1;
  const voices=window.speechSynthesis.getVoices();const arabic=voices.find(v=>v.lang.toLowerCase().startsWith("ar"));if(arabic)utterance.voice=arabic;
  utterance.onstart=()=>setPlaying(true);utterance.onend=()=>setPlaying(false);utterance.onerror=()=>{setPlaying(false);setAudioMessage("Could not play this letter on your device.")};
  speech.current=utterance;setAudioMessage(arabic?"":"Device pronunciation preview; an Arabic voice may not be installed.");window.speechSynthesis.speak(utterance);
 };
 const chooseLesson=(index:number)=>{setLesson(Math.max(0,Math.min(LESSON_COUNT-1,index)));setSelected(0);setHudhudPlayed(false)};
 const select=(index:number)=>{setHudhudPlayed(false);if(typeof window!=="undefined"&&"speechSynthesis" in window)window.speechSynthesis.cancel();setPlaying(false);setSelected(index);setAudioMessage("")};
 useEffect(()=>{const onHudHud=()=>{if(!hudhudPlayed){hear();setHudhudPlayed(true)}else{mark();setHudhudPlayed(false);if(selected===LETTERS.length-1){chooseLesson(Math.min(lesson+1,LESSON_COUNT-1))}else select(selected+1)}};window.addEventListener("1muslim:elm-tent-hudhud",onHudHud);return()=>window.removeEventListener("1muslim:elm-tent-hudhud",onHudHud)});
 return <div className={styles.root} onTouchStart={e=>{swipeStart.current=e.touches[0].clientY}} onTouchEnd={e=>{if(swipeStart.current===null)return;const delta=e.changedTouches[0].clientY-swipeStart.current;swipeStart.current=null;if(Math.abs(delta)>90)chooseLesson(lesson+(delta<0?1:-1))}}>
  <nav className={styles.lessonNav} aria-label="Elm Tent lessons"><button type="button" aria-label="Previous lessons" onClick={()=>setLessonWindow(0)}>‹</button>{Array.from({length:4},(_,i)=>lessonWindow*4+i).map(i=><button type="button" key={i} className={lesson===i?styles.lessonActive:""} aria-current={lesson===i?"step":undefined} onClick={()=>chooseLesson(i)}><span>{i+1}</span><small>{i<2?"Letters":"Soon"}</small></button>)}<button type="button" aria-label="Next lessons" onClick={()=>setLessonWindow(1)}>›</button></nav>
  <div className={styles.lessonStage} key={lesson}><strong>LESSON {lesson+1} / 8</strong>{lesson>1?<div className={styles.soon}>✦ Lesson {lesson+1} · Coming Soon</div>:null}</div>
  <div className={styles.top}><span className={styles.kicker}>✦ ELM TENT · LAUNCH WIDGET</span><span lang="ar" dir="rtl">خيمة العلم</span></div>
  <div className={styles.title}><div><h2>{lesson===0?"Arabic Alphabet":lesson===1?"Arabic Alphabet · Lesson 2":`Lesson ${lesson+1}`}</h2><p>Listen · Repeat · Practice</p></div><div className={styles.counter}><strong>{practiced.length}<span> / 28</span></strong><small>practiced</small></div></div>
  <div className={styles.progress} role="progressbar" aria-label="Letters practiced" aria-valuemin={0} aria-valuemax={28} aria-valuenow={practiced.length}><span style={{width:(practiced.length/28*100)+"%"}}/></div>
  <div className={styles.stage}>
   <button className={styles.previous} type="button" onClick={()=>select((selected+27)%28)} aria-label="Previous letter">‹</button>
   <div className={styles.letterFocus} aria-live="polite"><span className={styles.arabic} lang="ar" dir="rtl">{LETTERS[selected][0]}</span><strong>{LETTERS[selected][1]}</strong><small>{String(selected+1).padStart(2,"0")} / 28</small></div>
   <button className={styles.next} type="button" onClick={()=>select((selected+1)%28)} aria-label="Next letter">›</button>
  </div>
  <div className={styles.controls}><button type="button" className={styles.hear} onClick={()=>{hear();setHudhudPlayed(true)}} aria-label={"Hear "+LETTERS[selected][1]}>{playing?"◖)) Playing":"◖)) Hear letter"}</button><button type="button" className={styles.mark} onClick={()=>{mark();setHudhudPlayed(false)}} disabled={practiced.includes(selected)}>{practiced.includes(selected)?"✓ Practiced":"✓ I practiced"}</button></div>
  {audioMessage&&<p role="status" className={styles.note}>{audioMessage}</p>}
  <div className={styles.bottom}><button type="button" className={styles.browseToggle} aria-expanded={showAll} onClick={()=>setShowAll(v=>!v)}>{showAll?"Hide alphabet":"Explore all 28 letters"} <span aria-hidden="true">{showAll?"⌃":"⌄"}</span></button><Link href="/elm-tent/training">Learning path ↗</Link></div>
  {showAll&&<div className={styles.grid} aria-label="Arabic alphabet">{LETTERS.map(([glyph,name],i)=><button type="button" key={glyph} onClick={()=>{select(i);setShowAll(false)}} aria-label={name} aria-pressed={selected===i} className={styles.tile}><span lang="ar">{glyph}</span><small>{name}</small>{practiced.includes(i)&&<b aria-label="Practiced">✓</b>}</button>)}</div>}
  <p className={styles.disclaimer}>Audio uses your device's speech engine; pronunciation is not verified. Native-speaker recordings will improve future lessons.</p>
 </div>;
}
