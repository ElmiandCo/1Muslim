"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteNav from "../components/SiteNav";
import { createClient } from "../../utils/supabase/client";

export default function SettingsPage() {
  const [enabled, setEnabled] = useState(false);
  const [elmiLight, setElmiLight] = useState(true);
  const [elmiSound, setElmiSound] = useState(false);
  const [hudhudVision, setHudhudVision] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try { setElmiLight(localStorage.getItem("1muslim-elmi-light") !== "off"); setElmiSound(localStorage.getItem("1muslim-elmi-light-sound") === "on"); setHudhudVision(localStorage.getItem("1muslim-hudhud-vision-enabled") !== "off"); } catch {}
    (async () => {
      const s = createClient();
      const { data: { user } } = await s.auth.getUser();
      if (!user) { setMessage("Sign in to manage your settings."); setLoading(false); return; }
      const { data } = await s.from("profiles").select("arabic_terms_enabled").eq("id", user.id).single();
      setEnabled(!!data?.arabic_terms_enabled);
      setLoading(false);
    })();
  }, []);

  const saveElmiLight = (next: boolean) => {
    setElmiLight(next);
    try { localStorage.setItem("1muslim-elmi-light", next ? "on" : "off"); } catch {}
    window.dispatchEvent(new Event("1muslim-elmi-light-updated"));
    setMessage(next ? "The Elmi Light is on. ✨" : "The Elmi Light is off on this device.");
  };

  const saveElmiSound = (next: boolean) => {
    setElmiSound(next);
    try { localStorage.setItem("1muslim-elmi-light-sound", next ? "on" : "off"); } catch {}
    window.dispatchEvent(new Event("1muslim-elmi-light-updated"));
    setMessage(next ? "Elmi Light sound effects enabled on this device. 🔊" : "Elmi Light sound effects muted.");
  };

  const saveHudhudVision = (next: boolean) => {
    setHudhudVision(next);
    try { localStorage.setItem("1muslim-hudhud-vision-enabled", next ? "on" : "off"); } catch {}
    window.dispatchEvent(new Event("1muslim:hudhud-vision-settings-updated"));
    setMessage(next ? "HudHud Vision is enabled. 🐦" : "HudHud Vision is disabled on this device.");
  };

  const saveArabic = async (next: boolean) => {
    setEnabled(next);
    setSaving(true);
    setMessage("");
    const s = createClient();
    const { data: { user } } = await s.auth.getUser();
    const { error } = await s.from("profiles").update({ arabic_terms_enabled: next }).eq("id", user?.id ?? "");
    setSaving(false);
    if (error) { setEnabled(!next); setMessage(error.message); return; }
    setMessage(next ? "Common Arabic terms are now shown across 1Muslim." : "Arabic term labels are off.");
    window.dispatchEvent(new Event("1muslim-settings-updated"));
  };

  const deactivateAccount = async () => {
    if (!window.confirm("Temporarily deactivate your 1Muslim account? Your content will be retained. You can sign in again to reactivate it.")) return;
    setDeactivating(true);setMessage("");
    const s=createClient();
    const {data:{user},error:authError}=await s.auth.getUser();
    if(authError||!user){setMessage("Sign in before deactivating.");setDeactivating(false);return}
    const {error}=await s.from("account_deactivations").upsert({user_id:user.id,deactivated_at:new Date().toISOString()},{onConflict:"user_id"});
    if(error){setMessage("Could not deactivate: "+error.message);setDeactivating(false);return}
    await s.auth.signOut();
    window.location.assign("/login?deactivated=1");
  };

  const deleteAccount = async () => {
    if (!window.confirm("Delete your 1Muslim account permanently? Your profile, posts, learning progress, friendships and other account-linked data will be removed. This cannot be undone.")) return;
    if (!window.confirm("Final confirmation: permanently delete this account?")) return;
    setDeleting(true); setMessage("");
    const s = createClient();
    const { error } = await s.rpc("delete_my_account");
    if (error) { setDeleting(false); setMessage(error.message); return; }
    await s.auth.signOut({ scope: "local" });
    window.location.href = "/";
  };

  if (loading) return <main><SiteNav compact/><section className="settingsShell"><p>Loading settings…</p></section></main>;

  return <main className="settingsPage">
    <SiteNav />
    <div className="settingsShell">
      <header className="settingsHero">
        <span className="eyebrow">SETTINGS</span>
        <h1>Make 1Muslim yours.</h1>
        <p>Control the small things that follow you around the site.</p>
      </header>

      <section className="settingsCard" data-no-tap-shimmer>
        <div className="settingCopy"><span className="settingIcon">🐦</span><div><span className="eyebrow">QUR'AN STUDIO · LEARNING</span><h2>HudHud Vision</h2><p>Enable HudHud's verse connections, contextual explanations, and learning guidance. You can still open and close Vision while studying.</p></div></div>
        <button type="button" className={"switch " + (hudhudVision ? "on" : "")} onClick={() => saveHudhudVision(!hudhudVision)} aria-pressed={hudhudVision} aria-label="Toggle HudHud Vision"><span>{hudhudVision ? "ON" : "OFF"}</span><i /></button>
      </section>
      <section className="settingsCard" data-no-tap-shimmer>
        <div className="settingCopy"><span className="settingIcon">✨</span><div><span className="eyebrow">SIGNATURE EFFECT · DEFAULT ON</span><h2>The Elmi Light</h2><p>Our signature vertical blue-and-gold glow follows HudHud as you move the handle, and adds shimmering light, sparkles, and dust to taps and celebrations across 1Muslim. Turn it off for a calmer experience. Your choice is saved on this device.</p></div></div>
        <button type="button" className={"switch " + (elmiLight ? "on" : "")} onClick={() => saveElmiLight(!elmiLight)} aria-pressed={elmiLight} aria-label="Toggle The Elmi Light"><span>{elmiLight ? "ON" : "OFF"}</span><i /></button>
      </section>

      <section className="settingsCard" data-no-tap-shimmer>
        <div className="settingCopy"><span className="settingIcon">🔊</span><div><span className="eyebrow">ELMI LIGHT · AUDIO</span><h2>Elmi Light Sounds</h2><p>Soft glass chimes, gathering light, and a playful pop synced with the visual sequences. Off by default. Sound only plays after you interact, and respects your device volume.</p></div></div>
        <button type="button" className={"switch " + (elmiSound ? "on" : "")} onClick={() => saveElmiSound(!elmiSound)} aria-pressed={elmiSound} aria-label="Toggle Elmi Light sounds"><span>{elmiSound ? "ON" : "OFF"}</span><i /></button>
      </section>

      <section className="settingsCard">
        <div className="settingCopy">
          <span className="settingIcon">ع</span>
          <div>
            <span className="eyebrow">LANGUAGE</span>
            <h2>Translate common words to Arabic</h2>
            <p>When enabled, common navigation and community words appear with their Arabic equivalents — for example <b>Ashab · أصحاب</b>.</p>
          </div>
        </div>
        <button className={"switch " + (enabled ? "on" : "")} onClick={() => void saveArabic(!enabled)} disabled={saving} aria-pressed={enabled}>
          <span>{enabled ? "ON" : "OFF"}</span><i />
        </button>
      </section>

      <section className="settingsCard">
        <div className="settingCopy">
          <span className="settingIcon">👥</span>
          <div>
            <span className="eyebrow">ASHAB · أصحاب</span>
            <h2>Your five Ashab</h2>
            <p>1Muslim keeps your closest circle intentionally small: up to <b>5 Ashab</b> friends.</p>
          </div>
        </div>
        <Link href="/ashab" className="ghost">Open Ashab →</Link>
      </section>

      <section className="settingsCard">
        <div className="settingCopy"><span className="settingIcon">⏸</span><div><span className="eyebrow">ACCOUNT · TEMPORARY</span><h2>Deactivate account</h2><p>Take a break without deleting your profile or posts. Your account is marked inactive and you will be signed out. Reactivation is available when you return.</p></div></div>
        <button type="button" className="deleteButton" onClick={()=>void deactivateAccount()} disabled={deactivating}>{deactivating?"Deactivating…":"Deactivate"}</button>
      </section>

      <section className="dangerCard">
        <div>
          <span className="eyebrow">ACCOUNT</span>
          <h2>Delete account</h2>
          <p>Permanently remove your 1Muslim account and account-linked data. This action cannot be undone.</p>
        </div>
        <button className="deleteButton" onClick={() => void deleteAccount()} disabled={deleting}>{deleting ? "Deleting…" : "Delete account"}</button>
      </section>

      {message && <div className="settingsMessage">{message}</div>}
    </div>

    <style jsx>{`
      .settingsShell{max-width:900px;margin:0 auto;padding:46px 20px 100px}
      .settingsHero{padding:20px 0 28px;border-bottom:1px solid var(--line)}
      .settingsHero h1{font-size:36px;margin:7px 0}
      .settingsHero p{color:var(--muted);max-width:600px}
      .settingsCard,.dangerCard{margin-top:14px;border:1px solid var(--line);background:var(--panel2);border-radius:20px;padding:20px;display:flex;align-items:center;justify-content:space-between;gap:18px}
      .settingCopy{display:flex;gap:15px;align-items:flex-start}
      .settingIcon{width:42px;height:42px;border:1px solid var(--line);border-radius:13px;display:grid;place-items:center;background:var(--panel);font-size:18px}
      .settingCopy h2,.dangerCard h2{margin:5px 0 6px;font-size:18px}
      .settingCopy p,.dangerCard p{margin:0;color:var(--muted);line-height:1.65;font-size:12px;max-width:620px}
      .switch{border:1px solid var(--line);background:#0b120d;color:#dce9df;border-radius:999px;padding:6px 8px 6px 12px;display:flex;align-items:center;gap:10px;font-size:9px;font-weight:900;min-width:76px;justify-content:space-between}
      .switch i{width:24px;height:24px;border-radius:50%;background:#4d5c51;display:block}
      .switch.on{background:#dbe9c4;color:#071008}
      .switch.on i{background:#173b24}
      .dangerCard{border-color:#4b2828;background:linear-gradient(135deg,#160e0e,#0d0b0b)}
      .deleteButton{border:1px solid #7b3b3b;background:#321313;color:#ffcaca;border-radius:999px;padding:11px 16px;font-size:10px;font-weight:900;white-space:nowrap}
      .settingsMessage{margin-top:12px;border:1px solid var(--line);background:var(--panel2);padding:12px 14px;border-radius:12px;color:#aebdb2;font-size:11px}
      @media(max-width:680px){.settingsCard,.dangerCard{align-items:flex-start;flex-direction:column}.settingsHero h1{font-size:30px}}
    `}
    </style>
  </main>;
}
