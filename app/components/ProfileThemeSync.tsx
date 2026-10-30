"use client";
import {useEffect} from "react";
import {createClient} from "../../utils/supabase/client";

const aliases:Record<string,string>={"rose-gold":"ruby","silver-dust":"titanium","carbon-fiber":"obsidian"};
const themes:Record<string,{base:string;accent:string;secondary:string;surface:string;edge:string;tint:string}>={
 emerald:{base:"#052b22",accent:"#22bd83",secondary:"#d9bd70",surface:"#073c30",edge:"#54d5a3",tint:"rgba(3,27,21,.3)"},
 sapphire:{base:"#06182f",accent:"#398fff",secondary:"#cbdcff",surface:"#10294b",edge:"#73b6ff",tint:"rgba(2,14,39,.45)"},
 ruby:{base:"#310b15",accent:"#ed3652",secondary:"#f7bd75",surface:"#4a1422",edge:"#ff6983",tint:"rgba(42,5,14,.46)"},
 amethyst:{base:"#270b39",accent:"#c85cf5",secondary:"#ff9ed9",surface:"#39134e",edge:"#e9a0ff",tint:"rgba(30,5,48,.43)"},
 titanium:{base:"#111419",accent:"#b6c3d1",secondary:"#e1e7ef",surface:"#222932",edge:"#cbd5e1",tint:"rgba(5,8,14,.52)"},
 obsidian:{base:"#0b0b0c",accent:"#e2b75e",secondary:"#ffdb8b",surface:"#1c1914",edge:"#e6bc65",tint:"rgba(0,0,0,.62)"}
};
const fallback="emerald";
function applyTheme(value:unknown){
 const requested=typeof value==="string"?value:fallback;
 const theme=themes[aliases[requested]||requested]?aliases[requested]||requested:fallback;
 const t=themes[theme];const root=document.documentElement;
 root.dataset.muslimTheme=theme;
 root.style.setProperty("--theme-base",t.base);root.style.setProperty("--theme-accent",t.accent);root.style.setProperty("--theme-secondary",t.secondary);root.style.setProperty("--theme-surface",t.surface);root.style.setProperty("--theme-edge",t.edge);
 root.style.setProperty("--profile-scene-tint",t.tint);
 try{localStorage.setItem("1muslim:profile-background",theme)}catch{}
 if(theme==="obsidian"||theme==="titanium"){try{localStorage.setItem("1muslim-theme-mode","night");localStorage.setItem("1muslim-theme","dark")}catch{};root.classList.remove("light")}
}
export default function ProfileThemeSync(){
 useEffect(()=>{
  let active=true;
  try{applyTheme(localStorage.getItem("1muslim:profile-background")||fallback)}catch{applyTheme(fallback)}
  const db=createClient();
  const refresh=async()=>{
   const {data:{user}}=await db.auth.getUser();
   if(!active)return;
   if(!user){return}
   const {data}=await db.from("profiles").select("avatar_config").eq("id",user.id).maybeSingle();
   if(active)applyTheme((data?.avatar_config as {profileColorTheme?:string}|null)?.profileColorTheme||fallback);
  };
  void refresh();
  const {data:{subscription}}=db.auth.onAuthStateChange(()=>{void refresh()});
  const onChange=(event:Event)=>{const theme=(event as CustomEvent<string>).detail;if(typeof theme==="string")applyTheme(theme);else void refresh()};
  window.addEventListener("1muslim:profile-theme-changed",onChange);
  return()=>{active=false;subscription.unsubscribe();window.removeEventListener("1muslim:profile-theme-changed",onChange)};
 },[]);
 return null;
}
