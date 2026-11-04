"use client";
import {useEffect,useRef,useState} from "react";
import {createClient} from "../../utils/supabase/client";
type Format="desktop"|"phone"|"audio";
type Row={id:string;body:string;sender_id:string;created_at:string;stream_id:string|null};
type ChatMessage=Row&{name:string};
const SIX_HOURS=6*60*60*1000;
export default function HomeLiveConversation({live,streamId,format="desktop"}:{live:boolean;streamId?:string|null;format?:Format}){
 const dbRef=useRef<ReturnType<typeof createClient>|null>(null);
 const [messages,setMessages]=useState<ChatMessage[]>([]);
 const [draft,setDraft]=useState("");
 const [uid,setUid]=useState<string|null>(null);
 const [status,setStatus]=useState("");
 const inputRef=useRef<HTMLInputElement>(null);
 const namesRef=useRef<Record<string,string>>({});
 const [tick,setTick]=useState(0);
 useEffect(()=>{let active=true;const db=createClient();dbRef.current=db;void db.auth.getUser().then(async({data:{user}})=>{if(!active)return;setUid(user?.id||null);if(user){const {data}=await db.from("profiles").select("display_name,username").eq("id",user.id).maybeSingle();if(active)namesRef.current[user.id]=data?.display_name||data?.username||"Member"}});return()=>{active=false}},[]);
 useEffect(()=>{const timer=window.setInterval(()=>setTick(n=>n+1),30000);return()=>clearInterval(timer)},[]);
 useEffect(()=>{
  const db=dbRef.current||createClient();let active=true;
  setMessages([]);setStatus("");
  const enrich=async(rows:Row[])=>{
   const ids=[...new Set(rows.map(r=>r.sender_id))].filter(id=>!namesRef.current[id]);
   if(ids.length){const {data}=await db.from("profiles").select("id,display_name,username").in("id",ids);for(const p of data||[])namesRef.current[p.id]=p.display_name||p.username||"Member";}
   return rows.map(r=>({...r,name:namesRef.current[r.sender_id]||"Member"}));
  };
  const load=async()=>{
   const cutoff=new Date(Date.now()-SIX_HOURS).toISOString();
   const {data,error}=await db.from("home_format_chat_messages").select("id,body,sender_id,created_at,stream_id").eq("format",format).gte("created_at",cutoff).order("created_at",{ascending:false}).limit(100);
   if(!active)return;
   if(error){setStatus("Community chat is unavailable until the database update is applied.");return;}
   const enriched=await enrich((data||[]) as Row[]);
   if(active)setMessages(enriched.reverse());
  };
  void load();
  const channel=db.channel("home-format-chat:"+format).on("postgres_changes",{event:"INSERT",schema:"public",table:"home_format_chat_messages",filter:"format=eq."+format},payload=>{
   const row=payload.new as Row;if(!row.id)return;
   void enrich([row]).then(([message])=>{if(active)setMessages(prev=>prev.some(p=>p.id===message.id)?prev:[...prev,message].slice(-100))});
  }).subscribe();
  return()=>{active=false;void db.removeChannel(channel)};
 },[format]);
 const visible=messages.filter(m=>new Date(m.created_at).getTime()>Date.now()-SIX_HOURS);
 const send=async(e:React.FormEvent)=>{e.preventDefault();const body=draft.trim();if(!body)return;if(!uid){setStatus("Sign in to join this public conversation.");return;}
  const db=dbRef.current||createClient();const {error}=await db.from("home_format_chat_messages").insert({format,sender_id:uid,stream_id:live?streamId||null:null,body});
  if(error){setStatus("Message wasn't sent. Please try again.");return;}
  setDraft("");setStatus("");inputRef.current?.blur();
 };
 return <section className="homeLiveViewerConversation" aria-label={format+" community chat"}>
  <header><strong>💬 {format.toUpperCase()} COMMUNITY CHAT</strong><small>{live?"Live now · Public conversation":"Between lives · Public conversation"}</small></header>
  <div className="homeLiveDemoComments" aria-live="polite">{visible.length?visible.map(m=><p key={m.id}><span className="homeLiveCommentAvatar">{m.name.slice(0,1).toUpperCase()}</span><span><strong>{m.name}</strong><small>{m.body}</small></span></p>):<p>Start a conversation. This room stays open between livestreams.</p>}</div>
  <form className="homeLiveCommentForm" onSubmit={send}><input ref={inputRef} enterKeyHint="send" aria-label={"Write to "+format+" community chat"} value={draft} onChange={e=>setDraft(e.target.value)} maxLength={500} placeholder={"Message the "+format+" community…"}/><button type="submit" disabled={!uid||!draft.trim()}>Send</button></form>
  {status&&<small role="status" className="homeLiveCommentDisclaimer">{status}</small>}
  <small className="homeLiveCommentDisclaimer">Real members · Public {format} room · Messages expire after 6 hours</small>
 </section>;
}
