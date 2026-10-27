"use client";
import {useRef,useState,type ReactNode} from "react";
import Link from "next/link";
import {CanvasUmmaGallery} from "./CanvasUmmaGallery";
import ProfileVideos from "./ProfileVideos";

const tabs=["1Umma","My Profile"] as const;
type Tab=typeof tabs[number];
export default function GameLabProfileHub({active,profile,renderProfileSection}:{active:boolean;profile?:ReactNode;renderProfileSection?:(section:"Avatars"|"Background"|"Badges"|"Settings")=>ReactNode}){
 const [tab,setTab]=useState<Tab>("1Umma"); const [settingsOpen,setSettingsOpen]=useState(false);
 const [profilePage,setProfilePage]=useState(1); const mirrorRef=useRef<HTMLDivElement>(null); const touchStart=useRef<{x:number;y:number}|null>(null);
 const goProfilePage=(page:number)=>{const el=mirrorRef.current;if(!el)return;const max=Math.max(0,el.scrollHeight-el.clientHeight);el.scrollTo({top:max*(page-1)/2,behavior:"smooth"});setProfilePage(page)};
 return <section aria-label="Profile workspace" style={{height:"100%",maxHeight:"100%",minHeight:0,width:"100%",minWidth:0,display:"flex",flexDirection:"column",boxSizing:"border-box",color:"#f7f0da",background:"transparent",overflow:"hidden"}}>
  <div style={{flex:"1 1 auto",height:"100%",minHeight:0,width:"100%",boxSizing:"border-box",display:"flex",flexDirection:"column",overflow:"hidden",background:"rgba(8,48,39,.52)",backdropFilter:"blur(12px)",border:"1px solid rgba(225,194,119,.25)",borderRadius:20,padding:"10px 8px 22px"}}>
   <div style={{position:"relative",flexShrink:0,zIndex:5,background:"rgba(8,48,39,.92)",backdropFilter:"blur(12px)",borderRadius:14,padding:"6px 8px 8px",marginBottom:8}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}><h2 style={{fontSize:16,margin:0,color:"#e8cb83"}}>✦ Your 1Muslim Profile</h2><button type="button" onClick={()=>{setTab("My Profile");setSettingsOpen(v=>!v)}} style={{border:"1px solid #bda76b",borderRadius:99,background:"#174b3d",color:"#f5df9c",padding:"7px 10px",fontSize:12}}>⚙ Settings</button></div>
    <div role="tablist" aria-label="Profile sections" style={{display:"flex",gap:10,marginTop:7}}>
     {tabs.map(name=><button key={name} role="tab" type="button" aria-selected={tab===name} onClick={()=>{setTab(name);setSettingsOpen(false);setProfilePage(1)}} style={{minHeight:38,padding:"6px 10px",fontSize:12,border:0,borderBottom:tab===name?"2px solid #e8cb83":"2px solid transparent",background:"transparent",color:"#fff3d4",fontWeight:tab===name?700:500}}>{name}</button>)}
    </div>
    {tab==="My Profile"&&!settingsOpen&&<nav aria-label="Profile section navigation" style={{display:"flex",justifyContent:"center",gap:12,marginTop:6,paddingBottom:4}}>{[1,2,3].map(page=><button key={page} type="button" aria-label={`Go to Profile section ${page}`} aria-pressed={profilePage===page} onClick={()=>goProfilePage(page)} style={{minWidth:58,minHeight:36,borderRadius:20,border:"1px solid rgba(225,194,119,.6)",background:profilePage===page?"rgba(225,194,119,.26)":"rgba(8,48,39,.8)",color:"#f7e4b2",fontSize:13,fontWeight:700}}>{page===1?"↑ 1":`↓ ${page}`}</button>)}</nav>}
   </div>
   <div ref={mirrorRef} onTouchStart={e=>{if(tab==="My Profile")touchStart.current={x:e.touches[0].clientX,y:e.touches[0].clientY}}} onTouchEnd={e=>{if(tab!=="My Profile"||!touchStart.current)return;const t=e.changedTouches[0];if(Math.hypot(t.clientX-touchStart.current.x,t.clientY-touchStart.current.y)>45)goProfilePage(1);touchStart.current=null}} role="tabpanel" aria-label={tab} className="canvas-umma-vertical-gallery" data-profile-mirror-scroll style={{flex:"1 1 auto",height:"calc(100dvh - 300px)",minHeight:"min(55dvh, 560px)",maxHeight:"calc(100dvh - 240px)",width:"100%",boxSizing:"border-box",overflowY:"auto",overflowX:"hidden",touchAction:"pan-y",WebkitOverflowScrolling:"touch",background:"rgba(230,255,245,.07)",border:"1px solid rgba(230,255,245,.18)",borderRadius:14,padding:"8px 8px 30px"}}>
    {tab==="1Umma"?<CanvasUmmaGallery active={active} embedded/>:settingsOpen&&renderProfileSection?renderProfileSection("Settings"):<>{profile??<p>Sign in to see your profile.</p>}<ProfileVideos/></>}
   </div>
  </div>
 </section>
}
