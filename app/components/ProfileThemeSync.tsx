"use client";
import {useEffect} from "react";
import {createClient} from "../../utils/supabase/client";

const allowed=new Set(["emerald","rose-gold","silver-dust","carbon-fiber"]);
const fallback="emerald";
const siteThemes=new Set(["emerald","sapphire","ruby","amethyst","titanium","obsidian"]);
function applySiteTheme(value:unknown){
 const theme=typeof value==="string"&&siteThemes.has(value)?value:"emerald";
 document.documentElement.dataset.siteTheme=theme;
 try{localStorage.setItem("1muslim:site-theme",theme)}catch{}
}
function applyTheme(value:unknown){
 const theme=typeof value==="string"&&allowed.has(value)?value:fallback;
 document.documentElement.dataset.profileBackground=theme;
 document.documentElement.style.setProperty("--profile-scene-image",`url("/assets/profile-backgrounds/${theme}.PNG")`);
 document.documentElement.style.setProperty("--profile-scene-tint",theme==="carbon-fiber"?"rgba(2,5,9,.44)":theme==="silver-dust"?"rgba(21,28,35,.26)":theme==="rose-gold"?"rgba(40,13,28,.29)":"rgba(3,27,21,.3)");
 try{localStorage.setItem("1muslim:profile-background",theme)}catch{}
 if(theme==="carbon-fiber"){try{localStorage.setItem("1muslim-theme-mode","night");localStorage.setItem("1muslim-theme","dark")}catch{};document.documentElement.classList.remove("light")}
}
export default function ProfileThemeSync(){
 useEffect(()=>{
  let active=true;
  try{applySiteTheme(localStorage.getItem("1muslim:site-theme"))}catch{applySiteTheme("emerald")}
  try{applyTheme(localStorage.getItem("1muslim:profile-background")||fallback)}catch{applyTheme(fallback)}
  const db=createClient();
  const refresh=async()=>{
   const {data:{user}}=await db.auth.getUser();
   if(!active)return;
   if(!user){applyTheme(fallback);return}
   const {data}=await db.from("profiles").select("avatar_config").eq("id",user.id).maybeSingle();
   if(active){
    const config=data?.avatar_config as {profileBackgroundTheme?:string;siteTheme?:string}|null;
    applyTheme(config?.profileBackgroundTheme||fallback);
    applySiteTheme(config?.siteTheme||localStorage.getItem("1muslim:site-theme")||"emerald");
   }
  };
  void refresh();
  const {data:{subscription}}=db.auth.onAuthStateChange(()=>{void refresh()});
  const onChange=(event:Event)=>{const theme=(event as CustomEvent<string>).detail;if(typeof theme==="string")applyTheme(theme);else void refresh()};
  const onSiteChange=(event:Event)=>applySiteTheme((event as CustomEvent<string>).detail);
  window.addEventListener("1muslim:site-theme-changed",onSiteChange);
  window.addEventListener("1muslim:profile-background-changed",onChange);
  return()=>{active=false;subscription.unsubscribe();window.removeEventListener("1muslim:profile-background-changed",onChange);window.removeEventListener("1muslim:site-theme-changed",onSiteChange)};
 },[]);
 return null;
}
