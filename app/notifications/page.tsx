"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { createClient } from "../../utils/supabase/client";

type N={actor_id?:string|null;id:string;type:string;title:string;body:string;entity_type:string|null;entity_id:string|null;read_at:string|null;created_at:string;};

function followerId(n:N){return n.entity_id&&["follow","follower","user_follow","profile","user","member"].includes(n.entity_type||"")?n.entity_id:null;}
function hrefFor(n:N){if(n.entity_type==="qibla_application")return "/qibla/studio";if(n.entity_type==="qibla_submission")return n.type==="qibla_submission_review"?"/qibla/command":"/qibla/studio";const follower=n.actor_id||followerId(n);if(follower&&/^[0-9a-f-]{36}$/i.test(follower)&&(/follow/i.test(n.type)||followerId(n)))return "/profile?member="+encodeURIComponent(follower);if(["ummah_post","post","ummah_comment","post_comment"].includes(n.entity_type||"")&&n.entity_id)return "/posts?post="+encodeURIComponent(n.entity_id);if(["video","featured_video","deepwatch_video"].includes(n.entity_type||"")&&n.entity_id)return "/deepwatch?video="+encodeURIComponent(n.entity_id);if(n.entity_type==="live_stream"&&n.entity_id)return `/streaming/live/${n.entity_id}`;if(n.entity_type==="live_schedule"&&n.entity_id)return "/streaming/scheduled";if((n.entity_type==="dm_message"||n.entity_type==="message")&&n.entity_id&&/^[0-9a-f-]{36}$/i.test(n.entity_id))return "/messages?message="+encodeURIComponent(n.entity_id);if((n.entity_type==="dm_conversation"||n.entity_type==="conversation")&&n.entity_id&&/^[0-9a-f-]{36}$/i.test(n.entity_id))return "/messages?conversation="+encodeURIComponent(n.entity_id);if(n.entity_type==="featured_video_comment"&&n.entity_id&&/^[0-9a-f-]{36}$/i.test(n.entity_id))return "/?comment="+encodeURIComponent(n.entity_id)+"#featured-video-comments";return "/";}

