"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {createClient} from "../../utils/supabase/client";

export default function GuestShahadaWelcome({signedIn}:{signedIn:boolean|null}){
 const [open,setOpen]=useState(false);
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 useEffect(()=>{if(signedIn!==false){setOpen(false);return}const timer=window.setTimeout(()=>{try{if(sessionStorage.getItem("1muslim:guest-shahada-dismissed")==="yes")return}catch{}setOpen(true)},2000);return()=>clearTimeout(timer)},[signedIn]);
 const close=()=>{setOpen(false);try{sessionStorage.setItem("1muslim:guest-shahada-dismissed","yes")}catch{}};
 const signIn=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);setError("");const {error:authError}=await createClient().auth.signInWithPassword({email:email.trim(),password});setBusy(false);if(authError){setError(authError.message);return}close()};
 const google=async()=>{setBusy(true);setError("");const {error:authError}=await createClient().auth.signInWithOAuth({provider:"google",options:{redirectTo:`${window.location.origin}/auth/callback?next=/`}});if(authError){setError(authError.message);setBusy(false)}};
 if(!open)return null;
 return <div className="guestShahadaBackdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}>
 <section className="guestShahadaCard" role="dialog" aria-modal="true" aria-labelledby="guest-shahada-title">
 <button className="guestShahadaClose" type="button" aria-label="Close welcome" onClick={close}>×</button>
 <span className="guestShahadaEyebrow">✦ بِسْمِ اللَّهِ ✦</span>
 <h2 id="guest-shahada-title">Welcome to 1Muslim</h2>
 <p>Begin with the Shahada. Record your declaration or choose the written affirmation option.</p>
 <div className="guestShahadaChoices"><Link onClick={close} href="/onboarding">🎙 Record Shahada</Link><Link onClick={close} href="/onboarding">✓ Written affirmation</Link></div>
 <div className="guestShahadaDivider"><span>Already a 1Muslim account holder?</span></div>
 <form onSubmit={signIn}><label>Email address<input autoComplete="username" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address"/></label><label>Password<input autoComplete="current-password" type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password"/></label><button type="submit" disabled={busy}>{busy?"Signing in…":"Sign in →"}</button></form>
 <button className="guestShahadaGoogle" type="button" disabled={busy} onClick={google}>G &nbsp; Continue with Google</button>
 {error&&<p role="alert" className="guestShahadaError">{error}</p>}
 <small>New here? <Link href="/auth?shahada=1" onClick={close}>Create an account</Link> · <Link href="/auth" onClick={close}>Account help</Link></small>
 </section>
 <style>{`
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
