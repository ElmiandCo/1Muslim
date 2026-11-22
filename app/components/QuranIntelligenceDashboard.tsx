"use client";
import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import styles from "./QuranIntelligenceDashboard.module.css";

export type QuranReading={verse_key:string;read_on:string};
type Period="7D"|"30D"|"90D"|"1Y"|"ALL";
type Insight={headline:string;message:string;nextStep:string;source:"ai"|"local"};
const VERSES=[7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
const SURAHS=[
"Al-Fatihah","Al-Baqarah","Ali 'Imran","An-Nisa","Al-Ma'idah","Al-An'am","Al-A'raf","Al-Anfal","At-Tawbah","Yunus","Hud","Yusuf","Ar-Ra'd","Ibrahim","Al-Hijr","An-Nahl","Al-Isra","Al-Kahf","Maryam","Ta-Ha","Al-Anbiya","Al-Hajj","Al-Mu'minun","An-Nur","Al-Furqan","Ash-Shu'ara","An-Naml","Al-Qasas","Al-Ankabut","Ar-Rum","Luqman","As-Sajdah","Al-Ahzab","Saba","Fatir","Ya-Sin","As-Saffat","Sad","Az-Zumar","Ghafir","Fussilat","Ash-Shura","Az-Zukhruf","Ad-Dukhan","Al-Jathiyah","Al-Ahqaf","Muhammad","Al-Fath","Al-Hujurat","Qaf","Adh-Dhariyat","At-Tur","An-Najm","Al-Qamar","Ar-Rahman","Al-Waqi'ah","Al-Hadid","Al-Mujadilah","Al-Hashr","Al-Mumtahanah","As-Saff","Al-Jumu'ah","Al-Munafiqun","At-Taghabun","At-Talaq","At-Tahrim","Al-Mulk","Al-Qalam","Al-Haqqah","Al-Ma'arij","Nuh","Al-Jinn","Al-Muzzammil","Al-Muddaththir","Al-Qiyamah","Al-Insan","Al-Mursalat","An-Naba","An-Nazi'at","Abasa","At-Takwir","Al-Infitar","Al-Mutaffifin","Al-Inshiqaq","Al-Buruj","At-Tariq","Al-A'la","Al-Ghashiyah","Al-Fajr","Al-Balad","Ash-Shams","Al-Layl","Ad-Duha","Ash-Sharh","At-Tin","Al-Alaq","Al-Qadr","Al-Bayyinah","Az-Zalzalah","Al-Adiyat","Al-Qari'ah","At-Takathur","Al-Asr","Al-Humazah","Al-Fil","Quraysh","Al-Ma'un","Al-Kawthar","Al-Kafirun","An-Nasr","Al-Masad","Al-Ikhlas","Al-Falaq","An-Nas"];
const TOTAL=VERSES.reduce((a,b)=>a+b,0);
const number=(v:number)=>Number.isFinite(v)?v.toLocaleString("en-US"):"0";
const percent=(n:number)=>n.toFixed(n>0&&n<10?2:1)+"%";
const valid=(key:string)=>{
 const match=/^([1-9]|[1-9]\d|1(?:0\d|1[0-4])):([1-9]\d{0,2})$/.exec(key);
 if(!match)return null;const chapter=Number(match[1]),ayah=Number(match[2]);
 return ayah<=VERSES[chapter-1]?{chapter,ayah}:null;
};
const utc=(date:string)=>Date.parse(date+"T12:00:00Z");
const iso=(timestamp:number)=>new Date(timestamp).toISOString().slice(0,10);
const shift=(date:string,n:number)=>iso(utc(date)+n*86400000);
const labelDate=(date:string,weekday=false)=>new Date(utc(date)).toLocaleDateString("en-US",weekday?{weekday:"short",timeZone:"UTC"}:{month:"short",day:"numeric",timeZone:"UTC"});
const formatReadVerses=(keys:string[])=>{
 if(!keys.length)return "";
 const numbers=keys.map(key=>Number(key.split(":")[1])).sort((a,b)=>a-b);
 const groups:string[]=[];let a=numbers[0],b=a;
 const push=()=>{groups.push(a===b?String(a):String(a)+"–"+String(b));};
 for(const n of numbers.slice(1)){if(n===b+1)b=n;else{push();a=n;b=n;}}
 push();return groups.slice(0,18).join(", ")+(groups.length>18?" + more":"");
};
type Indexed={unique:Map<string,string>;byDate:Map<string,Set<string>>;chapterKeys:Map<number,string[]>;latest:string|null;activeDays:Set<string>};
function indexReadings(readings:QuranReading[]):Indexed{
 const unique=new Map<string,string>(),byDate=new Map<string,Set<string>>();
 let latest:string|null=null,latestDay="";
 for(const r of readings){
  if(!valid(r.verse_key)||!/^\d{4}-\d{2}-\d{2}$/.test(r.read_on)||!Number.isFinite(utc(r.read_on)))continue;
  const prev=unique.get(r.verse_key);
  if(!prev||r.read_on<prev)unique.set(r.verse_key,r.read_on);
  let at=byDate.get(r.read_on);if(!at){at=new Set();byDate.set(r.read_on,at);}at.add(r.verse_key);
  if(!latest||r.read_on>latestDay){latest=r.verse_key;latestDay=r.read_on;}
 }
 const chapterKeys=new Map<number,string[]>();
 for(const key of unique.keys()){const c=Number(key.split(":")[0]);const keys=chapterKeys.get(c)||[];keys.push(key);chapterKeys.set(c,keys);}
 for(const keys of chapterKeys.values())keys.sort((a,b)=>Number(a.split(":")[1])-Number(b.split(":")[1]));
 return {unique,byDate,chapterKeys,latest,activeDays:new Set(byDate.keys())};
}
function computeStreak(days:Set<string>,today:string){
 let key=days.has(today)?today:shift(today,-1),count=0;
 while(days.has(key)&&count<5000){count++;key=shift(key,-1);}
 return count;
}
function buildChart(data:Indexed,today:string,period:Period){
 const earliest=[...data.unique.values()].sort()[0]||shift(today,-29);
 const count=period==="7D"?7:period==="30D"?30:period==="90D"?90:period==="1Y"?365:Math.min(3650,Math.max(7,Math.round((utc(today)-utc(earliest))/86400000)+1));
 const start=shift(today,-count+1);
 const firstCount=[...data.unique.values()].filter(d=>d<start).length;
 const increments=new Map<string,number>();
 for(const date of data.unique.values())if(date>=start&&date<=today)increments.set(date,(increments.get(date)||0)+1);
 let accumulated=firstCount;
 const result=Array.from({length:count},(_,i)=>{
  const date=shift(start,i);accumulated+=(increments.get(date)||0);
  return {date,count:accumulated,percent:Math.min(100,100*accumulated/TOTAL),newVerses:increments.get(date)||0,visits:data.byDate.get(date)?.size||0};
 });
 return result.length>170?result.filter((_,i)=>i%Math.ceil(result.length/140)===0||i===result.length-1):result;
}
function InsightGraphic(){return <span className={styles.aiSpark} aria-hidden="true">✦</span>}
function Confidence({readings,loading,userId}:{readings:QuranReading[];loading:boolean;userId?:string}){
 const [period,setPeriod]=useState<Period>("30D"),[active,setActive]=useState<string|null>(null),[showChapters,setShowChapters]=useState<"started"|"all"|"finished">("started");
 const [selectedChapter,setSelectedChapter]=useState<number|null>(null),[filter,setFilter]=useState(""),[showAllVerses,setShowAllVerses]=useState(false);
 const [saved,setSaved]=useState<string[]>([]),[starsReady,setStarsReady]=useState(false);
 const [inspiration,setInspiration]=useState<{key:string;text:string}|null>(null),[inspirationBusy,setInspirationBusy]=useState(false);
 const [insight,setInsight]=useState<Insight|null>(null),[insightBusy,setInsightBusy]=useState(false),[insightError,setInsightError]=useState("");
 const today=new Date().getFullYear()+"-"+String(new Date().getMonth()+1).padStart(2,"0")+"-"+String(new Date().getDate()).padStart(2,"0");
 const indexed=useMemo(()=>indexReadings(readings),[readings]);
 const totalRead=indexed.unique.size,completed=totalRead/TOTAL*100,started=indexed.chapterKeys.size,finished=[...indexed.chapterKeys].filter(([ch,keys])=>keys.length>=VERSES[ch-1]).length;
 const streak=computeStreak(indexed.activeDays,today);
 const thisWeek=Array.from({length:7},(_,i)=>shift(today,i-6));
 const weeklyVisits=thisWeek.reduce((n,d)=>n+(indexed.byDate.get(d)?.size||0),0);
 const lastWeek=thisWeek.reduce((n,d)=>n+(indexed.byDate.get(shift(d,-7))?.size||0),0);
 const series=useMemo(()=>buildChart(indexed,today,period),[indexed,today,period]);
 const chosen=series.find(x=>x.date===active)||series[series.length-1];
 const view=series.length>0?series:[{date:today,count:0,percent:0,newVerses:0,visits:0}];
 const minData=view[0],maxData=view[view.length-1];
 const axis=Math.max(2,Math.min(100,Math.ceil(Math.max(maxData.percent,completed)*1.28*2)/2));
 const W=960,H=326,L=63,R=30,T=36,B=47,PW=W-L-R,PH=H-T-B;
 const x=(i:number)=>L+i*PW/Math.max(1,view.length-1),y=(p:number)=>T+PH*(1-p/axis);
 const line=view.map((point,i)=>(i===0?"M ":"L ")+x(i).toFixed(1)+" "+y(point.percent).toFixed(1)).join(" ");
 const fill=line+" L "+x(view.length-1).toFixed(1)+" "+(H-B)+" L "+L+" "+(H-B)+" Z";
 const chosenIndex=Math.max(0,view.findIndex(p=>p.date===chosen.date));
 const weeks=Array.from({length:14},(_,i)=>shift(today,i-13));
 const maxVisits=Math.max(1,...weeks.map(d=>indexed.byDate.get(d)?.size||0));
 const chapters=VERSES.map((total,i)=>{
  const keys=indexed.chapterKeys.get(i+1)||[];
  return {id:i+1,name:SURAHS[i]||"Surah "+(i+1),total,count:keys.length,keys};
 });
 const visibleChapters=chapters.filter(c=>(showChapters==="all"||showChapters==="started"&&c.count>0||showChapters==="finished"&&c.count===c.total)&&(!filter.trim()||c.name.toLowerCase().includes(filter.trim().toLowerCase())||String(c.id)===filter.trim()));
 const starKey="1muslim:quran-starred-verses-v1:"+String(userId||"self");
 useEffect(()=>{try{const data=JSON.parse(localStorage.getItem(starKey)||"[]") as unknown;setSaved(Array.isArray(data)?data.filter((k):k is string=>typeof k==="string"&&valid(k)!==null).slice(0,300):[]);}catch{setSaved([]);}setStarsReady(true);},[starKey]);
 const toggleSaved=(key:string)=>{
  if(!valid(key))return;
  setSaved(previous=>{
   const next=previous.includes(key)?previous.filter(x=>x!==key):[key,...previous].slice(0,300);
   try{localStorage.setItem(starKey,JSON.stringify(next));}catch{}return next;
  });
 };
 const preferred=useMemo(()=>saved.find(k=>indexed.unique.has(k))||indexed.latest,[saved,indexed]);
 useEffect(()=>{
  let live=true;
  if(!preferred){setInspiration(null);return()=>{live=false;};}
  setInspiration(null);setInspirationBusy(true);
  const controller=new AbortController();
  fetch("https://api.alquran.cloud/v1/ayah/"+encodeURIComponent(preferred)+"/en.sahih",{signal:controller.signal})
   .then(r=>r.ok?r.json():Promise.reject(new Error("Verse unavailable")))
   .then(data=>{if(live&&typeof data?.data?.text==="string"&&data.data.text.trim())setInspiration({key:preferred,text:data.data.text.replace(/<[^>]*>/g,"").slice(0,800)});})
   .catch(()=>{}).finally(()=>{if(live)setInspirationBusy(false);});
  return()=>{live=false;controller.abort();};
 },[preferred]);
 const localMessage=totalRead?{
  headline:"Your journey is taking shape",
  message:"You've logged "+number(totalRead)+" unique verses across "+started+" chapter"+(started===1?"":"s")+". "+(weeklyVisits?"Your last 7 days included "+number(weeklyVisits)+" verse visits. ":"")+"Steady reflection matters more than a perfect streak.",
  nextStep:preferred?"Revisit Qur'an "+preferred+" and reflect on what stands out today.":"Choose one verse to revisit and reflect on today.",
  source:"local" as const
 }:{
  headline:"Every journey begins with one verse",
  message:"Your first recorded verse will begin building a personal reading timeline, chapter map and reminders from the Qur'an.",
  nextStep:"Open the Qur'an reader and log your first verse.",
  source:"local" as const
 };
 const getInsight=async()=>{
  if(insightBusy)return;
  setInsightBusy(true);setInsightError("");
  try{
   const response=await fetch("/api/quran/analytics-insight",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify({favoriteVerse:preferred||null})});
   const json=await response.json().catch(()=>({}));
   if(!response.ok||!json||typeof json.headline!=="string"||typeof json.message!=="string")throw Error(typeof json.error==="string"?json.error:"AI overview couldn't load. Your reading statistics are still available.");
   setInsight({headline:json.headline,message:json.message,nextStep:json.nextStep||"",source:json.source==="ai"?"ai":"local"});
   if(json.source!=="ai"&&typeof json.notice==="string")setInsightError(json.notice);
  }catch(error){setInsightError(error instanceof Error?error.message:"AI summary unavailable. Try again.");}
  finally{setInsightBusy(false);}
 };
 const svgInspect=(clientX:number,left:number,width:number)=>{
  const position=(clientX-left)/width;
  // SVG is drawn in a fixed viewBox, leaving margins for axes and labels.
  const fraction=Math.max(0,Math.min(1,(position-L/W)/(PW/W)));
  const index=Math.max(0,Math.min(view.length-1,Math.round(fraction*(view.length-1))));
  setActive(view[index].date);
 };
 return <div className={styles.dashboard}>
  <section className={styles.hero}>
   <div className={styles.heroTop}><span className={styles.eyebrow}><span className={styles.liveDot}/> QUR'AN INTELLIGENCE · PERSONAL READING DATA</span><span className={styles.synced}>✧ Cloud-synced verse history</span></div>
   <div className={styles.heroStats}>
    <div className={styles.heroMain}><span>Qur'an journey completed</span><strong>{percent(completed)}</strong><small>{number(totalRead)} of {number(TOTAL)} unique verses logged</small><div className={styles.heroProgress}><span style={{width:completed+"%"}}/></div></div>
    <div className={styles.stat}><span>Chapters explored</span><strong>{started}<small> / 114</small></strong><small>{finished} fully logged</small></div>
    <div className={styles.stat}><span>Current reading streak</span><strong>{streak}<small> days</small></strong><small>From saved daily activity</small></div>
    <div className={styles.stat}><span>Last 7 days</span><strong>{number(weeklyVisits)}</strong><small>{lastWeek?weeklyVisits>=lastWeek?"↑ "+Math.round((weeklyVisits-lastWeek)/lastWeek*100)+"% vs prior week":"↓ "+Math.round((lastWeek-weeklyVisits)/lastWeek*100)+"% vs prior week":"Verse visits logged"}</small></div>
   </div>
  </section>
  <section className={styles.market}>
   <div className={styles.marketHeader}><div><span className={styles.eyebrow}>THE READING MARKET · LIVE HISTORY</span><h3>Qur'an completion over time</h3><p>Your actual saved verses, plotted as a cumulative journey. Scrub or tap the chart to inspect a day.</p></div><span className={styles.marketBadge}>REAL DATA</span></div>
   <div className={styles.marketControls} role="group" aria-label="Choose reading analytics time range">{(["7D","30D","90D","1Y","ALL"] as Period[]).map(p=><button key={p} type="button" className={period===p?styles.periodActive:""} aria-pressed={period===p} onClick={()=>{setPeriod(p);setActive(null);}}>{p}</button>)}</div>
   <div className={styles.activeMetrics}><div><small>{chosen.date===today?"CURRENT COMPLETION":"SELECTED DATE · "+labelDate(chosen.date)}</small><strong>{percent(chosen.percent)}</strong></div><div><small>VERSES LOGGED BY THIS DATE</small><strong>{number(chosen.count)} <span>/ {number(TOTAL)}</span></strong></div><div><small>ADDED IN WINDOW</small><strong>+{number(maxData.count-minData.count+minData.newVerses)}</strong></div></div>
   <div className={styles.chartStage}>
    <svg className={styles.stockChart} viewBox={"0 0 "+W+" "+H} role="img" tabIndex={0} aria-label={"Qur'an completion "+percent(chosen.percent)+" on "+labelDate(chosen.date)+". Use arrow keys or touch to inspect progress."}
      onPointerMove={event=>{if(event.pointerType==="mouse"||event.buttons===1){const box=event.currentTarget.getBoundingClientRect();svgInspect(event.clientX,box.left,box.width);}}}
      onPointerDown={event=>{const box=event.currentTarget.getBoundingClientRect();svgInspect(event.clientX,box.left,box.width);}}
      onKeyDown={event=>{if(event.key==="ArrowLeft"||event.key==="ArrowRight"){event.preventDefault();const next=Math.max(0,Math.min(view.length-1,chosenIndex+(event.key==="ArrowRight"?1:-1)));setActive(view[next].date);}}}>
     <defs>
      <linearGradient id="qiArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--qi-accent, #1e82d3)" stopOpacity=".37"/><stop offset="62%" stopColor="var(--qi-accent, #1e82d3)" stopOpacity=".08"/><stop offset="100%" stopColor="var(--qi-accent, #1e82d3)" stopOpacity="0"/></linearGradient>
      <linearGradient id="qiLine" x1="0" y1="0" x2="1" y2="0"><stop stopColor="var(--qi-accent, #2866b4)"/><stop offset="100%" stopColor="var(--qi-second, #d0ac6b)"/></linearGradient>
      <filter id="qiShadow" x="-20%" y="-80%" width="150%" height="260%"><feGaussianBlur stdDeviation="6"/></filter>
     </defs>
     {[0,.25,.5,.75,1].map(t=><g key={t}><line x1={L} x2={W-R} y1={y(t*axis)} y2={y(t*axis)} stroke="#dfe8f0" strokeDasharray="3 7"/><text x={L-11} y={y(t*axis)+4} fontSize="12" textAnchor="end" fill="#8090a5">{percent(t*axis)}</text></g>)}
     {[0,.25,.5,.75,1].map(t=>{const d=view[Math.round(t*(view.length-1))];return <text key={t} x={L+t*PW} y={H-15} fontSize="13" textAnchor={t===0?"start":t===1?"end":"middle"} fill="#7c8da3">{labelDate(d.date)}</text>})}
     <g key={period} className={styles.chartReveal}>
      <path d={line} stroke="var(--qi-accent, #2866b4)" strokeWidth="10" opacity=".12" fill="none" filter="url(#qiShadow)" strokeLinecap="round"/>
      <path d={fill} fill="url(#qiArea)"/>
      <path d={line} stroke="url(#qiLine)" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" fill="none" vectorEffect="non-scaling-stroke"/>
     </g>
     <line x1={x(chosenIndex)} y1={T-5} x2={x(chosenIndex)} y2={H-B} stroke="#a4b3c5" strokeWidth="1.3" strokeDasharray="4 5"/>
     <circle cx={x(chosenIndex)} cy={y(chosen.percent)} r="12" fill="var(--qi-accent, #2866b4)" opacity=".15"/>
     <circle cx={x(chosenIndex)} cy={y(chosen.percent)} r="5.5" fill="#fff" stroke="var(--qi-accent, #2866b4)" strokeWidth="3"/>
    </svg>
    <div className={styles.chartLower}><span>Focused Y-axis: 0–{percent(axis)} · full Qur'an: 100%</span><span>{loading?"Updating…":"● Synced verse events"}</span></div>
   </div>
  </section>
  <section className={styles.aiCard} aria-label="Reading AI reflection">
   <div className={styles.aiOrb}><InsightGraphic/></div><div className={styles.aiBody}>
    <span className={styles.eyebrow}>{insight?.source==="ai"?"HUDHUD AI · YOUR PERSONAL READING OVERVIEW":"PERSONAL READING INSIGHT · HUDHUD AI AVAILABLE"}</span>
    <h3>{(insight||localMessage).headline}</h3><p>{(insight||localMessage).message}</p>
    <p className={styles.nextStep}>✧ {(insight||localMessage).nextStep}</p>
    <div className={styles.aiFooter}><button type="button" onClick={()=>void getInsight()} disabled={insightBusy||loading}>{insightBusy?"✦ Reflecting on your activity…":insight?"✦ Refresh AI overview":"✦ Generate AI overview"}</button><small>Generated on request · your private reading counts are analyzed only when you tap.</small></div>
    {insightError&&<p className={styles.aiError} role="status">{insightError}</p>}
   </div>
  </section>
  <div className={styles.lowerGrid}>
   <section className={styles.activity}><div className={styles.sectionHead}><div><span className={styles.eyebrow}>YOUR READING RHYTHM</span><h3>Last 14 days</h3></div><span>{number(weeklyVisits)} visits · 7D</span></div>
    <div className={styles.activityGrid} aria-label="Verse visits during the last fourteen calendar days">{weeks.map(date=>{const count=indexed.byDate.get(date)?.size||0;return <div key={date} className={styles.activitySlot} title={labelDate(date)+": "+number(count)+" verses logged"}><b>{count||"·"}</b><div><i style={{height:Math.max(3,Math.round(count/maxVisits*100))+"%"}}/></div><small>{labelDate(date,true)}</small></div>})}</div>
    <p className={styles.muted}>Each bar represents verse visits recorded on that day. The main completion graph counts each distinct verse only once.</p>
   </section>
   <section className={styles.inspiration}><div className={styles.sectionHead}><div><span className={styles.eyebrow}>A VERSE TO REVISIT</span><h3>{saved.includes(preferred||"")?"⭐ From your saved verses":"From your reading history"}</h3></div><span>QUR'AN</span></div>
    {preferred?<>{inspiration?<blockquote>“{inspiration.text}”</blockquote>:<p className={styles.muted}>{inspirationBusy?"Loading verified translation…":"Open this verse to reflect on its meaning."}</p>}
     <div className={styles.verseActions}><Link href={"/elm-tent/quran?verse="+encodeURIComponent(preferred)}>Qur'an {preferred} ↗</Link>{starsReady&&<button type="button" aria-pressed={saved.includes(preferred)} onClick={()=>toggleSaved(preferred)}>{saved.includes(preferred)?"★ Saved":"☆ Save verse"}</button>}</div>
     <small>Translation: Sahih International via AlQuran Cloud. Saved stars on this device.</small></>:<><p className={styles.muted}>Your recent or starred verse will appear here when your reading activity begins.</p><Link className={styles.smallLink} href="/elm-tent/quran">Open the Qur'an ↗</Link></>}
   </section>
  </div>
  <section className={styles.chapters} aria-label="Chapter-by-chapter reading intelligence">
   <div className={styles.sectionHead}><div><span className={styles.eyebrow}>DEEP DIVE · 114 SURAHS</span><h3>Chapter intelligence</h3><p>Tap a chapter to inspect exact verses you've logged, or reopen a verse in Qur'an Studio.</p></div><span>{started} of 114 explored</span></div>
   <div className={styles.chapterFilters}><div role="group" aria-label="Filter chapters">{(["started","all","finished"] as const).map(mode=><button type="button" key={mode} aria-pressed={showChapters===mode} onClick={()=>setShowChapters(mode)}>{mode==="started"?"Read":mode==="finished"?"Completed":"All 114"}</button>)}</div><input value={filter} onChange={event=>setFilter(event.target.value)} placeholder="Find a surah or number…" aria-label="Filter chapters by name or number"/></div>
   <div className={styles.chapterList}>{visibleChapters.length?visibleChapters.map(ch=>{
    const opened=ch.id===selectedChapter,completion=ch.count/ch.total*100;
    return <div className={styles.chapterBlock} key={ch.id}><button type="button" className={styles.chapterRow} aria-expanded={opened} onClick={()=>{setSelectedChapter(opened?null:ch.id);setShowAllVerses(false);}}>
      <span className={styles.chapterNumber}>{String(ch.id).padStart(2,"0")}</span><span className={styles.chapterInfo}><strong>{ch.name}</strong><span><i style={{width:completion+"%"}}/></span></span><span className={styles.chapterCount}><b>{number(ch.count)} <small>/ {ch.total}</small></b><small>{percent(completion)} · {ch.count===0?"Not started":completion===100?"Complete":"In progress"}</small></span><span className={styles.chevron}>{opened?"⌃":"⌄"}</span>
     </button>{opened&&<div className={styles.chapterOpen}>
      <p>{ch.count?formatReadVerses(ch.keys):"No verse history in this chapter yet."} {ch.count?"· Tap the exact verse numbers below.":""}</p>
      <div className={styles.verseGrid}>{(showAllVerses?ch.keys:ch.keys.slice(0,24)).map(key=><div className={styles.verseChip} key={key}><Link href={"/elm-tent/quran?verse="+encodeURIComponent(key)} aria-label={"Open Qur'an verse "+key}>{key}</Link><button type="button" aria-label={saved.includes(key)?"Remove "+key+" from saved verses":"Save "+key} aria-pressed={saved.includes(key)} onClick={()=>toggleSaved(key)}>{saved.includes(key)?"★":"☆"}</button></div>)}</div>
      {ch.keys.length>24&&<button className={styles.moreVerses} type="button" onClick={()=>setShowAllVerses(v=>!v)}>{showAllVerses?"Show fewer verses":"Show all "+number(ch.keys.length)+" read verses"}</button>}
      <div className={styles.chapterFoot}><span>Unique logged verses: {number(ch.count)} · Remaining: {number(ch.total-ch.count)}</span><Link href={"/elm-tent/quran?chapter="+ch.id}>Open Surah ↗</Link></div>
     </div>}</div>;
   }):<div className={styles.empty}>No chapters match this view. Select “All 114” or try another search.</div>}</div>
   <p className={styles.muted}>Chapter totals are based on validated unique verse keys, not time spent. ⭐ Stars save locally to this device for now; reading activity remains synchronized across devices.</p>
  </section>
 </div>;
}
export default function QuranIntelligenceDashboard(props:{readings:QuranReading[];loading:boolean;userId?:string}){return <Confidence {...props}/>;}
