"use client";
import {useEffect,useRef,useState} from "react";
import {Room,RoomEvent,Track} from "livekit-client";
import {createClient} from "../utils/supabase/client";

type GuestRequest={
  id:string;user_id:string;status:"pending"|"approved"|"rejected"|"removed";
  mode:"pfp"|"camera";host_muted:boolean;
};
type ModerationAction="approved"|"rejected"|"removed"|"mute"|"unmute";

export default function LiveGuestStudio({streamId,roomName,hostId,compactJoin=false}:{streamId:string;roomName:string;hostId:string;compactJoin?:boolean}){
  const [uid,setUid]=useState<string|null>(null);
  const [panelOpen,setPanelOpen]=useState(false);
  const [requests,setRequests]=useState<GuestRequest[]>([]);
  const [loaded,setLoaded]=useState(false);
  const [mode,setMode]=useState<"pfp"|"camera">("pfp");
  const [audioOnly,setAudioOnly]=useState(true);
  const [mediaConsent,setMediaConsent]=useState(false);
  const [joined,setJoined]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [mic,setMic]=useState(true),[camera,setCamera]=useState(true);
  const [background,setBackground]=useState("none");
  const room=useRef<Room|null>(null),preview=useRef<HTMLVideoElement>(null);
  const stream=useRef<MediaStream|null>(null);
  const refreshRef=useRef<()=>void>(()=>{});
  const pendingSeen=useRef<Set<string>|null>(null);
  const me=requests.find(r=>r.user_id===uid);
  const host=uid===hostId;

  useEffect(()=>{
    let active=true;
    const db=createClient();
    void db.auth.getUser().then(({data})=>{if(active)setUid(data.user?.id??null)});
    const load=async()=>{
      if(!active||document.visibilityState==="hidden")return;
      const {data:liveMeta}=await db.from("live_streams").select("aspect_ratio").eq("id",streamId).maybeSingle();
      if(active&&liveMeta){
        const audio=liveMeta.aspect_ratio==="1:1";
        setAudioOnly(audio);
        if(audio)setMode("pfp");
      }
      const {data,error:loadError}=await db.from("live_guest_requests")
        .select("id,user_id,status,mode,host_muted").eq("stream_id",streamId);
      if(!active)return;
      if(!loadError){const incoming=(data??[]) as GuestRequest[];setRequests(incoming);
        const pending=incoming.filter(item=>item.status==="pending");
        if(uid===hostId){
          window.dispatchEvent(new CustomEvent("1muslim:live-guest-pending",{detail:{streamId,count:pending.length}}));
          if(pendingSeen.current!==null&&pending.some(item=>!pendingSeen.current!.has(item.id))){
            window.dispatchEvent(new CustomEvent("1muslim:live-guest-notification",{detail:{streamId,count:pending.length}}));
          }
          pendingSeen.current=new Set(pending.map(item=>item.id));
        }
      }
      else setError(previous=>previous||"Guest requests are temporarily unavailable. Please retry.");
      setLoaded(true);
    };
    refreshRef.current=()=>{void load()};
    void load();
    // Poll only while visible; refresh immediately on focus or after an action.
    const timer=window.setInterval(()=>void load(),5000);
    document.addEventListener("visibilitychange",load);
    window.addEventListener("focus",load);
    return()=>{
      active=false;window.clearInterval(timer);
      document.removeEventListener("visibilitychange",load);
      window.removeEventListener("focus",load);
      refreshRef.current=()=>{};
    };
  },[streamId,uid,hostId]);
  useEffect(()=>()=>{void room.current?.disconnect();stream.current?.getTracks().forEach(t=>t.stop())},[]);
  useEffect(()=>{
    if(!audioOnly||!joined)return;
    // Switching a video room to Audio must retire any existing guest camera.
    for(const track of stream.current?.getVideoTracks()??[]){
      void room.current?.localParticipant.unpublishTrack(track);
      track.stop();
      stream.current?.removeTrack(track);
    }
    if(preview.current)preview.current.srcObject=null;
    setCamera(false);
  },[audioOnly,joined]);

  function leave(){
    void room.current?.disconnect();room.current=null;
    stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;
    if(preview.current)preview.current.srcObject=null;
    setJoined(false);setMic(false);
  }
  useEffect(()=>{
    if(joined&&loaded&&me?.status!=="approved")leave();
  },[joined,loaded,me?.status]);
  useEffect(()=>{
    if(!joined||!me?.host_muted)return;
    // Host mute is authoritative. Never auto-unmute after the host lifts it.
    for(const track of stream.current?.getAudioTracks()??[]){
      void room.current?.localParticipant.unpublishTrack(track);
      track.stop();
    }
    setMic(false);
  },[joined,me?.host_muted]);

  async function request(){
    if(busy)return;
    setBusy(true);setError("");
    try{
      const {error:requestError}=await createClient().rpc("request_live_guest",{
        p_stream:streamId,p_mode:audioOnly?"pfp":mode,
      });
      if(requestError)throw new Error(requestError.code==="PGRST202"
        ?"Guest requests are initializing. Please try again shortly."
        :requestError.message);
      refreshRef.current();
    }catch(e){setError(e instanceof Error?e.message:"Could not request to join.")}
    finally{setBusy(false)}
  }
  async function cancelRequest(){
    if(busy||me?.status!=="pending")return;
    setBusy(true);setError("");
    try{
      const {error:cancelError}=await createClient().rpc("cancel_live_guest_request",{p_stream:streamId});
      if(cancelError)throw new Error(cancelError.message);
      setRequests(previous=>previous.filter(item=>item.id!==me.id));
      refreshRef.current();
    }catch(e){setError(e instanceof Error?e.message:"Could not cancel request.")}
    finally{setBusy(false)}
  }
  async function moderate(id:string,action:ModerationAction){
    if(busy)return;
    setBusy(true);setError("");
    try{
      // Server route also enforces LiveKit kick/mute; direct RPC cannot do that.
      const response=await fetch("/api/live-guests/moderate",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({requestId:id,action}),
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok){
        if(data.applied===true)refreshRef.current();
        throw new Error(data.error||"Guest moderation is unavailable.");
      }
      refreshRef.current();
    }catch(e){setError(e instanceof Error?e.message:"Guest moderation failed.")}
    finally{setBusy(false)}
  }
  async function join(reconnecting=false){
    if((busy||joined)&&!reconnecting||me?.status!=="approved")return;
    if(!mediaConsent){setError("Confirm microphone and camera sharing before joining.");return;}
    setBusy(true);setError("");
    try{
      const response=await fetch("/api/livekit/token",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({room:roomName,role:"guest"}),
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(data.error||"Guest connection failed.");
      if(data.role!=="guest")throw new Error("Guest permission was not granted.");
      const r=new Room();room.current=r;
      r.on(RoomEvent.Disconnected,()=>{
        if(room.current!==r)return;
        stream.current?.getTracks().forEach(t=>t.stop());
        stream.current=null;room.current=null;
        setJoined(false);setMic(false);
      });
      await r.connect(data.url,data.token);
      const wantsCamera=me.mode==="camera"&&data.mode==="video";
      const wantsMic=!me.host_muted;
      const media=wantsCamera||wantsMic
        ?await navigator.mediaDevices.getUserMedia({audio:wantsMic,video:wantsCamera})
        :new MediaStream();
      stream.current=media;
      // Explicit LiveKit track sources are required by Bot A's restricted JWT.
      for(const track of media.getAudioTracks())
        await r.localParticipant.publishTrack(track,{source:Track.Source.Microphone});
      for(const track of media.getVideoTracks())
        await r.localParticipant.publishTrack(track,{source:Track.Source.Camera});
      if(preview.current&&wantsCamera){
        preview.current.srcObject=media;
        void preview.current.play().catch(()=>{});
      }
      setMic(wantsMic);setCamera(wantsCamera);setJoined(true);
    }catch(e){
      setError(e instanceof Error?e.message:"Unable to join stage.");
      void room.current?.disconnect();room.current=null;
      stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;
    }finally{setBusy(false)}
  }
  useEffect(()=>{
    if(!joined||!preview.current||!stream.current?.getVideoTracks().length)return;
    preview.current.srcObject=stream.current;
    void preview.current.play().catch(()=>{});
  },[joined,me?.mode]);
  async function toggleMic(){
    if(me?.host_muted){setError("The host muted your microphone. Wait until the host unmutes you.");return}
    const audio=stream.current?.getAudioTracks()??[];
    if(!audio.length){
      // A host-muted JWT has no mic grant. Explicit user action gets a fresh token.
      leave();await join(true);return;
    }
    const next=!mic;audio.forEach(t=>t.enabled=next);setMic(next);
  }
  function toggleCamera(){
    const next=!camera;
    stream.current?.getVideoTracks().forEach(t=>t.enabled=next);
    setCamera(next);
  }

  if(!uid)return null;
  const pendingCount=requests.filter(r=>r.status==="pending").length;
  if(compactJoin&&!host){
    const waiting=me?.status==="pending";
    return <div style={{position:"relative",zIndex:55}}>
      <button type="button" disabled={busy||!uid} aria-pressed={waiting} aria-label={waiting?"Cancel request to join Live":"Request to join Live"} onClick={()=>void (waiting?cancelRequest():request())}
        style={{border:"1px solid var(--theme-border,rgba(255,255,255,.65))",borderRadius:999,padding:"8px 15px",minHeight:38,color:"var(--theme-text,#fff)",fontWeight:700,background:waiting?"rgba(15,133,107,.24)":"rgba(255,255,255,.08)",backdropFilter:"blur(9px)",WebkitBackdropFilter:"blur(9px)",boxShadow:waiting?"0 0 16px var(--theme-primary,#4fffd0),inset 0 0 12px rgba(90,255,209,.24)":"none",animation:waiting?"liveJoinRequestGlow 1.6s ease-in-out infinite":undefined,cursor:"pointer",opacity:busy?.65:1}}>
        {waiting?"Requested ✓":"Join"}
      </button>
      {error&&<span role="alert" style={{position:"absolute",right:0,top:"calc(100% + 5px)",width:230,fontSize:11,background:"#142522",padding:8,borderRadius:10,color:"#fff"}}>{error}</span>}
      <style>{`@keyframes liveJoinRequestGlow{0%,100%{filter:brightness(1)}50%{filter:brightness(1.55)}}@media(prefers-reduced-motion:reduce){button[aria-pressed="true"]{animation:none!important}}`}</style>
    </div>;
  }
  return <div style={{position:"relative",zIndex:30,width:"fit-content",maxWidth:"100%"}}>
    <button type="button" aria-expanded={panelOpen} aria-controls="live-guest-controls-panel" onClick={()=>setPanelOpen(open=>!open)} style={{border:"1px solid var(--theme-border,#8aa398)",borderRadius:999,padding:compactJoin?"8px 12px":"9px 14px",minHeight:compactJoin?36:undefined,fontSize:compactJoin?12:undefined,boxSizing:"border-box",background:"color-mix(in srgb,var(--theme-panel,#101a13) 76%,transparent)",backdropFilter:"blur(18px)",WebkitBackdropFilter:"blur(18px)",color:"var(--theme-text,#e7f5e6)",fontWeight:600,cursor:"pointer",boxShadow:"0 8px 24px #0005"}}>{compactJoin?"Join":`👥 Guests${host&&pendingCount>0?` · ${pendingCount}`:""} ${panelOpen?"⌃":"⌄"}`}</button>
    {panelOpen&&<section id="live-guest-controls-panel" aria-label="Live guest controls" style={{position:"absolute",right:0,bottom:"calc(100% + 10px)",width:"min(340px,calc(100vw - 32px))",maxHeight:"min(55dvh,430px)",overflowY:"auto",overscrollBehavior:"contain",padding:14,border:"1px solid var(--theme-border,#48624b)",borderRadius:20,background:"color-mix(in srgb,var(--theme-panel,#101a13) 90%,transparent)",backdropFilter:"blur(22px)",WebkitBackdropFilter:"blur(22px)",boxShadow:"0 16px 44px #0009",color:"var(--theme-text,#e7f5e6)"}}>
    <h3 style={{margin:"0 0 8px"}}>🎙️ 1Muslim Guest Studio</h3>
    <p style={{fontSize:12,opacity:.8}}>Video: host + 3 guests. Audio: host + 11 guests.</p>
    {host?<div><strong>👑 Guest requests</strong>
      {requests.filter(r=>r.status==="pending").map(r=><div key={r.id} style={{display:"flex",gap:8,alignItems:"center",marginTop:8,flexWrap:"wrap"}}>
        <span>{r.user_id.slice(0,8)} · {r.mode}</span>
        <button type="button" disabled={busy} onClick={()=>void moderate(r.id,"approved")}>Approve</button>
        <button type="button" disabled={busy} onClick={()=>void moderate(r.id,"rejected")}>Decline</button>
      </div>)}
      {requests.filter(r=>r.status==="approved").map(r=><div key={r.id} style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginTop:8}}>
        <span>🎤 {r.user_id.slice(0,8)}</span>
        <button type="button" disabled={busy} onClick={()=>void moderate(r.id,r.host_muted?"unmute":"mute")}>{r.host_muted?"Allow mic":"Mute mic"}</button>
        <button type="button" disabled={busy} onClick={()=>void moderate(r.id,"removed")}>Remove</button>
      </div>)}
      {loaded&&!requests.some(r=>r.status==="pending"||r.status==="approved")&&<p>No guest requests yet.</p>}
    </div>:<div>
      {!joined&&me?.status!=="approved"&&<>
        <select aria-label="Guest mode" value={audioOnly?"pfp":mode} disabled={busy||audioOnly===true} onChange={e=>setMode(e.target.value as "pfp"|"camera")}>
          <option value="pfp">🎙️ Audio + profile picture</option>{audioOnly!==true&&<option value="camera">📹 Camera + audio</option>}
        </select>{" "}
        <button type="button" disabled={busy||me?.status==="pending"} onClick={()=>void request()}>Request to join</button>
      </>}
      {me?.status==="pending"&&<p role="status">⏳ Waiting for host approval…</p>}
      {me?.status==="approved"&&!joined&&<div>
        <label style={{display:"flex",alignItems:"flex-start",gap:8,fontSize:12,margin:"8px 0"}}>
          <input type="checkbox" checked={mediaConsent} onChange={e=>setMediaConsent(e.target.checked)} />
          I agree to share my microphone{me.mode==="camera"&&!audioOnly?" and camera":""} with this Live.
        </label>
        <button type="button" disabled={busy||!mediaConsent} onClick={()=>void join()}>Join stage</button>
      </div>}
      {joined&&<div><p role="status">🔴 You're on stage</p>
        {me?.mode==="camera"&&!audioOnly&&<div style={{position:"relative",maxWidth:250}}>
          <video ref={preview} muted autoPlay playsInline style={{width:"100%",borderRadius:12,filter:background==="blur"?"blur(4px)":"none"}}/>
          <span style={{fontSize:11}}>Preview effects (local only)</span>
        </div>}
        <button type="button" disabled={busy||!!me?.host_muted} onClick={()=>void toggleMic()}>{mic?"Mute mic":"Unmute mic"}</button>{" "}
        {me?.mode==="camera"&&!audioOnly&&<button type="button" disabled={busy} onClick={toggleCamera}>{camera?"Camera off":"Camera on"}</button>}{" "}
        <button type="button" onClick={leave}>Leave stage</button>
        <label style={{display:"block",marginTop:8}}>Background preview{" "}
          <select value={background} onChange={e=>setBackground(e.target.value)}>
            <option value="none">Normal</option><option value="blur">Blur preview</option>
          </select>
        </label>
      </div>}
    </div>}
    {error&&<p role="alert" style={{color:"#ffb5b5"}}>{error}</p>}
    </section>}
  </div>;
}
