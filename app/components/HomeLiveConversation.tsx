"use client";
import {useEffect,useRef,useState} from "react";
import {createClient} from "../../utils/supabase/client";
type Room="desktop"|"phone"|"audio";
type Message={id:string;sender_id:string;body:string;created_at:string};
const TTL=3*60*60*1000;
export default function HomeLiveConversation({room}:{room:Room}){
 const [messages,setMessages]=useState<Message[]>([]);
 const [draft,setDraft]=useState("");
 const [user,setUser]=useState<string|null>(null);
 const [names,setNames]=useState<Record<string,string>>({});
 const [status,setStatus]=useState("");
 const inputRef=useRef<HTMLInputElement>(null);
 const dbRef=useRef(createClient());
 useEffect(()=>{let active=true;void dbRef.current.auth.getUser().then(({data})=>{if(active)setUser(data.user?.id||null)});return()=>{active=false}},[]);
 useEffect(()=>{
  const db=dbRef.current;let active=true;
  setMessages([]);setStatus("");
  const load=async()=>{
   const {data,error}=await db.from("home_room_chat_messages").select("id,sender_id,body,created_at").eq("room",room).gt("created_at",new Date(Date.now()-TTL).toISOString()).order("created_at",{ascending:true}).limit(100);
   if(!active)return;
   if(error){setStatus("Chat is temporarily unavailable.");return}
   setMessages(data||[]);
  };
  void load();
  const channel=db.channel("home-room-chat:"+room).on("postgres_changes",{event:"INSERT",schema:"public",table:"home_room_chat_messages",filter:"room=eq."+room},payload=>{
   const msg=payload.new as Message;
   if(!msg?.id||!msg.created_at||Date.now()-new Date(msg.created_at).getTime()>=TTL)return;
   setMessages(old=>old.some(m=>m.id===msg.id)?old:[...old,msg].slice(-100));
  }).subscribe();
  const refresh=window.setInterval(()=>{setMessages(old=>old.filter(m=>Date.now()-new Date(m.created_at).getTime()<TTL));void load()},30000);
  return()=>{active=false;clearInterval(refresh);void db.removeChannel(channel)};
 },[room]);
 useEffect(()=>{let active=true;const ids=[...new Set(messages.map(m=>m.sender_id))].filter(id=>!names[id]);if(!ids.length)return;
 void dbRef.current.from("profiles").select("id,display_name,username").in("id",ids).then(({data})=>{if(active&&data)setNames(old=>({...old,...Object.fromEntries(data.map(p=>[p.id,p.display_name||p.username||"Member"]))}))});
 return()=>{active=false};
 },[messages,names]);
 const send=async(e:React.FormEvent)=>{e.preventDefault();const body=draft.trim();inputRef.current?.blur();if(!body)return;if(!user){setStatus("Sign in to chat.");return}
  const {error}=await dbRef.current.from("home_room_chat_messages").insert({room,sender_id:user,body});
  if(error){setStatus("Could not send message.");return}setDraft("");setStatus("");};
 return <section className="homeLiveViewerConversation" aria-label={room+" Chat"}>
  <header><strong>💬 Chat</strong><small>{room==="phone"?"Mobile":room[0].toUpperCase()+room.slice(1)} · Messages expire after 3 hours</small></header>
  <div className="homeLiveDemoComments" aria-live="polite">{messages.length?messages.map(m=><p key={m.id}><span className="homeLiveCommentAvatar">{(names[m.sender_id]||"M")[0].toUpperCase()}</span><span><strong>{names[m.sender_id]||"Member"}</strong><small>{m.body}</small></span></p>):<p>Start the conversation in this room.</p>}</div>
  <form className="homeLiveCommentForm" onSubmit={send}><input ref={inputRef} enterKeyHint="send" aria-label="Write a chat message" value={draft} onChange={e=>setDraft(e.target.value)} maxLength={500} placeholder={user?"Message this room…":"Sign in to chat"}/><button type="submit" disabled={!user||!draft.trim()}>Send</button></form>
  {status&&<small role="status" className="homeLiveCommentDisclaimer">{status}</small>}
 </section>;
}
