"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import SiteNav from "../../components/SiteNav";
import { createClient } from "../../../utils/supabase/client";

type Slot={id:string;host_id:string;title:string;category:string;starts_at:string;ends_at:string;status:string;thumbnail_path:string|null;};

function countdown(ms:number){
  if(ms<=0) return "Starting now";
  const t=Math.floor(ms/1000),d=Math.floor(t/86400),h=Math.floor((t%86400)/3600),m=Math.floor((t%3600)/60),s=t%60;
  return d?`${d}d ${h}h`:h?`${h}h ${String(m).padStart(2,"0")}m`:`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

export default function ScheduledLives(){
  const supabase=useMemo(()=>createClient(),[]);
  const [slots,setSlots]=useState<Slot[]>([]);
  const [now,setNow]=useState(Date.now());
  useEffect(()=>{
    const load=async()=>{const {data}=await supabase.from("live_schedule_slots").select("id,host_id,title,category,starts_at,ends_at,status,thumbnail_path").in("status",["scheduled","waiting","live"]).order("starts_at",{ascending:true});setSlots((data??[]) as Slot[])};
    void load(); const r=window.setInterval(load,15000), c=window.setInterval(()=>setNow(Date.now()),1000);
    return()=>{window.clearInterval(r);window.clearInterval(c)};
  },[supabase]);
  const next=slots.find(x=>new Date(x.starts_at).getTime()>now)||slots.find(x=>x.status==="waiting");
  return <main className="scheduledPage"><style jsx>{`
    .scheduledPage{min-height:100vh;background:var(--bg);color:var(--text)}.shell{max-width:1120px;margin:auto;padding:34px 18px 80px}.hero{border:1px solid #243229;border-radius:25px;padding:30px;background:radial-gradient(circle at 85% 10%,rgba(132,174,116,.15),transparent 35%),#09100b}.eyebrow{font-size:10px;letter-spacing:.16em;color:#8ca48d;font-weight:900}.hero h1{font-size:clamp(38px,6vw,62px);letter-spacing:-.07em;margin:8px 0}.hero p{color:#89978e;max-width:680px;line-height:1.7;font-size:13px}.back{display:inline-block;margin-top:14px;color:#d8e9bd;font-size:11px;text-decoration:none}.section{margin-top:28px}.section h2{font-size:21px;letter-spacing:-.04em}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.card{border:1px solid #243229;border-radius:19px;background:#09100b;padding:18px}.card.next{border-color:#6b815e;box-shadow:0 0 0 1px #364632 inset}.pill{display:inline-block;border:1px solid #354438;border-radius:999px;padding:5px 8px;font-size:9px;color:#bdcdbf}.card h3{font-size:17px;margin:12px 0 5px}.meta{color:#718078;font-size:10px;line-height:1.6}.time{font-size:25px;letter-spacing:-.05em;margin:14px 0 4px;color:#dce9dd}.note{font-size:10px;color:#85938a;line-height:1.55}.empty{border:1px dashed #2d3c31;border-radius:18px;padding:32px;text-align:center;color:#7d8b82}@media(max-width:760px){.grid{grid-template-columns:1fr}.shell{padding:22px 13px 60px}}
  `}</style><SiteNav/><div className="shell">
    <section className="hero"><span className="eyebrow">1MUSLIM · SCHEDULED LIVES</span><h1>Know what’s coming.</h1><p>Scheduled Lives are the handoff queue for the Live Now channel. Pro streamers can prepare, enter early, and wait for their slot. Viewers can see the next voice before the current segment changes.</p><div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:16}}><Link href="/streaming/go-live?schedule=1" className="back" style={{marginTop:0,border:"1px solid #52634d",padding:"10px 14px",borderRadius:999}}>＋ Schedule a Live</Link><Link href="/streaming" className="back">← Back to Live Now</Link></div></section>
    <section className="section"><h2>Upcoming</h2>{slots.length?<div className="grid">{slots.map(slot=>{const starts=new Date(slot.starts_at).getTime();const isNext=slot.id===next?.id;return <article className={isNext?"card next":"card"} key={slot.id}><span className="pill">{slot.status==="waiting"?"WAITING":slot.status==="live"?"LIVE":"SCHEDULED"}</span><h3>{slot.title}</h3><div className="meta">{slot.category}<br/>{new Date(slot.starts_at).toLocaleString([], {dateStyle:"medium",timeStyle:"short"})} → {new Date(slot.ends_at).toLocaleTimeString([], {timeStyle:"short"})}</div><div className="time">{countdown(starts-now)}</div><div className="note">{isNext?"Next in the Live Now rotation. The host can pre-connect before the handoff.":"This slot is queued for the continuous Live Now channel."}</div></article>})}</div>:<div className="empty">No scheduled Lives yet. Once pro streamer slots are created, they will appear here and feed the Live Now handoff queue.</div>}</section>
  </div></main>;
}
