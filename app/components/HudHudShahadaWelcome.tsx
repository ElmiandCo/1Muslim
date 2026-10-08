"use client";

import {useEffect,useRef,useState} from "react";

const MESSAGE = "I scan comments and posts to help protect our Muslim community. I can flag content for review, and moderators may suspend accounts or remove comments that violate our rules. Welcome to 1Muslim!";

export default function HudHudShahadaWelcome({enabled=true}:{enabled?:boolean}){
  const root=useRef<HTMLDivElement>(null);
  const [visible,setVisible]=useState(false);
  const [sound,setSound]=useState(false);
  const [typed,setTyped]=useState(0);
  useEffect(()=>{
    if(!enabled)return;
    const node=root.current;
    if(!node)return;
    if(typeof IntersectionObserver==="undefined"){setVisible(true);return;}
    const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){setVisible(true);observer.disconnect();}},{threshold:0.35});
    observer.observe(node);
    return()=>observer.disconnect();
  },[enabled]);
  useEffect(()=>{
    if(!visible||typed>=MESSAGE.length)return;
    if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){setTyped(MESSAGE.length);return;}
    const timer=window.setTimeout(()=>setTyped(n=>Math.min(n+2,MESSAGE.length)),28);
    return()=>window.clearTimeout(timer);
  },[visible,typed]);
  function playChirp(){
    if(!sound)return;
    try{
      const Context=window.AudioContext;
      if(!Context)return;
      const ctx=new Context();
      const oscillator=ctx.createOscillator();
      const gain=ctx.createGain();
      oscillator.type="sine";
      oscillator.frequency.setValueAtTime(680,ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(950,ctx.currentTime+0.12);
      gain.gain.setValueAtTime(0.0001,ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.065,ctx.currentTime+0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.18);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime+0.2);
      oscillator.onended=()=>void ctx.close();
    }catch{}
  }
  if(!enabled)return null;
  return <div ref={root} className={"hudhudWelcome "+(visible?"appeared":"")} aria-label="HudHud welcome message">
    <div className="hudhudAvatar" aria-hidden="true">🐦</div>
    <div className="hudhudBubble">
      <div className="hudhudHeading"><strong>HudHud</strong><span>Community guide</span><button type="button" onClick={()=>{setSound(v=>!v);if(!sound){setTimeout(()=>{try{const a=new AudioContext();const o=a.createOscillator();const g=a.createGain();o.frequency.value=820;g.gain.value=.025;o.connect(g).connect(a.destination);o.start();o.stop(a.currentTime+.08);o.onended=()=>void a.close();}catch{}},0)}}} aria-pressed={sound} aria-label={sound?"Mute HudHud sounds":"Enable HudHud sounds"}>{sound?"🔊":"🔇"}</button></div>
      <p aria-live="off">{MESSAGE.slice(0,typed)}{typed<MESSAGE.length&&<span className="hudhudCursor" aria-hidden="true">▍</span>}</p>
      {visible&&<button type="button" className="hudhudReplay" onClick={()=>{setTyped(0);playChirp();}}>↻ Replay message</button>}
    </div>
    <style jsx>{`
      .hudhudWelcome{display:flex;gap:12px;align-items:flex-end;margin:20px 0;opacity:0;transform:translateY(18px);transition:opacity .55s ease,transform .55s ease}
      .hudhudWelcome.appeared{opacity:1;transform:translateY(0)}
      .hudhudAvatar{flex-shrink:0;display:grid;place-items:center;width:55px;height:55px;border-radius:50%;background:radial-gradient(circle at 30% 20%,#dcebc6,#304e39);border:2px solid #99c18e;font-size:28px;box-shadow:0 0 22px #82c59033;animation:hudhudFloat 3s ease-in-out infinite}
      .hudhudBubble{flex:1;min-width:0;padding:14px 16px;border-radius:17px 17px 17px 4px;border:1px solid #5e8c66;background:linear-gradient(135deg,#14271a,#0a130e);color:#e8f2e4;box-shadow:0 12px 30px #0005}
      .hudhudHeading{display:flex;align-items:center;gap:9px}.hudhudHeading strong{color:#d5f4be}.hudhudHeading span{font-size:10px;color:#9cbba4}.hudhudHeading button{margin-left:auto;background:transparent;border:1px solid #4c6c51;border-radius:8px;color:white;cursor:pointer;padding:5px}
      .hudhudBubble p{font-size:13px;line-height:1.65;min-height:44px;margin:10px 0}.hudhudCursor{color:#b3e4a4;animation:blink .7s step-end infinite}
      .hudhudReplay{background:none;border:none;color:#b9dfac;text-decoration:underline;cursor:pointer;font-size:11px;padding:3px 0}
      @keyframes hudhudFloat{50%{transform:translateY(-5px)}}@keyframes blink{50%{opacity:0}}
      @media(prefers-reduced-motion:reduce){.hudhudWelcome,.hudhudAvatar{animation:none;transition:none}.hudhudCursor{animation:none}}
    `}</style>
  </div>;
}
