"use client";
import {useEffect} from "react";
import {createClient} from "../../utils/supabase/client";

const allowed=new Set(["emerald","rose-gold","silver-dust","carbon-fiber"]);
const fallback="emerald";
const themeColors:Record<string,[string,string,string,string]>={
 emerald:["#167454","#c8a95d","#0b4434","#ffffff"],
 "rose-gold":["#bd7e84","#f1c6ac","#713c51","#ffffff"],
 "silver-dust":["#8ca4b8","#e0e9f2","#354b5e","#ffffff"],
 "carbon-fiber":["#505e69","#aebac5","#1b232a","#ffffff"]
};
function applyTheme(value:unknown){
 const theme=typeof value==="string"&&allowed.has(value)?value:fallback;
 const [accent,highlight,surface,foreground]=themeColors[theme];
 const root=document.documentElement;
 root.style.setProperty("--profile-theme-accent",accent);
 root.style.setProperty("--profile-theme-highlight",highlight);
 root.style.setProperty("--profile-theme-surface",surface);
 root.style.setProperty("--profile-theme-foreground",foreground);
 root.dataset.profileBackground=theme;
 document.documentElement.style.setProperty("--profile-scene-image",`url("/assets/profile-backgrounds/${theme}.PNG")`);
 document.documentElement.style.setProperty("--profile-scene-tint",theme==="carbon-fiber"?"rgba(2,5,9,.44)":theme==="silver-dust"?"rgba(21,28,35,.26)":theme==="rose-gold"?"rgba(40,13,28,.29)":"rgba(3,27,21,.3)");
 try{localStorage.setItem("1muslim:profile-background",theme)}catch{}
 if(theme==="carbon-fiber"){try{localStorage.setItem("1muslim-theme-mode","night");localStorage.setItem("1muslim-theme","dark")}catch{};document.documentElement.classList.remove("light")}
}
export default function ProfileThemeSync(){
 useEffect(()=>{
  let active=true;
  try{applyTheme(localStorage.getItem("1muslim:profile-background")||fallback)}catch{applyTheme(fallback)}
  const db=createClient();
  const refresh=async()=>{
   const {data:{user}}=await db.auth.getUser();
   if(!active)return;
   if(!user){applyTheme(fallback);return}
   const {data}=await db.from("profiles").select("avatar_config").eq("id",user.id).maybeSingle();
   if(active)applyTheme((data?.avatar_config as {profileBackgroundTheme?:string}|null)?.profileBackgroundTheme||fallback);
  };
  void refresh();
  const {data:{subscription}}=db.auth.onAuthStateChange(()=>{void refresh()});
  const onChange=(event:Event)=>{const theme=(event as CustomEvent<string>).detail;if(typeof theme==="string")applyTheme(theme);else void refresh()};
  window.addEventListener("1muslim:profile-background-changed",onChange);
  return()=>{active=false;subscription.unsubscribe();window.removeEventListener("1muslim:profile-background-changed",onChange)};
 },[]);
 return null;
}
