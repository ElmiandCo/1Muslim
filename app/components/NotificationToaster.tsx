"use client";

import Link from "next/link";
import {useEffect,useRef,useState} from "react";
import {createClient} from "../../utils/supabase/client";

type Notice={id:string;type:string;title:string;body:string;entity_type:string|null;entity_id:string|null;actor_id?:string|null;created_at:string};
const uuid=(value:string|null)=>!!value&&/^[0-9a-f-]{36}$/i.test(value);
function destination(n:Notice){
  if(n.entity_type==="live_stream"&&n.entity_id)return "/streaming/live/"+encodeURIComponent(n.entity_id);
  if(n.entity_type==="live_schedule")return "/streaming/scheduled";
  if(["dm_message","message"].includes(n.entity_type||"")&&uuid(n.entity_id))return "/messages?message="+encodeURIComponent(n.entity_id!);
  if(["dm_conversation","conversation"].includes(n.entity_type||"")&&uuid(n.entity_id))return "/messages?conversation="+encodeURIComponent(n.entity_id!);
  if(["follow","follower","user_follow","profile","user","member"].includes(n.entity_type||"")&&uuid(n.actor_id||n.entity_id))return "/profile/"+encodeURIComponent((n.actor_id||n.entity_id)!);
  return "/notifications";
}
function icon(n:Notice){const t=n.type.toLowerCase();return t.includes("follow")?"👤":t.includes("message")||t.includes("dm")?"✉️":t.includes("like")?"♡":t.includes("share")?"↗":t.includes("live")?"🔴":"🔔"}

