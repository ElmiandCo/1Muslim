"use client";
import {useState} from "react";
import Link from "next/link";
import SiteNav from "../components/SiteNav";
import {createClient} from "../../utils/supabase/client";
export default function WelcomePage(){
 const [email,setEmail]=useState(""),[agreed,setAgreed]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[complete,setComplete]=useState(false);
 const submit=async()=>{
  if(!agreed||!/^\S+@\S+\.\S+$/.test(email.trim())){setMessage("Please check the box and enter a valid email.");return}
  setBusy(true);setMessage("");
  const {error}=await createClient().from("guest_pass_requests").insert({email:email.trim().toLowerCase(),answers:[{question:"Do you agree to respect this Muslim learning space and await guest access approval?",answer:"Yes"}],follow_up_at:new Date(Date.now()+2*86400000).toISOString(),consent_follow_up:true});
  setBusy(false);
  if(error){setMessage("We couldn't submit your request. Please try again.");return}
  setComplete(true);
 };
 return <main className="welcomeRoot"><SiteNav compact/><section className="welcomeBox">
 <img className="welcomeBird" src="/assets/hudhud-logo.PNG" alt="HudHud"/>
 <div className="welcomeEyebrow">1MUSLIM · GUEST ACCESS</div>
 <h1>{complete?"Request received":"Welcome to 1Muslim"}</h1>
 {complete?<><p>Thanks! Look out for an email in the next 1–2 days. Access is pending review; submitting this form does not automatically unlock the site.</p><p>We cannot guarantee an email delivery time until the approval and email process is connected.</p></>:<>
 <p>One question before you enter: <strong>Do you agree to respect this Muslim learning space and wait for your access request to be reviewed?</strong></p>
 <label className="welcomeConsent"><input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)}/><span>✓ Yes, I agree. I understand access is not automatic and I may receive an email about my request.</span></label>
 <label className="welcomeEmail">Email address<input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/></label>
 <button className="welcomePrimary" disabled={busy||!agreed} onClick={submit}>{busy?"Submitting…":"Request access →"}</button>
 {message&&<p role="alert">{message}</p>}
 </>}
 <div className="welcomeLinks"><Link href="/auth">Already approved? Sign in</Link><Link href="/terms">Community terms</Link></div>
 </section><style jsx>{`
 .welcomeRoot{min-height:100dvh;background:radial-gradient(circle at 50% 15%,#152e50,#050916 72%);color:#f2faff;padding-bottom:120px}
 .welcomeBox{max-width:550px;margin:35px auto;padding:clamp(20px,5vw,40px);border:1px solid #6eafff66;border-radius:26px;background:#0b1929ee;text-align:center;box-shadow:0 0 60px #624cff1c}
 .welcomeBird{width:96px;height:96px;object-fit:contain;filter:drop-shadow(0 0 19px #7f68ff)}
 .welcomeEyebrow{font-size:11px;letter-spacing:.2em;color:#9edcff;margin-top:12px}
 h1{font-size:clamp(27px,6vw,42px)}p{line-height:1.75;color:#d0dcea}
 .welcomeConsent{display:flex;align-items:center;gap:13px;text-align:left;border:1px solid #6bcbff77;background:#123047;padding:20px;border-radius:16px;margin:26px 0;line-height:1.6}
 .welcomeConsent input{width:23px;height:23px;accent-color:#66b8ff;flex:none}
 .welcomeEmail{display:block;text-align:left;color:#b9dff2;font-size:13px}
 .welcomeEmail input{display:block;width:100%;padding:15px;margin:9px 0 22px;border:1px solid #73bce8;border-radius:12px;background:#071626;color:white}
 .welcomePrimary{padding:15px 24px;border:0;border-radius:14px;background:linear-gradient(100deg,#6de7ff,#b798ff);color:#071329;font-weight:900;cursor:pointer}
 .welcomePrimary:disabled{opacity:.45}
 .welcomeLinks{display:flex;justify-content:center;gap:22px;margin-top:28px;font-size:12px}
 .welcomeLinks a{color:#a5dfff}
 `}</style></main>
}