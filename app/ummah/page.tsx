"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {createClient} from "../../utils/supabase/client";
import UmmahThreeRealm,{type RealmItem} from "./UmmahThreeRealm";
import "./world.css";
type Post={id:string;body:string;author_name:string;media_url?:string|null;media_type?:string|null;created_at?:string};
const dateOf=(v?:string)=>{const d=v?new Date(v):new Date();return Number.isNaN(d.getTime())?new Date().toISOString().slice(0,10):d.toISOString().slice(0,10)};
const cleanBody=(body:string)=>body.replace(/^\s*✦\s*DAILY\s+UMMAH\s*✦\s*/i,"").replace(/^\s*[•·]\s*DAILY\s+UMMAH\s*[•·]?\s*/i,"").trim();
const video=(p:Post)=>p.media_type?.startsWith("video/")||/\.(mp4|webm|mov)(\?|$)/i.test(p.media_url||"");
export default function UmmahWorld(){
 const [posts,setPosts]=useState<Post[]>([]),[avatar,setAvatar]=useState<string|null>(null),[name,setName]=useState("YOU"),[selected,setSelected]=useState<RealmItem|null>(null),[filter,setFilter]=useState<"all"|"post"|"photo"|"video">("all"),[day,setDay]=useState(dateOf()),[loading,setLoading]=useState(true),[error,setError]=useState("");
 useEffect(()=>{let active=true;const s=createClient();void(async()=>{try{const {data:{user}}=await s.auth.getUser();if(!user)return;const {data}=await s.from("profiles").select("display_name,avatar_config,avatar_gender").eq("id",user.id).maybeSingle();if(!active||!data)return;const config=(data.avatar_config||{}) as Record<string,unknown>;const url=[config.adminAvatarUrl,config.customAvatarUrl,config.selectedAvatarUrl,config.avatarUrl].find(v=>typeof v==="string"&&v.length>0);setAvatar(typeof url==="string"?url:data.avatar_gender==="female"?"/assets/avatars/Default-women.png":"/assets/avatars/default-male.jpg");setName(data.display_name||"YOU")}catch{}})();return()=>{active=false}},[]);
 useEffect(()=>{let active=true;const load=async()=>{try{const r=await fetch("/api/community-posts",{cache:"no-store"});if(!r.ok)throw Error("Community unavailable");const data=await r.json();if(active){setPosts((data.posts||[]).slice(0,100));setError("")}}catch(e){if(active)setError(e instanceof Error?e.message:"Posts unavailable")}finally{if(active)setLoading(false)}};void load();const timer=setInterval(()=>void load(),45000);return()=>{active=false;clearInterval(timer)}},[]);
 const days=useMemo(()=>Array.from(new Set([dateOf(),...posts.map(p=>dateOf(p.created_at))])).sort().reverse(),[posts]);
 const items=useMemo(():RealmItem[]=>posts.map(p=>({id:p.id,title:p.author_name||"Community",body:cleanBody(p.body||"")||"Community post",kind:video(p)?"video":p.media_url?"photo":"post",image:p.media_url,date:dateOf(p.created_at),href:"/community"})).filter(p=>p.date===day&&(filter==="all"||filter===p.kind)).slice(0,35),[posts,day,filter]);
 const changeDay=(step:number)=>{const i=days.indexOf(day),next=days[Math.max(0,Math.min(days.length-1,i+step))];if(next)setDay(next)};
 return <main className="realm"><header className="realm-hud"><Link href="/" className="realm-back" aria-label="Home">←</Link><div className="realm-brand"><strong>1M / UMMAH</strong><span>THE LIVING TIMELINE · WEBGL</span></div><Link href="/community" className="realm-feed">FEED ↗</Link></header>
 <div className="realm-controls"><div className="realm-days"><button type="button" onClick={()=>changeDay(1)} disabled={days.indexOf(day)===days.length-1} aria-label="Earlier day">‹</button><label>MEMORY <select value={day} onChange={e=>setDay(e.target.value)}>{days.map(d=><option value={d} key={d}>{new Date(d+"T12:00:00").toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}</option>)}</select></label><button type="button" onClick={()=>changeDay(-1)} disabled={days.indexOf(day)===0} aria-label="Later day">›</button></div><div className="realm-filters">{(["all","post","photo","video"] as const).map(k=><button type="button" key={k} aria-pressed={filter===k} onClick={()=>setFilter(k)}>{k==="all"?"ALL":k==="post"?"POSTS":k==="photo"?"PHOTOS":"VIDEOS"}</button>)}</div></div>
 <UmmahThreeRealm key={day+"-"+filter} items={items} avatar={avatar} displayName={name} onSelect={setSelected}/>
 {!loading&&!items.length&&<div className="realm-empty">No {filter==="all"?"posts":filter+"s"} on this day.</div>}
 {loading&&<div className="realm-status">CONNECTING TO THE UMMAH…</div>}{error&&<div className="realm-status">{error}</div>}
 {selected&&<div className="realm-scrim" onClick={()=>setSelected(null)}><section role="dialog" aria-modal="true" aria-label={selected.title} className="realm-panel" onClick={e=>e.stopPropagation()}><button type="button" className="realm-close" onClick={()=>setSelected(null)} aria-label="Close">×</button><small>{selected.kind.toUpperCase()} · {selected.date}</small><h2>{selected.title}</h2>{selected.image&&selected.kind==="photo"&&<img src={selected.image} alt="Post media"/>}<p>{selected.body}</p><Link href={selected.href}>OPEN CONVERSATION ↗</Link></section></div>}
 </main>
}
