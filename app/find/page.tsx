"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteNav from "../components/SiteNav";
import ProfileAvatar from "../components/ProfileAvatar";
import { useOnlinePresence, OnlineDot } from "../components/OnlinePresence";
import { createClient } from "../../utils/supabase/client";
import AshabButton from "../components/AshabButton";

type Person={id:string;display_name:string;username:string|null;first_name:string|null;last_name:string|null;city:string|null;state:string|null;country:string|null;gender:string|null;bio:string|null;xp_total:number;avatar_gender:string;avatar_package:string;avatar_config:Record<string,unknown>;profile_accent:string}; type LiveStream={id:string;host_id:string;title:string;category:string;viewer_count:number};

export default function FindPage(){
 const [people,setPeople]=useState<Person[]>([]); const [lives,setLives]=useState<LiveStream[]>([]); const [q,setQ]=useState(""); const [loading,setLoading]=useState(true); const [signedIn,setSignedIn]=useState(true);
 const onlineIds=useOnlinePresence();
 useEffect(()=>{(async()=>{const s=createClient();const {data:{user}}=await s.auth.getUser();if(!user){setSignedIn(false);setLoading(false);return;}const {data}=await s.from("profiles").select("id,display_name,username,first_name,last_name,city,state,country,gender,bio,xp_total,avatar_gender,avatar_package,avatar_config,profile_accent").order("created_at",{ascending:false}); const {data:liveData}=await s.from("live_streams").select("id,host_id,title,category,viewer_count").eq("status","live"); setPeople((data??[]) as Person[]); setLives((liveData??[]) as LiveStream[]); setLoading(false);})()},[]);
 const liveIds=new Set(lives.map(l=>l.host_id));
 const filtered=people.filter(p=>[p.display_name,p.username,p.first_name,p.last_name,p.city,p.state,p.country].filter(Boolean).join(" ").toLowerCase().includes(q.toLowerCase()));
 return <main className="findPage"><SiteNav/><div className="findShell"><header className="findHero"><span className="eyebrow">FIND</span><h1>People.</h1><p>Discover OneMuslim members by name, location and the unique identity they created.</p><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search names, cities, states or countries…"/></header>{!signedIn?<section className="profileEmpty"><h2>Sign in to find people.</h2><Link href="/auth" className="primary">Sign in</Link></section>:loading?<p className="muted">Loading people…</p>:<section className="peopleGrid">{filtered.map(p=><Link className={`personCard header-${p.profile_accent}`} href={`/profile/${p.id}`} key={p.id}><div className="personTop"><ProfileAvatar name={p.display_name} gender={p.gender} avatarGender={p.avatar_gender} avatarPackage={p.avatar_package} avatarConfig={p.avatar_config} accent={p.profile_accent} isLive={liveIds.has(p.id)}/><div><h3>{p.display_name||"Member"}</h3><span>@{p.username||"member"}</span><OnlineDot online={onlineIds.has(p.id)} /></div></div><div className="personMeta">{[p.city,p.state,p.country].filter(Boolean).join(", ")||"Location not shared"}</div><p>{p.bio||"Building a life of faith, learning and community."}</p><div className="personFoot"><span>{p.xp_total.toLocaleString()} XP</span><span>{p.avatar_package}</span></div><div style={{marginTop:10}}><AshabButton targetId={p.id}/></div>{lives.some(l=>l.host_id===p.id)&&<div style={{marginTop:11,display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}><span style={{color:"#ff9f9f",fontSize:9,fontWeight:900}}>● LIVE NOW</span><span style={{color:"#cbd8ce",fontSize:9}}>Watch →</span></div>}</Link>)}</section>}</div></main>;
}
