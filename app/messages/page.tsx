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
 const [messageFilter,setMessageFilter]=useState<"all"|"ashab"|"groups"|"calls">("all");
 const [newChatOpen,setNewChatOpen]=useState(false);
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
 useEffect(()=>{const params=new URLSearchParams(window.location.search);if(!params.get("verse"))return;try{const prepared=sessionStorage.getItem("1muslim-verse-dm-draft");if(prepared){setDraft(prepared);sessionStorage.removeItem("1muslim-verse-dm-draft")}}catch{}},[]);
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
 async function send(e:React.FormEvent){e.preventDefault();if(!selected||!uid||!draft.trim()||busy)return;setBusy(true);setError("");const body=draft.trim();const {error}=await client.from("dm_messages").insert({conversation_id:selected,sender_id:uid,body,reply_to_id:replyTo?.id??null});if(error)setError(error.message);else{playExpressionSound(replyTo?"reply":"send");celebrate(replyTo?"💬":"✨",replyTo?"reply":"send");setDraft("");setReplyTo(null);if(uid&&typingChannel)void typingChannel.send({type:"broadcast",event:"typing",payload:{user_id:uid,typing:false}});const {data}=await client.from("dm_messages").select("id,conversation_id,sender_id,body,created_at,attachment_path,attachment_type,reply_to_id").eq("conversation_id",selected).order("created_at",{ascending:true}).limit(200);setMessages(data??[]);if(data?.length)setNewMessageId(data[data.length-1].id)}setBusy(false)}
 if(loadingAuth)return <main style={{padding:32}}>Loading messages…</main>;
 if(!uid)return <main style={{padding:32,maxWidth:720,margin:"auto"}}><h1>Messages</h1><p>Sign in to access private conversations.</p><Link href="/auth">Sign in →</Link></main>;
 return <main className="omImessagePage" style={{maxWidth:1150,margin:"20px auto",padding:"0 12px",color:"var(--text,#f4f4f5)"}}>
 <div className="omMessengerTop"><div><Link href="/" className="omMessengerHome">← Home</Link><h1 className="omMessengerHeading">Messages</h1></div><button className="omMessengerNewButton" type="button" onClick={()=>setNewChatOpen(v=>!v)} aria-label="Start new conversation">＋</button></div>
 <div className={"omMessengerShell "+(selected?"omMessengerShell--chat":"omMessengerShell--list")} style={{display:"grid",gridTemplateColumns:"minmax(220px,1fr) minmax(0,2fr)",minHeight:560,border:"1px solid #64748b55",borderRadius:28,overflow:"hidden"}}>
 <aside className="omConversationList" style={{padding:18,borderRight:"1px solid #64748b55"}}>
 <div className="omMessengerListHead"><input aria-label="Search messages" value={search} onChange={e=>setSearch(e.target.value)} placeholder="⌕  Search messages..." /><div className="omMessengerFilters">{(["all","ashab","groups","calls"] as const).map(filter=><button key={filter} type="button" className={messageFilter===filter?"active":""} onClick={()=>setMessageFilter(filter)}>{filter==="all"?"All":filter==="ashab"?"Ashab":filter==="groups"?"Groups":"Calls"}</button>)}</div></div><details style={{margin:"12px 0"}}><summary>✨ Messenger extras</summary><label style={{display:"block",margin:"8px 0"}}>Preferred translation language <select value={translateTo} onChange={e=>void saveEnhancements(e.target.value,aiAssistance)}><option value="off">Off</option><option value="en">English</option><option value="ar">Arabic</option><option value="so">Somali</option><option value="fr">French</option><option value="es">Spanish</option><option value="ur">Urdu</option></select></label><label style={{display:"block",fontSize:12}}><input type="checkbox" checked={aiAssistance} onChange={e=>void saveEnhancements(translateTo,e.target.checked)}/> Opt in to HudHud AI assistance (coming soon)</label><div style={{fontSize:12,marginTop:8}}>🪶 HudHud Free: {reward?(reward.eligible?"Unlocked — certified member with over 100,000 XP":`${reward.xp.toLocaleString()} / 100,001 XP · ${reward.certified?"Certified":"Certification required"}`):"Checking eligibility…"}</div><div style={{fontSize:12,marginTop:8}}>🏅 Your badges: {badges.length?badges.map(b=>b.badge_name).join(", "):"None yet"}</div><p style={{fontSize:12,opacity:.75}}>Translation and AI are not active until securely configured. Badges do not bypass message permissions. Premium features require verified billing.</p></details><label style={{display:"block",fontSize:12,margin:"12px 0"}}><input type="checkbox" checked={allowRequests} onChange={e=>void savePrivacy(e.target.checked)}/> Accept new message requests</label><div className={"omMessengerNewChat "+(newChatOpen?"open":"") }><label htmlFor="member-search">Find a member</label><input id="member-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or @username" style={{width:"100%",padding:12,margin:"10px 0",borderRadius:10,color:"#111"}}/>{people.map(person=><button key={person.id} onClick={()=>{setRecipient(person.id);setSearch("");setPeople([])}} style={{display:"block",width:"100%",padding:10,marginBottom:4,textAlign:"left",borderRadius:8}}>{person.display_name} {person.username?"@"+person.username:""}</button>)}<label htmlFor="recipient">Selected member ID</label>
 <input id="recipient" value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="Recipient UUID" style={{width:"100%",padding:12,margin:"10px 0",borderRadius:10,color:"#111"}}/>
 <button disabled={busy||!recipient.trim()} onClick={start} style={{padding:10,borderRadius:10}}>Start conversation →</button></div>
 <div className="omMessengerThreadList" style={{marginTop:20}}>{messageFilter==="groups"?<Link href="/messages/groups" className="omMessengerGroupCard">👥 Group Rooms <span>→</span></Link>:messageFilter==="calls"?<p className="omMessengerEmpty">Open a conversation to start a call.</p>:Array.from(new Set(threads.map(t=>t.conversation_id))).filter(cid=>{const peer=threads.find(t=>t.conversation_id===cid)?.user_id??"";return !search.trim()||(names[peer]||"").toLowerCase().includes(search.toLowerCase())}).map(cid=><button key={cid} onClick={()=>setSelected(cid)} style={{display:"block",width:"100%",padding:14,marginBottom:8,textAlign:"left",borderRadius:12,background:selected===cid?"#155e75":"#334155",color:"white"}}><span className="omThreadAvatar">{avatars[threads.find(t=>t.conversation_id===cid)?.user_id??""]?<img alt="" src={avatars[threads.find(t=>t.conversation_id===cid)?.user_id??""]}/>: "☪"}</span><span className="omThreadMeta"><strong>{names[threads.find(t=>t.conversation_id===cid)?.user_id??""]||"Member"}</strong><small>Tap to open conversation</small></span><span className="omThreadChevron">›</span></button>)}</div>
 </aside><section className="omChatPane" style={{display:"flex",flexDirection:"column",minWidth:0}}>
 <header className="omChatHeader" style={{padding:18,borderBottom:"1px solid #64748b55"}}>{selected&&<button type="button" className="omBackToChats" onClick={()=>setSelected(null)} aria-label="Back to conversations">← Chats</button>}{selected?<><strong className="omChatPeerName">{names[peerId??""]||"Private conversation"}</strong> <span style={{fontSize:12,opacity:.75}}>{peerOnline?"🟢 Online":"Offline"} {peerTyping?" · typing…":""}</span></>:"Choose a conversation"}{selected&&peerId&&<div style={{display:"flex",gap:10,marginTop:10,fontSize:12}}><button onClick={()=>void toggleBlock()}>{blocked.includes(peerId)?"Unblock member":"Block member"}</button><button onClick={()=>setShowReport(v=>!v)}>Report member</button></div>}</header>{selected&&showReport&&<section style={{padding:12,borderBottom:"1px solid #64748b55"}}><label>Reason <select value={reportReason} onChange={e=>setReportReason(e.target.value)}><option value="spam">Spam</option><option value="harassment">Harassment</option><option value="hate">Hate</option><option value="sexual_content">Sexual content</option><option value="other">Other</option></select></label><textarea value={reportDetails} onChange={e=>setReportDetails(e.target.value)} maxLength={1000} placeholder="Optional details" style={{display:"block",width:"100%",color:"#111",padding:8,margin:"8px 0"}}/><button onClick={()=>void submitReport()}>Submit report</button></section>}
 <div aria-live="polite" className="omMessagesFeed" style={{flex:1,padding:20,overflowY:"auto",maxHeight:480}}>{messages.filter(m=>m.conversation_id===selected).map(m=><div id={"dm-message-"+m.id} key={m.id} className={"omMessageRow "+(m.sender_id===uid?"omMessageRow--mine ":"")+(m.id===newMessageId?"omCommentPop ":"")+(incomingIds.includes(m.id)?"omMessageIncoming":"")} onPointerDown={e=>{if(e.pointerType!=="mouse")holdTimer.current=setTimeout(()=>selectReply(m),500)}} onPointerUp={()=>{if(holdTimer.current)clearTimeout(holdTimer.current)}} onPointerCancel={()=>{if(holdTimer.current)clearTimeout(holdTimer.current)}} onPointerLeave={()=>{if(holdTimer.current)clearTimeout(holdTimer.current)}} style={{margin:"12px 0",textAlign:m.sender_id===uid?"right":"left",touchAction:"pan-y"}}><span className={"omMessageBubble "+(m.sender_id===uid?"omMessageBubble--mine":"omMessageBubble--theirs")} style={{display:"inline-block",padding:"13px 17px",borderRadius:22,maxWidth:"85%",overflowWrap:"anywhere",color:"white"}}>{m.reply_to_id&&<div style={{fontSize:12,opacity:.75,marginBottom:6,borderLeft:"2px solid white",paddingLeft:8}}>↪ {messages.find(x=>x.id===m.reply_to_id)?.body??"Earlier message"}</div>}<ExpressiveText text={m.body}/>{m.attachment_path&&mediaUrls[m.attachment_path]&&<div style={{marginTop:8}}>{m.attachment_type==="image"?<img src={mediaUrls[m.attachment_path]} alt="Message attachment" style={{maxWidth:"100%",maxHeight:280,borderRadius:8}}/>:m.attachment_type==="video"?<video controls src={mediaUrls[m.attachment_path]} style={{maxWidth:"100%",maxHeight:280}}/>:m.attachment_type==="audio"?<audio controls src={mediaUrls[m.attachment_path]}/>:<a href={mediaUrls[m.attachment_path]} target="_blank" rel="noopener noreferrer" style={{textDecoration:"underline"}}>Open attachment</a>}</div>}</span><div className="omReactionRail"><button className="omReactionChip omReactionReply" onClick={()=>selectReply(m)} aria-label="Reply">↩ Reply</button>{(showReactionTools?["❤️","👍","😂","🔥","💚","🤲","✨","🎉"]:["❤️","😂","🤲","✨"]).map(emoji=><button className={"omReactionChip "+(reactions.some(r=>r.message_id===m.id&&r.user_id===uid&&r.emoji===emoji)?"omReactionChip--active":"")} key={emoji} onClick={()=>void react(m.id,emoji)} aria-label={"React "+emoji} aria-pressed={reactions.some(r=>r.message_id===m.id&&r.user_id===uid&&r.emoji===emoji)}>{emoji} {reactions.filter(r=>r.message_id===m.id&&r.emoji===emoji).length||""}</button>)}<button type="button" className="omReactionChip omMoreReactions" onClick={()=>setShowReactionTools(v=>!v)} aria-label={showReactionTools?"Show fewer reactions":"Show more reactions"}>{showReactionTools?"−":"+ "}</button></div>{m.sender_id===uid&&<small style={{display:"block",opacity:.65}}>{peerReadAt&&new Date(peerReadAt)>=new Date(m.created_at)?"✓✓ Read":"✓ Sent"}</small>}</div>)}</div>
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
 <style jsx global>{`
/* Messaging mobile-first inbox: screenshot-aligned glass cards */
.omImessagePage .omMessengerTop{display:flex;align-items:center;justify-content:space-between;margin:12px 0 22px;gap:12px}.omImessagePage .omMessengerTop>div{display:flex;flex-direction:column;gap:8px}.omImessagePage .omMessengerHome{font-size:13px;color:#a9aed0;text-decoration:none}.omImessagePage .omMessengerHeading{margin:0!important;font-size:clamp(32px,5vw,44px)!important;font-weight:850;letter-spacing:-.045em}.omImessagePage .omMessengerNewButton{height:56px;width:56px;border-radius:50%;border:1px solid #b874ff;background:radial-gradient(circle at 40% 20%,#7544c9,#28145b);color:white;font-size:37px;line-height:1;box-shadow:0 0 22px #ab53ff66;cursor:pointer}.omImessagePage .omMessengerListHead{display:flex;flex-direction:column;gap:15px;margin:0 0 19px}.omImessagePage .omMessengerListHead>input{background:#0b1028!important;border:1px solid #66618e!important;color:white!important;border-radius:19px!important;padding:17px!important;width:100%;font-size:16px;outline:none}.omImessagePage .omMessengerFilters{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.omImessagePage .omMessengerFilters button{border:1px solid #44416b;border-radius:17px;padding:11px 3px;background:#090f24;color:#dddaf5;font-size:13px;cursor:pointer}.omImessagePage .omMessengerFilters button.active{background:linear-gradient(120deg,#365ec7,#3c2589);border-color:#7ca0ff;box-shadow:0 0 14px #536bf055;color:white}.omImessagePage .omConversationList{padding:20px!important}.omImessagePage .omConversationList>details,.omImessagePage .omConversationList>label:not(:first-child){font-size:12px;opacity:.78}.omImessagePage .omMessengerNewChat{display:none;margin:14px 0;padding:13px;border:1px solid #7162a455;border-radius:18px;background:#151631}.omImessagePage .omMessengerNewChat.open{display:block}.omImessagePage .omMessengerThreadList{display:flex;flex-direction:column;gap:10px}.omImessagePage .omMessengerThreadList>button{display:flex!important;align-items:center!important;gap:13px!important;padding:15px!important;min-height:88px;border-radius:21px!important;border:1px solid #675b9a!important;background:linear-gradient(130deg,#111631ed,#101a35e8)!important;box-shadow:inset 0 0 18px #ffffff07;color:white!important;text-align:left!important;transition:transform .2s,border-color .2s}.omImessagePage .omMessengerThreadList>button:hover{transform:translateY(-2px);border-color:#a67aff!important}.omImessagePage .omThreadAvatar{width:54px!important;height:54px!important;flex:0 0 54px!important;border-radius:50%!important;display:grid;place-items:center;background:linear-gradient(135deg,#7838bc,#171b51)!important;border:2px solid #ad65ff;box-shadow:0 0 14px #b95cff55;font-size:23px}.omImessagePage .omThreadAvatar img{width:100%;height:100%;border-radius:50%;object-fit:cover}.omImessagePage .omThreadMeta{display:flex;flex:1;min-width:0;flex-direction:column;gap:7px}.omImessagePage .omThreadMeta strong{font-size:17px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.omImessagePage .omThreadMeta small{font-size:12px;color:#a5a6c7}.omImessagePage .omThreadChevron{font-size:29px;color:#a9a4d8}.omImessagePage .omMessengerGroupCard{padding:20px;border-radius:20px;border:1px solid #7559ae;background:#181632;color:#eee;text-decoration:none;display:flex;justify-content:space-between}.omImessagePage .omMessengerEmpty{color:#b8b3d0;font-size:13px}@media(max-width:700px){.omImessagePage .omMessengerShell{display:block!important;min-height:0!important;border:0!important;background:transparent!important;box-shadow:none!important}.omImessagePage .omConversationList{border:0!important;border-radius:25px!important;min-height:60dvh}.omImessagePage .omMessengerShell--list .omChatPane{display:none!important}.omImessagePage .omMessengerShell--chat .omConversationList{display:none!important}.omImessagePage .omMessengerShell--chat .omChatPane{display:flex!important;min-height:75dvh;border-radius:23px;overflow:hidden}.omImessagePage .omMessengerTop{margin:8px 0 17px}.omImessagePage .omConversationList>details{margin:4px 0!important}.omImessagePage .omMessengerThreadList>button{margin:0!important}.omImessagePage .omMessengerListHead>input{margin:0!important}}

.omImessagePage{--im-border:#93a9c733;--im-blue:#0a84ff;--im-surface:#101d2d;--im-text:#f2f6ff}
.omImessagePage .omMessengerHeading{letter-spacing:-.04em;font-weight:850}
.omImessagePage .omMessengerShell{background:linear-gradient(155deg,#0c1524,#111d2b 55%,#101827);border:1px solid #a7bedc55!important;border-radius:28px!important;box-shadow:0 20px 65px #0006,0 0 0 1px #ffffff0b inset;overflow:hidden;min-height:min(740px,80dvh)!important}
.omImessagePage .omConversationList{background:linear-gradient(160deg,#1b2a3e,#111d2c);border-right:1px solid var(--im-border)!important}
.omImessagePage .omConversationList h2{font-size:20px!important;letter-spacing:-.025em}
.omImessagePage .omConversationList button{border-radius:16px!important;border:1px solid #c3d4ed26;transition:transform .18s,background .18s,box-shadow .18s}
.omImessagePage .omConversationList button:hover{transform:translateY(-1px);box-shadow:0 6px 20px #0003}
.omImessagePage .omChatPane{background:linear-gradient(180deg,#0e1727,#121c2c);min-height:0}
.omImessagePage .omChatHeader{background:#182438e8;border-bottom:1px solid #a5bddc33!important;backdrop-filter:blur(16px);font-weight:750;letter-spacing:.01em}
.omImessagePage .omMessagesFeed{flex:1!important;max-height:none!important;min-height:300px;padding:20px clamp(12px,3vw,30px)!important;background:radial-gradient(ellipse at 80% 10%,#24487822,transparent 60%),linear-gradient(#0c1524,#111c2b);scroll-behavior:smooth;overscroll-behavior:contain}
.omImessagePage .omMessageRow{animation:omImessageIn .3s cubic-bezier(.2,.9,.2,1) both}
.omImessagePage .omMessageBubble{max-width:min(82%,520px)!important;line-height:1.45;font-size:15px;white-space:pre-wrap;border:1px solid #ffffff2b!important;box-shadow:0 5px 17px #0003,0 1px 0 #ffffff28 inset;position:relative}
.omImessagePage .omMessageBubble--mine{background:linear-gradient(150deg,#329bff,#0877e9 80%)!important;color:#fff!important;border-radius:22px 22px 7px 22px!important}
/* Quran Studio-inspired frosted glass messaging, without obscuring the text */
.omImessagePage .omMessageBubble{backdrop-filter:blur(22px) saturate(145%);-webkit-backdrop-filter:blur(22px) saturate(145%);border:1px solid rgba(198,179,255,.42)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.22),0 9px 30px rgba(16,7,45,.34),0 0 18px rgba(132,90,255,.13)!important;transition:transform .2s ease,box-shadow .2s ease}
.omImessagePage .omMessageBubble--mine{background:linear-gradient(135deg,rgba(88,56,181,.75),rgba(30,95,151,.68))!important;border-radius:24px 24px 8px 24px!important}
.omImessagePage .omMessageBubble--theirs{background:linear-gradient(135deg,rgba(40,42,92,.78),rgba(33,73,107,.65))!important;border-radius:24px 24px 24px 8px!important}
.omImessagePage .omMessageBubble:active{transform:scale(.99)}
@media(prefers-reduced-motion:reduce){.omImessagePage .omMessageBubble{transition:none}}

.omImessagePage .omMessageBubble--theirs{background:linear-gradient(145deg,#35465c,#27374c)!important;color:#f8fbff!important;border-radius:22px 22px 22px 7px!important}
.omImessagePage .omMessageRow--mine .omMessageBubble{box-shadow:0 7px 24px #0066cc35,0 1px 0 #ffffff40 inset}
.omImessagePage .omMessageComposer{align-items:center!important;gap:9px!important;padding:12px!important;border-top:1px solid #a3b9d633;background:#19263aeb;backdrop-filter:blur(18px)}
.omImessagePage .omMessageComposer input[aria-label="Message"]{border:1px solid #afc4e266!important;background:#0e1b2d!important;color:#fff!important;border-radius:999px!important;padding:13px 17px!important;min-height:44px;box-shadow:inset 0 1px 5px #0003;outline:none}
.omImessagePage .omMessageComposer input[aria-label="Message"]:focus{border-color:#5db0ff!important;box-shadow:0 0 0 3px #328bff30}
.omImessagePage .omMessageComposer input::placeholder{color:#aebfd2}
.omImessagePage .omComposerExpand{border-radius:50%!important;min-width:40px;min-height:40px}
.omImessagePage .omComposerSend{border-radius:999px!important;background:linear-gradient(135deg,#4eaeff,#0b7ef1)!important;color:white!important;border:1px solid #a2d9ff66!important;box-shadow:0 4px 16px #0085ff55;min-height:42px}
.omImessagePage .omComposerTools{background:#19263a;border-top:1px solid #ffffff16;padding-top:8px!important;padding-bottom:8px!important}
.omImessagePage .omReactionChip{border-radius:999px!important}
@keyframes omImessageIn{from{opacity:0;transform:translateY(8px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
@media(max-width:600px){.omImessagePage{margin:8px auto!important;padding:0 8px!important}.omImessagePage .omMessengerShell{border-radius:23px!important;min-height:calc(100dvh - 150px)!important}.omImessagePage .omChatPane{min-height:calc(100dvh - 170px)}.omImessagePage .omMessagesFeed{min-height:40dvh!important}.omImessagePage .omMessageBubble{max-width:88%!important}.omImessagePage .omMessageComposer{padding:9px!important}.omImessagePage .omMessengerHeading{font-size:27px!important}}
@media(prefers-reduced-motion:reduce){.omImessagePage .omMessageRow{animation:none}.omImessagePage .omConversationList button{transition:none}}
`}</style>
 <style jsx>{`.voiceStudio{margin:12px 12px 4px;padding:17px;border-radius:23px;border:1px solid #40886a;background:linear-gradient(145deg,#163d30,#0d211d);box-shadow:0 12px 40px #0004;color:#f4fff9}.voiceStudioTop,.voiceStudioBottom{display:flex;align-items:center;justify-content:space-between;gap:10px}.voiceStudioTop strong{font-size:15px}.voiceStudioTop small{display:block;font-size:11px;color:#aac9b9;margin-top:3px}.voiceStudioTop>span{font-size:10px;font-weight:800;letter-spacing:.08em;color:#b6efc8}.voiceStudioTop .voiceLive{color:#ff9ca6;animation:voicePulse 1.2s infinite}.voiceStudioWave{height:70px;display:flex;align-items:center;justify-content:center;gap:3px;margin:8px 0}.voiceStudioWave i{display:block;flex:1;max-width:6px;min-width:2px;background:linear-gradient(#8ff3bd,#2fa879);border-radius:9px;transition:height .12s}.voiceStudioBottom{justify-content:flex-start;flex-wrap:wrap}.voiceStudioBottom button{border:1px solid #ffffff35;border-radius:99px;padding:10px 13px;color:#e9fff1;background:#ffffff15;cursor:pointer;font-weight:700}.voiceStudioBottom .voiceCircle{background:#b8f6ce;color:#0b2519;border:0;width:43px;height:43px}.voiceStudioBottom .voiceSend{background:#52d68c;color:#062112;border:0}.voiceStudioBottom .voiceDiscard{color:#ffbbc2}.voiceTime{font-variant-numeric:tabular-nums;font-weight:800;font-size:14px}.voiceSeek{flex:1;min-width:65px;accent-color:#70e5a2}.voiceLaunch{border-radius:999px;padding:9px 13px;background:#205d42;color:#e5ffec;border:1px solid #479c6c;cursor:pointer}.voiceSpeed{white-space:nowrap}@keyframes voicePulse{50%{opacity:.4}}@media(max-width:600px){main>div{grid-template-columns:1fr!important}aside{border-right:0!important;border-bottom:1px solid #64748b55}}`}</style>
