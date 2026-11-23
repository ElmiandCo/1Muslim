"use client";
import {useCallback,useEffect,useMemo,useRef,useState,type PointerEvent as ReactPointerEvent,type MouseEvent as ReactMouseEvent} from "react";
import {createClient} from "../../utils/supabase/client";
import {COUNTRY_POINTS,STATE_POINTS} from "./admin-region-points";
import "./RegionDiscovery.css";

const aliases:Record<string,string>={
 "usa":"United States","us":"United States","u s a":"United States","united states of america":"United States","america":"United States",
 "uk":"United Kingdom","u k":"United Kingdom","great britain":"United Kingdom","britain":"United Kingdom",
 "uae":"United Arab Emirates","u a e":"United Arab Emirates","emirates":"United Arab Emirates",
 "ksa":"Saudi Arabia","kingdom of saudi arabia":"Saudi Arabia",
 "republic of somalia":"Somalia","turkiye":"Türkiye","turkey":"Türkiye",
 "ivory coast":"Côte d’Ivoire","cote d ivoire":"Côte d’Ivoire","drc":"Democratic Republic of the Congo",
 "the netherlands":"Netherlands","holland":"Netherlands","palestinian territories":"Palestine","state of palestine":"Palestine"
};
const codes:Record<string,string>={"US":"United States","GB":"United Kingdom","AE":"United Arab Emirates","SA":"Saudi Arabia","SO":"Somalia","TR":"Türkiye","PS":"Palestine","KR":"South Korea","KP":"North Korea","RU":"Russia","CI":"Côte d’Ivoire","CD":"Democratic Republic of the Congo"};
const clean=(v:string)=>v.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
export function canonicalCountry(value:string|null|undefined):string{
 const raw=(value||"").trim();if(!raw)return "";
 const key=clean(raw);if(aliases[key])return aliases[key];
 if(raw.length===2&&/^[a-z]{2}$/i.test(raw)){const code=raw.toUpperCase();if(codes[code])return codes[code];try{const label=new Intl.DisplayNames(["en"],{type:"region"}).of(code);if(label&&label!==code)return label}catch{}}
 return raw;
}
const usStates=Object.fromEntries(("AL:Alabama,AK:Alaska,AZ:Arizona,AR:Arkansas,CA:California,CO:Colorado,CT:Connecticut,DE:Delaware,FL:Florida,GA:Georgia,HI:Hawaii,ID:Idaho,IL:Illinois,IN:Indiana,IA:Iowa,KS:Kansas,KY:Kentucky,LA:Louisiana,ME:Maine,MD:Maryland,MA:Massachusetts,MI:Michigan,MN:Minnesota,MS:Mississippi,MO:Missouri,MT:Montana,NE:Nebraska,NV:Nevada,NH:New Hampshire,NJ:New Jersey,NM:New Mexico,NY:New York,NC:North Carolina,ND:North Dakota,OH:Ohio,OK:Oklahoma,OR:Oregon,PA:Pennsylvania,RI:Rhode Island,SC:South Carolina,SD:South Dakota,TN:Tennessee,TX:Texas,UT:Utah,VT:Vermont,VA:Virginia,WA:Washington,WV:West Virginia,WI:Wisconsin,WY:Wyoming,DC:District of Columbia").split(",").map(x=>x.split(":")));
export function canonicalUsState(value:string|null|undefined){const raw=(value||"").trim();return usStates[raw.toUpperCase()]||Object.values(usStates).find(name=>name.toLowerCase()===raw.toLowerCase())||raw}
type Stats={countries:{name:string;count:number}[];states:{name:string;count:number}[];optedIn:number;recorded:number;unplaced:number;usCount:number;updatedAt:string;limited:boolean};
type Mode="world"|"us";
type Props={members:Array<{country:string|null}>;currentCountry:string|null;userId:string;selected:string;selectedState?:string;onSelect:(value:string)=>void;onSelectState?:(value:string)=>void;onSaved:(value:string)=>void};
const fmt=(n:number)=>n.toLocaleString();
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
function bound(z:number,x:number,y:number){return {x:clamp(x,720*(1-z),0),y:clamp(y,360*(1-z),0)}}
export default function RegionDiscovery({currentCountry,userId,selected,selectedState="",onSelect,onSelectState,onSaved}:Props){
 const [stats,setStats]=useState<Stats|null>(null),[fetchError,setFetchError]=useState("");
 const [mode,setMode]=useState<Mode>("world"),[query,setQuery]=useState(""),[editing,setEditing]=useState(false);
 const [country,setCountry]=useState(canonicalCountry(currentCountry)),[state,setState]=useState(""),[city,setCity]=useState("");
 const [saving,setSaving]=useState(false),[message,setMessage]=useState("");
 const [zoom,setZoom]=useState(1.12),[pan,setPan]=useState({x:-43.2,y:-21.6}),[dragging,setDragging]=useState(false);
 const gesture=useRef<{id:number;x:number;y:number;dragging:boolean}|null>(null),ignoreClick=useRef(false),mapRef=useRef<SVGSVGElement|null>(null);
 useEffect(()=>{setCountry(canonicalCountry(currentCountry))},[currentCountry]);
 useEffect(()=>{
  if(!editing)return;
  let active=true;
  void createClient().from("profiles").select("country,state,city").eq("id",userId).maybeSingle().then(({data})=>{
   if(!active||!data)return;
   setCountry(canonicalCountry(data.country));setState(data.state||"");setCity(data.city||"");
  });
  return()=>{active=false};
 },[editing,userId]);
 const load=useCallback(async()=>{
  try{const response=await fetch("/api/member-regions",{cache:"no-store"});const body=await response.json();
   if(!response.ok)throw Error(body.error||"Member atlas unavailable");
   setStats(body as Stats);setFetchError("");
  }catch(e){setFetchError(e instanceof Error?e.message:"Unable to load member atlas")}
 },[]);
 useEffect(()=>{void load();const timer=window.setInterval(()=>{if(document.visibilityState==="visible")void load()},120000);
  const refresh=()=>{if(document.visibilityState==="visible")void load()};document.addEventListener("visibilitychange",refresh);
  return()=>{clearInterval(timer);document.removeEventListener("visibilitychange",refresh)};
 },[load]);
 const rows=mode==="world"?(stats?.countries||[]):(stats?.states||[]);
 const focusName=mode==="us"?selectedState:selected;
 const selectedCount=(mode==="us"?stats?.states:stats?.countries)?.find(r=>r.name===focusName)?.count||0;
 const lookup=mode==="world"?COUNTRY_POINTS:STATE_POINTS;
 const pins=useMemo(()=>rows.map(({name,count})=>({name,count,point:lookup[name]})).filter(p=>Array.isArray(p.point)),[rows,lookup]);
 const filtered=rows.filter(r=>r.name.toLowerCase().includes(query.trim().toLowerCase()));
 const displayRows=query.trim()?filtered:filtered.slice(0,10);
 const setView=(next:Mode)=>{setMode(next);setZoom(1.12);setPan({x:-43.2,y:-21.6});setQuery("")};
 const changeZoom=(next:number)=>{
  const z=clamp(next,1,3.6),ratio=z/zoom;
  setPan(prev=>bound(z,360-(360-prev.x)*ratio,180-(180-prev.y)*ratio));setZoom(z);
 };
 const focusRegion=(name:string,point?:[number,number])=>{
  if(mode==="world"){onSelect(name);onSelectState?.("")}
  else{onSelect("United States");onSelectState?.(name)}
  if(point){const z=Math.max(zoom,1.55);setZoom(z);setPan(bound(z,360-point[0]*z,180-point[1]*z))}
 };
 const resetView=()=>{setZoom(1);setPan({x:0,y:0})};
 const pointerDown=(e:ReactPointerEvent<SVGSVGElement>)=>{
  if(e.pointerType==="mouse"&&e.button!==0)return;
  gesture.current={id:e.pointerId,x:e.clientX,y:e.clientY,dragging:false};
 };
 const pointerMove=(e:ReactPointerEvent<SVGSVGElement>)=>{
  const g=gesture.current;if(!g||g.id!==e.pointerId)return;
  const dx=e.clientX-g.x,dy=e.clientY-g.y;
  if(!g.dragging){
   if(Math.abs(dx)<7)return;
   // Vertical touch motion still scrolls the page naturally.
   if(e.pointerType==="touch"&&Math.abs(dx)<Math.abs(dy)*1.25)return;
   g.dragging=true;setDragging(true);ignoreClick.current=true;
   try{e.currentTarget.setPointerCapture(e.pointerId)}catch{}
  }
  g.x=e.clientX;g.y=e.clientY;
  const rect=mapRef.current?.getBoundingClientRect();
  const scale=rect?720/Math.max(rect.width,1):1;
  setPan(prev=>bound(zoom,prev.x+dx*scale,prev.y+dy*scale));
 };
 const pointerUp=(e:ReactPointerEvent<SVGSVGElement>)=>{
  const g=gesture.current;if(!g||g.id!==e.pointerId)return;
  if(g.dragging){try{e.currentTarget.releasePointerCapture(e.pointerId)}catch{}}
  gesture.current=null;setDragging(false);
  if(ignoreClick.current)window.setTimeout(()=>{ignoreClick.current=false},120);
 };
 const swallowDragClick=(e:ReactMouseEvent<SVGSVGElement>)=>{if(ignoreClick.current){e.preventDefault();e.stopPropagation();ignoreClick.current=false}};
 const save=async()=>{
  const normalized=canonicalCountry(country);if(!normalized){setMessage("Choose a country before saving.");return}
  setSaving(true);setMessage("");
  try{
   const db=createClient();const {data:{user}}=await db.auth.getUser();
   if(user?.id!==userId)throw Error("Please sign in again to share your region.");
   const {error:profileError}=await db.from("profiles").update({country:normalized,state:state.trim()||null,city:city.trim()||null}).eq("id",userId);
   if(profileError)throw Error("Could not update your profile region: "+profileError.message);
   const {error:consentError}=await db.from("member_region_preferences").upsert({
    user_id:userId,region_level:city.trim()?"city":state.trim()?"state":"country",consented_at:new Date().toISOString()
   },{onConflict:"user_id"});
   if(consentError)throw Error("Your profile was saved, but your public map consent was not recorded. Please retry.");
   onSaved(normalized);onSelect(normalized);onSelectState?.("");
   setEditing(false);setMessage("✓ Your location is now included on the Ummah map.");
   void load();window.dispatchEvent(new Event("1muslim:location-updated"));
  }catch(e){setMessage(e instanceof Error?e.message:"Could not save your region")}finally{setSaving(false)}
 };
 const removeFromMap=async()=>{
  setSaving(true);setMessage("");
  try{
   const db=createClient();const {data:{user}}=await db.auth.getUser();if(user?.id!==userId)throw Error("Sign in to change map sharing.");
   const {error}=await db.from("member_region_preferences").delete().eq("user_id",userId);
   if(error)throw Error("Unable to stop sharing your region.");
   onSelect("");onSelectState?.("");setMessage("✓ Your location is no longer counted on the Ummah map. Your prayer location stays unchanged.");
   setEditing(false);void load();
  }catch(e){setMessage(e instanceof Error?e.message:"Unable to update sharing")}finally{setSaving(false)}
 };
 const selectedPlace=focusName|| (mode==="us"?"United States":"Worldwide");
 const chosen=rows.find(r=>r.name===focusName);
 const selectedLabel=mode==="us"&&selectedState?selectedState:selectedPlace;
 return <section className="muslimeenRegionPanel ummahAtlas" aria-label="Interactive member atlas">
  <div className="atlasHead"><div><span className="atlasEyebrow">1MUSLIM · UMMAH NETWORK</span><h2>Discover our <em>Ummah</em> ✧</h2><p>Explore the world through places Muslims have chosen to share.</p></div><button type="button" className="atlasEdit" onClick={()=>{setEditing(v=>!v);setMessage("");setCountry(canonicalCountry(currentCountry))}} aria-expanded={editing}>⌖ {editing?"Close":"My Region"}</button></div>
  <div className="atlasMetrics" aria-label="Member location statistics"><div><strong>{stats?fmt(stats.recorded):"—"}</strong><span>Members on map</span></div><div><strong>{stats?fmt(stats.countries.length):"—"}</strong><span>Countries</span></div><div><strong>{stats?fmt(stats.states.length):"—"}</strong><span>U.S. states</span></div></div>
  <div className="atlasToolbar"><div className="atlasMode" role="group" aria-label="Map view"><button type="button" aria-pressed={mode==="world"} onClick={()=>setView("world")}>◎ World</button><button type="button" aria-pressed={mode==="us"} onClick={()=>setView("us")}>⌖ United States</button></div><span className="atlasRefresh"><i aria-hidden="true"/> Voluntary locations · {stats?"Live counts":"Loading"}</span></div>
  <div className="atlasStage" aria-label="Drag and zoom the member region map">
   <div className="atlasTopline"><span>{mode==="world"?"GLOBAL MEMBER ATLAS":"UNITED STATES · MEMBER ATLAS"}</span><span>1MUSLIM ◇ NETWORK</span></div>
   <svg ref={mapRef} className={"atlasGeography"+(dragging?" isDragging":"")} viewBox="0 0 720 360" preserveAspectRatio="xMidYMid meet" role="img" aria-label={mode==="world"?"Map of the world with voluntarily shared member locations":"Map of U.S. states with voluntarily shared member locations"}
    onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onClickCapture={swallowDragClick} onDoubleClick={()=>changeZoom(zoom+0.4)}>
    <defs><radialGradient id="ummahAtlasGlow"><stop offset="0%" stopColor="#7afce4" stopOpacity=".4"/><stop offset="100%" stopColor="#7afce4" stopOpacity="0"/></radialGradient></defs>
    <g transform={"translate("+pan.x+" "+pan.y+") scale("+zoom+")"}>
     <image href={mode==="world"?"/maps/ummah-world.svg":"/maps/ummah-united-states.svg"} width="720" height="360" preserveAspectRatio="xMidYMid meet"/>
     <circle cx="360" cy="180" r="120" className="atlasGridCircle"/><circle cx="360" cy="180" r="205" className="atlasGridCircle"/><circle cx="360" cy="180" r="280" className="atlasGridCircle"/>
     {pins.map(({name,count,point})=>{
      const active=name===focusName,r=Math.min(12,4+Math.log2(count+1)*1.7);
      return <g key={name} role="button" tabIndex={0} aria-label={name+", "+count+" "+(count===1?"member":"members")} className={"atlasMarker"+(active?" isSelected":"")} onClick={()=>focusRegion(name,point)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();focusRegion(name,point)}}}>
       <circle cx={point[0]} cy={point[1]} r={r+12} className="atlasMarkerGlow"/>
       <circle cx={point[0]} cy={point[1]} r={r} className="atlasMarkerCore"/>
       <circle cx={point[0]} cy={point[1]} r="2.4" fill="#fff"/>
       {(active||count>=5)&&<text x={point[0]} y={point[1]-r-8} textAnchor="middle" className="atlasMarkerLabel">{active?name:fmt(count)}</text>}
       <title>{name+": "+fmt(count)+" opted-in "+(count===1?"member":"members")}</title>
      </g>
     })}
    </g>
   </svg>
   <div className="atlasZoom" role="group" aria-label="Map zoom controls"><button type="button" onClick={()=>changeZoom(zoom+.35)} aria-label="Zoom in">+</button><button type="button" onClick={()=>changeZoom(zoom-.35)} aria-label="Zoom out">−</button><button type="button" onClick={resetView} aria-label="Reset map view">⌖</button></div>
   <div className="atlasBottomline"><span><b>●</b> Places with shared members</span><span>Drag horizontally · Zoom + / −</span></div>
  </div>
  <div className="atlasInfo" aria-live="polite"><main><strong>⌖ {selectedLabel}</strong><small>{chosen?fmt(selectedCount)+" "+(selectedCount===1?"member has":"members have")+" shared this region":mode==="us"?fmt(stats?.usCount||0)+" U.S. members shared a location":fmt(stats?.recorded||0)+" members have shared their region"} · {mode==="us"?"State-level only":"Country-level only"}</small></main><button type="button" onClick={()=>{if(mode==="us"&&!selectedState)onSelect("United States");document.getElementById("muslimeen-directory")?.scrollIntoView({behavior:"smooth",block:"start"})}}>View Members ↗</button></div>
  <div className="atlasDirectory"><div className="atlasDirectoryHead"><strong>⌕ Find a {mode==="world"?"country":"state"}</strong><small>{rows.length} locations</small></div><label className="atlasSearch"><span aria-hidden="true">⌕</span><input type="search" aria-label={mode==="world"?"Search countries":"Search U.S. states"} placeholder={mode==="world"?"Search shared countries…":"Search shared states…"} value={query} onChange={e=>setQuery(e.target.value)}/></label>
   {fetchError&&<div className="atlasError" role="alert">{fetchError} <button type="button" onClick={()=>void load()}>Retry</button></div>}
   {displayRows.length?<div className="atlasRegions" aria-label="Regions with opted-in members">{displayRows.map(row=><button type="button" key={row.name} aria-pressed={focusName===row.name} onClick={()=>focusRegion(row.name,lookup[row.name])}>⌖ {row.name}<span>{fmt(row.count)} {row.count===1?"member":"members"}</span></button>)}</div>:<div className="atlasEmpty">{stats?(query?"No matching shared regions.":"No members have explicitly shared a location in this view yet."):fetchError?"Atlas data is currently unavailable.":"Checking shared regions…"}</div>}
  </div>
  {editing&&<div className="regionEditor" aria-label="Update my map sharing"><h3>Choose your Ummah region</h3><p>Opt in to display your country on the community map. State and city help your profile but exact coordinates are never requested or shown.</p><label>Country<input list="ummah-atlas-countries" value={country} onChange={e=>setCountry(e.target.value)} placeholder="e.g. United States" maxLength={80}/></label><datalist id="ummah-atlas-countries">{Array.from(new Set([...rows.map(r=>r.name),"United States","Canada","United Kingdom","Somalia","Türkiye","Kenya","Nigeria","Pakistan","Saudi Arabia","Australia"])).map(name=><option key={name} value={name}/>)}</datalist><label>State / Province (optional)<input value={state} onChange={e=>setState(e.target.value)} maxLength={80}/></label><label>City (optional)<input value={city} onChange={e=>setCity(e.target.value)} maxLength={80}/></label><button type="button" disabled={saving||!country.trim()} onClick={()=>void save()}>{saving?"Saving…":"Save My Region ✓"}</button><button type="button" disabled={saving} onClick={()=>void removeFromMap()} style={{background:"transparent",color:"#aacbd5",borderColor:"#5a7182",fontWeight:650}}>Stop sharing my location on map</button></div>}
  {message&&<p role="status" style={{margin:0}}>{message}</p>}
  <div className="atlasFoot"><span>🔒 Only members who explicitly saved their region are included. No device GPS, private masjid information or exact locations are displayed.</span><span>{stats?.limited?"Partial results":stats?.updatedAt?"Updated "+new Date(stats.updatedAt).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"}):""}</span></div>
 </section>;
}
