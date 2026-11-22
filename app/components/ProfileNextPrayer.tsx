"use client";

import {useEffect,useState} from "react";
import Link from "next/link";
import styles from "./ProfileNextPrayer.module.css";
import {readLocation} from "./LocationPreferences";
import {ADHAN_PRAYERS,ADHAN_SETTINGS_EVENT,displayPrayerTime,fetchPrayerSchedule,fetchPrayerScheduleOnDate,locationClock,prayerMinute,readAdhanPreferences,type AdhanLocation,type PrayerSchedule} from "../lib/adhan";

type LocationInfo={city?:string|null;state?:string|null;country?:string|null};
const glyphs:Record<string,string>={Fajr:"☾",Dhuhr:"☼",Asr:"✺",Maghrib:"◒",Isha:"☽"};

function normalize(location:LocationInfo):AdhanLocation{
 return {city:location.city?.trim()||"",state:location.state?.trim()||"",country:location.country?.trim()||""};
}
function dateAfter(isoDate:string){
 const d=new Date(isoDate+"T12:00:00.000Z");
 d.setUTCDate(d.getUTCDate()+1);
 return d.toISOString().slice(0,10);
}
function durationText(total:number){
 if(total<=0)return "Starting now";
 const minutes=Math.ceil(total);
 return minutes>=60?"in "+Math.floor(minutes/60)+"h "+String(minutes%60).padStart(2,"0")+"m":"in "+minutes+"m";
}

