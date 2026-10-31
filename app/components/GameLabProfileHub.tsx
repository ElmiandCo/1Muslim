"use client";
import {useRef,useState,type ReactNode} from "react";
import Link from "next/link";
import {CanvasUmmaGallery} from "./CanvasUmmaGallery";

const tabs=["The Umma","My Profile"] as const;
type Tab=typeof tabs[number];
export default function GameLabProfileHub({active,profile,avatarHero,renderProfileSection}:{active:boolean;profile?:ReactNode;avatarHero?:ReactNode;renderProfileSection?:(section:"Avatars"|"Background"|"Badges"|"Settings")=>ReactNode}){
 const [tab,setTab]=useState<Tab>("The Umma"); const [settingsOpen,setSettingsOpen]=useState(false);
 const mirrorRef=useRef<HTMLDivElement>(null);
 return <section aria-label="Profile workspace" style={{height:"100%",maxHeight:"100%",minHeight:0,width:"100%",minWidth:0,display:"flex",flexDirection:"column",boxSizing:"border-box",color:"#f7f0da",background:"transparent",overflow:"visible",position:"relative"}}>
  <div style={{flex:"1 1 auto",height:"100%",minHeight:0,width:"100%",boxSizing:"border-box",display:"flex",flexDirection:"column",overflow:"visible",background:"color-mix(in srgb,var(--theme-base,#101114) 16%,transparent)",backdropFilter:"blur(12px)",border:"1px solid color-mix(in srgb,var(--theme-secondary,#d8c38e) 25%,transparent)",borderRadius:20,padding:"10px 8px 12px"}}>
   <div style={{position:"absolute",top:48,left:0,right:"auto",flexShrink:0,zIndex:30,display:"flex",alignItems:"center",flexDirection:"column",gap:6,background:"color-mix(in srgb,var(--theme-base,#101114) 70%,transparent)",backdropFilter:"blur(12px)",borderRadius:"0 12px 12px 0",padding:"6px 3px",marginBottom:0,border:"1px solid color-mix(in srgb,var(--theme-secondary,#d8c38e) 55%,transparent)"}}>
    <button type="button" aria-label="Profile settings" title="Settings" aria-pressed={settingsOpen} onClick={()=>{setTab("My Profile");setSettingsOpen(v=>!v)}} style={{border:0,borderRadius:8,background:"transparent",color:"#f5df9c",padding:"5px 7px",fontSize:16,lineHeight:1,cursor:"pointer"}}>⚙</button>
    <div role="tablist" aria-label="Profile sections" style={{display:"flex",flexDirection:"column",alignItems:"stretch",gap:6,minWidth:0}}>
     {tabs.map(name=><button key={name} role="tab" type="button" aria-selected={tab===name&&!settingsOpen} onClick={()=>{setTab(name);setSettingsOpen(false);}} style={{minHeight:76,width:29,padding:"7px 3px",fontSize:10,writingMode:"vertical-rl",textOrientation:"mixed",border:0,borderLeft:tab===name&&!settingsOpen?"3px solid var(--theme-secondary,#e8cb83)":"3px solid transparent",background:"transparent",color:"var(--theme-foreground,#fff3d4)",fontWeight:tab===name&&!settingsOpen?700:500,cursor:"pointer"}}>{name}</button>)}
    </div>
   </div>
   <div className="profile-shared-stage" style={{position:"relative",flex:"1 1 auto",minHeight:0,display:"flex"}}>
   <div className="profile-shared-avatar-overlay">{avatarHero}</div>
   <div ref={mirrorRef} role="tabpanel" aria-label={tab} className="canvas-umma-vertical-gallery profile-with-shared-avatar" data-profile-mirror-scroll style={{flex:"1 1 auto",height:"100%",minHeight:0,maxHeight:"100%",width:"100%",boxSizing:"border-box",overflowY:"auto",overflowX:"hidden",touchAction:"pan-y",WebkitOverflowScrolling:"touch",background:"color-mix(in srgb,var(--theme-base,#101114) 7%,transparent)",border:"1px solid color-mix(in srgb,var(--theme-secondary,#d8c38e) 20%,transparent)",borderRadius:14,padding:"16px 0 30px 34px",overscrollBehaviorY:"contain"}}>
    {tab==="The Umma"?<CanvasUmmaGallery active={active} embedded/>:settingsOpen&&renderProfileSection?renderProfileSection("Settings"):<div className="profile-scroll-content-expanded" style={{display:"flex",flexDirection:"column",gap:0}}><div style={{flex:"0 0 auto",position:"relative"}}>{profile??<p>Sign in to see your profile.</p>}</div><footer aria-label="End of Profile section" style={{flexShrink:0,marginTop:30,padding:"0 0 16px",textAlign:"center",fontSize:12,letterSpacing:".12em",opacity:.75,pointerEvents:"none"}}>— 1Muslim —</footer></div>}
   </div>

   </div>
  </div>
 </section>
}
