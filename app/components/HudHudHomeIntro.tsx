"use client";
import { useEffect, useRef, useState } from "react";

const KEY = "1muslim-hudhud-home-intro-seen-v2";
type Phase = "hidden" | "welcome" | "video" | "tour";
const PREF_KEY = "1muslim-hudhud-entry-preferences-v1";
const steps = [
  { selector: "nav, header", title: "Find your way", detail: "Explore the navigation and discover what 1Muslim offers." },
  { selector: "main, .app", title: "Explore 1Muslim", detail: "Watch, learn and discover the community. Some features require signing in." },
  { selector: ".hudhud-translator, [class*='hudhud']", title: "Meet HudHud", detail: "Your guide stays close by. Sign in to unlock member-only assistance." }
];
export default function HudHudHomeIntro() {
  const [phase, setPhase] = useState<Phase>("hidden");
  const [step, setStep] = useState(0);
  const [withLights,setWithLights]=useState(true);
  const [withTutorial,setWithTutorial]=useState(false);
  const [withVision,setWithVision]=useState(false);
  const [entryConfirmed,setEntryConfirmed]=useState(false);
  const [spot, setSpot] = useState<DOMRect | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [videoFailed,setVideoFailed]=useState(false);
  const [fading,setFading]=useState(false);
  const [salamReveal,setSalamReveal]=useState(false);
  const fadeTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const finishTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const started = useRef(false);
  const soundtrack = useRef<HTMLAudioElement | null>(null);
  const fadeOutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [soundEnabled,setSoundEnabled]=useState(true);
  const stopSound = (immediate=false) => {
    const audio=soundtrack.current;
    if(!audio)return;
    if(fadeOutTimer.current)clearTimeout(fadeOutTimer.current);
    if(immediate){audio.pause();audio.currentTime=0;return;}
    const from=audio.volume;
    const start=performance.now();
    const fade=()=>{const elapsed=performance.now()-start;audio.volume=Math.max(0,from*(1-elapsed/4000));if(elapsed<4000&&!audio.paused)fadeOutTimer.current=setTimeout(fade,60);else{audio.pause();audio.currentTime=0;}};
    fade();
  };
  const enableSound=()=>{const audio=soundtrack.current;if(!audio)return;if(soundEnabled){setSoundEnabled(false);stopSound(true);}else{setSoundEnabled(true);audio.volume=0;void audio.play().then(()=>{rampUpAudio(audio)}).catch(()=>{});}};
  const rampUpAudio=(audio:HTMLAudioElement)=>{
    const start=performance.now();
    const tick=()=>{if(audio.paused||!soundtrack.current)return;const elapsed=performance.now()-start;audio.volume=Math.min(.7,.7*elapsed/1700);if(elapsed<1700)setTimeout(tick,50);};
    tick();
  };
  useEffect(()=>{
    if(phase!=="video")return;
    const audio=new Audio("/audio/nasheed.mp3");
    if(soundtrack.current)return;
    soundtrack.current=audio;
    audio.preload="auto";
    audio.loop=true;
    audio.volume=0;
    // Browsers can block autoplay with sound. Retry on the first user gesture.
    const play=()=>{if(!soundEnabled||!audio.paused)return;void audio.play().then(()=>rampUpAudio(audio)).catch(()=>{});};
    play();
    window.addEventListener("pointerdown",play,{once:true});
    return()=>{window.removeEventListener("pointerdown",play);};
  },[phase]);
  useEffect(()=>{if(phase!=="video"){setSalamReveal(false);return;}setSalamReveal(false);const timer=setTimeout(()=>setSalamReveal(true),1250);return()=>clearTimeout(timer)},[phase]);
  useEffect(()=>{if(phase!=="video")return;const v=video.current,c=canvas.current;if(!v||!c)return;let frame=0;const draw=()=>{if(!v.videoWidth||!v.videoHeight){frame=requestAnimationFrame(draw);return}const ctx=c.getContext("2d",{willReadFrequently:true});if(!ctx)return;const w=360,h=Math.max(1,Math.round(360*v.videoHeight/v.videoWidth));if(c.width!==w||c.height!==h){c.width=w;c.height=h}try{ctx.drawImage(v,0,0,w,h);const img=ctx.getImageData(0,0,w,h),d=img.data;for(let i=0;i<d.length;i+=4){const r=d[i],g=d[i+1],b=d[i+2];const green=g-Math.max(r,b);if(g>65&&green>12){const alpha=Math.max(0,Math.min(1,(green-12)/55));d[i+3]=Math.round(d[i+3]*(1-alpha));if(alpha<1){d[i]=Math.min(255,r+green*.12);d[i+2]=Math.min(255,b+green*.12)}}}ctx.putImageData(img,0,0)}catch{setVideoFailed(true);return}frame=requestAnimationFrame(draw)};frame=requestAnimationFrame(draw);return()=>cancelAnimationFrame(frame)},[phase]);
  useEffect(() => {
    try { const stored=localStorage.getItem(PREF_KEY); if(stored){const p=JSON.parse(stored);setWithLights(p.lights!==false);setWithTutorial(Boolean(p.tutorial));setWithVision(Boolean(p.vision));} } catch {}
    setPhase("welcome");
    const onJourneyFinished=()=>{
      try { if (localStorage.getItem(KEY)) return; localStorage.setItem(KEY,"1"); } catch {}
      setPhase("tour");
    };
    window.addEventListener("elmi-journey-finished",onJourneyFinished);
    return ()=>{window.removeEventListener("elmi-journey-finished",onJourneyFinished);stopSound(true);};
  }, []);
  useEffect(() => {
    if (phase !== "video") return;
    const timeout = window.setTimeout(() => { if (!started.current) beginTour(); }, 8500);
    return () => window.clearTimeout(timeout);
  }, [phase]);
  useEffect(() => {
    if (phase !== "tour") return;
    const update = () => {
      const target = document.querySelector(steps[step].selector);
      setSpot(target?.getBoundingClientRect() ?? null);
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => { window.removeEventListener("resize", update); window.removeEventListener("scroll", update, true); };
  }, [phase, step]);
  const beginTour = () => { stopSound(); if (started.current) return; started.current = true; if(fadeTimer.current)clearTimeout(fadeTimer.current);if(finishTimer.current)clearTimeout(finishTimer.current);setPhase(withTutorial?"tour":"hidden"); window.dispatchEvent(new Event("hudhud-bird-finished")); };
  const fadeBeforeEnd=(duration:number)=>{if(started.current)return;if(fadeTimer.current)clearTimeout(fadeTimer.current);if(finishTimer.current)clearTimeout(finishTimer.current);const remaining=Math.max(0,duration);fadeTimer.current=setTimeout(()=>setFading(true),Math.max(0,remaining-1000));finishTimer.current=setTimeout(beginTour,remaining);};
  const enter=()=>{localStorage.setItem(PREF_KEY,JSON.stringify({lights:withLights,tutorial:withTutorial,vision:withVision}));window.dispatchEvent(new CustomEvent("hudhud-vision-preference",{detail:{enabled:withVision}}));setEntryConfirmed(true);started.current=false;setPhase(withLights?"video":withTutorial?"tour":"hidden");};
  if (phase === "hidden") return null;
  return <div className={`hh-onboard ${fading?"hh-fading":""}`} role="dialog" aria-modal="true" aria-label="HudHud welcome and guided tour">
    {phase === "welcome" ? <div className="hh-entry"><div className="hh-entry-card"><span>✦ HUDHUD WELCOME ✦</span><h2>How would you like to enter?</h2><p>Choose your experience. You can change these preferences later.</p><label><input type="checkbox" checked={withLights} onChange={e=>setWithLights(e.target.checked)}/> ✨ Enter With Animations / Lights <small>HudHud cinematic entrance and nasheed soundtrack</small></label><label><input type="checkbox" checked={withTutorial} onChange={e=>setWithTutorial(e.target.checked)}/> 🧭 Enter With Tutorial Mode <small>Guided tour of the navigation and HudHud</small></label><label><input type="checkbox" checked={withVision} onChange={e=>setWithVision(e.target.checked)}/> 🌀 HudHud Vision Beta <small>Not recommended for beginners · Default OFF</small></label><button onClick={enter}>Enter 1Muslim →</button></div></div> : phase === "video" ? <>
      <div className="hh-video-bg" /><div className="hh-elmi-waves" aria-hidden="true"><i/><i/><i/></div>
      <div className={`hh-salam-intro ${salamReveal?"hh-salam-reveal":""}`} aria-hidden="true"><img src="/assets/hudhud-salam-welcome.PNG" alt="" /><div className="hh-salam-power"/><div className="hh-salam-flash"/></div>
      <canvas ref={canvas} className="hh-cinema" aria-hidden="true" />
      {videoFailed&&<img className="hh-cinema hh-bird-fallback" src="/assets/hudhud-logo.PNG" alt="HudHud" />}
      <video ref={video} className="hh-source-video" autoPlay playsInline muted preload="auto"
        onLoadedMetadata={e => { const v=e.currentTarget; if (v.duration && Number.isFinite(v.duration)) fadeBeforeEnd(Math.max(1000,(v.duration-v.currentTime)*1000)); }}
        onTimeUpdate={e => { const v=e.currentTarget; if(v.duration && !fading && v.duration-v.currentTime<=1)setFading(true); }}
        onEnded={beginTour} onError={beginTour} aria-label="HudHud cinematic entrance">
        <source src="/videos/hudhud-no-background-extended.webm" type="video/webm" />
      </video>
      <div className="hh-cinema-caption">Welcome to 1Muslim ✨</div>
      <button className="hh-sound" type="button" aria-pressed={soundEnabled} onClick={enableSound}>{soundEnabled?"🔊 Sound on":"🔈 Enable sound"}</button>
      <button className="hh-skip" onClick={beginTour}>Skip intro →</button>
    </> : <>
      <div className="hh-tour-dim" />
      {spot && <div className="hh-spotlight" style={{top:Math.max(0,spot.top-8),left:Math.max(0,spot.left-8),width:Math.min(window.innerWidth,spot.width+16),height:spot.height+16}} />}
      <section className="hh-tour-card" aria-live="polite">
        <span className="hh-step">HUDHUD · {step+1} / {steps.length}</span>
        <h2>{steps[step].title}</h2>
        <p>{steps[step].detail}</p>
        <div className="hh-actions">
          <button onClick={()=>setPhase("hidden")}>Skip tutorial</button>
          <button className="hh-next" onClick={()=>step === steps.length-1 ? setPhase("hidden") : setStep(step+1)}>{step === steps.length-1 ? "Finish ✓" : "Next →"}</button>
        </div>
      </section>
    </>}
    <style jsx>{`
      .hh-entry{position:absolute;inset:0;background:#020307;display:grid;place-items:center;padding:18px}.hh-entry-card{width:min(480px,100%);padding:28px;border:1px solid #4b8a8b;border-radius:24px;background:linear-gradient(145deg,#0c1926,#150e25);box-shadow:0 0 55px #38c8ff33}.hh-entry-card>span{color:#a2f5ed;font-size:12px;letter-spacing:.17em}.hh-entry-card h2{font-size:27px;margin:12px 0}.hh-entry-card p,.hh-entry-card small{color:#b3c5d0}.hh-entry-card label{display:block;padding:13px;margin:12px 0;border:1px solid #41636e;border-radius:14px;cursor:pointer}.hh-entry-card input{accent-color:#69f3d3;margin-right:8px}.hh-entry-card small{display:block;font-size:11px;margin:5px 0 0 26px}.hh-entry-card button{width:100%;padding:15px;border:0;border-radius:14px;background:#83f4da;color:#071f23;font-weight:850;cursor:pointer}.hh-onboard{position:fixed;inset:0;z-index:99999;color:#fff;isolation:isolate;transition:opacity 1s ease}.hh-onboard.hh-fading{opacity:0;pointer-events:none}
      .hh-video-bg{position:absolute;inset:0;background:rgba(3,10,22,.32);backdrop-filter:brightness(.76);animation:hhFade .5s ease}
      .hh-elmi-waves{position:absolute;inset:0;overflow:hidden;pointer-events:none;background:radial-gradient(ellipse at 50% 65%,#15205b77,transparent 65%),linear-gradient(140deg,#030914,#071126 60%,#160c2e)}.hh-elmi-waves i{position:absolute;display:block;left:-35%;width:170%;height:32%;border-radius:50%;border:clamp(14px,5vw,58px) solid transparent;border-top-color:#30e9ff;border-bottom-color:#ac49ff;filter:drop-shadow(0 0 25px #38dfffbb);transform:rotate(-22deg);animation:hhElmiWave 6s ease-in-out infinite alternate}.hh-elmi-waves i:nth-child(1){top:15%}.hh-elmi-waves i:nth-child(2){top:43%;animation-delay:-2s;border-top-color:#f33dff;border-bottom-color:#1caeff}.hh-elmi-waves i:nth-child(3){top:72%;animation-delay:-4s;border-top-color:#8e5bff;border-bottom-color:#27eaff}@keyframes hhElmiWave{from{transform:translateX(-13%) rotate(-22deg) scaleY(.65)}to{transform:translateX(13%) rotate(12deg) scaleY(1.1)}}
      .hh-salam-intro{position:absolute;inset:0;z-index:3;pointer-events:none;display:grid;place-items:center;overflow:hidden;opacity:1;transition:opacity 1.35s cubic-bezier(.16,.75,.3,1)}.hh-salam-intro img{max-width:min(92vw,900px);max-height:80dvh;width:auto;height:auto;object-fit:contain;filter:drop-shadow(0 0 30px #fff9);animation:hhSalamImpact 1.4s ease-out both}.hh-salam-power{position:absolute;inset:-60%;background:conic-gradient(from 0deg,transparent 0deg,#fff8 10deg,transparent 25deg,#fff9 70deg,transparent 90deg,#fff8 145deg,transparent 165deg,#fff9 230deg,transparent 255deg,#fff8 310deg,transparent 330deg);mix-blend-mode:screen;filter:blur(13px);animation:hhPowerSpin 1.3s ease-out both}.hh-salam-flash{position:absolute;inset:0;background:#fff;animation:hhPowerFlash 1.25s ease-out forwards}.hh-salam-reveal{opacity:0}.hh-salam-reveal img{transform:scale(1.2);filter:blur(22px) brightness(2)}@keyframes hhPowerFlash{0%{opacity:0}12%{opacity:1}32%{opacity:.95}60%{opacity:.2}100%{opacity:0}}@keyframes hhPowerSpin{0%{opacity:0;transform:scale(.3) rotate(-110deg)}25%{opacity:1}100%{opacity:0;transform:scale(1.3) rotate(80deg)}}@keyframes hhSalamImpact{0%{opacity:0;transform:scale(.78);filter:blur(22px) brightness(3)}30%{opacity:1;transform:scale(1.04);filter:blur(0) brightness(2.2)}100%{opacity:1;transform:scale(1);filter:blur(0) brightness(1)}}
      .hh-cinema{position:absolute;inset:0;width:100vw;height:100dvh;object-fit:contain;filter:drop-shadow(0 0 32px rgba(61,177,255,.32))}.hh-source-video{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}.hh-bird-fallback{object-fit:contain;width:min(70vw,360px);height:min(70vw,360px);inset:0;margin:auto}
      .hh-cinema-caption{position:absolute;bottom:7%;width:100%;text-align:center;font-size:clamp(19px,3vw,34px);font-weight:700;text-shadow:0 2px 20px #000}
      .hh-sound{position:absolute;top:24px;left:24px;border:1px solid #78dfff99;background:#101e34e9;color:white;border-radius:99px;padding:12px 16px;cursor:pointer;z-index:2}.hh-skip{position:absolute;right:24px;top:24px;border:1px solid #ffffff66;background:#101e34df;color:#fff;border-radius:99px;padding:12px 19px;cursor:pointer}
      .hh-tour-dim{position:absolute;inset:0;background:rgba(0,5,18,.83);animation:hhFade .6s ease}
      .hh-spotlight{position:fixed;pointer-events:none;border:2px solid #7bdbff;border-radius:16px;box-shadow:0 0 0 9999px rgba(0,5,18,.12),0 0 36px #6dbeffbb;animation:hhZoom .55s ease;transition:top .4s ease,left .4s ease,width .4s ease,height .4s ease}
      .hh-tour-card{position:absolute;bottom:clamp(24px,8vh,100px);left:50%;transform:translateX(-50%);width:min(90vw,450px);background:#09172bf2;border:1px solid #67c9ff88;border-radius:24px;padding:26px;box-shadow:0 16px 60px #000b;animation:hhCard .5s ease}
      .hh-step{color:#89dfff;font-size:12px;letter-spacing:2px}.hh-tour-card h2{font-size:25px;margin:12px 0}.hh-tour-card p{line-height:1.6;color:#d8e7f8}
      .hh-actions{display:flex;justify-content:space-between;gap:12px;margin-top:20px}.hh-actions button{border:1px solid #7b9bb7;background:transparent;color:#fff;border-radius:12px;padding:11px 17px;cursor:pointer}.hh-actions .hh-next{background:#1285ba;border-color:#1285ba}
      @keyframes hhFade{from{opacity:0}to{opacity:1}}@keyframes hhZoom{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}@keyframes hhCard{from{opacity:0;transform:translate(-50%,18px)}to{opacity:1;transform:translate(-50%,0)}}
      @media(prefers-reduced-motion:reduce){.hh-video-bg,.hh-tour-dim,.hh-spotlight,.hh-tour-card,.hh-elmi-waves i,.hh-salam-intro img,.hh-salam-power,.hh-salam-flash{animation:none}}
    `}</style>
  </div>;
}
