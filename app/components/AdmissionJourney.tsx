"use client";
import {useEffect,useState} from "react";
import {usePathname} from "next/navigation";
type Props={stage:1|2|3;detail?:string;compact?:boolean};
const stages=[{title:"Shahada",subtitle:"Begin · declare"},{title:"Account",subtitle:"Secure sign-in · save"},{title:"Admission",subtitle:"Entry · badge & XP"}] as const;
/** Visual journey only: stage 3 is not complete until onboarding saves successfully. */
export default function AdmissionJourney({stage,detail,compact=false}:Props){
 const pathname=usePathname()||"/";
 const [expanded,setExpanded]=useState(false);
 const [theme,setTheme]=useState<"day"|"night">("night");
 const [tip,setTip]=useState("");
 const tips=pathname.startsWith("/onboarding")?{
  initial:"Start with the HudHud recording orb, or select Arabic, English, or the self-attested declaration.",
  field:"This field is part of your profile setup. Review your choice before continuing.",
  button:"Tap to advance only when you have completed the required declaration and terms.",
  checkbox:"A checkbox records your own affirmation; it is not independent voice verification."
 }:pathname.startsWith("/auth")?{
  initial:"New members begin with HudHud Shahada. Create an account to securely save the recording, or sign in if already registered.",
  field:"Enter your account details. Your password is never read or saved by HudHud tips.",
  button:"Choose your sign-in method or start the Shahada process.",
  checkbox:"Read the declaration carefully before confirming your intention."
 }:{
  initial:"Open the page controls to explore the available actions.",
  field:"Check the field label before entering information.",
  button:"Tap this control to use its page action.",
  checkbox:"Review what this option enables before selecting it."
 };
 useEffect(()=>{try{setTheme(localStorage.getItem("1muslim-theme")==="light"?"day":"night")}catch{}},[]);
 useEffect(()=>{
  if(!expanded)return;
  const inspect=(event:Event)=>{
   const el=event.target instanceof Element?event.target:null;
   const target=el?.closest("input,textarea,select,button,a,[role=button]");
   if(!target||target.closest(".admissionJourney"))return;
   const type=target.getAttribute("type");
   const label=target.getAttribute("aria-label")||target.closest("label")?.textContent?.trim()||target.textContent?.trim()||target.getAttribute("placeholder")||"";
   const category=type==="checkbox"?"checkbox":target.matches("input,textarea,select")?"field":"button";
   const safeLabel=label.replace(/\\s+/g," ").slice(0,65);
   setTip((safeLabel?safeLabel+" — ":"")+tips[category]);
  };
  document.addEventListener("focusin",inspect);
  document.addEventListener("click",inspect);
  return()=>{document.removeEventListener("focusin",inspect);document.removeEventListener("click",inspect)};
 },[expanded,pathname]);
 const toggleTheme=()=>{
  const next=theme==="night"?"day":"night";setTheme(next);
  try{localStorage.setItem("1muslim-theme",next==="day"?"light":"dark");localStorage.setItem("1muslim-theme-mode",next)}catch{}
  window.dispatchEvent(new Event("1muslim:theme-changed"));
 };
 return <section className={"admissionJourney "+(compact?"admissionCompact":"")} aria-label="Your 1Muslim admission journey">
 <div className="admissionHeading"><button type="button" className="admissionToggle" aria-expanded={expanded} onClick={()=>{setExpanded(v=>!v);setTip(tips.initial)}}>✧ HUDHUD VISION · YOUR JOURNEY <span>{expanded?"−":"+"}</span></button><span>STEP {stage} OF 3</span></div>
 <div className="admissionStages">{stages.map((s,i)=><div key={s.title} className={"admissionStage "+(stage>i+1?"done":stage===i+1?"current":"upcoming")} aria-current={stage===i+1?"step":undefined}><span className="admissionDot">{stage>i+1?"✓":i+1}</span><strong>{s.title}</strong><small>{s.subtitle}</small></div>)}</div>
 <div className="admissionBar" role="progressbar" aria-label="Admission journey stage" aria-valuemin={0} aria-valuemax={3} aria-valuenow={stage-1}><span style={{width:`${(stage-1)/3*100}%`}}/></div>
 {detail&&<p className="admissionDetail">{detail}</p>}{expanded&&<div className="admissionSmart"><div className="admissionSmartTop"><strong>PAGE ASSISTANT</strong><button type="button" onClick={toggleTheme} aria-label={theme==="night"?"Switch to day mode":"Switch to night mode"} className="admissionThemeOrb">{theme==="night"?"☾":"☀"}</button></div><p>{tip||tips.initial}</p><div className="admissionQuickActions"><button type="button" onClick={()=>setTip(tips.initial)}>Page tips</button><button type="button" onClick={()=>setTip("Focus or tap a field, checkbox, or button for a contextual explanation. Tips never inspect what you type.")}>Tap guidance</button><button type="button" onClick={()=>setTip("Your progress is shown above. Badge and XP rewards are granted only by the actual admission process.")}>Rewards</button></div></div>}
 <style jsx>{`
 .admissionToggle{border:0;background:transparent;color:inherit;font:inherit;letter-spacing:inherit;text-align:left;cursor:pointer;display:flex;gap:8px;align-items:center}.admissionToggle span{font-size:15px} .admissionToggle:focus-visible{outline:2px solid #d8cb8b;outline-offset:3px;border-radius:4px}\n .admissionSmart{margin-top:10px;padding:11px;border:1px solid #b5d3a45c;border-radius:13px;background:#061c15e8}.admissionSmartTop{display:flex;align-items:center;justify-content:space-between;font-size:10px;letter-spacing:.12em;color:#d9ca94}.admissionThemeOrb{display:grid;place-items:center;width:36px;height:36px;border-radius:50%;border:1px solid #dfc58c;background:radial-gradient(circle at 35% 30%,#366f51,#10251c);box-shadow:0 0 15px #c9b97770;color:#f3dda0;font-size:22px;cursor:pointer}.admissionSmart p{font-size:11px;line-height:1.5;color:#dce9d9}.admissionQuickActions{display:flex;flex-wrap:wrap;gap:6px}.admissionQuickActions button{padding:7px 9px;border:1px solid #9ab9946e;border-radius:9px;background:#153e2e;color:#e9e5cd;font-size:10px;cursor:pointer}\n .admissionJourney{padding:12px 14px;border:1px solid #c7c88a6a;border-radius:17px;background:linear-gradient(130deg,#09251dd9,#05120eee);box-shadow:inset 0 1px #e2ebd41b,0 0 20px #b8d98717;color:#e8f1df}
 .admissionHeading{display:flex;justify-content:space-between;gap:8px;font-size:9px;letter-spacing:.15em;color:#d5cb96}
 .admissionStages{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0 10px}
 .admissionStage{display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;opacity:.46;min-width:0}
 .admissionStage.current,.admissionStage.done{opacity:1}
 .admissionDot{display:grid;place-items:center;width:25px;height:25px;border-radius:50%;border:1px solid #a4c89d77;background:#0e3326;color:#e4d49b;font-size:12px}
 .current .admissionDot{box-shadow:0 0 17px #b9e6a477;border-color:#d9d194}
 .done .admissionDot{background:#2c6845}
 .admissionStage strong{font-size:11px}.admissionStage small{font-size:9px;line-height:1.3;color:#b9c8b6}
 .admissionBar{height:4px;background:#ffffff21;border-radius:10px;overflow:hidden}
 .admissionBar span{display:block;height:100%;background:linear-gradient(90deg,#58d992,#d8c58a);transition:width .5s ease}
 .admissionDetail{font-size:10px;line-height:1.4;color:#cbd9c5;margin:7px 0 0}
 .admissionCompact{padding:9px 11px}.admissionCompact .admissionStages{margin:8px 0}.admissionCompact .admissionStage small{font-size:8px}
 @media(prefers-reduced-motion:reduce){.admissionBar span{transition:none}}
 `}</style></section>
}