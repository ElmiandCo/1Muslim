"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../utils/supabase/client";
import SiteNav from "../components/SiteNav";
import Link from "next/link";
import Image from "next/image";
import homeStyles from "../home-hub.module.css";
import CelestialOrb from "../components/CelestialOrb";

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

  const signInWithEmail = async(e:React.FormEvent)=>{e.preventDefault();setLoading(true);setMessage("");const {error}=await createClient().auth.signInWithPassword({email:email.trim(),password});setLoading(false);if(error){setMessage("Sign-in failed. Check your email and password.");return}window.location.assign("/")};

  const signInWithGoogle = async () => {
    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Return to the same authorized site origin (including preview) and preserve a safe relative destination.
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent((()=>{const p=new URLSearchParams(window.location.search).get("next");return p?.startsWith("/")&&!p.startsWith("//")?p:(isShahadaSignup?"/onboarding?method="+safeMethod():"/")})())}`,
      },
    });

    if (error) {
      setLoading(false);
      setMessage(error.message);
    }
  };

  return <main className={"authPreview "+(day?"authPreviewDay":"")}><SiteNav compact/><div className={homeStyles.pattern} aria-hidden="true"/><div className="authOrbit authOrbitOne"/><div className="authOrbit authOrbitTwo"/><section className="authGlass" aria-label="1Muslim account"><div className="authArt"><span>✦ 1MUSLIM · THE UMMAH</span><div className="authSymbol"><Image src="/assets/HudHud-Quran.png" alt="Qur’an Studio artwork" width={185} height={185} style={{objectFit:"contain",maxWidth:"100%",height:"auto"}}/></div><h1>{isShahadaSignup?"Your journey begins here.":"Welcome home."}</h1><p>Connect. Learn. Reflect. Together.</p><div className="authMiniWidgets"><div><Image src="/assets/control-center/1live.PNG" alt="" width={95} height={85}/><b>Live</b><small>Connect together</small></div><div><Image src="/assets/HudHud-Quran.png" alt="" width={95} height={85}/><b>Qur’an</b><small>Read and reflect</small></div><div><Image src="/assets/control-center/1ummah.PNG" alt="" width={95} height={85}/><b>Ummah</b><small>Belong here</small></div></div></div><div className="authPanel"><div className="authTop"><span>SECURE ACCOUNT ACCESS</span><CelestialOrb light={day} mode={themeMode} onToggle={()=>chooseTheme(day?"night":"day")} onModeChange={chooseTheme}/></div><h2>{isShahadaSignup?"Affirm your Shahada":"Sign in to 1Muslim"}</h2><p className="authLead">{isShahadaSignup?"Choose the way you wish to affirm. You will complete your declaration during onboarding.":"Your conversations, learning, and community await."}</p><button className="authSwitch" type="button" onClick={()=>{setIsShahadaSignup(v=>!v);setMessage("");setAffirmed(false)}}>{isShahadaSignup?"← I already have an account":"New here? Begin your Shahada journey →"}</button>{isShahadaSignup&&<><div className="authMethods" role="radiogroup" aria-label="Shahada method">{([{id:"audio",title:"Voice",desc:"Arabic or English",icon:"🎙"},{id:"type",title:"Type",desc:"Written declaration",icon:"✍"},{id:"declaration",title:"Check box",desc:"Sincere affirmation",icon:"✓"}] as const).map(m=><button type="button" role="radio" aria-checked={method===m.id} className={method===m.id?"selected":""} key={m.id} onClick={()=>{setMethod(m.id);setAffirmed(false)}}><span>{m.icon}</span><b>{m.title}</b><small>{m.desc}</small></button>)}</div><label className="authAffirm"><input type="checkbox" checked={affirmed} onChange={e=>setAffirmed(e.target.checked)}/><span>I sincerely intend to affirm the Shahada. {method==="audio"?"I will record it in Arabic or English during onboarding.":method==="type"?"I will enter the declaration during onboarding.":"I affirm this declaration sincerely."}</span></label><form onSubmit={signupWithEmail} className="authForm"><label>Email<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Create password<input type="password" minLength={8} required autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><button className={"authAction "+(affirmed?"ready":"")} type="submit" disabled={!affirmed||loading}>{loading?"Creating account…":approved?"✓ Approved — continuing…":"Create account & continue →"}</button></form></>}{!isShahadaSignup&&<><p className="authSignInHint">Already registered? Continue with your Google account, or use email sign-in.</p><button type="button" className="authEmailLink" onClick={()=>setEmailLogin(v=>!v)}>{emailLogin?"Hide email sign-in":"Sign in with email →"}</button>{emailLogin&&<form className="authForm" onSubmit={signInWithEmail}><label>Email<input type="email" required autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="authAction ready" disabled={loading} type="submit">{loading?"Signing in…":"Sign in →"}</button></form>}</>}<button className="authGoogle" type="button" onClick={signInWithGoogle} disabled={loading}><span>G</span> {loading?"Connecting…":"Continue with Google"}</button>{message&&<p role="status" className="authMessage">{message}</p>}<p className="authLegal">By continuing, you agree to our <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</p></div></section><style>{`