export default function NotificationsPage(){
  const [items,setItems]=useState<N[]>([]);
  const [followerProfiles,setFollowerProfiles]=useState<Record<string,{display_name:string;username:string|null;avatar_url?:string|null}>>({});
  const [loading,setLoading]=useState(true);
  const [prefs,setPrefs]=useState<Record<string,boolean>>({});
  const [prefsBusy,setPrefsBusy]=useState(false);
  const [prefsError,setPrefsError]=useState("");
  const [prefsLoaded,setPrefsLoaded]=useState(false);
  const [settingsOpen,setSettingsOpen]=useState(false);
  const [filter,setFilter]=useState("All");
  const [query,setQuery]=useState("");
  const [unreadOnly,setUnreadOnly]=useState(false);
  const unread=items.filter(n=>!n.read_at).length;
  const categories=[["email_messages","Private messages"],["email_replies","Replies"],["email_comments","Post & recording comments"],["email_xp","XP tiers & milestones"]];
  useEffect(()=>{let cancelled=false;const ids=[...new Set(items.map(n=>n.actor_id||followerId(n)).filter((id):id is string=>!!id&&/^[0-9a-f-]{36}$/i.test(id)))];if(!ids.length)return;const db=createClient();void db.from("profiles").select("id,display_name,username,avatar_url").in("id",ids).then(({data,error})=>{if(error){void db.from("profiles").select("id,display_name,username").in("id",ids).then(({data:fallback})=>{if(!cancelled&&fallback)setFollowerProfiles(previous=>({...previous,...Object.fromEntries(fallback.map(p=>[p.id,{display_name:p.display_name||p.username||"1Muslim member",username:p.username}]))}));});return;}if(!cancelled&&data)setFollowerProfiles(previous=>({...previous,...Object.fromEntries(data.map(p=>[p.id,{display_name:p.display_name||p.username||"1Muslim member",username:p.username,avatar_url:p.avatar_url}]))}));});return()=>{cancelled=true};},[items]);
  async function markAllRead(){const ids=items.filter(n=>!n.read_at).map(n=>n.id);if(!ids.length)return;const db=createClient();const now=new Date().toISOString();const {error}=await db.from("notifications").update({read_at:now}).in("id",ids);if(!error)setItems(current=>current.map(n=>({...n,read_at:n.read_at??now}))); }
  async function markOne(n:N){if(n.read_at)return;const now=new Date().toISOString();const s=createClient();const {error}=await s.from("notifications").update({read_at:now}).eq("id",n.id);if(!error)setItems(current=>current.map(x=>x.id===n.id?{...x,read_at:now}:x));}
  async function savePref(key:string,value:boolean){
    if(prefsBusy||!prefsLoaded)return;
    setPrefsBusy(true);setPrefsError("");
    const db=createClient();const {data:{user},error:authError}=await db.auth.getUser();
    if(!user||authError){setPrefsError("Sign in to save notification preferences.");setPrefsBusy(false);return;}
    const next={...prefs,[key]:value};
    const {error}=await db.from("notification_preferences").upsert({user_id:user.id,email_messages:next.email_messages!==false,email_replies:next.email_replies!==false,email_comments:next.email_comments!==false,email_xp:next.email_xp!==false,updated_at:new Date().toISOString()},{onConflict:"user_id"});
    if(error)setPrefsError("Could not save your preference. Please try again.");
    else setPrefs(next);
    setPrefsBusy(false);
  }
  useEffect(()=>{let active=true;const s=createClient();(async()=>{const {data:{user}}=await s.auth.getUser();if(!user){setLoading(false);return;}const {data}=await s.from("notifications").select("id,type,title,body,entity_type,entity_id,actor_id,read_at,created_at").order("created_at",{ascending:false}).limit(60);if(active){setItems((data??[]) as N[]);setLoading(false);}
  // Visiting Activity acknowledges the visible notifications and clears the nav badge.
  const unreadIds=(data??[]).filter(n=>!n.read_at).map(n=>n.id);
  if(unreadIds.length){const now=new Date().toISOString();const {error:readError}=await s.from("notifications").update({read_at:now}).eq("user_id",user.id).in("id",unreadIds);if(active&&!readError)setItems(current=>current.map(n=>unreadIds.includes(n.id)?{...n,read_at:now}:n));}const {data:pref}=await s.from("notification_preferences").select("email_messages,email_replies,email_comments,email_xp").eq("user_id",user.id).maybeSingle();if(active){if(pref)setPrefs(pref as Record<string,boolean>);setPrefsLoaded(true);}})();const channel=s.channel("my-notifications").on("postgres_changes",{event:"INSERT",schema:"public",table:"notifications"},payload=>{const n=payload.new as N;setItems(prev=>prev.some(x=>x.id===n.id)?prev:[n,...prev].slice(0,60))}).subscribe();return()=>{active=false;void s.removeChannel(channel)};},[]);
  function kind(n:N){const t=(n.type+" "+(n.entity_type||"")).toLowerCase();if(/xp|level|badge|milestone|achievement/.test(t))return "Achievements";if(/follow|profile|friend/.test(t))return "Social";if(/dm|message|conversation|chat/.test(t))return "Messages";if(/comment|reply|like|post|reaction/.test(t))return "Social";return "System";}
  function label(n:N){const id=n.actor_id||followerId(n),p=id?followerProfiles[id]:null;return p?p.display_name+" followed you":n.title;}
  function detail(n:N){const id=n.actor_id||followerId(n),p=id?followerProfiles[id]:null;return p?"@"+(p.username||"member"):n.body;}
  function stamp(date:string){const diff=Math.max(0,Date.now()-new Date(date).getTime());if(diff<60000)return "now";if(diff<3600000)return Math.floor(diff/60000)+"m";if(diff<86400000)return Math.floor(diff/3600000)+"h";if(diff<604800000)return Math.floor(diff/86400000)+"d";return new Date(date).toLocaleDateString(undefined,{month:"short",day:"numeric"});}
  const now=new Date(),todayStart=new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime(),weekStart=todayStart-6*86400000;
  const visible=items.filter(n=>(filter==="All"||kind(n)===filter)&&(!unreadOnly||!n.read_at)&&(!query||[label(n),detail(n),n.type].join(" ").toLowerCase().includes(query.toLowerCase())));
  const sections=[["Today",visible.filter(n=>new Date(n.created_at).getTime()>=todayStart)],["This Week",visible.filter(n=>{const t=new Date(n.created_at).getTime();return t<todayStart&&t>=weekStart;})],["Earlier",visible.filter(n=>new Date(n.created_at).getTime()<weekStart)]] as const;
  const actorLink=(n:N)=>{const id=n.actor_id||followerId(n);return id&&/^[0-9a-f-]{36}$/i.test(id)?"/profile?member="+encodeURIComponent(id):null};
  function notificationCard(n:N){const k=kind(n),id=n.actor_id||followerId(n),p=id?followerProfiles[id]:null;const avatar=p?.avatar_url;const target=hrefFor(n);const person=actorLink(n);const isFollow=/follow/i.test(n.type);const name=p?.display_name||n.title;return <article key={n.id} className={"nmCard "+(!n.read_at?"nmUnread ":"")+(k==="Achievements"?"nmAchievement":"")}>
    {!n.read_at&&<span className="nmDot" aria-label="Unread"/>}
    {person?<Link href={person} className="nmAvatar" aria-label={`View ${name}'s profile`} onClick={()=>void markOne(n)}>{avatar?<img src={avatar} alt="" loading="lazy"/>:<span aria-hidden="true">{name.slice(0,1).toUpperCase()}</span>}</Link>:<span className="nmAvatar">{avatar?<img src={avatar} alt="" loading="lazy"/>:<span aria-hidden="true">{k==="Achievements"?"🏆":k==="Messages"?"💬":k==="Social"?"👤":"🔔"}</span>}</span>}
    <Link className="nmText" href={target} onClick={()=>void markOne(n)}><span className="nmMainLine"><strong>{isFollow&&p?p.display_name+" followed you":n.title}</strong> <time dateTime={n.created_at}>{stamp(n.created_at)}</time></span><span className="nmDetail">{isFollow&&p?"@"+(p.username||"member"):n.body}</span></Link>
    {target!=="/"&&<Link href={target} className="nmReference" aria-label="Open related content" onClick={()=>void markOne(n)}><span aria-hidden="true">{k==="Achievements"?"🏆":n.entity_type==="live_stream"?"▶":k==="Messages"?"✉":"↗"}</span></Link>}
  </article>}
  return <main className="notificationsPage"><div className="nmShell">
    <div className="nmHeading"><button type="button" className="nmBack" onClick={()=>window.history.back()} aria-label="Go back">‹</button><h1>Activity</h1><div className="nmActions"><button type="button" onClick={()=>void markAllRead()} disabled={!unread} className="nmAction" aria-label="Mark all notifications as read">✓ <span>Read all</span></button><button type="button" className="nmSettings" aria-label="Notification settings" aria-expanded={settingsOpen} onClick={()=>setSettingsOpen(v=>!v)}>⚙</button></div></div>
    <div className="nmFilters" role="group" aria-label="Filter notifications">{["All","Social","Achievements","Messages","System"].map(name=><button key={name} type="button" className={filter===name?"selected":""} aria-pressed={filter===name} onClick={()=>setFilter(name)}>{name}</button>)}</div>
    <label className="nmSearch"><span aria-hidden="true">⌕</span><input type="search" placeholder="Search activity" aria-label="Search notifications" value={query} onChange={e=>setQuery(e.target.value)}/></label>
    <div className="nmSummary"><span>{unread?unread+" unread":"All caught up"}</span><button type="button" aria-pressed={unreadOnly} onClick={()=>setUnreadOnly(v=>!v)}>{unreadOnly?"Show all":"Unread only"}</button></div>
    {settingsOpen&&<section className="nmPrefs"><h2>Notification controls</h2><p>Choose which updates also arrive by email. In-app notifications remain unchanged.</p>{categories.map(([key,name])=><label key={key}>{name}<input type="checkbox" disabled={prefsBusy||!prefsLoaded} checked={prefs[key]!==false} onChange={e=>void savePref(key,e.target.checked)}/></label>)}{prefsError&&<p role="alert" style={{color:"#bd3434",fontWeight:650}}>{prefsError}</p>}{prefsBusy&&<p role="status">Saving preferences…</p>}</section>}
    {loading?<div className="nmEmpty">Loading notifications…</div>:!visible.length?<div className="nmEmpty">No notifications to show.</div>:sections.map(([title,list])=>list.length?<section className="nmSection" key={title}><h2>{title}</h2><div className="nmList">{list.map(notificationCard)}</div></section>:null)}
  </div><style jsx global>{`
.notificationsPage{min-height:100dvh;background:#fff;color:#111;overflow-x:hidden;position:relative;isolation:isolate;z-index:1000}
.notificationsPage .nmShell{max-width:780px;margin:0 auto;padding:18px 0 calc(50px + env(safe-area-inset-bottom));font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
.notificationsPage .nmHeading{display:flex;align-items:center;gap:12px;padding:4px 20px 18px;min-height:65px}
.notificationsPage .nmHeading h1{flex:1;text-align:center;font-size:23px;letter-spacing:-.035em;font-weight:760;margin:0}
.notificationsPage .nmBack{border:0;background:none;font-size:38px;width:35px;line-height:1;color:inherit;cursor:pointer}
.notificationsPage .nmActions{display:flex;align-items:center;gap:8px}.notificationsPage .nmActions button{border:0;background:none;color:#444;cursor:pointer}.notificationsPage .nmAction{font-size:12px;font-weight:650;white-space:nowrap}.notificationsPage .nmAction:disabled{opacity:.35}.notificationsPage .nmSettings{font-size:23px}
.notificationsPage .nmFilters{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding:6px 18px 13px}.notificationsPage .nmFilters button{flex-shrink:0;border:0;border-radius:14px;background:#f0f0f2;color:#333;font-weight:650;padding:10px 15px;font-size:13px;cursor:pointer}.notificationsPage .nmFilters button.selected{background:#dff5f9;color:#13859a}
.notificationsPage .nmSearch{display:flex;align-items:center;gap:10px;margin:0 18px 12px;padding:0 14px;height:44px;border-radius:14px;background:#f2f2f3}.notificationsPage .nmSearch span{font-size:24px;color:#888}.notificationsPage .nmSearch input{flex:1;min-width:0;border:0;background:none;outline:none;font-size:14px;color:#222}
.notificationsPage .nmSummary{display:flex;justify-content:space-between;padding:0 20px 10px;color:#8b8b8b;font-size:12px}.notificationsPage .nmSummary button{border:0;background:none;color:#27879a;font-weight:650;cursor:pointer}
.notificationsPage .nmPrefs{margin:8px 18px;padding:15px;border:1px solid #e6e8ec;border-radius:14px}.notificationsPage .nmPrefs h2{margin:0 0 8px;font-size:17px}.notificationsPage .nmPrefs p{font-size:12px;color:#777}.notificationsPage .nmPrefs label{display:flex;justify-content:space-between;padding:12px 0;border-top:1px solid #eee}
.notificationsPage .nmSection{margin:0}.notificationsPage .nmSection h2{margin:0;padding:18px 22px 12px;color:#898989;font-size:15px;font-weight:600;background:#fff}.notificationsPage .nmList{display:flex;flex-direction:column;background:#fff}
.notificationsPage .nmCard{display:flex;align-items:center;gap:12px;min-height:86px;padding:13px 19px 13px 28px;position:relative;background:#fff;border-bottom:1px solid #f5f5f5;box-sizing:border-box}.notificationsPage .nmCard.nmUnread{background:#f0fbfc}.notificationsPage .nmCard.nmAchievement{background:#fcfcfa}.notificationsPage .nmDot{position:absolute;left:8px;top:50%;width:7px;height:7px;border-radius:50%;background:#16bfd4;transform:translateY(-50%)}
.notificationsPage .nmAvatar{flex:0 0 52px;width:52px;height:52px;border-radius:50%;overflow:hidden;background:#e4edf0;display:grid;place-items:center;text-decoration:none;color:#29454c;font-size:24px}.notificationsPage .nmAvatar img{display:block;width:100%;height:100%;object-fit:cover;border-radius:50%}
.notificationsPage .nmText{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;text-decoration:none;color:inherit}.notificationsPage .nmMainLine{display:block;font-size:15px;line-height:1.4;overflow-wrap:anywhere}.notificationsPage .nmMainLine strong{font-weight:700}.notificationsPage .nmMainLine time{color:#969696;font-size:12px;font-weight:400;white-space:nowrap;margin-left:5px}.notificationsPage .nmDetail{font-size:13px;line-height:1.4;color:#70777a;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.notificationsPage .nmReference{flex:0 0 48px;width:48px;height:48px;display:grid;place-items:center;border-radius:13px;background:#edf4f5;text-decoration:none;color:#267f91;font-size:23px}.notificationsPage .nmEmpty{padding:50px 20px;text-align:center;color:#888}
@media(max-width:420px){.notificationsPage .nmCard{gap:10px;padding-right:12px}.notificationsPage .nmAvatar{width:46px;height:46px;flex-basis:46px}.notificationsPage .nmReference{width:42px;height:42px;flex-basis:42px}.notificationsPage .nmMainLine{font-size:14px}.notificationsPage .nmAction span{display:none}}
@media(prefers-color-scheme:dark){html:not(.light) .notificationsPage{background:#101419;color:#f4f6f8}html:not(.light) .notificationsPage .nmSection h2,html:not(.light) .notificationsPage .nmCard,html:not(.light) .notificationsPage .nmList{background:#101419;color:#f4f6f8}html:not(.light) .notificationsPage .nmCard.nmUnread{background:#162b30}html:not(.light) .notificationsPage .nmFilters button,html:not(.light) .notificationsPage .nmSearch{background:#242a32;color:#e8edf2}html:not(.light) .notificationsPage .nmSearch input{color:#fff}html:not(.light) .notificationsPage .nmReference{background:#273944;color:#a9e5ef}}
`}</style></main>;
}
