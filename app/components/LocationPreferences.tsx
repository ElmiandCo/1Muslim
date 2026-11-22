"use client";
import {useEffect,useState} from "react";
import {createClient} from "../../utils/supabase/client";
export const LOCATION_KEY="1muslim:location:v1";
export type LocationPreference={city:string;state:string;country:string};
export function readLocation():LocationPreference{try{const x=JSON.parse(localStorage.getItem(LOCATION_KEY)||"{}");return {city:String(x.city||""),state:String(x.state||""),country:String(x.country||"")}}catch{return {city:"",state:"",country:""}}}
export default function LocationPreferences({onSaved}:{onSaved?:(v:LocationPreference)=>void}){
 const [value,setValue]=useState<LocationPreference>({city:"",state:"",country:""});const [status,setStatus]=useState("");const [busy,setBusy]=useState(false);
 useEffect(()=>{let active=true;setValue(readLocation());void(async()=>{const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user||!active)return;const {data}=await db.from("profiles").select("city,state,country").eq("id",user.id).maybeSingle();if(!active||!data)return;const saved=readLocation();const next={city:data.city||saved.city,state:data.state||saved.state,country:data.country||saved.country};setValue(next);if(next.city&&next.country)localStorage.setItem(LOCATION_KEY,JSON.stringify(next))})();return()=>{active=false}},[]);
 const useDeviceLocation=()=>{
  if(!navigator.geolocation){setStatus("Location is unavailable in this browser.");return}
  setBusy(true);setStatus("Finding your city…");
  navigator.geolocation.getCurrentPosition(async pos=>{
   try{
    const response=await fetch("/api/profile/reverse-geocode",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({latitude:pos.coords.latitude,longitude:pos.coords.longitude})});
    if(!response.ok)throw new Error("Could not identify your city.");
    const result=await response.json();
    if(!result.city||!result.country)throw new Error("City or country missing. Enter your location manually.");
    setValue({city:result.city,state:result.state||"",country:result.country});
    setStatus("Location detected. Tap Save location to confirm. Only your city, state and country will be saved.");
   }catch(e){setStatus(e instanceof Error?e.message:"Could not determine location.")}finally{setBusy(false)}
  },e=>{setStatus(e.code===1?"Location permission denied. You can enter your city manually.":"Could not access device location. Enter your city manually.");setBusy(false)},{enableHighAccuracy:false,timeout:12000,maximumAge:300000});
 };
 const save=async()=>{if(!value.city.trim()||!value.country.trim()){setStatus("City and country are required.");return}setBusy(true);const next={city:value.city.trim(),state:value.state.trim(),country:value.country.trim()};const db=createClient();const {data:{user}}=await db.auth.getUser();if(user){const {error}=await db.from("profiles").update(next).eq("id",user.id);if(error){setStatus("Could not save to your account: "+error.message);setBusy(false);return}}localStorage.setItem(LOCATION_KEY,JSON.stringify(next));window.dispatchEvent(new Event("1muslim:location-updated"));onSaved?.(next);setStatus(user?"Location saved to your account.":"Location saved on this device. Sign in to sync it.");setBusy(false)};
 return <div style={{display:"grid",gap:10}}><p style={{opacity:.75,margin:0}}>Used for prayer times and, later, nearby mosques and community events. Your location is not displayed publicly by this setting.</p>{(["city","state","country"] as const).map(k=><label key={k} style={{display:"grid",gap:4,textTransform:"capitalize"}}>{k==="state"?"State / region (optional)":k}<input autoComplete={k==="country"?"country-name":"address-level2"} value={value[k]} onChange={e=>setValue(v=>({...v,[k]:e.target.value}))} placeholder={k==="city"?"Your city":k==="country"?"Your country":"State or region"} style={{padding:11,borderRadius:10,border:"1px solid #b7aa7988",background:"#fff",color:"#173c2c",width:"100%",boxSizing:"border-box"}}/></label>)}<button type="button" disabled={busy} onClick={useDeviceLocation} style={{padding:12,borderRadius:11,border:"1px solid #b7aa7988",background:"transparent",color:"inherit",fontWeight:700}}>⌖ Use my current location</button><button type="button" disabled={busy} onClick={()=>void save()} style={{padding:12,borderRadius:11,border:0,background:"#e4d299",color:"#173c2c",fontWeight:700}}>{busy?"Saving…":"Save location"}</button><small role="status">{status}</small></div>;
}
