"use client";
import {useCallback,useEffect,useMemo,useRef,useState,type PointerEvent as ReactPointerEvent,type MouseEvent as ReactMouseEvent} from "react";
import {createClient} from "../../utils/supabase/client";
import {createPortal} from "react-dom";
import {COUNTRY_POINTS,STATE_POINTS} from "./admin-region-points";
import "./RegionDiscovery.css";

import {canonicalCountry} from "../../lib/member-region-country";
export {canonicalUsState} from "../../lib/member-region-state";
export {canonicalCountry} from "../../lib/member-region-country";
type Stats={countries:{name:string;count:number}[];states:{name:string;count:number}[];optedIn:number;recorded:number;unplaced:number;usCount:number;updatedAt:string;limited:boolean};
type Mode="world"|"us";
type MapPerson={id:string;name:string;username:string|null;avatar:string;joinedAt:string};
type Props={members:Array<{country:string|null}>;currentCountry:string|null;userId:string;selected:string;selectedState?:string;onSelect:(value:string)=>void;onSelectState?:(value:string)=>void;onSaved:(value:string)=>void;onOpenMember?:(id:string)=>void;backgroundImage?:string};
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
const bound=(zoom:number,x:number,y:number)=>({x:clamp(x,720*(1-zoom),0),y:clamp(y,360*(1-zoom),0)});
const centerView={zoom:1.06,x:-21.6,y:-10.8};
const kaabaPoint:[number,number]=[439.7,137.2]; // Makkah, approximate equirectangular map position; never a member location.
const localMode=(country:string|null):Mode=>{const name=canonicalCountry(country);return !name||name==="United States"?"us":"world"};
const localView=(country:string|null)=>{const name=canonicalCountry(country),point=COUNTRY_POINTS[name];if(!point||name==="United States")return centerView;const zoom=1.5;return {zoom,...bound(zoom,360-point[0]*zoom,180-point[1]*zoom)}};

