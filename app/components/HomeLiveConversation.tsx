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
 const [connected,setConnected]=useState(false);
 const [sending,setSending]=useState(false);
 const [demoComments,setDemoComments]=useState<Comment[]>([]);
 const scrollRef=useRef<HTMLDivElement|null>(null);
 const WAITING_KEY="1muslim:live-waiting-room:v1";
 const WAITING_TTL=20*60*1000;
 const [checkpoint,setCheckpoint]=useState(false);
 useEffect(()=>{
  if(live){setCheckpoint(true);return;}
  const now=Date.now();
  const samples=[{name:"Amina",text:"As-salāmu ʿalaykum 🌙"},{name:"Yusuf",text:"May Allah bless this Ummah 🤲"},{name:"Maryam",text:"Beautiful reminder, mā shā’ Allāh ✨"},{name:"Bilal",text:"Alhamdulillah 💚"},{name:"Fatima",text:"May this Live benefit everyone 🤲"},{name:"Omar",text:"Looking forward to the next session 💚"}];
  let stored:Comment[]=[];
  try{const raw=window.localStorage.getItem(WAITING_KEY);if(raw){const parsed=JSON.parse(raw);if(Array.isArray(parsed))stored=parsed.filter((v:Comment)=>typeof v?.text==="string"&&typeof v?.at==="number"&&now-v.at<WAITING_TTL)}}catch{}
  setDemoComments(stored);
  let index=stored.filter(v=>v.id.startsWith("waiting-demo-")).length;
  const timer=window.setInterval(()=>{
   const item=samples[index%samples.length];
   const next={id:"waiting-demo-"+Date.now(),name:item.name,text:item.text,at:Date.now()};
   setDemoComments(prev=>[...prev.filter(v=>Date.now()-v.at<WAITING_TTL),next].slice(-80));
   index++;
  },4500);
  return()=>window.clearInterval(timer);
 },[live]);
 useEffect(()=>{if(live)return;try{window.localStorage.setItem(WAITING_KEY,JSON.stringify(demoComments.filter(v=>Date.now()-v.at<WAITING_TTL).slice(-80)))}catch{}},[demoComments,live]);
 useEffect(()=>{scrollRef.current?.scrollTo({top:scrollRef.current.scrollHeight,behavior:"smooth"})},[comments,demoComments]);
 const dbRef=useRef<ReturnType<typeof createClient>|null>(null);
 const channelRef=useRef<ReturnType<ReturnType<typeof createClient>["channel"]>|null>(null);
 useEffect(()=>{const db=createClient();dbRef.current=db;let active=true;
 db.auth.getUser().then(async({data:{user:u}})=>{if(!active||!u)return;const {data}=await db.from("profiles").select("display_name,username").eq("id",u.id).maybeSingle();if(active)setUser({id:u.id,name:data?.display_name||data?.username||"Member"})}).catch(()=>{});
 return()=>{active=false}},[]);
 useEffect(()=>{
  setComments([]);setStatus("");setConnected(false);
  if(!live||!roomName)return;
  const db=dbRef.current||createClient();
  const channel=db.channel("live-comments:"+roomName,{config:{broadcast:{self:true}}});
  channelRef.current=channel;
  channel.on("broadcast",{event:"comment"},({payload})=>{
   if(typeof payload?.id!=="string"||typeof payload?.text!=="string"||typeof payload?.name!=="string")return;
   const c:Comment={id:payload.id,name:payload.name.slice(0,48),text:payload.text.slice(0,280),at:Date.now()};
   setComments(prev=>prev.some(p=>p.id===c.id)?prev:[...prev,c].slice(-60));
  }).subscribe(state=>{if(state==="SUBSCRIBED"){setConnected(true);setStatus("")}else if(state==="CHANNEL_ERROR"||state==="TIMED_OUT"){setConnected(false);setStatus("Live comments temporarily unavailable")}});
  return()=>{channelRef.current=null;setConnected(false);void db.removeChannel(channel)};
 },[live,roomName]);
 const send=async(e:React.FormEvent)=>{e.preventDefault();const text=draft.trim();if(!text)return;
  if(!live||!roomName){setDemoComments(prev=>[...prev,{id:crypto.randomUUID(),name:user?.name||"Guest",text,at:Date.now()}].slice(-80));setDraft("");return;}
  const channel=channelRef.current;if(!channel||!connected||sending){setStatus("Connecting to this livestream’s chat. Try again shortly.");return;}
  const payload={id:crypto.randomUUID(),name:user?.name||"Guest",text};
  setSending(true);
  try{const result=await channel.send({type:"broadcast",event:"comment",payload});if(result!=="ok")throw Error("Send failed");setComments(prev=>prev.some(p=>p.id===payload.id)?prev:[...prev,{...payload,at:Date.now()}].slice(-60));setDraft("");setStatus("")}
  catch{setStatus("Could not send comment. Try again.")}finally{setSending(false)}};
 return <section className="homeLiveViewerConversation" aria-label="Live conversation">
  <header className="chatTop"><strong><i/> {live?"LIVE CHAT":"WAITING ROOM"}</strong><small>{live?(connected?"● Connected to this Live":"Connecting to Live chat…"):"Last 20 minutes · local history"}</small></header>
  {live&&checkpoint&&<div className="waitingRoomCheckpoint" role="status">✦ Waiting room closed · Live comments begin here</div>}<div ref={scrollRef} className="homeLiveDemoComments" aria-live="polite">{(live?comments:demoComments).length?(live?comments:demoComments).map(c=><p key={c.id} className="chatBubble"><span className="homeLiveCommentAvatar">{c.name.slice(0,1).toUpperCase()}</span><span><strong>{c.name}</strong><small>{c.text}</small></span></p>):<p className="chatEmpty">{live?"Say salaam 👋 Be the first to join the conversation.":"💬 Live comments will appear here when a stream begins."}</p>}</div>
  <form className="homeLiveCommentForm" onSubmit={send}><input aria-label="Write a live comment" value={draft} onChange={e=>setDraft(e.target.value)} maxLength={280} placeholder={live?"Comment on this livestream…":"Write a comment…"}/><button type="submit" disabled={!draft.trim()||sending||(live&&!connected)} aria-label="Send comment">➤</button></form>
  {status&&<small role="status" className="homeLiveCommentDisclaimer">{status}</small>}

  {live&&roomName?<Link className="homeLiveStudioEntry" href="/live">Open Live Studio ↗</Link>:<Link className="homeLiveStudioEntry" href="/streaming/go-live">Start your own Live ↗</Link>}
 <style jsx>{`
 .homeLiveViewerConversation{height:100%!important;box-sizing:border-box!important;display:flex;flex-direction:column;gap:12px;min-height:210px;padding:16px!important;border-radius:24px!important;background:linear-gradient(160deg,rgba(5,32,25,.72),rgba(4,21,18,.54))!important;backdrop-filter:blur(22px);border:1px solid rgba(211,186,119,.24)!important;box-shadow:inset 0 1px rgba(255,255,255,.08)}
 .chatTop{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 2px}.chatTop strong{font-size:12px;letter-spacing:.13em;color:#f5ebd4}.chatTop i{display:inline-block;width:7px;height:7px;background:#43dba1;border-radius:50%;margin-right:6px;box-shadow:0 0 10px #43dba1}.chatTop small{font-size:10px;color:#a5c9b9}
 .waitingRoomCheckpoint{font-size:11px;color:#e7d39f;text-align:center;padding:7px 3px;border-bottom:1px solid #e7d39f33}.homeLiveDemoComments{flex:1 1 auto!important;min-height:0!important;max-height:none!important;overflow-y:auto;display:flex;flex-direction:column;gap:9px;scrollbar-width:thin}.chatEmpty{font-size:13px;color:#b7cfc3;line-height:1.5;text-align:center;margin:auto;padding:16px 10px}.chatBubble{display:flex;align-items:flex-start;gap:8px;margin:0;padding:5px 0}.chatBubble :global(.homeLiveCommentAvatar){display:grid;place-items:center;flex:none;width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#127955,#d0a956);color:#fff;font-weight:700}.chatBubble>span:last-child{display:flex;flex-direction:column;gap:3px}.chatBubble strong{font-size:12px;color:#e4c98f}.chatBubble small{font-size:13px;line-height:1.4;color:#fff}
 @keyframes waitingChatRise{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:translateY(0)}} .homeLiveCommentForm{flex:none!important;margin-top:auto!important;display:flex!important;flex-direction:row!important;align-items:center;gap:8px!important;padding:5px!important;border:1px solid rgba(196,226,203,.23);border-radius:999px!important;background:rgba(0,15,12,.45)}.homeLiveCommentForm input{flex:1;min-width:0;height:40px!important;border:0!important;outline:0;background:transparent!important;padding:0 13px!important;color:#fff;font-size:13px}.homeLiveCommentForm button{flex:none;width:32px!important;height:32px!important;border-radius:50%!important;border:0!important;background:#0bb778!important;color:#fff;font-size:20px;display:grid;place-items:center;padding:0!important}.homeLiveCommentForm button:disabled{opacity:.35}.homeLiveStudioEntry{align-self:flex-end;font-size:12px;color:#e7d49f;text-decoration:none;padding:3px 4px}.homeLiveCommentDisclaimer{font-size:11px;color:#e6bd8c}
 `}</style>
 </section>;
}
