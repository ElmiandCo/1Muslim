"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import LocationPreferences, { readLocation } from "../../components/LocationPreferences";
import AdhanSettings from "../../components/AdhanSettings";
import { createClient } from "../../../utils/supabase/client";
import { PositionIllustration, PrayerScene, PrayerShell } from "../../components/PrayerVisuals";
import { PrayerTimeIcon, PrayerUiIcon, type PrayerTimeName } from "../../components/icons/PrayerTimeIcon";
import {
 ADHAN_PRAYERS, ADHAN_SETTINGS_EVENT, displayPrayerTime, fetchPrayerSchedule, fetchPrayerScheduleOnDate,
 locationClock, prayerMinute, readAdhanPreferences, type AdhanLocation, type PrayerSchedule
} from "../../lib/adhan";

const PRAYER_ORDER:PrayerTimeName[]=["Fajr","Sunrise","Dhuhr","Asr","Maghrib","Isha"];
export default function PrayerTimes(){
 const [place,setPlace]=useState<AdhanLocation>({city:"",state:"",country:""});
 const [method,setMethod]=useState(readAdhanPreferences().method);
 const [schedule,setSchedule]=useState<PrayerSchedule|null>(null);
 const [tomorrow,setTomorrow]=useState<PrayerSchedule|null>(null);
 const railRef=useRef<HTMLDivElement|null>(null);
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
 const nextToday=schedule&&clock?.date===schedule.date
   ?ADHAN_PRAYERS.find(prayer=>(prayerMinute(schedule.times[prayer])??-1)>clock.minute):undefined;
 const needsTomorrow=!!(schedule&&clock?.date===schedule.date&&!nextToday);
 const nextDate=schedule?new Date(Date.parse(schedule.date+"T12:00:00Z")+86400000).toISOString().slice(0,10):"";
 useEffect(()=>{
   if(!needsTomorrow||!nextDate){setTomorrow(null);return}
   const controller=new AbortController();
   void fetchPrayerScheduleOnDate(place,method,nextDate,controller.signal)
    .then(result=>{if(!controller.signal.aborted)setTomorrow(result)})
    .catch(()=>{if(!controller.signal.aborted)setTomorrow(null)});
   return()=>controller.abort();
 },[needsTomorrow,nextDate,place.city,place.state,place.country,method]);
 const showingTomorrow=needsTomorrow&&tomorrow?.date===nextDate;
 const railSchedule=showingTomorrow?tomorrow:schedule;
 const nextPrayer=nextToday||(showingTomorrow?"Fajr":undefined);
 const centerPrayer=nextPrayer||(needsTomorrow?"Isha":undefined);
 const nextAt=nextPrayer?(nextToday&&schedule?prayerMinute(schedule.times[nextToday]):tomorrow?prayerMinute(tomorrow.times.Fajr):null):null;
 const remaining=nextAt!==null&&clock?Math.max(0,(showingTomorrow?1440:0)+nextAt-clock.minute):null;
 const countdown=remaining!==null?(remaining>=60?Math.floor(remaining/60)+"h "+remaining%60+"m":remaining+"m"):"—";
 // Focus only when a schedule or next prayer changes. Manual swiping is never reset by ticking the clock.
 useEffect(()=>{
   if(!railSchedule||!centerPrayer)return;
   const timer=window.setTimeout(()=>{
     const container=railRef.current;
     const target=container?.querySelector<HTMLElement>(`[data-prayer-time="${centerPrayer}"]`);
     if(!container||!target)return;
     const current=target.getBoundingClientRect(),parent=container.getBoundingClientRect();
     const left=container.scrollLeft+(current.left-parent.left)-(container.clientWidth-target.clientWidth)/2;
     container.scrollTo({left:Math.max(0,left),behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});
   },140);
   return()=>window.clearTimeout(timer);
 },[railSchedule?.date,centerPrayer]);
 const dateLabel=schedule?new Date(schedule.date+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"}):new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
 const locationName=[place.city,place.state,place.country].filter(Boolean).join(", ");
 return <PrayerShell title="Prayer Times" eyebrow="1MUSLIM · PRAYER & ADHAN">
  <div className="prayerHero prayerDashboardHero">
   <PrayerScene/>
   <div className="prayerHeroContents">
    <button type="button" className="prayerCityButton" onClick={()=>setEditLocation(v=>!v)} aria-expanded={editLocation} aria-controls="prayer-location-editor"><span className="prayerLocationPin"><PrayerUiIcon kind="location"/></span> {locationName||"Set your prayer location"} <span aria-hidden="true">⌄</span></button>
    <p className="prayerDate">{dateLabel} · {schedule?.timezone||"Your local time zone"}</p>
    <div className="prayerNextFocus"><span className="prayerNextIcon" aria-hidden="true">{nextPrayer?<PrayerTimeIcon prayer={nextPrayer}/>:<PrayerUiIcon kind="time"/>}</span><div><span className="prayerNextLabel">{nextPrayer?(showingTomorrow?"NEXT PRAYER · TOMORROW":"NEXT PRAYER"):"PRAYER SCHEDULE"}</span><b>{nextPrayer||"Tomorrow's Fajr"}</b><small>{nextPrayer&&railSchedule?displayPrayerTime(railSchedule.times[nextPrayer]):"Checking tomorrow's schedule"}</small></div><strong>{nextPrayer?"in "+countdown:"Updating…"}</strong></div>
   </div>
  </div>
  {editLocation&&<section id="prayer-location-editor" className="prayerLocationEdit" aria-label="Edit location"><div className="prayerSectionTop"><span className="prayerSectionIcon"><PrayerUiIcon kind="location"/></span><div><h2>Choose your city</h2><p>Choose the city used for your personalized daily prayer times.</p></div></div><LocationPreferences onSaved={next=>{setPlace(next);setEditLocation(false)}}/></section>}
  <section className="prayerCard prayerTimesCard" aria-labelledby="prayer-times-heading">
   <div className="prayerSectionTop"><span className="prayerSectionIcon"><PrayerUiIcon kind="calendar"/></span><div><h2 id="prayer-times-heading">{showingTomorrow?"Tomorrow's prayer times":"Today's prayer times"}</h2><p>Calculated for your saved city using your selected convention.</p></div><span className="prayerCalcBadge">Local prayer schedule</span></div>
   {loading&&<div className="prayerScheduleLoading" role="status">Updating prayer times…</div>}
   {message&&<p className="prayerScheduleMessage" role="alert">{message}</p>}
   {railSchedule&&<div ref={railRef} className="prayerTimesRail" role="list" aria-label={showingTomorrow?"Tomorrow's six daily solar markers and prayer times":"Today's six daily solar markers and prayer times"}>
    {PRAYER_ORDER.map(prayer=><div role="listitem" data-prayer-time={prayer} key={prayer} aria-current={nextPrayer===prayer?"time":undefined} className={"prayerTimeCell"+(nextPrayer===prayer?" current":"")}>
     <span className="prayerTimeCellIcon" aria-hidden="true"><PrayerTimeIcon prayer={prayer}/></span>
     <strong>{prayer}</strong><b>{displayPrayerTime(railSchedule.times[prayer])}</b>
     <small>{prayer==="Sunrise"?"Not a salah":prayer===nextPrayer?"Up next":"Prayer"}</small>
    </div>)}
   </div>}
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
