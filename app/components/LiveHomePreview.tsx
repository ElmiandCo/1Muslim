"use client";
import {useEffect,useRef,useState} from "react";
import {Room,RoomEvent,Track,VideoQuality} from "livekit-client";

/** Silent, noninteractive thumbnail player: safe to render inside homepage links. */
export default function LiveHomePreview({roomName}:{roomName:string}){
 const video=useRef<HTMLVideoElement>(null);
 const [ready,setReady]=useState(false);
 const [failure,setFailure]=useState("");
 const [connectionState,setConnectionState]=useState<"connecting"|"waiting"|"reconnecting">("connecting");
 const [attempt,setAttempt]=useState(0);
 useEffect(()=>{
  if(!roomName)return;
  setReady(false);
  setFailure("");
  setConnectionState("connecting");
  let active=true;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  const scheduleRetry=()=>{
   if(!active||retryTimer)return;
   const delay=Math.min(30000,2000*2**Math.min(attempt,4));
   retryTimer=window.setTimeout(()=>{retryTimer=undefined;if(active)setAttempt(n=>n+1)},delay);
  };
  const room=new Room({adaptiveStream:false});
  let attachedTrack:any=null;
  const attach=(track:any)=>{
   if(!active||track.kind!==Track.Kind.Video||!video.current)return;
   if(attachedTrack===track)return;
   if(attachedTrack)attachedTrack.detach(video.current);
   attachedTrack=track;
   track.attach(video.current);
   video.current.muted=true;
   void video.current.play().then(()=>{if(active)setReady(true)}).catch(()=>{});
  };
  room.on(RoomEvent.TrackSubscribed,attach);
  room.on(RoomEvent.TrackUnsubscribed,(track)=>{
   if(track!==attachedTrack)return;
   if(video.current)track.detach(video.current);
   attachedTrack=null;
   if(active){setReady(false);setConnectionState("waiting")}
  });
  room.on(RoomEvent.Reconnecting,()=>{if(active){setConnectionState("reconnecting");setFailure("")}});
  room.on(RoomEvent.Reconnected,()=>{if(active){setConnectionState("waiting");setFailure("")}});
  room.on(RoomEvent.Disconnected,()=>{if(active){setReady(false);setFailure("Live connection dropped");scheduleRetry()}});
  void (async()=>{
   try{
    const res=await fetch("/api/livekit/token",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({room:roomName,role:"viewer"})});
    if(!res.ok){const problem=await res.json().catch(()=>({}));throw new Error(problem.error||"Live access unavailable");}
    const data=await res.json();
    if(!active)return;
    if(!data.url||!data.token)throw new Error("Missing token");
    await room.connect(data.url,data.token,{autoSubscribe:true,maxRetries:3});
    if(!active)return;
    setConnectionState("waiting");
    for(const participant of room.remoteParticipants.values())
     for(const publication of participant.trackPublications.values()){
      if(!publication.isSubscribed)await publication.setSubscribed(true);
      if(publication.kind===Track.Kind.Video)publication.setVideoQuality(VideoQuality.HIGH);
      if(publication.track)attach(publication.track);
     }
   }catch(error){if(active){setReady(false);setFailure(error instanceof Error?error.message:"Connection failed");scheduleRetry()}}
  })();
  return()=>{active=false;if(retryTimer)window.clearTimeout(retryTimer);room.removeAllListeners();void room.disconnect();if(attachedTrack&&video.current)attachedTrack.detach(video.current);if(video.current)video.current.srcObject=null};
 },[roomName,attempt]);
 return <span style={{display:"block",position:"relative",width:"100%",height:"100%",minHeight:170,overflow:"hidden",borderRadius:12}}>
  <video ref={video} autoPlay muted playsInline aria-label="Live stream preview" style={{display:"block",width:"100%",height:"100%",minHeight:170,objectFit:"cover",background:"transparent",opacity:ready?1:0}}/>
  {!ready&&<span style={{position:"absolute",inset:0,display:"grid",placeItems:"center",color:"#e9d9a3",background:"rgba(5,23,17,.65)",fontSize:12}}>{failure?`${failure} · retrying…`:connectionState==="waiting"?"Waiting for host video…":connectionState==="reconnecting"?"Reconnecting to live…":"Connecting to live…"}</span>}
 </span>;
}
