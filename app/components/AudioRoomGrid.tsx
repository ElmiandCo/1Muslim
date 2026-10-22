"use client";

import {useCallback,useEffect,useState} from "react";
import {RoomEvent} from "livekit-client";
import type {Room,Participant} from "livekit-client";
import styles from "./AudioRoomGrid.module.css";

/**
 * Audio-only LiveKit group room UI. The game/voice owner creates and authorizes
 * the Room, and owns its lifecycle. This component never connects a microphone
 * or joins a room without the user's explicit action elsewhere.
 *
 * Integration: <AudioRoomGrid room={activeRoom} onLeave={leaveAudioRoom} />
 */
export type AudioRoomGridProps={
 room:Room|null;
 onLeave:()=>void|Promise<void>;
 initialMinimized?:boolean;
};

type Member={
 id:string;
 name:string;
 local:boolean;
 speaking:boolean;
 muted:boolean;
 avatar:string|null;
};

function safeAvatar(participant:Participant):string|null{
 try{
  if(!participant.metadata)return null;
  const data=JSON.parse(participant.metadata) as Record<string,unknown>;
  const raw=data.avatar_url??data.avatarUrl??data.avatar;
  if(typeof raw!=="string")return null;
  if(raw.startsWith("/")&&!raw.startsWith("//"))return raw;
  const url=new URL(raw);
  return url.protocol==="https:"?url.href:null;
 }catch{return null}
}
function snapshot(room:Room):Member[]{
 const people:Participant[]=[room.localParticipant,...room.remoteParticipants.values()];
 return people.map((p,i)=>({
  id:p.identity||"member-"+i,
  name:(p.name|| (p===room.localParticipant?"You":"Explorer")).trim().slice(0,40)||"Explorer",
  local:p===room.localParticipant,
  speaking:p.isSpeaking,
  muted:!p.isMicrophoneEnabled,
  avatar:safeAvatar(p)
 })).sort((a,b)=>Number(b.local)-Number(a.local));
}
function initials(name:string){
 const parts=name.trim().split(/\s+/).filter(Boolean);
 return (parts.length>1?parts[0][0]+parts[parts.length-1][0]:name.slice(0,2)).toLocaleUpperCase();
}
function avatarTone(id:string){
 let hash=0;for(const c of id)hash=(hash*31+c.charCodeAt(0))|0;
 return [styles.toneOne,styles.toneTwo,styles.toneThree,styles.toneFour][Math.abs(hash%4)];
}

export default function AudioRoomGrid({room,onLeave,initialMinimized=false}:AudioRoomGridProps){
 const [minimized,setMinimized]=useState(initialMinimized);
 const [members,setMembers]=useState<Member[]>([]);
 const [busy,setBusy]=useState(false);
 const [leaving,setLeaving]=useState(false);
 const [error,setError]=useState("");
 const [connected,setConnected]=useState(false);

 useEffect(()=>{
  if(!room){setMembers([]);setConnected(false);return}
  const refresh=()=>{setMembers(snapshot(room));setConnected(room.state==="connected")};
  refresh();
  const events=[
   RoomEvent.ParticipantConnected,
   RoomEvent.ParticipantDisconnected,
   RoomEvent.ActiveSpeakersChanged,
   RoomEvent.TrackMuted,
   RoomEvent.TrackUnmuted,
   RoomEvent.ConnectionStateChanged,
   RoomEvent.LocalTrackPublished,
   RoomEvent.LocalTrackUnpublished,
   RoomEvent.ParticipantMetadataChanged,
   RoomEvent.ParticipantNameChanged
  ];
  for(const event of events)room.on(event,refresh);
  return()=>{for(const event of events)room.off(event,refresh)};
 },[room]);

 const toggleMute=useCallback(async()=>{
  if(!room||busy||!connected)return;
  setBusy(true);setError("");
  try{
   await room.localParticipant.setMicrophoneEnabled(!room.localParticipant.isMicrophoneEnabled);
   setMembers(snapshot(room));
  }catch(e){setError(e instanceof Error?e.message:"Microphone could not be changed.")}
  finally{setBusy(false)}
 },[room,busy,connected]);

 const leave=useCallback(async()=>{
  if(leaving)return;
  setLeaving(true);setError("");
  try{await onLeave()}catch(e){setError(e instanceof Error?e.message:"Could not leave the room.")}
  finally{setLeaving(false)}
 },[onLeave,leaving]);

 if(!room)return null;
 const local=members.find(member=>member.local);
 const roomLabel=members.length===1?"1 player":members.length+" players";
 return <aside className={styles.anchor} aria-label="Audio Room group call">
  {minimized?
   <button type="button" className={styles.mini} aria-expanded={false} onClick={()=>setMinimized(false)}>
    <span className={styles.miniDot} aria-hidden="true"/> 🎙️ Audio Room <span className={styles.count}>{members.length}</span>
   </button>:
   <section className={styles.panel} aria-label="Audio Room participants">
    <header className={styles.header}>
     <div className={styles.heading}><span className={styles.roomIcon} aria-hidden="true">🎙️</span><div><strong>Audio Room</strong><small aria-live="polite">{connected?roomLabel:"Reconnecting…"}</small></div></div>
     <button type="button" className={styles.iconButton} onClick={()=>setMinimized(true)} aria-label="Minimize Audio Room" title="Minimize">−</button>
    </header>
    <div className={styles.grid} role="list" aria-label="Audio Room members">
     {members.map(member=><div className={styles.tile} role="listitem" key={member.id}>
      <div className={styles.avatar+" "+avatarTone(member.id)+(member.speaking? " "+styles.speaking:"")}>
       <svg viewBox="0 0 64 64" aria-hidden="true" className={styles.silhouette}><circle cx="32" cy="23" r="11"/><path d="M12 56c1-14 9-21 20-21s19 7 20 21Z"/></svg>
       {member.avatar&&<img src={member.avatar} alt="" onError={e=>{e.currentTarget.style.display="none"}}/>}
       {member.speaking&&<span className={styles.sound} aria-label="Speaking"><i/><i/><i/></span>}
      </div>
      <span className={styles.memberName} title={member.name}>{member.local?"You":member.name}</span>
      <span className={styles.memberState}>{member.muted?"🔇 Muted":member.speaking?"● Speaking":"● Listening"}</span>
     </div>)}
    </div>
    <footer className={styles.footer}>
     <button type="button" className={styles.micButton} disabled={busy||leaving||!connected} onClick={()=>void toggleMute()} aria-pressed={!local?.muted} aria-label={local?.muted?"Unmute microphone":"Mute microphone"}>{busy?"…":local?.muted?"🔇 Unmute":"🎤 Mute"}</button>
     <button type="button" className={styles.leaveButton} disabled={leaving} onClick={()=>void leave()}>{leaving?"Leaving…":"Leave"}</button>
    </footer>
    {error&&<p className={styles.error} role="alert">{error}</p>}
   </section>}
 </aside>;
}
