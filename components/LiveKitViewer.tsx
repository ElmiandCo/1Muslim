"use client";

import { useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track } from "livekit-client";

export default function LiveKitViewer({ roomName }: { roomName: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContainerRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<Room | null>(null);
  const [status, setStatus] = useState("Connecting to live…");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const connect = async () => {
      try {
        const response = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room: roomName, role: "viewer" }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not connect to the live.");

        const room = new Room({ adaptiveStream: true, dynacast: true });
        roomRef.current = room;

        const attachTrack = (track: any) => {
          if (!mounted) return;
          if (track.kind === Track.Kind.Video && videoRef.current) {
            track.attach(videoRef.current);
          } else if (track.kind === Track.Kind.Audio && audioContainerRef.current) {
            const audio = track.attach();
            audio.autoplay = true;
            audioContainerRef.current.appendChild(audio);
          }
        };

        room.on(RoomEvent.TrackSubscribed, (track) => attachTrack(track));
        room.on(RoomEvent.TrackUnsubscribed, (track) => track.detach());
        room.on(RoomEvent.Disconnected, () => mounted && setStatus("Live connection ended."));
        await room.connect(data.url, data.token);

        for (const participant of room.remoteParticipants.values()) {
          for (const publication of participant.trackPublications.values()) {
            if (publication.isSubscribed && publication.track) attachTrack(publication.track);
          }
        }

        if (mounted) setStatus("LIVE");
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Unable to connect.");
      }
    };

    void connect();

    return () => {
      mounted = false;
      roomRef.current?.disconnect();
      roomRef.current = null;
    };
  }, [roomName]);

  return (
    <div style={{position:"relative",background:"#000",aspectRatio:"16/9",overflow:"hidden"}}>
      <video ref={videoRef} autoPlay playsInline controls style={{width:"100%",height:"100%",objectFit:"contain"}} />
      <div ref={audioContainerRef} />
      {error ? <div style={{position:"absolute",inset:0,display:"grid",placeItems:"center",padding:24,color:"#ffd0d0",background:"rgba(0,0,0,.72)",fontSize:13,textAlign:"center"}}>{error}</div> : <span style={{position:"absolute",top:12,left:12,padding:"6px 9px",borderRadius:999,background:"#d6e7b8",color:"#071008",fontSize:10,fontWeight:900}}>● {status}</span>}
    </div>
  );
}
