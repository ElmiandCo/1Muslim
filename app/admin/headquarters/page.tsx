"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import Link from "next/link";
import SiteNav from "../../components/SiteNav";
import "./headquarters.css";
type Member={id:string;display_name:string|null;username:string|null;city:string|null;state:string|null;xp_total:number|null;shahada_verified_at:string|null};
type Post={id:string;user_id:string;body:string;created_at:string};
type Live={id:string;host_id:string;title:string;category:string;status:string;started_at:string;viewer_count:number};
type Recording={id:string;user_id:string;title:string;created_at:string;duration_seconds:number};
type Report={id:string;target_type:string;target_id:string;reason:string;status:string;created_at:string};
type Results={members:Member[];posts:Post[];lives:Live[];recordings:Recording[];reports:Report[];warnings:string[]};
const empty:Results={members:[],posts:[],lives:[],recordings:[],reports:[],warnings:[]};
const categories=[["all","All intelligence","✦"],["members","Members","◉"],["posts","Posts","▤"],["lives","Live streams","◉"],["reports","Reports","⚑"]] as const;
const shortcuts=[{title:"Moderation Desk",description:"Review reports and pending actions",href:"/admin/desk",icon:"⚑"},{title:"Content library",description:"Manage featured video programming",href:"/admin/videos",icon:"▣"},{title:"Verse media",description:"Curate Qur’an learning resources",href:"/admin/verse-media",icon:"۞"},{title:"Community",description:"Browse the public community",href:"/community",icon:"⬡"}];
const date=(v?:string)=>v?new Date(v).toLocaleString():"—";
export default function Headquarters(){
 const [q,setQ]=useState(""),[category,setCategory]=useState<(typeof categories)[number][0]>("all"),[memberId,setMemberId]=useState<string|null>(null);
 const [data,setData]=useState<Results>(empty),[busy,setBusy]=useState(true),[error,setError]=useState(""),[denied,setDenied]=useState(false);
 const selected=useMemo(()=>data.members.find(p=>p.id===memberId)||null,[data.members,memberId]);
 const load=useCallback(async(signal?:AbortSignal)=>{
  setBusy(true);setError("");
  try{const params=new URLSearchParams({category,q});if(memberId)params.set("member",memberId);
  const res=await fetch("/api/admin/headquarters?"+params.toString(),{signal,cache:"no-store"});
  const json=await res.json();
  if(!res.ok){setDenied(res.status===401||res.status===403);throw new Error(json.error||"Search unavailable");}
  setDenied(false);setData(json as Results);
  }catch(e){if((e as Error).name!=="AbortError")setError((e as Error).message)}finally{if(!signal?.aborted)setBusy(false)}
 },[q,category,memberId]);
 useEffect(()=>{const controller=new AbortController();const timer=setTimeout(()=>void load(controller.signal),q?300:0);return()=>{clearTimeout(timer);controller.abort()}},[load]);
 const chooseMember=(id:string)=>{setMemberId(id);setCategory("all");setQ("")};
 const clearMember=()=>{setMemberId(null);setCategory("all")};
 const count=data.members.length+data.posts.length+data.lives.length+data.recordings.length+data.reports.length;
 const timeline=useMemo(()=>[
 ...data.posts.map(p=>({id:p.id,kind:"Post",title:p.body?.slice(0,110)||"Post",at:p.created_at,href:"/posts/"+p.id})),
 ...data.lives.map(l=>({id:l.id,kind:"Live",title:l.title||"Live stream",at:l.started_at,href:"/streaming"})),
 ...data.recordings.map(v=>({id:v.id,kind:"Recording",title:v.title||"Recording",at:v.created_at,href:"/streaming/library"}))
 ].sort((a,b)=>new Date(b.at).getTime()-new Date(a.at).getTime()),[data.posts,data.lives,data.recordings]);
 return <main className="hqPage"><SiteNav/><div className="hqShell">
 <header className="hqHero"><div className="hqOrb" aria-hidden="true"/><div className="hqEyebrow"><span className="hqLiveDot"/> 1MUSLIM / ADMIN OPERATIONS / HQ</div><div className="hqHeroTop"><div><h1>Headquarters<span>.</span></h1><p>One command center. Every connected surface. Find members, review activity and navigate platform operations.</p></div><Link className="hqDeskLink" href="/admin/desk">⚑ Open Moderation Desk ↗</Link></div><div className="hqSearch"><span aria-hidden="true">⌕</span><input autoComplete="off" value={q} onChange={e=>{setQ(e.target.value);if(memberId)setMemberId(null)}} aria-label="Search Headquarters" placeholder="Search names, usernames, posts, livestreams or reports…"/>{q&&<button type="button" onClick={()=>setQ("")} aria-label="Clear search">✕</button>}<kbd>ADMIN SEARCH</kbd></div><div className="hqTabs" role="tablist" aria-label="Search category">{categories.map(([key,label,icon])=><button key={key} type="button" role="tab" aria-selected={category===key} className={category===key?"active":""} onClick={()=>setCategory(key)}><span>{icon}</span> {label}</button>)}</div><div className="hqStatus"><span><i/> AUTHENTICATED SEARCH</span><span>Results are limited to the latest 25 per category · No private messages accessed</span></div></header>
 {denied?<section className="hqPanel"><h2>Access restricted</h2><p>{error}</p><Link href="/auth">Sign in →</Link></section>:<>
 <div className="hqMetricGrid"><div className="hqMetric"><small>MEMBERS SHOWN</small><strong>{data.members.length}</strong><span>Current query</span></div><div className="hqMetric"><small>POSTS SHOWN</small><strong>{data.posts.length}</strong><span>Current query</span></div><div className="hqMetric"><small>LIVES SHOWN</small><strong>{data.lives.length}</strong><span>Current query</span></div><div className="hqMetric"><small>REPORTS SHOWN</small><strong>{data.reports.length}</strong><span>Current query</span></div></div>
 {memberId&&<div className="hqMemberBanner"><div><span className="hqEyebrow">MEMBER 360° / FILTER ACTIVE</span><h2>{selected?.display_name||"Member investigation"}</h2><small>{memberId}</small></div><div className="hqBannerActions"><Link href={"/profile/"+memberId}>Open public profile ↗</Link><button onClick={clearMember}>✕ Clear member</button></div></div>}
 {memberId&&<section className="hqPanel"><div className="hqPanelHead"><h3>◷ Member activity timeline</h3><span>{timeline.length} items</span></div>{timeline.map(item=><div className="hqRow" key={item.kind+item.id}><div className="hqRowBody"><strong>{item.kind} · {item.title}</strong><small>{date(item.at)}</small></div><Link href={item.href}>View ↗</Link></div>)}{!busy&&!timeline.length&&<p className="hqEmpty">No indexed activity for this member.</p>}</section>}
 {error&&<p role="alert" className="hqError">{error}</p>}
 {data.warnings.length>0&&<div role="status" className="hqWarning"><strong>Some sources are not available yet.</strong>{data.warnings.map((w,i)=><p key={i}>{w}</p>)}</div>}
 <div className="hqContent"><div className="hqMain"><div className="hqSectionTitle"><div><span className="hqEyebrow">INTELLIGENCE / DISCOVERY</span><h2>{memberId?"Member activity":q?"Search results":"Recent platform activity"}</h2></div><small>{busy?"Searching…":count+" results loaded"}</small></div>
 {(category==="all"||category==="members")&&<section className="hqPanel"><div className="hqPanelHead"><h3>◉ Members</h3><span>{data.members.length} shown</span></div>{data.members.map(p=><div className="hqRow" key={p.id}><div className="hqAvatar">{(p.display_name||"M").slice(0,1).toUpperCase()}</div><div className="hqRowBody"><strong>{p.display_name||"Member"}</strong><small>@{p.username||"member"} · {[p.city,p.state].filter(Boolean).join(", ")||"Location not shared"} · {p.xp_total||0} XP</small></div><button type="button" onClick={()=>chooseMember(p.id)}>Investigate ↗</button></div>)}{!busy&&!data.members.length&&<p className="hqEmpty">No matching members.</p>}</section>}
 {(category==="all"||category==="posts")&&<section className="hqPanel"><div className="hqPanelHead"><h3>▤ Posts</h3><span>{data.posts.length} shown</span></div>{data.posts.map(p=><div className="hqRow" key={p.id}><div className="hqRowBody"><strong>{p.body?.slice(0,150)||"Untitled post"}</strong><small>{date(p.created_at)} · Author {p.user_id.slice(0,8)}…</small></div><div className="hqRowActions"><Link href={"/posts/"+p.id}>View ↗</Link><button onClick={()=>chooseMember(p.user_id)}>Author</button></div></div>)}{!busy&&!data.posts.length&&<p className="hqEmpty">No matching posts.</p>}</section>}
 {(category==="all"||category==="lives")&&<section className="hqPanel"><div className="hqPanelHead"><h3>◉ Livestreams</h3><span>{data.lives.length} shown</span></div>{data.lives.map(l=><div className="hqRow" key={l.id}><div className="hqRowBody"><strong>{l.title||"Untitled live"}</strong><small>{l.status} · {l.category} · {date(l.started_at)}</small></div><div className="hqRowActions"><Link href="/streaming">Streams ↗</Link><button onClick={()=>chooseMember(l.host_id)}>Host</button></div></div>)}{!busy&&!data.lives.length&&<p className="hqEmpty">No matching livestreams.</p>}</section>}
 {memberId&&(category==="all"||category==="lives")&&<section className="hqPanel"><div className="hqPanelHead"><h3>▣ Member recordings</h3><span>{data.recordings.length} shown</span></div>{data.recordings.map(v=><div className="hqRow" key={v.id}><div className="hqRowBody"><strong>{v.title||"Recording"}</strong><small>{date(v.created_at)} · {Math.round((v.duration_seconds||0)/60)} min</small></div><Link href="/streaming/library">Library ↗</Link></div>)}{!busy&&!data.recordings.length&&<p className="hqEmpty">No recordings found.</p>}</section>}
 {(category==="all"||category==="reports")&&<section className="hqPanel"><div className="hqPanelHead"><h3>⚑ Moderation reports</h3><Link href="/admin/desk">Open desk ↗</Link></div>{data.reports.map(r=><div className="hqRow" key={r.id}><div className="hqRowBody"><strong>{r.target_type} · {r.status}</strong><small>{r.reason.slice(0,130)} · {date(r.created_at)}</small></div><Link href="/admin/desk">Review ↗</Link></div>)}{!busy&&!data.reports.length&&<p className="hqEmpty">No matching reports.</p>}</section>}
 </div><aside className="hqAside"><section className="hqPanel"><span className="hqEyebrow">OPERATIONS</span><h3>Quick access</h3>{shortcuts.map(s=><Link key={s.href} href={s.href} className="hqShortcut"><span>{s.icon}</span><div><strong>{s.title}</strong><small>{s.description}</small></div><b>↗</b></Link>)}</section><section className="hqPanel"><span className="hqEyebrow">ACCESS CONTROL</span><h3>Administrator workspace</h3><p>Headquarters search requires a verified admin session. Shahada recordings, private messages, account deletion and permission management are intentionally excluded from Stage 1.</p><small>Stage 2 adds content controls. Stage 3 adds scoped permissions and full audit workflows.</small></section></aside></div>
 </>}
 </div></main>
}
