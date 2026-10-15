"use client";
import {useEffect,useRef,useState} from "react";
import {createClient} from "../../utils/supabase/client";
import styles from "./SeamlessEntry.module.css";
type Stage="welcome"|"membership"|"guest"|"signin"|"signup"|"shahada"|"confirm";
export default function SeamlessEntry({onClose}:{onClose:()=>void}){
 const [stage,setStage]=useState<Stage>("welcome"),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[method,setMethod]=useState<"audio"|"declaration">("audio"),[affirmed,setAffirmed]=useState(false);
 const [closing,setClosing]=useState(false),[entering,setEntering]=useState(false);
 const card=useRef<HTMLDivElement>(null);
 useEffect(()=>{const t=requestAnimationFrame(()=>setEntering(true));return()=>cancelAnimationFrame(t)},[]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==="Escape")close()};document.addEventListener("keydown",key);return()=>document.removeEventListener("keydown",key)},[]);
 function close(){setClosing(true);setTimeout(onClose,240)}
 function change(next:Stage){setMessage("");setStage(next)}
 async function emailAuth(e:React.FormEvent){e.preventDefault();setBusy(true);setMessage("");try{
 const supabase=createClient();
 if(stage==="signin"){const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});if(error)throw error;sessionStorage.setItem("1muslim:last-auth","returning");close();window.dispatchEvent(new Event("1muslim:auth-updated"));return}
 if(!affirmed)throw Error("Please confirm your Shahada intention.");
 if(password.length<8)throw Error("Use at least eight characters.");
 const destination="/onboarding?method="+method;
 const {data,error}=await supabase.auth.signUp({email:email.trim().toLowerCase(),password,options:{emailRedirectTo:window.location.origin+"/auth/callback?next="+encodeURIComponent(destination)}});
 if(error)throw error;
 sessionStorage.setItem("1muslim:pending-shahada",method);
 if(data.session){window.location.assign(destination);return}
 change("confirm");
 }catch(err){setMessage(err instanceof Error?err.message:"Please try again.")}finally{setBusy(false)}}
 async function google(){setBusy(true);setMessage("");try{
 const next=stage==="signin"?"/":"/onboarding?method="+method;
 const callback=new URL("/auth/callback",window.location.origin);callback.searchParams.set("next",next);
 const {data,error}=await createClient().auth.signInWithOAuth({provider:"google",options:{redirectTo:callback.toString(),skipBrowserRedirect:true}});
 if(error||!data?.url)throw Error(error?.message||"Google sign-in could not start.");
 const authorization=new URL(data.url),redirect=authorization.searchParams.get("redirect_to");
 if(!redirect||new URL(redirect).origin!==window.location.origin||new URL(redirect).pathname!=="/auth/callback")throw Error("This Preview callback must be allowed in Supabase before Google sign-in.");
 window.location.assign(data.url);
 }catch(err){setMessage(err instanceof Error?err.message:"Google sign-in unavailable.")}finally{setBusy(false)}}
 return <div className={styles.backdrop} data-closing={closing} onMouseDown={e=>{if(e.target===e.currentTarget)close()}} role="presentation"><section ref={card} className={styles.card} data-entering={entering} data-closing={closing} role="dialog" aria-modal="true" aria-label="1Muslim seamless entry">
 <button className={styles.close} type="button" aria-label="Close and return home" onClick={close}>✕</button><span className={styles.kicker}>✦ 1MUSLIM · THE UMMAH</span><span className={styles.emblem} aria-hidden="true">۞</span>
 <div key={stage} className={styles.content}>
 {stage==="welcome"&&<><h2>Welcome home.</h2><p>Connect. Learn. Reflect. Together.</p><div className={styles.actions}><button onClick={()=>change("signin")}>Sign In →</button><button onClick={()=>change("membership")}>Not a Member ✦</button></div></>}
 {stage==="membership"&&<><h2>Are you Muslim?</h2><p>Choose how you'd like to begin.</p><div className={styles.actions}><button onClick={()=>change("signup")}>Yes · Sign Up →</button><button onClick={()=>change("guest")}>No · Explore as Guest</button></div></>}
 {stage==="guest"&&<><h2>You're welcome here.</h2><p>Explore public Qur’an, lessons and videos. Posting, commenting and messaging are reserved for members.</p><div className={styles.actions}><button onClick={close}>Explore 1Muslim →</button></div><small>The dedicated introduction to Islam and time-limited guest passes are upcoming features.</small></>}
 {stage==="signin"&&<><h2>Welcome back.</h2><p>Continue with your existing account.</p><button className={styles.google} onClick={google} disabled={busy}>G &nbsp; Continue with Google</button><form onSubmit={emailAuth} className={styles.form}><label>Email<input autoComplete="email" type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input autoComplete="current-password" type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button disabled={busy} type="submit">{busy?"Signing in…":"Sign In →"}</button></form></>}
 {stage==="signup"&&<><h2>Join the Ummah.</h2><p>Create an account, then complete your Shahada verification.</p><div className={styles.actions}><button onClick={()=>change("shahada")}>Continue →</button><button onClick={()=>change("signin")}>Already a member? Sign in</button></div></>}
 {stage==="shahada"&&<><h2>Shahada Studio</h2><p>Choose how to affirm your Shahada. Your guided verification follows account creation.</p><div className={styles.methods}><button aria-pressed={method==="audio"} onClick={()=>setMethod("audio")}>🎙 Voice</button><button aria-pressed={method==="declaration"} onClick={()=>setMethod("declaration")}>☝ Touch</button></div><label className={styles.affirm}><input type="checkbox" checked={affirmed} onChange={e=>setAffirmed(e.target.checked)}/> I sincerely intend to affirm the Shahada.</label><button className={styles.google} disabled={busy||!affirmed} onClick={google}>G &nbsp; Sign up with Google</button><form onSubmit={emailAuth} className={styles.form}><label>Email<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Create password<input type="password" minLength={8} required autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><button disabled={busy||!affirmed} type="submit">{busy?"Creating account…":"Create account →"}</button></form></>}
 {stage==="confirm"&&<><h2>Check your inbox ✉</h2><p>Confirm {email} to continue your Shahada verification.</p><button className={styles.google} onClick={close}>Return home</button></>}
 </div>
 {message&&<p className={styles.error} role="alert">{message}</p>}
 {stage!=="welcome"&&<button className={styles.back} onClick={()=>change(stage==="signin"?"welcome":stage==="membership"?"welcome":stage==="guest"?"membership":stage==="shahada"?"signup":"membership")}>← Back</button>}
 </section></div>
}
