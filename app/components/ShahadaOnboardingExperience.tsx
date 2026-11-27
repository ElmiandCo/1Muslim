"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import FirstVisitGuide from "./FirstVisitGuide";
import GuardianParticles from "./GuardianParticles";
import RisingEnergyOrbs from "./RisingEnergyOrbs";
import AdmissionJourney from "./AdmissionJourney";
import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";

type Language = "ar" | "en";
type SpeechRecognitionLike = {
  lang: string; continuous: boolean; interimResults: boolean;
  start: () => void; stop: () => void; abort?: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

const SHAHADA = {
  ar: "أشهد أن لا إله إلا الله، وأشهد أن محمدًا رسول الله",
  en: "I bear witness that there is no deity worthy of worship except Allah, and I bear witness that Muhammad is the Messenger of Allah.",
};

function normalizeArabic(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ـ/g, "")
    .replace(/[^\u0621-\u063A\u0641-\u064A\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeEnglish(value: string) {
  return value.toLowerCase().replace(/[’']/g, "").replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
}

function verifyTranscript(transcript: string, language: Language) {
  if (language === "ar") {
    const t = normalizeArabic(transcript);
    const groups = [
      ["اشهد"],
      ["الله"],
      ["محمد"],
      ["رسول"],
      ["اله", "إله"],
      ["الا", "إلا"],
    ];
    const hits = groups.filter(group => group.some(word => t.includes(normalizeArabic(word)))).length;
    return hits >= 5 && t.length >= 18;
  }
  const t = normalizeEnglish(transcript);
  const groups = [
    ["bear witness", "testify", "witness"],
    ["deity", "god", "gods", "ilah"],
    ["worthy", "worship", "no god", "no deity", "none"],
    ["except", "but", "other than", "besides"],
    ["allah"],
    ["muhammad"],
    ["messenger", "prophet", "rasul"],
  ];
  const hits = groups.filter(group => group.some(word => t.includes(word))).length;
  return hits >= 5 && t.length >= 32 && (t.includes("muhammad") || t.includes("mohammed")) && (t.includes("allah") || t.includes("god"));
}

// Keep the complete 10-second take intact. No automatic trimming that could cut words.
const SHAHADA_RECORD_SECONDS = 10;
const SHAHADA_HOLD_DELAY_MS = 320;

export default function ShahadaOnboardingExperience({embedded=false,onComplete}:{embedded?:boolean;onComplete?:()=>void}={}) {
  const router = useRouter();
  const [step, setStep] = useState<"shahada" | "gender">("shahada");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [writtenDeclaration, setWrittenDeclaration] = useState(false);
  const [alternativeHint,setAlternativeHint]=useState(true);
  const [verificationMode, setVerificationMode] = useState<"audio" | "declaration">("audio");
  useEffect(() => {if(new URLSearchParams(window.location.search).get("method")==="declaration"){setVerificationMode("declaration");}}, []);
  useEffect(()=>{const timer=window.setTimeout(()=>setAlternativeHint(false),4000);return()=>window.clearTimeout(timer)},[]);
  const chooseDeclaration=()=>{resetShahada();setWrittenDeclaration(true);setVerificationMode("declaration");setMessage("Checkbox option selected. Please read and personally affirm the declaration below.");document.getElementById("shahada-self-attest")?.scrollIntoView({behavior:"smooth",block:"center"});};
  const [language, setLanguage] = useState<Language>("ar");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [verified, setVerified] = useState(false);
  const [recording, setRecording] = useState(false);
  const [startingRecording, setStartingRecording] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(SHAHADA_RECORD_SECONDS);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [holdingRecord, setHoldingRecord] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [processingAudio, setProcessingAudio] = useState(false);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const recognizedRef = useRef(false);
  const attemptRef = useRef(0);
  const consentRef = useRef(false);
  const resetRef = useRef(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const audioMeterRef = useRef<{context: AudioContext; frame: number; source: MediaStreamAudioSourceNode} | null>(null);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [voiceStatus,setVoiceStatus] = useState<"ready"|"recording"|"speaking"|"analyzing"|"resetting"|"recognized"|"retry"|"processing">("ready");
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout>|null>(null);
  const speechStartedRef = useRef(false);
  const finalTranscriptRef = useRef("");
  const lastTranscriptRef = useRef("");
  const activeRecordingRef = useRef(false);
  const endingRecordingRef = useRef(false);
  const endAfterPermissionRef = useRef(false);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionFinishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishSpeechRef = useRef<() => void>(() => {});
  const finishRecordingRef = useRef<() => void>(() => {});
  const pointerHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerHoldRef = useRef<{id:number;hold:boolean} | null>(null);
  const ignoreNextClickRef = useRef(false);
  const audioPreviewUrlRef = useRef<string | null>(null);
  const clearRecordingTimers = () => {
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
    if (recognitionFinishTimerRef.current) { clearTimeout(recognitionFinishTimerRef.current); recognitionFinishTimerRef.current = null; }
  };
  const clearPointerHold = () => {
    if (pointerHoldTimerRef.current) { clearTimeout(pointerHoldTimerRef.current); pointerHoldTimerRef.current = null; }
  };
  const discardPreview = () => {
    if (audioPreviewUrlRef.current) URL.revokeObjectURL(audioPreviewUrlRef.current);
    audioPreviewUrlRef.current = null;
    setAudioBlob(null);
    setAudioPreview(null);
  };
  const clearSilenceTimer = () => {if(silenceTimerRef.current){clearTimeout(silenceTimerRef.current);silenceTimerRef.current=null;}};
  useEffect(()=>()=>{ 
    // Leaving onboarding must immediately release the microphone and discard any unsaved take.
    resetRef.current = true;
    attemptRef.current++;
    try { recognitionRef.current?.abort?.(); } catch {}
    try { if (recorderRef.current?.state === "recording") recorderRef.current.stop(); } catch {}
    streamRef.current?.getTracks().forEach(track => track.stop());
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (recognitionFinishTimerRef.current) clearTimeout(recognitionFinishTimerRef.current);
    if (pointerHoldTimerRef.current) clearTimeout(pointerHoldTimerRef.current);
    if (audioPreviewUrlRef.current) URL.revokeObjectURL(audioPreviewUrlRef.current);
  },[]);
  const stopVoiceMeter = () => {
    const meter = audioMeterRef.current;
    audioMeterRef.current = null;
    if (meter) {
      cancelAnimationFrame(meter.frame);
      meter.source.disconnect();
      void meter.context.close().catch(() => {});
    }
    setVoiceLevel(0);
  };
  const startVoiceMeter = (stream: MediaStream) => {
    stopVoiceMeter();
    try {
      const context = new AudioContext();
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.78;
      source.connect(analyser);
      const samples = new Uint8Array(analyser.fftSize);
      const meter = {context, source, frame: 0};
      audioMeterRef.current = meter;
      const tick = () => {
        if (audioMeterRef.current !== meter) return;
        analyser.getByteTimeDomainData(samples);
        let power = 0;
        for (const sample of samples) { const value = (sample - 128) / 128; power += value * value; }
        setVoiceLevel(Math.min(1, Math.sqrt(power / samples.length) * 5));
        meter.frame = requestAnimationFrame(tick);
      };
      meter.frame = requestAnimationFrame(tick);
    } catch { setVoiceLevel(0); }
  };
  useEffect(() => () => {
    const meter = audioMeterRef.current;
    audioMeterRef.current = null;
    if (meter) { cancelAnimationFrame(meter.frame); meter.source.disconnect(); void meter.context.close().catch(() => {}); }
  }, []);

  useEffect(() => {
    (async () => {
      const s = createClient();
      const { data: { user } } = await s.auth.getUser();
      if (!user) { const method=new URLSearchParams(window.location.search).get("method");router.replace("/auth?shahada=1&method="+(method==="declaration"?"declaration":"audio")); return; }
      const { data: p } = await s.from("profiles").select("gender,shahada_verified_at,shahada_language").eq("id", user.id).single();
      if(p?.gender==="male"||p?.gender==="female")setGender(p.gender);
      if (p?.gender && p?.shahada_verified_at) { if(embedded){onComplete?.();return;} router.replace(new URLSearchParams(window.location.search).get("return")==="profile"?"/profile":"/search"); return; }
      if (p?.shahada_verified_at) setStep("gender");
      if (p?.shahada_language === "en" || p?.shahada_language === "ar") setLanguage(p.shahada_language);
      setChecking(false);
    })();
  }, [router]);

  const stopMedia = () => {
    clearSilenceTimer();
    clearRecordingTimers();
    clearPointerHold();
    activeRecordingRef.current = false;
    endingRecordingRef.current = true;
    endAfterPermissionRef.current = false;
    finishSpeechRef.current = () => {};
    stopVoiceMeter();
    try { recognitionRef.current?.abort?.(); } catch { try { recognitionRef.current?.stop(); } catch {} }
    recognitionRef.current = null;
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    setListening(false);
    setRecording(false);
    setStartingRecording(false);
    setHoldingRecord(false);
    setSecondsLeft(SHAHADA_RECORD_SECONDS);
    setRecordedDuration(0);
  };

  // A tap starts or finishes a take. The 10-second ceiling never waits on silence detection.
  const finishShahada = () => {
    if (!activeRecordingRef.current || endingRecordingRef.current) return;
    if (recorderRef.current?.state !== "recording") {
      endAfterPermissionRef.current = true;
      return;
    }
    endingRecordingRef.current = true;
    activeRecordingRef.current = false;
    clearRecordingTimers();
    const elapsed = Math.min(SHAHADA_RECORD_SECONDS, Math.max(0, (Date.now() - recordingStartedAtRef.current) / 1000));
    setRecordedDuration(elapsed);
    setSecondsLeft(Math.max(0, Math.ceil(SHAHADA_RECORD_SECONDS - elapsed)));
    setRecording(false);
    setListening(false);
    setHoldingRecord(false);
    setVoiceStatus("analyzing");
    setProcessingAudio(true);
    stopVoiceMeter();
    try { recognitionRef.current?.stop(); } catch { finishSpeechRef.current(); }
    // A few browsers never emit SpeechRecognition.onend; keep finalization deterministic.
    recognitionFinishTimerRef.current = setTimeout(() => finishSpeechRef.current(), 900);
    try { recorderRef.current?.stop(); } catch { setProcessingAudio(false); }
  };
  const recordingStartedAtRef = useRef(0);
  finishRecordingRef.current = finishShahada;

  const startShahada = async () => {
    if (activeRecordingRef.current || recorderRef.current?.state === "recording" || processingAudio) return;
    const attempt = ++attemptRef.current;
    resetRef.current = false;
    activeRecordingRef.current = true;
    endingRecordingRef.current = false;
    endAfterPermissionRef.current = false;
    recognizedRef.current = false;
    speechStartedRef.current = false;
    finalTranscriptRef.current = "";
    lastTranscriptRef.current = "";
    setVerificationMode("audio");
    setWrittenDeclaration(false);
    setVerified(false);
    setMessage("Requesting microphone access…");
    setTranscript("");
    discardPreview();
    setSecondsLeft(SHAHADA_RECORD_SECONDS);
    setRecordedDuration(0);
    setStartingRecording(true);
    setVoiceStatus("ready");
    clearSilenceTimer();
    clearRecordingTimers();
    const W = window as any;
    const SR = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (!SR || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      activeRecordingRef.current = false;
      setStartingRecording(false);
      setVoiceStatus("retry");
      setMessage("Voice recognition is unavailable in this browser. Try Safari or Chrome, or use the written declaration below.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (attempt !== attemptRef.current || resetRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      streamRef.current = stream;
      const mime = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"].find(type => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks: BlobPart[] = [];
      recorderRef.current = recorder;
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        if (streamRef.current === stream) streamRef.current = null;
        if (recorderRef.current === recorder) recorderRef.current = null;
        stopVoiceMeter();
        setRecording(false);
        setStartingRecording(false);
        setProcessingAudio(false);
        if (resetRef.current || attempt !== attemptRef.current) return;
        // Preserve the original recording; automatically cropping silence can clip the Shahada.
        const clip = new Blob(chunks, { type: recorder.mimeType || mime || "audio/webm" });
        if (!clip.size) {
          recognizedRef.current = false;
          setVerified(false);
          setVoiceStatus("retry");
          setMessage("No audio was captured. Check microphone access and record again.");
          return;
        }
        const url = URL.createObjectURL(clip);
        if (audioPreviewUrlRef.current) URL.revokeObjectURL(audioPreviewUrlRef.current);
        audioPreviewUrlRef.current = url;
        setAudioBlob(clip);
        setAudioPreview(url);
      };

      const rec = new SR() as SpeechRecognitionLike;
      recognitionRef.current = rec;
      rec.lang = language === "ar" ? "ar-SA" : "en-US";
      rec.continuous = true;
      rec.interimResults = true;
      let sessionText = "";
      let priorSessions = "";
      let speechFinalized = false;
      let recognizerError = "";
      const saveSession = () => {
        if (sessionText.trim()) priorSessions = [priorSessions, sessionText].filter(Boolean).join(" ").trim();
        sessionText = "";
        lastTranscriptRef.current = priorSessions;
      };
      const finalizeRecognition = () => {
        if (speechFinalized || resetRef.current || attempt !== attemptRef.current) return;
        speechFinalized = true;
        if (recognitionFinishTimerRef.current) { clearTimeout(recognitionFinishTimerRef.current); recognitionFinishTimerRef.current = null; }
        saveSession();
        const text = lastTranscriptRef.current.trim();
        setTranscript(text);
        const recognized = !recognizerError && verifyTranscript(text, language);
        recognizedRef.current = recognized;
        setVerified(recognized);
        setVoiceStatus(recognized ? "recognized" : "retry");
        setMessage(recognized
          ? "Shahada recognized. Listen to your recording, then continue."
          : recognizerError || (text
            ? "We heard part of your Shahada but could not confirm the full declaration. Listen, then record again."
            : "No speech was recognized. Check microphone access or choose the written declaration."));
      };
      finishSpeechRef.current = finalizeRecognition;
      rec.onresult = (event: any) => {
        if (resetRef.current || attempt !== attemptRef.current) return;
        const results = Array.from(event.results ?? []) as any[];
        sessionText = results.map((result: any) => result?.[0]?.transcript ?? "").join(" ").trim();
        const fullText = [priorSessions, sessionText].filter(Boolean).join(" ").trim();
        lastTranscriptRef.current = fullText;
        setTranscript(fullText);
        if (sessionText) { speechStartedRef.current = true; setVoiceStatus("speaking"); }
      };
      rec.onerror = (event: any) => {
        if (resetRef.current || attempt !== attemptRef.current) return;
        const code = String(event?.error || "");
        if (code === "not-allowed" || code === "service-not-allowed" || code === "audio-capture") {
          recognizerError = "Speech recognition is blocked. Allow speech access or use the written declaration.";
          finishRecordingRef.current();
        }
        // no-speech is expected in quiet moments; keep the recording window open.
      };
      rec.onend = () => {
        if (resetRef.current || attempt !== attemptRef.current) return;
        if (endingRecordingRef.current) { finalizeRecognition(); return; }
        saveSession();
        if (!activeRecordingRef.current) return;
        // Safari can end recognition during a short pause. Audio capture must not end with it.
        window.setTimeout(() => {
          if (resetRef.current || attempt !== attemptRef.current || endingRecordingRef.current || !activeRecordingRef.current) return;
          try { rec.start(); } catch { /* The 10-second capture continues; preview remains available. */ }
        }, 150);
      };

      recorder.start(250);
      recordingStartedAtRef.current = Date.now();
      setRecording(true);
      setListening(true);
      setStartingRecording(false);
      setMessage("");
      setVoiceStatus("recording");
      startVoiceMeter(stream);
      try { rec.start(); } catch {
        recognizerError = "Speech recognition could not start. Please use the written declaration or try another browser.";
      }
      recordingTimerRef.current = setInterval(() => {
        if (attempt !== attemptRef.current || endingRecordingRef.current) return;
        const remaining = Math.max(0, SHAHADA_RECORD_SECONDS - (Date.now() - recordingStartedAtRef.current) / 1000);
        setSecondsLeft(Math.ceil(remaining));
        if (remaining <= 0) finishRecordingRef.current();
      }, 100);
      if (endAfterPermissionRef.current) {
        endAfterPermissionRef.current = false;
        finishRecordingRef.current();
      }
    } catch {
      if (attempt !== attemptRef.current || resetRef.current) return;
      resetRef.current = true;
      stopMedia();
      setVoiceStatus("retry");
      setMessage("Microphone permission or audio capture failed. Allow access in browser settings and try again.");
    }
  };

  const onRecorderClick = () => {
    if (ignoreNextClickRef.current) { ignoreNextClickRef.current = false; return; }
    if (startingRecording || processingAudio) return;
    if (recording || listening) { finishShahada(); return; }
    if (audioBlob || verified) resetShahada();
    void startShahada();
  };
  const onRecorderPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || startingRecording || recording || listening || processingAudio || audioBlob || verified) return;
    pointerHoldRef.current = { id: event.pointerId, hold: false };
    clearPointerHold();
    pointerHoldTimerRef.current = setTimeout(() => {
      if (!pointerHoldRef.current || pointerHoldRef.current.id !== event.pointerId) return;
      pointerHoldRef.current.hold = true;
      ignoreNextClickRef.current = true;
      setHoldingRecord(true);
      void startShahada();
    }, SHAHADA_HOLD_DELAY_MS);
  };
  const onRecorderPointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const gesture = pointerHoldRef.current;
    if (!gesture || gesture.id !== event.pointerId) return;
    clearPointerHold();
    pointerHoldRef.current = null;
    if (gesture.hold) {
      setHoldingRecord(false);
      if (recorderRef.current?.state === "recording") finishShahada();
      else {
        // A permission prompt may interrupt the hold; don't end an empty take.
        endAfterPermissionRef.current = false;
        setMessage("Microphone access pending. Once recording starts, tap Finish when done.");
      }
      // Suppress the click that follows a long press, without suppressing a later tap.
      window.setTimeout(() => { ignoreNextClickRef.current = false; }, 0);
    }
  };

  const resetShahada = () => {
    setVoiceStatus("resetting");
    resetRef.current = true;
    attemptRef.current++;
    recognizedRef.current = false;
    stopMedia();
    discardPreview(); setTranscript(""); setVerified(false); setProcessingAudio(false); setMessage("Ready to record. Tap to start or hold the HudHud button.");
    // Never auto-restart: the user explicitly chooses when a fresh attempt begins.
  };

  const finish = async () => {
    if (!gender) { setMessage("Please select a gender to continue."); return; }
    const declarationVerified = verificationMode === "declaration" && writtenDeclaration;
    if (!declarationVerified && (!verified || !audioBlob)) { setMessage("Complete voice verification or affirm the Shahada declaration first."); setStep("shahada"); return; }

    setSaving(true); setMessage("");
    const s = createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!user) { router.replace("/auth"); return; }

    let path: string | null = null;
    if (!declarationVerified && audioBlob) {
      const ext = audioBlob.type.includes("mp4") ? "m4a" : audioBlob.type.includes("wav") ? "wav" : "webm";
      path = `${user.id}/shahada-${Date.now()}.${ext}`;
      const upload = await s.storage.from("shahada-safe-vault").upload(path, audioBlob, { contentType: audioBlob.type || "audio/webm", upsert: false });
      if (upload.error) { setMessage(upload.error.message); setSaving(false); return; }
    }

    const { data: existing } = await s.from("profiles").select("gender,avatar_gender,avatar_config").eq("id", user.id).single();
    const selectedGender = gender || existing?.gender || "";
    if (!selectedGender) { setMessage("Please select a gender to continue."); setSaving(false); return; }

    const { error } = await s.from("profiles").update({
      shahada_audio_path: path,
      shahada_audio_recorded_at: path ? new Date().toISOString() : null,
      shahada_language: language,
      shahada_verified_at: new Date().toISOString(),
      shahada_verification_method: declarationVerified ? "self-attested-checkbox" : "speech-recognition-semantic-match",
      gender: selectedGender,
      avatar_gender: selectedGender,
      avatar_config: {
        ...(existing?.avatar_config ?? {}),
        accent: "emerald",
        gender: selectedGender,
        package: "starter",
        accessories: Array.isArray(existing?.avatar_config?.accessories) ? existing.avatar_config.accessories : []
      }
    }).eq("id", user.id);

    if (error) { if (path) await s.storage.from("shahada-safe-vault").remove([path]); setMessage(error.message); setSaving(false); return; }
    const { error: badgeError } = await s.rpc("award_profile_badge", {
      p_badge_key: "shahadah",
      p_badge_name: "Shahada Verified",
      p_description: "Completed Shahada verification during onboarding."
    });
    if (badgeError) { setMessage("Your Shahada was saved, but the badge could not be awarded. Please try again."); setSaving(false); return; }
    try { sessionStorage.setItem("1muslim:shahada-welcome", "yes"); } catch {}
    if(embedded){onComplete?.();return;}
    router.replace(new URLSearchParams(window.location.search).get("return")==="profile"?"/profile":"/search");
  };

  if (checking) return <main className={"onboardingPage"+(embedded?" onEmbedded":"")}>{!embedded&&<FirstVisitGuide area="shahada"/>}<section className="onboardingCard"><span className="eyebrow">1MUSLIM</span><h1>Preparing your profile…</h1></section></main>;

  return <main className={"onboardingPage"+(embedded?" onEmbedded":"")}><style>{`
.onboardingPage .studioVoiceCompact{position:relative;max-width:560px;width:100%;margin:12px auto;padding:18px 22px 20px!important;border:1px solid #8cba9b75!important;border-radius:30px!important;background:radial-gradient(ellipse at 50% 36%,#104a3b99,#061511 75%)!important;box-shadow:inset 0 1px 0 #e0ffdc4a,0 15px 45px #0006!important;display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;overflow:hidden}
.onboardingPage .studioVoiceCompact .securityGuardianHeader{width:100%;margin-bottom:0}
.onboardingPage .studioVoiceCompact>.eyebrow{display:none}
.onboardingPage .studioVoiceCompact .hudhudRecord{width:132px!important;height:132px!important;min-height:132px!important;margin:10px auto 0!important;filter:drop-shadow(0 0 16px #33f6a455);transition:transform .25s ease,filter .25s ease}
.onboardingPage .studioVoiceCompact .hudhudRecord:hover{transform:scale(1.045);filter:drop-shadow(0 0 24px #48ffb6a0)}
.onboardingPage .studioVoiceCompact .hudhudCore{width:100%!important;height:100%!important;border:2px solid #c6f8d7a8!important;border-radius:50%!important;background:#021b14!important;display:grid;place-items:center}
.onboardingPage .studioVoiceCompact .hudhudCore img{width:88%!important;height:88%!important;object-fit:contain}
.onboardingPage .studioVoiceCompact .studioVoiceWave{height:44px;display:flex;align-items:center;justify-content:center;gap:4px;width:100%;pointer-events:none}
.onboardingPage .studioVoiceCompact .studioVoiceWave i{display:block;width:3px;max-height:36px;border-radius:8px;background:linear-gradient(#bbffda,#20dca1);opacity:.55;transform:scaleY(.45);transition:transform .3s}
.onboardingPage .studioVoiceLive .studioVoiceWave i{transition:transform 90ms ease-out,opacity 90ms ease-out}
.onboardingPage .studioVoiceCompact>strong{font-size:clamp(19px,4vw,25px)!important;line-height:1.2;margin:0!important}
.onboardingPage .studioVoiceCompact>p{font-size:12px!important;line-height:1.5!important;max-width:320px;margin:0!important;color:#b9d8cb!important}
.onboardingPage .studioVoiceCompact .transcript{width:100%;max-width:450px;text-align:start;max-height:105px;overflow:auto;border-radius:16px;background:#001810a8;border:1px solid #b0e8c53d;padding:10px}
.onboardingPage .studioVoiceCompact .transcript audio{height:38px}
@keyframes studioVoiceBounce{from{transform:scaleY(.25)}to{transform:scaleY(1)}}
@media(max-width:600px){.onboardingPage .studioVoiceCompact{padding:12px 14px!important;border-radius:24px!important;gap:6px}.onboardingPage .studioVoiceCompact .hudhudRecord{width:110px!important;height:110px!important;min-height:110px!important}.onboardingPage .studioVoiceCompact .studioVoiceWave{height:32px}.onboardingPage .studioVoiceCompact .transcript{max-height:85px}}
@media(prefers-reduced-motion:reduce){.onboardingPage .studioVoiceLive .studioVoiceWave i{animation:none;transform:scaleY(.8)}}
.onboardingPage .shahadaRecorderHint{display:grid;gap:4px;text-align:center}
.onboardingPage .shahadaRecorderHint span{font-size:10px;font-weight:850;letter-spacing:.16em;color:#e0f7e5}
.onboardingPage .shahadaRecorderHint small{font-size:11px;color:#b5d5ca}
.onboardingPage .securityGuardianStatus.shahadaRecLive{color:#ff9c9c!important;text-shadow:0 0 12px #ed475b99!important;animation:shahadaRecBlink 1s ease-in-out infinite}
.onboardingPage .shahadaOrbRec{position:absolute;top:6px;right:7px;width:16px;height:16px;background:#f36676;border:3px solid #092016;border-radius:50%;box-shadow:0 0 15px #fe6577}
.onboardingPage .shahadaRecordingClock{width:100%;max-width:410px;padding:0 3px;display:grid;gap:6px}
.onboardingPage .shahadaRecordingClockLabels{display:flex;align-items:center;justify-content:space-between;gap:10px}
.onboardingPage .shahadaRecordingClockLabels span{font-size:10px;letter-spacing:.1em;font-weight:850;color:#b4cabf}
.onboardingPage .shahadaRecordingClock.active .shahadaRecordingClockLabels span{color:#ff9b9f}
.onboardingPage .shahadaRecordingClockLabels strong{font-size:22px!important;font-variant-numeric:tabular-nums;color:#f4fbf6}
.onboardingPage .shahadaRecordingTrack{height:7px;width:100%;border-radius:999px;background:#d5ffda25;overflow:hidden;border:1px solid #ffffff29}
.onboardingPage .shahadaRecordingTrack i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#f5c1bf,#ec6478);transition:width .1s linear}
.onboardingPage .shahadaRecorderFeedback{width:100%;max-width:420px;padding:8px 11px;border:1px solid #ec9ca75c;border-radius:11px;background:#351a2088;color:#ffced2!important;text-align:center;font-size:11px!important;line-height:1.45}
.onboardingPage .shahadaRecorderFeedback.ok{border-color:#8de7b17f;background:#082a1eb0;color:#d9ffe9!important}
.onboardingPage .shahadaRecorderActions{display:flex;justify-content:center;flex-wrap:wrap;gap:9px;width:100%}
.onboardingPage .shahadaRecorderActions button{min-height:44px;border-radius:100px;padding:10px 18px;font-size:13px;font-weight:800;cursor:pointer}
.onboardingPage .shahadaPrimaryAction{background:#cceecb;border:1px solid #d6f8d7;color:#07180f}
.onboardingPage .shahadaDiscardAction{background:#201015b8;border:1px solid #ef9fa98c;color:#ffd4da}
.onboardingPage .shahadaRecorderActions button:disabled{opacity:.55;cursor:wait}
.onboardingPage .shahadaAudioReview{display:grid;gap:7px;width:100%;max-width:420px;text-align:left;border:1px solid #b6f1d962;background:#071c17d9;border-radius:15px;padding:10px 12px}
.onboardingPage .shahadaAudioReview span{font-size:10px;letter-spacing:.09em;font-weight:850;color:#d9ffe8}
.onboardingPage .shahadaAudioReview audio{width:100%;height:42px}
.onboardingPage .shahadaAudioReview small{font-size:10px;color:#b7d2c2;line-height:1.4}
.onboardingPage .studioVoiceCompact .shahadaRecorderTitle{font-size:16px!important}
.onboardingPage .studioVoiceCompact .shahadaRecorderSub{font-size:11px!important;max-width:380px}
@keyframes shahadaRecBlink{50%{opacity:.55}}
@media(max-width:600px){.onboardingPage .shahadaRecordingClockLabels strong{font-size:19px!important}.onboardingPage .shahadaRecorderActions button{padding:8px 13px;font-size:12px}.onboardingPage .studioVoiceCompact .hudhudRecord{margin:2px auto!important}.onboardingPage .studioVoiceCompact{gap:7px!important}}
@media(prefers-reduced-motion:reduce){.onboardingPage .securityGuardianStatus.shahadaRecLive{animation:none}}
`}</style><section className="onboardingCard">
    <AdmissionJourney stage={step==="shahada"?1:3} detail={step==="shahada"?(verified||writtenDeclaration?"Declaration recognized. Agree to the terms to proceed to admission.":"Complete your Shahada by voice or self-attested declaration."):(saving?"Saving admission and awarding your badge…":"Finish your profile to enter 1Muslim and receive your badge. XP is subject to the rewards system.")}/>
    {step === "shahada" ? <>
      <span className="eyebrow">COMMUNITY VERIFICATION</span>
      <h1>Say the Shahada.</h1>
      <p className="lead">Choose Arabic or English, then tap or hold HudHud to record for up to 10 seconds. Listen before continuing.</p>
      <div className={`voiceCard securityGuardianStage studioVoiceCompact ${listening || recording ? "securityGuardianActive studioVoiceLive" : ""}`}>
        <div className="securityGuardianArt" aria-hidden="true"/>
        <RisingEnergyOrbs tone="blue"/>
        <GuardianParticles active={listening || recording} stream={streamRef.current}/>
        <GuardianParticles active={listening || recording} stream={streamRef.current} foreground/>
        <div className="securityGuardianHeader">
          <span>HUDHUD / SECURE VOICE</span>
          <span className={`securityGuardianStatus ${recording ? "shahadaRecLive" : ""}`}>
            {recording ? "● REC" : startingRecording ? "● MIC ACCESS" : audioPreview ? (verified ? "✓ VERIFIED" : "● REVIEW") : "● STANDBY"}
          </span>
        </div>
        <div className="shahadaRecorderHint">
          <span>PRIVATE SHAHADA RECORDER</span>
          <small>Tap to start or press and hold · 10-second limit</small>
        </div>
        <button
          type="button"
          className={`hudhudRecord ${listening ? "isListening" : ""} ${verified ? "isVerified" : ""}`}
          aria-label={recording ? "Finish recording and listen" : startingRecording ? "Microphone permission pending" : audioPreview ? "Record your Shahada again" : "Tap to record Shahada, or press and hold"}
          aria-pressed={recording}
          disabled={startingRecording || processingAudio}
          onPointerDown={onRecorderPointerDown}
          onPointerUp={onRecorderPointerUp}
          onPointerCancel={onRecorderPointerUp}
          onClick={onRecorderClick}
        >
          <span className="hudhudHalo" aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i} style={{transform:`rotate(${i*30}deg) translateY(-58px)`,animationDelay:`${i*-.18}s`}}/>)}</span>
          <span className="hudhudCore" aria-hidden="true"><img src="/assets/hudhud-logo.PNG" alt="" /></span>
          {recording && <span className="shahadaOrbRec" aria-hidden="true"/>}
        </button>
        <div className={`shahadaRecordingClock ${recording ? "active" : ""}`} aria-label={recording ? `${secondsLeft} seconds remaining` : audioPreview ? `${Math.ceil(recordedDuration)} seconds recorded` : "Maximum recording time: 10 seconds"}>
          <div className="shahadaRecordingClockLabels">
            <span>{recording ? "● RECORDING NOW" : startingRecording ? "ALLOW MICROPHONE" : audioPreview ? "RECORDING COMPLETE" : "READY WHEN YOU ARE"}</span>
            <strong>{`00:${String(recording ? secondsLeft : audioPreview ? Math.ceil(recordedDuration) : SHAHADA_RECORD_SECONDS).padStart(2,"0")}`}</strong>
          </div>
          <div className="shahadaRecordingTrack" role="progressbar" aria-label="Shahada recording duration" aria-valuemin={0} aria-valuemax={10} aria-valuenow={recording ? 10-secondsLeft : audioPreview ? recordedDuration : 0}>
            <i style={{width:`${recording ? (10-secondsLeft)*10 : audioPreview ? recordedDuration*10 : 0}%`}}/>
          </div>
        </div>
        <div className="studioVoiceWave" aria-hidden="true">{Array.from({length:25},(_,i)=><i key={i} style={{height:`${12+Math.abs(Math.sin(i*1.3))*32}px`,transform:`scaleY(${(listening || recording) ? Math.max(.2,Math.min(1.8,.2+voiceLevel*2.3*(.35+.65*Math.abs(Math.sin(i*1.3))))) : .25})`,opacity:(listening || recording) ? .55+voiceLevel*.45 : .35}} />)}</div>
        <strong className="shahadaRecorderTitle" role="status" aria-live="polite">
          {startingRecording ? "Connecting to microphone…" : recording ? (holdingRecord ? "Recording — release to finish" : "Recording your Shahada") : processingAudio ? "Preparing your recording…" : verified ? "✓ Shahada recognized" : audioPreview ? "Listen to your recording" : voiceStatus==="retry" ? "Ready to try again" : "Ready to record"}
        </strong>
        <p className="shahadaRecorderSub">
          {recording ? "Speak clearly in "+(language==="en"?"English":"Arabic")+". Tap Finish or wait for 00:00." : audioPreview ? "Press Play to hear the full take. If anything was missed, record again." : "Say the words below. Tap once to begin, tap again to finish — or hold and release."}
        </p>
        {message && verificationMode === "audio" && <p className={`shahadaRecorderFeedback ${verified ? "ok" : ""}`} role="status">{message}</p>}
        <div className="shahadaRecorderActions">
          <button type="button" className="shahadaPrimaryAction" onClick={onRecorderClick} disabled={startingRecording || processingAudio}>
            {startingRecording ? "Requesting access…" : recording ? "■ Finish & listen" : audioPreview ? "↻ Record again" : "🎙 Start recording"}
          </button>
          {(recording || audioPreview) && <button type="button" className="shahadaDiscardAction" onClick={resetShahada}>× Discard</button>}
        </div>
        {audioPreview && <div className="shahadaAudioReview">
          <span>🎧 LISTEN TO YOUR RECORDING</span>
          <audio controls preload="metadata" src={audioPreview} aria-label="Play your private Shahada recording"/>
          <small>Complete take · no cropping. Vault upload happens only when you continue; browser speech recognition may use an external service.</small>
        </div>}
        {transcript && <div className="transcript" dir={language === "ar" ? "rtl" : "ltr"}><small>Speech recognition heard</small><span>{transcript}</span></div>}
      </div>
      <div className="languagePicker">
        <button className={language === "ar" ? "selected" : ""} onClick={() => { resetShahada(); setLanguage("ar"); setMessage(""); }}>العربية <small>Arabic</small></button>
        <button className={language === "en" ? "selected" : ""} onClick={() => { resetShahada(); setLanguage("en"); setMessage(""); }}>English <small>English</small></button>
      </div>
      <div className="phraseCard" dir={language === "ar" ? "rtl" : "ltr"}>{SHAHADA[language]}</div>
      {alternativeHint && !listening && !verified && <button type="button" className="shahadaVisionHint" onClick={chooseDeclaration} aria-label="Select the self-attested checkbox option"><span>✦ HUDHUD VISION · 4-SECOND TIP</span><strong>Recording is optional.</strong><small>Tap here to select the checkbox route. You will still need to personally affirm the Shahada and accept the terms.</small></button>}
      {!verified && <div className="declarationFallback" id="shahada-self-attest"><strong>Prefer a checkbox?</strong><p>This is an optional alternative to voice recognition. If your Shahada was recognized, no declaration checkbox is needed.</p><label><input type="checkbox" checked={writtenDeclaration} onChange={e => { resetShahada(); setWrittenDeclaration(e.target.checked); setVerificationMode(e.target.checked ? "declaration" : "audio"); setMessage(""); }} /><span>I sincerely affirm the Shahada displayed above and wish to join the 1Muslim community.</span></label>{writtenDeclaration && <small>✓ Written declaration selected. No microphone recording will be required.</small>}</div>}
      {message && <div className={verified || writtenDeclaration ? "success" : "error"}>{message}</div>}
      <div className="badgePreview"><div className="badgeSeal" aria-hidden="true"></div><div><span className="badgeKicker">YOUR FIRST 1MUSLIM BADGE</span><strong>Shahada Verified</strong><p>Earn this badge after completing your Shahada verification and profile setup. It will appear on your public profile.</p></div><span className="badgeStatus">{verified || writtenDeclaration ? "✓ Declared" : "🔒 Unlock"}</span></div>
      <div className="legalScroll" role="region" aria-label="Terms and conditions" tabIndex={0}><strong>1Muslim · Terms &amp; Conditions</strong><p>1Muslim is a faith-centered platform supporting Muslim communities, Islamic education, and connections consistent with Islamic principles.</p><p>Our commitment to Islam does not constitute hostility toward any other religion, belief system, or individual. We respect the dignity of people of all religious backgrounds, including those with no religion.</p><strong>Protection of Islamic Values</strong><p>1Muslim may establish and enforce standards for content, conduct, programming, and participation consistent with applicable law. We may prioritize Islamic education, worship, and community development, and are not required to endorse every religious or philosophical viewpoint.</p><strong>Religious Discussions and Differences</strong><p>Respectful theological discussions, comparative religion, scholarly disagreements, and criticism of religious ideas may be permitted. Harassment, threats, targeted abuse, incitement to violence, and dehumanizing treatment are prohibited. Disagreement with a religious belief is not, by itself, harassment or discrimination.</p><strong>Content Moderation</strong><p>1Muslim may review, restrict, remove, or decline to feature content conflicting with published community standards, subject to applicable law. Decisions should follow documented standards rather than hostility toward a person's religious identity.</p><strong>Our Guiding Principle</strong><p>1Muslim exists to preserve, celebrate, and strengthen Muslim identity—not to attack or diminish the dignity of others.</p></div><label className="termsConsent"><input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} required /><span>I have read and agree to the Terms &amp; Conditions above.</span></label>
      <button className="continue secondary" disabled={!(writtenDeclaration || (verified && !!audioBlob && !processingAudio)) || !acceptedTerms} onClick={() => setStep("gender")}>Continue to profile →</button>
      <small className="fine">Either method qualifies for the Shahada badge. Your complete, untrimmed recording stays private and is uploaded to the secure vault only if you continue. Listen to it first. Checkbox verification is self-attested.</small>
    </> : <>
      <span className="eyebrow">WELCOME TO 1MUSLIM</span><h1>Choose your profile.</h1><p className="lead">Select your gender once. This sets your default profile avatar and stays fixed after setup.</p>
      <div className="genderGrid"><button className={gender === "male" ? "genderCard selected" : "genderCard"} onClick={() => setGender("male")}><img src="/assets/avatars/default-male.jpg" alt="" /><strong>Male</strong><span>Use the male default avatar</span></button><button className={gender === "female" ? "genderCard selected" : "genderCard"} onClick={() => setGender("female")}><img src="/assets/avatars/Default-women.png" alt="" /><strong>Female</strong><span>Use the female default avatar</span></button></div>
      {message && <div className="error">{message}</div>}<button className="continue" onClick={() => void finish()} disabled={saving}>{saving ? "Saving…" : "Enter 1Muslim →"}</button><small className="fine">Gender is selected once during onboarding and cannot be changed.</small>
    </>}
  </section><style jsx>{`
/* Premium guardian voice chamber. Asset: /public/assets/hudhud-security-guardian.webp */
.onboardingPage .securityGuardianStage{position:relative!important;isolation:isolate;overflow:hidden!important;min-height:clamp(175px,29dvh,270px)!important;background:radial-gradient(ellipse at 50% 42%,#101617,#020303 76%)!important;border:1px solid #535c5c!important;box-shadow:inset 0 0 35px #000,0 0 30px #050c10!important}
.onboardingPage .securityGuardianArt{position:absolute;inset:-10% -4%;z-index:-1;pointer-events:none;background-image:linear-gradient(0deg,#020303ed 0%,#0203032b 50%,#0203037d 100%),url('/assets/hudhud-security-guardian.webp');background-position:center,center 47%;background-repeat:no-repeat;background-size:cover,contain;opacity:.42;filter:saturate(.86);transform:scale(1.05);animation:guardianBreathe 12s ease-in-out infinite alternate}
.onboardingPage .securityGuardianActive .securityGuardianArt{opacity:.72;animation:guardianListen 4s ease-in-out infinite alternate}
.onboardingPage .securityGuardianHeader{position:relative;z-index:2;width:100%;display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:9px;font-weight:700;letter-spacing:.17em;color:#cbd7d0;padding:4px 8px;border-bottom:1px solid #ffffff1f}
.onboardingPage .securityGuardianStatus{color:#b4e8d2;text-shadow:0 0 8px #91edca80}
.onboardingPage .securityGuardianStage .hudhudRecord{z-index:2;box-shadow:0 0 25px #7cdebb44!important;animation:guardianOrbFloat 5s ease-in-out infinite}
.onboardingPage .securityGuardianActive .hudhudRecord{box-shadow:0 0 35px #a3e9d080!important;animation:guardianOrbFloat 2.4s ease-in-out infinite}
@keyframes guardianBreathe{from{transform:scale(1.03) translateY(2px);filter:saturate(.75)}to{transform:scale(1.14) translateY(-8px);filter:saturate(1.2)}}
@keyframes guardianListen{from{transform:scale(1.08);filter:brightness(.85)}to{transform:scale(1.2) translateY(-9px);filter:brightness(1.4)}}
@keyframes guardianOrbFloat{0%,100%{transform:translateY(2px)}50%{transform:translateY(-5px)}}
@media(prefers-reduced-motion:reduce){.onboardingPage .securityGuardianArt,.onboardingPage .securityGuardianStage .hudhudRecord{animation:none!important}}
/* BLACK SECURITY STUDIO: viewport-locked layout, compact controls, HudHud voice focus */
.onboardingPage{height:100dvh!important;min-height:0!important;overflow:hidden!important;background:#020303!important;color:#f2f4f1!important;display:flex!important;align-items:stretch!important;justify-content:center!important;padding:clamp(8px,1.5dvh,16px)!important;box-sizing:border-box!important}
.onboardingPage .onboardingCard{height:100%!important;max-height:100%!important;min-height:0!important;width:min(100%,650px)!important;max-width:650px!important;overflow-y:auto!important;overscroll-behavior:contain;scrollbar-width:none!important;box-sizing:border-box!important;background:linear-gradient(160deg,#080a09,#020303)!important;border:1px solid #46544b!important;border-radius:20px!important;padding:clamp(10px,2dvh,18px)!important;box-shadow:0 16px 60px #000!important}
.onboardingPage .onboardingCard::-webkit-scrollbar{display:none}
.onboardingPage .onboardingCard>.eyebrow{font-size:9px!important;letter-spacing:.17em}
.onboardingPage .onboardingCard>h1{font-size:clamp(19px,3.3dvh,28px)!important;line-height:1.1!important;margin:3px 0!important}
.onboardingPage .lead{font-size:11px!important;line-height:1.3!important;margin:3px 0!important}
.onboardingPage .voiceCard{padding:clamp(7px,1.3dvh,12px)!important;margin:7px 0!important;gap:3px!important;background:radial-gradient(ellipse at 50% 35%,#153327,#050807 70%)!important;border:1px solid #526b5b!important}
.onboardingPage .voiceCard>.eyebrow{font-size:9px!important}
.onboardingPage .hudhudRecord{position:relative;width:clamp(70px,12dvh,110px)!important;height:clamp(70px,12dvh,110px)!important;margin:5px auto!important}
.onboardingPage .hudhudRecord .hudhudHalo{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none}
.onboardingPage .hudhudRecord .hudhudHalo i{position:absolute;top:50%;left:50%;width:3px;height:3px;border-radius:50%;background:#a9f6c5;box-shadow:0 0 9px #b3ffce;animation:secureVoiceParticles 2.5s ease-in-out infinite}
.onboardingPage .hudhudRecord.isListening .hudhudHalo i{animation-duration:.8s}
@keyframes secureVoiceParticles{0%,100%{opacity:.08}50%{opacity:.95}}
.onboardingPage .voiceCard strong{font-size:clamp(14px,2.2dvh,19px)!important}
.onboardingPage .voiceCard p{font-size:10px!important;line-height:1.3!important;margin:2px 0!important}
.onboardingPage .languagePicker{gap:8px!important;margin:5px 0!important}
.onboardingPage .languagePicker button{min-height:36px!important;padding:5px!important;background:#0b100d!important;border-color:#4c5b50!important;color:#eee!important}
.onboardingPage .languagePicker button small{font-size:9px!important}
.onboardingPage .phraseCard{font-size:clamp(13px,2dvh,19px)!important;padding:7px!important;min-height:0!important;margin:5px 0!important;background:#070b09!important;border-color:#3e5445!important}
.onboardingPage .declarationFallback{padding:8px!important;margin:6px 0!important;background:#090e0b!important;border-color:#425347!important}
.onboardingPage .declarationFallback strong{font-size:12px!important}.onboardingPage .declarationFallback p,.onboardingPage .declarationFallback label{font-size:10px!important;line-height:1.35!important;margin:4px 0!important}
.onboardingPage .badgePreview{padding:7px!important;margin:6px 0!important;background:#090d0b!important;border-color:#3f5245!important;gap:6px!important}
.onboardingPage .badgeSeal{display:none!important}
.onboardingPage .badgePreview strong{font-size:13px!important}
.onboardingPage .badgePreview p,.onboardingPage .badgeKicker{font-size:9px!important;margin:2px 0!important}
.onboardingPage .legalScroll{max-height:clamp(44px,7dvh,70px)!important;min-height:44px!important;overflow:auto!important;background:#080b09!important;border-color:#3b5042!important;font-size:10px!important;margin:5px 0!important}
.onboardingPage .transcript{padding:5px!important;margin:5px 0!important}
.onboardingPage .transcript audio{height:30px!important}
@media(max-height:700px){.onboardingPage .badgePreview{display:none!important}.onboardingPage .lead{display:none!important}.onboardingPage .hudhudRecord{width:65px!important;height:65px!important}}
@media(prefers-reduced-motion:reduce){.onboardingPage .hudhudRecord .hudhudHalo i{animation:none!important}}
.onboardingCard{padding-bottom:calc(95px + env(safe-area-inset-bottom))!important}.voiceCard{margin-top:12px!important;padding:clamp(14px,3vw,22px)!important}.hudhudRecord{width:112px!important;height:112px!important;margin:12px auto!important}.hudhudRecord.isListening:before,.hudhudRecord.isListening:after{content:"";position:absolute;inset:-11px;border:1px solid #80ffc2aa;border-radius:50%;pointer-events:none;animation:recordRipple 2.2s ease-out infinite}.hudhudRecord.isListening:after{animation-delay:1.1s}.hudhudRecord.isListening .hudhudCore{animation:recordBeat .7s ease-in-out infinite alternate}.hudhudRecord.isListening .hudhudHalo{animation:recordHalo 1.4s ease-in-out infinite}@keyframes recordRipple{0%{opacity:.9;transform:scale(.88)}100%{opacity:0;transform:scale(1.5)}}@keyframes recordBeat{to{transform:scale(1.09)}}@keyframes recordHalo{50%{opacity:.8;transform:rotate(18deg)}}@media(prefers-reduced-motion:reduce){.hudhudRecord.isListening:before,.hudhudRecord.isListening:after,.hudhudRecord.isListening .hudhudCore,.hudhudRecord.isListening .hudhudHalo{animation:none!important}}

.hudhudRecord{display:grid;place-items:center;position:relative;width:124px;height:124px;border-radius:50%;margin:20px auto 18px;border:1px solid rgba(195,220,173,.5);background:radial-gradient(circle at 40% 35%,#1c3928,#09160f 70%);color:#d8e9bd;cursor:pointer;box-shadow:0 12px 40px #0008;transition:transform .4s,box-shadow .4s}.hudhudRecord:hover{transform:translateY(-3px)}.hudhudHalo{position:absolute;inset:8px;border:1px solid #b5d5a755;border-radius:50%;display:grid;place-items:center;font-size:50px;opacity:.35}.hudhudCore{position:relative;font-size:43px}.hudhudRecord.isListening{animation:hudhudPulse 2.1s ease-in-out infinite}.hudhudRecord.isVerified{box-shadow:0 0 42px #39dd7780;border-color:#65f3a2;background:radial-gradient(circle,#207d4a,#0b2116)}@keyframes hudhudPulse{0%,100%{box-shadow:0 0 0 0 #5fe89a22,0 0 18px #53b87a33}50%{box-shadow:0 0 0 15px #5fe89a05,0 0 42px #4ce58b70}}@media(prefers-reduced-motion:reduce){.hudhudRecord{animation:none!important;transition:none!important}}.declarationFallback{padding:19px;border:1px solid #537353;border-radius:17px;background:linear-gradient(125deg,#13251a,#0a120e);margin:14px 0}.declarationFallback>strong{display:block;color:#d8e9bd}.declarationFallback p{color:#a8bcae;font-size:12px;line-height:1.65}.declarationFallback label{display:flex;align-items:flex-start;gap:12px;font-size:13px;line-height:1.6;cursor:pointer}.declarationFallback input{width:20px;height:20px;flex-shrink:0;accent-color:#c8e7b5}.declarationFallback small{display:block;color:#b9d9b7;margin-top:12px}.legalScroll{height:40px;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin;padding:10px 12px;border:1px solid #3b4a3f;border-radius:9px;background:#080e0a;color:#d9e0d9;font-size:11px;line-height:1.6}.legalScroll strong{display:block;color:#f3f5f2;font-size:11px;margin:4px 0}.legalScroll p{margin:5px 0 12px}.legalScroll:focus-visible{outline:2px solid #d6e7b8;outline-offset:2px}.badgePreview{display:flex;align-items:center;gap:15px;margin:17px 0 10px;padding:17px;border:1px solid #52604c;border-radius:17px;background:linear-gradient(120deg,#172017,#0a110d);box-shadow:inset 0 0 24px rgba(220,227,196,.05)}.badgeSeal{width:66px;height:66px;flex-shrink:0;border-radius:50%;display:grid;place-items:center;border:3px double #d8d4b2;background:radial-gradient(circle at 30% 20%,#fff9df,#bcb899 42%,#56594e 100%);color:#242820;font-size:33px;box-shadow:0 0 18px rgba(228,220,172,.22)}.badgePreview strong{display:block;color:#f3f0df;font-size:16px;margin:4px 0}.badgeKicker{font-size:9px;letter-spacing:.13em;color:#b9c3ad;font-weight:850}.badgePreview p{font-size:11px;color:#b2bdb2;line-height:1.5;margin:4px 0 0}.badgeStatus{font-size:10px;color:#d8e9bd;white-space:nowrap;margin-left:auto}@media(max-width:600px){.badgePreview{flex-wrap:wrap}.badgeStatus{margin-left:0}}.termsConsent{display:flex;align-items:flex-start;gap:12px;margin:15px 0 8px;color:#cbd6cd;font-size:12px;line-height:1.6;cursor:pointer}.termsConsent input{width:18px;height:18px;flex-shrink:0;accent-color:#d6e7b8;margin-top:1px}.termsConsent a{color:#f4f7f4;text-decoration:underline;text-underline-offset:3px} .onboardingPage{min-height:100vh;background:#050805;color:#f4f7f4;display:grid;place-items:center;padding:24px}.onboardingCard{width:min(760px,100%);border:1px solid #1d2921;background:radial-gradient(circle at 85% 10%,rgba(132,174,116,.13),transparent 35%),linear-gradient(145deg,#0d140f,#070b08);border-radius:28px;padding:34px;box-shadow:0 30px 100px rgba(0,0,0,.45)}.eyebrow{font-size:10px;letter-spacing:.16em;color:#94ad91;font-weight:850}.onboardingCard h1{font-size:42px;letter-spacing:-.06em;margin:12px 0 8px}.lead{color:#89968d;line-height:1.65;font-size:14px;max-width:610px}.steps{display:flex;align-items:center;gap:10px;margin-bottom:26px;color:#657269;font-size:10px}.steps .active{color:#d8e9bd;font-weight:850}.steps i{font-style:normal;color:#4b5a50}.languagePicker{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:20px 0 12px}.languagePicker button{border:1px solid #29372e;background:#0a100c;color:#aab7ae;border-radius:14px;padding:12px;cursor:pointer;font-weight:850}.languagePicker button.selected{border-color:#a9c890;background:#132016;color:#d8e9bd;box-shadow:0 0 20px rgba(169,200,144,.08)}.languagePicker small{display:block;color:#6f7c73;font-size:9px;margin-top:3px}.phraseCard{border:1px solid #35453a;background:#09100b;border-radius:16px;padding:18px;text-align:center;color:#e6f0e5;font-size:18px;line-height:1.8}.voiceCard{margin:16px 0;border:1px solid #29372e;border-radius:22px;padding:24px;background:#0a100c;text-align:center}.mic{width:68px;height:68px;border-radius:50%;margin:0 auto 12px;display:grid;place-items:center;background:#152017;border:1px solid #3c4d3e;color:#d8e9bd;font-size:28px}.mic.listening{box-shadow:0 0 0 10px rgba(148,183,129,.08),0 0 30px rgba(148,183,129,.22)}.voiceCard strong{font-size:18px}.voiceCard p{color:#829087;font-size:12px;line-height:1.6;max-width:560px;margin:10px auto 18px}.continue{width:100%;border:0;border-radius:12px;padding:13px;background:#d6e7b8;color:#071008;font-weight:850;cursor:pointer}.continue:disabled{opacity:.45;cursor:not-allowed}.continue.secondary{margin-top:10px;background:#132016;color:#d8e9bd;border:1px solid #3a4c3d}.transcript{margin-top:15px;text-align:left;border:1px solid #26342b;border-radius:12px;padding:11px}.transcript small{display:block;color:#6f7c73;font-size:9px;text-transform:uppercase;letter-spacing:.12em}.transcript span{display:block;color:#dce7df;font-size:11px;margin-top:5px}.genderGrid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:26px 0}.genderCard{background:#0a100c;border:1px solid #253128;border-radius:20px;padding:16px;color:#eaf0eb;text-align:left;cursor:pointer;transition:.2s}.genderCard:hover,.genderCard.selected{border-color:#a9c890;transform:translateY(-2px)}.genderCard img{display:block;width:100%;aspect-ratio:1/1;object-fit:cover;object-position:center 58%;background:#000;border:2px solid #2f3d32;border-radius:50%;margin-bottom:13px;overflow:hidden}.genderCard strong{display:block;font-size:16px}.genderCard span{display:block;color:#76837a;font-size:10px;margin-top:5px}.fine{display:block;text-align:center;color:#657269;font-size:10px;margin-top:11px}.error{color:#ffbcbc;font-size:11px;margin:10px 0}.success{color:#cce7c2;font-size:11px;margin:10px 0}@media(max-width:620px){.onboardingCard{padding:22px}.onboardingCard h1{font-size:34px}.genderGrid{grid-template-columns:1fr}.phraseCard{font-size:16px}}
 .onboardingPage{position:fixed;inset:0;height:100dvh;min-height:0;overflow:hidden;overscroll-behavior:none;padding:calc(env(safe-area-inset-top) + 12px) 12px calc(env(safe-area-inset-bottom) + 12px);background:radial-gradient(ellipse at 50% 0%,#10251b,#020604 68%)}.onboardingCard{width:min(720px,100%);height:100%;min-height:0;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin;border:1px solid #b9a77c77;border-radius:25px;background:linear-gradient(145deg,#10231acb,#050d09f5);box-shadow:inset 0 1px #dfd5a72a,0 20px 60px #0008;padding:clamp(14px,3vw,26px)}.onboardingCard h1{font-size:clamp(25px,5vw,38px);margin:9px 0 4px}.lead{margin:4px 0 10px;font-size:12px;line-height:1.5}.languagePicker{margin:11px 0 8px}.languagePicker button{padding:9px}.phraseCard{padding:12px;font-size:clamp(14px,3vw,18px)}.voiceCard{margin:10px 0;padding:14px 12px;border-color:#adbb9d5e;background:linear-gradient(150deg,#10231a,#060e09)}.hudhudRecord{width:90px;height:90px;margin:10px auto 8px;touch-action:manipulation}.hudhudCore img{width:69px;height:69px;object-fit:contain;filter:drop-shadow(0 0 12px #54d9ac55)}.voiceCard p{margin:6px auto 9px}.shahadaVisionHint{display:grid;gap:4px;text-align:left;width:100%;margin:9px 0;padding:11px 13px;border:1px solid #b4c89088;border-radius:15px;background:linear-gradient(120deg,#163d2d,#0a1d14);color:#e6eac8;box-shadow:0 0 22px #6da87520;cursor:pointer;animation:shahadaHintIn .35s ease both}.shahadaVisionHint>span{font-size:9px;letter-spacing:.13em;color:#d8c48c}.shahadaVisionHint strong{font-size:13px}.shahadaVisionHint small{font-size:11px;line-height:1.45;color:#c7d8c5}@keyframes shahadaHintIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}.declarationFallback{margin:10px 0;padding:13px}.badgePreview{padding:12px;margin:12px 0}.legalScroll{height:70px}@media(max-width:620px){.onboardingPage{padding:calc(env(safe-area-inset-top) + 8px) 8px calc(env(safe-area-inset-bottom) + 8px)}.onboardingCard{padding:14px}.genderGrid{grid-template-columns:1fr 1fr;gap:8px}.genderCard{padding:9px}}@media(prefers-reduced-motion:reduce){.shahadaVisionHint{animation:none}}\n `}</style><style jsx global>{`body:has(.onboardingPage){overflow:hidden!important}body:has(.onboardingPage) .hudhudFloatingOrb,body:has(.onboardingPage) .hudhudTopOrb{display:none!important}`}</style></main>;
}
