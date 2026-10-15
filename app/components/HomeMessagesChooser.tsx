"use client";
import {useEffect,useRef,useState} from "react";
import Image from "next/image";
import {useRouter} from "next/navigation";
import {createClient} from "../../utils/supabase/client";
import styles from "./home-messages-chooser.module.css";
type Mode="audio"|"video"|"chat";
type Person={id:string;display_name:string|null;username:string|null;avatar_url:string|null;profile_image_url:string|null;avatar_path:string|null};
const actions:{mode:Mode;label:string;asset:string}[]=[
 {mode:"audio",label:"Voice call",asset:"/assets/control-center/1calls.PNG"},
 {mode:"video",label:"Video call",asset:"/assets/control-center/1video-calling.PNG"},
 {mode:"chat",label:"Message",asset:"/assets/hudhud-messages.PNG"}
];
export default function HomeMessagesChooser(){
 const router=useRouter();
 const [mode,setMode]=useState<Mode|null>(null);
 const [search,setSearch]=useState("");
 const [people,setPeople]=useState<Person[]>([]);
 const [selected,setSelected]=useState<Person|null>(null);
 const [draft,setDraft]=useState("");
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const [cameraOn,setCameraOn]=useState(false);
 const [muted,setMuted]=useState(false);
 const [cameraError,setCameraError]=useState("");
 const videoRef=useRef<HTMLVideoElement>(null);
 const mediaRef=useRef<MediaStream|null>(null);
 useEffect(()=>{if(mode==="video")return;setCameraOn(false)},[mode]);
 useEffect(()=>{if(mode!=="video"||!cameraOn)return;let cancelled=false;
  (async()=>{try{const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:false});if(cancelled){stream.getTracks().forEach(t=>t.stop());return}mediaRef.current=stream;if(videoRef.current){videoRef.current.srcObject=stream;await videoRef.current.play().catch(()=>{})}}catch{if(!cancelled){setCameraError("Camera permission unavailable. You can still select a member.");setCameraOn(false)}}})();
  return()=>{cancelled=true;mediaRef.current?.getTracks().forEach(t=>t.stop());mediaRef.current=null;if(videoRef.current)videoRef.current.srcObject=null};
 },[mode,cameraOn]);
 useEffect(()=>{if(!mode)return;let active=true;const timer=setTimeout(async()=>{
  setLoading(true);setError("");
  try{const client=createClient();const {data:{user}}=await client.auth.getUser();if(!user){if(active)setError("Sign in to contact members.");return}
   const q=search.trim().replace(/[%_,]/g,"");
   let request=client.from("profiles").select("id,display_name,username,avatar_url,profile_image_url,avatar_path").neq("id",user.id).limit(30);
   if(q.length>=2)request=request.or(`display_name.ilike.%${q}%,username.ilike.%${q}%`);
   const {data,error:dbError}=await request;if(dbError)throw dbError;
   if(active)setPeople((data||[]) as Person[]);
  }catch{if(active)setError("Unable to load members right now.")}finally{if(active)setLoading(false)}
 },search?300:0);return()=>{active=false;clearTimeout(timer)}},[mode,search]);
 const chooseMode=(next:Mode)=>{setMode(next);setSearch("");setSelected(null);setDraft("");setPeople([]);setCameraOn(false);setCameraError("")};
 const openConversation=(person:Person,call?:Mode)=>{const params=new URLSearchParams({to:person.id});if(call&&call!=="chat")params.set("call",call);if(!call&&draft.trim())params.set("draft",draft.trim());router.push("/messages?"+params.toString())};
 const displayName=(p:Person)=>p.display_name||p.username||"Member";
 const avatar=(p:Person)=>{const url=p.avatar_url||p.profile_image_url||p.avatar_path;return url&&(/^(https?:|\/)/.test(url))?<img src={url} alt="" loading="lazy" referrerPolicy="no-referrer"/>:<span>{displayName(p).slice(0,1).toUpperCase()}</span>};
 return <div className={styles.root}>
  <header className={styles.heading}><strong>CONNECT WITH THE UMMAH</strong><span lang="ar" dir="rtl">تواصل</span></header>
  <div className={styles.actions}>{actions.map(action=><button type="button" key={action.mode} className={styles.action} aria-pressed={mode===action.mode} onClick={()=>chooseMode(action.mode)}><Image src={action.asset} width={88} height={88} alt="" unoptimized/><span>{action.label}</span></button>)}</div>
  {mode&&<section className={styles.picker} aria-label={mode==="video"?"Video calling studio":mode==="audio"?"Voice calling studio":"Message studio"}>
   <div className={styles.pickerHead}><strong>{mode==="chat"?"✉ Message Studio":mode==="video"?"◉ Video Studio":"☎ Voice Studio"}</strong><button type="button" onClick={()=>chooseMode(mode)} aria-label="Close studio">✕</button></div>
   {mode==="video"&&<div className={styles.cameraStage}><div className={styles.cameraView}>{cameraOn?<video ref={videoRef} autoPlay playsInline muted aria-label="Your camera preview"/>:<div className={styles.cameraPlaceholder}>◉<small>Camera preview is off</small></div>}</div><div className={styles.cameraControls}><button type="button" onClick={()=>{setCameraError("");setCameraOn(v=>!v)}}>{cameraOn?"◼ Camera off":"◉ Enable camera"}</button><button type="button" onClick={()=>setMuted(v=>!v)} aria-pressed={muted}>{muted?"Mic muted":"Mic ready"}</button></div>{cameraError&&<small role="status">{cameraError}</small>}</div>}
   {mode==="audio"&&<div className={styles.callStage}><span className={styles.callHalo} aria-hidden="true">☎</span><strong>Voice call</strong><small>Select a member to start a call. Your microphone is requested when the call begins.</small><button type="button" onClick={()=>setMuted(v=>!v)} aria-pressed={muted}>{muted?"◌ Microphone muted":"♩ Microphone ready"}</button></div>}
   <label className={styles.searchLabel}><span>Find a member</span><input aria-label="Search members" placeholder="Search name or @username" value={search} onChange={e=>setSearch(e.target.value)}/></label>
   <div className={styles.people} aria-live="polite">{loading?<p>Finding members…</p>:error?<p>{error}</p>:people.length?<div className={styles.peopleGrid}>{people.map(person=><button type="button" key={person.id} className={styles.personCard} aria-pressed={selected?.id===person.id} onClick={()=>setSelected(person)}><span className={styles.avatar}>{avatar(person)}</span><strong>{displayName(person)}</strong>{person.username&&<small>@{person.username}</small>}</button>)}</div>:<p>No matching members found.</p>}</div>
   {mode==="chat"&&<div className={styles.messageComposer}><span>{selected?"To "+displayName(selected):"Select an avatar to compose"}</span><textarea aria-label="Your message" rows={2} placeholder="As-salāmu ʿalaykum…" value={draft} onChange={e=>setDraft(e.target.value)}/><button type="button" disabled={!selected} onClick={()=>selected&&openConversation(selected)}>Open chat ↗</button><small>Messages are sent from the conversation screen, not automatically.</small></div>}
   {mode!=="chat"&&<div className={styles.callActions}><button type="button" className={styles.endCall} onClick={()=>chooseMode(mode)}>✕ End / Close</button><button type="button" disabled={!selected} onClick={()=>selected&&openConversation(selected,mode)}>{mode==="video"?"◉ Start video call":"☎ Start voice call"} ↗</button></div>}
  </section>}
  {!mode&&<p className={styles.hint}>Choose how to connect. Each option opens its own studio.</p>}
 </div>;
}