export default function NotificationToaster(){
  const [items,setItems]=useState<Notice[]>([]);
  const [collapsed,setCollapsed]=useState<Record<string,boolean>>({});
  const [flash,setFlash]=useState(false);
  const seen=useRef(new Set<string>());
  const uid=useRef<string|null>(null);
  const db=useRef(createClient());
  const add=(incoming:Notice[])=>{const fresh=incoming.filter(n=>{if(seen.current.has(n.id))return false;seen.current.add(n.id);return true});if(fresh.length)setItems(prev=>[...prev,...fresh].sort((a,b)=>a.created_at.localeCompare(b.created_at)).slice(-80))};
  const mark=async(ids:string[])=>{if(!uid.current||!ids.length)return;await db.current.from("notifications").update({read_at:new Date().toISOString()}).eq("recipient_id",uid.current).in("id",ids)};
  const dismiss=(id:string)=>{setItems(prev=>prev.filter(n=>n.id!==id));void mark([id])};
  const closeAll=()=>{const ids=items.map(n=>n.id);setItems([]);void mark(ids)};
  useEffect(()=>{
    if(!items.length)return;
    setFlash(true);
    const timer=window.setTimeout(()=>setFlash(false),1500);
    return()=>window.clearTimeout(timer);
  },[items.length>0]);
  useEffect(()=>{
    const s=db.current;let alive=true;let channel:ReturnType<typeof s.channel>|null=null;
    const load=async()=>{
      if(!uid.current)return;
      const {data}=await s.from("notifications").select("id,type,title,body,entity_type,entity_id,actor_id,created_at").eq("recipient_id",uid.current).is("read_at",null).order("created_at",{ascending:true}).limit(80);
      if(alive&&data)add(data as Notice[]);
    };
    void (async()=>{
      const {data:{user}}=await s.auth.getUser();
      if(!alive||!user)return;
      uid.current=user.id;
      await load();
      if(!alive)return;
      channel=s.channel("one-muslim-live-notices-"+user.id).on("postgres_changes",{event:"INSERT",schema:"public",table:"notifications",filter:"recipient_id=eq."+user.id},payload=>{if(alive)add([payload.new as Notice])}).subscribe();
    })();
    const timer=window.setInterval(()=>{if(document.visibilityState==="visible")void load()},5000);
    const focus=()=>void load();
    window.addEventListener("focus",focus);
    document.addEventListener("visibilitychange",focus);
    return()=>{alive=false;window.clearInterval(timer);window.removeEventListener("focus",focus);document.removeEventListener("visibilitychange",focus);if(channel)void s.removeChannel(channel)};
  },[]);
  if(!items.length)return null;
  return <div className="omNoticePortal" aria-label="Recent notifications">
    {flash&&<div className="omNoticeBlur" aria-hidden="true"/>}
    <div className="omNoticeStack" aria-live="polite" aria-relevant="additions">
      <div className="omNoticeTop"><span>{items.length} notification{items.length===1?"":"s"}</span><button type="button" aria-label="Close all notifications" onClick={closeAll}>×</button></div>
      <div className="omNoticeScroll">
        {items.map(n=><article key={n.id} className="omNoticeCard">
          <span className="omNoticeIcon" aria-hidden="true">{icon(n)}</span>
          <div className="omNoticeContent"><Link href={destination(n)} onClick={()=>dismiss(n.id)}><strong>{n.title}</strong></Link>{!collapsed[n.id]&&<p>{n.body}</p>}</div>
          <button type="button" className="omNoticeToggle" aria-label={collapsed[n.id]?"Expand notification":"Collapse notification"} aria-expanded={!collapsed[n.id]} onClick={()=>setCollapsed(prev=>({...prev,[n.id]:!prev[n.id]}))}>{collapsed[n.id]?"⌄":"⌃"}</button>
          <button type="button" className="omNoticeDismiss" aria-label="Dismiss notification" onClick={()=>dismiss(n.id)}>×</button>
        </article>)}
      </div>
    </div>
    <style jsx global>{`
      .omNoticePortal{position:fixed;inset:0;z-index:10020;pointer-events:none}
      .omNoticeBlur{position:absolute;inset:0;background:rgba(4,7,16,.10);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);animation:omNoticeBlurPulse 1.5s ease both}
      @keyframes omNoticeBlurPulse{0%,100%{opacity:0}20%,75%{opacity:1}}
      .omNoticeStack{position:absolute;top:max(8px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);width:min(450px,calc(100vw - 20px));max-height:25dvh;display:flex;flex-direction:column;gap:4px;pointer-events:auto;color:var(--theme-text,#f7f5ff)}
      .omNoticeTop{display:flex;justify-content:space-between;align-items:center;flex:0 0 auto;padding:3px 9px;border-radius:10px;border:1px solid color-mix(in srgb,var(--theme-border,#b3a5d2) 35%,transparent);background:color-mix(in srgb,var(--theme-panel,#151520) 32%,transparent);backdrop-filter:blur(16px);font-size:10px;letter-spacing:.05em}
      .omNoticeTop button{border:0;background:none;color:inherit;font-size:21px;cursor:pointer}
      .omNoticeScroll{overflow-y:auto;overscroll-behavior:contain;display:flex;flex-direction:column;gap:5px;min-height:0;scrollbar-width:thin}
      .omNoticeCard{display:flex;align-items:flex-start;gap:8px;padding:7px 9px;border:1px solid color-mix(in srgb,var(--theme-border,#b3a5d2) 45%,transparent);border-radius:12px;background:color-mix(in srgb,var(--theme-panel,#101322) 34%,transparent);backdrop-filter:blur(17px);-webkit-backdrop-filter:blur(17px);box-shadow:0 5px 22px #0003;animation:omNoticeEnter .25s ease-out both}
      .omNoticeIcon{font-size:15px}.omNoticeContent{flex:1;min-width:0}.omNoticeContent a{color:inherit;text-decoration:none}.omNoticeContent strong{font-size:11px}.omNoticeContent p{margin:3px 0 0;font-size:10px;line-height:1.35;opacity:.85;overflow-wrap:anywhere}
      .omNoticeToggle,.omNoticeDismiss{background:transparent;color:inherit;border:0;padding:0 3px;font-size:16px;cursor:pointer}
      @keyframes omNoticeEnter{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
      @media(prefers-reduced-motion:reduce){.omNoticeCard,.omNoticeBlur{animation:none}}
    `}</style>
  </div>;
}
