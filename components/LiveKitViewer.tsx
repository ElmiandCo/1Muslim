"use client";

import { useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track } from "livekit-client";
import ReconnectTrivia from "../app/components/ReconnectTrivia";

export default function LiveKitViewer({ roomName, streamId, embedded = false }: { roomName: string; streamId?: string; embedded?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<Room | null>(null);
  const [status, setStatus] = useState("Connecting to live…");
  const [viewerCount, setViewerCount] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [muted, setMuted] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);
  const [reconnectKey, setReconnectKey] = useState("initial");

  useEffect(() => {
    let mounted = true;

    const attachTrack = (track: any) => {
      if (!mounted) return;
      if (track.kind === Track.Kind.Video && videoRef.current) {
        track.attach(videoRef.current);
        videoRef.current.muted = true;
        void videoRef.current.play().catch(() => {});
        setStatus("LIVE");
        setReconnecting(false);
      } else if (track.kind === Track.Kind.Audio && audioContainerRef.current) {
        const audio = track.attach();
        audio.autoplay = true;
        audio.muted = true;
        audio.setAttribute("playsinline", "true");
        audioContainerRef.current.appendChild(audio);
        void audio.play().catch(() => {});
        setStatus("LIVE");
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
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not connect to the live.");

        const room = new Room({ adaptiveStream: true, dynacast: true });
        roomRef.current = room;
        room.on(RoomEvent.TrackSubscribed, (track) => attachTrack(track));
        room.on(RoomEvent.TrackUnsubscribed, (track) => track.detach());
        room.on(RoomEvent.TrackSubscriptionFailed, () => mounted && setError("Live video could not be subscribed to. Please reconnect."));
        room.on(RoomEvent.ParticipantConnected, () => mounted && setStatus("LIVE"));
        room.on(RoomEvent.Disconnected, () => mounted && setStatus("Live connection ended."));

        await room.connect(data.url, data.token, { autoSubscribe: true });

        for (const participant of room.remoteParticipants.values()) {
          for (const publication of participant.trackPublications.values()) {
            if (!publication.isSubscribed) await publication.setSubscribed(true);
            if (publication.track) attachTrack(publication.track);
          }
        }

        if (!room.remoteParticipants.size && mounted) { setStatus("Waiting for the host video…"); setReconnecting(true); setReconnectKey(String(Date.now())); }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Unable to connect.");
      }
    };

    void connect();
    const refreshViewers = async () => {
      if (!roomRef.current || roomRef.current.state !== "connected") return;
      try {
        const response = await fetch("/api/livekit/viewer-count", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({room:roomName}),cache:"no-store"});
        if (!response.ok) return;
        const data = await response.json();
        if (mounted && typeof data.viewerCount === "number") setViewerCount(Math.max(0,data.viewerCount));
      } catch { /* Preserve the last known count during temporary network failures. */ }
    };
    const countTimer = window.setInterval(() => void refreshViewers(), 5000);
    void refreshViewers();

    return () => {
      window.clearInterval(countTimer);
      mounted = false;
      roomRef.current?.disconnect();
      roomRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      audioContainerRef.current?.replaceChildren();
    };
  }, [roomName]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
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
    <div ref={playerRef} style={{position:"relative",background:"#000",width:"100%",height:embedded?"100%":undefined,aspectRatio:embedded?undefined:"16/9",overflow:"hidden"}}>
      <video ref={videoRef} autoPlay muted playsInline controls={!embedded} style={{width:"100%",height:"100%",objectFit:"contain"}} />
      <div ref={audioContainerRef} />
      {viewerCount !== null && !error && <div role="status" aria-label={`${viewerCount.toLocaleString()} watching live`} style={{position:"absolute",top:12,right:12,zIndex:6,display:"flex",alignItems:"center",gap:6,padding:"7px 11px",borderRadius:999,background:"rgba(0,0,0,.75)",border:"1px solid rgba(255,255,255,.22)",color:"#fff",fontSize:12,fontWeight:800,backdropFilter:"blur(10px)",pointerEvents:"none"}}>👁 {viewerCount.toLocaleString()} <span style={{fontSize:10,opacity:.8}}>watching</span></div>}
      <div style={{position:"absolute",left:12,bottom:12,display:"flex",gap:7,zIndex:5}}>
        <button type="button" onClick={toggleMute} aria-label={muted ? "Unmute live audio" : "Mute live audio"} style={{border:"1px solid rgba(255,255,255,.22)",background:"rgba(0,0,0,.72)",color:"#fff",borderRadius:999,padding:"8px 11px",fontSize:11,fontWeight:800,cursor:"pointer"}}>
          {muted ? "🔇 Unmute" : "🔊 Mute"}
        </button>
        {!embedded && <button type="button" onClick={() => void toggleFullscreen()} aria-label="Expand live player" style={{border:"1px solid rgba(255,255,255,.22)",background:"rgba(0,0,0,.72)",color:"#fff",borderRadius:999,padding:"8px 11px",fontSize:11,fontWeight:800,cursor:"pointer"}}>
          ⛶ Expand
        </button>}
      </div>
      {reconnecting ? (
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
          <style jsx>{`@keyframes oneMuslimButterfly{0%,100%{transform:translateY(5px) scale(1)}50%{transform:translateY(-8px) scale(1.035)}}@keyframes oneMuslimPulse{0%,100%{transform:scale(.94);opacity:.5}50%{transform:scale(1.08);opacity:1}}`}</style>
        </div>
      ) : error ? <div style={{position:"absolute",inset:0,display:"grid",placeItems:"center",padding:24,color:"#ffd0d0",background:"rgba(0,0,0,.72)",fontSize:13,textAlign:"center"}}>{error}</div> : <span style={{position:"absolute",top:12,left:12,padding:"6px 9px",borderRadius:999,background:"#d6e7b8",color:"#071008",fontSize:10,fontWeight:900}}>● {status}</span>}
    </div>
  );
}