.authPreview{--fg:#f4fff7;--muted:#bad2c7;--pane:#09271fdc;--edge:#92d7a85a;position:relative;min-height:100dvh;overflow:hidden;color:var(--fg);background:radial-gradient(ellipse at 25% 5%,#235944 0%,transparent 48%),radial-gradient(ellipse at 100% 85%,#193d36 0%,transparent 45%),#071914;padding:90px 20px 35px;display:grid;place-items:center}.authPreviewDay{--fg:#173c30;--muted:#496b59;--pane:#ffffffdc;--edge:#4b8d6e77;background:radial-gradient(ellipse at 15% 5%,#e8f2e4,#f8f5e9 60%,#e9f2e9)}.authOrbit{position:absolute;width:38vw;height:38vw;max-width:500px;max-height:500px;border:1px solid #85eeb13a;border-radius:40%;filter:blur(1px);pointer-events:none;animation:authFloat 13s ease-in-out infinite alternate}.authOrbitOne{top:3%;left:-12%;transform:rotate(28deg)}.authOrbitTwo{bottom:-20%;right:-10%;animation-delay:-5s}.authGlass{position:relative;z-index:1;display:grid;grid-template-columns:1fr 1.1fr;width:min(100%,980px);min-height:520px;overflow:hidden;border:1px solid var(--edge);border-radius:32px;background:var(--pane);backdrop-filter:blur(26px);box-shadow:0 30px 100px #00190f80,inset 0 1px #ffffff30}.authArt{padding:45px 34px;display:flex;flex-direction:column;justify-content:center;background:radial-gradient(circle at 40% 30%,#2b876c88,transparent 60%),linear-gradient(150deg,#0b392b,#09201c);color:#f4fff7}.authArt>span,.authTop>span{font-size:11px;font-weight:800;letter-spacing:.2em;color:#ccebbd}.authSymbol{display:grid;place-items:center;line-height:1.4;text-align:center;filter:drop-shadow(0 0 25px #85e5ac77);animation:authFloat 8s ease-in-out infinite alternate}.authArt h1{font-size:clamp(21px,4vw,31px);font-weight:600;letter-spacing:-.04em;line-height:1.12;margin:0}.authArt p{color:#c4ddce}.authMiniWidgets{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:25px}.authMiniWidgets>div{display:grid;gap:7px;padding:13px 9px;border:1px solid #b5eac744;border-radius:17px;background:#d9ffe30e;animation:authFloat 7s ease-in-out infinite alternate}.authMiniWidgets>div:nth-child(2){animation-delay:-2s}.authMiniWidgets>div:nth-child(3){animation-delay:-4s}.authMiniWidgets img{width:100%;height:75px;object-fit:contain;filter:drop-shadow(0 8px 14px #0006)}.authMiniWidgets b{font-size:12px}.authMiniWidgets small{font-size:10px;color:#bed9c7}.authPanel{padding:35px;display:flex;flex-direction:column;justify-content:center}.authTop{display:flex;align-items:center;justify-content:space-between;gap:10px}.authTop>span{color:var(--muted)}.authTop button,.authSwitch,.authEmailLink{border:1px solid var(--edge);background:#75be8b15;color:var(--fg);padding:10px 12px;border-radius:14px;cursor:pointer;text-decoration:none;font-size:12px}.authPanel h2{font-size:clamp(21px,4vw,31px);font-weight:600;letter-spacing:-.04em;line-height:1.12;margin:22px 0 6px}.authLead,.authSignInHint{color:var(--muted);font-size:13px;line-height:1.6}.authSwitch{margin:15px 0;text-align:center}.authMethods{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0}.authMethods button{display:flex;flex-direction:column;align-items:center;gap:5px;padding:14px 6px;background:#5b97751c;color:var(--fg);border:1px solid var(--edge);border-radius:16px;cursor:pointer;transition:transform .3s,box-shadow .3s}.authMethods button.selected{border-color:#a9e8b3;box-shadow:0 0 22px #75e89b40;transform:translateY(-2px)}.authMethods small{font-size:10px;color:var(--muted)}.authAffirm{display:flex;align-items:flex-start;gap:10px;color:var(--muted);font-size:12px;line-height:1.5;margin:12px 0}.authAffirm input{accent-color:#42bd79;margin-top:3px}.authForm{display:grid;gap:10px}.authForm label{font-size:12px;color:var(--muted)}.authForm input{display:block;width:100%;box-sizing:border-box;margin-top:5px;border:1px solid var(--edge);border-radius:12px;background:#6b9d8220;color:var(--fg);padding:12px;font-size:14px}.authAction,.authGoogle{border:1px solid #98d9b2;border-radius:14px;padding:14px;font-weight:800;cursor:pointer;transition:box-shadow .3s,background .3s}.authAction{background:#476452;color:#d2dfd4;opacity:.55}.authAction.ready{opacity:1;background:linear-gradient(100deg,#9fe2a9,#e4d59d);color:#133624;box-shadow:0 0 24px #5cf7a64b}.authAction:disabled{cursor:not-allowed}.authGoogle{background:#f5f8f2;color:#163d2a;margin-top:12px}.authGoogle span{font-size:19px;margin-right:8px}.authMessage{color:#e8c98b;font-size:12px}.authLegal{font-size:11px;line-height:1.6;color:var(--muted);margin-top:20px}.authLegal a{color:inherit}.authEmailLink{text-align:center;margin:10px 0}@keyframes authFloat{from{translate:0 -5px}to{translate:0 7px}}@media(max-width:700px){.authPreview{padding:76px 12px 22px;align-items:start}.authGlass{grid-template-columns:1fr;border-radius:25px}.authArt{padding:19px 22px}.authSymbol{display:none}.authArt h1{font-size:25px}.authArt p{margin:5px 0}.authMiniWidgets{margin-top:8px}.authMiniWidgets>div{padding:8px}.authMiniWidgets img{height:45px}.authPanel{padding:22px}.authPanel h2{margin-top:12px}.authMethods button{padding:10px 4px}}@media(prefers-reduced-motion:reduce){.authOrbit,.authSymbol,.authMiniWidgets>div{animation:none}}
`}</style></main>;
}
