"use client";

import Link from "next/link";
import {useEffect,useRef,useState} from "react";
import {createClient} from "../../utils/supabase/client";
import "./settings-control-center.css";

type ProfileSummary={
 display_name:string|null;username:string|null;avatar_config:Record<string,unknown>|null;
 profile_background_image_url:string|null;profile_accent:string|null;avatar_gender:string|null;
 shahada_verified_at:string|null;
};
type Section={name:string;detail:string;id?:string;href?:string;symbol:string};
const EDIT_SECTIONS:Section[]=[
 {name:"Identity",detail:"Name, ID, bio and location",href:"/profile?edit=profile",symbol:"✎"},
 {name:"Avatars",detail:"Upload or equip your avatar",href:"/profile?edit=avatar",symbol:"◉"},
 {name:"Appearance",detail:"Cover, colors and preview",href:"/profile?edit=header",symbol:"◇"},
 {name:"Connections",detail:"TikTok and other integrations",href:"/profile?edit=live",symbol:"◎"},
 {name:"Verification",detail:"Your private Shahada vault",href:"/profile?edit=shahada",symbol:"✓"},
 {name:"Analytics",detail:"Profile and Qur’an insights",href:"/profile?edit=analytics",symbol:"▤"}
];
const APP_SECTIONS:Section[]=[
 {name:"HudHud AI",detail:"Conversations, memory and voice",id:"hudhud-ai",symbol:"✧"},
 {name:"Social connections",detail:"Existing social account tools",id:"social-connections",symbol:"⊙"},
 {name:"Theme & appearance",detail:"Day, night, and DeepWatch",id:"appearance-settings",symbol:"◐"},
 {name:"Location & prayer",detail:"Prayer times and Adhan",id:"location-preferences",symbol:"⌖"},
 {name:"Notifications",detail:"Messages, calls and live",id:"notifications",symbol:"◈"},
 {name:"Language & effects",detail:"HudHud Vision, sounds and Arabic",id:"language-effects",symbol:"ع"},
 {name:"Privacy & account",detail:"Deactivate or delete your account",id:"account-controls",symbol:"⛨"}
];
function safeMedia(value:unknown):string|null{
 if(typeof value!=="string"||value.length>2000)return null;
 if(value.startsWith("/")&&!value.startsWith("//"))return value;
 try{const url=new URL(value);return url.protocol==="https:"?url.href:null}
 catch{return null}
}
export default function SettingsControlDrawer(){
 const [open,setOpen]=useState(true);
 useEffect(()=>{if(window.location.hash)setOpen(false)},[]);
 const [profile,setProfile]=useState<ProfileSummary|null>(null);
 const [authenticated,setAuthenticated]=useState<boolean|null>(null);
 const drawer=useRef<HTMLElement|null>(null);
 const opener=useRef<HTMLButtonElement|null>(null);
 useEffect(()=>{
  let active=true;
  const client=createClient();
  void client.auth.getUser().then(async({data:{user}})=>{
   if(!active)return;
   setAuthenticated(Boolean(user));
   if(!user)return;
   const {data}=await client.from("profiles")
    .select("display_name,username,avatar_config,profile_background_image_url,profile_accent,avatar_gender,shahada_verified_at")
    .eq("id",user.id).maybeSingle();
   if(active&&data)setProfile(data as ProfileSummary);
  }).catch(()=>{if(active)setAuthenticated(false)});
  return()=>{active=false};
 },[]);
 useEffect(()=>{
  if(!open)return;
  const onKey=(event:KeyboardEvent)=>{
   if(event.key==="Escape"){setOpen(false);opener.current?.focus();return}
   if(event.key!=="Tab")return;
   const focusable=Array.from(drawer.current?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled])')||[]);
   if(!focusable.length)return;
   if(event.shiftKey&&document.activeElement===focusable[0]){event.preventDefault();focusable[focusable.length-1].focus()}
   else if(!event.shiftKey&&document.activeElement===focusable[focusable.length-1]){event.preventDefault();focusable[0].focus()}
  };
  window.addEventListener("keydown",onKey);
  // Keep focus inside the visible slide-out, including on iOS keyboard access.
  const timer=window.setTimeout(()=>drawer.current?.querySelector<HTMLButtonElement>(".scDismiss")?.focus(),80);
  return()=>{window.clearTimeout(timer);window.removeEventListener("keydown",onKey)};
 },[open]);
 const cover=safeMedia(profile?.avatar_config?.profileCoverUrl)||safeMedia(profile?.profile_background_image_url);
 const avatar=safeMedia(profile?.avatar_config?.selectedAvatarUrl)||
  (profile?.avatar_gender==="female"?"/assets/avatars/Default-women.png":"/assets/avatars/default-male.jpg");
 const name=profile?.display_name?.trim()||"Your 1Muslim profile";
 const username=profile?.username?.trim();
 const navigate=(id:string)=>{
  setOpen(false);
  window.setTimeout(()=>document.getElementById(id)?.scrollIntoView({
   behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth",block:"start"
  }),100);
 };
 const renderItem=(section:Section)=>{
  const body=<><span className="scItemMark" aria-hidden="true">{section.symbol}</span><span><strong>{section.name}</strong><small>{section.detail}</small></span><span className="scItemArrow" aria-hidden="true">›</span></>;
  return section.href?
    <Link key={section.name} href={section.href} className="scMenuItem" onClick={()=>setOpen(false)}>{body}</Link>:
    <button key={section.name} type="button" className="scMenuItem" onClick={()=>navigate(section.id||"hudhud-ai")}>{body}</button>;
 };
 return <>
  <div className="scBar">
   <button ref={opener} className="scOpenMenu" type="button" onClick={()=>setOpen(true)} aria-haspopup="dialog" aria-expanded={open} aria-controls="scSidePanel">
    <span aria-hidden="true">☰</span> Settings & HudHud
   </button>
   <Link href="/search" className="scReturn">Search home ↗</Link>
  </div>
  {open&&<div className="scOverlay" onPointerDown={event=>{if(event.target===event.currentTarget)setOpen(false)}}>
   <aside id="scSidePanel" ref={drawer} className="scSlideDrawer" role="dialog" aria-modal="true" aria-label="1Muslim Settings and HudHud Control Center">
    <div className="scPanelTop"><span>1Muslim.Live <small>SETTINGS</small></span><button type="button" className="scDismiss" aria-label="Close settings sidebar" onClick={()=>{setOpen(false);opener.current?.focus()}}>×</button></div>
    <div className="scPanelScroll">
     <section className="scProfileCard" aria-label="Your current profile preview">
      <div className="scCover" style={cover?{backgroundImage:`linear-gradient(180deg,#08111344,#050809d9),url("${cover}")`}:undefined}>
       <span>PROFILE PREVIEW</span>
      </div>
      <div className="scIdentity"><img className="scAvatar" src={avatar} alt="Your profile avatar" loading="lazy"/>
       <div><strong>{authenticated===false?"Sign in to customize":name}</strong><small>{username?"@"+username:profile?.shahada_verified_at?"Shahada verified":"Your account, your settings"}</small></div>
      </div>
      <div className="scProfileActions"><Link href="/profile" onClick={()=>setOpen(false)}>View profile</Link><Link href="/profile?edit=profile" onClick={()=>setOpen(false)}>Edit profile ↗</Link></div>
     </section>
     <p className="scNavHeading">HUDHUD</p>
     {renderItem(APP_SECTIONS[0])}
     <p className="scNavHeading">PROFILE</p>
     {EDIT_SECTIONS.map(renderItem)}
     <p className="scNavHeading">APP & PRIVACY</p>
     {APP_SECTIONS.slice(1).map(renderItem)}
     <p className="scPanelNote">Your existing profile editor, Shahada vault, and social connections stay intact. Nothing is published or changed by opening this menu.</p>
    </div>
   </aside>
  </div>}
 </>;
}
