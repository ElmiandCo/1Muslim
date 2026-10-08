"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../../utils/supabase/client";
type Thread = { conversation_id:string; user_id:string };
type Message = {id:string;conversation_id:string;sender_id:string;body:string;created_at:string};
export default function MessagesPage(){
 const [client] = useState(()=>createClient());
 const [uid,setUid]=useState<string|null>(null);
 const [threads,setThreads]=useState<Thread[]>([]);
 const [selected,setSelected]=useState<string|null>(null);
 const [messages,setMessages]=useState<Message[]>([]);
 const [draft,setDraft]=useState("");
 const [status,setStatus]=useState<{request_status:string;requested_by:string}|null>(null);
 const [recipient,setRecipient]=useState("");
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 useEffect(()=>{let active=true;client.auth.getUser().then(({data})=>{if(active)setUid(data.user?.id??null)});return()=>{active=false}},[client]);
 useEffect(()=>{if(!uid)return;let active=true;
 const load=async()=>{const {data,error}=await client.from("dm_participants").select("conversation_id,user_id").order("joined_at",{ascending:false});if(active){if(error)setError(error.message);else setThreads((data??[]).filter(p=>p.user_id!==uid))}};
 load();return()=>{active=false};
 },[client,uid]);
 useEffect(()=>{if(!selected)return;let active=true;
 client.from("dm_conversations").select("request_status,requested_by").eq("id",selected).single().then(({data})=>{if(active)setStatus(data)});
 const load=async()=>{const {data,error}=await client.from("dm_messages").select("id,conversation_id,sender_id,body,created_at").eq("conversation_id",selected).is("deleted_at",null).order("created_at",{ascending:true}).limit(200);if(active){if(error)setError(error.message);else setMessages(data??[])}};
 load();
 const channel=client.channel("dm:"+selected).on("postgres_changes",{event:"INSERT",schema:"public",table:"dm_messages",filter:"conversation_id=eq."+selected},()=>{void load()}).subscribe();
 return()=>{active=false;void client.removeChannel(channel)};
 },[client,selected]);
 async function start(){setError("");setBusy(true);try{const {data,error}=await client.rpc("dm_start_conversation",{other_user:recipient.trim()});if(error)throw error;setSelected(data);setStatus(null);setRecipient("");const {data:rows}=await client.from("dm_participants").select("conversation_id,user_id");setThreads((rows??[]).filter(p=>p.user_id!==uid));}catch(e){setError(e instanceof Error?e.message:"Unable to start conversation")}finally{setBusy(false)}}
 async function accept(){if(!selected)return;setBusy(true);const {error}=await client.rpc("dm_accept_conversation",{cid:selected});if(error)setError(error.message);else setStatus(s=>s?{...s,request_status:"accepted"}:s);setBusy(false)}
 async function send(e:React.FormEvent){e.preventDefault();if(!selected||!uid||!draft.trim()||busy)return;setBusy(true);setError("");const body=draft.trim();const {error}=await client.from("dm_messages").insert({conversation_id:selected,sender_id:uid,body});if(error)setError(error.message);else{setDraft("");const {data}=await client.from("dm_messages").select("id,conversation_id,sender_id,body,created_at").eq("conversation_id",selected).order("created_at",{ascending:true}).limit(200);setMessages(data??[])}setBusy(false)}
 if(!uid)return <main style={{padding:32,maxWidth:720,margin:"auto"}}><h1>Messages</h1><p>Sign in to access private conversations.</p><Link href="/auth">Sign in →</Link></main>;
 return <main style={{maxWidth:1150,margin:"30px auto",padding:"0 16px",color:"var(--text,#f4f4f5)"}}>
 <Link href="/">← Home</Link><h1 style={{fontSize:32,margin:"18px 0"}}>Messages</h1>
 <div style={{display:"grid",gridTemplateColumns:"minmax(220px,1fr) minmax(0,2fr)",minHeight:560,border:"1px solid #64748b55",borderRadius:18,overflow:"hidden"}}>
 <aside style={{padding:18,borderRight:"1px solid #64748b55"}}>
 <h2 style={{fontSize:18}}>Conversations</h2><label htmlFor="recipient">Start a conversation (user ID)</label>
 <input id="recipient" value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="Recipient UUID" style={{width:"100%",padding:12,margin:"10px 0",borderRadius:10,color:"#111"}}/>
 <button disabled={busy||!recipient.trim()} onClick={start} style={{padding:10,borderRadius:10}}>New conversation</button>
 <div style={{marginTop:20}}>{Array.from(new Set(threads.map(t=>t.conversation_id))).map(cid=><button key={cid} onClick={()=>setSelected(cid)} style={{display:"block",width:"100%",padding:14,marginBottom:8,textAlign:"left",borderRadius:12,background:selected===cid?"#155e75":"#334155",color:"white"}}>💬 {threads.find(t=>t.conversation_id===cid)?.user_id.slice(0,8)}…</button>)}</div>
 </aside><section style={{display:"flex",flexDirection:"column",minWidth:0}}>
 <header style={{padding:18,borderBottom:"1px solid #64748b55"}}>{selected?"Private conversation":"Choose a conversation"}</header>
 <div aria-live="polite" style={{flex:1,padding:20,overflowY:"auto",maxHeight:480}}>{messages.filter(m=>m.conversation_id===selected).map(m=><div key={m.id} style={{margin:"10px 0",textAlign:m.sender_id===uid?"right":"left"}}><span style={{display:"inline-block",padding:"12px 16px",borderRadius:16,maxWidth:"85%",overflowWrap:"anywhere",background:m.sender_id===uid?"#0e7490":"#334155",color:"white"}}>{m.body}</span></div>)}</div>
 {selected&&status?.request_status==="pending"&&<div style={{padding:16}}>{status.requested_by===uid?"Message request pending acceptance.":"This person wants to connect."}{status.requested_by!==uid&&<button onClick={accept} disabled={busy} style={{marginLeft:12,padding:10}}>Accept request</button>}</div>}
 {selected&&status?.request_status==="accepted"&&<form onSubmit={send} style={{display:"flex",padding:12,gap:8}}><input aria-label="Message" maxLength={4000} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Write a message…" style={{flex:1,minWidth:0,padding:12,borderRadius:12,color:"#111"}}/><button disabled={busy||!draft.trim()} type="submit" style={{padding:"10px 18px",borderRadius:12}}>Send</button></form>}
 </section></div>{error&&<p role="alert" style={{color:"#f87171"}}>{error}</p>}
 <p style={{opacity:.7,fontSize:13}}>Messaging foundation preview. Recipient discovery, message requests, blocking, and media arrive in later stages.</p>
 <style jsx>{`@media(max-width:600px){main>div{grid-template-columns:1fr!important}aside{border-right:0!important;border-bottom:1px solid #64748b55}}`}</style>
 </main>
}