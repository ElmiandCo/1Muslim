"use client";
import {useEffect,useRef,useState} from "react";
import {usePathname,useRouter} from "next/navigation";
import {Room,RoomEvent,Track} from "livekit-client";
import {createClient} from "../../utils/supabase/client";
type Session={id:string;initiator_id:string;invitee_id:string;status:string;current_page:string};
export default function PersistentMuslimSync(){
 const pathname=usePathname(),router=useRouter(),[db]=useState(()=>createClient());
 const [panelOpen,setPanelOpen]=useState(false),[dismissedInvite,setDismissedInvite]=useState<string|null>(null),[audioReady,setAudioReady]=useState(false),[voiceState,setVoiceState]=useState("Connecting voice…");
 const remoteWorkspaceUntil=useRef(0),lastSyncedWorkspace=useRef(-1);
 const [uid,setUid]=useState(""),[session,setSession]=useState<Session|null>(null),[error,setError]=useState(""),[muted,setMuted]=useState(false),[inviteId,setInviteId]=useState(""),[expanded,setExpanded]=useState(false),[deepWatch,setDeepWatch]=useState(false);
 const room=useRef<Room|null>(null),remotePage=useRef(""),lastPage=useRef(pathname);
 useEffect(()=>{let alive=true;void db.auth.getUser().then(({data})=>{if(alive)setUid(data.user?.id||"")});return()=>{alive=false}},[db]);
 useEffect(()=>{if(!uid)return;let alive=true;const check=async()=>{
 const {data}=await db.from("muslim_sync_sessions").select("id,initiator_id,invitee_id,status,current_page").or(`initiator_id.eq.${uid},invitee_id.eq.${uid}`).in("status",["pending","accepted"]).order("created_at",{ascending:false}).limit(5);
 if(!alive)return;const active=(data||[]).find(s=>s.status==="accepted")||(data||[]).find(s=>s.invitee_id===uid&&s.status==="pending")||null;
 setSession(active);
 };void check();const timer=setInterval(()=>void check(),1800);return()=>{alive=false;clearInterval(timer)}},[db,uid]);
 useEffect(()=>{if(session?.status!=="accepted"){if(room.current){void room.current.disconnect();room.current=null}return}
 let cancelled=false;const connect=async()=>{try{
 const response=await fetch("/api/muslim-sync/token",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:session.id})});
 const json=await response.json();if(!response.ok)throw Error(json.error||"Voice connection failed");
 if(cancelled)return;const r=new Room();room.current=r;
 r.on(RoomEvent.TrackSubscribed,track=>{if(track.kind!==Track.Kind.Audio)return;const el=track.attach();el.setAttribute("data-muslim-sync-audio","true");el.setAttribute("autoplay","true");el.style.display="none";document.body.appendChild(el);void (el as HTMLMediaElement).play().catch(()=>setVoiceState("Tap Enable Audio to hear your guest"))});
 r.on(RoomEvent.TrackUnsubscribed,track=>track.detach().forEach(el=>el.remove()));
 await r.connect(json.url,json.token);if(cancelled)return;await r.startAudio().then(()=>setAudioReady(true)).catch(()=>setVoiceState("Tap Enable Audio to hear your guest"));await r.localParticipant.setMicrophoneEnabled(true);setVoiceState("Voice connected");
 }catch(e){if(!cancelled){setVoiceState("Voice unavailable");setError(e instanceof Error?e.message:"Unable to connect voice")}}};
 void connect();return()=>{cancelled=true;void room.current?.disconnect();room.current=null;document.querySelectorAll("[data-muslim-sync-audio]").forEach(e=>e.remove())}},[session?.id,session?.status]);
 useEffect(()=>{if(session?.status!=="accepted")return;const next=session.current_page;if(!next)return;
 const match=next.match(/^\/\?pingWorkspace=(\d+)$/);
 if(match){const index=Number(match[1]);if(index>=0&&index<=6&&pathname==="/"){if(index!==lastSyncedWorkspace.current){remoteWorkspaceUntil.current=Date.now()+3000;lastSyncedWorkspace.current=index;window.dispatchEvent(new CustomEvent("1muslim:ping-remote-workspace",{detail:{index}}))}return}
 if(pathname!=="/"){remotePage.current="/";router.push("/");}return}
 if(next!==pathname&&next.startsWith("/")&&!next.startsWith("//")&&!next.includes("://")&&!next.startsWith("/messages/sync")){remotePage.current=next;router.push(next)}
 },[session?.current_page,session?.status,pathname,router]);
 useEffect(()=>{if(session?.status!=="accepted"||!pathname||pathname==="/messages/sync")return;if(remotePage.current===pathname){remotePage.current="";lastPage.current=pathname;return}if(lastPage.current===pathname)return;lastPage.current=pathname;if(session.initiator_id!==uid)return;void db.from("muslim_sync_sessions").update({current_page:pathname}).eq("id",session.id).eq("status","accepted")},[pathname,session?.id,session?.status,session?.initiator_id,uid,db]);
 useEffect(()=>{if(session?.status!=="accepted"||pathname!=="/")return;
 const onWorkspace=(event:Event)=>{const index=(event as CustomEvent<{index:number}>).detail?.index;if(session.initiator_id!==uid||!Number.isInteger(index)||index<0||index>6||Date.now()<remoteWorkspaceUntil.current)return;
 const target="/?pingWorkspace="+index;if(session.current_page===target)return;
 lastSyncedWorkspace.current=index;
 void db.from("muslim_sync_sessions").update({current_page:target}).eq("id",session.id).eq("status","accepted").then(({error:e})=>{if(e)setError("Navigation sync: "+e.message)})};
 window.addEventListener("1muslim:ping-local-workspace",onWorkspace);return()=>window.removeEventListener("1muslim:ping-local-workspace",onWorkspace)
 },[session?.id,session?.status,session?.current_page,session?.initiator_id,uid,pathname,db]);
 const inviteMore=async()=>{if(!session||session.status!=="accepted")return;if(!/^[0-9a-f-]{36}$/i.test(inviteId)){setError("Enter a valid member ID.");return}const {error:e}=await db.from("muslim_sync_members").insert({session_id:session.id,user_id:inviteId});setError(e?.message||"GroupSync invitation sent.");if(!e)setInviteId("")};
 useEffect(()=>{if(!deepWatch)return;const timer=setTimeout(()=>setDeepWatch(false),30000);return()=>clearTimeout(timer)},[deepWatch]);
 const respond=async(status:"accepted"|"declined"|"ended")=>{if(!session)return;const {error:e}=await db.from("muslim_sync_sessions").update({status}).eq("id",session.id);if(e)setError(e.message);else if(status!=="accepted")setSession(null)};
 if(!uid||!session)return null;
 const incoming=session.status==="pending"&&session.invitee_id===uid;
 const isLeader=session.initiator_id===uid;
 const followerDeepWatch=session.status==="accepted"&&!isLeader;
 const showPanel=(incoming&&dismissedInvite!==session.id)||panelOpen;
 const closePanel=()=>{setPanelOpen(false);if(incoming)setDismissedInvite(session.id)};
 const actionStyle:React.CSSProperties={border:"1px solid rgba(255,255,255,.23)",borderRadius:22,padding:"12px 18px",background:"rgba(255,255,255,.09)",color:"white",backdropFilter:"blur(18px)",fontWeight:600,cursor:"pointer"};
 return <><button aria-label={showPanel?"Hide Ping controls":"Show Ping controls"} onClick={()=>{if(showPanel)closePanel();else{setDismissedInvite(null);setPanelOpen(true)}}} style={{position:"fixed",right:12,bottom:86,zIndex:2147483001,borderRadius:40,padding:"9px 14px",background:"rgba(10,20,25,.32)",backdropFilter:"blur(20px)",color:"white",border:"1px solid #ffffff55"}}>🔗 {showPanel?"✕":"Ping"}</button>{showPanel&&<><div aria-label="Dismiss Ping panel" onClick={closePanel} style={{position:"fixed",inset:0,zIndex:2147482999,background:"rgba(2,9,15,.26)",backdropFilter:"blur(7px)"}}/><aside role="dialog" aria-label="Ping session controls" style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",zIndex:2147483000,width:"min(100%,540px)",maxHeight:"min(76dvh,680px)",overflowY:"auto",padding:"14px 22px max(28px,env(safe-area-inset-bottom))",borderRadius:"30px 30px 0 0",background:"linear-gradient(160deg,rgba(22,35,46,.48),rgba(5,12,21,.38))",backdropFilter:"blur(34px) saturate(145%)",WebkitBackdropFilter:"blur(34px) saturate(145%)",color:"white",border:"1px solid rgba(255,255,255,.23)",boxShadow:"0 -18px 70px #0005",fontSize:15,animation:"pingSlideUp .32s cubic-bezier(.2,.8,.2,1) both"}}><style>{`@keyframes pingSlideUp{from{opacity:0;transform:translate(-50%,100%)}to{opacity:1;transform:translate(-50%,0)}}`}</style><div style={{width:44,height:4,borderRadius:8,background:"rgba(255,255,255,.48)",margin:"0 auto 18px"}}/> <strong style={{fontSize:19}}>🔗 Ping · {session.status==="accepted"?(isLeader?"Leader":"Follower"):"Invitation"}</strong><button aria-label="Close Ping menu" onClick={closePanel} style={{float:"right",color:"white",background:"transparent",border:0,fontSize:20}}>✕</button><p style={{margin:"8px 0"}}>{session.status==="pending"?(session.invitee_id===uid?"A member wants to connect by voice and share navigation. Accept?":"Waiting for member to accept…") : (isLeader?"You are leading · Others follow your swipes · ":"Following host navigation · Wide DeepWatch active · ")+voiceState}</p>
 {error&&<p role="alert">{error}</p>}
 <div style={{display:"flex",gap:9,flexWrap:"wrap",marginTop:18}}>{session.status==="accepted"&&!audioReady&&<button style={actionStyle} onClick={()=>{void room.current?.startAudio().then(()=>{setAudioReady(true);setVoiceState("Voice active")}).catch(()=>setVoiceState("Audio blocked by browser"))}}>🔊 Enable Audio</button>}{session.status==="pending"&&session.invitee_id===uid&&<><button onClick={()=>void respond("accepted")} style={{...actionStyle,background:"rgba(65,225,182,.22)"}}>Yes · Connect</button><button onClick={()=>void respond("declined")} style={actionStyle}>No</button></>}
 {session.status==="accepted"&&<button style={actionStyle} onClick={()=>{const next=!muted;setMuted(next);void room.current?.localParticipant.setMicrophoneEnabled(!next)}}>{muted?"Unmute":"Mute"}</button>}
 <button style={actionStyle} onClick={()=>void respond("ended")}>✕ End Sync</button>{session.status==="accepted"&&<button style={actionStyle} onClick={()=>setExpanded(v=>!v)}>＋ GroupSync</button>}</div>{expanded&&session.status==="accepted"&&<div style={{marginTop:10}}><input aria-label="Invite member ID" value={inviteId} onChange={e=>setInviteId(e.target.value.trim())} placeholder="Member ID" style={{padding:8,borderRadius:9,color:"#111",maxWidth:"100%"}}/><button style={actionStyle} onClick={()=>void inviteMore()}>Invite</button></div>}
 </aside></>}{session.status==="accepted"&&<><button aria-label={muted?"Unmute Sync":"Mute Sync"} onClick={()=>{const next=!muted;setMuted(next);void room.current?.localParticipant.setMicrophoneEnabled(!next)}} style={{position:"fixed",bottom:18,left:"50%",transform:"translateX(-50%)",zIndex:2147483001,background:"rgba(10,25,30,.35)",border:"1px solid #ffffff55",backdropFilter:"blur(14px)",color:"white",borderRadius:30,padding:"12px 22px"}}>{muted?"🔇 Unmute":"🎙️ Mute"}</button><button onPointerDown={e=>{const target=e.currentTarget;target.dataset.timer=String(window.setTimeout(()=>setDeepWatch(true),3000))}} onPointerUp={e=>{clearTimeout(Number(e.currentTarget.dataset.timer))}} onPointerCancel={e=>clearTimeout(Number(e.currentTarget.dataset.timer))} aria-label="Hold three seconds for Wide DeepWatch" style={{position:"fixed",bottom:18,left:12,zIndex:2147483001,borderRadius:24,padding:12,color:"white",background:"rgba(10,25,30,.3)",border:"1px solid #ffffff44"}}>◉ DeepWatch</button>{(deepWatch||followerDeepWatch)&&<div role="status" style={{position:"fixed",inset:0,zIndex:2147482999,pointerEvents:"none",border:"2px solid #49dfff88",boxShadow:"inset 0 0 240px 90px #49dfff24, inset 0 0 90px 35px #49dfff18",borderRadius:24}}><span style={{position:"absolute",top:20,left:20,color:"#9ef8ff",background:"#071c26aa",padding:10,borderRadius:12}}>{followerDeepWatch?"Wide DeepWatch · Following host":"Wide DeepWatch · Sync"}</span></div>}</>}</>;
}
