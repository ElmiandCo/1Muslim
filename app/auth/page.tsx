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
  const [emailLogin,setEmailLogin]=useState(false);
  const [visionVisible,setVisionVisible]=useState(true);

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

  const visionStep = isShahadaSignup ? (!affirmed ? 1 : 2) : (emailLogin ? 2 : 1);
  const visionLabel = isShahadaSignup ? (!affirmed ? "Choose your Shahada method" : "Create your account") : (emailLogin ? "Enter your account details" : "Choose how to continue");
  useEffect(()=>{setVisionVisible(true);const hide=window.setTimeout(()=>setVisionVisible(false),4800);const cycle=window.setInterval(()=>{setVisionVisible(true);window.setTimeout(()=>setVisionVisible(false),2400)},7200);return()=>{window.clearTimeout(hide);window.clearInterval(cycle)}},[visionStep,isShahadaSignup,method]);
  const chooseTheme=(mode:"day"|"night"|"auto")=>{setThemeMode(mode);localStorage.setItem("1muslim-theme-mode",mode);const next=mode==="auto"?window.matchMedia("(prefers-color-scheme: light)").matches:mode==="day";setDay(next);localStorage.setItem("1muslim-theme",next?"light":"dark");window.dispatchEvent(new Event("1muslim:theme-changed"))};
  useEffect(()=>{if(themeMode!=="auto")return;const media=window.matchMedia("(prefers-color-scheme: light)");const update=()=>setDay(media.matches);media.addEventListener("change",update);return()=>media.removeEventListener("change",update)},[themeMode]);

  const signupWithEmail = async (e: React.FormEvent) => {
    if(!affirmed){setMessage("Choose and affirm your Shahada method to continue.");return;}
    try{const C=window.AudioContext;if(C){const ctx=new C();const o=ctx.createOscillator();const g=ctx.createGain();o.frequency.value=660;g.gain.setValueAtTime(.025,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.28);o.connect(g).connect(ctx.destination);o.start();o.stop(ctx.currentTime+.28);setTimeout(()=>ctx.close(),500)}}catch{}
    e.preventDefault();
    if(password.length < 8){setMessage("Choose a password with at least 8 characters.");return;}
    setLoading(true);setMessage("");
    const {data,error}=await createClient().auth.signUp({email:email.trim().toLowerCase(),password,options:{emailRedirectTo:`${window.location.origin}/auth/callback?next=${encodeURIComponent("/onboarding?method="+(method==="audio"?"audio":"declaration"))}`}});
    setLoading(false);
    if(error){setMessage(error.message);return;}
    if(data.session){setApproved(true);window.location.assign("/onboarding?method="+safeMethod());return;}
    setApproved(true);setMessage("Account created. Check your email to confirm your account, then continue to the Shahada page.");
  };

  const signInWithEmail = async(e:React.FormEvent)=>{e.preventDefault();setLoading(true);setMessage("");const {error}=await createClient().auth.signInWithPassword({email:email.trim(),password});setLoading(false);if(error){setMessage("Sign-in failed. Check your email and password.");return}window.location.assign(safeNext())};

  const signInWithGoogle = async () => {
    setLoading(true);
    setMessage("");

    const supabase = createClient();
    // Preserve the exact deployment origin across the hosted OAuth round trip.
    // Supabase may otherwise use its production Site URL when a preview host is not matched.
    const callbackOrigin = window.location.origin;
    try { sessionStorage.setItem("1muslim:oauth-origin", callbackOrigin); } catch {}
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Return to the same authorized site origin (including preview) and preserve a safe relative destination.
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent((()=>{return isShahadaSignup?"/onboarding?method="+safeMethod():safeNext()})())}`,
      },
    });

    if (error) {
      setLoading(false);
      setMessage(error.message);
    }
  };

  return <main className={"authPreview "+(day?"authPreviewDay":"")+(isShahadaSignup?" authShahada":"")}><nav className="authSimpleHeader" aria-label="Security page navigation"><Link className="authNavBrand" href="/" aria-label="Back to 1Muslim home"><Image src="/assets/1muslim-live-logo.PNG" alt="1Muslim logo" width={46} height={46}/><strong>1MUSLIM</strong></Link><span className="authNavSearch" aria-label="Secure account access">✧ &nbsp; SECURE ACCOUNT ACCESS</span><div className="authNavActions"><Link href="/" aria-label="Return to homepage" title="Home">⌂</Link><span className="authSecurityBadge" aria-label="Secure sign-in" title="Secure sign-in">♢</span></div></nav><RisingEnergyOrbs tone="blue" density="ambient"/><div className={homeStyles.pattern} aria-hidden="true"/><div className="authOrbit authOrbitOne"/><div className="authOrbit authOrbitTwo"/><section className={"authGlass "+(isShahadaSignup?"visionShahada ":"visionLogin ")+(visionStep===2?"visionSecond":"visionFirst") } aria-label="1Muslim account"><div className="authArt"><span>✦ 1MUSLIM · THE UMMAH</span><div className="authSymbol"><Image src="/assets/HudHud-Quran.png" alt="Qur’an Studio artwork" width={185} height={185} style={{objectFit:"contain",maxWidth:"100%",height:"auto"}}/></div><h1>{isShahadaSignup?"1Muslim":"Welcome home."}</h1><p>Connect. Learn. Reflect. Together.</p><div className="shahadaCounter" aria-label="Shahada voice attempts on this device"><span className="shahadaCounterLight" aria-hidden="true"/><span>SHAHADA VOICE ATTEMPTS</span><strong>{voiceAttempts===null?"—":voiceAttempts.toLocaleString()}</strong><small>THIS DEVICE</small></div><div className="securitySequence" aria-label="Shahada, account, admission">SHAHADA <span>—</span> ACCOUNT <span>—</span> ADMISSION</div></div><div className="authPanel"><div className="authJourneyDuplicate"><AdmissionJourney stage={1} compact detail={isShahadaSignup?"Begin with the Shahada. Create your account to securely save the recording and complete verification.":"Already Muslim? Sign in to your existing account."}/></div><div className="authTop"><span>{isShahadaSignup?"Secure with HudHud":"Secure sign in"}</span></div><p className="authLead">{isShahadaSignup?"Your Shahada comes first. Tap HudHud to begin; create an account to securely record and save your declaration.":"Your conversations, learning, and community await."}</p><button className="authSwitch" type="button" onClick={()=>{setIsShahadaSignup(v=>!v);setMessage("");setAffirmed(false)}}>{isShahadaSignup?"← I already have an account":"← Begin with the Shahada"}</button>{isShahadaSignup&&<><div className="authHudHudFirst securityGuardianEntry"><div className="securityGuardianEntryArt" aria-hidden="true"/><RisingEnergyOrbs tone="blue"/><div className="securityGuardianEntryHeader">HUDHUD / SECURE SHAHADA <span>● STANDBY</span></div><div className="authHudHudRecord" aria-label="HudHud Shahada recording begins after account creation"><span className="securityParticles" aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i} style={{transform:`rotate(${i*30}deg) translateY(-63px)`,animationDelay:`${i*-.17}s`}}/>)}</span><Image src="/assets/hudhud-logo.PNG" width={94} height={94} alt="HudHud Shahada studio"/></div><strong>HudHud · Shahada Studio</strong><small>🎙 Record in Arabic or English after securely creating your account.</small><span className="authHudHudPulse">✦ READY TO LISTEN</span></div><div className="authMethods" role="radiogroup" aria-label="Shahada method">{([{id:"audio",title:"Voice",desc:"Arabic or English",icon:""},{id:"declaration",title:"Declare",desc:"Sincere affirmation",icon:""}] as const).map(m=><button type="button" role="radio" aria-checked={method===m.id} className={method===m.id?"selected":""} key={m.id} onClick={()=>{setMethod(m.id);setAffirmed(false)}}><b>{m.title}</b><small>{m.desc}</small></button>)}</div><label className="authAffirm"><input type="checkbox" checked={affirmed} onChange={e=>setAffirmed(e.target.checked)}/><span>I sincerely intend to affirm the Shahada. {method==="audio"?"I will record it in Arabic or English during onboarding.":method==="type"?"I will enter the declaration during onboarding.":"I affirm this declaration sincerely."}</span></label><form onSubmit={signupWithEmail} className="authForm"><label>Email<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Create password<input type="password" minLength={8} required autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><button className={"authAction "+(affirmed?"ready":"")} type="submit" disabled={!affirmed||loading}>{loading?"Creating account…":approved?"✓ Account created — check email":"Create account & continue →"}</button></form></>}{!isShahadaSignup&&<><p className="authSignInHint">Already registered? Continue with your Google account, or use email sign-in.</p><button type="button" className="authEmailLink" onClick={()=>setEmailLogin(v=>!v)}>{emailLogin?"Hide email sign-in":"Sign in with email →"}</button>{emailLogin&&<form className="authForm" onSubmit={signInWithEmail}><label>Email<input type="email" required autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="authAction ready" disabled={loading} type="submit">{loading?"Signing in…":"Sign in →"}</button></form>}</>}<button className="authGoogle" type="button" onClick={signInWithGoogle} disabled={loading}><span>G</span> {loading?"Connecting…":"Continue with Google"}</button>{message&&<p role="status" className="authMessage">{message}</p>}<p className="authLegal">By continuing, you agree to our <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</p></div></section><aside className={"authVision "+(visionVisible?"authVisionVisible":"")} aria-live="polite" aria-label="HudHud Vision guidance"><div className="authVisionTitle"><span className="authVisionPulse" aria-hidden="true"/>HUDHUD VISION <span>{visionStep}/2</span></div><div className="authVisionLabel">{visionLabel}</div><div className="authVisionTrack" role="progressbar" aria-valuemin={0} aria-valuemax={2} aria-valuenow={visionStep} aria-label="Account journey progress"><span style={{width:`${visionStep*50}%`}}/></div></aside><style>{` .authPreview .shahadaCounter{display:flex;align-items:center;justify-content:center;gap:8px;background:#080a09;border:1px solid #35453b;border-radius:12px;padding:5px 10px;margin:4px auto;color:#d3ded5;font-size:9px;letter-spacing:.08em;max-width:420px}.authPreview .shahadaCounter strong{font-size:15px;color:#f6f8f5;font-variant-numeric:tabular-nums}.authPreview .shahadaCounter small{font-size:8px;color:#91a79a}.authPreview .shahadaCounterLight{width:5px;height:5px;border-radius:50%;background:#b9e8c5;box-shadow:0 0 8px #b9e8c5} @media(max-width:420px){.authPreview .shahadaCounter{gap:5px;font-size:8px;padding:4px 5px}}


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
body:has(.authPreview) .muslimMobileDock{display:none!important}body:has(.authPreview){overflow:hidden!important;overscroll-behavior:none!important}`}</style></main>;
}
