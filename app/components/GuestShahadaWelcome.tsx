"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {createClient} from "../../utils/supabase/client";

export default function GuestShahadaWelcome({signedIn,dayMode}:{signedIn:boolean|null;dayMode:boolean}){
 const [open,setOpen]=useState(false);
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [attempts,setAttempts]=useState(0);
 useEffect(()=>{if(signedIn!==false){setOpen(false);return}let timer:ReturnType<typeof setTimeout>;const show=()=>{if(document.visibilityState!=="visible")return;try{if(sessionStorage.getItem("1muslim:guest-gate-dismissed")==="yes")return}catch{}setOpen(true)};const restart=()=>{clearTimeout(timer);timer=setTimeout(show,5000)};const events=["pointerdown","keydown","touchstart","scroll"] as const;events.forEach(name=>window.addEventListener(name,restart,{passive:true}));document.addEventListener("visibilitychange",restart);restart();return()=>{clearTimeout(timer);events.forEach(name=>window.removeEventListener(name,restart));document.removeEventListener("visibilitychange",restart)}},[signedIn]);
 const close=()=>{setOpen(false);try{sessionStorage.setItem("1muslim:guest-gate-dismissed","yes")}catch{}};
 const signIn=async(e:React.FormEvent)=>{e.preventDefault();if(busy||attempts>=5)return;setBusy(true);setError("");const {error:authError}=await createClient().auth.signInWithPassword({email:email.trim(),password});setBusy(false);if(authError){setAttempts(v=>v+1);setError("Sign-in failed. Check your details or try again later.");return}close()};
 const google=async()=>{setBusy(true);setError("");const {error:authError}=await createClient().auth.signInWithOAuth({provider:"google",options:{redirectTo:`${window.location.origin}/auth/callback?next=/`}});if(authError){setError(authError.message);setBusy(false)}};
 if(!open||signedIn!==false)return null;
 return <div className={"guestShahadaBackdrop"+(dayMode?" guestShahadaDay":"")} role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}>
 <section className="guestShahadaCard" role="dialog" aria-modal="true" aria-labelledby="guest-shahada-title">
 <button className="guestShahadaClose" type="button" aria-label="Close welcome" onClick={close}>×</button>
 <div className="guestParticleField" aria-hidden="true">{Array.from({length:18},(_,i)=><i key={i} style={{left:`${(i*37)%100}%`,top:`${(i*29)%100}%`,animationDelay:`${(i%9)*-.37}s`}}/>)}</div><span className="guestShahadaEyebrow">1MUSLIM <span aria-hidden="true">✦</span> بِسْمِ اللَّهِ</span>
 <h2 id="guest-shahada-title">Your way into <span>1Muslim.</span></h2>
 <p className="guestShahadaLead">Choose your path. Returning members can sign in; new members can begin with HudHud and the Shahada.</p>
 <div className="guestShahadaChoices"><Link onClick={close} href="/auth?shahada=1&method=audio">✦ Shahada Voice</Link><button type="button" onClick={()=>document.getElementById("guest-existing-signin")?.scrollIntoView({behavior:"smooth",block:"center"})}>↗ Sign In</button></div><div className="guestAlternative"><Link onClick={close} href="/auth?shahada=1&method=declaration">Written Shahada instead →</Link></div>
 <div className="guestShahadaDivider" id="guest-existing-signin"><span>Already have an account? Email or Google</span></div>
 <form onSubmit={signIn}><label>Email address<input autoComplete="username" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address"/></label><label>Password<input autoComplete="current-password" type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password"/></label><button type="submit" disabled={busy||attempts>=5}>{attempts>=5?"Try again later":busy?"Signing in…":"Sign in →"}</button></form>
 <button className="guestShahadaGoogle" type="button" disabled={busy} onClick={google}>G &nbsp; Continue with Google</button>
 <p className="guestShahadaGoogleNote">Google may sign you in or create an account if you are new.</p>
 {error&&<p role="alert" className="guestShahadaError">{error}</p>}
 <button className="guestSkip" type="button" onClick={close}>Skip for now</button><small>New here? <Link href="/auth?shahada=1" onClick={close}>Create an account</Link> · <Link href="/auth" onClick={close}>Account help</Link></small>
 </section>
 <style>{`
 .guestShahadaCard{isolation:isolate}.guestParticleField{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0}.guestParticleField i{position:absolute;width:3px;height:3px;border-radius:50%;background:#e5d5a6;box-shadow:0 0 10px #f3da8b;animation:guestSpark 4s ease-in-out infinite}.guestShahadaChoices button{border:1px solid #b9a16a;border-radius:16px;padding:12px 8px;background:#143c30;color:#f2e2bb;font-weight:750;cursor:pointer}.guestAlternative{text-align:center;margin-top:-9px}.guestAlternative a{color:#e5cb91;font-size:12px}.guestSkip{display:block;width:100%;margin:8px 0 14px;background:transparent;border:1px solid #e5ce8d66;border-radius:13px;color:#e4d4a8;padding:10px;cursor:pointer}.guestShahadaBackdrop{animation:guestShahadaIn .65s ease both!important}.guestShahadaCard{animation:guestCardReveal .7s cubic-bezier(.2,.7,.2,1) both}@keyframes guestSpark{0%,100%{opacity:0;transform:translateY(18px) scale(.5)}50%{opacity:.8;transform:translateY(-22px) scale(1.5)}}@keyframes guestCardReveal{from{opacity:0;transform:translateY(25px) scale(.96);filter:blur(7px)}to{opacity:1;transform:none;filter:none}}@media(prefers-reduced-motion:reduce){.guestParticleField i,.guestShahadaCard{animation:none!important}} .guestShahadaCard{font-family:inherit!important;text-align:left;background:radial-gradient(ellipse at 18% 0%,#235944 0%,transparent 54%),radial-gradient(ellipse at 95% 95%,#193d36 0%,transparent 50%),#071914;border:1px solid #947a4e;box-shadow:0 25px 90px #000a;letter-spacing:normal}
 .guestShahadaCard:before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.08;background-image:repeating-linear-gradient(45deg,transparent 0 37px,#d7bf7d 38px,transparent 39px 76px),repeating-linear-gradient(-45deg,transparent 0 37px,#d7bf7d 38px,transparent 39px 76px);mask-image:linear-gradient(to bottom,#000,transparent 85%)}
 .guestShahadaCard>*{position:relative;z-index:1}
 .guestShahadaEyebrow{display:block;font-weight:750;letter-spacing:.2em;font-size:10px;color:#e1c58c}
 .guestShahadaCard h2{font-size:clamp(30px,6vw,44px);font-weight:850;letter-spacing:-.055em;line-height:1.06;margin:17px 0 10px;color:#f6f6eb}
 .guestShahadaCard h2 span{color:#e1c58c}
 .guestShahadaCard .guestShahadaLead{font-size:clamp(13px,2.5vw,15px);line-height:1.65;color:#adc2b2;margin:0}
 .guestShahadaChoices a{min-height:54px;display:flex;align-items:center;justify-content:center;text-align:center;font-size:clamp(11px,2vw,13px);border-radius:16px;transition:transform .25s ease,background .25s ease}
 .guestShahadaChoices a:hover,.guestShahadaCard button:hover{transform:translateY(-2px)}
 .guestShahadaDivider{font-size:clamp(11px,2vw,13px);font-weight:650;white-space:normal}
 .guestShahadaCard label{font-size:12px;font-weight:650;letter-spacing:.015em}
 .guestShahadaCard input{font-family:inherit;font-size:14px;min-height:45px}
 .guestShahadaCard form button,.guestShahadaGoogle{min-height:47px;font-size:13px;letter-spacing:.01em;border-radius:14px;transition:transform .25s ease}
 @media(max-width:440px){.guestShahadaChoices{grid-template-columns:1fr}.guestShahadaCard{padding:24px 20px}.guestShahadaCard h2{font-size:34px}}
 .guestShahadaGoogleNote{font-size:11px!important;margin:-3px 0 10px!important;color:#b8cbbb!important}
 .guestShahadaDay .guestShahadaCard{background:radial-gradient(ellipse at 12% 0%,#f2ecd8,#f9f9f0 78%);color:#143c2d;border-color:#bfa56a;box-shadow:0 24px 80px #163a2738}
 .guestShahadaDay .guestShahadaCard h2{color:#143c2d}.guestShahadaDay .guestShahadaCard h2 span,.guestShahadaDay .guestShahadaEyebrow{color:#84631f}
 .guestShahadaDay .guestShahadaCard p,.guestShahadaDay .guestShahadaCard .guestShahadaLead,.guestShahadaDay .guestShahadaCard label,.guestShahadaDay .guestShahadaCard small,.guestShahadaDay .guestShahadaGoogleNote{color:#38594b!important}
 .guestShahadaDay .guestShahadaDivider{color:#785c2d}.guestShahadaDay .guestShahadaCard input{background:#fff;color:#163a2b;border-color:#a5b8a6}
 .guestShahadaDay .guestShahadaClose{color:#755b27}.guestShahadaDay .guestShahadaCard small a{color:#146440}
 .guestShahadaBackdrop{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:18px;background:#04110bc9;backdrop-filter:blur(13px);animation:guestShahadaIn .4s ease}
 .guestShahadaCard{position:relative;overflow:auto;max-height:min(94dvh,800px);width:min(100%,440px);padding:clamp(20px,4vw,34px);border:1px solid #cdb26c88;border-radius:25px;background:radial-gradient(ellipse at 10% 0%,#245540,#0a231b 72%);color:#f7f2dc;box-shadow:0 24px 90px #0009;text-align:center}
 .guestShahadaClose{position:absolute;right:15px;top:12px;background:transparent;border:0;color:#e4cf9d;font-size:27px;cursor:pointer}
 .guestShahadaEyebrow{font-size:12px;color:#e4c783;letter-spacing:.12em}.guestShahadaCard h2{font-size:clamp(24px,5vw,32px);margin:12px 0}.guestShahadaCard p{font-size:13px;line-height:1.6;color:#d5dfcf}
 .guestShahadaChoices{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:22px 0}.guestShahadaChoices a,.guestShahadaCard form button{border:1px solid #b9a16a;border-radius:12px;padding:12px 8px;text-decoration:none;color:#102d22;background:#e7cf90;font-weight:750;font-size:12px}
 .guestShahadaChoices a:last-child{background:#153b2d;color:#f5e6ba}
 .guestShahadaDivider{display:flex;align-items:center;gap:10px;font-size:12px;color:#e5cb90;margin:15px 0}.guestShahadaDivider:before,.guestShahadaDivider:after{content:"";height:1px;flex:1;background:#d5b97750}
 .guestShahadaCard form{display:grid;gap:10px;text-align:left}.guestShahadaCard label{font-size:12px;color:#d5dcca}.guestShahadaCard input{display:block;width:100%;box-sizing:border-box;margin-top:5px;border-radius:10px;padding:12px;border:1px solid #bbad7c65;background:#071d16;color:#fff;font-size:14px}.guestShahadaCard form button{cursor:pointer;margin-top:5px}.guestShahadaGoogle{width:100%;margin:11px 0 14px;padding:12px;border:1px solid #bca67180;border-radius:12px;background:#f9f7ef;color:#183c2c;font-weight:700;cursor:pointer}.guestShahadaCard button:disabled{opacity:.55}.guestShahadaCard small{font-size:11px;color:#c8d1c4}.guestShahadaCard small a{color:#f0d18b}.guestShahadaError{color:#ffc5b6!important}
 @keyframes guestShahadaIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}@media(prefers-reduced-motion:reduce){.guestShahadaBackdrop{animation:none}}
 `}</style>
 </div>
}
