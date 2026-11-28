"use client";

import { useEffect, useRef, useState } from "react";
import {loadLocalQuranChapter} from "../app/lib/quran-verses";
import { Room, RoomEvent, Track } from "livekit-client";
import { createClient } from "../utils/supabase/client";
import { shouldApplyPresenceEvent, type PresenceVersion } from "../lib/live-discovery-state";
import { useRouter } from "next/navigation";
import ShareLiveButton from "../app/components/ShareLiveButton";
import LiveLightOverlay from "./LiveLightOverlay";
import {playLiveSound,type LiveSound} from "../lib/live-soundboard";
import LiveGuestsStage, {useLiveGuestRoster} from "./LiveGuestsStage";
import LiveGuestStudio from "./LiveGuestStudio";
import { cinemaAudioActive, type CinemaMode } from "../lib/live-cinema";
import { playLiveCinemaMorphSound } from "../lib/live-cinema-sound";

export default function LiveKitViewer({ roomName, streamId, embedded = false, onViewModeChange, initialViewMode = "phone", reconnectSignal = 0, smartMobileCrop = false, previewMuted = false }: { roomName: string; streamId?: string; embedded?: boolean; onViewModeChange?: (mode: CinemaMode) => void; initialViewMode?: CinemaMode; reconnectSignal?: number; smartMobileCrop?: boolean; previewMuted?: boolean }) {
  const router=useRouter();
  const [hostEnded,setHostEnded]=useState(false);
  const endedOnce=useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  // Motion-based framing is opt-in for landscape desktop broadcasts shown on Home's Phone tab.
  // No video frames leave the browser; sample a tiny canvas at a low rate.
  const [smartCropX,setSmartCropX]=useState(50);
  useEffect(()=>{
    if(!smartMobileCrop)return;
    const video=videoRef.current;
    if(!video)return;
    const canvas=document.createElement("canvas");
    canvas.width=48;canvas.height=27;
    const ctx=canvas.getContext("2d",{willReadFrequently:true});
    if(!ctx)return;
    let previous:Uint8ClampedArray|null=null;
    let smoothed=50;
    const sample=()=>{
      if(document.hidden||video.paused||video.readyState<2||video.videoWidth<video.videoHeight)return;
      try{
        ctx.drawImage(video,0,0,48,27);
        const pixels=ctx.getImageData(0,0,48,27).data;
        if(previous){
          let weighted=0,total=0;
          for(let y=2;y<25;y+=2)for(let x=2;x<46;x+=2){
            const idx=(y*48+x)*4;
            const diff=Math.abs(pixels[idx]-previous[idx])+Math.abs(pixels[idx+1]-previous[idx+1])+Math.abs(pixels[idx+2]-previous[idx+2]);
            if(diff>48){const weight=Math.min(diff,180);weighted+=x*weight;total+=weight}
          }
          // Ignore camera noise and scene-wide transitions; return toward center when still.
          const target=total>1500&&total<180000?Math.max(28,Math.min(72,weighted/total/47*100)):50;
          smoothed+=Math.max(-4,Math.min(4,(target-smoothed)*.22));
          setSmartCropX(Math.round(smoothed*10)/10);
        }
        previous=new Uint8ClampedArray(pixels);
      }catch{previous=null}
    };
    const timer=window.setInterval(sample,1100);
    return()=>{window.clearInterval(timer);setSmartCropX(50)};
  },[smartMobileCrop]);

  const reflectionRef = useRef<HTMLCanvasElement>(null);
  const [viewMode,setViewMode] = useState<CinemaMode>(initialViewMode);
  useEffect(()=>{if(embedded)setViewMode(initialViewMode)},[embedded,initialViewMode]);
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
  const [viewerRosterOpen,setViewerRosterOpen]=useState(false);
  const [viewerRosterLoading,setViewerRosterLoading]=useState(false);
  const [viewerRoster,setViewerRoster]=useState<Array<{id:string;username:string;avatar:string|null;xp:number|null}>>([]);
  useEffect(()=>{
    if(!viewerRosterOpen||!roomName)return;
    let active=true;
    const load=async()=>{
      try{
        if(active)setViewerRosterLoading(true);
        const res=await fetch("/api/livekit/viewers",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({room:roomName}),cache:"no-store"});
        if(!res.ok)throw new Error("Viewer list unavailable");
        const data=await res.json();
        if(active)setViewerRoster(Array.isArray(data.viewers)?data.viewers:[]);
      }catch{if(active)setViewerRoster([])}finally{if(active)setViewerRosterLoading(false)}
    };
    void load();
    const timer=window.setInterval(()=>void load(),10000);
    return()=>{active=false;window.clearInterval(timer)};
  },[viewerRosterOpen,roomName]);
  const previousViewerCount=useRef<number|null>(null);
  const [tapCount,setTapCount]=useState(0);
  const [tapBursts,setTapBursts]=useState<{id:number,x:number,y:number}[]>([]);
  const tapSequence=useRef(0);
  const registerTap=(e:React.MouseEvent<HTMLDivElement>)=>{if(embedded||!streamId||!(e.target instanceof HTMLElement)||e.target.closest("button,a,input"))return;const bounds=e.currentTarget.getBoundingClientRect();const id=++tapSequence.current;setTapCount(v=>v+1);setTapBursts(v=>[...v.slice(-8),{id,x:e.clientX-bounds.left,y:e.clientY-bounds.top}]);window.setTimeout(()=>setTapBursts(v=>v.filter(t=>t.id!==id)),900)};
  const [totalViews, setTotalViews] = useState<number | null>(null);
  const [error, setError] = useState("");
  // Attempt audible playback immediately where browsers permit it.
  // If autoplay is blocked, expose a clear one-tap recovery control.
  const [muted, setMuted] = useState(previewMuted);
  const mutedRef = useRef(previewMuted);
  const [audioNeedsGesture, setAudioNeedsGesture] = useState(false);
  const [showTapHint,setShowTapHint]=useState(false);
  useEffect(()=>{if(!audioNeedsGesture&&!muted){setShowTapHint(false);return}setShowTapHint(true);const timer=window.setTimeout(()=>setShowTapHint(false),2000);return()=>window.clearTimeout(timer)},[audioNeedsGesture,muted]);
  const [audioPlaying,setAudioPlaying] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [connectionActive, setConnectionActive] = useState(false);
  const lastManualRetry=useRef(0);
  useEffect(()=>{
    if(!embedded||reconnectSignal===0||endedOnce.current)return;
    const now=Date.now();
    if(now-lastManualRetry.current<1500)return;
    // A format toggle or swipe is a recovery gesture only when the Home
    // player has not received video; never interrupt healthy playback.
    if((roomRef.current?.state!=="connected"||(!hasCameraVideo&&!hasScreenVideo))){
      lastManualRetry.current=now;
      setError("");
      setRetryAttempt(n=>n+1);
    }
  },[reconnectSignal]);

  const [isAudioBroadcast,setIsAudioBroadcast] = useState(false);
  const [quranLiveMeta,setQuranLiveMeta]=useState<{chapter:number;visual:"clean"|"starlight"|"emerald";arabic:string}|null>(null);
  const [hasRemoteAudio,setHasRemoteAudio] = useState(false);
  const [hostConnecting,setHostConnecting] = useState(false);
  const [voiceAvatar,setVoiceAvatar] = useState<string|null>(null);
  const [voiceName,setVoiceName] = useState("1Muslim Creator");
  const [voiceEnergy,setVoiceEnergy] = useState(0);
  const hostIdRef=useRef<string|null>(null);
  const [hostIdentity,setHostIdentity]=useState<string|null>(null);
  const guestStageMode=hasCameraVideo||hasScreenVideo?"video":isAudioBroadcast?"audio":"video";
  const guestRoster=useLiveGuestRoster(roomRef,connectionActive,hostIdentity,guestStageMode==="audio"?11:3);
  const hostEndSignalRef=useRef<()=>void>(()=>{});
  const voiceAnalyzerCleanupRef=useRef<(()=>void)|null>(null);
  const voiceAudioContextRef=useRef<AudioContext|null>(null);

  // Muted feed previews must never change a viewer’s saved audio preference.
  // A tap opens the full Live viewer where sound can be enabled normally.
  // Remember explicit audio preference; autoplay permission remains browser-controlled.
  useEffect(() => {
    try {
      if (window.localStorage.getItem("1muslim:live-audio-enabled") === "off") {
        mutedRef.current = true; setMuted(true);
      }
    } catch { /* Storage may be disabled. */ }
  }, []);

  // Throttled low-resolution mirror of the subscribed video, NOT another player.
  useEffect(() => {
    if (embedded || viewMode !== "desktop") return;
    const canvas = reflectionRef.current;
    const ctx = canvas?.getContext("2d", { alpha: false });
    if (!ctx) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      const source = hasScreenVideo ? screenVideoRef.current : videoRef.current;
      if (!source || source.readyState < 2 || !source.videoWidth) return;
      try { ctx.drawImage(source, 0, 0, canvas!.width, canvas!.height); } catch {}
    }, 250);
    return () => window.clearInterval(timer);
  }, [embedded, viewMode, hasScreenVideo, hasCameraVideo]);

  const selectViewMode = (mode: CinemaMode) => {
    if (embedded || mode === viewMode) return;
    setViewMode(mode);
    onViewModeChange?.(mode);
    playLiveCinemaMorphSound(mode);
  };
  const audible = cinemaAudioActive(connectionActive, hasRemoteAudio, muted, audioNeedsGesture, audioPlaying);
  // Render the voice stage before the first remote audio packet arrives.
  useEffect(()=>{
    if(!streamId)return;
    let cancelled=false;
    const db=createClient();
    void (async()=>{
      const {data:stream}=await db.from("live_streams").select("host_id,aspect_ratio,recital_chapter,recital_visual").eq("id",streamId).maybeSingle();
      if(cancelled||!stream)return;
      hostIdRef.current=stream.host_id;
      setHostIdentity(stream.host_id);
      setIsAudioBroadcast(stream.aspect_ratio==="1:1");
      const recitalChapter=Number(stream.recital_chapter);
      if(Number.isInteger(recitalChapter)&&recitalChapter>=1&&recitalChapter<=114){
        const visual=stream.recital_visual==="starlight"||stream.recital_visual==="emerald"?stream.recital_visual:"clean";
        setQuranLiveMeta({chapter:recitalChapter,visual,arabic:""});
        void loadLocalQuranChapter(recitalChapter).then(rows=>{
          if(!cancelled)setQuranLiveMeta(current=>current?.chapter===recitalChapter?{...current,arabic:rows[0]?.arabic||""}:current);
        }).catch(()=>{});
      }else setQuranLiveMeta(null);
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
      setConnectionActive(false);setAudioPlaying(false);
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
    const controller = new AbortController();
    const isCurrent = () => mounted && !endedOnce.current;
    setConnectionActive(false);
    setHasCameraVideo(false);
    setHasScreenVideo(false);
    setHasRemoteAudio(false);
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
      if (!isCurrent()) return;
      if (track.kind === Track.Kind.Video) {
        const isScreen = source === Track.Source.ScreenShare || track.source === Track.Source.ScreenShare;
        // Guest cameras never replace the host; preserve authorized companion screen share.
        const host=hostIdRef.current;
        if(participantIdentity&&host&&participantIdentity!==host&&!(isScreen&&participantIdentity.startsWith(host+":screen:")))return;
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
        const refreshAudioState=()=>{if(mounted)setAudioPlaying([...attachedAudioRef.current.values()].some(element=>!element.muted&&!element.paused&&element.readyState>=2));};
        for(const event of ["playing","pause","waiting","ended","volumechange"])audio.addEventListener(event,refreshAudioState);
        void audio.play().then(() => { if (mounted) { setAudioNeedsGesture(false); setAudioPlaying(!mutedRef.current&&!audio.paused); } })
          .catch(() => { if (mounted) { setAudioPlaying(false); if (!mutedRef.current) setAudioNeedsGesture(true); } });
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
        // Resolve the host before LiveKit track subscriptions, so a guest
        // camera can never be mistaken for the host's video on first paint.
        if(streamId&&!hostIdRef.current){
          const {data:meta}=await createClient().from("live_streams")
            .select("host_id,aspect_ratio").eq("id",streamId).abortSignal(controller.signal).maybeSingle();
          if (!isCurrent()) return;
          if(meta?.host_id){hostIdRef.current=meta.host_id;setHostIdentity(meta.host_id);setIsAudioBroadcast(meta.aspect_ratio==="1:1");}
        }
        if (!isCurrent()) return;
        const response = await fetch("/api/livekit/token", {
          signal: controller.signal,
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room: roomName, role: "viewer" }),
        });
        const data = await response.json().catch(() => ({}));
        if (!isCurrent()) return;
        if (!response.ok || !data.url || !data.token) throw new Error("Live connection is temporarily unavailable. Please try again.");

        const room = new Room({ adaptiveStream: false, dynacast: true });
        roomRef.current = room;
        room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => attachTrack(track, publication.source, participant.identity));
        room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
          if (!isCurrent()) return;
          if (track.kind === Track.Kind.Video) {
            const isScreen = publication.source === Track.Source.ScreenShare;
            const host=hostIdRef.current;
            if(participant?.identity&&host&&participant.identity!==host&&!(isScreen&&participant.identity.startsWith(host+":screen:")))return;
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
              setAudioPlaying(false);
              setAudioNeedsGesture(false);
              voiceAnalyzerCleanupRef.current?.();voiceAnalyzerCleanupRef.current=null;setVoiceEnergy(0);
            }
          }
        });
        room.on(RoomEvent.TrackSubscriptionFailed, () => isCurrent() && setError("Live media could not be subscribed to. Please reconnect."));
        room.on(RoomEvent.ParticipantConnected, (participant) => {
          if(!isCurrent())return;
          if(participant.identity===hostIdRef.current){setHostConnecting(false);setStatus("Host connected…")}
        });
        room.on(RoomEvent.ParticipantDisconnected, (participant) => {
          if(!isCurrent())return;
          if(hostIdRef.current && participant.identity===hostIdRef.current){
            setHostConnecting(true);setStatus("Host reconnecting…");
          }
        });
        room.on(RoomEvent.DataReceived, (payload, participant, _kind, topic) => {
          if(!isCurrent()||!hostIdRef.current||participant?.identity!==hostIdRef.current)return;
          if(topic==="live-soundboard"){try{const message=JSON.parse(new TextDecoder().decode(payload));if(["boom","crickets","laughter"].includes(message.sound))playLiveSound(message.sound as LiveSound)}catch{}return;}
          if(topic!=="live-status")return;
          try{const message=JSON.parse(new TextDecoder().decode(payload));if(message.type==="live-ended")hostEndSignalRef.current()}catch{}
        });
        room.on(RoomEvent.Reconnecting, () => {if(isCurrent()){setConnectionActive(false);setAudioPlaying(false);setStatus("Reconnecting…");setReconnecting(true);}});
        room.on(RoomEvent.Reconnected, () => {if(isCurrent()){setConnectionActive(true);setAudioPlaying([...attachedAudioRef.current.values()].some(audio=>!audio.muted&&!audio.paused));setReconnecting(false);setError("");setStatus("Waiting for host…");}});
        room.on(RoomEvent.Disconnected, () => {
          if(!isCurrent())return;
          setConnectionActive(false);setAudioPlaying(false);setStatus("Reconnecting to Live…");setReconnecting(true);
          queueRetry(1500);
        });

        await room.connect(data.url, data.token, { autoSubscribe: true });
        if (!isCurrent()) { await room.disconnect(); return; }
        setConnectionActive(true);

        for (const participant of room.remoteParticipants.values()) {
          for (const publication of participant.trackPublications.values()) {
            if (!publication.isSubscribed) publication.setSubscribed(true);
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
      } catch {
        if(isCurrent()){
          setConnectionActive(false);setReconnecting(true);setStatus("Reconnecting to Live…");

          queueRetry(Math.min(12000,1200*Math.pow(2,Math.min(retryAttempt,3))));
        }
      }
    };

    void connect();
    const refreshViewers = async () => {
      if (!isCurrent() || roomRef.current?.state !== "connected") return;
      try {
        const response = await fetch("/api/livekit/viewer-count", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({room:roomName}),cache:"no-store",signal:controller.signal});
        if (!response.ok) return;
        const data = await response.json();
        if (isCurrent() && typeof data.viewerCount === "number") {const next=Math.max(0,data.viewerCount);if(previousViewerCount.current!==null&&next>previousViewerCount.current){setViewerPulse(true);window.setTimeout(()=>setViewerPulse(false),1700)}previousViewerCount.current=next;setViewerCount(next)}
        if (isCurrent() && typeof data.totalViews === "number") setTotalViews(Math.max(0,data.totalViews));
      } catch { /* Preserve the last known count during temporary network failures. */ }
    };
    const countTimer = window.setInterval(() => void refreshViewers(), 5000);
    void refreshViewers();

    return () => {
      window.clearInterval(countTimer);
      retryTimers.forEach(timer=>window.clearTimeout(timer));
      mounted = false;
      controller.abort();
      const oldRoom = roomRef.current;
      roomRef.current = null;
      if (oldRoom) void oldRoom.disconnect();
      attachedAudioRef.current.clear();
      setAudioPlaying(false);
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
    if(next)setAudioPlaying(false);
    try { window.localStorage.setItem("1muslim:live-audio-enabled",next?"off":"on"); } catch {}
    if(next)setAudioNeedsGesture(false);
    if(!next)void voiceAudioContextRef.current?.resume().catch(()=>{});
    if (audioContainerRef.current) {
      audioContainerRef.current.querySelectorAll("audio").forEach((audio) => {
        audio.muted = next;
        if (!next) void audio.play()
          .then(() => {setAudioNeedsGesture(false);setAudioPlaying(!audio.paused);})
          .catch(() => {setAudioNeedsGesture(true);setAudioPlaying(false);});
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
    <div ref={playerRef} onClick={registerTap} className={embedded?"omLiveEmbeddedPlayer":"omLiveImmersiveViewer"} data-view-mode={viewMode} data-audible={audible?"yes":"no"} style={{position:"relative",background:"#000",width:"100%",height:embedded?"100%":undefined,aspectRatio:embedded?undefined:guestStageMode==="audio"?"4/5":"16/9",overflow:"hidden"}}>
      {hostEnded&&<div role="status" aria-live="assertive" className="omHostEndedNotice"><span>✦ LIVE COMPLETE</span><strong>The host has ended this Live</strong><small>{embedded?"Closing your floating player…":"Taking you Home…"}</small><button type="button" onClick={()=>{if(embedded)window.dispatchEvent(new CustomEvent("1muslim:live-ended",{detail:{streamId}}));else router.replace("/")}}>Go Home now →</button></div>}
      {!embedded && <canvas ref={reflectionRef} width={160} height={90} className="omLiveCinemaBackdrop" aria-hidden="true" />}
      <LiveGuestsStage mode={guestStageMode} guests={guestRoster} hostName={voiceName} hostAvatar={voiceAvatar} hostSpeaking={voiceEnergy>.12}
        ambient={quranLiveMeta&&guestStageMode==="audio"?<div className={"qrlViewerAmbient qrlViewer-"+quranLiveMeta.visual} aria-hidden="true">
          <span>QUR’AN RECITATION · SURAH {quranLiveMeta.chapter}</span>
          <p lang="ar" dir="rtl">{quranLiveMeta.arabic||"القرآن الكريم"}</p>
          <small>1MUSLIM · LIVE</small>
        </div>:null}>
        <div className="omLiveVideoStage" data-smart-mobile-crop={smartMobileCrop?"yes":"no"} data-screen={hasScreenVideo?"yes":"no"} data-layout={hasScreenVideo&&hasCameraVideo?shareLayout:"solo"}>
          <video ref={videoRef} className={"omCameraVideo"+(smartMobileCrop?" omSmartMobileCrop":"")} autoPlay muted playsInline controls={false} aria-label="Host camera" style={{display:hasScreenVideo&&!hasCameraVideo?"none":"block",...(smartMobileCrop?{objectFit:"cover" as const,objectPosition:`${smartCropX}% 50%`,background:"transparent"}:{})}} />
          <video ref={screenVideoRef} className="omScreenVideo" autoPlay muted playsInline aria-label="Shared screen" style={{display:hasScreenVideo?"block":"none"}} />
        </div>
      </LiveGuestsStage>
      {hostConnecting&&!hostEnded&&<div className="omHostReconnecting" role="status" aria-live="polite">Host connection interrupted · Reconnecting…</div>}
      
      
      <div ref={audioContainerRef} />
      {streamId&&<LiveLightOverlay streamId={streamId}/>}
      {streamId&&hostIdentity&&!hostEnded&&<div className="omViewerJoinOnly" style={{position:"absolute",right:12,top:48,zIndex:45}}><LiveGuestStudio streamId={streamId} roomName={roomName} hostId={hostIdentity} compactJoin/></div>}
      {error ? <div role="alert" style={{position:"absolute",inset:0,zIndex:12,display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",gap:14,padding:24,color:"#e6f2e7",background:"#0b1510",fontSize:14,textAlign:"center"}}><strong style={{fontSize:19}}>Live connection unavailable</strong><span>{error}</span><div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center"}}><button type="button" onClick={() => { setError(""); setReconnecting(false); setRetryAttempt(n => n + 1); }} style={{border:"1px solid #76ae83",background:"#173d27",color:"#fff",borderRadius:12,padding:"10px 18px",cursor:"pointer"}}>↻ Retry connection</button><a href="/streaming" style={{border:"1px solid #566b5b",color:"#fff",borderRadius:12,padding:"10px 18px",textDecoration:"none"}}>← All streaming</a></div></div> : reconnecting ? (
        !hostEnded && <div role="status" aria-live="polite" className="omViewerReconnectStatus">
          Reconnecting to Live…
        </div>
      ) : <span style={{position:"absolute",top:12,left:12,padding:"6px 9px",borderRadius:999,background:"#d6e7b8",color:"#071008",fontSize:10,fontWeight:900}}>● {status}</span>}
      <style jsx>{`
      .omViewerReconnectStatus{position:absolute;top:12px;left:12px;z-index:10;pointer-events:none;border-radius:999px;padding:6px 10px;background:rgba(0,0,0,.7);color:#fff;font-size:12px}
      .omThemeTapHint{position:absolute;z-index:10;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;border:1px solid color-mix(in srgb,var(--theme-primary,#26b985) 45%,transparent);border-radius:20px;background:color-mix(in srgb,var(--theme-primary,#26b985) 14%,transparent);backdrop-filter:blur(10px);color:white;font-size:clamp(24px,5vw,42px);font-weight:900;padding:10px 28px;text-shadow:0 3px 14px #000b;animation:omThemeTapFade 2s ease-out forwards}@keyframes omThemeTapFade{0%,65%{opacity:1}100%{opacity:0}}
       .qrlViewerAmbient{position:absolute;inset:0;z-index:0;pointer-events:none;display:flex;align-items:center;justify-content:space-between;flex-direction:column;padding:7% 6%;background:linear-gradient(155deg,#172d2d,#091c20);overflow:hidden;color:#deca9f}
 .qrlViewerAmbient.qrlViewer-starlight{background:radial-gradient(circle at 16% 16%,#f3eddf 0 1px,transparent 2px),radial-gradient(circle at 82% 47%,#c4d4e8 0 1px,transparent 2px),linear-gradient(125deg,#17183b,#0a112a)}
 .qrlViewerAmbient.qrlViewer-emerald{background:radial-gradient(circle at center,#2a644a,#061c17)}
 .qrlViewerAmbient span,.qrlViewerAmbient small{font-size:clamp(8px,1.3vw,11px);letter-spacing:.18em;font-weight:720;opacity:.8}
 .qrlViewerAmbient p{font:clamp(27px,6vw,50px)/2 Amiri,"Noto Naskh Arabic",serif;text-align:center;opacity:.27;max-width:94%;max-height:67%;overflow:hidden;animation:qrlViewerDrift 16s ease-in-out infinite alternate}
 @keyframes qrlViewerDrift{from{transform:translateY(-12px);opacity:.18}to{transform:translateY(12px);opacity:.30}}
 @media(prefers-reduced-motion:reduce){.qrlViewerAmbient p{animation:none}}
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
      .omLiveVideoStage[data-smart-mobile-crop="yes"] .omCameraVideo{object-fit:cover!important;background:transparent!important;transition:object-position 900ms ease-out}
      @media(prefers-reduced-motion:reduce){.omLiveVideoStage[data-smart-mobile-crop="yes"] .omCameraVideo{transition:none}}
      .omLiveTheater .omLiveVideoStage{background:#050b0b}
      .omLiveTheater .omLiveVideoStage video{object-fit:cover!important;background:transparent}
      .omLiveTheater .omLiveVideoStage[data-screen="yes"] .omScreenVideo{object-fit:contain!important;background:#030707}
      .omLiveTheater .omLiveImmersiveViewer{height:100%!important;min-height:100%!important;aspect-ratio:auto!important}
      .omLiveTheater .omViewerExit{z-index:30}
      .omLiveTheater .omViewerTapCounter{top:calc(env(safe-area-inset-top) + 65px)}
      .omLiveTheater .omViewerExit{top:calc(env(safe-area-inset-top) + 14px)}
      .omLiveVideoStage[data-screen="yes"] .omScreenVideo{z-index:1}
      .omLiveVideoStage[data-screen="yes"] .omCameraVideo{position:absolute;inset:auto 12px 70px auto;width:27%;height:30%;max-height:210px;border:0;border-radius:14px;z-index:2;box-shadow:0 8px 28px #000b;background:#0b1510}
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
