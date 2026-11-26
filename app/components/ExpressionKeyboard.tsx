"use client";
import { useEffect, useRef, useState } from "react";
import ExpressiveText from "./ExpressiveText";

type Entry = { label: string; insert: string; meaning?: string };
const packs: Record<string, Entry[]> = {
  "Muslim phrases": [
    {label:"As-salamu alaykum",insert:"السلام عليكم",meaning:"Peace be upon you"},
    {label:"Wa alaykum as-salam",insert:"وعليكم السلام",meaning:"And peace be upon you"},
    {label:"Mashallah",insert:"ما شاء الله 💚",meaning:"What Allah has willed"},
    {label:"Alhamdulillah",insert:"الحمد لله 🤲",meaning:"Praise be to Allah"},
    {label:"SubhanAllah",insert:"سبحان الله ✨",meaning:"Glory be to Allah"},
    {label:"InshaAllah",insert:"إن شاء الله",meaning:"If Allah wills"},
    {label:"Allahu Akbar",insert:"الله أكبر",meaning:"Allah is greatest"},
    {label:"JazakAllahu khayran",insert:"جزاك الله خيرًا",meaning:"May Allah reward you with good"},
    {label:"Allahumma Ameen",insert:"اللهم آمين 🤲",meaning:"O Allah, accept our supplication"},
    {label:"Astaghfirullah",insert:"أستغفر الله",meaning:"I seek Allah's forgiveness"}
  ],
  "Expressions": []
};
export default function ExpressionKeyboard({onInsert}:{onInsert:(text:string)=>void}) {
  const [open,setOpen]=useState(false);
  const [tab,setTab]=useState("Muslim phrases");
  const [query,setQuery]=useState("");
  const insert=(value:string)=>{onInsert(value);setOpen(false)};
  const root=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(!open)return;const esc=(e:KeyboardEvent)=>{if(e.key==="Escape")setOpen(false)};const outside=(e:PointerEvent)=>{if(root.current&&!root.current.contains(e.target as Node))setOpen(false)};document.addEventListener("keydown",esc);document.addEventListener("pointerdown",outside);return()=>{document.removeEventListener("keydown",esc);document.removeEventListener("pointerdown",outside)}},[open]);
  const entries=packs[tab].filter(x=>(x.label+" "+(x.meaning??"")).toLowerCase().includes(query.toLowerCase()));
  return <div ref={root} className="omExpressionRoot" style={{position:"relative",alignSelf:"center"}}>
    <button type="button" onClick={()=>setOpen(x=>!x)} aria-expanded={open} aria-label="Open 1Muslim expressions" title="1Muslim Expressions" className="omExpressionTrigger" style={{padding:"8px 11px",borderRadius:12,border:"1px solid #cde2d6",background:"#f0f8f3",color:"#22674b",fontWeight:750,whiteSpace:"nowrap"}}>☺</button>
    {open&&<div role="dialog" aria-modal="false" aria-label="1Muslim expressions" className="omExpressionPanel" style={{position:"fixed",bottom:"calc(88px + env(safe-area-inset-bottom, 0px))",left:"50%",transform:"translateX(-50%)",zIndex:999,width:"min(460px,calc(100vw - 24px))",height:"min(62dvh,520px)",display:"flex",flexDirection:"column",overflow:"hidden",background:"#fff",color:"#17372b",border:"1px solid #e1e9e4",borderRadius:24,padding:16,boxShadow:"0 20px 65px #0b2c2440"}}>
      <div aria-hidden="true" style={{height:4,width:38,borderRadius:999,background:"#d5e3da",margin:"-7px auto 12px",flexShrink:0}}/>
      <div className="omExpressionPanelTitle" style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,marginBottom:12}}>
        <div><strong style={{display:"block",fontSize:17,color:"#17372b"}}>1Muslim Expressions</strong><small style={{display:"block",marginTop:4,fontSize:12,color:"#698578"}}>Meaningful words, beautifully shared.</small></div>
        <button type="button" aria-label="Close expressions" onClick={()=>setOpen(false)} style={{flexShrink:0,width:34,height:34,borderRadius:999,border:"1px solid #dce9e2",background:"#f2f7f4",color:"#285d46"}}>✕</button>
      </div>
      <div role="tablist" aria-label="Expression categories" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,background:"#f2f6f3",padding:4,borderRadius:13,marginBottom:12}}>
        {Object.keys(packs).map(t=><button role="tab" type="button" key={t} onClick={()=>{setTab(t);setQuery("")}} aria-selected={tab===t} style={{fontSize:13,fontWeight:650,borderRadius:10,padding:"10px 8px",border:"none",background:tab===t?"#fff":"transparent",boxShadow:tab===t?"0 1px 5px #1c4d3220":"none",color:tab===t?"#176344":"#6b8074"}}>{t}</button>)}
      </div>
      {tab==="Muslim phrases"&&<input aria-label="Search Muslim phrases" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search Muslim phrases…" style={{width:"100%",padding:"11px 13px",marginBottom:12,borderRadius:12,border:"1px solid #dce7e0",background:"#f8faf9",color:"#1b3d2f",fontSize:14,outlineColor:"#4e9e77",flexShrink:0}}/>}
      <div style={{flex:"1 1 auto",minHeight:0,overflowY:"auto",overscrollBehavior:"contain",WebkitOverflowScrolling:"touch"}}>
        {entries.length>0?<div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:8}}>{entries.map(e=><button type="button" key={e.label} title={e.meaning} onClick={()=>insert(e.insert)} style={{textAlign:"left",padding:"12px 11px",borderRadius:13,border:"1px solid #e2ebe5",background:"#f5f9f6",color:"#1e6045",fontSize:13,minWidth:0}}><strong style={{display:"block",lineHeight:1.35,overflowWrap:"anywhere"}}><ExpressiveText text={e.label}/></strong>{e.meaning&&<small style={{display:"block",color:"#668a78",marginTop:5,lineHeight:1.3,fontSize:11}}>{e.meaning}</small>}</button>)}</div>:<p style={{fontSize:13,color:"#789084",padding:"30px 8px",textAlign:"center"}}>{tab==="Expressions"?"Expressions coming soon.":"No matching phrases."}</p>}
      </div>
    </div>}
  </div>;
}
