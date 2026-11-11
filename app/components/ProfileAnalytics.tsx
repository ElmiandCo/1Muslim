"use client";
import {useEffect,useState} from "react";
import {createClient} from "../../utils/supabase/client";

type Reading={verse_key:string;read_on:string};
const CHAPTER_VERSE_COUNTS=[7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
const DEMO=[5,9,15,24,38,51];
const monthKey=(date:string)=>date.slice(0,7);
function QuranCompletionGraph({readings,loading}:{readings:Reading[];loading:boolean}){
 const firstSeen=new Map<string,string>();
 for(const r of readings){if(!/^\\d{1,3}:\\d{1,3}$/.test(r.verse_key)||!/^\\d{4}-\\d{2}-\\d{2}$/.test(r.read_on))continue;const previous=firstSeen.get(r.verse_key);if(!previous||r.read_on<previous)firstSeen.set(r.verse_key,r.read_on)}
 const perChapter=new Map<number,number>();for(const key of firstSeen.keys()){const [chapter,verse]=key.split(":").map(Number);if(chapter>=1&&chapter<=114&&verse>=1&&verse<=CHAPTER_VERSE_COUNTS[chapter-1])perChapter.set(chapter,(perChapter.get(chapter)||0)+1)}
 const completed=[...perChapter].some(([chapter,count])=>count>=CHAPTER_VERSE_COUNTS[chapter-1]);
 const now=new Date();const months=Array.from({length:6},(_,i)=>{const d=new Date(now.getFullYear(),now.getMonth()-5+i,1);return {key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`,label:d.toLocaleDateString(undefined,{month:"short"})}});
 const points=months.map((m,i)=>({label:m.label,key:m.key,value:completed?Math.min(100,100*[...firstSeen.values()].filter(date=>monthKey(date)<=m.key).length/6236):DEMO[i]}));
 const width=580,height=290,left=46,right=18,top=18,bottom=37,plotW=width-left-right,plotH=height-top-bottom;
 const x=(i:number)=>left+plotW*i/5,y=(v:number)=>top+plotH*(1-v/100);
 const path=points.map((p,i)=>`${i?"L":"M"} ${x(i)} ${y(p.value)}`).join(" ");
 const [selected,setSelected]=useState<number|null>(null);const index=selected??5;
 return <section className="profileCompletionGraph"><div className="profileCompletionHeading"><div><h3>Qur’an completion over time</h3><small>{completed?"Your reading progress · synced across devices":"Illustrative preview · your graph unlocks after one completed chapter"}</small></div>{!completed&&<span className="profileCompletionDemo">DEMO</span>}</div><div className="profileCompletionMetric"><span>Qur’an completed</span><strong>{points[index].value.toFixed(completed?1:0)}%</strong><small>{points[index].label} {months[index].key.slice(0,4)}</small></div><svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`Qur’an completion trend from ${months[0].label} to ${months[5].label}`}>
 {[0,25,50,75,100].map(t=><g key={t}><line x1={left} x2={width-right} y1={y(t)} y2={y(t)} stroke="#dfe7f0" strokeDasharray="3 6"/><text x={left-10} y={y(t)+4} textAnchor="end" fontSize="12" fill="#75869a">{t}%</text></g>)}
 {selected!==null&&<line x1={x(index)} x2={x(index)} y1={top} y2={height-bottom} stroke="#9caec3" strokeWidth="1"/>}
 <path d={path} fill="none" stroke="#1684ec" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
 {points.map((p,i)=><g key={p.key} onClick={()=>setSelected(i)} style={{cursor:"pointer"}}><circle cx={x(i)} cy={y(p.value)} r="16" fill="transparent"/><circle cx={x(i)} cy={y(p.value)} r={i===index?6:3} fill="#1684ec" stroke={i===index?"#fff":"none"} strokeWidth="2"/><text x={x(i)} y={height-12} textAnchor="middle" fontSize="13" fill="#687b90">{p.label}</text></g>)}
 </svg><div className="profileCompletionMonths" aria-label="Select month">{points.map((p,i)=><button type="button" key={p.key} aria-pressed={i===index} onClick={()=>setSelected(i)}>{p.label}</button>)}</div>{loading&&<p className="profileAnalyticsMuted">Loading your Qur’an activity…</p>}</section>
}
const TIME_KEY="1muslim:page-screen-time-v1";
const fmt=(s:number)=>s>=3600?`${Math.floor(s/3600)}h ${Math.round(s%3600/60)}m`:`${Math.floor(s/60)}m`;
const day=(offset:number)=>{const d=new Date();d.setDate(d.getDate()-offset);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-")};
export function ProfileActivityTracker(){
 useEffect(()=>{
  let last=Date.now();
  const flush=()=>{
   const now=Date.now(),elapsed=Math.max(0,Math.min(15,Math.round((now-last)/1000)));last=now;
   if(document.visibilityState!=="visible"||!document.hasFocus()||!elapsed)return;
   try{
    const data=JSON.parse(localStorage.getItem(TIME_KEY)||"{}") as Record<string,Record<string,number>>;
    const date=day(0),path=location.pathname||"/";
    data[date]??={};data[date][path]=(data[date][path]||0)+elapsed;
    const keys=Object.keys(data).sort();for(const k of keys.slice(0,Math.max(0,keys.length-90)))delete data[k];
    localStorage.setItem(TIME_KEY,JSON.stringify(data));
   }catch{}
  };
  const id=setInterval(flush,10000);
  const onFocus=()=>{last=Date.now()},onBlur=()=>{flush();last=Date.now()};
  document.addEventListener("visibilitychange",onBlur);window.addEventListener("focus",onFocus);window.addEventListener("pagehide",onBlur);
  return()=>{clearInterval(id);document.removeEventListener("visibilitychange",onBlur);window.removeEventListener("focus",onFocus);window.removeEventListener("pagehide",onBlur)};
 },[]);
 return null;
}
export default function ProfileAnalytics({inline=false}:{inline?:boolean}={}){
 const [open,setOpen]=useState(false),[readings,setReadings]=useState<Reading[]>([]),[screen,setScreen]=useState<Record<string,Record<string,number>>>({}),[loading,setLoading]=useState(false);
 useEffect(()=>{if(!open&&!inline)return;let live=true;setLoading(true);try{setScreen(JSON.parse(localStorage.getItem(TIME_KEY)||"{}"))}catch{setScreen({})}
 const load=async()=>{const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user){if(live)setLoading(false);return}
 const {data}=await db.from("quran_reading_events").select("verse_key,read_on").eq("user_id",user.id).order("read_on",{ascending:false}).limit(15000);
 if(live){setReadings((data||[]) as Reading[]);setLoading(false)}};void load();return()=>{live=false}},[open,inline]);
 const dates=Array.from({length:7},(_,i)=>day(6-i));
 const chart=dates.map(d=>({date:d,count:new Set(readings.filter(r=>r.read_on===d).map(r=>r.verse_key)).size}));
 const max=Math.max(1,...chart.map(x=>x.count));
 const today=screen[day(0)]||{},week=dates.reduce((total,d)=>total+Object.values(screen[d]||{}).reduce((a,b)=>a+b,0),0);
 const todaySeconds=Object.values(today).reduce((a,b)=>a+b,0);
 const topPages=Object.entries(dates.reduce((acc,d)=>{for(const [p,t] of Object.entries(screen[d]||{}))acc[p]=(acc[p]||0)+t;return acc},{} as Record<string,number>)).sort((a,b)=>b[1]-a[1]).slice(0,5);
 const uniqueVerses=new Set(readings.map(r=>r.verse_key)).size;
 return <>{!inline&&<button type="button" className="profileAnalyticsTile" onClick={()=>setOpen(true)} aria-haspopup="dialog"><span className="profileAnalyticsTileIcon">▥</span><span>Analytics<small>Screen time &amp; Qur’an progress</small></span></button>}
 {(open||inline)&&<div className={inline?"profileAnalyticsInline":"profileAnalyticsShade"} role={inline?undefined:"presentation"} onClick={inline?undefined:()=>setOpen(false)}><section className="profileAnalyticsPanel" role={inline?"region":"dialog"} aria-modal={inline?undefined:true} aria-label="Your activity analytics" onClick={e=>e.stopPropagation()}>
 <header><div><small>YOUR ACTIVITY</small><h2>Analytics</h2></div>{!inline&&<button type="button" onClick={()=>setOpen(false)} aria-label="Close analytics">✕</button>}</header>
 <h3>Screen time <small>this device · tracked while active</small></h3>
 <div className="profileAnalyticsStats"><div><strong>{fmt(todaySeconds)}</strong><span>Today</span></div><div><strong>{fmt(week)}</strong><span>Last 7 days</span></div></div>
 <h4>Pages visited · last 7 days</h4>{topPages.length?topPages.map(([p,t])=><div className="profileAnalyticsRow" key={p}><span>{p==="/"? "Home":p.replaceAll("/"," / ")}</span><b>{fmt(t)}</b></div>):<p className="profileAnalyticsMuted">Screen time will appear as you use 1Muslim after this update.</p>}
 <QuranCompletionGraph readings={readings} loading={loading}/>
 <h3>Qur’an progress <small>synced across devices</small></h3>
 <div className="profileAnalyticsStats"><div><strong>{uniqueVerses.toLocaleString()}</strong><span>Unique verses logged</span></div><div><strong>{chart.reduce((n,x)=>n+x.count,0)}</strong><span>Verses · last 7 days</span></div></div>
 <h4>Daily verses read</h4><div className="profileAnalyticsChart" role="img" aria-label="Verses read each day over the last seven days">{chart.map(x=><div className="profileAnalyticsBarSlot" key={x.date}><b>{x.count}</b><div className="profileAnalyticsBarTrack"><i style={{height:`${Math.max(x.count?6:2,x.count/max*100)}%`}}/></div><small>{new Date(x.date+"T12:00:00").toLocaleDateString(undefined,{weekday:"short"})}</small></div>)}</div>
 {loading&&<p className="profileAnalyticsMuted">Loading reading history…</p>}<p className="profileAnalyticsMuted">Reading counts come from saved Qur’an activity. Screen time is recorded on this device only, starting with this release.</p>
 <a className="profileAnalyticsLink" href="/quran-library">Open Qur’an Library →</a></section></div>}
 <style>{`
 .profileCompletionGraph{border:1px solid #e0e9f4;border-radius:20px;background:#fff;padding:16px 12px 12px;margin-top:20px;min-width:0}.profileCompletionHeading{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.profileCompletionHeading h3{margin:0 0 3px;font-size:18px}.profileCompletionHeading small{display:block;font-size:11px;color:#718096;line-height:1.4}.profileCompletionDemo{font-size:10px;letter-spacing:.1em;background:#edf4fc;color:#235a93;border-radius:7px;padding:5px 8px;font-weight:800}.profileCompletionMetric{margin:15px 0 5px;border-left:4px solid #1684ec;padding-left:10px;display:flex;flex-direction:column}.profileCompletionMetric span{font-size:12px;color:#667891}.profileCompletionMetric strong{font-size:28px;color:#172d47}.profileCompletionMetric small{font-size:11px;color:#718096}.profileCompletionGraph svg{display:block;width:100%;height:auto;overflow:visible}.profileCompletionMonths{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:3px}.profileCompletionMonths button{border:0;background:transparent;color:#667891;font-size:11px;border-radius:7px;padding:9px 0}.profileCompletionMonths button[aria-pressed=true]{background:#e8f3ff;color:#176ab3;font-weight:800}
 .profileAnalyticsTile{display:flex!important;align-items:center!important;gap:14px!important;text-align:left!important}.profileAnalyticsTileIcon{font-size:27px;min-width:30px}.profileAnalyticsTile span:last-child{display:flex;flex-direction:column}.profileAnalyticsTile small{display:block;font-size:12px;font-weight:400;color:#718096;margin-top:5px}
 .profileAnalyticsInline{width:100%;min-width:0}.profileAnalyticsInline .profileAnalyticsPanel{width:100%;max-height:none;overflow:visible;box-sizing:border-box;padding:clamp(14px,3vw,28px);border:1px solid #dce5f0;box-shadow:none;border-radius:20px}.profileAnalyticsInline .profileAnalyticsPanel header h2{font-size:25px}.profileAnalyticsInline .profileCompletionGraph{max-width:100%}
 .profileAnalyticsShade{position:fixed;inset:0;z-index:2147483005;background:#071524a8;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(8px)}
 .profileAnalyticsPanel{background:#fff;color:#172d47;width:min(100%,540px);max-height:88dvh;overflow:auto;border-radius:25px;padding:24px;box-shadow:0 20px 80px #0005}
 .profileAnalyticsPanel header{display:flex;justify-content:space-between;align-items:start}.profileAnalyticsPanel header small{font-size:11px;letter-spacing:.15em;color:#8493a8}.profileAnalyticsPanel header h2{margin:3px 0 15px;font-size:30px}.profileAnalyticsPanel header button{border:0;background:#f1f5fa;border-radius:50%;width:38px;height:38px;font-size:20px;color:#243b55}
 .profileAnalyticsPanel h3{font-size:20px;margin:20px 0 14px}.profileAnalyticsPanel h3 small{display:block;font-size:12px;font-weight:400;color:#718096}.profileAnalyticsPanel h4{font-size:13px;color:#667891;margin:20px 0 10px}
 .profileAnalyticsStats{display:grid;grid-template-columns:1fr 1fr;gap:12px}.profileAnalyticsStats>div{background:#f3f6fb;border:1px solid #e1e9f4;border-radius:16px;padding:16px}.profileAnalyticsStats strong{display:block;font-size:26px;color:#235a93}.profileAnalyticsStats span{font-size:12px;color:#64748b}
 .profileAnalyticsRow{display:flex;justify-content:space-between;border-bottom:1px solid #edf1f6;padding:9px 0;font-size:13px;gap:12px}.profileAnalyticsRow span{overflow:hidden;text-overflow:ellipsis}.profileAnalyticsRow b{white-space:nowrap}
 .profileAnalyticsChart{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:9px;height:170px;align-items:end}.profileAnalyticsBarSlot{height:100%;display:flex;flex-direction:column;align-items:center;gap:5px;font-size:12px}.profileAnalyticsBarSlot b{font-size:12px}.profileAnalyticsBarTrack{width:100%;flex:1;display:flex;align-items:flex-end;background:#f2f5fa;border-radius:9px;overflow:hidden}.profileAnalyticsBarTrack i{width:100%;background:linear-gradient(#bca477,#235a93);border-radius:8px 8px 0 0;min-height:2px}.profileAnalyticsBarSlot small{font-size:11px;color:#6b7a91}.profileAnalyticsMuted{font-size:12px;color:#748299;line-height:1.6}.profileAnalyticsLink{display:block;text-align:center;background:#235a93;color:#fff;border-radius:13px;padding:13px;text-decoration:none;font-weight:700;margin-top:20px}
 `}</style></>;
}
