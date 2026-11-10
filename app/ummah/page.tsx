"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {createClient} from "../../utils/supabase/client";
import HudHudLightCore from "../components/HudHudLightCore";
import "./world.css";

type Post={id:string;body:string;author_name:string;media_url?:string|null;media_type?:string|null};
type Member={id:string;name:string;avatar:string|null};
type Item={id:string;title:string;subtitle:string;image?:string|null;video?:boolean;href:string};
type Category="all"|"photos"|"videos"|"stories"|"people"|"magazine"|"newsletter";
const groups:{id:Category;name:string;caption:string;symbol:string}[]=[
{id:"all",name:"Discover",caption:"Everything around you",symbol:"✧"},
{id:"photos",name:"Photos",caption:"Community images",symbol:"▧"},
{id:"videos",name:"Videos",caption:"Watch and explore",symbol:"▷"},
{id:"stories",name:"Conversations",caption:"Words from the Ummah",symbol:"☰"},
{id:"people",name:"People",caption:"Members online",symbol:"◎"},
{id:"magazine",name:"Magazine",caption:"Qibla features",symbol:"✦"},
{id:"newsletter",name:"Newsletter",caption:"Qibla reporting",symbol:"≋"}];
const isVideo=(p:Post)=>p.media_type?.startsWith("video/")||/\.(mp4|webm|mov)(\?|$)/i.test(p.media_url||"");
const isPhoto=(p:Post)=>!!p.media_url&&!isVideo(p);
export default function UmmahWorld(){
 const [posts,setPosts]=useState<Post[]>([]),[members,setMembers]=useState<Member[]>([]),[avatar,setAvatar]=useState<string|null>(null),[name,setName]=useState("YOU"),[loading,setLoading]=useState(true),[error,setError]=useState(""),[category,setCategory]=useState<Category|null>(null),[selected,setSelected]=useState<Item|null>(null),[paused,setPaused]=useState(false),[touch,setTouch]=useState({x:50,y:50});
 useEffect(()=>{let live=true;const s=createClient();void(async()=>{try{const {data:{user}}=await s.auth.getUser();if(!user||!live)return;const {data}=await s.from("profiles").select("display_name,avatar_config,avatar_gender").eq("id",user.id).maybeSingle();if(!live||!data)return;const config=(data.avatar_config||{}) as Record<string,unknown>;const url=[config.adminAvatarUrl,config.customAvatarUrl,config.selectedAvatarUrl,config.avatarUrl].find(v=>typeof v==="string"&&v.length>0);setAvatar(typeof url==="string"?url:(data.avatar_gender==="female"?"/assets/avatars/Default-women.png":"/assets/avatars/default-male.jpg"));setName(data.display_name||"YOU")}catch{}})();return()=>{live=false}},[]);
 useEffect(()=>{let live=true;const load=async()=>{try{const response=await fetch("/api/community-posts",{cache:"no-store"});if(!response.ok)throw Error("Community posts unavailable");const data=await response.json();if(live){setPosts((data.posts||[]).slice(0,32));setError("")}}catch(e){if(live)setError(e instanceof Error?e.message:"Community unavailable")}finally{if(live)setLoading(false)}};void load();const timer=setInterval(()=>void load(),45000);return()=>{live=false;clearInterval(timer)}},[]);
 useEffect(()=>{let live=true;const load=async()=>{try{const r=await fetch("/api/ummah-world/presence",{cache:"no-store"});if(!r.ok)return;const data=await r.json();if(live)setMembers(data.members||[])}catch{}};void load();const timer=setInterval(()=>void load(),30000);return()=>{live=false;clearInterval(timer)}},[]);
 const counts=useMemo(()=>({all:posts.length+members.length+2,photos:posts.filter(isPhoto).length,videos:posts.filter(isVideo).length,stories:posts.filter(p=>!p.media_url).length,people:members.length,magazine:1,newsletter:1}),[posts,members]);
 const items=useMemo(():Item[]=>{if(!category)return[];const pool=posts.filter(p=>category==="all"||category==="photos"&&isPhoto(p)||category==="videos"&&isVideo(p)||category==="stories"&&!p.media_url).map(p=>({id:p.id,title:p.author_name||"Community",subtitle:p.body?.slice(0,220)||"Community post",image:p.media_url,video:isVideo(p),href:"/community"}));const people=members.map(m=>({id:"member-"+m.id,title:m.name,subtitle:"Online in the Ummah",image:m.avatar,href:"/messages"}));const magazine:Item={id:"magazine",title:"Qibla Magazine",subtitle:"Editorial features and stories",href:"/qibla"};const newsletter:Item={id:"newsletter",title:"Qibla Newsletter",subtitle:"News and perspectives",href:"/qibla"};if(category==="people")return people.slice(0,10);if(category==="magazine")return[magazine];if(category==="newsletter")return[newsletter];return category==="all"?[...pool,...people,...[magazine,newsletter]].slice(0,12):pool.slice(0,12)},[category,posts,members]);
 const active=groups.find(g=>g.id===category);
 return <main className="ummah-world">
 <header className="uw-header"><Link href="/" aria-label="Return home">←</Link><div><strong>1M / UMMAH WORLD</strong><small>THE LIVING COMMUNITY</small></div><button type="button" onClick={()=>setPaused(v=>!v)} aria-pressed={paused}>{paused?"▶ Play":"Ⅱ Pause"}</button></header>
 <section className="uw-topline"><span>DISCOVER YOUR WORLD</span><h1>Everything moves around you.</h1><p>Choose a world below. Its stories will orbit your avatar.</p></section>
 <section className="uw-category-list" aria-label="Explore content types">{groups.map(g=><button type="button" key={g.id} className={"uw-category "+(category===g.id?"uw-active":"")} aria-pressed={category===g.id} onClick={()=>{setCategory(v=>v===g.id?null:g.id);setSelected(null)}}><span className="uw-category-icon">{g.symbol}</span><span className="uw-category-copy"><strong>{g.name}</strong><small>{g.caption}</small></span><span className="uw-category-count">{counts[g.id]}</span></button>)}</section>
 <section className={"uw-stage "+(paused?"uw-paused":"")} aria-label="Interactive magnetic content orbit" onPointerMove={e=>{const r=e.currentTarget.getBoundingClientRect();setTouch({x:Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100)),y:Math.max(0,Math.min(100,(e.clientY-r.top)/r.height*100))})}}>
 <div className="uw-grid" aria-hidden="true"/><div className="uw-halo" aria-hidden="true"/>
 <div className="uw-light-shell" aria-hidden="true"><HudHudLightCore state="IDLE" level={0} touch={touch} active={!!category} effect="Magnetic Orbit"/></div>
 <div className="uw-core"><div className="uw-avatar">{avatar?<img src={avatar} alt="Your avatar"/>:<span>1M</span>}</div><span className="uw-core-name">{name}</span></div>
 {!category?<div className="uw-idle-message"><span>✧</span> SELECT A WORLD ABOVE</div>:<>
 <div className="uw-orbit-title"><strong>{active?.name}</strong><small>{items.length} {items.length===1?"item":"items"} in orbit</small></div>
 <div className="uw-orbit-track" aria-hidden="true"/>
 {items.map((item,i)=>{const a=(i/items.length)*Math.PI*2-Math.PI/2;return <button type="button" key={item.id} className="uw-orbit-item" style={{"--x":(50+Math.cos(a)*39)+"%","--y":(50+Math.sin(a)*39)+"%","--delay":(i*.13)+"s","--index":i} as React.CSSProperties} onClick={()=>setSelected(item)} aria-label={"Open "+item.title}><span className="uw-item-shape">{item.image&&!item.video?<img src={item.image} alt=""/>:item.video?<span>▶</span>:<span>{category==="people"?"◎":"✦"}</span>}</span><span className="uw-item-label">{item.title}</span></button>})}
 {!items.length&&<p className="uw-empty">Nothing here yet. Try another world.</p>}
 </>}
 </section>
 <footer className="uw-footer"><span>✧ MAGNETIC DISCOVERY</span><span>{posts.length} posts · {members.length} online</span></footer>
 <nav className="uw-nav"><Link href="/community">Community ↗</Link><Link href="/messages">Messages ↗</Link><Link href="/qibla">Qibla ↗</Link></nav>
 {loading&&<div className="uw-loading" role="status">Connecting to the Ummah…</div>}{error&&<div className="uw-loading" role="status">{error}</div>}
 {selected&&<div className="uw-scrim" onClick={()=>setSelected(null)}><section className="uw-sheet" role="dialog" aria-modal="true" aria-label={selected.title} onClick={e=>e.stopPropagation()}><div className="uw-handle"/><button type="button" className="uw-close" aria-label="Close preview" onClick={()=>setSelected(null)}>✕</button><small>{active?.name.toUpperCase()}</small><h2>{selected.title}</h2>{selected.image&&!selected.video&&<img className="uw-preview" src={selected.image} alt="Content preview"/>}<p>{selected.subtitle}</p><Link href={selected.href} className="uw-open">Explore ↗</Link></section></div>}
 </main>
}
