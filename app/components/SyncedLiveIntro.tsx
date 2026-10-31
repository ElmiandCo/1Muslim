"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "intro" | "welcome" | "ready";
export default function SyncedLiveIntro({ startedAt, onFinish, host = false }: { startedAt: string; onFinish: () => void; host?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Host confirmation is a silent, short-lived toast. Viewer intro behavior remains unchanged.
  useEffect(()=>{if(!host)return;const timer=window.setTimeout(onFinish,2000);return()=>window.clearTimeout(timer)},[host,onFinish]);
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
  if(host)return <div role="status" aria-live="polite" style={{position:"absolute",top:16,left:"50%",transform:"translateX(-50%)",zIndex:40,padding:"9px 17px",border:"1px solid #78e6b78a",borderRadius:999,background:"rgba(4,31,23,.88)",backdropFilter:"blur(18px)",color:"#eafff3",fontSize:13,fontWeight:750,whiteSpace:"nowrap",boxShadow:"0 8px 28px #0007",animation:"liveToastFade 2s ease-in-out both"}}>🔴 You’re live <style jsx>{`@keyframes liveToastFade{0%{opacity:0;transform:translateY(-8px)}15%,70%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-8px)}}@media(prefers-reduced-motion:reduce){div{animation:none}}`}</style></div>;
  return <div className="oneMuslimCinematicIntro" role="status" aria-live="polite" style={{position:"absolute",inset:0,zIndex:18,background:"rgba(0,24,19,.92)",display:"grid",placeItems:"center",overflow:"hidden",color:"#fff"}}>
    {phase==="intro" && <div className="oneMuslimIntroAtmosphere" aria-hidden="true"><i/><i/><i/><span>1MUSLIM <em>LIVE</em></span><small>CONNECTING THE UMMAH</small></div>}
    {phase==="intro" && <video ref={videoRef} src="/videos/prelive-intro.mp4" playsInline preload="auto" onLoadedMetadata={e=>setDuration(e.currentTarget.duration)} onError={introComplete} onEnded={introComplete} style={{width:"100%",height:"100%",objectFit:"contain"}} />}
    {phase==="intro" && duration !== null && elapsed >= Math.max(0,duration-3) && elapsed < duration && <div style={{position:"absolute",inset:0,display:"grid",placeItems:"center",pointerEvents:"none",background:"rgba(0,0,0,.2)",fontSize:"clamp(76px,18vw,180px)",fontWeight:900,textShadow:"0 8px 45px #000"}}>{Math.max(1,Math.ceil(duration-elapsed))}</div>}
    {phase==="welcome" && <><audio ref={welcomeRef} src="/audio/hudhud-welcome.mp3" preload="auto" onEnded={()=>setPhase("ready")} onError={()=>setPhase("ready")}/><div style={{textAlign:"center",padding:24}}><div style={{fontSize:46}}>☪</div><strong style={{fontSize:24,color:"#f5d68d"}}>Bismillāh</strong><p>Welcome to 1Muslim Live</p></div></>}
    {phase==="ready" && <div style={{textAlign:"center",padding:24}}><div style={{fontSize:24,color:"#ff6060",fontWeight:900}}>● YOU’RE LIVE!</div><p>Camera and microphone connected</p></div>}
    {host && <span style={{position:"absolute",top:12,left:12,background:"rgba(0,0,0,.72)",padding:"8px 12px",borderRadius:12,fontSize:12}}>● Broadcast connected · {phase==="intro"?"Opening intro":phase==="welcome"?"Shahada Welcome":"On air"}</span>}
    {tap && <button type="button" onClick={()=>{const media=phase==="intro"?videoRef.current:welcomeRef.current;if(media){media.muted=false;void media.play().then(()=>setTap(false)).catch(()=>{});}}} style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:"#075d4c",color:"#fff",border:"1px solid #e7ce88",borderRadius:999,padding:"14px 20px",zIndex:3}}>🔊 Play intro with sound</button>}
    <button type="button" onClick={finish} style={{position:"absolute",bottom:12,right:12,background:"rgba(0,0,0,.8)",color:"#fff",border:"1px solid #bca76e",borderRadius:999,padding:"8px 12px",cursor:"pointer"}}>Skip intro →</button>
    <style jsx>{`
      .oneMuslimCinematicIntro{animation:omIntroAppear .6s ease-out both}
      .oneMuslimIntroAtmosphere{position:absolute;inset:0;z-index:1;pointer-events:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:radial-gradient(ellipse at center,#00563e44,transparent 65%);animation:omAtmosphereOut 2.6s ease-in-out both}
      .oneMuslimIntroAtmosphere i{position:absolute;width:62vmin;height:62vmin;border:1px solid #8bf9bf77;border-radius:50%;box-shadow:0 0 40px #32e4a344;animation:omIntroOrb 2.6s ease-out both}
      .oneMuslimIntroAtmosphere i:nth-child(2){animation-delay:.2s}.oneMuslimIntroAtmosphere i:nth-child(3){animation-delay:.4s}
      .oneMuslimIntroAtmosphere span{font-size:clamp(25px,7vw,54px);font-weight:900;letter-spacing:.14em;text-shadow:0 0 28px #3de3a8}.oneMuslimIntroAtmosphere em{color:#f4d68c;font-style:normal}.oneMuslimIntroAtmosphere small{letter-spacing:.32em;color:#c4e8d7;font-size:9px}
      @keyframes omIntroAppear{from{opacity:0}to{opacity:1}}@keyframes omIntroOrb{0%{transform:scale(.3) rotate(-30deg);opacity:0}45%{opacity:.8}100%{transform:scale(1.7) rotate(30deg);opacity:0}}@keyframes omAtmosphereOut{0%,35%{opacity:1}100%{opacity:0}}
      @media(prefers-reduced-motion:reduce){.oneMuslimCinematicIntro,.oneMuslimIntroAtmosphere,.oneMuslimIntroAtmosphere i{animation:none}.oneMuslimIntroAtmosphere{display:none}}
    `}</style>
  </div>;
}
