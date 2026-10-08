"use client";
import { useEffect, useRef, useState } from "react";

export default function SyncedLiveIntro({ startedAt, onFinish, host = false }: { startedAt: string; onFinish: () => void; host?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const finished = useRef(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [tap, setTap] = useState(false);
  const finish = () => { if (!finished.current) { finished.current = true; onFinish(); } };
  useEffect(() => {
    const tick = () => setElapsed(Math.max(0, (Date.now() - new Date(startedAt).getTime()) / 1000));
    tick(); const timer = window.setInterval(tick, 200);
    return () => window.clearInterval(timer);
  }, [startedAt]);
  useEffect(() => {
    const video = videoRef.current;
    if (!video || duration === null) return;
    const position = elapsed - 3;
    if (position >= duration) { finish(); return; }
    if (position < 0) { video.pause(); return; }
    if (Math.abs(video.currentTime - position) > 0.8) video.currentTime = Math.max(0, position);
    video.muted = host;
    void video.play().then(() => setTap(false)).catch(() => {
      if (!host) { video.muted = true; void video.play().then(() => setTap(false)).catch(() => setTap(true)); }
      else setTap(true);
    });
  }, [elapsed, duration, host]);
  return <div style={{position:"absolute",inset:0,zIndex:8,background:"#000",display:"grid",placeItems:"center",overflow:"hidden"}}>
    <video ref={videoRef} src="/videos/prelive-intro.mp4" playsInline muted={host} preload="auto" onLoadedMetadata={e=>setDuration(e.currentTarget.duration)} onError={finish} onEnded={finish} style={{width:"100%",height:"100%",objectFit:"contain",visibility:elapsed>=3?"visible":"hidden"}} />
    {elapsed<3 && <div style={{position:"absolute",inset:0,display:"grid",placeItems:"center",background:"#050805",color:"#fff",fontSize:"clamp(60px,15vw,150px)",fontWeight:900}}>{Math.max(1,Math.ceil(3-elapsed))}</div>}
    {host && <span style={{position:"absolute",top:12,left:12,background:"rgba(0,0,0,.8)",color:"#fff",padding:"8px 12px",borderRadius:12,fontSize:12}}>🎬 Synchronized intro · Your camera is connected</span>}
    {tap && <button type="button" onClick={()=>{const v=videoRef.current;if(v){v.muted=true;void v.play().then(()=>setTap(false));}}} style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:"#111",color:"#fff",padding:"12px 18px",borderRadius:999}}>▶ Resume intro</button>}
    <button type="button" onClick={finish} style={{position:"absolute",bottom:12,right:12,background:"rgba(0,0,0,.8)",color:"#fff",border:"1px solid #666",borderRadius:999,padding:"8px 12px",cursor:"pointer"}}>Skip intro →</button>
  </div>;
}
