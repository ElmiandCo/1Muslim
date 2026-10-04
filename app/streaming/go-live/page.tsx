"use client";

import SiteNav from "../../components/SiteNav";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";

const categories = ["Qur'an", "New Muslim", "Prayer", "Seerah", "Tawhid", "Community"];
type ChatMessage = { id: string; name: string; text: string };

export default function GoLivePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [live, setLive] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [error, setError] = useState("");
  const [viewers, setViewers] = useState(0);
  const [chat, setChat] = useState<ChatMessage[]>([{id:"welcome",name:"1Muslim",text:"Welcome to the live conversation."}]);
  const [chatDraft, setChatDraft] = useState("");
  const [reaction, setReaction] = useState<string | null>(null);
  const [followed, setFollowed] = useState(false);
  const [notifications, setNotifications] = useState(false);

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
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraReady(true);
      setCameraOn(true);
      setMicOn(true);
    } catch (err) {
      setError(err instanceof DOMException && err.name === "NotAllowedError"
        ? "Camera or microphone access was denied. Allow access in your browser settings and try again."
        : err instanceof Error ? err.message : "We could not access your camera and microphone.");
    }
  };

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

  const startLive = () => {
    if (!cameraReady) return setError("Turn on your camera and microphone first.");
    if (!title.trim()) return setError("Give your live stream a title first.");
    setError("");
    setLive(true);
  };

  const endLive = () => {
    setLive(false);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraReady(false);
    setCameraOn(true);
    setMicOn(true);
  };

  return (
    <main className="goLive">
      <style jsx>{`
        .goLive{min-height:100vh;background:var(--bg);color:var(--text)}
        .bar{height:62px;border-bottom:1px solid #1b241f;display:flex;align-items:center;justify-content:space-between;padding:0 max(18px,calc((100vw - 1120px)/2));background:rgba(5,8,6,.9);backdrop-filter:blur(16px);position:sticky;top:0;z-index:5}
        .brand{display:flex;gap:9px;align-items:center;font-weight:850}.mark{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:#101811;border:1px solid #354237;color:#d6e7b8}.back{color:#98a49d;text-decoration:none;font-size:12px}
        .shell{max-width:1120px;margin:auto;padding:30px 18px 70px}.heading{margin-bottom:20px}.eyebrow{font-size:10px;letter-spacing:.16em;color:#829b87;font-weight:850}.heading h1{font-size:42px;letter-spacing:-.06em;margin:8px 0}.heading p{color:#849087;font-size:13px;margin:0}
        .layout{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(280px,.65fr);gap:16px}.panel{border:1px solid #1b241f;border-radius:22px;background:#0a100c;overflow:hidden}.preview{aspect-ratio:16/10;background:radial-gradient(circle at 50% 40%,#18231b,#050806 65%);position:relative;display:grid;place-items:center}.preview video{width:100%;height:100%;object-fit:cover;transform:scaleX(-1);display:block}.placeholder{text-align:center;color:#6f7d74}.cameraIcon{font-size:44px;margin-bottom:8px}.live{position:absolute;top:14px;left:14px;padding:7px 10px;border-radius:999px;background:#e9f3db;color:#081007;font-size:10px;font-weight:900}.status{position:absolute;bottom:14px;left:14px;right:14px;display:flex;justify-content:space-between;gap:10px;align-items:center}.status span{font-size:10px;color:#d9e2dc;background:rgba(0,0,0,.62);padding:7px 10px;border-radius:999px}.controls{display:flex;justify-content:center;gap:10px;padding:16px;border-top:1px solid #1b241f}.circle{width:46px;height:46px;border-radius:50%;border:1px solid #334038;background:#121913;color:#fff;cursor:pointer}.circle.off{opacity:.5}.start{padding:12px 22px;border:0;border-radius:999px;background:#d6e7b8;color:#071008;font-weight:850;cursor:pointer}.end{padding:12px 22px;border:0;border-radius:999px;background:#251313;color:#ffd6d6;font-weight:850;cursor:pointer}
        .form{padding:20px}.form h2{font-size:17px;margin:0 0 15px}.field{margin-bottom:15px}.field label{display:block;font-size:10px;color:#748178;margin-bottom:7px;text-transform:uppercase;letter-spacing:.1em}.input,.select{width:100%;border:1px solid #263029;background:#0d140f;color:#f3f6f3;border-radius:11px;padding:12px;outline:none}.input:focus,.select:focus{border-color:#61785a}.help{font-size:10px;color:#66736b;line-height:1.6;margin-top:14px}.error{border:1px solid #533536;background:#1b0f10;color:#ffcaca;padding:10px 12px;border-radius:10px;font-size:10px;margin-bottom:12px}.ready{border:1px solid #334333;background:#101810;color:#b8d2ae;padding:10px 12px;border-radius:10px;font-size:10px;margin-bottom:12px}
        .notice{margin-top:16px;border:1px solid #273129;border-radius:16px;padding:15px;color:#7d8981;font-size:10px;line-height:1.6}.notice strong{color:#c7d2ca;display:block;margin-bottom:4px}
        @media(max-width:780px){.layout{grid-template-columns:1fr}.heading h1{font-size:36px}.shell{padding:24px 12px 50px}}
      `}</style>

      <SiteNav />
      <div className="shell">
        <div className="heading">
          <span className="eyebrow">CREATOR STUDIO</span>
          <h1>Go Live</h1>
          <p>Share a lesson, reminder, conversation or community moment with 1Muslim.</p>
        </div>

        <div className="layout">
          <section className="panel">
            <div className="preview">
              {cameraReady ? <video ref={videoRef} muted playsInline autoPlay /> : <div className="placeholder"><div className="cameraIcon">◉</div><div>Camera preview is off</div></div>}
              {live && <span className="live">● LIVE</span>}
              {cameraReady && <div className="status"><span>{cameraOn ? "Camera on" : "Camera off"}</span><span>{micOn ? "Mic on" : "Mic off"}</span></div>}
            </div>
            <div className="controls">
              {cameraReady && <><button className={cameraOn ? "circle" : "circle off"} onClick={toggleCamera} aria-label="Toggle camera">{cameraOn ? "◉" : "○"}</button><button className={micOn ? "circle" : "circle off"} onClick={toggleMic} aria-label="Toggle microphone">{micOn ? "♫" : "×"}</button></>}
              {!cameraReady ? <button className="start" onClick={startPreview}>Enable camera & mic</button> : live ? <button className="end" onClick={endLive}>End live</button> : <button className="start" onClick={startLive}>Start Live</button>}
            </div>
          </section>

          <aside className="panel form">
            <h2>Live details</h2>
            {error && <div className="error">{error}</div>}
            {live && <div className="ready">Your live session is active in this studio.</div>}
            <div className="field"><label htmlFor="title">Title</label><input id="title" className="input" value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="What are you sharing?" disabled={live}/></div>
            <div className="field"><label htmlFor="category">Topic</label><select id="category" className="select" value={category} onChange={(e)=>setCategory(e.target.value)} disabled={live}>{categories.map((item)=><option key={item}>{item}</option>)}</select></div>
            <p className="help">Your browser will ask for camera and microphone permission the first time you enable them. You must grant access for the preview to work.</p>
            <div className="notice"><strong>Broadcast connection</strong>This studio currently handles camera/microphone permission and the local live preview. A real multi-user broadcast still needs a streaming service such as WebRTC/LiveKit, Cloudflare Stream, Mux, or another media backend.</div>
          </aside>
        </div>
      </div>
    </main>
  );
}
