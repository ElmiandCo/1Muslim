"use client";
import { useEffect, useRef, useState } from "react";
import ExpressiveText from "./ExpressiveText";

type Entry = { label: string; insert: string; meaning?: string };
const packs: Record<string, Entry[]> = {
  "Reactions": [
    {label:"🔥 Fire",insert:"🔥"},{label:"💚 Love",insert:"💚"},{label:"😂 Laugh",insert:"😂"},{label:"🤲 Ameen",insert:"🤲 آمين"},
    {label:"✨ SubhanAllah",insert:"✨ سُبْحَانَ ٱللَّٰهِ"},{label:"🥹 Touched",insert:"🥹"},{label:"💯 Facts",insert:"💯"},{label:"🌙 Ramadan",insert:"🌙"}
  ],
  "Muslim phrases": [
    {label:"As-salamu alaykum",insert:"السلام عليكم",meaning:"Peace be upon you"},
    {label:"Wa alaykum as-salam",insert:"وعليكم السلام",meaning:"And peace be upon you"},
    {label:"Mashallah",insert:"ما شاء الله 💚",meaning:"What Allah has willed"},
    {label:"Alhamdulillah",insert:"الحمد لله 🤲",meaning:"Praise be to Allah"},
    {label:"SubhanAllah",insert:"سبحان الله ✨",meaning:"Glory be to Allah"},
    {label:"InshaAllah",insert:"إن شاء الله",meaning:"If Allah wills"},
    {label:"Allahu Akbar",insert:"الله أكبر",meaning:"Allah is greatest"},
    {label:"JazakAllahu khayran",insert:"جزاك الله خيرًا",meaning:"May Allah reward you with good"},
    {label:"Ameen",insert:"آمين 🤲",meaning:"Amen"},
    {label:"Astaghfirullah",insert:"أستغفر الله",meaning:"I seek Allah's forgiveness"}
  ],
  "Somali vibes": [
    {label:"Walaal",insert:"Walaal 💚",meaning:"Brother / sister"},
    {label:"Masha Allah",insert:"Masha Allah! ✨"},
    {label:"Alxamdulillaah",insert:"Alxamdulillaah 🤲"},
    {label:"Insha Allah",insert:"Insha Allah 🌙"},
    {label:"Hambalyo!",insert:"Hambalyo! 🎉",meaning:"Congratulations"},
    {label:"Aamiin",insert:"Aamiin 🤲"},
    {label:"Nabad",insert:"Nabad 🕊️",meaning:"Peace"}
  ],
  "HudHud vibes": [
    {label:"🐦🔥 HudHud approves",insert:"🐦🔥 HudHud approves!"},
    {label:"🐦👀 I'm listening",insert:"🐦👀 I'm listening…"},
    {label:"🐦💚 Mashallah",insert:"🐦💚 MASHALLAH!"},
    {label:"🐦🤲 Ameen",insert:"🐦🤲 AMEEN!"},
    {label:"🐦🏆 You did it",insert:"🐦🏆 YOU DID IT!"},
    {label:"🐦😂 Wallahi",insert:"🐦😂 Wallahi!"},
    {label:"🌙⏰ Suhoor mode",insert:"🌙⏰ Suhoor mode activated"},
    {label:"🍽️🌙 Iftar countdown",insert:"🍽️🌙 Iftar countdown"}
  ]
};
export default function ExpressionKeyboard({onInsert}:{onInsert:(text:string)=>void}) {
  const [open,setOpen]=useState(false);
  const [tab,setTab]=useState("Reactions");
  const [query,setQuery]=useState("");
  const root=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(!open)return;const esc=(e:KeyboardEvent)=>{if(e.key==="Escape")setOpen(false)};const outside=(e:PointerEvent)=>{if(root.current&&!root.current.contains(e.target as Node))setOpen(false)};document.addEventListener("keydown",esc);document.addEventListener("pointerdown",outside);return()=>{document.removeEventListener("keydown",esc);document.removeEventListener("pointerdown",outside)}},[open]);
  const entries=packs[tab].filter(x=>(x.label+" "+(x.meaning??"")).toLowerCase().includes(query.toLowerCase()));
  return <div ref={root} style={{position:"relative",alignSelf:"center"}}>
    <button type="button" onClick={()=>setOpen(x=>!x)} aria-expanded={open} aria-label="Open 1Muslim expressions" title="1Muslim Expressions" style={{padding:"8px 11px",borderRadius:12,border:"1px solid #b99c5577",background:"#152017",color:"#e9d5a2",fontWeight:750,whiteSpace:"nowrap"}}>🐦 ✨</button>
    {open&&<div role="dialog" aria-label="1Muslim expression keyboard" style={{position:"absolute",bottom:"calc(100% + 8px)",left:0,zIndex:70,width:"min(340px,calc(100vw - 36px))",maxHeight:390,overflowY:"auto",background:"#0d1711",color:"#f5f3e8",border:"1px solid #b99c55",borderRadius:18,padding:12,boxShadow:"0 16px 45px #0009"}}>
      <div style={{fontWeight:850,marginBottom:8}}>🐦 1Muslim Expressions</div>
      <div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:7}}>{Object.keys(packs).map(t=><button type="button" key={t} onClick={()=>{setTab(t);setQuery("")}} aria-pressed={tab===t} style={{fontSize:11,whiteSpace:"nowrap",borderRadius:999,padding:"7px 9px",border:"1px solid #b99c5566",background:tab===t?"#b99c55":"transparent",color:tab===t?"#15120b":"#eee"}}>{t}</button>)}</div>
      <input aria-label="Search expressions" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search expressions…" style={{width:"100%",padding:9,marginBottom:9,borderRadius:9,border:"1px solid #b99c5566",background:"#09100c",color:"white"}}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:6}}>{entries.map(e=><button type="button" key={e.label} title={e.meaning} onClick={()=>{onInsert(e.insert);setOpen(false)}} style={{textAlign:"left",padding:10,borderRadius:10,border:"1px solid #b99c5533",background:"#18251b",color:"#f5f3e8",fontSize:12}}><strong><ExpressiveText text={e.label}/></strong>{e.meaning&&<small style={{display:"block",opacity:.7,marginTop:4}}>{e.meaning}</small>}</button>)}</div>
      {!entries.length&&<p style={{fontSize:12}}>No expressions found.</p>}
      <p style={{fontSize:10,opacity:.65,marginBottom:0}}>Tap an expression to add it to your message. Curated GIFs and illustrated stickers are coming next.</p>
    </div>}
  </div>;
}
