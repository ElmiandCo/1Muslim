"use client";
import {useEffect,useState} from "react";
type Probe={label:string;found:boolean;size:string;display:string;visibility:string;opacity:string;position:string;z:string;clipped:string};
export default function LiveLayoutProbe(){
 const [rows,setRows]=useState<Probe[]>([]);
 useEffect(()=>{
  const measure=()=>{
   const selectors:[string,string][]=[["Stage","[data-live-mount-proof]"],["Top","[data-live-mount-proof] .oneMuslimLiveTop"],["Player","[data-live-mount-proof] .oneMuslimLiveVideo"],["Comments","[data-live-mount-proof] .oneMuslimLiveBottom"],["Main","[data-live-mount-proof]"]]; 
   setRows(selectors.map(([label,selector])=>{
    const el=document.querySelector(selector) as HTMLElement|null;
    if(!el)return {label,found:false,size:"—",display:"—",visibility:"—",opacity:"—",position:"—",z:"—",clipped:"—"};
    const rect=el.getBoundingClientRect(),style=getComputedStyle(el);
    let clipped="no",parent=el.parentElement;
    while(parent&&parent!==document.body){
     const p=parent.getBoundingClientRect(),ps=getComputedStyle(parent);
     if(/hidden|clip/.test(ps.overflow+ps.overflowY+ps.overflowX)&&(rect.bottom<p.top||rect.top>p.bottom||rect.right<p.left||rect.left>p.right)){clipped=parent.className?.toString().slice(0,30)||parent.tagName;break;}
     parent=parent.parentElement;
    }
    return {label,found:true,size:Math.round(rect.width)+"×"+Math.round(rect.height)+" @"+Math.round(rect.top),display:style.display,visibility:style.visibility,opacity:style.opacity,position:style.position,z:style.zIndex,clipped};
   }));
  };
  measure();const timer=setInterval(measure,1200);return()=>clearInterval(timer);
 },[]);
 return <div data-live-layout-probe="v2" style={{position:"fixed",top:85,left:8,right:8,zIndex:2147483647,background:"rgba(0,28,23,.96)",color:"#fff",border:"2px solid #ffcc55",borderRadius:12,padding:"10px",font:"12px/1.5 monospace",pointerEvents:"none",maxHeight:"38vh",overflow:"auto"}}>
 <strong style={{color:"#ffe084"}}>LIVE LAYOUT DIAGNOSTIC · v2</strong>
 {rows.map(row=><div key={row.label} style={{borderTop:"1px solid #426a58",paddingTop:3}}><b>{row.label}:</b> {row.found?row.size:"NOT MOUNTED"} {row.found&&<span>display={row.display} visibility={row.visibility} opacity={row.opacity} pos={row.position} z={row.z} clipped={row.clipped}</span>}</div>)}
 </div>;
}
