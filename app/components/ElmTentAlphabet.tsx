"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {createClient} from "../../utils/supabase/client";
import styles from "./ElmTentAlphabet.module.css";

const LETTERS=[
["ا","Alif"],["ب","Bā"],["ت","Tā"],["ث","Thā"],["ج","Jīm"],["ح","Ḥā"],["خ","Khā"],
["د","Dāl"],["ذ","Dhāl"],["ر","Rā"],["ز","Zāy"],["س","Sīn"],["ش","Shīn"],["ص","Ṣād"],
["ض","Ḍād"],["ط","Ṭā"],["ظ","Ẓā"],["ع","ʿAyn"],["غ","Ghayn"],["ف","Fā"],["ق","Qāf"],
["ك","Kāf"],["ل","Lām"],["م","Mīm"],["ن","Nūn"],["ه","Hā"],["و","Wāw"],["ي","Yā"]
] as const;
const KEY="1muslim:elm-tent:alphabet-practice:v2";
const LEGACY_KEY="1muslim:elm-tent:alphabet-practice:v1";
const lessonKey=(lesson:number)=>`${KEY}:lesson-${lesson+1}`;
const LESSON_COUNT=8;
export default function ElmTentAlphabet(){
 const [selected,setSelected]=useState(0);
 const [challenge,setChallenge]=useState(false);
 const [quizIndex,setQuizIndex]=useState(0);
 const [answers,setAnswers]=useState<number[]>([]);
 const [badgeEarned,setBadgeEarned]=useState(false);
 const [badgeMessage,setBadgeMessage]=useState("");
 const [claiming,setClaiming]=useState(false);
 const [lesson,setLesson]=useState(0);
 const [lessonWindow,setLessonWindow]=useState(0);
 const [hudhudPlayed,setHudhudPlayed]=useState(false);
 const swipeStart=useRef<number|null>(null);
 const [practiced,setPracticed]=useState<number[]>([]);
 const [ready,setReady]=useState(false);
 const [lessonProgress,setLessonProgress]=useState<Record<number,number[]>>({});
 const [completedLessons,setCompletedLessons]=useState<number[]>([]);
 const [playing,setPlaying]=useState(false);
 const [audioMessage,setAudioMessage]=useState("");
 const [showAll,setShowAll]=useState(false);
 const speech=useRef<SpeechSynthesisUtterance|null>(null);
 const [autoPlayNext,setAutoPlayNext]=useState(false);
 const [practiceFlash,setPracticeFlash]=useState(false);
 const [mirrorSpin,setMirrorSpin]=useState(false);
 const [milestone,setMilestone]=useState(false);
 const [milestoneDismissed,setMilestoneDismissed]=useState(false);
 useEffect(()=>{try{
   const next:Record<number,number[]>={};
   for(let i=0;i<LESSON_COUNT;i++){
    const raw=localStorage.getItem(lessonKey(i))||(i===0?localStorage.getItem(LEGACY_KEY):null);
    const saved=JSON.parse(raw||"[]");
    next[i]=Array.isArray(saved)?Array.from(new Set(saved.filter((x:unknown)=>typeof x==="number"&&Number.isInteger(x)&&x>=0&&x<LETTERS.length))):[];
   }
   setLessonProgress(next);setPracticed(next[0]||[]);
   if((next[0]||[]).length>=3&&(next[0]||[]).length<28)setMilestone(true);
   if(next[1]?.length===LETTERS.length){setLesson(1);setPracticed(next[1]);setChallenge(true)}
   setCompletedLessons(Array.from({length:LESSON_COUNT},(_,i)=>i).filter(i=>(next[i]||[]).length===LETTERS.length));
  }catch{}setReady(true);
  return()=>{if(typeof window!=="undefined"&&"speechSynthesis" in window)window.speechSynthesis.cancel()}
 },[]);
 const mark=()=>{
  if(!ready||lesson>1)return;
  const next=practiced.includes(selected)?practiced:[...practiced,selected];
  setPracticed(next);
  setLessonProgress(current=>({...current,[lesson]:next}));
  try{localStorage.setItem(lessonKey(lesson),JSON.stringify(next))}catch{}
  if(lesson===0&&next.length>=3&&!milestoneDismissed)setMilestone(true);
  if(next.length===LETTERS.length){setCompletedLessons(current=>current.includes(lesson)?current:[...current,lesson]);if(lesson===1)setChallenge(true)}
 };

 const hear=()=>{
  if(typeof window==="undefined"||!("speechSynthesis" in window)){setAudioMessage("Audio preview is not available on this device.");return}
  window.speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(LETTERS[selected][0]);utterance.lang="ar-SA";utterance.rate=.72;utterance.pitch=1;
  const voices=window.speechSynthesis.getVoices();const arabic=voices.find(v=>v.lang.toLowerCase().startsWith("ar"));if(arabic)utterance.voice=arabic;
  utterance.onstart=()=>setPlaying(true);utterance.onend=()=>setPlaying(false);utterance.onerror=()=>{setPlaying(false);setAudioMessage("Could not play this letter on your device.")};
  speech.current=utterance;setAudioMessage(arabic?"":"Device pronunciation preview; an Arabic voice may not be installed.");window.speechSynthesis.speak(utterance);
 };
 useEffect(()=>{if(!autoPlayNext||lesson>1)return;setAutoPlayNext(false);const timer=setTimeout(()=>{hear();setHudhudPlayed(true)},280);return()=>clearTimeout(timer)},[autoPlayNext,selected,lesson]);
 const chooseLesson=(index:number)=>{const next=Math.max(completedLessons.includes(1)?1:0,Math.min(LESSON_COUNT-1,index));setLesson(next);setLessonWindow(Math.floor(next/4));setPracticed(lessonProgress[next]||[]);setSelected(0);setHudhudPlayed(false);setAudioMessage("");if(typeof window!=="undefined"&&"speechSynthesis" in window)window.speechSynthesis.cancel()};
 const nextUnpracticed=()=>{const remaining=LETTERS.map((_,i)=>i).filter(i=>!practiced.includes(i)&&i!==selected);if(!remaining.length)return -1;if(practiced.length<3){const next=[0,1,2].find(i=>!practiced.includes(i)&&i!==selected);if(next!==undefined)return next}const random=new Uint32Array(1);crypto.getRandomValues(random);return remaining[random[0]%remaining.length]};
 const advanceLetter=()=>{const next=nextUnpracticed();if(next<0){setMilestone(true);return}setMirrorSpin(true);setTimeout(()=>{select(next);setAutoPlayNext(true)},270);setTimeout(()=>setMirrorSpin(false),700)};
 const select=(index:number)=>{setHudhudPlayed(false);if(typeof window!=="undefined"&&"speechSynthesis" in window)window.speechSynthesis.cancel();setPlaying(false);setSelected(index);setAudioMessage("")};
 useEffect(()=>{const onHudHud=()=>{if(lesson>1)return;if(!hudhudPlayed){hear();setHudhudPlayed(true)}else{mark();setPracticeFlash(true);setTimeout(()=>setPracticeFlash(false),420);setHudhudPlayed(false);advanceLetter()}};window.addEventListener("1muslim:elm-tent-hudhud",onHudHud);return()=>window.removeEventListener("1muslim:elm-tent-hudhud",onHudHud)});
 const submitQuiz=async(nextAnswers:number[])=>{setClaiming(true);try{const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user){setBadgeMessage("Sign in to save your badge and claim 5,000 XP.");return}const {data,error}=await db.rpc("claim_arabic_letters_badge",{answers:nextAnswers});if(error)throw error;if(data?.awarded||data?.already_earned){setBadgeEarned(true);setBadgeMessage(data.awarded?"🏅 Arabic Letters Certified · +5,000 XP!":"🏅 Arabic Letters Certified · Already earned")}else setBadgeMessage(`Score: ${data?.score??0}% · Reach 90% to earn your badge.`)}catch(e){setBadgeMessage(e instanceof Error?e.message:"Unable to claim badge")}finally{setClaiming(false)}};
 const answerQuestion=(choice:number)=>{if(claiming)return;const next=[...answers,choice];setAnswers(next);if(next.length===28)void submitQuiz(next);else setQuizIndex(next.length)};
 return <div className={styles.root} onTouchStart={e=>{swipeStart.current=e.touches[0].clientY}} onTouchEnd={e=>{if(swipeStart.current===null)return;const delta=e.changedTouches[0].clientY-swipeStart.current;swipeStart.current=null;if(Math.abs(delta)>90)chooseLesson(lesson+(delta<0?1:-1))}}>
  <nav className={styles.lessonNav} aria-label="Elm Tent lessons"><button type="button" aria-label="Previous lessons" onClick={()=>setLessonWindow(0)}>‹</button>{Array.from({length:4},(_,i)=>lessonWindow*4+i).filter(i=>i!==0||!completedLessons.includes(1)).map(i=><button type="button" key={i} className={lesson===i?styles.lessonActive:""} aria-current={lesson===i?"step":undefined} onClick={()=>chooseLesson(i)}><span>{i+1}</span><small>{completedLessons.includes(i)?"✓ Done":i<2?"Letters":"Soon"}</small></button>)}<button type="button" aria-label="Next lessons" onClick={()=>setLessonWindow(1)}>›</button></nav>
  {challenge&&<section className={styles.badgeChallenge} aria-label="Arabic Letters Badge Challenge"><span>✦ ELM TENT · LESSON 2 COMPLETE</span><h2>🏅 Arabic Letters Challenge</h2>{badgeEarned?<p>{badgeMessage}</p>:<><p>Identify 28 letters · Score 90% to earn your badge and 5,000 XP.</p><strong>Question {Math.min(quizIndex+1,28)} / 28</strong><h3>{LETTERS[quizIndex][1]}</h3><div className={styles.badgeChoices}>{[0,1,2,3].map(offset=>{const index=(quizIndex+((offset+(quizIndex*3)%4)%4)*7)%28;return <button type="button" key={index} disabled={claiming||answers.length===28} onClick={()=>answerQuestion(index)} lang="ar">{LETTERS[index][0]}</button>})}</div>{badgeMessage&&<p role="status">{badgeMessage}</p>}{answers.length===28&&!badgeEarned&&<button type="button" onClick={()=>{setAnswers([]);setQuizIndex(0);setBadgeMessage("")}}>Try challenge again ↻</button>}</>}<button type="button" onClick={()=>setChallenge(false)}>Continue learning →</button></section>}
  {lesson===0&&milestone&&<div className={styles.milestoneToast} role="status"><strong>✦ First three letters learned!</strong><span>Continue exploring, or start Lesson 2.</span><div><button type="button" onClick={()=>{setMilestone(false);setMilestoneDismissed(true);advanceLetter()}}>Keep learning</button><button type="button" onClick={()=>{setMilestone(false);setMilestoneDismissed(true);chooseLesson(1)}}>Ready for Lesson 2 →</button></div></div>}
  <div className={styles.lessonStage} key={lesson}><strong>LESSON {lesson+1} / 8</strong>{lesson>1?<div className={styles.soon}>✦ Lesson {lesson+1} · Coming Soon</div>:completedLessons.includes(lesson)?<span>✓ Completed</span>:null}</div>
  <div className={styles.top}><span className={styles.kicker}>✦ ELM TENT · LAUNCH WIDGET</span><span lang="ar" dir="rtl">خيمة العلم</span></div>
  {lesson>1?<p className={styles.soon}>This lesson is not available yet. Choose Lesson 1 or 2 to practice the Arabic alphabet.</p>:null}
  <div className={styles.title}><div><h2>{lesson===0?"Arabic Alphabet":lesson===1?"Arabic Alphabet · Lesson 2":`Lesson ${lesson+1}`}</h2><p>Listen · Repeat · Practice</p></div><div className={styles.counter}><strong>{practiced.length}<span> / 28</span></strong><small>practiced</small></div></div>
  <div className={styles.progress} role="progressbar" aria-label="Letters practiced" aria-valuemin={0} aria-valuemax={28} aria-valuenow={practiced.length}><span style={{width:(practiced.length/28*100)+"%"}}/></div>
  <div className={styles.stage}>
   <button className={styles.previous} type="button" onClick={()=>advanceLetter()} aria-label="Previous letter">‹</button>
   <div className={styles.letterFocus} data-mirror-spin={mirrorSpin?"true":"false"} aria-live="polite" data-practice-flash={practiceFlash?"true":"false"}><span className={styles.arabic} lang="ar" dir="rtl">{LETTERS[selected][0]}</span><strong>{LETTERS[selected][1]}</strong><small>{String(selected+1).padStart(2,"0")} / 28</small></div>
   <button className={styles.next} type="button" onClick={()=>advanceLetter()} aria-label="Next letter">›</button>
  </div>
  <div className={styles.controls}><button type="button" className={styles.hear} onClick={()=>{hear();setHudhudPlayed(true)}} disabled={lesson>1} aria-label={"Hear "+LETTERS[selected][1]}>{playing?"◖)) Playing":"◖)) Hear letter"}</button><button type="button" className={styles.mark} onClick={()=>{mark();setHudhudPlayed(false)}} disabled={lesson>1||practiced.includes(selected)}>{practiced.includes(selected)?"✓ Practiced":"✓ I practiced"}</button></div>
  {completedLessons.includes(1)&&!challenge&&<button type="button" className={styles.hear} onClick={()=>setChallenge(true)}>🏅 Arabic Letters Badge Challenge →</button>}
  {lesson===0&&practiced.length===LETTERS.length&&<div className={styles.compactNext}><button type="button" onClick={()=>chooseLesson(1)}>✓ All 28 practiced · Lesson 2 →</button></div>}
  {audioMessage&&<p role="status" className={styles.note}>{audioMessage}</p>}
  <div className={styles.bottom}><button type="button" className={styles.browseToggle} aria-expanded={showAll} onClick={()=>setShowAll(v=>!v)}>{showAll?"Hide alphabet":"Explore all 28 letters"} <span aria-hidden="true">{showAll?"⌃":"⌄"}</span></button><Link href="/elm-tent/training">Learning path ↗</Link></div>
  {showAll&&<div className={styles.grid} aria-label="Arabic alphabet">{LETTERS.map(([glyph,name],i)=><button type="button" key={glyph} onClick={()=>{select(i);setShowAll(false)}} aria-label={name} aria-pressed={selected===i} className={styles.tile}><span lang="ar">{glyph}</span><small>{name}</small>{practiced.includes(i)&&<b aria-label="Practiced">✓</b>}</button>)}</div>}
  <p className={styles.disclaimer}>Audio uses your device's speech engine; pronunciation is not verified. Native-speaker recordings will improve future lessons.</p>
 </div>;
}
