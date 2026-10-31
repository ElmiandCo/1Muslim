"use client";
import {useEffect,useRef,useState} from "react";
import {Room,RoomEvent,Track,VideoQuality} from "livekit-client";

/** Silent, noninteractive thumbnail player: safe to render inside homepage links. */
export default function LiveHomePreview({roomName}:{roomName:string}){
 const video=useRef<HTMLVideoElement>(null);
 const [ready,setReady]=useState(false);
 const [failure,setFailure]=useState("");
 const [attempt,setAttempt]=useState(0);
 
 useEffect(()=>{
  if(!roomName)return;
  setReady(false);
  setFailure("");
  let active=true;
  const room=new Room({adaptiveStream:false});
  let waitingTimer:ReturnType<typeof setTimeout>|undefined;
  let retryTimer:ReturnType<typeof setTimeout>|undefined;
  const attach=(track:any)=>{
   if(!active||track.kind!==Track.Kind.Video||!video.current)return;
   track.attach(video.current);
   video.current.muted=true;
   void video.current.play().then(()=>{if(active)setReady(true)}).catch(()=>{});
  };
  room.on(RoomEvent.TrackSubscribed,attach);
  room.on(RoomEvent.TrackPublished,publication=>{if(publication.kind===Track.Kind.Video)publication.setSubscribed(true)});
  room.on(RoomEvent.TrackSubscriptionFailed,()=>{if(active)setFailure("Video subscription interrupted");});
  room.on(RoomEvent.ParticipantConnected,participant=>{for(const publication of participant.trackPublications.values())if(publication.kind===Track.Kind.Video){publication.setSubscribed(true);publication.setVideoQuality(VideoQuality.HIGH)}});
  room.on(RoomEvent.TrackPublished,publication=>{if(publication.kind===Track.Kind.Video){publication.setSubscribed(true);publication.setVideoQuality(VideoQuality.HIGH)}});
  room.on(RoomEvent.TrackUnsubscribed,()=>{if(active)setReady(false)});
  void (async()=>{
   try{
    const res=await fetch("/api/livekit/token",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({room:roomName,role:"viewer"})});
    if(!res.ok){const problem=await res.json().catch(()=>({}));throw new Error(problem.error||"Live access unavailable");}
    const data=await res.json();
    if(!active)return;
    if(!data.url||!data.token)throw new Error("Missing token");
    await room.connect(data.url,data.token,{autoSubscribe:true,maxRetries:5,websocketTimeout:20000});
    if(!active)return;
    for(const participant of room.remoteParticipants.values())
     for(const publication of participant.trackPublications.values()){
      if(!publication.isSubscribed)publication.setSubscribed(true);
      if(publication.kind===Track.Kind.Video)publication.setVideoQuality(VideoQuality.HIGH);
      if(publication.track)attach(publication.track);
     }
   }catch(error){if(active){setReady(false);setFailure(error instanceof Error?error.message:"Connection failed");retryTimer=setTimeout(()=>{if(active)setAttempt(n=>n+1)},5000)}}
  })();
  waitingTimer=setTimeout(()=>{if(active&&!video.current?.srcObject)setAttempt(n=>n+1)},4000);
  return()=>{active=false;if(waitingTimer)clearTimeout(waitingTimer);if(retryTimer)clearTimeout(retryTimer);room.removeAllListeners();void room.disconnect();if(video.current)video.current.srcObject=null};
 },[roomName,attempt]);
 useEffect(()=>{const refresh=()=>{if(document.visibilityState==="visible"){setAttempt(n=>n+1)}};document.addEventListener("visibilitychange",refresh);window.addEventListener("focus",refresh);return()=>{document.removeEventListener("visibilitychange",refresh);window.removeEventListener("focus",refresh)}},[]);
 // Do not tear down a healthy LiveKit room just because the host has not published video.
 return <span style={{display:"block",position:"relative",width:"100%",height:"100%",minHeight:0,overflow:"hidden",borderRadius:12}}>
  <video ref={video} autoPlay muted playsInline aria-label="Live stream preview" style={{display:"block",width:"100%",height:"100%",minHeight:0,objectFit:"cover",objectPosition:"center center",background:"transparent",opacity:ready?1:0}}/>
  {!ready&&<span style={{position:"absolute",inset:0,display:"grid",placeItems:"center",color:"#e9d9a3",background:"rgba(5,23,17,.65)",fontSize:12}}>{failure?"Video unavailable · Open live to retry":"Waiting for host video…"}</span>}
 </span>;
}
