"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteNav from "../components/SiteNav";
import { createClient } from "../../utils/supabase/client";

export default function SettingsPage() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      const s = createClient();
      const { data: { user } } = await s.auth.getUser();
      if (!user) { setMessage("Sign in to manage your settings."); setLoading(false); return; }
      const { data } = await s.from("profiles").select("arabic_terms_enabled").eq("id", user.id).single();
      setEnabled(!!data?.arabic_terms_enabled);
      setLoading(false);
    })();
  }, []);

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

    <style jsx>{\`
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
    \`}
    </style>
  </main>;
}
