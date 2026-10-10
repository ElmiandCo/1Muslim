"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";

const options=[
 {label:"Watch Live",href:"/streaming",description:"Explore streams happening now"},
 {label:"Go Live",href:"/streaming/go-live",description:"Start your own broadcast"},
 {label:"Scheduled Lives",href:"/streaming/scheduled",description:"See upcoming broadcasts"},
 {label:"Watch Recorded",href:"/streaming/recordings",description:"Browse available recordings"}
];
export default function HudHudVisionDock(){
 const [vision,setVision]=useState(false);
 const [pinned,setPinned]=useState(false);
 const [choice,setChoice]=useState<number|null>(null);
 const router=useRouter();
 const run=()=>{if(choice!==null)router.push(options[choice].href)};
 return <div className="hhVisionRoot">
   {vision&&<div className="hhVisionHint" role="status">{pinned?"HudHud Vision · Live Now pinned":"HudHud Vision ON · Select Live Now to inspect its actions"}</div>}
   {vision&&<button className="hhVisionTarget" type="button" onClick={()=>{setPinned(v=>!v);setChoice(null)}} aria-pressed={pinned} aria-label={pinned?"Unpin HudHud Vision from Live Now":"Pin HudHud Vision to Live Now"}>{pinned?"✕ Unpin Live Now":"⌖ Pin to Live Now"}</button>}
   {vision&&pinned&&<div className="hhVisionCard" role="region" aria-label="HudHud Live Now actions">
    <div className="hhVisionCardTitle"><span>🌀 HudHud · Live Now</span><button type="button" aria-label="Close Live Now actions" onClick={()=>{setPinned(false);setChoice(null)}}>×</button></div>
    <p>What would you like to do with Live Now?</p>
    <div className="hhVisionOptions">{options.map((item,i)=><button type="button" key={item.label} className={choice===i?"chosen":""} onClick={()=>setChoice(i)}><strong>{item.label}</strong><small>{item.description}</small></button>)}</div>
    {choice!==null&&<button className="hhVisionRun" type="button" onClick={run}>✦ {options[choice].label} →</button>}
   </div>}
   <button className={"hhVisionOrb "+(vision?"active":"")} type="button" onClick={()=>{if(!vision){setVision(true)}else if(pinned&&choice!==null){run()}else{setVision(false);setPinned(false);setChoice(null)}}} aria-label={vision?(pinned&&choice!==null?"Open selected HudHud action":"Turn HudHud Vision off"):"Turn HudHud Vision on"} aria-pressed={vision}><span className="hhVisionRing"><img src="/assets/1muslim-live-logo.PNG" alt="" /></span><span className="hhVisionLabel">HudHud <span aria-hidden="true">✧</span></span></button>
   <style jsx>{`
    .hhVisionRoot{position:fixed;bottom:calc(90px + env(safe-area-inset-bottom,0px));right:14px;z-index:110;display:flex;flex-direction:column;align-items:flex-end;gap:9px;pointer-events:none}
    .hhVisionRoot>*{pointer-events:auto}
    .hhVisionOrb{border:1px solid #80ecff;border-radius:999px;padding:9px 13px;display:flex;align-items:center;gap:7px;color:white;background:linear-gradient(135deg,#102a42eF,#241139f0);box-shadow:0 0 22px #00ddff66,0 5px 22px #000a;cursor:pointer;min-height:49px}
    .hhVisionOrb.active{border-color:#b8ffdc;box-shadow:0 0 26px #52ffe58c,0 0 12px #b64aff77}
    .hhVisionRing{display:grid;place-items:center;width:34px;height:34px;border:2px solid #50e7fa;border-radius:50%;font-size:20px;color:#c783ff;box-shadow:0 0 0 3px #ae61ff55,0 0 13px #56dfff99;animation:hhVisionSpin 6s linear infinite;overflow:hidden}.hhVisionRing img{width:100%;height:100%;object-fit:contain;animation:hhVisionCounterSpin 6s linear infinite}.hhVisionTarget[aria-pressed="true"]{background:#17454b;border-color:#8fffd7}
    .hhVisionLabel{font-size:12px;font-weight:800}
    .hhVisionHint{max-width:min(270px,80vw);border:1px solid #76dbff88;border-radius:13px;padding:9px 11px;background:#0b1a30ed;color:#d8f7ff;font-size:11px}
    .hhVisionTarget{border:1px solid #86dfff;border-radius:999px;background:#122b42;color:#e3fbff;padding:10px 14px;font-weight:750;cursor:pointer;box-shadow:0 0 18px #23c8ff44}
    .hhVisionCard{width:min(325px,calc(100vw - 28px));max-height:55dvh;overflow:auto;border:1px solid #7bdcff;border-radius:18px;padding:13px;background:#071325f7;color:white;box-shadow:0 14px 50px #000b,0 0 25px #54bfff33}
    .hhVisionCardTitle{display:flex;justify-content:space-between;align-items:center;font-weight:850}.hhVisionCardTitle button{border:0;background:transparent;color:white;font-size:24px;cursor:pointer}
    .hhVisionCard p{font-size:12px;color:#bcd7e6}.hhVisionOptions{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .hhVisionOptions button{display:flex;flex-direction:column;text-align:left;gap:4px;border:1px solid #52718a;border-radius:12px;background:#12233d;color:white;padding:10px;cursor:pointer}
    .hhVisionOptions button.chosen{border-color:#62f7cf;box-shadow:0 0 14px #40ffbe77;background:#123e45}.hhVisionOptions small{font-size:10px;color:#b8ccdf;line-height:1.35}
    .hhVisionRun{width:100%;border:0;border-radius:12px;margin-top:10px;padding:11px;color:#061f25;background:#72f6dc;font-weight:900;cursor:pointer}
    @keyframes hhVisionSpin{to{transform:rotate(360deg)}}@keyframes hhVisionCounterSpin{to{transform:rotate(-360deg)}}@media(prefers-reduced-motion:reduce){.hhVisionRing,.hhVisionRing img{animation:none}}
   `}</style>
 </div>;
}
