"use client";

import { useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track } from "livekit-client";

export default function LiveKitViewer({ roomName, streamId }: { roomName: string; streamId?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContainerRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<Room | null>(null);
  const [status, setStatus] = useState("Connecting to live…");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const attachTrack = (track: any) => {
      if (!mounted) return;
      if (track.kind === Track.Kind.Video && videoRef.current) {
        track.attach(videoRef.current);
        videoRef.current.muted = true;
        void videoRef.current.play().catch(() => {});
        setStatus("LIVE");
      } else if (track.kind === Track.Kind.Audio && audioContainerRef.current) {
        const audio = track.attach();
        audio.autoplay = true;
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
        room.on(RoomEvent.TrackSubscriptionFailed, () => {
          if (mounted) setError("Live video could not be subscribed to. Please reconnect.");
        });
        room.on(RoomEvent.ParticipantConnected, () => mounted && setStatus("LIVE"));
        room.on(RoomEvent.Disconnected, () => mounted && setStatus("Live connection ended."));

        await room.connect(data.url, data.token, { autoSubscribe: true });

        for (const participant of room.remoteParticipants.values()) {
          for (const publication of participant.trackPublications.values()) {
            if (!publication.isSubscribed) await publication.setSubscribed(true);
            if (publication.track) attachTrack(publication.track);
          }
        }

        if (!room.remoteParticipants.size && mounted) setStatus("Waiting for the host video…");
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Unable to connect.");
      }
    };

    void connect();
    const countTimer = window.setInterval(() => { void fetch("/api/livekit/viewer-count", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({room:roomName}) }); }, 5000);

    return () => {
      window.clearInterval(countTimer);
      mounted = false;
      roomRef.current?.disconnect();
      roomRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      audioContainerRef.current?.replaceChildren();
    };
  }, [roomName]);

  return (
    <div style={{position:"relative",background:"#000",aspectRatio:"16/9",overflow:"hidden"}}>
      <video ref={videoRef} autoPlay muted playsInline controls style={{width:"100%",height:"100%",objectFit:"contain"}} />
      <div ref={audioContainerRef} />
      {error ? <div style={{position:"absolute",inset:0,display:"grid",placeItems:"center",padding:24,color:"#ffd0d0",background:"rgba(0,0,0,.72)",fontSize:13,textAlign:"center"}}>{error}</div> : <span style={{position:"absolute",top:12,left:12,padding:"6px 9px",borderRadius:999,background:"#d6e7b8",color:"#071008",fontSize:10,fontWeight:900}}>● {status}</span>}
    </div>
  );
}
