"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";

import { createClient } from "../../utils/supabase/client";
type Thread = { conversation_id:string; user_id:string };
type Message = {id:string;conversation_id:string;sender_id:string;body:string;created_at:string;attachment_path:string|null;attachment_type:string|null;reply_to_id:string|null};
type Reaction={message_id:string;user_id:string;emoji:string};
export default function MessagesPage(){
 const [client] = useState(()=>createClient());
 const [uid,setUid]=useState<string|null>(null);
 const [threads,setThreads]=useState<Thread[]>([]);
 const [names,setNames]=useState<Record<string,string>>({});
 const [search,setSearch]=useState("");
 const [people,setPeople]=useState<{id:string;display_name:string;username:string|null}[]>([]);
 const [selected,setSelected]=useState<string|null>(null);
 const [messages,setMessages]=useState<Message[]>([]);
 const [draft,setDraft]=useState("");
 const [replyTo,setReplyTo]=useState<Message|null>(null);
 const [reactions,setReactions]=useState<Reaction[]>([]);
 const [mediaUrls,setMediaUrls]=useState<Record<string,string>>({});
 const recorder=useRef<MediaRecorder|null>(null);
 const chunks=useRef<Blob[]>([]);
 const [recording,setRecording]=useState(false);
 const [status,setStatus]=useState<{request_status:string;requested_by:string}|null>(null);
 const [recipient,setRecipient]=useState("");
 const [initialRecipient,setInitialRecipient]=useState<string|null>(null);
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 const [blocked,setBlocked]=useState<string[]>([]);
 const [allowRequests,setAllowRequests]=useState(true);
 const [reportReason,setReportReason]=useState("spam");
 const [reportDetails,setReportDetails]=useState("");
 const [showReport,setShowReport]=useState(false);
 const [notice,setNotice]=useState("");
 const [translateTo,setTranslateTo]=useState("off");
 const [aiAssistance,setAiAssistance]=useState(false);
 const [badges,setBadges]=useState<{badge_key:string;badge_name:string}[]>([]);
 const [loadingAuth,setLoadingAuth]=useState(true);
 const [peerOnline,setPeerOnline]=useState(false);
 const [peerTyping,setPeerTyping]=useState(false);
 const [peerReadAt,setPeerReadAt]=useState<string|null>(null);
 const [typingChannel,setTypingChannel]=useState<ReturnType<typeof client.channel>|null>(null);
 useEffect(()=>{const to=new URLSearchParams(window.location.search).get("to");if(to&&/^[0-9a-f-]{36}$/i.test(to)){setRecipient(to);setInitialRecipient(to)}},[]);
 useEffect(()=>{let active=true;client.auth.getUser().then(({data})=>{if(active){setUid(data.user?.id??null);setLoadingAuth(false)}});return()=>{active=false}},[client]);
 useEffect(()=>{if(!uid)return;let active=true;
 void client.from("dm_blocks").select("blocked_id").eq("blocker_id",uid).then(({data})=>{if(active)setBlocked((data??[]).map(x=>x.blocked_id))});
 void client.from("dm_privacy").select("allow_requests").eq("user_id",uid).maybeSingle().then(({data})=>{if(active&&data)setAllowRequests(data.allow_requests)});
 void client.from("dm_preferences").select("translate_to,ai_assistance").eq("user_id",uid).maybeSingle().then(({data})=>{if(active&&data){setTranslateTo(data.translate_to);setAiAssistance(data.ai_assistance)}});
 void client.rpc("dm_my_badges").then(({data})=>{if(active)setBadges(data??[])});
 return()=>{active=false}},[client,uid]);
 useEffect(()=>{if(!uid)return;let active=true;
 const load=async()=>{const {data,error}=await client.from("dm_participants").select("conversation_id,user_id").order("joined_at",{ascending:false});if(active){if(error)setError(error.message);else {const peers=(data??[]).filter(p=>p.user_id!==uid);setThreads(peers);const ids=[...new Set(peers.map(p=>p.user_id))];if(ids.length){const {data:profiles}=await client.from("profiles").select("id,display_name,username").in("id",ids);if(active)setNames(Object.fromEntries((profiles??[]).map(p=>[p.id,p.display_name||p.username||"Member"])))}}}};
 load();const timer=window.setInterval(()=>{void load()},5000);return()=>{active=false;window.clearInterval(timer)};
 },[client,uid]);
 useEffect(()=>{if(!selected)return;let active=true;setMessages([]);setReactions([]);setMediaUrls({});setReplyTo(null);setStatus(null);
 const loadStatus=async()=>{const {data}=await client.from("dm_conversations").select("request_status,requested_by").eq("id",selected).single();if(active)setStatus(data)};void loadStatus();const statusTimer=window.setInterval(()=>{void loadStatus()},5000);
 const markRead=async()=>{if(!uid)return;await client.from("dm_participants").update({last_read_at:new Date().toISOString()}).eq("conversation_id",selected).eq("user_id",uid)};
 const loadPeerRead=async()=>{const {data}=await client.from("dm_participants").select("user_id,last_read_at").eq("conversation_id",selected);if(active)setPeerReadAt(data?.find(p=>p.user_id!==uid)?.last_read_at??null)};
 void markRead();void loadPeerRead();
 const readTimer=window.setInterval(()=>{void loadPeerRead()},4000);
 const presence=client.channel("dm-presence:"+selected,{config:{presence:{key:uid??"anonymous"}}});
 presence.on("presence",{event:"sync"},()=>{const state=presence.presenceState();setPeerOnline(Object.keys(state).some(key=>key!==uid))});
 presence.on("broadcast",{event:"typing"},({payload})=>{if(payload.user_id!==uid){setPeerTyping(!!payload.typing);if(payload.typing)window.setTimeout(()=>setPeerTyping(false),3500)}});
 presence.subscribe(async state=>{if(state==="SUBSCRIBED"&&uid)await presence.track({user_id:uid,online_at:new Date().toISOString()})});
 setTypingChannel(presence);

 const load=async()=>{const {data,error}=await client.from("dm_messages").select("id,conversation_id,sender_id,body,created_at,attachment_path,attachment_type,reply_to_id").eq("conversation_id",selected).is("deleted_at",null).order("created_at",{ascending:true}).limit(200);if(active){if(error)setError(error.message);else {setMessages(data??[]);void markRead();
 const ids=(data??[]).map(m=>m.id);
 if(ids.length){const {data:rx}=await client.from("dm_reactions").select("message_id,user_id,emoji").in("message_id",ids);if(active)setReactions(rx??[])}
 const paths=(data??[]).filter(m=>m.attachment_path).map(m=>m.attachment_path as string);
 if(paths.length){const {data:urls}=await client.storage.from("dm-attachments").createSignedUrls(paths,3600);if(active&&urls)setMediaUrls(Object.fromEntries(urls.filter(u=>u.signedUrl).map(u=>[u.path!,u.signedUrl!])));}
}}};
 load();
 const reactionsChannel=client.channel("dm-reactions:"+selected).on("postgres_changes",{event:"*",schema:"public",table:"dm_reactions"},()=>{void load()}).subscribe();
 const channel=client.channel("dm:"+selected).on("postgres_changes",{event:"INSERT",schema:"public",table:"dm_messages",filter:"conversation_id=eq."+selected},()=>{void load()}).subscribe();
 return()=>{active=false;window.clearInterval(statusTimer);window.clearInterval(readTimer);void client.removeChannel(presence);void client.removeChannel(reactionsChannel);void client.removeChannel(channel)};
 },[client,selected]);
 useEffect(()=>{if(!uid||!initialRecipient||initialRecipient===uid)return;let canceled=false;
 const open=async()=>{const {data,error}=await client.rpc("dm_start_conversation",{other_user:initialRecipient});if(!canceled){if(error)setError(error.message);else if(data){setSelected(data);setRecipient("")}setInitialRecipient(null)}};
 void open();return()=>{canceled=true}
 },[client,uid,initialRecipient]);
 useEffect(()=>{if(!uid||search.trim().length<2){setPeople([]);return}let active=true;const timer=setTimeout(async()=>{const q=search.trim().replace(/[%_,]/g,"");const {data}=await client.from("profiles").select("id,display_name,username").or(`display_name.ilike.%${q}%,username.ilike.%${q}%`).neq("id",uid).limit(8);if(active)setPeople(data??[])},350);return()=>{active=false;clearTimeout(timer)}},[client,uid,search]);
 const peerId=threads.find(t=>t.conversation_id===selected)?.user_id;
 async function toggleBlock(){if(!uid||!peerId)return;const wasBlocked=blocked.includes(peerId);const {error}=wasBlocked?await client.from("dm_blocks").delete().eq("blocker_id",uid).eq("blocked_id",peerId):await client.from("dm_blocks").insert({blocker_id:uid,blocked_id:peerId});if(error)setError(error.message);else{setBlocked(v=>wasBlocked?v.filter(x=>x!==peerId):[...v,peerId]);setNotice(wasBlocked?"Member unblocked":"Member blocked")}}
 async function savePrivacy(next:boolean){if(!uid)return;const {error}=await client.from("dm_privacy").upsert({user_id:uid,allow_requests:next});if(error)setError(error.message);else setAllowRequests(next)}
 async function submitReport(){if(!uid||!selected||!peerId)return;const {error}=await client.from("dm_reports").insert({reporter_id:uid,reported_id:peerId,conversation_id:selected,reason:reportReason,details:reportDetails.slice(0,1000)});if(error)setError(error.message);else{setNotice("Report submitted");setShowReport(false);setReportDetails("")}}
 async function saveEnhancements(language:string,ai:boolean){if(!uid)return;const {error}=await client.from("dm_preferences").upsert({user_id:uid,translate_to:language,ai_assistance:ai,updated_at:new Date().toISOString()});if(error)setError(error.message);else{setTranslateTo(language);setAiAssistance(ai);setNotice("Preferences saved. AI and translation require a configured provider before activation.")}}
 async function start(){setError("");setBusy(true);try{const {data,error}=await client.rpc("dm_start_conversation",{other_user:recipient.trim()});if(error)throw error;setSelected(data);setStatus(null);setRecipient("");const {data:rows}=await client.from("dm_participants").select("conversation_id,user_id");setThreads((rows??[]).filter(p=>p.user_id!==uid));}catch(e){setError(e instanceof Error?e.message:"Unable to start conversation")}finally{setBusy(false)}}
 async function accept(){if(!selected)return;setBusy(true);const {error}=await client.rpc("dm_accept_conversation",{cid:selected});if(error)setError(error.message);else setStatus(s=>s?{...s,request_status:"accepted"}:s);setBusy(false)}
 async function upload(file:File){if(!selected||!uid||busy)return;
 if(file.size>25*1024*1024){setError("Maximum attachment size is 25 MB.");return}
 const type=file.type.startsWith("image/")?"image":file.type.startsWith("video/")?"video":file.type.startsWith("audio/")?"audio":"file";
 const allowed=["image/jpeg","image/png","image/webp","image/gif","video/mp4","video/webm","audio/webm","audio/mp4","audio/mpeg","audio/ogg","application/pdf","text/plain"];
 if(!allowed.includes(file.type)){setError("Unsupported file type.");return}
 setBusy(true);setError("");
 const path=selected+"/"+uid+"/"+crypto.randomUUID()+"."+((file.name.split(".").pop()||"bin").replace(/[^a-z0-9]/gi,"").slice(0,8));
 const {error:upErr}=await client.storage.from("dm-attachments").upload(path,file,{contentType:file.type,upsert:false});
 if(upErr){setError(upErr.message);setBusy(false);return}
 const {error:msgErr}=await client.from("dm_messages").insert({conversation_id:selected,sender_id:uid,body:"📎 "+file.name.slice(0,200),attachment_path:path,attachment_type:type,reply_to_id:replyTo?.id??null});
 if(msgErr)setError(msgErr.message);else{setReplyTo(null);const {data}=await client.from("dm_messages").select("id,conversation_id,sender_id,body,created_at,attachment_path,attachment_type,reply_to_id").eq("conversation_id",selected).order("created_at",{ascending:true}).limit(200);setMessages(data??[]);const {data:url}=await client.storage.from("dm-attachments").createSignedUrl(path,3600);if(url)setMediaUrls(v=>({...v,[path]:url.signedUrl}))}
 setBusy(false)
 }
 async function toggleRecord(){if(recording){recorder.current?.stop();setRecording(false);return}
 try{const stream=await navigator.mediaDevices.getUserMedia({audio:true});const mime=["audio/webm","audio/mp4","audio/ogg"].find(t=>MediaRecorder.isTypeSupported(t));if(!mime)throw Error("Audio recording unsupported");const rec=new MediaRecorder(stream,{mimeType:mime});chunks.current=[];rec.ondataavailable=e=>{if(e.data.size)chunks.current.push(e.data)};rec.onstop=()=>{stream.getTracks().forEach(t=>t.stop());const blob=new Blob(chunks.current,{type:mime});if(blob.size)void upload(new File([blob],"voice-note."+(mime==="audio/mp4"?"m4a":mime==="audio/ogg"?"ogg":"webm"),{type:mime}))};rec.start();recorder.current=rec;setRecording(true)}catch(e){setError(e instanceof Error?e.message:"Microphone unavailable")}
 }
 async function react(messageId:string,emoji:string){if(!uid)return;const existing=reactions.some(r=>r.message_id===messageId&&r.user_id===uid&&r.emoji===emoji);const query=client.from("dm_reactions");const {error}=existing?await query.delete().eq("message_id",messageId).eq("user_id",uid).eq("emoji",emoji):await query.insert({message_id:messageId,user_id:uid,emoji});if(error)setError(error.message);else setReactions(prev=>existing?prev.filter(r=>!(r.message_id===messageId&&r.user_id===uid&&r.emoji===emoji)):[...prev,{message_id:messageId,user_id:uid,emoji}])}
 async function send(e:React.FormEvent){e.preventDefault();if(!selected||!uid||!draft.trim()||busy)return;setBusy(true);setError("");const body=draft.trim();const {error}=await client.from("dm_messages").insert({conversation_id:selected,sender_id:uid,body,reply_to_id:replyTo?.id??null});if(error)setError(error.message);else{setDraft("");setReplyTo(null);if(uid&&typingChannel)void typingChannel.send({type:"broadcast",event:"typing",payload:{user_id:uid,typing:false}});const {data}=await client.from("dm_messages").select("id,conversation_id,sender_id,body,created_at,attachment_path,attachment_type,reply_to_id").eq("conversation_id",selected).order("created_at",{ascending:true}).limit(200);setMessages(data??[])}setBusy(false)}
 if(loadingAuth)return <main style={{padding:32}}>Loading messages…</main>;
 if(!uid)return <main style={{padding:32,maxWidth:720,margin:"auto"}}><h1>Messages</h1><p>Sign in to access private conversations.</p><Link href="/auth">Sign in →</Link></main>;
 return <main style={{maxWidth:1150,margin:"30px auto",padding:"0 16px",color:"var(--text,#f4f4f5)"}}>
 <Link href="/">← Home</Link><h1 style={{fontSize:32,margin:"18px 0"}}>Messages</h1>
 <div style={{display:"grid",gridTemplateColumns:"minmax(220px,1fr) minmax(0,2fr)",minHeight:560,border:"1px solid #64748b55",borderRadius:18,overflow:"hidden"}}>
 <aside style={{padding:18,borderRight:"1px solid #64748b55"}}>
 <h2 style={{fontSize:18}}>Conversations</h2><details style={{margin:"12px 0"}}><summary>✨ Messenger extras</summary><label style={{display:"block",margin:"8px 0"}}>Preferred translation language <select value={translateTo} onChange={e=>void saveEnhancements(e.target.value,aiAssistance)}><option value="off">Off</option><option value="en">English</option><option value="ar">Arabic</option><option value="so">Somali</option><option value="fr">French</option><option value="es">Spanish</option><option value="ur">Urdu</option></select></label><label style={{display:"block",fontSize:12}}><input type="checkbox" checked={aiAssistance} onChange={e=>void saveEnhancements(translateTo,e.target.checked)}/> Opt in to HudHud AI assistance (coming soon)</label><div style={{fontSize:12,marginTop:8}}>🏅 Your badges: {badges.length?badges.map(b=>b.badge_name).join(", "):"None yet"}</div><p style={{fontSize:12,opacity:.75}}>Translation and AI are not active until securely configured. Badges do not bypass message permissions. Premium features require verified billing.</p></details><label style={{display:"block",fontSize:12,margin:"12px 0"}}><input type="checkbox" checked={allowRequests} onChange={e=>void savePrivacy(e.target.checked)}/> Accept new message requests</label><label htmlFor="member-search">Find a member</label><input id="member-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or @username" style={{width:"100%",padding:12,margin:"10px 0",borderRadius:10,color:"#111"}}/>{people.map(person=><button key={person.id} onClick={()=>{setRecipient(person.id);setSearch("");setPeople([])}} style={{display:"block",width:"100%",padding:10,marginBottom:4,textAlign:"left",borderRadius:8}}>{person.display_name} {person.username?"@"+person.username:""}</button>)}<label htmlFor="recipient">Selected member ID</label>
 <input id="recipient" value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="Recipient UUID" style={{width:"100%",padding:12,margin:"10px 0",borderRadius:10,color:"#111"}}/>
 <button disabled={busy||!recipient.trim()} onClick={start} style={{padding:10,borderRadius:10}}>New conversation</button>
 <div style={{marginTop:20}}>{Array.from(new Set(threads.map(t=>t.conversation_id))).map(cid=><button key={cid} onClick={()=>setSelected(cid)} style={{display:"block",width:"100%",padding:14,marginBottom:8,textAlign:"left",borderRadius:12,background:selected===cid?"#155e75":"#334155",color:"white"}}>💬 {names[threads.find(t=>t.conversation_id===cid)?.user_id??""]||"Member"}</button>)}</div>
 </aside><section style={{display:"flex",flexDirection:"column",minWidth:0}}>
 <header style={{padding:18,borderBottom:"1px solid #64748b55"}}>{selected?<>Private conversation <span style={{fontSize:12,opacity:.75}}>{peerOnline?"🟢 Online":"Offline"} {peerTyping?" · typing…":""}</span></>:"Choose a conversation"}{selected&&peerId&&<div style={{display:"flex",gap:10,marginTop:10,fontSize:12}}><button onClick={()=>void toggleBlock()}>{blocked.includes(peerId)?"Unblock member":"Block member"}</button><button onClick={()=>setShowReport(v=>!v)}>Report member</button></div>}</header>{selected&&showReport&&<section style={{padding:12,borderBottom:"1px solid #64748b55"}}><label>Reason <select value={reportReason} onChange={e=>setReportReason(e.target.value)}><option value="spam">Spam</option><option value="harassment">Harassment</option><option value="hate">Hate</option><option value="sexual_content">Sexual content</option><option value="other">Other</option></select></label><textarea value={reportDetails} onChange={e=>setReportDetails(e.target.value)} maxLength={1000} placeholder="Optional details" style={{display:"block",width:"100%",color:"#111",padding:8,margin:"8px 0"}}/><button onClick={()=>void submitReport()}>Submit report</button></section>
 <div aria-live="polite" style={{flex:1,padding:20,overflowY:"auto",maxHeight:480}}>{messages.filter(m=>m.conversation_id===selected).map(m=><div key={m.id} style={{margin:"10px 0",textAlign:m.sender_id===uid?"right":"left"}}><span style={{display:"inline-block",padding:"12px 16px",borderRadius:16,maxWidth:"85%",overflowWrap:"anywhere",background:m.sender_id===uid?"#0e7490":"#334155",color:"white"}}>{m.reply_to_id&&<div style={{fontSize:12,opacity:.75,marginBottom:6,borderLeft:"2px solid white",paddingLeft:8}}>↪ {messages.find(x=>x.id===m.reply_to_id)?.body??"Earlier message"}</div>}{m.body}{m.attachment_path&&mediaUrls[m.attachment_path]&&<div style={{marginTop:8}}>{m.attachment_type==="image"?<img src={mediaUrls[m.attachment_path]} alt="Message attachment" style={{maxWidth:"100%",maxHeight:280,borderRadius:8}}/>:m.attachment_type==="video"?<video controls src={mediaUrls[m.attachment_path]} style={{maxWidth:"100%",maxHeight:280}}/>:m.attachment_type==="audio"?<audio controls src={mediaUrls[m.attachment_path]}/>:<a href={mediaUrls[m.attachment_path]} target="_blank" rel="noopener noreferrer" style={{textDecoration:"underline"}}>Open attachment</a>}</div>}</span><div style={{fontSize:12}}><button onClick={()=>setReplyTo(m)} aria-label="Reply" style={{padding:4}}>↩ Reply</button>{["❤️","👍","😂"].map(emoji=><button key={emoji} onClick={()=>void react(m.id,emoji)} style={{padding:4}}>{emoji} {reactions.filter(r=>r.message_id===m.id&&r.emoji===emoji).length||""}</button>)}</div>{m.sender_id===uid&&<small style={{display:"block",opacity:.65}}>{peerReadAt&&new Date(peerReadAt)>=new Date(m.created_at)?"✓✓ Read":"✓ Sent"}</small>}</div>)}</div>
 {selected&&status?.request_status==="pending"&&<div style={{padding:16}}>{status.requested_by===uid?"Message request pending acceptance.":"This person wants to connect."}{status.requested_by!==uid&&<button onClick={accept} disabled={busy} style={{marginLeft:12,padding:10}}>Accept request</button>}</div>}
 {selected&&status?.request_status==="accepted"&&!blocked.includes(peerId??"")&&replyTo&&<div style={{padding:"4px 12px",fontSize:12}}>Replying to: {replyTo.body.slice(0,80)} <button onClick={()=>setReplyTo(null)}>✕</button></div>}
 {selected&&status?.request_status==="accepted"&&!blocked.includes(peerId??"")&&<div style={{padding:"0 12px",display:"flex",gap:8,alignItems:"center"}}><label style={{cursor:"pointer"}}>📎 Attach<input type="file" accept="image/*,video/mp4,video/webm,audio/*,application/pdf,text/plain" hidden disabled={busy} onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f);e.target.value=""}}/></label><button type="button" disabled={busy} onClick={()=>void toggleRecord()}>{recording?"⏹ Stop recording":"🎙 Voice note"}</button></div>}
 {selected&&status?.request_status==="accepted"&&!blocked.includes(peerId??"")&&<form onSubmit={send} style={{display:"flex",padding:12,gap:8}}><input aria-label="Message" maxLength={4000} value={draft} onChange={e=>{setDraft(e.target.value);if(uid&&typingChannel)void typingChannel.send({type:"broadcast",event:"typing",payload:{user_id:uid,typing:!!e.target.value}})}} placeholder="Write a message…" style={{flex:1,minWidth:0,padding:12,borderRadius:12,color:"#111"}}/><button disabled={busy||!draft.trim()} type="submit" style={{padding:"10px 18px",borderRadius:12}}>Send</button></form>}
 </section></div>{notice&&<p role="status" style={{color:"#a7f3d0"}}>{notice}</p>}{error&&<p role="alert" style={{color:"#f87171"}}>{error}</p>}
 <p style={{opacity:.7,fontSize:13}}>Messaging foundation preview. Requests require acceptance before messages can be sent. Media, voice notes, replies and reactions are available. Blocking, reporting and request privacy controls are available.</p>
 <style jsx>{`@media(max-width:600px){main>div{grid-template-columns:1fr!important}aside{border-right:0!important;border-bottom:1px solid #64748b55}}`}</style>
 </main>
}