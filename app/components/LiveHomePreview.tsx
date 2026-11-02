"use client";
import {useEffect,useRef,useState} from "react";
import {Room,RoomEvent,Track,VideoQuality,ConnectionState} from "livekit-client";

/** Silent homepage preview. Keep a healthy room connected while waiting for host video. */
export default function LiveHomePreview({roomName}:{roomName:string}){
 const video=useRef<HTMLVideoElement>(null);
 const [ready,setReady]=useState(false);
 const [failure,setFailure]=useState("");
 const [attempt,setAttempt]=useState(0);

 useEffect(()=>{
  if(!roomName)return;
  let active=true;
  let retryTimer:ReturnType<typeof setTimeout>|undefined;
  const room=new Room({adaptiveStream:true});
  setReady(false);
  setFailure("");
  const scheduleRetry=()=>{
   if(!active||retryTimer)return;
   retryTimer=setTimeout(()=>{retryTimer=undefined;if(active)setAttempt(n=>n+1)},5000);
  };
  const attach=(track:any)=>{
   if(!active||track.kind!==Track.Kind.Video||!video.current)return;
   track.attach(video.current);
   video.current.muted=true;
   void video.current.play().then(()=>{if(active){setReady(true);setFailure("");}}).catch(()=>{
    if(active)setFailure("Tap Open live if playback is blocked");
   });
  };
  const subscribeExisting=()=>{
   for(const participant of room.remoteParticipants.values()){
    for(const publication of participant.trackPublications.values()){
     if(publication.kind!==Track.Kind.Video)continue;
     publication.setVideoQuality(VideoQuality.MEDIUM);
     if(!publication.isSubscribed)publication.setSubscribed(true);
     if(publication.track)attach(publication.track);
    }
   }
  };
  room.on(RoomEvent.TrackSubscribed,attach);
  room.on(RoomEvent.TrackPublished,publication=>{
   if(publication.kind===Track.Kind.Video){
    publication.setVideoQuality(VideoQuality.MEDIUM);
    publication.setSubscribed(true);
   }
  });
  room.on(RoomEvent.ParticipantConnected,subscribeExisting);
  room.on(RoomEvent.Reconnected,subscribeExisting);
  room.on(RoomEvent.TrackUnsubscribed,track=>{
   if(track.kind===Track.Kind.Video&&active)setReady(false);
  });
  room.on(RoomEvent.TrackSubscriptionFailed,()=>{
   if(active){setReady(false);setFailure("Video subscription interrupted");}
  });
  room.on(RoomEvent.Disconnected,()=>{
   if(active){setReady(false);setFailure("Reconnecting to live…");scheduleRetry();}
  });
  void(async()=>{
   try{
    const res=await fetch("/api/livekit/token",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({room:roomName,role:"viewer"})});
    if(!res.ok){const problem=await res.json().catch(()=>({}));throw new Error(problem.error||"Live access unavailable");}
    const data=await res.json();
    if(!active)return;
    if(!data.url||!data.token)throw new Error("Missing token");
    await room.connect(data.url,data.token,{autoSubscribe:true,maxRetries:5,websocketTimeout:20000});
    if(active)subscribeExisting();
   }catch(error){
    if(active){setReady(false);setFailure(error instanceof Error?error.message:"Connection failed");scheduleRetry();}
   }
  })();
  const refresh=()=>{if(active&&document.visibilityState==="visible"&&room.state===ConnectionState.Connected)subscribeExisting();};
  document.addEventListener("visibilitychange",refresh);
  return()=>{
   active=false;
   if(retryTimer)clearTimeout(retryTimer);
   document.removeEventListener("visibilitychange",refresh);
   room.removeAllListeners();
   void room.disconnect();
   if(video.current)video.current.srcObject=null;
  };
 },[roomName,attempt]);

 return <span style={{display:"block",position:"relative",width:"100%",height:"100%",minHeight:0,overflow:"hidden",borderRadius:12}}>
  <video ref={video} autoPlay muted playsInline aria-label="Live stream preview" style={{display:"block",width:"100%",height:"100%",minHeight:0,objectFit:"cover",objectPosition:"center center",background:"transparent",opacity:ready?1:0}}/>
  {!ready&&<span style={{position:"absolute",inset:0,display:"grid",placeItems:"center",color:"#e9d9a3",background:"rgba(5,23,17,.65)",fontSize:12}}>{failure||"Waiting for host video…"}</span>}
 </span>;
}
