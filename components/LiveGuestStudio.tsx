"use client";
import {useEffect,useRef,useState} from "react";
import {Room,Track} from "livekit-client";
import {createClient} from "../utils/supabase/client";
type Request={id:string;user_id:string;status:string;mode:string};
export default function LiveGuestStudio({streamId,roomName,hostId}:{streamId:string;roomName:string;hostId:string}){
 const [uid,setUid]=useState<string|null>(null),[requests,setRequests]=useState<Request[]>([]),[mode,setMode]=useState<"pfp"|"camera">("pfp"),[joined,setJoined]=useState(false),[error,setError]=useState("");
 const [mic,setMic]=useState(true),[camera,setCamera]=useState(true),[background,setBackground]=useState("none");
 const room=useRef<Room|null>(null),preview=useRef<HTMLVideoElement>(null),stream=useRef<MediaStream|null>(null);
 const me=requests.find(r=>r.user_id===uid);
 const host=uid===hostId;
 useEffect(()=>{let active=true;const db=createClient();void db.auth.getUser().then(({data})=>{if(active)setUid(data.user?.id??null)});
 const load=async()=>{const {data}=await db.from("live_guest_requests").select("id,user_id,status,mode").eq("stream_id",streamId);if(active)setRequests(data??[])};
 void load();const timer=setInterval(()=>void load(),2500);return()=>{active=false;clearInterval(timer)}},[streamId]);
 useEffect(()=>()=>{room.current?.disconnect();stream.current?.getTracks().forEach(t=>t.stop())},[]);
 async function request(){setError("");const {error}=await createClient().rpc("request_live_guest",{p_stream:streamId,p_mode:mode});if(error)setError(error.message)}
 async function moderate(id:string,status:string){const {error}=await createClient().rpc("moderate_live_guest",{p_request:id,p_status:status});if(error)setError(error.message)}
 async function join(){try{
  setError("");const response=await fetch("/api/livekit/token",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({room:roomName,role:"guest"})});
  const data=await response.json();if(!response.ok)throw Error(data.error||"Guest connection failed");
  const r=new Room();await r.connect(data.url,data.token);room.current=r;
  const media=await navigator.mediaDevices.getUserMedia({audio:true,video:mode==="camera"});stream.current=media;
  for(const track of media.getAudioTracks())await r.localParticipant.publishTrack(track);
  if(mode==="camera"){for(const track of media.getVideoTracks())await r.localParticipant.publishTrack(track);if(preview.current){preview.current.srcObject=media;void preview.current.play().catch(()=>{})}}
  setJoined(true);
 }catch(e){setError(e instanceof Error?e.message:"Unable to join");room.current?.disconnect();room.current=null;stream.current?.getTracks().forEach(t=>t.stop())}}
 async function toggleMic(){const next=!mic;stream.current?.getAudioTracks().forEach(t=>t.enabled=next);setMic(next)}
 async function toggleCamera(){const next=!camera;stream.current?.getVideoTracks().forEach(t=>t.enabled=next);setCamera(next)}
 function leave(){room.current?.disconnect();room.current=null;stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;setJoined(false)}
 if(!uid)return null;
 return <section style={{padding:16,border:"1px solid #48624b",borderRadius:16,marginTop:16,background:"#101a13",color:"#e7f5e6"}}>
 <h3 style={{margin:"0 0 8px"}}>🎙️ 1Muslim Guest Studio</h3><p style={{fontSize:12,opacity:.8}}>Host + four guests. Choose audio with your profile picture or camera and microphone.</p>
 {host?<div><strong>👑 Guest requests</strong>{requests.filter(r=>r.status==="pending").map(r=><div key={r.id} style={{display:"flex",gap:8,alignItems:"center",marginTop:8}}><span>{r.user_id.slice(0,8)} · {r.mode}</span><button onClick={()=>void moderate(r.id,"approved")}>Approve</button><button onClick={()=>void moderate(r.id,"rejected")}>Decline</button></div>)}{requests.filter(r=>r.status==="approved").map(r=><div key={r.id} style={{marginTop:8}}>🎤 {r.user_id.slice(0,8)} <button onClick={()=>void moderate(r.id,"removed")}>Remove</button></div>)}</div>:<div>
 {!joined&&me?.status!=="approved"&&<><select aria-label="Guest mode" value={mode} onChange={e=>setMode(e.target.value as "pfp"|"camera")}><option value="pfp">🎙️ Audio + profile picture</option><option value="camera">📹 Camera + audio</option></select> <button onClick={()=>void request()}>Request to join</button></>}
 {me?.status==="pending"&&<p>⏳ Waiting for host approval…</p>}
 {me?.status==="approved"&&!joined&&<button onClick={()=>void join()}>🎥 Join stage</button>}
 {joined&&<div><p>🔴 You're on stage</p>{mode==="camera"&&<div style={{position:"relative",maxWidth:250}}><video ref={preview} muted autoPlay playsInline style={{width:"100%",borderRadius:12,filter:background==="blur"?"blur(4px)":"none"}}/><span style={{fontSize:11}}>Preview effects (local only)</span></div>}<button onClick={()=>void toggleMic()}>{mic?"Mute mic":"Unmute mic"}</button> {mode==="camera"&&<button onClick={()=>void toggleCamera()}>{camera?"Camera off":"Camera on"}</button>} <button onClick={leave}>Leave stage</button><label style={{display:"block",marginTop:8}}>Background preview <select value={background} onChange={e=>setBackground(e.target.value)}><option value="none">Normal</option><option value="blur">Blur preview</option></select></label></div>}
 </div>}
 {error&&<p role="alert" style={{color:"#ffb5b5"}}>{error}</p>}
 </section>
}
