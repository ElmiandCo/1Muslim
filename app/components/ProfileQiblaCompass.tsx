"use client";

import {useEffect,useMemo,useRef,useState} from "react";

const MAKKAH={lat:21.422487,lon:39.826206};
const normalize=(angle:number)=>((angle%360)+360)%360;
// Single polar coordinate system: 0° is upward, positive clockwise.
const point=(angle:number,r:number)=>{const t=(normalize(angle)-90)*Math.PI/180;return {x:160+r*Math.cos(t),y:160+r*Math.sin(t)}};
function qiblaBearing(lat:number,lon:number){
 const radians=Math.PI/180;
 const p1=lat*radians,p2=MAKKAH.lat*radians,dLon=(MAKKAH.lon-lon)*radians;
 return normalize(Math.atan2(Math.sin(dLon),Math.cos(p1)*Math.tan(p2)-Math.sin(p1)*Math.cos(dLon))*180/Math.PI);
}
type OrientationWithCompass=DeviceOrientationEvent&{webkitCompassHeading?:number;webkitCompassAccuracy?:number};
type OrientationPermission=typeof DeviceOrientationEvent & {requestPermission?:()=>Promise<"granted"|"denied">};
export default function ProfileQiblaCompass({motionPermission=null}:{motionPermission?:boolean|null}){
 const [coords,setCoords]=useState<{lat:number;lon:number}|null>(null);
 const [locationError,setLocationError]=useState("");
 const [heading,setHeading]=useState<number|null>(null);
 const [sensorError,setSensorError]=useState("");
 const [sensorActive,setSensorActive]=useState(false);
 const [sensorWaiting,setSensorWaiting]=useState(false);
 const [sensorAccuracy,setSensorAccuracy]=useState<number|null>(null);
 const [locationLoading,setLocationLoading]=useState(false);
 const lastHeading=useRef<number|null>(null);
 const lastSensorTick=useRef(0);

 const bearing=useMemo(()=>coords?qiblaBearing(coords.lat,coords.lon):null,[coords]);
 const effectiveHeading=sensorActive?heading:null;
 const direction=bearing===null||effectiveHeading===null?null:normalize(bearing-effectiveHeading);
 const directionLabel=direction===null?"":Math.min(direction,360-direction)<8?"You are facing the Qibla":direction<=180?`Turn ${Math.round(direction)}° clockwise`:`Turn ${Math.round(360-direction)}° counterclockwise`;
 const poorAccuracy=sensorAccuracy!==null&&sensorAccuracy>30;
 const shownHeading=sensorActive&&heading!==null?heading:0;
 const destination=direction===null?null:point(direction,125);
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
  if(typeof accuracy==="number"&&Number.isFinite(accuracy)&&accuracy>=0)setSensorAccuracy(accuracy);
  lastSensorTick.current=Date.now();
 };
 const startCompass=async()=>{
  if(!window.isSecureContext){setSensorWaiting(false);setSensorActive(false);setSensorError("Live compass requires HTTPS. Please open 1muslim.live directly in Safari or Chrome.");return}
  if(!("DeviceOrientationEvent" in window)){setSensorActive(false);setSensorError("This browser cannot provide a compass heading. Open the page on a phone with motion sensors.");return}
  try{
   const ctor=DeviceOrientationEvent as OrientationPermission;
   // iOS only permits requesting motion access during a real user gesture.
   if(typeof ctor.requestPermission==="function"&&motionPermission!==true){
    const result=await ctor.requestPermission();
    if(result!=="granted"){setSensorActive(false);setSensorWaiting(false);setSensorError("Motion access is off. Tap the compass to allow motion access.");return}
   }
   lastHeading.current=null;lastSensorTick.current=0;setSensorActive(false);setSensorWaiting(true);setSensorError("");
   setSession(n=>n+1);
  }catch{setSensorActive(false);setSensorWaiting(false);setSensorError("Could not activate the compass. Tap the compass again, or open this page directly in Safari.")}
 };
 const [session,setSession]=useState(0);
 useEffect(()=>{
  getLocation();
  const ctor=window.DeviceOrientationEvent as OrientationPermission|undefined;
  // iOS permission is requested by the launcher click, not by this mount effect.
  if(typeof ctor?.requestPermission==="function")return;
  void startCompass();
 },[]);
 useEffect(()=>{
  if(motionPermission===true){void startCompass()}
  else if(motionPermission===false){setSensorWaiting(false);setSensorActive(false);setSensorError("Motion access was denied. Tap the compass to retry.")}
 },[motionPermission]);
 useEffect(()=>{
  if(!session)return;
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
    setSensorError("No reliable compass heading was received. Tap the compass to retry, or open the page directly in Safari or Chrome.")
   }
  },2800);
  const stale=window.setInterval(()=>{if(lastSensorTick.current&&Date.now()-lastSensorTick.current>3500){
   setSensorActive(false);setSensorWaiting(false);
   setSensorError("Compass signal was lost. Tap the compass to reconnect.")
  }},1500);
  return()=>{live=false;clearTimeout(timer);clearInterval(stale);window.removeEventListener("deviceorientationabsolute",onOrientation,true);window.removeEventListener("deviceorientation",onOrientation,true)}
 },[session]);
  const compassReady=heading!==null&&sensorActive;
 return <section className="profileQiblaWidget" aria-label="Qibla Compass">
  <div className="qiblaWidgetHead"><div><h3>Qibla Compass</h3><p>Find the direction of the Kaaba in Makkah.</p></div><span className="qiblaWidgetMark" aria-hidden="true">◈</span></div>
  <button type="button" className="qiblaCompass" onClick={()=>void startCompass()} title="Tap to reconnect compass sensors" aria-label={bearing===null?"Location needed to calculate Qibla":`Qibla bearing ${Math.round(bearing)} degrees clockwise from true north. Tap to reconnect compass.`}>
   <svg className="qiblaVisual" viewBox="0 0 320 320" aria-hidden="true">
    <defs><radialGradient id="qiblaSurface"><stop offset="0%" stopColor="#eaf0f6"/><stop offset="40%" stopColor="#eaf0f6"/><stop offset="41%" stopColor="#dce8f2"/><stop offset="73%" stopColor="#dce8f2"/><stop offset="74%" stopColor="#edf4f9"/><stop offset="100%" stopColor="#fff"/></radialGradient></defs>
    <circle cx="160" cy="160" r="158" fill="url(#qiblaSurface)"/>
    <circle cx="160" cy="160" r="151" fill="none" stroke="#ffffffc4" strokeWidth="5"/>
    {Array.from({length:72},(_,i)=>{const angle=i*5-shownHeading,major=i%3===0;const p1=point(angle,major?134:141),p2=point(angle,150);return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={major?"#395572":"#90a6b8"} strokeWidth={major?2.4:1.1} strokeLinecap="round"/>})}
    {(["N","E","S","W"] as const).map((label,i)=>{const p=point(i*90-shownHeading,116);return <text key={label} x={p.x} y={p.y} fill="#23456a" fontSize="21" fontWeight="800" textAnchor="middle" dominantBaseline="central">{label}</text>})}
    {destination&&<>
     <line x1="160" y1="160" x2={destination.x} y2={destination.y} stroke="var(--qibla-accent)" strokeWidth="3.5" strokeLinecap="round"/>
     <circle cx={destination.x} cy={destination.y} r="19" fill="#233747" stroke="#fff" strokeWidth="1.8"/>
     <g transform={`translate(${destination.x},${destination.y})`}>
      <rect x="-10" y="-9" width="20" height="18" rx="1" fill="#d8ae57"/>
      <rect x="-8" y="-5" width="16" height="12" fill="#182632"/>
      <path d="M-8 -5H8M-8 -2H8" stroke="#e2bf6e" strokeWidth="1.5"/>
     </g>
    </>}
    <path d="M160 145L146 172Q145 175 149 175H171Q175 175 174 172Z" fill="#fff" stroke="#597e9e" strokeWidth="1.6" strokeLinejoin="round"/>
    <circle cx="160" cy="160" r="3" fill="#597e9e"/>
   </svg>
  </button>
  <strong className="qiblaBearing">{bearing===null?"Location required":`${Math.round(bearing)}° from true north`}</strong>
  {bearing!==null&&<p className="qiblaDirection" aria-live="polite">{compassReady?(poorAccuracy?"Compass accuracy is low — calibrate before relying on direction.":directionLabel):sensorWaiting?"Connecting to your phone’s compass…":"Tap the compass to activate live guidance."}</p>}
  {compassReady&&<p className="qiblaSensorStatus" role="status">● Live compass · Heading {Math.round(heading!)}°{sensorAccuracy!==null?" · Accuracy ±"+Math.round(sensorAccuracy)+"°":""}</p>}
  {compassReady&&poorAccuracy&&<p className="qiblaWarning" role="status">Low compass accuracy: move the phone in a figure-eight away from metal or magnets and check again.</p>}
  {locationError&&<p className="qiblaWarning" role="status">{locationError}</p>}
  {sensorError&&<p className="qiblaWarning" role="status">{sensorError}</p>}
  <div className="qiblaWidgetActions">
   <button type="button" onClick={getLocation} disabled={locationLoading}>⌖ {locationLoading?"Finding location…":"Update location"}</button>
  </div>
  <p className="qiblaHelp">Compass starts automatically when supported. On iPhone, approve the system motion prompt when opening Qibla. If the heading does not respond, tap the compass to retry. Hold the phone flat and away from metal.</p>
  <style jsx>{`
   .profileQiblaWidget{--qibla-accent:var(--theme-accent,var(--profile-accent,#789bb9));margin-top:16px;padding:20px 16px 18px;border:1px solid var(--qibla-accent);border-radius:22px;color:var(--foreground,#192739);background:var(--background,#fff);box-shadow:0 12px 32px #263c5212;scroll-margin-top:84px;animation:qiblaEnter .3s ease-out}
   @keyframes qiblaEnter{from{opacity:.4;transform:translateY(-9px)}to{opacity:1;transform:translateY(0)}}
   .qiblaWidgetHead{display:flex;align-items:center;justify-content:space-between}.qiblaWidgetHead h3{font-size:23px;margin:0;font-weight:800}.qiblaWidgetHead p{margin:4px 0 0;font-size:13px;opacity:.7}.qiblaWidgetMark{font-size:30px;color:var(--qibla-accent)}
   .qiblaCompass{display:block;cursor:pointer;padding:0;appearance:none;position:relative;width:min(80vw,320px);height:min(80vw,320px);margin:22px auto 16px;border:1px solid var(--qibla-accent);border-radius:50%;background:#eaf0f6;box-shadow:inset 0 0 0 6px #ffffff70,0 9px 27px #263c5220;overflow:hidden}
   .qiblaVisual{display:block;width:100%;height:100%;pointer-events:none}
   .qiblaBearing{display:block;text-align:center;font-size:17px}.qiblaDirection{text-align:center;font-size:13px;min-height:20px}.qiblaWarning{margin:8px 0;color:#9a4c29;font-size:13px}.qiblaWidgetActions{display:flex;justify-content:center;gap:8px;flex-wrap:wrap}.qiblaWidgetActions button{background:transparent;border:1px solid #c8d3de;border-radius:24px;padding:10px 12px;color:inherit;font-size:12px;font-weight:650;cursor:pointer;min-height:42px}
   .qiblaSensorStatus{text-align:center;font-size:12px;margin:6px auto 10px;color:#247c5d;line-height:1.5}.qiblaWidgetActions button:disabled{opacity:.55;cursor:wait}
   .qiblaCompass:focus-visible,.qiblaWidgetActions button:focus-visible{outline:2px solid var(--qibla-accent);outline-offset:2px}.qiblaHelp{text-align:center;font-size:11px;opacity:.64;line-height:1.6;margin:14px auto 0;max-width:420px}
   @media(prefers-reduced-motion:reduce){.profileQiblaWidget{animation:none}}
  `}</style>
 </section>;
}
