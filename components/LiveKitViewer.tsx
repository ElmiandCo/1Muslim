"use client";

import { useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track } from "livekit-client";
import { createClient } from "../utils/supabase/client";
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
  const [muted, setMuted] = useState(true);
  const mutedRef = useRef(true);
  const [reconnecting, setReconnecting] = useState(false);
  const [reconnectKey, setReconnectKey] = useState("initial");
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [connectionActive, setConnectionActive] = useState(false);

  useEffect(()=>{if(!streamId)return;let alive=true;const db=createClient();const end=()=>{if(!alive||endedOnce.current)return;endedOnce.current=true;setHostEnded(true);roomRef.current?.disconnect();window.setTimeout(()=>{if(embedded){window.dispatchEvent(new CustomEvent("1muslim:live-ended",{detail:{streamId}}));setHostEnded(false)}else router.replace("/")},3800)};const check=async()=>{const {data}=await db.from("live_streams").select("status,ended_at").eq("id",streamId).maybeSingle();if(data&&(data.status==="ended"||data.status==="cancelled"||data.ended_at))end()};void check();const channel=db.channel("live-end:"+streamId).on("postgres_changes",{event:"UPDATE",schema:"public",table:"live_streams",filter:"id=eq."+streamId},payload=>{const next=payload.new as {status?:string;ended_at?:string|null};if(next.status==="ended"||next.status==="cancelled"||next.ended_at)end()}).subscribe();const timer=connectionActive?undefined:window.setInterval(()=>void check(),1000);return()=>{alive=false;if(timer)window.clearInterval(timer);void db.removeChannel(channel)}},[streamId,embedded,router,connectionActive]);

  useEffect(() => {
    let mounted = true;

    const attachTrack = (track: any, source?: string) => {
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
        void audio.play().catch(() => {});
        // Audio alone does not establish video playback.
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
        room.on(RoomEvent.TrackSubscribed, (track, publication) => attachTrack(track, publication.source));
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
          }
        });
        room.on(RoomEvent.TrackSubscriptionFailed, () => mounted && setError("Live video could not be subscribed to. Please reconnect."));
        room.on(RoomEvent.ParticipantConnected, () => mounted && setStatus("Waiting for host video…"));
        room.on(RoomEvent.Reconnecting, () => {if(mounted){setConnectionActive(false);setStatus("Reconnecting…");setReconnecting(true);setReconnectKey(String(Date.now()));}});
        room.on(RoomEvent.Reconnected, () => {if(mounted){setConnectionActive(true);setReconnecting(false);setStatus("Waiting for host video…");}});
        room.on(RoomEvent.Disconnected, () => {if(mounted){setConnectionActive(false);setStatus("Live connection ended.");setReconnecting(false);setError("The live connection ended. Please retry.");}});

        await room.connect(data.url, data.token, { autoSubscribe: true });
        if (!mounted) { await room.disconnect(); return; }
        setConnectionActive(true);

        for (const participant of room.remoteParticipants.values()) {
          for (const publication of participant.trackPublications.values()) {
            if (!publication.isSubscribed) await publication.setSubscribed(true);
            if (publication.track) attachTrack(publication.track, publication.source);
          }
        }

        if (mounted && ![...room.remoteParticipants.values()].some(p=>[...p.trackPublications.values()].some(pub=>pub.kind===Track.Kind.Video && pub.track))) { setStatus("Waiting for host video…"); setReconnecting(false); }
      } catch (err) {
        if (mounted) { setConnectionActive(false); setReconnecting(false); setStatus("Connection unavailable"); setError("The live connection could not be established. Please retry or return to Streaming."); }
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
      mounted = false;
      const oldRoom = roomRef.current;
      roomRef.current = null;
      if (oldRoom) void oldRoom.disconnect();
      attachedAudioRef.current.clear();
      if (videoRef.current) videoRef.current.srcObject = null;
      if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
      audioContainerRef.current?.replaceChildren();
    };
  }, [roomName, retryAttempt]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    mutedRef.current = next;
    if (audioContainerRef.current) {
      audioContainerRef.current.querySelectorAll("audio").forEach((audio) => {
        audio.muted = next;
        if (!next) void audio.play().catch(() => {});
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
      <div ref={audioContainerRef} />
      {streamId&&<LiveLightOverlay streamId={streamId}/>}
      {!embedded&&<><div className="omViewerTapCounter" aria-label={`${tapCount} screen taps`}>✨ {tapCount.toLocaleString()} taps</div>{tapBursts.map(t=><span key={t.id} className="omViewerTapBurst" style={{left:t.x,top:t.y}}>💜</span>)}<a className="omViewerExit" href="/streaming" aria-label="Exit live viewer">✕</a></>}
      {viewerCount !== null && !error && <div role="status" aria-label={`${viewerCount.toLocaleString()} watching live`} className={viewerPulse?"omViewerCountPulse":""} style={{position:"absolute",top:12,right:12,zIndex:6,display:"flex",alignItems:"center",gap:6,padding:"7px 11px",borderRadius:999,background:"rgba(0,0,0,.75)",border:"1px solid rgba(255,255,255,.22)",color:"#fff",fontSize:12,fontWeight:800,backdropFilter:"blur(10px)",pointerEvents:"none"}}>👁 {viewerCount.toLocaleString()} <span style={{fontSize:10,opacity:.8}}>watching</span>{totalViews!==null&&<span style={{fontSize:10,opacity:.9,borderLeft:"1px solid #ffffff55",paddingLeft:8,marginLeft:2}}>↗ {totalViews.toLocaleString()} total</span>}</div>}
      <div style={{position:"absolute",left:12,bottom:12,display:"flex",gap:7,alignItems:"center",flexWrap:"wrap",zIndex:5}}>
        <button type="button" onClick={toggleMute} aria-label={muted ? "Unmute live audio" : "Mute live audio"} style={{border:"1px solid rgba(255,255,255,.22)",background:"rgba(0,0,0,.72)",color:"#fff",borderRadius:999,padding:"8px 11px",fontSize:11,fontWeight:800,cursor:"pointer"}}>
          {muted ? "🔇 Unmute" : "🔊 Mute"}
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
      @media(prefers-reduced-motion:reduce){.omViewerTapBurst,.omViewerCountPulse{animation:none!important}}
      .omHostEndedNotice{position:absolute;z-index:50;top:15%;left:50%;transform:translateX(-50%);width:min(88%,380px);padding:20px 18px;text-align:center;color:#f6f4e9;background:#0a2925ed;border:1px solid #edcf8a9c;border-radius:23px;box-shadow:0 16px 60px #0009;backdrop-filter:blur(16px);display:grid;gap:10px;animation:omHostEndIn .45s ease-out both}.omHostEndedNotice span{font-size:10px;letter-spacing:.2em;color:#ecd19a}.omHostEndedNotice strong{font-size:19px}.omHostEndedNotice small{color:#bbd0c6}.omHostEndedNotice button{padding:10px;border-radius:99px;background:#edd39e;color:#103126;border:0;font-weight:800;cursor:pointer}@keyframes omHostEndIn{from{opacity:0;transform:translate(-50%,28px)}to{opacity:1;transform:translate(-50%,0)}}@media(prefers-reduced-motion:reduce){.omHostEndedNotice{animation:none}}
      `}</style>
    </div>
  );
}
