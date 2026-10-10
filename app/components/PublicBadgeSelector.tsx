"use client";
import { useEffect, useState } from "react";
import { createClient } from "../../utils/supabase/client";
const options = [{ id: "shahada", label: "Shahada", image: "" }, { id: "tiktok", label: "TikTok Connected", image: "/assets/badges/1Muslim-TikTok-badge.PNG" }];
export default function PublicBadgeSelector({ userId, verifiedAt }: { userId: string; verifiedAt: string | null }) {
 const [enabled, setEnabled] = useState<string[]>(["shahada","tiktok"]);
 const [connected, setConnected] = useState(false);
 const [saving, setSaving] = useState(false);
 const [message, setMessage] = useState("");
 useEffect(() => {
  let active=true;
  const db=createClient();
  Promise.all([
   db.from("public_badge_preferences").select("visible_badges").eq("user_id",userId).maybeSingle(),
   fetch("/api/tiktok/status",{cache:"no-store"}).then(r=>r.json()).catch(()=>({connected:false}))
  ]).then(([prefs,status])=>{if(!active)return;if(prefs.data?.visible_badges)setEnabled(prefs.data.visible_badges);setConnected(Boolean(status.connected))});
  return()=>{active=false};
 },[userId]);
 const toggle=async (id:string) => {
  const next=enabled.includes(id)?enabled.filter(x=>x!==id):[...enabled,id];
  setSaving(true);setMessage("");
  const {error}=await createClient().from("public_badge_preferences").upsert({user_id:userId,visible_badges:next,updated_at:new Date().toISOString()},{onConflict:"user_id"});
  if(error)setMessage("Could not save badge visibility.");else{setEnabled(next);setMessage("Public badge selection saved.")}
  setSaving(false);
 };
 return <section className="profileEditor" style={{padding:24,border:"1px solid #49675c",borderRadius:20}}>
  <h2>🏅 Public Badges</h2><p>Choose which earned badges appear on your public profile. You can show multiple badges at once.</p>
  <div style={{display:"grid",gap:12,marginTop:18}}>
   {options.map(b=>{const earned=b.id==="shahada"?Boolean(verifiedAt):connected;return <label key={b.id} style={{display:"flex",alignItems:"center",gap:14,padding:14,border:"1px solid #46645b",borderRadius:14,opacity:earned?1:.55}}>
    {b.image?<img src={b.image} alt="" style={{width:48,height:48,objectFit:"contain"}}/>:<span style={{fontSize:32}}>✦</span>}
    <span style={{flex:1}}><strong>{b.label}</strong><small style={{display:"block"}}>{earned?"Earned • available to display":"Locked • not currently earned"}</small></span>
    <input type="checkbox" checked={earned&&enabled.includes(b.id)} disabled={!earned||saving} onChange={()=>toggle(b.id)} aria-label={"Show "+b.label+" publicly"}/>
   </label>})}
  </div><p role="status">{message}</p><p style={{fontSize:12,opacity:.75}}>Disconnecting TikTok automatically removes its badge from public view, even if you previously selected it.</p>
 </section>;
}
