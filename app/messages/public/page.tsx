"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {Room,RoomEvent,Track} from "livekit-client";
type Meeting={id:string;title:string;mode:string;starts_at:string;duration_minutes:number};
export default function PublicGroupCalls(){
 const [meetings,setMeetings]=useState<Meeting[]>([]);
 const [active,setActive]=useState<Meeting|null>(null);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(false);
 const [participants,setParticipants]=useState(0);
 const [connected,setConnected]=useState(false);
 const roomRef=useRef<Room|null>(null);
 const stage=useRef<HTMLDivElement|null>(null);
 const load=async()=>{try{const response=await fetch("/api/public-group-meetings",{cache:"no-store"});const json=await response.json();if(!response.ok)throw Error(json.error||"Unable to load rooms");setMeetings(json.meetings||[])}catch(e){setError(e instanceof Error?e.message:"Unable to load public calls")}};
 useEffect(()=>{void load();const timer=setInterval(()=>void load(),20000);return()=>clearInterval(timer)},[]);
 const leave=async()=>{const room=roomRef.current;roomRef.current=null;if(room)await room.disconnect();if(stage.current)stage.current.replaceChildren();setActive(null);setConnected(false);setParticipants(0)};
 useEffect(()=>()=>{void roomRef.current?.disconnect()},[]);
 const join=async(meeting:Meeting)=>{if(loading)return;setLoading(true);setError("");try{
  const response=await fetch("/api/public-group-meetings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"watch",callId:meeting.id})});
  const json=await response.json();if(!response.ok)throw Error(json.error||"Unable to join");
  const room=new Room({adaptiveStream:true,dynacast:true});roomRef.current=room;setActive(meeting);
  const sync=()=>setParticipants(room.remoteParticipants.size);
  room.on(RoomEvent.ParticipantConnected,sync).on(RoomEvent.ParticipantDisconnected,sync);
  room.on(RoomEvent.TrackSubscribed,(track,publication,participant)=>{if(track.kind!==Track.Kind.Video&&track.kind!==Track.Kind.Audio)return;const el=track.attach();el.dataset.participant=participant.identity;el.dataset.track=publication.trackSid||"";if(el instanceof HTMLVideoElement){el.autoplay=true;el.playsInline=true;el.style.cssText="width:100%;max-height:65dvh;object-fit:contain;border-radius:14px;background:#07150e"}else{el.style.display="none"}stage.current?.appendChild(el)});
  room.on(RoomEvent.TrackUnsubscribed,(track)=>track.detach().forEach(el=>el.remove()));
  await room.connect(json.url,json.token);sync();setConnected(true);
  for(const p of room.remoteParticipants.values())for(const publication of p.trackPublications.values())if(publication.track&&publication.isSubscribed){const el=publication.track.attach();if(el instanceof HTMLVideoElement){el.autoplay=true;el.playsInline=true;el.style.cssText="width:100%;max-height:65dvh;object-fit:contain"}stage.current?.appendChild(el)}else{el.style.display="none";stage.current?.appendChild(el)}}
 }catch(e){setError(e instanceof Error?e.message:"Could not join");await leave()}finally{setLoading(false)}};
 const share=async(m:Meeting)=>{const url=window.location.origin+"/messages/public?call="+encodeURIComponent(m.id);try{if(navigator.share)await navigator.share({title:m.title,url});else{await navigator.clipboard.writeText(url);setError("Link copied")}}catch{}};
 useEffect(()=>{if(!meetings.length||active)return;const id=new URLSearchParams(window.location.search).get("call");const match=meetings.find(m=>m.id===id);if(match)void join(match)},[meetings.length]);
 return <main className="pgc"><header><Link href="/messages">← Messages</Link><h1>🌍 Public Calls</h1><p>Listen and learn together. Joining starts with your microphone and camera off.</p></header>
 {error&&<p role="status" className="pgc-notice">{error}</p>}
 {active?<section className="pgc-player"><h2>{active.title}</h2><p>{connected?"● Connected":"Connecting…"} · {participants} other participants · Listening only</p><div ref={stage} className="pgc-stage"/><div className="pgc-actions"><button onClick={()=>void share(active)}>↗ Share</button><button onClick={()=>void leave()}>Leave call</button></div></section>:<section aria-label="Public meetings"><h2>Live conversations</h2>{meetings.length?meetings.map(m=><article key={m.id} className="pgc-card"><div><strong>{m.mode==="audio"?"🎙️":"📹"} {m.title}</strong><small>Public · {m.mode==="audio"?"Audio":"Video"} · Listen first</small></div><div className="pgc-actions"><button onClick={()=>void share(m)} aria-label={"Share "+m.title}>↗</button><button disabled={loading} onClick={()=>void join(m)}>Join</button></div></article>):<p className="pgc-empty">No public calls are live right now. Check back soon.</p>}<Link href="/messages/groups" className="pgc-link">Your groups and scheduled calls →</Link></section>}
 <style jsx>{`.pgc{max-width:850px;margin:auto;padding:20px 16px 90px;color:var(--text,#e7f8ed)}.pgc header>a,.pgc-link{color:#72dca2}.pgc h1{font-size:clamp(25px,5vw,38px);margin:18px 0 6px}.pgc header p,.pgc-card small,.pgc-player p{opacity:.75;font-size:14px}.pgc-card{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #62b58a55;border-radius:18px;padding:16px;margin:10px 0;background:#1c3a2a18}.pgc-card strong,.pgc-card small{display:block}.pgc-card small{margin-top:5px}.pgc-actions{display:flex;gap:8px;align-items:center}.pgc button{min-height:44px;border-radius:12px;border:1px solid #72dca277;background:#133c2c;color:#dcffe9;padding:9px 15px;font-weight:700;cursor:pointer}.pgc button:disabled{opacity:.5}.pgc-player{padding:15px;border:1px solid #62b58a66;border-radius:20px}.pgc-stage{min-height:180px;background:#07150e;border-radius:15px;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px;overflow:hidden;margin:12px 0}.pgc-empty,.pgc-notice{padding:18px;border-radius:14px;background:#14372955}.pgc-link{display:inline-block;margin-top:18px}@media(max-width:480px){.pgc-card{padding:12px}.pgc-actions{gap:5px}.pgc button{padding:9px 12px}} `}</style></main>;
}