<style jsx global>{`/* Messenger cinematic glass theme — last-in-cascade overrides */
.omImessagePage{--im-blue:#a780ff!important;max-width:1280px!important;margin:0 auto!important;padding:14px 12px 24px!important;isolation:isolate}
.omImessagePage .omMessengerHeading{font-size:clamp(28px,4vw,40px)!important;color:#fff;text-shadow:0 2px 20px #9665ff50}
.omImessagePage .omMessengerShell{min-height:min(77dvh,900px)!important;border:1px solid #a886f68c!important;border-radius:30px!important;background:linear-gradient(135deg,#080c22f2,#110c2af0)!important;box-shadow:0 18px 75px #08051c99,0 0 35px #7547da22;overflow:hidden}
.omImessagePage .omConversationList{background:radial-gradient(ellipse at 20% 95%,#51237a55,transparent 45%),linear-gradient(165deg,#070c20f5,#0a1028f5)!important;border-right:1px solid #a887ff55!important;padding:22px!important}
.omImessagePage .omConversationList button{display:flex!important;align-items:center;gap:11px;background:linear-gradient(130deg,#151a3bcb,#10192fdb)!important;border:1px solid #aa91ed55!important;color:#f5f0ff!important;padding:13px!important;border-radius:18px!important;box-shadow:inset 0 1px 0 #ffffff15,0 5px 15px #0003;min-height:58px}
.omImessagePage .omConversationList button:hover,.omImessagePage .omConversationList button:focus-visible{border-color:#b998ff!important;box-shadow:0 0 23px #915fff48!important}
.omImessagePage .omConversationList input{background:#080e27!important;border:1px solid #9d8acf66!important;color:white!important;border-radius:16px!important}
.omThreadAvatar{width:38px;height:38px;display:inline-flex;align-items:center;justify-content:center;flex:none;border-radius:50%;border:1px solid #ba8aff;background:linear-gradient(135deg,#492b91,#081c44);color:#d7c0ff;font-size:21px;box-shadow:0 0 13px #a36dff66;overflow:hidden}
.omThreadAvatar img{width:100%;height:100%;object-fit:cover}
.omImessagePage .omChatPane{background:#080d23!important}
.omImessagePage .omChatHeader{background:linear-gradient(120deg,#0b1029f5,#141432e9)!important;border-bottom:1px solid #9c7ed666!important;color:#fff!important}
.omChatPeerName{font-size:19px;letter-spacing:-.025em}
.omImessagePage .omMessagesFeed{background:radial-gradient(circle at 85% 18%,#8d5be34a 0 1px,transparent 3px),radial-gradient(circle at 25% 33%,#80baff77 0 1px,transparent 3px),radial-gradient(circle at 62% 70%,#a9aaff88 0 1px,transparent 2px),radial-gradient(ellipse at 70% 14%,#482e9060,transparent 46%),radial-gradient(ellipse at 20% 86%,#371b6555,transparent 55%),linear-gradient(175deg,#060c27,#101033 65%,#0a0923)!important;background-size:151px 163px,229px 257px,191px 211px,auto,auto,auto!important}
.omImessagePage .omMessageBubble{background:linear-gradient(135deg,#262044d9,#1d335ecb)!important;border:1px solid #c4a6ff99!important;border-radius:23px 23px 23px 8px!important;backdrop-filter:blur(24px) saturate(160%)!important;-webkit-backdrop-filter:blur(24px) saturate(160%)!important;box-shadow:inset 0 1px 0 #ffffff45,0 8px 26px #0808208c,0 0 16px #9b6dff35!important;color:#fff!important}
.omImessagePage .omMessageBubble--mine{background:linear-gradient(135deg,#602ab5d9,#264c9bd9)!important;border-color:#cfadff!important;border-radius:23px 23px 8px 23px!important;box-shadow:inset 0 1px 0 #ffffff6b,0 8px 26px #09092a8c,0 0 20px #a062ff65!important}
.omImessagePage .omMessageRow{animation:omGlassMessageEnter .33s cubic-bezier(.2,.8,.2,1) both!important}
@keyframes omGlassMessageEnter{from{opacity:0;transform:translateY(8px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
.omImessagePage .omMessageComposer{background:linear-gradient(125deg,#11102eea,#18103be8)!important;border-top:1px solid #a87bf67a!important;backdrop-filter:blur(22px)!important}
.omImessagePage .omMessageComposer input[aria-label="Message"]{background:#080d27e8!important;border:1px solid #a38ad888!important;color:white!important}
.omImessagePage .omMessageComposer button,.omImessagePage .voiceLaunch{border:1px solid #b793ff7a!important;background:linear-gradient(135deg,#352064,#192958)!important;color:#fff!important;box-shadow:0 0 14px #8b58f733}
.omImessagePage .voiceStudio{background:linear-gradient(120deg,#221344e8,#14254be8)!important;border:1px solid #b08fff8c!important;border-radius:22px!important;backdrop-filter:blur(20px);box-shadow:0 0 25px #7445db36}
.omImessagePage .voiceStudioWave i{background:linear-gradient(#c49bff,#65c8ff)!important}
@media(max-width:700px){.omImessagePage .omMessengerShell{min-height:calc(100dvh - 180px)!important}.omImessagePage .omConversationList{padding:12px!important}.omImessagePage .omMessagesFeed{min-height:250px!important}.omImessagePage .omMessageBubble{max-width:88%!important}}
@media(prefers-reduced-motion:reduce){.omImessagePage .omMessageRow{animation:none!important}}
`}</style>
 </main>
}