"use client";
import {useEffect,useRef,useState} from "react";
import {Room,RoomEvent,Track} from "livekit-client";
import {createClient} from "../utils/supabase/client";
import {usePathname,useRouter} from "next/navigation";
type Call={id:string;caller_id:string;callee_id:string;mode:"audio"|"video";status:string};
export default function ConnectCallExperience({conversationId,userId,peerName,peerAvatar}:{conversationId:string;userId:string;peerName:string;peerAvatar?:string|null}){
 const router=useRouter();const pathname=usePathname();
 const [minimized,setMinimized]=useState(false);
 const [miniPosition,setMiniPosition]=useState<{x:number;y:number}|null>(null);
 const miniDrag=useRef<{pointerId:number;startX:number;startY:number;x:number;y:number}|null>(null);
 const miniPanel=useRef<HTMLDivElement>(null);
 const onMiniPointerDown=(e:React.PointerEvent<HTMLDivElement>)=>{if(!minimized||e.button!==0||(e.target as HTMLElement).closest("button"))return;const rect=miniPanel.current?.getBoundingClientRect();if(!rect)return;miniDrag.current={pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,x:rect.left,y:rect.top};e.currentTarget.setPointerCapture(e.pointerId)};
 const onMiniPointerMove=(e:React.PointerEvent<HTMLDivElement>)=>{const d=miniDrag.current;if(!d||d.pointerId!==e.pointerId)return;const rect=miniPanel.current?.getBoundingClientRect();const width=rect?.width??215,height=rect?.height??255;setMiniPosition({x:Math.max(8,Math.min(window.innerWidth-width-8,d.x+e.clientX-d.startX)),y:Math.max(8,Math.min(window.innerHeight-height-8,d.y+e.clientY-d.startY))})};
 const onMiniPointerUp=(e:React.PointerEvent<HTMLDivElement>)=>{if(miniDrag.current?.pointerId===e.pointerId)miniDrag.current=null};
 const [call,setCall]=useState<Call|null>(null),[phase,setPhase]=useState<"idle"|"intro"|"connected">("idle"),[error,setError]=useState(""),[muted,setMuted]=useState(false),[cameraOff,setCameraOff]=useState(false);
 const [cameraEffects,setCameraEffects]=useState(true),[cameraEffect,setCameraEffect]=useState<"glow"|"stars"|"soft">("glow");
 const [menuOpen,setMenuOpen]=useState(false),[speakerOn,setSpeakerOn]=useState(true),[showChat,setShowChat]=useState(false),[chatDraft,setChatDraft]=useState(""),[chatMessages,setChatMessages]=useState<{sender:string;body:string}[]>([]),[audioLevel,setAudioLevel]=useState(0),[flipping,setFlipping]=useState(false);
 const [serviceUnavailable,setServiceUnavailable]=useState(false);
 const [ratingCallId,setRatingCallId]=useState<string|null>(null);
 const [rating,setRating]=useState(0);
 const [sharingScreen,setSharingScreen]=useState(false),[remoteScreen,setRemoteScreen]=useState(false);
 const screenVideo=useRef<HTMLVideoElement>(null);
 const [ratingBusy,setRatingBusy]=useState(false);
 const completedCall=useRef<string|null>(null);
 const [voiceListening,setVoiceListening]=useState(false),[voiceNotice,setVoiceNotice]=useState("");
 const speechRef=useRef<{stop:()=>void}|null>(null);
 const connectingId=useRef<string|null>(null);
 const activeCallId=useRef<string|null>(null);
 const callRef=useRef<Call|null>(null);
 const [connectionState,setConnectionState]=useState<"normal"|"reconnecting"|"failed">("normal");
 const room=useRef<Room|null>(null),local=useRef<HTMLVideoElement>(null),remote=useRef<HTMLVideoElement>(null),remoteAudio=useRef<HTMLAudioElement>(null);
 const request=async(body:Record<string,unknown>)=>{const r=await fetch("/api/dm-calls",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({conversationId,...body})});const data=await r.json();if(!r.ok)throw Error(data.error||"Call request failed");return data};
 useEffect(()=>{let alive=true;let unavailable=false;setServiceUnavailable(false);setCall(null);setPhase("idle");const poll=async()=>{if(unavailable)return;try{const r=await fetch("/api/dm-calls?conversationId="+encodeURIComponent(conversationId),{cache:"no-store"});if(r.status===503){unavailable=true;if(alive){setServiceUnavailable(true);setError("Calling service is temporarily unavailable. Please try again later.")}return}if(!r.ok)return;const d=await r.json();if(alive){
  const next:Call|null=d.call??null;
  callRef.current=next;setCall(next);
  if(!next||!["accepted","ringing"].includes(next.status)){
   if(completedCall.current){setRatingCallId(completedCall.current);completedCall.current=null;}
   setPhase("idle");setConnectionState("normal");activeCallId.current=null;connectingId.current=null;
   room.current?.disconnect();room.current=null;
  }else if(next.status==="accepted"&&next.caller_id===userId&&activeCallId.current!==next.id&&connectingId.current!==next.id){
   void connect(next.id,next.mode);
  }
 }}catch{}};void poll();const timer=setInterval(()=>void poll(),5000);
 const onFocus=()=>{unavailable=false;setServiceUnavailable(false);void poll()};
 window.addEventListener("focus",onFocus);
 const supabase=createClient();
 const channel=supabase.channel("dm-call-"+conversationId)
  .on("postgres_changes",{event:"*",schema:"public",table:"dm_calls",filter:"conversation_id=eq."+conversationId},()=>void poll())
  .subscribe();
 return()=>{alive=false;window.removeEventListener("focus",onFocus);void supabase.removeChannel(channel);clearInterval(timer);room.current?.disconnect();room.current=null}},[conversationId]);
 const start=async(mode:"audio"|"video")=>{setError("");try{await request({action:"invite",mode});const r=await fetch("/api/dm-calls?conversationId="+encodeURIComponent(conversationId));const d=await r.json();setCall(d.call??null)}catch(e){setError(e instanceof Error?e.message:"Could not call")}};
 useEffect(()=>{const onStart=(event:Event)=>{const mode=(event as CustomEvent<"audio"|"video">).detail;if(mode!=="audio"&&mode!=="video")return;if(callRef.current||serviceUnavailable)return;void start(mode)};window.addEventListener("1muslim:start-call",onStart);return()=>window.removeEventListener("1muslim:start-call",onStart)},[conversationId,serviceUnavailable]);
 const connect=async(id:string,mode:"audio"|"video")=>{
 if(connectingId.current===id||activeCallId.current===id)return;
 connectingId.current=id;setPhase("intro");setError("");setConnectionState("normal");
 try{const data=await request({action:"token",callId:id});const r=new Room({adaptiveStream:true,dynacast:true});room.current=r;
 r.on(RoomEvent.Reconnecting,()=>{setConnectionState("reconnecting");setError("Connection interrupted. Reconnecting…")});
 r.on(RoomEvent.Reconnected,()=>{setConnectionState("normal");setError("")});
 r.on(RoomEvent.Disconnected,()=>{if(room.current===r){activeCallId.current=null;connectingId.current=null;setConnectionState("failed");setError("Call disconnected. Tap Reconnect to try again.")}});
 r.on(RoomEvent.TrackSubscribed,(track,publication)=>{if(track.kind===Track.Kind.Video){if(publication.source===Track.Source.ScreenShare){setRemoteScreen(true);setTimeout(()=>{if(screenVideo.current)track.attach(screenVideo.current)},0)}else if(remote.current)track.attach(remote.current)}if(track.kind===Track.Kind.Audio&&remoteAudio.current)track.attach(remoteAudio.current)});
 r.on(RoomEvent.TrackUnsubscribed,(track,publication)=>{track.detach();if(publication.source===Track.Source.ScreenShare)setRemoteScreen(false)});
 
 r.on(RoomEvent.DataReceived,(payload,participant)=>{try{const d=JSON.parse(new TextDecoder().decode(payload));if(d.type==="call-chat"&&typeof d.body==="string")setChatMessages(v=>[...v.slice(-39),{sender:participant?.identity||"Peer",body:d.body.slice(0,500)}])}catch{}});
 await r.connect(data.url,data.token);await r.localParticipant.setMicrophoneEnabled(true);
 if(mode==="video"){await r.localParticipant.setCameraEnabled(true);const track=r.localParticipant.videoTrackPublications.values().next().value?.track;if(track&&local.current)track.attach(local.current)}
 activeCallId.current=id;completedCall.current=id;connectingId.current=null;
 setTimeout(()=>{if(room.current===r)setPhase("connected")},700);
 }catch(e){setError(e instanceof Error?e.message:"Could not connect");room.current?.disconnect();room.current=null;activeCallId.current=null;connectingId.current=null;setConnectionState("failed");setPhase("idle")}};
 const accept=async()=>{if(!call)return;try{await request({action:"accept",callId:call.id});setCall({...call,status:"accepted"});void connect(call.id,call.mode)}catch(e){setError(e instanceof Error?e.message:"Could not accept")}};
 const end=async()=>{const wasConnected=phase==="connected"||!!activeCallId.current;const endedId=call?.id;if(call)try{await request({action:"end",callId:call.id})}catch{}room.current?.disconnect();room.current=null;setSharingScreen(false);setRemoteScreen(false);activeCallId.current=null;connectingId.current=null;completedCall.current=null;setCall(null);setPhase("idle");setMinimized(false);setMiniPosition(null);if(wasConnected&&endedId){setRating(0);setRatingCallId(endedId)}else window.location.assign("/")};
 const finishRating=async(stars:number)=>{if(ratingBusy)return;setRatingBusy(true);if(stars&&ratingCallId){try{const key="1muslim:call-quality-ratings";const all=JSON.parse(localStorage.getItem(key)||"[]");localStorage.setItem(key,JSON.stringify([...all,{callId:ratingCallId,stars,createdAt:new Date().toISOString()}]));}catch{}}window.location.assign("/")};
 const voiceCommand=()=>{
  if(voiceListening){speechRef.current?.stop();setVoiceListening(false);return}
  const w=window as Window & {SpeechRecognition?:new()=>any;webkitSpeechRecognition?:new()=>any};
  const Speech=w.SpeechRecognition||w.webkitSpeechRecognition;
  if(!Speech){setVoiceNotice("Voice commands are not supported in this browser.");return}
  const recognition=new Speech();recognition.lang="en-US";recognition.continuous=false;recognition.interimResults=false;
  recognition.onresult=(event:any)=>{
   const phrase=String(event.results?.[0]?.[0]?.transcript||"").trim();
   const match=phrase.match(/^(?:hey\\s+)?hud\\s*hud[,\\s]+call\\s+(.+?)(?:\\s+on\\s+video)?[.!]?$/i);
   if(!match){setVoiceNotice('Try: "HudHud, call '+peerName+'".');return}
   const requested=match[1].trim().replace(/[.!]$/,"");
   if(requested.localeCompare(peerName.trim(),undefined,{sensitivity:"base"})!==0){setVoiceNotice('Open '+requested+'’s conversation to call them.');return}
   if(call||serviceUnavailable){setVoiceNotice("Calling is unavailable while another call is active.");return}
   setVoiceNotice("Calling "+peerName+"…");void start("video");
  };
  recognition.onerror=()=>{setVoiceNotice("Could not recognize your voice. Try again.");setVoiceListening(false)};
  recognition.onend=()=>{setVoiceListening(false);speechRef.current=null};
  try{recognition.start();speechRef.current=recognition;setVoiceListening(true);setVoiceNotice("Listening for: HudHud, call "+peerName)}catch{setVoiceNotice("Microphone unavailable.");setVoiceListening(false)}
 };
 useEffect(()=>()=>speechRef.current?.stop(),[]);
 const incoming=call?.status==="ringing"&&call.callee_id===userId;
 const outgoing=call?.status==="ringing"&&call.caller_id===userId;
 const [elapsed,setElapsed]=useState(0);
 useEffect(()=>{if(phase!=="connected"||call?.mode!=="audio")return;const r=room.current;if(!r)return;const tick=()=>{const participant=Array.from(r.remoteParticipants.values())[0];setAudioLevel(participant?.audioLevel??0)};tick();const t=setInterval(tick,120);return()=>clearInterval(t)},[phase,call?.mode]);
 const flip=async()=>{const r=room.current;if(!r||flipping)return;setFlipping(true);try{const pub=Array.from(r.localParticipant.videoTrackPublications.values())[0];const track=pub?.track;if(!track)throw Error("Camera unavailable");const current=track.mediaStreamTrack.getSettings().facingMode;await track.restartTrack({facingMode:current==="environment"?"user":"environment"});if(local.current)track.attach(local.current)}catch(e){setError(e instanceof Error?e.message:"Camera flip unavailable")}finally{setFlipping(false)}};
 const sendChat=async()=>{const body=chatDraft.trim();const r=room.current;if(!body||!r)return;try{await r.localParticipant.publishData(new TextEncoder().encode(JSON.stringify({type:"call-chat",body:body.slice(0,500)})),{reliable:true});setChatMessages(v=>[...v.slice(-39),{sender:"You",body:body.slice(0,500)}]);setChatDraft("")}catch{setError("Message could not be sent")}};
 const toggleScreenShare=async()=>{const r=room.current;if(!r||phase!=="connected")return;try{if(sharingScreen){await r.localParticipant.setScreenShareEnabled(false);setSharingScreen(false)}else{await r.localParticipant.setScreenShareEnabled(true);setSharingScreen(true);const pub=Array.from(r.localParticipant.videoTrackPublications.values()).find(p=>p.source===Track.Source.ScreenShare);pub?.track?.mediaStreamTrack.addEventListener("ended",()=>setSharingScreen(false),{once:true})}}catch(e){setError(e instanceof Error?e.message:"Screen sharing is unavailable in this browser")}};
 const switchSpeaker=async()=>{const el=remoteAudio.current;if(!el)return;const next=!speakerOn;el.muted=!next;setSpeakerOn(next)};

 useEffect(()=>{if(phase!=="connected"){setElapsed(0);return}const timer=setInterval(()=>setElapsed(v=>v+1),1000);return()=>clearInterval(timer)},[phase]);
 const [linkNotice,setLinkNotice]=useState("");
 const [openedFromLink,setOpenedFromLink]=useState(false);
 useEffect(()=>{const params=new URLSearchParams(window.location.search);if(params.get("call")==="1"&&params.get("conversation")===conversationId)setOpenedFromLink(true)},[conversationId]);
 const shareCall=async()=>{const url=window.location.origin+"/messages?conversation="+encodeURIComponent(conversationId)+"&call=1";try{if(navigator.share){await navigator.share({title:"Join my 1Muslim call",text:"Open this link to join our private 1Muslim call.",url});setLinkNotice("Call link shared")}else{await navigator.clipboard.writeText(url);setLinkNotice("Call link copied")}}catch(e){if((e as Error)?.name!=="AbortError")setLinkNotice("Could not share link")}};
 const duration=String(Math.floor(elapsed/60)).padStart(2,"0")+":"+String(elapsed%60).padStart(2,"0");
 return <><style>{`
 .mc-launch{display:flex;gap:9px;align-items:center;flex-wrap:wrap;padding:10px;border:1px solid #6ca88855;border-radius:16px;background:#102c2355}.mc-call-label{font-size:13px;font-weight:700;color:#d4f8de;margin-right:auto}.mc-link-hint{font-size:12px;color:#d4f8de;width:100%}.mc-launch button{display:grid;place-items:center;width:43px;height:43px;border:1px solid #6ca88855;background:#153a2b;color:#d4f8de;border-radius:50%;font-size:19px;cursor:pointer;transition:transform .2s,background .2s}.mc-launch button:hover{transform:translateY(-2px);background:#237a56}.mc-launch{background:linear-gradient(125deg,#0c2920e8,#103c2ce8);border:1px solid #48db9b80;box-shadow:0 12px 38px #06251a80,inset 0 1px #ffffff19}.mc-launch button{background:linear-gradient(145deg,#176547,#0c3a2a);border-color:#5bdb9c8c;box-shadow:0 3px 15px #22c55e3b}.mc-call-label{color:#e4fff1}.mc-launch button[title="Voice call"],.mc-launch button[title="Video call"]{background:linear-gradient(145deg,#26865a,#125037);color:#fff}.mc-launch button[title="Share call link"]{background:#ffffff12}.mc-launch button:disabled{opacity:.35;cursor:default}
 .mc-launch{display:grid;grid-template-columns:auto minmax(0,1fr) repeat(3,42px);align-items:center;gap:8px;padding:8px 10px;border-radius:16px;background:#15241ff2;border:1px solid #ffffff20;box-shadow:none}
 .mc-call-label{font-size:10px;letter-spacing:.16em;color:#a7c9b9;font-weight:800;margin:0}
 .mc-launch button{width:42px;height:42px;border-radius:13px;background:#ffffff0d;border:1px solid #ffffff1c;box-shadow:none;color:#e3f6ed;font-size:18px;transition:background .2s,transform .2s,box-shadow .2s}
 .mc-launch button[title="Voice call"],.mc-launch button[title="Video call"]{background:#1b4635;color:#dcfff0;border:1px solid #6bcd9870;box-shadow:none}
 .mc-launch button[title="Video call"]{background:#235d45}
 .mc-launch button[title="Share call link"]{background:#ffffff0b}
 .mc-launch button:hover:not(:disabled){transform:translateY(-2px);background:#2c7854;box-shadow:0 5px 14px #0003}
 .mc-launch button:active:not(:disabled){transform:scale(.94)}
 .mc-link-hint{grid-column:1/-1}
 @media(max-width:390px){.mc-launch{grid-template-columns:auto minmax(0,1fr) repeat(3,38px);gap:5px;padding:7px}.mc-launch button{width:38px;height:38px}}
 @media(prefers-reduced-motion:reduce){.mc-launch button{transition:none}}
 .persistentMessengerCall{position:relative;z-index:15000}
 .persistentMessengerCall .mc-launch{position:fixed;right:14px;bottom:calc(env(safe-area-inset-bottom) + 88px);z-index:1050;width:min(340px,calc(100vw - 28px));box-sizing:border-box}
 .persistentMessengerCall.offMessages .mc-launch{display:none}
 .mc-headerActions{display:flex;align-items:center;gap:8px}
 .mc-minimize{border:1px solid #ffffff40;background:#ffffff25;color:white;border-radius:12px;padding:7px 12px;font-size:22px;cursor:pointer;position:relative;z-index:10}
 .mc-screen--mini{inset:auto 12px calc(env(safe-area-inset-bottom) + 82px) auto;width:min(215px,48vw);height:255px;border-radius:21px;border:1px solid #9ee2b366;overflow:hidden;box-shadow:0 14px 45px #0009;animation:mcShrink .25s ease-out}
 .mc-screen--mini .mc-shell{padding:8px;background:#0b1919}
 .mc-screen--mini .mc-stage{position:absolute;inset:0;width:100%;height:100%}
 .mc-screen--mini .mc-remote{width:100%;height:100%;object-fit:cover}
 .mc-screen--mini .mc-self{width:62px;height:82px;right:8px;bottom:55px}
 .mc-screen--mini .mc-header{position:absolute;top:5px;right:5px;left:5px;width:auto;z-index:8;justify-content:flex-end;touch-action:none;cursor:grab;min-height:38px}.mc-screen--mini .mc-header:active{cursor:grabbing}.mc-screen--mini .mc-headerActions{pointer-events:auto}
 .mc-screen--mini .mc-brand,.mc-screen--mini .mc-private,.mc-screen--mini .mc-center,.mc-screen--mini .mc-effect-badge,.mc-screen--mini .mc-camera-effects,.mc-screen--mini .mc-menu,.mc-screen--mini .mc-chat{display:none!important}
 .mc-screen--mini .mc-controls{position:absolute;bottom:5px;left:5px;right:5px;display:flex;justify-content:center;gap:5px;z-index:9;padding:0;background:transparent}
 .mc-screen--mini .mc-control{display:none!important}
 .mc-screen--mini .mc-control:has(.mc-end){display:flex!important}
 .mc-screen--mini .mc-control span{display:none}
 .mc-screen--mini .mc-control button{width:35px;height:35px;font-size:17px}
 .mc-screen--mini .mc-quranShortcut{position:absolute;bottom:8px;left:8px;z-index:10;border:1px solid #ffffff4d;background:#073b2cdd;color:#fff;padding:8px;border-radius:999px;font-size:10px;font-weight:700}
 @keyframes mcShrink{from{opacity:.7;transform:scale(1.07)}to{opacity:1;transform:scale(1)}}
 @media(prefers-reduced-motion:reduce){.mc-screen--mini{animation:none}}
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
 <div className="mc-launch"><button type="button" onClick={voiceCommand} aria-label={voiceListening?"Stop HudHud listening":"Enable HudHud voice commands"} aria-pressed={voiceListening} title={voiceListening?"HudHud is listening — tap to stop":"Tap to speak to HudHud"} style={voiceListening?{animation:"mcBreathe 2s ease-in-out infinite",boxShadow:"0 0 24px #4ade80",background:"radial-gradient(circle,#4ade80,#15803d)",borderColor:"#86efac"}:{}}>{voiceListening?"🌀":"🎙"}</button><span className="mc-call-label">CALLS</span><button type="button" title="Share call link" aria-label="Share link to this 1Muslim call" onClick={()=>void shareCall()}>↗</button>{linkNotice&&<span role="status" style={{fontSize:12}}>{linkNotice}</span>}<button type="button" title="Voice call" aria-label="Start private voice call" onClick={()=>void start("audio")} disabled={!!call||serviceUnavailable}><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5.5 3.8 9 7.2 7.1 9.5a15 15 0 0 0 7.4 7.4l2.3-1.9 3.4 3.5-2 2c-.8.8-2 .9-3.1.5A20.5 20.5 0 0 1 3 8.9c-.4-1.1-.3-2.3.5-3.1l2-2Z"/></svg></button><button type="button" title="Video call" aria-label="Start private video call" onClick={()=>void start("video")} disabled={!!call||serviceUnavailable}><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2.5" y="5" width="13.5" height="14" rx="3"/><path d="m16 10 5.5-3v10L16 14"/></svg></button>{openedFromLink&&!call&&<span className="mc-link-hint" role="status">This call is not ringing right now. Start a voice or video call above, or wait for the other member to call.</span>}</div>
 {voiceNotice&&<p role="status" style={{fontSize:12,color:"#86efac"}}>{voiceNotice}</p>}
 {error&&<p role="alert" style={{color:"#fca5a5"}}>{error}</p>}
 {ratingCallId&&<div role="dialog" aria-modal="true" aria-label="Rate call quality" style={{position:"fixed",inset:0,zIndex:9999,display:"grid",placeItems:"center",background:"rgba(2,18,13,.83)",backdropFilter:"blur(18px)",padding:20}}><div style={{width:"min(100%,360px)",border:"1px solid #77caa755",borderRadius:26,padding:28,textAlign:"center",background:"linear-gradient(150deg,#173d30,#071b16)",color:"#f1fff6",boxShadow:"0 22px 65px #0009"}}><div style={{fontSize:13,letterSpacing:2,opacity:.65}}>1MUSLIM CALLS</div><h2 style={{fontSize:22,margin:"14px 0 6px"}}>How was your call?</h2><p style={{fontSize:13,opacity:.7}}>Rate the connection quality</p><div style={{display:"flex",justifyContent:"center",gap:6,margin:"22px 0"}}>{[1,2,3,4,5].map(n=><button key={n} type="button" aria-label={n+" stars"} onClick={()=>setRating(n)} style={{border:0,background:"none",fontSize:37,color:n<=rating?"#f4d48b":"#9ab3a6",opacity:n<=rating?1:.5,cursor:"pointer"}}>{n<=rating?"★":"☆"}</button>)}</div><button disabled={!rating||ratingBusy} onClick={()=>void finishRating(rating)} style={{width:"100%",padding:13,border:0,borderRadius:16,background:"#66d59b",color:"#09251a",fontWeight:700,opacity:rating?1:.45}}>Submit & Return Home</button><button onClick={()=>void finishRating(0)} style={{marginTop:13,background:"none",border:0,color:"#d2ebdc",opacity:.7,cursor:"pointer"}}>Skip · Return Home</button></div></div>}
 {call&&<div ref={miniPanel} className={"mc-screen "+(minimized?"mc-screen--mini":"")} style={minimized&&miniPosition?{left:miniPosition.x,top:miniPosition.y,right:"auto",bottom:"auto"}:undefined} role="dialog" aria-modal={!minimized} aria-label="1Muslim Messenger call"><div className="mc-shell">
 {phase==="intro"&&<video className="mc-intro" src="/videos/prelive-intro.mp4" autoPlay muted playsInline/>}
 {phase==="connected"&&(call.mode==="video"||remoteScreen)&&<div className="mc-stage"><video ref={remote} className="mc-remote" autoPlay playsInline style={{display:remoteScreen?"none":"block"}}/><video ref={screenVideo} autoPlay playsInline style={{display:remoteScreen?"block":"none",width:"100%",height:"100%",objectFit:"contain",background:"#050c0a"}}/><video ref={local} className="mc-self" autoPlay muted playsInline/>{cameraEffects&&<div className={"mc-camera-effects "+cameraEffect} aria-hidden="true">{cameraEffect==="stars"&&Array.from({length:15},(_,i)=><i key={i} style={{["--i" as string]:i} as React.CSSProperties}/>)}</div>}<button type="button" className="mc-effect-badge" onClick={()=>setCameraEffect(v=>v==="glow"?"stars":v==="stars"?"soft":"glow")} aria-label="Change camera overlay effect">✨ {cameraEffects?cameraEffect:"Effects off"}</button></div>}
 <div className="mc-header" onPointerDown={onMiniPointerDown} onPointerMove={onMiniPointerMove} onPointerUp={onMiniPointerUp} onPointerCancel={onMiniPointerUp} aria-label={minimized?"Drag to move minimized call":undefined}><span className="mc-brand" style={{display:"flex",alignItems:"center",gap:9}}><span style={{width:32,height:32,borderRadius:12,display:"grid",placeItems:"center",background:"linear-gradient(140deg,#edc66d,#8c5a20)",color:"#101522",fontSize:22,fontWeight:900,boxShadow:"0 0 18px #e4b45555"}}>1</span>1MUSLIM <span style={{color:"#a8ebc3"}}>MESSENGER</span></span><div className="mc-headerActions">{phase==="connected"&&<button type="button" className="mc-minimize" onClick={()=>setMinimized(v=>!v)} aria-label={minimized?"Expand call":"Minimize call"}>{minimized?"⤢":"↙"}</button>}<span className="mc-private">🔒 Private {call.mode==="video"?"video":"audio"} call</span></div></div>
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
 {minimized&&<button className="mc-quranShortcut" type="button" onClick={()=>router.push("/quran-studio")}>📖 Read Quran</button>}
 <div className="mc-controls"><div className="mc-control"><button type="button" onClick={()=>void shareCall()} aria-label="Share this call link">↗</button><span>Share link</span></div>
 {incoming&&<div className="mc-control"><button type="button" className="mc-answer" onClick={()=>void accept()} aria-label="Accept call">✓</button><span>Accept</span></div>}
 {call.status==="accepted"&&phase==="idle"&&<div className="mc-control"><button type="button" className="mc-answer" onClick={()=>void connect(call.id,call.mode)} aria-label="Join call">↗</button><span>Join</span></div>}
 {call.status==="accepted"&&connectionState==="failed"&&<div className="mc-control"><button type="button" className="mc-answer" onClick={()=>void connect(call.id,call.mode)} aria-label="Reconnect call">↻</button><span>Reconnect</span></div>}
 {connectionState==="reconnecting"&&<span role="status" aria-live="polite">Reconnecting…</span>}
 {phase==="connected"&&<><div className="mc-control"><button type="button" onClick={()=>void toggleScreenShare()} aria-pressed={sharingScreen} aria-label={sharingScreen?"Stop sharing screen":"Share screen"} title="Share screen">{sharingScreen?"▣":"▤"}</button><span>{sharingScreen?"Stop share":"Screen"}</span></div><div className="mc-control"><button type="button" aria-label={muted?"Unmute microphone":"Mute microphone"} aria-pressed={muted} onClick={()=>{const r=room.current;if(r){void r.localParticipant.setMicrophoneEnabled(muted);setMuted(!muted)}}}>{muted?"🔇":"🎙"}</button><span>{muted?"Unmute":"Mute"}</span></div>
 {call.mode==="video"&&<div className="mc-control"><button type="button" aria-label={cameraOff?"Turn camera on":"Turn camera off"} aria-pressed={cameraOff} onClick={()=>{const r=room.current;if(r){void r.localParticipant.setCameraEnabled(cameraOff);setCameraOff(!cameraOff)}}}>{cameraOff?"◩":"▣"}</button><span>Camera</span></div>}{call.mode==="video"&&<div className="mc-control"><button type="button" onClick={()=>void flip()} disabled={flipping} aria-label="Flip camera">🔄</button><span>Flip</span></div>}<div className="mc-control"><button type="button" onClick={()=>void switchSpeaker()} aria-pressed={!speakerOn} aria-label="Toggle speaker">{speakerOn?"🔊":"🔈"}</button><span>Speaker</span></div><div className="mc-control"><button type="button" onClick={()=>setShowChat(v=>!v)} aria-label="Call messages">💬</button><span>Message</span></div><div className="mc-control"><button type="button" onClick={()=>setMenuOpen(v=>!v)} aria-label="Call settings">⋯</button><span>More</span></div></>}
 <div className="mc-control"><button type="button" className="mc-end" onClick={()=>void end()} aria-label={incoming?"Decline call":"End call"}>✕</button><span>{incoming?"Decline":"End"}</span></div>
 </div>
 </div></div>}
 </>;
}