/** Viewer-specific city, time zone and settings; no other member's location is exposed. */
export default function ProfileNextPrayer({initialLocation}:{initialLocation?:LocationInfo}){
 const [place,setPlace]=useState<AdhanLocation>(()=>normalize(initialLocation||{}));
 const [method,setMethod]=useState(readAdhanPreferences().method);
 const [now,setNow]=useState(()=>new Date());
 const [timezone,setTimezone]=useState(()=>Intl.DateTimeFormat().resolvedOptions().timeZone||"UTC");
 const [schedule,setSchedule]=useState<PrayerSchedule|null>(null);
 const [tomorrow,setTomorrow]=useState<PrayerSchedule|null>(null);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");

 useEffect(()=>{
  const profilePlace=normalize(initialLocation||{});
  const local=readLocation();
  setPlace(profilePlace.city&&profilePlace.country?profilePlace:local);
  const syncLocation=()=>setPlace(readLocation());
  const syncMethod=()=>setMethod(readAdhanPreferences().method);
  const tick=()=>setNow(new Date());
  window.addEventListener("1muslim:location-updated",syncLocation);
  window.addEventListener("storage",syncLocation);
  window.addEventListener(ADHAN_SETTINGS_EVENT,syncMethod);
  document.addEventListener("visibilitychange",tick);
  window.addEventListener("focus",tick);
  const timer=window.setInterval(tick,30_000);
  return()=>{
   window.clearInterval(timer);
   window.removeEventListener("1muslim:location-updated",syncLocation);
   window.removeEventListener("storage",syncLocation);
   window.removeEventListener(ADHAN_SETTINGS_EVENT,syncMethod);
   window.removeEventListener("focus",tick);
   document.removeEventListener("visibilitychange",tick);
  };
 },[initialLocation?.city,initialLocation?.state,initialLocation?.country]);

 const placeKey=[place.city,place.state,place.country].join("|");
 const canLoad=!!place.city&&!!place.country;
 const calendarDay=locationClock(timezone,now).date;

 useEffect(()=>{
  if(!canLoad){setSchedule(null);setTomorrow(null);setLoading(false);setError("");return}
  const controller=new AbortController();
  setLoading(true);setError("");setSchedule(null);setTomorrow(null);
  void fetchPrayerSchedule(place,method,controller.signal).then(data=>{
   if(!controller.signal.aborted){setSchedule(data);setTimezone(data.timezone);}
  }).catch(err=>{
   if(!controller.signal.aborted)setError(err instanceof Error?err.message:"Could not load your prayer times.");
  }).finally(()=>{
   if(!controller.signal.aborted)setLoading(false);
  });
  return()=>controller.abort();
  // calendarDay changes at midnight in the selected city's timezone.
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[placeKey,method,calendarDay]);

 const clock=schedule?locationClock(schedule.timezone,now):null;
 const todayIsCurrent=!!schedule&&clock?.date===schedule.date;
 const nextToday=todayIsCurrent?ADHAN_PRAYERS.find(name=>(prayerMinute(schedule.times[name])??-1)>(clock?.minute??0)):undefined;
 const nextDay=dateAfter(schedule?.date||"2000-01-01");
 const needsTomorrow=!!schedule&&todayIsCurrent&&!nextToday;
 useEffect(()=>{
  if(!needsTomorrow){setTomorrow(null);return}
  const controller=new AbortController();
  void fetchPrayerScheduleOnDate(place,method,nextDay,controller.signal)
   .then(data=>{if(!controller.signal.aborted)setTomorrow(data)})
   .catch(()=>{if(!controller.signal.aborted)setTomorrow(null)});
  return()=>controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[needsTomorrow,nextDay,placeKey,method]);

 const upcoming=nextToday||((tomorrow?.date===nextDay&&needsTomorrow)?"Fajr":undefined);
 const time=upcoming&&(nextToday?schedule?.times[upcoming]:tomorrow?.times.Fajr);
 const targetMinute=time?prayerMinute(time):null;
 let until:number|null=null;
 let progress=0;
 if(clock&&targetMinute!==null){
  const end=nextToday?targetMinute:1440+targetMinute;
  const previousIndex=nextToday?ADHAN_PRAYERS.indexOf(nextToday)-1:ADHAN_PRAYERS.length-1;
  const previous=nextToday&&previousIndex>=0&&schedule?prayerMinute(schedule.times[ADHAN_PRAYERS[previousIndex]]):nextToday?0:schedule?prayerMinute(schedule.times.Isha):0;
  const start=previous??0;
  until=Math.max(0,end-clock.minute-clock.second/60);
  progress=Math.max(0,Math.min(100,(clock.minute-start)/Math.max(1,end-start)*100));
 }
 const cityLabel=place.city+(place.state?", "+place.state:"");
 const isReady=!!time&&until!==null;

 return <section className={styles.card} aria-label="Your next prayer">
  <div className={styles.aura} aria-hidden="true"/>
  <div className={styles.topline}>
   <span className={styles.eyebrow}><span aria-hidden="true">✦</span> YOUR NEXT PRAYER</span>
   <Link href="/widget-tools/prayer" className={styles.open} aria-label="Open full prayer times and Adhan settings">Prayer Times <span aria-hidden="true">↗</span></Link>
  </div>
  <div className={styles.main}>
   <span className={styles.symbol} aria-hidden="true">{glyphs[upcoming||""]||"☾"}</span>
   <div className={styles.identity}>
    <strong>{isReady?upcoming:!canLoad?"Personalize your prayers":loading?"Finding your next prayer…":error?"Prayer times unavailable":"Next prayer"}</strong>
    <span className={styles.detail}>{isReady?displayPrayerTime(time):!canLoad?"Set your city to see your daily schedule":error?"Check your saved city or try again":loading?"Calculating for your city":"Waiting for the next schedule"}</span>
   </div>
   {isReady&&<span className={styles.remaining} aria-label={upcoming+" at "+displayPrayerTime(time)+", "+durationText(until)}>{durationText(until)}</span>}
  </div>
  {isReady?<div className={styles.bottom}>
   <div className={styles.meter} role="progressbar" aria-label="Time elapsed since the previous daily prayer" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><span style={{width:progress+"%"}}/></div>
   <div className={styles.meta}><span>⌖ {cityLabel}</span><span>{nextToday?"Today's salah":"Tomorrow's Fajr"}</span></div>
  </div>:<div className={styles.bottom}>
   <div className={styles.meter} aria-hidden="true"><span style={{width:loading?"38%":"0%"}}/></div>
   <div className={styles.meta}><span>{canLoad?"⌖ "+cityLabel:"⌖ No location selected"}</span><Link href="/widget-tools/prayer">{canLoad?"Open Prayer Times":"Set location"} →</Link></div>
  </div>}
 </section>;
}
