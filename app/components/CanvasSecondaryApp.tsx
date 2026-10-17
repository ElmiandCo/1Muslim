"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {createClient} from "../../utils/supabase/client";
import HomeMessagesChooser from "./HomeMessagesChooser";
import ElmTentAlphabet from "./ElmTentAlphabet";
import PostDesignStudio from "./PostDesignStudio";
import "./canvas-ummah-feed.css";

type Profile={display_name?:string|null;username?:string|null;xp_total?:number|null;bio?:string|null};
type DailyPost={id:string;content?:string|null;body?:string|null;text?:string|null;created_at?:string|null};
const destinations=["/profile","/recording-studio/shahadah","/community","/messages","/elm-tent"];
const titles=["Friends · Community Map","Record Studio","Daily Posts · Ummah","Messenger","Elm Tent 🏕️"];

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
type UmmahPost={id:string;body:string;created_at:string;author_name:string;author_handle:string;author_id?:string};
type UmmahComment={id:string;post_id:string;name:string;body:string;created_at:string};
function DailyPostsApp({active}:{active:boolean}){
 const [posts,setPosts]=useState<UmmahPost[]>([]);
 const [status,setStatus]=useState("Loading Ummah posts…");
 const [selected,setSelected]=useState<string|null>(null);
 const [comments,setComments]=useState<UmmahComment[]>([]);
 const [draft,setDraft]=useState("");
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState("");
 const feedRef=useRef<HTMLDivElement|null>(null);
 useEffect(()=>{if(!active)return;let alive=true;
  const load=async()=>{try{const r=await fetch("/api/community-posts",{cache:"no-store"});if(!r.ok)throw Error();const data=await r.json();if(alive){setPosts(data.posts||[]);setStatus(data.posts?.length?"":"No posts yet. Be the first to share.");}}catch{if(alive)setStatus("Unable to load the Ummah feed.");}};
  void load();const timer=setInterval(()=>void load(),30000);return()=>{alive=false;clearInterval(timer)};
 },[active]);
 useEffect(()=>{if(!active)return;const root=feedRef.current;if(!root)return;
  const observer=new IntersectionObserver(entries=>{for(const entry of entries)entry.target.classList.toggle("ummah-in-view",entry.isIntersecting)},{root,threshold:.12,rootMargin:"0px 0px -8% 0px"});
  root.querySelectorAll(".ummah-floating-pair").forEach(el=>observer.observe(el));
  return()=>observer.disconnect();
 },[active,posts]);
 useEffect(()=>{if(!selected)return;let alive=true;const load=async()=>{try{const r=await fetch("/api/ummah-comments?postId="+encodeURIComponent(selected),{cache:"no-store"});const d=await r.json();if(alive)setComments(d.comments||[])}catch{if(alive)setNotice("Comments unavailable.")}};void load();return()=>{alive=false}},[selected]);
 const send=async(e:React.FormEvent)=>{e.preventDefault();if(!selected||!draft.trim()||busy)return;setBusy(true);setNotice("");try{
  const r=await fetch("/api/ummah-comments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({postId:selected,body:draft.trim()})});
  const d=await r.json();if(!r.ok)throw Error(d.error||"Unable to comment");
  setComments(previous=>[...previous,d.comment]);setDraft("");
 }catch(e){setNotice(e instanceof Error?e.message:"Unable to comment")}finally{setBusy(false)}};
 return <div className="ummah-canvas-shell">
  <div className="ummah-floating-feed" ref={feedRef} aria-label="Community posts">
   {posts.length?posts.map((post,i)=><div className="ummah-floating-pair" key={post.id} style={{["--ummah-tilt" as string]:(i%2===0?"-3deg":"3deg")}}>
    <button type="button" className="ummah-floating-post" onClick={()=>{setSelected(post.id);setComments([]);setNotice("")}} aria-label={"Open comments on post by "+post.author_name}>
     <span className="ummah-post-glow" aria-hidden="true"/>
     <span className="ummah-post-body">{post.body}</span>
     <span className="ummah-post-bottom"><span>✦ Ummah</span><span>{new Date(post.created_at).toLocaleDateString()}</span><span>Comments ↗</span></span>
    </button>
    <div className="ummah-floating-author" aria-label={"Posted by "+post.author_name}>
     <span className="ummah-floating-avatar" aria-hidden="true">{(post.author_name||"M").charAt(0).toUpperCase()}</span>
     <span className="ummah-floating-author-name">{post.author_name}</span>
    </div>
   </div>):<p className="ummah-feed-status" role="status">{status}</p>}
  </div>
  {selected&&<div className="ummah-comments-backdrop" role="presentation" onClick={()=>setSelected(null)}>
   <section className="ummah-comments-sheet" role="dialog" aria-modal="true" aria-label="Post comments" onClick={e=>e.stopPropagation()}>
    <header><strong>✦ Conversation</strong><button type="button" onClick={()=>setSelected(null)} aria-label="Close comments">✕</button></header>
    <p className="ummah-comment-post-preview">{posts.find(p=>p.id===selected)?.body}</p>
    <div className="ummah-comments-list">{comments.length?comments.map(c=><article key={c.id}><strong>{c.name}</strong><p>{c.body}</p></article>):<p>Be the first to comment.</p>}</div>
    <form onSubmit={e=>void send(e)}><input aria-label="Write a comment" value={draft} onChange={e=>setDraft(e.target.value)} maxLength={1500} placeholder="Write a thoughtful comment…"/><button type="submit" disabled={busy||!draft.trim()}>Send ↗</button></form>
    {notice&&<p role="alert">{notice}</p>}
   </section>
  </div>}
 </div>;
}
function CommunityMap({active}:{active:boolean}){
 const [tab,setTab]=useState<"map"|"profile">("map");
 const [zoom,setZoom]=useState(0);
 const [search,setSearch]=useState("");
 
 const bounds=[[-125,24,-66,50],[-111,29,-79,47],[-104,32,-85,45],[-99,35,-90,43],[-96,37,-92,41]] as const;
 const bbox=bounds[zoom];
 const url="https://www.openstreetmap.org/export/embed.html?bbox="+encodeURIComponent(bbox.join(","))+"&layer=mapnik";
 return <div className="canvas-community-map-shell">
  <div className="canvas-community-tabs" role="tablist" aria-label="Canvas six views"><button type="button" role="tab" aria-selected={tab==="map"} onClick={()=>setTab("map")}>🌎 Community Map</button><button type="button" role="tab" aria-selected={tab==="profile"} onClick={()=>setTab("profile")}>My Profile</button></div>
  {tab==="profile"?<ProfileApp active={active}/>:<div className="canvas-community-map-panel">
   <div className="canvas-community-map-heading"><strong>Discover your Ummah</strong><span>United States · Mosque and community markers coming next</span></div>
   <form className="canvas-community-map-search" onSubmit={e=>e.preventDefault()}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search city (coming next)" aria-label="Search for a city" disabled title="City search will be connected with mosque data in the next phase"/><button type="submit" disabled title="City search is not connected yet">Search</button></form>
   <div className="canvas-community-map-frame"><iframe title="Interactive map of the United States" loading="lazy" src={url} referrerPolicy="no-referrer-when-downgrade" allowFullScreen={false}/><div className="canvas-community-map-zoom"><button type="button" onClick={()=>setZoom(v=>Math.min(4,v+1))} disabled={zoom===4} aria-label="Zoom in">+</button><button type="button" onClick={()=>setZoom(v=>Math.max(0,v-1))} disabled={zoom===0} aria-label="Zoom out">−</button><button type="button" onClick={()=>setZoom(0)} aria-label="Reset map to United States">⌂</button></div></div>
   <p className="canvas-community-map-caption">Drag the map to explore. Pinch to zoom on supported devices. No mosque or member locations are displayed yet.</p>
  </div>}
 </div>;
}
export default function CanvasSecondaryApp({slot,active}:{slot:number;active:boolean}){
 return <div className="canvas-native-app"><header><span>0{slot+6} · 1MUSLIM</span><h2>{titles[slot]}</h2></header><div className="canvas-native-body">
 {slot===0?<CommunityMap active={active}/>:slot===1?<RecorderApp active={active}/>:slot===2?<DailyPostsApp active={active}/>:slot===3?<HomeMessagesChooser/>:<ElmTentAlphabet/>}
 </div><footer><Link href={destinations[slot]}>Open full experience ↗</Link></footer></div>
}
