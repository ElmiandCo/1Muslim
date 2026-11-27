"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {createClient} from "../../utils/supabase/client";
import "./search-auth-flow.css";
import {passwordWarning} from "../lib/auth-password-policy";

export type SearchAuthMode="signin"|"signup"|"recover"|"verify"|"shahada";
type Props={mode:SearchAuthMode;setMode:(next:SearchAuthMode)=>void;onClose:()=>void;onSignedIn:()=>void;returnTo:string};
const cleanId=(value:string)=>value.trim().replace(/^@/,"").toLowerCase();
const validId=(value:string)=>/^[\p{L}\p{N}_.-]{3,30}$/u.test(value);
const cleanName=(value:string)=>value.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"").slice(0,21);
const deriveNames=(name:string,suffix:string)=>{
 const parts=name.trim().split(/\s+/).map(cleanName).filter(Boolean);
 const first=parts[0]||"muslim",last=parts.length>1?parts[parts.length-1]:"";
 return [...new Set([[first,last].filter(Boolean).join("_"),[first,"muslim",last].filter(Boolean).join("_"),[first,"ibn",last].filter(Boolean).join("_"),[first,"مسلم"].join("_")].map(s=>s.slice(0,23)+"_"+suffix))].slice(0,4);
};
function GoogleMark(){
 return <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.25c0-.73-.07-1.42-.2-2.09H12v3.95h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.22c1.88-1.74 3-4.3 3-7.38Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.6-2.37l-3.22-2.5c-.9.6-2.05.96-3.38.96a6 6 0 0 1-5.64-4.17H3.04v2.58A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.36 13.92a6.02 6.02 0 0 1 0-3.84V7.5H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.5l3.32-2.58Z"/><path fill="#EA4335" d="M12 5.91c1.47 0 2.78.5 3.81 1.49l2.86-2.86A9.78 9.78 0 0 0 12 2a10 10 0 0 0-8.96 5.5l3.32 2.58A6 6 0 0 1 12 5.91Z"/></svg>;
}
export default function SearchAuthFlow({mode,setMode,onClose,onSignedIn,returnTo}:Props){
 const [step,setStep]=useState<"identity"|"security">("identity");
 const [identity,setIdentity]=useState(""),[email,setEmail]=useState(""),[fullName,setFullName]=useState("");
 const [handle,setHandle]=useState(""),[editedHandle,setEditedHandle]=useState(false);
 const [pass,setPass]=useState(""),[confirm,setConfirm]=useState("");
 const [reveal,setReveal]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const [idStatus,setIdStatus]=useState<"idle"|"checking"|"available"|"taken"|"unavailable">("idle");
 const [checkedId,setCheckedId]=useState("");
 const [attemptFailed,setAttemptFailed]=useState(false);
 const [suffix,setSuffix]=useState("");
 useEffect(()=>{
  // Generate on the client after hydration: six cryptographically random
  // characters. Final username availability is still checked server-side.
  const bytes=new Uint8Array(6);
  window.crypto.getRandomValues(bytes);
  setSuffix(Array.from(bytes,x=>(x%36).toString(36)).join(""));
 },[]);
 const fieldRef=useRef<HTMLInputElement>(null);
 const suggestions=suffix?deriveNames(fullName,suffix):[];
 const passwordIssue=passwordWarning(pass,fullName,email);
 useEffect(()=>{if(mode==="signin"||mode==="recover")setStep("identity");setMessage("");},[mode]);
 useEffect(()=>{if(mode==="signup"&&!editedHandle&&fullName.trim())setHandle(suggestions[0]||"");},[mode,fullName,editedHandle,suffix]);
 useEffect(()=>{
  if(mode!=="signup"||!validId(cleanId(handle))){setIdStatus("idle");setCheckedId("");return;}
  setIdStatus("checking");
  setCheckedId("");
  const controller=new AbortController();
  const timer=setTimeout(()=>{
   setIdStatus("checking");
   void fetch("/api/auth/id-access",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"check",identifier:cleanId(handle)}),signal:controller.signal})
    .then(async r=>{const body=await r.json();if(!r.ok)throw Error("Unavailable");return body;})
    .then(body=>{if(!controller.signal.aborted){setCheckedId(cleanId(handle));setIdStatus(body.available?"available":"taken");}})
    .catch(()=>{if(!controller.signal.aborted)setIdStatus("unavailable");});
  },450);
  return()=>{clearTimeout(timer);controller.abort()};
 },[mode,handle]);
 const change=(next:SearchAuthMode)=>{
  setMessage("");setPass("");setConfirm("");setReveal(false);setAttemptFailed(false);
  setStep("identity");setMode(next);
 };
 const finish=()=>{setBusy(false);setMessage("");try{sessionStorage.setItem("1muslim:member-home-arrival","1")}catch{};onSignedIn();};
 async function signin(event:FormEvent){
  event.preventDefault();if(busy)return;setBusy(true);setMessage("");
  try{
   const id=identity.trim();
   if(!id||!pass)throw Error("Enter your 1Muslim ID or email and password.");
   if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id)){
    const {error}=await createClient().auth.signInWithPassword({email:id.toLowerCase(),password:pass});
    if(error)throw Error("The credentials do not match. Try again or reset your password.");
   }else{
    const r=await fetch("/api/auth/id-access",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"signin",identifier:cleanId(id),password:pass}),cache:"no-store"});
    if(!r.ok)throw Error(r.status===429?"Too many attempts. Please try again shortly.":"The credentials do not match. Try again or reset your password.");
    // Refresh the Supabase browser session from the server's newly set auth cookies.
    await createClient().auth.getUser();
   }
   setPass("");finish();
  }catch(err){setAttemptFailed(true);setMessage(err instanceof Error?err.message:"Sign-in unavailable right now.");}
  finally{setBusy(false);}
 }
 async function signup(event:FormEvent){
  event.preventDefault();setMessage("");if(busy)return;
  if(step==="identity"){
   if(fullName.trim().length<3) {setMessage("Enter your full name.");return;}
   if(!validId(cleanId(handle))){setMessage("Use 3–30 letters, numbers, dots, hyphens or underscores for your 1Muslim ID.");return;}
   if(idStatus==="taken"&&checkedId===cleanId(handle)){setMessage("That 1Muslim ID is taken. Choose a suggestion.");return;}
   if(idStatus!=="available"||checkedId!==cleanId(handle)){setMessage("Please wait until your 1Muslim ID is confirmed available.");return;}
   setStep("security");return;
  }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())){setMessage("Enter a valid email so we can securely confirm your account.");return;}
  if(passwordIssue){setMessage(passwordIssue);return;}
  if(pass!==confirm){setMessage("Both passwords must match exactly.");return;}
  setBusy(true);
  try{
   // A preflight guard helps with spelling/collisions. Database constraints
   // still decide final availability at account creation.
   const check=await fetch("/api/auth/id-access",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"check",identifier:cleanId(handle)}),cache:"no-store"});
   if(!check.ok||(await check.json()).available!==true)throw Error("This 1Muslim ID is no longer available. Go back and choose another.");
   const callback=new URL("/auth/callback",window.location.origin);
   callback.searchParams.set("next","/search?auth=shahada"+(returnTo!=="/search"?"&next="+encodeURIComponent(returnTo):""));
   const {data,error}=await createClient().auth.signUp({
    email:email.trim().toLowerCase(),password:pass,
    options:{data:{full_name:fullName.trim(),display_name:fullName.trim(),username:cleanId(handle)},emailRedirectTo:callback.toString()}
   });
   if(error)throw error;
   if(data.session){change("shahada");return;}
   change("verify");
  }catch(err){setMessage(err instanceof Error?err.message:"Registration is temporarily unavailable.");}
  finally{setBusy(false);}
 }
 async function recover(event:FormEvent){
  event.preventDefault();if(busy)return;setBusy(true);setMessage("");
  try{
   const id=identity.trim();
   if(!id)throw Error("Enter the email address or 1Muslim ID associated with your account.");
   if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id)){
    const {error}=await createClient().auth.resetPasswordForEmail(id.toLowerCase(),{redirectTo:window.location.origin+"/auth/reset-password"});
    if(error)throw error;
   }else{
    const r=await fetch("/api/auth/id-access",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"recover",identifier:cleanId(id)}),cache:"no-store"});
    if(!r.ok&&r.status===429)throw Error("Please wait before requesting another reset email.");
   }
   setMessage("If this account exists, a password reset link has been sent to its registered email. Never share your password.");
  }catch{setMessage("We couldn't send that request right now. Please retry shortly.");}
  finally{setBusy(false);}
 }
 async function google(){
  if(busy)return;setBusy(true);setMessage("");
  try{
   const next=mode==="signup"?"/search?auth=shahada"+(returnTo!=="/search"?"&next="+encodeURIComponent(returnTo):""):returnTo;
   const callback=new URL("/auth/callback",window.location.origin);
   callback.searchParams.set("next",next);
   const {data,error}=await createClient().auth.signInWithOAuth({provider:"google",options:{redirectTo:callback.toString(),skipBrowserRedirect:true}});
   if(error||!data?.url)throw Error(error?.message||"Google sign-in could not start.");
   const authUrl=new URL(data.url);
   const target=authUrl.searchParams.get("redirect_to");
   if(!target||new URL(target).origin!==window.location.origin||new URL(target).pathname!=="/auth/callback")
    throw Error("Google callback isn't configured for this site.");
   window.location.assign(data.url);
  }catch(err){setMessage(err instanceof Error?err.message:"Google sign-in is unavailable.");setBusy(false);}
 }
 const signinMode=mode==="signin";
 return <section className="dsInlineAuth" aria-label={signinMode?"Sign in to 1Muslim":"Create your 1Muslim account"}>
  <div className="dsInlineAuthTop">
   <span className="dsInlineAuthEyebrow">{signinMode?"WELCOME BACK":mode==="signup"?"JOIN ONE MUSLIM":mode==="verify"?"ALMOST THERE":"ACCOUNT RECOVERY"}</span>
   <button type="button" className="dsInlineAuthClose" aria-label="Close account form and return to search" onClick={onClose}>✕</button>
  </div>
  {mode==="verify"?<div className="dsInlineAuthMessage">
    <strong>Check your email</strong><p>We've sent a confirmation link to {email}. After confirming, HudHud will guide your Shahada on this same Search Home.</p>
    <button type="button" onClick={onClose}>Back to search</button>
   </div>:mode==="recover"?<form className="dsInlineAuthFields" onSubmit={recover}>
    <label htmlFor="dsRecoveryId">Email or 1Muslim ID</label><input id="dsRecoveryId" value={identity} onChange={e=>setIdentity(e.target.value)} autoComplete="username" required placeholder="Email or @1Muslim ID"/>
    <button type="submit" className="dsInlineAuthPrimary" disabled={busy}>{busy?"Sending…":"Email me a reset link"} →</button>
    <button type="button" className="dsInlineAuthTextLink" onClick={()=>change("signin")}>← Back to sign in</button>
   </form>:mode==="shahada"?<div className="dsInlineAuthMessage"><strong>HudHud is preparing your Shahada…</strong></div>:<>
   <div className="dsInlineAuthMode" aria-label="Account mode"><button type="button" aria-current={signinMode?"page":undefined} onClick={()=>change("signin")}>Sign in</button><button type="button" aria-current={!signinMode?"page":undefined} onClick={()=>change("signup")}>Create account</button></div>
   {signinMode?<form className="dsInlineAuthFields" onSubmit={signin}>
    <label htmlFor="dsSignIdentity">1Muslim ID or email</label>
    <input ref={fieldRef} id="dsSignIdentity" autoComplete="username" value={identity} onChange={e=>setIdentity(e.target.value)} placeholder="Your 1Muslim ID or email" required/>
    <label htmlFor="dsSignPass">Password</label>
    <div className="dsInlineAuthPassword"><input id="dsSignPass" type={reveal?"text":"password"} autoComplete="current-password" value={pass} onChange={e=>setPass(e.target.value)} required placeholder="Your password"/><button type="button" onClick={()=>setReveal(v=>!v)}>{reveal?"Hide":"Show"}</button></div>
    <button type="submit" className="dsInlineAuthPrimary" disabled={busy}>{busy?"Signing in…":"Sign in"} <span>→</span></button>
    {attemptFailed?<div className="dsInlineAuthRecoveryCue"><span>Need a new password?</span><button type="button" onClick={()=>change("recover")}>Reset securely →</button></div>:<button type="button" className="dsInlineAuthTextLink" onClick={()=>change("recover")}>Forgot your password?</button>}
   </form>:<form className="dsInlineAuthFields" onSubmit={signup}>
    {step==="identity"?<>
      <label htmlFor="dsJoinName">Full name</label><input id="dsJoinName" value={fullName} autoComplete="name" required minLength={3} onChange={e=>setFullName(e.target.value)} placeholder="Your full name"/>
      <label htmlFor="dsJoinHandle">Your 1Muslim ID</label><div className="dsInlineAuthAt"><span>@</span><input id="dsJoinHandle" autoComplete="username" value={handle} onChange={e=>{setEditedHandle(true);setHandle(cleanId(e.target.value))}} required placeholder="Choose your ID"/></div>
      <small className="dsInlineAuthHint" aria-live="polite">{idStatus==="available"&&checkedId===cleanId(handle)?"✓ This ID looks available":idStatus==="taken"?"Already in use — select another":idStatus==="checking"?"Checking availability…":idStatus==="unavailable"?"Couldn't check yet — retry shortly":"Choose a suggested ID or enter your own"}</small>
      {fullName.trim().length>2&&<div className="dsInlineSuggestions" aria-label="Suggested 1Muslim IDs">{suggestions.map(id=><button type="button" key={id} onClick={()=>{setEditedHandle(true);setHandle(id)}}>@{id}</button>)}</div>}
      <button className="dsInlineAuthPrimary" type="submit" disabled={busy}>Continue <span>→</span></button>
     </>:<>
      <p className="dsInlineAuthContext">Almost there, @{handle}. Your Shahada will follow account confirmation.</p>
      <label htmlFor="dsJoinEmail">Email address</label><input id="dsJoinEmail" value={email} type="email" required autoComplete="email" onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/>
      <label htmlFor="dsJoinPass">Create a strong password</label><div className="dsInlineAuthPassword"><input id="dsJoinPass" value={pass} type={reveal?"text":"password"} autoComplete="new-password" minLength={12} required onChange={e=>setPass(e.target.value)} placeholder="12+ characters"/><button type="button" onClick={()=>setReveal(v=>!v)}>{reveal?"Hide":"Show"}</button></div>
      {pass&&<small className={"dsInlineAuthHint "+(passwordIssue?"isWeak":"isGood")} aria-live="polite">{passwordIssue||"✓ Stronger password requirements passed"}</small>}
      <label htmlFor="dsJoinConfirm">Confirm password</label><input id="dsJoinConfirm" type={reveal?"text":"password"} autoComplete="new-password" required value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Repeat password"/>
      {confirm&&<small className={"dsInlineAuthHint "+(pass===confirm?"isGood":"isWeak")} aria-live="polite">{pass===confirm?"✓ Passwords match":"Passwords must match exactly"}</small>}
      <div className="dsInlineAuthActions"><button type="button" className="dsInlineAuthBack" onClick={()=>{setStep("identity");setMessage("")}}>← Back</button><button type="submit" className="dsInlineAuthPrimary" disabled={busy||Boolean(passwordIssue)||pass!==confirm}>{busy?"Creating account…":"Create account"} <span>→</span></button></div>
     </>}
   </form>}
   <div className="dsInlineAuthDivider"><span>or</span></div>
   <button type="button" className="dsInlineAuthGoogle" onClick={()=>void google()} disabled={busy}><GoogleMark/> Continue with Google</button>
   <small className="dsInlineAuthLegal">Your search remains free without an account. Creating an account begins the existing HudHud Shahada verification.</small>
  </>}
  {message&&<p role="status" className="dsInlineAuthStatus">{message}</p>}
 </section>;
}
