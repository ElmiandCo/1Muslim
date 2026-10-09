"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../utils/supabase/client";
import SiteNav from "../components/SiteNav";
import Link from "next/link";

const PRODUCTION_ORIGIN = "https://1muslim.vercel.app";

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("error")) {
      setMessage("Sign-in could not be completed. Please try again.");
    }
  }, []);

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
      <section className="authCard libraryCard"><div className="libraryLabel">✦ 1MUSLIM LIBRARY ✦</div>
        <span className="eyebrow">1MUSLIM ACCOUNT</span>
        <h1>Begin your chapter.</h1>
        <p>Enter a library of knowledge, reflection and community. Sign in or create your account to begin.</p>

        <div className="libraryBadge"><img src="/assets/badges/shahada-badge.png" alt="Shahada achievement badge" /><div><small>YOUR FIRST LIBRARY ACHIEVEMENT</small><strong>Shahada Verified</strong><p>Complete the Shahada by voice or checkbox during onboarding to earn this badge.</p><span>✦ Unlock after joining</span></div></div>
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
      <style jsx>{`
        .authPage{min-height:100vh;position:relative;overflow:hidden;background:radial-gradient(ellipse at 18% 25%,#264632 0%,transparent 50%),linear-gradient(125deg,#08110b,#14271c 50%,#070c09);color:#f6f0dd}
        .authPage:before{content:"";position:absolute;inset:90px 50% 0 2%;pointer-events:none;opacity:.24;background:repeating-linear-gradient(90deg,#9c804b 0 4px,transparent 4px 44px,#b39b65 45px 49px,transparent 50px 76px),repeating-linear-gradient(0deg,transparent 0 170px,#c1a774 171px 180px,transparent 181px 240px);mask-image:linear-gradient(90deg,#000,transparent)}
        .libraryCard{position:relative;margin:clamp(45px,8vh,110px) auto 70px;max-width:540px;padding:clamp(24px,5vw,48px);border:1px solid #a58b567a;border-radius:28px;background:linear-gradient(145deg,#172a20f5,#0b130ff5);box-shadow:0 30px 100px #000a,0 0 0 6px #b9a16b0d}
        .libraryLabel{text-align:center;color:#e3cb8b;font-size:11px;letter-spacing:.24em;font-weight:900;margin-bottom:26px}
        .libraryCard h1{font-family:Georgia,serif;letter-spacing:-.035em;font-size:clamp(32px,5vw,48px)}
        .libraryBadge{display:flex;align-items:center;gap:16px;padding:18px;margin:24px 0;border:1px solid #937b4a;border-radius:19px;background:linear-gradient(125deg,#2d3426,#14251c)}
        .libraryBadge img{width:112px;height:122px;object-fit:contain;filter:drop-shadow(0 8px 14px #0008)}
        .libraryBadge small{display:block;font-size:9px;letter-spacing:.12em;color:#dec78f;font-weight:800}
        .libraryBadge strong{display:block;color:#fff0bf;font-size:20px;margin:8px 0 5px}
        .libraryBadge p{font-size:12px;line-height:1.6;color:#c5cfbf;margin:0 0 8px}
        .libraryBadge span{font-size:11px;color:#d9c18a}
        @media(max-width:550px){.libraryCard{margin:30px 14px 55px}.libraryBadge{gap:10px;padding:12px}.libraryBadge img{width:82px;height:95px}.libraryBadge strong{font-size:17px}}
      `}</style>
    </main>
  );
}
