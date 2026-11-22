"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {DAILY_RAKAH,SALAH_STEPS,type SalahStep,type SalahStage} from "./PrayerEducationData";
import {PositionIllustration,PrayerScene,PrayerShell} from "./PrayerVisuals";

const highlights:{stage:SalahStage;title:string;english:string;phraseIndex:number}[]=[
 {stage:"stand",title:"Qiyām",english:"Standing & recitation",phraseIndex:1},
 {stage:"bow",title:"Rukūʿ",english:"Bowing",phraseIndex:3},
 {stage:"prostrate",title:"Sujūd",english:"Prostration",phraseIndex:5},
 {stage:"sit",title:"Tashahhud",english:"Sitting & testimony",phraseIndex:8}
];

export default function PrayerLearning(){
 const [selected,setSelected]=useState(0);
 const [guided,setGuided]=useState(false);
 const [playing,setPlaying]=useState(false);
 const [soundMessage,setSoundMessage]=useState("");
 const details=useRef<HTMLElement|null>(null);
 const current=SALAH_STEPS[selected];
 useEffect(()=>()=>{if(typeof window!=="undefined"&&"speechSynthesis" in window)window.speechSynthesis.cancel()},[]);
 const speak=(step:SalahStep)=>{
  if(typeof window==="undefined"||!("speechSynthesis" in window)){setSoundMessage("Arabic speech is not supported in this browser.");return;}
  window.speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(step.arabic.replaceAll("۞","،"));
  utterance.lang="ar-SA";utterance.rate=.78;
  const voices=window.speechSynthesis.getVoices();
  const arabicVoice=voices.find(v=>v.lang.toLowerCase().startsWith("ar"));
  if(arabicVoice)utterance.voice=arabicVoice;
  utterance.onstart=()=>setPlaying(true);
  utterance.onend=()=>setPlaying(false);
  utterance.onerror=()=>{setPlaying(false);setSoundMessage("Arabic voice is unavailable. Read the written pronunciation below.");};
  setSoundMessage(arabicVoice?"":"Your device will select an available voice. For accurate pronunciation, listen to a qualified teacher.");
  window.speechSynthesis.speak(utterance);
 };
 const choose=(i:number)=>{
  if(typeof window!=="undefined"&&"speechSynthesis" in window)window.speechSynthesis.cancel();
  setPlaying(false);setSoundMessage("");setSelected(i);
  details.current?.scrollIntoView({behavior:"smooth",block:"nearest"});
 };
 const start=()=>{
  setGuided(true);setSelected(0);
  requestAnimationFrame(()=>document.getElementById("guided-salah-step")?.scrollIntoView({behavior:"smooth",block:"start"}));
 };
 return <PrayerShell title="Learn Salah" back="/widget-tools/prayer" eyebrow="1MUSLIM · SALAH ACADEMY">
  <div className="prayerHero prayerAcademyHero">
   <PrayerScene/>
   <div className="prayerHeroContents"><span className="prayerHeroLabel">✧ BEGIN WITH CONFIDENCE</span>
    <h1>Learn <em>Salah</em></h1>
    <p>Every movement, every word, and every meaning — explained step by step.</p>
    <button type="button" className="prayerGoldButton" onClick={start}>▶ Start guided lesson <span aria-hidden="true">→</span></button>
   </div>
  </div>
  <section className="prayerCard prayerAcademyIntro" aria-label="How to use this guide">
   <div className="prayerSectionTop"><span className="prayerSectionIcon">✦</span><div><h2>Understand the foundations</h2><p>Illustrated positions • Arabic • Pronunciation • English meaning</p></div></div>
   <div className="prayerConcepts">{["Takbīr","Qiyām","Rukūʿ","Sujūd","Tashahhud","Taslīm"].map(t=><span key={t}>✓ {t}</span>)}</div>
  </section>
  <section className="prayerCard prayerAcademyPositions" aria-labelledby="positions-heading">
   <div className="prayerSectionTop"><span className="prayerSectionIcon">◉</span><div><h2 id="positions-heading">Prayer positions</h2><p>Tap a position to see how to perform it and what to say.</p></div></div>
   <div className="prayerPositionRail">
    {highlights.map((item,i)=>{const phrase=SALAH_STEPS[item.phraseIndex];return <button type="button" className="prayerPositionCard" key={item.title} onClick={()=>choose(item.phraseIndex)}>
     <span className="prayerPositionCanvas"><PositionIllustration stage={item.stage}/></span>
     <strong>{item.title}</strong><small>{item.english}</small>
     <span className="prayerMiniArabic" dir="rtl" lang="ar">{phrase.arabic.slice(0,44)}{phrase.arabic.length>44?"…":""}</span>
     <span className="prayerMiniTranslation">{phrase.meaning.split(".")[0]}.</span>
     <span className="prayerCardAction">Explore ↗</span>
    </button>})}
   </div>
  </section>
  <section className="prayerCard prayerGuidePanel" id="guided-salah-step" ref={details} aria-labelledby="guide-heading">
   <div className="prayerSectionTop prayerGuideHeading"><span className="prayerSectionIcon">☷</span>
    <div><h2 id="guide-heading">{guided?"Guided Salah walkthrough":"Words & movements of Salah"}</h2><p>Select any step, read its meaning, then practice the Arabic.</p></div>
    <span className="prayerStepFraction">{selected+1}/{SALAH_STEPS.length}</span>
   </div>
   <div className="prayerGuideProgress" role="progressbar" aria-label="Current lesson step" aria-valuenow={selected+1} aria-valuemin={1} aria-valuemax={SALAH_STEPS.length}>
    <span style={{width:((selected+1)/SALAH_STEPS.length*100)+"%"}}/>
   </div>
   <div className="prayerStepChooser" aria-label="Choose lesson step">
    {SALAH_STEPS.map((step,i)=><button type="button" aria-pressed={selected===i} className={selected===i?"active":""} key={step.id} onClick={()=>choose(i)}>{String(i+1).padStart(2,"0")} <span>{step.term}</span></button>)}
   </div>
   <div className="prayerInstruction">
    <div className="prayerInstructionVisual"><PositionIllustration stage={current.stage}/><span className="prayerInstructionStage">{current.term}</span></div>
    <div className="prayerInstructionCopy">
     <span className="prayerStepKicker">STEP {selected+1} · {current.term.toUpperCase()}</span>
     <h3>{current.title}</h3><p>{current.instructions}</p>{current.repeat&&<p className="prayerPracticeTip">✦ {current.repeat}</p>}
     <div className="prayerArabicRecitation" dir="rtl" lang="ar">{current.arabic}</div>
     <div className="prayerTransliteration"><span>TRANSLITERATION</span><p>{current.transliteration}</p></div>
     <div className="prayerTranslation"><span>ENGLISH MEANING</span><p>{current.meaning}</p></div>
     <div className="prayerInstructionTools"><button type="button" className="prayerListen" onClick={()=>speak(current)} aria-label={"Hear the Arabic for "+current.title}>{playing?"◼ Restart audio":"▶ Hear Arabic"}</button>{current.source&&<a href={current.source} target="_blank" rel="noreferrer">View source ↗</a>}</div>
     {soundMessage&&<p className="prayerAudioMessage" role="status">{soundMessage}</p>}
    </div>
   </div>
   <div className="prayerStepNavigation">
    <button type="button" onClick={()=>choose(Math.max(0,selected-1))} disabled={selected===0}>← Previous</button>
    {selected<SALAH_STEPS.length-1?<button type="button" className="prayerGoldButton" onClick={()=>choose(selected+1)}>Next step →</button>:<button type="button" className="prayerGoldButton" onClick={()=>{setSelected(0);setGuided(false)}}>✓ Review again</button>}
   </div>
  </section>
  <section className="prayerCard prayerRakahPanel" aria-labelledby="rakah-heading">
   <div className="prayerSectionTop"><span className="prayerSectionIcon">▦</span><div><h2 id="rakah-heading">How many rakʿahs?</h2><p>Obligatory (farḍ) units for each daily prayer.</p></div></div>
   <div className="prayerRakahGrid">{DAILY_RAKAH.map(item=><div className="prayerRakahTile" key={item.name}>
    <span aria-hidden="true">{item.icon}</span><strong>{item.name}</strong><b>{item.count}</b><small>rakʿahs</small>
   </div>)}</div>
   <div className="prayerRakahExplainer"><span className="prayerRakahEquation">1 rakʿah = 1 rukūʿ + 2 sujūd</span><p>Every rakʿah includes one bow and two prostrations, separated by a brief sitting. For example, Fajr&apos;s two farḍ rakʿahs have two bows and four prostrations. Additional Sunnah and Witr prayers have their own counts.</p></div>
  </section>
  <section className="prayerCard prayerLearnFinish">
   <div><h2>Why do we pray five times?</h2><p>Explore the Night Journey and Miʿrāj through an interactive, source-linked story.</p></div>
   <Link href="/widget-tools/prayer/story" className="prayerGoldButton">Discover the story <span>→</span></Link>
  </section>
  <p className="prayerLearningCaution">Educational guide based on widely practiced Sunni forms. Details of recitation, hand placement, sitting and congregation can vary among recognized schools. Learn with a trusted teacher. Device text-to-speech is a pronunciation aid, not a substitute for qualified recitation.</p>
 </PrayerShell>;
}
