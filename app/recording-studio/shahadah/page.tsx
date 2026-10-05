"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "../../../utils/supabase/client";

export default function ShahadahStudio() {
  const supabase = createClient();
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [userId, setUserId] = useState("");
  const [recording, setRecording] = useState(false);
  const [preview, setPreview] = useState("");
  const [locked, setLocked] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [duration, setDuration] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!mounted) return;
      if (!data.user) { window.location.href = "/auth"; return; }
      setUserId(data.user.id);
      const { data: existing } = await supabase.from("shahadah_recordings").select("id").eq("user_id", data.user.id).maybeSingle();
      if (existing) setLocked(true);
    });
    return () => { mounted = false; if (timer.current) clearInterval(timer.current); };
  }, []);

  function startRecording() {
    setMessage("");
    setPreview("");
    chunks.current = [];
    const streamPromise = navigator.mediaDevices.getUserMedia({ audio: true });
    streamPromise.then(stream => {
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorder.current = r;
      r.ondataavailable = e => { if (e.data.size) chunks.current.push(e.data); };
      r.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks.current, { type: r.mimeType || "audio/webm" });
        setPreview(URL.createObjectURL(blob));
      };
      r.start();
      setRecording(true);
      setDuration(0);
      timer.current = setInterval(() => setDuration(v => v + 1), 1000);
    }).catch(() => setMessage("Microphone access is required to record your Shahadah."));
  }

  function stopRecording() {
    recorder.current?.stop();
    recorder.current = null;
    setRecording(false);
    if (timer.current) clearInterval(timer.current);
  }

  async function lockRecording() {
    if (!userId || !chunks.current.length) return;
    setSaving(true);
    setMessage("");
    const blob = new Blob(chunks.current, { type: recorder.current?.mimeType || "audio/webm" });
    const path = userId + "/shahadah-" + Date.now() + ".webm";
    const upload = await supabase.storage.from("secure-vault").upload(path, blob, { contentType: "audio/webm", upsert: false });
    if (upload.error) { setSaving(false); setMessage(upload.error.message); return; }
    const { data: row, error: rowError } = await supabase.from("shahadah_recordings").insert({ user_id: userId, storage_path: path, duration_seconds: duration }).select("id").single();
    if (rowError) {
      await supabase.storage.from("secure-vault").remove([path]);
      setSaving(false); setMessage(rowError.message); return;
    }
    const { error: xpError } = await supabase.rpc("award_shahadah_xp", { p_recording_id: row.id });
    if (xpError) { setSaving(false); setMessage("Your recording was saved, but XP could not be awarded yet."); return; }
    setLocked(true);
    setCelebrating(true);
    setSaving(false);
    setMessage("Locked in your Secure Vault. +5,000 XP");
  }

  const mm = String(Math.floor(duration / 60)).padStart(2, "0");
  const ss = String(duration % 60).padStart(2, "0");

  return <main style={{minHeight:"100vh",padding:"40px 20px",background:"var(--bg,#080808)",color:"var(--text,#fff)"}}>
    <div style={{maxWidth:760,margin:"0 auto"}}>
      <Link href="/" style={{opacity:.7}}>← Back to 1Muslim</Link>
      <div style={{marginTop:60,textAlign:"center"}}>
        <span style={{letterSpacing:".18em",fontSize:12,opacity:.6}}>RECORDING STUDIO · SECURE VAULT</span>
        <h1 style={{fontSize:"clamp(40px,8vw,76px)",margin:"18px 0 12px"}}>Say it.</h1>
        <p style={{maxWidth:600,margin:"0 auto",lineHeight:1.7,opacity:.75}}>Record your Shahadah in your own voice. When you lock it in, the recording is stored privately in your Secure Vault.</p>
      </div>
      <section style={{marginTop:44,padding:28,border:"1px solid rgba(255,255,255,.12)",borderRadius:28,background:"rgba(255,255,255,.04)"}}>
        <div style={{textAlign:"center",fontSize:18,lineHeight:1.8}}>
          <div>أشهد أن لا إله إلا الله</div>
          <div>وأشهد أن محمدًا رسول الله</div>
          <p style={{fontSize:14,opacity:.65}}>“I bear witness that there is no deity worthy of worship except Allah, and I bear witness that Muhammad is His Messenger.”</p>
        </div>
        <div style={{display:"flex",justifyContent:"center",gap:12,marginTop:28,flexWrap:"wrap"}}>
          {!locked && !recording && <button className="primary" onClick={startRecording}>● Record Shahadah</button>}
          {recording && <button className="primary" onClick={stopRecording}>■ Stop · {mm}:{ss}</button>}
          {!locked && preview && !recording && <button className="ghost" onClick={lockRecording} disabled={saving}>{saving ? "Locking…" : "🔒 Lock in Secure Vault · +5,000 XP"}</button>}
        </div>
        {preview && <audio controls src={preview} style={{width:"100%",marginTop:24}} />}
        {locked && <div style={{marginTop:24,textAlign:"center",padding:18,borderRadius:18,background:"rgba(255,255,255,.06)"}}>🔒 <strong>Shahadah locked in your Secure Vault.</strong><br/><span style={{opacity:.7}}>This recording cannot be replaced here.</span></div>}
        {message && <p style={{textAlign:"center",marginTop:18}}>{message}</p>}
      </section>
      {celebrating && <section aria-live="polite" style={{position:"relative",overflow:"hidden",marginTop:28,padding:"42px 24px",borderRadius:32,border:"1px solid rgba(211,178,84,.32)",background:"radial-gradient(circle at 50% 20%,rgba(211,178,84,.18),rgba(255,255,255,.035) 42%,rgba(255,255,255,.02) 100%)",boxShadow:"0 0 70px rgba(211,178,84,.12)"}}>
        <div style={{position:"absolute",inset:0,pointerEvents:"none"}}>{Array.from({length:24}).map((_,i)=><span key={i} style={{position:"absolute",left:(4+(i*37)%92)+"%",top:(-10+(i*19)%34)+"%",width:6,height:10,borderRadius:3,background:i%3===0?"#d3b254":i%3===1?"#fff":"#4f9b78",transform:"rotate("+(i*31%360)+"deg)",opacity:.85}} />)}</div>
        <div style={{position:"relative",textAlign:"center"}}>
          <div style={{fontSize:42,marginBottom:10}}>🎉</div>
          <div style={{fontSize:12,letterSpacing:".2em",opacity:.65}}>SHAHADAH COMPLETE</div>
          <h2 style={{fontSize:"clamp(30px,6vw,52px)",margin:"10px 0 8px"}}>The Journey Begins</h2>
          <p style={{margin:"0 auto",maxWidth:520,lineHeight:1.7,opacity:.72}}>You locked your Shahadah into your Secure Vault. Your Tajweed journey is now unlocked.</p>
          <div style={{display:"flex",justifyContent:"center",gap:10,flexWrap:"wrap",marginTop:24}}>
            {["Al-Fātiḥah","An-Nās","Al-Falaq","Al-Ikhlāṣ"].map(s=><span key={s} style={{padding:"9px 13px",borderRadius:999,border:"1px solid rgba(255,255,255,.12)",background:"rgba(255,255,255,.06)",fontSize:13}}>{s} 🔓</span>)}
          </div>
          <div style={{marginTop:24,fontWeight:700}}>+5,000 XP · Tajweed Unlocked</div>
          <Link href="/learn/elm-tent#sessions" className="primary" style={{display:"inline-flex",marginTop:22,textDecoration:"none"}}>Begin Tajweed Journey →</Link>
        </div>
      </section>}
      <p style={{textAlign:"center",marginTop:24,fontSize:12,opacity:.5}}>Your recording is private and accessible only to your account.</p>
    </div>
  </main>;
}
