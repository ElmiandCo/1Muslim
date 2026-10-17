"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {createClient} from "../../utils/supabase/client";
import HomeMessagesChooser from "./HomeMessagesChooser";
import ElmTentAlphabet from "./ElmTentAlphabet";
import PostDesignStudio from "./PostDesignStudio";
import CanvasProfilePremium from "./CanvasProfilePremium";

type Profile={display_name?:string|null;username?:string|null;xp_total?:number|null;bio?:string|null};
type DailyPost={id:string;content?:string|null;body?:string|null;text?:string|null;created_at?:string|null};
const destinations=["/profile","/recording-studio/shahadah","/community","/messages","/elm-tent"];
const titles=["My Profile","Record Studio","Daily Posts · Ummah","Messenger","Elm Tent 🏕️"];

function ProfileApp({active}:{active:boolean}){
 const [profile,setProfile]=useState<Profile|null>(null);const [status,setStatus]=useState("Loading your profile…");
 useEffect(()=>{if(!active)return;let alive=true;const db=createClient();(async()=>{
  const {data:{user}}=await db.auth.getUser();if(!alive)return;
  if(!user){setStatus("Sign in to see your profile.");return}
  const {data,error}=await db.from("profiles").select("display_name,username,xp_total,bio").eq("id",user.id).maybeSingle();
  if(!alive)return;if(error){setStatus("Profile is unavailable right now.");return}
  setProfile(data);setStatus(data?"":"Complete your profile to begin.");
 })();return()=>{alive=false}},[active]);
 return <div className="canvas-native-profile">{profile?<><div className="canvas-native-avatar" aria-hidden="true">{(profile.display_name||profile.username||"M").slice(0,1).toUpperCase()}</div><h3>{profile.display_name||profile.username||"Member"}</h3><p>{profile.bio||"Your journey with the Ummah"}</p><strong>✦ {(profile.xp_total||0).toLocaleString()} XP</strong></>:<p role="status">{status}</p>}<Link href="/profile">View profile, badges & settings ↗</Link></div>
}
function RecorderApp({active}:{active:boolean}){
 const [recording,setRecording]=useState(false);const [clip,setClip]=useState<string|null>(null);const [error,setError]=useState("");const recorder=useRef<MediaRecorder|null>(null);const stream=useRef<MediaStream|null>(null);const chunks=useRef<Blob[]>([]);
 useEffect(()=>()=>{if(recorder.current?.state==="recording")recorder.current.stop();stream.current?.getTracks().forEach(t=>t.stop())},[]);
 const toggle=async()=>{
  if(recording){recorder.current?.stop();setRecording(false);return}
  if(!active)return;
  try{setError("");if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==="undefined")throw Error("Recording is not supported in this browser.");
   stream.current=await navigator.mediaDevices.getUserMedia({audio:true});chunks.current=[];
   const r=new MediaRecorder(stream.current);recorder.current=r;
   r.ondataavailable=e=>{if(e.data.size)chunks.current.push(e.data)};
   r.onstop=()=>{setClip(old=>{if(old)URL.revokeObjectURL(old);return URL.createObjectURL(new Blob(chunks.current,{type:r.mimeType||"audio/webm"}))});stream.current?.getTracks().forEach(t=>t.stop());stream.current=null};
   r.start();setRecording(true);
  }catch(e){setError(e instanceof Error?e.message:"Microphone unavailable.")}
 };
 return <div className="canvas-native-recorder"><div className={"canvas-recorder-ring"+(recording?" is-recording":"")}>♫</div><p>{recording?"Recording your voice…":"Record an audio message or reflection."}</p><button type="button" onClick={()=>void toggle()}>{recording?"■ Stop recording":"● Start recording"}</button>{clip&&<><audio controls src={clip}/><a href={clip} download="1muslim-recording.webm">Save recording to device ↓</a></>}{error&&<p role="alert">{error}</p>}<small>Recordings stay on this device until you choose to save them.</small></div>
}
function DailyPostsApp({active}:{active:boolean}){
 const [posts,setPosts]=useState<DailyPost[]>([]);const [status,setStatus]=useState("Loading community posts…");
 useEffect(()=>{if(!active)return;let alive=true;const db=createClient();(async()=>{
  const {data,error}=await db.from("daily_posts").select("id,content,created_at").order("created_at",{ascending:false}).limit(12);
  if(!alive)return;if(error){setStatus("Open the full Ummah feed to browse posts.");return}
  setPosts((data||[]) as DailyPost[]);setStatus(data?.length?"":"No posts to display yet.");
 })();return()=>{alive=false}},[active]);
 return <div className="canvas-native-feed">{posts.length?posts.map(post=><article key={post.id}><p>{post.content||post.body||post.text||"Community post"}</p><small>{post.created_at?new Date(post.created_at).toLocaleDateString():"Ummah"}</small></article>):<p role="status">{status}</p>}<Link href="/community">Open full feed · Like & comment ↗</Link></div>
}
export default function CanvasSecondaryApp({slot,active}:{slot:number;active:boolean}){
 return <div className="canvas-native-app"><header><span>0{slot+6} · 1MUSLIM</span><h2>{titles[slot]}</h2></header><div className="canvas-native-body">
 {slot===0?<CanvasProfilePremium active={active}/>:slot===1?<RecorderApp active={active}/>:slot===2?<DailyPostsApp active={active}/>:slot===3?<HomeMessagesChooser/>:<ElmTentAlphabet/>}
 </div><footer>{slot===2?<PostDesignStudio/>:null}<Link href={destinations[slot]}>Open full experience ↗</Link></footer></div>
}
