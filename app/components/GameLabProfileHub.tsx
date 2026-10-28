"use client";
import {useEffect,useRef,useState,type ReactNode} from "react";
import Link from "next/link";
import {CanvasUmmaGallery} from "./CanvasUmmaGallery";

const tabs=["The Umma","My Profile"] as const;
type Tab=typeof tabs[number];
export default function GameLabProfileHub({active,profile,renderProfileSection}:{active:boolean;profile?:ReactNode;renderProfileSection?:(section:"Avatars"|"Background"|"Badges"|"Settings")=>ReactNode}){
 const [tab,setTab]=useState<Tab>("The Umma"); const [settingsOpen,setSettingsOpen]=useState(false);
 const mirrorRef=useRef<HTMLDivElement>(null);
 return <section aria-label="Profile workspace" style={{height:"100%",maxHeight:"100%",minHeight:0,width:"100%",minWidth:0,display:"flex",flexDirection:"column",boxSizing:"border-box",color:"#f7f0da",background:"transparent",overflow:"visible",position:"relative"}}>
  <div style={{flex:"1 1 auto",height:"100%",minHeight:0,width:"100%",boxSizing:"border-box",display:"flex",flexDirection:"column",overflow:"visible",background:"rgba(8,48,39,.52)",backdropFilter:"blur(12px)",border:"1px solid rgba(225,194,119,.25)",borderRadius:20,padding:"10px 8px 12px"}}>
   <div style={{position:"absolute",top:-100,left:10,right:10,flexShrink:0,zIndex:30,display:"flex",alignItems:"center",gap:8,background:"transparent",backdropFilter:"blur(12px)",borderRadius:9,padding:"2px 5px",marginBottom:4}}>
    <button type="button" aria-label="Profile settings" title="Settings" aria-pressed={settingsOpen} onClick={()=>{setTab("My Profile");setSettingsOpen(v=>!v)}} style={{border:0,borderRadius:8,background:"transparent",color:"#f5df9c",padding:"5px 7px",fontSize:16,lineHeight:1,cursor:"pointer"}}>⚙</button>
    <div role="tablist" aria-label="Profile sections" style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}}>
     {tabs.map(name=><button key={name} role="tab" type="button" aria-selected={tab===name&&!settingsOpen} onClick={()=>{setTab(name);setSettingsOpen(false)}} style={{minHeight:26,padding:"2px 5px",fontSize:11,border:0,borderBottom:tab===name&&!settingsOpen?"2px solid #e8cb83":"2px solid rgba(232,203,131,.25)",background:"transparent",color:"#fff3d4",fontWeight:tab===name&&!settingsOpen?700:500,cursor:"pointer"}}>{name}</button>)}
    </div>
   </div>
   <div style={{position:"relative",flex:"1 1 auto",minHeight:0,display:"flex"}}>
   <div ref={mirrorRef} role="tabpanel" aria-label={tab} className="canvas-umma-vertical-gallery" data-profile-mirror-scroll style={{flex:"1 1 auto",height:"100%",minHeight:0,maxHeight:"100%",width:"100%",boxSizing:"border-box",overflowY:"auto",overflowX:"hidden",touchAction:"pan-y",WebkitOverflowScrolling:"touch",background:"rgba(230,255,245,.07)",border:"1px solid rgba(230,255,245,.18)",borderRadius:14,padding:"8px 8px 30px",overscrollBehaviorY:"contain"}}>
    {tab==="The Umma"?<CanvasUmmaGallery active={active} embedded/>:settingsOpen&&renderProfileSection?renderProfileSection("Settings"):<div style={{display:"flex",flexDirection:"column",gap:0}}><div style={{flex:"0 0 auto",position:"relative"}}>{profile??<p>Sign in to see your profile.</p>}</div></div>}
   </div>

   </div>
  </div>
 </section>
}
