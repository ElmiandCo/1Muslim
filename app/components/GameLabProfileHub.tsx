"use client";
import {useState} from "react";
import Link from "next/link";
import {CanvasUmmaGallery} from "./CanvasUmmaGallery";

const tabs=["1Umma Profile Gallery","Avatars","Background","Badges","Settings"] as const;
type Tab=typeof tabs[number];
export default function GameLabProfileHub({active}:{active:boolean}){
 const [tab,setTab]=useState<Tab>("1Umma Profile Gallery");
 return <section aria-label="Profile workspace" style={{height:"100%",minHeight:0,display:"flex",flexDirection:"column",color:"#f7f0da",background:"linear-gradient(155deg,rgba(5,30,28,.92),rgba(7,44,40,.8))",borderRadius:18,overflow:"hidden"}}>
  <header style={{padding:"12px 14px 8px",flexShrink:0}}>
   <h2 style={{fontSize:18,margin:"0 0 9px",color:"#e8cb83"}}>✦ Your 1Muslim Profile</h2>
   <div role="tablist" aria-label="Profile sections" style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:5}}>
    {tabs.map(name=><button key={name} role="tab" type="button" aria-selected={tab===name} onClick={()=>setTab(name)} style={{flex:"0 0 auto",minHeight:44,padding:"8px 12px",borderRadius:13,border:"1px solid rgba(223,190,108,.45)",background:tab===name?"rgba(22,119,88,.85)":"rgba(8,42,39,.65)",color:"#fff3d4",fontWeight:tab===name?700:500}}>{name}</button>)}
   </div>
  </header>
  <div role="tabpanel" aria-label={tab} style={{position:"relative",flex:1,minHeight:0,overflow:"auto",padding:tab==="1Umma Profile Gallery"?0:18}}>
   {tab==="1Umma Profile Gallery"?<CanvasUmmaGallery active={active}/>:<div style={{maxWidth:720,margin:"auto",padding:"clamp(12px,3vw,28px)",border:"1px solid rgba(225,199,128,.3)",borderRadius:18,background:"rgba(255,255,255,.055)",backdropFilter:"blur(10px)"}}>
    <h3 style={{fontSize:22,color:"#ebd393",margin:"0 0 12px"}}>{tab}</h3>
    <p style={{lineHeight:1.6,margin:"0 0 18px"}}>{tab==="Avatars"?"Choose and manage your profile avatar.":tab==="Background"?"Customize the look of your profile.":tab==="Badges"?"View the badges you have earned.":"Manage your account and profile preferences."}</p>
    <Link href="/profile" style={{display:"inline-flex",alignItems:"center",minHeight:44,padding:"10px 18px",borderRadius:12,color:"#0b3029",background:"#ebd393",fontWeight:700}}>Open profile {tab} ↗</Link>
    <p style={{fontSize:12,opacity:.8,marginTop:12}}>Opens your existing profile tools; changes are saved there.</p>
   </div>}
  </div>
 </section>
}
