"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "../../utils/supabase/client";

type Row={provider:string;handle:string|null;channel_url:string|null;enabled:boolean;is_live:boolean};
const services=[{id:"tiktok",name:"TikTok",icon:"♪"},{id:"youtube",name:"YouTube",icon:"▶"},{id:"twitch",name:"Twitch",icon:"◈"}];
export default function HomeConnectedAccounts(){
 const [signedIn,setSignedIn]=useState(false);
 const [rows,setRows]=useState<Row[]>([]);
 const [loading,setLoading]=useState(true);
 const [silverChoice,setSilverChoice]=useState<"yes"|"no"|null>(null);
 const [xp,setXp]=useState<number|null>(null);
 const [notice,setNotice]=useState("");
 useEffect(()=>{let live=true;const supabase=createClient();(async()=>{
  const {data:{user}}=await supabase.auth.getUser();
  if(!live)return;
  setSignedIn(!!user);
  if(user){
   const [{data:connections},{data:profile}]=await Promise.all([
    supabase.from("live_connectors").select("provider,handle,channel_url,enabled,is_live").eq("user_id",user.id),
    supabase.from("profiles").select("xp_total").eq("id",user.id).maybeSingle()
   ]);
   if(live){setRows((connections??[]) as Row[]);setXp(typeof profile?.xp_total==="number"?profile.xp_total:null)}
  }
  if(live)setLoading(false);
 })();return()=>{live=false}},[]);
 const connected=rows.filter(x=>x.enabled&&!!x.handle);
 const silverEligible=xp!==null&&xp>=10500;
 const choose=(v:"yes"|"no")=>{setSilverChoice(v);setNotice(v==="yes"?"Silver avatar preference noted. Equip it from your avatar settings.":"You can choose the Silver avatar later.");if(v==="yes"&&typeof window!=="undefined"&&"AudioContext" in window){try{const ctx=new AudioContext();const oscillator=ctx.createOscillator();const gain=ctx.createGain();oscillator.type="sine";oscillator.frequency.setValueAtTime(660,ctx.currentTime);oscillator.frequency.exponentialRampToValueAtTime(990,ctx.currentTime+.15);gain.gain.setValueAtTime(.025,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.22);oscillator.connect(gain);gain.connect(ctx.destination);oscillator.start();oscillator.stop(ctx.currentTime+.23);oscillator.onended=()=>void ctx.close()}catch{}}};
 return <section className="railCard connectedAccounts" data-no-translate="false">
 <span className="eyebrow">YOUR SOCIAL UNIVERSE</span><h3>✨ Connected Accounts</h3>
 <p>Bring your channels together. Connect securely and see your social presence in one place.</p>
 {loading?<p role="status">Loading connections…</p>:!signedIn?<Link className="primary" href="/auth">Sign in to connect →</Link>:<>
 <div className="connectorRows">{services.map(service=>{const row=rows.find(x=>x.provider===service.id&&x.enabled&&x.handle);return <div className="connectorRow" key={service.id}>
 <span className="connectorIcon" aria-hidden="true">{service.icon}</span><div><strong>{service.name}</strong><small>{row?("@"+String(row.handle).replace(/^@/,"")):"Not connected"}</small></div>
 <span className={row?"connectorStatus on":"connectorStatus"}>{row?"● Added":"○ Pending"}</span>
 </div>})}</div>
 {connected.length>0&&<div className="connectorCelebration" role="status">✦ {connected.length} channel{connected.length===1?"":"s"} in your 1Muslim profile</div>}
 <p className="connectorDisclosure">Channel details are currently profile records. Verified OAuth authorization is coming soon; no platform access is implied.</p>
 <div className="silverReward"><span className="eyebrow">🏅 AVATAR REWARD</span><strong>Silver Avatar · 10,500 XP tier</strong>
 <small>{xp===null?"XP not available":silverEligible?"Unlocked — would you like to use the Silver avatar?":`${xp.toLocaleString()} XP · ${(10500-xp).toLocaleString()} XP until Silver`}</small>
 {silverEligible&&<div className="silverChoices"><button type="button" onClick={()=>choose("yes")}>Yes ✨</button><button type="button" onClick={()=>choose("no")}>No, thanks</button></div>}
 {silverChoice&&<p role="status">{notice}</p>}
 <small>Silver is an existing XP tier, not an additional XP award. Choose accessories in your avatar editor.</small>
 </div>
 <Link className="ghost full" href="/profile">Manage profile & avatar →</Link>
 </>}
 <style jsx>{`.connectedAccounts{position:relative;overflow:hidden}.connectedAccounts:before{content:"";position:absolute;inset:0 0 auto;height:3px;background:linear-gradient(90deg,#26e6a1,#9c7bff,#32d9ff)}.connectorRows{display:grid;gap:9px;margin:15px 0}.connectorRow{display:flex;align-items:center;gap:9px;padding:10px;border:1px solid rgba(137,179,153,.24);border-radius:13px;background:rgba(15,29,26,.55);animation:connectorIn .5s both}.connectorRow:nth-child(2){animation-delay:.1s}.connectorRow:nth-child(3){animation-delay:.2s}.connectorIcon{display:grid;place-items:center;width:31px;height:31px;border-radius:10px;background:linear-gradient(135deg,#263c38,#362c51);color:#e3fff0;font-size:18px}.connectorRow>div{flex:1;min-width:0}.connectorRow strong,.connectorRow small,.silverReward strong,.silverReward small{display:block}.connectorRow strong{font-size:12px}.connectorRow small{font-size:10px;color:#a3b5a9;overflow:hidden;text-overflow:ellipsis}.connectorStatus{font-size:9px;color:#b8b9b6;white-space:nowrap}.connectorStatus.on{color:#72efba}.connectorCelebration{padding:9px;border-radius:10px;background:rgba(24,116,80,.2);color:#9affcf;font-size:11px;animation:connectorGlow 2s ease-in-out infinite alternate}.connectorDisclosure{font-size:10px;line-height:1.5;opacity:.75}.silverReward{display:grid;gap:7px;margin:14px 0;padding:14px;border:1px solid rgba(184,193,217,.4);border-radius:14px;background:linear-gradient(125deg,rgba(167,185,220,.17),rgba(86,65,123,.14))}.silverReward strong{font-size:13px;color:#e2e9ff}.silverReward small{font-size:10px;color:#bec8d7}.silverChoices{display:flex;gap:8px}.silverChoices button{flex:1;border:1px solid #a5b7c8;border-radius:10px;background:#243b41;color:white;padding:9px;cursor:pointer}.silverChoices button:hover{background:#36595b}@keyframes connectorIn{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:translateY(0)}}@keyframes connectorGlow{from{box-shadow:0 0 0 rgba(77,255,168,0)}to{box-shadow:0 0 16px rgba(77,255,168,.13)}}@media(prefers-reduced-motion:reduce){.connectorRow,.connectorCelebration{animation:none}}`}</style>
 </section>
}
