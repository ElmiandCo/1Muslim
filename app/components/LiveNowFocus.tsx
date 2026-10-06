"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../utils/supabase/client";

type LiveRow = {
  id:string; title:string; category:string; viewer_count:number; started_at:string;
  scheduled_end_at:string|null; thumbnail_path:string|null;
};
type Slot = {
  id:string; host_id:string; title:string; category:string; starts_at:string; ends_at:string;
  status:string; thumbnail_path:string|null;
};

function countdown(ms:number){
  if(ms<=0) return "Starting now";
  const total=Math.floor(ms/1000);
  const d=Math.floor(total/86400), h=Math.floor((total%86400)/3600), m=Math.floor((total%3600)/60), s=total%60;
  if(d) return `${d}d ${h}h`;
  if(h) return `${h}h ${String(m).padStart(2,"0")}m`;
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

export default function LiveNowFocus(){
  const supabase=useMemo(()=>createClient(),[]);
  const [live,setLive]=useState<LiveRow|null>(null);
  const [next,setNext]=useState<Slot|null>(null);
  const [now,setNow]=useState(Date.now());
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    const load=async()=>{
      const [{data:lives},{data:slots}]=await Promise.all([
        supabase.from("live_streams").select("id,title,category,viewer_count,started_at,scheduled_end_at,thumbnail_path").eq("status","live").eq("stream_lane","live-now").order("started_at",{ascending:false}).limit(1),
        supabase.from("live_schedule_slots").select("id,host_id,title,category,starts_at,ends_at,status,thumbnail_path").in("status",["scheduled","waiting","live"]).order("starts_at",{ascending:true}).limit(8)
      ]);
      setLive((lives?.[0]??null) as LiveRow|null);
      const upcoming=(slots??[]).find((x:any)=>new Date(x.starts_at).getTime()>Date.now() || x.status==="waiting");
      setNext((upcoming??null) as Slot|null);
      setLoading(false);
    };
    void load();
    const refresh=window.setInterval(load,10000);
    const clock=window.setInterval(()=>setNow(Date.now()),1000);
    return()=>{window.clearInterval(refresh);window.clearInterval(clock)};
  },[supabase]);

  const nextStarts=next?new Date(next.starts_at).getTime():0;
  const liveEnds=live?.scheduled_end_at?new Date(live.scheduled_end_at).getTime():0;
  const handoffSoon=!!liveEnds && liveEnds-now<=120000 && liveEnds-now>0;
  const nextCountdown=next?countdown(nextStarts-now):"";
  const handoffCountdown=liveEnds?countdown(liveEnds-now):"";

  return <section className="liveFocus">
    <style jsx>{`
      .liveFocus{margin:22px 0 36px;border:1px solid #26362b;border-radius:28px;overflow:hidden;background:radial-gradient(circle at 78% 18%,rgba(116,164,103,.18),transparent 30%),linear-gradient(145deg,#0d1711,#050806);box-shadow:0 28px 80px rgba(0,0,0,.22)}
      .inner{padding:30px;display:grid;grid-template-columns:minmax(0,1.25fr) minmax(280px,.75fr);gap:18px}.eyebrow{font-size:10px;letter-spacing:.17em;color:#8da88f;font-weight:900}.title{font-size:clamp(34px,5vw,62px);letter-spacing:-.07em;line-height:.98;margin:9px 0 12px}.copy{color:#94a29a;max-width:650px;line-height:1.65;font-size:13px}.actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:22px}.primary,.ghost{display:inline-flex;align-items:center;justify-content:center;border-radius:999px;padding:12px 17px;text-decoration:none;font-size:11px;font-weight:850}.primary{background:#d8e9bd;color:#071008}.ghost{border:1px solid #304034;color:#d7e2d9;background:#0b120d}.liveCard,.nextCard{border:1px solid #26362b;border-radius:20px;background:rgba(5,10,7,.72);padding:18px}.liveCard{min-height:205px;display:flex;flex-direction:column;justify-content:space-between}.pill{display:inline-flex;align-items:center;gap:6px;border:1px solid #526a52;color:#d8e9bd;border-radius:999px;padding:6px 9px;font-size:9px;font-weight:900}.dot{width:6px;height:6px;border-radius:50%;background:#d8e9bd;box-shadow:0 0 12px #d8e9bd}.liveCard h3{font-size:20px;line-height:1.12;margin:14px 0 5px}.meta{font-size:10px;color:#75847a}.viewers{color:#b8c9bb}.handoff{margin-top:14px;border:1px solid #5a684e;background:#111c12;border-radius:14px;padding:11px;font-size:10px;color:#dce8dc}.handoff strong{display:block;font-size:16px;margin-top:3px}.nextCard h3{font-size:18px;margin:8px 0}.nextTime{font-size:28px;letter-spacing:-.05em;margin:14px 0;color:#e3eee2}.nextMeta{font-size:10px;color:#78867d;line-height:1.55}.empty{border:1px dashed #304034;border-radius:16px;padding:18px;color:#839087;font-size:11px;line-height:1.6}.bar{padding:12px 18px;border-top:1px solid #1c2a20;background:#07100a;color:#829087;font-size:10px;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}.bar b{color:#d2ded4}@media(max-width:780px){.inner{grid-template-columns:1fr;padding:20px}.liveCard{min-height:175px}.bar{padding:12px 20px}}
    `}</style>
    <div className="inner">
      <div>
        <span className="eyebrow">THE MAIN 1MUSLIM CHANNEL</span>
        <h2 className="title">Live Now.</h2>
        <p className="copy">A continuous live channel built around scheduled pro streamers. Watch without an account. When a segment is nearing its cutoff, we warn everyone and hand the channel to the next streamer instead of dropping the room.</p>
        <div className="actions"><Link href="/streaming" className="primary">Watch Live Now →</Link><Link href="/streaming/scheduled" className="ghost">View Scheduled Lives</Link></div>
      </div>
      <div>
        {live ? <Link href={`/streaming/live/${live.id}`} className="liveCard" style={{textDecoration:"none",color:"inherit"}}>
          <span className="pill"><i className="dot"/> LIVE NOW</span>
          <div><h3>{live.title}</h3><div className="meta">{live.category} · <span className="viewers">{live.viewer_count} watching</span></div>
          {handoffSoon && <div className="handoff">This stream is about to switch.<strong>{handoffCountdown}</strong>Next streamer is preparing now.</div>}</div>
        </Link> : <div className="liveCard"><span className="pill">● LIVE NOW</span><div><h3>24/7 channel ready</h3><div className="meta">{loading?"Checking the channel…":"No streamer is on air right now."}</div></div></div>}
        {next && <div className="nextCard" style={{marginTop:10}}><span className="eyebrow">NEXT UP</span><h3>{next.title}</h3><div className="nextTime">{nextCountdown}</div><div className="nextMeta">{next.category} · starts {new Date(next.starts_at).toLocaleString([], {dateStyle:"medium",timeStyle:"short"})}<br/>The next streamer can enter early and wait in the room.</div></div>}
      </div>
    </div>
    <div className="bar"><span><b>Watching:</b> public · no account required</span><span><b>Interacting:</b> sign in required · Shahada verification for new accounts</span></div>
  </section>;
}
