"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth"); return; }
      const { data: profile } = await supabase.from("profiles").select("gender").eq("id", user.id).single();
      if (profile?.gender) { router.replace("/"); return; }
      setChecking(false);
    })();
  }, [router]);

  const continueToOneMuslim = async () => {
    if (!gender) { setMessage("Please select a gender to continue."); return; }
    setSaving(true); setMessage("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/auth"); return; }
    const { error } = await supabase.from("profiles").update({
      gender,
      avatar_gender: gender,
      avatar_config: { accent: "emerald", gender, package: "starter", accessories: [] }
    }).eq("id", user.id).is("gender", null);
    if (error) { setMessage(error.message); setSaving(false); return; }
    router.replace("/");
  };

  if (checking) return <main className="onboardingPage"><section className="onboardingCard"><span className="eyebrow">1MUSLIM</span><h1>Preparing your profile…</h1></section></main>;

  return <main className="onboardingPage"><section className="onboardingCard">
    <span className="eyebrow">WELCOME TO 1MUSLIM</span>
    <h1>Choose your profile.</h1>
    <p className="lead">Select your gender once. This sets your default profile avatar and stays fixed after setup.</p>
    <div className="genderGrid">
      <button className={gender==="male"?"genderCard selected":"genderCard"} onClick={()=>setGender("male")}><img src="/assets/avatars/default-male.jpg" alt="" /><strong>Male</strong><span>Use the male default avatar</span></button>
      <button className={gender==="female"?"genderCard selected":"genderCard"} onClick={()=>setGender("female")}><img src="/assets/avatars/default-female.jpg" alt="" /><strong>Female</strong><span>Use the female default avatar</span></button>
    </div>
    {message && <div className="error">{message}</div>}
    <button className="continue" onClick={continueToOneMuslim} disabled={saving}>{saving ? "Saving…" : "Continue to 1Muslim →"}</button>
    <small>This selection cannot be changed later.</small>
  </section>
  <style jsx>{`
    .onboardingPage{min-height:100vh;background:#050805;color:#f4f7f4;display:grid;place-items:center;padding:24px}
    .onboardingCard{width:min(760px,100%);border:1px solid #1d2921;background:linear-gradient(145deg,#0d140f,#070b08);border-radius:28px;padding:34px;box-shadow:0 30px 100px rgba(0,0,0,.45)}
    .eyebrow{font-size:10px;letter-spacing:.16em;color:#94ad91;font-weight:850}.onboardingCard h1{font-size:42px;letter-spacing:-.06em;margin:12px 0 8px}.lead{color:#89968d;line-height:1.6;font-size:14px;max-width:580px}
    .genderGrid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:26px 0}.genderCard{background:#0a100c;border:1px solid #253128;border-radius:20px;padding:16px;color:#eaf0eb;text-align:left;cursor:pointer;transition:.2s}.genderCard:hover,.genderCard.selected{border-color:#a9c890;transform:translateY(-2px)}.genderCard img{display:block;width:100%;aspect-ratio:1/1;object-fit:contain;background:#000;border-radius:15px;margin-bottom:13px}.genderCard strong{display:block;font-size:16px}.genderCard span{display:block;color:#76837a;font-size:10px;margin-top:5px}
    .continue{width:100%;border:0;border-radius:12px;padding:13px;background:#d6e7b8;color:#071008;font-weight:850;cursor:pointer}.continue:disabled{opacity:.65}.onboardingCard small{display:block;text-align:center;color:#657269;font-size:10px;margin-top:11px}.error{color:#ffbcbc;font-size:11px;margin-bottom:10px}
    @media(max-width:620px){.onboardingCard{padding:22px}.onboardingCard h1{font-size:34px}.genderGrid{grid-template-columns:1fr}}
  `}</style>
</main>;
}
