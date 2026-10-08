"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import ExpressionKeyboard from "../components/ExpressionKeyboard";
import ConnectCallExperience from "../../components/ConnectCallExperience";
import ExpressiveText from "../components/ExpressiveText";
import { ExpressionCelebration, ExpressionSettings, playExpressionSound } from "../components/ExpressionEffects";

import { createClient } from "../../utils/supabase/client";
type Thread = { conversation_id:string; user_id:string };
type Message = {id:string;conversation_id:string;sender_id:string;body:string;created_at:string;attachment_path:string|null;attachment_type:string|null;reply_to_id:string|null};
type Reaction={message_id:string;user_id:string;emoji:string};
export default function MessagesPage(){
 const [client] = useState(()=>createClient());
 const [uid,setUid]=useState<string|null>(null);
 const [threads,setThreads]=useState<Thread[]>([]);
 const [names,setNames]=useState<Record<string,string>>({});
 const [avatars,setAvatars]=useState<Record<string,string>>({});
 const [search,setSearch]=useState("");
 const [people,setPeople]=useState<{id:string;display_name:string;username:string|null}[]>([]);
 const [selected,setSelected]=useState<string|null>(null);
 const [messages,setMessages]=useState<Message[]>([]);
 const [draft,setDraft]=useState("");
 const [showComposerTools,setShowComposerTools]=useState(false);
 const [showReactionTools,setShowReactionTools]=useState(false);
 const [expressionEvent,setExpressionEvent]=useState(0);
 const [expressionEmoji,setExpressionEmoji]=useState("✨");
 const [newMessageId,setNewMessageId]=useState<string|null>(null);
 const [incomingIds,setIncomingIds]=useState<string[]>([]);
 const [targetMessage,setTargetMessage]=useState<string|null>(null);
 const seenRef=useRef<Set<string>>(new Set());
 const hydratedRef=useRef(false);
 const holdTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const messageInput=useRef<HTMLInputElement>(null);
 const celebrate=(emoji:string,kind:"send"|"reply"|"react")=>{setExpressionEmoji(emoji);setExpressionEvent(v=>v+1);playExpressionSound(kind)};
 const selectReply=(m:Message)=>{setReplyTo(m);celebrate("💬","reply");messageInput.current?.focus()};
 const [replyTo,setReplyTo]=useState<Message|null>(null);
 const [reactions,setReactions]=useState<Reaction[]>([]);
 const [mediaUrls,setMediaUrls]=useState<Record<string,string>>({});
 const recorder=useRef<MediaRecorder|null>(null);
 const chunks=useRef<Blob[]>([]);
 const [recording,setRecording]=useState(false);
 const [voicePreview,setVoicePreview]=useState<{file:File;url:string}|null>(null);
 const [voiceSeconds,setVoiceSeconds]=useState(0);
 const [voicePlaying,setVoicePlaying]=useState(false);
 const [voiceSpeed,setVoiceSpeed]=useState(1);
 const [voiceProgress,setVoiceProgress]=useState(0);
 const voiceAudio=useRef<HTMLAudioElement|null>(null);
 const voiceTimer=useRef<ReturnType<typeof setInterval>|null>(null);
 const voiceCancelled=useRef(false);
 const voiceContext=useRef<AudioContext|null>(null);
 const voiceAnalyzer=useRef<AnalyserNode|null>(null);
 const [voiceLevels,setVoiceLevels]=useState<number[]>(Array(36).fill(0.12));
 const voiceAnimation=useRef<number|null>(null);
 const discardVoice=()=>{voiceCancelled.current=true;if(recorder.current?.state==="recording"){recorder.current.stop();setRecording(false)}if(voicePreview)URL.revokeObjectURL(voicePreview.url);setVoicePreview(null);setVoiceSeconds(0);setVoiceProgress(0);setVoicePlaying(false);if(voiceTimer.current)clearInterval(voiceTimer.current);if(voiceAnimation.current!==null)cancelAnimationFrame(voiceAnimation.current);void voiceContext.current?.close();voiceContext.current=null;voiceAnalyzer.current=null};
 useEffect(()=>()=>{if(voiceTimer.current)clearInterval(voiceTimer.current);if(voiceAnimation.current!==null)cancelAnimationFrame(voiceAnimation.current);if(recorder.current?.state==="recording")recorder.current.stop();void voiceContext.current?.close()},[]);
 const sendVoice=async()=>{if(!voicePreview)return;const file=voicePreview.file;discardVoice();await upload(file)};

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
 const [reward,setReward]=useState<{eligible:boolean;certified:boolean;xp:number;xp_required:number}|null>(null);
 const [loadingAuth,setLoadingAuth]=useState(true);
 const [peerOnline,setPeerOnline]=useState(false);
 const [peerTyping,setPeerTyping]=useState(false);
 const [peerReadAt,setPeerReadAt]=useState<string|null>(null);
 const [typingChannel,setTypingChannel]=useState<ReturnType<typeof client.channel>|null>(null);
 useEffect(()=>{const params=new URLSearchParams(window.location.search);const conversation=params.get("conversation");const message=params.get("message");if(conversation&&/^[0-9a-f-]{36}$/i.test(conversation))setSelected(conversation);if(message&&/^[0-9a-f-]{36}$/i.test(message))setTargetMessage(message);const to=params.get("to");if(to&&/^[0-9a-f-]{36}$/i.test(to)){setRecipient(to);setInitialRecipient(to)}},[]);
 useEffect(()=>{let active=true;client.auth.getUser().then(({data})=>{if(active){setUid(data.user?.id??null);setLoadingAuth(false)}});return()=>{active=false}},[client]);
 useEffect(()=>{if(!uid||!targetMessage||selected)return;let active=true;void client.from("dm_messages").select("conversation_id").eq("id",targetMessage).maybeSingle().then(({data})=>{if(active&&data?.conversation_id)setSelected(data.conversation_id)});return()=>{active=false}},[client,uid,targetMessage,selected]);
 useEffect(()=>{if(!uid)return;let active=true;
 void client.from("dm_blocks").select("blocked_id").eq("blocker_id",uid).then(({data})=>{if(active)setBlocked((data??[]).map(x=>x.blocked_id))});
 void client.from("dm_privacy").select("allow_requests").eq("user_id",uid).maybeSingle().then(({data})=>{if(active&&data)setAllowRequests(data.allow_requests)});
 void client.from("dm_preferences").select("translate_to,ai_assistance").eq("user_id",uid).maybeSingle().then(({data})=>{if(active&&data){setTranslateTo(data.translate_to);setAiAssistance(data.ai_assistance)}});
 void client.rpc("dm_my_badges").then(({data})=>{if(active)setBadges(data??[])});
 void client.rpc("hudhud_my_free_eligibility").then(({data})=>{if(active)setReward(data?.[0]??null)});
 return()=>{active=false}},[client,uid]);
 useEffect(()=>{if(!uid)return;let active=true;
 const load=async()=>{const {data,error}=await client.from("dm_participants").select("conversation_id,user_id").order("joined_at",{ascending:false});if(active){if(error)setError(error.message);else {const peers=(data??[]).filter(p=>p.user_id!==uid);setThreads(peers);const ids=[...new Set(peers.map(p=>p.user_id))];if(ids.length){const {data:profiles}=await client.from("profiles").select("*").in("id",ids);if(active){setNames(Object.fromEntries((profiles??[]).map(p=>[p.id,p.display_name||p.username||"Member"])));setAvatars(Object.fromEntries((profiles??[]).map(p=>[p.id,p.avatar_url||p.profile_image_url||p.avatar_path||""]))) }}}}};
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
 useEffect(()=>{
  if(!uid||!selected||!messages.length)return;
  const key="1muslim-seen-messages:"+uid;
  if(!hydratedRef.current){try{seenRef.current=new Set(JSON.parse(localStorage.getItem(key)||"[]") as string[])}catch{}hydratedRef.current=true;}
  const seen=seenRef.current;
  const incoming=messages.filter(m=>m.sender_id!==uid);
  const firstOpen=targetMessage?incoming.find(m=>m.id===targetMessage):null;
  const fresh=firstOpen&&!seen.has(firstOpen.id)?firstOpen:incoming.find(m=>!seen.has(m.id)&&Date.now()-new Date(m.created_at).getTime()<120000);
  if(fresh){
   const match=fresh.body.match(/🔥|💚|❤️|😂|🤲|✨|🥹|🏆|🌙|🎉|👀|💯|😍|👏|😮|🕊️|⭐|💥|🙌|🌹/u);
   const reaction=reactions.find(x=>x.message_id===fresh.id&&x.user_id!==uid);
   if(match||reaction){celebrate(match?.[0]??reaction?.emoji??"✨","react");setNewMessageId(fresh.id)}if(fresh.sender_id!==uid){setIncomingIds(ids=>[...ids.slice(-6),fresh.id]);window.setTimeout(()=>setIncomingIds(ids=>ids.filter(id=>id!==fresh.id)),1800)}
  }
  incoming.forEach(m=>seen.add(m.id));
  try{localStorage.setItem(key,JSON.stringify([...seen].slice(-800)))}catch{}
  if(targetMessage){const el=document.getElementById("dm-message-"+targetMessage);if(el)el.scrollIntoView({behavior:"smooth",block:"center"});}
 },[uid,selected,messages,reactions,targetMessage]);
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
 if(voicePreview)discardVoice();
 try{
 if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==="undefined")throw Error("This browser does not support voice recording");
 const stream=await navigator.mediaDevices.getUserMedia({audio:true});
 const mime=["audio/mp4","audio/webm;codecs=opus","audio/webm","audio/ogg"].find(t=>MediaRecorder.isTypeSupported(t));
 if(!mime){stream.getTracks().forEach(t=>t.stop());throw Error("Audio recording unsupported")}
 const rec=new MediaRecorder(stream,{mimeType:mime});chunks.current=[];voiceCancelled.current=false;setVoiceSeconds(0);setVoiceLevels(Array(36).fill(.12));setVoiceProgress(0);
 rec.ondataavailable=e=>{if(e.data.size)chunks.current.push(e.data)};
 rec.onstop=()=>{stream.getTracks().forEach(t=>t.stop());if(voiceTimer.current)clearInterval(voiceTimer.current);if(voiceAnimation.current!==null)cancelAnimationFrame(voiceAnimation.current);void voiceContext.current?.close();voiceContext.current=null;voiceAnalyzer.current=null;
 if(voiceCancelled.current)return;
 const blob=new Blob(chunks.current,{type:mime});if(!blob.size)return;
 const ext=mime.startsWith("audio/mp4")?"m4a":mime.startsWith("audio/ogg")?"ogg":"webm";
 const file=new File([blob],"voice-note-"+Date.now()+"."+ext,{type:mime.startsWith("audio/webm")?"audio/webm":mime});
 setVoicePreview({file,url:URL.createObjectURL(blob)})};
 rec.start(250);recorder.current=rec;setRecording(true);
 voiceTimer.current=setInterval(()=>setVoiceSeconds(v=>{if(v>=179){rec.stop();setRecording(false);return v}return v+1}),1000);
 try{const ctx=new AudioContext();voiceContext.current=ctx;const source=ctx.createMediaStreamSource(stream);const analyzer=ctx.createAnalyser();analyzer.fftSize=256;source.connect(analyzer);voiceAnalyzer.current=analyzer;const samples=new Uint8Array(analyzer.frequencyBinCount);
 const draw=()=>{analyzer.getByteFrequencyData(samples);const level=samples.reduce((a,b)=>a+b,0)/samples.length/255;setVoiceLevels(prev=>[...prev.slice(1),Math.max(.1,Math.min(1,level*3))]);voiceAnimation.current=requestAnimationFrame(draw)};draw()}catch{}
 }catch(e){setError(e instanceof Error?e.message:"Microphone unavailable")}
 }
 async function react(messageId:string,emoji:string){if(!uid)return;const existing=reactions.some(r=>r.message_id===messageId&&r.user_id===uid&&r.emoji===emoji);const query=client.from("dm_reactions");const {error}=existing?await query.delete().eq("message_id",messageId).eq("user_id",uid).eq("emoji",emoji):await query.insert({message_id:messageId,user_id:uid,emoji});if(error)setError(error.message);else {setReactions(prev=>existing?prev.filter(r=>!(r.message_id===messageId&&r.user_id===uid&&r.emoji===emoji)):[...prev,{message_id:messageId,user_id:uid,emoji}]);if(!existing)celebrate(emoji,"react")}}
 async function send(e:React.FormEvent){e.preventDefault();if(!selected||!uid||!draft.trim()||busy)return;setBusy(true);setError("");const body=draft.trim();const {error}=await client.from("dm_messages").insert({conversation_id:selected,sender_id:uid,body,reply_to_id:replyTo?.id??null});if(error)setError(error.message);else{celebrate(replyTo?"💬":"✨",replyTo?"reply":"send");setDraft("");setReplyTo(null);if(uid&&typingChannel)void typingChannel.send({type:"broadcast",event:"typing",payload:{user_id:uid,typing:false}});const {data}=await client.from("dm_messages").select("id,conversation_id,sender_id,body,created_at,attachment_path,attachment_type,reply_to_id").eq("conversation_id",selected).order("created_at",{ascending:true}).limit(200);setMessages(data??[]);if(data?.length)setNewMessageId(data[data.length-1].id)}setBusy(false)}
 if(loadingAuth)return <main style={{padding:32}}>Loading messages…</main>;
 if(!uid)return <main style={{padding:32,maxWidth:720,margin:"auto"}}><h1>Messages</h1><p>Sign in to access private conversations.</p><Link href="/auth">Sign in →</Link></main>;
 return <main style={{maxWidth:1150,margin:"30px auto",padding:"0 16px",color:"var(--text,#f4f4f5)"}}>
 <Link href="/">← Home</Link><Link href="/messages/groups" style={{display:"inline-flex",margin:"10px 0",padding:"11px 16px",borderRadius:999,background:"#2c9a62",color:"#fff",fontWeight:800,textDecoration:"none"}}>👥 Group Rooms ＋</Link><h1 className="omMessengerHeading" style={{fontSize:32,margin:"18px 0"}}>💬 Messages <span style={{fontSize:13,fontWeight:500,opacity:.7}}>Make every conversation count ✨</span></h1>
 <div className={"omMessengerShell "+(selected?"omMessengerShell--chat":"omMessengerShell--list")} style={{display:"grid",gridTemplateColumns:"minmax(220px,1fr) minmax(0,2fr)",minHeight:560,border:"1px solid #64748b55",borderRadius:18,overflow:"hidden"}}>
 <aside className="omConversationList" style={{padding:18,borderRight:"1px solid #64748b55"}}>
 <h2 style={{fontSize:18}}>Conversations</h2><details style={{margin:"12px 0"}}><summary>✨ Messenger extras</summary><label style={{display:"block",margin:"8px 0"}}>Preferred translation language <select value={translateTo} onChange={e=>void saveEnhancements(e.target.value,aiAssistance)}><option value="off">Off</option><option value="en">English</option><option value="ar">Arabic</option><option value="so">Somali</option><option value="fr">French</option><option value="es">Spanish</option><option value="ur">Urdu</option></select></label><label style={{display:"block",fontSize:12}}><input type="checkbox" checked={aiAssistance} onChange={e=>void saveEnhancements(translateTo,e.target.checked)}/> Opt in to HudHud AI assistance (coming soon)</label><div style={{fontSize:12,marginTop:8}}>🪶 HudHud Free: {reward?(reward.eligible?"Unlocked — certified member with over 100,000 XP":`${reward.xp.toLocaleString()} / 100,001 XP · ${reward.certified?"Certified":"Certification required"}`):"Checking eligibility…"}</div><div style={{fontSize:12,marginTop:8}}>🏅 Your badges: {badges.length?badges.map(b=>b.badge_name).join(", "):"None yet"}</div><p style={{fontSize:12,opacity:.75}}>Translation and AI are not active until securely configured. Badges do not bypass message permissions. Premium features require verified billing.</p></details><label style={{display:"block",fontSize:12,margin:"12px 0"}}><input type="checkbox" checked={allowRequests} onChange={e=>void savePrivacy(e.target.checked)}/> Accept new message requests</label><label htmlFor="member-search">Find a member</label><input id="member-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or @username" style={{width:"100%",padding:12,margin:"10px 0",borderRadius:10,color:"#111"}}/>{people.map(person=><button key={person.id} onClick={()=>{setRecipient(person.id);setSearch("");setPeople([])}} style={{display:"block",width:"100%",padding:10,marginBottom:4,textAlign:"left",borderRadius:8}}>{person.display_name} {person.username?"@"+person.username:""}</button>)}<label htmlFor="recipient">Selected member ID</label>
 <input id="recipient" value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="Recipient UUID" style={{width:"100%",padding:12,margin:"10px 0",borderRadius:10,color:"#111"}}/>
 <button disabled={busy||!recipient.trim()} onClick={start} style={{padding:10,borderRadius:10}}>New conversation</button>
 <div style={{marginTop:20}}>{Array.from(new Set(threads.map(t=>t.conversation_id))).map(cid=><button key={cid} onClick={()=>setSelected(cid)} style={{display:"block",width:"100%",padding:14,marginBottom:8,textAlign:"left",borderRadius:12,background:selected===cid?"#155e75":"#334155",color:"white"}}>💬 {names[threads.find(t=>t.conversation_id===cid)?.user_id??""]||"Member"}</button>)}</div>
 </aside><section className="omChatPane" style={{display:"flex",flexDirection:"column",minWidth:0}}>
 <header className="omChatHeader" style={{padding:18,borderBottom:"1px solid #64748b55"}}>{selected&&<button type="button" className="omBackToChats" onClick={()=>setSelected(null)} aria-label="Back to conversations">← Chats</button>}{selected?<>Private conversation <span style={{fontSize:12,opacity:.75}}>{peerOnline?"🟢 Online":"Offline"} {peerTyping?" · typing…":""}</span></>:"Choose a conversation"}{selected&&peerId&&<div style={{display:"flex",gap:10,marginTop:10,fontSize:12}}><button onClick={()=>void toggleBlock()}>{blocked.includes(peerId)?"Unblock member":"Block member"}</button><button onClick={()=>setShowReport(v=>!v)}>Report member</button></div>}</header>{selected&&showReport&&<section style={{padding:12,borderBottom:"1px solid #64748b55"}}><label>Reason <select value={reportReason} onChange={e=>setReportReason(e.target.value)}><option value="spam">Spam</option><option value="harassment">Harassment</option><option value="hate">Hate</option><option value="sexual_content">Sexual content</option><option value="other">Other</option></select></label><textarea value={reportDetails} onChange={e=>setReportDetails(e.target.value)} maxLength={1000} placeholder="Optional details" style={{display:"block",width:"100%",color:"#111",padding:8,margin:"8px 0"}}/><button onClick={()=>void submitReport()}>Submit report</button></section>}
 <div aria-live="polite" className="omMessagesFeed" style={{flex:1,padding:20,overflowY:"auto",maxHeight:480}}>{messages.filter(m=>m.conversation_id===selected).map(m=><div id={"dm-message-"+m.id} key={m.id} className={"omMessageRow "+(m.sender_id===uid?"omMessageRow--mine ":"")+(m.id===newMessageId?"omCommentPop ":"")+(incomingIds.includes(m.id)?"omMessageIncoming":"")} onPointerDown={e=>{if(e.pointerType!=="mouse")holdTimer.current=setTimeout(()=>selectReply(m),500)}} onPointerUp={()=>{if(holdTimer.current)clearTimeout(holdTimer.current)}} onPointerCancel={()=>{if(holdTimer.current)clearTimeout(holdTimer.current)}} onPointerLeave={()=>{if(holdTimer.current)clearTimeout(holdTimer.current)}} style={{margin:"14px 0",textAlign:m.sender_id===uid?"right":"left",touchAction:"pan-y"}}><span className={"omMessageBubble "+(m.sender_id===uid?"omMessageBubble--mine":"omMessageBubble--theirs")} style={{display:"inline-block",padding:"13px 17px",borderRadius:19,maxWidth:"85%",overflowWrap:"anywhere",color:"white"}}>{m.reply_to_id&&<div style={{fontSize:12,opacity:.75,marginBottom:6,borderLeft:"2px solid white",paddingLeft:8}}>↪ {messages.find(x=>x.id===m.reply_to_id)?.body??"Earlier message"}</div>}<ExpressiveText text={m.body}/>{m.attachment_path&&mediaUrls[m.attachment_path]&&<div style={{marginTop:8}}>{m.attachment_type==="image"?<img src={mediaUrls[m.attachment_path]} alt="Message attachment" style={{maxWidth:"100%",maxHeight:280,borderRadius:8}}/>:m.attachment_type==="video"?<video controls src={mediaUrls[m.attachment_path]} style={{maxWidth:"100%",maxHeight:280}}/>:m.attachment_type==="audio"?<audio controls src={mediaUrls[m.attachment_path]}/>:<a href={mediaUrls[m.attachment_path]} target="_blank" rel="noopener noreferrer" style={{textDecoration:"underline"}}>Open attachment</a>}</div>}</span><div className="omReactionRail"><button className="omReactionChip omReactionReply" onClick={()=>selectReply(m)} aria-label="Reply">↩ Reply</button>{(showReactionTools?["❤️","👍","😂","🔥","💚","🤲","✨","🎉"]:["❤️","😂","🤲","✨"]).map(emoji=><button className={"omReactionChip "+(reactions.some(r=>r.message_id===m.id&&r.user_id===uid&&r.emoji===emoji)?"omReactionChip--active":"")} key={emoji} onClick={()=>void react(m.id,emoji)} aria-label={"React "+emoji} aria-pressed={reactions.some(r=>r.message_id===m.id&&r.user_id===uid&&r.emoji===emoji)}>{emoji} {reactions.filter(r=>r.message_id===m.id&&r.emoji===emoji).length||""}</button>)}<button type="button" className="omReactionChip omMoreReactions" onClick={()=>setShowReactionTools(v=>!v)} aria-label={showReactionTools?"Show fewer reactions":"Show more reactions"}>{showReactionTools?"−":"+ "}</button></div>{m.sender_id===uid&&<small style={{display:"block",opacity:.65}}>{peerReadAt&&new Date(peerReadAt)>=new Date(m.created_at)?"✓✓ Read":"✓ Sent"}</small>}</div>)}</div>
 {selected&&status?.request_status==="pending"&&<div style={{padding:16}}>{status.requested_by===uid?"Message request pending acceptance.":"This person wants to connect."}{status.requested_by!==uid&&<button onClick={accept} disabled={busy} style={{marginLeft:12,padding:10}}>Accept request</button>}</div>}
 {selected&&uid&&peerId&&status?.request_status==="accepted"&&!blocked.includes(peerId)&&<div style={{padding:"10px 14px",borderBottom:"1px solid #ffffff24"}}><ConnectCallExperience key={selected} conversationId={selected} userId={uid} peerName={names[peerId]||"Member"} peerAvatar={avatars[peerId]||null}/></div>}
 {selected&&status?.request_status==="accepted"&&!blocked.includes(peerId??"")&&replyTo&&<div style={{padding:"4px 12px",fontSize:12}}>Replying to: {replyTo.body.slice(0,80)} <button onClick={()=>setReplyTo(null)}>✕</button></div>}
 {selected&&status?.request_status==="accepted"&&!blocked.includes(peerId??"")&&<div className={"omComposerTools "+(showComposerTools?"omComposerTools--open":"")} style={{padding:"0 12px",display:"flex",gap:8,alignItems:"center"}}><label style={{cursor:"pointer"}}>📎 Attach<input type="file" accept="image/*,video/mp4,video/webm,audio/*,application/pdf,text/plain" hidden disabled={busy} onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f);e.target.value=""}}/></label><button type="button" className="voiceLaunch" disabled={busy} onClick={()=>void toggleRecord()}>{recording?"⏸ Finish":"🎙 Voice note"}</button></div>}
 {selected&&status?.request_status==="accepted"&&!blocked.includes(peerId??"")&&(recording||voicePreview)&&<section className="voiceStudio" aria-label="Voice message recorder">
 <div className="voiceStudioTop"><div><strong>🎙️ Voice message</strong><small>{recording?"Recording privately · tap Finish to preview":"Listen before sending"}</small></div><span className={recording?"voiceLive":""}>{recording?"● REC":"✓ READY"}</span></div>
 <div className="voiceStudioWave" aria-hidden="true">{voiceLevels.map((h,i)=><i key={i} style={{height:Math.max(5,h*46)+"px"}}/>)}</div>
 <div className="voiceStudioBottom"><span className="voiceTime">{String(Math.floor(voiceSeconds/60)).padStart(2,"0")}:{String(voiceSeconds%60).padStart(2,"0")}</span>
 {voicePreview&&<><audio ref={voiceAudio} src={voicePreview.url} preload="metadata" onTimeUpdate={e=>{const a=e.currentTarget;setVoiceProgress(a.duration?a.currentTime/a.duration:0)}} onEnded={()=>setVoicePlaying(false)}/>
 <button type="button" className="voiceCircle" aria-label={voicePlaying?"Pause preview":"Play preview"} onClick={()=>{const a=voiceAudio.current;if(!a)return;if(a.paused){void a.play();setVoicePlaying(true)}else{a.pause();setVoicePlaying(false)}}}>{voicePlaying?"Ⅱ":"▶"}</button>
 <input type="range" className="voiceSeek" aria-label="Seek recording" min={0} max={100} value={Math.round(voiceProgress*100)} onChange={e=>{const a=voiceAudio.current;if(a&&Number.isFinite(a.duration))a.currentTime=a.duration*Number(e.target.value)/100;setVoiceProgress(Number(e.target.value)/100)}}/>
 <button type="button" className="voiceSpeed" onClick={()=>{const next=voiceSpeed===1?1.5:voiceSpeed===1.5?2:1;setVoiceSpeed(next);if(voiceAudio.current)voiceAudio.current.playbackRate=next}}>{voiceSpeed}×</button></>}
 <button type="button" className="voiceDiscard" onClick={discardVoice}>✕ <span>Discard</span></button>
 {recording?<button type="button" className="voiceFinish" onClick={()=>void toggleRecord()}>■ Finish</button>:<button type="button" className="voiceSend" disabled={busy} onClick={()=>void sendVoice()}>➤ Send</button>}
 </div></section>}
{selected&&status?.request_status==="accepted"&&!blocked.includes(peerId??"")&&<div className={"omComposerSettings "+(showComposerTools?"omComposerSettings--open":"")}><ExpressionSettings/></div>}
 {selected&&status?.request_status==="accepted"&&!blocked.includes(peerId??"")&&<form className="omMessageComposer" onSubmit={send} style={{display:"flex",padding:12,gap:8}}><button type="button" className="omComposerExpand" aria-label="Toggle attachment and sound tools" aria-expanded={showComposerTools} onClick={()=>setShowComposerTools(v=>!v)}>{showComposerTools?"×":"+"}</button><ExpressionKeyboard onInsert={text=>setDraft(prev=>(prev?prev+" ":"")+text)} /><input ref={messageInput} aria-label="Message" maxLength={4000} value={draft} onChange={e=>{setDraft(e.target.value);if(uid&&typingChannel)void typingChannel.send({type:"broadcast",event:"typing",payload:{user_id:uid,typing:!!e.target.value}})}} placeholder="Write a message…" style={{flex:1,minWidth:0,padding:12,borderRadius:12,color:"#111"}}/><button className="omComposerSend" disabled={busy||!draft.trim()} type="submit" style={{padding:"10px 18px",borderRadius:12}} aria-label="Send message">➤ <span>Send</span></button></form>}
 </section></div><ExpressionCelebration trigger={expressionEvent} emoji={expressionEmoji}/>{notice&&<p role="status" style={{color:"#a7f3d0"}}>{notice}</p>}{error&&<p role="alert" style={{color:"#f87171"}}>{error}</p>}
 <p style={{opacity:.7,fontSize:13}}>Messaging foundation preview. Requests require acceptance before messages can be sent. Media, voice notes, replies and reactions are available. Blocking, reporting and request privacy controls are available.</p>
 <style jsx>{`.voiceStudio{margin:12px 12px 4px;padding:17px;border-radius:23px;border:1px solid #40886a;background:linear-gradient(145deg,#163d30,#0d211d);box-shadow:0 12px 40px #0004;color:#f4fff9}.voiceStudioTop,.voiceStudioBottom{display:flex;align-items:center;justify-content:space-between;gap:10px}.voiceStudioTop strong{font-size:15px}.voiceStudioTop small{display:block;font-size:11px;color:#aac9b9;margin-top:3px}.voiceStudioTop>span{font-size:10px;font-weight:800;letter-spacing:.08em;color:#b6efc8}.voiceStudioTop .voiceLive{color:#ff9ca6;animation:voicePulse 1.2s infinite}.voiceStudioWave{height:70px;display:flex;align-items:center;justify-content:center;gap:3px;margin:8px 0}.voiceStudioWave i{display:block;flex:1;max-width:6px;min-width:2px;background:linear-gradient(#8ff3bd,#2fa879);border-radius:9px;transition:height .12s}.voiceStudioBottom{justify-content:flex-start;flex-wrap:wrap}.voiceStudioBottom button{border:1px solid #ffffff35;border-radius:99px;padding:10px 13px;color:#e9fff1;background:#ffffff15;cursor:pointer;font-weight:700}.voiceStudioBottom .voiceCircle{background:#b8f6ce;color:#0b2519;border:0;width:43px;height:43px}.voiceStudioBottom .voiceSend{background:#52d68c;color:#062112;border:0}.voiceStudioBottom .voiceDiscard{color:#ffbbc2}.voiceTime{font-variant-numeric:tabular-nums;font-weight:800;font-size:14px}.voiceSeek{flex:1;min-width:65px;accent-color:#70e5a2}.voiceLaunch{border-radius:999px;padding:9px 13px;background:#205d42;color:#e5ffec;border:1px solid #479c6c;cursor:pointer}.voiceSpeed{white-space:nowrap}@keyframes voicePulse{50%{opacity:.4}}@media(max-width:600px){main>div{grid-template-columns:1fr!important}aside{border-right:0!important;border-bottom:1px solid #64748b55}}`}</style>
 </main>
}