"use client";

import {useEffect,useMemo,useState} from "react";
import "./hudhud-recent-accounts.css";

type RecentMember={
 id:string;name:string;handle:string|null;avatar:string|null;joined:string|null;
 lastSeen:string;lastActive:string|null;page:string;daysObserved:number;online:boolean;engaged:boolean;
};
type RecentData={members:RecentMember[];uniqueAccounts:number;updatedAt:string;cutoff:string;capped:boolean;method:string};

function ago(value:string|null,now:number){
 if(!value)return "Not recorded";
 const elapsed=Math.max(0,now-Date.parse(value));
 if(!Number.isFinite(elapsed))return "Unknown";
 if(elapsed<60_000)return "Just now";
 if(elapsed<3_600_000)return Math.floor(elapsed/60_000)+"m ago";
 if(elapsed<86_400_000)return Math.floor(elapsed/3_600_000)+"h ago";
 if(elapsed<604_800_000)return Math.floor(elapsed/86_400_000)+"d ago";
 return new Date(value).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
}
function status(m:RecentMember,now:number){
 if(m.online)return{label:m.engaged?"Active now":"Online · idle",kind:m.engaged?"live":"idle"};
 const time=Date.parse(m.lastActive||m.lastSeen);
 if(time>=now-3_600_000)return{label:"Recent",kind:"recent"};
 if(time>=now-86_400_000)return{label:"Today",kind:"recent"};
 if(time>=now-604_800_000)return{label:"This week",kind:"older"};
 return{label:"Earlier",kind:"older"};
}
function MemberAvatar({member}:{member:RecentMember}){
 const [failed,setFailed]=useState(false);
 return <span className="hudhudRecentAvatar">
  {member.avatar&&!failed?<img src={member.avatar} alt="" loading="lazy" onError={()=>setFailed(true)}/>:<span aria-hidden="true">{member.name.trim().charAt(0).toUpperCase()||"1"}</span>}
 </span>;
}
export default function HudHudRecentAccounts({refreshKey=0}:{refreshKey?:number}){
 const [data,setData]=useState<RecentData|null>(null);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(true);
 const [query,setQuery]=useState("");
 const [expanded,setExpanded]=useState<string|null>(null);
 const [visible,setVisible]=useState(14);
 const [clock,setClock]=useState(()=>Date.now());
 useEffect(()=>{
  let mounted=true;
  const load=async()=>{
   try{
    const response=await fetch("/api/admin/recent-accounts",{cache:"no-store"});
    const body=await response.json();
    if(!response.ok)throw Error(typeof body.error==="string"?body.error:"Activity list is unavailable.");
    if(mounted){setData(body);setError("");setClock(Date.now())}
   }catch(e){if(mounted)setError(e instanceof Error?e.message:"Activity unavailable");}
   finally{if(mounted)setLoading(false)}
  };
  void load();
  const poll=window.setInterval(()=>void load(),60_000);
  return()=>{mounted=false;window.clearInterval(poll)};
 },[refreshKey]);
 const members=useMemo(()=>data?.members.filter(m=>[m.name,m.handle,m.page].some(v=>(v||"").toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())))||[],[data,query]);
 const lastDay=data?.members.filter(m=>Date.parse(m.lastActive||m.lastSeen)>=clock-86_400_000).length||0;
 const online=data?.members.filter(m=>m.online).length||0;
 return <section className="hudhudRecent" aria-label="Recent unique 1Muslim account activity">
   <div className="hudhudRecentTitle"><div>
     <span className="hudhudRecentEyebrow">ACCOUNT ACTIVITY · VERIFIED APP PRESENCE</span>
     <h4>Recent unique accounts</h4>
     <p>One row per member, newest visit first.</p>
   </div><span className="hudhudRecentUpdated">● AUTO · 60s</span></div>
   {error&&<p className="hudhudRecentError" role="status">{error}{data?" · Showing last successful snapshot.":""}</p>}
   {loading&&!data?<p className="hudhudRecentLoading" role="status">Reading recent account activity…</p>:data&&<>
    <div className="hudhudRecentKpis" aria-label="Recent account statistics">
     <div><small>Unique tracked</small><strong>{data.uniqueAccounts.toLocaleString()}</strong></div>
     <div><small>Online now</small><strong>{online}</strong></div>
     <div><small>Active / seen 24h</small><strong>{lastDay}</strong></div>
    </div>
    <label className="hudhudRecentSearch">
     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg>
     <input type="search" autoComplete="off" value={query} onChange={e=>{setQuery(e.target.value);setVisible(14)}} placeholder="Find a member or page…" aria-label="Search recent accounts"/>
     {query&&<button type="button" aria-label="Clear search" onClick={()=>setQuery("")}>×</button>}
    </label>
    <div className="hudhudRecentList" role="list" aria-label="Unique accounts sorted by last activity">
     {members.length===0?<p className="hudhudRecentEmpty">No recorded accounts match your search.</p>:members.slice(0,visible).map(member=>{
      const badge=status(member,clock),open=expanded===member.id;
      return <div className="hudhudRecentEntry" role="listitem" key={member.id}>
       <button type="button" className="hudhudRecentRow" onClick={()=>setExpanded(open?null:member.id)} aria-expanded={open} aria-label={`Details for ${member.name}, ${badge.label}`}>
        <MemberAvatar member={member}/>
        <span className="hudhudRecentWho">
          <strong>{member.name}</strong>
          <small>{member.handle&&member.name.toLowerCase()!==member.handle.toLowerCase()?"@"+member.handle+" · ":""}Seen {ago(member.lastSeen,clock)}{member.lastActive?" · Active "+ago(member.lastActive,clock):""}</small>
        </span>
        <span className={"hudhudRecentBadge "+badge.kind}><i aria-hidden="true"/>{badge.label}</span>
        <span className="hudhudRecentExpand" aria-hidden="true">{open?"−":"+"}</span>
       </button>
       {open&&<div className="hudhudRecentDetails">
        <div><span>Last interaction</span><strong>{member.lastActive?new Date(member.lastActive).toLocaleString():"Not recorded"}</strong></div>
        <div><span>Last app presence</span><strong>{new Date(member.lastSeen).toLocaleString()}</strong></div>
        <div><span>Last recorded page</span><strong>{member.page}</strong></div>
        <div><span>Days observed</span><strong>{member.daysObserved}</strong></div>
        {member.joined&&<div><span>Account created</span><strong>{new Date(member.joined).toLocaleDateString()}</strong></div>}
       </div>}
      </div>;
     })}
    </div>
    {members.length>visible&&<button type="button" className="hudhudRecentShowMore" onClick={()=>setVisible(n=>n+16)}>Show more accounts · {members.length-visible} remaining ↓</button>}
    <p className="hudhudRecentFootnote">{data.method} {data.capped?"The telemetry scan reached its safe cap; older accounts may be omitted.":""} Updated {ago(data.updatedAt,clock)}.</p>
   </>}
 </section>;
}
