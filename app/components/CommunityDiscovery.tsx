"use client";
import {useEffect,useMemo,useState} from "react";
import "./community-discovery.css";
type Item={id:string;body:string;created_at:string;author_name?:string;author_handle?:string;media_url?:string|null;media_type?:string|null};
type Filter="All"|"Posts"|"Videos"|"Qur’an"|"Live";
const filters:Filter[]=["All","Posts","Videos","Qur’an","Live"];
const ytId=(s:string)=>{const m=s.match(/(?:youtu\.be\/|youtube\.com\/(?:shorts\/|watch\?v=))([a-zA-Z0-9_-]{11})/);return m?.[1]||""};
function classify(p:Item){if(/\/streaming\/(watch|live)\//i.test(p.body))return "Live";if(p.media_type?.startsWith("video/")||ytId(p.body))return "Videos";if(/(?:qur[’']?an|surah|ayah|verse|سورة|آية)/i.test(p.body))return "Qur’an";return "Posts"}
export default function CommunityDiscovery({active}:{active:boolean}){
 const [items,setItems]=useState<Item[]>([]),[query,setQuery]=useState(""),[filter,setFilter]=useState<Filter>("All"),[loading,setLoading]=useState(true),[error,setError]=useState(""),[expanded,setExpanded]=useState<Item|null>(null);
 useEffect(()=>{if(!active)return;let alive=true;const load=async()=>{try{const res=await fetch("/api/community-posts",{cache:"no-store"});if(!res.ok)throw Error("Unable to load posts");const data=await res.json();if(alive){setItems(data.posts||[]);setError("")}}catch{if(alive)setError("Community posts are temporarily unavailable.")}finally{if(alive)setLoading(false)}};void load();const timer=setInterval(load,30000);return()=>{alive=false;clearInterval(timer)}},[active]);
 const visible=useMemo(()=>items.filter(p=>(filter==="All"||classify(p)===filter)&&(!query.trim()||[p.body,p.author_name,p.author_handle].join(" ").toLowerCase().includes(query.trim().toLowerCase()))),[items,query,filter]);
 return <section className="community3" aria-label="Community discovery">
  <header className="community3-heading"><div><h2>Community</h2><p>The Ummah Hub</p></div><a className="community3-bell" href="/notifications" aria-label="View notifications">♧<span>🔔</span></a></header>
  <div className="community3-search"><span aria-hidden="true">⌕</span><input aria-label="Search the Ummah" placeholder="Search the Ummah..." value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button aria-label="Clear search" onClick={()=>setQuery("")}>×</button>}</div>
  <div className="community3-filters" role="tablist" aria-label="Filter community content">{filters.map(f=><button key={f} role="tab" aria-selected={filter===f} className={filter===f?"selected":""} onClick={()=>setFilter(f)}>{f}</button>)}</div>
  {error&&<p role="status" className="community3-state">{error}</p>}
  {loading?<p className="community3-state">Loading Ummah posts…</p>:visible.length===0?<p className="community3-state">{query?"No matching posts yet.":"No posts in this category yet."}</p>:<div className="community3-grid">{visible.map(p=>{const category=classify(p),id=ytId(p.body),media=p.media_url||(id?`https://img.youtube.com/vi/${id}/hqdefault.jpg`:"");return <button className="community3-card" key={p.id} onClick={()=>setExpanded(p)} aria-label={`Open ${category} by ${p.author_name||"Community member"}`}>
    {media&&(p.media_type?.startsWith("video/")?<div className="community3-media community3-video"><video src={media} muted playsInline preload="metadata"/><span className="community3-play">▶</span></div>:<div className="community3-media"><img src={media} alt="" loading="lazy"/>{category==="Videos"&&<span className="community3-play">▶</span>}</div>)}
    <div className="community3-cardbody"><small>{category==="Live"?"🔴 Live":category==="Qur’an"?"✧ Qur’an":category==="Videos"?"▶ Video":"✦ Ummah Post"}</small><p>{p.body.replace(/https?:\/\/\S+/g,"").trim()||"Watch this community video"}</p><span>{p.author_name||"Community member"}</span></div>
   </button>})}</div>}
  {expanded&&<div className="community3-overlay" role="dialog" aria-modal="true" aria-label="Community post"><button className="community3-close" onClick={()=>setExpanded(null)}>✕ Close</button><article><strong>{expanded.author_name||"Community member"}</strong><p>{expanded.body}</p>{expanded.media_url&&(expanded.media_type?.startsWith("video/")?<video controls playsInline src={expanded.media_url}/>:<img src={expanded.media_url} alt="Post media"/>)}{ytId(expanded.body)&&<a href={`https://www.youtube.com/watch?v=${ytId(expanded.body)}`} target="_blank" rel="noopener noreferrer">▶ Watch video ↗</a>}<a href={`/community?post=${encodeURIComponent(expanded.id)}`}>Open full post and comments ↗</a></article></div>}
 </section>
}