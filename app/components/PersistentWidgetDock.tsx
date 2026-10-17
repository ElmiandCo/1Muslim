"use client";
import {useEffect,useState} from "react";
import {usePathname} from "next/navigation";
import {setSiteLanguage,type SiteLanguage} from "./SiteLanguageBridge";
export default function PersistentWidgetDock(){
const [open,setOpen]=useState(false);const [lang,setLang]=useState<SiteLanguage>("en");const [light,setLight]=useState(false);const pathname=usePathname();
useEffect(()=>{try{const saved=localStorage.getItem("1muslim:language");setLang(saved==="so"||saved==="ar"?saved:"en");setLight(document.documentElement.classList.contains("light"))}catch{}},[]);
const choose=(value:SiteLanguage)=>{setLang(value);setSiteLanguage(value);setOpen(false)};
const toggleDay=()=>{const next=!light;setLight(next);document.documentElement.classList.toggle("light",next);try{localStorage.setItem("1muslim-theme",next?"light":"dark")}catch{}window.dispatchEvent(new Event("1muslim:theme-changed"))};
if(pathname==="/onboarding")return null;
const glass="linear-gradient(135deg,rgba(19,52,47,.49),rgba(8,27,26,.38))";
return <aside aria-label="Language and settings" style={{position:"fixed",right:14,bottom:"calc(env(safe-area-inset-bottom, 0px) + 88px)",zIndex:90,display:"grid",justifyItems:"end",gap:8,pointerEvents:"none"}}>
{open&&<nav aria-label="Language and appearance settings" style={{display:"grid",gap:8,padding:14,width:"min(250px,calc(100vw - 28px))",border:"1px solid #e5d59a66",borderRadius:22,background:glass,backdropFilter:"blur(24px) saturate(1.3)",WebkitBackdropFilter:"blur(24px) saturate(1.3)",boxShadow:"0 10px 38px #0005",pointerEvents:"auto",color:"#f7edcf"}}>
<strong style={{fontSize:14,fontWeight:600}}>🌐 {lang==="ar"?"اللغة":lang==="so"?"Luqadda":"Language"}</strong>
{([["en","🇺🇸 English"],["so","🇸🇴 Af-Soomaali"],["ar","🇸🇦 العربية"]] as const).map(([value,label])=><button key={value} type="button" onClick={()=>choose(value)} aria-pressed={lang===value} style={{border:lang===value?"1px solid #f3db96a6":"1px solid #ffffff23",borderRadius:12,background:lang===value?"#d8bd7840":"#ffffff0a",color:"#fff1cd",padding:"11px 12px",textAlign:"start",fontSize:14,cursor:"pointer"}}>{label} {lang===value?"✓":""}</button>)}
<div style={{height:1,background:"#e7d5a73d",margin:"3px 0"}}/>
<button type="button" onClick={toggleDay} style={{border:"1px solid #ffffff29",borderRadius:12,background:"#ffffff0b",color:"#fff1cd",padding:"11px 12px",fontSize:14,cursor:"pointer",textAlign:"start"}}>{light?"🌙":"☀️"} {lang==="ar"?"النهار / الليل":lang==="so"?"Maalin / Habeen":"Day / Night"} <span style={{float:"right"}}>{light?"☀":"☾"}</span></button>
<a href="/settings" style={{border:"1px solid #ffffff29",borderRadius:12,background:"#ffffff0b",color:"#fff1cd",padding:"11px 12px",fontSize:14,textDecoration:"none"}}>⚙️ {lang==="ar"?"الإعدادات":lang==="so"?"Dejinta":"Settings"} ↗</a>
</nav>}
<button type="button" onClick={()=>setOpen(v=>!v)} aria-expanded={open} aria-label={open?"Close language and settings":"Open language and settings"} style={{pointerEvents:"auto",width:43,height:43,borderRadius:22,border:"1px solid #e5d59a85",background:glass,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",color:"#f4db9b",boxShadow:"0 3px 14px #0004",fontSize:21,cursor:"pointer"}}>{open?"×":"🌐"}</button>
</aside>;
}
