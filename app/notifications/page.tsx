"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SiteNav from "../components/SiteNav";
import { createClient } from "../../utils/supabase/client";

type N={id:string;type:string;title:string;body:string;entity_type:string|null;entity_id:string|null;read_at:string|null;created_at:string;};

function hrefFor(n:N){if(n.entity_type==="live_stream"&&n.entity_id)return `/streaming/live/${n.entity_id}`;if(n.entity_type==="live_schedule"&&n.entity_id)return "/streaming/scheduled";if((n.entity_type==="dm_message"||n.entity_type==="message")&&n.entity_id&&/^[0-9a-f-]{36}$/i.test(n.entity_id))return "/messages?message="+encodeURIComponent(n.entity_id);if((n.entity_type==="dm_conversation"||n.entity_type==="conversation")&&n.entity_id&&/^[0-9a-f-]{36}$/i.test(n.entity_id))return "/messages?conversation="+encodeURIComponent(n.entity_id);if(n.entity_type==="featured_video_comment"&&n.entity_id&&/^[0-9a-f-]{36}$/i.test(n.entity_id))return "/?comment="+encodeURIComponent(n.entity_id)+"#featured-video-comments";return "/";}

export default function NotificationsPage(){
  const [items,setItems]=useState<N[]>([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{(async()=>{const s=createClient();const {data:{user}}=await s.auth.getUser();if(!user){setLoading(false);return;}const {data}=await s.from("notifications").select("id,type,title,body,entity_type,entity_id,read_at,created_at").order("created_at",{ascending:false}).limit(60);setItems((data??[]) as N[]);setLoading(false);await s.from("notifications").update({read_at:new Date().toISOString()}).eq("recipient_id",user.id).is("read_at",null);})();},[]);
  return <main className="notificationsPage"><SiteNav/><div className="notificationsShell"><div className="notificationsHero"><span className="eyebrow">1MUSLIM · NOTIFICATIONS</span><h1>Stay in the loop.</h1><p>Messages, Lives, schedule changes and activity that matters to you.</p></div>{loading?<div className="empty">Loading notifications…</div>:!items.length?<div className="empty">You're all caught up.</div>:<div className="notificationList">{items.map(n=><Link href={hrefFor(n)} className={"notificationRow "+(!n.read_at?"unread":"")} key={n.id}><span className="notificationIcon">{n.type.startsWith("live")?"🔴":"🔔"}</span><span><strong>{n.title}</strong><small>{n.body}</small><em>{new Date(n.created_at).toLocaleString()}</em></span></Link>)}</div>}</div><style jsx>{`
.notificationsPage{min-height:100vh;background:var(--bg);color:var(--text)}.notificationsShell{max-width:820px;margin:auto;padding:38px 18px 90px}.notificationsHero{padding:20px 0 28px;border-bottom:1px solid var(--line)}.eyebrow{font-size:9px;letter-spacing:.16em;color:#8ca48d;font-weight:900}.notificationsHero h1{font-size:42px;letter-spacing:-.06em;margin:8px 0}.notificationsHero p{color:var(--muted);font-size:12px}.notificationList{margin-top:16px;display:grid;gap:8px}.notificationRow{display:flex;gap:13px;padding:15px;border:1px solid var(--line);border-radius:17px;background:var(--panel2);text-decoration:none;color:inherit}.notificationRow.unread{border-color:#60765c}.notificationIcon{width:34px;height:34px;border-radius:11px;background:var(--panel);display:grid;place-items:center;flex:0 0 auto}.notificationRow span:last-child{display:grid;gap:4px}.notificationRow strong{font-size:12px}.notificationRow small{font-size:11px;color:var(--muted);line-height:1.45}.notificationRow em{font-size:9px;color:#69776e;font-style:normal}.empty{margin-top:18px;padding:40px;border:1px dashed var(--line);border-radius:18px;color:var(--muted);text-align:center}
`}</style></main>;
}
