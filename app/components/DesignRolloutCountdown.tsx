"use client";
import {useEffect,useState} from "react";
const LAUNCH_AT=Date.parse("2026-10-13T12:25:00Z");
function format(ms:number){const seconds=Math.max(0,Math.ceil(ms/1000));const m=Math.floor(seconds/60),s=seconds%60;return String(m).padStart(2,"0")+":"+String(s).padStart(2,"0")}
export default function DesignRolloutCountdown(){
 const [remaining,setRemaining]=useState<number|null>(null);
 useEffect(()=>{const tick=()=>setRemaining(Math.max(0,LAUNCH_AT-Date.now()));tick();const id=window.setInterval(tick,1000);return()=>window.clearInterval(id)},[]);
 if(remaining===null)return null;
 return <aside className="designRolloutBanner" role="status" aria-label="New design rollout countdown">
 <span className="designRolloutStar" aria-hidden="true">✦</span>
 <span className="designRolloutText"><strong>New 1Muslim Design Rollout</strong><small>{remaining>0?"Coming in":"Scheduled rollout time reached · awaiting launch"}</small></span>
 {remaining>0&&<time className="designRolloutClock" dateTime="2026-10-13T12:25:00Z" aria-label={format(remaining)+" remaining"}>{format(remaining)}</time>}
 <style>{`
 .designRolloutBanner{position:fixed;top:env(safe-area-inset-top,0px);left:50%;transform:translateX(-50%);z-index:9000;box-sizing:border-box;display:flex;align-items:center;gap:12px;width:min(calc(100% - 22px),570px);padding:10px 15px;border:1px solid #d5bc77a8;border-radius:0 0 19px 19px;background:linear-gradient(105deg,#08271fef,#174d38f5);color:#f9f4e5;box-shadow:0 8px 32px #00150d80;backdrop-filter:blur(12px);font-family:inherit;pointer-events:none}
 .designRolloutStar{font-size:21px;color:#e6c47d}.designRolloutText{display:flex;flex-direction:column;min-width:0;flex:1;line-height:1.3}.designRolloutText strong{font-size:clamp(12px,2.7vw,15px);font-weight:800;letter-spacing:.015em}.designRolloutText small{font-size:clamp(10px,2.3vw,12px);color:#e5d0a0;margin-top:3px}.designRolloutClock{font-variant-numeric:tabular-nums;letter-spacing:.06em;color:#f6db98;font-size:clamp(19px,4vw,25px);font-weight:800;white-space:nowrap}
 @media(max-width:390px){.designRolloutBanner{gap:8px;padding:8px 10px}.designRolloutStar{font-size:17px}}
 `}</style></aside>;
}
