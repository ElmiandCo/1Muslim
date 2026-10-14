"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../utils/supabase/client";
import SiteNav from "../components/SiteNav";
import Link from "next/link";
import Image from "next/image";
import homeStyles from "../home-hub.module.css";
import CelestialOrb from "../components/CelestialOrb";

const safeNext = () => { const p=new URLSearchParams(window.location.search).get("next"); return p?.startsWith("/")&&!p.startsWith("//")&&!p.startsWith("/\\\\") ? p : "/"; };
const safeMethod = () => { const m = new URLSearchParams(window.location.search).get("method"); return m === "declaration" || m === "type" ? "declaration" : "audio"; };

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isShahadaSignup, setIsShahadaSignup] = useState(false);
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
    setApproved(true);try{const C=window.AudioContext;if(C){const ctx=new C();const o=ctx.createOscillator();const g=ctx.createGain();o.frequency.value=660;g.gain.setValueAtTime(.025,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.28);o.connect(g).connect(ctx.destination);o.start();o.stop(ctx.currentTime+.28);setTimeout(()=>ctx.close(),500)}}catch{}
    e.preventDefault();
    if(password.length < 8){setMessage("Choose a password with at least 8 characters.");return;}
    setLoading(true);setMessage("");
    const {data,error}=await createClient().auth.signUp({email:email.trim().toLowerCase(),password,options:{emailRedirectTo:`${window.location.origin}/auth/callback?next=${encodeURIComponent("/onboarding?method="+(method==="audio"?"audio":"declaration"))}`}});
    setLoading(false);
    if(error){setMessage(error.message);return;}
    if(data.session){window.location.assign("/onboarding?method="+safeMethod());return;}
    setMessage("Check your email to confirm your account, then continue to the Shahada page.");
  };

  const signInWithEmail = async(e:React.FormEvent)=>{e.preventDefault();setLoading(true);setMessage("");const {error}=await createClient().auth.signInWithPassword({email:email.trim(),password});setLoading(false);if(error){setMessage("Sign-in failed. Check your email and password.");return}window.location.assign(safeNext())};

  const signInWithGoogle = async () => {
    setLoading(true);
    setMessage("");

    const supabase = createClient();
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

  return <main className={"authPreview "+(day?"authPreviewDay":"")+(isShahadaSignup?" authShahada":"")}><div className="authSimpleHeader"><Link href="/" aria-label="Back to 1Muslim home">← 1MUSLIM</Link><span>SECURE ACCOUNT ACCESS</span></div><div className={homeStyles.pattern} aria-hidden="true"/><div className="authOrbit authOrbitOne"/><div className="authOrbit authOrbitTwo"/><section className={"authGlass "+(isShahadaSignup?"visionShahada ":"visionLogin ")+(visionStep===2?"visionSecond":"visionFirst") } aria-label="1Muslim account"><div className="authArt"><span>✦ 1MUSLIM · THE UMMAH</span><div className="authSymbol"><Image src="/assets/HudHud-Quran.png" alt="Qur’an Studio artwork" width={185} height={185} style={{objectFit:"contain",maxWidth:"100%",height:"auto"}}/></div><h1>{isShahadaSignup?"Your journey begins here.":"Welcome home."}</h1><p>Connect. Learn. Reflect. Together.</p><div className="authMiniWidgets" aria-label="Explore 1Muslim"><div><Image src="/assets/control-center/1live.PNG" alt="" width={95} height={85}/><b>Live</b><small>Connect together</small></div><div><Image src="/assets/HudHud-Quran.png" alt="" width={95} height={85}/><b>Qur’an</b><small>Read and reflect</small></div><div><Image src="/assets/control-center/1ummah.PNG" alt="" width={95} height={85}/><b>Ummah</b><small>Belong here</small></div></div></div><div className="authPanel"><div className="authTop"><span>SECURE ACCOUNT ACCESS</span><CelestialOrb light={day} mode={themeMode} onToggle={()=>chooseTheme(day?"night":"day")} onModeChange={chooseTheme}/></div><h2>{isShahadaSignup?"Affirm your Shahada":"Sign in to 1Muslim"}</h2><p className="authLead">{isShahadaSignup?"Choose the way you wish to affirm. You will complete your declaration during onboarding.":"Your conversations, learning, and community await."}</p><button className="authSwitch" type="button" onClick={()=>{setIsShahadaSignup(v=>!v);setMessage("");setAffirmed(false)}}>{isShahadaSignup?"← I already have an account":"New here? Begin your Shahada journey →"}</button>{isShahadaSignup&&<><div className="authMethods" role="radiogroup" aria-label="Shahada method">{([{id:"audio",title:"Voice",desc:"Arabic or English",icon:"🎙"},{id:"type",title:"Type",desc:"Written declaration",icon:"✍"},{id:"declaration",title:"Check box",desc:"Sincere affirmation",icon:"✓"}] as const).map(m=><button type="button" role="radio" aria-checked={method===m.id} className={method===m.id?"selected":""} key={m.id} onClick={()=>{setMethod(m.id);setAffirmed(false)}}><span>{m.icon}</span><b>{m.title}</b><small>{m.desc}</small></button>)}</div><label className="authAffirm"><input type="checkbox" checked={affirmed} onChange={e=>setAffirmed(e.target.checked)}/><span>I sincerely intend to affirm the Shahada. {method==="audio"?"I will record it in Arabic or English during onboarding.":method==="type"?"I will enter the declaration during onboarding.":"I affirm this declaration sincerely."}</span></label><form onSubmit={signupWithEmail} className="authForm"><label>Email<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Create password<input type="password" minLength={8} required autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><button className={"authAction "+(affirmed?"ready":"")} type="submit" disabled={!affirmed||loading}>{loading?"Creating account…":approved?"✓ Approved — continuing…":"Create account & continue →"}</button></form></>}{!isShahadaSignup&&<><p className="authSignInHint">Already registered? Continue with your Google account, or use email sign-in.</p><button type="button" className="authEmailLink" onClick={()=>setEmailLogin(v=>!v)}>{emailLogin?"Hide email sign-in":"Sign in with email →"}</button>{emailLogin&&<form className="authForm" onSubmit={signInWithEmail}><label>Email<input type="email" required autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="authAction ready" disabled={loading} type="submit">{loading?"Signing in…":"Sign in →"}</button></form>}</>}<button className="authGoogle" type="button" onClick={signInWithGoogle} disabled={loading}><span>G</span> {loading?"Connecting…":"Continue with Google"}</button>{message&&<p role="status" className="authMessage">{message}</p>}<p className="authLegal">By continuing, you agree to our <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</p></div></section><aside className={"authVision "+(visionVisible?"authVisionVisible":"")} aria-live="polite" aria-label="HudHud Vision guidance"><div className="authVisionTitle"><span className="authVisionPulse" aria-hidden="true"/>HUDHUD VISION <span>{visionStep}/2</span></div><div className="authVisionLabel">{visionLabel}</div><div className="authVisionTrack" role="progressbar" aria-valuemin={0} aria-valuemax={2} aria-valuenow={visionStep} aria-label="Account journey progress"><span style={{width:`${visionStep*50}%`}}/></div></aside><style>{`
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
.authShahada .authSymbol,.authShahada .authMiniWidgets{display:none}
.authShahada .authPanel{padding:12px 20px 18px}
/* Shahada: single, contained mobile app card with the same compact rhythm as Home. */
@media(max-width:1100px){
.authPreview.authShahada{min-height:100dvh;padding:66px 12px 22px;display:flex;align-items:flex-start;justify-content:center;overflow-x:hidden;overflow-y:auto}
.authShahada .authGlass{display:flex;flex-direction:column;max-width:540px;min-height:0;border-radius:23px;overflow:visible;gap:0}
.authShahada .authArt{padding:14px 18px 8px;background:radial-gradient(circle at 10% 0%,#2b876c66,transparent 68%),linear-gradient(150deg,#0b392b,#09201c)}
.authShahada .authArt>span{font-size:9px;letter-spacing:.15em}
.authShahada .authArt h1{font-size:clamp(20px,5vw,25px);margin-top:4px}
.authShahada .authArt p{font-size:12px;margin:3px 0 0}
.authShahada .authMiniWidgets{display:none}
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
@media(prefers-reduced-motion:reduce){.authShahada *{scroll-behavior:auto!important}}
`}</style><style jsx global>{`body:has(.authPreview) .muslimMobileDock,body:has(.authPreview) .hudhudTopOrb,body:has(.authPreview) .hudhudFloatingOrb{display:none!important}body:has(.authPreview){overflow-x:hidden}`}</style></main>;
}
