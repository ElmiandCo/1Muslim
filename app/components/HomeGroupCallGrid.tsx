"use client";
import {useEffect,useMemo,useState} from "react";
import styles from "./HomeGroupCallGrid.module.css";

export type GroupCallParticipant={
 id:string; name:string; avatarUrl?:string|null; videoElement?:HTMLVideoElement|null;
 isMuted?:boolean; isSpeaking?:boolean; audioLevel?:number; isLocal?:boolean;
};
type Props={title:string; participants:GroupCallParticipant[]; onLeave:()=>void;
 onToggleMic?:()=>void;onToggleCamera?:()=>void;onShareScreen?:()=>void;
 micEnabled?:boolean;cameraEnabled?:boolean;screenSharing?:boolean;
 onInvite?:()=>void; onChat?:()=>void; onExpand?: (participantId:string)=>void;};
export default function HomeGroupCallGrid({title,participants,onLeave,onToggleMic,onToggleCamera,onShareScreen,micEnabled=false,cameraEnabled=false,screenSharing=false,onInvite,onChat,onExpand}:Props){
 const [expanded,setExpanded]=useState<string|null>(null);
 const active=useMemo(()=>participants.find(p=>p.isSpeaking||((p.audioLevel??0)>.08)),[participants]);
 useEffect(()=>{if(expanded&&!participants.some(p=>p.id===expanded))setExpanded(null)},[expanded,participants]);
 const shown=expanded?participants.filter(p=>p.id===expanded):participants;
 return <section className={styles.room} aria-label={title+" group call"}>
  <header className={styles.header}><strong>{title}</strong><span className={styles.count}>{participants.length} in room</span><div className={styles.headerActions}>{onInvite&&<button type="button" onClick={onInvite} aria-label="Invite participants">♧＋</button>}{onChat&&<button type="button" onClick={onChat} aria-label="Open chat">▤</button>}</div></header>
  <div className={styles.grid} data-single={shown.length===1}>
   {shown.map(p=>{const level=Math.max(0,Math.min(1,p.audioLevel??0));const speaking=Boolean(p.isSpeaking||level>.08);return <article key={p.id} className={styles.tile} data-speaking={speaking} style={{"--voice-strength":speaking?String(Math.max(.35,level)): "0"} as React.CSSProperties}>
    <div className={styles.voiceRing} aria-hidden="true"/>
    {p.videoElement?<div ref={node=>{if(node&&p.videoElement&&p.videoElement.parentElement!==node)node.appendChild(p.videoElement)}} className={styles.video}/>:<div className={styles.avatar}>{p.avatarUrl?<img src={p.avatarUrl} alt=""/>:<span>{p.name.slice(0,1).toUpperCase()}</span>}</div>}
    <span className={styles.name}>{p.isMuted?"♩̸ ":""}{p.name}{p.isLocal?" (You)":""}</span>
    <button className={styles.expand} type="button" aria-label={expanded?"Show all participants":"Expand "+p.name} onClick={()=>{setExpanded(expanded?null:p.id);onExpand?.(p.id)}}>{expanded?"⊞":"⤢"}</button>
   </article>})}
  </div>
  <div className={styles.controls}>
   <button type="button" onClick={onToggleCamera} disabled={!onToggleCamera} aria-label={cameraEnabled?"Turn camera off":"Turn camera on"} aria-pressed={cameraEnabled}>▣</button>
   <button type="button" onClick={onToggleMic} disabled={!onToggleMic} aria-label={micEnabled?"Mute microphone":"Unmute microphone"} aria-pressed={micEnabled}>♩</button>
   <button type="button" onClick={onShareScreen} disabled={!onShareScreen} aria-label={screenSharing?"Stop sharing screen":"Share screen"} aria-pressed={screenSharing}>▣↗</button>
   <button type="button" className={styles.leave} onClick={onLeave} aria-label="Leave group call">☎</button>
  </div>
  <span className={styles.srOnly} aria-live="polite">{active?.name?active.name+" speaking":""}</span>
 </section>
}
