"use client";

import {useEffect,useState} from "react";
import {readLocation} from "../components/LocationPreferences";

/** DeepWatch appearance stays separate from the site's Canvas theme. */
export type DeepWatchThemeMode="auto"|"day"|"night";
export const DEEPWATCH_THEME_KEY="1muslim:deepwatch:theme-mode";
export const DEEPWATCH_THEME_EVENT="1muslim:deepwatch-theme-updated";
type Daylight={date:string;timezone:string;times:{Sunrise:string;Maghrib:string}};
type Appearance={night:boolean;source:"sun"|"device"|"manual";detail:string};
const DEVICE_FALLBACK="Set your prayer city in Settings for exact local sunrise and sunset. Until then, Auto follows your device appearance.";

export function readDeepWatchThemeMode():DeepWatchThemeMode{
 if(typeof window==="undefined")return "auto";
 try{const value=localStorage.getItem(DEEPWATCH_THEME_KEY);return value==="day"||value==="night"?value:"auto"}catch{return "auto"}
}
export function setDeepWatchThemeMode(mode:DeepWatchThemeMode){
 if(typeof window==="undefined")return;
 try{localStorage.setItem(DEEPWATCH_THEME_KEY,mode)}catch{}
 window.dispatchEvent(new Event(DEEPWATCH_THEME_EVENT));
}
function minute(time:string):number|null{
 const m=/^(\d{1,2}):(\d{2})/.exec(time);
 if(!m||+m[1]>23||+m[2]>59)return null;
 return Number(m[1])*60+Number(m[2]);
}
function zonedParts(date:Date,timeZone:string){
 try{
  const parts=new Intl.DateTimeFormat("en-US",{timeZone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(date);
  const n=(key:string)=>Number(parts.find(x=>x.type===key)?.value);
  const year=n("year"),month=n("month"),day=n("day"),hour=n("hour"),minute=n("minute");
  if(![year,month,day,hour,minute].every(Number.isFinite))return null;
  return {date:[year,String(month).padStart(2,"0"),String(day).padStart(2,"0")].join("-"),minute:hour*60+minute};
 }catch{return null}
}
export function isAfterSunsetOrBeforeSunrise(now:Date,schedule:Daylight):boolean|null{
 const zone=zonedParts(now,schedule.timezone);
 const rise=minute(schedule.times.Sunrise),set=minute(schedule.times.Maghrib);
 if(!zone||zone.date!==schedule.date||rise===null||set===null||rise>=set)return null;
 return zone.minute<rise||zone.minute>=set;
}
function currentDate(){
 const now=new Date();
 return [now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
}

export function useDeepWatchSolarTheme(){
 const [mode,setMode]=useState<DeepWatchThemeMode>("auto");
 const [appearance,setAppearance]=useState<Appearance>({night:true,source:"device",detail:DEVICE_FALLBACK});
 useEffect(()=>{
  let alive=true;
  let schedule:Daylight|null=null;
  let lastLookup="";
  let working=false;
  const darkQuery=window.matchMedia("(prefers-color-scheme: dark)");
  const update=()=>{
   const preference=readDeepWatchThemeMode();
   setMode(preference);
   if(preference==="night"||preference==="day"){
    setAppearance({night:preference==="night",source:"manual",detail:preference==="night"?"Night appearance selected.":"Day appearance selected."});
    return;
   }
   const fromSun=schedule?isAfterSunsetOrBeforeSunrise(new Date(),schedule):null;
   setAppearance(fromSun===null
    ?{night:darkQuery.matches,source:"device",detail:DEVICE_FALLBACK}
    :{night:fromSun,source:"sun",detail:"Auto follows sunrise and sunset in your saved prayer city."});
  };
  const refresh=async()=>{
   if(!alive||working)return;
   const saved=readLocation();
   const key=[saved.city,saved.state,saved.country,currentDate()].join("|");
   if(!saved.city||!saved.country){schedule=null;lastLookup="";update();return}
   if(key===lastLookup){
    if(schedule){
     const local=zonedParts(new Date(),schedule.timezone);
     if(local&&local.date===schedule.date){update();return}
    }else{update();return}
   }
   working=true;lastLookup=key;
   try{
    const date=currentDate();
    const load=async(d:string)=>{
     const query=new URLSearchParams({date:d,city:saved.city,state:saved.state,country:saved.country});
     const result=await fetch("/api/prayer-times?"+query,{signal:AbortSignal.timeout(9000)});
     if(!result.ok)throw Error("Sunrise/sunset unavailable");
     return await result.json() as Daylight;
    };
    let result=await load(date);
    const local=zonedParts(new Date(),result.timezone);
    if(local&&local.date!==result.date)result=await load(local.date);
    if(alive)schedule=result;
   }catch{if(alive)schedule=null}
   finally{working=false;if(alive)update()}
  };
  const onLocation=()=>{lastLookup="";schedule=null;void refresh()};
  const onSettings=()=>{update();if(readDeepWatchThemeMode()==="auto")void refresh()};
  const onStorage=(event:StorageEvent)=>{
   if(event.key===DEEPWATCH_THEME_KEY)onSettings();
   if(event.key==="1muslim:location:v1")onLocation();
  };
  update();void refresh();
  const timer=window.setInterval(()=>{
   update();
   // Date transitions require a fresh schedule; never use yesterday's sunrise.
   if(schedule&&zonedParts(new Date(),schedule.timezone)?.date!==schedule.date)void refresh();
   if(!schedule&&lastLookup.split("|").at(-1)!==currentDate())void refresh();
  },60000);
  darkQuery.addEventListener("change",update);
  window.addEventListener(DEEPWATCH_THEME_EVENT,onSettings);
  window.addEventListener("1muslim:location-updated",onLocation);
  window.addEventListener("storage",onStorage);
  window.addEventListener("focus",onLocation);
  return()=>{
   alive=false;window.clearInterval(timer);darkQuery.removeEventListener("change",update);
   window.removeEventListener(DEEPWATCH_THEME_EVENT,onSettings);
   window.removeEventListener("1muslim:location-updated",onLocation);
   window.removeEventListener("storage",onStorage);
   window.removeEventListener("focus",onLocation);
  };
 },[]);
 return {mode,...appearance};
}
