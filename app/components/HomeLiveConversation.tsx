"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {createClient} from "../../utils/supabase/client";
type Comment={id:string;name:string;text:string;at:number};
export default function HomeLiveConversation({live,streamId,onFormatChange}:{live:boolean;streamId?:string|null;onFormatChange?:(format:"desktop"|"phone"|"audio")=>void}){
 const [comments,setComments]=useState<Comment[]>([]);
 const [draft,setDraft]=useState("");
 const [user,setUser]=useState<{id:string;name:string}|null>(null);
 const [status,setStatus]=useState("");
 const dbRef=useRef<ReturnType<typeof createClient>|null>(null);
 useEffect(()=>{const db=createClient();dbRef.current=db;let active=true;
 db.auth.getUser().then(async({data:{user:u}})=>{if(!active||!u)return;const {data}=await db.from("profiles").select("display_name,username").eq("id",u.id).maybeSingle();if(active)setUser({id:u.id,name:data?.display_name||data?.username||"Member"})}).catch(()=>{});
 return()=>{active=false}},[]);
 useEffect(()=>{
  setComments([]);setStatus("");
  if(!live||!streamId)return;
  const db=dbRef.current||createClient();
  let active=true;
  void db.from("live_chat_messages").select("id,body,sender_id,created_at").eq("stream_id",streamId).order("created_at",{ascending:true}).limit(60).then(({data,error})=>{if(!active)return;if(error){setStatus("Live comments are unavailable until chat setup is complete.");return}setComments((data||[]).map(message=>({id:message.id,name:message.sender_id===user?.id?user?.name||"Member":"Member",text:message.body,at:new Date(message.created_at).getTime()})))});
  const channel=db.channel("live-chat:"+streamId).on("postgres_changes",{event:"INSERT",schema:"public",table:"live_chat_messages",filter:"stream_id=eq."+streamId},payload=>{const message=payload.new as {id?:string;body?:string;sender_id?:string;created_at?:string};if(typeof message.id!=="string"||typeof message.body!=="string")return;const id=message.id,body=message.body;setComments(previous=>previous.some(comment=>comment.id===id)?previous:[...previous,{id,name:message.sender_id===user?.id?user?.name||"Member":"Member",text:body,at:message.created_at?new Date(message.created_at).getTime():Date.now()}].slice(-60))}).subscribe(state=>{if(state==="CHANNEL_ERROR"||state==="TIMED_OUT")setStatus("Live comments temporarily unavailable")});
  return()=>{active=false;void db.removeChannel(channel)};
 },[live,streamId,user]);
 const send=async(e:React.FormEvent)=>{e.preventDefault();const text=draft.trim();if(!text)return;
  if(!live||!streamId){setStatus("Comments are available only during an active stream.");return}
  if(!user){setStatus("Sign in to comment on an active livestream.");return}
  try{const {error}=await (dbRef.current||createClient()).from("live_chat_messages").insert({stream_id:streamId,sender_id:user.id,body:text});if(error)throw error;setDraft("");setStatus("")}
  catch{setStatus("Could not send comment. Try again.")}};
 return <section className="homeLiveViewerConversation" aria-label="Live conversation">
  <header><strong>💬 LIVE CONVERSATION</strong><small>1Muslim · {live?"Live room":"Waiting for a stream"}</small></header>
  <div className="homeLiveDemoComments" aria-live="polite">{comments.length?comments.map(c=><p key={c.id}><span className="homeLiveCommentAvatar">{c.name.slice(0,1).toUpperCase()}</span><span><strong>{c.name}</strong><small>{c.text}</small></span></p>):<p>{live?"Be the first to comment in this live room." :"Comments appear when a real stream is active."}</p>}</div>
  <form className="homeLiveCommentForm" onSubmit={send}><input aria-label="Write a live comment" value={draft} onChange={e=>setDraft(e.target.value)} maxLength={500} placeholder={live?"Comment on this livestream…" :"Waiting for an active stream…"}/><button type="submit" disabled={!live||!streamId||!user||!draft.trim()}>Send</button></form>
  {status&&<small role="status" className="homeLiveCommentDisclaimer">{status}</small>}
  <small className="homeLiveCommentDisclaimer">Persistent live chat · visible to signed-in viewers of this stream</small>
  {live&&streamId?<Link className="homeLiveStudioEntry" href={`/streaming/live/${streamId}`}>Open Live Studio ↗</Link>:<Link className="homeLiveStudioEntry" href="/streaming/go-live">Start your own Live ↗</Link>}
 </section>;
}
