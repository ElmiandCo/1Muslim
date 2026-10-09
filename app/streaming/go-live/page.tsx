"use client";

import SiteNav from "../../components/SiteNav";

import Link from "next/link";
import { createClient } from "../../../utils/supabase/client";
import { useEffect, useRef, useState } from "react";
import { LocalAudioTrack, Room, Track } from "livekit-client";
import { createLiveAudioProcessor } from "../../../components/live-audio-effects";
import LiveChat from "../../../components/LiveChat";
import SyncedLiveIntro from "../../components/SyncedLiveIntro";
import ShareLiveButton from "../../components/ShareLiveButton";

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
  const [live, setLive] = useState(false);
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
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
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
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
  const [error, setError] = useState("");
  const [viewers, setViewers] = useState(0);

  useEffect(() => {
    if (!live || !liveStreamIdRef.current) return;
    const heartbeat = async () => {
      const id = liveStreamIdRef.current;
      if (!id) return;
      try {
        await createClient().from("live_streams").update({ last_heartbeat_at: new Date().toISOString() }).eq("id", id).eq("status", "live");
      } catch {}
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
    if (!title.trim()) {setScheduleMessage("Add a Live title first.");document.getElementById("title")?.scrollIntoView({behavior:"smooth",block:"center"});window.setTimeout(()=>document.getElementById("title")?.focus({preventScroll:true}),350);return;}
    if (!scheduleDate || !scheduleStart || !scheduleEnd) return setScheduleMessage("Choose a date, start time, and end time.");
    const starts = new Date(`${scheduleDate}T${scheduleStart}`);
    const ends = new Date(`${scheduleDate}T${scheduleEnd}`);
    if (Number.isNaN(starts.getTime()) || Number.isNaN(ends.getTime()) || ends <= starts) return setScheduleMessage("End time must be after start time.");
    if (starts <= new Date()) return setScheduleMessage("Choose a future start time.");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setScheduleMessage("Sign in is required to schedule a Live.");
    const { data, error } = await supabase.from("live_schedule_slots").insert({host_id:user.id,title:title.trim(),category,starts_at:starts.toISOString(),ends_at:ends.toISOString(),status:"scheduled"}).select("id,title,category,starts_at,ends_at,status").single();
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
        video: { facingMode, width: { ideal: size.width }, height: { ideal: size.height } },
        audio: true,
      });
      rawCameraRef.current=stream.getVideoTracks()[0];
      if(greenEnabled&&backgroundRef.current){
        const output=await startGreen(rawCameraRef.current);
        stream.removeTrack(rawCameraRef.current);
        stream.addTrack(output);
      }
      streamRef.current = stream;
      setCameraReady(true);
      setCameraOn(true);
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

  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!cameraReady || !video || !stream) return;

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
    const mimeType = ["video/mp4","video/mp4;codecs=avc1.42E01E,mp4a.40.2","video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm"].find((type) => MediaRecorder.isTypeSupported(type));
    if (!mimeType) throw new Error("This browser cannot record video in a supported format.");
    chunksRef.current = [];
    const recordingAudio = processedAudioTrackRef.current ?? stream.getAudioTracks()[0];
    const recordingStream = new MediaStream([stream.getVideoTracks()[0], ...(recordingAudio ? [recordingAudio] : [])]);
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
    if (!title.trim()) {setError("Give your live stream a title first.");document.getElementById("title")?.scrollIntoView({behavior:"smooth",block:"center"});window.setTimeout(()=>document.getElementById("title")?.focus({preventScroll:true}),350);return;}
    if (fromSchedule && scheduledSlot) {
      if (!hostCheckedIn) return setError("Check in as ready before the scheduled Live can start.");
      if (Date.now() < new Date(scheduledSlot.starts_at).getTime()) return setError("This scheduled Live is still locked. It will start automatically at the scheduled time.");
      if (scheduledSlot.ends_at && Date.now() > new Date(scheduledSlot.ends_at).getTime()) return setError("This scheduled Live has ended. Schedule another Live to continue.");
    }
    setError(""); setSaveMessage("");
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
        title: title.trim(),
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
      await room.connect(tokenData.url, tokenData.token);
      const mediaStream = streamRef.current;
      if (!mediaStream) throw new Error("Camera and microphone must be enabled first.");
      const videoTrack = mediaStream.getVideoTracks()[0];
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (videoTrack) await room.localParticipant.publishTrack(videoTrack, { source: Track.Source.Camera, simulcast: true });
      if (audioTrack) {
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

      startRecording();
      setLive(true);
      setShowHostIntro(true);
      // Notify administrators only after the broadcast is actually connected.
      void fetch("/api/live-alert", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ streamId: liveStreamId }) }).catch((error) => console.warn("Live alert request failed", error));
      setViewers(0);
    } catch (err) {
      roomRef.current?.disconnect();
      roomRef.current = null;
      setError(err instanceof Error ? err.message : "Live broadcast could not start.");
    }
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

  const endLive = () => {
    setLive(false); setViewers(0); setShowHostIntro(false);
    const supabase = createClient();
    const liveStreamId = liveStreamIdRef.current;
    roomRef.current?.disconnect();
    roomRef.current = null;
    if (liveStreamId) {
      void supabase.from("live_streams").update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", liveStreamId);
    }
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = async () => {
        const saved = await saveRecording();
        if (saved && liveStreamId) window.location.assign("/streaming/recordings?recap="+encodeURIComponent(liveStreamId));
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
      if (liveStreamId) window.location.assign("/streaming/recordings?recap="+encodeURIComponent(liveStreamId));
    }
  };

  return (
    <main className="goLive">
      <style jsx>{`
        .goLive{min-height:100vh;background:var(--bg);color:var(--text)}.studioTools{display:grid;gap:10px;margin:0 0 18px}.upcomingPrep{display:flex;justify-content:space-between;align-items:center;gap:14px;border:1px solid #6b815e;background:linear-gradient(145deg,#121c12,#0b110c);border-radius:18px;padding:14px}.upcomingPrep strong,.upcomingPrep span{display:block}.upcomingPrep strong{font-size:13px;margin:4px 0}.upcomingPrep>div>span:last-child{font-size:10px;color:#7f8d84}.prepButton,.scheduleButton{border:1px solid #41503d;background:#d6e7b8;color:#071008;border-radius:999px;padding:10px 13px;font-size:10px;font-weight:850;cursor:pointer}.scheduleButton{justify-self:start;background:#101811;color:#d6e7b8}.scheduleBox{border:1px solid #263029;border-radius:17px;padding:15px;background:#0a100c}.scheduleBox h3{font-size:14px;margin:0 0 10px}.scheduleFields{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:8px;margin-bottom:10px}@media(max-width:620px){.upcomingPrep{align-items:flex-start;flex-direction:column}.prepButton{width:100%}.scheduleFields{grid-template-columns:1fr}}
        .bar{height:62px;border-bottom:1px solid #1b241f;display:flex;align-items:center;justify-content:space-between;padding:0 max(18px,calc((100vw - 1120px)/2));background:rgba(5,8,6,.9);backdrop-filter:blur(16px);position:sticky;top:0;z-index:5}
        .brand{display:flex;gap:9px;align-items:center;font-weight:850}.mark{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:#101811;border:1px solid #354237;color:#d6e7b8}.back{color:#98a49d;text-decoration:none;font-size:12px}
        .shell{max-width:1120px;margin:auto;padding:30px 18px 70px}.heading{margin-bottom:20px}.eyebrow{font-size:10px;letter-spacing:.16em;color:#829b87;font-weight:850}.heading h1{font-size:42px;letter-spacing:-.06em;margin:8px 0}.heading p{color:#849087;font-size:13px;margin:0}
        .layout{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(280px,.65fr);gap:16px}.panel{border:1px solid #1b241f;border-radius:22px;background:#0a100c;overflow:hidden}.preview{aspect-ratio:9/16;background:radial-gradient(circle at 50% 40%,#18231b,#050806 65%);position:relative;display:grid;place-items:center}.preview video{width:100%;height:100%;object-fit:cover;display:block}.preview video.frontCamera{transform:scaleX(-1)}.preview video.backCamera{transform:none}.preview.format-square{aspect-ratio:1/1}.preview.format-landscape{aspect-ratio:16/9}.placeholder{text-align:center;color:#6f7d74}.cameraIcon{font-size:44px;margin-bottom:8px}.recording{position:absolute;top:14px;right:14px;padding:7px 10px;border-radius:999px;background:#261313;color:#ffd9d9;font-size:10px;font-weight:900}.live{position:absolute;top:14px;left:14px;padding:7px 10px;border-radius:999px;background:#e9f3db;color:#081007;font-size:10px;font-weight:900}.status{position:absolute;bottom:14px;left:14px;right:14px;display:flex;justify-content:space-between;gap:10px;align-items:center}.status span{font-size:10px;color:#d9e2dc;background:rgba(0,0,0,.62);padding:7px 10px;border-radius:999px}.controls{display:flex;justify-content:center;gap:10px;padding:16px;border-top:1px solid #1b241f}.circle{width:46px;height:46px;border-radius:50%;border:1px solid #334038;background:#121913;color:#fff;cursor:pointer}.circle.off{opacity:.5}.cameraStudio{border-top:1px solid #1b241f;padding:14px 16px;background:#0b110d}.studioHeader{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.studioHeader strong{font-size:11px}.studioHeader span{font-size:9px;color:#738078}.studioGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.studioControl{border:1px solid #263029;border-radius:13px;background:#0e1510;padding:10px}.studioControl label{display:flex;justify-content:space-between;font-size:9px;color:#aeb9b1;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px}.studioControl select,.studioControl input[type=range]{width:100%}.studioControl select{border:1px solid #263029;background:#0a100c;color:#e8eee9;border-radius:8px;padding:8px;font-size:10px}.studioValue{color:#d6e7b8;font-weight:800}.studioHint{font-size:8px;color:#657269;margin-top:6px;line-height:1.4}.unsupported{opacity:.45}.qualityPills{display:flex;gap:5px}.qualityPill{flex:1;border:1px solid #263029;background:#0a100c;color:#9aa69e;border-radius:8px;padding:7px 4px;font-size:9px;cursor:pointer}.qualityPill.active{border-color:#718c69;background:#132016;color:#d6e7b8}.qualityPill:disabled{cursor:not-allowed}.focusRow{display:flex;gap:5px}.focusRow button{flex:1;border:1px solid #263029;background:#0a100c;color:#9aa69e;border-radius:8px;padding:7px;font-size:9px}.focusRow button.active{border-color:#718c69;background:#132016;color:#d6e7b8}.audioPills{display:flex;gap:5px;flex-wrap:wrap}.audioPill{flex:1;min-width:82px;border:1px solid #263029;background:#0a100c;color:#9aa69e;border-radius:8px;padding:8px 6px;font-size:9px;cursor:pointer}.audioPill.active{border-color:#718c69;background:#132016;color:#d6e7b8}.audioVolume{width:100%;margin-top:7px}.audioNote{font-size:8px;color:#657269;margin-top:6px;line-height:1.4}.start{padding:12px 22px;border:0;border-radius:999px;background:#d6e7b8;color:#071008;font-weight:850;cursor:pointer}.end{padding:12px 22px;border:0;border-radius:999px;background:#251313;color:#ffd6d6;font-weight:850;cursor:pointer}
        .form{padding:20px}.form h2{font-size:17px;margin:0 0 15px}.field{margin-bottom:15px}.field label{display:block;font-size:10px;color:#748178;margin-bottom:7px;text-transform:uppercase;letter-spacing:.1em}.input,.select{width:100%;border:1px solid #263029;background:#0d140f;color:#f3f6f3;border-radius:11px;padding:12px;outline:none}.input:focus,.select:focus{border-color:#61785a}.help{font-size:10px;color:#66736b;line-height:1.6;margin-top:14px}.error{border:1px solid #533536;background:#1b0f10;color:#ffcaca;padding:10px 12px;border-radius:10px;font-size:10px;margin-bottom:12px}.ready{border:1px solid #334333;background:#101810;color:#b8d2ae;padding:10px 12px;border-radius:10px;font-size:10px;margin-bottom:12px}.checkedIn{border-color:#6b815e;background:#111c12;color:#d6e7b8}
        .formatGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px}.formatButton{border:1px solid #263029;background:#0d140f;color:#aeb8b1;border-radius:13px;padding:11px;text-align:left;cursor:pointer}.formatButton strong{display:block;color:#e8eee9;font-size:11px}.formatButton small{display:block;color:#69766e;font-size:9px;margin-top:4px}.formatButton.active{border-color:#718c69;background:#132016;box-shadow:inset 0 0 0 1px #718c69}.formatButton:disabled{cursor:not-allowed;opacity:.55}.recordingsLink{display:inline-flex;margin-top:12px;color:#cbd8ce;text-decoration:none;font-size:11px}.notice{margin-top:16px;border:1px solid #273129;border-radius:16px;padding:15px;color:#7d8981;font-size:10px;line-height:1.6}.notice strong{color:#c7d2ca;display:block;margin-bottom:4px}
        @media(max-width:780px){.layout{grid-template-columns:1fr}.heading h1{font-size:36px}.shell{padding:24px 12px 50px}}
      `}</style>

      <SiteNav />
      <div className="shell">
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
            <div className={`preview format-${aspectRatio === "9:16" ? "portrait" : aspectRatio === "1:1" ? "square" : "landscape"}`}>
              {cameraReady ? <video ref={videoRef} className={facingMode === "user" ? "frontCamera" : "backCamera"} muted playsInline autoPlay /> : <div className="placeholder"><div className="cameraIcon">◉</div><div>Camera preview is off</div></div>}
              {showHostIntro && live && broadcastStartedAt && <SyncedLiveIntro startedAt={broadcastStartedAt} host onFinish={()=>setShowHostIntro(false)} />}
              {live && <span className="live">● LIVE</span>}{live && liveStreamIdRef.current && <div style={{position:"absolute",top:12,right:12,zIndex:12}}><ShareLiveButton streamId={liveStreamIdRef.current} title={title} compact /></div>}{recording && <span className="recording">● RECORDING</span>}
              {cameraReady && <div className="status"><span>{cameraOn ? "Camera on" : "Camera off"}</span><span>{facingMode === "user" ? "Front camera" : "Back camera"}</span><span>{micOn ? "Mic on" : "Mic off"}</span>{hostCheckedIn && !live ? <span>✓ Host checked in</span> : null}</div>}
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
            <div className="controls">
              {cameraReady && <><button className={cameraOn ? "circle" : "circle off"} onClick={toggleCamera} aria-label="Toggle camera">{cameraOn ? "◉" : "○"}</button><button className="circle" onClick={()=>void flipCamera()} aria-label="Flip camera" title="Flip camera">↻</button><button className={micOn ? "circle" : "circle off"} onClick={toggleMic} aria-label="Toggle microphone">{micOn ? "♫" : "×"}</button></>}
              {!cameraReady ? <button className="start" onClick={startPreview}>Enable camera & mic</button> : live ? <button className="end" onClick={endLive} disabled={saving}>{saving ? "Saving recording…" : "End live & save"}</button> : <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"}}>{scheduledSlot && !hostCheckedIn ? <button className="start" onClick={()=>void checkInHost()}>✓ Check In for Scheduled Live</button> : null}<button className="start" onClick={()=>void startLive(false)} disabled={saving}>● Start Live Now</button></div>}
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

          <aside className="panel form">
            <h2>Live details</h2>
            {error && <div className="error">{error}</div>}
            {scheduledSlot && !live && <div className={hostCheckedIn ? "ready checkedIn" : "ready"}>{hostCheckedIn ? "✓ HOST CHECKED IN — Viewers can see that you are ready. The broadcast stays locked until the scheduled time." : "Scheduled Live: camera and microphone can be prepared now. Check in when you are fully ready."}</div>}{live && <div className="ready">Your live session is active and being recorded.</div>}{saveMessage && <div className="ready">{saveMessage}</div>}
            <div className="field"><label htmlFor="title">Title</label><input id="title" className="input" value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="What are you sharing?" disabled={live}/></div>
            <div className="field"><label>Screen format</label><div className="formatGrid">{formats.map((format)=><button type="button" key={format.key} className={aspectRatio===format.key?"formatButton active":"formatButton"} onClick={()=>setAspectRatio(format.key)} disabled={live}><strong>{format.label} · {format.key}</strong><small>{format.hint}</small></button>)}</div><p className="help">Pick this before going live. Once the Live starts, the frame is locked for the whole broadcast.</p></div>
            <div className="field"><label htmlFor="thumbnail">Thumbnail image</label><input id="thumbnail" className="input" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e)=>setThumbnailFile(e.target.files?.[0]??null)} disabled={live}/><p className="help">Choose a cover image so your saved Live recording does not appear as a black thumbnail.</p></div>
            <div className="field"><label htmlFor="category">Topic</label><select id="category" className="select" value={category} onChange={(e)=>setCategory(e.target.value)} disabled={live}>{categories.map((item)=><option key={item}>{item}</option>)}</select></div>
            <div className="field"><label htmlFor="visibility">Who can watch?</label><select id="visibility" className="select" value={visibility} onChange={(e)=>setVisibility(e.target.value as "public" | "ashab")} disabled={live}><option value="public">Public — all 1Muslim users</option><option value="ashab">Ashab — only your Companions</option></select><p className="help">{visibility === "public" ? "Anyone signed in to 1Muslim can watch this Live." : "Only people who are accepted as your Ashab (Companions) can watch this Live."}</p></div>
            <p className="help">Starting Live publishes your camera and microphone through the OneMuslim WebRTC media backend. When you end, the finished video is also uploaded to your 1Muslim Live Recordings page.</p>
            <div className="notice"><strong>Broadcast connection</strong>Live video is transported through LiveKit WebRTC. Your finished recording is being transitioned to external video storage; Supabase will keep the recording metadata.</div>
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
