"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "intro" | "welcome" | "ready";
export default function SyncedLiveIntro({ startedAt, onFinish, host = false }: { startedAt: string; onFinish: () => void; host?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const welcomeRef = useRef<HTMLAudioElement>(null);
  const finished = useRef(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [phase,setPhase] = useState<Phase>("intro");
  const [tap,setTap] = useState(false);
  const finish = useCallback(() => { if (!finished.current) { finished.current = true; onFinish(); } },[onFinish]);
  const introComplete = useCallback(() => {
    if (host) setPhase("welcome");
    else finish();
  },[host,finish]);
  useEffect(() => {
    const tick = () => setElapsed(Math.max(0, (Date.now() - new Date(startedAt).getTime()) / 1000));
    tick(); const timer = window.setInterval(tick, 200);
    return () => window.clearInterval(timer);
  }, [startedAt]);
  useEffect(() => {
    const video = videoRef.current;
    if (!video || duration === null || phase !== "intro") return;
    if (elapsed >= duration) { introComplete(); return; }
    if (Math.abs(video.currentTime - elapsed) > 0.8) video.currentTime = Math.max(0, elapsed);
    // Host initiated Go Live via a gesture: preserve the intro's ORIGINAL sound.
    video.muted = false;
    void video.play().then(() => setTap(false)).catch(() => {
      // Mobile autoplay policy: allow muted preview but explicitly request sound activation.
      video.muted = true;
      void video.play().catch(() => {});
      setTap(true);
    });
  }, [elapsed, duration, phase, introComplete]);
  useEffect(()=>{
    if(phase!=="welcome")return;
    const audio=welcomeRef.current;
    if(!audio){setPhase("ready");return;}
    audio.volume=0.85;
    void audio.play().then(()=>setTap(false)).catch(()=>setTap(true));
    const timeout=window.setTimeout(()=>setPhase("ready"),5500);
    return()=>window.clearTimeout(timeout);
  },[phase]);
  useEffect(()=>{
    if(phase!=="ready")return;
    const timeout=window.setTimeout(finish,1400);
    return()=>window.clearTimeout(timeout);
  },[phase,finish]);
  return <div role="status" aria-live="polite" style={{position:"absolute",inset:0,zIndex:18,background:"rgba(0,24,19,.92)",display:"grid",placeItems:"center",overflow:"hidden",color:"#fff"}}>
    {phase==="intro" && <video ref={videoRef} src="/videos/prelive-intro.mp4" playsInline preload="auto" onLoadedMetadata={e=>setDuration(e.currentTarget.duration)} onError={introComplete} onEnded={introComplete} style={{width:"100%",height:"100%",objectFit:"contain"}} />}
    {phase==="intro" && duration !== null && elapsed >= Math.max(0,duration-3) && elapsed < duration && <div style={{position:"absolute",inset:0,display:"grid",placeItems:"center",pointerEvents:"none",background:"rgba(0,0,0,.2)",fontSize:"clamp(76px,18vw,180px)",fontWeight:900,textShadow:"0 8px 45px #000"}}>{Math.max(1,Math.ceil(duration-elapsed))}</div>}
    {phase==="welcome" && <><audio ref={welcomeRef} src="/audio/hudhud-welcome.mp3" preload="auto" onEnded={()=>setPhase("ready")} onError={()=>setPhase("ready")}/><div style={{textAlign:"center",padding:24}}><div style={{fontSize:46}}>☪</div><strong style={{fontSize:24,color:"#f5d68d"}}>Bismillāh</strong><p>Welcome to 1Muslim Live</p></div></>}
    {phase==="ready" && <div style={{textAlign:"center",padding:24}}><div style={{fontSize:24,color:"#ff6060",fontWeight:900}}>● YOU’RE LIVE!</div><p>Camera and microphone connected</p></div>}
    {host && <span style={{position:"absolute",top:12,left:12,background:"rgba(0,0,0,.72)",padding:"8px 12px",borderRadius:12,fontSize:12}}>● Broadcast connected · {phase==="intro"?"Opening intro":phase==="welcome"?"Shahada Welcome":"On air"}</span>}
    {tap && <button type="button" onClick={()=>{const media=phase==="intro"?videoRef.current:welcomeRef.current;if(media){media.muted=false;void media.play().then(()=>setTap(false)).catch(()=>{});}}} style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:"#075d4c",color:"#fff",border:"1px solid #e7ce88",borderRadius:999,padding:"14px 20px",zIndex:3}}>🔊 Play intro with sound</button>}
    <button type="button" onClick={finish} style={{position:"absolute",bottom:12,right:12,background:"rgba(0,0,0,.8)",color:"#fff",border:"1px solid #bca76e",borderRadius:999,padding:"8px 12px",cursor:"pointer"}}>Skip intro →</button>
  </div>;
}
