"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {createClient} from "../../utils/supabase/client";
import styles from "./ElmTentAlphabet.module.css";
import ElmTentLetterQuiz from "./ElmTentLetterQuiz";
import ElmTentVowels from "./ElmTentVowels";

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
 const [celebrating,setCelebrating]=useState(false);
 const [courseFinished,setCourseFinished]=useState(false);
 useEffect(()=>{try{
   const next:Record<number,number[]>={};
   for(let i=0;i<LESSON_COUNT;i++){
    const raw=localStorage.getItem(lessonKey(i))||(i===0?localStorage.getItem(LEGACY_KEY):null);
    const saved=JSON.parse(raw||"[]");
    next[i]=Array.isArray(saved)?Array.from(new Set(saved.filter((x:unknown)=>typeof x==="number"&&Number.isInteger(x)&&x>=0&&x<LETTERS.length))):[];
   }
   setLessonProgress(next);setPracticed(next[0]||[]);
   if((next[0]||[]).length>=3&&(next[0]||[]).length<28)setMilestone(true);
   if(localStorage.getItem("1muslim:elm-tent:alphabet-certified")==="yes"){setCourseFinished(true);setLesson(2)}else if(next[0]?.length===LETTERS.length){setLesson(1);setPracticed(next[1]||[])}
   setCompletedLessons(Array.from({length:LESSON_COUNT},(_,i)=>i).filter(i=>(next[i]||[]).length===LETTERS.length));
  }catch{}setReady(true);
  return()=>{if(typeof window!=="undefined"&&"speechSynthesis" in window)window.speechSynthesis.cancel()}
 },[]);
 const mark=()=>{
  if(!ready||lesson>1)return;
  if(!practiced.includes(selected)){
   void createClient().rpc("claim_arabic_letter_practice_xp",{p_lesson:lesson+1,p_letter_index:selected}).then(({data,error})=>{
    if(!error&&Number((Array.isArray(data)?data[0]:data)?.awarded)>0)
     window.dispatchEvent(new Event("1muslim-xp-updated"));
   });
  }
  const next=practiced.includes(selected)?practiced:[...practiced,selected];
  setPracticed(next);
  setLessonProgress(current=>({...current,[lesson]:next}));
  try{localStorage.setItem(lessonKey(lesson),JSON.stringify(next))}catch{}
  
  if(next.length===LETTERS.length){setCompletedLessons(current=>current.includes(lesson)?current:[...current,lesson]);if(lesson===0)window.setTimeout(()=>chooseLesson(1),700)}
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
 const chooseLesson=(index:number)=>{const next=Math.max(courseFinished?2:0,Math.min(LESSON_COUNT-1,index));if(next===1&&lessonProgress[0]?.length!==LETTERS.length)return;setLesson(next);setLessonWindow(Math.floor(next/4));setPracticed(lessonProgress[next]||[]);setSelected(0);setHudhudPlayed(false);setAudioMessage("");if(typeof window!=="undefined"&&"speechSynthesis" in window)window.speechSynthesis.cancel()};
 const nextUnpracticed=()=>selected<LETTERS.length-1?selected+1:-1;
 const advanceLetter=()=>{const next=nextUnpracticed();if(next<0){if(practiced.length===LETTERS.length)chooseLesson(1);return}setMirrorSpin(true);setTimeout(()=>{select(next);setAutoPlayNext(true)},270);setTimeout(()=>setMirrorSpin(false),700)};
 const doneLetter=()=>{if(!practiced.includes(selected))mark();setPracticeFlash(true);setTimeout(()=>setPracticeFlash(false),420);advanceLetter()};
 const select=(index:number)=>{setHudhudPlayed(false);if(typeof window!=="undefined"&&"speechSynthesis" in window)window.speechSynthesis.cancel();setPlaying(false);setSelected(index);setAudioMessage("")};
 useEffect(()=>{const onHudHud=()=>{if(lesson!==0)return;if(milestone){setMilestone(false);setMilestoneDismissed(true);chooseLesson(1);return}if(!hudhudPlayed){hear();setHudhudPlayed(true)}else{doneLetter();setHudhudPlayed(false)}};window.addEventListener("1muslim:elm-tent-hudhud",onHudHud);return()=>window.removeEventListener("1muslim:elm-tent-hudhud",onHudHud)});
 const submitQuiz=async(nextAnswers:number[])=>{setClaiming(true);try{const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user){setBadgeMessage("Sign in to save your badge and claim 5,000 XP.");return}const {data,error}=await db.rpc("claim_arabic_letters_badge",{answers:nextAnswers});if(error)throw error;if(data?.awarded||data?.already_earned){setBadgeEarned(true);setCompletedLessons(current=>current.includes(1)?current:[...current,1]);setBadgeMessage(data.awarded?"🏅 Arabic Letters Certified · +5,000 XP!":"🏅 Arabic Letters Certified · Already earned");try{localStorage.setItem("1muslim:elm-tent:alphabet-certified","yes")}catch{}setCourseFinished(true);setCelebrating(true);window.setTimeout(()=>{setCelebrating(false);chooseLesson(2)},6500)}else setBadgeMessage(`Score: ${data?.score??0}% · Reach 90% to earn your badge.`)}catch(e){setBadgeMessage(e instanceof Error?e.message:"Unable to claim badge")}finally{setClaiming(false)}};
 const answerQuestion=(choice:number)=>{if(claiming)return;const next=[...answers,choice];setAnswers(next);if(next.length===28)void submitQuiz(next);else setQuizIndex(next.length)};
 return <div className={styles.root} onTouchStart={e=>{swipeStart.current=e.touches[0].clientY}} onTouchEnd={e=>{if(swipeStart.current===null)return;const delta=e.changedTouches[0].clientY-swipeStart.current;swipeStart.current=null;if(Math.abs(delta)>90)chooseLesson(lesson+(delta<0?1:-1))}}>
  <nav className={styles.lessonNav} aria-label="Elm Tent lessons"><button type="button" aria-label="Previous lessons" onClick={()=>setLessonWindow(0)}>‹</button>{Array.from({length:4},(_,i)=>lessonWindow*4+i).filter(i=>i>=2||(!courseFinished&&(i===0||completedLessons.includes(0)))).map(i=><button type="button" key={i} className={lesson===i?styles.lessonActive:""} aria-current={lesson===i?"step":undefined} onClick={()=>chooseLesson(i)} disabled={i===1&&!completedLessons.includes(0)}><span>{i+1}</span><small>{completedLessons.includes(i)?"✓ Done":i<2?"Letters":"Soon"}</small></button>)}<button type="button" aria-label="Next lessons" onClick={()=>setLessonWindow(1)}>›</button></nav>
  {false&&lesson===0&&milestone&&<div className={styles.milestoneToast} role="status"><strong>✦ First three letters learned!</strong><span>Continue exploring or begin Lesson 2.</span><div><button onClick={()=>{setMilestone(false);setMilestoneDismissed(true);advanceLetter()}}>Keep learning</button><button onClick={()=>{setMilestone(false);setMilestoneDismissed(true);chooseLesson(1)}}>Ready for Lesson 2 →</button></div></div>}
  {lesson===1&&!courseFinished&&<ElmTentLetterQuiz onPass={answers=>void submitQuiz(answers)} onReady={()=>chooseLesson(2)}/>}
  {celebrating&&<div role="status" aria-live="assertive" style={{position:"fixed",inset:0,zIndex:9999,display:"grid",placeItems:"center",background:"radial-gradient(circle,#174b37ee,#03140ef5)",color:"#fff",textAlign:"center",padding:24,animation:"fadeIn .5s ease"}}>
   <div style={{padding:32,border:"2px solid #e4ca7b",borderRadius:28,boxShadow:"0 0 90px #d6b75a77",background:"#08291de8"}}>
    <div style={{fontSize:76,animation:"bounce 1.2s ease-in-out infinite alternate"}}>🏆✨</div>
    <h2 style={{fontSize:"clamp(26px,7vw,48px)",margin:"12px 0"}}>Masha'Allah! Congratulations!</h2>
    <p style={{fontSize:20}}>Arabic Lessons 1 &amp; 2 completed!</p>
    <p>🏅 Arabic Letters Certified · Your next journey awaits.</p>
    <button type="button" onClick={()=>{setCelebrating(false);chooseLesson(2)}} style={{padding:"12px 26px",borderRadius:24,background:"#d9bd73",color:"#08291d",fontWeight:800}}>Continue →</button>
   </div>
   <style>{`@keyframes bounce{from{transform:translateY(7px) scale(.97)}to{transform:translateY(-12px) scale(1.07)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
  </div>}
  {lesson===2&&<ElmTentVowels/>}
  {lesson===0&&<div className={styles.lessonStage} key={lesson}><strong>LESSON {lesson+1} / 8</strong>{lesson>1?<div className={styles.soon}>✦ Lesson {lesson+1} · Coming Soon</div>:completedLessons.includes(lesson)?<span>✓ Completed</span>:null}</div>
  }
  {lesson===0&&<><div className={styles.top}><span className={styles.kicker}>✦ ELM TENT · LAUNCH WIDGET</span><span lang="ar" dir="rtl">خيمة العلم</span></div>
  {lesson>1?<p className={styles.soon}>This lesson is not available yet. Choose Lesson 1 or 2 to practice the Arabic alphabet.</p>:null}
  <div className={styles.title}><div><h2>{lesson===0?"Arabic Alphabet":lesson===1?"Arabic Alphabet · Lesson 2":`Lesson ${lesson+1}`}</h2><p>Listen · Repeat · Practice</p></div><div className={styles.counter}><strong>{practiced.length}<span> / 28</span></strong><small>practiced</small><small> · Letter {selected+1} / 28</small></div></div>
  <div className={styles.progress} role="progressbar" aria-label="Letters practiced" aria-valuemin={0} aria-valuemax={28} aria-valuenow={practiced.length}><span style={{width:(practiced.length/28*100)+"%"}}/></div>
  <p className={styles.note} aria-label="Letter practice checklist">{LETTERS.map((_,i)=><span key={i} title={`Letter ${i+1}: ${practiced.includes(i)?"practiced":"not practiced"}`} style={{display:"inline-block",padding:"2px 3px",fontWeight:i===selected?900:400,color:practiced.includes(i)?"#a4efb3":i===selected?"#fff":"#9ca9a0"}}>{practiced.includes(i)?"✓":i===selected?"●":"○"}</span>)}</p>
  <div className={styles.stage}>
   <button className={styles.previous} type="button" onClick={()=>{if(selected>0){select(selected-1);setAutoPlayNext(true)}}} aria-label="Previous letter">‹</button>
   <div className={styles.letterFocus} data-mirror-spin={mirrorSpin?"true":"false"} aria-live="polite" data-practice-flash={practiceFlash?"true":"false"}><span className={styles.arabic} lang="ar" dir="rtl">{LETTERS[selected][0]}</span><strong>{LETTERS[selected][1]}</strong><small>{String(selected+1).padStart(2,"0")} / 28</small></div>
   <button className={styles.next} type="button" onClick={()=>advanceLetter()} aria-label="Next letter">›</button>
  </div>
  <div className={styles.controls}><button type="button" className={styles.hear} onClick={()=>{hear();setHudhudPlayed(true)}} disabled={lesson>1} aria-label={"Hear "+LETTERS[selected][1]}>{playing?"◖)) Playing":"▶ Play"}</button><button type="button" className={styles.mark} onClick={()=>{doneLetter();setHudhudPlayed(false)}} disabled={lesson>1}>{practiced.includes(selected)?"✓ Done · Next":"✓ Done"}</button></div>

  {lesson===0&&practiced.length===LETTERS.length&&<div className={styles.compactNext}><button type="button" onClick={()=>chooseLesson(1)}>✓ All 28 practiced · Lesson 2 →</button></div>}
  {audioMessage&&<p role="status" className={styles.note}>{audioMessage}</p>}
  <div className={styles.bottom}><button type="button" className={styles.browseToggle} aria-expanded={showAll} onClick={()=>setShowAll(v=>!v)}>{showAll?"Hide alphabet":"Explore all 28 letters"} <span aria-hidden="true">{showAll?"⌃":"⌄"}</span></button><Link href="/elm-tent/training">Learning path ↗</Link></div>
  {showAll&&<div className={styles.grid} aria-label="Arabic alphabet">{LETTERS.map(([glyph,name],i)=><button type="button" key={glyph} onClick={()=>{select(i);setShowAll(false)}} aria-label={name} aria-pressed={selected===i} className={styles.tile}><span lang="ar">{glyph}</span><small>{name}</small>{practiced.includes(i)&&<b aria-label="Practiced">✓</b>}</button>)}</div>}
  </>}
  {badgeMessage&&lesson!==0&&<p role="status" className={styles.note}>{badgeMessage}</p>}
  {lesson===0&&<p className={styles.disclaimer}>Audio uses your device's speech engine; pronunciation is not verified. Native-speaker recordings will improve future lessons.</p>}
 </div>;
}
