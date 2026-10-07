"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../utils/supabase/client";
import LiveKitViewer from "../../components/LiveKitViewer";

type LiveRow = {
  id:string; title:string; category:string; viewer_count:number; started_at:string;
  scheduled_end_at:string|null; thumbnail_path:string|null; aspect_ratio?:string|null; room_name?:string;
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

export default function LiveNowFocus({ mode = "hero" }: { mode?: "hero" | "carousel" }){
  const supabase=useMemo(()=>createClient(),[]);
  const [lives,setLives]=useState<LiveRow[]>([]);
  const [hostMap,setHostMap]=useState<Record<string,{display_name:string|null;username:string|null;avatar_url:string|null;gender:string|null}>>({});
  const [live,setLive]=useState<LiveRow|null>(null);
  const [next,setNext]=useState<Slot|null>(null);
  const [now,setNow]=useState(Date.now());
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    const load=async()=>{
      const [{data:lives},{data:slots}]=await Promise.all([
        supabase.from("live_streams").select("id,title,category,viewer_count,started_at,scheduled_end_at,thumbnail_path,host_id,aspect_ratio,room_name").eq("status","live").gte("last_heartbeat_at",new Date(Date.now()-60_000).toISOString()).order("viewer_count",{ascending:false}).order("started_at",{ascending:false}).limit(20),
        supabase.from("live_schedule_slots").select("id,host_id,title,category,starts_at,ends_at,status,thumbnail_path").in("status",["scheduled","waiting","live"]).order("starts_at",{ascending:true}).limit(8)
      ]);
      const rows=(lives??[]) as (LiveRow & {host_id:string})[];
      setLives(rows);
      setLive((rows[0]??null) as LiveRow|null);
      const hostIds=Array.from(new Set(rows.map(row=>row.host_id).filter(Boolean)));
      if(hostIds.length){
        const {data:profiles}=await supabase.from("profiles").select("id,display_name,username,avatar_url,gender").in("id",hostIds);
        setHostMap(Object.fromEntries((profiles??[]).map(profile=>[profile.id,profile])));
      } else setHostMap({});
      const upcoming=(slots??[]).find((x:any)=>new Date(x.starts_at).getTime()>Date.now() || x.status==="waiting");
      setNext((upcoming??null) as Slot|null);
      setLoading(false);
    };
    void load();
    const refresh=window.setInterval(load,10000);
    const clock=window.setInterval(()=>setNow(Date.now()),1000);
    return()=>{window.clearInterval(refresh);window.clearInterval(clock)};
  },[supabase]);

  const rankedLives = lives.slice(0,5);
  const primary = rankedLives[0];

  const nextStarts=next?new Date(next.starts_at).getTime():0;
  const liveEnds=primary?.scheduled_end_at?new Date(primary.scheduled_end_at).getTime():0;
  const handoffSoon=!!liveEnds && liveEnds-now<=120000 && liveEnds-now>0;
  const nextCountdown=next?countdown(nextStarts-now):"";
  const handoffCountdown=liveEnds?countdown(liveEnds-now):"";
  const primaryHost = primary ? hostMap[(primary as LiveRow & {host_id:string}).host_id] : null;
  const primaryThumbnail = primary
    ? (primary.thumbnail_path ? supabase.storage.from("live-recordings").getPublicUrl(primary.thumbnail_path).data.publicUrl : primaryHost?.avatar_url || (primaryHost?.gender?.toLowerCase()==="female" ? "/assets/avatars/default-female.jpg" : "/assets/avatars/default-male.jpg"))
    : null;

  if(mode === "carousel"){
    return <section className="liveCarouselSection">
      <style jsx>{`
        .liveCarouselSection{margin:0 0 34px;padding:20px 0}
        .head{display:flex;justify-content:space-between;align-items:end;gap:16px;margin-bottom:12px}.eyebrow{font-size:10px;letter-spacing:.17em;color:#8da88f;font-weight:900}.head h2{font-size:25px;letter-spacing:-.055em;margin:5px 0}.count{font-size:10px;color:#718077}
        .rail{display:flex;gap:12px;overflow-x:auto;padding:3px 2px 10px;scroll-snap-type:x mandatory;scrollbar-width:none}.rail::-webkit-scrollbar{display:none}
        .card{flex:0 0 205px;scroll-snap-align:start;border:1px solid #26362b;border-radius:18px;overflow:hidden;background:#080e0a;text-decoration:none;color:inherit;box-shadow:0 12px 30px rgba(0,0,0,.12)}
        .thumb{height:120px;position:relative;background:linear-gradient(145deg,#172119,#070b08)}.thumb img{width:100%;height:100%;object-fit:cover;display:block}.live{position:absolute;top:8px;left:8px;background:#d8e9bd;color:#071008;border-radius:999px;padding:5px 7px;font-size:8px;font-weight:900}.rank{position:absolute;right:8px;top:8px;background:rgba(0,0,0,.72);color:#fff;border-radius:999px;padding:5px 7px;font-size:8px;font-weight:900}
        .body{padding:11px}.body h3{font-size:13px;line-height:1.2;margin:0 0 5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.topic{font-size:9px;color:#849188}.host{font-size:10px;color:#cbd8ce;margin-top:6px}.views{font-size:9px;color:#91a097;margin-top:4px}
        @media(max-width:780px){.card{flex-basis:190px}.head{padding:0 2px}}
      `}</style>
      <div className="head"><div><span className="eyebrow">OTHER LIVE NOW</span><h2>More Lives happening now.</h2></div><span className="count">{loading ? "Checking…" : lives.length + " live"}</span></div>
      {rankedLives.length ? <div className="rail">{rankedLives.map((stream,index)=>{
        const s=stream as LiveRow & {host_id:string}; const profile=hostMap[s.host_id];
        const thumbnail=stream.thumbnail_path ? supabase.storage.from("live-recordings").getPublicUrl(stream.thumbnail_path).data.publicUrl : profile?.avatar_url || (profile?.gender?.toLowerCase()==="female" ? "/assets/avatars/default-female.jpg" : "/assets/avatars/default-male.jpg");
        const name=profile?.display_name || (profile?.username ? "@"+profile.username : "1Muslim Host");
        return <Link href={`/streaming/live/${stream.id}`} className="card" key={stream.id}><div className="thumb"><img src={thumbnail} alt="" /><span className="live">● LIVE</span><span className="rank">#{index+1}</span></div><div className="body"><h3>{stream.title}</h3><div className="topic">{stream.category || "Community"}</div><div className="host">{name}</div><div className="views">👥 {stream.viewer_count ?? 0} watching</div></div></Link>;
      })}</div> : <div className="count">No other Lives are on right now.</div>}
    </section>;
  }

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
        {primary ? <div className="liveCard" style={{padding:0,overflow:"hidden"}}>
          <div style={{position:"relative"}}><LiveKitViewer roomName={primary.room_name ?? ""} streamId={primary.id} /></div>
          <Link href={`/streaming/live/${primary.id}`} style={{textDecoration:"none",color:"inherit",display:"block",padding:"14px 18px 18px"}}>
            <span className="pill"><i className="dot"/> #1 LIVE NOW</span>
            <div><h3>{primary.title}</h3><div className="meta">{primary.category} · <span className="viewers">{primary.viewer_count} watching</span></div>
            {handoffSoon && <div className="handoff">This stream is about to switch.<strong>{handoffCountdown}</strong>Next streamer is preparing now.</div>}</div>
          </Link>
        </div> : <div className="liveCard"><span className="pill">● LIVE NOW</span><div><h3>24/7 channel ready</h3><div className="meta">{loading?"Checking the channel…":"No streamer is on air right now."}</div></div></div>}
        {next && <div className="nextCard" style={{marginTop:10}}><span className="eyebrow">NEXT UP</span><h3>{next.title}</h3><div className="nextTime">{nextCountdown}</div><div className="nextMeta">{next.category} · starts {new Date(next.starts_at).toLocaleString([], {dateStyle:"medium",timeStyle:"short"})}<br/>The next streamer can enter early and wait in the room.</div></div>}
      </div>
    </div>
    <div className="bar"><span><b>Watching:</b> public · no account required</span><span><b>Interacting:</b> sign in required · Shahada verification for new accounts</span></div>
  </section>;
}
