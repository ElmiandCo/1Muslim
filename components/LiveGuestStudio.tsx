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
  const [viewerRoster,setViewerRoster]=useState<Array<{id:string;username:string;avatar:string|null;xp:number|null}>>([]);
  const [rosterLoading,setRosterLoading]=useState(false);
  const [invitations,setInvitations]=useState<Array<{id:string;viewer_id:string;status:string}>>([]);
  const [requesterNames,setRequesterNames]=useState<Record<string,string>>({});
  const [mode,setMode]=useState<"pfp"|"camera">("camera");
  const [audioOnly,setAudioOnly]=useState(false);
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
  const pendingRequests=host?requests.filter(r=>r.status==="pending"):[];
  const nextRequest=pendingRequests[0];
  useEffect(()=>{if(!panelOpen)return;let cancelled=false;const load=async()=>{setRosterLoading(true);try{const response=await fetch("/api/livekit/viewers",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({room:roomName}),cache:"no-store"});if(!response.ok)throw new Error("Viewer list unavailable");const data=await response.json();if(!cancelled)setViewerRoster(Array.isArray(data.viewers)?data.viewers:[])}catch{if(!cancelled)setViewerRoster([])}finally{if(!cancelled)setRosterLoading(false)}};void load();const timer=window.setInterval(()=>void load(),12000);return()=>{cancelled=true;window.clearInterval(timer)}},[panelOpen,roomName]);
  useEffect(()=>{if(host&&pendingRequests.length>0)setPanelOpen(true)},[host,pendingRequests.length]);
  useEffect(()=>{if(!host||!pendingRequests.length)return;const missing=[...new Set(pendingRequests.map(r=>r.user_id))].filter(id=>!requesterNames[id]);if(!missing.length)return;let active=true;void createClient().from("profiles").select("id,username,display_name").in("id",missing).then(({data})=>{if(active&&data)setRequesterNames(old=>({...old,...Object.fromEntries(data.map(p=>[p.id,p.display_name||p.username||"Viewer"]))}))});return()=>{active=false}},[host,requests,requesterNames]);

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
      const {data:invites}=await db.from("live_guest_invitations").select("id,viewer_id,status").eq("stream_id",streamId);
      if(active&&invites)setInvitations(invites);
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
    // Subscribe to database changes for immediate host prompts; polling remains a fallback.
    // Each effect mount gets a unique channel: Supabase can still be removing
    // the previous subscribed channel during rapid guest state updates.
    const channel=db.channel("live-guest-requests-"+streamId+"-"+crypto.randomUUID())
      .on("postgres_changes",{event:"*",schema:"public",table:"live_guest_requests",filter:"stream_id=eq."+streamId},()=>{void load()})
      .subscribe();
    // Poll only while visible; refresh immediately on focus or after an action.
    const timer=window.setInterval(()=>void load(),5000);
    document.addEventListener("visibilitychange",load);
    window.addEventListener("focus",load);
    return()=>{
      active=false;void db.removeChannel(channel);window.clearInterval(timer);
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

  async function inviteViewer(viewerId:string){
    if(busy)return;setBusy(true);setError("");
    try{const {error:e}=await createClient().rpc("invite_live_viewer",{p_stream:streamId,p_viewer:viewerId});if(e)throw e;setInvitations(v=>[...v.filter(i=>i.viewer_id!==viewerId),{id:"pending",viewer_id:viewerId,status:"pending"}]);refreshRef.current()}catch(e){setError(e instanceof Error?e.message:"Could not invite viewer")}finally{setBusy(false)}
  }
  async function respondInvite(invitationId:string,accept:boolean){
    if(busy)return;setBusy(true);setError("");
    try{const {error:e}=await createClient().rpc("respond_live_invitation",{p_invitation:invitationId,p_accept:accept});if(e)throw e;refreshRef.current();if(accept)setPanelOpen(true)}catch(e){setError(e instanceof Error?e.message:"Could not respond to invitation")}finally{setBusy(false)}
  }
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
  const myInvite=invitations.find(i=>i.viewer_id===uid&&i.status==="pending");
  return <div style={{position:"relative",zIndex:30,width:"fit-content",maxWidth:"100%"}}>
    {host&&nextRequest&&<div role="alertdialog" aria-label="Guest join request" aria-live="assertive" className="oneMuslimGuestJoinPrompt">
      <span className="oneMuslimGuestJoinPromptName">{requesterNames[nextRequest.user_id]||"A viewer"} wants to join</span>
      <div className="oneMuslimGuestJoinPromptActions">
        <button type="button" disabled={busy} onClick={()=>void moderate(nextRequest.id,"approved")}>Yes</button>
        <button type="button" disabled={busy} onClick={()=>void moderate(nextRequest.id,"rejected")}>No</button>
      </div>
      {pendingRequests.length>1&&<small>{pendingRequests.length-1} more waiting</small>}
    </div>}
    <style jsx>{`
      .oneMuslimGuestJoinPrompt{position:fixed;left:50%;top:clamp(90px,22dvh,240px);transform:translateX(-50%);z-index:9999;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;width:min(420px,calc(100vw - 28px));box-sizing:border-box;padding:10px 12px;border-radius:16px;border:1px solid color-mix(in srgb,var(--theme-border,var(--theme-primary,#c5c5d5)) 50%,transparent);background:color-mix(in srgb,var(--theme-panel,#141522) 28%,transparent);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);box-shadow:0 10px 34px #0005;color:var(--theme-text,#fff);animation:guestPromptEnter .24s ease-out both}
      .oneMuslimGuestJoinPromptName{font-size:13px;font-weight:600;flex:1 1 140px;min-width:0;overflow-wrap:anywhere}
      .oneMuslimGuestJoinPromptActions{display:flex;gap:7px;flex:0 0 auto}
      .oneMuslimGuestJoinPromptActions button{border:1px solid color-mix(in srgb,var(--theme-border,var(--theme-primary,#ddd)) 60%,transparent);border-radius:10px;background:color-mix(in srgb,var(--theme-primary,#c5b4f3) 18%,transparent);color:inherit;padding:7px 14px;min-height:34px;font-size:13px;font-weight:700;cursor:pointer;transition:background .2s ease,border-color .2s ease}
      .oneMuslimGuestJoinPromptActions button:last-child{background:transparent}
      .oneMuslimGuestJoinPromptActions button:hover{background:color-mix(in srgb,var(--theme-primary,#c5b4f3) 34%,transparent)}
      .oneMuslimGuestJoinPromptActions button:disabled{opacity:.5;cursor:wait}
      .oneMuslimGuestJoinPrompt small{width:100%;font-size:10px;opacity:.7}
      @keyframes guestPromptEnter{from{opacity:0;transform:translate(-50%,-8px)}to{opacity:1;transform:translate(-50%,0)}}
      @media(prefers-reduced-motion:reduce){.oneMuslimGuestJoinPrompt{animation:none}}
    `}</style>
    <style jsx>{`
      .guestMainButton,.guestAction{border:1px solid var(--theme-border,#d4b97988);border-radius:999px;background:color-mix(in srgb,var(--theme-primary,#075e45) 58%,#071713);color:var(--theme-text,#fff);padding:10px 18px;font:inherit;font-weight:750;cursor:pointer;box-shadow:0 8px 25px #0006}
      .guestMainButton:disabled,.guestAction:disabled{opacity:.55;cursor:wait}
      .guestSheetBackdrop{position:fixed;inset:0;z-index:10020;background:transparent;display:flex;align-items:flex-end;justify-content:center;isolation:isolate}\n      .guestSheetBackdrop::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background:linear-gradient(to bottom,rgba(0,0,0,.8) 0%,rgba(0,0,0,.8) 15%,rgba(255,255,255,.14) 48%,rgba(255,255,255,.25) 58%,rgba(0,0,0,.7) 85%,rgba(0,0,0,.88) 100%);opacity:1;animation:elmiLayerZFocus .85s cubic-bezier(.22,1,.36,1) both}\n      .guestSheetBackdrop.guestRequestSent::before{background:linear-gradient(to bottom,rgba(0,0,0,.9) 0%,rgba(0,0,0,.9) 38%,rgba(255,255,255,.05) 66%,rgba(255,255,255,.25) 83%,rgba(255,255,255,.33) 100%)}\n      @keyframes elmiLayerZFocus{from{opacity:0;transform:translateY(5%)}to{opacity:1;transform:translateY(0)}}
      .guestSheet{position:relative;width:min(100%,480px);height:52dvh;max-height:78dvh;display:flex;flex-direction:column;overflow-y:auto;padding:22px 20px calc(22px + env(safe-area-inset-bottom));border:1px solid var(--theme-border,#c7b27c88);border-radius:26px 26px 0 0;background:color-mix(in srgb,var(--theme-panel,#071c15) 94%,#000);color:var(--theme-text,#fff);box-shadow:0 -20px 65px #0009;animation:guestSheetRise .45s cubic-bezier(.22,1,.36,1)}
      .guestViewerRoster{flex:1;min-height:80px;overflow-y:auto;margin:10px 0;padding:2px 0}.guestViewerPerson{display:flex;align-items:center;gap:12px;padding:9px 4px;border-bottom:1px solid #ffffff16;font-size:14px}.guestViewerPerson img,.guestViewerFallback{width:38px;height:38px;flex:0 0 38px;border-radius:50%;object-fit:cover;background:#ffffff20;display:grid;place-items:center}.guestViewerPerson span:nth-child(2){flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.guestViewerPerson small{opacity:.65}.guestSheet h2{margin:5px 0 12px;font-size:20px}.guestSheet p{font-size:13px;opacity:.85}.guestSheetClose{position:absolute;right:16px;top:12px;border:0;border-radius:50%;background:#ffffff1b;color:inherit;width:35px;height:35px;font-size:23px;cursor:pointer}
      .guestRow{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:12px 0}.guestRow button{border:1px solid var(--theme-border,#ffffff55);border-radius:999px;background:#ffffff12;color:inherit;padding:9px 13px;cursor:pointer}.guestRow button[aria-pressed=true]{background:var(--theme-primary,#087750);color:#fff}
      .guestSheet .guestAction{width:100%;margin-top:12px;padding:13px}.guestSheet label{display:flex;align-items:center;gap:10px;margin:12px 0;font-size:13px}.guestSheet select{background:#111;color:white;border:1px solid #ffffff55;border-radius:12px;padding:8px}
      @keyframes guestSheetRise{from{transform:translateY(30px);opacity:.3}to{transform:translateY(0);opacity:1}}
      @media(prefers-reduced-motion:reduce){.guestSheet{animation:none}.guestSheetBackdrop::before{animation:none}}
    `}</style>
    {!host&&<button type="button" className="guestMainButton" aria-expanded={panelOpen} onClick={()=>setPanelOpen(true)}>{joined?"● On stage":me?.status==="pending"?"⏳ Requested":me?.status==="approved"?"Join":"Join"}</button>}
    {host&&<button type="button" className="guestMainButton" aria-expanded={panelOpen} onClick={()=>setPanelOpen(true)}>👥 Guests{pendingCount>0?` · ${pendingCount}`:""}</button>}
    {panelOpen&&<div className={"guestSheetBackdrop"+(!host&&me?.status==="pending"?" guestRequestSent":"")} onMouseDown={e=>{if(e.target===e.currentTarget)setPanelOpen(false)}}>
      <section className="guestSheet" role="dialog" aria-modal="true" aria-label={host?"Guest requests":"Join Live settings"}>
        <button className="guestSheetClose" type="button" aria-label="Close guest settings" onClick={()=>setPanelOpen(false)}>×</button>
        <h2>{host?"👥 Viewers & guest requests":joined?"You're on stage":me?.status==="pending"?"Request sent":me?.status==="approved"?"Ready to join":"Join this Live"}</h2>
        <div className="guestViewerRoster" aria-label="Current live viewers">{rosterLoading&&viewerRoster.length===0?<p>Loading viewers…</p>:viewerRoster.length===0?<p>No viewers connected yet.</p>:viewerRoster.map(viewer=><div className="guestViewerPerson" key={viewer.id}>{viewer.avatar?<img src={viewer.avatar} alt="" referrerPolicy="no-referrer"/>:<span className="guestViewerFallback">◉</span>}<span>{viewer.username}</span>{host?<button type="button" disabled={busy||invitations.some(i=>i.viewer_id===viewer.id&&i.status==="pending")} onClick={()=>void inviteViewer(viewer.id)}>{invitations.some(i=>i.viewer_id===viewer.id&&i.status==="pending")?"Invited":"Invite"}</button>:<small>Watching</small>}</div>)}</div>
        {host?<div>
          {pendingRequests.map(r=><div className="guestRow" key={r.id}><strong>{requesterNames[r.user_id]||r.user_id.slice(0,8)}</strong><small>{r.mode==="camera"?"📷 Camera":"🎙 Audio"}</small><button disabled={busy} onClick={()=>void moderate(r.id,"approved")}>✓ Approve</button><button disabled={busy} onClick={()=>void moderate(r.id,"rejected")}>Decline</button></div>)}
          {requests.filter(r=>r.status==="approved").map(r=><div className="guestRow" key={r.id}><strong>{requesterNames[r.user_id]||r.user_id.slice(0,8)}</strong><button disabled={busy} onClick={()=>void moderate(r.id,r.host_muted?"unmute":"mute")}>{r.host_muted?"Allow mic":"Mute mic"}</button><button disabled={busy} onClick={()=>void moderate(r.id,"removed")}>Remove</button></div>)}
          {loaded&&!requests.some(r=>r.status==="pending"||r.status==="approved")&&<p>No guest requests yet.</p>}
        </div>:<div>
          {!joined&&me?.status!=="approved"&&me?.status!=="pending"&&<>
            <p>Choose how you'll appear when the host invites you on stage.</p>
            <div className="guestRow" role="group" aria-label="Guest media mode">
              <button type="button" aria-pressed={mode==="camera"&&!audioOnly} disabled={audioOnly} onClick={()=>setMode("camera")}>📷 Camera</button>
              <button type="button" aria-pressed={mode==="pfp"||audioOnly} onClick={()=>setMode("pfp")}>🎙 Audio only</button>
            </div>
            {audioOnly&&<p>This is an audio Live. Camera is unavailable in this room.</p>}
            <button className="guestAction" disabled={busy} onClick={()=>void request()}>{busy?"Requesting…":"Request to join"}</button>
          </>}
          {me?.status==="pending"&&<p role="status">⏳ Waiting for host approval. You can close this sheet while waiting.</p>}
          {me?.status==="approved"&&!joined&&<>
            <p>The host approved your request. Your {me.mode==="camera"&&!audioOnly?"camera and microphone":"microphone"} will be shared only after you join.</p>
            <label><input type="checkbox" checked={mediaConsent} onChange={e=>setMediaConsent(e.target.checked)}/> I agree to share my {me.mode==="camera"&&!audioOnly?"camera and microphone":"microphone"} with this Live.</label>
            <button className="guestAction" disabled={busy||!mediaConsent} onClick={()=>void join()}>{busy?"Connecting…":"Join stage"}</button>
          </>}
          {joined&&<>
            <p role="status">🔴 You're on stage</p>
            {me?.mode==="camera"&&!audioOnly&&<video ref={preview} muted autoPlay playsInline style={{width:"100%",maxHeight:200,objectFit:"cover",borderRadius:14,filter:background==="blur"?"blur(4px)":"none"}}/>}
            <div className="guestRow"><button disabled={busy||!!me?.host_muted} onClick={()=>void toggleMic()}>{mic?"🎙 Mute mic":"🎙 Unmute mic"}</button>{me?.mode==="camera"&&!audioOnly&&<button disabled={busy} onClick={toggleCamera}>{camera?"📷 Camera off":"📷 Camera on"}</button>}</div>
            {me?.mode==="camera"&&!audioOnly&&<label>Preview <select value={background} onChange={e=>setBackground(e.target.value)}><option value="none">Normal</option><option value="blur">Blur</option></select></label>}
            <button className="guestAction" onClick={()=>{leave();setPanelOpen(false)}}>Leave stage</button>
          </>}
        </div>}
        {error&&<p role="alert" style={{color:"#ffb5b5"}}>{error}</p>}
      </section>
    </div>}
  </div>;
}
