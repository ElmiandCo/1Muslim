"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {createClient} from "../../utils/supabase/client";

type Format="desktop"|"phone"|"audio";
const formats:{id:Format;label:string;detail:string;href:string;icon:string}[]=[
 {id:"desktop",label:"Desktop",detail:"Landscape livestreams",href:"/streaming?format=desktop",icon:"▣"},
 {id:"phone",label:"Phone",detail:"Portrait livestreams",href:"/streaming?format=phone",icon:"◉"},
 {id:"audio",label:"Audio only",detail:"Live listening rooms",href:"/audio-rooms",icon:"◌"}
];

export default function QuickConnect({onFormatChange}:{onFormatChange?:(format:Format)=>void}){
 const [active,setActive]=useState<Format>("desktop"),[counts,setCounts]=useState<Record<Format,number>>({desktop:0,phone:0,audio:0});
 useEffect(()=>{let alive=true;const db=createClient();const load=async()=>{const [desktop,phone,audio]=await Promise.all([
   db.from("live_streams").select("id",{count:"exact",head:true}).eq("status","live").eq("visibility","public").eq("aspect_ratio","16:9"),
   db.from("live_streams").select("id",{count:"exact",head:true}).eq("status","live").eq("visibility","public").eq("aspect_ratio","9:16"),
   fetch("/api/public-group-meetings",{cache:"no-store"}).then(async response=>response.ok?(await response.json()).meetings||[]:[]).catch(()=>[])
  ]);if(alive)setCounts({desktop:desktop.count||0,phone:phone.count||0,audio:Array.isArray(audio)?audio.filter((room:{mode?:string})=>room.mode==="audio").length:0})};void load();const channel=db.channel("home-live-format-counts").on("postgres_changes",{event:"*",schema:"public",table:"live_streams"},()=>{void load()}).subscribe();const timer=window.setInterval(()=>void load(),15000);return()=>{alive=false;window.clearInterval(timer);void db.removeChannel(channel)}},[]);
 const index=formats.findIndex(format=>format.id===active),current=formats[index];
 const choose=(format:Format)=>{setActive(format);onFormatChange?.(format)};
 const move=(direction:number)=>choose(formats[(index+direction+formats.length)%formats.length].id);
 return <section className="liveFormatRail" aria-label="Livestream format"><button type="button" onClick={()=>move(-1)} aria-label="Previous livestream format">‹</button><button type="button" className="liveFormatCurrent" onClick={()=>choose(current.id)}><span aria-hidden="true">{current.icon}</span><b>{current.label}</b><small>{counts[current.id]?`${counts[current.id]} live now`:current.detail}</small></button><button type="button" onClick={()=>move(1)} aria-label="Next livestream format">›</button><div className="liveFormatDots" role="tablist" aria-label="Livestream formats">{formats.map(format=><button key={format.id} type="button" role="tab" aria-selected={active===format.id} onClick={()=>choose(format.id)}>{format.label}</button>)}</div><style jsx>{`.liveFormatRail{display:grid;grid-template-columns:34px minmax(0,1fr) 34px;gap:7px;align-items:center;margin:10px 0;padding:8px;border:1px solid #e5c77855;border-radius:16px;background:#07251ddd;color:#f7edd2}.liveFormatCurrent{display:grid;grid-template-columns:auto 1fr;align-items:center;column-gap:8px;min-width:0;border:0;background:transparent;color:inherit;text-align:left;cursor:pointer}.liveFormatCurrent>span{grid-row:1/3;color:#e6c779;font-size:20px}.liveFormatRail b{font-size:12px}.liveFormatRail small{font-size:10px;color:#c4d7cb;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.liveFormatRail>button:not(.liveFormatCurrent){height:34px;border:1px solid #e5c77855;border-radius:10px;background:#ffffff0d;color:#f6e4b4;font-size:22px;cursor:pointer}.liveFormatDots{grid-column:1/-1;display:flex;gap:5px;justify-content:center}.liveFormatDots button{border:0;background:transparent;color:#9fbbac;font-size:9px;cursor:pointer;padding:2px 7px;border-radius:999px}.liveFormatDots button[aria-selected=true]{background:#e6c779;color:#11281e;font-weight:800}@media(prefers-reduced-motion:reduce){.liveFormatRail *{transition:none!important}}`}</style></section>;
}
