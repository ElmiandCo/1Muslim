"use client";

import {useEffect,useMemo,useState,type ReactNode,type RefObject,type CSSProperties} from "react";
import {Room,RoomEvent,Track,type RemoteVideoTrack} from "livekit-client";
import {createClient} from "../utils/supabase/client";
import styles from "./LiveGuestsStage.module.css";

export type LiveStageGuest={
  id:string;
  name:string;
  avatar:string|null;
  videoTrack:RemoteVideoTrack|null;
  micActive:boolean;
  speaking:boolean;
};

/** Only publisher identities may occupy a guest seat; viewers use suffixed identities. */
const isGuestIdentity=(identity:string,hostId:string|null)=>
  identity!==hostId && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(identity);

/** Preserve arrival order as guests reconnect or toggle their tracks. */
export function useLiveGuestRoster(roomRef:RefObject<Room|null>,connected:boolean,hostId:string|null,limit=11){
  const [guests,setGuests]=useState<LiveStageGuest[]>([]);
  const [profiles,setProfiles]=useState<Record<string,{name:string;avatar:string|null}>>({});
  useEffect(()=>{
    if(!connected||!roomRef.current){setGuests([]);return;}
    const room=roomRef.current;
    let active=true;
    const sync=()=>{
      if(!active)return;
      const participants=[...room.remoteParticipants.values()].filter(p=>isGuestIdentity(p.identity,hostId));
      setGuests(previous=>{
        const order=new Map(previous.map((p,i)=>[p.id,i]));
        participants.sort((a,b)=>(order.get(a.identity)??Number.MAX_SAFE_INTEGER)-(order.get(b.identity)??Number.MAX_SAFE_INTEGER));
        return participants.slice(0,limit).map((p,index)=>{
          const publications=[...p.trackPublications.values()];
          // Existing Guest Studio publishes raw MediaStreamTracks without source hints.
          // Accept Unknown as a fallback while excluding screen-share tracks.
          const camera=publications.find(pub=>pub.kind===Track.Kind.Video&&pub.source!==Track.Source.ScreenShare);
          const mic=publications.find(pub=>pub.kind===Track.Kind.Audio&&pub.source!==Track.Source.ScreenShareAudio);
          return {
            id:p.identity,
            name:previous.find(g=>g.id===p.identity)?.name||`Guest ${index+1}`,
            avatar:previous.find(g=>g.id===p.identity)?.avatar||null,
            videoTrack:(camera?.track as RemoteVideoTrack|undefined)??null,
            micActive:!!mic&&!mic.isMuted,
            speaking:p.isSpeaking,
          };
        });
      });
    };
    const events=[RoomEvent.ParticipantConnected,RoomEvent.ParticipantDisconnected,RoomEvent.TrackSubscribed,RoomEvent.TrackUnsubscribed,RoomEvent.TrackPublished,RoomEvent.TrackUnpublished,RoomEvent.TrackMuted,RoomEvent.TrackUnmuted,RoomEvent.ActiveSpeakersChanged];
    for(const event of events)room.on(event,sync);
    sync();
    return()=>{active=false;for(const event of events)room.off(event,sync)};
  },[roomRef,connected,hostId,limit]);

  const ids=useMemo(()=>guests.map(g=>g.id).sort().join(","),[guests]);
  useEffect(()=>{
    if(!ids)return;
    let active=true;
    const missing=ids.split(",").filter(id=>!profiles[id]);
    if(!missing.length)return;
    void (async()=>{
      const {data}=await createClient().from("profiles").select("id,display_name,username,avatar_url").in("id",missing);
      if(!active)return;
      const next:Record<string,{name:string;avatar:string|null}>={};
      for(const profile of data??[]){
        const avatar=typeof profile.avatar_url==="string"&&profile.avatar_url.startsWith("https://")?profile.avatar_url:null;
        next[profile.id]={name:profile.display_name||profile.username||"Guest",avatar};
      }
      setProfiles(old=>({...old,...next}));
    })();
    return()=>{active=false};
  },[ids,profiles]);

  return useMemo(()=>guests.map(g=>({...g,name:profiles[g.id]?.name||g.name,avatar:profiles[g.id]?.avatar??g.avatar})),[guests,profiles]);
}

