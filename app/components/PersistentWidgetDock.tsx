"use client";
import {useState} from "react";
import DhikrStudio from "../widget-tools/[tool]/DhikrStudio";
import Link from "next/link";
const tools=[{label:"📿 Dhikr",href:"/widget-tools/dhikr"},{label:"☪ Prayer",href:"/widget-tools/prayer"},{label:"✧ Progress",href:"/widget-tools/progress"},{label:"♧ Alerts",href:"/widget-tools/notifications"}];
export default function PersistentWidgetDock(){
 const [open,setOpen]=useState(false);const [studio,setStudio]=useState(false);
 return <aside aria-label="Quick widgets" style={{position:"fixed",right:14,bottom:"calc(env(safe-area-inset-bottom, 0px) + 88px)",zIndex:90,display:"grid",justifyItems:"end",gap:8,pointerEvents:"none"}}>
 {studio&&<section role="dialog" aria-label="Persistent Dhikr Studio" style={{width:"min(360px,calc(100vw - 28px))",maxHeight:"min(70dvh,580px)",overflow:"auto",border:"1px solid #d8c38988",borderRadius:18,padding:14,background:"#12392ff5",color:"#f3e8ca",boxShadow:"0 16px 45px #0009",pointerEvents:"auto"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><strong>📿 Dhikr · Anywhere</strong><button type="button" onClick={()=>setStudio(false)} aria-label="Minimize Dhikr" style={{background:"transparent",border:0,color:"#f3e8ca",fontSize:22}}>−</button></div><DhikrStudio/></section>}
 {open&&<nav aria-label="Widget shortcuts" style={{display:"grid",gap:6,padding:9,border:"1px solid #d8c38988",borderRadius:15,background:"#12392fee",boxShadow:"0 8px 28px #0008",pointerEvents:"auto"}}><button type="button" onClick={()=>{setStudio(true);setOpen(false)}} style={{padding:"9px 13px",textAlign:"left",background:"#ffffff15",border:0,borderRadius:9,color:"#f4e6c0"}}>📿 Open floating Dhikr</button>{tools.map(t=><Link key={t.href} href={t.href} onClick={()=>setOpen(false)} style={{color:"#f4e6c0",textDecoration:"none",padding:"9px 13px",borderRadius:10,fontSize:13}}>{t.label}</Link>)}</nav>}
 <button type="button" onClick={()=>setOpen(v=>!v)} aria-expanded={open} aria-label={open?"Close widget shortcuts":"Open widget shortcuts"} style={{pointerEvents:"auto",width:40,height:40,borderRadius:20,border:"1px solid #d8c389",background:"radial-gradient(circle at 30% 25%,#32674e,#102e26)",color:"#f4db9b",boxShadow:"0 3px 16px #0008",fontSize:18,cursor:"pointer"}}>{open?"×":"✧"}</button></aside>;
}
