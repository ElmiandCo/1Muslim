"use client";

import {useEffect,useState,type CSSProperties} from "react";
import {createClient} from "../../utils/supabase/client";
import {readLocation} from "../components/LocationPreferences";
import {ADHAN_SETTINGS_EVENT,fetchPrayerSchedule,fetchPrayerScheduleOnDate,
 locationClock,prayerMinute,readAdhanPreferences,type AdhanLocation,type AdhanMethod,type PrayerSchedule} from "../lib/adhan";
import {prayerBrandProgress,shiftPrayerDate} from "../lib/prayer-brand-progress";

type Place={city?:string|null;state?:string|null;country?:string|null};
const normalize=(item:Place):AdhanLocation=>({
 city:item.city?.trim()||"",state:item.state?.trim()||"",country:item.country?.trim()||""
});

/** This is the ONLY prayer tracker on signed-in Search Home. It is not a
 * button, has no numeric decoration, and never interferes with search. */
export default function SearchPrayerWordmark({initialLocation,memberId,compact=false}:{
 initialLocation?:Place;memberId?:string;compact?:boolean;
}){
 const [place,setPlace]=useState<AdhanLocation>({city:"",state:"",country:""});
 const [method,setMethod]=useState<AdhanMethod>(()=>readAdhanPreferences().method);
 const [now,setNow]=useState(()=>new Date());
 const [scheduleEntry,setScheduleEntry]=useState<{key:string;schedule:PrayerSchedule}|null>(null);
 const [prevEntry,setPrevEntry]=useState<{key:string;schedule:PrayerSchedule}|null>(null);
 const [nextEntry,setNextEntry]=useState<{key:string;schedule:PrayerSchedule}|null>(null);
 const [retry,setRetry]=useState(0);

 useEffect(()=>{
  // Prefer the signed-in member's own saved city. Never request GPS or show
  // another person's location. A locally saved prayer location is the fallback.
  const profile=normalize(initialLocation||{});
  const sync=(preferSaved=false)=>{
   const local=readLocation();
   setPlace(preferSaved&&local.city&&local.country?local:
    profile.city&&profile.country?profile:local);
  };
  sync();
  const changeMethod=()=>setMethod(readAdhanPreferences().method);
  const syncSaved=()=>sync(true);
  window.addEventListener("1muslim:location-updated",syncSaved);
  window.addEventListener("storage",syncSaved);
  window.addEventListener("storage",changeMethod);
  window.addEventListener(ADHAN_SETTINGS_EVENT,changeMethod);
  return()=>{
   window.removeEventListener("1muslim:location-updated",syncSaved);
   window.removeEventListener("storage",syncSaved);
   window.removeEventListener("storage",changeMethod);
   window.removeEventListener(ADHAN_SETTINGS_EVENT,changeMethod);
  };
 },[initialLocation?.city,initialLocation?.state,initialLocation?.country]);

 useEffect(()=>{
  if(!memberId)return;
  let active=true;
  void createClient().from("prayer_reminder_preferences").select("method")
   .eq("user_id",memberId).maybeSingle().then(({data})=>{
    if(active&&data&&["2","3","4","5"].includes(String(data.method)))
     setMethod(data.method as AdhanMethod);
   },()=>{});
  return()=>{active=false};
 },[memberId]);

 useEffect(()=>{
  const tick=()=>setNow(new Date());
  const timer=window.setInterval(tick,30_000);
  window.addEventListener("focus",tick);
  document.addEventListener("visibilitychange",tick);
  return()=>{
   window.clearInterval(timer);
   window.removeEventListener("focus",tick);
   document.removeEventListener("visibilitychange",tick);
  };
 },[]);

 const placeKey=[place.city,place.state,place.country,method].join("|");
 const schedule=scheduleEntry?.key===placeKey?scheduleEntry.schedule:null;
 const timeZone=schedule?.timezone||Intl.DateTimeFormat().resolvedOptions().timeZone||"UTC";
 const day=locationClock(timeZone,now).date;
 useEffect(()=>{
  if(!place.city||!place.country){setScheduleEntry(null);return}
  let alive=true;
  let retryTimer:ReturnType<typeof setTimeout>|undefined;
  const controller=new AbortController();
  void fetchPrayerSchedule(place,method,controller.signal)
   .then(value=>{if(alive)setScheduleEntry({key:placeKey,schedule:value})})
   .catch(()=>{
    if(!alive)return;
    setScheduleEntry(null);
    // A disconnected provider must not cause an infinite request loop.
    retryTimer=setTimeout(()=>setRetry(n=>n+1),45_000);
   });
  return()=>{alive=false;controller.abort();if(retryTimer)clearTimeout(retryTimer)};
  // The local calendar day changes at midnight in the saved city's timezone.
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[placeKey,day,retry]);

 const priorDate=schedule?shiftPrayerDate(schedule.date,-1):"";
 const followingDate=schedule?shiftPrayerDate(schedule.date,1):"";
 const priorKey=placeKey+"|"+priorDate;
 const followingKey=placeKey+"|"+followingDate;
 const clock=schedule?locationClock(schedule.timezone,now):null;
 const fajrMinute=schedule?(prayerMinute(schedule.times.Fajr)??0):0;
 const ishaMinute=schedule?(prayerMinute(schedule.times.Isha)??1440):1440;
 const beforeFajr=!!clock&&clock.date===schedule?.date&&clock.minute+clock.second/60<fajrMinute;
 const afterIsha=!!clock&&clock.date===schedule?.date&&clock.minute+clock.second/60>=ishaMinute;
 useEffect(()=>{
  if(!schedule||(!beforeFajr&&!afterIsha))return;
  const controller=new AbortController();
  if(beforeFajr){
   void fetchPrayerScheduleOnDate(place,method,priorDate,controller.signal)
    .then(value=>{if(!controller.signal.aborted)setPrevEntry({key:priorKey,schedule:value})}).catch(()=>{});
  }
  if(afterIsha){
   void fetchPrayerScheduleOnDate(place,method,followingDate,controller.signal)
    .then(value=>{if(!controller.signal.aborted)setNextEntry({key:followingKey,schedule:value})}).catch(()=>{});
  }
  return()=>controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[placeKey,method,schedule?.date,beforeFajr,afterIsha,priorDate,followingDate]);
 useEffect(()=>{
  if(place.city&&place.country)return;
  setPrevEntry(null);setNextEntry(null);
 },[place.city,place.country]);

 const previous=prevEntry?.key===priorKey?prevEntry.schedule:null;
 const tomorrow=nextEntry?.key===followingKey?nextEntry.schedule:null;
 const progress=prayerBrandProgress(schedule,previous,tomorrow,now);
 const percent=progress?Math.round(progress.ratio*100_000)/1000:0;
 const label=progress
  ?`Prayer progress from ${progress.from} to ${progress.to}, ${Math.round(percent)} percent complete`
  :"1Muslim.Live. Prayer progress appears once your location's verified times are available.";
 const style={"--smh-prayer-progress":percent+"%"} as CSSProperties;
 return <div className={"smhPrayerWordmark"+(compact?" smhPrayerCompact":"")+
  (progress?" smhPrayerReady":"")} style={style}
  role={progress?"progressbar":"img"} aria-label={label}
  aria-valuemin={progress?0:undefined} aria-valuemax={progress?100:undefined}
  aria-valuenow={progress?Math.round(percent):undefined}
  aria-valuetext={progress?`${progress.from} to ${progress.to}`:undefined}>
  <span className="smhPrayerHalo" aria-hidden="true"/>
  <span className="smhPrayerBase" aria-hidden="true">1Muslim<span>.Live</span></span>
  <span className="smhPrayerLit" aria-hidden="true">1Muslim<span>.Live</span></span>
 </div>;
}
