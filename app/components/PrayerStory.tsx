"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {DAILY_RAKAH,STORY_CHAPTERS} from "./PrayerEducationData";
import {PrayerScene,PrayerShell} from "./PrayerVisuals";
import {PrayerTimeIcon,PrayerUiIcon,type PrayerTimeName} from "./icons/PrayerTimeIcon";

const BENEFITS=[
 {icon:"compass",title:"Connection",description:"Renew remembrance"},
 {icon:"calendar",title:"Discipline",description:"A daily rhythm"},
 {icon:"time",title:"Peace",description:"Pause with purpose"},
 {icon:"compass",title:"Gratitude",description:"Give thanks"},
 {icon:"next",title:"Growth",description:"Return and improve"}
] as const;
function StoryChapterGlyph({index}:{index:number}){
 if(index===3)return <span className="prayerStoryCountIcon">50 → 5</span>;
 return <PrayerUiIcon kind={index===0?"next":index===1?"compass":index===2?"calendar":"time"}/>;
}
export default function PrayerStory(){
 const [chapter,setChapter]=useState(0);
 const [auto,setAuto]=useState(false);
 const [done,setDone]=useState<Record<string,boolean>>({});
 useEffect(()=>{if(!auto)return;const timer=setInterval(()=>setChapter(previous=>{if(previous>=STORY_CHAPTERS.length-1){setAuto(false);return previous;}return previous+1;}),7000);return()=>clearInterval(timer)},[auto]);
 useEffect(()=>{try{const today=new Date().toLocaleDateString("en-CA");const raw=JSON.parse(localStorage.getItem("1muslim:salah-daily-checklist")||"null");if(raw?.date===today&&raw?.prayers&&typeof raw.prayers==="object")setDone(raw.prayers);}catch{}},[]);
 const toggle=(name:string)=>{
  const next={...done,[name]:!done[name]};setDone(next);
  try{localStorage.setItem("1muslim:salah-daily-checklist",JSON.stringify({date:new Date().toLocaleDateString("en-CA"),prayers:next}))}catch{}
 };
 const complete=DAILY_RAKAH.filter(item=>done[item.name]).length;
 const current=STORY_CHAPTERS[chapter];
 const go=(n:number)=>{setAuto(false);setChapter(n)};
 return <PrayerShell title="Story of Salah" back="/widget-tools/prayer" eyebrow="1MUSLIM · IMMERSIVE FAITH STORIES">
  <section className="prayerHero prayerStoryHero">
   <PrayerScene night/>
   <div className="prayerHeroContents">
    <span className="prayerHeroLabel">THE ORIGIN OF SALAH</span>
    <h1>The Story of <em>Salah</em></h1>
    <p>From the Night Journey to the gift of five daily prayers — explore the account through authentic sources.</p>
    <button type="button" className="prayerGoldButton" onClick={()=>{setChapter(0);setAuto(x=>!x)}}>{auto?"Ⅱ Pause story":"▶ Play the story"} <span>→</span></button>
   </div>
  </section>
  <section className="prayerCard prayerStoryChapters" aria-labelledby="chapters-heading">
   <div className="prayerSectionTop"><span className="prayerSectionIcon"><PrayerUiIcon kind="next"/></span><div><h2 id="chapters-heading">The journey at a glance</h2><p>Five chapters — scroll, select, and follow the story.</p></div></div>
   <div className="prayerStoryTimeline" role="tablist" aria-label="Story chapters">
    {STORY_CHAPTERS.map((item,i)=><button type="button" key={item.title} role="tab" aria-selected={chapter===i} className={chapter===i?"current":""} onClick={()=>go(i)}>
     <span className="prayerTimelineNumber">{i+1}</span><span className="prayerTimelineIcon" aria-hidden="true"><StoryChapterGlyph index={i}/></span>
     <strong>{item.title}</strong><small>{item.subtitle}</small>
    </button>)}
   </div>
   <div className="prayerStoryFocus" role="tabpanel">
    <div className="prayerStoryChapterVisual" aria-hidden="true"><span><StoryChapterGlyph index={chapter}/></span><small>CHAPTER {chapter+1} OF {STORY_CHAPTERS.length}</small></div>
    <div className="prayerStoryChapterText">
     <span className="prayerStepKicker">THE JOURNEY · {current.subtitle.toUpperCase()}</span>
     <h3>{current.title}</h3><p>{current.body}</p>
     <a href={current.source} target="_blank" rel="noreferrer">Read the primary source · {current.label} ↗</a>
    </div>
   </div>
   <div className="prayerStepNavigation">
    <button type="button" disabled={chapter===0} onClick={()=>go(chapter-1)}>← Previous</button>
    <button type="button" className="prayerGoldButton" onClick={()=>go(chapter===STORY_CHAPTERS.length-1?0:chapter+1)}>{chapter===STORY_CHAPTERS.length-1?"Restart story ↺":"Next chapter →"}</button>
   </div>
  </section>
  <div className="prayerStoryInsightPair">
   <section className="prayerCard prayerHadithInsight">
    <div className="prayerSectionTop"><span className="prayerSectionIcon"><PrayerUiIcon kind="calendar"/></span><div><h2>Hadith insight</h2><p>Five in obligation, fifty in reward.</p></div></div>
    <span className="prayerQuoteMark" aria-hidden="true">“</span>
    <blockquote>The authentic narration explains that the prayers became five each day, with the reward of fifty.</blockquote>
    <a href="https://sunnah.com/bukhari:349" target="_blank" rel="noreferrer">Ṣaḥīḥ al-Bukhārī 349 ↗</a>
   </section>
   <section className="prayerCard prayerStoryChart">
    <div className="prayerSectionTop"><span className="prayerSectionIcon"><PrayerUiIcon kind="next"/></span><div><h2>Fifty → Five</h2><p>The Miʿrāj in numbers</p></div></div>
    <svg className="prayerStoryGraph" viewBox="0 0 440 195" role="img" aria-label="Five prayers were prescribed each day, with the reward described as fifty">
     <defs><linearGradient id="salahChartLine" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffe8ab"/><stop offset="1" stopColor="#e2ac50"/></linearGradient></defs>
     <path d="M30 48 C112 53 112 105 204 112 S340 158 414 159" stroke="url(#salahChartLine)" strokeWidth="5" fill="none" strokeLinecap="round"/>
     <path d="M30 48 C112 53 112 105 204 112 S340 158 414 159 L414 189 L30 189Z" fill="#f1c46f" opacity=".09"/>
     {[["30","48"],["110","82"],["204","112"],["308","149"],["414","159"]].map(([x,y])=><circle key={x} cx={x} cy={y} r={x==="414"?10:6} fill="#f7cb75" stroke="#fff0c4" strokeWidth="2"/>)}
     <text x="30" y="27" fill="#fff3cd" fontSize="22" fontWeight="800">50</text><text x="335" y="139" fill="#fff3cd" fontSize="22" fontWeight="800">5</text>
     <text x="30" y="184" fill="#dfccaa" fontSize="12">Originally prescribed</text><text x="312" y="182" fill="#dfccaa" fontSize="12">Daily prayers</text>
    </svg>
    <div className="prayerRewardChip"><strong>5 daily prayers</strong><span>Reward described as fifty</span></div>
   </section>
  </div>
  <section className="prayerCard prayerDailyRhythm">
   <div className="prayerSectionTop"><span className="prayerSectionIcon"><PrayerUiIcon kind="time"/></span><div><h2>The daily rhythm</h2><p>Five moments of worship, from dawn to night.</p></div></div>
   <div className="prayerRhythmRail">{DAILY_RAKAH.map(item=><div key={item.name}><span className="prayerRhythmTimeIcon" aria-hidden="true"><PrayerTimeIcon prayer={item.name as PrayerTimeName}/></span><strong>{item.name}</strong><small>{item.count} farḍ rakʿahs</small></div>)}</div>
  </section>
  <section className="prayerCard prayerStoryImpact">
   <div className="prayerSectionTop"><span className="prayerSectionIcon"><PrayerUiIcon kind="compass"/></span><div><h2>Prayer &amp; daily life</h2><p>A visual reflection on consistency, remembrance and purpose.</p></div></div>
   <div className="prayerImpactRail">{BENEFITS.map((benefit,i)=><div className="prayerImpactNode" key={benefit.title}><span className="prayerImpactIcon"><PrayerUiIcon kind={benefit.icon}/></span><strong>{benefit.title}</strong><small>{benefit.description}</small>{i<BENEFITS.length-1&&<span className="prayerImpactConnector" aria-hidden="true"/>}</div>)}</div>
   <div className="prayerDailyChecklist">
    <div className="prayerDailyScore" style={{background:"conic-gradient(#d8ac58 "+complete*20+"%,#e5e9e7 0)"}}><div><strong>{complete}/5</strong><span>today</span></div></div>
    <div><h3>My five daily prayers</h3><p>Keep a private check-in on this device. This tracker is not a measure of faith.</p>
     <div className="prayerDailyCheckButtons">{DAILY_RAKAH.map(item=><button type="button" key={item.name} aria-pressed={!!done[item.name]} className={done[item.name]?"checked":""} onClick={()=>toggle(item.name)}>{done[item.name]?"✓":"○"} {item.name}</button>)}</div>
    </div>
   </div>
  </section>
  <section className="prayerCard prayerLearnFinish"><div><h2>Ready to learn the movements?</h2><p>See every position, its Arabic words and English meaning.</p></div><Link href="/widget-tools/prayer/learn" className="prayerGoldButton">Learn Salah →</Link></section>
  <p className="prayerLearningCaution">Timeline illustrations and graphics are educational visualizations, not depictions of Allah, the Prophet ﷺ, or unseen realities. This page distinguishes Qurʾānic text from hadith reports. Benefits are reflections, not measured user statistics.</p>
 </PrayerShell>;
}
