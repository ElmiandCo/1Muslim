"use client";
import {useMemo,useState} from "react";
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
  const {error}=await db.from("profiles").update({country:normalized,state:state.trim()||null,city:city.trim()||null}).eq("id",userId);
  setSaving(false);
  if(error){setMessage(error.message);return}
  onSaved(normalized);setEditing(false);setMessage("✓ Region saved");
 };
 return <div className="muslimeenRegionPanel">
  <label htmlFor="muslimeen-region-search">Discover by country</label>
  <input id="muslimeen-region-search" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="⌕ Search countries…" autoComplete="off" style={{width:"100%",padding:"12px 16px",borderRadius:18,border:"1px solid #c8d4e6",background:"#fff",color:"#152e51",fontSize:16}}/>
  <div role="group" aria-label="Filter members by country" style={{maxHeight:220,overflowY:"auto",marginTop:8,display:"grid",gap:4}}>
   <button type="button" aria-pressed={!selected} onClick={()=>onSelect("")} style={{textAlign:"left",padding:"10px 14px",borderRadius:12,border:!selected?"2px solid #18345d":"1px solid #d8e1ed",background:!selected?"#e8f1ff":"white",color:"#18345d"}}>🌍 All available countries</button>
   {options.map(([name,count])=><button type="button" key={name} aria-pressed={selected===name} onClick={()=>onSelect(name)} style={{textAlign:"left",padding:"10px 14px",borderRadius:12,border:selected===name?"2px solid #18345d":"1px solid #d8e1ed",background:selected===name?"#e8f1ff":"white",color:"#18345d"}}>{name} · {count} {count===1?"member":"members"}</button>)}
   {!options.length&&<small>No matching countries among loaded members.</small>}
  </div>
  <small>Countries shown are based on loaded member profiles. Location sharing is optional.</small>
  <button type="button" onClick={()=>{setEditing(v=>!v);setCountry(canonicalCountry(currentCountry));setMessage("")}} style={{marginTop:12,padding:"10px 16px",borderRadius:22,border:"1px solid #adc3e1",background:"#e9f1fc",color:"#18345d",fontWeight:700}}>📍 {currentCountry?"Edit My Region":"Set My Region"} +</button>
  {editing&&<div style={{display:"grid",gap:10,marginTop:12,padding:14,border:"1px solid #d8e1ed",borderRadius:18,background:"#fff"}}>
   <strong>Where are you from? 🌍</strong>
   <label>Country<input value={country} onChange={e=>setCountry(e.target.value)} placeholder="Country" maxLength={80}/></label>
   <label>State / Province (optional)<input value={state} onChange={e=>setState(e.target.value)} maxLength={80}/></label>
   <label>City (optional)<input value={city} onChange={e=>setCity(e.target.value)} maxLength={80}/></label>
   <button type="button" disabled={saving||!country.trim()} onClick={()=>void save()} style={{padding:12,borderRadius:16,background:"#18345d",color:"white",fontWeight:700}}>{saving?"Saving…":"Save My Region ✓"}</button>
  </div>}
  {message&&<p role="status" style={{margin:"8px 0 0"}}>{message}</p>}
 </div>;
}
