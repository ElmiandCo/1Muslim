"use client";
import {useEffect,useMemo,useState} from "react";
import {COUNTRY_POINTS,STATE_POINTS} from "./admin-region-points";
import "./AdminRegionIntelligence.css";

type RegionCount={count:number;country?:string;state?:string};
type RegionSummary={optedIn:number;mapped:number;withoutCountry:number;totalMembers:number|null;usLocated:number;usWithState:number;countries:Array<{country:string;count:number}>;usStates:Array<{state:string;count:number}>;updatedAt:string;truncated:boolean;definition:string};
type MapMode="world"|"us";
const fmt=(value:number)=>value.toLocaleString();
export default function AdminRegionIntelligence(){
 const [data,setData]=useState<RegionSummary|null>(null),[error,setError]=useState(""),[mode,setMode]=useState<MapMode>("world"),[selected,setSelected]=useState("");
 const [refreshing,setRefreshing]=useState(false);
 useEffect(()=>{
  let active=true;
  const load=async()=>{
   if(!active)return;setRefreshing(true);
   try{const response=await fetch("/api/admin/member-regions",{cache:"no-store"});
    const body=await response.json();if(!response.ok)throw Error(body.error||"Unable to read saved member regions");
    if(active){setData(body);setError("")}
   }catch(e){if(active)setError(e instanceof Error?e.message:"Region analytics unavailable")}
   finally{if(active)setRefreshing(false)}
  };
  void load();const timer=window.setInterval(()=>{if(document.visibilityState==="visible")void load()},120000);
  const onFocus=()=>{if(document.visibilityState==="visible")void load()};
  document.addEventListener("visibilitychange",onFocus);
  return()=>{active=false;window.clearInterval(timer);document.removeEventListener("visibilitychange",onFocus)}
 },[]);
 const locations=useMemo(()=>{
  if(!data)return [];
  const entries:RegionCount[]=mode==="world"?data.countries:data.usStates;
  const points=mode==="world"?COUNTRY_POINTS:STATE_POINTS;
  return entries.map(entry=>{const name=entry.country||entry.state||"Unknown";return {name,count:entry.count,point:points[name]}}).filter((entry):entry is {name:string;count:number;point:[number,number]}=>Array.isArray(entry.point));
 },[data,mode]);
 const ranking:RegionCount[]=mode==="world"?(data?.countries||[]):(data?.usStates||[]);
 const mappedStates=data?.usStates.length??0;
 const changeMode=(next:MapMode)=>{setMode(next);setSelected("")};
 return <section className="adminRegionIntel" aria-label="Consent-based Ummah member location atlas">
  <div className="adminRegionHeader"><div><span className="adminRegionEyebrow">HUDHUD · MEMBERSHIP INTELLIGENCE</span><h3>Ummah <em>Atlas</em> <span aria-hidden="true">✦</span></h3><p>Where members voluntarily chose to appear. Country and state aggregates only.</p></div><button className="adminRegionLive" type="button" onClick={()=>{void fetch("/api/admin/member-regions",{cache:"no-store"}).then(async r=>{const body=await r.json();if(!r.ok)throw Error(body.error||"Unavailable");setData(body);setError("")}).catch(e=>setError(e.message))}} aria-label="Refresh member atlas"><span className={refreshing?"adminRegionPulse":""}>●</span> {refreshing?"Updating":"Live data"} ↻</button></div>
  {error&&<p className="adminRegionError" role="alert">{error}</p>}
  <div className="adminRegionStats" aria-label="Region sharing statistics">
   <div><span>MEMBERS ON THE MAP</span><strong>{data?fmt(data.mapped):"—"}</strong><small>Saved region + explicit consent</small></div>
   <div><span>SHARING OPTED IN</span><strong>{data?fmt(data.optedIn):"—"}</strong><small>{data?fmt(data.withoutCountry)+" without saved country":"Waiting for data"}</small></div>
   <div><span>COUNTRIES</span><strong>{data?fmt(data.countries.length):"—"}</strong><small>Members located worldwide</small></div>
   <div><span>U.S. STATES</span><strong>{data?fmt(mappedStates):"—"}</strong><small>{data?fmt(data.usLocated)+" U.S. members":"Waiting for data"}</small></div>
  </div>
  <div className="adminRegionControls"><div className="adminRegionToggle" role="group" aria-label="Choose atlas map"><button type="button" className={mode==="world"?"active":""} aria-pressed={mode==="world"} onClick={()=>changeMode("world")}>◎ World Map</button><button type="button" className={mode==="us"?"active":""} aria-pressed={mode==="us"} onClick={()=>changeMode("us")}>⌖ United States</button></div><div className="adminRegionCoverage">{data?.totalMembers?Math.round(100*data.mapped/data.totalMembers)+"% of profiles opted in and mapped":"Voluntary · Privacy-first"}</div></div>
  <div className="adminRegionVisualGrid">
   <div className="adminRegionMapShell"><div className="adminRegionMapTop"><span>{mode==="world"?"GLOBAL PRESENCE":"UNITED STATES · REGIONAL PRESENCE"}</span><span>◉ ACTUAL MEMBER COUNTS</span></div>
    <svg viewBox="0 0 720 360" role="img" aria-label={mode==="world"?"Map of countries with consenting 1Muslim members":"United States map of saved state-level member locations"}>
     <defs><radialGradient id="adminRegionOcean" cx="45%" cy="36%" r="82%"><stop offset="0%" stopColor="#174565"/><stop offset="100%" stopColor="#061522"/></radialGradient><filter id="adminRegionGlow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="6"/></filter></defs>
     <rect width="720" height="360" fill="url(#adminRegionOcean)"/>
     <g stroke="#83d7e7" strokeOpacity=".09" strokeWidth=".8"><path d="M0 60H720M0 120H720M0 180H720M0 240H720M0 300H720M60 0V360M120 0V360M180 0V360M240 0V360M300 0V360M360 0V360M420 0V360M480 0V360M540 0V360M600 0V360M660 0V360"/></g>
     <image href={mode==="world"?"/maps/ummah-world.svg":"/maps/ummah-united-states.svg"} width="720" height="360" x="0" y="0" preserveAspectRatio="xMidYMid meet"/>
     {locations.map(({name,count,point})=><g key={name} role="button" tabIndex={0} className="adminRegionPin" aria-label={name+" "+count+" opted-in members"} onClick={()=>setSelected(name)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setSelected(name)}}} style={{cursor:"pointer"}}>
      <circle cx={point[0]} cy={point[1]} r={Math.min(22,9+Math.log2(count+1)*2)} fill="#56f3d2" fillOpacity=".48" filter="url(#adminRegionGlow)"/>
      <circle cx={point[0]} cy={point[1]} r={Math.min(13,4+Math.log2(count+1)*1.5)} stroke={selected===name?"#fff5c8":"#a2ffec"} strokeWidth={selected===name?2.4:1} fill={selected===name?"#f7c77b":"#45d2c3"} fillOpacity=".88"/>
      <circle cx={point[0]} cy={point[1]} r="2" fill="#ffffff"/><title>{name}: {fmt(count)} consenting members</title>
     </g>)}
    </svg>
    <div className="adminRegionMapFoot"><span><b>●</b> {mode==="world"?"Countries with shared regions":"States with shared regions"}</span><span>Aggregated locations · not GPS</span></div>
   </div>
   <aside className="adminRegionRanking"><div className="adminRegionRankingTitle"><strong>{selected|| (mode==="world"?"Top Countries":"Top States")}</strong><span>{selected?"SELECTED REGION":"BY MEMBERS"}</span></div>
    {selected&&<div className="adminRegionSelected"><strong>{fmt(ranking?.find(x=>(x.country||x.state)===selected)?.count||0)}</strong><span>members opted in</span><button type="button" onClick={()=>setSelected("")}>Show all ↗</button></div>}
    <div className="adminRegionRankRows">{!data?<p>Loading saved member locations…</p>:ranking?.length?ranking.slice(0,9).map((row,i)=>{const name=row.country||row.state||"";return <button type="button" key={name} onClick={()=>setSelected(name)} className={selected===name?"chosen":""}><span className="adminRegionRankOrdinal">{String(i+1).padStart(2,"0")}</span><span className="adminRegionRankName">{name}</span><strong>{fmt(row.count)}</strong></button>}):<p>No members have shared a location for this view yet.</p>}</div>
   </aside>
  </div>
  <footer className="adminRegionFooter"><span>🔒 {data?.definition||"Only explicitly shared regions will appear on these maps."}</span><span>{data?.truncated?"Partial data: safety cap reached":data?.updatedAt?"Updated "+new Date(data.updatedAt).toLocaleTimeString():""}</span></footer>
 </section>;
}
