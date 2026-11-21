"use client";

import {useEffect,useMemo,useRef,useState} from "react";

const MAKKAH={lat:21.422487,lon:39.826206};
const normalize=(angle:number)=>((angle%360)+360)%360;
function qiblaBearing(lat:number,lon:number){
 const radians=Math.PI/180;
 const p1=lat*radians,p2=MAKKAH.lat*radians,dLon=(MAKKAH.lon-lon)*radians;
 return normalize(Math.atan2(Math.sin(dLon),Math.cos(p1)*Math.tan(p2)-Math.sin(p1)*Math.cos(dLon))*180/Math.PI);
}
type OrientationWithCompass=DeviceOrientationEvent&{webkitCompassHeading?:number;webkitCompassAccuracy?:number};
type OrientationPermission=typeof DeviceOrientationEvent & {requestPermission?:()=>Promise<"granted"|"denied">};
export default function ProfileQiblaCompass(){
 const [coords,setCoords]=useState<{lat:number;lon:number}|null>(null);
 const [locationError,setLocationError]=useState("");
 const [heading,setHeading]=useState<number|null>(null);
 const [sensorError,setSensorError]=useState("");
 const [manualHeading,setManualHeading]=useState(0);
 const [manual,setManual]=useState(false);
 const [sensorActive,setSensorActive]=useState(false);
 const [sensorWaiting,setSensorWaiting]=useState(false);
 const [sensorAccuracy,setSensorAccuracy]=useState<number|null>(null);
 const [locationLoading,setLocationLoading]=useState(false);
 const lastHeading=useRef<number|null>(null);
 const lastSensorTick=useRef(0);
 const orientationSession=useRef(0);
 const [satellite,setSatellite]=useState(false);

 const bearing=useMemo(()=>coords?qiblaBearing(coords.lat,coords.lon):null,[coords]);
 const effectiveHeading=manual?manualHeading:(sensorActive?heading:null);
 const direction=bearing===null||effectiveHeading===null?null:normalize(bearing-effectiveHeading);
 const directionLabel=direction===null?"":Math.min(direction,360-direction)<8?"You are facing the Qibla":direction<=180?`Turn ${Math.round(direction)}° clockwise`:`Turn ${Math.round(360-direction)}° counterclockwise`;
 const getLocation=()=>{if(!navigator.geolocation){setLocationError("Location is unavailable on this device.");return}
  setLocationLoading(true);setLocationError("");
  navigator.geolocation.getCurrentPosition(
   pos=>{setCoords({lat:pos.coords.latitude,lon:pos.coords.longitude});setLocationLoading(false)},
   err=>{setLocationLoading(false);setLocationError(err.code===1?"Please allow location access in your browser settings, then tap Update location.":"Could not get your position. Please try again outdoors or check location settings.")},
   {enableHighAccuracy:true,timeout:14000,maximumAge:60000}
  );
 };
 // A relative alpha is NOT a compass direction. iOS reports a compass heading
 // through webkitCompassHeading; Android can expose a world-referenced alpha
 // via deviceorientationabsolute or an absolute deviceorientation event.
 const setSensorHeading=(raw:number,accuracy?:number)=>{
  if(!Number.isFinite(raw))return;
  const next=normalize(raw),prior=lastHeading.current;
  const delta=prior===null?0:((next-prior+540)%360)-180;
  const smoothed=prior===null?next:normalize(prior+Math.max(-40,Math.min(40,delta))*.35);
  lastHeading.current=smoothed;
  setHeading(smoothed);
  setSensorActive(true);setSensorWaiting(false);setSensorError("");
  if(typeof accuracy==="number"&&Number.isFinite(accuracy))setSensorAccuracy(accuracy);
  lastSensorTick.current=Date.now();
 };
 const startCompass=async()=>{
  if(!window.isSecureContext){setSensorWaiting(false);setSensorActive(false);setSensorError("Live compass requires HTTPS. Open 1muslim.live in Safari or Chrome.");return}
  if(!("DeviceOrientationEvent" in window)){setSensorActive(false);setSensorError("No motion compass is available here. Use Manual heading.");return}
  try{
   const ctor=DeviceOrientationEvent as OrientationPermission;
   if(typeof ctor.requestPermission==="function"&&(await ctor.requestPermission())!=="granted"){
    setSensorActive(false);setSensorError("Motion permission denied. Enable Motion & Orientation Access in Safari settings, or use Manual heading.");return
   }
   lastHeading.current=null;lastSensorTick.current=0;setSensorActive(false);setSensorWaiting(true);setSensorError("");setManual(false);
   // Incrementing the session triggers a fresh listener and timeout.
   orientationSession.current+=1;setSession(orientationSession.current);
  }catch{setSensorActive(false);setSensorWaiting(false);setSensorError("Could not enable motion sensors. Try Safari or Chrome directly, or use Manual heading.")}
 };
 const [session,setSession]=useState(0);
 useEffect(()=>{getLocation()},[]);
 useEffect(()=>{
  if(!session||manual)return;
  let live=true;
  const onOrientation=(event:DeviceOrientationEvent)=>{
   if(!live)return;
   const sensor=event as OrientationWithCompass;
   // iPhone heading is clockwise from north, corrected to true north using
   // the browser's compass implementation where available.
   if(typeof sensor.webkitCompassHeading==="number"&&Number.isFinite(sensor.webkitCompassHeading)){
    setSensorHeading(sensor.webkitCompassHeading,sensor.webkitCompassAccuracy);return
   }
   // Android absolute alpha is measured anticlockwise: heading = 360 - alpha.
   if((event.absolute||event.type==="deviceorientationabsolute")&&typeof event.alpha==="number"&&Number.isFinite(event.alpha)){
    setSensorHeading(360-event.alpha);
   }
  };
  window.addEventListener("deviceorientationabsolute",onOrientation,true);
  window.addEventListener("deviceorientation",onOrientation,true);
  const timer=window.setTimeout(()=>{
   if(live&&Date.now()-lastSensorTick.current>2200){
    setSensorWaiting(false);setSensorActive(false);
    setSensorError("No reliable compass reading was received. On iPhone, allow Motion & Orientation Access in Safari. Otherwise use Manual heading.")
   }
  },2800);
  const stale=window.setInterval(()=>{if(lastSensorTick.current&&Date.now()-lastSensorTick.current>3500){
   setSensorActive(false);setSensorWaiting(false);
   setSensorError("Live compass signal was lost. Tap Enable compass again or use Manual heading.")
  }},1500);
  return()=>{live=false;clearTimeout(timer);clearInterval(stale);window.removeEventListener("deviceorientationabsolute",onOrientation,true);window.removeEventListener("deviceorientation",onOrientation,true)}
 },[session,manual]);
  const compassReady=heading!==null&&sensorActive&&!manual;
 return <section className="profileQiblaWidget" aria-label="Qibla Compass">
  <div className="qiblaWidgetHead"><div><h3>Qibla Compass</h3><p>Find the direction of the Kaaba in Makkah.</p></div><span className="qiblaWidgetMark" aria-hidden="true">◈</span></div>
  <div className="qiblaCompass" role="img" aria-label={bearing===null?"Location needed for Qibla direction":`Qibla bearing ${Math.round(bearing)} degrees clockwise from true north`}>
   <div className="qiblaDial" style={{transform:`rotate(${compassReady?-heading!:0}deg)`}}>
    {Array.from({length:36},(_,i)=><i key={i} className={i%3===0?"major":""} style={{transform:`translateX(-50%) rotate(${i*10}deg)`}}/>)}
    {(["N","E","S","W"] as const).map((label,index)=><b key={label} style={{transform:`translate(-50%,-50%) rotate(${index*90}deg) translateY(-122px) rotate(${-(index*90)}deg)`}}>{label}</b>)}
   </div>
   {direction!==null&&<div className="qiblaPointer" style={{transform:`translate(-50%,-50%) rotate(${direction}deg)`}}><span className="qiblaKaaba" aria-hidden="true">▣</span><span className="qiblaNeedle"/></div>}
   <div className="qiblaCenterArrow" aria-hidden="true">▲</div>
  </div>
  <strong className="qiblaBearing">{bearing===null?"Location required":`${Math.round(bearing)}° from true north`}</strong>
  {bearing!==null&&<p className="qiblaDirection" aria-live="polite">{compassReady||manual?directionLabel:sensorWaiting?"Waiting for motion sensors…":"Tap Enable compass for live guidance."}</p>}
  {compassReady&&<p className="qiblaSensorStatus" role="status">● Live compass · Heading {Math.round(heading!)}°{sensorAccuracy!==null?" · Accuracy ±"+Math.round(sensorAccuracy)+"°":""}</p>}
  {manual&&<p className="qiblaSensorStatus" role="status">Manual simulation · Use the slider to enter the direction your phone faces. It does not follow phone movement.</p>}
  {locationError&&<p className="qiblaWarning" role="status">{locationError}</p>}
  {sensorError&&<p className="qiblaWarning" role="status">{sensorError}</p>}
  <div className="qiblaWidgetActions">
   <button type="button" onClick={getLocation} disabled={locationLoading}>⌖ {locationLoading?"Finding location…":"Update location"}</button>
   <button type="button" onClick={()=>void startCompass()} disabled={sensorWaiting}>◉ {compassReady?"Recalibrate compass":sensorWaiting?"Enabling…":"Enable compass"}</button>
   <button type="button" onClick={()=>{setManual(v=>!v);setSensorWaiting(false);setSensorError("")}} aria-pressed={manual}>{manual?"Exit manual mode":"Manual heading"}</button>
  </div>
  {manual&&<label className="qiblaManual">Manual device heading: {manualHeading}°<input aria-label="Adjust device heading" type="range" min="0" max="359" value={manualHeading} onChange={event=>{setManual(true);setManualHeading(Number(event.target.value))}}/></label>}
  <button className="qiblaSatellite" type="button" aria-pressed={satellite} onClick={()=>setSatellite(v=>!v)}>{satellite?"◈ Satellite mode unavailable in web compass":"◈ Satellite view (coming soon)"}</button>
  <p className="qiblaHelp">For best results, hold your phone flat and move away from magnets or metal. Location and motion access may require HTTPS and your permission.</p>
  <style jsx>{`
   .profileQiblaWidget{--qibla-accent:var(--theme-accent,var(--profile-accent,#789bb9));margin-top:16px;padding:20px 16px 18px;border:1px solid var(--qibla-accent);border-radius:22px;color:var(--foreground,#192739);background:var(--background,#fff);box-shadow:0 12px 32px #263c5212;scroll-margin-top:84px;animation:qiblaEnter .3s ease-out}
   @keyframes qiblaEnter{from{opacity:.4;transform:translateY(-9px)}to{opacity:1;transform:translateY(0)}}
   .qiblaWidgetHead{display:flex;align-items:center;justify-content:space-between}.qiblaWidgetHead h3{font-size:23px;margin:0;font-weight:800}.qiblaWidgetHead p{margin:4px 0 0;font-size:13px;opacity:.7}.qiblaWidgetMark{font-size:30px;color:var(--qibla-accent)}
   .qiblaCompass{position:relative;width:min(80vw,320px);height:min(80vw,320px);margin:22px auto 16px;border:1px solid var(--qibla-accent);border-radius:50%;background:radial-gradient(circle,#eaf0f6 0 39%,#dce8f2 40% 57%,#edf4f9 58% 69%,#ffffff 70%);box-shadow:inset 0 0 0 6px #ffffff70,0 9px 27px #263c5220}
   .qiblaDial{position:absolute;inset:0;border-radius:50%;transition:transform .2s ease-out}.qiblaDial i{position:absolute;left:50%;top:8px;width:1px;height:10px;background:#8ea3b4;transform-origin:50% calc(min(40vw,160px) - 8px)}.qiblaDial i.major{width:2px;height:17px;background:#395572}
   .qiblaDial b{position:absolute;top:50%;left:50%;font-size:20px;color:#23456a}.qiblaPointer{position:absolute;left:50%;top:50%;height:86%;width:3px;transform-origin:50% 50%;transition:transform .18s ease-out}.qiblaNeedle{position:absolute;left:0;top:0;height:49%;width:3px;background:var(--qibla-accent)}.qiblaKaaba{position:absolute;top:-12px;left:-16px;width:35px;height:35px;border:1px solid #fff;border-radius:50%;background:#263747;color:#e8c886;display:grid;place-items:center;font-size:23px;box-shadow:0 2px 10px #0003}
   .qiblaCenterArrow{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:48px;color:#fff;text-shadow:0 2px 5px #234c77,-1px -1px 2px #234c77;pointer-events:none}
   .qiblaBearing{display:block;text-align:center;font-size:17px}.qiblaDirection{text-align:center;font-size:13px;min-height:20px}.qiblaWarning{margin:8px 0;color:#9a4c29;font-size:13px}.qiblaWidgetActions{display:flex;justify-content:center;gap:8px;flex-wrap:wrap}.qiblaWidgetActions button,.qiblaSatellite{background:transparent;border:1px solid #c8d3de;border-radius:24px;padding:10px 12px;color:inherit;font-size:12px;font-weight:650;cursor:pointer;min-height:42px}
   .qiblaSensorStatus{text-align:center;font-size:12px;margin:6px auto 10px;color:#247c5d;line-height:1.5}.qiblaWidgetActions button:disabled{opacity:.55;cursor:wait}
   .qiblaWidgetActions button:focus-visible,.qiblaSatellite:focus-visible{outline:2px solid var(--qibla-accent);outline-offset:2px}.qiblaManual{display:grid;gap:8px;margin:14px 6px;font-size:13px}.qiblaManual input{width:100%;accent-color:var(--qibla-accent)}.qiblaSatellite{display:block;margin:14px auto 0}.qiblaHelp{text-align:center;font-size:11px;opacity:.64;line-height:1.6;margin:14px auto 0;max-width:420px}
   @media(prefers-reduced-motion:reduce){.profileQiblaWidget{animation:none}.qiblaPointer,.qiblaDial{transition:none}}
  `}</style>
 </section>;
}
