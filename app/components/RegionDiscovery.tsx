"use client";
import {useCallback,useEffect,useMemo,useRef,useState,type PointerEvent as ReactPointerEvent,type MouseEvent as ReactMouseEvent} from "react";
import {createClient} from "../../utils/supabase/client";
import {createPortal} from "react-dom";
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
const usStates:Record<string,string>=Object.fromEntries(("AL:Alabama,AK:Alaska,AZ:Arizona,AR:Arkansas,CA:California,CO:Colorado,CT:Connecticut,DE:Delaware,FL:Florida,GA:Georgia,HI:Hawaii,ID:Idaho,IL:Illinois,IN:Indiana,IA:Iowa,KS:Kansas,KY:Kentucky,LA:Louisiana,ME:Maine,MD:Maryland,MA:Massachusetts,MI:Michigan,MN:Minnesota,MS:Mississippi,MO:Missouri,MT:Montana,NE:Nebraska,NV:Nevada,NH:New Hampshire,NJ:New Jersey,NM:New Mexico,NY:New York,NC:North Carolina,ND:North Dakota,OH:Ohio,OK:Oklahoma,OR:Oregon,PA:Pennsylvania,RI:Rhode Island,SC:South Carolina,SD:South Dakota,TN:Tennessee,TX:Texas,UT:Utah,VT:Vermont,VA:Virginia,WA:Washington,WV:West Virginia,WI:Wisconsin,WY:Wyoming,DC:District of Columbia").split(",").map(x=>x.split(":")));
export function canonicalUsState(value:string|null|undefined){const raw=(value||"").trim();return usStates[raw.toUpperCase()]||Object.values(usStates).find(name=>name.toLowerCase()===raw.toLowerCase())||raw}
type Stats={countries:{name:string;count:number}[];states:{name:string;count:number}[];optedIn:number;recorded:number;unplaced:number;usCount:number;updatedAt:string;limited:boolean};
type Mode="world"|"us";
type MapPerson={id:string;name:string;username:string|null;avatar:string;joinedAt:string};
type Props={members:Array<{country:string|null}>;currentCountry:string|null;userId:string;selected:string;selectedState?:string;onSelect:(value:string)=>void;onSelectState?:(value:string)=>void;onSaved:(value:string)=>void;onOpenMember?:(id:string)=>void;backgroundImage?:string};
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
const bound=(zoom:number,x:number,y:number)=>({x:clamp(x,720*(1-zoom),0),y:clamp(y,360*(1-zoom),0)});
const centerView={zoom:1.06,x:-21.6,y:-10.8};
const kaabaPoint:[number,number]=[439.7,137.2]; // Makkah, approximate equirectangular map position; never a member location.

