"use client";

import { useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track } from "livekit-client";
import { createClient } from "../utils/supabase/client";
import { shouldApplyPresenceEvent, type PresenceVersion } from "../lib/live-discovery-state";
import { useRouter } from "next/navigation";
import ReconnectTrivia from "../app/components/ReconnectTrivia";
import ShareLiveButton from "../app/components/ShareLiveButton";
import LiveLightOverlay from "./LiveLightOverlay";

export default function LiveKitViewer({ roomName, streamId, embedded = false }: { roomName: string; streamId?: string; embedded?: boolean }) {
  const router=useRouter();
  const [hostEnded,setHostEnded]=useState(false);
  const endedOnce=useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraVideo,setHasCameraVideo] = useState(false);
  const [hasScreenVideo,setHasScreenVideo] = useState(false);
  const [shareLayout,setShareLayout] = useState<"pip"|"split">("pip");
  const audioContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<Room | null>(null);
  const attachedAudioRef = useRef<Map<string,HTMLMediaElement>>(new Map());
  const [status, setStatus] = useState("Connecting to live…");
  const [viewerCount, setViewerCount] = useState<number | null>(null);
  const [viewerPulse,setViewerPulse]=useState(false);
  const previousViewerCount=useRef<number|null>(null);
  const [tapCount,setTapCount]=useState(0);
  const [tapBursts,setTapBursts]=useState<{id:number,x:number,y:number}[]>([]);
  const tapSequence=useRef(0);
  const registerTap=(e:React.MouseEvent<HTMLDivElement>)=>{if(embedded||!streamId||!(e.target instanceof HTMLElement)||e.target.closest("button,a,input"))return;const bounds=e.currentTarget.getBoundingClientRect();const id=++tapSequence.current;setTapCount(v=>v+1);setTapBursts(v=>[...v.slice(-8),{id,x:e.clientX-bounds.left,y:e.clientY-bounds.top}]);window.setTimeout(()=>setTapBursts(v=>v.filter(t=>t.id!==id)),900)};
  const [totalViews, setTotalViews] = useState<number | null>(null);
  const [error, setError] = useState("");
  // Attempt audible playback immediately where browsers permit it.
  // If autoplay is blocked, expose a clear one-tap recovery control.
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  const [audioNeedsGesture, setAudioNeedsGesture] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [reconnectKey, setReconnectKey] = useState("initial");
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [connectionActive, setConnectionActive] = useState(false);
  const [isAudioBroadcast,setIsAudioBroadcast] = useState(false);
  const [hasRemoteAudio,setHasRemoteAudio] = useState(false);
  const [hostConnecting,setHostConnecting] = useState(false);
  const [voiceAvatar,setVoiceAvatar] = useState<string|null>(null);
  const [voiceName,setVoiceName] = useState("1Muslim Creator");
  const [voiceEnergy,setVoiceEnergy] = useState(0);
  const hostIdRef=useRef<string|null>(null);
  const hostEndSignalRef=useRef<()=>void>(()=>{});
  const voiceAnalyzerCleanupRef=useRef<(()=>void)|null>(null);
  const voiceAudioContextRef=useRef<AudioContext|null>(null);

  // Render the voice stage before the first remote audio packet arrives.
  useEffect(()=>{
    if(!streamId)return;
    let cancelled=false;
    const db=createClient();
    void (async()=>{
      const {data:stream}=await db.from("live_streams").select("host_id,aspect_ratio").eq("id",streamId).maybeSingle();
      if(cancelled||!stream)return;
      hostIdRef.current=stream.host_id;
      setIsAudioBroadcast(stream.aspect_ratio==="1:1");
      const {data:profile}=await db.from("profiles").select("*").eq("id",stream.host_id).maybeSingle();
      if(cancelled||!profile)return;
      setVoiceName(String(profile.display_name||profile.username||"1Muslim Creator"));
      const avatar=profile.avatar_url||profile.profile_picture_url||profile.avatar;
      setVoiceAvatar(typeof avatar==="string"&&avatar.startsWith("https://")?avatar:null);
    })();
    return()=>{cancelled=true};
  },[streamId]);

  // Server-authoritative Live 2.0 presence and terminal updates; no steady-state polling.
  useEffect(()=>{
    if(!streamId)return;
    let alive=true,checking=false;
    let recoveryTimer:number|null=null;
    let subscribeWatchdog:number|null=null;
    let retry=0;
    let terminalSubscribed=false, presenceSubscribed=false;
    let seenPresence: PresenceVersion | undefined;
    const db=createClient();
    const end=()=>{
      if(!alive||endedOnce.current)return;
      endedOnce.current=true;
      setHostEnded(true);setHostConnecting(false);setError("");
      roomRef.current?.disconnect();
      window.setTimeout(()=>{
        if(!alive)return;
        if(embedded)window.dispatchEvent(new CustomEvent("1muslim:live-ended",{detail:{streamId}}));
        else router.replace("/");
      },3800);
    };
    hostEndSignalRef.current=end;
    const check=async()=>{
      if(!alive||checking||endedOnce.current)return;
      checking=true;
      try{
        const {data}=await db.from("live_streams")
          .select("status,ended_at,last_heartbeat_at,aspect_ratio").eq("id",streamId).maybeSingle();
        if(!alive||!data)return;
        if(data.status==="ended"||data.status==="cancelled"||data.ended_at){end();return;}
        setIsAudioBroadcast(data.aspect_ratio==="1:1");
        const last=Date.parse(data.last_heartbeat_at||"");
        if(data.status==="live"&&Number.isFinite(last)&&Date.now()-last>35000)setHostConnecting(true);
        else if(hostIdRef.current&&roomRef.current?.remoteParticipants.has(hostIdRef.current))setHostConnecting(false);
      }catch{/* A transient database failure must not end the broadcast. */}
      finally{checking=false;}
    };
    const scheduleRecovery=()=>{
      if(!alive||endedOnce.current||recoveryTimer!==null||terminalSubscribed&&presenceSubscribed)return;
      const ceiling=Math.min(30000,2000*2**Math.min(retry,4));
      retry=Math.min(retry+1,5);
      recoveryTimer=window.setTimeout(()=>{
        recoveryTimer=null;
        if(!alive||endedOnce.current)return;
        void check();
        scheduleRecovery();
      },Math.max(500,Math.floor(Math.random()*ceiling)));
    };
    const subscriptionStatus=(which:"terminal"|"presence",status:string)=>{
      const ready=status==="SUBSCRIBED";
      if(which==="terminal")terminalSubscribed=ready;
      else presenceSubscribed=ready;
      if(terminalSubscribed&&presenceSubscribed){
        if(subscribeWatchdog!==null){clearTimeout(subscribeWatchdog);subscribeWatchdog=null;}
        retry=0;
        if(recoveryTimer!==null){clearTimeout(recoveryTimer);recoveryTimer=null;}
        void check();
      }else if(status==="CHANNEL_ERROR"||status==="TIMED_OUT"||status==="CLOSED")scheduleRecovery();
    };
    const terminalChannel=db.channel("live-end:"+streamId)
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"live_streams",filter:"id=eq."+streamId},payload=>{
        const next=payload.new as {status?:string;ended_at?:string|null;aspect_ratio?:string};
        if(next.status==="ended"||next.status==="cancelled"||next.ended_at){end();return;}
        if(next.aspect_ratio)setIsAudioBroadcast(next.aspect_ratio==="1:1");
      }).subscribe(status=>subscriptionStatus("terminal",status));
    const presenceChannel=db.channel("live2-presence:"+streamId)
      .on("postgres_changes",{event:"*",schema:"public",table:"live_presence",filter:"stream_id=eq."+streamId},payload=>{
        const row=payload.new as {state?:string;version?:number;session_id?:string;stream_id?:string};
        if(!alive||row.stream_id!==streamId)return;
        const next={...row,version:Number(row.version)} as PresenceVersion;
        if(!shouldApplyPresenceEvent(seenPresence,next))return;
        seenPresence=next;
        if(next.state==="ENDED"){end();return;}
        if(next.state==="RECONNECTING"||next.state==="STARTING")setHostConnecting(true);
        else if(next.state==="READY_AUDIO"||next.state==="READY_VIDEO"){
          setHostConnecting(false);
          setIsAudioBroadcast(next.state==="READY_AUDIO");
        }
      }).subscribe(status=>subscriptionStatus("presence",status));
    // If one channel never reaches SUBSCRIBED, retain bounded recovery checks.
    // This is one-shot connection detection, not a steady-state poll.
    subscribeWatchdog=window.setTimeout(()=>{
      subscribeWatchdog=null;
      if(alive&&!endedOnce.current&&!(terminalSubscribed&&presenceSubscribed))scheduleRecovery();
    },8000);
    void check();
    const onResume=()=>{if(document.visibilityState==="visible")void check();};
    document.addEventListener("visibilitychange",onResume);
    return()=>{
      alive=false;hostEndSignalRef.current=()=>{};
      if(recoveryTimer!==null)clearTimeout(recoveryTimer);
      if(subscribeWatchdog!==null)clearTimeout(subscribeWatchdog);
      document.removeEventListener("visibilitychange",onResume);
      void db.removeChannel(terminalChannel);void db.removeChannel(presenceChannel);
    };
  },[streamId,embedded,router]);

  useEffect(() => {
    let mounted = true;
    const retryTimers:number[]=[];
    let retryQueued=false;
    const queueRetry=(delay:number)=>{
      if(retryQueued)return;
      retryQueued=true;
      retryTimers.push(window.setTimeout(()=>{
        if(mounted&&!endedOnce.current){setError("");setRetryAttempt(n=>n+1);}
      },delay));
    };

    const attachTrack = (track: any, source?: string, participantIdentity?: string) => {
      if (!mounted) return;
      if (track.kind === Track.Kind.Video) {
        const isScreen = source === Track.Source.ScreenShare || track.source === Track.Source.ScreenShare;
        const element = isScreen ? screenVideoRef.current : videoRef.current;
        if (!element) return;
        track.attach(element);
        element.muted = true;
        void element.play().catch(() => {});
        if (isScreen) setHasScreenVideo(true);
        else setHasCameraVideo(true);
        setStatus("LIVE");
        setError("");
        setReconnecting(false);
      } else if (track.kind === Track.Kind.Audio && audioContainerRef.current) {
        // Avoid duplicating playback elements when a remote track is re-subscribed.
        if (attachedAudioRef.current.has(track.sid)) return;
        const audio = track.attach();
        attachedAudioRef.current.set(track.sid,audio);
        audio.autoplay = true;
        audio.muted = mutedRef.current;
        audio.setAttribute("playsinline", "true");
        audioContainerRef.current.appendChild(audio);
        void audio.play().then(() => { if (mounted) setAudioNeedsGesture(false); })
          .catch(() => { if (mounted && !mutedRef.current) setAudioNeedsGesture(true); });
        setHasRemoteAudio(true);
        setHostConnecting(false);
        setStatus("LIVE · Audio");
        setError("");
        setReconnecting(false);
        // Analyze the host's remote microphone to drive the avatar's aura.
        if (!voiceAnalyzerCleanupRef.current && (!hostIdRef.current || participantIdentity===hostIdRef.current)) {
          try {
            const context=new AudioContext();
            const sourceNode=context.createMediaStreamSource(new MediaStream([track.mediaStreamTrack]));
            const analyser=context.createAnalyser();
            analyser.fftSize=512;analyser.smoothingTimeConstant=.82;
            sourceNode.connect(analyser);
            const samples=new Uint8Array(analyser.fftSize);
            let frame=0,active=true,last=0,smoothed=0;
            const tick=(now:number)=>{
              if(!active)return;
              analyser.getByteTimeDomainData(samples);
              let sum=0;for(const sample of samples){const v=(sample-128)/128;sum+=v*v}
              const rms=Math.sqrt(sum/samples.length);
              smoothed=smoothed*.72+Math.min(1,Math.max(0,(rms-.012)*8))*.28;
              if(now-last>70){setVoiceEnergy(smoothed);last=now}
              frame=requestAnimationFrame(tick);
            };
            frame=requestAnimationFrame(tick);
            voiceAudioContextRef.current=context;
            voiceAnalyzerCleanupRef.current=()=>{
              active=false;cancelAnimationFrame(frame);sourceNode.disconnect();
              void context.close().catch(()=>{});
              voiceAudioContextRef.current=null;
            };
          }catch{/* The static avatar remains available if Web Audio is unavailable. */}
        }
      }
    };

    const connect = async () => {
      try {
        setStatus("Connecting to live…");
        setError("");
        const response = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room: roomName, role: "viewer" }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.url || !data.token) throw new Error("Live connection is temporarily unavailable. Please try again.");

        const room = new Room({ adaptiveStream: false, dynacast: true });
        roomRef.current = room;
        room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => attachTrack(track, publication.source, participant.identity));
        room.on(RoomEvent.TrackUnsubscribed, (track, publication) => {
          if (track.kind === Track.Kind.Video) {
            const isScreen = publication.source === Track.Source.ScreenShare;
            const element = isScreen ? screenVideoRef.current : videoRef.current;
            // Never remove React-owned video elements on LiveKit unsubscribe.
            const stream = element?.srcObject;
            if (element && stream instanceof MediaStream && stream.getTracks().includes(track.mediaStreamTrack)) {
              track.detach(element);
              element.srcObject = null;
              if (isScreen) setHasScreenVideo(false);
              else setHasCameraVideo(false);
            }
          } else if (track.kind === Track.Kind.Audio) {
            track.detach().forEach(el => { if (el.parentNode === audioContainerRef.current) el.remove(); });
            if (track.sid) attachedAudioRef.current.delete(track.sid);
            setHasRemoteAudio(attachedAudioRef.current.size>0);
            if(attachedAudioRef.current.size===0){
              setAudioNeedsGesture(false);
              voiceAnalyzerCleanupRef.current?.();voiceAnalyzerCleanupRef.current=null;setVoiceEnergy(0);
            }
          }
        });
        room.on(RoomEvent.TrackSubscriptionFailed, () => mounted && setError("Live media could not be subscribed to. Please reconnect."));
        room.on(RoomEvent.ParticipantConnected, (participant) => {
          if(!mounted)return;
          if(participant.identity===hostIdRef.current){setHostConnecting(false);setStatus("Host connected…")}
        });
        room.on(RoomEvent.ParticipantDisconnected, (participant) => {
          if(!mounted)return;
          if(hostIdRef.current && participant.identity===hostIdRef.current){
            setHostConnecting(true);setStatus("Host reconnecting…");
          }
        });
        room.on(RoomEvent.DataReceived, (payload, participant, _kind, topic) => {
          if(!mounted||topic!=="live-status"||!hostIdRef.current||participant?.identity!==hostIdRef.current)return;
          try{const message=JSON.parse(new TextDecoder().decode(payload));if(message.type==="live-ended")hostEndSignalRef.current()}catch{}
        });
        room.on(RoomEvent.Reconnecting, () => {if(mounted){setConnectionActive(false);setStatus("Reconnecting…");setReconnecting(true);setReconnectKey(String(Date.now()));}});
        room.on(RoomEvent.Reconnected, () => {if(mounted){setConnectionActive(true);setReconnecting(false);setError("");setStatus("Waiting for host…");}});
        room.on(RoomEvent.Disconnected, () => {
          if(!mounted||endedOnce.current)return;
          setConnectionActive(false);setStatus("Reconnecting to Live…");setReconnecting(true);
          setReconnectKey(String(Date.now()));
          queueRetry(1500);
        });

        await room.connect(data.url, data.token, { autoSubscribe: true });
        if (!mounted) { await room.disconnect(); return; }
        setConnectionActive(true);

        for (const participant of room.remoteParticipants.values()) {
          for (const publication of participant.trackPublications.values()) {
            if (!publication.isSubscribed) await publication.setSubscribed(true);
            if (publication.track) attachTrack(publication.track, publication.source, participant.identity);
          }
        }

        if (mounted) {
          const publications=[...room.remoteParticipants.values()].flatMap(p=>[...p.trackPublications.values()]);
          if(!publications.some(pub=>pub.kind===Track.Kind.Video && pub.track)){
            setStatus(publications.some(pub=>pub.kind===Track.Kind.Audio && pub.track)?"LIVE · Audio":"Waiting for host…");
            setReconnecting(false);
          }
        }
      } catch (err) {
        if(mounted&&!endedOnce.current){
          setConnectionActive(false);setReconnecting(true);setStatus("Reconnecting to Live…");
          setReconnectKey(String(Date.now()));
          queueRetry(Math.min(12000,1200*Math.pow(2,Math.min(retryAttempt,3))));
        }
      }
    };

    void connect();
    const refreshViewers = async () => {
      if (!roomRef.current || roomRef.current.state !== "connected") return;
      try {
        const response = await fetch("/api/livekit/viewer-count", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({room:roomName}),cache:"no-store"});
        if (!response.ok) return;
        const data = await response.json();
        if (mounted && typeof data.viewerCount === "number") {const next=Math.max(0,data.viewerCount);if(previousViewerCount.current!==null&&next>previousViewerCount.current){setViewerPulse(true);window.setTimeout(()=>setViewerPulse(false),1700)}previousViewerCount.current=next;setViewerCount(next)}
        if (mounted && typeof data.totalViews === "number") setTotalViews(Math.max(0,data.totalViews));
      } catch { /* Preserve the last known count during temporary network failures. */ }
    };
    const countTimer = window.setInterval(() => void refreshViewers(), 5000);
    void refreshViewers();

    return () => {
      window.clearInterval(countTimer);
      retryTimers.forEach(timer=>window.clearTimeout(timer));
      mounted = false;
      const oldRoom = roomRef.current;
      roomRef.current = null;
      if (oldRoom) void oldRoom.disconnect();
      attachedAudioRef.current.clear();
      voiceAnalyzerCleanupRef.current?.();voiceAnalyzerCleanupRef.current=null;
      if (videoRef.current) videoRef.current.srcObject = null;
      if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
      audioContainerRef.current?.replaceChildren();
    };
  }, [roomName, retryAttempt]);

  const toggleMute = () => {
    // An autoplay rejection is not an intentional mute: the first tap should
    // unlock playback rather than mute the host again.
    const next = audioNeedsGesture ? false : !muted;
    setMuted(next);
    mutedRef.current = next;
    if(next)setAudioNeedsGesture(false);
    if(!next)void voiceAudioContextRef.current?.resume().catch(()=>{});
    if (audioContainerRef.current) {
      audioContainerRef.current.querySelectorAll("audio").forEach((audio) => {
        audio.muted = next;
        if (!next) void audio.play()
          .then(() => setAudioNeedsGesture(false))
          .catch(() => setAudioNeedsGesture(true));
      });
    }
  };

  const toggleFullscreen = async () => {
    if (!playerRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
    } else {
      await playerRef.current.requestFullscreen().catch(() => {});
    }
  };

  return (
    <div ref={playerRef} onClick={registerTap} className={embedded?"omLiveEmbeddedPlayer":"omLiveImmersiveViewer"} style={{position:"relative",background:"#000",width:"100%",height:embedded?"100%":undefined,aspectRatio:embedded?undefined:"16/9",overflow:"hidden"}}>
      {hostEnded&&<div role="status" aria-live="assertive" className="omHostEndedNotice"><span>✦ LIVE COMPLETE</span><strong>The host has ended this Live</strong><small>{embedded?"Closing your floating player…":"Taking you Home…"}</small><button type="button" onClick={()=>{if(embedded)window.dispatchEvent(new CustomEvent("1muslim:live-ended",{detail:{streamId}}));else router.replace("/")}}>Go Home now →</button></div>}
      <div className="omLiveVideoStage" data-screen={hasScreenVideo?"yes":"no"} data-layout={hasScreenVideo&&hasCameraVideo?shareLayout:"solo"}>
        <video ref={videoRef} className="omCameraVideo" autoPlay muted playsInline controls={!embedded} aria-label="Host camera" style={{display:hasScreenVideo&&!hasCameraVideo?"none":"block"}} />
        <video ref={screenVideoRef} className="omScreenVideo" autoPlay muted playsInline aria-label="Shared screen" style={{display:hasScreenVideo?"block":"none"}} />
      </div>
      {((isAudioBroadcast||hasRemoteAudio)&&!hasCameraVideo&&!hasScreenVideo)&&<div className="omVoiceViewerStage" aria-label="Live audio avatar">
        <div className="omVoiceViewerAura" style={{transform:"scale("+(1+voiceEnergy*.28)+")"}}/>
        <div className="omVoiceViewerPortrait" style={{transform:"scale("+(1+voiceEnergy*.1)+")"}}>{voiceAvatar?<img src={voiceAvatar} alt="" referrerPolicy="no-referrer"/>:<span aria-hidden="true">✧</span>}</div>
        <strong>{voiceName}</strong><small>{hasRemoteAudio?"● Audio Live":"Connecting to host audio…"}</small>
      </div>}
      {hostConnecting&&!hostEnded&&<div className="omHostReconnecting" role="status" aria-live="polite">Host connection interrupted · Reconnecting…</div>}
      {audioNeedsGesture&&hasRemoteAudio&&!hostEnded&&<div role="status" aria-live="polite" style={{position:"absolute",bottom:65,left:12,zIndex:9,color:"#fff",background:"#0c2923e8",border:"1px solid #9ce9c2",borderRadius:12,padding:"8px 12px",fontSize:12,pointerEvents:"none"}}>🔊 Tap “Hear Live” below to enable host audio</div>}
      <div ref={audioContainerRef} />
      {streamId&&<LiveLightOverlay streamId={streamId}/>}
      {!embedded&&<><div className="omViewerTapCounter" aria-label={`${tapCount} screen taps`}>✨ {tapCount.toLocaleString()} taps</div>{tapBursts.map(t=><span key={t.id} className="omViewerTapBurst" style={{left:t.x,top:t.y}}>💜</span>)}<a className="omViewerExit" href="/streaming" aria-label="Exit live viewer">✕</a></>}
      {viewerCount !== null && !error && <div role="status" aria-label={`${viewerCount.toLocaleString()} watching live`} className={viewerPulse?"omViewerCountPulse":""} style={{position:"absolute",top:12,right:12,zIndex:6,display:"flex",alignItems:"center",gap:6,padding:"7px 11px",borderRadius:999,background:"rgba(0,0,0,.75)",border:"1px solid rgba(255,255,255,.22)",color:"#fff",fontSize:12,fontWeight:800,backdropFilter:"blur(10px)",pointerEvents:"none"}}>👁 {viewerCount.toLocaleString()} <span style={{fontSize:10,opacity:.8}}>watching</span>{totalViews!==null&&<span style={{fontSize:10,opacity:.9,borderLeft:"1px solid #ffffff55",paddingLeft:8,marginLeft:2}}>↗ {totalViews.toLocaleString()} total</span>}</div>}
      <div style={{position:"absolute",left:12,bottom:12,display:"flex",gap:7,alignItems:"center",flexWrap:"wrap",zIndex:5}}>
        <button type="button" onClick={toggleMute} aria-label={audioNeedsGesture ? "Hear live audio" : muted ? "Unmute live audio" : "Mute live audio"} style={{border:"1px solid rgba(255,255,255,.22)",background:"rgba(0,0,0,.72)",color:"#fff",borderRadius:999,padding:"8px 11px",fontSize:11,fontWeight:800,cursor:"pointer"}}>
          {audioNeedsGesture ? "🔊 Hear Live" : muted ? "🔇 Unmute" : "🔊 Mute"}
        </button>
        {hasScreenVideo&&hasCameraVideo&&<button type="button" onClick={()=>setShareLayout(v=>v==="pip"?"split":"pip")} aria-label={shareLayout==="pip"?"Switch to split screen":"Switch to picture in picture"} style={{border:"1px solid rgba(255,255,255,.22)",background:"rgba(0,0,0,.72)",color:"#fff",borderRadius:999,padding:"8px 11px",fontSize:11,fontWeight:800,cursor:"pointer"}}>{shareLayout==="pip"?"▣ Split":"▧ Picture-in-picture"}</button>}
        {streamId && <ShareLiveButton streamId={streamId} compact={embedded} />}
        {!embedded && <button type="button" onClick={() => void toggleFullscreen()} aria-label="Expand live player" style={{border:"1px solid rgba(255,255,255,.22)",background:"rgba(0,0,0,.72)",color:"#fff",borderRadius:999,padding:"8px 11px",fontSize:11,fontWeight:800,cursor:"pointer"}}>
          ⛶ Expand
        </button>}
      </div>
      {error ? <div role="alert" style={{position:"absolute",inset:0,zIndex:12,display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",gap:14,padding:24,color:"#e6f2e7",background:"#0b1510",fontSize:14,textAlign:"center"}}><strong style={{fontSize:19}}>Live connection unavailable</strong><span>{error}</span><div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center"}}><button type="button" onClick={() => { setError(""); setReconnecting(false); setRetryAttempt(n => n + 1); }} style={{border:"1px solid #76ae83",background:"#173d27",color:"#fff",borderRadius:12,padding:"10px 18px",cursor:"pointer"}}>↻ Retry connection</button><a href="/streaming" style={{border:"1px solid #566b5b",color:"#fff",borderRadius:12,padding:"10px 18px",textDecoration:"none"}}>← All streaming</a></div></div> : reconnecting ? (
        <div style={{position:"absolute",inset:0,zIndex:10,background:"radial-gradient(circle at 50% 35%,rgba(72,103,68,.2),rgba(3,7,4,.96) 72%)",display:"grid",placeItems:"center",overflow:"hidden"}}>
          <div style={{position:"absolute",width:190,height:190,borderRadius:"50%",border:"1px solid rgba(214,231,184,.08)",boxShadow:"0 0 80px rgba(126,170,106,.08)",animation:"oneMuslimPulse 3.5s ease-in-out infinite"}} />
          <div style={{position:"relative",width:180,height:130,display:"grid",placeItems:"center",animation:"oneMuslimButterfly 3.2s ease-in-out infinite"}}>
            <span style={{fontSize:74,filter:"drop-shadow(0 10px 35px rgba(174,214,143,.18))"}}>🦋</span>
          </div>
          <div style={{position:"absolute",top:16,left:16,right:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{padding:"6px 9px",borderRadius:999,background:"rgba(214,231,184,.12)",border:"1px solid rgba(214,231,184,.2)",color:"#d6e7b8",fontSize:9,fontWeight:900}}>1MUSLIM</span>
            <span style={{padding:"6px 9px",borderRadius:999,background:"rgba(0,0,0,.4)",color:"#d7e0d8",fontSize:9,fontWeight:850}}>● RECONNECTING</span>
          </div>
          <ReconnectTrivia mode="reconnect" eventKey={reconnectKey} />
          
        </div>
      ) : error ? <div style={{position:"absolute",inset:0,display:"grid",placeItems:"center",padding:24,color:"#ffd0d0",background:"rgba(0,0,0,.72)",fontSize:13,textAlign:"center"}}>{error}</div> : <span style={{position:"absolute",top:12,left:12,padding:"6px 9px",borderRadius:999,background:"#d6e7b8",color:"#071008",fontSize:10,fontWeight:900}}>● {status}</span>}
      <style jsx>{`
      .omVoiceViewerStage{position:absolute;inset:0;z-index:3;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;overflow:hidden;background:radial-gradient(ellipse at 50% 40%,#164938,#081b18 60%,#020706 100%);color:#e5f9f0}
      .omVoiceViewerAura{position:absolute;width:min(66vw,260px);aspect-ratio:1;border-radius:50%;border:2px solid #87f8ce80;box-shadow:0 0 45px #34e5a555;animation:omVoiceViewerBreathe 3.6s ease-in-out infinite;pointer-events:none}
      .omVoiceViewerPortrait{position:relative;width:min(56vw,220px);aspect-ratio:1;display:grid;place-items:center;border-radius:50%;border:3px solid #c8fce6;overflow:hidden;background:radial-gradient(circle at 35% 25%,#28755f,#07261c 75%);box-shadow:0 0 35px #20c78c55;transition:transform .12s linear}
      .omVoiceViewerPortrait img{width:100%;height:100%;object-fit:cover}.omVoiceViewerPortrait span{font-size:80px}
      .omVoiceViewerStage strong,.omVoiceViewerStage small{position:relative;z-index:2;text-shadow:0 2px 8px #000b}
      .omVoiceViewerStage strong{font-size:17px}.omVoiceViewerStage small{font-size:11px;color:#a5ead0}
      .omHostReconnecting{position:absolute;top:48px;left:50%;transform:translateX(-50%);z-index:15;max-width:90%;padding:9px 13px;border-radius:16px;background:#4b2c16e8;color:#fff2da;font-size:12px;text-align:center}
      @keyframes omVoiceViewerBreathe{0%,100%{opacity:.65}50%{opacity:1}}
      .omLiveVideoStage{position:relative;width:100%;height:100%;overflow:hidden;background:#000}
      .omLiveVideoStage video{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000}
      .omLiveTheater .omLiveVideoStage{background:#050b0b}
      .omLiveTheater .omLiveVideoStage video{object-fit:cover!important;background:transparent}
      .omLiveTheater .omLiveVideoStage[data-screen="yes"] .omScreenVideo{object-fit:contain!important;background:#030707}
      .omLiveTheater .omLiveImmersiveViewer{height:100%!important;min-height:100%!important;aspect-ratio:auto!important}
      .omLiveTheater .omViewerExit{z-index:30}
      .omLiveTheater .omViewerTapCounter{top:calc(env(safe-area-inset-top) + 65px)}
      .omLiveTheater .omViewerExit{top:calc(env(safe-area-inset-top) + 14px)}
      .omLiveVideoStage[data-screen="yes"] .omScreenVideo{z-index:1}
      .omLiveVideoStage[data-screen="yes"] .omCameraVideo{position:absolute;inset:auto 12px 70px auto;width:27%;height:30%;max-height:210px;border:2px solid #d6e7b8;border-radius:14px;z-index:2;box-shadow:0 8px 28px #000b;background:#0b1510}
      .omLiveVideoStage[data-screen="yes"][data-layout="split"]{display:grid;grid-template-columns:minmax(0,3fr) minmax(145px,1fr);gap:5px}
      .omLiveVideoStage[data-screen="yes"][data-layout="split"] .omScreenVideo{position:relative;grid-column:1;grid-row:1;min-width:0}
      .omLiveVideoStage[data-screen="yes"][data-layout="split"] .omCameraVideo{position:relative;inset:auto;grid-column:2;grid-row:1;width:100%;height:100%;max-height:none;border-radius:0;border:0}
      @keyframes oneMuslimButterfly{0%,100%{transform:translateY(5px) scale(1)}50%{transform:translateY(-8px) scale(1.035)}}
      @keyframes oneMuslimPulse{0%,100%{transform:scale(.94);opacity:.5}50%{opacity:1;transform:scale(1.08)}}
      .omViewerTapCounter{position:absolute;top:54px;right:12px;z-index:8;border-radius:99px;padding:7px 11px;background:#0a0a16a8;border:1px solid #cfb4ff55;color:#eadbff;font-size:11px;font-weight:800;pointer-events:none}
      .omViewerTapBurst{position:absolute;z-index:9;pointer-events:none;font-size:30px;transform:translate(-50%,-50%);animation:omViewerHeartFloat .9s ease-out forwards}
      .omViewerExit{position:absolute;top:12px;left:12px;z-index:11;border:1px solid #ffffff66;background:#080811a8;border-radius:99px;color:#fff;text-decoration:none;padding:8px 13px;font-size:16px}
      .omViewerCountPulse{animation:omViewerCountGlow 1.7s ease-out!important}
      @keyframes omViewerHeartFloat{from{opacity:1;transform:translate(-50%,-50%) scale(.6)}to{opacity:0;transform:translate(-50%,-155%) scale(1.6)}}
      @keyframes omViewerCountGlow{0%,100%{box-shadow:0 0 0 transparent;color:#fff}30%{box-shadow:0 0 24px #bd8dff,0 0 38px #6ee7e3;color:#e5c4ff}60%{box-shadow:0 0 22px #85e9ff;color:#c7fff8}}
      @media(max-width:700px){.omLiveImmersiveViewer{height:100dvh!important;min-height:100dvh!important;aspect-ratio:auto!important}.omLiveImmersiveViewer video{width:100%!important;height:100%!important;object-fit:contain!important}.omLiveTheater .omLiveImmersiveViewer video:not(.omScreenVideo){object-fit:cover!important}.omLiveVideoStage[data-screen="yes"][data-layout="split"]{grid-template-columns:1fr;grid-template-rows:minmax(0,3fr) minmax(100px,1fr)}.omLiveVideoStage[data-screen="yes"][data-layout="split"] .omScreenVideo{grid-column:1;grid-row:1}.omLiveVideoStage[data-screen="yes"][data-layout="split"] .omCameraVideo{grid-column:1;grid-row:2}.omLiveImmersiveViewer .omViewerExit{top:calc(env(safe-area-inset-top) + 12px)}}
      @media(prefers-reduced-motion:reduce){.omViewerTapBurst,.omViewerCountPulse,.omVoiceViewerAura{animation:none!important}}
      .omHostEndedNotice{position:absolute;z-index:50;top:15%;left:50%;transform:translateX(-50%);width:min(88%,380px);padding:20px 18px;text-align:center;color:#f6f4e9;background:#0a2925ed;border:1px solid #edcf8a9c;border-radius:23px;box-shadow:0 16px 60px #0009;backdrop-filter:blur(16px);display:grid;gap:10px;animation:omHostEndIn .45s ease-out both}.omHostEndedNotice span{font-size:10px;letter-spacing:.2em;color:#ecd19a}.omHostEndedNotice strong{font-size:19px}.omHostEndedNotice small{color:#bbd0c6}.omHostEndedNotice button{padding:10px;border-radius:99px;background:#edd39e;color:#103126;border:0;font-weight:800;cursor:pointer}@keyframes omHostEndIn{from{opacity:0;transform:translate(-50%,28px)}to{opacity:1;transform:translate(-50%,0)}}@media(prefers-reduced-motion:reduce){.omHostEndedNotice{animation:none}}
      `}</style>
    </div>
  );
}
