"use client";
import {useEffect,useRef,useState} from "react";
import {createClient} from "../../utils/supabase/client";
import styles from "./SeamlessEntry.module.css";
type Stage="welcome"|"membership"|"guest"|"signin"|"signup"|"shahada"|"confirm";
export default function SeamlessEntry({onClose,initialStage="welcome",returnTo="/profile"}:{onClose:()=>void;initialStage?:Stage;returnTo?:string}){
 const [stage,setStage]=useState<Stage>(initialStage),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[method,setMethod]=useState<"audio"|"declaration">("audio"),[affirmed,setAffirmed]=useState(false);
 const [showPassword,setShowPassword]=useState(false),[fullName,setFullName]=useState(""),[username,setUsername]=useState("");
 const [closing,setClosing]=useState(false),[entering,setEntering]=useState(false);
 const [entryTheme,setEntryTheme]=useState("jannah");
 useEffect(()=>{try{const saved=(localStorage.getItem("1muslim-theme")||localStorage.getItem("1muslim-theme-color")||localStorage.getItem("1muslim:theme")||"jannah").toLowerCase();setEntryTheme(/ruby|red/.test(saved)?"ruby":/pink|hoor/.test(saved)?"hoor":/blue|sapphire|nur/.test(saved)?"nur":/gold|najma/.test(saved)?"najma":/black|obsidian|mulk/.test(saved)?"mulk":"jannah")}catch{}},[]);
 const card=useRef<HTMLDivElement>(null);
 useEffect(()=>{const t=requestAnimationFrame(()=>setEntering(true));return()=>cancelAnimationFrame(t)},[]);
 // Welcome stays interactive until the visitor chooses an action; no forced timed navigation.
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==="Escape")close()};document.addEventListener("keydown",key);return()=>document.removeEventListener("keydown",key)},[]);
 function close(){setClosing(true);setTimeout(onClose,240)}
 function change(next:Stage){setMessage("");setStage(next)}
 async function emailAuth(e:React.FormEvent){e.preventDefault();setBusy(true);setMessage("");try{
 const supabase=createClient();
 if(stage==="signin"){const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});if(error)throw error;sessionStorage.setItem("1muslim:last-auth","returning");window.dispatchEvent(new Event("1muslim:auth-updated"));window.location.assign(returnTo);return}
 if(!affirmed)throw Error("Please confirm your Shahada intention.");
 if(!fullName.trim()||!username.trim())throw Error("Enter your name and username.");
 if(password.length<8)throw Error("Use at least eight characters.");
 const destination="/onboarding?method="+method;
 const {data,error}=await supabase.auth.signUp({email:email.trim().toLowerCase(),password,options:{data:{full_name:fullName.trim(),display_name:fullName.trim(),username:username.trim()},emailRedirectTo:window.location.origin+"/auth/callback?next="+encodeURIComponent(destination)}});
 if(error)throw error;
 sessionStorage.setItem("1muslim:pending-shahada",method);
 if(data.session){window.location.assign(destination);return}
 change("confirm");
 }catch(err){setMessage(err instanceof Error?err.message:"Please try again.")}finally{setBusy(false)}}
 async function google(){setBusy(true);setMessage("");try{
 const next=stage==="signin"?returnTo:"/onboarding?method="+method;
 const callback=new URL("/auth/callback",window.location.origin);callback.searchParams.set("next",next);
 const {data,error}=await createClient().auth.signInWithOAuth({provider:"google",options:{redirectTo:callback.toString(),skipBrowserRedirect:true}});
 if(error||!data?.url)throw Error(error?.message||"Google sign-in could not start.");
 const authorization=new URL(data.url),redirect=authorization.searchParams.get("redirect_to");
 if(!redirect||new URL(redirect).origin!==window.location.origin||new URL(redirect).pathname!=="/auth/callback")throw Error("This Preview callback must be allowed in Supabase before Google sign-in.");
 window.location.assign(data.url);
 }catch(err){setMessage(err instanceof Error?err.message:"Google sign-in unavailable.")}finally{setBusy(false)}}
 return <div className={styles.backdrop} data-closing={closing} role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}>
 <section ref={card} className={styles.card} data-entering={entering} data-closing={closing} role="dialog" aria-modal="true" aria-label="1Muslim ID">
 <header className={styles.idHeader}><span className={styles.brandMark} aria-hidden="true">1M</span><strong>{stage==="signin"?"Sign in with":stage==="signup"||stage==="shahada"?"Sign up with":"Welcome to"} <span>1Muslim ID</span></strong><button type="button" className={styles.close} onClick={close} aria-label="Close">×</button></header>
 <div className={styles.idBody}>
 <div className={styles.identity}><span className={styles.identityMark} aria-hidden="true">1M</span><p>{stage==="signin"?"Welcome back. Your community is waiting.":stage==="signup"||stage==="shahada"?"One account. One Ummah. Your journey starts here.":"One Ummah. One Community. One Home."}</p></div>
 {(stage==="welcome"||stage==="membership"||stage==="signin"||stage==="signup"||stage==="shahada")&&<div className={styles.tabs} role="tablist" aria-label="Account access"><button type="button" role="tab" aria-selected={stage==="signin"} className={stage==="signin"?styles.selected:""} onClick={()=>change("signin")}>Sign in</button><button type="button" role="tab" aria-selected={stage==="signup"||stage==="shahada"} className={stage==="signup"||stage==="shahada"?styles.selected:""} onClick={()=>change("signup")}>Create account</button></div>}
 <div key={stage} className={styles.content}>
 {(stage==="welcome"||stage==="membership")&&<><h2>Welcome to 1Muslim</h2><p>Connect, learn, and grow together.</p><div className={styles.actions}><button onClick={()=>change("signin")}>Sign in</button><button onClick={()=>change("signup")}>Create account</button></div><button className={styles.guestLink} onClick={close}>Explore as guest →</button></>}
 {(stage==="signin"||stage==="signup"||stage==="shahada")&&<>
 <form className={styles.form} onSubmit={emailAuth}>
 <label className={styles.srOnly} htmlFor="one-id-email">Email address</label><input id="one-id-email" placeholder="Email address" autoComplete="email" type="email" required value={email} onChange={e=>setEmail(e.target.value)}/>
 {stage!=="signin"&&<><label className={styles.srOnly} htmlFor="one-id-name">Full name</label><input id="one-id-name" placeholder="Full name" autoComplete="name" required value={fullName} onChange={e=>setFullName(e.target.value)}/><label className={styles.srOnly} htmlFor="one-id-username">Username</label><input id="one-id-username" placeholder="Username" autoComplete="username" required value={username} onChange={e=>setUsername(e.target.value)}/></>}
 <div className={styles.passwordWrap}><label className={styles.srOnly} htmlFor="one-id-password">Password</label><input id="one-id-password" placeholder="Password" autoComplete={stage==="signin"?"current-password":"new-password"} type={showPassword?"text":"password"} minLength={stage==="signin"?undefined:8} required value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" className={styles.eye} onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?"Hide password":"Show password"}>{showPassword?"Hide":"Show"}</button></div>
 {stage==="signin"&&<a className={styles.forgot} href="/auth/forgot-password">Forgot password?</a>}
 {stage!=="signin"&&<div className={styles.shahadaBlock}><p>After registration, continue to Shahada verification.</p><div className={styles.methods}><button type="button" aria-pressed={method==="audio"} onClick={()=>setMethod("audio")}>Voice</button><button type="button" aria-pressed={method==="declaration"} onClick={()=>setMethod("declaration")}>Touch</button></div><label className={styles.affirm}><input type="checkbox" checked={affirmed} onChange={e=>setAffirmed(e.target.checked)}/> I sincerely intend to affirm the Shahada.</label></div>}
 <button className={styles.submit} disabled={busy||stage!=="signin"&&!affirmed} type="submit">{busy?"Please wait…":stage==="signin"?"Sign in":"Create account"}</button>
 </form>
 <div className={styles.divider}>or continue with</div><button type="button" className={styles.google} onClick={google} disabled={busy||stage!=="signin"&&!affirmed}><span aria-hidden="true">G</span> Google</button>
 </>}
 {stage==="guest"&&<><h2>You're welcome here.</h2><p>Explore public Qur’an, lessons and videos.</p><button className={styles.submit} onClick={close}>Explore 1Muslim</button></>}
 {stage==="confirm"&&<><h2>Check your inbox</h2><p>Confirm {email} to continue your Shahada verification.</p><button className={styles.submit} onClick={close}>Return home</button></>}
 </div>
 {message&&<p className={styles.error} role="alert">{message}</p>}
 </div>
 <footer className={styles.idFooter}><span>Secure access to your 1Muslim community.</span><button type="button" onClick={close}>← Back to home</button></footer>
 </section></div>;
}
