"use client";
import {useEffect,useRef,useState} from "react";
import {usePathname,useRouter} from "next/navigation";
import {Room,RoomEvent,Track} from "livekit-client";
import {createClient} from "../../utils/supabase/client";
type Session={id:string;initiator_id:string;invitee_id:string;status:string;current_page:string};
export default function PersistentMuslimSync(){
 const pathname=usePathname(),router=useRouter(),[db]=useState(()=>createClient());
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
 r.on(RoomEvent.TrackSubscribed,track=>{if(track.kind!==Track.Kind.Audio)return;const el=track.attach();el.setAttribute("data-muslim-sync-audio","true");el.setAttribute("autoplay","true");el.style.display="none";document.body.appendChild(el)});
 r.on(RoomEvent.TrackUnsubscribed,track=>track.detach().forEach(el=>el.remove()));
 await r.connect(json.url,json.token);if(cancelled)return;await r.localParticipant.setMicrophoneEnabled(true);
 }catch(e){if(!cancelled)setError(e instanceof Error?e.message:"Unable to connect voice")}};
 void connect();return()=>{cancelled=true;void room.current?.disconnect();room.current=null;document.querySelectorAll("[data-muslim-sync-audio]").forEach(e=>e.remove())}},[session?.id,session?.status]);
 useEffect(()=>{if(session?.status!=="accepted")return;const next=session.current_page;if(next&&next!==pathname&&next.startsWith("/")&&!next.startsWith("//")&&!next.includes("://")&&!next.startsWith("/messages/sync")){remotePage.current=next;router.push(next)}},[session?.current_page,session?.status,pathname,router]);
 useEffect(()=>{if(session?.status!=="accepted"||!pathname||pathname==="/messages/sync")return;if(remotePage.current===pathname){remotePage.current="";lastPage.current=pathname;return}if(lastPage.current===pathname)return;lastPage.current=pathname;void db.from("muslim_sync_sessions").update({current_page:pathname}).eq("id",session.id).eq("status","accepted")},[pathname,session?.id,session?.status,db]);
 const inviteMore=async()=>{if(!session||session.status!=="accepted")return;if(!/^[0-9a-f-]{36}$/i.test(inviteId)){setError("Enter a valid member ID.");return}const {error:e}=await db.from("muslim_sync_members").insert({session_id:session.id,user_id:inviteId});setError(e?.message||"GroupSync invitation sent.");if(!e)setInviteId("")};
 useEffect(()=>{if(!deepWatch)return;const timer=setTimeout(()=>setDeepWatch(false),30000);return()=>clearTimeout(timer)},[deepWatch]);
 const respond=async(status:"accepted"|"declined"|"ended")=>{if(!session)return;const {error:e}=await db.from("muslim_sync_sessions").update({status}).eq("id",session.id);if(e)setError(e.message);else if(status!=="accepted")setSession(null)};
 if(!uid||!session)return null;
 return <><aside style={{position:"fixed",bottom:90,right:12,zIndex:2147483000,maxWidth:310,padding:15,borderRadius:18,background:"rgba(8,22,28,.94)",color:"white",border:"1px solid #4bdcce",boxShadow:"0 10px 40px #0008",fontSize:13}}>
 <strong>🔗 1Muslim Sync</strong><p style={{margin:"8px 0"}}>{session.status==="pending"?(session.invitee_id===uid?"A member wants to connect by voice and share navigation. Accept?":"Waiting for member to accept…"):"Voice connected · Shared navigation · Your own account data stays private"}</p>
 {error&&<p role="alert">{error}</p>}
 <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{session.status==="pending"&&session.invitee_id===uid&&<><button onClick={()=>void respond("accepted")}>Accept</button><button onClick={()=>void respond("declined")}>Decline</button></>}
 {session.status==="accepted"&&<button onClick={()=>{const next=!muted;setMuted(next);void room.current?.localParticipant.setMicrophoneEnabled(!next)}}>{muted?"Unmute":"Mute"}</button>}
 <button onClick={()=>void respond("ended")}>✕ End Sync</button>{session.status==="accepted"&&<button onClick={()=>setExpanded(v=>!v)}>＋ GroupSync</button>}</div>{expanded&&session.status==="accepted"&&<div style={{marginTop:10}}><input aria-label="Invite member ID" value={inviteId} onChange={e=>setInviteId(e.target.value.trim())} placeholder="Member ID" style={{padding:8,borderRadius:9,color:"#111",maxWidth:"100%"}}/><button onClick={()=>void inviteMore()}>Invite</button></div>}
 </aside>{session.status==="accepted"&&<><button aria-label={muted?"Unmute Sync":"Mute Sync"} onClick={()=>{const next=!muted;setMuted(next);void room.current?.localParticipant.setMicrophoneEnabled(!next)}} style={{position:"fixed",bottom:18,left:"50%",transform:"translateX(-50%)",zIndex:2147483001,background:"rgba(10,25,30,.35)",border:"1px solid #ffffff55",backdropFilter:"blur(14px)",color:"white",borderRadius:30,padding:"12px 22px"}}>{muted?"🔇 Unmute":"🎙️ Mute"}</button><button onPointerDown={e=>{const target=e.currentTarget;target.dataset.timer=String(window.setTimeout(()=>setDeepWatch(true),3000))}} onPointerUp={e=>{clearTimeout(Number(e.currentTarget.dataset.timer))}} onPointerCancel={e=>clearTimeout(Number(e.currentTarget.dataset.timer))} aria-label="Hold three seconds for Wide DeepWatch" style={{position:"fixed",bottom:18,left:12,zIndex:2147483001,borderRadius:24,padding:12,color:"white",background:"rgba(10,25,30,.3)",border:"1px solid #ffffff44"}}>◉ DeepWatch</button>{deepWatch&&<div role="status" style={{position:"fixed",inset:0,zIndex:2147482999,pointerEvents:"none",border:"4px solid #49dfff",boxShadow:"inset 0 0 120px #49dfff33",borderRadius:24}}><span style={{position:"absolute",top:20,left:20,color:"#9ef8ff",background:"#071c26aa",padding:10,borderRadius:12}}>Wide DeepWatch · Sync</span></div>}</>}</>;
}
