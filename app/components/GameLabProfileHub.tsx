"use client";
import {useState,type ReactNode} from "react";
import Link from "next/link";
import {CanvasUmmaGallery} from "./CanvasUmmaGallery";

const tabs=["1Umma","My Profile"] as const;
type Tab=typeof tabs[number];
export default function GameLabProfileHub({active,profile,renderProfileSection}:{active:boolean;profile?:ReactNode;renderProfileSection?:(section:"Avatars"|"Background"|"Badges"|"Settings")=>ReactNode}){
 const [tab,setTab]=useState<Tab>("1Umma");
 return <section aria-label="Profile workspace" style={{height:"100%",maxHeight:"100%",width:"100%",maxWidth:"100%",boxSizing:"border-box",minWidth:0,minHeight:0,display:"flex",flexDirection:"column",color:"#f7f0da",background:"transparent",backdropFilter:"none",borderRadius:0,overflow:"hidden"}}>
  <header style={{padding:"8px 10px 5px",minWidth:0,flexShrink:0,position:"relative"}}>
   <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:6}}><h2 style={{fontSize:16,margin:0,color:"#e8cb83"}}>✦ Your 1Muslim Profile</h2><button type="button" aria-label="Open profile settings" onClick={()=>setTab("My Profile")} style={{flexShrink:0,border:"1px solid #bda76b",borderRadius:99,background:"#174b3d",color:"#f5df9c",padding:"7px 10px",fontSize:12}}>⚙ Settings</button></div>
   <div role="tablist" aria-label="Profile sections" style={{display:"flex",gap:5,overflowX:"auto",maxWidth:"100%",scrollbarWidth:"none",paddingBottom:4,overscrollBehaviorX:"contain"}}>
    {tabs.map(name=><button key={name} role="tab" type="button" aria-selected={tab===name} onClick={()=>setTab(name)} style={{flex:"0 0 auto",minHeight:38,padding:"6px 10px",fontSize:12,whiteSpace:"nowrap",borderRadius:0,border:"none",borderBottom:tab===name?"2px solid #e8cb83":"2px solid transparent",background:"transparent",color:"#fff3d4",fontWeight:tab===name?700:500}}>{name}</button>)}
   </div>
  </header>
  <div role="tabpanel" aria-label={tab} style={{position:"relative",flex:1,minHeight:0,minWidth:0,width:"100%",maxWidth:"100%",boxSizing:"border-box",overflowY:"auto",overflowX:"hidden",touchAction:"pan-y",WebkitOverflowScrolling:"touch",overscrollBehaviorY:"contain",padding:tab==="1Umma"?0:8}}>
   {tab==="1Umma"?<CanvasUmmaGallery active={active}/>:tab==="My Profile"?profile??<p>Sign in to see your profile.</p>:renderProfileSection?renderProfileSection("Settings"):<p>Sign in to manage your profile.</p>}
  </div>
 </section>
}
