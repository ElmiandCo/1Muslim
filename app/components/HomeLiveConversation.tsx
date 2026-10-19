"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {createClient} from "../../utils/supabase/client";
type Comment={id:string;name:string;text:string;at:number};
export default function HomeLiveConversation({live,roomName}:{live:boolean;roomName?:string|null}){
 const [comments,setComments]=useState<Comment[]>([]);
 const [draft,setDraft]=useState("");
 const [user,setUser]=useState<{id:string;name:string}|null>(null);
 const [status,setStatus]=useState("");
 const dbRef=useRef<ReturnType<typeof createClient>|null>(null);
 const channelRef=useRef<ReturnType<ReturnType<typeof createClient>["channel"]>|null>(null);
 useEffect(()=>{const db=createClient();dbRef.current=db;let active=true;
 db.auth.getUser().then(async({data:{user:u}})=>{if(!active||!u)return;const {data}=await db.from("profiles").select("display_name,username").eq("id",u.id).maybeSingle();if(active)setUser({id:u.id,name:data?.display_name||data?.username||"Member"})}).catch(()=>{});
 return()=>{active=false}},[]);
 useEffect(()=>{
  setComments([]);setStatus("");
  if(!live||!roomName)return;
  const db=dbRef.current||createClient();
  const channel=db.channel("live-comments:"+roomName,{config:{broadcast:{self:true}}});
  channelRef.current=channel;
  channel.on("broadcast",{event:"comment"},({payload})=>{
   if(typeof payload?.id!=="string"||typeof payload?.text!=="string"||typeof payload?.name!=="string")return;
   const c:Comment={id:payload.id,name:payload.name.slice(0,48),text:payload.text.slice(0,280),at:Date.now()};
   setComments(prev=>prev.some(p=>p.id===c.id)?prev:[...prev,c].slice(-60));
  }).subscribe(state=>{if(state==="SUBSCRIBED")setStatus("");else if(state==="CHANNEL_ERROR"||state==="TIMED_OUT")setStatus("Live comments temporarily unavailable")});
  return()=>{channelRef.current=null;void db.removeChannel(channel)};
 },[live,roomName]);
 const send=async(e:React.FormEvent)=>{e.preventDefault();const text=draft.trim();if(!text||!user||!live||!roomName)return;
  const channel=channelRef.current;if(!channel)return;
  const payload={id:crypto.randomUUID(),name:user.name,text};
  try{const result=await channel.send({type:"broadcast",event:"comment",payload});if(result!=="ok")throw Error("Send failed");setDraft("");setStatus("")}
  catch{setStatus("Could not send comment. Try again.")}};
 return <section className="homeLiveViewerConversation" aria-label="Live conversation">
  <header><strong>💬 LIVE CONVERSATION</strong><small>1Muslim · {live?"Live room":"Waiting for a stream"}</small></header>
  <div className="homeLiveDemoComments" aria-live="polite">{comments.length?comments.map(c=><p key={c.id} className="chatBubble"><span className="homeLiveCommentAvatar">{c.name.slice(0,1).toUpperCase()}</span><span><strong>{c.name}</strong><small>{c.text}</small></span></p>):<p className="chatEmpty">{live?"Say salaam 👋 Be the first to join the conversation.":"💬 Live comments will appear here when a stream begins."}</p>}</div>
  <form className="homeLiveCommentForm" onSubmit={send}><input aria-label="Write a live comment" value={draft} onChange={e=>setDraft(e.target.value)} maxLength={280} disabled={!live||!roomName||!user} placeholder={!user?"Sign in to join the conversation":live?"Say something kind…":"Comments open when Live starts"}/><button type="submit" disabled={!draft.trim()||!user||!live||!roomName} aria-label="Send comment">➤</button></form>
  {status&&<small role="status" className="homeLiveCommentDisclaimer">{status}</small>}

  {live&&roomName?<Link className="homeLiveStudioEntry" href="/live">Open Live Studio ↗</Link>:<Link className="homeLiveStudioEntry" href="/streaming/go-live">Start your own Live ↗</Link>}
 <style jsx>{`\n .homeLiveViewerConversation{display:flex;flex-direction:column;gap:12px;min-height:210px;padding:16px!important;border-radius:24px!important;background:linear-gradient(160deg,rgba(5,32,25,.72),rgba(4,21,18,.54))!important;backdrop-filter:blur(22px);border:1px solid rgba(211,186,119,.24)!important;box-shadow:inset 0 1px rgba(255,255,255,.08)}\n .chatTop{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 2px}.chatTop strong{font-size:12px;letter-spacing:.13em;color:#f5ebd4}.chatTop i{display:inline-block;width:7px;height:7px;background:#43dba1;border-radius:50%;margin-right:6px;box-shadow:0 0 10px #43dba1}.chatTop small{font-size:10px;color:#a5c9b9}\n .homeLiveDemoComments{min-height:80px;max-height:230px;overflow-y:auto;display:flex;flex-direction:column;gap:9px;scrollbar-width:thin}.chatEmpty{font-size:13px;color:#b7cfc3;line-height:1.5;text-align:center;margin:auto;padding:16px 10px}.chatBubble{display:flex;align-items:flex-start;gap:8px;margin:0;padding:5px 0}.chatBubble :global(.homeLiveCommentAvatar){display:grid;place-items:center;flex:none;width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#127955,#d0a956);color:#fff;font-weight:700}.chatBubble>span:last-child{display:flex;flex-direction:column;gap:3px}.chatBubble strong{font-size:12px;color:#e4c98f}.chatBubble small{font-size:13px;line-height:1.4;color:#fff}\n .homeLiveCommentForm{display:flex!important;flex-direction:row!important;align-items:center;gap:8px!important;padding:5px!important;border:1px solid rgba(196,226,203,.23);border-radius:999px!important;background:rgba(0,15,12,.45)}.homeLiveCommentForm input{flex:1;min-width:0;height:40px!important;border:0!important;outline:0;background:transparent!important;padding:0 13px!important;color:#fff;font-size:13px}.homeLiveCommentForm button{flex:none;width:40px;height:40px;border-radius:50%!important;border:0!important;background:#0bb778!important;color:#fff;font-size:20px;display:grid;place-items:center;padding:0!important}.homeLiveCommentForm button:disabled{opacity:.35}.homeLiveStudioEntry{align-self:flex-end;font-size:12px;color:#e7d49f;text-decoration:none;padding:3px 4px}.homeLiveCommentDisclaimer{font-size:11px;color:#e6bd8c}\n `}</style>\n </section>;
}
