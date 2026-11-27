"use client";
import {useEffect,useRef,useState,type TouchEvent} from "react";
import {createPortal} from "react-dom";
import dynamic from "next/dynamic";
import {usePathname} from "next/navigation";
import {createClient} from "../../utils/supabase/client";
import SettingsHudHudCenter from "../settings/SettingsHudHudCenter";
import {SettingsEmbedContext} from "./SettingsEmbedContext";
import "../settings/settings-control-center.css";
import "./global-settings-canvas.css";

const ProfileEditor=dynamic(()=>import("../profile/page"),{ssr:false,loading:()=> <p className="gscLoading">Preparing your existing profile controls…</p>});
const AppSettings=dynamic(()=>import("../settings/SettingsContent"),{ssr:false,loading:()=> <p className="gscLoading">Preparing your app controls…</p>});
type ProfileTab="profile"|"avatar"|"header"|"live"|"shahada"|"analytics";
type Panel="home"|"hudhud"|"profile"|"avatar"|"header"|"live"|"shahada"|"analytics"|"app";
type ProfileSummary={display_name:string|null;username:string|null;avatar_gender:string|null;gender:string|null;avatar_config:Record<string,unknown>|null;profile_background_image_url:string|null;shahada_verified_at:string|null};
type OpenSettingsEvent=CustomEvent<{section?:Panel|string}>;
const editorTabs=["profile","avatar","header","live","shahada","analytics"] as const;
const editorLabels:Record<ProfileTab,string>={profile:"Identity",avatar:"Avatars",header:"Appearance",live:"Connections",shahada:"Verification",analytics:"Analytics"};
const tabs:{id:Panel;title:string;subtitle:string;icon:string}[]=[
 {id:"profile",title:"Identity",subtitle:"Name, Muslim ID & bio",icon:"✎"},
 {id:"avatar",title:"Avatars",subtitle:"Choose or upload",icon:"◉"},
 {id:"header",title:"Appearance",subtitle:"Cover & colors",icon:"◇"},
 {id:"live",title:"Connections",subtitle:"Connected accounts",icon:"◎"},
 {id:"shahada",title:"Verification",subtitle:"Private Shahada vault",icon:"✓"},
 {id:"analytics",title:"Analytics",subtitle:"Your insights & progress",icon:"▤"},
 {id:"hudhud",title:"HudHud AI",subtitle:"Memory, conversations & voice",icon:"✧"},
 {id:"app",title:"App preferences",subtitle:"Prayer, theme, location, alerts & privacy",icon:"⌘"}
];
function trustedImage(value:unknown):string|null{
 if(typeof value!=="string"||value.length>1900)return null;
 if(value.startsWith("/")&&!value.startsWith("//"))return value;
 try{const uri=new URL(value);return uri.protocol==="https:"?uri.href:null}catch{return null}
}
export default function GlobalSettingsCanvas(){
 const pathname=usePathname();
 const [mounted,setMounted]=useState(false);
 const [open,setOpen]=useState(false);
 const [panel,setPanel]=useState<Panel>("home");
 const [appFocus,setAppFocus]=useState("");
 const [profile,setProfile]=useState<ProfileSummary|null>(null);
 const [signedIn,setSignedIn]=useState(false);
 const [night,setNight]=useState(false);
 const shell=useRef<HTMLElement|null>(null);
 const scroll=useRef<HTMLDivElement|null>(null);
 const opener=useRef<HTMLElement|null>(null);
 const grab=useRef<number|null>(null);
 useEffect(()=>{
  setMounted(true);
  const refresh=()=>{try{setNight(localStorage.getItem("1muslim-theme-mode")==="night")}catch{}};
  refresh();window.addEventListener("1muslim:appearance-updated",refresh);
  window.addEventListener("1muslim:theme-changed",refresh);
  return()=>{window.removeEventListener("1muslim:appearance-updated",refresh);window.removeEventListener("1muslim:theme-changed",refresh)};
 },[]);
 useEffect(()=>{
  let active=true;
  const client=createClient();
  const load=async()=>{
   try{
    const {data:{user}}=await client.auth.getUser();
    if(!active){return}
    setSignedIn(Boolean(user));
    if(!user){setProfile(null);return}
    const {data}=await client.from("profiles").select("display_name,username,avatar_gender,gender,avatar_config,profile_background_image_url,shahada_verified_at").eq("id",user.id).maybeSingle();
    if(active)setProfile(data as ProfileSummary|null);
   }catch{if(active)setProfile(null)}
  };
  const handler=()=>void load();
  void load();
  window.addEventListener("1muslim:profile-saved",handler);
  window.addEventListener("1muslim:profile-cover-changed",handler);
  return()=>{active=false;window.removeEventListener("1muslim:profile-saved",handler);window.removeEventListener("1muslim:profile-cover-changed",handler)};
 },[open]);
 useEffect(()=>{
  // Bring legacy Settings and profile-editor deep links into the same overlay.
  // Other app navigation remains untouched.
  const onLink=(event:MouseEvent)=>{
   if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
   const element=event.target;
   if(!(element instanceof Element))return;
   const anchor=element.closest<HTMLAnchorElement>("a[href]");
   if(!anchor||anchor.target==="_blank"||anchor.hasAttribute("download"))return;
   let destination:URL;
   try{destination=new URL(anchor.href,window.location.origin)}catch{return}
   if(destination.origin!==window.location.origin)return;
   const path=destination.pathname.replace(/\\/$/,"");
   if(path==="/settings"){
    event.preventDefault();event.stopPropagation();
    const hash=destination.hash.slice(1);
    const section=hash==="hudhud-ai"?"hudhud":hash||"home";
    window.dispatchEvent(new CustomEvent("1muslim:open-settings",{detail:{section}}));
    return;
   }
   if(path==="/profile"&&destination.searchParams.has("edit")){
    const tab=destination.searchParams.get("edit");
    if(!tab||!["profile","avatar","header","live","shahada","analytics"].includes(tab))return;
    event.preventDefault();event.stopPropagation();
    window.dispatchEvent(new CustomEvent("1muslim:open-settings",{detail:{section:tab}}));
   }
  };
  document.addEventListener("click",onLink,true);
  return()=>document.removeEventListener("click",onLink,true);
 },[]);
 useEffect(()=>{
  const available=new Set<Panel>(["home","hudhud","profile","avatar","header","live","shahada","analytics","app"]);
  const openHandler=(event:Event)=>{
   const target=(event as OpenSettingsEvent).detail?.section;
   if(typeof target==="string"){
    if(available.has(target as Panel)){setPanel(target as Panel);setAppFocus("")}
    else{setPanel("app");setAppFocus(target)}
   }else setPanel("home");
   opener.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
   setOpen(true);
  };
  const closeHandler=()=>setOpen(false);
  window.addEventListener("1muslim:open-settings",openHandler);
  window.addEventListener("1muslim:close-settings",closeHandler);
  if(window.location.search.includes("settings=1")){
   setOpen(true);setPanel("home");
   const url=new URL(window.location.href);url.searchParams.delete("settings");
   window.history.replaceState(window.history.state,"",url.pathname+url.search+url.hash);
  }
  return()=>{window.removeEventListener("1muslim:open-settings",openHandler);window.removeEventListener("1muslim:close-settings",closeHandler)};
 },[pathname]);
 useEffect(()=>{
  if(!open)return;
  const priorOverflow=document.body.style.overflow;
  document.body.style.overflow="hidden";
  const focus=window.setTimeout(()=>shell.current?.querySelector<HTMLButtonElement>(".gscClose")?.focus(),80);
  const onKey=(event:KeyboardEvent)=>{
   if(event.key==="Escape"){event.preventDefault();setOpen(false);return}
   if(event.key!=="Tab")return;
   const focusable=Array.from(shell.current?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex="0"]')||[])
    .filter(el=>el.getClientRects().length>0&&getComputedStyle(el).visibility!=="hidden");
   if(!focusable.length)return;
   const first=focusable[0],last=focusable[focusable.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  };
  window.addEventListener("keydown",onKey);
  return()=>{window.clearTimeout(focus);document.body.style.overflow=priorOverflow;window.removeEventListener("keydown",onKey);opener.current?.focus()};
 },[open]);
 useEffect(()=>{scroll.current?.scrollTo({top:0,behavior:"instant"})},[panel]);
 useEffect(()=>{
  if(!open||panel!=="app"||!appFocus)return;
  const timer=window.setTimeout(()=>{
   const element=scroll.current?.querySelector<HTMLElement>("#"+CSS.escape(appFocus));
   element?.scrollIntoView({block:"start",behavior:"smooth"});
  },500);
  return()=>window.clearTimeout(timer);
 },[open,panel,appFocus]);
 if(!mounted||!open||pathname==="/auth"||pathname==="/onboarding")return null;
 const avatar=trustedImage(profile?.avatar_config?.selectedAvatarUrl)||trustedImage(profile?.avatar_config?.adminAvatarUrl)||(profile?.gender==="female"||profile?.avatar_gender==="female"?"/assets/avatars/Default-women.png":"/assets/avatars/default-male.jpg");
 const cover=trustedImage(profile?.avatar_config?.profileCoverUrl)||trustedImage(profile?.profile_background_image_url);
 const displayName=profile?.display_name?.trim()||"Your 1Muslim profile";
 const handle=profile?.username?"@"+profile.username:"1Muslim Member";
 const onOpenTab=(next:Panel)=>{
  setPanel(next);setAppFocus("");
  scroll.current?.scrollTo({top:0,behavior:"instant"});
 };
 const heading=panel==="home"?"Control Center":panel==="hudhud"?"HudHud AI":panel==="app"?"App preferences":editorLabels[panel as ProfileTab];
 return createPortal(<div className="gscBackdrop" role="presentation" onPointerDown={event=>{if(event.target===event.currentTarget)setOpen(false)}}>
  <section className={"gscSheet"+(night?" gscNight":"")} ref={shell} role="dialog" aria-modal="true" aria-label="1Muslim account settings and AI control center">
   <div className="gscGrab" onTouchStart={(event:TouchEvent<HTMLDivElement>)=>{grab.current=event.touches[0]?.clientY||null}} onTouchEnd={(event:TouchEvent<HTMLDivElement>)=>{const begin=grab.current;grab.current=null;const endY=event.changedTouches[0]?.clientY;if(begin!==null&&typeof endY==="number"&&endY-begin>65)setOpen(false)}}><span aria-hidden="true"/></div>
   <header className="gscHeader">
    <button className="gscBack" type="button" aria-label={panel==="home"?"Close settings":"Return to settings sections"} onClick={()=>panel==="home"?setOpen(false):onOpenTab("home")}>{panel==="home"?"✦":"‹"}</button>
    <div><small>1MUSLIM.LIVE</small><h2>{heading}</h2></div>
    <button type="button" className="gscClose" aria-label="Close settings" onClick={()=>setOpen(false)}>×</button>
   </header>
   <div className="gscScroll" ref={scroll}>
    {panel==="home"&&<>
     <div className="gscPreview" aria-label="Live profile preview">
      <div className="gscCover" style={cover?{backgroundImage:'linear-gradient(180deg,#080f1640,#06090de8),url("'+cover+'")'}:undefined}/>
      <div className="gscPreviewIdentity"><img src={avatar} alt="Your profile avatar" className="gscAvatar"/><div><strong>{signedIn?displayName:"Sign in to customize"}</strong><small>{signedIn?handle:"1Muslim.Live"}</small></div>
       {profile?.shahada_verified_at&&<span className="gscVerified" title="Shahada verified">✓</span>}
      </div>
     </div>
     <p className="gscIntro">Everything in one place. Select a setting and edit it here—without navigating to another page.</p>
     <div className="gscGrid">{tabs.map(item=><button type="button" className="gscTile" key={item.id} onClick={()=>onOpenTab(item.id)}>
      <span className="gscIcon" aria-hidden="true">{item.icon}</span><span><strong>{item.title}</strong><small>{item.subtitle}</small></span><span className="gscChevron" aria-hidden="true">›</span>
     </button>)}</div>
    </>}
    {panel==="hudhud"&&<div className="gscHudPanel"><SettingsHudHudCenter/></div>}
    {editorTabs.includes(panel as ProfileTab)&&<div className="gscInlineProfile" key="live-profile">
      <SettingsEmbedContext.Provider value={panel as ProfileTab}><ProfileEditor/></SettingsEmbedContext.Provider>
     </div>}
    {panel==="app"&&<div className="gscInlineSettings"><AppSettings embedded/></div>}
   </div>
   <footer className="gscFooter"><span aria-hidden="true">✧</span> Account settings · 1Muslim.Live</footer>
  </section>
 </div>,document.body);
}
