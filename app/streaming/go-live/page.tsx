"use client";

import SiteNav from "../../components/SiteNav";
import GoLiveHudHudTip from "../../components/GoLiveHudHudTip";

import Link from "next/link";
import { createClient } from "../../../utils/supabase/client";
import { useEffect, useRef, useState } from "react";
import { LocalAudioTrack, Room, RoomEvent, Track } from "livekit-client";
import { createLiveAudioProcessor } from "../../../components/live-audio-effects";
import LiveChat from "../../../components/LiveChat";
import SyncedLiveIntro from "../../components/SyncedLiveIntro";
import LiveLightOverlay from "../../../components/LiveLightOverlay";
import ShareLiveButton from "../../components/ShareLiveButton";
import LiveVisualEffects, {type LiveEffect} from "../../components/LiveVisualEffects";

const StudioGlyph=({kind}:{kind:"camera"|"mic"|"guests"|"settings"|"desktop"|"phone"|"voice"})=>{const paths:Record<string,React.ReactNode>={camera:<><rect x="3" y="7" width="18" height="14" rx="3"/><path d="M8 7l2-3h4l2 3"/><circle cx="12" cy="14" r="4"/></>,mic:<><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8"/></>,guests:<><circle cx="9" cy="8" r="4"/><path d="M2 21v-2a7 7 0 0 1 14 0v2M17 4a4 4 0 0 1 0 8M18 15a6 6 0 0 1 4 6"/></>,settings:<><circle cx="12" cy="12" r="3"/><path d="M10 2h4l1 3 3 1 3-1 2 4-2 2v3l2 2-2 4-3-1-3 1-1 3h-4l-1-3-3-1-3 1-2-4 2-2v-3L1 9l2-4 3 1 3-1z"/></>,desktop:<><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M12 18v4M7 22h10"/></>,phone:<><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/></>,voice:<><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8"/></>};return <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[kind]}</svg>};
const categories = ["Qur'an", "New Muslim", "Prayer", "Seerah", "Tawhid", "Community"];
type ChatMessage = { id: string; name: string; text: string };
type AspectRatio = "9:16" | "1:1" | "16:9";
const formats: Array<{ key: AspectRatio; label: string; width: number; height: number; hint: string }> = [
  { key: "9:16", label: "Portrait", width: 720, height: 1280, hint: "TikTok / Reels style" },
  { key: "1:1", label: "Square", width: 1080, height: 1080, hint: "Balanced social card" },
  { key: "16:9", label: "Landscape", width: 1280, height: 720, hint: "YouTube / desktop style" },
];

export default function GoLivePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const greenVideoRef = useRef<HTMLVideoElement | null>(null);
  const greenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const greenFrameRef = useRef<number | null>(null);
  const rawCameraRef = useRef<MediaStreamTrack | null>(null);
  const backgroundRef = useRef<HTMLImageElement | null>(null);
  const [greenEnabled,setGreenEnabled] = useState(false);
  const [greenStrength,setGreenStrength] = useState(75);
  const [greenImageName,setGreenImageName] = useState("");
  const greenSettingsRef = useRef({enabled:false,strength:75});
  greenSettingsRef.current = {enabled:greenEnabled,strength:greenStrength};

  const [broadcastStartedAt,setBroadcastStartedAt] = useState<string|null>(null);
  const hostIntroRef = useRef<HTMLVideoElement>(null);
  const [showHostIntro,setShowHostIntro] = useState(false);
  const [hostIntroTap,setHostIntroTap] = useState(false);
  useEffect(()=>{if(!showHostIntro)return;const video=hostIntroRef.current;if(!video)return;video.muted=true;void video.play().catch(()=>setHostIntroTap(true));},[showHostIntro]);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef<number | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [settingsOpen,setSettingsOpen] = useState(false);
  const [visualEffect,setVisualEffect] = useState<LiveEffect>("off");
  const lastPreviewTapRef=useRef(0);
  const [studioMode,setStudioMode]=useState<"desktop"|"phone"|"voice">("phone");
  const [micOn, setMicOn] = useState(true);
  const [voiceAvatar,setVoiceAvatar]=useState<string|null>(null);
  const [voiceName,setVoiceName]=useState("1Muslim Creator");
  const [voiceEnergy,setVoiceEnergy]=useState(0);
  const voiceEnergyRef=useRef(0);
  const [studioMorphing,setStudioMorphing]=useState(false);
  const endRequestedRef=useRef(false);
  const studioMorphTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(()=>()=>{if(studioMorphTimer.current)clearTimeout(studioMorphTimer.current)},[]);
  const playCameraAdjustSound=(mode:"desktop"|"phone"|"voice")=>{
    try{
      const context=new AudioContext();
      void context.resume().then(()=>{
        const start=context.currentTime;
        [0,.16,.34].forEach((offset,i)=>{
          const oscillator=context.createOscillator(),gain=context.createGain();
          oscillator.type=i===1?"triangle":"sine";
          oscillator.frequency.setValueAtTime([420,570,740][i],start+offset);
          oscillator.frequency.exponentialRampToValueAtTime([510,660,920][i],start+offset+.12);
          gain.gain.setValueAtTime(.0001,start+offset);
          gain.gain.exponentialRampToValueAtTime(.055,start+offset+.015);
          gain.gain.exponentialRampToValueAtTime(.0001,start+offset+.14);
          oscillator.connect(gain);gain.connect(context.destination);
          oscillator.start(start+offset);oscillator.stop(start+offset+.15);
        });
        // A gentle two-second lens motor sweep follows the canvas resize.
        const motor=context.createOscillator(),motorGain=context.createGain();
        motor.type="sine";
        const from=mode==="voice"?440:mode==="phone"?170:280;
        const to=mode==="voice"?180:mode==="phone"?530:370;
        motor.frequency.setValueAtTime(from,start);
        motor.frequency.exponentialRampToValueAtTime(to,start+1.85);
        motorGain.gain.setValueAtTime(.0001,start);
        motorGain.gain.exponentialRampToValueAtTime(.025,start+.2);
        motorGain.gain.setValueAtTime(.025,start+1.2);
        motorGain.gain.exponentialRampToValueAtTime(.0001,start+1.9);
        motor.connect(motorGain);motorGain.connect(context.destination);
        motor.start(start);motor.stop(start+1.92);
        window.setTimeout(()=>void context.close().catch(()=>{}),2300);
      }).catch(()=>void context.close().catch(()=>{}));
    }catch{/* Audio effects are optional; never block mode switching. */}
  };
  const desiredStudioModeRef=useRef<"desktop"|"phone"|"voice">("phone");
  const modeSyncQueueRef=useRef<Promise<void>>(Promise.resolve());
  const syncPublishedCameraForMode=async(mode:"desktop"|"phone"|"voice")=>{
    const room=roomRef.current;
    if(!room||!liveStreamIdRef.current||endRequestedRef.current||desiredStudioModeRef.current!==mode)return;
    const cameraPublications=()=>[...room.localParticipant.videoTrackPublications.values()]
      .filter(publication=>publication.source===Track.Source.Camera&&publication.track);
    if(mode==="voice"){
      for(const publication of cameraPublications()){
        if(publication.track)await room.localParticipant.unpublishTrack(publication.track,false);
      }
      if(desiredStudioModeRef.current==="voice")streamRef.current?.getVideoTracks().forEach(track=>{track.enabled=false;});
      return;
    }
    const stream=streamRef.current;
    if(!stream)return;
    let videoTrack=stream.getVideoTracks().find(track=>track.readyState==="live");
    if(!videoTrack){
      // Voice may have started with microphone-only permission. Add camera
      // without replacing the active audio track or reconnecting the room.
      const cameraStream=await navigator.mediaDevices.getUserMedia({
        audio:false,
        video:{facingMode:{ideal:facingMode},width:{ideal:mode==="desktop"?1280:720},height:{ideal:mode==="desktop"?720:1280}}
      });
      const acquired=cameraStream.getVideoTracks()[0];
      if(!acquired)throw new Error("No camera track was returned.");
      if(desiredStudioModeRef.current!==mode||roomRef.current!==room||endRequestedRef.current){acquired.stop();return;}
      stream.addTrack(acquired);
      rawCameraRef.current=acquired;
      videoTrack=acquired;
      refreshCameraCapabilities(acquired);
      if(videoRef.current){
        videoRef.current.srcObject=stream;
        videoRef.current.muted=true;
        videoRef.current.playsInline=true;
        void videoRef.current.play().catch(()=>{});
      }
    }
    if(desiredStudioModeRef.current!==mode||roomRef.current!==room||endRequestedRef.current)return;
    videoTrack.enabled=true;
    if(cameraPublications().length===0){
      await room.localParticipant.publishTrack(videoTrack,{
        source:Track.Source.Camera,simulcast:true,videoEncoding:{maxBitrate:3500000,maxFramerate:30}
      });
    }
  };
  const selectStudioMode=(mode:"desktop"|"phone"|"voice")=>{
    const previousMode=desiredStudioModeRef.current;
    if(mode===previousMode)return;
    desiredStudioModeRef.current=mode;
    if(studioMorphTimer.current)clearTimeout(studioMorphTimer.current);
    setStudioMorphing(false);
    requestAnimationFrame(()=>setStudioMorphing(true));
    studioMorphTimer.current=setTimeout(()=>setStudioMorphing(false),2000);
    playCameraAdjustSound(mode);
    setStudioMode(mode);
    setAspectRatio(mode==="voice"?"1:1":mode==="desktop"?"16:9":"9:16");
    if(mode==="voice"){setCameraOn(false);streamRef.current?.getVideoTracks().forEach(t=>t.enabled=false);}
    // Desktop ↔ Phone is geometry-only: keep the same camera track running.
    else if(previousMode==="voice"){setCameraOn(true);streamRef.current?.getVideoTracks().forEach(t=>t.enabled=true);}
    if(roomRef.current&&liveStreamIdRef.current){
      const streamId=liveStreamIdRef.current;
      // Serialize camera and metadata updates; a slower older request must
      // never overwrite the mode selected by a newer tap.
      modeSyncQueueRef.current=modeSyncQueueRef.current.catch(()=>{}).then(async()=>{
        if(desiredStudioModeRef.current!==mode)return;
        await syncPublishedCameraForMode(mode);
        if(desiredStudioModeRef.current!==mode||endRequestedRef.current)return;
        const response=await fetch("/api/live-mode",{
          method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({streamId,mode}),cache:"no-store"
        });
        if(!response.ok)console.warn("Live mode metadata sync failed",response.status);
      }).catch(error=>{
        if(desiredStudioModeRef.current===mode)setError(error instanceof Error?error.message:"Could not switch camera mode.");
      });
    }
  };
  useEffect(()=>{
    let cancelled=false;
    const load=async()=>{
      const db=createClient();
      const {data:{user}}=await db.auth.getUser();
      if(!user||cancelled)return;
      const {data:profile}=await db.from("profiles").select("*").eq("id",user.id).maybeSingle();
      if(cancelled)return;
      setVoiceName(String(profile?.display_name||profile?.username||user.user_metadata?.full_name||"1Muslim Creator"));
      const avatar=profile?.avatar_url||profile?.profile_picture_url||profile?.avatar;
      if(typeof avatar==="string"&&avatar.startsWith("https://"))setVoiceAvatar(avatar);else setVoiceAvatar(null);
    };
    void load();return()=>{cancelled=true};
  },[]);
  useEffect(()=>{
    if(studioMode!=="voice"||!micOn||!cameraReady){voiceEnergyRef.current=0;setVoiceEnergy(0);return;}
    const stream=streamRef.current;
    const track=stream?.getAudioTracks().find(t=>t.enabled);
    if(!track)return;
    let context:AudioContext|null=null,source:MediaStreamAudioSourceNode|null=null,analyser:AnalyserNode|null=null,frame=0,stopped=false;
    try{
      context=new AudioContext();
      source=context.createMediaStreamSource(new MediaStream([track]));
      analyser=context.createAnalyser();analyser.fftSize=512;analyser.smoothingTimeConstant=.82;
      source.connect(analyser);
      const data=new Uint8Array(analyser.fftSize);
      let last=0;
      const tick=(now:number)=>{
        if(stopped||!analyser)return;
        analyser.getByteTimeDomainData(data);
        let sum=0;for(const sample of data){const v=(sample-128)/128;sum+=v*v}
        const rms=Math.sqrt(sum/data.length);
        const target=Math.min(1,Math.max(0,(rms-.012)*8));
        voiceEnergyRef.current=voiceEnergyRef.current*.72+target*.28;
        if(now-last>70){setVoiceEnergy(voiceEnergyRef.current);last=now}
        frame=requestAnimationFrame(tick);
      };
      frame=requestAnimationFrame(tick);
    }catch{setVoiceEnergy(0)}
    return()=>{stopped=true;cancelAnimationFrame(frame);source?.disconnect();if(context)void context.close().catch(()=>{})};
  },[studioMode,micOn,cameraReady]);
  const [error, setError] = useState("");
  const [live, setLive] = useState(false);
  const [connectingLive,setConnectingLive] = useState(false);
  const [liveSeconds,setLiveSeconds] = useState(0);
  const [launchCountdown,setLaunchCountdown]=useState<number|null>(null);
  const [launchVisual,setLaunchVisual]=useState(false);
  const [launchPressed,setLaunchPressed]=useState(false);
  const launchTimerRef=useRef<ReturnType<typeof setInterval>|null>(null);
  const launchAudioRef=useRef<AudioContext|null>(null);
  const launchPendingRef=useRef(false);
  const pendingVoiceLaunchRef=useRef(false);
  useEffect(()=>()=>{if(launchTimerRef.current)clearInterval(launchTimerRef.current);void launchAudioRef.current?.close().catch(()=>{})},[]);
  const playLaunchZoom=()=>{
    try{
      const context=new AudioContext();launchAudioRef.current=context;
      const osc=context.createOscillator(),gain=context.createGain(),filter=context.createBiquadFilter();
      osc.type="sine";filter.type="lowpass";filter.frequency.setValueAtTime(1400,context.currentTime);
      osc.frequency.setValueAtTime(190,context.currentTime);
      osc.frequency.exponentialRampToValueAtTime(780,context.currentTime+.42);
      gain.gain.setValueAtTime(.0001,context.currentTime);
      gain.gain.exponentialRampToValueAtTime(.11,context.currentTime+.08);
      gain.gain.exponentialRampToValueAtTime(.0001,context.currentTime+.58);
      osc.connect(filter);filter.connect(gain);gain.connect(context.destination);
      osc.start();osc.stop(context.currentTime+.6);
      osc.onended=()=>{void context.close().catch(()=>{});if(launchAudioRef.current===context)launchAudioRef.current=null};
    }catch{/* WebAudio may be unavailable or blocked. Broadcast remains functional. */}
  };
  const playLiveConnectedPop=()=>{
    try{
      const context=launchAudioRef.current&&launchAudioRef.current.state!=="closed"?launchAudioRef.current:new AudioContext();
      launchAudioRef.current=context;
      void context.resume().then(()=>{
        const now=context.currentTime,osc=context.createOscillator(),gain=context.createGain();
        osc.type="sine";
        osc.frequency.setValueAtTime(610,now);
        osc.frequency.exponentialRampToValueAtTime(330,now+.14);
        gain.gain.setValueAtTime(.0001,now);
        gain.gain.linearRampToValueAtTime(.16,now+.012);
        gain.gain.exponentialRampToValueAtTime(.0001,now+.18);
        osc.connect(gain);gain.connect(context.destination);osc.start(now);osc.stop(now+.19);
        osc.onended=()=>{if(launchAudioRef.current===context)launchAudioRef.current=null;void context.close().catch(()=>{})};
      }).catch(()=>{});
    }catch{/* Audio cue must never interrupt broadcast. */}
  };
  const launchBroadcast=()=>{
    if(launchPendingRef.current||live||connectingLive||saving)return;
    if(!cameraReady){
      if(studioMode==="voice"){
        // A single Go Live tap requests microphone permission and launches
        // as soon as audio-only preview becomes ready.
        pendingVoiceLaunchRef.current=true;
        launchPendingRef.current=true;
        setLaunchVisual(true);playLaunchZoom();
      }
      void startPreview();
      return;
    }
    launchPendingRef.current=true;
    if(studioMode==="voice"){
      setLaunchVisual(true);playLaunchZoom();
      void startLive(false).finally(()=>{launchPendingRef.current=false;setLaunchVisual(false)});
      return;
    }
    setLaunchPressed(true);setLaunchVisual(true);playLaunchZoom();
    setLaunchCountdown(3);
    let remaining=3;
    launchTimerRef.current=setInterval(()=>{
      remaining-=1;
      if(remaining>0){setLaunchCountdown(remaining);return;}
      if(launchTimerRef.current){clearInterval(launchTimerRef.current);launchTimerRef.current=null;}
      setLaunchCountdown(null);
      setLaunchPressed(false);
      void startLive(false);
    },1000);
  };
  useEffect(()=>{
    if(!pendingVoiceLaunchRef.current)return;
    if(error||studioMode!=="voice"){
      pendingVoiceLaunchRef.current=false;launchPendingRef.current=false;setLaunchVisual(false);return;
    }
    if(!cameraReady||live||connectingLive)return;
    pendingVoiceLaunchRef.current=false;
    void startLive(false).finally(()=>{launchPendingRef.current=false;setLaunchVisual(false)});
  },[cameraReady,studioMode,error,live,connectingLive]);
  useEffect(()=>{
    if(live){launchPendingRef.current=false;setLaunchVisual(false);}
    else if(!connectingLive&&launchPendingRef.current&&launchCountdown===null&&!pendingVoiceLaunchRef.current){launchPendingRef.current=false;setLaunchVisual(false);}
  },[live,connectingLive,launchCountdown]);
  useEffect(()=>{
    if(!live||!broadcastStartedAt){setLiveSeconds(0);return;}
    const tick=()=>setLiveSeconds(Math.max(0,Math.floor((Date.now()-new Date(broadcastStartedAt).getTime())/1000)));
    tick();const timer=window.setInterval(tick,1000);return()=>window.clearInterval(timer);
  },[live,broadcastStartedAt]);
  const liveClock = `${String(Math.floor(liveSeconds/3600)).padStart(2,"0")}:${String(Math.floor(liveSeconds%3600/60)).padStart(2,"0")}:${String(liveSeconds%60).padStart(2,"0")}`;


  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [cameraOn, setCameraOn] = useState(true);
  const [autoCameraPreview, setAutoCameraPreview] = useState(true);
  const autoPreviewAttempted = useRef(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [videoQuality, setVideoQuality] = useState<"480p" | "720p" | "1080p">("720p");
  const [zoom, setZoom] = useState(1);
  const [focusMode, setFocusMode] = useState<"auto" | "manual">("auto");
  const [focusDistance, setFocusDistance] = useState(0.5);
  const [cameraCapabilities, setCameraCapabilities] = useState<{zoom?:{min:number;max:number;step:number};focus?:boolean;focusDistance?:{min:number;max:number;step:number}} | null>(null);
  const [audioEffect, setAudioEffect] = useState<"studio" | "mosque">("studio");
  const [nasheedOn, setNasheedOn] = useState(false);
  const [soundVolume, setSoundVolume] = useState(0.18);
  const nasheedPreviewRef = useRef<HTMLAudioElement | null>(null);
  const audioTrackRef = useRef<LocalAudioTrack | null>(null);
  const audioProcessorRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processedAudioTrackRef = useRef<MediaStreamTrack | null>(null);
  const [title, setTitle] = useState("");
  // Auto-name untitled broadcasts using the host's display name and lifetime Live count.
  // Manual titles remain editable and are never overwritten.
  const [defaultLiveTitle,setDefaultLiveTitle] = useState("1Muslim Host - Live 1");
  useEffect(()=>{
    let cancelled=false;
    const loadDefaultTitle=async()=>{
      const db=createClient();
      const {data:{user}}=await db.auth.getUser();
      if(!user||cancelled)return;
      const [{data:profile},{count,error:countError}]=await Promise.all([
        db.from("profiles").select("display_name,username").eq("id",user.id).maybeSingle(),
        db.from("live_streams").select("id",{count:"exact",head:true}).eq("host_id",user.id)
      ]);
      if(cancelled)return;
      const name=(profile?.display_name||profile?.username||user.user_metadata?.full_name||"1Muslim Host").trim();
      const nextNumber=countError?1:(count??0)+1;
      setDefaultLiveTitle(`${name} - Live ${nextNumber}`);
    };
    void loadDefaultTitle();
    return()=>{cancelled=true};
  },[]);
  const effectiveLiveTitle=title.trim()||defaultLiveTitle;

  // Inform the mobile dock only when the host has a working camera and a title.
  useEffect(()=>{
    const ready=cameraReady&&(studioMode==="voice"||cameraOn)&&Boolean(effectiveLiveTitle.trim())&&!live&&!saving;
    window.dispatchEvent(new CustomEvent("1muslim:go-live-ready",{detail:{ready}}));
    return()=>{window.dispatchEvent(new CustomEvent("1muslim:go-live-ready",{detail:{ready:false}}));};
  },[cameraReady,cameraOn,studioMode,effectiveLiveTitle,live,saving]);

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreviewUrl,setThumbnailPreviewUrl]=useState<string|null>(null);
  useEffect(()=>{if(!thumbnailFile){setThumbnailPreviewUrl(null);return;}const url=URL.createObjectURL(thumbnailFile);setThumbnailPreviewUrl(url);return()=>URL.revokeObjectURL(url)},[thumbnailFile]);
  const [category, setCategory] = useState(categories[0]);
  const [visibility, setVisibility] = useState<"public" | "ashab">("public");
  const [scheduledSlot, setScheduledSlot] = useState<any | null>(null);
  const [hostCheckedIn, setHostCheckedIn] = useState(false);
  const scheduledStartRef = useRef(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleStart, setScheduleStart] = useState("");
  const [scheduleEnd, setScheduleEnd] = useState("");
  const [scheduleMessage, setScheduleMessage] = useState("");
  const [showScheduler, setShowScheduler] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const topic = params.get("topic");
    if (topic && categories.includes(topic)) setCategory(topic);
    if (params.get("schedule") === "1") setShowScheduler(true);
  }, []);
  useEffect(() => {
    const loadScheduled = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("live_schedule_slots").select("id,title,category,starts_at,ends_at,status,host_checked_in_at,camera_ready,mic_ready").eq("host_id", user.id).in("status", ["scheduled","waiting"]).order("starts_at",{ascending:true}).limit(1).maybeSingle();
      setScheduledSlot(data ?? null);
      setHostCheckedIn(Boolean(data?.host_checked_in_at && data?.camera_ready && data?.mic_ready));
    };
    void loadScheduled();
  }, []);
  const [viewers, setViewers] = useState(0);
  const [viewerRosterOpen,setViewerRosterOpen]=useState(false);
  const [viewerRoster,setViewerRoster]=useState<Array<{id:string;username:string;avatar:string|null;xp:number|null}>>([]);
  const [viewerRosterLoading,setViewerRosterLoading]=useState(false);
  const loadViewerRoster=async()=>{
    const id=liveStreamIdRef.current;
    if(!id)return;
    setViewerRosterLoading(true);
    try{
      const response=await fetch("/api/livekit/viewers",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({room:`1muslim-live-${id}`})});
      if(!response.ok)throw new Error("Unable to load live viewers");
      const data=await response.json();
      setViewerRoster(Array.isArray(data.viewers)?data.viewers:[]);
      setViewers(Number(data.viewerCount??0));
    }catch{setViewerRoster([])}finally{setViewerRosterLoading(false)}
  };
  useEffect(()=>{if(!live||!viewerRosterOpen)return;void loadViewerRoster();const timer=window.setInterval(()=>void loadViewerRoster(),5000);return()=>window.clearInterval(timer)},[live,viewerRosterOpen]);
  useEffect(()=>{if(!live)setViewerRosterOpen(false)},[live]);
  const [viewerIncrease, setViewerIncrease] = useState(false);
  const previousViewerCount = useRef<number | null>(null);
  useEffect(() => {
    if (!live) { previousViewerCount.current = null; setViewerIncrease(false); return; }
    if (previousViewerCount.current !== null && viewers > previousViewerCount.current) {
      setViewerIncrease(true);
      const timeout = window.setTimeout(() => setViewerIncrease(false), 2300);
      previousViewerCount.current = viewers;
      return () => window.clearTimeout(timeout);
    }
    previousViewerCount.current = viewers;
  }, [viewers, live]);

  useEffect(() => {
    if (!live || !liveStreamIdRef.current) return;
    const heartbeat = async () => {
      const id = liveStreamIdRef.current;
      if (!id) return;
      try {
        const response = await fetch("/api/live-heartbeat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ streamId: id }), cache: "no-store" });
        if (!response.ok) console.warn("Live heartbeat update failed:", response.status, (await response.json().catch(() => ({}))).error);
      } catch (error) { console.warn("Live heartbeat request failed:", error); }
    };
    void heartbeat();
    const timer = window.setInterval(() => void heartbeat(), 15000);
    return () => window.clearInterval(timer);
  }, [live]);
  useEffect(() => {
    const streamId = liveStreamIdRef.current;
    if (!live || !streamId) return;
    const supabase = createClient();
    const channel = supabase
      .channel("live-moderation-" + streamId)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "live_streams", filter: "id=eq." + streamId }, (payload) => {
        const nextStatus = (payload.new as { status?: string }).status;
        if (nextStatus !== "cancelled") return;
        setLive(false);
        setViewers(0);
        setError("An admin ended this Live.");
        setSaveMessage("The broadcast was shut down by an admin and was not saved as a recording.");
        roomRef.current?.disconnect();
        roomRef.current = null;
        const recorder = recorderRef.current;
        if (recorder && recorder.state !== "inactive") {
          recorder.onstop = () => {
            chunksRef.current = [];
            recordingStartedAtRef.current = null;
            recorderRef.current = null;
            setRecording(false);
            setSaving(false);
            streamRef.current?.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
            setCameraReady(false);
            audioProcessorRef.current = null;
            audioTrackRef.current = null;
            processedAudioTrackRef.current = null;
            setCameraOn(true);
            setMicOn(true);
          };
          recorder.stop();
        } else {
          streamRef.current?.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          setCameraReady(false);
        }
        liveStreamIdRef.current = null;
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [live]);
  const [reaction, setReaction] = useState<string | null>(null);
  const [followed, setFollowed] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const roomRef = useRef<Room | null>(null);
  const qualityMap = { "480p": { width: 854, height: 480 }, "720p": { width: 1280, height: 720 }, "1080p": { width: 1920, height: 1080 } } as const;
  const getCaptureSize = () => qualityMap[videoQuality];
  const refreshCameraCapabilities = (track?: MediaStreamTrack) => {
    const videoTrack = track ?? streamRef.current?.getVideoTracks()[0];
    if (!videoTrack) return;
    const capabilities = videoTrack.getCapabilities?.() as MediaTrackCapabilities & { zoom?: { min: number; max: number; step?: number }; focusMode?: string[]; focusDistance?: { min: number; max: number; step?: number } };
    const zoomCap = capabilities.zoom as { min:number; max:number; step?:number } | undefined;
    const focusCap = capabilities.focusMode?.includes("manual") || Boolean(capabilities.focusDistance);
    const distanceCap = capabilities.focusDistance as { min:number; max:number; step?:number } | undefined;
    setCameraCapabilities({
      zoom: zoomCap ? { min: zoomCap.min, max: zoomCap.max, step: zoomCap.step ?? 0.1 } : undefined,
      focus: focusCap,
      focusDistance: distanceCap ? { min: distanceCap.min, max: distanceCap.max, step: distanceCap.step ?? 0.01 } : undefined,
    });
  };
  const applyCameraControl = async (constraints: MediaTrackConstraints) => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints(constraints);
      refreshCameraCapabilities(track);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That camera control is not supported on this device.");
    }
  };
  const liveStreamIdRef = useRef<string | null>(null);

  const scheduleLive = async () => {
    setScheduleMessage("");
    if (!effectiveLiveTitle.trim()) return setScheduleMessage("Add a Live title first.");
    if (!scheduleDate || !scheduleStart || !scheduleEnd) return setScheduleMessage("Choose a date, start time, and end time.");
    const starts = new Date(`${scheduleDate}T${scheduleStart}`);
    const ends = new Date(`${scheduleDate}T${scheduleEnd}`);
    if (Number.isNaN(starts.getTime()) || Number.isNaN(ends.getTime()) || ends <= starts) return setScheduleMessage("End time must be after start time.");
    if (starts <= new Date()) return setScheduleMessage("Choose a future start time.");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setScheduleMessage("Sign in is required to schedule a Live.");
    const { data, error } = await supabase.from("live_schedule_slots").insert({host_id:user.id,title:effectiveLiveTitle,category,starts_at:starts.toISOString(),ends_at:ends.toISOString(),status:"scheduled"}).select("id,title,category,starts_at,ends_at,status").single();
    if (error) return setScheduleMessage(error.message);
    setScheduledSlot(data); setHostCheckedIn(false); setScheduleMessage("Scheduled. You can schedule another Live too. Return before this start time to check in and confirm your camera + microphone.");
    setShowScheduler(false);
  };

  const checkInHost = async () => {
    if (!scheduledSlot) return setError("Schedule a Live first.");
    if (!cameraReady || !cameraOn || !micOn) return setError("Confirm your camera and microphone before checking in.");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setError("Sign in is required.");
    const { error: checkInError } = await supabase.from("live_schedule_slots").update({
      host_checked_in_at: new Date().toISOString(),
      camera_ready: true,
      mic_ready: true,
      status: "waiting"
    }).eq("id", scheduledSlot.id).eq("host_id", user.id);
    if (checkInError) return setError(checkInError.message);
    setHostCheckedIn(true);
    setScheduledSlot((slot:any) => slot ? {...slot, host_checked_in_at:new Date().toISOString(), camera_ready:true, mic_ready:true, status:"waiting"} : slot);
    setSaveMessage("You're checked in. Viewers can now see that the host is ready and set up. The broadcast stays locked until the scheduled time.");
  };

  useEffect(() => {
    if (!scheduledSlot || !hostCheckedIn || live || !cameraReady || !cameraOn || !micOn) return;
    const tick = async () => {
      if (scheduledStartRef.current) return;
      if (Date.now() < new Date(scheduledSlot.starts_at).getTime()) return;
      scheduledStartRef.current = true;
      await startLive(true);
      scheduledStartRef.current = false;
    };
    const timer = window.setInterval(() => void tick(), 500);
    void tick();
    return () => window.clearInterval(timer);
  }, [scheduledSlot, hostCheckedIn, live, cameraReady, cameraOn, micOn]);

  // Local chroma key: replaces a physical green backdrop, without uploading the chosen photo.
  const stopGreen = () => {
    if (greenFrameRef.current !== null) cancelAnimationFrame(greenFrameRef.current);
    greenFrameRef.current = null;
    greenVideoRef.current?.pause();
    greenVideoRef.current = null;
    greenCanvasRef.current = null;
  };
  const startGreen = async (raw:MediaStreamTrack) => {
    stopGreen();
    const source = document.createElement("video");
    source.srcObject = new MediaStream([raw]);
    source.muted=true; source.playsInline=true; source.autoplay=true;
    await source.play();
    const canvas=document.createElement("canvas");
    canvas.width=640;canvas.height=360;
    const ctx=canvas.getContext("2d",{willReadFrequently:true});
    if(!ctx)throw new Error("Green screen is unavailable in this browser.");
    greenVideoRef.current=source;greenCanvasRef.current=canvas;
    const draw=()=>{
      if(!source.videoWidth || !source.videoHeight){greenFrameRef.current=requestAnimationFrame(draw);return;}
      if(canvas.width!==source.videoWidth||canvas.height!==source.videoHeight){canvas.width=source.videoWidth;canvas.height=source.videoHeight;}
      ctx.drawImage(source,0,0,canvas.width,canvas.height);
      const image=ctx.getImageData(0,0,canvas.width,canvas.height);
      const pixels=image.data;
      const threshold=greenSettingsRef.current.strength/100;
      for(let i=0;i<pixels.length;i+=4){
        const rr=pixels[i],gg=pixels[i+1],bb=pixels[i+2];
        const dominance=gg-Math.max(rr,bb);
        const cutoff=12+threshold*65;
        if(dominance>cutoff && gg>65){pixels[i+3]=0;}
        else if(dominance>cutoff-18 && gg>65){pixels[i+3]=Math.round(255*(cutoff-dominance)/18);}
      }
      if(greenSettingsRef.current.enabled&&backgroundRef.current){
        ctx.clearRect(0,0,canvas.width,canvas.height);
        const bg=backgroundRef.current;
        const scale=Math.max(canvas.width/bg.width,canvas.height/bg.height);
        const w=bg.width*scale,h=bg.height*scale;
        ctx.drawImage(bg,(canvas.width-w)/2,(canvas.height-h)/2,w,h);
        const foreground=document.createElement("canvas");
        foreground.width=canvas.width;foreground.height=canvas.height;
        foreground.getContext("2d")?.putImageData(image,0,0);
        ctx.drawImage(foreground,0,0);
      } else ctx.putImageData(image,0,0);
      greenFrameRef.current=requestAnimationFrame(draw);
    };
    draw();
    return canvas.captureStream(24).getVideoTracks()[0];
  };
  const selectGreenPhoto=async(file?:File)=>{
    if(!file)return;
    if(!file.type.startsWith("image/")||file.size>12*1024*1024){setError("Choose an image smaller than 12 MB.");return;}
    const url=URL.createObjectURL(file);
    try{
      const image=new Image();
      image.src=url;
      await image.decode();
      backgroundRef.current=image;
      setGreenImageName(file.name);
      setGreenEnabled(true);
      if(streamRef.current&&!greenCanvasRef.current&&!live){
        const raw=rawCameraRef.current;
        if(raw){
          const output=await startGreen(raw);
          streamRef.current.getVideoTracks().forEach(t=>streamRef.current?.removeTrack(t));
          streamRef.current.addTrack(output);
          if(videoRef.current){videoRef.current.srcObject=streamRef.current;void videoRef.current.play().catch(()=>{});}
        }
      }
    }catch{setError("This image could not be opened.");}finally{URL.revokeObjectURL(url);}
  };
  const startPreview = async () => {
    setError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera and microphone access is not available in this browser.");
      }
      stopGreen();
      rawCameraRef.current?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      const size = getCaptureSize();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: studioMode==="voice"?false:{ facingMode, width: { ideal: size.width }, height: { ideal: size.height }, frameRate: { ideal: 30, max: 30 } },
        audio: true,
      });
      rawCameraRef.current=stream.getVideoTracks()[0];
      if(greenEnabled&&backgroundRef.current&&rawCameraRef.current){
        const output=await startGreen(rawCameraRef.current);
        stream.removeTrack(rawCameraRef.current);
        stream.addTrack(output);
      }
      streamRef.current = stream;
      setCameraReady(true);
      setCameraOn(studioMode!=="voice");
      setMicOn(true);
      setZoom(1);
      setFocusMode("auto");
      refreshCameraCapabilities(stream.getVideoTracks()[0]);
    } catch (err) {
      setError(err instanceof DOMException && err.name === "NotAllowedError"
        ? "Camera or microphone access was denied. Allow access in your browser settings and try again."
        : err instanceof Error ? err.message : "We could not access your camera and microphone.");
    }
  };

  // Auto-preview is on by default; creators can opt out persistently.
  useEffect(() => {
    const enabled = localStorage.getItem("1muslim-go-live-auto-camera") !== "off";
    setAutoCameraPreview(enabled);
    if (!enabled || autoPreviewAttempted.current) return;
    autoPreviewAttempted.current = true;
    void startPreview();
  // Only on initial mount; never automatically start broadcasting.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!cameraReady || !video || !stream || !stream.getVideoTracks().length) return;

    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    void video.play().catch(() => {
      setError("Camera access was granted, but the preview could not start. Tap the preview or Enable camera & mic again.");
    });
  }, [cameraReady]);

  useEffect(() => () => {
    stopGreen();
    rawCameraRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    void audioProcessorRef.current?.destroy?.();
    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  const toggleCamera = () => {
    const next = !cameraOn;
    streamRef.current?.getVideoTracks().forEach((track) => (track.enabled = next));
    setCameraOn(next);
  };

  const flipCamera = async () => {
    if (!streamRef.current || !navigator.mediaDevices?.getUserMedia) return;
    setError("");
    const nextFacingMode = facingMode === "user" ? "environment" : "user";
    try {
      if(greenCanvasRef.current) throw new Error("Turn off Green Screen and restart camera preview before flipping the camera.");
      const currentStream = streamRef.current;
      const oldVideoTracks = currentStream.getVideoTracks();
      const newVideoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { exact: nextFacingMode },
          width: { ideal: getCaptureSize().width },
          height: { ideal: getCaptureSize().height },
        },
        audio: false,
      });
      const newVideoTrack = newVideoStream.getVideoTracks()[0];
      if (!newVideoTrack) throw new Error("The other camera could not be opened.");
      oldVideoTracks.forEach((track) => {
        currentStream.removeTrack(track);
        track.stop();
      });
      currentStream.addTrack(newVideoTrack);
      streamRef.current = currentStream;
      rawCameraRef.current=newVideoTrack;
      setFacingMode(nextFacingMode);
      setCameraOn(true);
      setZoom(1);
      setFocusMode("auto");
      refreshCameraCapabilities(newVideoTrack);
      if (videoRef.current) {
        videoRef.current.srcObject = currentStream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        await videoRef.current.play().catch(() => undefined);
      }
    } catch (err) {
      setError(err instanceof DOMException && (err.name === "OverconstrainedError" || err.name === "NotFoundError")
        ? "This device does not expose a switchable front/back camera."
        : err instanceof Error ? err.message : "We could not switch cameras.");
    }
  };

  const setQuality = async (quality: "480p" | "720p" | "1080p") => {
    setVideoQuality(quality);
    const size = qualityMap[quality];
    await applyCameraControl({ width: { ideal: size.width }, height: { ideal: size.height } });
  };

  const setCameraZoom = async (value: number) => {
    setZoom(value);
    await applyCameraControl({ advanced: [{ zoom: value } as MediaTrackConstraintSet] });
  };

  const setCameraFocus = async (mode: "auto" | "manual", distance = focusDistance) => {
    setFocusMode(mode);
    if (mode === "auto") {
      await applyCameraControl({ advanced: [{ focusMode: "continuous" } as MediaTrackConstraintSet] });
    } else {
      await applyCameraControl({ advanced: [{ focusMode: "manual", focusDistance: distance } as MediaTrackConstraintSet] });
    }
  };

  useEffect(() => {
    const existing = nasheedPreviewRef.current;
    if (existing) {
      existing.pause();
      nasheedPreviewRef.current = null;
    }
    if (live || !nasheedOn) return;
    const preview = new Audio("/audio/NasheedLoop.mp3");
    preview.loop = true;
    preview.preload = "auto";
    preview.volume = Math.max(0, Math.min(1, soundVolume));
    nasheedPreviewRef.current = preview;
    void preview.play().catch(() => {
      setError("Tap the Nasheed Loop toggle again if your browser blocked preview audio.");
    });
    return () => {
      preview.pause();
      preview.currentTime = 0;
      if (nasheedPreviewRef.current === preview) nasheedPreviewRef.current = null;
    };
  }, [nasheedOn, live]);

  useEffect(() => {
    const preview = nasheedPreviewRef.current;
    if (preview) preview.volume = Math.max(0, Math.min(1, soundVolume));
  }, [soundVolume]);

  const ensureAudioContext = async () => {
    if (!audioContextRef.current) {
      const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) throw new Error("This browser does not support audio processing.");
      audioContextRef.current = new AudioContextCtor();
    }
    if (audioContextRef.current.state === "suspended") await audioContextRef.current.resume();
    return audioContextRef.current;
  };

  const applyAudioStudio = async (nextEffect = audioEffect, nextSound = nasheedOn, nextVolume = soundVolume) => {
    const rawTrack = streamRef.current?.getAudioTracks()[0];
    if (!rawTrack) return;
    try {
      const audioContext = await ensureAudioContext();
      if (audioTrackRef.current) {
        await audioTrackRef.current.stopProcessor();
      }
      const processor = createLiveAudioProcessor(nextEffect, nextSound, nextVolume);
      audioProcessorRef.current = processor;
      if (!audioTrackRef.current) {
        audioTrackRef.current = new LocalAudioTrack(rawTrack, undefined, true, audioContext);
      }
      await audioTrackRef.current.setProcessor(processor as any);
      processedAudioTrackRef.current = processor.processedTrack ?? audioTrackRef.current.mediaStreamTrack;
      setAudioEffect(nextEffect);
      setNasheedOn(nextSound);
      setSoundVolume(nextVolume);
      if (live && roomRef.current && audioTrackRef.current.sid == null) {
        await roomRef.current.localParticipant.publishTrack(audioTrackRef.current, { source: Track.Source.Microphone });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Audio Studio could not be applied.");
    }
  };

  const setAudioStudioEffect = async (effect: "studio" | "mosque") => {
    setAudioEffect(effect);
    await applyAudioStudio(effect, nasheedOn, soundVolume);
  };

  const toggleNasheed = async () => {
    const next = !nasheedOn;
    setNasheedOn(next);
    await applyAudioStudio(audioEffect, next, soundVolume);
  };

  const setAudioStudioVolume = async (value: number) => {
    const nextVolume = Math.max(0, Math.min(1, value));
    setSoundVolume(nextVolume);
    const processor = audioProcessorRef.current;
    if (processor?.setVolume) {
      processor.setVolume(nextVolume);
      return;
    }
    if (nasheedOn) {
      await applyAudioStudio(audioEffect, nasheedOn, nextVolume);
    }
  };

  const toggleMic = () => {
    const next = !micOn;
    streamRef.current?.getAudioTracks().forEach((track) => (track.enabled = next));
    setMicOn(next);
  };

  const startRecording = () => {
    const stream = streamRef.current;
    if (!stream) throw new Error("Camera and microphone must be enabled first.");
    const recordingAudio = processedAudioTrackRef.current ?? stream.getAudioTracks()[0];
    const videoTrack = studioMode==="voice"?null:stream.getVideoTracks()[0];
    const tracks=[...(videoTrack?[videoTrack]:[]),...(recordingAudio?[recordingAudio]:[])];
    if(!tracks.length)throw new Error("No media track available for recording.");
    const mimeTypes=videoTrack?
      ["video/mp4","video/mp4;codecs=avc1.42E01E,mp4a.40.2","video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm"]:
      ["audio/mp4","audio/webm;codecs=opus","audio/webm"];
    const mimeType=mimeTypes.find(type=>MediaRecorder.isTypeSupported(type));
    if(!mimeType)throw new Error("This browser cannot record this Live format.");
    chunksRef.current = [];
    const recordingStream = new MediaStream(tracks);
    const recorder = new MediaRecorder(recordingStream, { mimeType });
    recorder.ondataavailable = (event) => { if (event.data.size > 0) chunksRef.current.push(event.data); };
    recorderRef.current = recorder;
    recordingStartedAtRef.current = Date.now();
    recorder.start(1000);
    setRecording(true);
  };

  const buildRecordingThumbnail = async (supabase:any, userId:string, recordingId:string, durationSeconds:number) => {
    const video = videoRef.current;
    const format = formats.find(f => f.key === aspectRatio) ?? formats[0];
    const canvas = document.createElement("canvas");
    canvas.width = format.width;
    canvas.height = format.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    if (video && video.videoWidth && video.videoHeight) {
      const sourceRatio = video.videoWidth / video.videoHeight;
      const targetRatio = canvas.width / canvas.height;
      let sx=0, sy=0, sw=video.videoWidth, sh=video.videoHeight;
      if (sourceRatio > targetRatio) { sw = video.videoHeight * targetRatio; sx = (video.videoWidth - sw) / 2; }
      else { sh = video.videoWidth / targetRatio; sy = (video.videoHeight - sh) / 2; }
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    } else {
      const g=ctx.createLinearGradient(0,0,canvas.width,canvas.height);
      g.addColorStop(0,"#123d2d"); g.addColorStop(.55,"#07140d"); g.addColorStop(1,"#020403");
      ctx.fillStyle=g; ctx.fillRect(0,0,canvas.width,canvas.height);
    }

    const shade=ctx.createLinearGradient(0,0,0,canvas.height);
    shade.addColorStop(0,"rgba(0,0,0,.18)"); shade.addColorStop(.45,"rgba(0,0,0,.2)"); shade.addColorStop(1,"rgba(0,0,0,.9)");
    ctx.fillStyle=shade; ctx.fillRect(0,0,canvas.width,canvas.height);

    const {data:profile}=await supabase.from("profiles").select("display_name,username").eq("id",userId).maybeSingle();
    const hostName=profile?.display_name||profile?.username||"1Muslim Host";
    const dateText=new Date().toLocaleString([], {dateStyle:"medium",timeStyle:"short"});
    const lengthText=durationSeconds>=3600 ? `${Math.floor(durationSeconds/3600)}:${String(Math.floor((durationSeconds%3600)/60)).padStart(2,"0")}:${String(durationSeconds%60).padStart(2,"0")}` : `${Math.floor(durationSeconds/60)}:${String(durationSeconds%60).padStart(2,"0")}`;

    ctx.fillStyle="#d6e7b8"; ctx.font=`900 ${Math.max(22,canvas.width*.025)}px system-ui`; ctx.fillText("1MUSLIM  •  LIVE",canvas.width*.055,canvas.height*.10);
    ctx.fillStyle="#fff"; ctx.font=`900 ${Math.max(30,canvas.width*.045)}px system-ui`;
    const words=title.trim().split(/\\s+/); let line=""; const lines:string[]=[]; const maxWidth=canvas.width*.86;
    for(const word of words){const test=line?line+" "+word:word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word;}else line=test;} if(line)lines.push(line);
    const startY=canvas.height*.68;
    lines.slice(0,2).forEach((text,index)=>ctx.fillText(text,canvas.width*.055,startY+index*canvas.width*.055));
    ctx.fillStyle="#e7eee9"; ctx.font=`800 ${Math.max(18,canvas.width*.022)}px system-ui`; ctx.fillText(hostName,canvas.width*.055,startY+Math.min(lines.length,2)*canvas.width*.055+canvas.width*.035);
    ctx.fillStyle="#c4cec7"; ctx.font=`600 ${Math.max(14,canvas.width*.017)}px system-ui`; ctx.fillText(`${dateText}  •  ${lengthText}`,canvas.width*.055,canvas.height*.94);

    const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/jpeg",.86));
    if(!blob) return null;
    const thumbnailPath=`${userId}/${recordingId}-thumbnail.jpg`;
    const {error}=await supabase.storage.from("live-recordings").upload(thumbnailPath,blob,{contentType:"image/jpeg",upsert:false,cacheControl:"31536000"});
    if(error) throw error;
    return thumbnailPath;
  };

  const saveRecording = async () => {
    if (!chunksRef.current.length) { setError("No recording data was captured."); return false; }
    setSaving(true); setError(""); setSaveMessage("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sign in is required to save a recording.");
      const mimeType = recorderRef.current?.mimeType || "video/webm";
      const extension = mimeType.includes("mp4") ? "mp4" : "webm";
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const recordingId = crypto.randomUUID();
      let thumbnailPath: string | null = null;
      if (thumbnailFile) {
        if (!thumbnailFile.type.startsWith("image/")) throw new Error("Thumbnail must be an image.");
        const safeName = thumbnailFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        thumbnailPath = user.id + "/" + recordingId + "-thumbnail-" + safeName;
        const { error: thumbnailError } = await supabase.storage.from("live-recordings").upload(thumbnailPath, thumbnailFile, { contentType: thumbnailFile.type, upsert: false, cacheControl: "31536000" });
        if (thumbnailError) throw thumbnailError;
      }
      const path = `${user.id}/${recordingId}.${extension}`;
      const durationSeconds = Math.max(1, Math.round((Date.now() - (recordingStartedAtRef.current ?? Date.now())) / 1000));
      if (!thumbnailPath) {
        thumbnailPath = await buildRecordingThumbnail(supabase, user.id, recordingId, durationSeconds);
      }
      const { error: uploadError } = await supabase.storage.from("live-recordings").upload(path, blob, { contentType: mimeType, upsert: false, cacheControl: "31536000" });
      if (uploadError) {
        if (thumbnailPath) await supabase.storage.from("live-recordings").remove([thumbnailPath]);
        throw uploadError;
      }
      const { error: rowError } = await supabase.from("live_recordings").insert({
        id: recordingId, user_id: user.id, title: title.trim(), category,
        video_path: path, mime_type: mimeType, file_size: blob.size,
        duration_seconds: durationSeconds, visibility: "public", thumbnail_path: thumbnailPath,
      });
      if (rowError) {
        await supabase.storage.from("live-recordings").remove([path]);
        if (thumbnailPath) await supabase.storage.from("live-recordings").remove([thumbnailPath]);
        throw rowError;
      }
      const activeStreamId = liveStreamIdRef.current;
      if (activeStreamId) {
        const { error: streamUpdateError } = await supabase.from("live_streams").update({
          recording_id: recordingId,
          status: "ended",
          ended_at: new Date().toISOString(),
        }).eq("id", activeStreamId);
        if (streamUpdateError) throw streamUpdateError;
        liveStreamIdRef.current = null;
      }
      chunksRef.current = [];
      recordingStartedAtRef.current = null;
      setSaveMessage("Saved to your Live Recordings.");
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "The recording could not be saved.");
      return false;
    } finally { setSaving(false); }
  };

  const startLive = async (fromSchedule = false) => {
    if (!cameraReady) return setError("Turn on your camera and microphone first.");
    if (!effectiveLiveTitle.trim()) return setError("Give your live stream a title first.");
    if (fromSchedule && scheduledSlot) {
      if (!hostCheckedIn) return setError("Check in as ready before the scheduled Live can start.");
      if (Date.now() < new Date(scheduledSlot.starts_at).getTime()) return setError("This scheduled Live is still locked. It will start automatically at the scheduled time.");
      if (scheduledSlot.ends_at && Date.now() > new Date(scheduledSlot.ends_at).getTime()) return setError("This scheduled Live has ended. Schedule another Live to continue.");
    }
    if(connectingLive||live)return;
    endRequestedRef.current=false;
    setConnectingLive(true);
    setError(""); setSaveMessage("");
    let pendingStreamId: string | null = null;
    let pendingRoom: Room | null = null;
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sign in is required to go live.");
      setCurrentUserId(user.id);
      if (fromSchedule && scheduledSlot) {
        const { error: unlockError } = await supabase.from("live_schedule_slots").update({status:"live"}).eq("id", scheduledSlot.id).eq("host_id", user.id);
        if (unlockError) throw unlockError;
        setScheduledSlot((slot:any) => slot ? {...slot, status:"live"} : slot);
      }

      const liveStreamId = crypto.randomUUID();
      pendingStreamId = liveStreamId;
      const roomName = `1muslim-live-${liveStreamId}`;
      let liveThumbnailPath: string | null = null;
      if (thumbnailFile) {
        if (!thumbnailFile.type.startsWith("image/")) throw new Error("Thumbnail must be an image.");
        const safeName = thumbnailFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        liveThumbnailPath = `${user.id}/${liveStreamId}-live-thumbnail-${safeName}`;
        const { error: thumbnailError } = await supabase.storage.from("live-recordings").upload(liveThumbnailPath, thumbnailFile, { contentType: thumbnailFile.type, upsert: false, cacheControl: "31536000" });
        if (thumbnailError) throw thumbnailError;
      }
      const { data: insertedStream, error: rowError } = await supabase.from("live_streams").insert({
        id: liveStreamId,
        host_id: user.id,
        title: effectiveLiveTitle,
        category,
        visibility,
        room_name: roomName,
        status: "live",
        last_heartbeat_at: new Date().toISOString(),
        schedule_slot_id: fromSchedule ? scheduledSlot?.id ?? null : null,
        scheduled_end_at: fromSchedule ? scheduledSlot?.ends_at ?? null : null,
        thumbnail_path: liveThumbnailPath,
        aspect_ratio: aspectRatio,
        video_width: formats.find(f => f.key === aspectRatio)?.width ?? 720,
        video_height: formats.find(f => f.key === aspectRatio)?.height ?? 1280,
      }).select("started_at").single();
      if (rowError) throw rowError;
      setBroadcastStartedAt(insertedStream?.started_at ?? new Date().toISOString());

      const tokenResponse = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room: roomName, role: "host" }),
      });
      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok) {
        await supabase.from("live_streams").delete().eq("id", liveStreamId);
        if (liveThumbnailPath) await supabase.storage.from("live-recordings").remove([liveThumbnailPath]);
        throw new Error(tokenData.error || "LiveKit could not be started.");
      }

      const room = new Room({ adaptiveStream: true, dynacast: true });
      pendingRoom = room;
      // Do not leave a phantom live stream visible if LiveKit signalling fails.
      try {
        // Pre-warm the LiveKit Cloud region route before opening the signal socket.
        // LiveKit's SDK can then choose an available region if the initial edge fails.
        // Connect directly on Go Live; serial region warmup delayed first audio packets.
        await room.connect(tokenData.url, tokenData.token, {autoSubscribe:true, maxRetries:5, websocketTimeout:20000});
      } catch (connectionError) {
        room.disconnect();
        await supabase.from("live_streams").update({status:"ended",ended_at:new Date().toISOString()}).eq("id",liveStreamId);
        if (liveThumbnailPath) await supabase.storage.from("live-recordings").remove([liveThumbnailPath]);
        const detail = connectionError instanceof Error ? connectionError.message : String(connectionError);
        throw new Error("LiveKit signal connection failed. Check LIVEKIT_URL (wss:// LiveKit host), LiveKit server availability and network access. " + detail);
      }
      const mediaStream = streamRef.current;
      if (!mediaStream) throw new Error("Camera and microphone must be enabled first.");
      const videoTrack = mediaStream.getVideoTracks()[0];
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (videoTrack && studioMode !== "voice" && cameraOn) await room.localParticipant.publishTrack(videoTrack, { source: Track.Source.Camera, simulcast: true, videoEncoding: { maxBitrate: 3500000, maxFramerate: 30 } });
      if (audioTrack) {
        // Voice-only broadcasts must publish a live microphone track, never camera video.
        audioTrack.enabled=micOn;
        let localAudioTrack = audioTrackRef.current;
        if (!localAudioTrack || localAudioTrack.mediaStreamTrack !== audioTrack) {
          const audioContext = await ensureAudioContext();
          localAudioTrack = new LocalAudioTrack(audioTrack, undefined, true, audioContext);
          const processor = createLiveAudioProcessor(audioEffect, nasheedOn, soundVolume);
          await localAudioTrack.setProcessor(processor as any);
          audioTrackRef.current = localAudioTrack;
          audioProcessorRef.current = processor;
          processedAudioTrackRef.current = processor.processedTrack ?? localAudioTrack.mediaStreamTrack;
        }
        await room.localParticipant.publishTrack(localAudioTrack, { source: Track.Source.Microphone });
      }
      roomRef.current = room;
      liveStreamIdRef.current = liveStreamId;
      room.on(RoomEvent.Reconnecting,()=>{
        if(!endRequestedRef.current)setSaveMessage("Connection interrupted — viewers are being notified while LiveKit reconnects.");
      });
      room.on(RoomEvent.Reconnected,()=>{
        if(!endRequestedRef.current){setSaveMessage("");setError("")}
      });
      room.on(RoomEvent.Disconnected,()=>{
        if(!endRequestedRef.current)setError("Broadcast connection lost. Viewers will see that the host is reconnecting.");
      });

      try { startRecording(); } catch (recordingError) {
        console.warn("Broadcast started without local recording",recordingError);
        setSaveMessage("Live is running. Recording is unavailable on this device.");
      }
      setLive(true);
      // Cue the host only after LiveKit confirms the broadcast is connected.
      playLiveConnectedPop();
      pendingStreamId = null;
      pendingRoom = null;
      setShowHostIntro(true);
      // Notify administrators only after the broadcast is actually connected.
      void fetch("/api/live-alert", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ streamId: liveStreamId }) }).catch((error) => console.warn("Live alert request failed", error));
      setViewers(0);
    } catch (err) {
      pendingRoom?.disconnect();
      roomRef.current?.disconnect();
      roomRef.current = null;
      if (pendingStreamId) {
        const db = createClient();
        await db.from("live_streams").update({status:"ended",ended_at:new Date().toISOString()}).eq("id",pendingStreamId);
      }
      setBroadcastStartedAt(null);
      setShowHostIntro(false);
      setError(err instanceof Error ? err.message : "Live broadcast could not start.");
    } finally { setConnectingLive(false); }
  };

  useEffect(() => { if (!live || !liveStreamIdRef.current) return; const room = `1muslim-live-${liveStreamIdRef.current}`; const update = async () => { try { const response = await fetch("/api/livekit/viewer-count",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({room})}); const data=await response.json(); if(response.ok) setViewers(Number(data.viewerCount ?? 0)); } catch {} }; void update(); const timer=window.setInterval(update,5000); return()=>window.clearInterval(timer); }, [live]);

  // Store audience snapshots during a live so the recap can display historical peaks.
  useEffect(()=>{
    if(!live)return;
    const sample=async()=>{
      const id=liveStreamIdRef.current;
      if(!id)return;
      try{
        const room=roomRef.current;
        const count=room?room.remoteParticipants.size:Math.max(0,viewers);
        await fetch("/api/live-analytics",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({streamId:id,viewers:count})});
      }catch{}
    };
    void sample();
    const timer=window.setInterval(()=>void sample(),15000);
    return()=>window.clearInterval(timer);
  },[live,viewers]);

  const [liveEndedSurvey,setLiveEndedSurvey]=useState(false);
  const [liveRating,setLiveRating]=useState(0);
  const finishToProfile=()=>window.location.assign("/profile");
  const endLive = () => {
    if(endRequestedRef.current)return;
    endRequestedRef.current=true;
    setLive(false); setViewers(0); setShowHostIntro(false);setLiveEndedSurvey(true);
    const supabase = createClient();
    const liveStreamId = liveStreamIdRef.current;
    const activeRoom=roomRef.current;
    roomRef.current = null;
    // Send the host-authenticated terminal packet first; then commit terminal
    // status server-side. The server also closes the room after updating DB.
    // Neither action waits for local MediaRecorder or recording upload.
    if(liveStreamId){
      const terminalSignal=activeRoom?activeRoom.localParticipant.publishData(
        new TextEncoder().encode(JSON.stringify({type:"live-ended",streamId:liveStreamId})),
        {reliable:true,topic:"live-status"}
      ).catch(error=>console.warn("Live end packet unavailable",error)):Promise.resolve();
      void (async()=>{
        try{
          await Promise.race([terminalSignal,new Promise<void>(resolve=>window.setTimeout(resolve,250))]);
          const response=await fetch("/api/live-end",{
            method:"POST",headers:{"Content-Type":"application/json"},
            body:JSON.stringify({streamId:liveStreamId}),cache:"no-store",keepalive:true
          });
          if(!response.ok)throw new Error("Server End Live returned "+response.status);
        }catch(error){
          console.warn("Server End Live failed; attempting direct terminal update",error);
          const {error:dbError}=await supabase.from("live_streams").update({
            status:"ended",ended_at:new Date().toISOString()
          }).eq("id",liveStreamId);
          if(dbError)console.error("End Live could not be confirmed",dbError);
        }finally{void activeRoom?.disconnect();}
      })();
      window.setTimeout(()=>void activeRoom?.disconnect(),2500);
    }else{
      void activeRoom?.disconnect();
    }
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = async () => {
        const saved = await saveRecording();
        if (saved && liveStreamId) setSaveMessage("Your Live recording is saved.");
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null; setCameraReady(false);
      audioProcessorRef.current = null; audioTrackRef.current = null; processedAudioTrackRef.current = null; setCameraOn(true); setMicOn(true);
        recorderRef.current = null;
        audioProcessorRef.current = null;
        audioTrackRef.current = null;
        processedAudioTrackRef.current = null;
      };
      recorder.stop();
      setRecording(false);
    } else {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null; setCameraReady(false);
      if (liveStreamId) setSaveMessage("Your Live has ended.");
    }
  };

  return (
    <main className="goLive"><GoLiveHudHudTip/>{live&&<button type="button" className="liveEndCorner" onClick={endLive} disabled={saving} aria-label="End livestream">{saving?"Saving…":"■ End Live"}</button>}{liveEndedSurvey&&<div className="omEndSurveyBackdrop" role="presentation"><section className="omEndSurvey" role="dialog" aria-modal="true" aria-label="Live quality survey"><span className="omEndSurveyEyebrow">✦ 1MUSLIM LIVE · SESSION COMPLETE</span><h2>Your Live has ended</h2><p>How was the quality of your Live? This quick rating is optional.</p><div className="omEndSurveyStars" role="group" aria-label="Rate live quality from one to five stars">{[1,2,3,4,5].map(star=><button key={star} type="button" aria-label={`${star} stars`} aria-pressed={liveRating===star} onClick={()=>setLiveRating(star)}>{star<=liveRating?"★":"☆"}</button>)}</div><small>{liveRating?`Thanks for rating your Live ${liveRating} out of 5 stars.`:"Your feedback helps us improve live streaming."}</small><button className="omEndSurveyContinue" type="button" onClick={finishToProfile}>Continue to My Profile →</button><button className="omEndSurveySkip" type="button" onClick={finishToProfile}>Skip for now</button></section><style>{`.omEndSurveyBackdrop{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:20px;background:#020a08c9;backdrop-filter:blur(14px)}.omEndSurvey{width:min(100%,390px);border:1px solid #e7c98a80;border-radius:26px;padding:28px;text-align:center;color:#f6f2e8;background:linear-gradient(145deg,#133b32,#071913);box-shadow:0 24px 100px #0009;animation:omSurveyIn .45s cubic-bezier(.2,.8,.2,1) both}.omEndSurveyEyebrow{font-size:10px;letter-spacing:.17em;color:#ebd59f}.omEndSurvey h2{font-size:25px;margin:16px 0 8px}.omEndSurvey p{color:#c2d1c9;font-size:13px;line-height:1.6}.omEndSurveyStars{display:flex;justify-content:center;gap:6px;margin:22px 0}.omEndSurveyStars button{font-size:38px;color:#f3d186;background:none;border:0;cursor:pointer}.omEndSurvey small{display:block;color:#abc4b6}.omEndSurveyContinue,.omEndSurveySkip{display:block;width:100%;margin-top:20px;padding:13px;border-radius:999px;cursor:pointer}.omEndSurveyContinue{border:1px solid #ebd39e;background:#ebd39e;color:#103027;font-weight:800}.omEndSurveySkip{margin-top:6px;border:0;background:transparent;color:#c8d5ce}@keyframes omSurveyIn{from{opacity:0;transform:translateY(35px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}@media(prefers-reduced-motion:reduce){.omEndSurvey{animation:none}}`}</style></div>}
      <style jsx>{`
        .liveEndCorner{position:fixed;top:calc(env(safe-area-inset-top,0px) + 14px);right:16px;z-index:9998;border:1px solid #ffb0a9;border-radius:999px;padding:11px 18px;background:#8d1719f0;color:white;font-weight:800;font-size:14px;box-shadow:0 8px 24px #0009;cursor:pointer;backdrop-filter:blur(12px)}.liveInlineSettings{display:grid;place-items:center}.liveEndCorner:focus-visible{outline:3px solid #fff;outline-offset:3px}.liveEndCorner:disabled{opacity:.6;cursor:wait} .goLive{min-height:100vh;background:var(--bg);color:var(--text)}.studioTools{display:grid;gap:10px;margin:0 0 18px}.upcomingPrep{display:flex;justify-content:space-between;align-items:center;gap:14px;border:1px solid #6b815e;background:linear-gradient(145deg,#121c12,#0b110c);border-radius:18px;padding:14px}.upcomingPrep strong,.upcomingPrep span{display:block}.upcomingPrep strong{font-size:13px;margin:4px 0}.upcomingPrep>div>span:last-child{font-size:10px;color:#7f8d84}.prepButton,.scheduleButton{border:1px solid #41503d;background:#d6e7b8;color:#071008;border-radius:999px;padding:10px 13px;font-size:10px;font-weight:850;cursor:pointer}.scheduleButton{justify-self:start;background:#101811;color:#d6e7b8}.scheduleBox{border:1px solid #263029;border-radius:17px;padding:15px;background:#0a100c}.scheduleBox h3{font-size:14px;margin:0 0 10px}.scheduleFields{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:8px;margin-bottom:10px}@media(max-width:620px){.upcomingPrep{align-items:flex-start;flex-direction:column}.prepButton{width:100%}.scheduleFields{grid-template-columns:1fr}}
        .newStudioActions{padding:12px 14px 18px;display:grid;justify-items:center;gap:11px;background:linear-gradient(180deg,#071711,#07110d)}.newStudioModes{display:flex;align-items:center;gap:8px;padding:4px;border:1px solid #ffffff30;border-radius:999px;background:#ffffff0b;backdrop-filter:blur(20px)}.newStudioModes button{border:0;border-bottom:2px solid transparent;padding:9px 19px;color:#c9dcd1;background:transparent;border-radius:20px;font-size:13px;font-weight:750;cursor:pointer}.newStudioModes button.selected{color:#a7ffd3;border-bottom-color:#51eab0;background:#ffffff12}.newStudioGo{width:min(70%,270px);min-height:42px;border:1px solid #9cf9c9;border-radius:999px;color:white;font-weight:850;font-size:15px;background:linear-gradient(100deg,#007f59,#02a36f);box-shadow:0 4px 20px #00c88830;cursor:pointer}.newStudioGo:disabled{opacity:.6}.newStudioHint{font-size:10px;color:#a6c3b2}.legacyStudioControls{display:none!important}.previewOverlayTools button.studioToggleOff{background:#811f27!important;border-color:#f2a5a5!important;color:#fff!important}.previewOverlayTools button.studioToggleOn{background:#07563d!important;border-color:#6ef1b5!important;color:#fff!important}@media(max-width:680px){.newStudioActions{padding-bottom:20px}.previewOverlayTools{right:10px!important}.preliveInspire{opacity:.8}}\n
        /* Mobile studio v3: all broadcast controls stay inside the camera viewport. */
        @media(max-width:850px){
          .goLive .shell{padding:0 0 36px!important;max-width:none!important}
          .goLive .heading,.goLive .studioTools{display:none!important}
          .goLive .layout{display:block!important}
          .goLive .layout>.panel:first-child{border:0!important;border-radius:0!important;background:#06100d!important;overflow:visible!important}
          .goLive .layout>.panel:first-child>.preview{width:100%!important;max-width:none!important;height:calc(100dvh - 74px - env(safe-area-inset-top,0px))!important;min-height:520px!important;max-height:none!important;aspect-ratio:auto!important;overflow:hidden!important;position:relative!important;display:block!important}
          .goLive .layout>.panel:first-child>.preview>video{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;object-fit:cover!important}
          .goLive .preliveIdentity{bottom:174px!important;left:14px!important;right:14px!important;padding:7px 10px!important;border-radius:16px!important}
          .goLive .preliveIdentityIcon{width:28px!important;height:28px!important}
          .goLive .newStudioActions{position:absolute!important;display:flex!important;left:12px!important;right:12px!important;bottom:calc(12px + env(safe-area-inset-bottom,0px))!important;z-index:30!important;padding:10px 12px!important;gap:9px!important;border:1px solid #8ef0c35a!important;border-radius:22px!important;background:linear-gradient(145deg,#061d17dc,#07140edc)!important;backdrop-filter:blur(22px)!important;box-shadow:0 12px 40px #0008!important;flex-direction:column!important}
          .goLive .newStudioModes{display:flex!important;width:100%!important;justify-content:space-evenly!important;gap:3px!important;background:transparent!important;border:0!important;padding:0!important}
          .goLive .newStudioModes button{flex:1!important;padding:7px 5px!important;font-size:12px!important}
          .goLive .newStudioGo{min-height:40px!important;width:min(72%,270px)!important;font-size:14px!important}
          .goLive .newStudioHint{font-size:9px!important}
          .goLive .previewOverlayTools{top:28%!important;right:12px!important;transform:none!important;gap:10px!important;z-index:31!important}
          .goLive .previewOverlayTools button{width:40px!important;height:40px!important;box-shadow:0 4px 15px #0007!important}
          .goLive .previewOverlayTools button.studioToggleOff{background:#831f2d!important;border-color:#ffa0a8!important}
          .goLive .previewOverlayTools button.studioToggleOn{background:#07543e!important;border-color:#76f2ba!important}
          .goLive .preview .lve-root{z-index:35!important}
          .goLive .preview .liveEndCorner{z-index:60!important}
        }
        @media(max-width:850px) and (max-height:690px){.goLive .preliveIdentity{bottom:162px!important}.goLive .newStudioActions{gap:6px!important;padding:8px!important}.goLive .newStudioHint{display:none!important}}

        .liveRosterBackdrop{position:absolute;inset:0;z-index:100;display:flex;align-items:flex-end;justify-content:center;background:#0009;backdrop-filter:blur(5px)}.liveRosterSheet{width:100%;max-height:74%;overflow:hidden;display:flex;flex-direction:column;border:1px solid #7cddb180;border-radius:24px 24px 0 0;background:#071b17f2;color:white;box-shadow:0 -12px 45px #0009;animation:rosterRise .3s cubic-bezier(.16,1,.3,1)}.liveRosterSheet header{display:flex;align-items:center;justify-content:space-between;padding:18px;border-bottom:1px solid #ffffff25}.liveRosterSheet header div{display:grid;gap:3px}.liveRosterSheet header strong{font-size:17px}.liveRosterSheet header small{font-size:12px;color:#a7e8c9}.liveRosterSheet header button{border:0;border-radius:50%;background:#ffffff20;color:white;padding:8px 12px}.liveRosterList{overflow-y:auto;min-height:80px;padding:8px 14px 18px;overscroll-behavior:contain}.liveRosterList p{text-align:center;color:#b5c9bf}.liveRosterPerson{display:flex;align-items:center;gap:12px;padding:10px 4px;border-bottom:1px solid #ffffff13}.liveRosterAvatar{display:grid;place-items:center;width:43px;height:43px;flex-shrink:0;overflow:hidden;border:1px solid #9cecc4;border-radius:50%;background:#174c3d}.liveRosterAvatar img{width:100%;height:100%;object-fit:cover}.liveRosterName{font-size:14px;font-weight:750;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}.liveRosterXp{font-size:12px;color:#b6f3d0;white-space:nowrap}.liveRosterRefresh{margin:8px 18px 18px;padding:10px;border:1px solid #4ebf95;border-radius:999px;background:#124f3d;color:#fff}@keyframes rosterRise{from{transform:translateY(50px);opacity:0}to{transform:translateY(0);opacity:1}}@media(prefers-reduced-motion:reduce){.liveRosterSheet{animation:none}}
        /* Studio polish: lighter chrome, coherent proportions, uncluttered live state. */
        .goLive .newStudioActions{transition:opacity .3s ease,transform .4s cubic-bezier(.16,1,.3,1)}
        .goLive .newStudioModes{border-radius:999px!important;background:rgba(2,20,16,.56)!important;border:1px solid #ffffff24!important}
        .goLive .newStudioModes button.selected{background:#1c8463a8!important;border-bottom-color:#a3ffcf!important;color:#fff!important;box-shadow:inset 0 1px 8px #ffffff19}
        .goLive .newStudioGo{background:linear-gradient(115deg,#047d57,#05a475)!important;border:1px solid #7be8b8!important;box-shadow:0 4px 18px #0005!important}
        .goLive .previewOverlayTools button{border-radius:50%!important;backdrop-filter:blur(16px)!important}
        .goLive .preliveIdentity{box-shadow:0 6px 20px #0006!important}
        @media(min-width:851px){
          .goLive .layout>.panel:first-child>.preview{overflow:hidden!important}
          .goLive .layout>.panel:first-child>.preview .newStudioActions{position:absolute!important;bottom:12px!important;left:12px!important;right:12px!important;z-index:29!important;display:flex!important;flex-direction:column!important;gap:8px!important;padding:10px!important;border-radius:18px!important;background:#051d16c9!important;backdrop-filter:blur(18px)!important;border:1px solid #86e7b355!important}
          .goLive .layout>.panel:first-child>.preview .newStudioModes{display:flex!important;width:100%!important;justify-content:space-around!important}
          .goLive .layout>.panel:first-child>.preview .newStudioModes button{flex:1!important;padding:8px 3px!important;font-size:12px!important}
          .goLive .layout>.panel:first-child>.preview .newStudioGo{min-height:38px!important;width:65%!important;font-size:13px!important}
          .goLive .layout>.panel:first-child>.preview .newStudioHint{display:none!important}
        }
        @media(max-width:850px){.goLive .newStudioHint{display:none!important}.goLive .newStudioActions{gap:7px!important;padding:9px 10px!important}.goLive .preliveIdentity{bottom:144px!important}.goLive .previewOverlayTools{top:24%!important}.goLive .previewOverlayTools button{width:38px!important;height:38px!important}}
        .goLive .previewOverlayTools button{display:flex!important;align-items:center!important;justify-content:center!important;border-radius:50%!important;transition:transform .24s ease!important}.goLive .previewOverlayTools button:active{transform:scale(.92)}.goLive .newStudioModes button{display:flex!important;align-items:center!important;justify-content:center!important;flex-direction:column!important;gap:3px!important}.goLive .newStudioModes button svg{width:19px;height:19px}.goLive .immersiveHeader>button{display:flex;align-items:center;gap:6px}.goLive .immersiveHeader>button svg{width:18px;height:18px}\n        .studioTransform{transition:width .75s cubic-bezier(.22,1,.36,1),height .75s cubic-bezier(.22,1,.36,1),max-width .75s cubic-bezier(.22,1,.36,1),aspect-ratio .75s cubic-bezier(.22,1,.36,1),border-radius .65s ease,background .65s ease!important;overflow:hidden;will-change:width,height,aspect-ratio}.studioTransform>video{transition:opacity .5s ease,transform .65s cubic-bezier(.2,.8,.2,1)}.studioVoiceMode>video{opacity:0!important;transform:scale(1.12);pointer-events:none}.voiceAvatarStage{position:absolute;inset:0;z-index:3;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:20px;opacity:0;visibility:hidden;transform:scale(.92);transition:opacity .6s ease,transform .65s cubic-bezier(.2,.8,.2,1),visibility .6s;background:radial-gradient(ellipse at 50% 43%,#184a3b 0%,#091e1b 52%,#020807 100%);pointer-events:none;overflow:hidden}.voiceAvatarStageActive{opacity:1;visibility:visible;transform:scale(1)}.voiceAvatarMotion{position:relative;width:clamp(150px,40%,260px);aspect-ratio:1;display:grid;place-items:center;animation:voiceFloat 5s ease-in-out infinite;filter:drop-shadow(0 12px 28px #0008)}.voiceAvatarAura{position:absolute;inset:-10%;border-radius:50%;border:2px solid #87f8ce9c;box-shadow:0 0 calc(18px + var(--voice-energy,0)*65px) #34e5a5, inset 0 0 35px #36d9a557;background:radial-gradient(circle,#3ff3a322 25%,transparent 72%);animation:voiceBreathe 3.6s ease-in-out infinite;transform:scale(calc(1 + var(--voice-energy,0)*.28))}.voiceAvatarPortrait{width:100%;height:100%;overflow:hidden;border-radius:50%;display:grid;place-items:center;border:3px solid #c8fce6;background:radial-gradient(circle at 35% 25%,#28755f,#07261c 75%);box-shadow:0 0 35px #20c78c55;transform:scale(calc(1 + var(--voice-energy,0)*.11)) rotate(calc(var(--voice-energy,0)*3deg));transition:transform .1s linear}.voiceAvatarPortrait img{width:100%;height:100%;object-fit:cover}.voiceAvatarPortrait>span{font-size:clamp(60px,14vw,110px);color:#e5f9f0}.voiceAvatarLabel{z-index:2;display:grid;gap:5px;text-align:center;text-shadow:0 2px 9px #000}.voiceAvatarLabel strong{font-size:clamp(17px,4vw,24px);color:#fff}.voiceAvatarLabel span{font-size:12px;color:#a5f3d1}.voiceBackdropOrbs{position:absolute;inset:0}.voiceBackdropOrbs i{position:absolute;width:45%;aspect-ratio:1;border:1px solid #5fe1b333;border-radius:50%;left:27%;top:20%;animation:voiceRing 7s ease-in-out infinite}.voiceBackdropOrbs i:nth-child(2){animation-delay:-2.3s}.voiceBackdropOrbs i:nth-child(3){animation-delay:-4.6s}@keyframes voiceFloat{0%,100%{translate:-4px 5px}25%{translate:6px -7px}50%{translate:4px 4px}75%{translate:-7px -3px}}@keyframes voiceBreathe{0%,100%{scale:.96}50%{scale:1.05}}@keyframes voiceRing{0%{transform:scale(.7);opacity:0}35%{opacity:.7}100%{transform:scale(2.1);opacity:0}}@media(prefers-reduced-motion:reduce){.voiceAvatarMotion,.voiceAvatarAura,.voiceBackdropOrbs i{animation:none}.studioTransform,.studioTransform>video,.voiceAvatarStage{transition:none}}

        /* Full-canvas immersive stage: mobile and desktop. Keep controls overlayed, never consume video height. */
        .goLive .layout>.panel:first-child>.preview.studioTransform{isolation:isolate;transition:height .7s cubic-bezier(.22,1,.36,1),aspect-ratio .7s cubic-bezier(.22,1,.36,1),border-radius .5s ease!important}
        .goLive .layout>.panel:first-child>.preview.studioTransform>video{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;object-fit:cover!important;object-position:center center!important;transition:transform .7s cubic-bezier(.22,1,.36,1),opacity .5s ease!important}
        .goLive .layout>.panel:first-child>.preview.studioTransform[data-studio-mode="phone"]>video{object-fit:cover!important}
        .goLive .layout>.panel:first-child>.preview.studioTransform[data-studio-mode="desktop"]>video{object-fit:cover!important}
        .goLive .layout>.panel:first-child>.preview.studioTransform[data-studio-mode="voice"]>video{opacity:0!important}
        @media(max-width:850px){
          .goLive .shell{padding-bottom:0!important}
          .goLive .layout>.panel:first-child>.preview.studioTransform{height:calc(100dvh - 74px - env(safe-area-inset-top,0px))!important;min-height:540px!important;max-height:none!important;aspect-ratio:auto!important;width:100%!important;max-width:none!important;margin:0!important;border-radius:0!important}
          .goLive .layout>.panel:first-child>.preview.studioTransform[data-studio-mode="desktop"]>video{object-fit:cover!important}
          .goLive .layout>.panel:first-child>.preview.studioTransform .newStudioActions{bottom:calc(10px + env(safe-area-inset-bottom,0px))!important}
          .goLive .layout>.panel:first-child>.preview.studioTransform .voiceAvatarStage{inset:0!important}
        }
        @media(min-width:851px){
          .goLive .layout>.panel:first-child>.preview.studioTransform{width:100%!important;max-width:none!important;height:min(88dvh,960px)!important;min-height:580px!important;aspect-ratio:auto!important;margin:0 auto!important;overflow:hidden!important}
          .goLive .layout>.panel:first-child>.preview.studioTransform[data-studio-mode="desktop"]{height:min(82dvh,900px)!important}
          .goLive .layout>.panel:first-child>.preview.studioTransform[data-studio-mode="phone"]{height:min(90dvh,1000px)!important}
          .goLive .layout>.panel:first-child>.preview.studioTransform .newStudioActions{position:absolute!important;bottom:14px!important;left:14px!important;right:14px!important}
        }
        @media(prefers-reduced-motion:reduce){.goLive .layout>.panel:first-child>.preview.studioTransform,.goLive .layout>.panel:first-child>.preview.studioTransform>video{transition:none!important}}

        /* Fluid camera frame morph and premium border sweep. */
        .goLive .layout>.panel:first-child>.preview.studioTransform{
          border:1px solid #c6a971!important;
          box-shadow:0 0 0 1px #f7e7b61f,0 14px 54px #0009,inset 0 0 18px #9afcce0b!important;
          transition:height 1.05s cubic-bezier(.19,1,.22,1),width 1.05s cubic-bezier(.19,1,.22,1),border-radius .95s cubic-bezier(.19,1,.22,1),box-shadow .9s ease!important;
        }
        .goLive .layout>.panel:first-child>.preview.studioTransform::after{
          content:"";position:absolute;inset:0;z-index:38;pointer-events:none;border-radius:inherit;padding:2px;
          background:conic-gradient(from 0deg,transparent 0deg,#80e9c53d 70deg,#f5e3a8 112deg,#fffbe7 133deg,#76fbd2 154deg,transparent 225deg);
          -webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);
          -webkit-mask-composite:xor;
          mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);
          mask-composite:exclude;opacity:.28;transition:opacity .5s ease,padding .5s ease;
        }
        .goLive .layout>.panel:first-child>.preview.studioTransform.studioMorphing{
          box-shadow:0 0 0 1px #d6fbe9aa,0 0 26px #5df0c25c,0 20px 65px #0009!important;
        }
        .goLive .layout>.panel:first-child>.preview.studioTransform.studioMorphing::after{
          opacity:1;padding:3px;animation:studioBorderSweep 1.05s cubic-bezier(.19,1,.22,1) both;
        }
        /* Preserve uninterrupted video pixels while frame geometry morphs. */
        @keyframes studioBorderSweep{
          0%{filter:brightness(1.7);opacity:0;clip-path:inset(0 100% 0 0)}
          25%{opacity:1;clip-path:inset(0 50% 0 0)}
          65%{opacity:1;clip-path:inset(0 0 0 0)}
          100%{opacity:.4;clip-path:inset(0 0 0 0)}
        }
        @keyframes studioCameraSettle{
          0%{filter:brightness(.82);transform:scale(1.045)}
          45%{filter:brightness(1.04)}
          100%{filter:brightness(1);transform:scale(1)}
        }
        @media(prefers-reduced-motion:reduce){
          .goLive .layout>.panel:first-child>.preview.studioTransform,
          .goLive .layout>.panel:first-child>.preview.studioTransform::after,
          .goLive .layout>.panel:first-child>.preview.studioTransform>video{transition:none!important;animation:none!important}
        }

        /* Launch choreography: centered translucent button, disappearing selector, soft stage-wide light. */
        .goLive .layout>.panel:first-child>.preview.studioTransform .newStudioActions{pointer-events:none!important;background:transparent!important;border:0!important;box-shadow:none!important;backdrop-filter:none!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:10px!important}
        .goLive .layout>.panel:first-child>.preview.studioTransform .newStudioActions>*{pointer-events:auto}
        .goLive .layout>.panel:first-child>.preview.studioTransform .newStudioModes{width:min(100%,540px)!important;transition:opacity .85s ease,transform .85s cubic-bezier(.22,1,.36,1),filter .85s ease,visibility .85s ease!important}
        .goLive .layout>.panel:first-child>.preview.studioTransform .studioLaunchActive .newStudioModes{opacity:0!important;transform:translateY(25px) scale(.95)!important;filter:blur(7px)!important;visibility:hidden!important;pointer-events:none!important}
        .goLive .layout>.panel:first-child>.preview.studioTransform .newStudioGo{position:relative!important;align-self:center!important;width:min(48%,240px)!important;min-width:155px!important;min-height:46px!important;opacity:.3!important;border:1px solid #baffdd!important;background:linear-gradient(100deg,#07815d,#14bc86)!important;box-shadow:0 0 18px #3cfdab20!important;transition:opacity .35s ease,transform .45s cubic-bezier(.22,1,.36,1),box-shadow .5s ease,filter .5s ease!important;pointer-events:auto!important}
        .goLive .layout>.panel:first-child>.preview.studioTransform .newStudioGo:hover,.goLive .layout>.panel:first-child>.preview.studioTransform .newStudioGo:focus-visible,.goLive .layout>.panel:first-child>.preview.studioTransform .newStudioGo:active,.goLive .layout>.panel:first-child>.preview.studioTransform .newStudioGo.launchPressed{opacity:1!important;transform:scale(1.055)!important;box-shadow:0 0 28px #4affb5bb,0 0 80px #7cfdd34d!important}
        .goLive .layout>.panel:first-child>.preview.studioTransform .studioLaunchActive .newStudioGo{opacity:1!important}
        .goLive .layout>.panel:first-child>.preview.studioTransform .studioLaunchComplete .newStudioGo{opacity:0!important;transform:scale(1.18)!important;pointer-events:none!important}
        .goLive .layout>.panel:first-child>.preview.studioTransform .studioLaunchActive .newStudioHint{opacity:0!important;pointer-events:none!important}
        .studioLaunchFlash{position:absolute;inset:0;z-index:4;pointer-events:none;opacity:0;background:radial-gradient(ellipse at 50% 72%,#a6ffe269,#4effa51a 38%,transparent 80%);mix-blend-mode:screen;transition:opacity .8s ease}
        .studioLaunchFlashOn{animation:studioLaunchIllumination 1.5s cubic-bezier(.22,1,.36,1) both}
        @keyframes studioLaunchIllumination{0%{opacity:0;transform:scale(.6)}22%{opacity:.9;transform:scale(1.02)}70%{opacity:.35;transform:scale(1.1)}100%{opacity:0;transform:scale(1.2)}}
        @media(prefers-reduced-motion:reduce){.studioLaunchFlashOn{animation:none}.goLive .layout>.panel:first-child>.preview.studioTransform .newStudioActions *{transition:none!important}}

        /* Compact glass settings: single source of format selection is the studio mode switcher. */
        .goLive .compactLiveSettings{background:rgba(7,23,18,.68)!important;backdrop-filter:blur(24px) saturate(1.25)!important;-webkit-backdrop-filter:blur(24px) saturate(1.25)!important;border:1px solid rgba(201,255,227,.22)!important;box-shadow:0 20px 65px #0008!important;padding:16px!important;border-radius:20px!important;max-height:min(72dvh,550px)!important;height:auto!important}
        .compactLiveSettingsHeader{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}
        .compactLiveSettingsHeader h2{margin:0!important;font-size:16px!important}
        .compactLiveSettingsClose{display:grid;place-items:center;flex:0 0 34px;width:34px;height:34px;border-radius:50%;border:1px solid #d4ffda55;background:#ffffff13;color:#fff;font-size:16px;cursor:pointer}
        .compactLiveSettings .field{margin-bottom:12px!important}
        .compactLiveSettings .field label:not(.compactCoverPicker){font-size:10px!important}
        .compactTitleRow{display:flex;gap:10px;align-items:stretch}
        .compactTitleRow .input{flex:1;min-width:0}
        .compactCoverPicker{display:flex!important;flex:0 0 66px;width:66px;height:58px;position:relative;align-items:center;justify-content:center;overflow:hidden;border:1px dashed #b5e7d080;border-radius:13px;background:#ffffff14;cursor:pointer}
        .compactCoverPicker img{width:100%;height:100%;object-fit:cover;display:block}
        .compactCoverPicker>span:first-child{font-size:23px;color:#e2ffef}
        .compactCoverCaption{position:absolute;bottom:0;left:0;right:0;text-align:center;background:#07140cb8;color:white;font-size:9px;padding:2px}
        .compactCoverInput{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
        .liveSettingsScrim{position:fixed;inset:0;z-index:39;background:#0004;border:0;cursor:default}
        .goLive .settingsOpen .layout>.form.compactLiveSettings{position:fixed!important;top:calc(90px + env(safe-area-inset-top))!important;bottom:auto!important;left:50%!important;right:auto!important;transform:translateX(-50%)!important;width:min(calc(100vw - 24px),420px)!important;max-height:min(68dvh,480px)!important;z-index:60!important;overflow:auto!important;overscroll-behavior:contain}
        @media(min-width:851px){.goLive .layout>.form.compactLiveSettings{position:relative!important;max-width:420px!important;min-height:0!important}}
        .bar{height:62px;border-bottom:1px solid #1b241f;display:flex;align-items:center;justify-content:space-between;padding:0 max(18px,calc((100vw - 1120px)/2));background:rgba(5,8,6,.9);backdrop-filter:blur(16px);position:sticky;top:0;z-index:5}
        .brand{display:flex;gap:9px;align-items:center;font-weight:850}.mark{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:#101811;border:1px solid #354237;color:#d6e7b8}.back{color:#98a49d;text-decoration:none;font-size:12px}
        .shell{max-width:1120px;margin:auto;padding:30px 18px 70px}.heading{margin-bottom:20px}.eyebrow{font-size:10px;letter-spacing:.16em;color:#829b87;font-weight:850}.heading h1{font-size:42px;letter-spacing:-.06em;margin:8px 0}.heading p{color:#849087;font-size:13px;margin:0}
        .layout{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(280px,.65fr);gap:16px}.panel{border:1px solid #1b241f;border-radius:22px;background:#0a100c;overflow:hidden}.preview{width:min(100%,420px);margin-inline:auto;max-height:min(76dvh,720px);aspect-ratio:9/16;background:radial-gradient(circle at 50% 40%,#18231b,#050806 65%);position:relative;display:grid;place-items:center}.preview video{width:100%;height:100%;object-fit:cover;display:block}.preview.format-portrait{width:min(100%,calc(76dvh * 9 / 16),420px)}.preview.format-square{width:min(100%,min(76dvh,520px))}.preview.format-landscape{width:min(100%,640px)}.preview.studioMorphing .voiceAvatarStageActive{animation:studioVoiceReturn 2s cubic-bezier(.22,1,.36,1) both}@keyframes studioDeviceZoomCurtain{0%{opacity:0;transform:scale(.45)}22%{opacity:1;transform:scale(1.7)}65%{opacity:.95;transform:scale(2)}100%{opacity:0;transform:scale(2.3)}}@keyframes studioCameraReturn{0%,46%{opacity:0;filter:blur(12px)}72%{opacity:.5;filter:blur(4px)}100%{opacity:1;filter:blur(0)}}@keyframes studioVoiceReturn{0%,35%{opacity:0;filter:blur(10px)}100%{opacity:1;filter:blur(0)}}.preview.studioVoiceMode{width:min(72vw,330px,38dvh)!important;aspect-ratio:1/1!important;max-height:38dvh;border-radius:26px!important}.preview.studioTransform{transition:width .75s cubic-bezier(.22,1,.36,1),height .75s cubic-bezier(.22,1,.36,1),aspect-ratio .75s cubic-bezier(.22,1,.36,1),border-radius .65s ease,box-shadow .65s ease!important}@media(prefers-reduced-motion:reduce){.preview.studioTransform,.studioTransform>video,.voiceAvatarStage,.preview.studioMorphing::before,.preview.studioMorphing>video,.preview.studioMorphing .voiceAvatarStageActive{transition:none!important;animation:none!important}}.previewOverlayTools{position:absolute;right:10px;top:50%;transform:translateY(-50%);z-index:14;display:flex;flex-direction:column;gap:9px}.previewOverlayTools button{width:45px;height:45px;border-radius:50%;border:1px solid #ffffff66;background:#0a1026bb;backdrop-filter:blur(12px);color:#fff;font-size:20px;cursor:pointer;box-shadow:0 4px 14px #0007}.previewOverlayTools button:focus-visible{outline:2px solid #84f4ff}.preview video.frontCamera{transform:scaleX(-1)}.preview video.backCamera{transform:none}.preview.format-square{aspect-ratio:1/1}.preview.format-landscape{aspect-ratio:16/9}.placeholder{text-align:center;color:#6f7d74}.cameraIcon{font-size:44px;margin-bottom:8px}.recording{position:absolute;top:14px;right:14px;padding:7px 10px;border-radius:999px;background:#261313;color:#ffd9d9;font-size:10px;font-weight:900}.live{position:absolute;top:14px;left:14px;padding:7px 10px;border-radius:999px;background:#e9f3db;color:#081007;font-size:10px;font-weight:900}.status{position:absolute;bottom:14px;left:14px;right:14px;display:flex;justify-content:space-between;gap:10px;align-items:center}.status span{font-size:10px;color:#d9e2dc;background:rgba(0,0,0,.62);padding:7px 10px;border-radius:999px}.controls{display:flex;justify-content:center;gap:10px;padding:16px;border-top:1px solid #1b241f}.circle{width:46px;height:46px;border-radius:50%;border:1px solid #334038;background:#121913;color:#fff;cursor:pointer}.circle.off{opacity:.5}.cameraStudio{border-top:1px solid #1b241f;padding:14px 16px;background:#0b110d}.studioHeader{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.studioHeader strong{font-size:11px}.studioHeader span{font-size:9px;color:#738078}.studioGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.studioControl{border:1px solid #263029;border-radius:13px;background:#0e1510;padding:10px}.studioControl label{display:flex;justify-content:space-between;font-size:9px;color:#aeb9b1;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px}.studioControl select,.studioControl input[type=range]{width:100%}.studioControl select{border:1px solid #263029;background:#0a100c;color:#e8eee9;border-radius:8px;padding:8px;font-size:10px}.studioValue{color:#d6e7b8;font-weight:800}.studioHint{font-size:8px;color:#657269;margin-top:6px;line-height:1.4}.unsupported{opacity:.45}.qualityPills{display:flex;gap:5px}.qualityPill{flex:1;border:1px solid #263029;background:#0a100c;color:#9aa69e;border-radius:8px;padding:7px 4px;font-size:9px;cursor:pointer}.qualityPill.active{border-color:#718c69;background:#132016;color:#d6e7b8}.qualityPill:disabled{cursor:not-allowed}.focusRow{display:flex;gap:5px}.focusRow button{flex:1;border:1px solid #263029;background:#0a100c;color:#9aa69e;border-radius:8px;padding:7px;font-size:9px}.focusRow button.active{border-color:#718c69;background:#132016;color:#d6e7b8}.audioPills{display:flex;gap:5px;flex-wrap:wrap}.audioPill{flex:1;min-width:82px;border:1px solid #263029;background:#0a100c;color:#9aa69e;border-radius:8px;padding:8px 6px;font-size:9px;cursor:pointer}.audioPill.active{border-color:#718c69;background:#132016;color:#d6e7b8}.audioVolume{width:100%;margin-top:7px}.audioNote{font-size:8px;color:#657269;margin-top:6px;line-height:1.4}.start{padding:12px 22px;border:0;border-radius:999px;background:#d6e7b8;color:#071008;font-weight:850;cursor:pointer}.end{padding:12px 22px;border:0;border-radius:999px;background:#251313;color:#ffd6d6;font-weight:850;cursor:pointer}
        .form{padding:20px}.form h2{font-size:17px;margin:0 0 15px}.field{margin-bottom:15px}.field label{display:block;font-size:10px;color:#748178;margin-bottom:7px;text-transform:uppercase;letter-spacing:.1em}.input,.select{width:100%;border:1px solid #263029;background:#0d140f;color:#f3f6f3;border-radius:11px;padding:12px;outline:none}.input:focus,.select:focus{border-color:#61785a}.help{font-size:10px;color:#66736b;line-height:1.6;margin-top:14px}.error{border:1px solid #533536;background:#1b0f10;color:#ffcaca;padding:10px 12px;border-radius:10px;font-size:10px;margin-bottom:12px}.ready{border:1px solid #334333;background:#101810;color:#b8d2ae;padding:10px 12px;border-radius:10px;font-size:10px;margin-bottom:12px}.checkedIn{border-color:#6b815e;background:#111c12;color:#d6e7b8}
        .formatGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px}.formatButton{border:1px solid #263029;background:#0d140f;color:#aeb8b1;border-radius:13px;padding:11px;text-align:left;cursor:pointer}.formatButton strong{display:block;color:#e8eee9;font-size:11px}.formatButton small{display:block;color:#69766e;font-size:9px;margin-top:4px}.formatButton.active{border-color:#718c69;background:#132016;box-shadow:inset 0 0 0 1px #718c69}.formatButton:disabled{cursor:not-allowed;opacity:.55}.recordingsLink{display:inline-flex;margin-top:12px;color:#cbd8ce;text-decoration:none;font-size:11px}.notice{margin-top:16px;border:1px solid #273129;border-radius:16px;padding:15px;color:#7d8981;font-size:10px;line-height:1.6}.notice strong{color:#c7d2ca;display:block;margin-bottom:4px}
        @media(max-width:780px){.layout{grid-template-columns:1fr}.heading h1{font-size:36px}.shell{padding:24px 12px 50px}}
        .goLive{position:fixed;inset:0;height:100dvh;min-height:0;overflow:hidden;z-index:30;background:#050806}
        .immersiveHeader{position:absolute;top:0;left:0;right:0;z-index:50;padding:calc(10px + env(safe-area-inset-top)) 16px 10px;display:flex;justify-content:space-between;align-items:center;color:white;background:linear-gradient(#000b,transparent)}
        .immersiveHeader a,.immersiveHeader button{border:1px solid #ffffff55;background:#07110ac9;border-radius:30px;padding:9px 13px;color:white;text-decoration:none;cursor:pointer}
        .shell{position:absolute;inset:0;max-width:none;margin:0;padding:0!important;overflow:hidden}
        .heading,.studioTools,.liveRoom{display:none!important}
        .layout{display:block;width:100%;height:100%}
        .layout>.panel:first-child{position:absolute;inset:0;border:0;border-radius:0;overflow:hidden}
        .preview,.preview.format-portrait,.preview.format-square,.preview.format-landscape{position:absolute;inset:0;width:100%!important;height:100%!important;max-height:none!important;aspect-ratio:auto!important}
        .preview video{width:100%;height:100%;object-fit:cover}
        .previewOverlayTools{z-index:24;top:43%;right:12px}
        .status{bottom:calc(105px + env(safe-area-inset-bottom))}
        .controls{position:absolute;bottom:env(safe-area-inset-bottom);left:0;right:0;z-index:27;border:0;background:linear-gradient(transparent,#000b);padding:15px 8px;flex-wrap:wrap}
        .controls label{display:none!important}
        .cameraStudio,.layout>.form,.layout>.panel:first-child>div[style]{display:none!important}
        .settingsOpen .layout>.form{display:block!important;position:absolute;top:calc(70px + env(safe-area-inset-top));bottom:calc(90px + env(safe-area-inset-bottom));left:12px;right:12px;z-index:40;overflow-y:auto;overscroll-behavior:contain;border-radius:18px;background:#08110df5}
        .settingsOpen .cameraStudio{display:block!important;position:absolute;bottom:calc(90px + env(safe-area-inset-bottom));left:12px;right:12px;z-index:42;max-height:35dvh;overflow-y:auto;border-radius:15px;background:#08110df7}
        @media(min-width:850px){.settingsOpen .layout>.form{left:auto;width:420px}}
        /* Phase 1: one real streaming page, two deliberate creator layouts. */
        .goLive{background:radial-gradient(ellipse at 48% -20%,#204635 0%,transparent 62%),linear-gradient(145deg,#05120c,#020806 70%);color:#f3f1e8}
        .immersiveHeader{background:linear-gradient(180deg,#020b08eb,#04160db0);border-bottom:1px solid #d4bd7850;backdrop-filter:blur(20px);min-height:68px}
        .immersiveHeader strong{font-size:15px;letter-spacing:.035em;color:#f2e1aa}
        .immersiveHeader a,.immersiveHeader button{min-height:44px;min-width:44px;display:inline-flex;align-items:center;justify-content:center;border-color:#c8b47965;background:#09251cdb}
        .immersiveHeader button:focus-visible,.immersiveHeader a:focus-visible,.goLive button:focus-visible{outline:2px solid #f4d58e;outline-offset:3px}
        .layout>.form{border:1px solid #cbb16a57;background:linear-gradient(155deg,#09241bdc,#04100df2);box-shadow:0 18px 60px #0007;backdrop-filter:blur(22px)}
        .layout>.form h2{color:#f4e2b0}
        .goLive .start{background:linear-gradient(120deg,#0b694a,#11ae75 55%,#075338);color:#fff;border:1px solid #e5ce8d;box-shadow:0 0 22px #15c48a65;font-weight:800}
        .previewOverlayTools button{background:#09251ccf;border:1px solid #d2bb8266;backdrop-filter:blur(12px);min-width:44px;min-height:44px}
        @media(min-width:851px){
          .goLive{overflow:hidden}
          .shell{top:82px;bottom:12px;left:clamp(18px,3vw,58px);right:clamp(18px,3vw,58px);height:auto}
          .layout{display:grid;grid-template-columns:minmax(0,1.36fr) minmax(320px,.9fr);gap:clamp(14px,1.5vw,28px);height:100%;align-items:stretch}
          .layout>.panel:first-child{position:relative;inset:auto;border:1px solid #d1b76a80;border-radius:25px;background:#071710b0;min-height:0;overflow:hidden}
          .preview,.preview.format-portrait,.preview.format-square,.preview.format-landscape{position:relative;inset:auto;width:100%!important;height:min(65%,calc(100% - 210px))!important;max-height:none!important;min-height:230px;aspect-ratio:auto!important;border-radius:22px;overflow:hidden}
          .preview video{object-fit:cover}
          .cameraStudio{display:block!important;position:relative;max-height:calc(35% - 10px);overflow-y:auto;overscroll-behavior:contain;margin:10px;border:1px solid #bd9e5966;border-radius:16px;background:#081a14e8}
          .layout>.form,.settingsOpen .layout>.form{display:block!important;position:relative;inset:auto;width:auto;min-width:0;height:100%;overflow-y:auto;overscroll-behavior:contain;border-radius:25px;padding:clamp(14px,1.7vw,26px)}
          .settingsOpen .cameraStudio{position:relative;inset:auto;max-height:calc(35% - 10px)}
          .controls{position:absolute;bottom:calc(35% + 12px);padding:10px;justify-content:center;background:linear-gradient(transparent,#03100bcf)}
          .studioHeaderLabel{display:inline}
          .immersiveHeader button{display:none}
        }
        @media(max-width:850px){
          .goLive{height:100dvh;overflow:hidden}
          .studioHeaderLabel{display:none}
          .shell{top:0;bottom:0}
          .previewOverlayTools{right:10px;top:48%}
          .controls{bottom:calc(6px + env(safe-area-inset-bottom));padding:10px 12px max(12px,env(safe-area-inset-bottom));gap:8px;background:linear-gradient(transparent,#020a08f5)}
          .settingsOpen .layout>.form{top:calc(76px + env(safe-area-inset-top));bottom:calc(88px + env(safe-area-inset-bottom));left:10px;right:10px;overflow-y:auto;padding:18px;border-radius:22px}
          .settingsOpen .cameraStudio{display:none!important}
          .preview{background:#06160f}
        }
        @media(max-width:850px) and (max-height:650px){
          .immersiveHeader{min-height:48px;padding-top:env(safe-area-inset-top);padding-bottom:2px}
          .controls{padding:5px 8px max(5px,env(safe-area-inset-bottom))}
          .settingsOpen .layout>.form{top:calc(56px + env(safe-area-inset-top));bottom:calc(72px + env(safe-area-inset-bottom))}
        }

        /* Creator Studio 2: mobile composition follows the approved emerald reference.
           Functional controls are reused; legacy floating rows are not duplicated. */
        .studioBrandMark{color:#c4d993;font-size:25px;vertical-align:middle}
        .preliveInspire,.preliveIdentity,.preliveMobileActions{display:none}
        @media(max-width:850px){
          .immersiveHeader{min-height:64px!important;align-items:center!important;padding:calc(8px + env(safe-area-inset-top)) 14px 8px!important;background:linear-gradient(#05130cd9,#05130c45)!important}
          .immersiveHeader strong{font-size:20px!important;letter-spacing:0!important}
          .immersiveHeader button{font-size:13px!important}
          .preliveInspire{display:flex;position:absolute;top:calc(84px + env(safe-area-inset-top));left:clamp(16px,5vw,28px);right:clamp(16px,5vw,28px);z-index:23;align-items:center;gap:9px;padding:12px 15px;border:1px solid #c5c49c50;border-radius:18px;background:#06180fb0;color:#f3efdd;font-size:clamp(11px,2.9vw,14px);backdrop-filter:blur(14px);pointer-events:none}
          .preliveInspire span{flex:1;min-width:0}
          .preliveIdentity{display:flex;position:absolute;left:12px;right:12px;bottom:calc(172px + env(safe-area-inset-bottom));z-index:25;align-items:center;justify-content:space-between;gap:8px;padding:9px 12px;border:1px solid #b9e5b17d;border-radius:22px;background:linear-gradient(110deg,#09291fdc,#071b14ba);backdrop-filter:blur(16px)}
          .preliveTitleButton{display:flex;align-items:center;gap:10px;min-width:0;flex:1;border:0;background:none;color:white;text-align:left;cursor:pointer}
          .preliveIdentityIcon{display:grid;place-items:center;flex-shrink:0;width:38px;height:38px;border-radius:50%;border:1px solid #8dd7a3;color:#a9f6bf;background:#0a4c37}
          .preliveTitleButton span:nth-child(2){min-width:0}
          .preliveTitleButton small{display:block;color:#6df1af;font-size:10px;font-weight:750}
          .preliveTitleButton strong{display:block;font-size:clamp(13px,4vw,18px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
          .preliveVisibility{border:1px solid #54e5a3;border-radius:999px;padding:10px 12px;flex-shrink:0;background:#04271edb;color:white;font-size:12px}
          .preliveMobileActions{display:flex;position:absolute;left:12px;right:12px;bottom:calc(10px + env(safe-area-inset-bottom));z-index:28;flex-direction:column;gap:9px}
          .preliveGoButton{min-height:60px;border:2px solid #8dfac6;border-radius:999px;background:linear-gradient(115deg,#08724e,#02a66b 62%,#056644);box-shadow:0 0 19px #19d88d8c,inset 0 2px 12px #ffffff22;color:white;font-size:clamp(21px,5vw,27px);font-weight:850;cursor:pointer}
          .preliveGoButton:disabled{opacity:.7}
          .preliveQuickOptions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
          .preliveQuickOptions button{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:4px;min-height:59px;min-width:0;padding:7px 3px;border:1px solid #72c9a071;border-radius:15px;background:#061a13df;color:#fff;cursor:pointer}
          .preliveQuickOptions button span{font-size:20px}
          .preliveQuickOptions button strong{font-size:clamp(9px,2.6vw,12px);white-space:nowrap}
          .preliveQuickOptions button small{width:100%;font-size:10px;color:#9adcb7}
          .previewOverlayTools{top:43%!important;right:9px!important;gap:8px!important}
          .previewOverlayTools button{width:44px!important;height:44px!important;background:#062c21d9!important;border-color:#6bd6a0a1!important}
          .layout>.panel:first-child>.controls{display:none!important}
          .layout>.panel:first-child>.status{display:none!important}
          .layout>.panel:first-child>.preview .preliveIdentity~.status{display:none!important}
          .layout>.panel:first-child>.preview [class*="liveVisualEffects"]{max-width:50px}
          .settingsOpen .layout>.form{z-index:45!important}
          .settingsOpen .preliveMobileActions,.settingsOpen .preliveIdentity{visibility:hidden}
        }
        @media(max-width:850px) and (max-height:680px){
          .preliveInspire{display:none}
          .preliveIdentity{bottom:calc(145px + env(safe-area-inset-bottom))}
          .preliveGoButton{min-height:52px}
          .preliveQuickOptions button{min-height:48px}
          .preliveMobileActions{gap:5px}
        }
        @media(min-width:851px){.preliveInspire,.preliveIdentity,.preliveMobileActions{display:none!important}}

        @media(prefers-reduced-motion:reduce){.goLive *{scroll-behavior:auto!important;transition-duration:.01ms!important;animation-duration:.01ms!important}}


        /* Single authoritative layout for the three camera modes. Never translate media by 50%. */
        .goLive .layout>.panel:first-child>.preview{
          position:relative!important;display:block!important;overflow:hidden!important;
          width:100%!important;max-width:none!important;max-height:none!important;
          height:calc(100dvh - 74px - env(safe-area-inset-top,0px))!important;
          min-height:0!important;aspect-ratio:auto!important;container-type:inline-size;
        }
        .goLive .layout>.panel:first-child>.preview>video,
        .goLive .layout>.panel:first-child>.preview>.placeholder{
          position:absolute!important;inset:auto!important;top:12px!important;left:0!important;right:auto!important;
          width:100%!important;height:min(56.25cqw,calc(100% - 170px))!important;
          max-width:none!important;max-height:none!important;aspect-ratio:auto!important;object-fit:cover!important;
          margin:0!important;border-radius:12px!important;
          transform:none!important;transform-origin:center center!important;
          transition:top 2s cubic-bezier(.22,1,.36,1),left 2s cubic-bezier(.22,1,.36,1),
            width 2s cubic-bezier(.22,1,.36,1),height 2s cubic-bezier(.22,1,.36,1),
            border-radius 2s ease,opacity .65s ease!important;
        }
        .goLive .layout>.panel:first-child>.preview[data-studio-mode="phone"]>video,
        .goLive .layout>.panel:first-child>.preview[data-studio-mode="phone"]>.placeholder{
          top:0!important;left:0!important;right:0!important;bottom:0!important;
          width:100%!important;height:100%!important;aspect-ratio:auto!important;
          border-radius:0!important;object-fit:cover!important;animation:none!important;
        }
        .goLive .layout>.panel:first-child>.preview[data-studio-mode="desktop"]>video,
        .goLive .layout>.panel:first-child>.preview[data-studio-mode="desktop"]>.placeholder{
          top:12px!important;left:0!important;width:100%!important;
          height:min(56.25cqw,calc(100% - 170px))!important;aspect-ratio:auto!important;
          animation:studioDesktopHover 5s ease-in-out infinite!important;
        }
        @keyframes studioDesktopHover{0%,100%{translate:0 0}50%{translate:0 5px}}
        .goLive .layout>.panel:first-child>.preview[data-studio-mode="voice"]>video,
        .goLive .layout>.panel:first-child>.preview[data-studio-mode="voice"]>.placeholder{
          top:14px!important;left:calc(50% - min(76vw,340px,40dvh)/2)!important;
          width:min(76vw,340px,40dvh)!important;height:min(76vw,340px,40dvh)!important;
          border-radius:24px!important;opacity:0!important;pointer-events:none!important;animation:none!important;
        }
        .goLive .layout>.panel:first-child>.preview .voiceAvatarStage{
          position:absolute!important;inset:auto!important;top:14px!important;left:50%!important;right:auto!important;
          width:min(76vw,340px,40dvh)!important;height:auto!important;aspect-ratio:1/1!important;
          border-radius:24px!important;border:1px solid #b5ffe555!important;
          transform:translateX(-50%) scale(.92)!important;
          transition:opacity .65s ease,visibility .65s ease,transform 2s cubic-bezier(.22,1,.36,1)!important;
        }
        .goLive .layout>.panel:first-child>.preview .voiceAvatarStageActive{
          transform:translateX(-50%) scale(1)!important;
        }
        /* Avoid overlay-induced black frames and mirror flips on iPhone. */
        .goLive .preview.studioMorphing::before{display:none!important}
        .goLive .layout>.panel:first-child>.preview.studioMorphing>video{animation:none!important;filter:none!important}
        @media(prefers-reduced-motion:reduce){
          .goLive .layout>.panel:first-child>.preview>video,
          .goLive .layout>.panel:first-child>.preview>.placeholder,
          .goLive .layout>.panel:first-child>.preview .voiceAvatarStage{
            transition:none!important;animation:none!important;
          }
        }

      `}</style>

      <header className="immersiveHeader"><Link href="/streaming" aria-label="Exit Pre-Live Studio">✕</Link><strong><span className="studioBrandMark" aria-hidden="true">✧</span> 1Muslim <span className="studioHeaderLabel">· Creator Studio</span></strong>{!live&&<button type="button" aria-expanded={settingsOpen} aria-controls="prelive-settings" onClick={()=>setSettingsOpen(v=>!v)}><StudioGlyph kind="settings"/><span>{settingsOpen?"Close":"Settings"}</span></button>}</header>
      <div className={settingsOpen?"shell settingsOpen":"shell"}>
        <div className="studioTools">
              {scheduledSlot && <div className="upcomingPrep"><div><span className="eyebrow">UPCOMING LIVE</span><strong>{scheduledSlot.title}</strong><span>{scheduledSlot.category} · {new Date(scheduledSlot.starts_at).toLocaleString([], {dateStyle:"medium",timeStyle:"short"})}</span></div><button type="button" className="prepButton" onClick={()=>{setTitle(scheduledSlot.title);setCategory(scheduledSlot.category);setShowScheduler(false);setSaveMessage("Prep mode loaded. Check your title, topic, format, thumbnail, camera and microphone before going live.");}}>{hostCheckedIn ? "✓ Host Checked In" : "Prep for upcoming Live →"}</button></div>}
              {!live && <button type="button" className="scheduleButton" onClick={()=>setShowScheduler(!showScheduler)}>{showScheduler ? "Close scheduler" : "Schedule a Live"}</button>}
              {showScheduler && <div className="scheduleBox"><h3>Schedule a Live</h3><div className="scheduleFields"><input className="input" type="date" value={scheduleDate} onChange={e=>setScheduleDate(e.target.value)} /><input className="input" type="time" value={scheduleStart} onChange={e=>setScheduleStart(e.target.value)} /><input className="input" type="time" value={scheduleEnd} onChange={e=>setScheduleEnd(e.target.value)} /></div><button type="button" className="start" onClick={scheduleLive}>Save scheduled Live</button>{scheduleMessage&&<p className="help">{scheduleMessage}</p>}</div>}
            </div>
        <div className="heading">
          <span className="eyebrow">CREATOR STUDIO</span>
          <h1>Go Live</h1>
          <p>Share a lesson, reminder, conversation or community moment with 1Muslim.</p><Link href="/streaming/recordings" className="recordingsLink">View your Live Recordings →</Link>
        </div>

        <div className="layout">
          <section className="panel">
            <div onTouchEnd={()=>{const now=Date.now();if(now-lastPreviewTapRef.current<320&&cameraReady)void flipCamera();lastPreviewTapRef.current=now}} onDoubleClick={()=>{if(cameraReady)void flipCamera()}} data-studio-mode={studioMode} className={`preview studioTransform ${studioMorphing?"studioMorphing":""} format-${aspectRatio === "9:16" ? "portrait" : aspectRatio === "1:1" ? "square" : "landscape"} ${studioMode==="voice"?"studioVoiceMode":""}`}>
              {cameraReady ? <video ref={videoRef} className={facingMode === "user" ? "frontCamera" : "backCamera"} muted playsInline autoPlay /> : <div className="placeholder"><div className="cameraIcon">◉</div><div>Camera preview is off</div></div>}
              <div className={`voiceAvatarStage ${studioMode==="voice"?"voiceAvatarStageActive":""}`} aria-hidden={studioMode!=="voice"}>
                <div className="voiceBackdropOrbs"><i/><i/><i/></div>
                <div className="voiceAvatarMotion" style={{["--voice-energy" as string]:voiceEnergy} as React.CSSProperties}>
                  <div className="voiceAvatarAura"/>
                  <div className="voiceAvatarPortrait">{voiceAvatar?<img src={voiceAvatar} alt="" referrerPolicy="no-referrer"/>:<span aria-hidden="true">✧</span>}</div>
                </div>
                <div className="voiceAvatarLabel"><strong>{voiceName}</strong><span>{micOn?"● Microphone active":"○ Microphone muted"}</span></div>
              </div>
              <div className={`studioLaunchFlash ${launchVisual?"studioLaunchFlashOn":""}`} aria-hidden="true" />
              <LiveVisualEffects effect={visualEffect} onChange={setVisualEffect} />
              {live&&liveStreamIdRef.current&&<LiveLightOverlay streamId={liveStreamIdRef.current} host />}

              {!live && <div className="preliveIdentity"><button type="button" className="preliveTitleButton" onClick={()=>setSettingsOpen(true)} aria-label="Edit live title"><span className="preliveIdentityIcon" aria-hidden="true">✧</span><span><small>LIVE TITLE · TAP TO EDIT</small><strong>{title || defaultLiveTitle}</strong></span></button><button type="button" className="preliveVisibility" onClick={()=>setSettingsOpen(true)} aria-label="Change live audience">◎ {visibility==="public"?"Public":"Ashab"} ⌄</button></div>}
              {viewerRosterOpen && <div className="liveRosterBackdrop" onPointerDown={e=>{if(e.target===e.currentTarget)setViewerRosterOpen(false)}}><section className="liveRosterSheet" role="dialog" aria-modal="true" aria-label="Live viewers"><header><div><strong>👁 Watching now</strong><small>{viewers.toLocaleString()} live viewers</small></div><button type="button" onClick={()=>setViewerRosterOpen(false)} aria-label="Close viewers">✕</button></header><div className="liveRosterList">{viewerRosterLoading&&viewerRoster.length===0?<p>Loading viewers…</p>:viewerRoster.length===0?<p>No viewers yet.</p>:viewerRoster.map(viewer=><div className="liveRosterPerson" key={viewer.id}><span className="liveRosterAvatar">{viewer.avatar?<img src={viewer.avatar} alt="" referrerPolicy="no-referrer"/>:<span>◉</span>}</span><span className="liveRosterName">{viewer.username}</span><span className="liveRosterXp">{viewer.xp===null?"XP unavailable":`${viewer.xp.toLocaleString()} XP`}</span></div>)}</div><button type="button" className="liveRosterRefresh" onClick={()=>void loadViewerRoster()}>↻ Refresh</button></section></div>}
              {cameraReady && <div className="previewOverlayTools" aria-label="Camera and microphone controls"><button type="button" className={cameraOn?"studioToggleOn":"studioToggleOff"} onClick={toggleCamera} aria-label={cameraOn?"Turn camera off":"Turn camera on"}><StudioGlyph kind="camera"/></button><button type="button" className={micOn?"studioToggleOn":"studioToggleOff"} onClick={toggleMic} aria-label={micOn?"Mute microphone":"Unmute microphone"}><StudioGlyph kind="mic"/></button><button type="button" onClick={()=>setSettingsOpen(true)} aria-label="Guest settings"><StudioGlyph kind="guests"/></button>{live&&<button type="button" className="liveInlineSettings" onClick={()=>setSettingsOpen(v=>!v)} aria-expanded={settingsOpen} aria-controls="prelive-settings" aria-label="Live settings" title="Live settings"><StudioGlyph kind="settings"/></button>}</div>}
              {showHostIntro && live && broadcastStartedAt && <SyncedLiveIntro startedAt={broadcastStartedAt} host onFinish={()=>setShowHostIntro(false)} />}
              {live && <span className="live" aria-label="You are live">● YOU’RE LIVE · {liveClock} · {roomRef.current?.state==="connected"?"Connected":"Reconnecting"} · {micOn?"🎙 Mic on":"🔇 Muted"}</span>}{live && <button type="button" onClick={()=>setViewerRosterOpen(true)} aria-label="Show live viewers" title="View audience" style={{position:"absolute",left:12,bottom:64,zIndex:13,padding:"12px 16px",borderRadius:18,background:"rgba(5,10,20,.80)",border:viewerIncrease?"2px solid #39ee8d":"1px solid rgba(255,255,255,.35)",boxShadow:viewerIncrease?"0 0 24px rgba(57,238,141,.48)":"0 8px 25px #0008",color:viewerIncrease?"#4cff9c":"white",transition:"color .3s,border .3s,box-shadow .3s",cursor:"pointer",textAlign:"center"}}><div style={{fontSize:11,fontWeight:800,letterSpacing:1.5}}>👁 LIVE VIEWERS · TAP TO SEE</div><div style={{fontSize:"clamp(26px,5vw,40px)",fontWeight:900,lineHeight:1.15,fontVariantNumeric:"tabular-nums"}}>{viewers.toLocaleString()}</div><div style={{fontSize:11,opacity:.85}}>WATCHING NOW {viewerIncrease?"↑":""}</div></button>}{live && liveStreamIdRef.current && <div style={{position:"absolute",top:12,right:12,zIndex:12}}><ShareLiveButton streamId={liveStreamIdRef.current} title={title} compact /></div>}{recording && <span className="recording">● RECORDING</span>}
              {cameraReady && false && <div className="status"><span>{cameraOn ? "Camera on" : "Camera off"}</span><span>{facingMode === "user" ? "Front camera" : "Back camera"}</span><span>{micOn ? "Mic on" : "Mic off"}</span>{hostCheckedIn && !live ? <span>✓ Host checked in</span> : null}</div>}
            <div className={`newStudioActions ${launchVisual||live?"studioLaunchActive":""} ${live?"studioLaunchComplete":""}`} aria-label="Broadcast controls">
              <div className="newStudioModes" role="group" aria-label="Live format">
                <button type="button" aria-pressed={studioMode==="desktop"} className={studioMode==="desktop"?"selected":""} onClick={()=>selectStudioMode("desktop")}><StudioGlyph kind="desktop"/>Desktop</button>
                <button type="button" aria-pressed={studioMode==="phone"} className={studioMode==="phone"?"selected":""} onClick={()=>selectStudioMode("phone")}><StudioGlyph kind="phone"/>Phone</button>
                <button type="button" aria-pressed={studioMode==="voice"} className={studioMode==="voice"?"selected":""} onClick={()=>selectStudioMode("voice")}><StudioGlyph kind="voice"/>Voice</button>
              </div>
              {!live && <button type="button" data-go-live-start className={`newStudioGo ${launchPressed?"launchPressed":""}`} disabled={saving||connectingLive||launchCountdown!==null} onPointerDown={()=>setLaunchPressed(true)} onPointerUp={()=>{if(launchCountdown===null)setLaunchPressed(false)}} onPointerCancel={()=>{if(launchCountdown===null)setLaunchPressed(false)}} onClick={launchBroadcast}>{launchCountdown!==null?`Going live in ${launchCountdown}…`:connectingLive?"Connecting…":cameraReady?"● Go Live":"Enable Camera"}</button>}
              <div className="newStudioHint">Double-tap camera to flip · Effects on the preview</div>
            </div>
            </div>
            <div style={{display:"flex",gap:9,alignItems:"center",flexWrap:"wrap",padding:"10px 0"}}>
              <label style={{fontSize:12,color:"#d6e7b8",cursor:"pointer"}}>🟢 Green Screen · Choose Photo
                <input type="file" accept="image/*" onChange={e=>void selectGreenPhoto(e.target.files?.[0])} style={{display:"block",fontSize:11,marginTop:5,maxWidth:240}} />
              </label>
              {greenImageName&&<><span style={{fontSize:11}}>{greenImageName}</span>
                <button type="button" onClick={()=>{setGreenEnabled(false);greenSettingsRef.current.enabled=false;}} style={{padding:8,borderRadius:10}}>Remove effect</button>
                <label style={{fontSize:11}}>Green sensitivity <input type="range" min="0" max="100" value={greenStrength} onChange={e=>setGreenStrength(Number(e.target.value))}/></label>
              </>}
              <small style={{color:"#a5b7a8"}}>Use a real green backdrop for best results. Choose your photo before starting camera preview.</small>
            </div>
            <div className="controls legacyStudioControls">
              {cameraReady && <><button className={cameraOn ? "circle" : "circle off"} onClick={toggleCamera} aria-label="Toggle camera">{cameraOn ? "◉" : "○"}</button><button className={micOn ? "circle" : "circle off"} onClick={toggleMic} aria-label="Toggle microphone">{micOn ? "♫" : "×"}</button></>}
              <label style={{display:"flex",alignItems:"center",gap:7,fontSize:12,color:"#d6e7b8",padding:"8px 10px",border:"1px solid #ffffff30",borderRadius:12,background:"#ffffff0c",cursor:"pointer"}}><input type="checkbox" checked={autoCameraPreview} onChange={e=>{const enabled=e.target.checked;setAutoCameraPreview(enabled);localStorage.setItem("1muslim-go-live-auto-camera",enabled?"on":"off");}} aria-label="Automatically enable camera preview when opening Go Live" /> Auto-start camera preview</label>
              {!cameraReady ? <button className="start" onClick={startPreview}>Enable camera & mic</button> : live ? <button className="end" onClick={endLive} disabled={saving}>{saving ? "Saving recording…" : "End live & save"}</button> : <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"}}>{scheduledSlot && !hostCheckedIn ? <button className="start" onClick={()=>void checkInHost()}>✓ Check In for Scheduled Live</button> : null}<button data-go-live-start className="start" onClick={()=>void startLive(false)} disabled={saving||connectingLive}>{connectingLive?"Connecting to LiveKit…":"● GO LIVE"}</button></div>}
            </div>
            {cameraReady && <div className="cameraStudio">
              <div className="studioHeader"><strong>Camera Studio</strong><span>{videoQuality} · {zoom.toFixed(1)}×</span></div>
              <div className="studioGrid">
                <div className="studioControl">
                  <label>Quality <span className="studioValue">{videoQuality}</span></label>
                  <div className="qualityPills">{(["480p","720p","1080p"] as const).map(q=><button key={q} type="button" className={videoQuality===q?"qualityPill active":"qualityPill"} onClick={()=>void setQuality(q)}>{q}</button>)}</div>
                  <div className="studioHint">Applies a target capture resolution. The device may choose the closest supported mode.</div>
                </div>
                <div className={cameraCapabilities?.zoom ? "studioControl" : "studioControl unsupported"}>
                  <label>Zoom <span className="studioValue">{zoom.toFixed(1)}×</span></label>
                  <input type="range" min={cameraCapabilities?.zoom?.min ?? 1} max={cameraCapabilities?.zoom?.max ?? 1} step={cameraCapabilities?.zoom?.step ?? 0.1} value={zoom} disabled={!cameraCapabilities?.zoom} onChange={e=>void setCameraZoom(Number(e.target.value))}/>
                  <div className="studioHint">{cameraCapabilities?.zoom ? "Use the camera's native optical/digital zoom control." : "Zoom isn't exposed by this camera/browser."}</div>
                </div>
                <div className={cameraCapabilities?.focus ? "studioControl" : "studioControl unsupported"}>
                  <label>Focus <span className="studioValue">{focusMode === "auto" ? "Auto" : "Manual"}</span></label>
                  <div className="focusRow"><button type="button" className={focusMode==="auto"?"active":""} disabled={!cameraCapabilities?.focus} onClick={()=>void setCameraFocus("auto")}>AUTO</button><button type="button" className={focusMode==="manual"?"active":""} disabled={!cameraCapabilities?.focus} onClick={()=>void setCameraFocus("manual")}>MANUAL</button></div>
                  {focusMode === "manual" && <input type="range" min={cameraCapabilities?.focusDistance?.min ?? 0} max={cameraCapabilities?.focusDistance?.max ?? 1} step={cameraCapabilities?.focusDistance?.step ?? 0.01} value={focusDistance} disabled={!cameraCapabilities?.focusDistance} onChange={e=>{const v=Number(e.target.value);setFocusDistance(v);void setCameraFocus("manual",v)}}/>}
                  <div className="studioHint">{cameraCapabilities?.focus ? "Focus controls appear when the device exposes them." : "Manual focus isn't exposed by this camera/browser."}</div>
                </div>
              </div>
              <div className="studioControl" style={{gridColumn:"1 / -1"}}>
                <label>Audio Studio <span className="studioValue">{audioEffect === "studio" ? "Studio — Clear" : "Echo — Mosque"}{nasheedOn ? " · Nasheed Loop ON" : ""}</span></label>
                <div className="audioPills">
                  <button type="button" className={audioEffect==="studio" ? "audioPill active" : "audioPill"} onClick={()=>void setAudioStudioEffect("studio")}>Studio — Clear</button>
                  <button type="button" className={audioEffect==="mosque" ? "audioPill active" : "audioPill"} onClick={()=>void setAudioStudioEffect("mosque")}>Echo — Mosque</button>
                </div>
                <div className="studioHint" style={{marginTop:9}}>SOUND</div>
                <div className="audioPills">
                  <button type="button" className={nasheedOn ? "audioPill active" : "audioPill"} onClick={()=>void toggleNasheed()}>{nasheedOn ? "Nasheed Loop · ON" : "Nasheed Loop · OFF"}</button>
                </div>
                {nasheedOn && <input className="audioVolume" type="range" min="0" max="0.5" step="0.01" value={soundVolume} onChange={e=>void setAudioStudioVolume(Number(e.target.value))}/>} 
                <div className="audioNote">Toggle the saved Nasheed Loop on or off at any time, including while Live. It loops continuously until you turn it off or end the broadcast.</div>
              </div>
            </div>}
          </section>

          {settingsOpen && <button type="button" className="liveSettingsScrim" aria-label="Close live settings" onClick={()=>setSettingsOpen(false)} />}
          <aside id="prelive-settings" className="panel form compactLiveSettings" aria-label="Live stream settings">
            <div className="compactLiveSettingsHeader"><h2>Live details</h2><button type="button" className="compactLiveSettingsClose" aria-label="Close live settings" onClick={()=>setSettingsOpen(false)}>✕</button></div>
            {error && <div className="error">{error}</div>}
            {scheduledSlot && !live && <div className={hostCheckedIn ? "ready checkedIn" : "ready"}>{hostCheckedIn ? "✓ HOST CHECKED IN — Viewers can see that you are ready. The broadcast stays locked until the scheduled time." : "Scheduled Live: camera and microphone can be prepared now. Check in when you are fully ready."}</div>}{connectingLive&&!live&&<div className="ready" role="status">Connecting to LiveKit… broadcast will begin only after camera and microphone are published.</div>}{live && <div className="ready" role="status">🔴 YOU’RE LIVE · {liveClock} · {roomRef.current?.state==="connected"?"Connected":"Reconnecting"} · {micOn?"Mic on":"Mic muted"} · Recording</div>}{saveMessage && <div className="ready">{saveMessage}</div>}
            <div className="field compactTitleField"><label htmlFor="title">Title &amp; cover</label><div className="compactTitleRow"><input id="title" className="input" value={title} onChange={(e)=>setTitle(e.target.value)} placeholder={defaultLiveTitle} disabled={live}/><label className={`compactCoverPicker ${thumbnailPreviewUrl?"hasCover":""}`} htmlFor="thumbnail" title={thumbnailPreviewUrl?"Change cover image":"Add cover image"}>{thumbnailPreviewUrl?<img src={thumbnailPreviewUrl} alt="Selected Live cover preview" />:<span aria-hidden="true">＋</span>}<span className="compactCoverCaption">{thumbnailPreviewUrl?"Edit":"Cover"}</span></label><input id="thumbnail" className="compactCoverInput" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e)=>setThumbnailFile(e.target.files?.[0]??null)} disabled={live}/></div></div>
            <div className="field"><label htmlFor="category">Topic</label><select id="category" className="select" value={category} onChange={(e)=>setCategory(e.target.value)} disabled={live}>{categories.map((item)=><option key={item}>{item}</option>)}</select></div>
          </aside>
        </div>

        {live && <section className="liveRoom">
          <div className="liveRoomTop">
            <div><span className="livePill">● LIVE</span><strong>{title}</strong><span>{category}</span></div>
            <div className="liveStats"><span>👥 {viewers} watching</span><button onClick={()=>setFollowed(!followed)}>{followed?"✓ Following":"＋ Follow"}</button><button onClick={()=>setNotifications(!notifications)}>{notifications?"🔔":"🔕"}</button></div>
          </div>
          <div className="liveRoomGrid">
            <div className="reactionPanel"><span className="eyebrow">REACTIONS</span><div className="reactionRow">{["❤️","🤍","👍","✨","🤲"].map(x=><button key={x} className={reaction===x?"reaction selected":"reaction"} onClick={()=>setReaction(x)}>{x}</button>)}</div><p>{reaction ? "Reaction sent to the host." : "Tap a reaction to join the room."}</p></div>
            <div className="chatPanel"><LiveChat streamId={liveStreamIdRef.current ?? ""} hostId={currentUserId ?? ""} /></div>
          </div>
          <div className="freeNote">Free-first mode: this room provides the camera preview and social interaction layer without a paid video provider. A true cross-device broadcast still needs a WebRTC media backend.</div>
        </section>}
      </div>
    </main>
  );
}
