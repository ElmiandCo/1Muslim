"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {createClient} from "../../utils/supabase/client";
import QuickConnect from "./QuickConnect";
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
 return <section className="homeLiveViewerConversation" aria-label="Live conversation"><QuickConnect/>
  <header><strong>💬 LIVE CONVERSATION</strong><small>1Muslim · {live?"Live room":"Waiting for a stream"}</small></header>
  <div className="homeLiveDemoComments" aria-live="polite">{comments.length?comments.map(c=><p key={c.id}><span className="homeLiveCommentAvatar">{c.name.slice(0,1).toUpperCase()}</span><span><strong>{c.name}</strong><small>{c.text}</small></span></p>):<p>{live?"Be the first to comment in this live room.":"Comments appear when someone goes live."}</p>}</div>
  <form className="homeLiveCommentForm" onSubmit={send}><input aria-label="Write a live comment" value={draft} onChange={e=>setDraft(e.target.value)} maxLength={280} disabled={!live||!roomName||!user} placeholder={!user?"Sign in to comment":live?"Comment on this livestream…":"Waiting for a live…"}/><button type="submit" disabled={!draft.trim()||!user||!live||!roomName}>Send</button></form>
  {status&&<small role="status" className="homeLiveCommentDisclaimer">{status}</small>}
  <small className="homeLiveCommentDisclaimer">Real-time room comments · visible to viewers connected to this homepage room</small>
  {live&&roomName?<Link className="homeLiveStudioEntry" href="/live">Open Live Studio ↗</Link>:<Link className="homeLiveStudioEntry" href="/streaming/go-live">Start your own Live ↗</Link>}
 </section>;
}
