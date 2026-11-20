"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SiteNav from "../components/SiteNav";
import { createClient } from "../../utils/supabase/client";

type N={actor_id?:string|null;id:string;type:string;title:string;body:string;entity_type:string|null;entity_id:string|null;read_at:string|null;created_at:string;};

function followerId(n:N){return n.entity_id&&["follow","follower","user_follow","profile","user","member"].includes(n.entity_type||"")?n.entity_id:null;}
function hrefFor(n:N){const follower=followerId(n);if(follower&&/^[0-9a-f-]{36}$/i.test(follower))return "/profile/"+encodeURIComponent(follower);if(n.entity_type==="live_stream"&&n.entity_id)return `/streaming/live/${n.entity_id}`;if(n.entity_type==="live_schedule"&&n.entity_id)return "/streaming/scheduled";if((n.entity_type==="dm_message"||n.entity_type==="message")&&n.entity_id&&/^[0-9a-f-]{36}$/i.test(n.entity_id))return "/messages?message="+encodeURIComponent(n.entity_id);if((n.entity_type==="dm_conversation"||n.entity_type==="conversation")&&n.entity_id&&/^[0-9a-f-]{36}$/i.test(n.entity_id))return "/messages?conversation="+encodeURIComponent(n.entity_id);if(n.entity_type==="featured_video_comment"&&n.entity_id&&/^[0-9a-f-]{36}$/i.test(n.entity_id))return "/?comment="+encodeURIComponent(n.entity_id)+"#featured-video-comments";return "/";}

