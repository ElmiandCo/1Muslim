"use client";
import {useEffect,useRef,useState} from "react";
import {usePathname,useRouter} from "next/navigation";
import {Room,RoomEvent,Track} from "livekit-client";
import {createClient} from "../../utils/supabase/client";
import PingParticipantGallery from "./PingParticipantGallery";
type Session={id:string;initiator_id:string;invitee_id:string;status:string;current_page:string};
export default function PersistentMuslimSync(){
 const pathname=usePathname(),router=useRouter(),[db]=useState(()=>createClient());
 const [galleryOpen,setGalleryOpen]=useState(false),[memberInvite,setMemberInvite]=useState<{session_id:string;status:string}|null>(null);
 const [panelOpen,setPanelOpen]=useState(false),[dismissedInvite,setDismissedInvite]=useState<string|null>(null),[audioReady,setAudioReady]=useState(false),[voiceState,setVoiceState]=useState("Connecting voice…");
 const remoteWorkspaceUntil=useRef(0),lastSyncedWorkspace=useRef(-1);
 const [uid,setUid]=useState(""),[session,setSession]=useState<Session|null>(null),[error,setError]=useState(""),[muted,setMuted]=useState(false),[inviteId,setInviteId]=useState(""),[expanded,setExpanded]=useState(false),[deepWatch,setDeepWatch]=useState(false);
 const [syncReady,setSyncReady]=useState(false),[syncStatus,setSyncStatus]=useState("Aligning screens…");
 const readyAck=useRef(""),lastApplied=useRef("");
 const room=useRef<Room|null>(null),remotePage=useRef(""),lastPage=useRef(pathname);
 useEffect(()=>{let alive=true;void db.auth.getUser().then(({data})=>{if(alive)setUid(data.user?.id||"")});return()=>{alive=false}},[db]);
 useEffect(()=>{if(!uid)return;let alive=true;const check=async()=>{
 const {data}=await db.from("muslim_sync_sessions").select("id,initiator_id,invitee_id,status,current_page").or(`initiator_id.eq.${uid},invitee_id.eq.${uid}`).in("status",["pending","accepted"]).order("created_at",{ascending:false}).limit(5);
 if(!alive)return;const active=(data||[]).find(s=>s.status==="accepted")||(data||[]).find(s=>s.invitee_id===uid&&s.status==="pending")||null;
 setSession(active);
 const {data:invites}=await db.from("muslim_sync_members").select("session_id,status").eq("user_id",uid).in("status",["pending","accepted"]).order("created_at",{ascending:false}).limit(5);
 if(!alive)return;
 const member=(invites||[]).find(m=>m.status==="accepted")||(invites||[]).find(m=>m.status==="pending")||null;
 setMemberInvite(member);
 if(!active&&member?.status==="accepted"){const {data:joined}=await db.from("muslim_sync_sessions").select("id,initiator_id,invitee_id,status,current_page").eq("id",member.session_id).maybeSingle();if(alive&&joined?.status==="accepted")setSession(joined)}
 };void check();
 const channel=db.channel("ping-session-list-"+uid).on("postgres_changes",{event:"*",schema:"public",table:"muslim_sync_sessions"},()=>void check()).subscribe();
 const timer=setInterval(()=>void check(),10000);return()=>{alive=false;clearInterval(timer);void db.removeChannel(channel)}},[db,uid]);
 useEffect(()=>{if(!session?.id||session.status!=="accepted"){setSyncReady(false);readyAck.current="";return}
 let active=true;setSyncReady(false);setSyncStatus("Aligning screens…");
 const channel=db.channel("ping-handshake-"+session.id);
 channel.on("broadcast",{event:"ready"},({payload})=>{if(!active||session.initiator_id!==uid||payload?.sessionId!==session.id||payload?.userId!==session.invitee_id)return;setSyncReady(true);setSyncStatus("DeepSync connected")});
 channel.on("postgres_changes",{event:"UPDATE",schema:"public",table:"muslim_sync_sessions",filter:"id=eq."+session.id},payload=>{const row=payload.new as Session;if(!active)return;setSession(prev=>prev?.id===row.id?{...prev,...row}:prev)});
 channel.subscribe(status=>{if(status==="SUBSCRIBED"&&session.initiator_id===uid)setSyncStatus("Waiting for follower to align…")});
 return()=>{active=false;void db.removeChannel(channel)}
 },[db,session?.id,session?.status,session?.initiator_id,session?.invitee_id,uid]);
 useEffect(()=>{if(session?.status!=="accepted"||session.initiator_id===uid||!session.current_page)return;
 const target=session.current_page;
 const matched=target.startsWith("/?pingWorkspace=")?pathname==="/"&&lastSyncedWorkspace.current===Number(target.split("=")[1]):target.startsWith("/elm-tent/quran?verse=")?pathname==="/elm-tent/quran"&&lastApplied.current===target:pathname===target;
 if(!matched||readyAck.current===target)return;
 readyAck.current=target;setSyncReady(true);setSyncStatus("DeepSync connected");
 const channel=db.channel("ping-handshake-"+session.id);
 channel.subscribe(status=>{if(status==="SUBSCRIBED"){void channel.send({type:"broadcast",event:"ready",payload:{sessionId:session.id,userId:uid,page:target}}).finally(()=>{void db.removeChannel(channel)})}});
 },[db,session?.id,session?.status,session?.current_page,session?.initiator_id,uid,pathname]);
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
 useEffect(()=>{if(session?.status!=="accepted"||session.initiator_id===uid)return;const next=session.current_page;if(!next)return;
 const verseMatch=next.match(/^\/elm-tent\/quran\?verse=((?:[1-9]|[1-9][0-9]|1[01][0-4]):[1-9][0-9]{0,2})$/);
 if(verseMatch){if(pathname==="/elm-tent/quran"){remotePage.current=pathname;lastApplied.current=next;window.dispatchEvent(new CustomEvent("1muslim:ping-remote-verse",{detail:{verseKey:verseMatch[1]}}));return}remotePage.current="/elm-tent/quran";router.push(next);return}
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
 useEffect(()=>{if(session?.status!=="accepted"||session.initiator_id!==uid||pathname!=="/elm-tent/quran")return;
 const onVerse=(event:Event)=>{const key=(event as CustomEvent<{verseKey:string}>).detail?.verseKey;if(!/^([1-9]|[1-9][0-9]|1[01][0-4]):[1-9][0-9]{0,2}$/.test(key||""))return;const target="/elm-tent/quran?verse="+key;if(session.current_page===target)return;void db.from("muslim_sync_sessions").update({current_page:target}).eq("id",session.id).eq("initiator_id",uid).eq("status","accepted").then(({error:e})=>{if(e)setError("Verse sync: "+e.message)})};
 window.addEventListener("1muslim:ping-local-verse",onVerse);return()=>window.removeEventListener("1muslim:ping-local-verse",onVerse)},[db,session?.id,session?.status,session?.initiator_id,session?.current_page,uid,pathname]);
 const respondMember=async(status:"accepted"|"declined")=>{if(!memberInvite)return;const {error:e}=await db.from("muslim_sync_members").update({status}).eq("session_id",memberInvite.session_id).eq("user_id",uid).eq("status","pending");if(e)setError(e.message);else{setMemberInvite({...memberInvite,status});if(status==="accepted")window.location.reload()}};
 const inviteMore=async()=>{if(!session||session.status!=="accepted")return;if(!/^[0-9a-f-]{36}$/i.test(inviteId)){setError("Enter a valid member ID.");return}const {error:e}=await db.from("muslim_sync_members").insert({session_id:session.id,user_id:inviteId});setError(e?.message||"GroupSync invitation sent.");if(!e)setInviteId("")};
 useEffect(()=>{if(!deepWatch)return;const timer=setTimeout(()=>setDeepWatch(false),30000);return()=>clearTimeout(timer)},[deepWatch]);
 const respond=async(status:"accepted"|"declined"|"ended")=>{if(!session)return;const {error:e}=await db.from("muslim_sync_sessions").update({status}).eq("id",session.id);if(e)setError(e.message);else if(status!=="accepted")setSession(null)};
 if(!uid)return null;
 if(!session&&memberInvite?.status==="pending")return <div style={{position:"fixed",bottom:30,left:"50%",transform:"translateX(-50%)",zIndex:2147483000,background:"#152b36dd",backdropFilter:"blur(22px)",padding:18,borderRadius:22,color:"white",boxShadow:"0 0 45px #0007"}}>◉ 1Muslim Ping · Group invitation<div style={{display:"flex",gap:10,marginTop:12}}><button onClick={()=>void respondMember("accepted")}>Yes · Join</button><button onClick={()=>void respondMember("declined")}>No</button></div>{error&&<p role="alert">{error}</p>}</div>;
 if(!session)return null;
 const incoming=session.status==="pending"&&session.invitee_id===uid;
 const isLeader=session.initiator_id===uid;
 const followerDeepWatch=session.status==="accepted"&&!isLeader;
 const showPanel=(incoming&&dismissedInvite!==session.id)||panelOpen;
 const closePanel=()=>{setPanelOpen(false);if(incoming)setDismissedInvite(session.id)};
 const actionStyle:React.CSSProperties={border:"1px solid rgba(255,255,255,.23)",borderRadius:22,padding:"12px 18px",background:"rgba(255,255,255,.09)",color:"white",backdropFilter:"blur(18px)",fontWeight:600,cursor:"pointer"};
 return <>{galleryOpen&&session.status==="accepted"&&<PingParticipantGallery sessionId={session.id} uid={uid} onClose={()=>setGalleryOpen(false)}/>}<button aria-label={showPanel?"Hide Ping controls":"Show Ping controls"} onClick={()=>{if(showPanel)closePanel();else{setDismissedInvite(null);setPanelOpen(true)}}} style={{position:"fixed",right:12,bottom:86,zIndex:2147483001,borderRadius:40,padding:"9px 14px",background:"rgba(10,20,25,.32)",backdropFilter:"blur(20px)",color:"white",border:"1px solid #ffffff55"}}>🔗 {showPanel?"✕":"Ping"}</button>{showPanel&&<><div aria-label="Dismiss Ping panel" onClick={closePanel} style={{position:"fixed",inset:0,zIndex:2147482999,background:"rgba(2,9,15,.26)",backdropFilter:"blur(7px)"}}/><aside role="dialog" aria-label="Ping session controls" style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",zIndex:2147483000,width:"min(100%,540px)",maxHeight:"min(76dvh,680px)",overflowY:"auto",padding:"14px 22px max(28px,env(safe-area-inset-bottom))",borderRadius:"30px 30px 0 0",background:"linear-gradient(160deg,rgba(22,35,46,.48),rgba(5,12,21,.38))",backdropFilter:"blur(34px) saturate(145%)",WebkitBackdropFilter:"blur(34px) saturate(145%)",color:"white",border:"1px solid rgba(255,255,255,.23)",boxShadow:"0 -18px 70px #0005",fontSize:15,animation:"pingSlideUp .32s cubic-bezier(.2,.8,.2,1) both"}}><style>{`@keyframes pingSlideUp{from{opacity:0;transform:translate(-50%,100%)}to{opacity:1;transform:translate(-50%,0)}}`}</style><div style={{width:44,height:4,borderRadius:8,background:"rgba(255,255,255,.48)",margin:"0 auto 18px"}}/> <strong style={{fontSize:19}}>🔗 Ping · {session.status==="accepted"?(isLeader?"Leader":"Follower"):"Invitation"}</strong><button aria-label="Close Ping menu" onClick={closePanel} style={{float:"right",color:"white",background:"transparent",border:0,fontSize:20}}>✕</button><p style={{margin:"8px 0"}}>{session.status==="pending"?(session.invitee_id===uid?"A member wants to connect by voice and share navigation. Accept?":"Waiting for member to accept…") : (isLeader?"You are leading · Others follow your swipes · ":"Following host navigation · Wide DeepWatch active · ")+syncStatus+" · "+voiceState}</p>
 {error&&<p role="alert">{error}</p>}
 <div style={{display:"flex",gap:9,flexWrap:"wrap",marginTop:18}}>{session.status==="accepted"&&!audioReady&&<button style={actionStyle} onClick={()=>{void room.current?.startAudio().then(()=>{setAudioReady(true);setVoiceState("Voice active")}).catch(()=>setVoiceState("Audio blocked by browser"))}}>🔊 Enable Audio</button>}{session.status==="pending"&&session.invitee_id===uid&&<><button onClick={()=>void respond("accepted")} style={{...actionStyle,background:"rgba(65,225,182,.22)"}}>Yes · Connect</button><button onClick={()=>void respond("declined")} style={actionStyle}>No</button></>}
 {session.status==="accepted"&&<button style={actionStyle} onClick={()=>{const next=!muted;setMuted(next);void room.current?.localParticipant.setMicrophoneEnabled(!next)}}>{muted?"Unmute":"Mute"}</button>}
 <button style={actionStyle} onClick={()=>void respond("ended")}>✕ End Sync</button>{session.status==="accepted"&&<button style={actionStyle} onClick={()=>{setExpanded(false);setGalleryOpen(true)}}>＋ Add People</button>}</div>{expanded&&session.status==="accepted"&&<div style={{marginTop:10}}><input aria-label="Invite member ID" value={inviteId} onChange={e=>setInviteId(e.target.value.trim())} placeholder="Member ID" style={{padding:8,borderRadius:9,color:"#111",maxWidth:"100%"}}/><button style={actionStyle} onClick={()=>void inviteMore()}>Invite</button></div>}
 </aside></>}{session.status==="accepted"&&<><button aria-label={muted?"Unmute Sync":"Mute Sync"} onClick={()=>{const next=!muted;setMuted(next);void room.current?.localParticipant.setMicrophoneEnabled(!next)}} style={{position:"fixed",bottom:18,left:"50%",transform:"translateX(-50%)",zIndex:2147483001,background:"rgba(10,25,30,.35)",border:"1px solid #ffffff55",backdropFilter:"blur(14px)",color:"white",borderRadius:30,padding:"12px 22px"}}>{muted?"🔇 Unmute":"🎙️ Mute"}</button><button onPointerDown={e=>{const target=e.currentTarget;target.dataset.timer=String(window.setTimeout(()=>setDeepWatch(true),3000))}} onPointerUp={e=>{clearTimeout(Number(e.currentTarget.dataset.timer))}} onPointerCancel={e=>clearTimeout(Number(e.currentTarget.dataset.timer))} aria-label="Hold three seconds for Wide DeepWatch" style={{position:"fixed",bottom:18,left:12,zIndex:2147483001,borderRadius:24,padding:12,color:"white",background:"rgba(10,25,30,.3)",border:"1px solid #ffffff44"}}>◉ DeepWatch</button>{(deepWatch||followerDeepWatch)&&<div role="status" style={{position:"fixed",inset:0,zIndex:2147482999,pointerEvents:"none",border:"2px solid #49dfff88",boxShadow:"inset 0 0 240px 90px #49dfff24, inset 0 0 90px 35px #49dfff18",borderRadius:24}}><span style={{position:"absolute",top:20,left:20,color:"#9ef8ff",background:"#071c26aa",padding:10,borderRadius:12}}>{followerDeepWatch?"Wide DeepWatch · Following host":"Wide DeepWatch · Sync"}</span></div>}</>}</>;
}
