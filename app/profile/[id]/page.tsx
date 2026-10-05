"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import SiteNav from "../../components/SiteNav";
import ProfileAvatar from "../../components/ProfileAvatar";
import { createClient } from "../../../utils/supabase/client";

type Profile={id:string;display_name:string;username:string|null;first_name:string|null;last_name:string|null;city:string|null;state:string|null;country:string|null;gender:string|null;bio:string|null;xp_total:number;avatar_gender:string;avatar_package:string;avatar_config:Record<string,unknown>;profile_accent:string;profile_background:string};

export default function PublicProfile(){
 const params=useParams();const [p,setP]=useState<Profile|null>(null);const [loading,setLoading]=useState(true);
 useEffect(()=>{(async()=>{const {data}=await createClient().from("profiles").select("id,display_name,username,first_name,last_name,city,state,country,gender,bio,xp_total,avatar_gender,avatar_package,avatar_config,profile_accent,profile_background").eq("id",String(params.id)).single();setP(data as Profile|null);setLoading(false)})()},[params.id]);
 if(loading)return <main><SiteNav compact/><section className="profileEmpty"><p>Loading…</p></section></main>;
 if(!p)return <main><SiteNav compact/><section className="profileEmpty"><h1>Profile not found.</h1><Link href="/find" className="primary">Back to Find</Link></section></main>;
 return <main className="profilePage"><SiteNav/><div className="profileShell"><header className={`profileHero header-${p.profile_accent}`}><div className="profileHeroTop"><ProfileAvatar name={p.display_name} gender={p.gender} avatarGender={p.avatar_gender} avatarPackage={p.avatar_package} avatarConfig={p.avatar_config} accent={p.profile_accent} size="lg"/><div><span className="eyebrow">ONE MUSLIM MEMBER</span><h1>{p.display_name}</h1><p>@{p.username||"member"} · {p.xp_total.toLocaleString()} XP</p></div></div></header><section className="publicProfileBody"><div><span className="eyebrow">ABOUT</span><h2>{[p.first_name,p.last_name].filter(Boolean).join(" ")}</h2><p>{p.bio||"A member of the OneMuslim community."}</p></div><div className="publicFacts">{p.gender&&<span>Gender · {p.gender}</span>}{[p.city,p.state,p.country].filter(Boolean).length>0&&<span>Location · {[p.city,p.state,p.country].filter(Boolean).join(", ")}</span>}<span>Avatar · {p.avatar_package}</span></div></section><Link href="/find" className="backFind">← Back to Find</Link></div></main>;
}