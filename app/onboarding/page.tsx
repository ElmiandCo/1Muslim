"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";

type Language = "ar" | "en";
type SpeechRecognitionLike = {
  lang: string; continuous: boolean; interimResults: boolean;
  start: () => void; stop: () => void;
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
    ["bear witness", "testify"],
    ["deity", "god"],
    ["worthy", "worship"],
    ["except"],
    ["allah"],
    ["muhammad"],
    ["messenger"],
  ];
  const hits = groups.filter(group => group.some(word => t.includes(word))).length;
  return hits >= 6 && t.length >= 35;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<"shahada" | "gender">("shahada");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [language, setLanguage] = useState<Language>("ar");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [verified, setVerified] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    (async () => {
      const s = createClient();
      const { data: { user } } = await s.auth.getUser();
      if (!user) { router.replace("/auth"); return; }
      const { data: p } = await s.from("profiles").select("gender,shahada_verified_at,shahada_language").eq("id", user.id).single();
      if (p?.gender && p?.shahada_verified_at) { router.replace("/"); return; }
      if (p?.shahada_verified_at) setStep("gender");
      if (p?.shahada_language === "en" || p?.shahada_language === "ar") setLanguage(p.shahada_language);
      setChecking(false);
    })();
  }, [router]);

  const stopMedia = () => {
    recognitionRef.current?.stop();
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    setListening(false);
    setRecording(false);
  };

  const startShahada = async () => {
    setMessage(""); setTranscript(""); setVerified(false); setAudioBlob(null);
    const W = window as any;
    const SR = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (!SR) {
      setMessage("Voice verification is not supported in this browser. Please use Safari or Chrome with microphone speech recognition enabled.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      recorder.onstop = () => {
        setAudioBlob(new Blob(chunks, { type: mime }));
        setRecording(false);
        stream.getTracks().forEach(track => track.stop());
      };
      recorderRef.current = recorder;

      const rec = new SR() as SpeechRecognitionLike;
      rec.lang = language === "ar" ? "ar-SA" : "en-US";
      rec.continuous = false;
      rec.interimResults = false;
      rec.onresult = (event: any) => {
        const text = event.results?.[0]?.[0]?.transcript ?? "";
        setTranscript(text);
        if (verifyTranscript(text, language)) {
          setVerified(true);
          setMessage("Shahada recognized. Your voice recording is ready for the private Safe Vault.");
        } else {
          setMessage("That doesn't match the Shahada closely enough. Please say the displayed Shahada clearly and try again.");
        }
      };
      rec.onerror = () => {
        setListening(false); setRecording(false);
        if (recorderRef.current?.state === "recording") recorderRef.current.stop();
        setMessage("We couldn't capture the Shahada. Check microphone permission and try again.");
      };
      rec.onend = () => {
        setListening(false);
        if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      };

      recognitionRef.current = rec;
      recorder.start();
      setRecording(true);
      setListening(true);
      rec.start();
    } catch {
      setMessage("Microphone permission is required for Shahada verification.");
    }
  };

  const finish = async () => {
    if (!gender) { setMessage("Please select a gender to continue."); return; }
    if (!verified || !audioBlob) { setMessage("Complete the Shahada verification first."); setStep("shahada"); return; }

    setSaving(true); setMessage("");
    const s = createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!user) { router.replace("/auth"); return; }

    const path = `${user.id}/shahada-${Date.now()}.webm`;
    const upload = await s.storage.from("shahada-safe-vault").upload(path, audioBlob, { contentType: audioBlob.type || "audio/webm", upsert: false });
    if (upload.error) { setMessage(upload.error.message); setSaving(false); return; }

    const { data: existing } = await s.from("profiles").select("gender,avatar_gender,avatar_config").eq("id", user.id).single();
    const selectedGender = gender || existing?.gender || "";
    if (!selectedGender) { setMessage("Please select a gender to continue."); setSaving(false); return; }

    const { error } = await s.from("profiles").update({
      shahada_audio_path: path,
      shahada_audio_recorded_at: new Date().toISOString(),
      shahada_language: language,
      shahada_verified_at: new Date().toISOString(),
      shahada_verification_method: "speech-recognition-semantic-match",
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

    if (error) { setMessage(error.message); setSaving(false); return; }
    router.replace("/");
  };

  if (checking) return <main className="onboardingPage"><section className="onboardingCard"><span className="eyebrow">1MUSLIM</span><h1>Preparing your profile…</h1></section></main>;

  return <main className="onboardingPage"><section className="onboardingCard">
    <div className="steps"><span className={step === "shahada" ? "active" : ""}>1 Shahada</span><i>→</i><span className={step === "gender" ? "active" : ""}>2 Profile</span></div>
    {step === "shahada" ? <>
      <span className="eyebrow">COMMUNITY VERIFICATION</span>
      <h1>Say the Shahada.</h1>
      <p className="lead">Choose your language, then say the Shahada aloud. Speech recognition checks whether what you said matches the required statement. A private recording is stored in your Safe Vault.</p>
      <div className="languagePicker">
        <button className={language === "ar" ? "selected" : ""} onClick={() => { stopMedia(); setLanguage("ar"); setVerified(false); setMessage(""); }}>العربية <small>Arabic</small></button>
        <button className={language === "en" ? "selected" : ""} onClick={() => { stopMedia(); setLanguage("en"); setVerified(false); setMessage(""); }}>English <small>English</small></button>
      </div>
      <div className="phraseCard" dir={language === "ar" ? "rtl" : "ltr"}>{SHAHADA[language]}</div>
      <div className="voiceCard">
        <div className={listening ? "mic listening" : "mic"}>◉</div>
        <strong>{recording ? "Recording securely…" : listening ? "Listening…" : "Voice Shahada"}</strong>
        <p>Say the statement above naturally and clearly. Different accents are okay; saying something unrelated is not.</p>
        <button className="continue" onClick={() => void startShahada()} disabled={listening || recording}>{recording ? "Recording securely…" : listening ? "Listening…" : "Record Shahada"}</button>
        {transcript && <div className="transcript" dir={language === "ar" ? "rtl" : "ltr"}><small>Speech recognition heard</small><span>{transcript}</span></div>}
      </div>
      {message && <div className={verified ? "success" : "error"}>{message}</div>}
      <div className="badgePreview"><div className="badgeSeal" aria-hidden="true">✦</div><div><span className="badgeKicker">YOUR FIRST 1MUSLIM BADGE</span><strong>Shahada Verified</strong><p>Earn this badge after completing your Shahada verification and profile setup. It will appear on your public profile.</p></div><span className="badgeStatus">{verified ? "✓ Verified" : "🔒 Unlock"}</span></div>
      <div className="legalScroll" role="region" aria-label="Terms and conditions" tabIndex={0}><strong>1Muslim · Terms &amp; Conditions</strong><p>1Muslim is a faith-centered platform supporting Muslim communities, Islamic education, and connections consistent with Islamic principles.</p><p>Our commitment to Islam does not constitute hostility toward any other religion, belief system, or individual. We respect the dignity of people of all religious backgrounds, including those with no religion.</p><strong>Protection of Islamic Values</strong><p>1Muslim may establish and enforce standards for content, conduct, programming, and participation consistent with applicable law. We may prioritize Islamic education, worship, and community development, and are not required to endorse every religious or philosophical viewpoint.</p><strong>Religious Discussions and Differences</strong><p>Respectful theological discussions, comparative religion, scholarly disagreements, and criticism of religious ideas may be permitted. Harassment, threats, targeted abuse, incitement to violence, and dehumanizing treatment are prohibited. Disagreement with a religious belief is not, by itself, harassment or discrimination.</p><strong>Content Moderation</strong><p>1Muslim may review, restrict, remove, or decline to feature content conflicting with published community standards, subject to applicable law. Decisions should follow documented standards rather than hostility toward a person's religious identity.</p><strong>Our Guiding Principle</strong><p>1Muslim exists to preserve, celebrate, and strengthen Muslim identity—not to attack or diminish the dignity of others.</p></div><label className="termsConsent"><input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} required /><span>I have read and agree to the Terms &amp; Conditions above.</span></label>
      <button className="continue secondary" disabled={!verified || !acceptedTerms} onClick={() => setStep("gender")}>Continue to profile →</button>
      <small className="fine">Your audio stays private in the Safe Vault. The public profile only shows the Shahada Verified badge.</small>
    </> : <>
      <span className="eyebrow">WELCOME TO 1MUSLIM</span><h1>Choose your profile.</h1><p className="lead">Select your gender once. This sets your default profile avatar and stays fixed after setup.</p>
      <div className="genderGrid"><button className={gender === "male" ? "genderCard selected" : "genderCard"} onClick={() => setGender("male")}><img src="/assets/avatars/default-male.jpg" alt="" /><strong>Male</strong><span>Use the male default avatar</span></button><button className={gender === "female" ? "genderCard selected" : "genderCard"} onClick={() => setGender("female")}><img src="/assets/avatars/Default-women.png" alt="" /><strong>Female</strong><span>Use the female default avatar</span></button></div>
      {message && <div className="error">{message}</div>}<button className="continue" onClick={() => void finish()} disabled={saving}>{saving ? "Saving…" : "Enter 1Muslim →"}</button><small className="fine">Gender is selected once during onboarding and cannot be changed.</small>
    </>}
  </section><style jsx>{`
.legalScroll{height:40px;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin;padding:10px 12px;border:1px solid #3b4a3f;border-radius:9px;background:#080e0a;color:#d9e0d9;font-size:11px;line-height:1.6}.legalScroll strong{display:block;color:#f3f5f2;font-size:11px;margin:4px 0}.legalScroll p{margin:5px 0 12px}.legalScroll:focus-visible{outline:2px solid #d6e7b8;outline-offset:2px}.badgePreview{display:flex;align-items:center;gap:15px;margin:17px 0 10px;padding:17px;border:1px solid #52604c;border-radius:17px;background:linear-gradient(120deg,#172017,#0a110d);box-shadow:inset 0 0 24px rgba(220,227,196,.05)}.badgeSeal{width:66px;height:66px;flex-shrink:0;border-radius:50%;display:grid;place-items:center;border:3px double #d8d4b2;background:radial-gradient(circle at 30% 20%,#fff9df,#bcb899 42%,#56594e 100%);color:#242820;font-size:33px;box-shadow:0 0 18px rgba(228,220,172,.22)}.badgePreview strong{display:block;color:#f3f0df;font-size:16px;margin:4px 0}.badgeKicker{font-size:9px;letter-spacing:.13em;color:#b9c3ad;font-weight:850}.badgePreview p{font-size:11px;color:#b2bdb2;line-height:1.5;margin:4px 0 0}.badgeStatus{font-size:10px;color:#d8e9bd;white-space:nowrap;margin-left:auto}@media(max-width:600px){.badgePreview{flex-wrap:wrap}.badgeStatus{margin-left:0}}.termsConsent{display:flex;align-items:flex-start;gap:12px;margin:15px 0 8px;color:#cbd6cd;font-size:12px;line-height:1.6;cursor:pointer}.termsConsent input{width:18px;height:18px;flex-shrink:0;accent-color:#d6e7b8;margin-top:1px}.termsConsent a{color:#f4f7f4;text-decoration:underline;text-underline-offset:3px} .onboardingPage{min-height:100vh;background:#050805;color:#f4f7f4;display:grid;place-items:center;padding:24px}.onboardingCard{width:min(760px,100%);border:1px solid #1d2921;background:radial-gradient(circle at 85% 10%,rgba(132,174,116,.13),transparent 35%),linear-gradient(145deg,#0d140f,#070b08);border-radius:28px;padding:34px;box-shadow:0 30px 100px rgba(0,0,0,.45)}.eyebrow{font-size:10px;letter-spacing:.16em;color:#94ad91;font-weight:850}.onboardingCard h1{font-size:42px;letter-spacing:-.06em;margin:12px 0 8px}.lead{color:#89968d;line-height:1.65;font-size:14px;max-width:610px}.steps{display:flex;align-items:center;gap:10px;margin-bottom:26px;color:#657269;font-size:10px}.steps .active{color:#d8e9bd;font-weight:850}.steps i{font-style:normal;color:#4b5a50}.languagePicker{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:20px 0 12px}.languagePicker button{border:1px solid #29372e;background:#0a100c;color:#aab7ae;border-radius:14px;padding:12px;cursor:pointer;font-weight:850}.languagePicker button.selected{border-color:#a9c890;background:#132016;color:#d8e9bd;box-shadow:0 0 20px rgba(169,200,144,.08)}.languagePicker small{display:block;color:#6f7c73;font-size:9px;margin-top:3px}.phraseCard{border:1px solid #35453a;background:#09100b;border-radius:16px;padding:18px;text-align:center;color:#e6f0e5;font-size:18px;line-height:1.8}.voiceCard{margin:16px 0;border:1px solid #29372e;border-radius:22px;padding:24px;background:#0a100c;text-align:center}.mic{width:68px;height:68px;border-radius:50%;margin:0 auto 12px;display:grid;place-items:center;background:#152017;border:1px solid #3c4d3e;color:#d8e9bd;font-size:28px}.mic.listening{box-shadow:0 0 0 10px rgba(148,183,129,.08),0 0 30px rgba(148,183,129,.22)}.voiceCard strong{font-size:18px}.voiceCard p{color:#829087;font-size:12px;line-height:1.6;max-width:560px;margin:10px auto 18px}.continue{width:100%;border:0;border-radius:12px;padding:13px;background:#d6e7b8;color:#071008;font-weight:850;cursor:pointer}.continue:disabled{opacity:.45;cursor:not-allowed}.continue.secondary{margin-top:10px;background:#132016;color:#d8e9bd;border:1px solid #3a4c3d}.transcript{margin-top:15px;text-align:left;border:1px solid #26342b;border-radius:12px;padding:11px}.transcript small{display:block;color:#6f7c73;font-size:9px;text-transform:uppercase;letter-spacing:.12em}.transcript span{display:block;color:#dce7df;font-size:11px;margin-top:5px}.genderGrid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:26px 0}.genderCard{background:#0a100c;border:1px solid #253128;border-radius:20px;padding:16px;color:#eaf0eb;text-align:left;cursor:pointer;transition:.2s}.genderCard:hover,.genderCard.selected{border-color:#a9c890;transform:translateY(-2px)}.genderCard img{display:block;width:100%;aspect-ratio:1/1;object-fit:cover;object-position:center 58%;background:#000;border:2px solid #2f3d32;border-radius:50%;margin-bottom:13px;overflow:hidden}.genderCard strong{display:block;font-size:16px}.genderCard span{display:block;color:#76837a;font-size:10px;margin-top:5px}.fine{display:block;text-align:center;color:#657269;font-size:10px;margin-top:11px}.error{color:#ffbcbc;font-size:11px;margin:10px 0}.success{color:#cce7c2;font-size:11px;margin:10px 0}@media(max-width:620px){.onboardingCard{padding:22px}.onboardingCard h1{font-size:34px}.genderGrid{grid-template-columns:1fr}.phraseCard{font-size:16px}}
 `}</style></main>;
}
