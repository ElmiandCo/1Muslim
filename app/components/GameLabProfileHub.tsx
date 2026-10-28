"use client";
import {useEffect,useRef,useState,type ReactNode} from "react";
import Link from "next/link";
import {CanvasUmmaGallery} from "./CanvasUmmaGallery";

const tabs=["1Umma","My Profile"] as const;
type Tab=typeof tabs[number];
export default function GameLabProfileHub({active,profile,renderProfileSection}:{active:boolean;profile?:ReactNode;renderProfileSection?:(section:"Avatars"|"Background"|"Badges"|"Settings")=>ReactNode}){
 const [tab,setTab]=useState<Tab>("1Umma"); const [settingsOpen,setSettingsOpen]=useState(false);
 const mirrorRef=useRef<HTMLDivElement>(null);
 return <section aria-label="Profile workspace" style={{height:"100%",maxHeight:"100%",minHeight:0,width:"100%",minWidth:0,display:"flex",flexDirection:"column",boxSizing:"border-box",color:"#f7f0da",background:"transparent",overflow:"hidden"}}>
  <div style={{flex:"1 1 auto",height:"100%",minHeight:0,width:"100%",boxSizing:"border-box",display:"flex",flexDirection:"column",overflow:"hidden",background:"rgba(8,48,39,.52)",backdropFilter:"blur(12px)",border:"1px solid rgba(225,194,119,.25)",borderRadius:20,padding:"10px 8px 22px"}}>
   <div style={{position:"relative",flexShrink:0,zIndex:5,background:"rgba(8,48,39,.92)",backdropFilter:"blur(12px)",borderRadius:14,padding:"6px 8px 8px",marginBottom:8}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}><h2 style={{fontSize:16,margin:0,color:"#e8cb83"}}>✦ Your 1Muslim Profile</h2><button type="button" onClick={()=>{setTab("My Profile");setSettingsOpen(v=>!v)}} style={{border:"1px solid #bda76b",borderRadius:99,background:"#174b3d",color:"#f5df9c",padding:"7px 10px",fontSize:12}}>⚙ Settings</button></div>
    <div role="tablist" aria-label="Profile sections" style={{display:"flex",gap:10,marginTop:7}}>
     {tabs.map(name=><button key={name} role="tab" type="button" aria-selected={tab===name} onClick={()=>{setTab(name);setSettingsOpen(false)}} style={{minHeight:38,padding:"6px 10px",fontSize:12,border:0,borderBottom:tab===name?"2px solid #e8cb83":"2px solid transparent",background:"transparent",color:"#fff3d4",fontWeight:tab===name?700:500}}>{name}</button>)}
    </div>

   </div>
   <div style={{position:"relative",flex:"1 1 auto",minHeight:0,display:"flex"}}>
   <div ref={mirrorRef} role="tabpanel" aria-label={tab} className="canvas-umma-vertical-gallery" data-profile-mirror-scroll style={{flex:"1 1 auto",height:"100%",minHeight:0,maxHeight:"100%",width:"100%",boxSizing:"border-box",overflowY:"auto",overflowX:"hidden",touchAction:"pan-y",WebkitOverflowScrolling:"touch",background:"rgba(230,255,245,.07)",border:"1px solid rgba(230,255,245,.18)",borderRadius:14,padding:"8px 8px 30px",overscrollBehaviorY:"contain"}}>
    {tab==="1Umma"?<CanvasUmmaGallery active={active} embedded/>:settingsOpen&&renderProfileSection?renderProfileSection("Settings"):<div style={{display:"flex",flexDirection:"column",gap:0}}><div style={{flex:"0 0 auto",position:"relative"}}>{profile??<p>Sign in to see your profile.</p>}</div></div>}
   </div>

   </div>
  </div>
 </section>
}
