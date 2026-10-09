"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../utils/supabase/client";
import SiteNav from "../components/SiteNav";
import Link from "next/link";

const PRODUCTION_ORIGIN = "https://1muslim.vercel.app";

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isShahadaSignup, setIsShahadaSignup] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("shahada") === "1") setIsShahadaSignup(true);
    if (new URLSearchParams(window.location.search).get("error")) {
      setMessage("Sign-in could not be completed. Please try again.");
    }
  }, []);

  const signupWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if(password.length < 8){setMessage("Choose a password with at least 8 characters.");return;}
    setLoading(true);setMessage("");
    const {data,error}=await createClient().auth.signUp({email:email.trim().toLowerCase(),password,options:{emailRedirectTo:`${window.location.origin}/auth/callback?next=/onboarding`}});
    setLoading(false);
    if(error){setMessage(error.message);return;}
    if(data.session){window.location.assign("/onboarding");return;}
    setMessage("Check your email to confirm your account, then continue to the Shahada page.");
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Always return to the current OneMuslim production site.
        // This prevents an old ESecure/WonMuslim origin from being reused.
        redirectTo: `${PRODUCTION_ORIGIN}/auth/callback?next=/`,
      },
    });

    if (error) {
      setLoading(false);
      setMessage(error.message);
    }
  };

  return (
    <main className="authPage">
      <SiteNav compact />
      <section className="authCard">
        <span className="eyebrow">1MUSLIM ACCOUNT</span>
        <h1>{isShahadaSignup ? "Begin your Shahada journey." : "Welcome back."}</h1>
        <p>Sign in to post, comment, follow, react, and take part in the community.</p>

        <button type="button" onClick={()=>{setIsShahadaSignup(!isShahadaSignup);setMessage("");}} style={{margin:"14px 0",padding:"12px 18px",borderRadius:12,border:"1px solid #72d9ff",background:"#10263c",color:"#d9f9ff",cursor:"pointer"}}>{isShahadaSignup?"← Back to sign in":"✓ I sincerely wish to affirm the Shahada — create account"}</button>
        {isShahadaSignup && <form onSubmit={signupWithEmail} style={{display:"grid",gap:12,margin:"16px 0 24px"}}><label>Email<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} style={{display:"block",width:"100%",padding:13,marginTop:6,borderRadius:10}}/></label><label>Create password<input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} style={{display:"block",width:"100%",padding:13,marginTop:6,borderRadius:10}}/></label><button type="submit" disabled={loading} className="googleButton">{loading?"Creating account…":"Create account & continue to Shahada →"}</button><small>Your Shahada is a sincere personal declaration, not a requirement to request guest access.</small></form>}
        <button className="googleButton" onClick={signInWithGoogle} disabled={loading}>
          <span className="googleG">G</span>
          {loading ? "Connecting…" : "Continue with Google"}
        </button>

        {message && <div className="authError">{message}</div>}

        <small>
          Your Google account is used for authentication through Supabase Auth.
          1Muslim does not receive your Google password.
        </small>
        <p style={{fontSize:12,lineHeight:1.7,marginTop:18,color:"#a9bcae"}}>By continuing, you agree to our <Link href="/terms" style={{color:"#a4edbc"}}>Terms of Service</Link> and acknowledge our <Link href="/privacy" style={{color:"#a4edbc"}}>Privacy Policy</Link>.</p>
      </section>
    </main>
  );
}