export default function NotificationsPage(){
  const [items,setItems]=useState<N[]>([]);
  const [followerProfiles,setFollowerProfiles]=useState<Record<string,{display_name:string;username:string|null;avatar_url?:string|null}>>({});
  const [loading,setLoading]=useState(true);
  const [prefs,setPrefs]=useState<Record<string,boolean>>({});
  const [prefsBusy,setPrefsBusy]=useState(false);
  const [settingsOpen,setSettingsOpen]=useState(false);
  const [filter,setFilter]=useState("All");
  const [query,setQuery]=useState("");
  const [unreadOnly,setUnreadOnly]=useState(false);
  const unread=items.filter(n=>!n.read_at).length;
  const categories=[["email_messages","Private messages"],["email_replies","Replies"],["email_comments","Post & recording comments"],["email_xp","XP tiers & milestones"]];
  useEffect(()=>{let cancelled=false;const ids=[...new Set(items.map(followerId).filter((id):id is string=>!!id&&/^[0-9a-f-]{36}$/i.test(id)))];if(!ids.length)return;const db=createClient();void db.from("profiles").select("id,display_name,username,avatar_url").in("id",ids).then(({data,error})=>{if(error){void db.from("profiles").select("id,display_name,username").in("id",ids).then(({data:fallback})=>{if(!cancelled&&fallback)setFollowerProfiles(previous=>({...previous,...Object.fromEntries(fallback.map(p=>[p.id,{display_name:p.display_name||p.username||"1Muslim member",username:p.username}]))}));});return;}if(!cancelled&&data)setFollowerProfiles(previous=>({...previous,...Object.fromEntries(data.map(p=>[p.id,{display_name:p.display_name||p.username||"1Muslim member",username:p.username,avatar_url:p.avatar_url}]))}));});return()=>{cancelled=true};},[items]);
  async function markAllRead(){const ids=items.filter(n=>!n.read_at).map(n=>n.id);if(!ids.length)return;const db=createClient();const now=new Date().toISOString();const {error}=await db.from("notifications").update({read_at:now}).in("id",ids);if(!error)setItems(current=>current.map(n=>({...n,read_at:n.read_at??now}))); }
  async function markOne(n:N){if(n.read_at)return;const now=new Date().toISOString();const s=createClient();const {error}=await s.from("notifications").update({read_at:now}).eq("id",n.id);if(!error)setItems(current=>current.map(x=>x.id===n.id?{...x,read_at:now}:x));}
  async function savePref(key:string,value:boolean){setPrefsBusy(true);const db=createClient();const {data:{user}}=await db.auth.getUser();if(user){const {error}=await db.from("notification_preferences").upsert({user_id:user.id,[key]:value,updated_at:new Date().toISOString()},{onConflict:"user_id"});if(!error)setPrefs(v=>({...v,[key]:value}));}setPrefsBusy(false);}
  useEffect(()=>{let active=true;const s=createClient();(async()=>{const {data:{user}}=await s.auth.getUser();if(!user){setLoading(false);return;}const {data}=await s.from("notifications").select("id,type,title,body,entity_type,entity_id,read_at,created_at").order("created_at",{ascending:false}).limit(60);if(active){setItems((data??[]) as N[]);setLoading(false);}
  // Visiting Activity acknowledges the visible notifications and clears the nav badge.
  const unreadIds=(data??[]).filter(n=>!n.read_at).map(n=>n.id);
  if(unreadIds.length){const now=new Date().toISOString();const {error:readError}=await s.from("notifications").update({read_at:now}).eq("user_id",user.id).in("id",unreadIds);if(active&&!readError)setItems(current=>current.map(n=>unreadIds.includes(n.id)?{...n,read_at:now}:n));}const {data:pref}=await s.from("notification_preferences").select("email_messages,email_replies,email_comments,email_xp").eq("user_id",user.id).maybeSingle();if(active&&pref)setPrefs(pref as Record<string,boolean>);})();const channel=s.channel("my-notifications").on("postgres_changes",{event:"INSERT",schema:"public",table:"notifications"},payload=>{const n=payload.new as N;setItems(prev=>prev.some(x=>x.id===n.id)?prev:[n,...prev].slice(0,60))}).subscribe();return()=>{active=false;void s.removeChannel(channel)};},[]);
  function kind(n:N){const t=(n.type+" "+(n.entity_type||"")).toLowerCase();if(/xp|level|badge|milestone|achievement/.test(t))return "Achievements";if(/follow|profile|friend/.test(t))return "Social";if(/dm|message|conversation|chat/.test(t))return "Messages";if(/comment|reply|like|post|reaction/.test(t))return "Social";return "System";}
  function label(n:N){const id=followerId(n),p=id?followerProfiles[id]:null;return p?p.display_name+" followed you":n.title;}
  function detail(n:N){const id=followerId(n),p=id?followerProfiles[id]:null;return p?"@"+(p.username||"member"):n.body;}
  function stamp(date:string){const diff=Math.max(0,Date.now()-new Date(date).getTime());if(diff<60000)return "now";if(diff<3600000)return Math.floor(diff/60000)+"m";if(diff<86400000)return Math.floor(diff/3600000)+"h";if(diff<604800000)return Math.floor(diff/86400000)+"d";return new Date(date).toLocaleDateString(undefined,{month:"short",day:"numeric"});}
  const now=new Date(),todayStart=new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime(),weekStart=todayStart-6*86400000;
  const visible=items.filter(n=>(filter==="All"||kind(n)===filter)&&(!unreadOnly||!n.read_at)&&(!query||[label(n),detail(n),n.type].join(" ").toLowerCase().includes(query.toLowerCase())));
  const sections=[["Today",visible.filter(n=>new Date(n.created_at).getTime()>=todayStart)],["This Week",visible.filter(n=>{const t=new Date(n.created_at).getTime();return t<todayStart&&t>=weekStart;})],["Earlier",visible.filter(n=>new Date(n.created_at).getTime()<weekStart)]] as const;
  function notificationCard(n:N){const k=kind(n),id=followerId(n),p=id?followerProfiles[id]:null;const avatar=p?.avatar_url;return <Link href={hrefFor(n)} key={n.id} onClick={()=>void markOne(n)} className={"nmCard "+(!n.read_at?"nmUnread ":"")+(k==="Achievements"?"nmAchievement":"")}>
    {!n.read_at&&<span className="nmDot" aria-label="Unread"/>}
    <span className="nmAvatar">{avatar?<img src={avatar} alt="" loading="lazy" onError={e=>{e.currentTarget.style.display="none"}}/>:<span aria-hidden="true">{k==="Achievements"?"🏆":k==="Messages"?"💬":k==="Social"?"👤":"🔔"}</span>}</span>
    <span className="nmText"><span className="nmMainLine"><strong>{label(n)}</strong><time dateTime={n.created_at}>{stamp(n.created_at)}</time></span><span className="nmDetail">{detail(n)}</span></span><span className="nmChevron" aria-hidden="true">›</span>
  </Link>;}
  return <main className="notificationsPage"><SiteNav/><div className="nmShell">
    <div className="nmHeading"><button type="button" className="nmBack" onClick={()=>window.history.back()} aria-label="Go back">‹</button><h1>Activity</h1><div className="nmActions"><button type="button" onClick={()=>void markAllRead()} disabled={!unread} className="nmAction" aria-label="Mark all notifications as read">✓ <span>Read all</span></button><button type="button" className="nmSettings" aria-label="Notification settings" aria-expanded={settingsOpen} onClick={()=>setSettingsOpen(v=>!v)}>⚙</button></div></div>
    <div className="nmFilters" role="group" aria-label="Filter notifications">{["All","Social","Achievements","Messages","System"].map(name=><button key={name} type="button" className={filter===name?"selected":""} aria-pressed={filter===name} onClick={()=>setFilter(name)}>{name}</button>)}</div>
    <label className="nmSearch"><span aria-hidden="true">⌕</span><input type="search" placeholder="Search activity" aria-label="Search notifications" value={query} onChange={e=>setQuery(e.target.value)}/></label>
    <div className="nmSummary"><span>{unread?unread+" unread":"All caught up"}</span><button type="button" aria-pressed={unreadOnly} onClick={()=>setUnreadOnly(v=>!v)}>{unreadOnly?"Show all":"Unread only"}</button></div>
    {settingsOpen&&<section className="nmPrefs"><h2>Notification controls</h2><p>Choose which updates also arrive by email. In-app notifications remain unchanged.</p>{categories.map(([key,name])=><label key={key}>{name}<input type="checkbox" disabled={prefsBusy} checked={prefs[key]!==false} onChange={e=>void savePref(key,e.target.checked)}/></label>)}</section>}
    {loading?<div className="nmEmpty">Loading notifications…</div>:!visible.length?<div className="nmEmpty">No notifications to show.</div>:sections.map(([title,list])=>list.length?<section className="nmSection" key={title}><h2>{title}</h2><div className="nmList">{list.map(notificationCard)}</div></section>:null)}
  </div><style jsx>{`
.notificationsPage{min-height:100dvh;background:#f7f7f7;color:#17191c;overflow-x:hidden}
.nmShell{max-width:780px;margin:auto;padding:12px 16px calc(112px + env(safe-area-inset-bottom));font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
.nmHeading{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:55px;margin:0 0 15px}
.nmHeading h1{font-size:22px;line-height:1.2;letter-spacing:-.03em;font-weight:750;margin:0;flex:1;text-align:center}
.nmBack{border:0;background:transparent;color:#17191c;font-size:38px;line-height:1;width:36px;height:44px;cursor:pointer}
.nmActions{display:flex;align-items:center;gap:5px}.nmActions button{border:0;background:transparent;color:#1d2325;cursor:pointer}.nmAction{font-size:13px;font-weight:650;padding:7px}.nmAction:disabled{opacity:.35}.nmSettings{width:37px;height:42px;font-size:25px}
.nmFilters{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding:0 0 12px;margin:0 -2px}
.nmFilters button{flex:0 0 auto;border:0;border-radius:13px;background:#e9e9eb;color:#25282a;font-size:13px;font-weight:600;min-height:39px;padding:9px 17px;cursor:pointer}
.nmFilters button.selected{background:#d6f0f7;color:#087c9d}
.nmSearch{display:flex;align-items:center;gap:8px;height:42px;background:#ededee;border:0;border-radius:12px;padding:0 12px;margin:0 0 8px}
.nmSearch span{font-size:24px;color:#767b80}.nmSearch input{width:100%;border:0;background:transparent;outline:0;color:#232628;font-size:14px}
.nmSummary{display:flex;align-items:center;justify-content:space-between;gap:8px;color:#808488;font-size:12px;margin:7px 0 12px}.nmSummary button{border:0;background:transparent;color:#287d90;font-weight:650;cursor:pointer}
.nmPrefs{border-radius:14px;background:white;padding:15px;margin:0 0 15px}.nmPrefs h2{font-size:17px;margin:0 0 7px}.nmPrefs p{font-size:12px;color:#666}.nmPrefs label{display:flex;justify-content:space-between;align-items:center;padding:11px 0;border-top:1px solid #eee;font-size:13px}.nmPrefs input{accent-color:#128b9b}
.nmSection{margin:16px -16px 0}.nmSection h2{font-size:14px;font-weight:650;color:#83878b;margin:0;padding:12px 16px 10px;background:#f7f7f7}
.nmList{background:#fff}.nmCard{position:relative;display:flex;align-items:center;gap:12px;min-height:83px;padding:13px 18px 13px 27px;text-decoration:none;color:#15191b;background:#fff;border-bottom:1px solid #f0f1f2;transition:background .15s ease}
.nmCard:active{background:#f1f7f8}.nmCard.nmUnread{background:#effafb}.nmCard.nmAchievement{background:#fcfbf7}
.nmAvatar{width:51px;height:51px;flex:0 0 51px;border-radius:50%;background:#e8eef0;display:grid;place-items:center;overflow:hidden;font-size:22px}
.nmAvatar img{display:block;width:100%;height:100%;object-fit:cover}
.nmText{display:flex;flex-direction:column;flex:1;gap:4px;min-width:0}.nmMainLine{display:flex;align-items:baseline;gap:6px;min-width:0}.nmText strong{font-size:15px;font-weight:650;line-height:1.35;min-width:0;overflow-wrap:anywhere}.nmText time{font-size:12px;color:#898e91;white-space:nowrap;flex-shrink:0}
.nmDetail{color:#73787b;font-size:13px;line-height:1.4;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.nmChevron{color:#aeb5b8;font-size:21px;flex-shrink:0}.nmDot{position:absolute;left:10px;top:50%;transform:translateY(-50%);width:7px;height:7px;background:#19bfd4;border-radius:50%}
.nmEmpty{background:white;padding:45px 16px;text-align:center;color:#777;border-radius:12px}
@media(max-width:400px){.nmShell{padding-left:12px;padding-right:12px}.nmSection{margin-left:-12px;margin-right:-12px}.nmCard{padding-right:12px;gap:10px}.nmAvatar{width:46px;height:46px;flex-basis:46px}.nmText strong{font-size:14px}.nmAction span{display:none}}
@media(prefers-reduced-motion:reduce){.nmCard{transition:none}}
`}</style></main>;
}
