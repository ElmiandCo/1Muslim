"use client";
import {useEffect,useState} from "react";
import {createClient} from "../../utils/supabase/client";

const aliases:Record<string,string>={"rose-gold":"ruby","silver-dust":"titanium","carbon-fiber":"obsidian"};
const themes:Record<string,{base:string;accent:string;secondary:string;surface:string;edge:string;tint:string}>={
 emerald:{base:"#052b22",accent:"#22bd83",secondary:"#d9bd70",surface:"#073c30",edge:"#54d5a3",tint:"rgba(3,27,21,.3)"},
 sapphire:{base:"#06182f",accent:"#398fff",secondary:"#cbdcff",surface:"#10294b",edge:"#73b6ff",tint:"rgba(2,14,39,.45)"},
 ruby:{base:"#310b15",accent:"#ed3652",secondary:"#f7bd75",surface:"#4a1422",edge:"#ff6983",tint:"rgba(42,5,14,.46)"},
 amethyst:{base:"#270b39",accent:"#c85cf5",secondary:"#ff9ed9",surface:"#39134e",edge:"#e9a0ff",tint:"rgba(30,5,48,.43)"},
 titanium:{base:"#111419",accent:"#b6c3d1",secondary:"#e1e7ef",surface:"#222932",edge:"#cbd5e1",tint:"rgba(5,8,14,.52)"},
 obsidian:{base:"#0b0b0c",accent:"#e2b75e",secondary:"#ffdb8b",surface:"#1c1914",edge:"#e6bc65",tint:"rgba(0,0,0,.62)"}
};
const fallback="emerald";
let recognitionFadeTimer:ReturnType<typeof setTimeout>|undefined;
function applyTheme(value:unknown,persist=true){
 const requested=typeof value==="string"?value:fallback;
 const theme=themes[aliases[requested]||requested]?aliases[requested]||requested:fallback;
 const t=themes[theme];const root=document.documentElement;
 const previousImage=root.style.getPropertyValue("--profile-scene-image");
 const previousTint=root.style.getPropertyValue("--profile-scene-tint");
 if(persist&&previousImage&&previousImage!==`url("/assets/profile-backgrounds/${({ruby:"rose-gold",titanium:"silver-dust",obsidian:"carbon-fiber"} as Record<string,string>)[theme]||theme}.PNG")`){
  root.style.setProperty("--guest-previous-scene-image",previousImage);
  root.style.setProperty("--guest-previous-scene-tint",previousTint||"transparent");
  root.dataset.guestImageFade=root.dataset.guestImageFade==="even"?"odd":"even";
  if(recognitionFadeTimer)clearTimeout(recognitionFadeTimer);
  recognitionFadeTimer=setTimeout(()=>{delete root.dataset.guestImageFade;root.style.removeProperty("--guest-previous-scene-image");root.style.removeProperty("--guest-previous-scene-tint")},2100);
 }
 root.dataset.profileBackground=theme;root.dataset.muslimTheme=theme;
 root.style.setProperty("--theme-base",t.base);root.style.setProperty("--theme-accent",t.accent);root.style.setProperty("--theme-secondary",t.secondary);root.style.setProperty("--theme-surface",t.surface);root.style.setProperty("--theme-edge",t.edge);
 root.style.setProperty("--profile-scene-image",`url("/assets/profile-backgrounds/${({ruby:"rose-gold",titanium:"silver-dust",obsidian:"carbon-fiber"} as Record<string,string>)[theme]||theme}.PNG")`);
 root.style.setProperty("--profile-scene-tint",t.tint);
 if(persist){try{localStorage.setItem("1muslim:profile-background",theme)}catch{}}
 if(persist&&(theme==="obsidian"||theme==="titanium")){try{localStorage.setItem("1muslim-theme-mode","night");localStorage.setItem("1muslim-theme","dark")}catch{};root.classList.remove("light")}
}
export default function ProfileThemeSync(){
 const [recognizing,setRecognizing]=useState(true);
 const [visible,setVisible]=useState(true);
 const [preview,setPreview]=useState("emerald");
 useEffect(()=>{
  let active=true;let settled=false;
  const palette=["emerald","sapphire","ruby","amethyst","titanium","obsidian"];
  let index=0;
  const cycle=window.setInterval(()=>{if(!active||settled)return;index=(index+1)%palette.length;const next=palette[index];applyTheme(next,false);setPreview(next)},1250);
  applyTheme(palette[0],false);
  const initial=(()=>{try{return localStorage.getItem("1muslim:profile-background")||fallback}catch{return fallback}})();
  const start=performance.now();
  const settle=(theme:string)=>{if(!active)return;const first=!settled;settled=true;window.clearInterval(cycle);applyTheme(theme);setPreview(aliases[theme]||theme);if(first){window.setTimeout(()=>{if(active){setVisible(false);window.setTimeout(()=>{if(active)setRecognizing(false)},1400)}},Math.max(0,1100-(performance.now()-start)))}};
  const db=createClient();
  const refresh=async()=>{
   try{
    const {data:{user}}=await db.auth.getUser();
    if(!active)return;
    if(!user){settle(initial);return}
    const {data}=await db.from("profiles").select("avatar_config").eq("id",user.id).maybeSingle();
    settle((data?.avatar_config as {profileBackgroundTheme?:string}|null)?.profileBackgroundTheme||initial);
   }catch{settle(initial)}
  };
  void refresh();
  const {data:{subscription}}=db.auth.onAuthStateChange(()=>{void refresh()});
  const onChange=(event:Event)=>{const theme=(event as CustomEvent<string>).detail;if(typeof theme==="string")settle(theme);else void refresh()};
  window.addEventListener("1muslim:profile-background-changed",onChange);
  return()=>{active=false;window.clearInterval(cycle);subscription.unsubscribe();window.removeEventListener("1muslim:profile-background-changed",onChange)};
 },[]);
 return <>
  {recognizing&&<div className={visible?"themeRecognitionIntro":"themeRecognitionIntro themeRecognitionDone"} aria-hidden="true"><div className="themeRecognitionWallpaper" style={{backgroundImage:`url("/assets/profile-backgrounds/${({ruby:"rose-gold",titanium:"silver-dust",obsidian:"carbon-fiber"} as Record<string,string>)[preview]||preview}.PNG")`}}/><div className="themeRecognitionGlow"/><div className="themeRecognitionButtons"><i/><i/><i/><i/><i/><i/></div></div>}
  <style>{`
   .themeRecognitionIntro{position:fixed;inset:0;z-index:15;pointer-events:none;overflow:hidden;opacity:.78;transition:opacity 1.4s ease;background:linear-gradient(125deg,rgba(9,74,61,.18),rgba(30,83,159,.2),rgba(104,42,129,.17),rgba(127,81,35,.16));background-size:400% 400%;animation:themeIntroShift 9s ease-in-out infinite}
   .themeRecognitionDone{opacity:0!important}\n   .themeRecognitionWallpaper{position:absolute;inset:0;opacity:.16;background-size:cover;background-position:center;filter:blur(9px);animation:themeIntroFloat 7s ease-in-out infinite alternate}\n   html:has(.themeRecognitionIntro) button{transition:background-color 2s ease,border-color 2s ease,color 2s ease,box-shadow 2s ease!important}\n   .themeRecognitionGlow{position:absolute;inset:-20%;background:radial-gradient(circle at 25% 35%,rgba(42,167,222,.16),transparent 55%),radial-gradient(circle at 80% 70%,rgba(209,115,215,.12),transparent 55%);animation:themeIntroFloat 7s ease-in-out infinite alternate}
   .themeRecognitionButtons{position:absolute;bottom:13%;left:50%;transform:translateX(-50%);display:flex;gap:12px;opacity:.55}
   .themeRecognitionButtons i{width:8px;height:8px;border-radius:50%;background:#4ec8a5;box-shadow:0 0 12px currentColor;animation:themeIntroButton 6s ease-in-out infinite}
   .themeRecognitionButtons i:nth-child(2){animation-delay:-1s}.themeRecognitionButtons i:nth-child(3){animation-delay:-2s}.themeRecognitionButtons i:nth-child(4){animation-delay:-3s}.themeRecognitionButtons i:nth-child(5){animation-delay:-4s}.themeRecognitionButtons i:nth-child(6){animation-delay:-5s}
   @keyframes themeIntroShift{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
   @keyframes themeIntroFloat{from{transform:translate3d(-1%,1%,0) scale(1)}to{transform:translate3d(1%,-1%,0) scale(1.05)}}
   @keyframes themeIntroButton{0%,100%{background:#37bb8b;opacity:.4;transform:scale(.8)}33%{background:#4f9eff;opacity:1;transform:scale(1.3)}66%{background:#cf7de7;opacity:.7;transform:scale(1)}}
   @media(prefers-reduced-motion:reduce){.themeRecognitionIntro,.themeRecognitionGlow,.themeRecognitionButtons i{animation:none!important}}
  `}</style>
 </>;
}
