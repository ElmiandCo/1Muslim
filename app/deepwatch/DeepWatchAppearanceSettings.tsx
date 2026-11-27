"use client";

import {useEffect,useState} from "react";
import Link from "next/link";
import {readLocation} from "../components/LocationPreferences";
import {DEEPWATCH_THEME_EVENT,readDeepWatchThemeMode,setDeepWatchThemeMode,type DeepWatchThemeMode} from "./useDeepWatchSolarTheme";

export default function DeepWatchAppearanceSettings(){
 const [mode,setMode]=useState<DeepWatchThemeMode>("auto");
 const [city,setCity]=useState("");
 useEffect(()=>{
  const update=()=>{setMode(readDeepWatchThemeMode());const loc=readLocation();setCity(loc.city&&loc.country?[loc.city,loc.state].filter(Boolean).join(", "):"")};
  update();
  window.addEventListener(DEEPWATCH_THEME_EVENT,update);
  window.addEventListener("1muslim:location-updated",update);
  window.addEventListener("storage",update);
  return()=>{window.removeEventListener(DEEPWATCH_THEME_EVENT,update);window.removeEventListener("1muslim:location-updated",update);window.removeEventListener("storage",update)};
 },[]);
 return <section id="deepwatch-appearance" className="settingsCard" data-no-tap-shimmer style={{display:"block"}} aria-label="DeepWatch appearance settings">
  <div className="settingCopy"><span className="settingIcon" aria-hidden="true">◐</span><div>
   <span className="eyebrow">DEEPWATCH · SUNRISE / SUNSET</span><h2>Video platform appearance</h2>
   <p>Auto switches to day at sunrise and night at sunset, using the city saved for your prayer times. No new location permission is requested.</p>
  </div></div>
  <div role="group" aria-label="DeepWatch appearance" style={{display:"flex",gap:9,flexWrap:"wrap",marginTop:16}}>
   {(["auto","day","night"] as const).map(value=><button key={value} type="button" aria-pressed={mode===value} onClick={()=>{setDeepWatchThemeMode(value);setMode(value)}}
    style={{minHeight:44,padding:"10px 18px",borderRadius:999,border:mode===value?"2px solid #cda65a":"1px solid #698d7b",background:mode===value?"#205b48":"transparent",color:"inherit",fontWeight:700,cursor:"pointer"}}>
     {value==="auto"?"◉ Auto · Sunrise / sunset":value==="day"?"☀ Day":"◐ Night"}
   </button>)}
  </div>
  <p style={{fontSize:12,lineHeight:1.6,marginTop:12,opacity:.8}}>
   {city?"Using "+city+" for sunrise and sunset.":"No saved prayer city yet. Auto follows your device appearance until you set a city."}{" "}
   <Link href="/settings#location-preferences" style={{textDecoration:"underline"}}>Update location</Link>
  </p>
 </section>;
}
