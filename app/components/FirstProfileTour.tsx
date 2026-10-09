"use client";
import {useEffect,useState} from "react";
type Tab="profile"|"avatar"|"header"|"live"|"shahada";
const keyPrefix="1muslim-profile-spotlight-v2:";
export default function FirstProfileTour({userId,onNavigate}:{userId:string;onNavigate:(tab:Tab)=>void}){
 const [step,setStep]=useState(-1),[rect,setRect]=useState<DOMRect|null>(null);
 const steps=[
  {selector:".profileOverviewActions .primary",title:"Edit your profile",hint:"Tap the highlighted Edit profile button to begin."},
  {selector:".profileTabs button:nth-child(2)",title:"Explore your avatar",hint:"Tap Avatar & Accessories to see your options."},
  {selector:".profileTabs button:nth-child(3)",title:"Choose a header",hint:"Tap Header Color to customize your profile."}
 ];
 useEffect(()=>{try{if(localStorage.getItem(keyPrefix+userId)!=="done")setStep(0)}catch{setStep(0)}},[userId]);
 const finish=()=>{try{localStorage.setItem(keyPrefix+userId,"done")}catch{}setStep(-1);setRect(null)};
 useEffect(()=>{if(step<0)return;const selector=steps[step].selector;let timer:number;
 const locate=()=>{const el=document.querySelector(selector);if(el){setRect(el.getBoundingClientRect());el.classList.add("hh-spotlight-target")}else setRect(null)};
 const click=(e:Event)=>{const t=e.target as Element;if(t.closest(selector)){if(step===2)finish();else setStep(x=>x+1)}};
 const watch=()=>{locate();timer=window.setTimeout(watch,350)};
 locate();timer=window.setTimeout(watch,350);document.addEventListener("click",click,true);
 return()=>{window.clearTimeout(timer);document.removeEventListener("click",click,true);document.querySelector(selector)?.classList.remove("hh-spotlight-target")};
 },[step]);
 if(step<0||!rect)return null;
 const top=Math.min(window.innerHeight-155,Math.max(12,rect.bottom+14));
 return <div className="hh-profile-guide" aria-live="polite">
 <div className="hh-profile-guide-dim" style={{clipPath:`polygon(0 0,100% 0,100% 100%,0 100%,0 0,${rect.left-9}px ${rect.top-9}px,${rect.left-9}px ${rect.bottom+9}px,${rect.right+9}px ${rect.bottom+9}px,${rect.right+9}px ${rect.top-9}px,${rect.left-9}px ${rect.top-9}px)`}}/>
 <div className="hh-profile-ring" style={{left:rect.left-7,top:rect.top-7,width:rect.width+14,height:rect.height+14}}/>
 <div className="hh-profile-tip" style={{top,left:Math.max(12,Math.min(rect.left,window.innerWidth-305))}}><small>✦ {step+1} / 3 · HUDHUD GUIDE</small><strong>{steps[step].title}</strong><p>{steps[step].hint}</p><button type="button" onClick={finish}>Skip guide ×</button></div>
 <style jsx>{`
 .hh-profile-guide{position:fixed;inset:0;z-index:2800;pointer-events:none}
 .hh-profile-guide-dim{position:absolute;inset:0;background:rgba(0,24,17,.46);pointer-events:none}
 .hh-profile-ring{position:absolute;border:2px solid #80ffd5;border-radius:15px;box-shadow:0 0 0 5px #6cffb333,0 0 28px #5affba;animation:hhSpotPulse 1.6s ease-in-out infinite;pointer-events:none}
 .hh-profile-tip{position:absolute;width:min(290px,calc(100vw - 24px));padding:15px;border:1px solid #8af2d1;border-radius:17px;background:rgba(7,43,32,.87);backdrop-filter:blur(13px);box-shadow:0 10px 40px #0007;color:#effff6;pointer-events:auto}
 .hh-profile-tip small{color:#a6ffe0;font-size:10px;letter-spacing:.1em}.hh-profile-tip strong{display:block;margin:8px 0;font-size:17px}.hh-profile-tip p{font-size:12px;line-height:1.5;margin:5px 0 9px}.hh-profile-tip button{border:0;background:transparent;color:#b3e9d8;text-decoration:underline;font-size:11px}
 @keyframes hhSpotPulse{50%{box-shadow:0 0 0 9px #6cffb322,0 0 37px #8fffe2}}
 @media(prefers-reduced-motion:reduce){.hh-profile-ring{animation:none}}
 `}</style>
 </div>
}
