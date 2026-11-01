"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {createClient} from "../../utils/supabase/client";
import Link from "next/link";
import styles from "./home-messenger.module.css";
type Participant={conversation_id:string;user_id:string};
type Msg={id:string;conversation_id:string;sender_id:string;body:string;created_at:string;attachment_path:string|null;attachment_type:string|null};
type Profile={id:string;display_name:string|null;username:string|null;gender?:string|null;avatar_gender?:string|null;avatar_config?:Record<string,unknown>|null};
export default function HomeMessagesChooser(){
 const db=useMemo(()=>createClient(),[]);
 const [uid,setUid]=useState<string|null>(null);
 const [threads,setThreads]=useState<Participant[]>([]);
 const [profiles,setProfiles]=useState<Record<string,Profile>>({});
 const [messages,setMessages]=useState<Msg[]>([]);
 const [selected,setSelected]=useState<string|null>(null);
 const [filter,setFilter]=useState<"all"|"unread"|"groups">("all");
 const [search,setSearch]=useState("");
 const [draft,setDraft]=useState("");
 const [busy,setBusy]=useState(false);
 const photoInput=useRef<HTMLInputElement>(null);
 const [photoUrls,setPhotoUrls]=useState<Record<string,string>>({});
 const [error,setError]=useState("");
 const [newChat,setNewChat]=useState(false);
 const [candidates,setCandidates]=useState<Profile[]>([]);
 const [peopleLoading,setPeopleLoading]=useState(false);
 const [unread,setUnread]=useState<Record<string,number>>({});
 const [previews,setPreviews]=useState<Record<string,string>>({});
 const [mobileThread,setMobileThread]=useState(false);
 useEffect(()=>{let active=true;db.auth.getUser().then(({data})=>{if(active)setUid(data.user?.id||null)});return()=>{active=false}},[db]);
 const loadThreads=useCallback(async()=>{if(!uid)return;
  const {data,error:err}=await db.from("dm_participants").select("conversation_id,user_id").order("joined_at",{ascending:false});
  if(err){setError(err.message);return}
  const rows=(data||[]) as Participant[];const own=new Set(rows.filter(x=>x.user_id===uid).map(x=>x.conversation_id));
  const peers=rows.filter(x=>own.has(x.conversation_id)&&x.user_id!==uid);
  setThreads(peers);
  const ids=[...new Set(peers.map(x=>x.user_id))];
  if(ids.length){const {data:p,error:profileError}=await db.from("profiles").select("id,display_name,username,gender,avatar_gender,avatar_config").in("id",ids);if(profileError){setError("Unable to load member profiles: "+profileError.message)}else setProfiles(Object.fromEntries(((p||[]) as Profile[]).map(x=>[x.id,x])))}
  if(own.size){const {data:reads}=await db.from("dm_participants").select("conversation_id,last_read_at").eq("user_id",uid).in("conversation_id",[...own]);
   const {data:recent}=await db.from("dm_messages").select("conversation_id,sender_id,created_at,body").in("conversation_id",[...own]).order("created_at",{ascending:false}).limit(500);
   const last=new Map((reads||[]).map(x=>[x.conversation_id,x.last_read_at]));const counts:Record<string,number>={};
   for(const m of recent||[]){if(m.sender_id!==uid&&(!last.get(m.conversation_id)||new Date(m.created_at)>new Date(last.get(m.conversation_id)!)))counts[m.conversation_id]=(counts[m.conversation_id]||0)+1}
   if(selected)counts[selected]=0;setUnread(counts);
   const latest:Record<string,string>={};for(const m of recent||[]){if(!(m.conversation_id in latest))latest[m.conversation_id]=m.body||""}
   setPreviews(latest)}else{setUnread({});setPreviews({})}
 },[db,uid,selected]);
 useEffect(()=>{void loadThreads();const t=setInterval(()=>void loadThreads(),12000);return()=>clearInterval(t)},[loadThreads]);
 const loadMessages=useCallback(async()=>{if(!selected)return;const {data,error:err}=await db.from("dm_messages").select("id,conversation_id,sender_id,body,created_at,attachment_path,attachment_type").eq("conversation_id",selected).order("created_at",{ascending:true}).limit(200);if(err)setError(err.message);else {setMessages((data||[]) as Msg[]);if(uid){const {error:readError}=await db.from("dm_participants").update({last_read_at:new Date().toISOString()}).eq("conversation_id",selected).eq("user_id",uid);if(!readError)setUnread(prev=>({...prev,[selected]:0}));}}},[db,selected,uid]);
 useEffect(()=>{let alive=true;const paths=[...new Set(messages.filter(m=>m.attachment_type==="image"&&m.attachment_path).map(m=>m.attachment_path!))].filter(p=>!photoUrls[p]);if(paths.length)void Promise.all(paths.map(async p=>{const {data}=await db.storage.from("dm-attachments").createSignedUrl(p,3600);return [p,data?.signedUrl] as const})).then(rows=>{if(alive)setPhotoUrls(v=>({...v,...Object.fromEntries(rows.filter((x): x is readonly [string,string]=>typeof x[1]==="string"))}))});return()=>{alive=false}},[db,messages,photoUrls]);
 useEffect(()=>{void loadMessages();const t=setInterval(()=>void loadMessages(),5000);return()=>clearInterval(t)},[loadMessages]);
 const open=(id:string)=>{setSelected(id);setMobileThread(true);setNewChat(false);setError("");setUnread(prev=>({...prev,[id]:0}));if(uid)void db.from("dm_participants").update({last_read_at:new Date().toISOString()}).eq("conversation_id",id).eq("user_id",uid).then(({error:readError})=>{if(readError){setError(readError.message);void loadThreads()}})};
 const send=async()=>{if(!uid||!selected||!draft.trim()||busy)return;setBusy(true);setError("");const {error:err}=await db.from("dm_messages").insert({conversation_id:selected,sender_id:uid,body:draft.trim()});if(err)setError(err.message);else{setDraft("");await loadMessages()}setBusy(false)};
 const sendPhoto=async(file:File)=>{if(!uid||!selected||busy)return;
  if(!["image/jpeg","image/png","image/webp","image/gif"].includes(file.type)){setError("Choose a JPG, PNG, WebP, or GIF image.");return}
  if(file.size>25*1024*1024){setError("Images must be 25 MB or smaller.");return}
  setBusy(true);setError("");const extension=file.type.split("/")[1]==="jpeg"?"jpg":file.type.split("/")[1];
  const path=selected+"/"+uid+"/"+crypto.randomUUID()+"."+extension;
  const {error:upError}=await db.storage.from("dm-attachments").upload(path,file,{contentType:file.type,upsert:false});
  if(upError){setError(upError.message);setBusy(false);return}
  const {error:msgError}=await db.from("dm_messages").insert({conversation_id:selected,sender_id:uid,body:"📷 Photo",attachment_path:path,attachment_type:"image"});
  if(msgError)setError(msgError.message);else await loadMessages();setBusy(false);
 };
 const findPeople=async()=>{if(!uid)return;setPeopleLoading(true);const q=search.trim().replace(/[%_,]/g,"");let request=db.from("profiles").select("id,display_name,username,gender,avatar_gender,avatar_config").neq("id",uid).limit(25);if(q.length>=2)request=request.or(`display_name.ilike.%${q}%,username.ilike.%${q}%`);const {data,error:lookupError}=await request;if(lookupError)setError("Unable to search members: "+lookupError.message);else setCandidates((data||[]) as Profile[]);setPeopleLoading(false)};
 useEffect(()=>{if(!newChat)return;const t=setTimeout(()=>void findPeople(),250);return()=>clearTimeout(t)},[newChat,search,uid]);
 const start=async(id:string)=>{setBusy(true);const {data,error:err}=await db.rpc("dm_start_conversation",{other_user:id});if(err)setError(err.message);else if(typeof data==="string"){await loadThreads();open(data)}setBusy(false)};
 const name=(id:string)=>profiles[id]?.display_name?.trim()||profiles[id]?.username?.trim()||"Member";
 const avatar=(p?:Profile)=>{const c=p?.avatar_config;const selected=c?.selectedAvatarUrl;const custom=c?.adminAvatarUrl;const safe=(v:unknown)=>typeof v==="string"&&(/^(https:\/\/)/.test(v)||/^\/assets\/avatars\/[a-zA-Z0-9._-]+$/.test(v))?v:null;return safe(selected)||safe(custom)||(String(c?.gender||p?.avatar_gender||p?.gender||"male").toLowerCase()==="female"?"/assets/avatars/Default-women.png":"/assets/avatars/default-male.jpg")};
 const portrait=(p?:Profile)=> <span className={styles.avatar}>{avatar(p)?<img src={avatar(p)} alt="" loading="lazy" onError={e=>{e.currentTarget.src="/assets/avatars/default-male.jpg"}}/>:(p?.display_name||p?.username||"M").charAt(0).toUpperCase()}</span>;
 const snippet=(value:string)=>{const Segmenter=(Intl as unknown as {Segmenter?:new (locale:string,options:{granularity:"grapheme"})=>{segment:(s:string)=>Iterable<{segment:string}>}}).Segmenter;const chars=Segmenter?Array.from(new Segmenter("en",{granularity:"grapheme"}).segment(value),x=>x.segment):Array.from(value);return chars.slice(0,40).join("")+(chars.length>40?"…":"")};
 const current=threads.find(t=>t.conversation_id===selected);
 const shown=threads.filter(t=>(filter!=="unread"||unread[t.conversation_id]>0)&& (filter!=="groups")&&name(t.user_id).toLowerCase().includes(search.toLowerCase()));
 return <div className={styles.root}><header className={styles.heading}><strong>CONNECT WITH THE UMMAH</strong><span lang="ar" dir="rtl">رسائل</span></header>
 <div className={styles.panel}>
 <aside className={`${styles.sidebar} ${mobileThread?styles.mobileHidden:""}`}>
 <div className={styles.title}><Link className={styles.titleLink} href="/messages" title="Open Backpages Messenger">💬 Messages</Link><div className={styles.titleActions}><button onClick={()=>{setSearch("");setNewChat(true);setMobileThread(false);setError("")}} title="Compose a new message" aria-label="Compose a new message">✎</button><Link href="/messages" className={styles.expand} aria-label="Expand Messenger">Expand ↗</Link></div></div>
 <input className={styles.search} placeholder="⌕  Search messages..." aria-label="Search messages" value={search} onChange={e=>setSearch(e.target.value)}/>
 <div className={styles.tabs}>{(["all","unread","groups"] as const).map(x=><button key={x} className={filter===x?styles.active:""} onClick={()=>{setFilter(prev=>prev===x&&x==="unread"?"all":x);setSelected(null);setMobileThread(false);setMessages([])}}>{x==="all"?"All":x==="unread"?"Unread":"Groups"}</button>)}</div>
 {!uid?<p className={styles.empty}>Sign in to view and send messages.</p>:newChat?<div className={styles.list}><button className={styles.newChatBack} onClick={()=>setNewChat(false)}>← Conversations</button><p className={styles.composeHint}>1. Search a member above · 2. Select their avatar · 3. Write and send.</p>{peopleLoading&&<p className={styles.empty}>Finding members…</p>}{!peopleLoading&&!candidates.length&&<p className={styles.empty}>No members found. Try a username.</p>}{candidates.map(p=><button key={p.id} className={styles.row} disabled={busy} onClick={()=>void start(p.id)}>{portrait(p)}<span>{p.display_name||p.username||"Member"}</span></button>)}</div>:<div className={styles.list}>{shown.map(t=><button key={t.conversation_id} className={`${styles.row} ${selected===t.conversation_id&&mobileThread?styles.selected:""}`} onClick={()=>open(t.conversation_id)}>{portrait(profiles[t.user_id])}<span className={styles.rowText}><strong>{name(t.user_id)}</strong><small>{snippet(/^📷\s/.test(previews[t.conversation_id]||"")?"📷 Photo":previews[t.conversation_id]||"")}</small></span>{unread[t.conversation_id]>0&&<b className={styles.badge}>{unread[t.conversation_id]}</b>}</button>)}{filter==="groups"&&<p className={styles.empty}>Open group chats from the full Messenger.</p>}{!shown.length&&filter!=="groups"&&<p className={styles.empty}>{filter==="unread"?"All caught up — no unread messages.":"No conversations yet. Tap ✎ to start one."}</p>}</div>}
 </aside>
 <section className={`${styles.thread} ${!mobileThread?styles.mobileHiddenThread:""}`}>
 <div className={styles.threadHeader}>{mobileThread&&<button className={styles.back} onClick={()=>{setMobileThread(false);setSelected(null);setMessages([])}} aria-label="Back to conversations">‹</button>}{current?portrait(profiles[current.user_id]):<span className={styles.avatar}>💬</span>}<span><strong>{current?name(current.user_id):"Your messages"}</strong><small>{current?"Private conversation":"Select a conversation to begin"}</small></span></div>
 <div className={styles.messages}>{selected?messages.map(m=><div key={m.id} className={`${styles.bubble} ${m.sender_id===uid?styles.mine:""}`}><small>{m.sender_id===uid?"You":current?name(current.user_id):"Member"} · {new Date(m.created_at).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}</small>{m.attachment_type!=="image"&&<span>{m.body}</span>}{m.attachment_type==="image"&&m.attachment_path&&(photoUrls[m.attachment_path]?<a href={photoUrls[m.attachment_path]} target="_blank" rel="noopener noreferrer" aria-label="View full image"><img src={photoUrls[m.attachment_path]} alt="Shared photo" loading="lazy" style={{display:"block",maxWidth:"100%",maxHeight:260,borderRadius:12,objectFit:"contain",marginTop:6}}/></a>:<small>Loading photo…</small>)}</div>):<div className={styles.empty}>Select a conversation from the left, or start a new message. 💚</div>}</div>
 <form className={styles.composer} onSubmit={e=>{e.preventDefault();void send()}}><input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={e=>{const file=e.target.files?.[0];if(file)void sendPhoto(file);e.target.value=""}}/><button type="button" disabled={!selected||!uid||busy} onClick={()=>photoInput.current?.click()} title="Attach photo" aria-label="Attach photo" style={{background:"rgba(1,95,71,.55)",border:"1px solid rgba(227,216,175,.4)",fontSize:19}}>📷</button><input aria-label="Write a message" placeholder="Write a message..." value={draft} onChange={e=>setDraft(e.target.value)} disabled={!selected||!uid}/><button type="submit" disabled={!selected||!draft.trim()||busy} aria-label="Send message">➤</button></form>
 </section></div>{error&&<p role="alert" className={styles.error}>{error}</p>}</div>
}