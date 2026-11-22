"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../../utils/supabase/client";
import LocationPreferences, { readLocation } from "./LocationPreferences";
import {
  ADHAN_PRAYERS, ADHAN_PREVIEW_EVENT, ADHAN_STOP_EVENT,
  DEFAULT_ADHAN_PREFERENCES, type AdhanPreferences, type AdhanPrayer, type AdhanLocation,
  readAdhanPreferences, saveAdhanPreferences
} from "../lib/adhan";

const SETUP_KEY = "1muslim:prayer-setup-completed:v1";
const STEPS = ["Location", "Method", "Prayers", "Sound", "Review"] as const;
const METHODS = [
  ["2", "ISNA · North America"],
  ["3", "Muslim World League"],
  ["4", "Umm al-Qura · Makkah"],
  ["5", "Egyptian General Authority"]
] as const;
function methodLabel(method: AdhanPreferences["method"]) {
  return METHODS.find(item => item[0] === method)?.[1] || "ISNA · North America";
}

export default function AdhanSettings({
  inPrayerPage = false, location, onLocationSaved
}: {
  inPrayerPage?: boolean;
  location?: AdhanLocation;
  onLocationSaved?: (location: AdhanLocation) => void;
}) {
  const [prefs, setPrefs] = useState<AdhanPreferences>(DEFAULT_ADHAN_PREFERENCES);
  const [place, setPlace] = useState<AdhanLocation>({ city: "", state: "", country: "" });
  const [ready, setReady] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [locationEditor, setLocationEditor] = useState(false);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let live = true;
    setPlace(readLocation());
    void (async () => {
      const db = createClient();
      const saved = readAdhanPreferences();
      const { data: { user } } = await db.auth.getUser();
      if (!live) return;
      if (!user) {
        setPrefs(saved.enabled ? saved : { ...saved, enabled: true });
        setCompleted(localStorage.getItem(SETUP_KEY + ":device") === "1");
        setReady(true);
        return;
      }
      const { data, error: loadError } = await db.from("prayer_reminder_preferences")
        .select("enabled,method,volume,prayers,completed_at").eq("user_id", user.id).maybeSingle();
      if (!live) return;
      if (loadError) {
        setError("Account prayer settings could not be loaded. Check your connection before saving.");
        setPrefs(saved);
      } else if (data) {
        const restored: AdhanPreferences = {
          enabled: data.enabled === true,
          method: (METHODS.some(item => item[0] === data.method) ? data.method : "2") as AdhanPreferences["method"],
          volume: Math.max(0, Math.min(1, Number(data.volume ?? 0.8))),
          prayers: Object.fromEntries(ADHAN_PRAYERS.map(prayer => [prayer, data.prayers?.[prayer] !== false])) as Record<AdhanPrayer, boolean>
        };
        setPrefs(restored);
        saveAdhanPreferences(restored);
        setCompleted(Boolean(data.completed_at));
      } else {
        setPrefs(saved.enabled ? saved : { ...saved, enabled: true });
        setCompleted(false);
      }
      setReady(true);
    })();
    return () => { live = false; };
  }, []);

  useEffect(() => {
    if (location?.city && location?.country) setPlace(location);
  }, [location?.city, location?.state, location?.country]);

  const hasLocation = Boolean(place.city.trim() && place.country.trim());
  const placeLabel = [place.city, place.state, place.country].filter(Boolean).join(", ");
  const chosenPrayers = ADHAN_PRAYERS.filter(prayer => prefs.prayers[prayer]);
  const update = (patch: Partial<AdhanPreferences>) => { setPrefs(previous => ({ ...previous, ...patch })); setError(""); };
  const togglePrayer = (prayer: AdhanPrayer) => update({ prayers: { ...prefs.prayers, [prayer]: !prefs.prayers[prayer] } });
  const locationSaved = (next: AdhanLocation) => {
    setPlace(next);
    setLocationEditor(false);
    setError("");
    onLocationSaved?.(next);
  };

  const save = async () => {
    if (busy) return;
    if (!hasLocation) { setError("Save a city and country before completing prayer setup."); setStep(0); return; }
    if (prefs.enabled && chosenPrayers.length === 0) { setError("Select at least one prayer, or turn Adhan reminders off."); setStep(2); return; }
    setBusy(true); setError("");
    try {
      const db = createClient();
      const { data: { user }, error: authError } = await db.auth.getUser();
      if (authError) throw new Error("Could not verify your account. Try again.");
      if (user) {
        const { error: saveError } = await db.from("prayer_reminder_preferences").upsert({
          user_id: user.id,
          enabled: prefs.enabled,
          method: prefs.method,
          volume: prefs.volume,
          prayers: prefs.prayers,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id" });
        if (saveError) throw new Error("Could not save your prayer setup. Please try again.");
      }
      saveAdhanPreferences(prefs);
      localStorage.setItem(SETUP_KEY + ":" + (user?.id || "device"), "1");
      const firstTime = !completed;
      setNotice(firstTime
        ? user ? "Prayer times saved. Your prayer journey begins — see your Activity notification."
               : "Prayer times saved on this device. Sign in to sync and receive your journey notification."
        : "Prayer settings updated.");
      setEditing(false);
      if (firstTime && inPrayerPage) {
        setFinishing(true);
        window.setTimeout(() => { setCompleted(true); setFinishing(false); }, 650);
      } else setCompleted(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save prayer settings.");
    } finally { setBusy(false); }
  };

  const locationSection = <div className="adhanSection" key="location">
    <div className="adhanSectionHeading"><span className="adhanSectionNumber">01</span><div><h4>Saved prayer location</h4><p>Prayer times are calculated for your selected city.</p></div></div>
    {hasLocation && !locationEditor ? <div className="adhanLocationSummary">
      <span className="adhanLocationMark" aria-hidden="true">⌖</span>
      <div><strong>{placeLabel}</strong><small>City-level prayer schedule</small></div>
      <button type="button" onClick={() => setLocationEditor(true)}>Change</button>
    </div> : <LocationPreferences onSaved={locationSaved} />}
  </div>;

  const methodSection = <div className="adhanSection" key="method">
    <div className="adhanSectionHeading"><span className="adhanSectionNumber">02</span><div><h4>Calculation method</h4><p>Use the convention recommended for your region or mosque.</p></div></div>
    <label className="adhanMethodField" htmlFor="adhan-method">Prayer time convention
      <select id="adhan-method" value={prefs.method} onChange={event => update({ method: event.target.value as AdhanPreferences["method"] })}>
        {METHODS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </label>
  </div>;

  const prayerSection = <div className="adhanSection" key="prayers">
    <div className="adhanSectionHeading"><span className="adhanSectionNumber">03</span><div><h4>Choose your prayers</h4><p>Receive an Adhan for the prayer times you select.</p></div></div>
    <div className="adhanPrayerChoice" role="group" aria-label="Choose prayers for Adhan">
      {ADHAN_PRAYERS.map(prayer => <label key={prayer} className={"adhanPrayerCheck" + (prefs.prayers[prayer] ? " selected" : "")}>
        <input type="checkbox" checked={prefs.prayers[prayer]} onChange={() => togglePrayer(prayer)} />
        <span className="adhanCheckSymbol" aria-hidden="true">{prefs.prayers[prayer] ? "✓" : "+"}</span><span>{prayer}</span>
      </label>)}
    </div>
  </div>;

  const soundSection = <div className="adhanSection" key="sound">
    <div className="adhanSectionHeading"><span className="adhanSectionNumber">04</span><div><h4>Sound & reminders</h4><p>Control when the Adhan plays and preview the recitation.</p></div></div>
    <label className="adhanSwitchRow"><span><strong>Adhan reminders</strong><small>{prefs.enabled ? "Active while the site is open" : "Reminders are paused"}</small></span>
      <input type="checkbox" role="switch" checked={prefs.enabled} onChange={event => update({ enabled: event.target.checked })} />
      <span className="adhanSwitchVisual" aria-hidden="true" />
    </label>
    <div className="adhanSoundPanel">
      <div className="adhanAudioActions">
        <div><span className="adhanSoundIcon" aria-hidden="true">♫</span><span><strong>Adhan preview</strong><small>Listen before saving</small></span></div>
        <div><button type="button" aria-label="Play Adhan sample" onClick={() => window.dispatchEvent(new CustomEvent(ADHAN_PREVIEW_EVENT, { detail: { volume: prefs.volume } }))}>▶ Preview</button>
        <button type="button" aria-label="Stop Adhan preview" onClick={() => window.dispatchEvent(new Event(ADHAN_STOP_EVENT))}>■ Stop</button></div>
      </div>
      <label className="adhanVolume">Volume
        <input type="range" min="0" max="100" step="5" aria-label="Adhan playback volume" value={Math.round(prefs.volume * 100)}
          onChange={event => update({ volume: Number(event.target.value) / 100 })} />
        <span>{Math.round(prefs.volume * 100)}%</span>
      </label>
    </div>
    <p className="adhanDisclaimer">Your browser needs this site open for scheduled audio, and may require you to tap Preview first. Closed-app alerts require native push support; your device&apos;s silent settings may also limit playback.</p>
  </div>;

  const reviewSection = <div className="adhanSection" key="review">
    <div className="adhanSectionHeading"><span className="adhanSectionNumber">05</span><div><h4>Ready for your prayer journey</h4><p>Review your choices before saving your first setup.</p></div></div>
    <dl className="adhanReview">
      <div><dt>Location</dt><dd>{placeLabel || "Not yet set"}</dd></div>
      <div><dt>Method</dt><dd>{methodLabel(prefs.method)}</dd></div>
      <div><dt>Prayers</dt><dd>{chosenPrayers.length ? chosenPrayers.join(" · ") : "None selected"}</dd></div>
      <div><dt>Adhan</dt><dd>{prefs.enabled ? "On · while site is open" : "Off"}</dd></div>
    </dl>
    <p className="adhanJourneyHint">After saving, you&apos;ll receive a notification linking to <strong>The Story of Salah</strong>. You can change these settings anytime.</p>
  </div>;

  if (!ready) return <section className="adhanSettings adhanLoading" aria-live="polite">Loading prayer settings…</section>;

  if (inPrayerPage && completed && !editing) return <section className="adhanSettings adhanConfigured" aria-label="Prayer reminder settings">
    <div className="adhanSettingsTitle"><div><span className="adhanEyebrow">PRAYER REMINDERS · CONFIGURED</span>
      <h3>Your prayer settings</h3><p>Manage your daily rhythm whenever you need to.</p></div><span className="adhanConfiguredIndicator" aria-hidden="true">✓</span></div>
    <div className="adhanSummaryGrid">
      <div><span>LOCATION</span><strong>{placeLabel || "Choose city"}</strong></div>
      <div><span>METHOD</span><strong>{methodLabel(prefs.method)}</strong></div>
      <div><span>ADHAN</span><strong>{prefs.enabled ? "On" : "Off"}</strong></div>
      <div><span>SELECTED</span><strong>{chosenPrayers.length} prayers</strong></div>
    </div>
    <div className="adhanSummaryActions"><button type="button" onClick={() => { setEditing(true); setNotice(""); }}>Edit prayer settings <span aria-hidden="true">→</span></button>
      <Link href="/widget-tools/prayer/story">The Story of Salah ↗</Link></div>
    {notice && <p className="adhanSuccess" role="status">{notice}</p>}
  </section>;

  const wizard = inPrayerPage && !completed && !editing;
  return <section className={"adhanSettings adhanPremium" + (finishing ? " adhanFinishing" : "")} aria-label="Adhan call to prayer settings">
    <div className="adhanSettingsTitle">
      <div><span className="adhanEyebrow">{wizard ? "ONE-TIME SETUP · 1MUSLIM" : "PRAYER REMINDERS · SETTINGS"}</span>
        <h3>{wizard ? "Begin your prayer journey" : "Adhan preferences"}</h3>
        <p>{wizard ? "A few thoughtful choices to tailor your daily prayer schedule." : "Make adjustments to your personal prayer reminders."}</p></div>
      {!wizard && inPrayerPage && <button type="button" className="adhanCloseEditor" onClick={() => setEditing(false)} aria-label="Close prayer settings">×</button>}
    </div>

    {wizard && <div className="adhanWizardProgress" aria-label={"Step " + (step + 1) + " of 5"}>
      <div><strong>{String(step + 1).padStart(2, "0")} / 05</strong><span>{STEPS[step]}</span></div>
      <div className="adhanProgressTrack"><span style={{ width: ((step + 1) * 20) + "%" }} /></div>
      <nav aria-label="Prayer setup steps">{STEPS.map((name, index) => <button key={name} type="button"
        className={index === step ? "current" : ""} aria-current={index === step ? "step" : undefined}
        disabled={index > step} onClick={() => setStep(index)}>{name}</button>)}</nav>
    </div>}

    <div className="adhanSettingsBody">
      {wizard
        ? [locationSection, methodSection, prayerSection, soundSection, reviewSection][step]
        : <>{locationSection}{methodSection}{prayerSection}{soundSection}</>}
    </div>

    {error && <p role="alert" className="adhanError">{error}</p>}
    {notice && <p role="status" className="adhanSuccess">{notice}</p>}
    <div className="adhanWizardFooter">
      {wizard && step > 0 && <button type="button" className="adhanPrevious" onClick={() => { setStep(index => index - 1); setError(""); }}>← Back</button>}
      {!wizard && !inPrayerPage && <Link href="/widget-tools/prayer">Prayer times ↗</Link>}
      <button type="button" className="adhanPrimaryAction" disabled={busy || finishing || (wizard && step === 0 && !hasLocation)}
        onClick={() => { if (wizard && step < 4) { setStep(index => index + 1); setError(""); } else void save(); }}>
        {busy ? "Saving…" : wizard && step < 4 ? "Continue" : wizard ? "Save prayer setup" : "Save changes"} <span aria-hidden="true">→</span>
      </button>
    </div>
  </section>;
}
