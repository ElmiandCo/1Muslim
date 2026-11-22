"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import LocationPreferences, { readLocation } from "../../components/LocationPreferences";
import AdhanSettings from "../../components/AdhanSettings";
import { createClient } from "../../../utils/supabase/client";
import { PositionIllustration, PrayerScene, PrayerShell } from "../../components/PrayerVisuals";
import {
 ADHAN_PRAYERS, ADHAN_SETTINGS_EVENT, displayPrayerTime, fetchPrayerSchedule,
 locationClock, prayerMinute, readAdhanPreferences, type AdhanLocation, type PrayerSchedule
} from "../../lib/adhan";

const PRAYER_ICONS:Record<string,string>={Fajr:"☾",Sunrise:"☀",Dhuhr:"☼",Asr:"✺",Maghrib:"◒",Isha:"☽"};
export default function PrayerTimes(){
 const [place,setPlace]=useState<AdhanLocation>({city:"",state:"",country:""});
 const [method,setMethod]=useState(readAdhanPreferences().method);
 const [schedule,setSchedule]=useState<PrayerSchedule|null>(null);
 const [now,setNow]=useState(()=>new Date());
 const [message,setMessage]=useState("");
 const [loading,setLoading]=useState(false);
 const [editLocation,setEditLocation]=useState(false);
 useEffect(()=>{
  let active=true;const local=readLocation();setPlace(local);setEditLocation(false);
  void(async()=>{try{const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user||!active)return;const {data}=await db.from("profiles").select("city,state,country").eq("id",user.id).maybeSingle();if(!active||!data)return;const next={city:data.city||local.city,state:data.state||local.state,country:data.country||local.country};setPlace(next)}catch{}})();
  const sync=()=>setMethod(readAdhanPreferences().method);
  window.addEventListener(ADHAN_SETTINGS_EVENT,sync);
  window.addEventListener("storage",sync);
  const timer=window.setInterval(()=>setNow(new Date()),30000);
  return()=>{active=false;window.removeEventListener(ADHAN_SETTINGS_EVENT,sync);window.removeEventListener("storage",sync);window.clearInterval(timer)};
 },[]);
 useEffect(()=>{
  if(!place.city.trim()||!place.country.trim()){setSchedule(null);return}
  const abort=new AbortController();setLoading(true);setMessage("");
  void fetchPrayerSchedule(place,method,abort.signal).then(data=>{if(!abort.signal.aborted)setSchedule(data)})
  .catch(e=>{if(!abort.signal.aborted)setMessage(e instanceof Error?e.message:"Could not load prayer times.")})
  .finally(()=>{if(!abort.signal.aborted)setLoading(false)});
  return()=>abort.abort();
 },[place.city,place.state,place.country,method,now.toDateString()]);
 const clock=schedule?locationClock(schedule.timezone,now):null;
 const nextPrayer=schedule&&clock?.date===schedule.date?ADHAN_PRAYERS.find(prayer=>(prayerMinute(schedule.times[prayer])??-1)>clock.minute):null;
 const nextAt=nextPrayer&&schedule?prayerMinute(schedule.times[nextPrayer]):null;
 const remaining=nextAt!==null&&clock?Math.max(0,nextAt-clock.minute):null;
 const countdown=remaining!==null?(remaining>=60?Math.floor(remaining/60)+"h "+remaining%60+"m":remaining+"m"):"After midnight";
 const dateLabel=schedule?new Date(schedule.date+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"}):new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
 const locationName=[place.city,place.state,place.country].filter(Boolean).join(", ");
 return <PrayerShell title="Prayer Times" eyebrow="1MUSLIM · PRAYER & ADHAN">
  <div className="prayerHero prayerDashboardHero">
   <PrayerScene/>
   <div className="prayerHeroContents">
    <button type="button" className="prayerCityButton" onClick={()=>setEditLocation(v=>!v)} aria-expanded={editLocation} aria-controls="prayer-location-editor"><span className="prayerLocationPin">⌖</span> {locationName||"Set your prayer location"} <span aria-hidden="true">⌄</span></button>
    <p className="prayerDate">{dateLabel} · {schedule?.timezone||"Your local time zone"}</p>
    <div className="prayerNextFocus"><span className="prayerNextIcon" aria-hidden="true">☪</span><div><span className="prayerNextLabel">{nextPrayer?"NEXT PRAYER":"PRAYER SCHEDULE"}</span><b>{nextPrayer||"Tomorrow's Fajr"}</b><small>{nextPrayer&&schedule?displayPrayerTime(schedule.times[nextPrayer]):"Refreshes after midnight"}</small></div><strong>{nextPrayer?"in "+countdown:"Five daily prayers"}</strong></div>
   </div>
  </div>
  {editLocation&&<section id="prayer-location-editor" className="prayerLocationEdit" aria-label="Edit location"><div className="prayerSectionTop"><span className="prayerSectionIcon">⌖</span><div><h2>Choose your city</h2><p>Choose the city used for your personalized daily prayer times.</p></div></div><LocationPreferences onSaved={next=>{setPlace(next);setEditLocation(false)}}/></section>}
  <section className="prayerCard prayerTimesCard" aria-labelledby="prayer-times-heading">
   <div className="prayerSectionTop"><span className="prayerSectionIcon">▦</span><div><h2 id="prayer-times-heading">Today&apos;s prayer times</h2><p>Calculated for your saved city using your selected convention.</p></div><span className="prayerCalcBadge">Local prayer schedule</span></div>
   {loading&&<div className="prayerScheduleLoading" role="status">Updating prayer times…</div>}
   {message&&<p className="prayerScheduleMessage" role="alert">{message}</p>}
   {schedule&&<div className="prayerTimesRail" role="list">{(["Fajr","Sunrise","Dhuhr","Asr","Maghrib","Isha"] as const).map(prayer=><div role="listitem" key={prayer} className={"prayerTimeCell"+(nextPrayer===prayer?" current":"")}>
    <span aria-hidden="true">{PRAYER_ICONS[prayer]}</span><strong>{prayer}</strong><b>{displayPrayerTime(schedule.times[prayer])}</b><small>{prayer==="Sunrise"?"Not a salah":prayer===nextPrayer?"Up next":"Prayer"}</small>
   </div>)}</div>}
   {!loading&&!schedule&&!message&&<p className="prayerScheduleLoading">Set your city above to see today&apos;s prayer times.</p>}
  </section>
  <section className="prayerCard prayerAdhanCard" aria-label="Adhan settings">
   <AdhanSettings inPrayerPage location={place} onLocationSaved={next=>{setPlace(next);setEditLocation(false)}} />
  </section>
  <section className="prayerCard prayerActionCard">
   <div><h2>Learn Salah</h2><p>Master each position through guided illustrations, Arabic recitations, transliterations and English meanings.</p><Link className="prayerGoldButton" href="/widget-tools/prayer/learn">Start learning <span>→</span></Link></div>
   <div className="prayerActionArt" aria-hidden="true"><PositionIllustration stage="stand"/><PositionIllustration stage="bow"/><PositionIllustration stage="prostrate"/></div>
  </section>
  <section className="prayerCard prayerActionCard">
   <div><h2>The Story of Salah</h2><p>Experience the Night Journey, Miʿrāj, the five daily prayers and authentic hadith through interactive storytelling.</p><Link className="prayerGoldButton" href="/widget-tools/prayer/story">Explore the story <span>→</span></Link></div>
   <div className="prayerStoryPreview" aria-hidden="true"><PrayerScene night/><span>50 → 5</span></div>
  </section>
  <p className="prayerInfoNote">Times are calculated using the AlAdhan API. Different calculation methods and local mosque schedules can vary by several minutes. Sunrise is not one of the five daily prayers. Automatic Adhan playback requires the website to be open and may be limited by your device&apos;s audio settings.</p>
 </PrayerShell>;
}
