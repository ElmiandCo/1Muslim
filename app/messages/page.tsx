"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import ExpressionKeyboard from "../components/ExpressionKeyboard";
import HomeMessagesChooser from "../components/HomeMessagesChooser";
import MessengerDesignDemo from "../messenger-design/MessengerDesignClient";
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
 const [threadPreviews,setThreadPreviews]=useState<Record<string,string>>({});
 const [unreadThreads,setUnreadThreads]=useState<Record<string,number>>({});
 useEffect(()=>{if(!uid||!threads.length)return;let alive=true;const refresh=async()=>{const ids=[...new Set(threads.map(t=>t.conversation_id))];const {data:reads}=await client.from("dm_participants").select("conversation_id,last_read_at").eq("user_id",uid).in("conversation_id",ids);const {data:recent}=await client.from("dm_messages").select("conversation_id,created_at,sender_id").in("conversation_id",ids).order("created_at",{ascending:false}).limit(500);if(!alive)return;const readMap=new Map((reads??[]).map(x=>[x.conversation_id,x.last_read_at]));const counts:Record<string,number>={};for(const msg of recent??[]){if(msg.sender_id===uid)continue;const read=readMap.get(msg.conversation_id);if(!read||new Date(msg.created_at).getTime()>new Date(read).getTime())counts[msg.conversation_id]=(counts[msg.conversation_id]||0)+1}setUnreadThreads(counts)};void refresh();const timer=setInterval(()=>void refresh(),12000);return()=>{alive=false;clearInterval(timer)}},[client,uid,threads]);
 const [names,setNames]=useState<Record<string,string>>({});
 const [avatars,setAvatars]=useState<Record<string,string>>({});
 const [search,setSearch]=useState("");
 const [messageFilter,setMessageFilter]=useState<"all"|"unread"|"ashab"|"groups"|"calls">("all");
 const [newChatOpen,setNewChatOpen]=useState(false);
 const [people,setPeople]=useState<{id:string;display_name:string;username:string|null;gender?:string|null;avatar_gender?:string|null;avatar_config?:{selectedAvatarUrl?:string;adminAvatarUrl?:string}|null}[]>([]);
 const [selected,setSelected]=useState<string|null>(null);
 const [messages,setMessages]=useState<Message[]>([]);
 const [draft,setDraft]=useState("");
 const [showComposerTools,setShowComposerTools]=useState(false);
 const [showReactionTools,setShowReactionTools]=useState(false);
 const [messengerTheme,setMessengerTheme]=useState<"night"|"day">("night");
 useEffect(()=>{try{const saved=localStorage.getItem("1muslim:messenger-theme");if(saved==="day"||saved==="night")setMessengerTheme(saved)}catch{}},[]);
 const toggleMessengerTheme=()=>setMessengerTheme(v=>{const next=v==="night"?"day":"night";try{localStorage.setItem("1muslim:messenger-theme",next)}catch{}return next});

 const [expressionEvent,setExpressionEvent]=useState(0);
 const [expressionEmoji,setExpressionEmoji]=useState("✨");
 const [newMessageId,setNewMessageId]=useState<string|null>(null);
 const [incomingIds,setIncomingIds]=useState<string[]>([]);
 const [targetMessage,setTargetMessage]=useState<string|null>(null);
 const [reactionOpen,setReactionOpen]=useState<string|null>(null);
 const [bubbleSpark,setBubbleSpark]=useState<string|null>(null);
 const sparkleTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const spark=(id:string)=>{setBubbleSpark(id);if(sparkleTimer.current)clearTimeout(sparkleTimer.current);sparkleTimer.current=setTimeout(()=>setBubbleSpark(null),650)};
 const showReactions=(id:string)=>{setReactionOpen(id);spark(id);if(typeof navigator!=="undefined"&&"vibrate" in navigator)navigator.vibrate(12)};
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
 const load=async()=>{const {data,error}=await client.from("dm_participants").select("conversation_id,user_id").order("joined_at",{ascending:false});if(active){if(error)setError(error.message);else {const peers=(data??[]).filter(p=>p.user_id!==uid);setThreads(peers);const cids=[...new Set(peers.map(p=>p.conversation_id))];if(cids.length){void client.from("dm_messages").select("conversation_id,body,created_at").in("conversation_id",cids).order("created_at",{ascending:false}).limit(300).then(({data})=>{if(active){const previews:Record<string,string>={};for(const m of data??[]){if(!(m.conversation_id in previews))previews[m.conversation_id]=m.body||"Media message"}setThreadPreviews(previews)}})}const ids=[...new Set(peers.map(p=>p.user_id))];if(ids.length){const {data:profiles,error:profileError}=await client.from("profiles").select("id,display_name,username,gender,avatar_gender,avatar_config").in("id",ids);if(active){if(profileError){setError("Unable to load member names: "+profileError.message)}else{setNames(Object.fromEntries((profiles??[]).map(p=>[p.id,p.display_name?.trim()||p.username?.trim()||"Member"])));setAvatars(Object.fromEntries((profiles??[]).map(p=>{const config=p.avatar_config as {selectedAvatarUrl?:string;adminAvatarUrl?:string;gender?:string}|null;const safe=(url?:string)=>url&&(/^(https:\/\/)/.test(url)||/^\/assets\/avatars\/[a-zA-Z0-9._-]+$/.test(url))?url:"";return [p.id,safe(config?.selectedAvatarUrl)||safe(config?.adminAvatarUrl)||(String(config?.gender||p.avatar_gender||p.gender||"male").toLowerCase()==="female"?"/assets/avatars/Default-women.png":"/assets/avatars/default-male.jpg")]})))}}}}}};
 load();const timer=window.setInterval(()=>{void load()},5000);return()=>{active=false;window.clearInterval(timer)};
 },[client,uid]);
 useEffect(()=>{if(!selected)return;let active=true;setMessages([]);setReactions([]);setMediaUrls({});setReplyTo(null);setStatus(null);
 const loadStatus=async()=>{const {data}=await client.from("dm_conversations").select("request_status,requested_by").eq("id",selected).single();if(active)setStatus(data)};void loadStatus();const statusTimer=window.setInterval(()=>{void loadStatus()},5000);
 const markRead=async()=>{if(!uid)return;setUnreadThreads(v=>({...v,[selected!]:0}));await client.from("dm_participants").update({last_read_at:new Date().toISOString()}).eq("conversation_id",selected).eq("user_id",uid)};
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
 useEffect(()=>{if(!uid||search.trim().length<2){setPeople([]);return}let active=true;const timer=setTimeout(async()=>{const q=search.trim().replace(/[%_,]/g,"");const {data}=await client.from("profiles").select("id,display_name,username,gender,avatar_gender,avatar_config").or(`display_name.ilike.%${q}%,username.ilike.%${q}%`).neq("id",uid).limit(8);if(active)setPeople(data??[])},350);return()=>{active=false;clearTimeout(timer)}},[client,uid,search]);
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
 const launchCallOnce=useRef(false);
 useEffect(()=>{
  if(!peerId||!selected||!status||blocked.includes(peerId)||launchCallOnce.current)return;
  const requested=new URLSearchParams(window.location.search).get("call");
  if(requested!=="audio"&&requested!=="video")return;
  if(status.request_status!=="accepted"&&status.request_status!=="pending")return;
  launchCallOnce.current=true;
  const timer=window.setTimeout(()=>window.dispatchEvent(new CustomEvent("1muslim:start-call",{detail:requested})),450);
  window.history.replaceState(null,"",window.location.pathname+"?conversation="+encodeURIComponent(selected));
  return()=>window.clearTimeout(timer);
 },[peerId,selected,status,blocked]);


 const [conversationMode,setConversationMode]=useState<"normal"|"hudhud">("normal");
 const [myConversationXp,setMyConversationXp]=useState(0);
 const [peerConversationXp,setPeerConversationXp]=useState(0);
 const [modeBusy,setModeBusy]=useState(false);
 const xpController=uid&&peerId?(myConversationXp===peerConversationXp?null:myConversationXp>peerConversationXp?uid:peerId):null;
 const canControlMode=Boolean(uid&&peerId&&xpController===uid);
 useEffect(()=>{if(!selected||!uid||!peerId)return;let alive=true;const key="1muslim-dm-mode:"+selected;
  try{setConversationMode(localStorage.getItem(key)==="hudhud"?"hudhud":"normal")}catch{setConversationMode("normal")}
  const refresh=async()=>{const {data}=await client.from("profiles").select("id,xp_total").in("id",[uid,peerId]);if(!alive)return;setMyConversationXp(Number(data?.find(p=>p.id===uid)?.xp_total||0));setPeerConversationXp(Number(data?.find(p=>p.id===peerId)?.xp_total||0))};
  void refresh();const interval=window.setInterval(()=>void refresh(),20000);
  const channel=client.channel("dm-mode:"+selected).on("broadcast",{event:"mode_changed"},({payload})=>{if(!alive||!payload||payload.controller_id!==xpController&&xpController!==null)return;const mode=payload.mode==="hudhud"?"hudhud":"normal";setConversationMode(mode);try{localStorage.setItem(key,mode)}catch{}}).subscribe();
  return()=>{alive=false;window.clearInterval(interval);void client.removeChannel(channel)};
 },[client,selected,uid,peerId,xpController]);
 const setSharedConversationMode=async(mode:"normal"|"hudhud")=>{if(!selected||!uid||!canControlMode||modeBusy)return;setModeBusy(true);setConversationMode(mode);try{localStorage.setItem("1muslim-dm-mode:"+selected,mode)}catch{}await client.channel("dm-mode:"+selected).send({type:"broadcast",event:"mode_changed",payload:{mode,controller_id:uid}});setModeBusy(false)};

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
 useEffect(()=>{if(!selected||!uid||!peerId||!(status?.request_status==="accepted"||status?.request_status==="pending")||blocked.includes(peerId))return;window.dispatchEvent(new CustomEvent("1muslim:call-context",{detail:{conversationId:selected,userId:uid,peerName:names[peerId]||"Member",peerAvatar:avatars[peerId]||null}}));},[selected,uid,peerId,status?.request_status,blocked,names,avatars]);
 if(loadingAuth)return <main style={{padding:32}}>Loading messages…</main>;
 if(!uid)return <MessengerDesignDemo/>;
 if(uid&&!selected)return <MessengerDesignDemo liveThreads={Array.from(new Set(threads.map(t=>t.conversation_id))).map(cid=>{const peer=threads.find(t=>t.conversation_id===cid)?.user_id??"";return {id:cid,name:names[peer]||"Member",avatar:avatars[peer]||"",preview:threadPreviews[cid]||"Start chatting",unread:unreadThreads[cid]||0}})} onOpenThread={setSelected}/>;
 return <main className={"omImessagePage omMessengerUnified "+(messengerTheme==="day"?"omMessengerDay":"omMessengerNight")} style={{maxWidth:1150,margin:"20px auto",padding:"0 12px",color:"var(--text,#f4f4f5)"}}><style>{`
.omMessengerTopNav{display:flex;gap:4px;padding:5px;margin:0 0 12px;border-radius:17px;background:rgba(4,52,41,.92);border:1px solid #d7bb7966;overflow-x:auto;scrollbar-width:none}
.omMessengerTopNav a{flex:1;min-width:45px;padding:8px 3px;display:flex;flex-direction:column;align-items:center;gap:3px;border-radius:12px;text-decoration:none;color:#f3e7c8;font-size:19px}
.omMessengerTopNav a span{font-size:10px}
.omMessengerTopNav a[aria-current="page"]{background:#087e5a;color:white}
@media(max-width:700px){.omImessagePage.omMessengerUnified .omMessengerTop{height:auto!important;min-height:96px!important}.omMessengerTopNav a span{font-size:9px}.omImessagePage.omMessengerUnified .omMessengerShell--chat{height:calc(100dvh - 215px)!important;min-height:300px!important}.omImessagePage.omMessengerUnified .omMessageComposer{position:relative;z-index:3}}
`}</style><div className="omMessengerPattern" aria-hidden="true"/><div className="omMessengerOrnaments" aria-hidden="true"><span className="omMessengerOrnamentNight"/><span className="omMessengerOrnamentDay"/></div>
 <div className="omMessengerTop"><div><Link href="/" className="omMessengerHome">← Home</Link><h1 className="omMessengerHeading">☾ 1Muslim <span className="omMessengerBrandSub">MESSENGER</span></h1></div><button className="omMessengerNewButton" type="button" onClick={()=>setNewChatOpen(v=>!v)} aria-label="Create message, group, or call" aria-expanded={newChatOpen}>＋</button></div><nav className="omMessengerTopNav" aria-label="Messenger navigation"><Link href="/">⌂ <span>Home</span></Link><Link href="/live">◉ <span>Live</span></Link><Link href="/explore">◇ <span>Explore</span></Link><Link href="/messages" aria-current="page">● <span>Messages</span></Link><Link href="/alerts">♧ <span>Alerts</span></Link><Link href="/profile">◯ <span>Profile</span></Link></nav>
 {selected&&<nav className="omMobileThreadStrip" aria-label="Switch conversations">{Array.from(new Set(threads.map(t=>t.conversation_id))).map(cid=>{const peer=threads.find(t=>t.conversation_id===cid)?.user_id??"";return <button key={cid} type="button" className={"omMobileThread "+(selected===cid?"isActive":"")} onClick={()=>setSelected(cid)}><span className="omMobileThreadAvatar">{avatars[peer]?<img src={avatars[peer]} alt=""/>:"☪"}</span><strong>{names[peer]||"Member"}</strong><small>{threadPreviews[cid]||"Start chatting"}</small></button>})}</nav>}
 <div className={"omMessengerShell "+(selected?"omMessengerShell--chat":"omMessengerShell--list")} style={{display:"grid",gridTemplateColumns:"minmax(220px,1fr) minmax(0,2fr)",minHeight:560,border:"1px solid #64748b55",borderRadius:28,overflow:"hidden"}}>
 <aside className="omConversationList" style={{padding:18,borderRight:"1px solid #64748b55"}}><section className="omMessengerDiscovery" aria-label="Explore Ummah members"><div className="omMessengerDiscoveryTitle"><strong>✦ Connect with the Ummah</strong><small>Discover members</small></div><HomeMessagesChooser/></section>
 <div className="omMessengerStories" aria-label="Recent conversations"><button className="omMessengerStoryCreate" type="button" onClick={()=>setNewChatOpen(true)}><span>＋</span><small>Create Note</small></button>{Array.from(new Set(threads.map(t=>t.conversation_id))).slice(0,7).map(cid=>{const peer=threads.find(t=>t.conversation_id===cid)?.user_id??"";return <button type="button" key={cid} className="omMessengerStory" onClick={()=>setSelected(cid)}><span className="omMessengerStoryRing">{avatars[peer]?<img src={avatars[peer]} alt=""/>:<span>☪</span>}</span><small>{names[peer]||"Member"}</small></button>})}<Link href="/messages/groups" className="omMessengerStory"><span className="omMessengerStoryRing omMessengerStoryGroup">☪</span><small>Groups</small></Link></div><div className="omMessengerListHead"><input aria-label="Search messages" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search messages, members, or groups..." /><div className="omMessengerFilters">{(["all","groups","unread","ashab","calls"] as const).map(filter=><button key={filter} type="button" className={messageFilter===filter?"active":""} onClick={()=>setMessageFilter(filter)}>{filter==="all"?"All":filter==="unread"?"Unread":filter==="ashab"?"Contacts":filter==="groups"?"Groups":"Calls"}</button>)}</div></div><details className="omMessengerExtras"><summary aria-label="Messenger settings">⚙ Settings</summary><label style={{display:"block",margin:"8px 0"}}>Preferred translation language <select value={translateTo} onChange={e=>void saveEnhancements(e.target.value,aiAssistance)}><option value="off">Off</option><option value="en">English</option><option value="ar">Arabic</option><option value="so">Somali</option><option value="fr">French</option><option value="es">Spanish</option><option value="ur">Urdu</option></select></label><label style={{display:"block",fontSize:12}}><input type="checkbox" checked={aiAssistance} onChange={e=>void saveEnhancements(translateTo,e.target.checked)}/> Opt in to HudHud AI assistance (coming soon)</label><div style={{fontSize:12,marginTop:8}}>🪶 HudHud Free: {reward?(reward.eligible?"Unlocked — certified member with over 100,000 XP":`${reward.xp.toLocaleString()} / 100,001 XP · ${reward.certified?"Certified":"Certification required"}`):"Checking eligibility…"}</div><div style={{fontSize:12,marginTop:8}}>🏅 Your badges: {badges.length?badges.map(b=>b.badge_name).join(", "):"None yet"}</div><p style={{fontSize:12,opacity:.75}}>Translation and AI are not active until securely configured. Badges do not bypass message permissions. Premium features require verified billing.</p></details><label style={{display:"block",fontSize:12,margin:"12px 0"}}><input type="checkbox" checked={allowRequests} onChange={e=>void savePrivacy(e.target.checked)}/> Allow members to message me</label><style>{`.omPersonSearchResult{display:flex;align-items:center;gap:12px;width:100%;padding:10px;margin:5px 0;border:1px solid #c6d9c42e;border-radius:14px;text-align:left;background:#16392c;color:#f5f4ed;cursor:pointer;transition:background .2s ease,transform .2s ease}.omPersonSearchResult:hover{background:#23513e;transform:translateY(-1px)}.omPersonSearchResult>span:last-child{display:grid;gap:3px;min-width:0}.omPersonSearchResult small{color:#c4d8cc;font-size:11px}.omPersonSearchAvatar{width:44px;height:44px;flex-shrink:0;display:grid;place-items:center;overflow:hidden;border-radius:50%;border:1px solid #e8ce9877;background:#305b4b;color:#fff;font-weight:700}.omPersonSearchAvatar img{width:100%;height:100%;object-fit:cover}@media(prefers-reduced-motion:reduce){.omPersonSearchResult{transition:none!important}}`}</style><div className={"omMessengerNewChat "+(newChatOpen?"open":"") }><div className="omQuickActions"><strong>Start something</strong><Link href="/messages/groups">👥 New group</Link><Link href="/messages/public">🌍 Public calls</Link><button type="button" onClick={()=>setNewChatOpen(false)}>💬 New message ↓</button></div><label htmlFor="member-search">Find a member</label><input id="member-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or @username" style={{width:"100%",padding:12,margin:"10px 0",borderRadius:10,color:"#111"}}/>{people.map(person=><button key={person.id} onClick={()=>{setRecipient(person.id);setSearch("");setPeople([])}} className="omPersonSearchResult"><span className="omPersonSearchAvatar">{person.avatar_config?.selectedAvatarUrl||person.avatar_config?.adminAvatarUrl||person.avatar_gender||person.gender?<img src={person.avatar_config?.selectedAvatarUrl||person.avatar_config?.adminAvatarUrl||(String(person.avatar_gender||person.gender).toLowerCase()==="female"?"/assets/avatars/Default-women.png":"/assets/avatars/default-male.jpg")} alt="" />:<span>{(person.display_name||"M").slice(0,1).toUpperCase()}</span>}</span><span><strong>{person.display_name}</strong><small>{person.username?"@"+person.username:"1Muslim member"}</small></span></button>)}<label htmlFor="recipient">Selected member ID</label>
 <input id="recipient" value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="Recipient UUID" style={{width:"100%",padding:12,margin:"10px 0",borderRadius:10,color:"#111"}}/>
 <button disabled={busy||!recipient.trim()} onClick={start} style={{padding:10,borderRadius:10}}>Start conversation →</button></div>
 <div className="omMessengerThreadList" style={{marginTop:20}}>{messageFilter==="groups"?<Link href="/messages/groups" className="omMessengerGroupCard">👥 Groups · Messages · Public Calls <span>→</span></Link>:messageFilter==="calls"?<><Link href="/messages/public" className="omMessengerGroupCard">🌍 Public calls <span>→</span></Link><p className="omMessengerEmpty">Open a conversation to call someone directly.</p></>:Array.from(new Set(threads.map(t=>t.conversation_id))).filter(cid=>{const peer=threads.find(t=>t.conversation_id===cid)?.user_id??"";return (messageFilter!=="unread"||!!unreadThreads[cid])&&(!search.trim()||(names[peer]||"").toLowerCase().includes(search.toLowerCase()))}).map(cid=><button key={cid} onClick={()=>setSelected(cid)} className={unreadThreads[cid]?"omUnreadThread":""} style={{display:"block",width:"100%",padding:14,marginBottom:8,textAlign:"left",borderRadius:12,background:selected===cid?"#155e75":"#334155",color:"white"}}><span className="omThreadAvatar">{avatars[threads.find(t=>t.conversation_id===cid)?.user_id??""]?<img alt="" src={avatars[threads.find(t=>t.conversation_id===cid)?.user_id??""]}/>: "☪"}</span><span className="omThreadMeta"><strong>{names[threads.find(t=>t.conversation_id===cid)?.user_id??""]||"Member"}</strong><small>{threadPreviews[cid]||"Start chatting"}</small></span><span className="omThreadChevron" aria-hidden="true">›</span>{!!unreadThreads[cid]&&<span className="omUnreadBadge" aria-label={unreadThreads[cid]+" unread messages"}>{unreadThreads[cid]>99?"99+":unreadThreads[cid]}</span> }</button>)}</div>
 </aside><section className="omChatPane" style={{display:"flex",flexDirection:"column",minWidth:0}}>
 <header className="omChatHeader" style={{padding:18,borderBottom:"1px solid #64748b55"}}>{selected&&<button type="button" className="omBackToChats" onClick={()=>setSelected(null)} aria-label="Back to conversations">← Chats</button>}{selected?<><span className="omChatIdentity">{peerId&&<span className="omChatPeerAvatar">{avatars[peerId]?<img src={avatars[peerId]} alt=""/>:"☪"}</span>}<span className="omChatIdentityText"><strong className="omChatPeerName">{names[peerId??""]||"Private conversation"}</strong><span className="omChatPresence"><i className={peerOnline?"isOnline":""}/>{peerOnline?"Online now":"Offline"}{peerTyping?" · typing…":""}</span></span></span>{(status?.request_status==="accepted"||status?.request_status==="pending")&&peerId&&!blocked.includes(peerId)&&<span className="omChatCallActions"><button type="button" title="Voice call" aria-label="Start voice call" onClick={()=>window.dispatchEvent(new CustomEvent("1muslim:start-call",{detail:"audio"}))}><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m5 4 4 4-2 2a15 15 0 0 0 7 7l2-2 4 4-2 2c-1 1-2 1-3 .5A21 21 0 0 1 2.5 9C2 8 2 7 3 6l2-2Z"/></svg></button><button type="button" title="Video call" aria-label="Start video call" onClick={()=>window.dispatchEvent(new CustomEvent("1muslim:start-call",{detail:"video"}))}><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="14" height="14" rx="3"/><path d="m16 10 6-3v10l-6-3"/></svg></button></span>}</>:"Choose a conversation"}<button type="button" className="omThemeToggle" onClick={toggleMessengerTheme} title={messengerTheme==="night"?"Switch to day mode":"Switch to night mode"} aria-label={messengerTheme==="night"?"Switch Messenger to day mode":"Switch Messenger to night mode"} aria-pressed={messengerTheme==="day"}>{messengerTheme==="night"?"☀":"☾"}</button>{selected&&peerId&&<div className="omDmModeControl"><span className="omDmModeAuthority">🌀 {xpController?(xpController===uid?"You control this chat":(names[peerId]||"Other member")+" controls this chat"):"Equal XP · Normal Mode"} <small>{myConversationXp.toLocaleString()} vs {peerConversationXp.toLocaleString()} XP</small></span><div className="omDmModeChoices"><button type="button" className={conversationMode==="normal"?"isSelected":""} disabled={!canControlMode||modeBusy} onClick={()=>void setSharedConversationMode("normal")}>Normal</button><button type="button" className={conversationMode==="hudhud"?"isSelected":""} disabled={!canControlMode||modeBusy} onClick={()=>void setSharedConversationMode("hudhud")}>✦ HudHud</button></div></div>}{selected&&peerId&&<div style={{display:"flex",gap:10,marginTop:10,fontSize:12}}><button onClick={()=>void toggleBlock()}>{blocked.includes(peerId)?"Unblock member":"Block member"}</button><button onClick={()=>setShowReport(v=>!v)}>Report member</button></div>}</header>{selected&&showReport&&<section style={{padding:12,borderBottom:"1px solid #64748b55"}}><label>Reason <select value={reportReason} onChange={e=>setReportReason(e.target.value)}><option value="spam">Spam</option><option value="harassment">Harassment</option><option value="hate">Hate</option><option value="sexual_content">Sexual content</option><option value="other">Other</option></select></label><textarea value={reportDetails} onChange={e=>setReportDetails(e.target.value)} maxLength={1000} placeholder="Optional details" style={{display:"block",width:"100%",color:"#111",padding:8,margin:"8px 0"}}/><button onClick={()=>void submitReport()}>Submit report</button></section>}
 <div aria-live="polite" className={"omMessagesFeed "+(conversationMode==="hudhud"?"omDmHudHudMode":"omDmNormalMode")} style={{flex:1,padding:20,overflowY:"auto",maxHeight:480}}>{messages.filter(m=>m.conversation_id===selected).map(m=><div id={"dm-message-"+m.id} key={m.id} className={"omMessageRow "+(m.sender_id===uid?"omMessageRow--mine ":"")+(m.id===newMessageId?"omCommentPop ":"")+(incomingIds.includes(m.id)?"omMessageIncoming":"")} onPointerDown={e=>{if(e.pointerType!=="mouse")holdTimer.current=setTimeout(()=>showReactions(m.id),420)}} onClick={e=>{if((e.target as HTMLElement).closest("button,a"))return;spark(m.id);if(reactionOpen&&reactionOpen!==m.id)setReactionOpen(null)}} onContextMenu={e=>{e.preventDefault();showReactions(m.id)}} onPointerUp={()=>{if(holdTimer.current)clearTimeout(holdTimer.current)}} onPointerCancel={()=>{if(holdTimer.current)clearTimeout(holdTimer.current)}} onPointerLeave={()=>{if(holdTimer.current)clearTimeout(holdTimer.current)}} style={{margin:"12px 0",textAlign:m.sender_id===uid?"right":"left",touchAction:"pan-y"}}><span className={"omMessageBubble "+(m.sender_id===uid?"omMessageBubble--mine":"omMessageBubble--theirs")+(bubbleSpark===m.id?" omBubbleSpark":"")} style={{display:"inline-block",padding:"13px 17px",borderRadius:22,maxWidth:"85%",overflowWrap:"anywhere",color:"white"}}>{m.reply_to_id&&<div style={{fontSize:12,opacity:.75,marginBottom:6,borderLeft:"2px solid white",paddingLeft:8}}>↪ {messages.find(x=>x.id===m.reply_to_id)?.body??"Earlier message"}</div>}{m.body.startsWith("📅 Scheduled Live: ")&&m.body.includes("/streaming/scheduled?slot=")?<Link href={m.body.match(/\/streaming\/scheduled\?slot=[a-f0-9-]+/)?.[0]||"/streaming/scheduled"} style={{display:"block",border:"1px solid #8fe7d080",background:"linear-gradient(140deg,#ffffff23,#153c3b55)",borderRadius:16,padding:14,color:"inherit",textDecoration:"none",backdropFilter:"blur(12px)"}}><span style={{fontSize:11,opacity:.8}}>📅 LIVE INVITATION</span><strong style={{display:"block",fontSize:16,margin:"7px 0"}}>{m.body.split("\n")[0].replace("📅 Scheduled Live: ","")}</strong><span style={{fontSize:12}}>{m.body.split("\n")[1]}</span><span style={{display:"block",marginTop:10,fontWeight:800,color:"#93f4d7"}}>View scheduled Live →</span></Link>:<ExpressiveText text={m.body.replace(/\\r\\n|\\n|\\r/g,"\n")}/>}{m.attachment_path&&mediaUrls[m.attachment_path]&&<div style={{marginTop:8}}>{m.attachment_type==="image"?<img src={mediaUrls[m.attachment_path]} alt="Message attachment" style={{maxWidth:"100%",maxHeight:280,borderRadius:8}}/>:m.attachment_type==="video"?<video controls src={mediaUrls[m.attachment_path]} style={{maxWidth:"100%",maxHeight:280}}/>:m.attachment_type==="audio"?<audio controls src={mediaUrls[m.attachment_path]}/>:<a href={mediaUrls[m.attachment_path]} target="_blank" rel="noopener noreferrer" style={{textDecoration:"underline"}}>Open attachment</a>}</div>}</span><div className={"omReactionRail "+(reactionOpen===m.id?"omReactionRail--open":"")}><button className="omReactionChip omReactionReply" onClick={()=>{selectReply(m);setReactionOpen(null)}} aria-label="Reply">↩ Reply</button>{(showReactionTools?["❤️","👍","😂","🔥","💚","🤲","✨","🎉"]:["❤️","😂","🤲","✨"]).map(emoji=><button className={"omReactionChip "+(reactions.some(r=>r.message_id===m.id&&r.user_id===uid&&r.emoji===emoji)?"omReactionChip--active":"")} key={emoji} onClick={()=>{void react(m.id,emoji);spark(m.id);setReactionOpen(null)}} aria-label={"React "+emoji} aria-pressed={reactions.some(r=>r.message_id===m.id&&r.user_id===uid&&r.emoji===emoji)}>{emoji} {reactions.filter(r=>r.message_id===m.id&&r.emoji===emoji).length||""}</button>)}<button type="button" className="omReactionChip omMoreReactions" onClick={()=>setShowReactionTools(v=>!v)} aria-label={showReactionTools?"Show fewer reactions":"Show more reactions"}>{showReactionTools?"−":"+ "}</button></div>{m.sender_id===uid&&<small style={{display:"block",opacity:.65}}>{peerReadAt&&new Date(peerReadAt)>=new Date(m.created_at)?"✓✓ Read":"✓ Sent"}</small>}</div>)}</div>
 
 
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

 <style jsx global>{`
.omMobileThreadStrip{display:none}
@media(max-width:700px){
.omImessagePage .omMobileThreadStrip{display:flex;flex:0 0 auto;gap:9px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;padding:6px 3px 10px;max-width:100%;min-height:105px}
.omImessagePage .omMobileThreadStrip::-webkit-scrollbar{display:none}
.omImessagePage .omMobileThread{scroll-snap-align:start;display:flex;flex:0 0 94px;min-width:0;align-items:center;flex-direction:column;gap:4px;padding:7px 5px;border:1px solid #42c99b33;border-radius:19px;background:#081d20;color:#e7fff5;overflow:hidden}
.omImessagePage .omMobileThread.isActive{border-color:#30e6aa;box-shadow:0 0 12px #24e0a444}
.omImessagePage .omMobileThreadAvatar{width:39px;height:39px;border-radius:50%;border:1px solid #41dfa5;overflow:hidden;display:grid;place-items:center}
.omImessagePage .omMobileThreadAvatar img{width:100%;height:100%;object-fit:cover}
.omImessagePage .omMobileThread strong,.omImessagePage .omMobileThread small{max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.omImessagePage .omMobileThread strong{font-size:11px}.omImessagePage .omMobileThread small{font-size:10px;opacity:.65}
.omImessagePage .omChatHeader>div[style*="display: flex"]{display:none!important}
.omImessagePage .omDmModeControl{display:none!important}
.omImessagePage .omChatHeader{flex-wrap:nowrap!important;padding:8px!important}
.omImessagePage .omChatIdentity{min-width:0!important}
.omImessagePage .omChatCallActions{margin-left:auto}
.omImessagePage .omThemeToggle{width:30px;height:30px;font-size:16px}
.omImessagePage .omBackToChats{font-size:0!important;padding:5px!important;min-width:30px}.omImessagePage .omBackToChats::before{content:"‹";font-size:26px}
.omImessagePage .omMessageComposer{padding:8px!important;gap:5px!important}
.omImessagePage .omMessageComposer input[aria-label="Message"]{min-width:0!important}
.omImessagePage .omMessagesFeed{padding:12px!important}
.omImessagePage .omMessengerTop{margin-bottom:3px!important}
.omImessagePage.omMessengerDay .omMobileThread{background:#f2faf6;color:#183b30}
}

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

/* Reactions etched into the conversation canvas: compact, low-contrast, no pill borders.
   Preserve existing reaction click handlers and celebration animation. */
.omImessagePage .omReactionRail{display:flex!important;flex-wrap:wrap!important;align-items:center!important;justify-content:flex-end!important;gap:2px!important;margin-top:3px!important;padding:0 2px!important;background:transparent!important;border:0!important;box-shadow:none!important}
.omImessagePage .omReactionRail .omReactionChip{appearance:none!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:3px!important;min-width:27px!important;min-height:29px!important;width:auto!important;height:29px!important;padding:3px 5px!important;margin:0!important;border:1px solid transparent!important;border-radius:7px!important;background:transparent!important;box-shadow:none!important;color:#d5c8e7!important;font-size:15px!important;line-height:1!important;letter-spacing:-.02em!important;text-shadow:0 1px 1px #000a,0 -1px 0 #fff2!important;filter:saturate(.8);opacity:.77;transition:opacity .18s ease,background .18s ease,transform .18s ease!important}
.omImessagePage .omReactionRail .omReactionChip:hover,.omImessagePage .omReactionRail .omReactionChip:focus-visible{opacity:1!important;background:#c3a4ff12!important;filter:none}
.omImessagePage .omReactionRail .omReactionChip--active{opacity:1!important;background:#bba0f51c!important;border-color:#d4b7ff24!important;color:#f7eaff!important;filter:none}
.omImessagePage .omReactionRail .omReactionReply{font-size:11px!important;font-weight:650!important;min-width:unset!important;padding:3px 6px!important;margin-right:3px!important;color:#d8c9eb!important}
.omImessagePage .omReactionRail .omMoreReactions{font-size:14px!important;font-weight:700!important;min-width:24px!important;padding:3px 4px!important}
@media(max-width:600px){.omImessagePage .omReactionRail{gap:0!important}.omImessagePage .omReactionRail .omReactionChip{min-width:25px!important;height:27px!important;min-height:27px!important;padding:2px 4px!important;font-size:14px!important}.omImessagePage .omReactionRail .omReactionReply{font-size:10px!important}}

/* Quran artwork re-used as an atmospheric, blurred, gently floating Messages backdrop.
   +10px Y offset; bubbles, reactions and taps remain above the decorative layers. */
.omImessagePage .omMessagesFeed{position:relative!important;isolation:isolate;background:linear-gradient(180deg,#0a0c20e8,#15112bdc)!important}
.omImessagePage .omMessagesFeed::before{content:"";position:absolute;inset:-38px -18px;z-index:-2;pointer-events:none;background:url("/assets/quran-studio-background.PNG") center center/cover no-repeat;filter:blur(15px) saturate(.8) brightness(.56);opacity:.53;transform:translate3d(0,10px,0) scale(1.06);animation:omMessageSceneryFloat 12s ease-in-out infinite alternate;will-change:transform}
.omImessagePage .omMessagesFeed::after{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(circle at 25% 30%,#d9b9ff19 0 1px,transparent 3px),radial-gradient(circle at 78% 55%,#b5a0ff28 0 2px,transparent 5px),linear-gradient(180deg,#09071b44,#1d0d3b38 58%,#0b102a66);background-size:155px 170px,240px 210px,100% 100%;animation:omMessageLightDrift 19s linear infinite;opacity:.9}
@keyframes omMessageSceneryFloat{0%{transform:translate3d(0,10px,0) scale(1.06)}50%{transform:translate3d(-4px,17px,0) scale(1.085)}100%{transform:translate3d(3px,4px,0) scale(1.07)}}
@keyframes omMessageLightDrift{0%{background-position:0 0,0 0,0 0;opacity:.65}50%{opacity:1}100%{background-position:22px -65px,-28px -95px,0 0;opacity:.7}}
@media(prefers-reduced-motion:reduce){.omImessagePage .omMessagesFeed::before,.omImessagePage .omMessagesFeed::after{animation:none!important}}

.omImessagePage .omDmModeControl{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-top:10px;padding:6px 0}
.omImessagePage .omDmModeAuthority{font-size:11px;color:#d6c9ee;font-weight:700}
.omImessagePage .omDmModeAuthority small{display:block;font-size:10px;opacity:.7;margin-top:2px}
.omImessagePage .omDmModeChoices{display:flex;gap:3px;padding:3px;border:1px solid #a68fcb33;border-radius:12px;background:#110d22aa}
.omImessagePage .omDmModeChoices button{border:0!important;border-radius:9px!important;padding:7px 10px!important;font-size:11px!important;min-height:30px!important;background:transparent!important;color:#c4b5db!important;box-shadow:none!important}
.omImessagePage .omDmModeChoices button.isSelected{background:#8d64d34d!important;color:#fff!important;box-shadow:0 0 12px #9b70f933!important}
.omImessagePage .omDmModeChoices button:disabled:not(.isSelected){opacity:.42!important;cursor:default}
.omImessagePage .omMessagesFeed.omDmNormalMode::before,.omImessagePage .omMessagesFeed.omDmNormalMode::after{display:none!important}
.omImessagePage .omMessagesFeed.omDmNormalMode{background:#0b111d!important}
.omImessagePage .omMessagesFeed.omDmHudHudMode{background:linear-gradient(180deg,#110a2bd5,#1c1239d0)!important}
@media(max-width:600px){.omImessagePage .omDmModeControl{align-items:flex-start}.omImessagePage .omDmModeChoices button{padding:6px 8px!important}}
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

/* 1Muslim Messages — restrained, native-inspired conversation layout */
.omImessagePage{--im-blue:#3868f6!important;max-width:1100px!important}
.omImessagePage .omMessengerShell{border:1px solid rgba(125,151,170,.22)!important;border-radius:23px!important;box-shadow:0 12px 38px #0003!important;background:#0d151b!important}
.omImessagePage .omChatPane{background:#0d151b!important}
.omImessagePage .omChatHeader{background:#101b20!important;border-bottom:1px solid #ffffff15!important;padding:13px 15px!important}
.omImessagePage .omChatPeerName{font-size:17px!important;font-weight:700!important}
.omImessagePage .omDmModeControl{opacity:.75!important;margin-top:4px!important}
.omImessagePage .omDmModeAuthority{font-size:10px!important;color:#b9c8c3!important}
.omImessagePage .omDmModeChoices{border-color:#ffffff1d!important;background:#ffffff0a!important}
.omImessagePage .omDmModeChoices button.isSelected{background:#ffffff22!important;box-shadow:none!important}
.omImessagePage .omMessagesFeed,.omImessagePage .omMessagesFeed.omDmNormalMode{background:#0c141a!important;padding:20px 15px!important}
.omImessagePage .omMessagesFeed.omDmHudHudMode{background:linear-gradient(160deg,#0c151b,#10231e)!important}
.omImessagePage .omMessagesFeed::before,.omImessagePage .omMessagesFeed::after{display:none!important}
.omImessagePage .omMessageBubble,.omImessagePage .omMessageBubble--theirs{background:#25313a!important;color:#f2f5f6!important;border:0!important;border-radius:19px 19px 19px 6px!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;font-size:15px!important;line-height:1.45!important;max-width:min(82%,500px)!important;padding:11px 15px!important}
.omImessagePage .omMessageBubble--mine{background:linear-gradient(125deg,#2863e8,#4967e8)!important;color:#fff!important;border:0!important;border-radius:19px 19px 6px 19px!important;box-shadow:none!important}
.omImessagePage .omMessageRow{animation:omGlassMessageEnter .2s ease-out both!important}
.omImessagePage .omReactionRail{opacity:.35!important;transition:opacity .2s!important;gap:1px!important;justify-content:flex-end!important}
.omImessagePage .omMessageRow:hover .omReactionRail,.omImessagePage .omMessageRow:focus-within .omReactionRail{opacity:1!important}
.omImessagePage .omReactionRail .omReactionChip{font-size:12px!important;min-height:22px!important;min-width:22px!important;padding:1px 3px!important;background:transparent!important;box-shadow:none!important}
.omImessagePage .omReactionRail .omReactionReply{font-size:10px!important}
.omImessagePage .omMessageComposer{background:#111d23!important;border-top:1px solid #ffffff16!important;padding:10px 12px!important;box-shadow:none!important}
.omImessagePage .omMessageComposer input[aria-label="Message"]{background:#1a272e!important;border:1px solid #ffffff30!important;border-radius:999px!important;color:#fff!important;box-shadow:none!important;font-size:15px!important}
.omImessagePage .omMessageComposer button,.omImessagePage .voiceLaunch{background:#23333b!important;border:1px solid #ffffff25!important;color:#e9f6f0!important;box-shadow:none!important}
.omImessagePage .omComposerSend{background:#3868f6!important;border:0!important;box-shadow:none!important}
.omImessagePage .omConversationList{background:#111e24!important;border-color:#ffffff17!important}
.omImessagePage .omConversationList button{background:#1a2a31!important;border:1px solid #ffffff18!important;box-shadow:none!important;border-radius:13px!important}
.omImessagePage .voiceStudio{background:#182b30!important;border:1px solid #ffffff25!important;box-shadow:none!important}
@media(max-width:700px){.omImessagePage{padding:5px 6px 18px!important}.omImessagePage .omMessengerShell{border-radius:18px!important}.omImessagePage .omMessagesFeed{padding:15px 12px!important}.omImessagePage .omMessageBubble{max-width:84%!important}.omImessagePage .omReactionRail{opacity:.58!important}}
@media(prefers-reduced-motion:reduce){.omImessagePage .omMessageRow{animation:none!important}}


/* Hold a bubble to reveal its reactions. Tap for a restrained light shimmer. */
.omImessagePage .omMessageBubble{overflow:visible!important;isolation:isolate;cursor:pointer;transition:transform .18s ease,filter .25s ease!important;-webkit-touch-callout:none}
.omImessagePage .omMessageBubble:active{transform:scale(.985)!important}
.omImessagePage .omMessageBubble.omBubbleSpark{animation:omBubbleLight .65s ease-out both!important}
.omImessagePage .omMessageBubble.omBubbleSpark::after{content:"";position:absolute;inset:-6px;border-radius:inherit;pointer-events:none;background:radial-gradient(circle at 18% 22%,#fff9 0 1px,transparent 3px),radial-gradient(circle at 72% 15%,#c9ffe8b3 0 1px,transparent 4px),radial-gradient(circle at 89% 75%,#fff8 0 1px,transparent 3px),radial-gradient(circle at 35% 94%,#a7ffe9aa 0 1px,transparent 4px);animation:omLightDust .65s ease-out both}
.omImessagePage .omReactionRail{opacity:0!important;max-height:0!important;overflow:hidden!important;pointer-events:none!important;transition:opacity .18s ease,max-height .2s ease!important}
.omImessagePage .omMessageRow:hover .omReactionRail,.omImessagePage .omMessageRow:focus-within .omReactionRail{opacity:0!important;max-height:0!important;pointer-events:none!important}
.omImessagePage .omReactionRail.omReactionRail--open{opacity:1!important;max-height:65px!important;overflow:visible!important;pointer-events:auto!important;margin-top:8px!important;padding:5px 8px!important;border:1px solid #ffffff2b!important;border-radius:999px!important;background:#1d2b33f2!important;box-shadow:0 8px 22px #0004!important;animation:omReactionRise .2s ease-out both}
@keyframes omBubbleLight{0%{filter:brightness(1)}30%{filter:brightness(1.25)}100%{filter:brightness(1)}}
@keyframes omLightDust{0%{opacity:0;transform:scale(.94)}35%{opacity:.85}100%{opacity:0;transform:scale(1.1)}}
@keyframes omReactionRise{from{opacity:0;transform:translateY(5px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
@media(prefers-reduced-motion:reduce){.omImessagePage .omMessageBubble.omBubbleSpark,.omImessagePage .omMessageBubble.omBubbleSpark::after,.omImessagePage .omReactionRail.omReactionRail--open{animation:none!important}}


/* 1Muslim Messenger — premium emerald/ink design, matching the approved visual */
.omImessagePage{--im-blue:#2563f4!important;background:radial-gradient(ellipse at 40% 0%,#08372e 0%,#07171b 44%,#050d12 100%)!important;color:#f0f9f5!important}
.omImessagePage .omMessengerShell{background:#071317!important;border:1px solid #46c99d24!important;border-radius:22px!important;box-shadow:0 20px 70px #0007!important}
.omImessagePage .omChatPane{background:#061216!important}
.omImessagePage .omChatHeader{display:flex!important;align-items:center!important;flex-wrap:wrap!important;gap:9px!important;background:linear-gradient(115deg,#08251f,#07181d)!important;border-bottom:1px solid #7ce7b91f!important;padding:13px 15px!important}
.omImessagePage .omChatIdentity{display:flex;align-items:center;gap:10px;min-width:0;flex:1}
.omImessagePage .omChatIdentityText{display:flex;flex-direction:column;gap:4px;min-width:0}
.omImessagePage .omChatPeerName{font-size:16px!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.omImessagePage .omChatPeerAvatar{height:41px;width:41px;flex:none;display:grid;place-items:center;border-radius:50%;border:1.5px solid #40d69d;background:#14382d;color:#c4f5dd;overflow:hidden}
.omImessagePage .omChatPeerAvatar img{height:100%;width:100%;object-fit:cover}
.omImessagePage .omChatPresence{display:flex;align-items:center;gap:5px;font-size:11px;color:#afc9bd}
.omImessagePage .omChatPresence i{width:7px;height:7px;border-radius:50%;background:#64776f}
.omImessagePage .omChatPresence i.isOnline{background:#31e89b;box-shadow:0 0 9px #31e89b88}
.omImessagePage .omChatCallActions{display:flex;gap:8px;align-items:center}
.omImessagePage .omChatCallActions button{display:grid;place-items:center;width:42px;height:42px;border-radius:50%;border:1px solid #7ee9bd55;background:#0c332a;color:#d3ffea;cursor:pointer;transition:transform .2s,background .2s}
.omImessagePage .omChatCallActions button:hover{background:#146f4c;transform:translateY(-2px)}
.omImessagePage .omDmModeControl{flex-basis:100%;order:3;margin-top:2px!important}
.omImessagePage .omChatHeader>div[style*="display: flex"]{order:4;flex-basis:100%;opacity:.6}
.omImessagePage .omMessagesFeed,.omImessagePage .omMessagesFeed.omDmNormalMode{background:radial-gradient(ellipse at 0 80%,#0b29243d,transparent 55%),#071216!important}
.omImessagePage .omMessageBubble--theirs{background:linear-gradient(140deg,#263039,#19242e)!important;color:#f4f7f8!important;border:1px solid #ffffff0d!important;border-radius:22px 22px 22px 7px!important;box-shadow:0 3px 12px #0003!important}
.omImessagePage .omMessageBubble--mine{background:linear-gradient(130deg,#1778f7 0%,#295cf2 65%,#6553ee 100%)!important;color:white!important;border-radius:22px 22px 7px 22px!important;box-shadow:0 6px 18px #1325a840!important}
.omImessagePage .omReactionRail.omReactionRail--open{background:linear-gradient(110deg,#062c26f7,#064a3af5)!important;border:1px solid #25cf8e99!important;box-shadow:0 7px 28px #06b98135!important}
.omImessagePage .omMessageComposer{background:#071c1c!important;border-top:1px solid #48d4a32b!important;gap:8px!important}
.omImessagePage .omMessageComposer input[aria-label="Message"]{background:#0b2424!important;border:1px solid #6bd6ae50!important;border-radius:999px!important}
.omImessagePage .omComposerSend{background:linear-gradient(130deg,#0caa78,#087455)!important;color:#fff!important}
.omImessagePage .omConversationList{background:#0b1b1e!important}
.omImessagePage .omConversationList button{background:#11282a!important}
@media(max-width:700px){.omImessagePage .omChatHeader{gap:7px!important;padding:10px!important}.omImessagePage .omChatPeerAvatar{width:35px;height:35px}.omImessagePage .omChatCallActions{gap:5px}.omImessagePage .omChatCallActions button{width:37px;height:37px}.omImessagePage .omChatPeerName{font-size:14px!important}}

/* Per-user Messenger day/night theme, persisted locally. */
.omImessagePage .omThemeToggle{order:2;display:grid;place-items:center;width:38px;height:38px;flex:none;border-radius:50%;border:1px solid #8edbbb50;background:#ffffff10;color:#d4ffe9;font-size:20px;cursor:pointer;transition:transform .2s,background .2s}
.omImessagePage .omThemeToggle:hover{transform:rotate(18deg);background:#ffffff20}
.omImessagePage.omMessengerDay{background:radial-gradient(ellipse at 50% 0%,#e5fff3,#f5f9fc 55%,#f9fafb)!important;color:#172b30!important}
.omImessagePage.omMessengerDay .omMessengerShell{background:#fff!important;border:1px solid #d5e8e1!important;box-shadow:0 12px 38px #2c5e5120!important}
.omImessagePage.omMessengerDay .omChatPane{background:#fff!important;color:#1b3035!important}
.omImessagePage.omMessengerDay .omChatHeader{background:linear-gradient(115deg,#f8fffc,#effaf5)!important;border-bottom:1px solid #d5e9df!important;color:#153b30!important}
.omImessagePage.omMessengerDay .omChatPresence{color:#57736a!important}
.omImessagePage.omMessengerDay .omChatPeerAvatar{background:#e1f5e9!important;color:#14734d!important}
.omImessagePage.omMessengerDay .omChatCallActions button{background:#e5f7ee!important;border-color:#b5dfcb!important;color:#176647!important}
.omImessagePage.omMessengerDay .omThemeToggle{background:#e7f3ec;color:#25644b;border-color:#b6dccc}
.omImessagePage.omMessengerDay .omMessagesFeed,.omImessagePage.omMessengerDay .omMessagesFeed.omDmNormalMode,.omImessagePage.omMessengerDay .omMessagesFeed.omDmHudHudMode{background:radial-gradient(ellipse at 0 100%,#e7f8f0,transparent 65%),#fbfdfd!important;color:#19363a!important}
.omImessagePage.omMessengerDay .omMessageBubble--theirs{background:#e9eff2!important;color:#1c2c35!important;border:1px solid #dce5e8!important;box-shadow:0 3px 12px #253f4510!important}
.omImessagePage.omMessengerDay .omMessageBubble--mine{background:linear-gradient(130deg,#1877f2,#3657ed 75%,#6555e8)!important;color:white!important}
.omImessagePage.omMessengerDay .omMessageComposer{background:#f5faf8!important;border-top:1px solid #dce9e3!important}
.omImessagePage.omMessengerDay .omMessageComposer input[aria-label="Message"]{background:white!important;border-color:#cbded5!important;color:#1b3432!important}
.omImessagePage.omMessengerDay .omMessageComposer button,.omImessagePage.omMessengerDay .voiceLaunch{background:#e8f3ee!important;color:#24664b!important;border-color:#c6e1d3!important}
.omImessagePage.omMessengerDay .omComposerSend{background:#16855b!important;color:white!important}
.omImessagePage.omMessengerDay .omConversationList{background:#f4faf8!important;border-color:#dceae3!important;color:#1e3431!important}
.omImessagePage.omMessengerDay .omConversationList button{background:#fff!important;border-color:#dceae3!important;color:#193630!important}
.omImessagePage.omMessengerDay .omDmModeAuthority{color:#527469!important}
.omImessagePage.omMessengerDay .omDmModeChoices{background:#e9f3ee!important;border-color:#cfe3d8!important}
.omImessagePage.omMessengerDay .omDmModeChoices button{color:#245d49!important}
.omImessagePage.omMessengerDay .omDmModeChoices button.isSelected{background:#c7e6d5!important}
.omImessagePage.omMessengerDay .omReactionRail.omReactionRail--open{background:#e6f8ee!important;border-color:#76d6a7!important;box-shadow:0 6px 20px #176e4530!important}
.omImessagePage.omMessengerDay .voiceStudio{background:#f0f9f4!important;color:#1d4d37!important}
@media(prefers-reduced-motion:reduce){.omImessagePage .omThemeToggle{transition:none}}

/* Messenger as an app surface: lock shell to the viewport, scroll only the inbox/feed. */
.omImessagePage{box-sizing:border-box!important;width:100%!important;max-width:none!important;height:calc(100dvh - 80px)!important;min-height:420px!important;margin:0 auto!important;padding:8px 12px!important;display:flex!important;flex-direction:column!important;overflow:hidden!important}
.omImessagePage .omMessengerTop{flex:0 0 auto!important;margin:0 0 8px!important;gap:8px!important}
.omImessagePage .omMessengerHeading{font-size:21px!important;line-height:1.2!important;margin:0!important}
.omImessagePage .omMessengerShell{flex:1 1 0!important;min-height:0!important;height:100%!important;max-height:100%!important;overflow:hidden!important;border-radius:19px!important}
.omImessagePage .omConversationList{min-height:0!important;height:100%!important;overflow-y:auto!important;overscroll-behavior:contain!important}
.omImessagePage .omChatPane{min-height:0!important;height:100%!important;overflow:hidden!important}
.omImessagePage .omChatHeader{flex:0 0 auto!important}
.omImessagePage .omMessagesFeed{min-height:0!important;max-height:none!important;overflow-y:auto!important;overscroll-behavior:contain!important;scrollbar-width:thin}
.omImessagePage .omMessageComposer{flex:0 0 auto!important}
@media(max-width:700px){
 .omImessagePage{height:calc(100dvh - 77px - env(safe-area-inset-bottom))!important;min-height:320px!important;padding:3px 5px 0!important}
 .omImessagePage .omMessengerTop{margin:0 3px 5px!important}
 .omImessagePage .omMessengerHeading{font-size:18px!important}
 .omImessagePage .omMessengerShell{border-radius:13px!important;min-height:0!important}
 .omImessagePage .omConversationList,.omImessagePage .omChatPane{height:100%!important;min-height:0!important}
 .omImessagePage .omMessagesFeed{flex:1 1 0!important;min-height:0!important;max-height:none!important}
}

/* Mobile chat: reclaim bottom viewport and remove duplicate floating call dock.
   Voice/video actions remain in the chat header. */
@media(max-width:700px){
 html:has(.omImessagePage),body:has(.omImessagePage){overflow:hidden!important}
 body:has(.omImessagePage) .omImessagePage{height:calc(100dvh - 12px - env(safe-area-inset-bottom))!important;max-height:calc(100dvh - 12px - env(safe-area-inset-bottom))!important}
 .omImessagePage .omMessengerShell{flex:1 1 auto!important;height:auto!important;min-height:0!important}
 .omImessagePage .omChatPane{display:flex!important;flex-direction:column!important}
 .omImessagePage .omMessagesFeed{flex:1 1 0!important;min-height:0!important}
 .omImessagePage .omMessageComposer{position:relative!important;z-index:5!important}
 body:has(.omImessagePage) .mc-idleDock,body:has(.omImessagePage) .mc-callLauncher{display:none!important}
}
/* Messenger 2.0: compact, accessible thread list; preserve site navigation and HudHud. */
.omImessagePage .omMessengerFilters{display:flex!important;overflow-x:auto;gap:6px!important;scrollbar-width:none;padding:2px 0 5px}.omImessagePage .omMessengerFilters button{flex:0 0 auto!important;border-radius:999px!important;padding:9px 14px!important;min-height:40px!important}.omImessagePage .omConversationList{padding:12px!important}.omImessagePage .omMessengerThreadList{gap:5px!important;margin-top:10px!important}.omImessagePage .omMessengerThreadList>button{min-height:66px!important;padding:9px 11px!important;margin:0!important;border-radius:14px!important;box-shadow:none!important;transform:none!important}.omImessagePage .omThreadAvatar{width:43px!important;height:43px!important;flex:0 0 43px!important;border-width:1px!important;box-shadow:none!important}.omImessagePage .omThreadMeta{min-width:0;flex:1}.omImessagePage .omThreadMeta strong{display:block;font-size:15px;line-height:1.3}.omImessagePage .omThreadMeta small{display:block;font-size:13px;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:.82}.omImessagePage .omThreadChevron{opacity:.45;font-size:20px}.omImessagePage .omMessengerExtras{margin:6px 0!important;font-size:12px;opacity:.8}.omImessagePage .omConversationList>label{margin:5px 0!important}.omImessagePage .omQuickActions{display:grid;gap:6px;margin-bottom:12px}.omImessagePage .omQuickActions a,.omImessagePage .omQuickActions button{padding:11px 12px;border-radius:11px;border:1px solid #8fbdab55;background:#19392d;color:#e9fff2;text-align:left;text-decoration:none;font-size:14px;min-height:44px}.omImessagePage .omMessengerNewChat.open{max-height:55dvh;overflow-y:auto}@media(prefers-reduced-motion:reduce){.omImessagePage .omMessengerThreadList>button{transition:none!important}}

/* Unread conversations glow softly in gold until opened. */
.omImessagePage .omMessengerThreadList>button.omUnreadThread{position:relative;border-color:#d7b65eaa!important;box-shadow:0 0 0 1px #e8ca7c33,0 0 16px #d9b35735!important;animation:omUnreadGold 2.8s ease-in-out infinite!important}.omImessagePage .omUnreadThread .omThreadMeta strong{color:#f3d996!important}.omImessagePage .omUnreadBadge{min-width:24px;height:24px;border-radius:999px;background:#e8c777;color:#332500;font-size:12px;font-weight:800;display:grid;place-items:center;padding:0 5px;box-shadow:0 0 12px #f6d68055}.omImessagePage .omUnreadThread .omThreadChevron{display:none}@keyframes omUnreadGold{0%,100%{box-shadow:0 0 0 1px #e8ca7c33,0 0 10px #d9b35720}50%{box-shadow:0 0 0 1px #f0d89177,0 0 22px #e6bf6260}}@media(prefers-reduced-motion:reduce){.omImessagePage .omMessengerThreadList>button.omUnreadThread{animation:none!important}}

/* Home and Messenger share the same ornament assets, alignment, and theme palette. */
.omImessagePage.omMessengerUnified{position:relative;isolation:isolate;background:radial-gradient(ellipse at 25% 5%,#235944 0%,transparent 48%),radial-gradient(ellipse at 100% 85%,#193d36 0%,transparent 45%),#071914!important;border-radius:26px;min-height:calc(100dvh - 40px);transition:background-color .9s ease,color .5s ease;overflow:hidden}
.omImessagePage.omMessengerUnified.omMessengerDay{background:radial-gradient(ellipse at 10% 0%,#f4e5bd,transparent 60%),#e8eee1!important;color:#183c2d!important}
.omMessengerPattern,.omMessengerOrnaments{position:absolute;inset:0;pointer-events:none;z-index:0;overflow:hidden}
.omMessengerPattern{opacity:.12;background-image:repeating-linear-gradient(45deg,transparent 0 37px,#d7bf7d 38px,transparent 39px 76px),repeating-linear-gradient(-45deg,transparent 0 37px,#d7bf7d 38px,transparent 39px 76px);mask-image:linear-gradient(to bottom,#000,transparent 75%)}
.omMessengerOrnamentNight,.omMessengerOrnamentDay{position:absolute;display:block;left:50%;top:clamp(60px,11vh,130px);width:min(84vw,760px);height:min(60vh,590px);transform:translateX(-50%);background-position:center top;background-repeat:no-repeat;background-size:contain;transition:opacity 900ms cubic-bezier(.22,1,.36,1);opacity:0}
.omMessengerOrnamentNight{background-image:url('/assets/decorations/islamic-white-ornament.PNG');opacity:.12}.omMessengerOrnamentDay{background-image:url('/assets/decorations/islamic-gold-ornament.PNG');opacity:0}.omMessengerDay .omMessengerOrnamentNight{opacity:0}.omMessengerDay .omMessengerOrnamentDay{opacity:.16}
.omMessengerUnified>*:not(.omMessengerPattern):not(.omMessengerOrnaments):not(style){position:relative;z-index:1}
@media(max-width:700px){.omImessagePage.omMessengerUnified{border-radius:0;min-height:100dvh;margin:0!important}.omMessengerOrnamentNight,.omMessengerOrnamentDay{top:90px;width:110vw;height:58vh}}
@media(prefers-reduced-motion:reduce){.omMessengerOrnamentNight,.omMessengerOrnamentDay{transition:none}}
`}
</style>

<style jsx global>{`

/* Messenger 3.0 steps 1-2: page-scoped cinematic framework and public avatar discovery. */
.omImessagePage.omMessengerUnified{background:radial-gradient(ellipse at 10% 0%,rgba(32,105,80,.62),transparent 50%),radial-gradient(ellipse at 90% 85%,rgba(20,75,71,.55),transparent 55%),#051b17!important;color:#f7e8bb!important}
.omImessagePage.omMessengerUnified .omMessengerShell{background:rgba(4,35,29,.78)!important;border:1px solid rgba(226,194,113,.45)!important;box-shadow:0 20px 55px rgba(0,0,0,.4),inset 0 1px rgba(255,241,190,.12)!important}
.omImessagePage.omMessengerUnified .omConversationList{background:linear-gradient(150deg,rgba(8,63,48,.92),rgba(5,31,29,.93))!important;color:#f6eacb!important}
.omImessagePage.omMessengerUnified .omMessengerListHead input,.omImessagePage.omMessengerUnified .omMessengerNewChat input{background:#061c1e!important;color:#f6edda!important;border:1px solid rgba(225,200,134,.4)!important}
.omImessagePage.omMessengerUnified .omMessengerFilters button{background:rgba(11,67,52,.88)!important;color:#f7e6bd!important;border:1px solid rgba(230,208,149,.35)!important}
.omImessagePage.omMessengerUnified .omMessengerFilters button.active{background:linear-gradient(125deg,#bda465,#e9d391)!important;color:#123a2e!important}
.omImessagePage.omMessengerUnified .omMessengerExtras{color:#d4e8da!important}
.omImessagePage.omMessengerUnified .omMessengerThreadList>button{background:linear-gradient(120deg,rgba(18,79,60,.88),rgba(8,42,37,.9))!important;color:#fff1cd!important}
.omImessagePage .omMessengerDiscovery{background:linear-gradient(155deg,rgba(9,74,57,.48),rgba(5,31,30,.48));border:1px solid rgba(228,199,126,.35);border-radius:23px;padding:12px!important;margin:8px 0 16px!important;box-shadow:inset 0 1px rgba(255,255,255,.09)}
.omImessagePage .omMessengerDiscovery>div{max-height:none!important;overflow:visible!important}
.omImessagePage .omMessengerDiscovery [class*="people"]{max-height:330px;overflow-y:auto;overscroll-behavior:contain}
.omImessagePage .omMessengerDiscovery [class*="personCard"]{background:rgba(7,53,43,.7);border-radius:16px}
.omImessagePage .omMessengerDiscovery [class*="avatar"]{width:clamp(52px,13vw,76px);height:clamp(52px,13vw,76px);border:1.5px solid #dfc77d;box-shadow:0 0 15px #d3b76a33}
.omImessagePage .omMessengerDiscoveryTitle{display:flex;justify-content:space-between;align-items:center;gap:12px;color:#efd69b;margin:0 0 10px}
.omImessagePage .omGuestDirectory{position:relative;z-index:1;flex:1;min-height:0;overflow-y:auto;padding:16px;border:1px solid #e3c67b66;border-radius:24px;background:linear-gradient(145deg,#0a4235df,#061e1de8)}
.omImessagePage .omGuestDirectory [class*="people"]{max-height:55dvh;overflow-y:auto}
.omImessagePage .omGuestSignIn{text-align:center;color:#ead6a6;font-size:13px}
@media(max-width:700px){.omImessagePage .omMessengerDiscovery [class*="people"]{max-height:270px}.omImessagePage .omMessengerDiscovery [class*="peopleGrid"]{grid-template-columns:repeat(4,minmax(0,1fr))!important}.omImessagePage .omMessengerDiscovery{padding:8px!important}}
@media(prefers-reduced-motion:reduce){.omImessagePage .omMessengerDiscovery [class*="personCard"]{animation:none!important}}
/* Responsive type follows the homepage's compact baseline, then scales more broadly. */
.omImessagePage{--om-type-micro:clamp(8px,1.9vw,12px);--om-type-small:clamp(9px,2.25vw,14px);--om-type-body:clamp(11px,2.75vw,18px);--om-type-title:clamp(12px,3vw,21px);--om-type-heading:clamp(22px,4vw,39px)}
.omImessagePage .omMessengerHeading{font-size:var(--om-type-heading)!important;line-height:1.08!important;letter-spacing:-.055em!important}
.omImessagePage .omThreadMeta strong{font-size:var(--om-type-title)!important}
.omImessagePage .omThreadMeta small{font-size:var(--om-type-small)!important}
.omImessagePage .omMessengerFilters button,.omImessagePage .omQuickActions button,.omImessagePage .omQuickActions a{font-size:var(--om-type-small)!important}
.omImessagePage .omMessagesFeed,.omImessagePage .omMessageComposer{font-size:var(--om-type-body)!important}
.omImessagePage .omMessengerExtras,.omImessagePage .omUnreadBadge{font-size:var(--om-type-micro)!important}
@media(min-width:800px){.omImessagePage{--om-type-micro:clamp(9px,.75vw,13px);--om-type-small:clamp(11px,.95vw,15px);--om-type-body:clamp(12px,1.1vw,18px);--om-type-title:clamp(13px,1.3vw,21px)}}

/* Home-style compact Messenger: app-height canvas, emerald/gold controls and comfortable touch targets */
@media(max-width:760px){
 body:has(.omImessagePage){overflow:hidden}
 .omImessagePage{height:100dvh!important;min-height:0!important;max-height:100dvh!important;width:100%!important;max-width:100vw!important;padding:calc(env(safe-area-inset-top,0px) + 6px) 9px calc(env(safe-area-inset-bottom,0px) + 8px)!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;background:radial-gradient(ellipse at 10% 0%,#194b3b,#071b17 78%)!important}
 .omImessagePage .omMessengerShell{flex:1 1 0!important;min-height:0!important;height:auto!important;max-height:100%!important;overflow:hidden!important;border-radius:19px!important;border:1px solid #d7bd7544!important;box-shadow:0 16px 45px #0006!important}
 .omImessagePage .omChatPane,.omImessagePage .omConversationList{min-height:0!important;max-height:100%!important;overflow:hidden!important}
 .omImessagePage .omMessagesFeed{overflow-y:auto!important;overscroll-behavior:contain!important;scrollbar-width:thin}
 .omImessagePage .omMessageComposer{flex-shrink:0!important;padding-bottom:max(8px,env(safe-area-inset-bottom,0px))!important}
 .omImessagePage button,.omImessagePage a{touch-action:manipulation}
 .omImessagePage .omMessengerThreadList>button{min-height:64px!important;border:1px solid #d7bd7530!important;background:linear-gradient(115deg,#1b4234,#103127)!important}
 .omImessagePage .omMessengerThreadList>button:active{transform:scale(.985)!important}
 .omImessagePage .omMessengerFilters button{min-height:42px!important}
}
.omImessagePage .omMessengerHeading{letter-spacing:-.035em!important}
.omImessagePage .omThreadAvatar{border-color:#d8be78!important}
.omImessagePage .omMessageComposer button{border-radius:14px!important}

/* Messenger 3.0 foundation: same cinematic emerald glass as Home, with a persistent public member registry. */
.omImessagePage.omMessengerUnified{background:radial-gradient(ellipse at 20% 0%,#174f3b,transparent 58%),linear-gradient(160deg,#061b17,#081d21 70%,#07120f)!important;color:#f4e9c7!important}
.omImessagePage.omMessengerUnified .omMessengerShell{background:linear-gradient(140deg,rgba(6,45,36,.86),rgba(3,27,27,.91))!important;border:1px solid #d8c18580!important;box-shadow:0 16px 60px #0008,inset 0 1px #f6e9c126!important;backdrop-filter:blur(24px)}
.omImessagePage.omMessengerUnified .omConversationList{background:linear-gradient(145deg,rgba(5,52,40,.91),rgba(4,28,29,.92))!important;color:#f7e8c8!important}
.omImessagePage.omMessengerUnified .omMessengerTop,.omImessagePage.omMessengerUnified .omMessengerHeading{color:#f6dfab!important}
.omImessagePage.omMessengerUnified .omMessengerListHead input{background:#06291f!important;color:#f4e9d5!important;border:1px solid #c6b67a77!important;border-radius:19px!important}
.omImessagePage.omMessengerUnified .omMessengerFilters button{background:#0d3a2e!important;color:#f4e9d1!important;border:1px solid #d8c18555!important}
.omImessagePage.omMessengerUnified .omMessengerFilters button.active{background:linear-gradient(110deg,#d8bd76,#a88d49)!important;color:#09281f!important}
.omImessagePage.omMessengerUnified .omMessengerThreadList>button{background:linear-gradient(115deg,#124437,#082f29)!important;color:#f7ead2!important;border:1px solid #d7bd7540!important}
.omMessengerDiscovery{margin:0 0 18px;padding:12px 8px;border:1px solid #cdb77a55;border-radius:22px;background:linear-gradient(135deg,#073d3088,#082b2988);box-shadow:inset 0 1px #ffffff16}
.omMessengerDiscoveryTitle{display:flex;align-items:center;justify-content:space-between;gap:6px;margin:0 5px 9px;color:#efd89f;font-size:13px}
.omMessengerDiscoveryTitle small{font-size:10px;opacity:.75}
.omMessengerDiscovery>div{max-height:340px;overflow:auto;min-height:0}
.omMessengerDiscovery [class*="peopleGrid"]{grid-template-columns:repeat(4,minmax(0,1fr))!important}
.omMessengerDiscovery [class*="personCard"]{min-width:0!important}
.omMessengerDiscovery [class*="avatar"]{border-radius:50%}
@media(max-width:700px){.omImessagePage.omMessengerUnified{background:radial-gradient(ellipse at 15% 0%,#194f3e,#061a17 80%)!important}.omMessengerDiscovery>div{max-height:300px}.omMessengerDiscovery{padding:9px 5px;margin-bottom:12px}.omMessengerDiscovery [class*="personCard"]{font-size:11px}}
`}
</style>

<style>{`
/* Approved Messenger composition, scoped to functional authenticated inbox. */
.muslimMessengerFrame>.omImessagePage.omMessengerUnified{display:block!important;position:relative!important;height:auto!important;min-height:100dvh!important;max-height:none!important;overflow:visible!important;margin:0!important;padding:0 18px 116px!important;background:linear-gradient(to bottom,#003c2d 0%,#00805c 8%,#bce8d8 17%,#fff 20%,#fff 100%)!important}
.muslimMessengerFrame>.omImessagePage.omMessengerNight{background:linear-gradient(to bottom,#003c2d 0%,#00805c 8%,#183c31 17%,#090b0d 20%,#090b0d 100%)!important}
.muslimMessengerFrame .omMessengerTop{height:clamp(145px,20dvh,205px)!important;max-width:850px!important;padding:20px 0!important;margin:0 auto!important;background:transparent!important}
.muslimMessengerFrame .omMessengerTop>div{gap:0!important}
.muslimMessengerFrame .omMessengerHeading{font:600 clamp(29px,7vw,46px)/1.04 Georgia,serif!important;color:#f4d998!important;letter-spacing:-.05em!important}
.muslimMessengerFrame .omMessengerBrandSub{font:500 10px/1.6 system-ui,sans-serif!important;letter-spacing:.5em!important;text-align:center!important;color:#f6e5b5!important}
.muslimMessengerFrame .omMessengerShell--list{display:block!important;height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;border:0!important;border-radius:0!important;background:none!important;box-shadow:none!important;backdrop-filter:none!important;max-width:850px!important;margin:auto!important}
.muslimMessengerFrame .omMessengerShell--list>.omConversationList{display:flex!important;flex-direction:column!important;overflow:visible!important;height:auto!important;max-height:none!important;padding:0!important;background:none!important;border:0!important}
.muslimMessengerFrame .omMessengerShell--list>.omChatPane{display:none!important}
.muslimMessengerFrame .omMessengerDiscovery{display:none!important}
.muslimMessengerFrame .omMessengerListHead{order:0!important;display:flex!important;flex-direction:column!important;background:none!important;padding:0!important;margin:0!important}
.muslimMessengerFrame .omMessengerListHead>input{height:54px!important;border-radius:28px!important;background:#fff!important;color:#23372e!important;border:1px solid #dce7e1!important;box-shadow:0 5px 16px #0001!important}
.muslimMessengerFrame .omMessengerStories{order:1!important;display:flex!important;overflow-x:auto!important;gap:13px!important;padding:22px 2px 16px!important;margin:0!important;min-height:0!important}
.muslimMessengerFrame .omMessengerFilters{order:2!important;display:flex!important;overflow-x:auto!important;gap:8px!important;margin:0!important;padding:0 0 13px!important}
.muslimMessengerFrame .omMessengerFilters button{flex-shrink:0!important;background:#fff!important;color:#25342d!important;border:1px solid #e4e8e5!important;border-radius:16px!important;box-shadow:0 2px 6px #0001!important}
.muslimMessengerFrame .omMessengerFilters button.active{background:linear-gradient(110deg,#008e61,#00ba7e)!important;color:white!important;border-color:#00a875!important}
.muslimMessengerFrame .omMessengerExtras{order:5!important}
.muslimMessengerFrame .omMessengerNewChat{order:6!important}
.muslimMessengerFrame .omMessengerThreadList{order:4!important;margin:0!important;padding:0!important;overflow:visible!important}
.muslimMessengerFrame .omMessengerThreadList>button{display:flex!important;align-items:center!important;gap:12px!important;width:100%!important;min-height:84px!important;padding:10px 4px!important;margin:0!important;border:0!important;border-bottom:1px solid #ebeeeb!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;color:#17231d!important}
.muslimMessengerFrame .omMessengerThreadList>button .omThreadAvatar{flex:0 0 62px!important;width:62px!important;height:62px!important;border:2px solid #d5b46b!important;border-radius:50%!important;overflow:hidden!important}
.muslimMessengerFrame .omMessengerThreadList>button .omThreadMeta{flex:1!important;min-width:0!important;display:flex!important;flex-direction:column!important;gap:5px!important}
.muslimMessengerFrame .omMessengerThreadList>button .omThreadMeta strong{color:inherit!important;font-size:17px!important}
.muslimMessengerFrame .omMessengerThreadList>button .omThreadMeta small{color:#65736b!important;font-size:13px!important}
.muslimMessengerFrame .omMessengerThreadList>button .omThreadChevron{color:#63736d!important}
.muslimMessengerFrame .omMessengerThreadList>button .omUnreadBadge{position:static!important;border:0!important;box-shadow:none!important;background:#08bc77!important;color:white!important;border-radius:15px!important}
.muslimMessengerFrame .omMessengerNight .omMessengerThreadList>button{color:#f4f7f4!important;border-bottom-color:#29342e!important}
.muslimMessengerFrame .omMessengerNight .omMessengerThreadList>button .omThreadMeta small{color:#a4aea7!important}
.muslimMessengerFrame .omMessengerNight .omMessengerFilters button{background:#17201b!important;color:#f5f6f4!important;border-color:#35433a!important}
.muslimMessengerFrame .omMessengerNight .omMessengerFilters button.active{background:#008a63!important;color:white!important}
.muslimMessengerFrame .omMessengerNight .omMessengerListHead>input{background:#19211c!important;color:white!important;border-color:#35463d!important}
.muslimMessengerFrame .omMessengerShell--chat{display:grid!important;max-width:850px!important;min-height:65dvh!important;height:calc(100dvh - 220px)!important;overflow:hidden!important;margin:auto!important}
@media(max-width:700px){.muslimMessengerFrame>.omImessagePage.omMessengerUnified{padding:0 15px 105px!important}.muslimMessengerFrame .omMessengerTop{height:20dvh!important}.muslimMessengerFrame .omMessengerShell--chat{height:calc(100dvh - 185px)!important}.muslimMessengerFrame .omMessengerThreadList>button{min-height:78px!important}}
/* Mobile thread viewport: keep the composer ABOVE the site's bottom navigation
   and Safari toolbar. Avoid the old 100dvh/overflow-hidden trap. */
@media(max-width:700px){
 body:has(.muslimMessengerFrame .omMessengerShell--chat){overflow:auto!important}
 .muslimMessengerFrame>.omImessagePage.omMessengerUnified:has(.omMessengerShell--chat){
  height:auto!important;min-height:0!important;max-height:none!important;
  overflow:visible!important;padding:0 12px 24px!important;
 }
 .muslimMessengerFrame .omImessagePage:has(.omMessengerShell--chat) .omMessengerTop{
  height:auto!important;min-height:0!important;margin:4px 0 10px!important;
 }
 .muslimMessengerFrame .omMessengerShell--chat{
  display:flex!important;flex-direction:column!important;
  height:min(68dvh,610px)!important;min-height:360px!important;
  max-height:calc(100dvh - 160px)!important;overflow:hidden!important;
  margin:0 auto 18px!important;border-radius:22px!important;
 }
 .muslimMessengerFrame .omMessengerShell--chat>.omChatPane{
  display:flex!important;flex-direction:column!important;
  flex:1 1 auto!important;height:100%!important;min-height:0!important;
  max-height:100%!important;overflow:hidden!important;
  background:linear-gradient(165deg,#f9fdfb,#edf8f3)!important;
 }
 .muslimMessengerFrame .omMessengerShell--chat .omChatHeader{
  flex:0 0 auto!important;padding:12px 14px!important;
  border-bottom:1px solid #bdd7c8!important;
 }
 .muslimMessengerFrame .omMessengerShell--chat .omDmModeControl{
  display:none!important;
 }
 .muslimMessengerFrame .omMessengerShell--chat .omMessagesFeed{
  flex:1 1 0!important;min-height:0!important;max-height:none!important;
  overflow-y:auto!important;overscroll-behavior:contain!important;
  padding:14px!important;background:transparent!important;
 }
 .muslimMessengerFrame .omMessengerShell--chat .omMessageComposer{
  flex:0 0 auto!important;position:relative!important;z-index:10!important;
  padding:10px 10px 12px!important;min-height:66px!important;
  background:rgba(247,253,250,.98)!important;
  border-top:1px solid #c8ded1!important;box-shadow:0 -8px 24px #1c6c4520!important;
 }
 .muslimMessengerFrame .omMessengerShell--chat .omMessageComposer input[aria-label="Message"]{
  font-size:16px!important;min-height:43px!important;
 }
 .muslimMessengerFrame .omMessengerShell--chat .omComposerTools,
 .muslimMessengerFrame .omMessengerShell--chat .omComposerSettings{flex-shrink:0!important}
}
`}</style>
 </main>
}
