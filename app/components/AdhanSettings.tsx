"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ADHAN_PRAYERS, ADHAN_PREVIEW_EVENT, ADHAN_SETTINGS_EVENT, ADHAN_STOP_EVENT,
  type AdhanPreferences, type AdhanPrayer, readAdhanPreferences, saveAdhanPreferences
} from "../lib/adhan";

export default function AdhanSettings({ inPrayerPage = false }: { inPrayerPage?: boolean }) {
  const [prefs, setPrefs] = useState<AdhanPreferences>(readAdhanPreferences);
  useEffect(() => {
    const sync = () => setPrefs(readAdhanPreferences());
    window.addEventListener(ADHAN_SETTINGS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(ADHAN_SETTINGS_EVENT, sync); window.removeEventListener("storage", sync); };
  }, []);
  const update = (patch: Partial<AdhanPreferences>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    saveAdhanPreferences(next);
  };
  const togglePrayer = (prayer: AdhanPrayer) =>
    update({ prayers: { ...prefs.prayers, [prayer]: !prefs.prayers[prayer] } });

  return <section className="adhanSettings" aria-label="Adhan call to prayer settings">
    <div className="adhanSettingsTitle">
      <div><span className="adhanEyebrow">🕌 LOCATION-BASED · FIVE DAILY PRAYERS</span><h3>Adhan · Call to Prayer</h3>
        <p>Hear the Adhan when prayer begins in your saved city. Each prayer can be customized.</p></div>
      <button type="button" className={"adhanToggle " + (prefs.enabled ? "active" : "")}
        aria-pressed={prefs.enabled} onClick={() => update({ enabled: !prefs.enabled })}>
        {prefs.enabled ? "● On" : "○ Off"}
      </button>
    </div>
    <div className="adhanSettingsBody">
      <label className="adhanField">Calculation method
        <select value={prefs.method} onChange={event => update({ method: event.target.value as AdhanPreferences["method"] })}>
          <option value="2">ISNA · North America</option>
          <option value="3">Muslim World League</option>
          <option value="4">Umm al-Qura · Makkah</option>
          <option value="5">Egyptian General Authority</option>
        </select>
      </label>
      <div className="adhanPrayerChoice" role="group" aria-label="Which prayers play the Adhan">
        {ADHAN_PRAYERS.map(prayer => <label key={prayer} className="adhanPrayerCheck">
          <input type="checkbox" checked={prefs.prayers[prayer]} onChange={() => togglePrayer(prayer)} />
          <span>{prayer}</span>
        </label>)}
      </div>
      <label className="adhanVolume">Volume <input type="range" min="0" max="100" step="5"
        aria-label="Adhan volume" value={Math.round(prefs.volume * 100)}
        onChange={event => update({ volume: Number(event.target.value) / 100 })} />
        <span>{Math.round(prefs.volume * 100)}%</span>
      </label>
      <div className="adhanButtons">
        <button type="button" onClick={() => window.dispatchEvent(new Event(ADHAN_PREVIEW_EVENT))}>▶ Play sample / enable sound</button>
        <button type="button" className="adhanSecondary" onClick={() => window.dispatchEvent(new Event(ADHAN_STOP_EVENT))}>■ Stop</button>
        {!inPrayerPage && <Link href="/widget-tools/prayer">Prayer times & location →</Link>}
      </div>
      <p className="adhanDisclaimer">Off until you switch it on. Audio uses the AlAdhan recording and requires the site to be open; browsers may block scheduled sound until you tap Play sample. Background alerts with the website fully closed require separate native push support. Your phone's silent setting may also affect playback. Prayer times may differ slightly from your local mosque.</p>
    </div>
  </section>;
}
