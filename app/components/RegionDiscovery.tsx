"use client";
import {useEffect,useMemo,useState} from "react";
import {createClient} from "../../utils/supabase/client";

const aliases:Record<string,string>={
 "usa":"United States","us":"United States","u s a":"United States","united states of america":"United States","america":"United States",
 "uk":"United Kingdom","u k":"United Kingdom","great britain":"United Kingdom","britain":"United Kingdom",
 "uae":"United Arab Emirates","u a e":"United Arab Emirates","emirates":"United Arab Emirates",
 "ksa":"Saudi Arabia","kingdom of saudi arabia":"Saudi Arabia",
 "somaliland":"Somaliland","republic of somalia":"Somalia",
 "south korea":"South Korea","republic of korea":"South Korea",
 "north korea":"North Korea","dprk":"North Korea",
 "russia":"Russia","russian federation":"Russia",
 "turkiye":"Türkiye","turkey":"Türkiye",
 "ivory coast":"Côte d’Ivoire","cote d ivoire":"Côte d’Ivoire",
 "dr congo":"Democratic Republic of the Congo","drc":"Democratic Republic of the Congo",
 "the netherlands":"Netherlands","holland":"Netherlands",
 "palestinian territories":"Palestine","state of palestine":"Palestine"
};
const codes:Record<string,string>={"US":"United States","GB":"United Kingdom","AE":"United Arab Emirates","SA":"Saudi Arabia","SO":"Somalia","TR":"Türkiye","PS":"Palestine","KR":"South Korea","KP":"North Korea","RU":"Russia","CI":"Côte d’Ivoire","CD":"Democratic Republic of the Congo"};
const clean=(value:string)=>value.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
export function canonicalCountry(value:string|null|undefined):string{
 const raw=(value||"").trim();if(!raw)return "";
 const key=clean(raw);
 if(aliases[key])return aliases[key];
 if(raw.length===2&&/^[a-z]{2}$/i.test(raw)){
  const code=raw.toUpperCase();
  if(codes[code])return codes[code];
  try{const name=new Intl.DisplayNames(["en"],{type:"region"}).of(code);if(name&&name!==code)return name}catch{}
 }
 return raw;
}
type Props={members:Array<{country:string|null}>;currentCountry:string|null;userId:string;selected:string;onSelect:(value:string)=>void;onSaved:(value:string)=>void};
export default function RegionDiscovery({members,currentCountry,userId,selected,onSelect,onSaved}:Props){
 const [query,setQuery]=useState("");
 const [editing,setEditing]=useState(false);
 const [country,setCountry]=useState(canonicalCountry(currentCountry));
 const [city,setCity]=useState("");
 const [state,setState]=useState("");
 const [saving,setSaving]=useState(false);
 const [message,setMessage]=useState("");
 useEffect(()=>{setCountry(canonicalCountry(currentCountry))},[currentCountry]);
 const regions=useMemo(()=>{
  const map=new Map<string,number>();
  members.forEach(member=>{const name=canonicalCountry(member.country);if(name)map.set(name,(map.get(name)||0)+1)});
  return [...map.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
 },[members]);
 const options=regions.filter(([name])=>name.toLowerCase().includes(query.trim().toLowerCase()));
 const save=async()=>{
  const normalized=canonicalCountry(country);
  if(!normalized){setMessage("Please enter your country.");return}
  setSaving(true);setMessage("");
  const db=createClient();
  const {data:{user},error:authError}=await db.auth.getUser();
  if(authError||user?.id!==userId){setMessage("Please sign in to update your region.");setSaving(false);return}
  const {data:updated,error}=await db.from("profiles").update({country:normalized,state:state.trim()||null,city:city.trim()||null}).eq("id",userId).select("id,country").single();
  setSaving(false);
  if(error||!updated){setMessage(error?.message||"Region was not saved. Please retry.");return}
  // Save My Region is an explicit public-sharing choice, unlike private prayer location.
  const {error:consentError}=await db.from("member_region_preferences").upsert({user_id:userId,region_level:city.trim()?"city":state.trim()?"state":"country",consented_at:new Date().toISOString()},{onConflict:"user_id"});
  if(consentError){setMessage("Region saved to your profile, but Ummah map consent could not be recorded. Please retry.");return}
  onSaved(normalized);setEditing(false);setMessage("✓ Your profile now appears in "+normalized+".");
 };
 const locations:Record<string,[number,number]>={"United States":[22,38],"Canada":[20,25],"Mexico":[19,48],"Brazil":[34,72],"Argentina":[31,85],"United Kingdom":[47,29],"France":[48,35],"Germany":[51,32],"Spain":[45,39],"Türkiye":[57,39],"Russia":[70,22],"Saudi Arabia":[59,49],"United Arab Emirates":[64,51],"Somalia":[62,63],"Kenya":[59,68],"Egypt":[54,49],"Nigeria":[49,61],"South Africa":[54,83],"India":[71,52],"Pakistan":[67,49],"Bangladesh":[75,56],"China":[79,41],"Japan":[89,42],"Indonesia":[81,68],"Malaysia":[79,65],"Australia":[87,81],"Palestine":[56,44],"Morocco":[44,49]};
 const selectedCount=regions.find(([name])=>name===selected)?.[1]||0;
 const markers=regions.filter(([name])=>!!locations[name]).map(([name,count])=>({name,count,point:locations[name]}));
 return <section className="muslimeenRegionPanel" style={{padding:16,borderRadius:24,background:"var(--region-bg, #f5f7fb)",color:"var(--region-text, #162d50)",border:"1px solid var(--region-border, #d9e2ef)",display:"grid",gap:12}}>
  <div style={{display:"flex",alignItems:"start",justifyContent:"space-between",gap:8}}><div><strong style={{fontSize:20}}>Discover Muslims Worldwide</strong><div style={{fontSize:12,opacity:.7,marginTop:3}}>Explore members by their shared country</div></div><button type="button" onClick={()=>{setEditing(v=>!v);setCountry(canonicalCountry(currentCountry));setMessage("")}} aria-label="Edit my region" style={{border:"1px solid #c8d4e6",background:"var(--region-control, #fff)",color:"inherit",borderRadius:14,padding:"9px 11px",whiteSpace:"nowrap",fontSize:13}}>📍 Edit</button></div>
  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}><button type="button" onClick={()=>onSelect("")} aria-pressed={!selected} style={{border:!selected?"1px solid #18345d":"1px solid #c8d4e6",borderRadius:20,padding:"7px 13px",background:!selected?"#18345d":"var(--region-control, #fff)",color:!selected?"white":"inherit"}}>🌍 World</button>{selected&&<button type="button" onClick={()=>onSelect("")} style={{border:"1px solid #c8d4e6",borderRadius:20,padding:"7px 13px",background:"var(--region-control, #fff)",color:"inherit"}}>› {selected} ×</button>}</div>
  <div aria-label="Interactive member country map" style={{position:"relative",height:270,overflow:"hidden",borderRadius:22,background:"radial-gradient(ellipse at 45% 35%,#204d6b 0%,#0c263e 65%,#081c2f 100%)",border:"1px solid #4c809c",boxShadow:"inset 0 0 55px #051726,0 12px 26px #071d3033"}}>
   <svg viewBox="0 0 600 300" preserveAspectRatio="xMidYMid meet" aria-hidden="true" style={{position:"absolute",width:"100%",height:"100%"}}><g fill="#3c8090" stroke="#7ac0c3" strokeWidth="1.5" opacity=".75"><path d="M36 65 82 37 147 33 184 61 171 92 139 112 123 151 92 158 74 120 49 115Z"/><path d="M120 163 161 155 190 186 176 218 157 267 135 289 116 246 109 204Z"/><path d="M251 72 285 51 320 65 329 97 302 117 291 154 260 149 247 118Z"/><path d="M285 153 343 145 365 193 342 250 312 282 283 238 269 191Z"/><path d="M330 64 390 39 463 47 542 75 561 112 526 137 476 125 452 157 413 144 388 172 348 137 319 108Z"/><path d="M458 171 492 178 514 212 486 232 466 208Z"/><path d="M488 226 546 224 568 258 542 280 493 272Z"/></g><g stroke="#9acbd6" strokeWidth=".5" opacity=".18"><path d="M0 100H600M0 200H600M150 0V300M300 0V300M450 0V300"/></g></svg>
   {markers.map(({name,count,point})=><button type="button" key={name} onClick={()=>onSelect(selected===name?"":name)} title={name+" · "+count+" members"} aria-label={name+", "+count+" members"} aria-pressed={selected===name} style={{position:"absolute",left:point[0]+"%",top:point[1]+"%",transform:"translate(-50%,-50%)",border:"2px solid white",borderRadius:"50%",width:selected===name?29:Math.min(26,13+count*2),height:selected===name?29:Math.min(26,13+count*2),background:selected===name?"#ffd68c":"#41d4bb",boxShadow:"0 0 0 4px #65d9d633,0 0 15px #54e8c6",cursor:"pointer",zIndex:selected===name?2:1}}/>)}
   <span style={{position:"absolute",bottom:9,left:11,fontSize:10,color:"#e5f8ff",background:"#0b243bdc",padding:"5px 8px",borderRadius:9}}>● Countries with shared member locations</span>
  </div>
  <label htmlFor="muslimeen-region-search" style={{fontSize:13,fontWeight:650}}>Find a country</label><input id="muslimeen-region-search" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search countries…" autoComplete="off" style={{width:"100%",padding:"11px 14px",borderRadius:15,border:"1px solid #c8d4e6",background:"var(--region-control, #fff)",color:"inherit",fontSize:15}}/>
  {query.trim()&&<div style={{display:"grid",gap:5,maxHeight:160,overflowY:"auto"}}>{options.map(([name,count])=><button type="button" key={name} onClick={()=>{onSelect(name);setQuery("")}} style={{textAlign:"left",padding:10,borderRadius:11,border:"1px solid #c8d4e6",background:"var(--region-control, #fff)",color:"inherit"}}>{name} · {count} {count===1?"member":"members"}</button>)}{!options.length&&<small>No matching countries among loaded members.</small>}</div>}
  <div aria-live="polite" style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 13px",borderRadius:15,background:"var(--region-control, #fff)",border:"1px solid #d8e1ed",gap:8}}><strong style={{fontSize:14}}>{selected?"📍 "+selected:"🌍 Worldwide"}</strong><span style={{fontSize:13}}>{selected?selectedCount:regions.reduce((sum,[,count])=>sum+count,0)} members</span></div>
  <small style={{opacity:.7,lineHeight:1.5}}>Only voluntarily shared country locations are shown. Map markers are approximate, not precise locations. Countries without map coordinates remain available through search.</small>
  {editing&&<div className="regionEditor" style={{display:"grid",gap:12,padding:16,border:"1px solid #d8e1ed",borderRadius:18,background:"var(--region-control, #fff)"}}><strong>📍 Update my location</strong><small>Choose the country where you want your member profile listed. This is shared publicly at country level only.</small><label style={{display:"grid",gap:6,fontWeight:650}}>Country<input list="region-country-suggestions" value={country} onChange={e=>setCountry(e.target.value)} placeholder="Type a country, e.g. Canada" maxLength={80} style={{width:"100%",minWidth:0,boxSizing:"border-box",padding:"12px 14px",borderRadius:12,border:"1px solid #c6d5e2",background:"#fff",color:"#142a45",fontSize:16}}/></label><datalist id="region-country-suggestions">{Array.from(new Set([...regions.map(([name])=>name),"Canada","United States","Somalia","United Kingdom","Saudi Arabia","Palestine","Türkiye","Pakistan","India","Kenya","Nigeria","Australia"])).map(name=><option key={name} value={name}/>)}</datalist><label style={{display:"grid",gap:6,fontWeight:650}}>State / Province (optional)<input value={state} onChange={e=>setState(e.target.value)} maxLength={80} style={{width:"100%",minWidth:0,boxSizing:"border-box",padding:"12px 14px",borderRadius:12,border:"1px solid #c6d5e2",background:"#fff",color:"#142a45",fontSize:16}}/></label><label style={{display:"grid",gap:6,fontWeight:650}}>City (optional)<input value={city} onChange={e=>setCity(e.target.value)} maxLength={80} style={{width:"100%",minWidth:0,boxSizing:"border-box",padding:"12px 14px",borderRadius:12,border:"1px solid #c6d5e2",background:"#fff",color:"#142a45",fontSize:16}}/></label><button type="button" disabled={saving||!country.trim()} onClick={()=>void save()} style={{padding:14,borderRadius:16,background:"#18345d",color:"white",fontWeight:700}}>{saving?"Saving…":"Save My Region ✓"}</button></div>}
  {message&&<p role="status" style={{margin:0}}>{message}</p>}
 </section>;
}
