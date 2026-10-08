"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "../../../utils/supabase/client";

type ChannelVideo = {
  id: string;
  title: string;
  description: string;
  category: string;
  storage_path: string;
  mime_type: string;
  duration_seconds: number;
  position: number;
  is_active: boolean;
  created_at: string;
};

export default function AdminChannelVideosPage() {
  const supabase = useMemo(() => createClient(), []);
  const [videos, setVideos] = useState<ChannelVideo[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Qur'an");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("admin_videos")
      .select("id,title,description,category,storage_path,mime_type,duration_seconds,position,is_active,created_at")
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) setMessage(error.message);
    setVideos((data ?? []) as ChannelVideo[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const upload = async () => {
    setMessage("");
    if (!file || !title.trim()) {
      setMessage("Choose a video and give it a title.");
      return;
    }
    if (!file.type.startsWith("video/")) {
      setMessage("Please select a video file.");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be signed in as an admin.");

      const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
      const safe = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "video";
      const storagePath = `channel/${Date.now()}-${safe}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("admin-videos")
        .upload(storagePath, file, { contentType: file.type, cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;

      const nextPosition = videos.length ? Math.max(...videos.map(v => v.position)) + 1 : 1;
      const { error: rowError } = await supabase.from("admin_videos").insert({
        title: title.trim(),
        description: description.trim(),
        category,
        storage_path: storagePath,
        mime_type: file.type,
        duration_seconds: 0,
        position: nextPosition,
        is_active: true,
        created_by: user.id,
      });
      if (rowError) {
        await supabase.storage.from("admin-videos").remove([storagePath]);
        throw rowError;
      }

      setTitle("");
      setDescription("");
      setCategory("Qur'an");
      setFile(null);
      const input = document.getElementById("channel-video-file") as HTMLInputElement | null;
      if (input) input.value = "";
      setMessage("Video added to the guaranteed 1Muslim channel lineup.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const toggle = async (video: ChannelVideo) => {
    const { error } = await supabase.from("admin_videos").update({ is_active: !video.is_active }).eq("id", video.id);
    if (error) setMessage(error.message);
    else await load();
  };

  const remove = async (video: ChannelVideo) => {
    if (!window.confirm(`Remove "${video.title}" from the channel?`)) return;
    const { error } = await supabase.from("admin_videos").delete().eq("id", video.id);
    if (error) { setMessage(error.message); return; }
    await supabase.storage.from("admin-videos").remove([video.storage_path]);
    await load();
  };

  return (
    <main style={{ minHeight: "100vh", padding: "34px 20px 70px", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ marginBottom: 26 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", marginBottom: 10 }}><div style={{ fontSize: 10, letterSpacing: ".16em", fontWeight: 900, color: "#8da88f" }}>1MUSLIM CHANNEL CONTROL</div><Link href="/admin/live" style={{ border: "1px solid #4b3030", borderRadius: 999, background: "#180e0f", color: "#ffcaca", padding: "8px 12px", textDecoration: "none", fontSize: 10, fontWeight: 900 }}>🛡 Live Moderation</Link></div>
        <h1 style={{ fontSize: "clamp(32px,5vw,52px)", letterSpacing: "-.06em", margin: "8px 0" }}>Guaranteed Videos</h1><Link href="/admin/verse-media" style={{display:"inline-block",padding:"9px 14px",borderRadius:999,border:"1px solid #a99155",color:"#d9c087",textDecoration:"none",fontSize:12,marginBottom:12}}>🏕️ Manage Qur’an Verse Media →</Link>
        <p style={{ color: "#8f9d94", maxWidth: 680, lineHeight: 1.6, fontSize: 13 }}>
          Upload videos that can appear in the Home Live channel rotation. These are curated 1Muslim videos, not advertisements.
        </p>
      </div>

      <section style={{ border: "1px solid #26362b", borderRadius: 22, padding: 20, background: "#080e0a", marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, margin: "0 0 15px" }}>Add a channel video</h2>
        <div style={{ display: "grid", gap: 12 }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Video title" style={fieldStyle} />
          <select value={category} onChange={e => setCategory(e.target.value)} style={fieldStyle}>
            <option>Qur'an</option><option>Hadith</option><option>Lesson</option><option>Reminder</option><option>Community</option><option>Other</option>
          </select>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description (optional)" rows={3} style={fieldStyle} />
          <input id="channel-video-file" type="file" accept="video/mp4,video/webm,video/quicktime,video/x-m4v" onChange={e => setFile(e.target.files?.[0] ?? null)} style={{ color: "#b8c8bb" }} />
          {file && <div style={{ fontSize: 11, color: "#8f9d94" }}>{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</div>}
          <button type="button" onClick={upload} disabled={uploading} style={buttonStyle}>
            {uploading ? "Uploading…" : "Upload & Add to Channel"}
          </button>
          {message && <div style={{ fontSize: 11, color: "#b9d8bd" }}>{message}</div>}
        </div>
      </section>

      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, margin: 0 }}>Channel lineup <span style={{ color: "#75847a", fontSize: 11 }}>({videos.length}/30+)</span></h2>
          <span style={{ color: "#75847a", fontSize: 10 }}>Position controls playback order</span>
        </div>
        {loading ? <div style={emptyStyle}>Loading…</div> : videos.length === 0 ? <div style={emptyStyle}>No curated videos yet. Upload your first one above.</div> : (
          <div style={{ display: "grid", gap: 10 }}>
            {videos.map((video, index) => {
              const url = supabase.storage.from("admin-videos").getPublicUrl(video.storage_path).data.publicUrl;
              return (
                <div key={video.id} style={{ border: "1px solid #26362b", borderRadius: 16, padding: 13, background: "#080e0a", display: "grid", gridTemplateColumns: "82px 1fr auto", gap: 13, alignItems: "center" }}>
                  <video src={url} muted preload="metadata" style={{ width: 82, height: 54, objectFit: "cover", borderRadius: 9, background: "#030503" }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 13 }}>{index + 1}. {video.title}</div>
                    <div style={{ color: "#75847a", fontSize: 10, marginTop: 4 }}>{video.category} · {video.is_active ? "In rotation" : "Paused"}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button type="button" onClick={() => toggle(video)} style={smallButton}>{video.is_active ? "Pause" : "Activate"}</button>
                    <button type="button" onClick={() => remove(video)} style={{ ...smallButton, color: "#ffb0b0" }}>Remove</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

const fieldStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid #26362b", borderRadius: 12, background: "#0b120d", color: "#dce8dc", padding: "11px 12px", fontSize: 12, outline: "none" };
const buttonStyle: React.CSSProperties = { border: 0, borderRadius: 999, background: "#d8e9bd", color: "#071008", padding: "12px 17px", fontSize: 11, fontWeight: 900, cursor: "pointer" };
const smallButton: React.CSSProperties = { border: "1px solid #304034", borderRadius: 999, background: "#0b120d", color: "#dce8dc", padding: "7px 10px", fontSize: 9, fontWeight: 800, cursor: "pointer" };
const emptyStyle: React.CSSProperties = { border: "1px dashed #304034", borderRadius: 16, padding: 20, color: "#839087", fontSize: 11 };
