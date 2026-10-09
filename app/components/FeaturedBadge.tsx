"use client";
import {useEffect,useState} from "react";
import {createClient} from "../../utils/supabase/client";
import "./featured-badge.css";
type Badge={badge_key:string;earned_at:string};
const catalog:Record<string,{name:string;image?:string;icon:string;description:string}>={
 shahada:{name:"Shahadah Certified",image:"/assets/badges/shahada-badge.png",icon:"✦",description:"Completed Shahadah verification"},
 dua:{name:"Dua Badge",image:"/assets/badges/dua-badge.PNG",icon:"🤲",description:"Completed the Dua badge requirements"},
 live:{name:"Live Badge",icon:"🔴",description:"Certified live creator"},
 steward:{name:"Community Steward",icon:"🛡️",description:"Approved community steward"},
 guardian:{name:"Trust Guardian",icon:"⚖️",description:"Approved trust guardian"}
};
export default function FeaturedBadge({userId,verifiedAt,editable=false,compact=false}:{userId:string;verifiedAt?:string|null;editable?:boolean;compact?:boolean}){
 const [earned,setEarned]=useState<Badge[]>([]),[selected,setSelected]=useState<string|null>(null),[manual,setManual]=useState(false),[open,setOpen]=useState(false),[saving,setSaving]=useState(false),[notice,setNotice]=useState("");
 useEffect(()=>{let active=true;(async()=>{const s=createClient();const [a,b]=await Promise.all([s.from("member_badges").select("badge_key,earned_at").eq("user_id",userId).order("earned_at",{ascending:false}),s.from("profiles").select("featured_badge_key").eq("id",userId).maybeSingle()]);if(!active)return;const rows=(a.data??[]) as Badge[];if(verifiedAt&&!rows.some(x=>x.badge_key==="shahada"))rows.push({badge_key:"shahada",earned_at:verifiedAt});rows.sort((x,y)=>Date.parse(y.earned_at)-Date.parse(x.earned_at));setEarned(rows);const key=(b.data as {featured_badge_key?:string|null}|null)?.featured_badge_key??null;setManual(!!key);setSelected(key&&rows.some(x=>x.badge_key===key)?key:rows[0]?.badge_key??null)})().catch(()=>{});return()=>{active=false}},[userId,verifiedAt]);
 const badge=selected?catalog[selected]:null;
 const choose=async(key:string|null)=>{if(saving)return;setSaving(true);setNotice("");const s=createClient();const {error}=await s.rpc("set_featured_badge",{chosen_badge:key});if(error)setNotice("Could not save badge: "+error.message);else{setManual(!!key);setSelected(key??earned[0]?.badge_key??null);setOpen(false);setNotice("Badge updated ✨")}setSaving(false)};
 if(!badge&&!editable)return null;
 return <div className={"featuredBadgeArea"+(compact?" featuredBadgeCompact":"")}>
 {badge?<button type="button" className="featuredBadgeChip" title={badge.description} onClick={()=>setOpen(v=>!v)} aria-expanded={open}><span className="featuredBadgeArt">{badge.image?<img src={badge.image} alt=""/>:badge.icon}</span><span><small>FEATURED BADGE</small><strong>{badge.name}</strong></span><span aria-hidden="true">✧</span></button>:<span className="featuredBadgeEmpty">No earned badges yet</span>}
 {editable&&<button className="featuredBadgeEdit" type="button" onClick={()=>setOpen(v=>!v)}>✦ Choose displayed badge</button>}
 {open&&<div className="featuredBadgePopover"><strong>{editable?"Choose your featured badge":"Achievement"}</strong><p>{badge?.description??"Earn your first badge to feature it here."}</p>{editable&&<><div className="featuredBadgeOptions">{earned.map(x=><button key={x.badge_key} type="button" disabled={saving} className={selected===x.badge_key?"chosen":""} onClick={()=>void choose(x.badge_key)}>{catalog[x.badge_key]?.name??x.badge_key} {selected===x.badge_key?"✓":""}</button>)}</div><button type="button" disabled={saving} onClick={()=>void choose(null)}>Auto: newest earned badge {manual?"↻":"✓"}</button></>}{notice&&<small role="status">{notice}</small>}</div>}
 </div>
}
