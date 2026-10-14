"use client";
import {useEffect,useState} from "react";
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
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 useEffect(()=>{if(!mode)return;let active=true;const timer=setTimeout(async()=>{
  setLoading(true);setError("");
  try{const client=createClient();const {data:{user}}=await client.auth.getUser();if(!user){if(active)setError("Sign in to contact members.");return}
   const q=search.trim().replace(/[%_,]/g,"");
   let request=client.from("profiles").select("id,display_name,username,avatar_url,profile_image_url,avatar_path").neq("id",user.id).limit(30);
   if(q.length>=2)request=request.or(`display_name.ilike.%${q}%,username.ilike.%${q}%`);
   const {data,error:dbError}=await request;
   if(dbError)throw dbError;
   if(active)setPeople((data||[]) as Person[]);
  }catch{if(active)setError("Unable to load members right now.")}finally{if(active)setLoading(false)}
 },search?300:0);return()=>{active=false;clearTimeout(timer)}},[mode,search]);
 const select=(id:string)=>{if(!mode)return;const params=new URLSearchParams({to:id});if(mode!=="chat")params.set("call",mode);router.push("/messages?"+params.toString())};
 return <div className={styles.root}>
  <header className={styles.heading}><strong>CONNECT WITH THE UMMAH</strong><span lang="ar" dir="rtl">تواصل</span></header>
  <div className={styles.actions}>{actions.map(action=><button type="button" key={action.mode} className={styles.action} aria-pressed={mode===action.mode} onClick={()=>{setMode(action.mode);setSearch("");setPeople([])}}><Image src={action.asset} width={88} height={88} alt="" unoptimized/><span>{action.label}</span></button>)}</div>
  {mode&&<section className={styles.picker} aria-label="Choose a member">
   <div className={styles.pickerHead}><strong>{mode==="chat"?"Start a conversation":mode==="video"?"Start a video call":"Start a voice call"}</strong><button type="button" onClick={()=>setMode(null)} aria-label="Close member picker">✕</button></div>
   <input aria-label="Search members" placeholder="Search members by name or username" value={search} onChange={e=>setSearch(e.target.value)}/>
   <div className={styles.people} aria-live="polite">{loading?<p>Finding members…</p>:error?<p>{error}</p>:people.length?people.map(person=><button type="button" key={person.id} onClick={()=>select(person.id)}><span className={styles.avatar}>{(person.display_name||person.username||"M").slice(0,1).toUpperCase()}</span><span><strong>{person.display_name||person.username||"Member"}</strong>{person.username&&<small>@{person.username}</small>}</span><span aria-hidden="true">↗</span></button>):<p>No matching members found.</p>}</div>
  </section>}
  {!mode&&<p className={styles.hint}>Choose how you want to connect, then select a member.</p>}
 </div>
}
