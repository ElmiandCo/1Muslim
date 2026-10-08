"use client";

import SiteNav from "../../components/SiteNav";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "../../../utils/supabase/client";
import RecordingComments from "../../../components/RecordingComments";
import RecordingThumbnail from "../../../components/RecordingThumbnail";

type Recording = {
  id: string;
  title: string;
  category: string;
  video_path: string;
  mime_type: string;
  file_size: number;
  duration_seconds: number;
  views: number;
  likes: number;
  comments_count: number;
  created_at: string;
  stream_id?: string | null;
  thumbnail_path?: string | null;
  host_name?: string;
  host_avatar_url?: string | null;
};

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

const formatSize = (bytes: number) => {
  if (!bytes) return "0 MB";
  return `${(bytes / 1024 / 1024).toFixed(bytes > 10 * 1024 * 1024 ? 0 : 1)} MB`;
};

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(true);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState<Recording | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSignedIn(false);
        setLoading(false);
        return;
      }

      const { data, error: queryError } = await supabase
        .from("live_recordings")
        .select("id,title,category,video_path,mime_type,file_size,duration_seconds,views,likes,comments_count,created_at,thumbnail_path,user_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (queryError) setError(queryError.message);
      else {
        const rows = (data ?? []) as Recording[];
        const ids = rows.map(row => row.id);
        const hostIds = Array.from(new Set(rows.map(row => (row as Recording & {user_id:string}).user_id).filter(Boolean)));
        let streamMap: Record<string,string> = {};
        let profileMap: Record<string,{display_name:string|null;username:string|null;avatar_url:string|null}> = {};
        if (hostIds.length) {
          const { data: profiles } = await supabase.from("profiles").select("id,display_name,username,avatar_url").in("id",hostIds);
          profileMap = Object.fromEntries((profiles ?? []).map(profile => [profile.id,profile]));
        }
        if (ids.length) {
          const { data: streams } = await supabase.from("live_streams").select("id,recording_id").in("recording_id", ids);
          streamMap = Object.fromEntries((streams ?? []).filter(stream => stream.recording_id).map(stream => [stream.recording_id, stream.id]));
        }
        setRecordings(rows.map(row => {
          const profile = profileMap[(row as Recording & {user_id:string}).user_id];
          return {
            ...row,
            stream_id: streamMap[row.id] ?? null,
            host_name: profile?.display_name || profile?.username || "1Muslim Host",
            host_avatar_url: profile?.avatar_url ?? null,
          };
        }));
      }
      setLoading(false);
    };
    void load();
  }, []);

  const getUrl = (path: string) => {
    const supabase = createClient();
    return supabase.storage.from("live-recordings").getPublicUrl(path).data.publicUrl;
  };

  const deleteRecording = async (recording: Recording) => {
    if (!window.confirm(`Permanently delete "${recording.title}"? This cannot be undone.`)) return;
    setError("");
    try {
      const response = await fetch(`/api/recordings/${recording.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not delete recording");
      setRecordings(items => items.filter(item => item.id !== recording.id));
      if (playing?.id === recording.id) setPlaying(null);
      if (result.storageCleanupPending) setError("Recording deleted, but media cleanup needs administrator attention.");
    } catch (e) { setError(e instanceof Error ? e.message : "Deletion failed"); }
  };

  return (
    <main className="recordingsPage">
      <style jsx>{`
        .recordingsPage{min-height:100vh;background:var(--bg);color:var(--text)}
        .shell{max-width:1180px;margin:auto;padding:36px 20px 80px}
        .eyebrow{font-size:10px;letter-spacing:.16em;color:#829b87;font-weight:850}.heading{display:flex;justify-content:space-between;gap:20px;align-items:end;margin-bottom:24px}.heading h1{font-size:42px;letter-spacing:-.06em;margin:8px 0}.heading p{color:#849087;font-size:13px;margin:0;max-width:650px}.back{border:1px solid #29342d;background:#0d140f;color:#dce5de;border-radius:999px;padding:10px 14px;text-decoration:none;font-size:11px;white-space:nowrap}
        .summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px}.stat{border:1px solid #1b241f;background:#0a100c;border-radius:16px;padding:16px}.stat strong{font-size:21px;display:block}.stat span{font-size:9px;color:#68756d;text-transform:uppercase;letter-spacing:.1em}
        .error,.empty,.signin{border:1px solid #29342d;background:#0a100c;border-radius:18px;padding:24px}.error{color:#ffcaca;border-color:#533536;background:#1b0f10}.signin{text-align:center;padding:70px 20px}.signin h2{margin:0 0 8px}.signin p,.empty p{color:#7f8a83;font-size:12px}.signin a{display:inline-flex;margin-top:14px;background:#d6e7b8;color:#071008;border-radius:999px;padding:11px 16px;text-decoration:none;font-size:11px;font-weight:800}
        .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.card{border:1px solid #1b241f;background:#0a100c;border-radius:18px;overflow:hidden}.thumb{height:180px;background:radial-gradient(circle at 65% 30%,rgba(214,231,184,.16),transparent 28%),linear-gradient(145deg,#172119,#070b08);position:relative}.thumb video{width:100%;height:100%;object-fit:cover;display:block}.play{position:absolute;inset:0;display:grid;place-items:center;background:linear-gradient(transparent,rgba(0,0,0,.3));font-size:34px}.duration{position:absolute;right:9px;bottom:9px;background:rgba(0,0,0,.72);padding:5px 7px;border-radius:6px;font-size:9px}.body{padding:14px}.meta{font-size:9px;color:#76917b;letter-spacing:.1em;text-transform:uppercase}.body h3{font-size:15px;line-height:1.25;margin:7px 0}.details{display:flex;gap:10px;color:#68756d;font-size:9px;margin:10px 0 13px}.actions{display:flex;gap:7px}.action{flex:1;border:1px solid #2d3931;background:#101812;color:#dce8db;border-radius:10px;padding:9px;font-size:10px;font-weight:750;cursor:pointer;text-align:center;text-decoration:none}.danger{color:#ffbcbc;border-color:#4b3030}.playerOverlay{position:fixed;inset:0;background:rgba(0,0,0,.8);backdrop-filter:blur(10px);z-index:100;display:grid;place-items:center;padding:18px}.player{width:min(950px,100%);background:#080d09;border:1px solid #29352d;border-radius:20px;overflow:hidden}.player video{display:block;width:100%;max-height:78vh;background:#000}.playerBar{padding:14px 16px;display:flex;justify-content:space-between;gap:10px;align-items:center}.playerBar strong{font-size:13px}.close{width:34px;height:34px;border-radius:50%;border:1px solid #303b33;background:#0f1511;color:#fff;cursor:pointer}
        @media(max-width:850px){.grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.shell{padding:25px 13px 60px}.heading{align-items:flex-start;flex-direction:column}.heading h1{font-size:36px}.summary{grid-template-columns:1fr}.grid{grid-template-columns:1fr}.thumb{height:200px}}
      `}</style>
      <SiteNav />
      <div className="shell">
        <div className="heading">
          <div><span className="eyebrow">CREATOR STUDIO</span><h1>Live Recordings</h1><p>Your personal archive of sessions recorded in 1Muslim Live Studio.</p></div>
          <Link href="/streaming/go-live" className="back">＋ New Live</Link>
        </div>

        {!signedIn ? <div className="signin"><h2>Sign in to see your recordings</h2><p>Your Live Studio archive is tied to your 1Muslim account.</p><Link href="/auth">Sign in</Link></div>
        : loading ? <div className="empty"><strong>Loading your recordings…</strong></div>
        : error ? <div className="error">{error}</div>
        : <>
          <div className="summary"><div className="stat"><strong>{recordings.length}</strong><span>Saved Lives</span></div><div className="stat"><strong>{recordings.reduce((sum,r)=>sum+r.views,0)}</strong><span>Total Views</span></div><div className="stat"><strong>{formatSize(recordings.reduce((sum,r)=>sum+r.file_size,0))}</strong><span>Video Storage</span></div></div>
          {recordings.length === 0 ? <div className="empty"><strong>No recordings yet.</strong><p>Start a Live session and press “End live & save” when you are finished.</p><Link href="/streaming/go-live" className="back">Open Live Studio →</Link></div> :
          <div className="grid">{recordings.map(recording => {
            const url = getUrl(recording.video_path);
            return <article className="card" key={recording.id}>
              <div className="thumb"><RecordingThumbnail title={recording.title} hostName={recording.host_name || "1Muslim Host"} date={new Date(recording.created_at).toLocaleString([], {dateStyle:"medium",timeStyle:"short"})} durationSeconds={recording.duration_seconds} photoUrl={recording.host_avatar_url} customThumbnailUrl={recording.thumbnail_path ? getUrl(recording.thumbnail_path) : null} /><button className="play" onClick={()=>setPlaying(recording)} aria-label={`Play ${recording.title}`}>▶</button></div>
              <div className="body"><span className="meta">{recording.category} · {new Date(recording.created_at).toLocaleDateString()}</span><h3>{recording.title}</h3><div className="details"><span>👁 {recording.views}</span><span>♥ {recording.likes}</span><span>{formatSize(recording.file_size)}</span></div><div className="actions">{recording.stream_id ? <Link className="action" href={`/streaming/live/${recording.stream_id}`}>Watch & comment</Link> : <button className="action" onClick={()=>setPlaying(recording)}>Watch</button>}<button className="action danger" onClick={()=>void deleteRecording(recording)}>Delete</button></div></div>
            </article>
          })}</div>}
        </>}
      </div>

      {playing && <div className="playerOverlay" onClick={()=>setPlaying(null)}><div className="player" onClick={e=>e.stopPropagation()}><video src={getUrl(playing.video_path)} controls autoPlay playsInline /><div className="playerBar"><strong>{playing.title}</strong><button className="close" onClick={()=>setPlaying(null)}>×</button></div><div style={{padding:"0 16px 16px"}}><RecordingComments recordingId={playing.id} /></div></div></div>}
    </main>
  );
}