/** Keep the video element mounted for the life of a track, avoiding camera flash on layout morph. */
export function GuestVideoTile({guest}:{guest:LiveStageGuest}){
  const [node,setNode]=useState<HTMLVideoElement|null>(null);
  useEffect(()=>{
    const track=guest.videoTrack;
    if(!node||!track)return;
    track.attach(node);node.muted=true;
    void node.play().catch(()=>{});
    return()=>{track.detach(node);node.srcObject=null};
  },[node,guest.videoTrack]);
  return <div className={styles.tile} data-speaking={guest.speaking?"yes":"no"}>
    <video ref={setNode} autoPlay muted playsInline aria-label={`${guest.name} camera`} style={{display:guest.videoTrack?"block":"none"}}/>
    {!guest.videoTrack&&<div className={styles.fallback}>{guest.avatar?<img src={guest.avatar} alt="" referrerPolicy="no-referrer"/>:<span aria-hidden="true">✧</span>}</div>}
    <span className={styles.guestLabel}>{guest.name} <span aria-label={guest.micActive?"Microphone active":"Microphone muted"}>{guest.micActive?"🎙":"🔇"}</span></span>
  </div>;
}

export function GuestVideoTiles({guests}:{guests:LiveStageGuest[]}){
  if(!guests.length)return null;
  return <div className={styles.guestColumn} data-count={Math.min(3,guests.length)} aria-label="Live guests">
    {guests.slice(0,3).map(guest=><GuestVideoTile key={guest.id} guest={guest}/>)}
  </div>;
}

/** The full shared stage is used by viewers; the host retains its persistent preview node. */
export default function LiveGuestsStage({mode,guests,hostName,hostAvatar,hostMicActive=true,hostSpeaking=false,children}:{
  mode:"video"|"audio";
  guests:LiveStageGuest[];
  hostName:string;
  hostAvatar:string|null;
  hostMicActive?:boolean;
  hostSpeaking?:boolean;
  children?:ReactNode;
}){
  const visible=guests.slice(0,mode==="video"?3:11);
  const count=visible.length;
  return <section className={styles.stage} data-mode={mode} data-count={count} aria-label={mode==="audio"?"Live audio room":"Live video guests"}>
    {mode==="video"?<>
      <div className={styles.hostVideo} data-speaking={hostSpeaking?"yes":"no"}>{children}<span className={styles.hostLabel}>👑 {hostName} · Host</span></div>
      <GuestVideoTiles guests={visible}/>
    </>:<>
      <div className={styles.audioOrbit} aria-label={`${count} audio guests`}>
        <div className={styles.hostAudio} data-speaking={hostSpeaking?"yes":"no"}>
          <span className={styles.crown}>👑 Host</span>
          <span className={styles.hostPortrait}>{hostAvatar?<img src={hostAvatar} alt="" referrerPolicy="no-referrer"/>:<span aria-hidden="true">✧</span>}</span>
          <strong>{hostName}</strong><small>{hostMicActive?"● Microphone active":"○ Microphone muted"}</small>
        </div>
        {visible.map((guest,index)=>{
          // At capacity, reserve twelve o'clock for the host's crown: seats 1..11
          // align with the corresponding clock markers. Below capacity spread evenly.
          const angle=count===11?-60+index*30:count===1?90:-90+index*360/count;
          const radians=angle*Math.PI/180;
          const radius=count>=9?42:count>=6?40:count>=3?38:33;
          const position={"--guest-x":`${50+Math.cos(radians)*radius}%`,"--guest-y":`${50+Math.sin(radians)*radius}%`} as CSSProperties;
          return <div key={guest.id} className={styles.audioGuest} data-speaking={guest.speaking?"yes":"no"} style={position}>
            <span className={styles.guestPortrait}>{guest.avatar?<img src={guest.avatar} alt="" referrerPolicy="no-referrer"/>:<span aria-hidden="true">✧</span>}</span>
            <strong title={guest.name}>{guest.name}</strong>
            <small aria-label={guest.micActive?"Microphone active":"Microphone muted"}>{guest.micActive?"🎙":"🔇"}</small>
          </div>;
        })}
      </div>
    </>}
  </section>;
}
