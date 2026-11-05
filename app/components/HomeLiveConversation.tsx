"use client";
import {useEffect,useLayoutEffect,useRef,useState} from "react";
import {createClient} from "../../utils/supabase/client";
type Room="desktop"|"phone"|"audio";
type Message={id:string;sender_id:string;body:string;image_path?:string|null;created_at:string};
const TTL=3*60*60*1000;
const BUCKET="home-chat-images";
export default function HomeLiveConversation({room}:{room:Room}){
 const [messages,setMessages]=useState<Message[]>([]);
 const [draft,setDraft]=useState("");
 const [user,setUser]=useState<string|null>(null);
 const [names,setNames]=useState<Record<string,string>>({});
 const [avatars,setAvatars]=useState<Record<string,string|null>>({});
 const [failedAvatars,setFailedAvatars]=useState<Record<string,boolean>>({});
 const [status,setStatus]=useState("");
 const [image,setImage]=useState<File|null>(null);
 const [preview,setPreview]=useState<string|null>(null);
 const [sending,setSending]=useState(false);
 const inputRef=useRef<HTMLInputElement>(null);
 const pickerRef=useRef<HTMLInputElement>(null);
 const dbRef=useRef(createClient());
 const commentsRef=useRef<HTMLDivElement>(null);
 const lastMessageIdRef=useRef<string|null>(null);
 const idleTimerRef=useRef<ReturnType<typeof setTimeout>|null>(null);
 const programmaticScrollRef=useRef(false);
 const scrollFrameRef=useRef<number|null>(null);
 const scrollToLatest=(animated:boolean)=>{
  const el=commentsRef.current;if(!el)return;
  if(scrollFrameRef.current!==null)cancelAnimationFrame(scrollFrameRef.current);
  const target=Math.max(0,el.scrollHeight-el.clientHeight);
  const distance=Math.abs(target-el.scrollTop);
  if(distance<2)return;
  const reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(!animated||reduce){el.scrollTop=target;return;}
  const from=el.scrollTop,start=performance.now();
  const duration=Math.min(500,Math.max(160,distance*.35));
  programmaticScrollRef.current=true;
  const tick=(now:number)=>{
   const progress=Math.min(1,(now-start)/duration);
   const ease=1-Math.pow(1-progress,3);
   el.scrollTop=from+(target-from)*ease;
   if(progress<1)scrollFrameRef.current=requestAnimationFrame(tick);
   else{scrollFrameRef.current=null;programmaticScrollRef.current=false;}
  };
  scrollFrameRef.current=requestAnimationFrame(tick);
 };
 const scheduleIdleReturn=()=>{
  if(idleTimerRef.current)clearTimeout(idleTimerRef.current);
  idleTimerRef.current=setTimeout(()=>scrollToLatest(true),3000);
 };
 const onCommentsScroll=()=>{
  if(!programmaticScrollRef.current)scheduleIdleReturn();
 };
 useEffect(()=>{
  lastMessageIdRef.current=null;
  scrollToLatest(false);
  return()=>{
   if(idleTimerRef.current)clearTimeout(idleTimerRef.current);
   if(scrollFrameRef.current!==null)cancelAnimationFrame(scrollFrameRef.current);
   programmaticScrollRef.current=false;
  };
 },[room]);
 useLayoutEffect(()=>{
  const lastId=messages[messages.length-1]?.id||null;
  if(lastId!==lastMessageIdRef.current){
   lastMessageIdRef.current=lastId;
   scrollToLatest(true);
  }
 },[messages]);
 useEffect(()=>{
  const el=commentsRef.current;if(!el)return;
  const observer=new ResizeObserver(()=>{if(!idleTimerRef.current)scrollToLatest(false)});
  observer.observe(el);
  return()=>observer.disconnect();
 },[room]);
 useEffect(()=>{
  const db=dbRef.current;let active=true;
  const sync=async()=>{const {data}=await db.auth.getUser();if(active)setUser(data.user?.id||null)};
  void sync();
  const {data:{subscription}}=db.auth.onAuthStateChange((_event,session)=>{if(active)setUser(session?.user?.id||null)});
  return()=>{active=false;subscription.unsubscribe()};
 },[]);
 useEffect(()=>{
  const db=dbRef.current;let active=true;
  setMessages([]);setStatus("");
  const load=async()=>{
   const {data,error}=await db.from("home_room_chat_messages").select("id,sender_id,body,image_path,created_at").eq("room",room).gt("created_at",new Date(Date.now()-TTL).toISOString()).order("created_at",{ascending:true}).limit(100);
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
  const refresh=window.setInterval(()=>{void load()},30000);
  return()=>{active=false;clearInterval(refresh);void db.removeChannel(channel)};
 },[room]);
 useEffect(()=>{let active=true;const ids=[...new Set(messages.map(m=>m.sender_id))].filter(id=>!names[id]);if(!ids.length)return;
 void dbRef.current.from("profiles").select("id,display_name,username,avatar_url").in("id",ids).then(({data})=>{if(active&&data){setNames(old=>({...old,...Object.fromEntries(data.map(p=>[p.id,p.display_name||p.username||"Member"]))}));setAvatars(old=>({...old,...Object.fromEntries(data.map(p=>[p.id,p.avatar_url||null]))}));}});
 return()=>{active=false};
 },[messages,names]);
 useEffect(()=>{if(!image){setPreview(null);return}const url=URL.createObjectURL(image);setPreview(url);return()=>URL.revokeObjectURL(url)},[image]);
 const chooseImage=(file?:File)=>{
  if(!file)return;
  if(!["image/jpeg","image/png","image/webp","image/gif"].includes(file.type)||file.size>5*1024*1024){setStatus("Choose a JPG, PNG, WebP or GIF under 5 MB.");return}
  setImage(file);setStatus("");
 };
 const send=async(e:React.FormEvent)=>{
  e.preventDefault();if(sending||!user)return;
  const body=draft.trim();if(!body&&!image)return;
  inputRef.current?.blur();setSending(true);setStatus("");
  let imagePath:string|null=null;
  try{
   if(image){
    const ext=({ "image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/gif":"gif"} as Record<string,string>)[image.type];
    imagePath=`${user}/${crypto.randomUUID()}.${ext}`;
    const {error:uploadError}=await dbRef.current.storage.from(BUCKET).upload(imagePath,image,{contentType:image.type,upsert:false});
    if(uploadError)throw uploadError;
   }
   const {error}=await dbRef.current.from("home_room_chat_messages").insert({room,sender_id:user,body,image_path:imagePath});
   if(error)throw error;
   setDraft("");setImage(null);if(pickerRef.current)pickerRef.current.value="";
  }catch{
   if(imagePath)void dbRef.current.storage.from(BUCKET).remove([imagePath]);
   setStatus("Could not send message. Please try again.");
  }finally{setSending(false)}
 };
 return <section className="homeLiveViewerConversation" aria-label={room+" Chat"}>
  <header><strong>💬 Chat</strong><small>{room==="phone"?"Mobile":room[0].toUpperCase()+room.slice(1)} · Messages expire after 3 hours</small></header>
  <div ref={commentsRef} onScroll={onCommentsScroll} onTouchStart={scheduleIdleReturn} onTouchMove={scheduleIdleReturn} onWheel={scheduleIdleReturn} className="homeLiveDemoComments" aria-live="polite">{messages.length?messages.map(m=><p key={m.id}><span className="homeLiveCommentAvatar">{avatars[m.sender_id]&&!failedAvatars[m.sender_id]?<img src={avatars[m.sender_id]!} alt="" loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailedAvatars(old=>({...old,[m.sender_id]:true}))} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"inherit",display:"block"}}/>:(names[m.sender_id]||"M")[0].toUpperCase()}</span><span><strong>{names[m.sender_id]||"Member"}</strong>{m.body&&<small>{m.body}</small>}{m.image_path&&<a href={dbRef.current.storage.from(BUCKET).getPublicUrl(m.image_path).data.publicUrl} target="_blank" rel="noopener noreferrer" aria-label="Open chat image"><img src={dbRef.current.storage.from(BUCKET).getPublicUrl(m.image_path).data.publicUrl} alt="Image shared in chat" loading="lazy" style={{display:"block",maxWidth:"min(220px,65vw)",maxHeight:180,objectFit:"contain",borderRadius:12,marginTop:6}}/></a>}</span></p>):<p>Start the conversation in this room.</p>}</div>
  {user?<form className="homeLiveCommentForm" onSubmit={send}>
   <input ref={pickerRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{display:"none"}} onChange={e=>chooseImage(e.target.files?.[0])} aria-label="Choose chat image"/>
   <button type="button" aria-label="Add image" title="Add image" onClick={()=>pickerRef.current?.click()} disabled={sending} style={{flex:"0 0 36px",borderRadius:"50%",fontSize:24,background:"transparent",color:"inherit",border:"1px solid currentColor",opacity:.85}}>+</button>
   <div style={{flex:1,minWidth:0}}>{preview&&<div style={{display:"flex",alignItems:"center",gap:8,padding:5}}><img src={preview} alt="Selected image" style={{height:48,width:48,objectFit:"cover",borderRadius:8}}/><button type="button" aria-label="Remove selected image" onClick={()=>setImage(null)}>×</button></div>}<input ref={inputRef} enterKeyHint="send" aria-label="Write a chat message" value={draft} onChange={e=>setDraft(e.target.value)} maxLength={500} placeholder="Message this room…"/></div>
   <button type="submit" disabled={sending||(!draft.trim()&&!image)}>{sending?"Sending…":"Send"}</button>
  </form>:<div className="homeLiveCommentForm" aria-label="Chat is read only until sign in"><div role="note" aria-disabled="true" style={{flex:1,padding:"12px 16px",opacity:.7,userSelect:"none",pointerEvents:"none"}}>Sign in to chat</div><button type="button" disabled>Send</button></div>}
  {status&&<small role="status" className="homeLiveCommentDisclaimer">{status}</small>}
 </section>;
}
