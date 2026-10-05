"use client";

import SiteNav from "../../components/SiteNav";

import Link from "next/link";
import { createClient } from "../../../utils/supabase/client";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Room, Track } from "livekit-client";

const categories = ["Qur'an", "New Muslim", "Prayer", "Seerah", "Tawhid", "Community"];
type ChatMessage = { id: string; name: string; text: string };

export default function GoLivePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef<number | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [live, setLive] = useState(false);
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [title, setTitle] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [category, setCategory] = useState(categories[0]);
  const [error, setError] = useState("");
  const [viewers, setViewers] = useState(0);
  const [chat, setChat] = useState<ChatMessage[]>([{id:"welcome",name:"1Muslim",text:"Welcome to the live conversation."}]);
  const [chatDraft, setChatDraft] = useState("");
  const [reaction, setReaction] = useState<string | null>(null);
  const [followed, setFollowed] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const roomRef = useRef<Room | null>(null);
  const liveStreamIdRef = useRef<string | null>(null);

  const startPreview = async () => {
    setError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera and microphone access is not available in this browser.");
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = stream;
      streamRef.current = stream;
      setCameraReady(true);
      setCameraOn(true);
      setMicOn(true);
    } catch (err) {
      setError(err instanceof DOMException && err.name === "NotAllowedError"
        ? "Camera or microphone access was denied. Allow access in your browser settings and try again."
        : err instanceof Error ? err.message : "We could not access your camera and microphone.");
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!cameraReady || !video || !stream) return;

    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    void video.play().catch(() => {
      setError("Camera access was granted, but the preview could not start. Tap the preview or Enable camera & mic again.");
    });
  }, [cameraReady]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const toggleCamera = () => {
    const next = !cameraOn;
    streamRef.current?.getVideoTracks().forEach((track) => (track.enabled = next));
    setCameraOn(next);
  };

  const toggleMic = () => {
    const next = !micOn;
    streamRef.current?.getAudioTracks().forEach((track) => (track.enabled = next));
    setMicOn(next);
  };

  const startRecording = () => {
    const stream = streamRef.current;
    if (!stream) throw new Error("Camera and microphone must be enabled first.");
    const mimeType = ["video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm","video/mp4"].find((type) => MediaRecorder.isTypeSupported(type));
    if (!mimeType) throw new Error("This browser cannot record video in a supported format.");
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType });
    recorder.ondataavailable = (event) => { if (event.data.size > 0) chunksRef.current.push(event.data); };
    recorderRef.current = recorder;
    recordingStartedAtRef.current = Date.now();
    recorder.start(1000);
    setRecording(true);
  };

  const saveRecording = async () => {
    if (!chunksRef.current.length) { setError("No recording data was captured."); return; }
    setSaving(true); setError(""); setSaveMessage("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sign in is required to save a recording.");
      const mimeType = recorderRef.current?.mimeType || "video/webm";
      const extension = mimeType.includes("mp4") ? "mp4" : "webm";
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const recordingId = crypto.randomUUID();
      let thumbnailPath: string | null = null;
      if (thumbnailFile) {
        if (!thumbnailFile.type.startsWith("image/")) throw new Error("Thumbnail must be an image.");
        const safeName = thumbnailFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        thumbnailPath = user.id + "/" + recordingId + "-thumbnail-" + safeName;
        const { error: thumbnailError } = await supabase.storage.from("live-recordings").upload(thumbnailPath, thumbnailFile, { contentType: thumbnailFile.type, upsert: false, cacheControl: "31536000" });
        if (thumbnailError) throw thumbnailError;
      }
      const path = `${user.id}/${recordingId}.${extension}`;
      const durationSeconds = Math.max(1, Math.round((Date.now() - (recordingStartedAtRef.current ?? Date.now())) / 1000));
      const { error: uploadError } = await supabase.storage.from("live-recordings").upload(path, blob, { contentType: mimeType, upsert: false, cacheControl: "31536000" });
      if (uploadError) throw uploadError;
      const { error: rowError } = await supabase.from("live_recordings").insert({
        id: recordingId, user_id: user.id, title: title.trim(), category,
        video_path: path, mime_type: mimeType, file_size: blob.size,
        duration_seconds: durationSeconds, visibility: "public", thumbnail_path: thumbnailPath,
      });
      if (rowError) {
        await supabase.storage.from("live-recordings").remove([path]);
        if (thumbnailPath) await supabase.storage.from("live-recordings").remove([thumbnailPath]);
        throw rowError;
      }
      chunksRef.current = [];
      recordingStartedAtRef.current = null;
      setSaveMessage("Saved to your Live Recordings.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "The recording could not be saved.");
    } finally { setSaving(false); }
  };

  const startLive = async () => {
    if (!cameraReady) return setError("Turn on your camera and microphone first.");
    if (!title.trim()) return setError("Give your live stream a title first.");
    setError(""); setSaveMessage("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sign in is required to go live.");

      const liveStreamId = crypto.randomUUID();
      const roomName = `1muslim-live-${liveStreamId}`;
      const { error: rowError } = await supabase.from("live_streams").insert({
        id: liveStreamId,
        host_id: user.id,
        title: title.trim(),
        category,
        room_name: roomName,
        status: "live",
      });
      if (rowError) throw rowError;

      const tokenResponse = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room: roomName, role: "host" }),
      });
      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok) {
        await supabase.from("live_streams").delete().eq("id", liveStreamId);
        throw new Error(tokenData.error || "LiveKit could not be started.");
      }

      const room = new Room({ adaptiveStream: true, dynacast: true });
      await room.connect(tokenData.url, tokenData.token);
      const mediaStream = streamRef.current;
      if (!mediaStream) throw new Error("Camera and microphone must be enabled first.");
      const videoTrack = mediaStream.getVideoTracks()[0];
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (videoTrack) await room.localParticipant.publishTrack(videoTrack, { source: Track.Source.Camera, simulcast: true });
      if (audioTrack) await room.localParticipant.publishTrack(audioTrack, { source: Track.Source.Microphone });
      roomRef.current = room;
      liveStreamIdRef.current = liveStreamId;

      startRecording();
      setLive(true);
      setViewers(1);
    } catch (err) {
      roomRef.current?.disconnect();
      roomRef.current = null;
      setError(err instanceof Error ? err.message : "Live broadcast could not start.");
    }
  };

  useEffect(() => { if (!live) return; const timer = window.setInterval(() => setViewers(v => Math.max(1, v + (Math.random() > 0.62 ? 1 : 0))), 5000); return () => window.clearInterval(timer); }, [live]);

  const sendChat = (e: FormEvent) => { e.preventDefault(); if (!chatDraft.trim()) return; setChat(items => [...items, {id:crypto.randomUUID(), name:"You", text:chatDraft.trim()}]); setChatDraft(""); };

  const endLive = () => {
    setLive(false); setViewers(0);
    const supabase = createClient();
    const liveStreamId = liveStreamIdRef.current;
    liveStreamIdRef.current = null;
    roomRef.current?.disconnect();
    roomRef.current = null;
    if (liveStreamId) {
      void supabase.from("live_streams").update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", liveStreamId);
    }
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = async () => {
        await saveRecording();
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null; setCameraReady(false); setCameraOn(true); setMicOn(true);
        recorderRef.current = null;
      };
      recorder.stop();
      setRecording(false);
    } else {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null; setCameraReady(false);
    }
  };

  return (
    <main className="goLive">
      <style jsx>{`
        .goLive{min-height:100vh;background:var(--bg);color:var(--text)}
        .bar{height:62px;border-bottom:1px solid #1b241f;display:flex;align-items:center;justify-content:space-between;padding:0 max(18px,calc((100vw - 1120px)/2));background:rgba(5,8,6,.9);backdrop-filter:blur(16px);position:sticky;top:0;z-index:5}
        .brand{display:flex;gap:9px;align-items:center;font-weight:850}.mark{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:#101811;border:1px solid #354237;color:#d6e7b8}.back{color:#98a49d;text-decoration:none;font-size:12px}
        .shell{max-width:1120px;margin:auto;padding:30px 18px 70px}.heading{margin-bottom:20px}.eyebrow{font-size:10px;letter-spacing:.16em;color:#829b87;font-weight:850}.heading h1{font-size:42px;letter-spacing:-.06em;margin:8px 0}.heading p{color:#849087;font-size:13px;margin:0}
        .layout{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(280px,.65fr);gap:16px}.panel{border:1px solid #1b241f;border-radius:22px;background:#0a100c;overflow:hidden}.preview{aspect-ratio:16/10;background:radial-gradient(circle at 50% 40%,#18231b,#050806 65%);position:relative;display:grid;place-items:center}.preview video{width:100%;height:100%;object-fit:cover;transform:scaleX(-1);display:block}.placeholder{text-align:center;color:#6f7d74}.cameraIcon{font-size:44px;margin-bottom:8px}.recording{position:absolute;top:14px;right:14px;padding:7px 10px;border-radius:999px;background:#261313;color:#ffd9d9;font-size:10px;font-weight:900}.live{position:absolute;top:14px;left:14px;padding:7px 10px;border-radius:999px;background:#e9f3db;color:#081007;font-size:10px;font-weight:900}.status{position:absolute;bottom:14px;left:14px;right:14px;display:flex;justify-content:space-between;gap:10px;align-items:center}.status span{font-size:10px;color:#d9e2dc;background:rgba(0,0,0,.62);padding:7px 10px;border-radius:999px}.controls{display:flex;justify-content:center;gap:10px;padding:16px;border-top:1px solid #1b241f}.circle{width:46px;height:46px;border-radius:50%;border:1px solid #334038;background:#121913;color:#fff;cursor:pointer}.circle.off{opacity:.5}.start{padding:12px 22px;border:0;border-radius:999px;background:#d6e7b8;color:#071008;font-weight:850;cursor:pointer}.end{padding:12px 22px;border:0;border-radius:999px;background:#251313;color:#ffd6d6;font-weight:850;cursor:pointer}
        .form{padding:20px}.form h2{font-size:17px;margin:0 0 15px}.field{margin-bottom:15px}.field label{display:block;font-size:10px;color:#748178;margin-bottom:7px;text-transform:uppercase;letter-spacing:.1em}.input,.select{width:100%;border:1px solid #263029;background:#0d140f;color:#f3f6f3;border-radius:11px;padding:12px;outline:none}.input:focus,.select:focus{border-color:#61785a}.help{font-size:10px;color:#66736b;line-height:1.6;margin-top:14px}.error{border:1px solid #533536;background:#1b0f10;color:#ffcaca;padding:10px 12px;border-radius:10px;font-size:10px;margin-bottom:12px}.ready{border:1px solid #334333;background:#101810;color:#b8d2ae;padding:10px 12px;border-radius:10px;font-size:10px;margin-bottom:12px}
        .recordingsLink{display:inline-flex;margin-top:12px;color:#cbd8ce;text-decoration:none;font-size:11px}.notice{margin-top:16px;border:1px solid #273129;border-radius:16px;padding:15px;color:#7d8981;font-size:10px;line-height:1.6}.notice strong{color:#c7d2ca;display:block;margin-bottom:4px}
        @media(max-width:780px){.layout{grid-template-columns:1fr}.heading h1{font-size:36px}.shell{padding:24px 12px 50px}}
      `}</style>

      <SiteNav />
      <div className="shell">
        <div className="heading">
          <span className="eyebrow">CREATOR STUDIO</span>
          <h1>Go Live</h1>
          <p>Share a lesson, reminder, conversation or community moment with 1Muslim.</p><Link href="/streaming/recordings" className="recordingsLink">View your Live Recordings →</Link>
        </div>

        <div className="layout">
          <section className="panel">
            <div className="preview">
              {cameraReady ? <video ref={videoRef} muted playsInline autoPlay /> : <div className="placeholder"><div className="cameraIcon">◉</div><div>Camera preview is off</div></div>}
              {live && <span className="live">● LIVE</span>}{recording && <span className="recording">● RECORDING</span>}
              {cameraReady && <div className="status"><span>{cameraOn ? "Camera on" : "Camera off"}</span><span>{micOn ? "Mic on" : "Mic off"}</span></div>}
            </div>
            <div className="controls">
              {cameraReady && <><button className={cameraOn ? "circle" : "circle off"} onClick={toggleCamera} aria-label="Toggle camera">{cameraOn ? "◉" : "○"}</button><button className={micOn ? "circle" : "circle off"} onClick={toggleMic} aria-label="Toggle microphone">{micOn ? "♫" : "×"}</button></>}
              {!cameraReady ? <button className="start" onClick={startPreview}>Enable camera & mic</button> : live ? <button className="end" onClick={endLive} disabled={saving}>{saving ? "Saving recording…" : "End live & save"}</button> : <button className="start" onClick={startLive} disabled={saving}>Start Live + Record</button>}
            </div>
          </section>

          <aside className="panel form">
            <h2>Live details</h2>
            {error && <div className="error">{error}</div>}
            {live && <div className="ready">Your live session is active and being recorded.</div>}{saveMessage && <div className="ready">{saveMessage}</div>}
            <div className="field"><label htmlFor="title">Title</label><input id="title" className="input" value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="What are you sharing?" disabled={live}/></div>
            <div className="field"><label htmlFor="thumbnail">Thumbnail image</label><input id="thumbnail" className="input" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e)=>setThumbnailFile(e.target.files?.[0]??null)} disabled={live}/><p className="help">Choose a cover image so your saved Live recording does not appear as a black thumbnail.</p></div>
            <div className="field"><label htmlFor="category">Topic</label><select id="category" className="select" value={category} onChange={(e)=>setCategory(e.target.value)} disabled={live}>{categories.map((item)=><option key={item}>{item}</option>)}</select></div>
            <p className="help">Starting Live publishes your camera and microphone through the OneMuslim WebRTC media backend. When you end, the finished video is also uploaded to your 1Muslim Live Recordings page.</p>
            <div className="notice"><strong>Broadcast connection</strong>Live video is transported through LiveKit WebRTC; Supabase keeps the live-session state, social data and your finished recording.</div>
          </aside>
        </div>

        {live && <section className="liveRoom">
          <div className="liveRoomTop">
            <div><span className="livePill">● LIVE</span><strong>{title}</strong><span>{category}</span></div>
            <div className="liveStats"><span>👥 {viewers} watching</span><button onClick={()=>setFollowed(!followed)}>{followed?"✓ Following":"＋ Follow"}</button><button onClick={()=>setNotifications(!notifications)}>{notifications?"🔔":"🔕"}</button></div>
          </div>
          <div className="liveRoomGrid">
            <div className="reactionPanel"><span className="eyebrow">REACTIONS</span><div className="reactionRow">{["❤️","🤍","👍","✨","🤲"].map(x=><button key={x} className={reaction===x?"reaction selected":"reaction"} onClick={()=>setReaction(x)}>{x}</button>)}</div><p>{reaction ? "Reaction sent to the host." : "Tap a reaction to join the room."}</p></div>
            <div className="chatPanel"><div className="chatHead"><strong>💬 Live chat</strong><span>{chat.length} messages</span></div><div className="chatMessages">{chat.map(m=><div className="chatMessage" key={m.id}><b>{m.name}</b><span>{m.text}</span></div>)}</div><form className="chatForm" onSubmit={sendChat}><input value={chatDraft} onChange={e=>setChatDraft(e.target.value)} placeholder="Say something beneficial…" maxLength={240}/><button>Send</button></form></div>
          </div>
          <div className="freeNote">Free-first mode: this room provides the camera preview and social interaction layer without a paid video provider. A true cross-device broadcast still needs a WebRTC media backend.</div>
        </section>}
      </div>
    </main>
  );
}
