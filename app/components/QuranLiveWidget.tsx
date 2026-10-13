"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {Room,Track} from "livekit-client";
import {createClient} from "../../utils/supabase/client";

type FloatComment={id:string;body:string;lane:number;time:number};
const LANES=5;
export default function QuranLiveWidget({compact=false}:{compact?:boolean}){
 const [active,setActive]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [streamId,setStreamId]=useState(""),[viewers,setViewers]=useState(0),[taps,setTaps]=useState(0),[seconds,setSeconds]=useState(0);
 const [comments,setComments]=useState<FloatComment[]>([]),[minimized,setMinimized]=useState(false);
 const [position,setPosition]=useState<{x:number;y:number}|null>(null);
 const roomRef=useRef<Room|null>(null),mediaRef=useRef<MediaStream|null>(null),videoRef=useRef<HTMLVideoElement|null>(null);
 const started=useRef(0),idRef=useRef(""),lanes=useRef<number[]>(Array(LANES).fill(0));
 const drag=useRef<{x:number;y:number;px:number;py:number}|null>(null);
 const addComment=useCallback((id:string,body:string)=>{
   if(!body.trim())return;
   const now=Date.now();const free=lanes.current.map((t,i)=>({i,t})).sort((a,b)=>a.t-b.t)[0].i;
   lanes.current[free]=now+3400;
   setComments(old=>[...old.filter(c=>now-c.time<13000),{id,body:body.slice(0,130),lane:free,time:now}].slice(-12));
   window.setTimeout(()=>setComments(old=>old.filter(c=>c.id!==id)),12500);
 },[]);
 const stop=useCallback(async()=>{
   const id=idRef.current;idRef.current="";setActive(false);setStreamId("");setComments([]);setViewers(0);setTaps(0);setSeconds(0);
   roomRef.current?.disconnect();roomRef.current=null;
   mediaRef.current?.getTracks().forEach(t=>t.stop());mediaRef.current=null;
   if(id)await createClient().from("live_streams").update({status:"ended",ended_at:new Date().toISOString()}).eq("id",id);
 },[]);
 useEffect(()=>()=>{roomRef.current?.disconnect();mediaRef.current?.getTracks().forEach(t=>t.stop());const id=idRef.current;if(id)void createClient().from("live_streams").update({status:"ended",ended_at:new Date().toISOString()}).eq("id",id)},[]);
 useEffect(()=>{if(active&&videoRef.current&&mediaRef.current){videoRef.current.srcObject=mediaRef.current;void videoRef.current.play().catch(()=>{})}},[active,minimized]);
 useEffect(()=>{if(!active||!streamId)return;
   const db=createClient();
   const channel=db.channel("quran-live-overlay-"+streamId).on("postgres_changes",{event:"INSERT",schema:"public",table:"live_chat_messages",filter:"stream_id=eq."+streamId},payload=>{
     const m=payload.new as {id:string;body:string};addComment(m.id,m.body);
   }).subscribe();
   const refresh=async()=>{
     try{
       const response=await fetch("/api/livekit/viewer-count",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({room:"1muslim-live-"+streamId})});
       if(response.ok){const data=await response.json();setViewers(Number(data.viewerCount)||0)}
     }catch{}
     const {data}=await db.from("live_streams").select("tap_count").eq("id",streamId).maybeSingle();
     if(data&&typeof data.tap_count==="number")setTaps(data.tap_count);
   };
   void refresh();const poll=window.setInterval(()=>void refresh(),12000);
   const clock=window.setInterval(()=>setSeconds(Math.floor((Date.now()-started.current)/1000)),1000);
   const beat=window.setInterval(()=>{void db.from("live_streams").update({last_heartbeat_at:new Date().toISOString()}).eq("id",streamId).eq("status","live")},30000);
   return()=>{void db.removeChannel(channel);window.clearInterval(poll);window.clearInterval(clock);window.clearInterval(beat)};
 },[active,streamId,addComment]);
 const start=async()=>{
   if(busy||active)return;setBusy(true);setError("");
   let stream:MediaStream|null=null,room:Room|null=null,id="";
   try{
     const db=createClient();const {data:{user}}=await db.auth.getUser();
     if(!user)throw Error("Sign in to start a Qur’an Live.");
     if(!navigator.mediaDevices?.getUserMedia)throw Error("Camera and microphone are unavailable.");
     stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user",width:{ideal:640},height:{ideal:480}},audio:true});
     const {data:profile}=await db.from("profiles").select("display_name").eq("id",user.id).maybeSingle();
     id=crypto.randomUUID();const roomName="1muslim-live-"+id;
     const {error:insertError}=await db.from("live_streams").insert({id,host_id:user.id,title:(profile?.display_name||"1Muslim")+" · Qur’an Reading",category:"Qur'an",visibility:"public",room_name:roomName,status:"live",last_heartbeat_at:new Date().toISOString(),aspect_ratio:"9:16",video_width:720,video_height:1280});
     if(insertError)throw insertError;
     const response=await fetch("/api/livekit/token",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({room:roomName,role:"host"})});
     const token=await response.json();if(!response.ok)throw Error(token.error||"Unable to connect to Live.");
     room=new Room({adaptiveStream:true,dynacast:true});await room.connect(token.url,token.token);
     const video=stream.getVideoTracks()[0],audio=stream.getAudioTracks()[0];
     if(video)await room.localParticipant.publishTrack(video,{source:Track.Source.Camera,simulcast:true});
     if(audio)await room.localParticipant.publishTrack(audio,{source:Track.Source.Microphone});
     mediaRef.current=stream;roomRef.current=room;idRef.current=id;started.current=Date.now();
     setStreamId(id);setSeconds(0);setActive(true);setMinimized(false);
     void fetch("/api/live-alert",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({streamId:id})}).catch(()=>{});
   }catch(e){
     room?.disconnect();stream?.getTracks().forEach(t=>t.stop());
     if(id)void createClient().from("live_streams").update({status:"ended",ended_at:new Date().toISOString()}).eq("id",id);
     setError(e instanceof Error?e.message:"Unable to start Live.");
   }finally{setBusy(false)}
 };
 const onPointerDown=(e:React.PointerEvent<HTMLDivElement>)=>{
   if((e.target as HTMLElement).closest("button"))return;
   const rect=e.currentTarget.getBoundingClientRect();drag.current={x:e.clientX,y:e.clientY,px:rect.left,py:rect.top};e.currentTarget.setPointerCapture(e.pointerId);
 };
 const onPointerMove=(e:React.PointerEvent<HTMLDivElement>)=>{
   if(!drag.current)return;const d=drag.current;
   setPosition({x:Math.max(8,Math.min(window.innerWidth-130,d.px+e.clientX-d.x)),y:Math.max(8,Math.min(window.innerHeight-145,d.py+e.clientY-d.y))});
 };
 const timer=`${String(Math.floor(seconds/3600)).padStart(2,"0")}:${String(Math.floor(seconds%3600/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`;
 return <div className={"quran-live-widget quran-live-overlay"+(compact?" is-compact":"")}>
 {!active?<div className="quran-live-idle"><button type="button" className="quran-live-trigger" onClick={()=>void start()} disabled={busy}><span>●</span>{busy?"Starting Live…":"Go Live · Qur’an"}</button>{error&&<small role="alert" className="quran-live-error">{error}</small>}</div>:<>
 <div className="quran-live-floating" style={position?{left:position.x,top:position.y,right:"auto",bottom:"auto"}:undefined} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={()=>drag.current=null} onPointerCancel={()=>drag.current=null}>
 <div className="quran-live-crown"><strong>● QUR’AN LIVE</strong><button type="button" onClick={()=>setMinimized(v=>!v)} aria-label={minimized?"Expand camera":"Minimize camera"}>{minimized?"▢":"−"}</button></div>
 <video ref={videoRef} autoPlay playsInline muted className={"quran-live-camera"+(minimized?" quran-live-camera-small":"")}/>
 <div className="quran-live-stats"><span>◉ {viewers}</span><span>◷ {timer}</span><span>♥ {taps}</span></div>
 <button className="quran-live-end" type="button" onClick={()=>void stop()}>End Live</button>
 </div>
 <div className="quran-live-comment-field" aria-live="off" aria-label="Live comments">{comments.map(c=><div key={c.id} className="quran-live-float-comment" style={{left:`${5+c.lane*18}%`}}>{c.body}</div>)}</div>
 </>}
 </div>;
}
