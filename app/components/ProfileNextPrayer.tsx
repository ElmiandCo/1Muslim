"use client";

import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import styles from "./ProfileNextPrayer.module.css";
import {PrayerTimeIcon,PrayerUiIcon,type PrayerTimeName} from "./icons/PrayerTimeIcon";
import {readLocation} from "./LocationPreferences";
import {ADHAN_PRAYERS,ADHAN_SETTINGS_EVENT,displayPrayerTime,fetchPrayerSchedule,fetchPrayerScheduleOnDate,locationClock,prayerMinute,readAdhanPreferences,type AdhanLocation,type PrayerSchedule} from "../lib/adhan";

type LocationInfo={city?:string|null;state?:string|null;country?:string|null};

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
 const router=useRouter();
 const [place,setPlace]=useState<AdhanLocation>(()=>normalize(initialLocation||{}));
 const [method,setMethod]=useState(readAdhanPreferences().method);
 const [now,setNow]=useState(()=>new Date());
 const [timezone,setTimezone]=useState(()=>Intl.DateTimeFormat().resolvedOptions().timeZone||"UTC");
 const [schedule,setSchedule]=useState<PrayerSchedule|null>(null);
 const [tomorrow,setTomorrow]=useState<PrayerSchedule|null>(null);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const [retry,setRetry]=useState(0);
 const requestedKey=useRef("");

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
  if(!canLoad){
   setSchedule(null);setTomorrow(null);setLoading(false);setError("");requestedKey.current="";return;
  }
  const key=placeKey+"|"+method;
  if(requestedKey.current!==key){
   // Switching accounts, cities or methods cannot reuse the previous schedule.
   setSchedule(null);setTomorrow(null);requestedKey.current=key;
  }else{
   // On daily refresh retain only a schedule for the same local calendar day.
   setSchedule(previous=>previous?.date===calendarDay?previous:null);
  }
  const controller=new AbortController();
  setLoading(true);setError("");
  void fetchPrayerSchedule(place,method,controller.signal).then(data=>{
   if(!controller.signal.aborted){setSchedule(data);setTimezone(data.timezone);}
  }).catch(()=>{
   if(!controller.signal.aborted)setError("Prayer times could not be refreshed.");
  }).finally(()=>{
   if(!controller.signal.aborted)setLoading(false);
  });
  return()=>controller.abort();
  // calendarDay changes at midnight in the selected city's timezone.
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[placeKey,method,calendarDay,retry]);
 useEffect(()=>{
  if(!error||!canLoad)return;
  const timer=window.setTimeout(()=>setRetry(current=>current+1),45_000);
  return()=>window.clearTimeout(timer);
 },[error,canLoad]);

 const clock=schedule?locationClock(schedule.timezone,now):null;
 const todayIsCurrent=!!schedule&&clock?.date===schedule.date;
 const nextToday=schedule&&clock&&todayIsCurrent?ADHAN_PRAYERS.find(name=>(prayerMinute(schedule.times[name])??-1)>clock.minute):undefined;
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
  // A Fajr interval starts at the prior evening's Isha, not at midnight.
  const previous=nextToday&&previousIndex>=0&&schedule?prayerMinute(schedule.times[ADHAN_PRAYERS[previousIndex]]):nextToday&&schedule?(prayerMinute(schedule.times.Isha)??1140)-1440:schedule?prayerMinute(schedule.times.Isha):0;
  const start=previous??0;
  until=Math.max(0,end-clock.minute-clock.second/60);
  progress=Math.max(0,Math.min(100,(clock.minute-start)/Math.max(1,end-start)*100));
 }
 const cityLabel=place.city+(place.state?", "+place.state:"");
 const isReady=!!time&&until!==null;
 const formattedTime=time?displayPrayerTime(time):"—";
 const countdown=until!==null?durationText(until):"—";

 // The entire compact next-prayer indicator is a meaningful shortcut:
 // first-time visitors land in location/Adhan setup; existing users go straight
 // to their editable prayer preferences, not the unrelated Qibla compass.
 const openPrayerSettings=()=>router.push("/widget-tools/prayer?focus="+(canLoad?"settings":"setup"));

 return <>
  <div className={styles.seam}
   role="progressbar" aria-label="Progress toward the next prayer" aria-valuemin={0} aria-valuemax={100}
   aria-valuenow={isReady?Math.round(progress):0}
   aria-valuetext={isReady?`${upcoming} ${countdown}`:"Prayer times loading"}>
   <span className={styles.fill} data-empty={!isReady||progress<=0?"true":"false"} style={{width:isReady?progress+"%":"0%"}}/>
  </div>
  <button type="button" className={styles.card}
   onClick={openPrayerSettings}
   title={canLoad?"Manage prayer times and Adhan settings":"Set up your prayer location and times"}
   aria-label={isReady?`${upcoming} at ${formattedTime}, ${countdown}. Open prayer settings.`:"Set up your prayer location and prayer reminders"}>
   <span className={styles.symbol} aria-hidden="true">{upcoming?<PrayerTimeIcon prayer={upcoming as PrayerTimeName}/>:<PrayerUiIcon kind="time"/>}</span>
   <span className={styles.identity}>
    <strong>{isReady?upcoming:!canLoad?"Set prayer location":loading?"Finding prayer…":error?"Prayer unavailable":"Next prayer"}</strong>
    <small>{isReady?formattedTime:!canLoad?"Choose your city":error?"Check your city":loading?"Loading…":"Updating…"}</small>
   </span>
   {isReady&&<span className={styles.remaining}>{countdown}</span>}
   <span className={styles.chevron} aria-hidden="true">›</span>
  </button>
 </>;
}
