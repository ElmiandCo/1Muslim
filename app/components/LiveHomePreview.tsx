"use client";
import {useEffect,useRef,useState} from "react";
import {Room,RoomEvent,Track,VideoQuality} from "livekit-client";

/** Silent, noninteractive thumbnail player: safe to render inside homepage links. */
export default function LiveHomePreview({roomName}:{roomName:string}){
 const video=useRef<HTMLVideoElement>(null);
 const [ready,setReady]=useState(false);
 const [status,setStatus]=useState("Connecting to live…");
 const [attempt,setAttempt]=useState(0);
 useEffect(()=>{
  if(!roomName)return;
  setReady(false);
  setStatus("Connecting to live…");
  let active=true;
  const room=new Room({adaptiveStream:false});
  const attach=(track:any)=>{
   if(!active||track.kind!==Track.Kind.Video||!video.current)return;
   track.attach(video.current);
   setStatus("Starting video…");
   video.current.muted=true;
   void video.current.play().then(()=>{if(active)setReady(true)}).catch(()=>{if(active)setStatus("Tap to start video")});
  };
  room.on(RoomEvent.TrackSubscribed,attach);
  room.on(RoomEvent.ConnectionStateChanged,state=>{if(active&&!ready)setStatus(`LiveKit: ${state}`)});
  room.on(RoomEvent.TrackUnsubscribed,()=>{if(active){setReady(false);setStatus("Broadcaster video disconnected")}});
  void (async()=>{
   try{
    const res=await fetch("/api/livekit/token",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({room:roomName,role:"viewer"})});
    if(!res.ok)throw new Error(res.status===401?"Sign-in required":`Viewer access failed (${res.status})`);
    const data=await res.json();
    if(!active)return;
    if(!data.url||!data.token)throw new Error("Missing token");
    await room.connect(data.url,data.token,{autoSubscribe:true});
    if(active)setStatus("Waiting for broadcaster video…");
    if(!active)return;
    for(const participant of room.remoteParticipants.values())
     for(const publication of participant.trackPublications.values()){
      if(!publication.isSubscribed)await publication.setSubscribed(true);
      if(publication.kind===Track.Kind.Video)publication.setVideoQuality(VideoQuality.HIGH);
      if(publication.track)attach(publication.track);
     }
   }catch(err){if(active){setReady(false);setStatus(err instanceof Error?err.message:"Live connection unavailable")}}
  })();
  return()=>{active=false;room.removeAllListeners();void room.disconnect();if(video.current)video.current.srcObject=null};
 },[roomName,attempt]);
 useEffect(()=>{if(ready)return;const timer=window.setTimeout(()=>setAttempt(n=>n+1),8000);return()=>clearTimeout(timer)},[ready,attempt,roomName]);
 return <span style={{display:"block",position:"relative",width:"100%",height:"100%",minHeight:170,overflow:"hidden",borderRadius:12}}>
  <video ref={video} autoPlay muted playsInline onClick={()=>{void video.current?.play().then(()=>setReady(true)).catch(()=>{})}} aria-label="Live stream preview" style={{display:"block",width:"100%",height:"100%",minHeight:170,objectFit:"cover",background:"transparent",opacity:ready?1:0}}/>
  {!ready&&<span onClick={()=>{void video.current?.play().then(()=>setReady(true)).catch(()=>{})}} style={{position:"absolute",inset:0,display:"grid",placeItems:"center",color:"#e9d9a3",background:"rgba(5,23,17,.65)",fontSize:12}}>{status}</span>}
 </span>;
}
