"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import SiteNav from "../components/SiteNav";
import ProfileAvatar, { ACCESSORIES, AVATAR_TIERS, tierForXp } from "../components/ProfileAvatar";
import { createClient } from "../../utils/supabase/client";

type Profile = {
  id: string; display_name: string; username: string | null; first_name: string | null; last_name: string | null;
  city: string | null; state: string | null; country: string | null; gender: string | null; bio: string | null;
  xp_total: number; avatar_gender: string; avatar_package: string; avatar_config: Record<string, unknown>;
  profile_background: string; profile_accent: string;
  display_name_changed_at: string | null; username_changed_at: string | null;
};

const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;

function cooldownRemaining(changedAt: string | null) {
  if (!changedAt) return null;
  const remaining = new Date(changedAt).getTime() + THREE_DAYS - Date.now();
  if (remaining <= 0) return null;
  const hours = Math.ceil(remaining / (60 * 60 * 1000));
  return hours >= 24 ? `${Math.floor(hours / 24)}d ${hours % 24}h remaining` : `${hours}h remaining`;
}

const colors = [["emerald","Emerald"],["gold","Gold"],["blue","Sapphire"],["violet","Violet"],["rose","Rose"],["slate","Slate"]];

export default function ProfilePage() {
  const [profile,setProfile]=useState<Profile|null>(null);
  const [tab,setTab]=useState<"profile"|"avatar"|"header">("profile");
  const [saving,setSaving]=useState(false); const [message,setMessage]=useState(""); const [authRequired,setAuthRequired]=useState(false);

  useEffect(()=>{(async()=>{const s=createClient();const {data:{user}}=await s.auth.getUser();if(!user){setAuthRequired(true);return;}const {data}=await s.from("profiles").select("*").eq("id",user.id).single();if(data)setProfile(data as Profile)})()},[]);

  const tier=useMemo(()=>tierForXp(profile?.xp_total??0),[profile?.xp_total]);
  const update=(patch:Partial<Profile>)=>setProfile(p=>p?{...p,...patch}:p);
  const displayCooldown=cooldownRemaining(profile?.display_name_changed_at??null);
  const usernameCooldown=cooldownRemaining(profile?.username_changed_at??null);

  const save=async()=>{
    if(!profile)return;
    setSaving(true);setMessage("");
    const s=createClient();
    const original=await s.from("profiles").select("display_name,username").eq("id",profile.id).single();
    const displayChanged=original.data && profile.display_name!==original.data.display_name;
    const usernameChanged=original.data && profile.username!==original.data.username;
    const handle=(profile.username??"").trim().replace(/^@+/,"").toLowerCase();
    if(usernameChanged && handle && !/^[a-z0-9_.]{3,30}$/.test(handle)){
      setSaving(false);setMessage("Member handle must be 3–30 characters using letters, numbers, underscores, or periods.");return;
    }
    const config={...(profile.avatar_config??{}),gender:profile.avatar_gender,package:profile.avatar_package,accessories:Array.isArray(profile.avatar_config?.accessories)?profile.avatar_config.accessories:[]};
    const {data,error}=await s.from("profiles").update({display_name:profile.display_name.trim(),username:handle||null,first_name:profile.first_name,last_name:profile.last_name,city:profile.city,state:profile.state,country:profile.country,gender:profile.gender,bio:profile.bio,avatar_gender:profile.avatar_gender,avatar_package:profile.avatar_package,avatar_config:config,profile_background:profile.profile_background,profile_accent:profile.profile_accent}).eq("id",profile.id).select("display_name,username,display_name_changed_at,username_changed_at").single();
    setSaving(false);
    if(error){setMessage(error.message);return;}
    update({display_name:data?.display_name??profile.display_name,username:data?.username??null,display_name_changed_at:data?.display_name_changed_at??profile.display_name_changed_at,username_changed_at:data?.username_changed_at??profile.username_changed_at});
    setMessage(displayChanged||usernameChanged?"Profile identity updated.":"Profile saved.");
  };

  const toggleAccessory=(id:string)=>{if(!profile)return;const item=ACCESSORIES.find(x=>x.id===id);if(!item)return;const required=AVATAR_TIERS.find(x=>x.key===item.tier)?.minXp??0;if(profile.xp_total<required)return;const current=Array.isArray(profile.avatar_config?.accessories)?profile.avatar_config.accessories.map(String):[];const next=current.includes(id)?current.filter(x=>x!==id):[...current,id];update({avatar_config:{...profile.avatar_config,accessories:next}})};

  if(authRequired)return <main><SiteNav compact/><section className="profileEmpty"><h1>Build your profile.</h1><p>Sign in to customize your OneMuslim identity.</p><Link href="/auth" className="primary">Sign in</Link></section></main>;
  if(!profile)return <main><SiteNav compact/><section className="profileEmpty"><p>Loading your profile…</p></section></main>;

  return <main className="profilePage"><SiteNav/><div className="profileShell">
    <header className={`profileHero header-${profile.profile_accent}`}><div className="profileHeroTop"><ProfileAvatar name={profile.display_name} gender={profile.gender} avatarGender={profile.avatar_gender} avatarPackage={profile.avatar_package} avatarConfig={profile.avatar_config} accent={profile.profile_accent} size="lg"/><div><span className="eyebrow">YOUR ONE MUSLIM PROFILE</span><h1>{profile.display_name||"Member"}</h1><p>@{profile.username||"member"} · {tier.name} · {profile.xp_total.toLocaleString()} XP</p></div></div><div className="profileHeroActions"><Link href="/find" className="ghost">Find People</Link><button className="primary" onClick={save} disabled={saving}>{saving?"Saving…":"Save changes"}</button></div></header>
    <div className="profileTabs">{(["profile","avatar","header"] as const).map(x=><button className={tab===x?"active":""} onClick={()=>setTab(x)} key={x}>{x==="profile"?"Profile":x==="avatar"?"Avatar & Accessories":"Header Color"}</button>)}</div>

    {tab==="profile"&&<section className="profileEditor"><div className="editorIntro"><span className="eyebrow">PERSONAL DETAILS</span><h2>Tell people who you are.</h2><p>Your profile is yours. Keep only the information you want to share.</p></div><div className="formGrid">
      <label>Display name<input value={profile.display_name??""} disabled={!!displayCooldown} onChange={e=>update({display_name:e.target.value})}/><small className="fieldNote">{displayCooldown?`You can change your display name again in ${displayCooldown}.`:"You can change this once every 3 days."}</small></label><label>@ Member handle<input value={profile.username?`@${profile.username}`:""} placeholder="@member" disabled={!!usernameCooldown} onChange={e=>update({username:e.target.value.replace(/^@+/,"")})}/><small className="fieldNote">{usernameCooldown?`You can change your handle again in ${usernameCooldown}.`:"You can change this once every 3 days."}</small></label><label>First name<input value={profile.first_name??""} onChange={e=>update({first_name:e.target.value})}/></label><label>Last name<input value={profile.last_name??""} onChange={e=>update({last_name:e.target.value})}/></label>
      <label>Gender<input value={profile.gender ? profile.gender.charAt(0).toUpperCase()+profile.gender.slice(1) : "Not selected"} disabled /><small className="fieldNote">Gender is selected once during onboarding and cannot be changed.</small></label>
      <label>City<input value={profile.city??""} onChange={e=>update({city:e.target.value})}/></label><label>State<input value={profile.state??""} onChange={e=>update({state:e.target.value})}/></label><label>Country<input value={profile.country??""} onChange={e=>update({country:e.target.value})}/></label>
      <label className="wide">Bio<textarea value={profile.bio??""} maxLength={500} onChange={e=>update({bio:e.target.value})}/></label>
    </div>{message&&<div className="saveMessage">{message}</div>}</section>}

    {tab==="avatar"&&<section className="avatarEditor"><div className="avatarPreview"><ProfileAvatar name={profile.display_name} gender={profile.gender} avatarGender={profile.avatar_gender} avatarPackage={profile.avatar_package} avatarConfig={profile.avatar_config} accent={profile.profile_accent} size="lg"/><strong>{tier.icon} {tier.name}</strong><span>{tier.quality}</span><small>{profile.xp_total.toLocaleString()} XP</small></div><div><span className="eyebrow">5 XP TIERS</span><h2>Earn your look.</h2><p className="muted">Everyone starts with a clean default avatar. More XP unlocks better accessories and richer avatar packages.</p><div className="tierGrid">{AVATAR_TIERS.map(t=><div className={`tierCard ${profile.xp_total>=t.minXp?"unlocked":"locked"}`} key={t.key}><b>{t.icon} {t.name}</b><span>{t.minXp.toLocaleString()} XP</span><small>{profile.xp_total>=t.minXp?t.quality:"Locked"}</small></div>)}</div><div className="accessoryGrid">{ACCESSORIES.map(item=>{const required=AVATAR_TIERS.find(x=>x.key===item.tier)!.minXp;const unlocked=profile.xp_total>=required;const selected=Array.isArray(profile.avatar_config?.accessories)&&profile.avatar_config.accessories.map(String).includes(item.id);return <button key={item.id} disabled={!unlocked} className={`accessoryCard ${selected?"selected":""} ${!unlocked?"locked":""}`} onClick={()=>toggleAccessory(item.id)}><span>{unlocked?item.icon:"🔒"}</span><b>{item.name}</b><small>{unlocked?"Tap to equip":`${required.toLocaleString()} XP`}</small></button>})}</div></div></section>}

    {tab==="header"&&<section className="headerEditor"><span className="eyebrow">PROFILE HEADER</span><h2>Choose your header color.</h2><p className="muted">Your choice follows you into Find People and your public profile.</p><div className="colorGrid">{colors.map(([key,name])=><button key={key} className={profile.profile_accent===key?"selected":""} onClick={()=>update({profile_accent:key})}><span className={`swatch ${key}`}></span><b>{name}</b></button>)}</div><div className={`headerDemo header-${profile.profile_accent}`}><strong>{profile.display_name}</strong><span>Public profile header preview</span></div></section>}
  </div></main>;
}
