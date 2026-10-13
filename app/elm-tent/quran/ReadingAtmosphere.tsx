"use client";
import {useEffect,useState} from "react";
type Preset={name:string;background:string;color:string;size:number;light:string};
const defaults:Preset={name:"My Reading",background:"",color:"#f5f1e8",size:32,light:"none"};
const backgrounds=[["Original",""],["Qur'an Studio","/assets/quran-studio-background.PNG"],["Midnight Emerald","emerald-gradient"],["Moonlit Gold","gold-gradient"],["Deep Ocean","ocean-gradient"]];
const lights=["none","moonlight","emerald","warm","focus"];
const backgroundsStyle:Record<string,string>={"emerald-gradient":"radial-gradient(ellipse at 70% 15%,#1c806777,transparent 56%),linear-gradient(150deg,#041c1a,#0b3b30 60%,#061815)","gold-gradient":"radial-gradient(ellipse at 40% 25%,#bfa05d55,transparent 52%),linear-gradient(145deg,#241c13,#3b2f21 60%,#151714)","ocean-gradient":"radial-gradient(ellipse at 65% 25%,#347b9e66,transparent 54%),linear-gradient(150deg,#081827,#112e44,#07131d)"};
export default function ReadingAtmosphere({verse,arabic}:{verse:string;arabic:string}){
 const [open,setOpen]=useState(false),[preset,setPreset]=useState<Preset>(defaults),[saved,setSaved]=useState(false);
 useEffect(()=>{try{const p=localStorage.getItem("1muslim:quran:atmosphere");if(p)setPreset({...defaults,...JSON.parse(p)});}catch{}},[]);
 useEffect(()=>{document.documentElement.style.setProperty("--om-reading-color",preset.color);document.documentElement.style.setProperty("--om-reading-size",preset.size+"px");return()=>{document.documentElement.style.removeProperty("--om-reading-color");document.documentElement.style.removeProperty("--om-reading-size");}},[preset.color,preset.size]);
 const change=(p:Partial<Preset>)=>{const next={...preset,...p};setPreset(next);try{localStorage.setItem("1muslim:quran:atmosphere",JSON.stringify(next));}catch{}};
 const star=()=>{try{const all=JSON.parse(localStorage.getItem("1muslim:quran:stars")||"[]") as Preset[];localStorage.setItem("1muslim:quran:stars",JSON.stringify([...all,preset]));setSaved(true);}catch{}};
 const share=async()=>{const data={verse,arabic,atmosphere:preset};const url=new URL(window.location.href);url.searchParams.set("verse",verse);const caption="My 1Quran reading atmosphere · Qur'an "+verse+"\n"+url.toString();if(navigator.share){try{await navigator.share({title:"1Quran Reading Atmosphere",text:caption,url:url.toString()});return}catch{}}try{await navigator.clipboard.writeText(caption+"\n"+JSON.stringify(data));alert("Reading atmosphere copied. Paste it into a profile post.");}catch{alert("Sharing is unavailable on this device.");}};
 return <div className="omReadingAtmosphere" style={{position:"fixed",right:16,bottom:"calc(90px + env(safe-area-inset-bottom))",zIndex:65}}>
 <style>{` 
 .omReadingAtmosphere{font-family:inherit}
 .omReadingAtmosphere button{font:inherit;cursor:pointer}
 .omReadingAtmosphere .omAtmosphereIcons{display:flex;gap:8px;justify-content:flex-end}
 .omReadingAtmosphere .omAtmosphereIcons button{width:42px;height:42px;border:1px solid #d9c89166;border-radius:50%;color:#f7efd6;background:#0c382f9c;backdrop-filter:blur(18px);opacity:.7;transition:opacity .25s,transform .25s}
 .omReadingAtmosphere .omAtmosphereIcons button:hover,.omReadingAtmosphere .omAtmosphereIcons button:focus-visible{opacity:1;transform:translateY(-2px)}
 .omReadingAtmosphere .omAtmospherePanel{width:min(410px,calc(100vw - 24px));max-height:min(80dvh,760px);overflow:auto;margin-bottom:12px;padding:20px;border-radius:26px;color:#f6f1df;background:linear-gradient(155deg,#164b3deF,#09251fee 80%);border:1px solid #d4c39180;box-shadow:0 24px 90px #0009,inset 0 1px #fff2;backdrop-filter:blur(28px);animation:omAtmosphereRise .3s cubic-bezier(.2,.85,.25,1)}
 .omAtmospherePanel .omAtmosphereClose{float:right;width:34px;height:34px;border:1px solid #ffffff3b;background:#ffffff12;border-radius:50%;color:#f5edd7;font-size:20px}
 .omAtmospherePanel .omAtmosphereEyebrow{display:block;color:#d6c48e;letter-spacing:.17em;font-size:10px;margin-bottom:6px}
 .omAtmospherePanel h2{font-size:23px;margin:0 0 4px}
 .omAtmospherePanel p{opacity:.75;font-size:12px;margin:0 0 16px}
 .omAtmospherePanel .omBackgroundGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
 .omAtmospherePanel .omBackgroundOption{min-width:0;text-align:left;border:1px solid #e6e4ca38;border-radius:16px;padding:6px;background:#ffffff0b;color:#f8f2df}
 .omAtmospherePanel .omBackgroundOption[aria-pressed=true]{border-color:#ebd498;box-shadow:0 0 0 2px #dec98750,0 0 24px #d6bf7950}
 .omAtmospherePanel .omBackgroundOption .omBackgroundThumb{display:block;height:66px;border-radius:11px;background-size:cover;background-position:center;margin-bottom:7px}
 .omAtmospherePanel .omBackgroundOption small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px;padding:0 3px 3px}
 .omAtmospherePanel label{display:grid;gap:8px;margin:17px 0;font-size:13px;color:#f4e8c5}
 .omAtmospherePanel input[type=range]{width:100%;accent-color:#b9d8a2}
 .omAtmospherePanel select{padding:11px 13px;background:#153e32;color:#fff;border:1px solid #9dba9970;border-radius:13px}
 .omAtmospherePanel input[type=color]{width:50px;height:38px;background:transparent;border:0}
 .omAtmospherePanel .omAtmosphereReset{width:100%;border:1px solid #d5c39360;background:#c9d7a61e;color:#f1e4c0;border-radius:13px;padding:11px}
 .omQuranPage .omQuranThreeLayer [lang=ar],.omQuranPage .omQuranThreeLayer .omQuranArabic{color:var(--om-reading-color,inherit)!important;font-size:var(--om-reading-size,inherit)!important}
 @keyframes omAtmosphereRise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
 @media(max-width:700px){.omReadingAtmosphere .omAtmospherePanel{position:fixed;left:0;right:0;bottom:0;width:100%;max-height:88dvh;margin:0;border-radius:26px 26px 0 0;padding:23px 18px max(20px,env(safe-area-inset-bottom))}.omAtmospherePanel .omBackgroundOption .omBackgroundThumb{height:58px}}
 @media(prefers-reduced-motion:reduce){.omReadingAtmosphere *{animation:none!important;transition:none!important}}
 `}</style>
 {open&&<div className="omAtmospherePanel" role="dialog" aria-label="Reading atmosphere settings"><button type="button" className="omAtmosphereClose" onClick={()=>setOpen(false)} aria-label="Close">×</button><span className="omAtmosphereEyebrow">✦ YOUR QUR'AN SPACE</span><h2>Reading Atmosphere</h2><p>Make your reading space your own.</p>
 <strong style={{display:"block",fontSize:13,marginBottom:10}}>Background gallery</strong><div className="omBackgroundGrid">{backgrounds.map(([label,value])=><button type="button" className="omBackgroundOption" key={label} aria-pressed={preset.background===value} onClick={()=>change({background:value})}><span className="omBackgroundThumb" style={{background:value?(backgroundsStyle[value]||`linear-gradient(#082a2355,#082a2355),url("${value}") center / cover`):"linear-gradient(135deg,#162d29,#53776c)"}}/><small>{label}</small></button>)}</div>
 <label>Arabic font size · {preset.size}px<input type="range" min="18" max="60" value={preset.size} onChange={e=>change({size:Number(e.target.value)})}/></label>
 <label>Arabic text color<input type="color" value={preset.color} onChange={e=>change({color:e.target.value})}/></label>
 <label>Reading light<select value={preset.light} onChange={e=>change({light:e.target.value})}>{lights.map(v=><option key={v} value={v}>{v==="none"?"Original":v[0].toUpperCase()+v.slice(1)}</option>)}</select></label>
 <button type="button" className="omAtmosphereReset" onClick={()=>change(defaults)}>↺ Restore original</button>
 </div>}
 <div className="omAtmosphereIcons"><button title="Star reading atmosphere" aria-label="Star reading atmosphere" onClick={star}>{saved?"★":"☆"}</button><button title="Share reading atmosphere" aria-label="Share reading atmosphere" onClick={share}>↗</button><button title="Reading atmosphere settings" aria-label="Reading atmosphere settings" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>◌</button></div>
 {preset.background&&<div aria-hidden="true" style={{position:"fixed",inset:0,zIndex:-1,pointerEvents:"none",backgroundImage:backgroundsStyle[preset.background]||`linear-gradient(#001b1699,#001b1699),url("${preset.background}")`,backgroundSize:"cover",backgroundPosition:"center"}}/>}
 </div>;
}
