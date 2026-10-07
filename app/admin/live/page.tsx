"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../../utils/supabase/client";
import SiteNav from "../../components/SiteNav";

type LiveStream = { id:string; host_id:string; title:string; category:string; room_name:string; status:string; viewer_count:number; started_at:string; thumbnail_path:string|null };
type Recording = { id:string; user_id:string; title:string; category:string; video_path:string; thumbnail_path:string|null; mime_type:string; file_size:number; duration_seconds:number; views:number; created_at:string };
type Profile = { display_name:string|null; username:string|null; avatar_url:string|null };

export default function AdminLiveModerationPage() {
  const supabase=useMemo(()=>createClient(),[]);
  const [live,setLive]=useState<LiveStream[]>([]),[recordings,setRecordings]=useState<Recording[]>([]),[profiles,setProfiles]=useState<Record<string,Profile>>({});
  const [loading,setLoading]=useState(true),[working,setWorking]=useState<string|null>(null),[message,setMessage]=useState("");
  const load=async()=>{
    setLoading(true); setMessage("");
    const [{data:liveRows,error:le},{data:recordingRows,error:re}]=await Promise.all([
      supabase.from("live_streams").select("id,host_id,title,category,room_name,status,viewer_count,started_at,thumbnail_path").eq("status","live").order("started_at",{ascending:false}),
      supabase.from("live_recordings").select("id,user_id,title,category,video_path,thumbnail_path,mime_type,file_size,duration_seconds,views,created_at").order("created_at",{ascending:false})
    ]);
    if(le)setMessage(le.message); if(re)setMessage(re.message);
    const ls=(liveRows??[]) as LiveStream[], rs=(recordingRows??[]) as Recording[]; setLive(ls); setRecordings(rs);
    const ids=Array.from(new Set([...ls.map(x=>x.host_id),...rs.map(x=>x.user_id)]));
    if(ids.length){const {data:people}=await supabase.from("profiles").select("id,display_name,username,avatar_url").in("id",ids);setProfiles(Object.fromEntries((people??[]).map((p:any)=>[p.id,p])))} else setProfiles({});
    setLoading(false);
  };
  useEffect(()=>{void load()},[]);
  const hostName=(id:string)=>profiles[id]?.display_name||profiles[id]?.username||"1Muslim Host";
  const size=(bytes:number)=>((bytes/1024/1024).toFixed(bytes>10*1024*1024?0:1))+" MB";
  const shutdownLive=async(stream:LiveStream)=>{
    if(!window.confirm("Shut down \""+stream.title+"\" immediately? Viewers will be disconnected."))return;
    setWorking(stream.id);setMessage("");
    try{const response=await fetch("/api/admin/live/shutdown",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({streamId:stream.id})});const data=await response.json();if(!response.ok)throw new Error(data.error||"Shutdown failed.");await load()}catch(error){setMessage(error instanceof Error?error.message:"Shutdown failed.")}finally{setWorking(null)}
  };
  const removeRecording=async(recording:Recording)=>{
    if(!window.confirm("Permanently remove \""+recording.title+"\"? This cannot be undone."))return;
    setWorking(recording.id);setMessage("");
    try{
      const {error:detachError}=await supabase.from("live_streams").update({recording_id:null}).eq("recording_id",recording.id);if(detachError)throw detachError;
      const files=[recording.video_path,...(recording.thumbnail_path?[recording.thumbnail_path]:[])];
      const {error:storageError}=await supabase.storage.from("live-recordings").remove(files);if(storageError)throw storageError;
      const {error:rowError}=await supabase.from("live_recordings").delete().eq("id",recording.id);if(rowError)throw rowError;
      const {data:{user}}=await supabase.auth.getUser();if(user)await supabase.from("live_moderation_actions").insert({admin_id:user.id,recording_id:recording.id,action:"remove_recording"});
      await load();
    }catch(error){setMessage(error instanceof Error?error.message:"Recording removal failed.")}finally{setWorking(null)}
  };
  return <main className="adminModeration"><style jsx>{`
    .adminModeration{min-height:100vh;background:var(--bg);color:var(--text)}.shell{max-width:1180px;margin:auto;padding:34px 18px 80px}.eyebrow{font-size:10px;letter-spacing:.16em;color:#829b87;font-weight:900}h1{font-size:44px;letter-spacing:-.06em;margin:8px 0}.intro{color:#849087;font-size:13px;line-height:1.6;max-width:700px}.top{display:flex;justify-content:space-between;gap:18px;align-items:flex-end;margin-bottom:28px}.back{border:1px solid #29342d;background:#0d140f;color:#dce5de;border-radius:999px;padding:10px 14px;text-decoration:none;font-size:11px}.section{margin-top:28px}.sectionHead{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.section h2{font-size:19px;margin:0}.count{font-size:10px;color:#718078}.grid{display:grid;gap:10px}.card{border:1px solid #202b24;background:#090f0b;border-radius:18px;padding:14px;display:grid;grid-template-columns:92px 1fr auto;gap:14px;align-items:center}.thumb{width:92px;height:62px;border-radius:10px;object-fit:cover;background:#050805}.title{font-weight:850;font-size:13px}.meta{font-size:9px;color:#718078;margin-top:5px}.danger{border:1px solid #5a3032;background:#1d0f10;color:#ffcaca;border-radius:999px;padding:9px 12px;font-size:10px;font-weight:900;cursor:pointer;white-space:nowrap}.danger:disabled{opacity:.55;cursor:wait}.liveBadge{display:inline-flex;padding:4px 7px;border-radius:999px;background:#351313;color:#ffd0d0;font-size:8px;font-weight:900;margin-right:7px}.empty,.error{border:1px dashed #29352d;border-radius:16px;padding:22px;color:#7e8982;font-size:11px}.error{border-style:solid;border-color:#5a3032;background:#190e0f;color:#ffcaca}@media(max-width:650px){.top{align-items:flex-start;flex-direction:column}h1{font-size:36px}.card{grid-template-columns:68px 1fr}.thumb{width:68px;height:50px}.danger{grid-column:1 / -1;width:100%}}`}</style>
    <SiteNav/><div className="shell"><div className="top"><div><span className="eyebrow">1MUSLIM ADMIN · MODERATION</span><h1>Live & Recordings</h1><p className="intro">Emergency controls for active broadcasts and permanent removal of recorded Lives. These controls are available only to 1Muslim admins.</p></div><Link className="back" href="/admin/videos">Channel Videos →</Link></div>
    {message&&<div className="error">{message}</div>}
    <section className="section"><div className="sectionHead"><h2>🔴 Live Now</h2><span className="count">{live.length} active</span></div>{loading?<div className="empty">Loading active broadcasts…</div>:live.length===0?<div className="empty">No Lives are currently active.</div>:<div className="grid">{live.map(stream=><article className="card" key={stream.id}>{stream.thumbnail_path?<img className="thumb" src={supabase.storage.from("live-recordings").getPublicUrl(stream.thumbnail_path).data.publicUrl} alt=""/>:<div className="thumb"/>}<div><div className="title"><span className="liveBadge">● LIVE</span>{stream.title}</div><div className="meta">{hostName(stream.host_id)} · {stream.category} · {stream.viewer_count} watching · started {new Date(stream.started_at).toLocaleString()}</div></div><button className="danger" disabled={working===stream.id} onClick={()=>void shutdownLive(stream)}>{working===stream.id?"Shutting down…":"🛑 Shut Down Live"}</button></article>)}</div>}</section>
    <section className="section"><div className="sectionHead"><h2>🎥 Live Recordings</h2><span className="count">{recordings.length} total</span></div>{loading?<div className="empty">Loading recordings…</div>:recordings.length===0?<div className="empty">No saved Live recordings.</div>:<div className="grid">{recordings.map(recording=><article className="card" key={recording.id}>{recording.thumbnail_path?<img className="thumb" src={supabase.storage.from("live-recordings").getPublicUrl(recording.thumbnail_path).data.publicUrl} alt=""/>:<div className="thumb"/>}<div><div className="title">{recording.title}</div><div className="meta">{hostName(recording.user_id)} · {recording.category} · {size(recording.file_size)} · {recording.views} views · {new Date(recording.created_at).toLocaleString()}</div></div><button className="danger" disabled={working===recording.id} onClick={()=>void removeRecording(recording)}>{working===recording.id?"Removing…":"🗑 Remove Recording"}</button></article>)}</div>}</section>
    </div></main>;
}