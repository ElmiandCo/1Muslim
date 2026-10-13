"use client";
import {useEffect,useRef,useState} from "react";
import {Room,RoomEvent,Track} from "livekit-client";

export default function HomeLivePreview({roomName,poster}:{roomName:string;poster?:string|null}){
 const videoRef=useRef<HTMLVideoElement>(null);
 const [playing,setPlaying]=useState(false);
 useEffect(()=>{
  let active=true;let room:Room|null=null;
  const connect=async()=>{
   try{
    const response=await fetch("/api/livekit/token",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({room:roomName,role:"viewer"})});
    if(!response.ok)return;
    const data=await response.json();
    if(!active||!data.url||!data.token)return;
    room=new Room({adaptiveStream:true,dynacast:true});
    const attach=(track:any)=>{if(!active||track.kind!==Track.Kind.Video||!videoRef.current)return;track.attach(videoRef.current);videoRef.current.muted=true;void videoRef.current.play().then(()=>{if(active)setPlaying(true)}).catch(()=>{});};
    room.on(RoomEvent.TrackSubscribed,attach);
    room.on(RoomEvent.TrackUnsubscribed,(track)=>{if(track.kind===Track.Kind.Video){track.detach().forEach(el=>el.remove());if(active)setPlaying(false)}});
    await room.connect(data.url,data.token,{autoSubscribe:true});
    if(!active)return;
    for(const p of room.remoteParticipants.values())for(const pub of p.videoTrackPublications.values()){if(!pub.isSubscribed)await pub.setSubscribed(true);if(pub.track)attach(pub.track)}
   }catch{/* Show poster when preview is unavailable. */}
  };
  void connect();
  return()=>{active=false;setPlaying(false);if(room)void room.disconnect()};
 },[roomName]);
 return <span style={{position:"absolute",inset:0,display:"block",background:"#061a14"}}>
  {poster&&!playing?<img src={poster} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:null}
  <video ref={videoRef} autoPlay muted playsInline aria-label="Muted live video preview" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:playing?1:0}}/>
  <span style={{position:"absolute",top:7,left:7,background:"#b82e3b",color:"white",borderRadius:6,padding:"3px 7px",fontSize:9,fontWeight:800}}>● LIVE</span>
 </span>;
}
