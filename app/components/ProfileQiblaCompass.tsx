"use client";

import {useEffect,useMemo,useRef,useState} from "react";
import Link from "next/link";
import {magneticField} from "magvar";
import "./profile-qibla-navigation.css";

const MAKKAH={latitude:21.422487,longitude:39.826206};
const wrap=(degrees:number)=>((degrees%360)+360)%360;
const point=(angle:number,radius:number)=>{
 const radians=(wrap(angle)-90)*Math.PI/180;
 return {x:160+radius*Math.cos(radians),y:160+radius*Math.sin(radians)};
};
function bearingToKaaba(latitude:number,longitude:number){
 // Initial great-circle bearing from geodetic coordinates to the Kaaba.
 const rad=Math.PI/180,lat1=latitude*rad,lat2=MAKKAH.latitude*rad;
 const dLon=(MAKKAH.longitude-longitude)*rad;
 return wrap(Math.atan2(Math.sin(dLon),Math.cos(lat1)*Math.tan(lat2)-Math.sin(lat1)*Math.cos(dLon))/rad);
}
const compassPoint=(value:number)=>["N","NE","E","SE","S","SW","W","NW"][Math.round(wrap(value)/45)%8];
type SensorSource="magnetic"|"absolute"|null;
type SensorEvent=DeviceOrientationEvent&{webkitCompassHeading?:number;webkitCompassAccuracy?:number};
type PermissionEvent=typeof DeviceOrientationEvent&{requestPermission?:(absolute?:boolean)=>Promise<"granted"|"denied">};
type GeoCoords={latitude:number;longitude:number;accuracy:number};

