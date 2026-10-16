"use client";
import {useEffect,useRef,useState} from "react";
import {Room,RoomEvent,Track} from "livekit-client";

/** Silent, noninteractive thumbnail player: safe to render inside homepage links. */
export default function LiveHomePreview({roomName}:{roomName:string}){
 const video=useRef<HTMLVideoElement>(null);
 const [ready,setReady]=useState(false);
 useEffect(()=>{
  if(!roomName)return;
  let active=true;
  const room=new Room({adaptiveStream:true});
  const attach=(track:any)=>{
   if(!active||track.kind!==Track.Kind.Video||!video.current)return;
   track.attach(video.current);
   video.current.muted=true;
   void video.current.play().then(()=>{if(active)setReady(true)}).catch(()=>{});
  };
  room.on(RoomEvent.TrackSubscribed,attach);
  void (async()=>{
   try{
    const res=await fetch("/api/livekit/token",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({room:roomName,role:"viewer"})});
    if(!res.ok)return;
    const data=await res.json();
    if(!active||!data.url||!data.token)return;
    await room.connect(data.url,data.token,{autoSubscribe:true});
    if(!active)return;
    for(const participant of room.remoteParticipants.values())
     for(const publication of participant.trackPublications.values()){
      if(!publication.isSubscribed)await publication.setSubscribed(true);
      if(publication.track)attach(publication.track);
     }
   }catch{/* Keep the existing thumbnail fallback. */}
  })();
  return()=>{active=false;room.removeAllListeners();void room.disconnect();if(video.current)video.current.srcObject=null};
 },[roomName]);
 return <span style={{display:"block",position:"relative",width:"100%",height:"100%",minHeight:170,overflow:"hidden",borderRadius:12}}>
  <video ref={video} autoPlay muted playsInline aria-label="Live stream preview" style={{display:"block",width:"100%",height:"100%",minHeight:170,objectFit:"cover",background:"transparent",opacity:ready?1:0}}/>
  {!ready&&<span style={{position:"absolute",inset:0,display:"grid",placeItems:"center",color:"#e9d9a3",background:"rgba(5,23,17,.65)",fontSize:12}}>Connecting to live…</span>}
 </span>;
}
