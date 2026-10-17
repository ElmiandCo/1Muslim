"use client";

import {useEffect,useState} from "react";
import {usePathname} from "next/navigation";
import {applyPalette,PALETTES,PALETTE_KEY,type Palette} from "./ColorPaletteSync";

const names:Record<Palette,string>={green:"Emerald",blue:"Blue","gray-coral":"Gray / Coral",yellow:"Yellow",pink:"Pink"};
const colors:Record<Palette,[string,string]>={green:["#064c39","#a4e4b8"],blue:["#143963","#8bc9fa"],"gray-coral":["#484950","#f3a99b"],yellow:["#6e551b","#ffdc72"],pink:["#763557","#ffc1e3"]};


export default function GuestColorPreview(){
 const pathname=usePathname();
 const [ready,setReady]=useState(false);
 const [open,setOpen]=useState(false);
 
 const [palette,setPalette]=useState<Palette>("green");
 const [day,setDay]=useState<boolean|null>(null);
 const [language,setLanguage]=useState("en");
 const [sound,setSound]=useState(false);
 const [haptics,setHaptics]=useState(true);
 const [touchLight,setTouchLight]=useState(false);
 useEffect(()=>{
  const openFromOrb=()=>setOpen(true);
  window.addEventListener("1muslim:open-color-settings",openFromOrb);
  try{
   setPalette(applyPalette(localStorage.getItem(PALETTE_KEY)));

  }catch{}
  setDay(document.documentElement.classList.contains("light"));
  try{setLanguage(localStorage.getItem("1muslim-language")||"en");setSound(localStorage.getItem("1muslim:ui-sound")==="on");setHaptics(localStorage.getItem("1muslim:ui-haptics")!=="off");setTouchLight(localStorage.getItem("1muslim:touch-light")==="on")}catch{}
  setReady(true);
  return()=>window.removeEventListener("1muslim:open-color-settings",openFromOrb);
 },[]);
 if(!ready || (pathname!=="/" && pathname!=="/auth" && pathname!=="/settings"))return null;
 const choose=(value:Palette)=>{
  setPalette(value);
  try{localStorage.setItem(PALETTE_KEY,value)}catch{}
  applyPalette(value);
  window.dispatchEvent(new Event("1muslim:palette-changed"));
 };
 const changeLight=(light:boolean)=>{
  setDay(light);
  document.documentElement.classList.toggle("light",light);
  document.body.classList.toggle("light",light);
  try{localStorage.setItem("1muslim-theme-mode",light?"day":"night")}catch{}
  window.dispatchEvent(new Event("1muslim:theme-changed"));
 };
 const close=()=>{
  setOpen(false);

 };
 return <div className="guestColorPreviewRoot">

  {open&&<div className="guestColorPreviewBackdrop" onPointerDown={e=>{if(e.target===e.currentTarget)close()}}>
   <section className="guestColorPreviewPanel" role="dialog" aria-modal="true" aria-labelledby="guestColorPreviewTitle">
    <header><div><span className="guestColorPreviewEyebrow">1MUSLIM · LIVE COLOR TEST</span><h2 id="guestColorPreviewTitle">Make it yours 🎨</h2><p>Try a color instantly, without leaving this page.</p></div><button type="button" className="guestColorPreviewClose" onClick={close} aria-label="Save and close">×</button></header>
    <div className="guestColorPreviewSwatches guestColorPreviewCompact" role="group" aria-label="Choose color">
     {PALETTES.map(value=><button type="button" key={value} onClick={()=>choose(value)} aria-pressed={palette===value} className={palette===value?"guestColorPreviewSelected":""}>
      <span className="guestColorPreviewSwatch" style={{background:`linear-gradient(135deg,${colors[value][0]} 50%,${colors[value][1]} 50%)`}}/>
      <span>{names[value]}</span><span aria-hidden="true">{palette===value?"✓":""}</span>
     </button>)}
    </div>
    <div className="guestColorPreviewDayNight" role="group" aria-label="Preview lighting">
     <span>Lighting</span><button type="button" aria-pressed={day===true} onClick={()=>changeLight(true)}>☀ Day</button><button type="button" aria-pressed={day===false} onClick={()=>changeLight(false)}>☾ Night</button>
    </div>
    <div className="guestColorPreviewPreferences" role="group" aria-label="Sound, haptics and touch lighting">
      <label>🔊 Sounds <input type="checkbox" checked={sound} onChange={e=>{const on=e.target.checked;setSound(on);localStorage.setItem("1muslim:ui-sound",on?"on":"off");window.dispatchEvent(new CustomEvent("1muslim:ui-preferences-changed",{detail:{sound:on}}))}}/></label>
      <label>📳 Haptics <input type="checkbox" checked={haptics} onChange={e=>{const on=e.target.checked;setHaptics(on);localStorage.setItem("1muslim:ui-haptics",on?"on":"off");window.dispatchEvent(new CustomEvent("1muslim:ui-preferences-changed",{detail:{haptics:on}}));if(on&&navigator.vibrate)navigator.vibrate(15)}}/></label>
      <label>✨ Touch light <input type="checkbox" checked={touchLight} onChange={e=>{const on=e.target.checked;setTouchLight(on);localStorage.setItem("1muslim:touch-light",on?"on":"off");document.documentElement.dataset.touchLight=on?"on":"off";window.dispatchEvent(new CustomEvent("1muslim:ui-preferences-changed",{detail:{touchLight:on}}))}}/></label>
    </div>
    <div className="guestColorPreviewLanguage"><label htmlFor="guestColorPreviewLanguage">🌐 Language</label><select id="guestColorPreviewLanguage" value={language} onChange={e=>{const value=e.target.value;setLanguage(value);try{localStorage.setItem("1muslim-language",value)}catch{}document.documentElement.lang=value;window.dispatchEvent(new CustomEvent("1muslim:language-changed",{detail:{language:value}}))}}><option value="en">English</option><option value="ar">العربية</option><option value="so">Soomaali</option></select></div>
    <p className="guestColorPreviewLanguageNote">Language preference is saved. Full translations are coming later.</p>
    <p className="guestColorPreviewNote">Changes apply live and save on this device. Public profile colors require sign-in.</p>
    <button type="button" className="guestColorPreviewDone" onClick={close}>Save & see the result ✓</button>
   </section>
  </div>}
 </div>;
}
