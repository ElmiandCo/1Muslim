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
 const [callBusy,setCallBusy]=useState(false);
 const [callError,setCallError]=useState("");
 const [facing,setFacing]=useState<"user"|"environment">("user");
 const videoRef=useRef<HTMLVideoElement>(null);
 const mediaRef=useRef<MediaStream|null>(null);
 useEffect(()=>{if(mode==="video")return;setCameraOn(false)},[mode]);
 useEffect(()=>{if(mode!=="video"||!cameraOn)return;let cancelled=false;
  (async()=>{try{const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:facing},audio:false});if(cancelled){stream.getTracks().forEach(t=>t.stop());return}mediaRef.current=stream;if(videoRef.current){videoRef.current.srcObject=stream;await videoRef.current.play().catch(()=>{})}}catch{if(!cancelled){setCameraError("Camera permission unavailable. You can still select a member.");setCameraOn(false)}}})();
  return()=>{cancelled=true;mediaRef.current?.getTracks().forEach(t=>t.stop());mediaRef.current=null;if(videoRef.current)videoRef.current.srcObject=null};
 },[mode,cameraOn,facing]);
 useEffect(()=>{if(!mode)return;let active=true;const timer=setTimeout(async()=>{
  setLoading(true);setError("");
  try{const client=createClient();const {data:{user}}=await client.auth.getUser();if(!user){if(active)setError("Sign in to contact members.");return}
   const q=search.trim().replace(/[%_,]/g,"");
   let request=client.from("profiles").select("id,display_name,username,avatar_url").neq("id",user.id).limit(30);
   if(q.length>=2)request=request.or(`display_name.ilike.%${q}%,username.ilike.%${q}%`);
   const {data,error:dbError}=await request;if(dbError){console.error("Member directory query:",dbError.code,dbError.message);throw dbError;}
   if(active)setPeople((data||[]) as Person[]);
  }catch{if(active)setError("Unable to load members right now.")}finally{if(active)setLoading(false)}
 },search?300:0);return()=>{active=false;clearTimeout(timer)}},[mode,search]);
 const chooseMode=(next:Mode)=>{setMode(next);setSearch("");setSelected(null);setDraft("");setCameraOn(false);setCameraError("");setCallError("")};
 const startCanvasCall=async(person:Person,call:"audio"|"video")=>{if(callBusy)return;setCallBusy(true);setCallError("");try{const client=createClient();const {data,error}=await client.rpc("dm_start_conversation",{other_user:person.id});if(error)throw error;if(!data||typeof data!=="string")throw Error("Could not open conversation");const {data:conversation,error:statusError}=await client.from("dm_conversations").select("request_status").eq("id",data).single();if(statusError)throw statusError;if(conversation?.request_status!=="accepted")throw Error("The member must accept your message request before you can call.");const {data:{user}}=await client.auth.getUser();if(!user)throw Error("Sign in to call");window.dispatchEvent(new CustomEvent("1muslim:call-context",{detail:{conversationId:data,userId:user.id,peerName:displayName(person),peerAvatar:person.avatar_url||null,autoStartMode:call}}));setMode(null);setCameraOn(false)}catch(e){setCallError(e instanceof Error?e.message:"Could not start call")}finally{setCallBusy(false)}};
 const openConversation=(person:Person,call?:Mode)=>{const params=new URLSearchParams({to:person.id});if(call&&call!=="chat")params.set("call",call);if(!call&&draft.trim())params.set("draft",draft.trim());router.push("/messages?"+params.toString())};
 const displayName=(p:Person)=>p.display_name||p.username||"Member";
 const avatar=(p:Person)=>{const url=p.avatar_url;return url&&(/^(https?:|\/)/.test(url))?<img src={url} alt="" loading="lazy" referrerPolicy="no-referrer"/>:<span>{displayName(p).slice(0,1).toUpperCase()}</span>};
 return <div className={styles.root} data-mode={mode||"choose"}>
  <header className={styles.heading}><strong>CONNECT WITH THE UMMAH</strong><span lang="ar" dir="rtl">تواصل</span></header>
  <nav className={styles.actions} aria-label="Communication mode">{actions.map(action=><button type="button" key={action.mode} className={styles.action} aria-pressed={mode===action.mode} onClick={()=>chooseMode(action.mode)}><Image src={action.asset} width={44} height={44} alt="" unoptimized/><span>{action.label}</span></button>)}</nav>
  <section key={mode||"choose"} className={styles.stage} aria-label="Communication workspace">
   {mode===null?<div className={styles.welcome}><span className={styles.welcomeOrb}>✧</span><strong>Choose someone to connect with</strong><small>Voice · Video · Messages</small><button type="button" onClick={()=>chooseMode("chat")}>Explore members ↗</button></div>:<>
    <div className={styles.stageBar}><span>{mode==="video"?"◉ Camera & video":mode==="audio"?"☎ Voice calling":"✉ Your messages"}</span><button type="button" className={styles.iconButton} onClick={()=>setMode(null)} aria-label="Close workspace">×</button></div>
    {mode==="video"&&<div className={styles.videoStage}>
      <div className={styles.videoFrame}>{cameraOn?<video ref={videoRef} autoPlay playsInline muted aria-label="Local camera preview"/>:<div className={styles.cameraPlaceholder}><span>◉</span><small>Camera preview</small></div>}
      <div className={styles.videoTools}><button type="button" onClick={()=>{setCameraError("");setCameraOn(v=>!v)}} aria-label={cameraOn?"Turn camera off":"Turn camera on"} title="Camera">{cameraOn?"◼":"◉"}</button><button type="button" onClick={()=>setFacing(v=>v==="user"?"environment":"user")} aria-label="Flip camera" title="Flip camera">⇄</button><button type="button" onClick={()=>setMuted(v=>!v)} aria-pressed={muted} aria-label={muted?"Unmute microphone":"Mute microphone"} title="Microphone">{muted?"◌":"♩"}</button></div></div>
      {cameraError&&<small role="status" className={styles.status}>{cameraError}</small>}
     </div>}
    {mode==="audio"&&<div className={styles.voiceStage}><span className={styles.voiceOrb} aria-hidden="true">☎</span><span>{selected?displayName(selected):"Select a member below"}</span><button type="button" className={styles.iconButton} onClick={()=>setMuted(v=>!v)} aria-pressed={muted} aria-label={muted?"Unmute microphone":"Mute microphone"}>{muted?"◌":"♩"}</button></div>}
    {callError&&<small role="alert" className={styles.status}>{callError}</small>}
    <div className={styles.memberArea}>
     <label className={styles.searchLabel}><span className={styles.srOnly}>Search members</span><input aria-label="Search members" placeholder="⌕  Search members" value={search} onChange={e=>setSearch(e.target.value)}/></label>
     <div className={styles.people} aria-live="polite">{loading?<p>Finding members…</p>:error?<p>{error}</p>:people.length?<div className={styles.peopleGrid}>{people.map(person=><button type="button" key={person.id} className={styles.personCard} aria-pressed={selected?.id===person.id} onClick={()=>setSelected(person)}><span className={styles.avatar}>{avatar(person)}</span><strong>{displayName(person)}</strong></button>)}</div>:<p>No members to show yet.</p>}</div>
    </div>
    {mode==="chat"?<div className={styles.composer}><span>{selected?"✦ "+displayName(selected):"Choose an avatar to start"}</span><div className={styles.composerRow}><input aria-label="Your message" placeholder="As-salāmu ʿalaykum…" value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&selected)openConversation(selected)}}/><button type="button" disabled={!selected} onClick={()=>selected&&openConversation(selected)} aria-label="Open conversation">➤</button></div></div>:<div className={styles.callBar}><button type="button" className={styles.hangup} onClick={()=>setMode(null)} aria-label="Close call studio">✕</button><button type="button" className={styles.callNow} disabled={!selected||callBusy} onClick={()=>selected&&void startCanvasCall(selected,mode)}>{callBusy?"Connecting…":mode==="video"?"◉ Video call":"☎ Call"}</button></div>}
   </>}
  </section>
 </div>;
}
