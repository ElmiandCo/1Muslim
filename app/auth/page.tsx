"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../utils/supabase/client";
import SiteNav from "../components/SiteNav";
import Link from "next/link";
import Image from "next/image";
import RisingEnergyOrbs from "../components/RisingEnergyOrbs";
import homeStyles from "../home-hub.module.css";
import CelestialOrb from "../components/CelestialOrb";
import AdmissionJourney from "../components/AdmissionJourney";

const safeNext = () => { const p=new URLSearchParams(window.location.search).get("next"); return p?.startsWith("/")&&!p.startsWith("//")&&!p.startsWith("/\\\\") ? p : "/"; };
const safeMethod = () => { const m = new URLSearchParams(window.location.search).get("method"); return m === "declaration" || m === "type" ? "declaration" : "audio"; };

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [voiceAttempts,setVoiceAttempts]=useState<number|null>(null);
  useEffect(()=>{try{setVoiceAttempts(Math.max(0,Number(localStorage.getItem("1muslim:shahada-voice-attempts"))||0))}catch{setVoiceAttempts(0)}},[]);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isShahadaSignup, setIsShahadaSignup] = useState(true);
  const [method,setMethod]=useState<"audio"|"type"|"declaration">("audio");
  const [affirmed,setAffirmed]=useState(false);
  const [day,setDay]=useState(false);
  const [themeMode,setThemeMode]=useState<"day"|"night"|"auto">("night");
  const [approved,setApproved]=useState(false);
  const [signupStep,setSignupStep]=useState<1|2|3>(1);
  const [microphoneStatus,setMicrophoneStatus]=useState<"idle"|"available"|"denied"|"unavailable">("idle");
  const [emailLogin,setEmailLogin]=useState(false);
  const [visionVisible,setVisionVisible]=useState(true);
  const [entryStage,setEntryStage]=useState<"welcome"|"membership"|"guest"|"auth">("welcome");
  const [entryReady,setEntryReady]=useState(false);
  useEffect(()=>{const timer=window.setTimeout(()=>setEntryReady(true),5000);return()=>window.clearTimeout(timer)},[]);


  useEffect(() => {
    // First-time guests see the real homepage before a sign-in screen.
    // Explicit sign-in, signup, OAuth and protected-route redirects remain available.
    const params=new URLSearchParams(window.location.search);
    const explicit=params.has("next")||params.has("shahada")||params.has("method")||params.has("login")||params.has("error");
    try {
      if(!explicit&&sessionStorage.getItem("1muslim:homepage-visited-v1")!=="yes"){
        window.location.replace("/");
      }
    } catch {}
  },[]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("shahada") === "1") setIsShahadaSignup(true);
    const stored=localStorage.getItem("1muslim-theme-mode");
    const mode=stored==="day"||stored==="night"||stored==="auto"?stored:"night";
    setThemeMode(mode);
    setDay(mode==="auto"?window.matchMedia("(prefers-color-scheme: light)").matches:mode==="day");
    if (new URLSearchParams(window.location.search).get("error")) {
      setMessage("Sign-in could not be completed. Please try again.");
    }
  }, []);

  const visionStep = isShahadaSignup ? signupStep : (emailLogin ? 2 : 1);
  const visionLabel = isShahadaSignup ? (signupStep===1?"Choose Voice or Touch":signupStep===2?"Create your secure account":"Confirm your email") : (emailLogin ? "Enter your account details" : "Choose how to continue");
  useEffect(()=>{setVisionVisible(true);const hide=window.setTimeout(()=>setVisionVisible(false),4800);const cycle=window.setInterval(()=>{setVisionVisible(true);window.setTimeout(()=>setVisionVisible(false),2400)},7200);return()=>{window.clearTimeout(hide);window.clearInterval(cycle)}},[visionStep,isShahadaSignup,method]);
  const chooseTheme=(mode:"day"|"night"|"auto")=>{setThemeMode(mode);localStorage.setItem("1muslim-theme-mode",mode);const next=mode==="auto"?window.matchMedia("(prefers-color-scheme: light)").matches:mode==="day";setDay(next);localStorage.setItem("1muslim-theme",next?"light":"dark");window.dispatchEvent(new Event("1muslim:theme-changed"))};
  useEffect(()=>{if(themeMode!=="auto")return;const media=window.matchMedia("(prefers-color-scheme: light)");const update=()=>setDay(media.matches);media.addEventListener("change",update);return()=>media.removeEventListener("change",update)},[themeMode]);

  const signupWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!affirmed){setMessage("Choose and affirm your Shahada method to continue.");return;}
    try{const C=window.AudioContext;if(C){const ctx=new C();const o=ctx.createOscillator();const g=ctx.createGain();o.frequency.value=660;g.gain.setValueAtTime(.025,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.28);o.connect(g).connect(ctx.destination);o.start();o.stop(ctx.currentTime+.28);setTimeout(()=>ctx.close(),500)}}catch{}
    if(password.length < 8){setMessage("Choose a password with at least 8 characters.");return;}
    setLoading(true);setMessage("");
    const {data,error}=await createClient().auth.signUp({email:email.trim().toLowerCase(),password,options:{emailRedirectTo:`${window.location.origin}/auth/callback?next=${encodeURIComponent("/onboarding?method="+(method==="audio"?"audio":"declaration"))}`}});
    setLoading(false);
    if(error){setMessage(error.message);return;}
    if(data.session){setApproved(true);setSignupStep(3);window.location.assign("/onboarding?method="+(method==="audio"?"audio":"declaration"));return;}
    setApproved(true);setSignupStep(3);setMessage("Check your email for a confirmation link. After verification, you will continue to Shahada onboarding.");
  };

  const signInWithEmail = async(e:React.FormEvent)=>{e.preventDefault();setLoading(true);setMessage("");const {error}=await createClient().auth.signInWithPassword({email:email.trim(),password});setLoading(false);if(error){setMessage("Sign-in failed. Check your email and password.");return}window.location.assign(safeNext())};

  const signInWithGoogle = async () => {
    setLoading(true);
    setMessage("");
    const destination = isShahadaSignup ? "/onboarding?method=" + safeMethod() : safeNext();
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", destination);
    const expectedOrigin = callback.origin;

    // Do not let Supabase silently fall back to its production Site URL.
    // Inspect the generated OAuth authorization URL before leaving this host.
    const { data, error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback.toString(), skipBrowserRedirect: true },
    });
    if (error || !data?.url) {
      setLoading(false);
      setMessage(error?.message || "Could not start Google sign-in.");
      return;
    }
    try {
      const authorize = new URL(data.url);
      const returnUrl = authorize.searchParams.get("redirect_to");
      if (!returnUrl || new URL(returnUrl).origin !== expectedOrigin ||
          new URL(returnUrl).pathname !== "/auth/callback") {
        setLoading(false);
        setMessage("Preview sign-in was blocked to prevent a redirect to production. Check the Supabase Auth redirect allowlist for this exact preview callback URL.");
        return;
      }
      window.location.assign(data.url);
    } catch {
      setLoading(false);
      setMessage("Unable to verify the sign-in callback destination.");
    }
  };

  const embedded=typeof window!=="undefined"&&new URLSearchParams(window.location.search).has("embedded");
  if(entryStage!=="auth")return <main className={"authPreview "+(day?"authPreviewDay":"")+" authEntryShell"+(embedded?" authEntryEmbedded":"")}>
    <div className="authHomeBackdrop" aria-hidden="true"><div className="authHomeNight"/><div className="authHomeDay"/><div className="authHomeShade"/></div>
    <section className={"authEntryCard "+(entryReady?"authEntryReady":"")} aria-label="1Muslim welcome">
      <span className="authEntryEyebrow">✦ 1MUSLIM · WELCOME</span>
      <div className="authEntryMark" aria-hidden="true">۞</div>
      {entryStage==="welcome"?<><h1>As-salāmu ʿalaykum</h1><p>Your place to connect, learn, and reflect.</p><div className="authEntryActions"><button type="button" onClick={()=>{setIsShahadaSignup(false);setEntryStage("auth")}}>Sign In →</button><button type="button" onClick={()=>setEntryStage("membership")}>Not a Member ✦</button></div></>:
       entryStage==="membership"?<><h1>Are you Muslim?</h1><p>Choose the path that fits you.</p><div className="authEntryActions"><button type="button" onClick={()=>{setIsShahadaSignup(true);setEntryStage("auth")}}>Yes · Sign Up →</button><button type="button" onClick={()=>setEntryStage("guest")}>No · Explore as Guest</button></div></>:
       <><h1>You're welcome here.</h1><p>Explore public Qur'an, lessons, and livestreams. Posting, comments, and messaging are for members.</p><div className="authEntryActions"><button type="button" onClick={()=>window.location.assign("/")}>Explore 1Muslim →</button><button type="button" onClick={()=>setEntryStage("membership")}>← Back</button></div><small>One-day guest access and the dedicated introduction to Islam are coming soon. Public browsing is available now.</small></>}
      {entryStage!=="welcome"&&entryStage!=="guest"&&<button className="authEntryBack" type="button" onClick={()=>setEntryStage("welcome")}>← Back</button>}
      <button className="authEntryHome" type="button" onClick={()=>window.location.assign("/")}>✕ <span className="sr-only">Return home</span></button>
    </section>
    <style>{`
      .authEntryShell{display:grid!important;place-items:center!important;min-height:100dvh!important;padding:clamp(15px,4vw,35px)!important;overflow:hidden!important}
      .authEntryCard{position:relative;z-index:3;display:flex;flex-direction:column;align-items:center;text-align:center;justify-content:center;gap:15px;width:min(100%,490px);min-height:340px;padding:clamp(25px,5vw,42px);border:1px solid rgba(238,212,157,.63);border-radius:32px;background:linear-gradient(145deg,rgba(6,58,46,.84),rgba(5,39,34,.73));backdrop-filter:blur(22px);box-shadow:0 30px 80px #001b1590,inset 0 1px #fff3;color:#f9eed7;opacity:0;transform:translateY(13px) scale(.985);transition:opacity 1s ease,transform 1s ease}
      .authEntryReady{opacity:1;transform:none}
      .authEntryEyebrow{font-size:11px;font-weight:750;letter-spacing:.2em;color:#e8ce91}
      .authEntryMark{font-size:65px;color:#ebd394;text-shadow:0 0 35px #e2c47d88;line-height:1}
      .authEntryCard h1{margin:0;font-size:clamp(25px,5vw,38px);font-family:Georgia,serif;font-weight:600}
      .authEntryCard p{max-width:340px;margin:0;color:#d2e4d6;line-height:1.5;font-size:14px}
      .authEntryActions{display:grid;gap:10px;width:100%;margin-top:14px}
      .authEntryActions button{min-height:51px;border:1px solid #d8c78e;border-radius:18px;background:linear-gradient(110deg,#c1e8c0,#e7d39e);color:#103a2b;font-size:15px;font-weight:800;cursor:pointer}
      .authEntryActions button+button{background:rgba(9,58,45,.76);color:#f4e4b8}
      .authEntryBack{border:0;background:none;color:#e8d8b4;cursor:pointer;padding:9px}
      .authEntryHome{position:absolute;top:13px;right:13px;border:1px solid #d8c78e77;border-radius:50%;width:38px;height:38px;background:#12493e;color:#f6dfb0;cursor:pointer}
      .authEntryCard small{font-size:11px;line-height:1.5;color:#c7d7cb}
      @media(prefers-reduced-motion:reduce){.authEntryCard{transition:none;transform:none}}
    `}</style>
    <style>{`
      .authEntryEmbedded{background:transparent!important;min-height:100%!important;height:100dvh!important;padding:8px!important}
      .authEntryEmbedded .authHomeBackdrop{display:none!important}
      .authEntryEmbedded .authEntryCard{max-height:100%;min-height:0;overflow-y:auto;scrollbar-width:thin;box-shadow:0 14px 35px #001e163b}
      @media(max-width:600px){.authEntryEmbedded .authEntryCard{padding:22px 16px;border-radius:22px}}
    `}</style>
  </main>;
  return <main className={"authPreview "+(day?"authPreviewDay":"")+(isShahadaSignup?" authShahada":"")+(typeof window!=="undefined"&&new URLSearchParams(window.location.search).has("embedded")?" authEmbedded":"")}><RisingEnergyOrbs tone="blue" density="ambient"/><div className="authHomeBackdrop" aria-hidden="true"><div className="authHomeNight"/><div className="authHomeDay"/><div className="authHomeShade"/></div><div className="authOrbit authOrbitOne"/><div className="authOrbit authOrbitTwo"/><section className={"authGlass "+(isShahadaSignup?"visionShahada ":"visionLogin ")+(visionStep===2?"visionSecond":"visionFirst") } aria-label="1Muslim account">{isShahadaSignup&&<div className="shahadaCinematicHero" aria-label="HudHud protects your secure Shahada journey"><div className="shahadaHeroHalo" aria-hidden="true"/><div className="shahadaHeroGuardian" aria-hidden="true"><Image src="/assets/hudhud-logo.PNG" alt="" width={116} height={116} className="shahadaHeaderBird"/></div><RisingEnergyOrbs tone="blue" density="focused"/><div className="shahadaHeroTitle"><span>HUDHUD</span><strong>SECURE COMMUNITY</strong></div></div>}<div className="authArt"><span>✦ 1MUSLIM · THE UMMAH</span><div className="authSymbol"><Image src="/assets/HudHud-Quran.png" alt="Qur’an Studio artwork" width={185} height={185} style={{objectFit:"contain",maxWidth:"100%",height:"auto"}}/></div><h1>{isShahadaSignup?"1Muslim":"Welcome home."}</h1><p>Connect. Learn. Reflect. Together.</p><div className="shahadaCounter" aria-label="Shahada voice attempts on this device"><span className="shahadaCounterLight" aria-hidden="true"/><span>SHAHADA VOICE ATTEMPTS</span><strong>{voiceAttempts===null?"—":voiceAttempts.toLocaleString()}</strong><small>THIS DEVICE</small></div><div className="securitySequence" aria-label="Shahada, account, admission">SHAHADA <span>—</span> ACCOUNT <span>—</span> ADMISSION</div></div><div className="authPanel"><div className="authJourneyDuplicate"><AdmissionJourney stage={1} compact detail={isShahadaSignup?"Begin with the Shahada. Create your account to securely save the recording and complete verification.":"Already Muslim? Sign in to your existing account."}/></div><div className="authTop"><span>{isShahadaSignup?"Secure with HudHud":"Secure sign in"}</span></div><p className="authLead">{isShahadaSignup?"Your Shahada comes first. Tap HudHud to begin; create an account to securely record and save your declaration.":"Your conversations, learning, and community await."}</p><button className="authSwitch" type="button" onClick={()=>{setIsShahadaSignup(v=>!v);setMessage("");setAffirmed(false)}}>{isShahadaSignup?"← I already have an account":"← Begin with the Shahada"}</button>{isShahadaSignup&&<div className="shahadaUnified">
<div className="shahadaStudioCompact"><div className="shahadaMicVisual" aria-hidden="true"><span className="shahadaMicRing"><span>♩</span><b>🎙</b></span><small>READY TO LISTEN</small></div><div className="shahadaStudioCopy"><strong>HudHud</strong><span>Shahada Studio</span><p>Record your Shahada with guidance in Arabic or English.</p></div></div>
<div className="authMethods" role="radiogroup" aria-label="Shahada method">{([{id:"audio",title:"Voice",desc:"Arabic or English",icon:"♩"},{id:"declaration",title:"Touch",desc:"Sincere affirmation",icon:"☝"}] as const).map(m=><button type="button" role="radio" aria-checked={method===m.id} className={method===m.id?"selected":""} key={m.id} onClick={()=>{setMethod(m.id);setAffirmed(false);setMicrophoneStatus("idle")}}><span className="authMethodIcon" aria-hidden="true">{m.icon}</span><span className="authMethodText"><b>{m.title}</b><small>{m.desc}</small></span></button>)}</div>
<label className="authAffirm"><input type="checkbox" checked={affirmed} onChange={e=>setAffirmed(e.target.checked)}/><span>I sincerely intend to affirm the Shahada. {method==="audio"?"I will record it in Arabic or English during onboarding.":"I affirm this declaration sincerely."}</span></label>
{signupStep!==3?<form onSubmit={signupWithEmail} className="authForm"><label>Email<input type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Create password<input type="password" minLength={8} required autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="authAction ready" type="submit" disabled={!affirmed||loading}>{loading?"Creating account…":"Create account & continue →"}</button></form>:<div className="signupConfirm" role="status"><strong>✉ Check your inbox</strong><p>We sent a confirmation email to {email}. Follow its link to verify your account and continue your Shahada journey.</p><button type="button" onClick={()=>{setApproved(false);setSignupStep(1)}}>Use a different email</button></div>}
<button className="authGoogle" type="button" onClick={signInWithGoogle} disabled={loading}><span>G</span> {loading?"Connecting…":"Continue with Google"}</button>
</div>}{!isShahadaSignup&&<><p className="authSignInHint">Already registered? Continue with your Google account, or use email sign-in.</p><button type="button" className="authEmailLink" onClick={()=>setEmailLogin(v=>!v)}>{emailLogin?"Hide email sign-in":"Sign in with email →"}</button>{emailLogin&&<form className="authForm" onSubmit={signInWithEmail}><label>Email<input type="email" required autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="authAction ready" disabled={loading} type="submit">{loading?"Signing in…":"Sign in →"}</button></form>}</>}{message&&<p role="status" className="authMessage">{message}</p>}<p className="authLegal">By continuing, you agree to our <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</p></div></section><aside className={"authVision "+(visionVisible?"authVisionVisible":"")} aria-live="polite" aria-label="HudHud Vision guidance"><div className="authVisionTitle"><span className="authVisionPulse" aria-hidden="true"/>HUDHUD VISION <span>{visionStep}/2</span></div><div className="authVisionLabel">{visionLabel}</div><div className="authVisionTrack" role="progressbar" aria-valuemin={0} aria-valuemax={2} aria-valuenow={visionStep} aria-label="Account journey progress"><span style={{width:`${visionStep*50}%`}}/></div></aside><style>{` .authShahada .signupProgress{display:flex;gap:8px;margin:10px 0 16px;justify-content:space-between}.authShahada .signupProgress span{flex:1;text-align:center;border-bottom:2px solid #60718a66;padding:8px 2px;color:#aab6c9;font-size:clamp(10px,2.7vw,13px);letter-spacing:.04em}.authShahada .signupProgress .active{color:#f4f3ff;border-color:#a58cff;text-shadow:0 0 12px #9c84ff80}.authShahada .signupNext{width:100%;margin:14px 0}.authShahada .signupBack{border:0;background:transparent;color:#c6b9f8;padding:10px 0;cursor:pointer;text-align:left}.authShahada .signupPrivacy{font-size:12px;color:#b9c6d6;line-height:1.5;margin:10px 0}.authShahada .signupConfirm{padding:24px 12px;text-align:center;animation:signupReveal .45s ease both}.authShahada .signupConfirm strong{font-size:22px}.authShahada .signupConfirm p{line-height:1.65;overflow-wrap:anywhere}.authShahada .signupConfirm button{border:1px solid #9a91bb;background:#151222;color:#fff;border-radius:12px;padding:12px 18px;cursor:pointer}.authShahada .authPanel .authMethods button,.authShahada .authPanel .authAction{transition:transform .24s ease,box-shadow .24s ease,filter .24s ease}.authShahada .authPanel .authMethods button:active,.authShahada .authPanel .authAction:active{transform:scale(.975)}.authShahada .authPanel button:focus-visible,.authShahada .authPanel input:focus-visible{outline:3px solid #a4ddff;outline-offset:3px}@keyframes signupReveal{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}@media(prefers-reduced-motion:reduce){.authShahada .signupConfirm{animation:none}.authShahada .authPanel button{transition:none}} @media(max-width:420px){.authShahada .signupProgress{gap:3px}.authShahada .signupProgress span{font-size:10px}}`}</style><style>{` .authPreview .shahadaCounter{display:flex;align-items:center;justify-content:center;gap:8px;background:#080a09;border:1px solid #35453b;border-radius:12px;padding:5px 10px;margin:4px auto;color:#d3ded5;font-size:9px;letter-spacing:.08em;max-width:420px}.authPreview .shahadaCounter strong{font-size:15px;color:#f6f8f5;font-variant-numeric:tabular-nums}.authPreview .shahadaCounter small{font-size:8px;color:#91a79a}.authPreview .shahadaCounterLight{width:5px;height:5px;border-radius:50%;background:#b9e8c5;box-shadow:0 0 8px #b9e8c5} @media(max-width:420px){.authPreview .shahadaCounter{gap:5px;font-size:8px;padding:4px 5px}}


.authPreview .securityGuardianEntry .risingEnergyField{z-index:0!important}
.authPreview{position:relative!important;isolation:isolate!important}
.authPreview>.risingEnergyField{position:fixed!important;inset:0!important;z-index:0!important;pointer-events:none!important}
.authPreview>.authGlass{position:relative!important;z-index:1!important}
/* Mobile security entrance: compact hierarchy, keep guardian and floating orb unchanged */
@media(max-width:700px){
.authPreview .authNavBrand img{width:46px!important;height:46px!important;object-fit:contain!important}
.authPreview .authArt{padding:5px 12px 6px!important;gap:2px!important;min-height:0!important}
.authPreview .authArt>span:first-child,.authPreview .authArt>.authSymbol,.authPreview .authArt>p{display:none!important}
.authPreview .authArt h1{font-size:clamp(19px,5.8vw,27px)!important;line-height:1.08!important;margin:0 0 2px!important}
.authPreview .authArt .shahadaCounter{margin:2px auto!important;padding:3px 8px!important}
.authPreview .authArt .securitySequence{font-size:10px!important;letter-spacing:.09em!important;margin:2px 0!important}
.authPreview .authTop{min-height:0!important;padding:0!important;margin:0!important}
.authPreview .authTop span{font-size:12px!important;letter-spacing:.05em!important}
.authPreview .authLead{display:none!important}
.authPreview .authSwitch{display:inline-flex!important;align-self:flex-start!important;width:auto!important;max-width:max-content!important;min-height:0!important;padding:3px 0!important;margin:2px 0!important;border:0!important;background:transparent!important;box-shadow:none!important;color:#b9d9cb!important;font-size:12px!important;text-decoration:underline;text-underline-offset:3px}
.authPreview .authMethods{grid-template-columns:repeat(2,minmax(0,1fr))!important}
.authPreview .authMethods button{min-height:48px!important}
}
/* Black guardian header for secure sign-in */
.authPreview .securityGuardianEntry{position:relative!important;isolation:isolate;overflow:hidden!important;background:radial-gradient(ellipse at 50% 30%,#111719,#020303 75%)!important;border:1px solid #525b5a!important;box-shadow:inset 0 0 22px #000!important}
.authPreview .securityGuardianEntryArt{position:absolute;inset:-20% 0;z-index:-1;pointer-events:none;background:linear-gradient(0deg,#020303e8,#02030355 55%,#020303bb),url('/assets/hudhud-security-guardian.webp') center / contain no-repeat;opacity:.35;animation:guardianEntryBreath 11s ease-in-out infinite alternate}
.authPreview .securityGuardianEntryHeader{width:100%;display:flex;justify-content:space-between;gap:8px;color:#cbd7d0;letter-spacing:.12em;font-size:9px;border-bottom:1px solid #ffffff22;padding:3px 6px}
.authPreview .securityGuardianEntryHeader span{color:#a5e7c9}
@keyframes guardianEntryBreath{from{transform:scale(1.02)}to{transform:scale(1.14) translateY(-5px)}}
@media(prefers-reduced-motion:reduce){.authPreview .securityGuardianEntryArt{animation:none!important}}
/* SECURITY MODE: one viewport, black glass, HudHud as sole visual icon */
.authPreview,.authPreviewDay{background:#020303!important;color:#f4f4f1!important;min-height:100dvh!important;height:100dvh!important;overflow:hidden!important}
.authPreview .authSimpleHeader{background:#030505ee!important;border-color:#343d39!important;height:clamp(48px,8dvh,70px)!important;min-height:0!important}
.authPreview .authNavActions,.authPreview .authOrbit,.authPreview .authArt .authSymbol,.authPreview .authArt>p,.authPreview .authVision{display:none!important}
.authPreview .authGlass{background:#060808!important;border:1px solid #46544b!important;box-shadow:0 12px 55px #000!important;display:flex!important;flex-direction:column!important;width:min(100%,650px)!important;max-width:650px!important;height:calc(100dvh - clamp(65px,11dvh,95px))!important;max-height:calc(100dvh - 65px)!important;min-height:0!important;margin:0 auto!important;padding:clamp(9px,1.5dvh,18px)!important;overflow:hidden!important;border-radius:22px!important}
.authPreview .authArt{flex:0 0 auto!important;padding:0!important;background:none!important;min-height:0!important}
.authPreview .authArt>span{font-size:9px!important;letter-spacing:.22em!important;color:#9db1a4!important}
.authPreview .authArt h1{font-size:clamp(19px,3.5dvh,29px)!important;margin:3px 0!important;line-height:1.08!important}
.authPreview .securitySequence{display:flex;justify-content:center;gap:9px;align-items:center;font-size:10px;letter-spacing:.1em;color:#c6d5c7;padding:5px 0!important}
.authPreview .securitySequence span{color:#789483}
.authPreview .authPanel{flex:1 1 auto!important;min-height:0!important;padding:0!important;overflow-y:auto!important;scrollbar-width:none!important;background:none!important}
.authPreview .authPanel::-webkit-scrollbar{display:none}
.authPreview .authTop{margin:0!important;min-height:0!important;font-size:10px!important}
.authPreview .authPanel h2{font-size:clamp(17px,3dvh,25px)!important;margin:2px 0!important}
.authPreview .authLead{font-size:11px!important;margin:2px 0!important;line-height:1.35!important}
.authPreview .authSwitch{min-height:32px!important;padding:5px 10px!important;margin:5px 0!important}
.authPreview .authHudHudFirst{padding:6px!important;margin:4px 0!important;gap:2px!important;border:1px solid #36443a!important;background:radial-gradient(ellipse at 50% 50%,#163024,#050807 70%)!important}
.authPreview .authHudHudRecord{position:relative;width:clamp(64px,12dvh,108px)!important;height:clamp(64px,12dvh,108px)!important;margin:2px!important;background:#040808!important}
.authPreview .authHudHudRecord img{width:78%!important;height:78%!important}
.authPreview .authHudHudFirst strong{font-size:clamp(13px,2dvh,18px)!important}
.authPreview .authHudHudFirst small{font-size:10px!important}
.authPreview .authHudHudPulse{font-size:9px!important}
.authPreview .authMethods{gap:6px!important;margin:5px 0!important}
.authPreview .authMethods button{padding:7px 4px!important;min-height:42px!important;border-color:#4b5e51!important;background:#0a100e!important}
.authPreview .authMethods button.selected{border-color:#b6d4b9!important;box-shadow:0 0 13px #84e0a32e!important}
.authPreview .authMethods button b{font-size:12px!important}
.authPreview .authMethods button small{font-size:9px!important}
.authPreview .authAffirm{margin:5px 0!important;font-size:10px!important;line-height:1.3!important}
.authPreview .authForm{gap:5px!important;margin:4px 0!important}
.authPreview .authForm label{font-size:10px!important}
.authPreview .authForm input{min-height:34px!important;padding:6px 10px!important;background:#080c0a!important;border-color:#445349!important;color:#fff!important}
.authPreview .authAction,.authPreview .authGoogle{min-height:38px!important;margin:5px 0!important;padding:8px!important}
.authPreview .authGoogle{background:#e4e6e1!important;color:#101712!important}
.authPreview .authLegal{font-size:9px!important;margin:3px 0!important}
.authPreview .authGlass,.authPreview .authPanel,.authPreview .authArt{color:#f0f4ed!important}
.authPreview .securityParticles{position:absolute;inset:0;pointer-events:none;display:grid;place-items:center}
.authPreview .securityParticles i{position:absolute;top:50%;left:50%;width:3px;height:3px;border-radius:50%;background:#b2f4c4;box-shadow:0 0 8px #a0f4bb;animation:securityPulse 2.4s ease-in-out infinite}
@keyframes securityPulse{0%,100%{opacity:.12}50%{opacity:1}}
@media(max-height:740px){.authPreview .authArt>span,.authPreview .authLead,.authPreview .authHudHudFirst small,.authPreview .authLegal{display:none!important}.authPreview .authHudHudRecord{width:60px!important;height:60px!important}.authPreview .authPanel h2{font-size:17px!important}}
@media(prefers-reduced-motion:reduce){.authPreview .securityParticles i{animation:none!important}}
.authHudHudFirst{display:flex;flex-direction:column;align-items:center;gap:8px;margin:12px 0;padding:14px;border:1px solid #d8c48b66;border-radius:20px;background:radial-gradient(ellipse at 50% 45%,#1b6c4a66,#071b16);text-align:center}.authHudHudRecord{width:100px;height:100px;display:grid;place-items:center;border:1px solid #b9f4b6;border-radius:50%;box-shadow:0 0 0 7px #b6edb511,0 0 34px #6fdf9d55;animation:authRecordBreath 2.7s ease-in-out infinite}.authHudHudRecord img{width:86px;height:86px;object-fit:contain}.authHudHudFirst strong{font-size:17px}.authHudHudFirst small{font-size:12px;line-height:1.5;color:var(--muted)}.authHudHudPulse{font-size:10px;letter-spacing:.15em;color:#bff6c5}@keyframes authRecordBreath{50%{box-shadow:0 0 0 15px #b6edb50a,0 0 54px #6fdf9d88;transform:scale(1.035)}}@media(prefers-reduced-motion:reduce){.authHudHudRecord{animation:none}}

.authPreview{--fg:#f4fff7;--muted:#bad2c7;--pane:#09271fdc;--edge:#92d7a85a;position:relative;min-height:100dvh;overflow:hidden;color:var(--fg);background:radial-gradient(ellipse at 25% 5%,#235944 0%,transparent 48%),radial-gradient(ellipse at 100% 85%,#193d36 0%,transparent 45%),#071914;padding:90px 20px 35px;display:grid;place-items:center}.authPreviewDay{--fg:#173c30;--muted:#496b59;--pane:#ffffffdc;--edge:#4b8d6e77;background:radial-gradient(ellipse at 15% 5%,#e8f2e4,#f8f5e9 60%,#e9f2e9)}.authOrbit{position:absolute;width:38vw;height:38vw;max-width:500px;max-height:500px;border:1px solid #85eeb13a;border-radius:40%;filter:blur(1px);pointer-events:none;animation:authFloat 13s ease-in-out infinite alternate}.authOrbitOne{top:3%;left:-12%;transform:rotate(28deg)}.authOrbitTwo{bottom:-20%;right:-10%;animation-delay:-5s}.authGlass{position:relative;z-index:1;display:grid;grid-template-columns:1fr 1.1fr;width:min(100%,980px);min-height:520px;overflow:hidden;border:1px solid var(--edge);border-radius:32px;background:var(--pane);backdrop-filter:blur(26px);box-shadow:0 30px 100px #00190f80,inset 0 1px #ffffff30}.authArt{padding:45px 34px;display:flex;flex-direction:column;justify-content:center;background:radial-gradient(circle at 40% 30%,#2b876c88,transparent 60%),linear-gradient(150deg,#0b392b,#09201c);color:#f4fff7}.authArt>span,.authTop>span{font-size:11px;font-weight:800;letter-spacing:.2em;color:#ccebbd}.authSymbol{display:grid;place-items:center;line-height:1.4;text-align:center;filter:drop-shadow(0 0 25px #85e5ac77);animation:authFloat 8s ease-in-out infinite alternate}.authArt h1{font-size:clamp(21px,4vw,31px);font-weight:600;letter-spacing:-.04em;line-height:1.12;margin:0}.authArt p{color:#c4ddce}.authMiniWidgets{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:25px}.authMiniWidgets>div{display:grid;gap:7px;padding:13px 9px;border:1px solid #b5eac744;border-radius:17px;background:#d9ffe30e;animation:authFloat 7s ease-in-out infinite alternate}.authMiniWidgets>div:nth-child(2){animation-delay:-2s}.authMiniWidgets>div:nth-child(3){animation-delay:-4s}.authMiniWidgets img{width:100%;height:75px;object-fit:contain;filter:drop-shadow(0 8px 14px #0006)}.authMiniWidgets b{font-size:12px}.authMiniWidgets small{font-size:10px;color:#bed9c7}.authPanel{padding:35px;display:flex;flex-direction:column;justify-content:center}.authTop{display:flex;align-items:center;justify-content:space-between;gap:10px}.authTop>span{color:var(--muted)}.authTop button,.authSwitch,.authEmailLink{border:1px solid var(--edge);background:#75be8b15;color:var(--fg);padding:10px 12px;border-radius:14px;cursor:pointer;text-decoration:none;font-size:12px}.authPanel h2{font-size:clamp(21px,4vw,31px);font-weight:600;letter-spacing:-.04em;line-height:1.12;margin:22px 0 6px}.authLead,.authSignInHint{color:var(--muted);font-size:13px;line-height:1.6}.authSwitch{margin:15px 0;text-align:center}.authMethods{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0}.authMethods button{display:flex;flex-direction:column;align-items:center;gap:5px;padding:14px 6px;background:#5b97751c;color:var(--fg);border:1px solid var(--edge);border-radius:16px;cursor:pointer;transition:transform .3s,box-shadow .3s}.authMethods button.selected{border-color:#a9e8b3;box-shadow:0 0 22px #75e89b40;transform:translateY(-2px)}.authMethods small{font-size:10px;color:var(--muted)}.authAffirm{display:flex;align-items:flex-start;gap:10px;color:var(--muted);font-size:12px;line-height:1.5;margin:12px 0}.authAffirm input{accent-color:#42bd79;margin-top:3px}.authForm{display:grid;gap:10px}.authForm label{font-size:12px;color:var(--muted)}.authForm input{display:block;width:100%;box-sizing:border-box;margin-top:5px;border:1px solid var(--edge);border-radius:12px;background:#6b9d8220;color:var(--fg);padding:12px;font-size:14px}.authAction,.authGoogle{border:1px solid #98d9b2;border-radius:14px;padding:14px;font-weight:800;cursor:pointer;transition:box-shadow .3s,background .3s}.authAction{background:#476452;color:#d2dfd4;opacity:.55}.authAction.ready{opacity:1;background:linear-gradient(100deg,#9fe2a9,#e4d59d);color:#133624;box-shadow:0 0 24px #5cf7a64b}.authAction:disabled{cursor:not-allowed}.authGoogle{background:#f5f8f2;color:#163d2a;margin-top:12px}.authGoogle span{font-size:19px;margin-right:8px}.authMessage{color:#e8c98b;font-size:12px}.authLegal{font-size:11px;line-height:1.6;color:var(--muted);margin-top:20px}.authLegal a{color:inherit}.authEmailLink{text-align:center;margin:10px 0}@keyframes authFloat{from{translate:0 -5px}to{translate:0 7px}}@media(max-width:700px){.authPreview{padding:76px 12px 22px;align-items:start}.authGlass{grid-template-columns:1fr;border-radius:25px}.authArt{padding:19px 22px}.authSymbol{display:none}.authArt h1{font-size:25px}.authArt p{margin:5px 0}.authMiniWidgets{margin-top:8px}.authMiniWidgets>div{padding:8px}.authMiniWidgets img{height:45px}.authPanel{padding:22px}.authPanel h2{margin-top:12px}.authMethods button{padding:10px 4px}}/* App-like locked viewport: no page dragging; controls remain reachable on small screens. */
.authPreview{position:fixed;inset:0;width:100%;height:100dvh;min-height:0;box-sizing:border-box;overflow:hidden;overscroll-behavior:none;touch-action:pan-x;display:flex;align-items:center;justify-content:center;padding:calc(env(safe-area-inset-top) + 14px) 16px calc(env(safe-area-inset-bottom) + 14px)}
.authGlass{max-height:100%;min-height:0;overflow:hidden}
.authPanel{min-height:0;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin;touch-action:pan-y}
@media(max-width:700px){
.authPreview{padding:calc(env(safe-area-inset-top) + 8px) 10px calc(env(safe-area-inset-bottom) + 8px);align-items:center}
.authGlass{width:100%;height:min(100%,760px);max-height:100%;display:grid;grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr);border-radius:24px}
.authArt{padding:12px 16px 8px;min-height:0;display:grid;grid-template-columns:1fr;align-content:start}
.authArt h1{font-size:clamp(19px,5vw,24px)}
.authArt p{font-size:12px;line-height:1.35;margin:2px 0}
.authArt>span{font-size:9px}
.authMiniWidgets{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:7px}
.authMiniWidgets>div{padding:6px 5px;gap:2px;border-radius:13px;text-align:center;justify-items:center}
.authMiniWidgets img{height:clamp(30px,7dvh,46px);width:100%;object-fit:contain}
.authMiniWidgets b{font-size:11px}.authMiniWidgets small{font-size:9px}
.authPanel{padding:12px 16px 16px;justify-content:flex-start}
.authPanel h2{font-size:clamp(19px,5vw,24px);margin:10px 0 4px}
.authLead,.authSignInHint{font-size:12px;line-height:1.4}
.authSwitch{margin:9px 0;padding:10px}
.authEmailLink{margin:5px 0;padding:10px}
.authGoogle{margin-top:7px;padding:11px}
.authLegal{margin-top:10px;font-size:10px}
.authTop>span{font-size:9px}
}
@media(max-width:700px) and (max-height:690px){
.authArt{padding:8px 12px 4px}.authArt p{display:none}
.authMiniWidgets img{height:27px}.authMiniWidgets>div{padding:4px}
.authPanel{padding:8px 12px 12px}
.authPanel h2{margin:6px 0 3px}
}
/* Guided stage-light focus; decorative overlay never blocks inputs. */
.authPreview:not(.authPreviewDay){background:radial-gradient(ellipse at 45% 35%,#102d24 0%,#061710 44%,#010604 100%)}
.authPreview:not(.authPreviewDay) .authGlass{--pane:#04150ff0;box-shadow:0 30px 100px #000b,inset 0 1px #d9ffda1d}
.authPreview:not(.authPreviewDay) .authArt{background:radial-gradient(ellipse at 45% 40%,#174b3970,transparent 67%),#061b15}
.authGlass:after{content:"";position:absolute;inset:0;z-index:3;pointer-events:none;background:radial-gradient(ellipse 68% 55% at 74% 62%,transparent 18%,#0009 100%);opacity:.5;transition:opacity .8s ease,background .8s ease}
.authGlass.visionShahada.visionFirst:after{background:radial-gradient(ellipse 70% 50% at 70% 48%,transparent 16%,#000b 100%)}
.authGlass.visionSecond:after{background:radial-gradient(ellipse 68% 55% at 70% 78%,transparent 16%,#000b 100%)}
.authGlass.visionLogin.visionFirst:after{background:radial-gradient(ellipse 70% 58% at 72% 65%,transparent 16%,#000b 100%)}
.authVision{position:fixed;z-index:5;left:50%;bottom:calc(env(safe-area-inset-bottom) + 17px);width:min(260px,70vw);padding:10px 14px 12px;border:1px solid #b4d9a76b;border-radius:18px;background:linear-gradient(135deg,#08281fe8,#07140fef);box-shadow:0 8px 35px #0009,0 0 32px #4bbd7650;backdrop-filter:blur(16px);color:#e3f5e8;transform:translate(-50%,18px) scale(.94);opacity:0;pointer-events:none;transition:opacity .8s ease,transform .8s ease;animation:visionDrift 6s ease-in-out infinite}
.authVisionVisible{opacity:1;transform:translate(-50%,0) scale(1)}
.authVisionTitle{display:flex;gap:8px;align-items:center;font-size:9px;letter-spacing:.18em;font-weight:800;color:#bde6c6}
.authVisionTitle>span:last-child{margin-left:auto;letter-spacing:0}
.authVisionPulse{width:8px;height:8px;border-radius:50%;background:#8bffc0;box-shadow:0 0 14px #8bffc0}
.authVisionLabel{font-size:11px;margin:7px 0;color:#e2f4e7}
.authVisionTrack{height:4px;border-radius:20px;background:#ffffff25;overflow:hidden}
.authVisionTrack>span{display:block;height:100%;border-radius:20px;background:linear-gradient(90deg,#55c98a,#e0c98e);box-shadow:0 0 12px #8ee6a9;transition:width .6s ease}
@keyframes visionDrift{0%,100%{margin-bottom:0}50%{margin-bottom:7px}}
@media(max-width:700px){.authGlass:after{background:radial-gradient(ellipse 95% 42% at 50% 70%,transparent 15%,#0009 100%)!important;opacity:.36}.authVision{bottom:calc(env(safe-area-inset-bottom) + 7px);width:min(220px,62vw);padding:8px 11px}.authVisionLabel{font-size:10px}}
@media(prefers-reduced-motion:reduce){.authVision{animation:none;transition:none}.authGlass:after{transition:none}}
@media(prefers-reduced-motion:reduce){.authOrbit,.authSymbol,.authMiniWidgets>div{animation:none}}


.authSimpleHeader{position:absolute;z-index:10;top:15px;left:20px;right:20px;display:flex;justify-content:space-between;align-items:center;gap:12px;color:var(--muted);font-size:10px;letter-spacing:.12em;font-weight:800}
.authSimpleHeader a{color:var(--fg);text-decoration:none;padding:8px 10px;border:1px solid var(--edge);border-radius:11px;background:#6b9d8215}
.authPreview{width:100%;box-sizing:border-box}
.authPreview.authShahada{display:flex;align-items:flex-start;justify-content:center;min-height:100dvh;padding:62px 14px 30px;overflow-x:hidden}
.authShahada .authGlass{display:flex;flex-direction:column;width:min(100%,540px);max-width:540px;min-height:0;overflow:hidden}
.authShahada .authArt{padding:15px 20px 10px}
.authShahada .authSymbol{display:none}
.authShahada .authPanel{padding:12px 20px 18px}
/* Shahada: single, contained mobile app card with the same compact rhythm as Home. */
@media(max-width:1100px){
.authPreview.authShahada{min-height:100dvh;padding:66px 12px 22px;display:flex;align-items:flex-start;justify-content:center;overflow-x:hidden;overflow-y:auto}
.authShahada .authGlass{display:flex;flex-direction:column;max-width:540px;min-height:0;border-radius:23px;overflow:visible;gap:0}
.authShahada .authArt{padding:14px 18px 8px;background:radial-gradient(circle at 10% 0%,#2b876c66,transparent 68%),linear-gradient(150deg,#0b392b,#09201c)}
.authShahada .authArt>span{font-size:9px;letter-spacing:.15em}
.authShahada .authArt h1{font-size:clamp(20px,5vw,25px);margin-top:4px}
.authShahada .authArt p{font-size:12px;margin:3px 0 0}
.authShahada .authMiniWidgets{display:grid}
.authShahada .authPanel{padding:10px 18px 16px;justify-content:flex-start}
.authShahada .authTop>span{font-size:9px;letter-spacing:.12em}
.authShahada .authPanel h2{font-size:20px;margin:7px 0 2px}
.authShahada .authLead{font-size:11px;line-height:1.4;margin:3px 0}
.authShahada .authSwitch{margin:7px 0;padding:7px 10px;border-radius:10px}
.authShahada .authMethods{gap:7px;margin:7px 0}
.authShahada .authMethods button{padding:8px 4px;gap:3px;border-radius:12px}
.authShahada .authMethods button span{font-size:18px}
.authShahada .authMethods button b{font-size:12px}
.authShahada .authMethods small{font-size:9px}
.authShahada .authAffirm{font-size:11px;line-height:1.35;margin:6px 0;gap:8px}
.authShahada .authForm{gap:7px}
.authShahada .authForm label{font-size:11px}
.authShahada .authForm input{padding:9px 10px;margin-top:3px;border-radius:10px;font-size:14px}
.authShahada .authAction,.authShahada .authGoogle{padding:10px;border-radius:11px;font-size:13px}
.authShahada .authGoogle{margin-top:8px}
.authShahada .authLegal{margin:9px 0 0;font-size:10px}
}
/* Keep the existing HudHud header control; remove distracting floating controls on auth only. */


/* Unified Shahada widget panel: one seamless surface, like the homepage dashboard. */
.authShahada .authGlass{gap:0;border:1px solid #a9c8ac75;border-radius:24px;background:linear-gradient(155deg,#103d30f2,#082820f4);box-shadow:inset 0 1px #ffffff24,0 18px 55px #00180e52}
.authShahada .authArt{background:transparent!important;border:0!important;border-radius:0!important;padding-bottom:6px}
.authShahada .authPanel{background:transparent!important;border:0!important;border-radius:0!important;padding-top:6px}
.authShahada .authArt h1{letter-spacing:-.035em}
.authShahada .authTop{padding-top:9px;border-top:1px solid #d4c59133}
.authShahada .authMethods{gap:8px}
.authShahada .authMethods button{background:linear-gradient(155deg,#ffffff0e,#4f9b7420);border:1px solid #a3d0b263;box-shadow:inset 0 1px #ffffff13}
.authShahada .authMethods button.selected{border-color:#d4c58e;box-shadow:inset 0 1px #ffffff35,0 0 0 1px #d4c58e44,0 4px 15px #09271a44}
.authShahada .authSwitch,.authShahada .authForm input{background:#ffffff0b;border-color:#9cbaa56e}
.authShahada .authAction.ready{background:linear-gradient(120deg,#d9c58c,#b9d9ad);box-shadow:inset 0 1px #ffffff80}
.authShahada .authGoogle{background:#f0f3e9}
.authPreviewDay.authShahada .authGlass{background:linear-gradient(145deg,#fffef5ed,#edf4eaf2);border-color:#b8c5a5}
.authPreviewDay.authShahada .authTop{border-top-color:#476b5533}
.authPreviewDay.authShahada .authMethods button{background:#ffffffa8;border-color:#9bbb9b}
@media(max-width:700px){.authShahada .authGlass{width:100%;max-width:540px}.authShahada .authArt{padding:16px 18px 4px}.authShahada .authPanel{padding:4px 18px 18px}.authShahada .authTop{padding-top:10px}}
/* Security-page navigation inspired by the home header, with a darker treatment. */
.authSimpleHeader{position:fixed;top:calc(env(safe-area-inset-top) + 9px);left:clamp(10px,2vw,24px);right:clamp(10px,2vw,24px);z-index:15;min-height:58px;padding:8px 13px;box-sizing:border-box;display:flex;align-items:center;gap:12px;border:1px solid #b4d39a70;border-radius:25px;background:linear-gradient(135deg,#04160fee,#09291ded);box-shadow:0 12px 35px #000a,inset 0 1px #e5f8d31c,0 0 23px #9dc7791c;backdrop-filter:blur(20px)}
.authNavBrand{display:flex;align-items:center;gap:8px;flex:0 0 auto!important;padding:0!important;border:0!important;background:transparent!important;font-size:clamp(12px,2vw,16px);letter-spacing:.1em}
.authNavBrand img{object-fit:contain;filter:drop-shadow(0 0 8px #dfc78090)}
.authNavSearch{flex:1;min-width:0;text-align:center;padding:10px 12px;border:1px solid #9bcda04d;border-radius:100px;background:#020e0a80;color:#c9d8c6!important;letter-spacing:.1em;font-size:clamp(8px,1.5vw,11px)!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.authNavActions{display:flex;align-items:center;gap:7px}
.authNavActions a,.authNavActions span{display:grid;place-items:center;min-width:32px;height:32px;border:1px solid #d7c68b66;border-radius:50%;color:#e4d8a8;background:#102e22;box-shadow:0 0 13px #d5c18040;font-size:18px}
.authPreview:not(.authPreviewDay) .authOrbit{border-color:#d2c88a88;filter:drop-shadow(0 0 15px #e2c88085);opacity:.85}
.authPreview:not(.authPreviewDay) .authMiniWidgets img{filter:drop-shadow(0 0 12px #a4f5b48c) drop-shadow(0 0 7px #dec28a80)}
.authPreview:not(.authPreviewDay) .authMiniWidgets>div{border-color:#b8d4a466;box-shadow:inset 0 0 22px #8dd8a013,0 0 15px #d3c98915}
.authPreview:not(.authPreviewDay) .authGlass{border-color:#c5ce9b8c;box-shadow:0 30px 100px #000b,0 0 24px #d1c48c25,inset 0 1px #d9ffda2b}
.authPreview:not(.authPreviewDay) .authTop{filter:drop-shadow(0 0 8px #d2c77b55)}
/* Lower the account card to clear the navigation and remove logo/title overlap. */
.authPreview{padding-top:calc(env(safe-area-inset-top) + 84px)!important}
.authGlass{max-height:calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 100px)}
@media(max-width:700px){
.authSimpleHeader{min-height:53px;padding:7px 9px;gap:7px;border-radius:20px}
.authNavBrand{gap:4px;font-size:11px}.authNavBrand img{width:25px;height:25px}
.authNavSearch{font-size:8px!important;padding:8px 5px;letter-spacing:.03em}
.authNavActions{gap:4px}.authNavActions a,.authNavActions span{min-width:27px;height:27px;font-size:15px}
.authPreview{padding-top:calc(env(safe-area-inset-top) + 79px)!important;align-items:center}
.authGlass{max-height:calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 94px)}
.authPreview.authShahada{height:100dvh;min-height:0;padding:calc(env(safe-area-inset-top) + 79px) 10px calc(env(safe-area-inset-bottom) + 8px)!important;overflow:hidden;align-items:center}
.authShahada .authGlass{max-height:100%;overflow:hidden;display:grid;grid-template-rows:auto minmax(0,1fr)}
.authShahada .authPanel{min-height:0;overflow-y:auto;overscroll-behavior:contain}
}
/* Security nav: authentic logo, one useful Home action, one non-interactive security indicator. */
.authNavBrand img{width:34px;height:34px;object-fit:contain;border-radius:6px}
.authNavActions .authSecurityBadge{cursor:default;opacity:.8;box-shadow:inset 0 0 10px #d5c18022}
.authNavActions a:focus-visible,.authNavBrand:focus-visible{outline:2px solid #e7d69d;outline-offset:3px}
@media(max-width:700px){.authNavBrand img{width:29px;height:29px}.authNavActions .authSecurityBadge{display:none}}
@media(prefers-reduced-motion:reduce){.authShahada *{scroll-behavior:auto!important}}

/* Security flow: viewport stays anchored; only the form panel may scroll. */
.authPreview,.authPreview.authShahada{position:fixed!important;inset:0!important;width:100%!important;height:100dvh!important;min-height:0!important;max-height:100dvh!important;overflow:hidden!important;overscroll-behavior:none!important;touch-action:pan-x!important;box-sizing:border-box!important}
.authPreview .authGlass,.authPreview.authShahada .authGlass{min-height:0!important;max-height:100%!important;overflow:hidden!important;overscroll-behavior:none!important}
.authPreview .authPanel,.authPreview.authShahada .authPanel{min-height:0!important;overflow-y:auto!important;overscroll-behavior:contain!important;touch-action:pan-y!important;-webkit-overflow-scrolling:touch}
.authSecurityStages{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.authSecurityStages>div{min-width:0;padding:10px 7px!important;border-radius:14px;border:1px solid #c8b47878!important;background:linear-gradient(145deg,#1a4939aa,#092b22b0)!important;box-shadow:inset 0 1px #f9edbf26!important}
.authSecurityStages>div>span{display:grid;place-items:center;margin:auto;width:27px;height:27px;border-radius:50%;border:1px solid #d6bf7b88;color:#f0da9b;font-size:22px}
.authSecurityStages b{color:#f6edcf!important}.authSecurityStages small{color:#d2e4d6!important;line-height:1.3}
.authPreviewDay{--fg:#193d32;--muted:#536b5d;--edge:#c6cfbd;background:radial-gradient(ellipse at 50% 10%,#fff 0%,#f8faf8 65%,#eef3ef 100%)!important;color:#173b30!important}
.authPreviewDay .authSimpleHeader{background:linear-gradient(140deg,#fff,#f6f9f7)!important;border:1px solid #d9dfd8!important;box-shadow:0 12px 30px #213c2820,inset 0 1px #fff!important;color:#355849!important}
.authPreviewDay .authNavSearch{background:#fff!important;border-color:#d8e1d9!important;color:#416452!important}
.authPreviewDay .authNavBrand strong{color:#1e4636!important}
.authPreviewDay .authNavActions a,.authPreviewDay .authNavActions span{background:#fff!important;color:#295340!important;border-color:#d2dcd3!important;box-shadow:0 3px 10px #25433218!important}
.authPreviewDay .authGlass,.authPreviewDay.authShahada .authGlass{background:linear-gradient(150deg,#fff,#f7faf7)!important;border:1px solid #dce5dd!important;box-shadow:0 25px 70px #2d49301e,inset 0 1px #fff!important;color:#1b4031!important}
.authPreviewDay .authArt,.authPreviewDay.authShahada .authArt{background:linear-gradient(150deg,#fff,#f8fbf8)!important;color:#1b4031!important}
.authPreviewDay .authArt h1,.authPreviewDay .authPanel h2{color:#153c2e!important}
.authPreviewDay .authArt p,.authPreviewDay .authLead,.authPreviewDay .authSignInHint{color:#587262!important}
.authPreviewDay .authPanel{background:#fff!important;color:#193e30!important}
.authPreviewDay .authSecurityStages>div{background:linear-gradient(145deg,#fff,#f3f8f3)!important;border-color:#d9e4d8!important;box-shadow:0 4px 13px #183f2510,inset 0 1px #fff!important}
.authPreviewDay .authSecurityStages>div>span{color:#2c6b4b;border-color:#bed6c2;background:#f7fbf8}
.authPreviewDay .authSecurityStages b{color:#194331!important}
.authPreviewDay .authSecurityStages small{color:#547263!important}
.authPreviewDay .authGlass:after{opacity:0!important}
.authPreviewDay .authOrbit{opacity:.13!important}
.authPreviewDay .authTop{border-top-color:#dce6dc!important}
.authPreviewDay .authVision{background:#fff!important;border-color:#d7e3d8!important;box-shadow:0 12px 28px #26432d26!important;color:#204635!important}
.authPreviewDay .authVisionTitle,.authPreviewDay .authVisionLabel{color:#24513a!important}
@media(max-width:700px){
.authPreview.authShahada{padding:calc(env(safe-area-inset-top) + 79px) 10px calc(env(safe-area-inset-bottom) + 8px)!important;align-items:center!important}
.authShahada .authArt{padding:10px 14px 6px!important}
.authShahada .authMiniWidgets{margin-top:7px!important}
.authShahada .authSecurityStages>div{padding:6px 4px!important}
.authShahada .authSecurityStages>div>span{width:23px;height:23px;font-size:18px}
.authShahada .authSecurityStages small{font-size:8px!important}
}

/* Preview mobile admission: one fixed, purpose-built glass widget, not stacked cards. */
@media(max-width:700px){
 .authPreview,.authPreview.authShahada{padding:calc(env(safe-area-inset-top) + 60px) 12px calc(env(safe-area-inset-bottom) + 12px)!important;display:flex!important;align-items:center!important;justify-content:center!important;overflow:hidden!important;touch-action:none!important}
 .authGlass,.authShahada .authGlass{display:flex!important;flex-direction:column!important;width:100%!important;height:100%!important;min-height:0!important;max-height:100%!important;border-radius:23px!important;overflow:hidden!important}
 .authArt,.authShahada .authArt{flex:0 0 auto!important;padding:12px 14px 9px!important;background:linear-gradient(145deg,#153d30,#0a231c)!important}
 .authArt>span{font-size:9px!important;letter-spacing:.15em!important}
 .authArt h1{font-size:clamp(18px,5vw,23px)!important;margin:3px 0!important}
 .authArt p{font-size:11px!important;margin:2px 0!important}
 .authMiniWidgets{margin:9px 0 0!important;gap:6px!important}
 .authMiniWidgets>div{padding:7px 3px!important;gap:3px!important;border-radius:12px!important}
 .authMiniWidgets>div>span{width:21px!important;height:21px!important;font-size:16px!important}
 .authMiniWidgets b{font-size:10px!important}.authMiniWidgets small{font-size:8px!important}
 .authJourneyDuplicate{display:none!important}
 .authPanel,.authShahada .authPanel{flex:1 1 auto!important;min-height:0!important;padding:14px!important;display:flex!important;flex-direction:column!important;justify-content:center!important;gap:7px!important;overflow:hidden!important;touch-action:manipulation!important}
 .authPanel h2{font-size:clamp(19px,5vw,25px)!important;margin:4px 0 0!important}
 .authLead,.authSignInHint{font-size:11px!important;line-height:1.35!important;margin:2px 0!important}
 .authSwitch,.authEmailLink{margin:2px 0!important;padding:10px!important;flex-shrink:0!important}
 .authGoogle{min-height:43px!important;flex-shrink:0!important}
 .authTop{min-height:25px!important;flex-shrink:0!important}
 .authMethods{margin:4px 0!important;gap:5px!important}
 .authMethods button{padding:6px 4px!important}
 .authAffirm{font-size:11px!important}
 .authForm{margin:3px 0!important;gap:7px!important}
 .authForm input{padding:9px 11px!important}
 .authLegal{font-size:10px!important;margin:3px 0!important}
 .authVision{display:none!important}
}
@media(max-width:700px) and (max-height:740px){
 .authArt,.authShahada .authArt{padding:8px 12px!important}
 .authArt p{display:none!important}
 .authMiniWidgets{margin-top:5px!important}
 .authMiniWidgets>div{padding:5px 2px!important}
 .authPanel,.authShahada .authPanel{padding:10px 13px!important;gap:4px!important}
}
@media(max-width:700px) and (max-height:570px){
 .authArt,.authShahada .authArt{display:none!important}
 .authPanel,.authShahada .authPanel{justify-content:flex-start!important;overflow-y:auto!important;touch-action:pan-y!important}
}
`}</style><style jsx global>{`

/* HudHud premium smoked-mirror glass template: voice, touch, and admission action. */
.authPreview.authShahada .authGlass{background:linear-gradient(145deg,rgba(25,26,48,.72),rgba(3,9,19,.84) 42%,rgba(9,6,26,.83))!important;border:1px solid rgba(137,110,252,.52)!important;box-shadow:inset 0 1px 1px rgba(233,235,255,.16),inset 0 0 28px rgba(42,151,255,.065),0 0 24px rgba(102,71,255,.16),0 16px 55px #000b!important;backdrop-filter:blur(22px) saturate(125%)!important;-webkit-backdrop-filter:blur(22px) saturate(125%)!important}
.authPreview.authShahada .authPanel{background:linear-gradient(140deg,rgba(4,14,30,.34),rgba(18,8,37,.25))!important;border-radius:18px!important}
.authPreview.authShahada .authHudHudFirst{background:linear-gradient(125deg,rgba(8,18,36,.6),rgba(28,10,51,.42))!important;backdrop-filter:blur(18px) saturate(130%)!important;-webkit-backdrop-filter:blur(18px) saturate(130%)!important;border:1px solid rgba(140,116,255,.52)!important;box-shadow:inset 0 1px rgba(235,240,255,.16),0 0 25px rgba(74,145,255,.16)!important}
.authPreview.authShahada .authMethods button{display:flex!important;align-items:center!important;justify-content:center!important;gap:10px!important;min-height:64px!important;border:1px solid rgba(83,164,255,.5)!important;background:linear-gradient(125deg,rgba(3,31,63,.74),rgba(9,12,35,.76))!important;box-shadow:inset 0 1px rgba(219,241,255,.13),0 0 15px rgba(30,137,255,.11)!important;backdrop-filter:blur(14px)!important}
.authPreview.authShahada .authMethods button:nth-child(2){border-color:rgba(190,92,255,.55)!important;background:linear-gradient(125deg,rgba(33,9,57,.78),rgba(14,10,38,.72))!important;box-shadow:inset 0 1px rgba(247,213,255,.12),0 0 15px rgba(165,65,255,.13)!important}
.authPreview.authShahada .authMethods button.selected{border-color:#75d7ff!important;box-shadow:0 0 0 1px rgba(75,202,255,.25),0 0 24px rgba(35,159,255,.28)!important}
.authPreview.authShahada .authMethods button:nth-child(2).selected{border-color:#db87ff!important;box-shadow:0 0 0 1px rgba(217,111,255,.25),0 0 24px rgba(170,70,255,.3)!important}
.authPreview.authShahada .authMethodIcon{display:grid;place-items:center;width:36px;height:36px;flex:none;border-radius:50%;font-size:20px;filter:drop-shadow(0 0 7px rgba(62,174,255,.65));background:rgba(32,101,178,.2)}
.authPreview.authShahada .authMethods button:nth-child(2) .authMethodIcon{filter:drop-shadow(0 0 7px rgba(200,89,255,.7));background:rgba(128,39,172,.2)}
.authPreview.authShahada .authMethodText{display:flex;flex-direction:column;align-items:flex-start;gap:2px}
.authPreview.authShahada .authMethods button b{font-size:14px!important;color:#f6f5ff!important}
.authPreview.authShahada .authMethods button small{font-size:10px!important;color:#b9bed2!important}
.authPreview.authShahada .authAction.ready{background:linear-gradient(100deg,#4ee9f5 0%,#7faaff 48%,#bf5cff 100%)!important;border:1px solid rgba(218,238,255,.6)!important;color:#071123!important;font-weight:800!important;box-shadow:0 5px 22px rgba(68,174,255,.22),0 0 18px rgba(177,78,255,.18)!important}
.authPreview.authShahada .authForm input{background:rgba(6,16,31,.65)!important;border-color:rgba(127,154,205,.4)!important;backdrop-filter:blur(10px)!important}
@media(max-width:390px){.authPreview.authShahada .authMethods button{gap:5px!important;min-height:58px!important}.authPreview.authShahada .authMethodIcon{width:28px;height:28px;font-size:16px}}

/* Official Shahada hero: preserve full-color PNG and readable overlay. */
.authPreview.authShahada .shahadaHeroGuardian{filter:drop-shadow(0 0 18px rgba(49,162,246,.25))!important;animation:shahadaGuardianFloat 10s ease-in-out infinite alternate!important}
/* Cinematic guardian / smoked-glass overlap. Original guardian art remains the source image. */
.authPreview.authShahada{background:radial-gradient(ellipse at 50% 5%,#191039 0%,#050711 42%,#020204 80%)!important}
.authPreview.authShahada .authGlass{overflow:visible!important;position:relative!important;border-radius:24px!important;background:transparent!important;border:0!important;box-shadow:none!important;display:flex!important;flex-direction:column!important;isolation:isolate!important}
.authPreview.authShahada .shahadaCinematicHero{position:relative;flex:0 0 clamp(165px,28dvh,295px);width:100%;min-height:0;overflow:visible;isolation:isolate;pointer-events:none}
.authPreview.authShahada .shahadaHeroHalo{position:absolute;inset:-12% -4% -10%;background:radial-gradient(ellipse at 47% 55%,rgba(89,57,214,.26),transparent 47%),radial-gradient(ellipse at 57% 55%,rgba(27,159,255,.21),transparent 62%);filter:blur(19px);animation:shahadaHalo 13s ease-in-out infinite alternate}
.authPreview.authShahada .shahadaHeroGuardian{position:absolute;inset:-12% 0 -28%;background:linear-gradient(180deg,rgba(2,3,11,.06) 0%,rgba(2,3,11,.02) 65%,rgba(3,6,18,.44) 100%),url('/assets/hudhud-shahada-hero.PNG') center 43% / cover no-repeat;filter:drop-shadow(0 0 18px rgba(61,136,255,.4)) drop-shadow(0 0 30px rgba(159,71,255,.25));animation:shahadaGuardianFloat 10s ease-in-out infinite alternate;z-index:1}
.authPreview.authShahada .shahadaHeroTitle{position:absolute;z-index:3;left:0;right:0;top:1%;display:flex;flex-direction:column;align-items:center;gap:2px;text-align:center;text-shadow:0 2px 10px #000,0 0 15px #427eff}
.authPreview.authShahada .shahadaHeroTitle span{font-size:clamp(13px,2dvh,18px);font-weight:900;letter-spacing:.35em;color:#e6f5ff}
.authPreview.authShahada .shahadaHeroTitle strong{font-size:clamp(14px,2.7dvh,25px);font-weight:950;letter-spacing:.15em;color:#f6f2ff;transform:rotate(-2deg);text-shadow:0 0 15px rgba(169,85,255,.85),0 2px 3px #03020b}
.authPreview.authShahada .shahadaCinematicHero>.risingEnergyField{z-index:2!important;inset:-10% 0 -28%!important;overflow:visible!important}
.authPreview.authShahada .authPanel{position:relative!important;z-index:4!important;margin-top:-19px!important;flex:1 1 auto!important;min-height:0!important;padding:14px 13px 18px!important;border-radius:23px!important;overflow-y:auto!important;overscroll-behavior:contain!important;box-shadow:inset 0 1px rgba(235,246,255,.3),inset 0 0 40px rgba(91,91,202,.07),0 -8px 28px rgba(83,106,255,.19),0 16px 55px #000b!important;border:1px solid rgba(151,136,255,.57)!important;background:linear-gradient(145deg,rgba(24,29,55,.73),rgba(5,13,31,.78) 43%,rgba(18,10,39,.8))!important;backdrop-filter:blur(23px) saturate(140%)!important;-webkit-backdrop-filter:blur(23px) saturate(140%)!important}
.authPreview.authShahada .authHudHudFirst{min-height:clamp(125px,19dvh,190px)!important;background:linear-gradient(120deg,rgba(10,22,46,.35),rgba(26,13,49,.3))!important;box-shadow:inset 0 1px rgba(255,255,255,.12)!important}
.authPreview.authShahada .authHudHudFirst .securityGuardianEntryArt{opacity:.12!important}
.authPreview.authShahada .authHudHudRecord{width:clamp(66px,10dvh,92px)!important;height:clamp(66px,10dvh,92px)!important}
.authPreview.authShahada .authPanel:before{content:"";position:sticky;top:0;display:block;height:1px;width:80%;margin:0 auto 3px;background:linear-gradient(90deg,transparent,rgba(115,206,255,.7),rgba(201,109,255,.75),transparent);box-shadow:0 0 15px rgba(117,148,255,.5);pointer-events:none}
.authPreview.authShahada .authAction.ready{position:relative!important;overflow:hidden!important}
.authPreview.authShahada .authAction.ready:after{content:"";position:absolute;inset:-80% auto -80% -55%;width:25%;transform:rotate(23deg);background:linear-gradient(90deg,transparent,rgba(255,255,255,.36),transparent);animation:shahadaButtonSweep 6s ease-in-out infinite;pointer-events:none}
@keyframes shahadaGuardianFloat{from{transform:translateY(0) scale(1)}to{transform:translateY(-5px) scale(1.025)}}
@keyframes shahadaHalo{from{transform:translateX(-2%) scale(.97)}to{transform:translateX(2%) scale(1.04)}}
@keyframes shahadaButtonSweep{0%,62%,100%{left:-55%}82%{left:125%}}
@media(max-width:700px){.authPreview.authShahada .authGlass{height:100dvh!important;max-height:100dvh!important;margin:0 auto!important;padding:5px 7px 9px!important}.authPreview.authShahada .shahadaCinematicHero{flex-basis:clamp(145px,24dvh,230px)}.authPreview.authShahada .authPanel{margin-top:-15px!important;padding:12px 11px 18px!important}}
@media(max-height:650px){.authPreview.authShahada .shahadaCinematicHero{flex-basis:125px}.authPreview.authShahada .authPanel{margin-top:-10px!important}}
@media(prefers-reduced-motion:reduce){.authPreview.authShahada .shahadaHeroHalo,.authPreview.authShahada .shahadaHeroGuardian,.authPreview.authShahada .authAction.ready:after{animation:none!important}}
/* Shahada-first screen: free the hero and make particles visible across glass layers. */
.authPreview.authShahada .authSimpleHeader{display:none!important}
.authPreview.authShahada .authArt{display:none!important}
.authPreview.authShahada .authGlass{height:calc(100dvh - 18px)!important;max-height:calc(100dvh - 18px)!important;margin:9px auto!important}
.authPreview.authShahada .authPanel{padding:8px 10px!important;overflow-y:auto!important}
.authPreview.authShahada .authHudHudFirst{min-height:clamp(210px,31dvh,350px)!important;flex-shrink:0!important;position:relative!important;isolation:isolate!important;background:radial-gradient(ellipse at 50% 50%,#101025,#03040a 76%)!important;border-color:#53457d!important}
.authPreview.authShahada .securityGuardianEntryArt{opacity:.7!important;z-index:0!important}
.authPreview.authShahada .authHudHudFirst>.risingEnergyField{z-index:2!important;opacity:1!important}
.authPreview.authShahada .securityGuardianEntryHeader,.authPreview.authShahada .authHudHudRecord,.authPreview.authShahada .authHudHudFirst>strong,.authPreview.authShahada .authHudHudFirst>small,.authPreview.authShahada .authHudHudPulse{position:relative!important;z-index:3!important}
.authPreview.authShahada .authHudHudRecord{width:clamp(96px,17dvh,160px)!important;height:clamp(96px,17dvh,160px)!important}
.authPreview.authShahada>.risingEnergyField{z-index:3!important;opacity:.8!important}
.authPreview.authShahada>.risingEnergyField .energyOrb{mix-blend-mode:screen}
@media(max-width:700px){.authPreview.authShahada .authGlass{width:calc(100% - 12px)!important}.authPreview.authShahada .authHudHudFirst{min-height:clamp(195px,29dvh,310px)!important}}
/* Final black-mirror finish: preserve existing interactions, swap existing official artwork. */
.authPreview.authShahada .shahadaCinematicHero{flex:0 0 clamp(100px,16dvh,160px)!important;min-height:100px!important;background:linear-gradient(125deg,#07080eeb,#0d1020e6 55%,#050609ee)!important;border:1px solid rgba(208,219,255,.23)!important;border-radius:20px 20px 12px 12px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.25),inset 0 -18px 30px #0009,0 12px 32px #000a!important;overflow:hidden!important}
.authPreview.authShahada .shahadaHeroGuardian{inset:0!important;background:none!important;filter:none!important;animation:shahadaGuardianFloat 11s ease-in-out infinite alternate!important;display:flex!important;justify-content:center!important;align-items:center!important}
.authPreview.authShahada .shahadaHeaderBird{width:clamp(54px,8dvh,84px)!important;height:clamp(54px,8dvh,84px)!important;object-fit:contain!important;filter:drop-shadow(0 0 14px #8b79e077)}
.authPreview.authShahada .shahadaHeroTitle{bottom:8px!important;font-size:clamp(9px,1.7dvh,13px)!important}
.authPreview.authShahada .authGlass{background:linear-gradient(145deg,rgba(27,29,40,.78),rgba(2,3,9,.91) 44%,rgba(13,16,29,.86))!important;border:1px solid rgba(213,223,255,.28)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.26),inset 1px 0 0 rgba(255,255,255,.07),0 24px 65px #000b,0 0 28px #8b79ff12!important;backdrop-filter:blur(25px) saturate(130%)!important;-webkit-backdrop-filter:blur(25px) saturate(130%)!important}
.authPreview.authShahada .authPanel{background:linear-gradient(140deg,rgba(30,32,47,.61),rgba(3,4,12,.83) 42%,rgba(17,19,34,.75))!important;border:1px solid rgba(227,232,255,.19)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 -8px 30px #0006!important;backdrop-filter:blur(22px) saturate(135%)!important;-webkit-backdrop-filter:blur(22px) saturate(135%)!important;border-radius:20px!important}
.authPreview.authShahada .authHudHudFirst{min-height:clamp(155px,24dvh,240px)!important;background:radial-gradient(ellipse at 50% 10%,#17162d99,#030409ed 75%)!important;border:1px solid rgba(204,213,255,.26)!important;box-shadow:inset 0 1px 0 #ffffff32,0 10px 24px #0009!important}
.authPreview.authShahada .securityGuardianEntryArt{background:none!important;opacity:0!important}
.authPreview.authShahada .authHudHudRecord{width:clamp(100px,18dvh,152px)!important;height:clamp(72px,13dvh,120px)!important;border-radius:18px!important;overflow:hidden!important}
.authPreview.authShahada .shahadaStudioArtwork{width:100%!important;height:100%!important;object-fit:cover!important;object-position:center!important;filter:drop-shadow(0 0 15px #6b73ee66)}
.authPreview.authShahada .authMethods button{background:linear-gradient(135deg,#232637bb,#0b0c19d9)!important;border:1px solid #a5adcb55!important;box-shadow:inset 0 1px 0 #ffffff25!important}
.authPreview.authShahada .authMethods button.selected{border-color:#a6b6ffcc!important;box-shadow:inset 0 1px 0 #ffffff50,0 0 20px #727df13a!important}
@media(max-height:700px){.authPreview.authShahada .shahadaCinematicHero{flex-basis:100px!important}.authPreview.authShahada .authHudHudFirst{min-height:145px!important}}
@media(prefers-reduced-motion:reduce){.authPreview.authShahada .shahadaHeroGuardian{animation:none!important}}

/* Obsidian Mirror V2 */
.authPreview.authShahada .authGlass{isolation:isolate!important;background:linear-gradient(135deg,rgba(27,30,43,.88),rgba(3,5,12,.95) 50%,rgba(17,20,35,.90))!important;border:1px solid rgba(216,227,255,.35)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 22px 54px rgba(0,0,0,.75)!important}
.authPreview.authShahada .authGlass:before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:linear-gradient(130deg,rgba(255,255,255,.10),transparent 33%,rgba(150,174,255,.06));z-index:0}
.authPreview.authShahada .authGlass:after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:linear-gradient(110deg,transparent 30%,rgba(210,225,255,.09) 50%,transparent 70%);background-size:250% 100%;animation:obsidianSweepV2 19s ease-in-out infinite;z-index:0}
.authPreview.authShahada .authGlass>.shahadaCinematicHero,.authPreview.authShahada .authGlass>.authPanel{position:relative!important;z-index:1!important}
.authPreview.authShahada .authPanel{background:linear-gradient(145deg,rgba(26,29,44,.85),rgba(3,5,12,.94) 55%,rgba(16,19,32,.87))!important;color:#f5f6ff!important;border:1px solid rgba(220,229,255,.24)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.16),0 12px 30px rgba(0,0,0,.55)!important}
.authPreview.authShahada .authMethods button{background:linear-gradient(145deg,rgba(41,47,69,.91),rgba(8,11,24,.96))!important;color:#f5f7ff!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.21)!important}
.authPreview.authShahada .authMethods button.selected{box-shadow:inset 0 1px 0 rgba(255,255,255,.46),0 0 18px rgba(125,146,255,.28)!important}
.authPreview.authShahada .authForm input{background:rgba(2,4,11,.94)!important;color:#fff!important;border-color:rgba(169,187,230,.55)!important}
@keyframes obsidianSweepV2{0%,30%{background-position:120% 0}75%,100%{background-position:-120% 0}}
@media(prefers-reduced-motion:reduce){.authPreview.authShahada .authGlass:after{animation:none!important}}

/* Mobile Shahada viewport: reclaim unused top gutter; keep signup controls reachable. */
@media(max-width:1100px){
.authPreview.authShahada{box-sizing:border-box!important;padding:env(safe-area-inset-top,0px) 8px env(safe-area-inset-bottom,0px)!important;min-height:100dvh!important;height:100dvh!important;max-height:100dvh!important;display:flex!important;align-items:stretch!important;justify-content:center!important;overflow:hidden!important}
.authPreview.authShahada .authGlass{box-sizing:border-box!important;margin:0 auto!important;height:100%!important;max-height:100%!important;width:min(100%,540px)!important;display:flex!important;flex-direction:column!important;padding:5px!important;overflow:hidden!important}
.authPreview.authShahada .shahadaCinematicHero{flex:0 0 clamp(72px,12dvh,112px)!important;min-height:72px!important}
.authPreview.authShahada .authPanel{flex:1 1 0!important;min-height:0!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;scrollbar-width:thin;padding:9px 10px 14px!important;margin-top:-8px!important}
.authPreview.authShahada .authHudHudFirst{min-height:clamp(110px,18dvh,175px)!important}
.authPreview.authShahada .authHudHudRecord{width:clamp(76px,11dvh,112px)!important;height:clamp(58px,8dvh,85px)!important}
.authPreview.authShahada .signupProgress{margin:5px 0 10px!important}
}
@media(max-width:1100px) and (max-height:740px){.authPreview.authShahada .shahadaCinematicHero{flex-basis:70px!important}.authPreview.authShahada .authHudHudFirst{min-height:104px!important}}

/* Shahada signup uses the 1Muslim homepage navigation hierarchy; homepage styles remain untouched. */
.authPreview.authShahada .authSimpleHeader{display:flex!important;position:relative!important;z-index:8!important;box-sizing:border-box!important;flex:0 0 auto!important;width:min(100%,540px)!important;min-height:62px!important;margin:0 auto 8px!important;padding:8px 12px!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;border:1px solid rgba(199,171,103,.65)!important;border-radius:24px!important;background:linear-gradient(125deg,rgba(7,57,44,.96),rgba(6,42,37,.97))!important;box-shadow:inset 0 1px 0 rgba(248,228,167,.27),0 8px 28px #0008!important}
.authPreview.authShahada .authNavBrand{display:flex!important;align-items:center!important;gap:6px!important;white-space:nowrap!important;color:#e8d8a5!important}
.authPreview.authShahada .authNavBrand img{width:38px!important;height:38px!important}
.authPreview.authShahada .authNavBrand strong{font-size:15px!important;letter-spacing:.07em!important}
.authPreview.authShahada .authNavSearch{flex:1 1 auto!important;min-width:0!important;text-align:center!important;font-size:clamp(9px,2.2vw,12px)!important;letter-spacing:.05em!important;color:#e8d8a5!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
.authPreview.authShahada .authNavActions{display:flex!important;flex:0 0 auto!important}
.authPreview.authShahada .shahadaCinematicHero{display:none!important}
.authPreview.authShahada .authGlass{flex:1 1 0!important;min-height:0!important;margin:0 auto!important;padding:5px!important;border-color:rgba(209,185,120,.48)!important}
.authPreview.authShahada .authPanel{margin-top:0!important;border-radius:19px!important;border-color:rgba(208,189,133,.35)!important}
.authPreview.authShahada .authTop span{font-size:clamp(17px,3.5vw,23px)!important;font-weight:800!important;color:#f3e8c9!important}
.authPreview.authShahada .signupProgress .active{border-color:#d4bd80!important;color:#f9edc8!important}
.authPreview.authShahada .authHudHudFirst{background:linear-gradient(145deg,rgba(7,36,32,.88),rgba(6,9,21,.95))!important;border-color:rgba(205,185,132,.42)!important}
.authPreview.authShahada .authMethods button.selected{border-color:#d7c58e!important;box-shadow:inset 0 1px 0 #ffffff45,0 0 16px #d2b86d28!important}
@media(max-width:1100px){.authPreview.authShahada{flex-direction:column!important;justify-content:flex-start!important;padding:calc(env(safe-area-inset-top,0px) + 4px) 8px calc(env(safe-area-inset-bottom,0px) + 4px)!important}.authPreview.authShahada .authGlass{height:auto!important;max-height:none!important}.authPreview.authShahada .authSimpleHeader{min-height:58px!important}}
@media(max-width:370px){.authPreview.authShahada .authNavBrand strong{font-size:12px!important}.authPreview.authShahada .authNavSearch{font-size:9px!important}}

/* Shahada shell: edge-to-edge app layout and 1Muslim green night/day controls. */
.authPreview.authShahada{background:radial-gradient(ellipse at 50% 0%,#174d3d 0%,#092d27 48%,#061a17 100%)!important}
.authPreview.authShahada .authSimpleHeader{border-color:#bca36c!important;background:linear-gradient(125deg,#104b3d,#092f29)!important}
.authPreview.authShahada .authGlass{background:linear-gradient(150deg,rgba(12,64,48,.93),rgba(5,36,30,.96) 54%,rgba(4,25,23,.98))!important;border-color:#bda86d99!important}
.authPreview.authShahada .authPanel{background:linear-gradient(155deg,rgba(11,65,49,.88),rgba(5,33,29,.96) 55%,rgba(6,30,27,.94))!important;border-color:#bda86d55!important}
.authPreview.authShahada .authHudHudFirst{background:radial-gradient(ellipse at 45% 25%,#165d49,#062921 75%)!important}
.authPreview.authShahada .authSecurityTheme{display:grid;place-items:center;width:38px;height:38px;flex-shrink:0;border:1px solid #d4bd85a8;border-radius:50%;background:#123e34;color:#f5df9d;font-size:22px;cursor:pointer}
.authPreview.authShahada.authPreviewDay{background:linear-gradient(155deg,#e7ead7,#c6dfd1)!important}
.authPreview.authShahada.authPreviewDay .authSimpleHeader{background:linear-gradient(135deg,#c8e2d3,#a8cfbc)!important}
.authPreview.authShahada.authPreviewDay .authGlass{background:linear-gradient(145deg,#e2efe2,#b9d8c8)!important}
.authPreview.authShahada.authPreviewDay .authPanel{background:linear-gradient(150deg,#eaf4e8,#c8e1d2)!important;color:#193c32!important}
.authPreview.authShahada.authPreviewDay .authTop span,.authPreview.authShahada.authPreviewDay .authPanel strong{color:#184a3b!important}
.authPreview.authShahada.authPreviewDay .authPanel p,.authPreview.authShahada.authPreviewDay .authPanel label{color:#244b40!important}
.authPreview.authShahada.authPreviewDay .authSecurityTheme{background:#e5f1e3;color:#245a48}
@media(max-width:1100px){
.authPreview.authShahada{padding:0!important;margin:0!important;height:100dvh!important;min-height:100dvh!important;max-height:100dvh!important;gap:0!important}
.authPreview.authShahada .authSimpleHeader{width:100%!important;max-width:none!important;margin:0!important;border-radius:0 0 22px 22px!important;min-height:60px!important;padding:8px 12px!important;flex-shrink:0!important}
.authPreview.authShahada .authGlass{width:100%!important;max-width:none!important;height:0!important;min-height:0!important;flex:1 1 auto!important;margin:0!important;border-radius:22px 22px 0 0!important;padding:4px 7px calc(env(safe-area-inset-bottom,0px) + 6px)!important}
.authPreview.authShahada .authPanel{flex:1 1 0!important;min-height:0!important;overflow-y:auto!important;overscroll-behavior:contain!important}
}

/* Homepage Shahada overlay — preserve homepage palette and controls */
.authPreview.authEmbedded{background:radial-gradient(ellipse at 50% 0%,#174735,#061c18 76%)!important}
.authPreview.authEmbedded .authSimpleHeader{display:none!important}
.authPreview.authEmbedded .shahadaCinematicHero{display:none!important}
.authPreview.authEmbedded .authGlass{border:1px solid #c5ab7199!important;background:linear-gradient(155deg,#0c3d30ed,#041c19f5)!important;box-shadow:0 24px 65px #0009,inset 0 1px 0 #f9e8b529!important}
.authPreview.authEmbedded .authGlass:before,.authPreview.authEmbedded .authGlass:after{display:none!important}
.authPreview.authEmbedded .authPanel{background:linear-gradient(145deg,#0d4034e8,#051f1cf2)!important;border:1px solid #c5aa7166!important;color:#f5e9cd!important}
.authPreview.authEmbedded .authHudHudFirst{min-height:120px!important;max-height:165px!important;background:radial-gradient(ellipse at 50% 30%,#1b5b46,#08271f 80%)!important;border:1px solid #c7af7980!important}
.authPreview.authEmbedded .authHudHudRecord{width:100px!important;height:92px!important;min-height:0!important;border-radius:50%!important}
.authPreview.authEmbedded .shahadaStudioArtwork{object-fit:contain!important;filter:drop-shadow(0 0 13px #e7c57655)!important}
.authPreview.authEmbedded .authMethods button{background:linear-gradient(140deg,#18523fdc,#082920ed)!important;color:#f3e5c7!important;border:1px solid #bfa46e77!important}
.authPreview.authEmbedded .authMethods button.selected{border-color:#e5c987!important;box-shadow:0 0 0 1px #e5c98766,0 0 18px #c9aa6533!important}
.authPreview.authEmbedded .authForm input{background:#061f1c!important;border:1px solid #a0b99a88!important;color:#f8f0db!important}
.authPreview.authEmbedded .authForm input:focus{outline:2px solid #d6bb7988!important}
@media(max-width:1100px){.authPreview.authEmbedded .authGlass{height:100%!important;max-height:100%!important;padding:8px!important}.authPreview.authEmbedded .authPanel{padding:12px!important}.authPreview.authEmbedded .authHudHudFirst{min-height:112px!important;max-height:142px!important}}

/* Unified Shahada — approved emerald and gold reference */
.authPreview.authShahada .authJourneyDuplicate,.authPreview.authShahada .authLead,.authPreview.authShahada .authTop{display:none!important}
.authPreview.authShahada .authGlass{background:linear-gradient(150deg,#0b382ef0,#031c19f7)!important;border:1px solid #cfb57799!important}
.authPreview.authShahada .authPanel{background:linear-gradient(160deg,#103e32e8,#041d19f2)!important;border:1px solid #d1b87870!important;color:#f6ecd5!important}
.authPreview.authShahada .shahadaUnified{display:grid;gap:14px;padding:8px 2px 4px}
.authPreview.authShahada .shahadaStudioCompact{display:grid;grid-template-columns:42% 1fr;align-items:center;gap:12px;min-height:154px;padding:14px;border:1px solid #d7ba7988;border-radius:22px;background:radial-gradient(circle at 25% 40%,#1c5843aa,transparent 65%),#082b24dc;box-shadow:inset 0 1px #fff2,0 8px 30px #0005}
.authPreview.authShahada .shahadaMicVisual{display:grid;place-items:center;gap:10px}
.authPreview.authShahada .shahadaMicRing{width:104px;height:104px;border:1px solid #d6bd7a;border-radius:50%;display:grid;place-items:center;position:relative;box-shadow:0 0 0 12px #bba76a13,0 0 0 24px #bba76a0b,inset 0 0 20px #d9b9662b}
.authPreview.authShahada .shahadaMicRing b{font-size:38px;filter:sepia(1) saturate(.7)}
.authPreview.authShahada .shahadaMicRing>span{position:absolute;opacity:0}
.authPreview.authShahada .shahadaMicVisual small{font-size:10px;letter-spacing:.2em;color:#e4c789}
.authPreview.authShahada .shahadaStudioCopy strong{display:block;font-family:Georgia,serif;font-size:clamp(27px,5vw,38px);color:#f2dfb5}
.authPreview.authShahada .shahadaStudioCopy>span{font-size:19px;color:#f1dfba}
.authPreview.authShahada .shahadaStudioCopy p{font-size:13px;line-height:1.55;color:#d4dfd0}
.authPreview.authShahada .authMethods button{background:linear-gradient(135deg,#14513f,#062a24)!important;border:1px solid #c8ad7380!important;color:#f3e5c7!important;border-radius:16px!important}
.authPreview.authShahada .authMethods button.selected{border-color:#e9c77b!important;box-shadow:inset 0 1px #fff3,0 0 18px #d5b86e40!important}
.authPreview.authShahada .authMethodIcon{background:#0e4b39!important;color:#e8cc8e!important}
.authPreview.authShahada .authForm{display:grid;gap:12px!important}
.authPreview.authShahada .authForm input{background:#072c25!important;border:1px solid #a8c3a277!important;color:#f9f0df!important;border-radius:12px!important}
.authPreview.authShahada .authAction.ready{background:linear-gradient(100deg,#e4bf77,#f4dca2,#caa15f)!important;color:#13372b!important;border:1px solid #f6d99a!important;box-shadow:0 8px 25px #0004!important}
.authPreview.authShahada .authGoogle{background:#0b3028!important;border:1px solid #c5aa7188!important;color:#f6ecd8!important}
.authPreview.authShahada .authAffirm{color:#e8e5d6!important}
.authPreview.authShahada .authAffirm input{accent-color:#1e956d}
.authPreview.authEmbedded .authPanel{overflow-y:auto!important}
@media(max-width:600px){.authPreview.authShahada .shahadaStudioCompact{min-height:120px;padding:10px;gap:8px}.authPreview.authShahada .shahadaMicRing{width:72px;height:72px}.authPreview.authShahada .shahadaMicRing b{font-size:29px}.authPreview.authShahada .shahadaUnified{gap:10px}.authPreview.authShahada .shahadaStudioCopy p{font-size:12px}}
/* Keep the Shahada overlay navigation compact on phones: never let the center label force overflow. */
.authPreview.authShahada .authSimpleHeader{max-width:100%!important;min-width:0!important;overflow:hidden!important}
.authPreview.authShahada .authNavBrand{min-width:0!important;flex:0 1 auto!important;white-space:nowrap!important}
.authPreview.authShahada .authNavSearch{min-width:0!important;flex:1 1 0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
.authPreview.authShahada .authNavActions{flex:0 0 auto!important;display:flex!important;align-items:center!important;gap:6px!important}
@media(max-width:650px){
 .authPreview.authShahada .authSimpleHeader{padding:7px 9px!important;gap:7px!important}
 .authPreview.authShahada .authNavBrand strong{font-size:clamp(12px,3.5vw,17px)!important;letter-spacing:.03em!important}
 .authPreview.authShahada .authNavBrand img{width:30px!important;height:30px!important;object-fit:contain!important}
 .authPreview.authShahada .authNavSearch{font-size:10px!important;letter-spacing:.02em!important}
 .authPreview.authShahada .authNavActions a,.authPreview.authShahada .authNavActions button{width:36px!important;height:36px!important;min-width:36px!important;padding:0!important;display:grid!important;place-items:center!important}
}
@media(max-width:410px){.authPreview.authShahada .authNavSearch{display:none!important}.authPreview.authShahada .authNavBrand{flex:1 1 auto!important}}

/* Reuse the homepage's actual mosque decoration assets, so Shahada feels
   like a glass overlay over the same scene instead of a separate page. */
.authPreview{background:#031c18!important;isolation:isolate!important}
.authPreview .authHomeBackdrop{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none}
.authPreview .authHomeNight,.authPreview .authHomeDay{position:absolute;inset:0;background-size:cover;background-position:center center;background-repeat:no-repeat}
.authPreview .authHomeNight{background-image:url("/assets/decorations/background-mosque-night.PNG");opacity:1}
.authPreview .authHomeDay{background-image:url("/assets/decorations/background-mosque-day.PNG");opacity:0;transition:opacity .7s ease}
.authPreview.authPreviewDay .authHomeDay{opacity:1}
.authPreview .authHomeShade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,18,16,.2),rgba(0,20,18,.28));}
.authPreview.authPreviewDay{background:#d8e8dc!important}
.authPreview .authGlass{background:rgba(4,35,29,.65)!important;backdrop-filter:blur(17px)!important;-webkit-backdrop-filter:blur(17px)!important}
.authPreview.authPreviewDay .authGlass{background:rgba(14,49,39,.62)!important}
.authPreview .authOrbit{display:none!important}
 .authPreview.authShahada .authGlass{margin-top:0!important;max-height:calc(100dvh - 28px)!important} .authPreview.authShahada{padding-top:12px!important} body:has(.authPreview) .muslimMobileDock{display:none!important}body:has(.authPreview){overflow:hidden!important;overscroll-behavior:none!important}`}</style></main>;
}
