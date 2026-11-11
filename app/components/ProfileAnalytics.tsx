"use client";
import {useEffect,useState} from "react";
import {createClient} from "../../utils/supabase/client";

type Reading={verse_key:string;read_on:string};
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
export default function ProfileAnalytics(){
 const [open,setOpen]=useState(false),[readings,setReadings]=useState<Reading[]>([]),[screen,setScreen]=useState<Record<string,Record<string,number>>>({}),[loading,setLoading]=useState(false);
 useEffect(()=>{if(!open)return;let live=true;setLoading(true);try{setScreen(JSON.parse(localStorage.getItem(TIME_KEY)||"{}"))}catch{setScreen({})}
 const load=async()=>{const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user){if(live)setLoading(false);return}
 const {data}=await db.from("quran_reading_events").select("verse_key,read_on").eq("user_id",user.id).order("read_on",{ascending:false}).limit(15000);
 if(live){setReadings((data||[]) as Reading[]);setLoading(false)}};void load();return()=>{live=false}},[open]);
 const dates=Array.from({length:7},(_,i)=>day(6-i));
 const chart=dates.map(d=>({date:d,count:new Set(readings.filter(r=>r.read_on===d).map(r=>r.verse_key)).size}));
 const max=Math.max(1,...chart.map(x=>x.count));
 const today=screen[day(0)]||{},week=dates.reduce((total,d)=>total+Object.values(screen[d]||{}).reduce((a,b)=>a+b,0),0);
 const todaySeconds=Object.values(today).reduce((a,b)=>a+b,0);
 const topPages=Object.entries(dates.reduce((acc,d)=>{for(const [p,t] of Object.entries(screen[d]||{}))acc[p]=(acc[p]||0)+t;return acc},{} as Record<string,number>)).sort((a,b)=>b[1]-a[1]).slice(0,5);
 const uniqueVerses=new Set(readings.map(r=>r.verse_key)).size;
 return <><button type="button" className="profileAnalyticsTile" onClick={()=>setOpen(true)} aria-haspopup="dialog"><span className="profileAnalyticsTileIcon">▥</span><span>Analytics<small>Screen time &amp; Qur’an progress</small></span></button>
 {open&&<div className="profileAnalyticsShade" role="presentation" onClick={()=>setOpen(false)}><section className="profileAnalyticsPanel" role="dialog" aria-modal="true" aria-label="Your activity analytics" onClick={e=>e.stopPropagation()}>
 <header><div><small>YOUR ACTIVITY</small><h2>Analytics</h2></div><button type="button" onClick={()=>setOpen(false)} aria-label="Close analytics">✕</button></header>
 <h3>Screen time <small>this device · tracked while active</small></h3>
 <div className="profileAnalyticsStats"><div><strong>{fmt(todaySeconds)}</strong><span>Today</span></div><div><strong>{fmt(week)}</strong><span>Last 7 days</span></div></div>
 <h4>Pages visited · last 7 days</h4>{topPages.length?topPages.map(([p,t])=><div className="profileAnalyticsRow" key={p}><span>{p==="/"? "Home":p.replaceAll("/"," / ")}</span><b>{fmt(t)}</b></div>):<p className="profileAnalyticsMuted">Screen time will appear as you use 1Muslim after this update.</p>}
 <h3>Qur’an progress <small>synced across devices</small></h3>
 <div className="profileAnalyticsStats"><div><strong>{uniqueVerses.toLocaleString()}</strong><span>Unique verses logged</span></div><div><strong>{chart.reduce((n,x)=>n+x.count,0)}</strong><span>Verses · last 7 days</span></div></div>
 <h4>Daily verses read</h4><div className="profileAnalyticsChart" role="img" aria-label="Verses read each day over the last seven days">{chart.map(x=><div className="profileAnalyticsBarSlot" key={x.date}><b>{x.count}</b><div className="profileAnalyticsBarTrack"><i style={{height:`${Math.max(x.count?6:2,x.count/max*100)}%`}}/></div><small>{new Date(x.date+"T12:00:00").toLocaleDateString(undefined,{weekday:"short"})}</small></div>)}</div>
 {loading&&<p className="profileAnalyticsMuted">Loading reading history…</p>}<p className="profileAnalyticsMuted">Reading counts come from saved Qur’an activity. Screen time is recorded on this device only, starting with this release.</p>
 <a className="profileAnalyticsLink" href="/quran-library">Open Qur’an Library →</a></section></div>}
 <style>{`
 .profileAnalyticsTile{display:flex!important;align-items:center!important;gap:14px!important;text-align:left!important}.profileAnalyticsTileIcon{font-size:27px;min-width:30px}.profileAnalyticsTile span:last-child{display:flex;flex-direction:column}.profileAnalyticsTile small{display:block;font-size:12px;font-weight:400;color:#718096;margin-top:5px}
 .profileAnalyticsShade{position:fixed;inset:0;z-index:2147483005;background:#071524a8;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(8px)}
 .profileAnalyticsPanel{background:#fff;color:#172d47;width:min(100%,540px);max-height:88dvh;overflow:auto;border-radius:25px;padding:24px;box-shadow:0 20px 80px #0005}
 .profileAnalyticsPanel header{display:flex;justify-content:space-between;align-items:start}.profileAnalyticsPanel header small{font-size:11px;letter-spacing:.15em;color:#8493a8}.profileAnalyticsPanel header h2{margin:3px 0 15px;font-size:30px}.profileAnalyticsPanel header button{border:0;background:#f1f5fa;border-radius:50%;width:38px;height:38px;font-size:20px;color:#243b55}
 .profileAnalyticsPanel h3{font-size:20px;margin:20px 0 14px}.profileAnalyticsPanel h3 small{display:block;font-size:12px;font-weight:400;color:#718096}.profileAnalyticsPanel h4{font-size:13px;color:#667891;margin:20px 0 10px}
 .profileAnalyticsStats{display:grid;grid-template-columns:1fr 1fr;gap:12px}.profileAnalyticsStats>div{background:#f3f6fb;border:1px solid #e1e9f4;border-radius:16px;padding:16px}.profileAnalyticsStats strong{display:block;font-size:26px;color:#235a93}.profileAnalyticsStats span{font-size:12px;color:#64748b}
 .profileAnalyticsRow{display:flex;justify-content:space-between;border-bottom:1px solid #edf1f6;padding:9px 0;font-size:13px;gap:12px}.profileAnalyticsRow span{overflow:hidden;text-overflow:ellipsis}.profileAnalyticsRow b{white-space:nowrap}
 .profileAnalyticsChart{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:9px;height:170px;align-items:end}.profileAnalyticsBarSlot{height:100%;display:flex;flex-direction:column;align-items:center;gap:5px;font-size:12px}.profileAnalyticsBarSlot b{font-size:12px}.profileAnalyticsBarTrack{width:100%;flex:1;display:flex;align-items:flex-end;background:#f2f5fa;border-radius:9px;overflow:hidden}.profileAnalyticsBarTrack i{width:100%;background:linear-gradient(#bca477,#235a93);border-radius:8px 8px 0 0;min-height:2px}.profileAnalyticsBarSlot small{font-size:11px;color:#6b7a91}.profileAnalyticsMuted{font-size:12px;color:#748299;line-height:1.6}.profileAnalyticsLink{display:block;text-align:center;background:#235a93;color:#fff;border-radius:13px;padding:13px;text-decoration:none;font-weight:700;margin-top:20px}
 `}</style></>;
}