export default function ProfileQiblaCompass({motionPermission=null}:{motionPermission?:boolean|null}){
 const [coords,setCoords]=useState<GeoCoords|null>(null);
 const [locationError,setLocationError]=useState("");
 const [locationBusy,setLocationBusy]=useState(false);
 const [heading,setHeading]=useState<number|null>(null);
 const [sensorSource,setSensorSource]=useState<SensorSource>(null);
 const [sensorAccuracy,setSensorAccuracy]=useState<number|null>(null);
 const [sensorError,setSensorError]=useState("");
 const [sensorActive,setSensorActive]=useState(false);
 const [sensorWaiting,setSensorWaiting]=useState(false);
 const [detailsOpen,setDetailsOpen]=useState(false);
 const [session,setSession]=useState(0);
 const previousHeading=useRef<number|null>(null);
 const lastSensorTick=useRef(0);
 const lastPaint=useRef(0);

 const bearing=useMemo(()=>coords?bearingToKaaba(coords.latitude,coords.longitude):null,[coords]);
 const geomagnetic=useMemo(()=>{
  if(!coords)return null;
  const currentYear=new Date().getUTCFullYear();
  if(currentYear<2025||currentYear>=2030)return null; // Never silently extrapolate an expired model.
  try{
   const model=magneticField(coords.latitude,coords.longitude,0,new Date());
   return Number.isFinite(model.declination)&&Number.isFinite(model.h)
    ?{declination:model.declination,horizontalField:model.h}:null;
  }catch{return null}
 },[coords]);
 const declination=geomagnetic?.declination??null;
 const weakField=geomagnetic!==null&&geomagnetic.horizontalField<5000;
 const live=sensorActive&&heading!==null;
 // Apple WebKit compass and world-frame orientation reference magnetic north.
 // WMM2025 supplies the local east-positive magnetic variation; apply once to
 // convert the sensor heading into true-north heading before computing the turn.
 const trueHeading=live&&declination!==null?wrap(heading!+declination):null;
 const turn=bearing===null||trueHeading===null?null:((bearing-trueHeading+540)%360)-180;
 const delta=turn===null?null:Math.abs(turn);
 const poorAccuracy=weakField||(sensorAccuracy!==null&&sensorAccuracy>22);
 const aligned=delta!==null&&delta<=6&&!poorAccuracy&&declination!==null&&sensorAccuracy!==null&&sensorAccuracy<=12;
 const approximate=delta!==null&&delta<=10&&!aligned;
 const northOffset=trueHeading??(live?heading!:0);
 const kaabaAngle=bearing===null?null:wrap(bearing-northOffset);
 const marker=kaabaAngle===null?null:point(kaabaAngle,126);
 const ray=kaabaAngle===null?null:point(kaabaAngle,103);
 const sector=kaabaAngle===null?null:[point(kaabaAngle-8,108),point(kaabaAngle+8,108)];
 const turnLabel=turn===null?live?"Calibrating north reference":"Enable compass for live guidance":aligned?"Aligned toward Qibla":approximate?"Nearly aligned":turn>0?`Turn ~${Math.round(turn)}° clockwise`:`Turn ~${Math.round(-turn)}° counterclockwise`;
 const locationHint=coords?.accuracy!==undefined?coords.accuracy>=1500?`Location is approximate (±${Math.round(coords.accuracy/1000)} km).`:`Location accuracy ±${Math.round(coords.accuracy)} m`:"";

 const locate=()=>{
  if(!navigator.geolocation){setLocationError("Your browser does not support location. Enable location services to calculate Qibla.");return}
  setLocationBusy(true);setLocationError("");
  navigator.geolocation.getCurrentPosition(
   p=>{setCoords({latitude:p.coords.latitude,longitude:p.coords.longitude,accuracy:p.coords.accuracy});setLocationBusy(false)},
   error=>{
    setLocationBusy(false);
    setLocationError(error.code===1?"Allow location access in your browser settings, then select Update location.":"Could not read your location. Try again with location services enabled.");
   },{enableHighAccuracy:true,timeout:14000,maximumAge:45000}
  );
 };
 const activate=async()=>{
  if(!window.isSecureContext){setSensorWaiting(false);setSensorActive(false);setSensorError("A secure HTTPS connection is required for live compass guidance.");return}
  const eventType=window.DeviceOrientationEvent as PermissionEvent|undefined;
  if(!eventType){setSensorWaiting(false);setSensorActive(false);setSensorError("This device does not expose an orientation compass. The true-north bearing is still shown.");return}
  try{
   // iOS permission must come from a tap; the launcher may already have requested it.
   if(typeof eventType.requestPermission==="function"&&motionPermission!==true){
    if(await eventType.requestPermission(true)!=="granted"){
     setSensorWaiting(false);setSensorActive(false);
     setSensorError("Motion permission is off. Tap Start compass to allow sensor access.");return;
    }
   }
   previousHeading.current=null;lastSensorTick.current=0;lastPaint.current=0;
   setHeading(null);setSensorActive(false);setSensorWaiting(true);setSensorError("");setSensorAccuracy(null);
   setSession(n=>n+1);
  }catch{setSensorWaiting(false);setSensorActive(false);setSensorError("Motion access could not start. Tap Start compass again in Safari or Chrome.")}
 };

 useEffect(()=>{
  locate();
  const ctor=window.DeviceOrientationEvent as PermissionEvent|undefined;
  if(typeof ctor?.requestPermission!=="function")void activate();
 // Mount once; iOS requests are only made on an explicit launcher or compass tap.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);
 useEffect(()=>{
  if(motionPermission===true)void activate();
  if(motionPermission===false){setSensorActive(false);setSensorWaiting(false);setSensorError("Motion access was denied. Tap Start compass to try again.")}
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[motionPermission]);
 useEffect(()=>{
  if(!session)return;
  let mounted=true;
  const onHeading=(event:DeviceOrientationEvent)=>{
   if(!mounted)return;
   const compass=event as SensorEvent;
   let raw:number|null=null,source:SensorSource=null,accuracy:number|null=null;
   if(typeof compass.webkitCompassHeading==="number"&&Number.isFinite(compass.webkitCompassHeading)&&compass.webkitCompassHeading>=0){
    raw=compass.webkitCompassHeading;source="magnetic";
    if(typeof compass.webkitCompassAccuracy==="number"&&Number.isFinite(compass.webkitCompassAccuracy)&&compass.webkitCompassAccuracy>=0)accuracy=compass.webkitCompassAccuracy;
   }else if((event.absolute||event.type==="deviceorientationabsolute")&&typeof event.alpha==="number"&&Number.isFinite(event.alpha)){
    raw=360-event.alpha;source="absolute";
   }
   if(raw===null)return; // Relative alpha is not a geographic compass.
   const rotation=Number(window.screen.orientation?.angle??(window as Window&{orientation?:number}).orientation??0);
   const next=wrap(raw-(Number.isFinite(rotation)?rotation:0));
   const now=performance.now();
   // Preserve a responsive compass while suppressing sensor jitter; circular interpolation
   // always takes the short direction across 0°/360°.
   if(now-lastPaint.current<45)return;
   lastPaint.current=now;
   const before=previousHeading.current;
   const diff=before===null?0:((next-before+540)%360)-180;
   const smoothed=before===null?next:wrap(before+diff*.54);
   previousHeading.current=smoothed;
   lastSensorTick.current=Date.now();
   setHeading(smoothed);
   setSensorSource(source);
   setSensorAccuracy(accuracy);
   setSensorActive(true);setSensorWaiting(false);setSensorError("");
  };
  window.addEventListener("deviceorientationabsolute",onHeading,true);
  window.addEventListener("deviceorientation",onHeading,true);
  const startup=window.setTimeout(()=>{
   if(mounted&&Date.now()-lastSensorTick.current>3100){
    setSensorWaiting(false);setSensorActive(false);
    setSensorError("A compass heading was not received. Tap Start compass to retry or check motion permissions.");
   }
  },3400);
  const watch=window.setInterval(()=>{
   if(lastSensorTick.current&&Date.now()-lastSensorTick.current>4200){
    setSensorActive(false);setSensorWaiting(false);setSensorError("Compass disconnected. Tap Start compass to reconnect.");
   }
  },1400);
  return()=>{
   mounted=false;window.clearTimeout(startup);window.clearInterval(watch);
   window.removeEventListener("deviceorientationabsolute",onHeading,true);
   window.removeEventListener("deviceorientation",onHeading,true);
  };
 },[session]);

 return <section className="qcnRoot" data-aligned={aligned?"yes":"no"} aria-label="Qibla navigation compass">
   <div className="qcnHeader">
    <div><span className="qcnKicker">1MUSLIM · PRAYER DIRECTION</span><h3>Qibla Navigator</h3><p>A clearer way to find Makkah.</p></div>
    <button type="button" className="qcnInfo" aria-label={detailsOpen?"Hide compass guidance":"Show compass guidance"} aria-expanded={detailsOpen} onClick={()=>setDetailsOpen(v=>!v)}>i</button>
   </div>
   <div className="qcnStatusRow">
    <span className={"qcnLivePill"+(live?" is-live":"")}><i aria-hidden="true"/>{live?(declination!==null?"TRUE NORTH · LIVE":"MAGNETIC · LIVE"):sensorWaiting?"CONNECTING":"NORTH REFERENCE"}</span>
    <span className="qcnLocationPill" title={locationHint}>{coords?"⌖ Device location":"⌖ Location needed"}</span>
   </div>
   <div className="qcnCompassWrap">
    <button type="button" className="qcnCompass" onClick={()=>void activate()} aria-label={bearing===null?"Update your location for Qibla navigation":`Qibla bearing ${Math.round(bearing)} degrees from true north. Tap to activate or recalibrate compass.`}>
     <svg className="qcnDial" viewBox="0 0 320 320" role="img" aria-label="Compass dial with Kaaba direction and fixed phone-forward pointer">
      <defs>
       <radialGradient id="qcnDialFill" cx="43%" cy="34%" r="75%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity=".8"/>
        <stop offset="62%" stopColor="var(--qcn-color)" stopOpacity=".045"/>
        <stop offset="100%" stopColor="var(--qcn-color)" stopOpacity=".17"/>
       </radialGradient>
       <linearGradient id="qcnNeedle" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffffff"/><stop offset="100%" stopColor="var(--qcn-color)" stopOpacity=".9"/></linearGradient>
       <filter id="qcnSoftShadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#30445a" floodOpacity=".16"/></filter>
      </defs>
      <circle cx="160" cy="160" r="157.5" fill="url(#qcnDialFill)" stroke="var(--qcn-ring)" strokeWidth="1.7"/>
      <circle cx="160" cy="160" r="149" fill="none" stroke="var(--qcn-color)" strokeOpacity=".14" strokeWidth="1"/>
      <circle cx="160" cy="160" r="108" fill="var(--qcn-inner)" stroke="var(--qcn-color)" strokeOpacity=".16" strokeWidth="1"/>
      <circle cx="160" cy="160" r="77" fill="none" stroke="var(--qcn-color)" strokeOpacity=".11" strokeDasharray="3 8"/>
      {Array.from({length:120},(_,i)=>{
       const a=i*3-northOffset,major=i%10===0,mid=i%5===0;
       const begin=point(a,major?139:mid?144:147),end=point(a,152);
       return <line key={i} x1={begin.x} y1={begin.y} x2={end.x} y2={end.y} stroke="var(--qcn-tick)" strokeOpacity={major?.82:mid?.47:.23} strokeWidth={major?2.4:mid?1.5:.9} strokeLinecap="round"/>;
      })}
      {Array.from({length:12},(_,i)=>{
       if(i%3===0)return null;
       const deg=i*30,p=point(deg-northOffset,91);
       return <text key={deg} x={p.x} y={p.y} fontSize="10.4" fontWeight="650" fill="var(--qcn-muted)" textAnchor="middle" dominantBaseline="middle">{deg}°</text>;
      })}
      {(["N","E","S","W"] as const).map((card,i)=>{
       const p=point(i*90-northOffset,122);
       return <text key={card} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fill={card==="N"?"var(--qcn-color)":"var(--qcn-ink)"} fontSize="17" fontWeight="800">{card}</text>;
      })}
      <line x1="160" y1="53" x2="160" y2="267" stroke="var(--qcn-color)" strokeOpacity=".17" strokeDasharray="4 5"/>
      <line x1="53" y1="160" x2="267" y2="160" stroke="var(--qcn-color)" strokeOpacity=".17" strokeDasharray="4 5"/>
      {ray&&sector&&<path d={`M160 160 L${sector[0].x.toFixed(1)} ${sector[0].y.toFixed(1)} A108 108 0 0 1 ${sector[1].x.toFixed(1)} ${sector[1].y.toFixed(1)} Z`} fill="var(--qcn-color)" fillOpacity=".16"/>}
      {ray&&<line x1="160" y1="160" x2={ray.x} y2={ray.y} stroke="var(--qcn-color)" strokeWidth="2.6" strokeLinecap="round" opacity=".92"/>}
      {marker&&<g transform={`translate(${marker.x.toFixed(2)},${marker.y.toFixed(2)})`} filter="url(#qcnSoftShadow)">
       <circle r="18.5" fill="var(--qcn-badge)" stroke="var(--qcn-color)" strokeWidth="1.8"/>
       <path d="M-9 -5h18v15H-9z" fill="#202832" rx="1"/>
       <path d="M-9 -5h18v4H-9z" fill="var(--qcn-color)" />
       <path d="M-9 1h18M-9 7h18" stroke="#d7d9da" strokeWidth=".85" strokeOpacity=".55"/>
      </g>}
      <g filter="url(#qcnSoftShadow)">
       <path d="M160 117 L145 191 L160 181 L175 191 Z" fill="#ffffff" stroke="var(--qcn-color)" strokeWidth="2.1" strokeLinejoin="round"/>
       <path d="M160 117 L160 181 L175 191 Z" fill="url(#qcnNeedle)" opacity=".96"/>
       <circle cx="160" cy="160" r="5" fill="var(--qcn-color)" stroke="#fff" strokeWidth="1.9"/>
      </g>
     </svg>
     <span className="qcnForward">YOUR PHONE</span>
    </button>
   </div>
   <div className="qcnGuidance" role="status">
    <span className="qcnInstructionTag">{aligned?"✓ ON COURSE":live?"REAL-TIME GUIDANCE":"LOCATION QIBLA BEARING"}</span>
    <strong className="qcnInstruction">{bearing===null?"Set your location":poorAccuracy?"Calibrate your compass":turnLabel}</strong>
    <p>{bearing===null?"Allow location to calculate the direction to the Kaaba.":aligned?"Your phone is pointing near Makkah. Recheck if you move.":live?poorAccuracy?"Accuracy is limited. Move your phone in a figure eight away from nearby metal.":"Keep the top of your phone pointing forward; the Kaaba marker guides your turn.":"The Kaaba marker shows the bearing from geographic north. Enable your compass to see how far to turn."}</p>
   </div>
   <div className="qcnReadouts" aria-label="Navigation measurements">
    <div><span>QIBLA</span><strong>{bearing===null?"—":`${Math.round(bearing)}° ${compassPoint(bearing)}`}</strong><small>True north</small></div>
    <div><span>PHONE</span><strong>{trueHeading!==null?`${Math.round(trueHeading)}°`:live?"≈"+Math.round(heading!)+"°":"—"}</strong><small>{trueHeading!==null?"WMM true north":live?"Magnetic north":"Awaiting sensor"}</small></div>
    <div><span>TURN</span><strong>{turn===null?"—":`${Math.round(Math.abs(turn))}°`}</strong><small>{turn===null?"—":Math.abs(turn)<=6?"Near target":turn>0?"Clockwise ↻":"↺ Counterclockwise"}</small></div>
   </div>
   <div className="qcnControls">
    <button type="button" onClick={locate} disabled={locationBusy} aria-label="Update GPS location">⌖ <span>{locationBusy?"Finding location…":"Update location"}</span></button>
    <button type="button" onClick={()=>void activate()} aria-label="Start or recalibrate compass">↻ <span>{sensorWaiting?"Connecting…":live?"Recalibrate":"Start compass"}</span></button>
    <Link href="/widget-tools/prayer" aria-label="View prayer times">Prayer times <span aria-hidden="true">↗</span></Link>
   </div>
   {locationError&&<p className="qcnAlert" role="alert">{locationError}</p>}
   {sensorError&&<p className="qcnAlert" role="status">{sensorError}</p>}
   {detailsOpen&&<div className="qcnDetails">
    <strong>About direction accuracy</strong>
    <p>The Qibla bearing follows the great-circle route from the browser-reported location to the Kaaba. WMM2025 converts magnetic device heading to true north using magnetic declination for your current location and date. Hardware interference, permission and sensor calibration can still affect alignment accuracy.</p>
    {declination!==null&&<p>Local magnetic variation: {declination>=0?"+":""}{declination.toFixed(1)}° ({declination>=0?"east":"west"}). Source: NOAA/UK World Magnetic Model 2025–2030. Sensor: {sensorSource==="magnetic"?"iOS magnetic heading":sensorSource==="absolute"?"absolute device orientation":"not connected"}.</p>}
    {weakField&&<p>Weak horizontal magnetic field detected. Exact phone alignment may be unreliable in this region.</p>}
    {locationHint&&<p>{locationHint}</p>}
    {sensorAccuracy!==null&&<p>Reported sensor accuracy: ±{Math.round(sensorAccuracy)}°. {poorAccuracy?"Recalibrate before using live guidance.":""}</p>}
    <p>Keep the phone flat and away from metal, magnets and electronic interference. On iPhone, motion access requires a tap. If the compass is unavailable, use the geographic bearing and a calibrated compass.</p>
   </div>}
 </section>;
}
