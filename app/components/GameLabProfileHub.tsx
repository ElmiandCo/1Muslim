"use client";
import {useState,type ReactNode} from "react";
import Link from "next/link";
import {CanvasUmmaGallery} from "./CanvasUmmaGallery";

const tabs=["1Umma","My Profile","Avatars","Background","Badges","Settings"] as const;
type Tab=typeof tabs[number];
export default function GameLabProfileHub({active,profile}:{active:boolean;profile?:ReactNode}){
 const [tab,setTab]=useState<Tab>("1Umma");
 return <section aria-label="Profile workspace" style={{height:"100%",width:"100%",maxWidth:"100%",boxSizing:"border-box",minWidth:0,minHeight:0,display:"flex",flexDirection:"column",color:"#f7f0da",background:"transparent",backdropFilter:"none",borderRadius:0,overflow:"hidden"}}>
  <header style={{padding:"8px 10px 5px",minWidth:0,flexShrink:0}}>
   <h2 style={{fontSize:16,margin:"0 0 6px",color:"#e8cb83"}}>✦ Your 1Muslim Profile</h2>
   <div role="tablist" aria-label="Profile sections" style={{display:"flex",gap:5,overflowX:"auto",maxWidth:"100%",scrollbarWidth:"none",paddingBottom:4,overscrollBehaviorX:"contain"}}>
    {tabs.map(name=><button key={name} role="tab" type="button" aria-selected={tab===name} onClick={()=>setTab(name)} style={{flex:"0 0 auto",minHeight:38,padding:"6px 10px",fontSize:12,whiteSpace:"nowrap",borderRadius:0,border:"none",borderBottom:tab===name?"2px solid #e8cb83":"2px solid transparent",background:"transparent",color:"#fff3d4",fontWeight:tab===name?700:500}}>{name}</button>)}
   </div>
  </header>
  <div role="tabpanel" aria-label={tab} style={{position:"relative",flex:1,minHeight:0,minWidth:0,width:"100%",maxWidth:"100%",boxSizing:"border-box",overflow:"auto",overscrollBehavior:"contain",padding:tab==="1Umma"?0:8}}>
   {tab==="1Umma"?<CanvasUmmaGallery active={active}/>:tab==="My Profile"?profile??<p>Sign in to see your profile.</p>:<div style={{maxWidth:720,margin:"auto",padding:"8px 4px",border:"none",borderRadius:18,background:"transparent",backdropFilter:"blur(10px)"}}>
    <h3 style={{fontSize:22,color:"#ebd393",margin:"0 0 12px"}}>{tab}</h3>
    <p style={{lineHeight:1.6,margin:"0 0 18px"}}>{tab==="Avatars"?"Choose and manage your profile avatar.":tab==="Background"?"Customize the look of your profile.":tab==="Badges"?"View the badges you have earned.":"Manage your account and profile preferences."}</p>
    <Link href="/profile" style={{display:"inline-flex",alignItems:"center",minHeight:44,padding:"10px 18px",borderRadius:12,color:"#0b3029",background:"#ebd393",fontWeight:700}}>Open profile {tab} ↗</Link>
    <p style={{fontSize:12,opacity:.8,marginTop:12}}>Opens your existing profile tools; changes are saved there.</p>
   </div>}
  </div>
 </section>
}
