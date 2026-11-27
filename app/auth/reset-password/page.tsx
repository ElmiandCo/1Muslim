"use client";
import {useEffect,useState,type FormEvent} from "react";
import Link from "next/link";
import {createClient} from "../../../utils/supabase/client";
import {passwordWarning} from "../../lib/auth-password-policy";
import "./reset.css";
export default function ResetPasswordPage(){
 const [ready,setReady]=useState(false),[password,setPassword]=useState(""),[repeat,setRepeat]=useState("");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[complete,setComplete]=useState(false),[checking,setChecking]=useState(true);
 useEffect(()=>{
  let active=true;
  const client=createClient();
  const {data:{subscription}}=client.auth.onAuthStateChange((event,session)=>{
   if(active&&(event==="PASSWORD_RECOVERY"||Boolean(session))){setReady(true);setChecking(false)}
  });
  void (async()=>{
   try{
    const params=new URLSearchParams(window.location.search);
    const code=params.get("code");
    if(code){const {error}=await client.auth.exchangeCodeForSession(code);if(error)throw error}
    const {data:{user}}=await client.auth.getUser();
    if(active&&user){setReady(true);setChecking(false)}
   }catch{if(active){setReady(false);setChecking(false)}}
  })();
  const timer=setTimeout(()=>{if(active)setChecking(false)},5500);
  return()=>{active=false;subscription.unsubscribe();clearTimeout(timer)};
 },[]);
 const warning=passwordWarning(password,"","");
 async function submit(e:FormEvent){
  e.preventDefault();if(busy)return;
  setError("");if(warning){setError(warning);return}
  if(password!==repeat){setError("Passwords must match exactly.");return}
  setBusy(true);
  try{
   const {error}=await createClient().auth.updateUser({password});
   if(error)throw error;
   setComplete(true);setPassword("");setRepeat("");
  }catch{setError("We couldn't update your password. Please request a fresh reset link.")}
  finally{setBusy(false)}
 }
 return <main className="dsResetPage"><header><Link href="/search" aria-label="Return to One Muslim Search Home">One Muslim<span>.live</span></Link></header>
 <section className="dsResetCard" aria-label="Secure password recovery">
  {complete?<><span className="dsResetEyebrow">ACCOUNT SECURED</span><h1>Password updated</h1><p>Your new password is saved. You can sign in through Search Home.</p><Link className="dsResetAction" href="/search?auth=signin">Return to Search Home →</Link></>:
  <><span className="dsResetEyebrow">ONE MUSLIM ID</span><h1>Set a new password</h1><p>The reset link verifies your account. Choose a stronger password to continue.</p>
    {checking?<p role="status">Checking your secure reset link…</p>:!ready?<><p role="alert">This link is expired or unavailable. Request another one to continue.</p><Link className="dsResetAction" href="/search?auth=recover">Request a new link →</Link></>:
    <form onSubmit={submit}><label htmlFor="dsNewPassword">New password</label><input id="dsNewPassword" type="password" autoComplete="new-password" minLength={12} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="12 or more characters"/>
    {password&&<small aria-live="polite">{warning||"✓ Password requirements passed"}</small>}
    <label htmlFor="dsAgainPassword">Confirm password</label><input id="dsAgainPassword" type="password" autoComplete="new-password" required value={repeat} onChange={e=>setRepeat(e.target.value)} placeholder="Repeat your new password"/>
    <button className="dsResetAction" disabled={busy||Boolean(warning)||password!==repeat}>{busy?"Saving…":"Update password →"}</button></form>}
  </>}
  {error&&<p className="dsResetError" role="alert">{error}</p>}
  <Link className="dsResetBack" href="/search">← Back to search</Link>
 </section></main>;
}