export default function RegionDiscovery({currentCountry,userId,selected,selectedState="",onSelect,onSelectState,onSaved,onOpenMember,backgroundImage="/assets/profile-backgrounds/obsidian.PNG"}:Props){
 const [stats,setStats]=useState<Stats|null>(null),[fetchError,setFetchError]=useState("");
 const [mode,setMode]=useState<Mode>("world"),[editing,setEditing]=useState(false),[expanded,setExpanded]=useState(false);
 const [country,setCountry]=useState(canonicalCountry(currentCountry)),[state,setState]=useState(""),[city,setCity]=useState("");
 const [saving,setSaving]=useState(false),[locating,setLocating]=useState(false),[message,setMessage]=useState("");
 const [consent,setConsent]=useState(false),[optedIn,setOptedIn]=useState(false),[permissionKnown,setPermissionKnown]=useState(false),[browseOnly,setBrowseOnly]=useState(false);
 const [view,setViewState]=useState(centerView),[dragging,setDragging]=useState(false);
 const pointerPositions=useRef(new Map<number,{x:number;y:number}>());
 const lastPinch=useRef<number|null>(null),lastTap=useRef({at:0,x:0,y:0}),ignoreClick=useRef(false);
 const dragRef=useRef<{id:number;x:number;y:number;moving:boolean}|null>(null);
 const [listOpen,setListOpen]=useState(false),[listQuery,setListQuery]=useState("");
 const [studioSearch,setStudioSearch]=useState(""),[studioSearchOpen,setStudioSearchOpen]=useState(false);
 const [makkahFocus,setMakkahFocus]=useState(false);
 const [people,setPeople]=useState<MapPerson[]>([]),[peopleLoading,setPeopleLoading]=useState(false),[peopleError,setPeopleError]=useState("");
 const fullStageRef=useRef<HTMLDivElement|null>(null);
 useEffect(()=>{setCountry(canonicalCountry(currentCountry))},[currentCountry]);
 useEffect(()=>{
  let mounted=true;setPermissionKnown(false);
  void createClient().from("member_region_preferences").select("user_id").eq("user_id",userId).maybeSingle().then(({data,error})=>{
   if(!mounted)return;setOptedIn(Boolean(data)&&!error);setPermissionKnown(true);
  });
  return()=>{mounted=false};
 },[userId]);
 useEffect(()=>{
  if(!editing)return;let alive=true;
  void createClient().from("profiles").select("country,state,city").eq("id",userId).maybeSingle().then(({data})=>{
   if(!alive||!data)return;setCountry(canonicalCountry(data.country));setState(data.state||"");setCity(data.city||"");
  });
  return()=>{alive=false};
 },[editing,userId]);
 const load=useCallback(async()=>{
  try{
   const response=await fetch("/api/member-regions",{cache:"no-store"});
   const data=await response.json();
   if(!response.ok)throw Error(data.error||"Member map unavailable");
   setStats(data as Stats);setFetchError("");
  }catch(e){setFetchError(e instanceof Error?e.message:"Unable to load map")}
 },[]);
 useEffect(()=>{
  void load();
  const timer=window.setInterval(()=>{if(document.visibilityState==="visible")void load()},120000);
  const refresh=()=>{if(document.visibilityState==="visible")void load()};
  document.addEventListener("visibilitychange",refresh);window.addEventListener("1muslim:location-updated",refresh);
  return()=>{window.clearInterval(timer);document.removeEventListener("visibilitychange",refresh);window.removeEventListener("1muslim:location-updated",refresh)};
 },[load]);
 useEffect(()=>{
  if(!expanded)return;
  const prior=document.body.style.overflow;document.body.style.overflow="hidden";
  const key=(e:KeyboardEvent)=>{if(e.key==="Escape")setExpanded(false)};
  window.addEventListener("keydown",key);
  return()=>{document.body.style.overflow=prior;window.removeEventListener("keydown",key)};
 },[expanded]);
 const rows=mode==="world"?(stats?.countries||[]):(stats?.states||[]);
 const lookup=mode==="world"?COUNTRY_POINTS:STATE_POINTS;
 const pins=useMemo(()=>rows.map(({name,count})=>({name,count,point:lookup[name]})).filter(p=>Array.isArray(p.point)),[rows,lookup]);
 const focusName=mode==="world"?selected:selectedState;
 const chosen=rows.find(r=>r.name===focusName);
 const studioResults=rows.filter(r=>r.name.toLowerCase().includes(studioSearch.toLowerCase().trim())).slice(0,8);
 useEffect(()=>{
  const name=mode==="world"&&expanded?selected:"";
  if(!name){setPeople([]);setPeopleLoading(false);setPeopleError("");return}
  let active=true;
  const controller=new AbortController();
  setPeople([]);setPeopleError("");setPeopleLoading(true);
  void fetch("/api/member-regions/people?country="+encodeURIComponent(name),{cache:"no-store",signal:controller.signal})
    .then(async response=>{const body=await response.json();if(!response.ok)throw Error(body.error||"Could not load members");return body as {members:MapPerson[]}})
    .then(data=>{if(active)setPeople(data.members||[])})
    .catch(error=>{if(active&&!controller.signal.aborted)setPeopleError(error instanceof Error?error.message:"Member previews are unavailable")})
    .finally(()=>{if(active)setPeopleLoading(false)});
  return()=>{active=false;controller.abort()};
 },[selected,mode,expanded]);
 // In full-screen portrait, the map is intentionally cropped to FILL the panel.
 // Bounds must use the real on-screen SVG viewport, not the 720x360 overview aspect.
 const constrain=(zoom:number,x:number,y:number)=>{
  if(!expanded)return bound(zoom,x,y);
  const rect=fullStageRef.current?.getBoundingClientRect();
  if(!rect||!rect.width||!rect.height)return bound(zoom,x,y);
  const visibleWidth=360*rect.width/rect.height;
  const left=360-visibleWidth/2,right=360+visibleWidth/2;
  const lowX=right-720*zoom,highX=left;
  return {x:clamp(x,Math.min(lowX,highX),Math.max(lowX,highX)),y:clamp(y,360*(1-zoom),0)};
 };
 const flyTo=(point:[number,number],zoom=1.45)=>{
  const z=clamp(zoom,1,6);
  setViewState({zoom:z,...constrain(z,360-point[0]*z,180-point[1]*z)});
 };
 const openStudio=()=>{
  pointerPositions.current.clear();lastPinch.current=null;dragRef.current=null;
  const point=mode==="world"?(COUNTRY_POINTS[selected]||kaabaPoint):(STATE_POINTS[selectedState]||[360,180]);
  const z=selected||selectedState?1.7:1.18;
  setViewState({zoom:z,x:360-point[0]*z,y:Math.min(0,180-point[1]*z)});
  setMakkahFocus(false);setStudioSearch("");
  setExpanded(true);
 };
 const closeStudio=()=>{setExpanded(false);pointerPositions.current.clear();lastPinch.current=null;setStudioSearchOpen(false);setDragging(false)};
 const focusMakkah=()=>{
  setMode("world");onSelect("");onSelectState?.("");setStudioSearch("");setMakkahFocus(true);flyTo(kaabaPoint,1.7);
 };
 const focusNamedRegion=(name:string,point?:[number,number])=>{
  setMakkahFocus(false);setStudioSearchOpen(false);setStudioSearch("");
  selectRegion(name,point);
 };
 const exploreMembers=()=>{
  closeStudio();
  window.setTimeout(()=>document.getElementById("muslimeen-directory")?.scrollIntoView({behavior:"smooth",block:"start"}),120);
 };
 const switchMode=(next:Mode)=>{
  setMode(next);setMakkahFocus(false);setStudioSearch("");setStudioSearchOpen(false);
  onSelectState?.("");if(next==="world")onSelect("");else onSelect("United States");
  const p: [number,number]=next==="world"?kaabaPoint:[360,180];
  if(expanded){const z=1.1;setViewState({zoom:z,x:360-p[0]*z,y:Math.min(0,180-p[1]*z)})}
  else setViewState(centerView);
 };
 const zoomAt=(factor:number,anchorX=360,anchorY=180)=>{
  setViewState(prev=>{
   const z=clamp(prev.zoom*factor,1,expanded?8:5);
   const ratio=z/prev.zoom;
   return {zoom:z,...constrain(z,anchorX-(anchorX-prev.x)*ratio,anchorY-(anchorY-prev.y)*ratio)};
  });
 };
 const resetView=()=>{if(expanded)flyTo(mode==="world"?kaabaPoint:[360,180],1.12);else setViewState(centerView)};
 const mapPoint=(svg:SVGSVGElement,clientX:number,clientY:number)=>{
  const pt=svg.createSVGPoint();pt.x=clientX;pt.y=clientY;
  const ctm=svg.getScreenCTM();if(!ctm)return {x:360,y:180};
  return pt.matrixTransform(ctm.inverse());
 };
 const pointerDown=(e:ReactPointerEvent<SVGSVGElement>)=>{
  if(e.pointerType==="mouse"&&e.button!==0)return;
  pointerPositions.current.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointerPositions.current.size===1)dragRef.current={id:e.pointerId,x:e.clientX,y:e.clientY,moving:false};
  if(pointerPositions.current.size===2){
   const [a,b]=[...pointerPositions.current.values()];lastPinch.current=Math.hypot(a.x-b.x,a.y-b.y);dragRef.current=null;
  }
  // Do not capture on tap: the marker must receive its own click.
  // Capture only after an actual drag, so pressing a country pin still selects it.
 };
 const pointerMove=(e:ReactPointerEvent<SVGSVGElement>)=>{
  const old=pointerPositions.current.get(e.pointerId);if(!old)return;
  pointerPositions.current.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointerPositions.current.size>=2){
   const [a,b]=[...pointerPositions.current.values()];
   const distance=Math.hypot(a.x-b.x,a.y-b.y);
   const oldDistance=lastPinch.current;
   if(oldDistance&&distance>12){
    const anchor=mapPoint(e.currentTarget,(a.x+b.x)/2,(a.y+b.y)/2);
    zoomAt(distance/oldDistance,anchor.x,anchor.y);
    lastPinch.current=distance;ignoreClick.current=true;
   }
   return;
  }
  const g=dragRef.current;
  if(!g||g.id!==e.pointerId)return;
  const dx=e.clientX-g.x,dy=e.clientY-g.y;
  if(!g.moving){
   if(Math.hypot(dx,dy)<7)return;
   g.moving=true;setDragging(true);ignoreClick.current=true;
   try{e.currentTarget.setPointerCapture(e.pointerId)}catch{}
  }
  g.x=e.clientX;g.y=e.clientY;
  // Use the SVG screen matrix: in portrait "slice" mode, screen pixels
  // correspond to a very different number of map units than the inline map.
  const inverse=e.currentTarget.getScreenCTM()?.inverse();
  const rect=e.currentTarget.getBoundingClientRect();
  const fallback=720/Math.max(rect.width,1);
  const worldDx=inverse?dx*inverse.a+dy*inverse.c:dx*fallback;
  const worldDy=inverse?dx*inverse.b+dy*inverse.d:dy*fallback;
  setViewState(prev=>({zoom:prev.zoom,...constrain(prev.zoom,prev.x+worldDx,prev.y+worldDy)}));
 };
 const pointerUp=(e:ReactPointerEvent<SVGSVGElement>)=>{
  const wasMulti=pointerPositions.current.size>1;
  const draggingNow=Boolean(dragRef.current?.moving);
  pointerPositions.current.delete(e.pointerId);
  if(pointerPositions.current.size<2)lastPinch.current=null;
  if(pointerPositions.current.size===0){dragRef.current=null;setDragging(false);}
  if(wasMulti||draggingNow){ignoreClick.current=true;window.setTimeout(()=>{ignoreClick.current=false},350);return;}
  // Double tap to zoom, including iOS where dblclick may not fire on SVG.
  if(e.pointerType==="touch"){
   const last=lastTap.current,now=Date.now();
   if(now-last.at<350&&Math.hypot(e.clientX-last.x,e.clientY-last.y)<32){
    const at=mapPoint(e.currentTarget,e.clientX,e.clientY);
    zoomAt(1.65,at.x,at.y);ignoreClick.current=true;
   }
   lastTap.current={at:now,x:e.clientX,y:e.clientY};
  }
 };
 const selectRegion=(name:string,point?:[number,number])=>{
  setMakkahFocus(false);
  if(mode==="world"){onSelect(name===selected?"":name);onSelectState?.("");}
  else{onSelect("United States");onSelectState?.(name===selectedState?"":name);}
  if(name===focusName){resetView();return;}
  if(point){
   const z=Math.max(view.zoom,expanded?1.85:1.55);
   flyTo(point,z);
  }
 };
 const openEditor=()=>{setExpanded(false);setEditing(true);setConsent(false);setMessage("");setBrowseOnly(true);window.setTimeout(()=>document.querySelector(".ummahAtlas .regionEditor")?.scrollIntoView({behavior:"smooth",block:"center"}),90)};
 const requestLocation=()=>{
  if(!navigator.geolocation){setMessage("Device location is unavailable. Choose your region manually.");return}
  setLocating(true);setMessage("");
  navigator.geolocation.getCurrentPosition(async position=>{
   try{
    const response=await fetch("/api/profile/reverse-geocode",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({latitude:position.coords.latitude,longitude:position.coords.longitude})});
    const data=await response.json();
    if(!response.ok||!data.country)throw Error(data.error||"Unable to recognize your region");
    setCountry(canonicalCountry(data.country));setState(data.state||"");setCity(data.city||"");
    setMessage("Location found. Review your region and agree to share it before saving.");
   }catch(e){setMessage(e instanceof Error?e.message:"Enter your region manually.")}
   finally{setLocating(false)}
  },error=>{setLocating(false);setMessage(error.code===1?"Location access was declined. You can still choose a country manually.":"Unable to use device location. Choose your region manually.")},{enableHighAccuracy:false,timeout:11000,maximumAge:300000});
 };
 const save=async()=>{
  const normalized=canonicalCountry(country);
  if(!normalized||!consent){setMessage("Choose a country and check the voluntary sharing agreement.");return}
  setSaving(true);setMessage("");
  try{
   const db=createClient();const {data:{user}}=await db.auth.getUser();
   if(user?.id!==userId)throw Error("Sign in again to share your region.");
   const {error:profileError}=await db.from("profiles").update({country:normalized,state:state.trim()||null,city:city.trim()||null}).eq("id",userId);
   if(profileError)throw Error("Could not save your region: "+profileError.message);
   const {error:consentError}=await db.from("member_region_preferences").upsert({user_id:userId,region_level:city.trim()?"city":state.trim()?"state":"country",consented_at:new Date().toISOString()},{onConflict:"user_id"});
   if(consentError)throw Error("Region saved privately, but map sharing did not complete. Please retry.");
   onSaved(normalized);onSelect(normalized);onSelectState?.("");
   setOptedIn(true);setPermissionKnown(true);setBrowseOnly(true);setEditing(false);
   setMessage("✓ You are now part of the Ummah map.");
   await load();window.dispatchEvent(new Event("1muslim:location-updated"));
  }catch(e){setMessage(e instanceof Error?e.message:"Could not save region")}
  finally{setSaving(false)}
 };
 const removeFromMap=async()=>{
  setSaving(true);setMessage("");
  try{
   const db=createClient();const {data:{user}}=await db.auth.getUser();
   if(user?.id!==userId)throw Error("Sign in again to change map sharing.");
   const {error}=await db.from("member_region_preferences").delete().eq("user_id",userId);
   if(error)throw Error("Could not stop sharing.");
   setOptedIn(false);onSelect("");onSelectState?.("");
   setEditing(false);setBrowseOnly(true);setMessage("✓ Your region is no longer on the community map.");
   await load();window.dispatchEvent(new Event("1muslim:location-updated"));
  }catch(e){setMessage(e instanceof Error?e.message:"Unable to update sharing")}
  finally{setSaving(false)}
 };
 const mapCanvas=(full=false)=><div ref={full?fullStageRef:undefined} className={"atlasStage"+(full?" atlasFullStage":"")+(permissionKnown&&!optedIn&&!browseOnly?" atlasGuest":"")}>
  <svg className={"atlasGeography"+(dragging?" isDragging":"")} viewBox="0 0 720 360" preserveAspectRatio={full?"xMidYMid slice":"xMidYMid meet"} tabIndex={0}
   aria-label="Interactive Ummah map. Drag to pan, pinch or double tap to zoom, tap a location marker to filter. Keyboard: plus, minus and arrow keys."
   onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}
   onClickCapture={e=>{if(ignoreClick.current){e.preventDefault();e.stopPropagation();ignoreClick.current=false}}}
   onDoubleClick={e=>{const at=mapPoint(e.currentTarget,e.clientX,e.clientY);zoomAt(1.45,at.x,at.y)}}
   onKeyDown={e=>{
    if(e.key==="+"||e.key==="="){e.preventDefault();zoomAt(1.4)}
    if(e.key==="-"){e.preventDefault();zoomAt(1/1.4)}
    if(e.key==="ArrowLeft"||e.key==="ArrowRight"||e.key==="ArrowUp"||e.key==="ArrowDown"){
     e.preventDefault();const dx=e.key==="ArrowLeft"?28:e.key==="ArrowRight"?-28:0,dy=e.key==="ArrowUp"?28:e.key==="ArrowDown"?-28:0;
     setViewState(prev=>({zoom:prev.zoom,...constrain(prev.zoom,prev.x+dx,prev.y+dy)}));
    }
   }}>
   <rect width="720" height="360" fill="#f8faf9"/>
   <g transform={"translate("+view.x+" "+view.y+") scale("+view.zoom+")"}>
    <image className="atlasLand" href={mode==="world"?"/maps/ummah-world-light.svg":"/maps/ummah-united-states-light.svg"} width="720" height="360" preserveAspectRatio="xMidYMid meet" />
    {mode==="world"&&<g className="atlasKaaba" transform={"translate("+kaabaPoint[0]+" "+kaabaPoint[1]+")"}>
      <title>The Kaaba — Makkah, Saudi Arabia (landmark, not a member location)</title>
      <path d="M-6-5 1-8 8-5 1-2Z" fill="#3d4640"/>
      <path d="M-6-5 1-2 1 9-6 6Z" fill="#242e2a"/>
      <path d="M1-2 8-5 8 6 1 9Z" fill="#111c19"/>
      <path d="M-6-1 1 2 8-1" fill="none" stroke="#e8bb6c" strokeWidth="2"/>
      <circle r="13" fill="none" stroke="#d5a657" strokeOpacity=".35" />
    </g>}
    {pins.map(({name,count,point})=>{
     const active=name===focusName,r=Math.min(9,4.5+Math.log2(count+1));
     return <g key={name} className={"atlasMarker"+(active?" isSelected":"")} tabIndex={0} role="button" aria-label={name+", "+count+(count===1?" member":" members")}
      onClick={e=>{e.stopPropagation();selectRegion(name,point)}}
      onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();selectRegion(name,point)}}}>
      <circle cx={point[0]} cy={point[1]} r={r+11} className="atlasMarkerTouch"/>
      <circle cx={point[0]} cy={point[1]} r={r} className="atlasMarkerCore"/>
      <circle cx={point[0]} cy={point[1]} r="2.2" fill="#fff"/>
      <title>{name+": "+count+(count===1?" member":" members")}</title>
     </g>;
    })}
   </g>
  </svg>
  {!full&&<div className="atlasFloatTools">
   <button type="button" title={mode==="world"?"See United States":"See world"} aria-label={mode==="world"?"Switch to United States map":"Switch to world map"} onClick={()=>switchMode(mode==="world"?"us":"world")}>{mode==="world"?"US":"🌐"}</button>
   <button type="button" aria-label="Expand map studio" title="Full map" onClick={openStudio}>⤢</button>
  </div>}
  {!full&&chosen&&<div className="atlasPlace" role="status"><div><strong>{chosen.name}</strong><small>{chosen.count} {chosen.count===1?"Muslim":"Muslims"} shared this region</small></div><button type="button" onClick={()=>{setExpanded(false);document.getElementById("muslimeen-directory")?.scrollIntoView({behavior:"smooth",block:"start"})}}>See members ↗</button></div>}
  {permissionKnown&&!optedIn&&!browseOnly&&!full&&<div className="atlasInvitation"><strong>Connect with Muslims around the world</strong><span>📍 Add your region to help grow the Ummah map.</span><div><button type="button" onClick={openEditor}>Add my region</button><button type="button" onClick={()=>setBrowseOnly(true)}>Explore without sharing</button></div></div>}
  {!full&&!chosen&&<div className="atlasTouchHint" aria-hidden="true">Pinch · drag · tap a dot</div>}
 </div>;
 return <section className="muslimeenRegionPanel ummahAtlas" aria-label="Community map">
  <div className="atlasHead">
   <div><span className="atlasEyebrow">1MUSLIM · CONNECTING THE UMMAH</span><h2>Muslims around the world <span aria-hidden="true">✧</span></h2></div>
   <button type="button" className="atlasEdit" title="Add or update my region" aria-label="Add or update my region" onClick={openEditor}>⌖</button>
  </div>
  {mapCanvas()}
  {fetchError&&<p role="alert" className="atlasError">{fetchError} <button type="button" onClick={()=>void load()}>Retry</button></p>}
  {message&&!editing&&<p role="status" className="atlasMessage">{message}</p>}
  {stats&&<div className="atlasQuietFooter"><span>{stats.recorded.toLocaleString()} members sharing a region</span><button type="button" onClick={()=>setListOpen(x=>!x)} aria-expanded={listOpen}>{listOpen?"Hide places":"Browse places"} ⌄</button></div>}
  {listOpen&&<div className="atlasDirectory"><label className="atlasSearch"><span aria-hidden="true">⌕</span><input type="search" value={listQuery} onChange={e=>setListQuery(e.target.value)} placeholder="Find a country or state" aria-label="Find shared region"/></label><div className="atlasRegions">{rows.filter(r=>r.name.toLowerCase().includes(listQuery.toLowerCase())).map(r=><button type="button" key={r.name} onClick={()=>selectRegion(r.name,lookup[r.name])}>{r.name} · {r.count}</button>)}</div></div>}
  {editing&&<div className="regionEditor" role="region" aria-label="Opt in to the Ummah map">
   <div className="atlasEditorTop"><div><h3>📍 My region</h3><p>Share a general location so other Muslims can find your community.</p></div><button type="button" aria-label="Close region settings" onClick={()=>setEditing(false)}>×</button></div>
   <button type="button" className="atlasDetect" onClick={requestLocation} disabled={locating||saving}>{locating?"Finding location…":"⌖ Use my approximate device location"}</button>
   <p className="atlasPrivacy">Optional. Device coordinates are used briefly by a geocoding service to suggest your country, state and city. Precise coordinates are not saved to your profile or shown on the map.</p>
   <label>Country<input list="ummah-atlas-countries" value={country} onChange={e=>setCountry(e.target.value)} placeholder="Country" maxLength={80}/></label>
   <datalist id="ummah-atlas-countries">{Array.from(new Set([...(stats?.countries||[]).map(r=>r.name),"United States","Canada","United Kingdom","Somalia","Türkiye","Kenya","Nigeria","Pakistan","Saudi Arabia","Australia"])).map(name=><option key={name} value={name}/>)}</datalist>
   <div className="atlasEditorFields"><label>State / province <small>Optional</small><input value={state} onChange={e=>setState(e.target.value)} placeholder="State or province" maxLength={80}/></label><label>City <small>Optional</small><input value={city} onChange={e=>setCity(e.target.value)} placeholder="City" maxLength={80}/></label></div>
   <label className="atlasConsent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>I choose to share my country on the Ummah map. My state and city, if entered, are also public profile fields. I can stop map sharing anytime.</span></label>
   <div className="atlasEditorButtons"><button type="button" disabled={saving||locating||!country.trim()||!consent} onClick={()=>void save()}>{saving?"Saving…":"Save and join the map"}</button>{optedIn&&<button type="button" className="atlasRemove" disabled={saving} onClick={()=>void removeFromMap()}>Stop sharing on map</button>}</div>
   {message&&<p role="status" className="atlasMessage">{message}</p>}
  </div>}
  {expanded&&typeof document!=="undefined"&&createPortal(<div className="atlasStudioOverlay" role="dialog" aria-modal="true" aria-label="Full-screen Ummah map studio">
   <div className="atlasStudioBackdrop" aria-hidden="true" style={{backgroundImage:`linear-gradient(180deg,#050e1c55,#071d26d9),url("${backgroundImage.replaceAll("\"","")}")`,transform:"scale(1.045) translate("+(-view.x/80)+"px,"+(-view.y/80)+"px)"}}/>
   <button type="button" className="atlasStudioBack" onClick={()=>setExpanded(false)} aria-label="Close full map">‹</button>
   <div className="atlasStudioCanvas">{mapCanvas(true)}</div>
  </div>,document.body)}
 </section>;
}
