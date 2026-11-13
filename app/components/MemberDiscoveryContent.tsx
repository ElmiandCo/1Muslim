"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {createClient} from "../../utils/supabase/client";
type Entry={id:string;body?:string|null;title?:string|null;created_at:string;source?:string};
type Member={id:string;bio:string|null;city:string|null;state:string|null;country:string|null;xp_total:number;display_name:string};
export default function MemberDiscoveryContent({member,tab}:{member:Member;tab:"posts"|"clips"|"about"|"journey"}){
 const [items,setItems]=useState<Entry[]>([]),[loading,setLoading]=useState(false),[error,setError]=useState("");
 const [stats,setStats]=useState<{posts:number|null;clips:number|null;followers:number|null;following:number|null;joined:string|null}>({posts:null,clips:null,followers:null,following:null,joined:null});
 useEffect(()=>{let live=true;const db=createClient();setItems([]);setError("");setLoading(true);
 const run=async()=>{
 if(tab==="posts"){const [a,b]=await Promise.all([db.from("posts").select("id,body,created_at").eq("user_id",member.id).order("created_at",{ascending:false}).limit(30),db.from("community_posts").select("id,body,created_at").eq("author_id",member.id).order("created_at",{ascending:false}).limit(30)]);if(live){setItems([...(a.data||[]).map(x=>({...x,source:"profile"})),...(b.data||[]).map(x=>({...x,source:"community"}))].sort((x,y)=>y.created_at.localeCompare(x.created_at)));if(a.error&&b.error)setError("Posts are unavailable right now.")}}
 if(tab==="clips"){const r=await db.from("live_recordings").select("id,title,created_at").eq("user_id",member.id).eq("visibility","public").order("created_at",{ascending:false}).limit(30);if(live){setItems(r.data||[]);if(r.error)setError("Public clips are unavailable right now.")}}
 if(tab==="journey"){const [a,b,c,d,e]=await Promise.all([db.from("posts").select("*",{count:"exact",head:true}).eq("user_id",member.id),db.from("live_recordings").select("*",{count:"exact",head:true}).eq("user_id",member.id).eq("visibility","public"),db.from("profile_follows").select("*",{count:"exact",head:true}).eq("following_id",member.id),db.from("profile_follows").select("*",{count:"exact",head:true}).eq("follower_id",member.id),db.from("profiles").select("created_at").eq("id",member.id).maybeSingle()]);if(live)setStats({posts:a.error?null:a.count,clips:b.error?null:b.count,followers:c.error?null:c.count,following:d.error?null:d.count,joined:e.data?.created_at||null})}
 if(live)setLoading(false);
 };void run();return()=>{live=false}
 },[member.id,tab]);
 if(tab==="about")return <section className="memberDiscoveryInfo"><p>{member.bio||"This member has not shared a bio."}</p>{[member.city,member.state,member.country].filter(Boolean).length>0&&<p>📍 {[member.city,member.state,member.country].filter(Boolean).join(", ")}</p>}</section>;
 if(loading)return <p role="status">Loading {tab}…</p>;
 if(error)return <p role="alert">{error}</p>;
 if(tab==="journey")return <section className="memberDiscoveryStats"><div><strong>{(member.xp_total||0).toLocaleString()}</strong><span>XP</span></div>{([["posts",stats.posts],["public clips",stats.clips],["followers",stats.followers],["following",stats.following]] as const).map(([label,n])=><div key={label}><strong>{n===null?"—":n.toLocaleString()}</strong><span>{label}</span></div>)}{stats.joined&&<p>Member since {new Date(stats.joined).toLocaleDateString()}</p>}</section>;
 return <section className="memberDiscoveryEntries">{items.length===0?<p>No public {tab} yet.</p>:items.map(x=><Link key={x.source+":"+x.id} href={tab==="posts"?"/posts/story/"+encodeURIComponent(x.id):"/streaming/replay/"+encodeURIComponent(x.id)}><strong>{x.body||x.title||"View "+tab}</strong><small>{new Date(x.created_at).toLocaleDateString()} ↗</small></Link>)}<style>{`.memberDiscoveryEntries{display:grid;gap:10px}.memberDiscoveryEntries>a{display:grid;gap:8px;padding:15px;border:1px solid #cbd5e1;border-radius:14px;color:inherit;text-decoration:none;overflow-wrap:anywhere}.memberDiscoveryEntries small{opacity:.7}.memberDiscoveryStats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.memberDiscoveryStats>div{padding:15px;border:1px solid #cbd5e1;border-radius:14px;display:grid}.memberDiscoveryStats strong{font-size:23px}.memberDiscoveryStats span{font-size:12px;opacity:.7}.memberDiscoveryStats>p{grid-column:1/-1}`}</style></section>;
}
