"use client";
import {useState} from "react";
import Link from "next/link";
import SiteNav from "../components/SiteNav";
import {createClient} from "../../utils/supabase/client";

export default function WelcomePage(){
 const [agreed,setAgreed]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const guestPass=()=>{
  if(!agreed){setMessage("Please acknowledge the community safety notice first.");return}
  try{sessionStorage.setItem("1muslim-guest-pass","acknowledged")}catch{}
  window.location.assign("/");
 };
 const google=async()=>{
  if(!agreed){setMessage("Please acknowledge the community safety notice first.");return}
  setBusy(true);setMessage("");
  const {error}=await createClient().auth.signInWithOAuth({provider:"google",options:{redirectTo:`${window.location.origin}/auth/callback?next=/`}});
  if(error){setMessage(error.message);setBusy(false)}
 };
 return <main className="welcomeRoot"><SiteNav compact/><section className="welcomeBox">
 <img className="welcomeBird" src="/assets/hudhud-logo.PNG" alt="HudHud"/>
 <div className="welcomeEyebrow">1MUSLIM · COMMUNITY SAFETY NOTICE</div>
 <h1>Suspicious non-Muslim activity? Help keep this space respectful.</h1>
 <p>1Muslim is a Muslim learning and community space. If you are visiting as a guest, you are welcome to explore public content respectfully. Harassment, impersonation, and attempts to disrupt discussions are not permitted, regardless of anyone's beliefs.</p>
 <p><strong>Guest access is limited.</strong> Some features require a verified account and Shahada confirmation. This notice does not determine anyone's religion or grant member privileges.</p>
 <label className="welcomeConsent"><input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)}/><span>✓ I understand the community rules and agree to respect this space.</span></label>
 <div className="welcomeActions">
 <button type="button" className="welcomePrimary" disabled={!agreed} onClick={guestPass}>Continue with Guest Pass →</button>
 <button type="button" className="welcomeGoogle" disabled={!agreed||busy} onClick={google}><strong className="googleMark">G</strong>{busy?"Connecting…":"Sign in with Google"}</button>
 </div>
 {message&&<p role="alert" className="welcomeError">{message}</p>}
 <div className="welcomeShahada"><p>Ready to sincerely affirm the Shahada?</p><Link href="/auth?shahada=1">Create an account and continue to Shahada →</Link></div>
 <div className="welcomeLinks"><Link href="/auth">Already a member? Sign in</Link><Link href="/terms">Community terms</Link></div>
 </section><style jsx>{`
 .welcomeRoot{min-height:100dvh;background:radial-gradient(circle at 50% 15%,#152e50,#050916 72%);color:#f2faff;padding-bottom:120px}
 .welcomeBox{max-width:550px;margin:35px auto;padding:clamp(20px,5vw,40px);border:1px solid #6eafff66;border-radius:26px;background:#0b1929ee;text-align:center;box-shadow:0 0 60px #624cff1c}
 .welcomeBird{width:96px;height:96px;object-fit:contain;filter:drop-shadow(0 0 19px #7f68ff)}
 .welcomeEyebrow{font-size:11px;letter-spacing:.17em;color:#9edcff;margin-top:12px}
 h1{font-size:clamp(25px,5.5vw,37px);line-height:1.2;margin:20px 0}
 p{line-height:1.7;color:#d0dcea}
 .welcomeConsent{display:flex;align-items:center;gap:13px;text-align:left;border:1px solid #6bcbff77;background:#123047;padding:18px;border-radius:16px;margin:25px 0;line-height:1.6}
 .welcomeConsent input{width:23px;height:23px;accent-color:#66b8ff;flex:none}
 .welcomeActions{display:grid;gap:13px}
 .welcomeActions button{padding:16px;border-radius:14px;font-size:15px;font-weight:900;cursor:pointer}
 .welcomePrimary{border:0;background:linear-gradient(100deg,#6de7ff,#b798ff);color:#071329}
 .welcomeGoogle{border:1px solid #a4d6ee;background:#f9fcff;color:#13243b;display:flex;justify-content:center;align-items:center;gap:12px}
 .googleMark{font-size:21px;color:#4285f4}
 .welcomeActions button:disabled{opacity:.45;cursor:not-allowed}
 .welcomeError{color:#ffb4ae}
 .welcomeShahada{margin-top:25px;padding:18px;border:1px solid #987aff77;border-radius:16px;background:#201a3d}
 .welcomeShahada a{display:block;color:#c8baff;font-weight:800;margin:8px 0}
 .welcomeLinks{display:flex;justify-content:center;gap:22px;margin-top:28px;font-size:12px}
 .welcomeLinks a{color:#a5dfff}
 `}</style></main>
}
