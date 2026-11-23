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
const fallback="none";
function applyTheme(value:unknown,persist=true){
 const requested=typeof value==="string"?value:fallback;
 const wallpaper=aliases[requested]||requested;
 const colorFamily:Record<string,string>={"emerald-mosaic":"emerald","sapphire-mosaic":"sapphire","golden-geometry":"ruby","silver-eclipse":"titanium","amethyst-mirage":"amethyst","ruby-red":"ruby","ruby-gold":"ruby"};
 const theme=wallpaper==="none"?"obsidian":colorFamily[wallpaper]|| (themes[wallpaper]?wallpaper:fallback);
 const t=themes[theme];const root=document.documentElement;
 root.dataset.profileBackground=wallpaper;root.dataset.muslimTheme=theme;
 root.style.setProperty("--theme-base",t.base);root.style.setProperty("--theme-accent",t.accent);root.style.setProperty("--theme-secondary",t.secondary);root.style.setProperty("--theme-surface",t.surface);root.style.setProperty("--theme-edge",t.edge);
 root.style.setProperty("--profile-scene-image",wallpaper==="none"?"none":`url("/assets/profile-backgrounds/${root.dataset.guestHome==="true"&&wallpaper==="sapphire"?"sapphire-home":({ruby:"rose-gold",titanium:"silver-dust",obsidian:"carbon-fiber"} as Record<string,string>)[wallpaper]||wallpaper}.PNG")`);
 root.style.setProperty("--profile-scene-tint",t.tint);
 if(persist){try{localStorage.setItem("1muslim:profile-background",wallpaper)}catch{}}
}
/** Apply saved theme tokens without painting the old blue/purple full-screen
 * recognition animation. That layer was the six-dot interstitial seen on EVERY tab.
 */
export default function ProfileThemeSync(){
 useEffect(()=>{
  let active=true;
  const db=createClient();
  // Reuse previously resolved preference immediately while the authenticated
  // profile preference is fetched, but NEVER show a blocking theme overlay.
  let previous="none";
  try{previous=localStorage.getItem("1muslim:profile-background")||"none"}catch{}
  applyTheme(previous,false);
  const refresh=async()=>{
   try{
    const {data:{user}}=await db.auth.getUser();
    if(!active)return;
    if(!user){
     document.documentElement.dataset.guestHome="true";
     applyTheme("none",false);
     return;
    }
    delete document.documentElement.dataset.guestHome;
    const {data}=await db.from("profiles").select("avatar_config").eq("id",user.id).maybeSingle();
    if(!active)return;
    applyTheme((data?.avatar_config as {profileBackgroundTheme?:string}|null)?.profileBackgroundTheme||"none");
   }catch{if(active)applyTheme(previous,false)}
  };
  void refresh();
  const {data:{subscription}}=db.auth.onAuthStateChange(event=>{
   if(event==="SIGNED_OUT"||event==="SIGNED_IN"||event==="USER_UPDATED")void refresh();
  });
  const onChange=(event:Event)=>{
   const theme=(event as CustomEvent<string>).detail;
   if(typeof theme==="string")applyTheme(theme);
   else void refresh();
  };
  window.addEventListener("1muslim:profile-background-changed",onChange);
  return()=>{active=false;subscription.unsubscribe();window.removeEventListener("1muslim:profile-background-changed",onChange)};
 },[]);
 return null;
}