export default function RegionDiscovery({currentCountry,userId,selected,selectedState="",onSelect,onSelectState,onSaved,onOpenMember,backgroundImage="/assets/profile-backgrounds/obsidian.PNG"}:Props){
 const [stats,setStats]=useState<Stats|null>(null),[fetchError,setFetchError]=useState("");
 const [mode,setMode]=useState<Mode>(()=>localMode(currentCountry)),[editing,setEditing]=useState(false),[expanded,setExpanded]=useState(false);
 const modeTouched=useRef(false);
 const [country,setCountry]=useState(canonicalCountry(currentCountry)),[state,setState]=useState(""),[city,setCity]=useState("");
 const [saving,setSaving]=useState(false),[locating,setLocating]=useState(false),[message,setMessage]=useState("");
 const [consent,setConsent]=useState(false),[directoryVisible,setDirectoryVisible]=useState(false),[optedIn,setOptedIn]=useState(false),[permissionKnown,setPermissionKnown]=useState(false),[browseOnly,setBrowseOnly]=useState(false);
 const [view,setViewState]=useState(()=>localView(currentCountry)),[dragging,setDragging]=useState(false);
 const pointerPositions=useRef(new Map<number,{x:number;y:number}>());
 const lastPinch=useRef<number|null>(null),lastTap=useRef({at:0,x:0,y:0}),ignoreClick=useRef(false);
 const dragRef=useRef<{id:number;x:number;y:number;moving:boolean}|null>(null);
 const [listOpen,setListOpen]=useState(false),[listQuery,setListQuery]=useState("");
 const [studioSearch,setStudioSearch]=useState(""),[studioSearchOpen,setStudioSearchOpen]=useState(false);
 const [makkahFocus,setMakkahFocus]=useState(false);
 const [people,setPeople]=useState<MapPerson[]>([]),[peopleLoading,setPeopleLoading]=useState(false),[peopleError,setPeopleError]=useState("");
 const fullStageRef=useRef<HTMLDivElement|null>(null);
 useEffect(()=>{setCountry(canonicalCountry(currentCountry))},[currentCountry]);
 // Follow the account country when first loaded; manual map navigation takes precedence.
 useEffect(()=>{if(modeTouched.current)return;setMode(localMode(currentCountry));setViewState(localView(currentCountry))},[currentCountry]);
 useEffect(()=>{
  let mounted=true;setPermissionKnown(false);
  void createClient().from("member_region_preferences").select("user_id,directory_visible").eq("user_id",userId).maybeSingle().then(({data,error})=>{
   if(!mounted)return;setOptedIn(Boolean(data)&&!error);setDirectoryVisible(Boolean(data?.directory_visible));setPermissionKnown(true);
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
 const usStateCount=(stats?.states||[]).reduce((total,row)=>total+row.count,0);
 const usWithoutState=Math.max(0,(stats?.usCount||0)-usStateCount);
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
  // Begin where the Ummah is actually represented, not over an empty ocean.
  // The Kaaba remains a dedicated landmark in the guided tour.
  const point: [number,number]=mode==="world"?(COUNTRY_POINTS[selected]||COUNTRY_POINTS[canonicalCountry(currentCountry)]||pins[0]?.point||kaabaPoint):(STATE_POINTS[selectedState]||[360,180]);
  const z=mode==="us"&&!selectedState?1.12:selected||selectedState?1.7:pins.length?1.42:1.18;
  setViewState({zoom:z,x:360-point[0]*z,y:Math.min(0,180-point[1]*z)});
  setMakkahFocus(false);setStudioSearch("");
  setExpanded(true);
 };
 const closeStudio=()=>{setExpanded(false);pointerPositions.current.clear();lastPinch.current=null;setStudioSearchOpen(false);setDragging(false)};
 const focusArea=(name:"World"|"Africa"|"Europe"|"Asia"|"Americas")=>{
  const centers:Record<typeof name,[number,number]>={
   World:[360,175],Africa:[378,177],Europe:[387,88],Asia:[520,142],Americas:[211,159]
  };
  modeTouched.current=true;setMode("world");onSelect("");onSelectState?.("");setMakkahFocus(false);setStudioSearch("");setStudioSearchOpen(false);
  flyTo(centers[name],name==="World"?1.13:1.48);
 };
 const focusMakkah=()=>{
  modeTouched.current=true;setMode("world");onSelect("");onSelectState?.("");setStudioSearch("");setMakkahFocus(true);flyTo(kaabaPoint,1.7);
 };
 const focusNamedRegion=(name:string,point?:[number,number])=>{
  setMakkahFocus(false);setStudioSearchOpen(false);setStudioSearch("");
  selectRegion(name,point);
 };
 const switchMode=(next:Mode)=>{
  if(next===mode)return;
  modeTouched.current=true;setMode(next);setMakkahFocus(false);setStudioSearch("");setStudioSearchOpen(false);
  // Changing map views does not silently apply a member-directory filter.
  onSelect("");onSelectState?.("");
  setViewState(next==="us"?centerView:localView(currentCountry));
 };
 const zoomAt=(factor:number,anchorX=360,anchorY=180)=>{
  setViewState(prev=>{
   const z=clamp(prev.zoom*factor,1,expanded?8:5);
   const ratio=z/prev.zoom;
   return {zoom:z,...constrain(z,anchorX-(anchorX-prev.x)*ratio,anchorY-(anchorY-prev.y)*ratio)};
  });
 };
 const resetView=()=>{setViewState(mode==="us"?centerView:localView(currentCountry))};
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
   const {error:consentError}=await db.from("member_region_preferences").upsert({user_id:userId,region_level:city.trim()?"city":state.trim()?"state":"country",directory_visible:directoryVisible,consented_at:new Date().toISOString()},{onConflict:"user_id"});
   if(consentError)throw Error("Region saved privately, but map sharing did not complete. Please retry.");
   modeTouched.current=false;setMode(localMode(normalized));setViewState(localView(normalized));
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
   setOptedIn(false);setDirectoryVisible(false);onSelect("");onSelectState?.("");
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
   <button type="button" aria-label="Expand map studio" title="Full map" onClick={openStudio}>⤢</button>
  </div>}
  {!full&&chosen&&<div className="atlasPlace" role="status"><div><strong>{chosen.name}</strong><small>{chosen.count} {chosen.count===1?"Muslim":"Muslims"} shared this region</small></div><button type="button" onClick={openStudio}>Explore ↗</button></div>}
  {!full&&mode==="us"&&!chosen&&stats&&<div className="atlasPlace atlasOverview" role="status"><div><strong>United States</strong><small>{stats.usCount} {stats.usCount===1?"member":"members"} opted in · {stats.states.length} {stats.states.length===1?"state":"states"} shown{usWithoutState>0?` · ${usWithoutState} country-only`:""}</small></div><button type="button" onClick={openStudio}>Explore ↗</button></div>}
  {permissionKnown&&!optedIn&&!browseOnly&&!full&&<div className="atlasInvitation"><strong>Connect with Muslims around the world</strong><span>📍 Add your region to help grow the Ummah map.</span><div><button type="button" onClick={openEditor}>Add my region</button><button type="button" onClick={()=>setBrowseOnly(true)}>Explore without sharing</button></div></div>}
  {!full&&!chosen&&mode!=="us"&&<div className="atlasTouchHint" aria-hidden="true">Pinch · drag · tap a dot</div>}
 </div>;
 return <section className="muslimeenRegionPanel ummahAtlas" aria-label="Community map">
  <div className="atlasHead">
   <div><span className="atlasEyebrow">1MUSLIM · CONNECTING THE UMMAH</span><h2>{mode==="us"?"Muslims across the United States":"Muslims around the world"} <span aria-hidden="true">✧</span></h2></div>
   <button type="button" className="atlasEdit" title="Add or update my region" aria-label="Add or update my region" onClick={openEditor}>⌖</button>
  </div>
  <div className="atlasModes" role="group" aria-label="Map region"><button type="button" aria-pressed={mode==="us"} onClick={()=>switchMode("us")}>⌖ U.S. states</button><button type="button" aria-pressed={mode==="world"} onClick={()=>switchMode("world")}>◎ World</button></div>
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
   <label className="atlasConsent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>I choose to include my country and any U.S. state I provide in aggregate Ummah map counts. State and city, if entered, are public profile fields. I can stop sharing at any time.</span></label>
   <label className="atlasConsent atlasDirectoryConsent"><input type="checkbox" checked={directoryVisible} onChange={e=>setDirectoryVisible(e.target.checked)}/><span><strong>Optional:</strong> Show my public avatar and name when signed-in Muslims explore my country. This does not disclose my city or exact location.</span></label>
   <div className="atlasEditorButtons"><button type="button" disabled={saving||locating||!country.trim()||!consent} onClick={()=>void save()}>{saving?"Saving…":"Save and join the map"}</button>{optedIn&&<button type="button" className="atlasRemove" disabled={saving} onClick={()=>void removeFromMap()}>Stop sharing on map</button>}</div>
   {message&&<p role="status" className="atlasMessage">{message}</p>}
  </div>}
  {expanded&&typeof document!=="undefined"&&createPortal(
   <div className="atlasStudioOverlay" role="dialog" aria-modal="true" aria-label="Explore the Ummah full-screen world map">
    <div className="atlasStudioBackdrop" aria-hidden="true" style={{
     backgroundImage:"linear-gradient(145deg,rgba(4,17,20,.56),rgba(7,22,28,.84)),url("+JSON.stringify(backgroundImage)+")",
     transform:"scale(1.055) translate("+(-view.x/110)+"px,"+(-view.y/110)+"px)"
    }}/>
    <div className="atlasStudioCanvas">
     {mapCanvas(true)}
     <div className="atlasStudioShade" aria-hidden="true"/>
     <header className="atlasStudioHeader">
      <button type="button" className="atlasStudioClose" onClick={closeStudio} aria-label="Close map studio">‹</button>
      <div className="atlasStudioBrand"><small>1MUSLIM · CONNECTING THE UMMAH</small><strong>Explore the Ummah <span>✧</span></strong></div>
      <button type="button" className="atlasStudioMyRegion" aria-label="Update my region" title="Update my region" onClick={openEditor}>⌖</button>
     </header>
     <div className="atlasStudioNavigate">
      <nav className="atlasStudioJourney" aria-label="Explore places">
       <button type="button" onClick={()=>focusArea("World")} aria-label="Explore world">🌍 World</button>
       <button type="button" onClick={focusMakkah} aria-label="Explore Makkah">🕋 Makkah</button>
       <button type="button" onClick={()=>focusArea("Africa")}>Africa</button>
       <button type="button" onClick={()=>focusArea("Europe")}>Europe</button>
       <button type="button" onClick={()=>focusArea("Asia")}>Asia</button>
       <button type="button" onClick={()=>focusArea("Americas")}>Americas</button>
      </nav>
      <div className="atlasStudioSearchBox">
       <span aria-hidden="true">⌕</span>
       <input type="search" aria-label={"Find "+(mode==="world"?"a country":"a state")+" on the Ummah map"} placeholder={mode==="world"?"Find a country with members…":"Find a state with members…"} value={studioSearch}
        onChange={e=>{setStudioSearch(e.target.value);setStudioSearchOpen(true)}} onFocus={()=>setStudioSearchOpen(true)} />
       {studioSearch&&<button type="button" className="atlasStudioSearchClear" aria-label="Clear search" onClick={()=>{setStudioSearch("");setStudioSearchOpen(false)}}>×</button>}
       {studioSearchOpen&&studioSearch.trim()&&<div className="atlasStudioSuggestions" role="listbox" aria-label="Matching member regions">
        {studioResults.length?studioResults.map(row=><button type="button" key={row.name} role="option" aria-selected={focusName===row.name}
         onClick={()=>focusNamedRegion(row.name,lookup[row.name])}>
         <span>{row.name}</span><small>{row.count} {row.count===1?"member":"members"}</small>
        </button>):<p>No opted-in regions match yet.</p>}
       </div>}
      </div>
     </div>
     <div className="atlasStudioGestures" aria-hidden="true">DRAG TO TRAVEL <b>·</b> PINCH TO EXPLORE</div>
     <div className="atlasStudioBottom">
      {chosen?<div className="atlasStudioSelected" aria-live="polite">
       <div className="atlasStudioRegionTitle">
        <div><small>⌖ {mode==="world"?"COUNTRY CONNECTIONS":"STATE CONNECTIONS"}</small><h2>{chosen.name}</h2><p>{chosen.count} {chosen.count===1?"Muslim has":"Muslims have"} shared this region</p></div>
       </div>
       {mode==="world"&&<div className="atlasStudioPeople">
        {peopleLoading?<span className="atlasStudioPeopleStatus">Finding community members…</span>:
         peopleError?<span className="atlasStudioPeopleStatus">{peopleError}</span>:
         people.length?people.map(person=><button className="atlasStudioPerson" key={person.id} type="button"
           title={"Open "+person.name+"'s profile"} aria-label={"Open "+person.name+"'s profile"}
           onClick={()=>{closeStudio();if(onOpenMember)onOpenMember(person.id);else window.location.assign("/profile?section=muslimeen&member="+encodeURIComponent(person.id))}}>
           <img alt="" src={person.avatar} loading="lazy" onError={e=>{e.currentTarget.src="/assets/avatars/default-male.jpg"}}/>
           <span>{person.name}</span>
          </button>):
         <span className="atlasStudioPeopleStatus">No member previews are available for this country yet.</span>}
       </div>}
       {mode==="us"&&<span className="atlasStudioPeopleStatus">Member identities are discoverable by country, not by city or state.</span>}
      </div>:makkahFocus?<div className="atlasStudioMission" aria-live="polite">
        <small>🕋 MAKKAH AL-MUKARRAMAH</small><h2>Our shared Qibla.</h2>
        <p>A point of unity for Muslims across the world. Explore the map to meet our Ummah.</p>
       </div>:<div className="atlasStudioMission" aria-live="polite">
        <small>ONE UMMAH · MANY PLACES</small><h2>Distance ends where connection begins.</h2>
        <p>Tap a glowing pin to explore regions members chose to share.</p>
        {rows.length>0&&<div className="atlasStudioPopular" aria-label="Places with community members">
         {rows.slice(0,5).map(row=><button type="button" key={row.name}
          onClick={()=>focusNamedRegion(row.name,lookup[row.name])}>{row.name} <span>{row.count}</span></button>)}
        </div>}
       </div>}
      <div className="atlasStudioBottomActions">
       <span className="atlasStudioCount"><i/> {stats?stats.recorded.toLocaleString():"—"} members · {stats?stats.countries.length:"—"} countries</span>
       <div className="atlasStudioBottomButtons">
        <button type="button" onClick={openEditor} aria-label="Join or update your region on the Ummah map">＋ My region</button>
        <button type="button" onClick={resetView} aria-label="Reset map camera" title="Recenter map">⌖</button>
       </div>
      </div>
      <p className="atlasStudioPrivacy">Only voluntarily shared country regions are shown · No precise user locations</p>
     </div>
    </div>
   </div>,document.body)}

 </section>;
}
