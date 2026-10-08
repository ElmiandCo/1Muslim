"use client";
import {useEffect,useRef,useState} from "react";
import {Room,RoomEvent,Track} from "livekit-client";
type Call={id:string;caller_id:string;callee_id:string;mode:"audio"|"video";status:string};
export default function ConnectCallExperience({conversationId,userId,peerName}:{conversationId:string;userId:string;peerName:string}){
 const [call,setCall]=useState<Call|null>(null),[phase,setPhase]=useState<"idle"|"intro"|"connected">("idle"),[error,setError]=useState(""),[muted,setMuted]=useState(false),[cameraOff,setCameraOff]=useState(false);
 const room=useRef<Room|null>(null),local=useRef<HTMLVideoElement>(null),remote=useRef<HTMLVideoElement>(null),remoteAudio=useRef<HTMLAudioElement>(null);
 const request=async(body:Record<string,unknown>)=>{const r=await fetch("/api/dm-calls",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({conversationId,...body})});const data=await r.json();if(!r.ok)throw Error(data.error||"Call request failed");return data};
 useEffect(()=>{let alive=true;setCall(null);setPhase("idle");const poll=async()=>{try{const r=await fetch("/api/dm-calls?conversationId="+encodeURIComponent(conversationId),{cache:"no-store"});if(!r.ok)return;const d=await r.json();if(alive){setCall(d.call??null);if(!d.call||!["accepted","ringing"].includes(d.call.status)){setPhase("idle");room.current?.disconnect();room.current=null}}}catch{}};void poll();const timer=setInterval(()=>void poll(),2500);return()=>{alive=false;clearInterval(timer);room.current?.disconnect();room.current=null}},[conversationId]);
 const start=async(mode:"audio"|"video")=>{setError("");try{await request({action:"invite",mode});const r=await fetch("/api/dm-calls?conversationId="+encodeURIComponent(conversationId));const d=await r.json();setCall(d.call??null)}catch(e){setError(e instanceof Error?e.message:"Could not call")}};
 const connect=async(id:string,mode:"audio"|"video")=>{setPhase("intro");setError("");try{const data=await request({action:"token",callId:id});const r=new Room({adaptiveStream:true,dynacast:true});room.current=r;
 r.on(RoomEvent.TrackSubscribed,(track)=>{if(track.kind===Track.Kind.Video&&remote.current)track.attach(remote.current);if(track.kind===Track.Kind.Audio&&remoteAudio.current)track.attach(remoteAudio.current)});
 r.on(RoomEvent.TrackUnsubscribed,track=>track.detach());
 await r.connect(data.url,data.token);await r.localParticipant.setMicrophoneEnabled(true);
 if(mode==="video"){await r.localParticipant.setCameraEnabled(true);const track=r.localParticipant.videoTrackPublications.values().next().value?.track;if(track&&local.current)track.attach(local.current)}
 setTimeout(()=>setPhase("connected"),2200);
 }catch(e){setError(e instanceof Error?e.message:"Could not connect");room.current?.disconnect();room.current=null;setPhase("idle")}};
 const accept=async()=>{if(!call)return;try{await request({action:"accept",callId:call.id});setCall({...call,status:"accepted"});void connect(call.id,call.mode)}catch(e){setError(e instanceof Error?e.message:"Could not accept")}};
 const end=async()=>{if(call)try{await request({action:"end",callId:call.id})}catch{}room.current?.disconnect();room.current=null;setCall(null);setPhase("idle")};
 const incoming=call?.status==="ringing"&&call.callee_id===userId;
 const outgoing=call?.status==="ringing"&&call.caller_id===userId;
 return <><style>{`
 .connectActions{display:flex;gap:8px;flex-wrap:wrap}.connectActions button{border:1px solid #6da88b;background:#153d2b;color:#e4ffe9;border-radius:999px;padding:9px 14px;cursor:pointer}
 .connectBackdrop{position:fixed;inset:0;z-index:15000;background:radial-gradient(circle at 50% 38%,#1b593d,#06120d 67%);color:#f4fff2;display:flex;align-items:center;justify-content:center;padding:18px;overflow:hidden}
 .connectCard{position:relative;width:min(100%,510px);text-align:center;padding:32px 20px;border-radius:30px;border:1px solid #70a98499;background:#081b15c9;box-shadow:0 35px 110px #000b;overflow:hidden;animation:connectEnter .55s cubic-bezier(.16,1,.3,1)}
 .connectRing{width:175px;height:175px;margin:18px auto;display:grid;place-items:center;border:2px solid #e3c982;border-radius:50%;box-shadow:0 0 25px #a5e6a866,inset 0 0 30px #73ce8955,0 0 0 15px #86ed9b0c;animation:connectPulse 2.2s ease-in-out infinite}
 .connectRing span{font-size:65px}.connectArabic{font-size:clamp(24px,6vw,36px);direction:rtl;color:#f1dfac;text-shadow:0 0 30px #ddbd7477}
 .connectControls{display:flex;justify-content:center;gap:14px;flex-wrap:wrap;margin-top:22px}.connectControls button{border:1px solid #a1cbb0;border-radius:999px;padding:13px 21px;background:#25553b;color:white;font-weight:700;cursor:pointer}.connectControls .end{background:#a82842;border-color:#e37888}
 .connectIntro{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.2;pointer-events:none}.connectVideo{width:100%;aspect-ratio:4/3;background:#07120c;border-radius:18px;object-fit:cover}.connectSelf{position:absolute;right:28px;bottom:100px;width:30%;max-width:140px;border:2px solid #d1e9b4;border-radius:14px;transform:scaleX(-1)}
 @keyframes connectEnter{from{opacity:0;transform:translateY(35px) scale(.94)}to{opacity:1;transform:none}}@keyframes connectPulse{50%{transform:scale(1.05);box-shadow:0 0 65px #a5e6a888,inset 0 0 45px #73ce8966,0 0 0 26px #86ed9b08}}
 @media(prefers-reduced-motion:reduce){.connectCard,.connectRing{animation:none}}
 `}</style>
 <div className="connectActions"><button onClick={()=>void start("audio")} disabled={!!call}>📞 Voice call</button><button onClick={()=>void start("video")} disabled={!!call}>📹 Video call</button></div>
 {error&&<p role="alert" style={{color:"#fca5a5"}}>{error}</p>}
 {call&&<div className="connectBackdrop"><div className="connectCard" role="dialog" aria-modal="true" aria-label="1Muslim private call">
 {phase==="intro"&&<video className="connectIntro" src="/videos/prelive-intro.mp4" autoPlay muted playsInline onError={()=>{}}/>}
 {phase!=="connected"?<><div className="connectArabic">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div><p>In the name of Allah, the Most Merciful</p><div className="connectRing"><span>☪</span></div><h2>{incoming?"Incoming "+call.mode+" call":outgoing?"Calling "+peerName+"…":"Connecting privately…"}</h2><p>{incoming?peerName+" would like to connect":outgoing?"Waiting for acceptance":"Preparing your private "+call.mode+" call"}</p></>:<><h2>{call.mode==="video"?"📹 Private video call":"🎙️ Private voice call"}</h2>{call.mode==="video"?<div style={{position:"relative"}}><video ref={remote} className="connectVideo" autoPlay playsInline/><video ref={local} className="connectSelf" autoPlay muted playsInline/></div>:<div className="connectRing"><span>🎙️</span></div>}<audio ref={remoteAudio} autoPlay/><p>🔒 Only invited participants can join</p></>}
 <div className="connectControls">{incoming&&<button onClick={()=>void accept()}>✓ Accept</button>}{call.status==="accepted"&&phase==="idle"&&<button onClick={()=>void connect(call.id,call.mode)}>Join call</button>}{phase==="connected"&&<><button onClick={()=>{const r=room.current;if(r){void r.localParticipant.setMicrophoneEnabled(muted);setMuted(!muted)}}}>{muted?"🎙️ Unmute":"🔇 Mute"}</button>{call.mode==="video"&&<button onClick={()=>{const r=room.current;if(r){void r.localParticipant.setCameraEnabled(cameraOff);setCameraOff(!cameraOff)}}}>{cameraOff?"📹 Camera on":"📷 Camera off"}</button>}</>}<button className="end" onClick={()=>void end()}>{incoming?"Decline":"End call"}</button></div>
 </div></div>}
 </>;
}
