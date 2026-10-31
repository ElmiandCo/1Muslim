"use client";
import {useEffect,useRef,useState} from "react";
import {Room,RoomEvent,Track} from "livekit-client";
import {createClient} from "../../utils/supabase/client";

/** Audio tab has its own LiveKit audio stage, independent of the camera preview. */
export default function HomeAudioLivePlayer({roomName,hostId}:{roomName:string;hostId?:string|null}){
 const [host,setHost]=useState<{name:string;avatar:string|null}>({name:"1Muslim Voice Live",avatar:null});
 const [energy,setEnergy]=useState(0);
 const [state,setState]=useState("Connecting to voice live…");
 const [needsTap,setNeedsTap]=useState(false);
 const roomRef=useRef<Room|null>(null);
 const audioRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(!hostId)return;
  let active=true;const db=createClient();
  void db.from("profiles").select("username,display_name,avatar_url").eq("id",hostId).maybeSingle().then(({data})=>{
   if(active&&data)setHost({name:data.display_name||data.username||"1Muslim Voice Live",avatar:data.avatar_url||null});
  });
  return()=>{active=false};
 },[hostId]);
 useEffect(()=>{
  let active=true;
  const room=new Room({adaptiveStream:false});roomRef.current=room;
  const audioNodes=new Map<string,HTMLMediaElement>();
  const attach=(track:any)=>{
   if(!active||track.kind!==Track.Kind.Audio||!audioRef.current)return;
   const element=track.attach() as HTMLMediaElement;
   element.autoplay=true;element.style.display="none";
   audioRef.current.appendChild(element);
   audioNodes.set(track.sid||"",element);
   void element.play().then(()=>{if(active){setNeedsTap(false);setState("Voice Live · Connected")}}).catch(()=>{if(active){setNeedsTap(true);setState("Tap to enable live audio")}});
  };
  room.on(RoomEvent.TrackSubscribed,attach);
  room.on(RoomEvent.TrackUnsubscribed,(track)=>{const node=audioNodes.get(track.sid||"");if(node){track.detach(node);node.remove();audioNodes.delete(track.sid||"")}});
  room.on(RoomEvent.Disconnected,()=>{if(active)setState("Voice Live disconnected")});
  const poll=window.setInterval(()=>{
   if(!active)return;
   const levels=[...room.remoteParticipants.values()].map(p=>p.audioLevel||0);
   setEnergy(Math.min(1,Math.max(0,...levels)*4));
  },80);
  void (async()=>{
   try{
    const res=await fetch("/api/livekit/token",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({room:roomName,role:"viewer"})});
    if(!res.ok)throw Error("Voice Live unavailable");
    const {url,token}=await res.json();
    if(!active)return;
    await room.connect(url,token,{autoSubscribe:true,maxRetries:5,websocketTimeout:20000});
    if(!active)return;
    for(const participant of room.remoteParticipants.values())for(const pub of participant.trackPublications.values()){
     if(pub.kind===Track.Kind.Audio){if(!pub.isSubscribed)pub.setSubscribed(true);if(pub.track)attach(pub.track)}
    }
    setState("Voice Live · Connected");
   }catch{if(active)setState("Unable to connect to Voice Live")}
  })();
  return()=>{active=false;window.clearInterval(poll);for(const node of audioNodes.values())node.remove();audioNodes.clear();room.removeAllListeners();void room.disconnect();roomRef.current=null};
 },[roomName]);
 const enableAudio=()=>{void Promise.all([...audioRef.current?.querySelectorAll("audio")||[]].map(a=>a.play())).then(()=>{setNeedsTap(false);setState("Voice Live · Connected")}).catch(()=>setNeedsTap(true))};
 return <div className="homeVoiceStage" aria-label="Audio-only Live player">
  <style>{`
   .homeVoiceStage{width:100%;height:100%;min-height:0;display:flex;align-items:flex-start;justify-content:center;padding:12px 8px;box-sizing:border-box;overflow:auto;color:#fff}
   .homeVoiceSquare{position:relative;width:min(76vw,330px,38dvh);aspect-ratio:1;border-radius:25px;border:1px solid #c4ffde55;background:radial-gradient(circle at 50% 38%,#215746,#071c1a 75%);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:9px;overflow:hidden;isolation:isolate;box-shadow:0 16px 50px #0008}
   .homeVoiceHalo{position:absolute;width:60%;aspect-ratio:1;border:2px solid #8bffe3a8;border-radius:50%;transform:scale(calc(1 + var(--voice-energy)*.4));box-shadow:0 0 calc(16px + var(--voice-energy)*65px) #64f9c887;transition:transform 80ms,box-shadow 80ms}
   .homeVoicePortrait{z-index:1;width:32%;aspect-ratio:1;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:#102c32;border:2px solid #8af9d5;font-size:38px}
   .homeVoicePortrait img{width:100%;height:100%;object-fit:cover}
   .homeVoiceBars{z-index:1;height:29px;display:flex;align-items:center;gap:3px}.homeVoiceBars i{width:4px;max-height:27px;background:#a2ffdb;border-radius:4px;transition:height 80ms}
   .homeVoiceSquare strong,.homeVoiceSquare small{z-index:1;text-align:center;max-width:92%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.homeVoiceSquare strong{font-size:14px}.homeVoiceSquare small{font-size:10px;color:#c8f4e4}
   .homeVoiceTap{z-index:3;border:1px solid #baffdd;background:#0b5d48;color:#fff;border-radius:18px;padding:8px 12px}
   @media(prefers-reduced-motion:reduce){.homeVoiceHalo,.homeVoiceBars i{transition:none}}
  `}</style>
  <div className="homeVoiceSquare" style={{["--voice-energy" as string]:energy}}>
   <div className="homeVoiceHalo"/><div className="homeVoicePortrait">{host.avatar?<img src={host.avatar} alt="Host avatar"/>:"✧"}</div>
   <div className="homeVoiceBars" aria-hidden="true">{Array.from({length:11},(_,i)=><i key={i} style={{height:Math.min(27,5+(i%5)*2+energy*(9+(i%4)*5))}}/>)}</div>
   <strong>{host.name}</strong><small>{state}</small>
   {needsTap&&<button type="button" className="homeVoiceTap" onClick={enableAudio}>🔊 Enable audio</button>}
  </div><div ref={audioRef} style={{display:"none"}}/>
 </div>;
}
