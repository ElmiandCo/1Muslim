"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../utils/supabase/client";
import SiteNav from "../components/SiteNav";

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
      <section className="authCard">
        <span className="eyebrow">1MUSLIM ACCOUNT</span>
        <h1>Welcome back.</h1>
        <p>Sign in to post, comment, follow, react, and take part in the community.</p>

        <button className="googleButton" onClick={signInWithGoogle} disabled={loading}>
          <span className="googleG">G</span>
          {loading ? "Connecting…" : "Continue with Google"}
        </button>

        {message && <div className="authError">{message}</div>}

        <small>
          Your Google account is used for authentication through Supabase Auth.
          1Muslim does not receive your Google password.
        </small>
      </section>
    </main>
  );
}
