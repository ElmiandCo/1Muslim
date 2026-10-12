"use client";
import {useEffect,useRef,useState} from "react";
import {Room,RoomEvent,Track} from "livekit-client";
import {createClient} from "../utils/supabase/client";
type Call={id:string;caller_id:string;callee_id:string;mode:"audio"|"video";status:string};
export default function ConnectCallExperience({conversationId,userId,peerName,peerAvatar}:{conversationId:string;userId:string;peerName:string;peerAvatar?:string|null}){
 const [call,setCall]=useState<Call|null>(null),[phase,setPhase]=useState<"idle"|"intro"|"connected">("idle"),[error,setError]=useState(""),[muted,setMuted]=useState(false),[cameraOff,setCameraOff]=useState(false);
 const [cameraEffects,setCameraEffects]=useState(true),[cameraEffect,setCameraEffect]=useState<"glow"|"stars"|"soft">("glow");
 const [menuOpen,setMenuOpen]=useState(false),[speakerOn,setSpeakerOn]=useState(true),[showChat,setShowChat]=useState(false),[chatDraft,setChatDraft]=useState(""),[chatMessages,setChatMessages]=useState<{sender:string;body:string}[]>([]),[audioLevel,setAudioLevel]=useState(0),[flipping,setFlipping]=useState(false);
 const [showHistory,setShowHistory]=useState(false);
 const [history,setHistory]=useState<Array<Call&{created_at:string;accepted_at?:string|null}>>([]);
 const [historyLoading,setHistoryLoading]=useState(false);
 const loadHistory=async()=>{setHistoryLoading(true);try{const r=await fetch("/api/dm-calls?conversationId="+encodeURIComponent(conversationId)+"&history=1",{cache:"no-store"});if(!r.ok)throw Error("History unavailable");const d=await r.json();setHistory(d.calls??[])}catch{setError("Unable to load call history")}finally{setHistoryLoading(false)}};
 const connectingId=useRef<string|null>(null);
 const activeCallId=useRef<string|null>(null);
 const callRef=useRef<Call|null>(null);
 const [connectionState,setConnectionState]=useState<"normal"|"reconnecting"|"failed">("normal");
 const room=useRef<Room|null>(null),local=useRef<HTMLVideoElement>(null),remote=useRef<HTMLVideoElement>(null),remoteAudio=useRef<HTMLAudioElement>(null);
 const request=async(body:Record<string,unknown>)=>{const r=await fetch("/api/dm-calls",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({conversationId,...body})});const data=await r.json();if(!r.ok)throw Error(data.error||"Call request failed");return data};
 useEffect(()=>{let alive=true;setCall(null);setPhase("idle");const poll=async()=>{try{const r=await fetch("/api/dm-calls?conversationId="+encodeURIComponent(conversationId),{cache:"no-store"});if(!r.ok)return;const d=await r.json();if(alive){
  const next:Call|null=d.call??null;
  callRef.current=next;setCall(next);
  if(!next||!["accepted","ringing"].includes(next.status)){
   setPhase("idle");setConnectionState("normal");activeCallId.current=null;connectingId.current=null;
   room.current?.disconnect();room.current=null;
  }else if(next.status==="accepted"&&next.caller_id===userId&&activeCallId.current!==next.id&&connectingId.current!==next.id){
   void connect(next.id,next.mode);
  }
 }}catch{}};void poll();const timer=setInterval(()=>void poll(),1200);
 const onFocus=()=>void poll();
 window.addEventListener("focus",onFocus);
 const supabase=createClient();
 const channel=supabase.channel("dm-call-"+conversationId)
  .on("postgres_changes",{event:"*",schema:"public",table:"dm_calls",filter:"conversation_id=eq."+conversationId},()=>void poll())
  .subscribe();
 return()=>{alive=false;window.removeEventListener("focus",onFocus);void supabase.removeChannel(channel);clearInterval(timer);room.current?.disconnect();room.current=null}},[conversationId]);
 // Ring only while an incoming invitation is pending; stop immediately on acceptance/decline.
 useEffect(()=>{
  if(call?.status!=="ringing"||call.callee_id!==userId)return;
  let ctx:AudioContext|null=null;let timer:ReturnType<typeof setInterval>|undefined;
  const ring=()=>{if(document.visibilityState!=="visible")return;
   try{navigator.vibrate?.([160,100,160])}catch{}
   try{ctx??=new AudioContext();if(ctx.state==="suspended")void ctx.resume();
    const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type="sine";osc.frequency.value=660;gain.gain.value=.035;osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.18);
   }catch{/* Browser audio may require a gesture. */}
  };
  ring();timer=setInterval(ring,2400);
  return()=>{if(timer)clearInterval(timer);try{navigator.vibrate?.(0)}catch{}void ctx?.close()};
 },[call?.id,call?.status,call?.callee_id,userId]);
  const start=async(mode:"audio"|"video")=>{setError("");try{await request({action:"invite",mode});const r=await fetch("/api/dm-calls?conversationId="+encodeURIComponent(conversationId));const d=await r.json();setCall(d.call??null)}catch(e){setError(e instanceof Error?e.message:"Could not call")}};
 const connect=async(id:string,mode:"audio"|"video")=>{
 if(connectingId.current===id||activeCallId.current===id)return;
 connectingId.current=id;setPhase("intro");setError("");setConnectionState("normal");
 try{const data=await request({action:"token",callId:id});const r=new Room({adaptiveStream:true,dynacast:true});room.current=r;
 r.on(RoomEvent.Reconnecting,()=>{setConnectionState("reconnecting");setError("Connection interrupted. Reconnecting…")});
 r.on(RoomEvent.Reconnected,()=>{setConnectionState("normal");setError("")});
 r.on(RoomEvent.Disconnected,()=>{if(room.current===r){activeCallId.current=null;connectingId.current=null;setConnectionState("failed");setError("Call disconnected. Tap Reconnect to try again.")}});
 r.on(RoomEvent.TrackSubscribed,(track)=>{if(track.kind===Track.Kind.Video&&remote.current)track.attach(remote.current);if(track.kind===Track.Kind.Audio&&remoteAudio.current)track.attach(remoteAudio.current)});
 r.on(RoomEvent.TrackUnsubscribed,track=>track.detach());
 r.on(RoomEvent.DataReceived,(payload,participant)=>{try{const d=JSON.parse(new TextDecoder().decode(payload));if(d.type==="call-chat"&&typeof d.body==="string")setChatMessages(v=>[...v.slice(-39),{sender:participant?.identity||"Peer",body:d.body.slice(0,500)}])}catch{}});
 await r.connect(data.url,data.token);await r.localParticipant.setMicrophoneEnabled(true);
 if(mode==="video"){await r.localParticipant.setCameraEnabled(true);const track=r.localParticipant.videoTrackPublications.values().next().value?.track;if(track&&local.current)track.attach(local.current)}
 activeCallId.current=id;connectingId.current=null;
 setTimeout(()=>{if(room.current===r)setPhase("connected")},700);
 }catch(e){setError(e instanceof Error?e.message:"Could not connect");room.current?.disconnect();room.current=null;activeCallId.current=null;connectingId.current=null;setConnectionState("failed");setPhase("idle")}};
 const accept=async()=>{if(!call)return;try{await request({action:"accept",callId:call.id});setCall({...call,status:"accepted"});void connect(call.id,call.mode)}catch(e){setError(e instanceof Error?e.message:"Could not accept")}};
 const end=async()=>{if(call)try{await request({action:"end",callId:call.id})}catch{}room.current?.disconnect();room.current=null;activeCallId.current=null;connectingId.current=null;setCall(null);setPhase("idle")};
 const incoming=call?.status==="ringing"&&call.callee_id===userId;
 const outgoing=call?.status==="ringing"&&call.caller_id===userId;
 const [elapsed,setElapsed]=useState(0);
 useEffect(()=>{if(phase!=="connected"||call?.mode!=="audio")return;const r=room.current;if(!r)return;const tick=()=>{const participant=Array.from(r.remoteParticipants.values())[0];setAudioLevel(participant?.audioLevel??0)};tick();const t=setInterval(tick,120);return()=>clearInterval(t)},[phase,call?.mode]);
 const flip=async()=>{const r=room.current;if(!r||flipping)return;setFlipping(true);try{const pub=Array.from(r.localParticipant.videoTrackPublications.values())[0];const track=pub?.track;if(!track)throw Error("Camera unavailable");const current=track.mediaStreamTrack.getSettings().facingMode;await track.restartTrack({facingMode:current==="environment"?"user":"environment"});if(local.current)track.attach(local.current)}catch(e){setError(e instanceof Error?e.message:"Camera flip unavailable")}finally{setFlipping(false)}};
 const sendChat=async()=>{const body=chatDraft.trim();const r=room.current;if(!body||!r)return;try{await r.localParticipant.publishData(new TextEncoder().encode(JSON.stringify({type:"call-chat",body:body.slice(0,500)})),{reliable:true});setChatMessages(v=>[...v.slice(-39),{sender:"You",body:body.slice(0,500)}]);setChatDraft("")}catch{setError("Message could not be sent")}};
 const switchSpeaker=async()=>{const el=remoteAudio.current;if(!el)return;const next=!speakerOn;el.muted=!next;setSpeakerOn(next)};

 useEffect(()=>{if(phase!=="connected"){setElapsed(0);return}const timer=setInterval(()=>setElapsed(v=>v+1),1000);return()=>clearInterval(timer)},[phase]);
 const [linkNotice,setLinkNotice]=useState("");
 const [openedFromLink,setOpenedFromLink]=useState(false);
 useEffect(()=>{const params=new URLSearchParams(window.location.search);if(params.get("call")==="1"&&params.get("conversation")===conversationId)setOpenedFromLink(true)},[conversationId]);
 const shareCall=async()=>{const url=window.location.origin+"/messages?conversation="+encodeURIComponent(conversationId)+"&call=1";try{if(navigator.share){await navigator.share({title:"Join my 1Muslim call",text:"Open this link to join our private 1Muslim call.",url});setLinkNotice("Call link shared")}else{await navigator.clipboard.writeText(url);setLinkNotice("Call link copied")}}catch(e){if((e as Error)?.name!=="AbortError")setLinkNotice("Could not share link")}};
 const duration=String(Math.floor(elapsed/60)).padStart(2,"0")+":"+String(elapsed%60).padStart(2,"0");
 return <><style>{`
 .mc-launch{display:flex;gap:9px;align-items:center;flex-wrap:wrap;padding:10px;border:1px solid #6ca88855;border-radius:16px;background:#102c2355}.mc-call-label{font-size:13px;font-weight:700;color:#d4f8de;margin-right:auto}.mc-link-hint{font-size:12px;color:#d4f8de;width:100%}.mc-launch button{display:grid;place-items:center;width:43px;height:43px;border:1px solid #6ca88855;background:#153a2b;color:#d4f8de;border-radius:50%;font-size:19px;cursor:pointer;transition:transform .2s,background .2s}.mc-launch button:hover{transform:translateY(-2px);background:#266347}.mc-launch button:disabled{opacity:.35;cursor:default}
 .mc-screen{position:fixed;inset:0;z-index:15000;background:#090d13;color:#fff;display:flex;align-items:center;justify-content:center;font-family:inherit}
 .mc-shell{position:relative;width:100%;height:100%;overflow:hidden;isolation:isolate;background:radial-gradient(ellipse at 50% 34%,#244b47,#111e29 56%,#070d14);display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:calc(env(safe-area-inset-top) + 26px) 18px calc(env(safe-area-inset-bottom) + 26px);box-sizing:border-box}
 .mc-shell:before{content:"";position:absolute;inset:-25%;z-index:-1;background:radial-gradient(circle at 15% 25%,#67e8a31e,transparent 30%),radial-gradient(circle at 85% 80%,#b3c7ff1c,transparent 33%);filter:blur(35px)}
 .mc-header{width:100%;display:flex;justify-content:space-between;align-items:center;max-width:900px;z-index:2}.mc-brand{font-size:12px;font-weight:800;letter-spacing:.14em;color:#d4e7da}.mc-private{font-size:12px;color:#d5e8dd;background:#ffffff17;border:1px solid #ffffff25;border-radius:99px;padding:8px 12px}
 .mc-center{display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px;z-index:2}.mc-avatar{width:144px;height:144px;border-radius:50%;display:grid;place-items:center;font-size:55px;font-weight:700;background:linear-gradient(135deg,#397c63,#183e54);border:3px solid #ffffff7a;box-shadow:0 20px 70px #0007}.mc-name{font-size:clamp(29px,6vw,43px);font-weight:750;letter-spacing:-.03em;margin:12px 0 0}.mc-state{font-size:15px;color:#d0dfd9;margin:0}.mc-bismillah{font-size:clamp(23px,6vw,38px);direction:rtl;color:#f3dfae;text-shadow:0 0 35px #f4ce8677;animation:mcAppear 1s both}.mc-ring{width:176px;height:176px;display:grid;place-items:center;border:2px solid #e4d6a4;border-radius:50%;box-shadow:0 0 0 12px #a3e8ba14,0 0 0 30px #a3e8ba0a,0 0 40px #9dddb34f;animation:mcBreathe 2.3s ease-in-out infinite}
 .mc-intro{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.16;pointer-events:none}
 .mc-stage{position:absolute;inset:0;z-index:0;background:#090d13}.mc-stage video.mc-remote{width:100%;height:100%;object-fit:cover}.mc-self{position:absolute;right:clamp(15px,5vw,50px);top:calc(env(safe-area-inset-top) + 85px);width:clamp(100px,23vw,180px);aspect-ratio:3/4;object-fit:cover;transform:scaleX(-1);border:2px solid #ffffff66;border-radius:22px;background:#20352d;box-shadow:0 16px 45px #0009;z-index:2}
 .mc-camera-effects{position:absolute;inset:0;pointer-events:none;z-index:1;overflow:hidden}.mc-camera-effects.glow{background:radial-gradient(ellipse at 50% 100%,#44f0bf20,transparent 57%);box-shadow:inset 0 0 90px #72e8ff18}.mc-camera-effects.soft{backdrop-filter:contrast(1.035) saturate(1.08);background:linear-gradient(145deg,#ffd2af0c,transparent 65%)}.mc-camera-effects.stars i{position:absolute;left:calc(5% + var(--i)*6%);bottom:-12px;width:4px;height:4px;border-radius:50%;background:#e8faff;box-shadow:0 0 11px 4px #8fe8ff80;animation:mcSpark calc(3s + var(--i)*.18s) linear infinite;animation-delay:calc(var(--i)*-.35s)}@keyframes mcSpark{0%{transform:translateY(0);opacity:0}20%{opacity:.85}100%{transform:translateY(-95vh);opacity:0}}.mc-effect-badge{position:absolute;top:calc(env(safe-area-inset-top) + 65px);left:16px;z-index:4;border:1px solid #b3ffe570;background:#09261fa8;color:#eafff5;border-radius:999px;padding:9px 12px;font-size:12px;cursor:pointer;backdrop-filter:blur(10px)}@media(prefers-reduced-motion:reduce){.mc-camera-effects.stars i{animation:none;opacity:.25}} .mc-menu{position:absolute;right:18px;bottom:130px;z-index:7;background:#101a20ef;border:1px solid #ffffff35;backdrop-filter:blur(25px);border-radius:19px;padding:10px;display:flex;flex-direction:column;gap:4px;min-width:215px;box-shadow:0 18px 60px #0009}.mc-menu button{border:0;background:transparent;color:#f1faf4;text-align:left;padding:13px;border-radius:10px;cursor:pointer}.mc-menu button:hover{background:#ffffff22}.mc-chat{position:absolute;z-index:7;right:16px;top:90px;width:min(350px,calc(100% - 32px));height:min(55vh,430px);background:#111d22ed;border:1px solid #ffffff30;border-radius:22px;display:flex;flex-direction:column;padding:14px;box-shadow:0 20px 65px #0008}.mc-chat-list{flex:1;overflow:auto;text-align:left;font-size:13px}.mc-chat-list p{background:#ffffff14;border-radius:10px;padding:9px}.mc-chat form{display:flex;gap:6px}.mc-chat input{flex:1;min-width:0;background:#ffffff18;border:1px solid #ffffff33;border-radius:12px;color:white;padding:11px}.mc-chat button{background:#258659;border:0;border-radius:12px;color:white;padding:10px}.mc-avatar img{width:100%;height:100%;object-fit:cover;border-radius:50%}.mc-controls{display:flex;gap:clamp(10px,3vw,22px);align-items:center;justify-content:center;flex-wrap:wrap;z-index:3;background:#121c23b8;border:1px solid #ffffff20;backdrop-filter:blur(24px);border-radius:28px;padding:14px 20px;max-width:calc(100% - 16px)}.mc-control{display:flex;flex-direction:column;gap:7px;align-items:center;font-size:11px;color:#dce8e4}.mc-control button{width:57px;height:57px;border-radius:50%;border:1px solid #ffffff38;background:#ffffff25;color:white;font-size:23px;cursor:pointer}.mc-control button[aria-pressed="true"]{background:#f0f5f0;color:#14251e}.mc-control .mc-end{background:#e54857;border-color:#f26c75;color:#fff}.mc-control .mc-answer{background:#28a86d;border-color:#56d597}
 @keyframes mcAppear{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}@keyframes mcBreathe{50%{transform:scale(1.045);box-shadow:0 0 0 20px #a3e8ba12,0 0 0 42px #a3e8ba06,0 0 65px #9dddb375}}
 @media(prefers-reduced-motion:reduce){.mc-ring,.mc-bismillah{animation:none}}
 `}</style>
 <div className="mc-launch"><span className="mc-call-label">📞 1Muslim Calls</span><button type="button" title="Recent calls" aria-label="Show recent calls" aria-expanded={showHistory} onClick={()=>{setShowHistory(v=>!v);if(!showHistory)void loadHistory()}}>🕘</button><button type="button" title="Share call link" aria-label="Share link to this 1Muslim call" onClick={()=>void shareCall()}>↗</button>{linkNotice&&<span role="status" style={{fontSize:12}}>{linkNotice}</span>}{showHistory&&<div style={{width:"100%",maxHeight:190,overflowY:"auto",padding:"8px",border:"1px solid #ffffff30",borderRadius:12}} aria-label="Recent call history">{historyLoading?"Loading calls…":history.length===0?"No recent calls":history.map(h=><div key={h.id} style={{fontSize:12,padding:"7px 4px",borderBottom:"1px solid #ffffff15"}}><strong>{h.caller_id===userId?"↗ Outgoing":"↙ Incoming"} {h.mode}</strong> · <span style={{color:!h.accepted_at&&h.callee_id===userId?"#ffb2a6":"#c7e4d5"}}>{!h.accepted_at&&h.callee_id===userId&&h.status!=="ringing"?"Missed / declined":h.status}</span><br/><time dateTime={h.created_at}>{new Date(h.created_at).toLocaleString()}</time></div>)}</div>}<button type="button" title="Voice call" aria-label="Start private voice call" onClick={()=>void start("audio")} disabled={!!call}>☎</button><button type="button" title="Video call" aria-label="Start private video call" onClick={()=>void start("video")} disabled={!!call}>▣</button>{openedFromLink&&!call&&<span className="mc-link-hint" role="status">This call is not ringing right now. Start a voice or video call above, or wait for the other member to call.</span>}</div>
 {error&&<p role="alert" style={{color:"#fca5a5"}}>{error}</p>}
 {call&&<div className="mc-screen" role="dialog" aria-modal="true" aria-label="1Muslim Messenger call"><div className="mc-shell">
 {phase==="intro"&&<video className="mc-intro" src="/videos/prelive-intro.mp4" autoPlay muted playsInline/>}
 {phase==="connected"&&call.mode==="video"&&<div className="mc-stage"><video ref={remote} className="mc-remote" autoPlay playsInline/><video ref={local} className="mc-self" autoPlay muted playsInline/>{cameraEffects&&<div className={"mc-camera-effects "+cameraEffect} aria-hidden="true">{cameraEffect==="stars"&&Array.from({length:15},(_,i)=><i key={i} style={{["--i" as string]:i} as React.CSSProperties}/>)}</div>}<button type="button" className="mc-effect-badge" onClick={()=>setCameraEffect(v=>v==="glow"?"stars":v==="stars"?"soft":"glow")} aria-label="Change camera overlay effect">✨ {cameraEffects?cameraEffect:"Effects off"}</button></div>}
 <div className="mc-header"><span className="mc-brand">1MUSLIM <span style={{color:"#8ae3b2"}}>MESSENGER</span></span><span className="mc-private">🔒 Private {call.mode==="video"?"video":"audio"} call</span></div>
 <div className="mc-center">
 {phase==="intro"&&<div className="mc-bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>}
  {phase!=="connected"&&<div className="mc-ring"><div className="mc-avatar">{peerAvatar?<img src={peerAvatar} alt={peerName}/>:peerName.slice(0,1).toUpperCase()}</div></div>}
  {phase==="connected"&&call.mode==="audio"&&<div className="mc-ring" style={{transform:`scale(${1+Math.min(.15,audioLevel*.25)})`,boxShadow:`0 0 ${30+audioLevel*95}px #6af3b4a8`}}><div className="mc-avatar">{peerAvatar?<img src={peerAvatar} alt={peerName}/>:peerName.slice(0,1).toUpperCase()}</div></div>}
 {(phase!=="connected"||call.mode==="audio")&&<><h2 className="mc-name">{peerName}</h2><p className="mc-state">{incoming?"Incoming "+call.mode+" call":outgoing?"Ringing…":phase==="intro"?"Connecting securely…":duration}</p></>}
 {phase==="connected"&&call.mode==="video"&&<p className="mc-state" style={{background:"#0008",borderRadius:20,padding:"7px 16px"}}>{peerName} · {duration}</p>}
 </div>
 <audio ref={remoteAudio} autoPlay/>
 {showChat&&<div className="mc-chat"><div style={{display:"flex",justifyContent:"space-between"}}><strong>Call messages</strong><button onClick={()=>setShowChat(false)}>✕</button></div><div className="mc-chat-list">{chatMessages.map((m,i)=><p key={i}><strong>{m.sender==="You"?"You":peerName}:</strong> {m.body}</p>)}</div><form onSubmit={e=>{e.preventDefault();void sendChat()}}><input aria-label="Call message" value={chatDraft} maxLength={500} onChange={e=>setChatDraft(e.target.value)} placeholder="Message…"/><button type="submit">Send</button></form></div>}
 {menuOpen&&<div className="mc-menu"><button onClick={()=>{setShowChat(true);setMenuOpen(false)}}>💬 Message during call</button>{call.mode==="video"&&<button onClick={()=>{setCameraEffects(v=>!v);setMenuOpen(false)}}>✨ {cameraEffects?"Turn off camera effects":"Turn on camera effects"}</button>}{call.mode==="video"&&<><button onClick={()=>{void flip();setMenuOpen(false)}}>🔄 Flip camera</button><button onClick={()=>{const track=Array.from(room.current?.localParticipant.videoTrackPublications.values()??[])[0]?.track;void track?.restartTrack({facingMode:"user"});setMenuOpen(false)}}>📷 Front camera</button></>}<button onClick={()=>{void switchSpeaker();setMenuOpen(false)}}>🔊 {speakerOn?"Mute speaker":"Enable speaker"}</button><button onClick={()=>setMenuOpen(false)}>Close settings</button></div>}
 <div className="mc-controls"><div className="mc-control"><button type="button" onClick={()=>void shareCall()} aria-label="Share this call link">↗</button><span>Share link</span></div>
 {incoming&&<div className="mc-control"><button type="button" className="mc-answer" onClick={()=>void accept()} aria-label="Accept call">✓</button><span>Accept</span></div>}
 {call.status==="accepted"&&phase==="idle"&&<div className="mc-control"><button type="button" className="mc-answer" onClick={()=>void connect(call.id,call.mode)} aria-label="Join call">↗</button><span>Join</span></div>}
 {call.status==="accepted"&&connectionState==="failed"&&<div className="mc-control"><button type="button" className="mc-answer" onClick={()=>void connect(call.id,call.mode)} aria-label="Reconnect call">↻</button><span>Reconnect</span></div>}
 {connectionState==="reconnecting"&&<span role="status" aria-live="polite">Reconnecting…</span>}
 {phase==="connected"&&<><div className="mc-control"><button type="button" aria-label={muted?"Unmute microphone":"Mute microphone"} aria-pressed={muted} onClick={()=>{const r=room.current;if(r){void r.localParticipant.setMicrophoneEnabled(muted);setMuted(!muted)}}}>{muted?"🔇":"🎙"}</button><span>{muted?"Unmute":"Mute"}</span></div>
 {call.mode==="video"&&<div className="mc-control"><button type="button" aria-label={cameraOff?"Turn camera on":"Turn camera off"} aria-pressed={cameraOff} onClick={()=>{const r=room.current;if(r){void r.localParticipant.setCameraEnabled(cameraOff);setCameraOff(!cameraOff)}}}>{cameraOff?"◩":"▣"}</button><span>Camera</span></div>}{call.mode==="video"&&<div className="mc-control"><button type="button" onClick={()=>void flip()} disabled={flipping} aria-label="Flip camera">🔄</button><span>Flip</span></div>}<div className="mc-control"><button type="button" onClick={()=>void switchSpeaker()} aria-pressed={!speakerOn} aria-label="Toggle speaker">{speakerOn?"🔊":"🔈"}</button><span>Speaker</span></div><div className="mc-control"><button type="button" onClick={()=>setShowChat(v=>!v)} aria-label="Call messages">💬</button><span>Message</span></div><div className="mc-control"><button type="button" onClick={()=>setMenuOpen(v=>!v)} aria-label="Call settings">⋯</button><span>More</span></div></>}
 <div className="mc-control"><button type="button" className="mc-end" onClick={()=>void end()} aria-label={incoming?"Decline call":"End call"}>☎</button><span>{incoming?"Decline":"End"}</span></div>
 </div>
 </div></div>}
 </>;
}
