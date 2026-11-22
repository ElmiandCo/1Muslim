"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "../../utils/supabase/client";
import { readLocation } from "./LocationPreferences";
import {
  ADHAN_AUDIO_URL, ADHAN_PRAYERS, ADHAN_PREVIEW_EVENT, ADHAN_SETTINGS_EVENT,
  ADHAN_STOP_EVENT, type AdhanLocation, type AdhanPrayer,
  fetchPrayerSchedule, locationClock, prayerMinute, readAdhanPreferences, saveAdhanPreferences,
  type PrayerSchedule
} from "../lib/adhan";

const LAST_FIRED_KEY = "1muslim:adhan-last-fired:v1";

// A single site-wide player survives client-side navigation. Browsers cannot
// guarantee timed audio after the tab is closed or while iOS has suspended it.
export default function PersistentAdhan() {
  const [prefs, setPrefs] = useState(readAdhanPreferences);
  const [place, setPlace] = useState<AdhanLocation>({ city: "", state: "", country: "" });
  const [schedule, setSchedule] = useState<PrayerSchedule | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [active, setActive] = useState<AdhanPrayer | "Sample" | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [playback, setPlayback] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(ADHAN_AUDIO_URL);
    audio.preload = "none";
    const ended = () => {setActive(null);setPlayback(0)};
    const progress = () => {
      if(Number.isFinite(audio.duration)&&audio.duration>0){
        setPlayback(Math.min(100,Math.max(0,(audio.currentTime/audio.duration)*100)));
      }
    };
    audio.addEventListener("ended", ended);
    audio.addEventListener("timeupdate", progress);
    audioRef.current = audio;
    return () => { audio.pause(); audio.removeEventListener("ended", ended);audio.removeEventListener("timeupdate",progress);audioRef.current = null; };
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      try { audio.currentTime = 0; } catch { /* Stream might not be buffered. */ }
    }
    setActive(null);
    setBlocked(false);
    setPlayback(0);
  }, []);

  const play = useCallback((prayer: AdhanPrayer | "Sample", volumeOverride?: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    try { audio.currentTime = 0; } catch { /* Stream might not be buffered. */ }
    audio.volume = typeof volumeOverride === "number" ? Math.max(0, Math.min(1, volumeOverride)) : readAdhanPreferences().volume;
    setActive(prayer);
    setBlocked(false);
    setPlayback(0);
    void audio.play().then(() => setBlocked(false)).catch(() => setBlocked(true));
  }, []);

  useEffect(() => {
    const updatePrefs = () => {
      const next = readAdhanPreferences();
      setPrefs(next);
      if (!next.enabled) stop();
    };
    const preview = (event: Event) => play("Sample", (event as CustomEvent<{volume?: number}>).detail?.volume);
    window.addEventListener(ADHAN_SETTINGS_EVENT, updatePrefs);
    window.addEventListener("storage", updatePrefs);
    window.addEventListener(ADHAN_PREVIEW_EVENT, preview);
    window.addEventListener(ADHAN_STOP_EVENT, stop);
    return () => {
      window.removeEventListener(ADHAN_SETTINGS_EVENT, updatePrefs);
      window.removeEventListener("storage", updatePrefs);
      window.removeEventListener(ADHAN_PREVIEW_EVENT, preview);
      window.removeEventListener(ADHAN_STOP_EVENT, stop);
    };
  }, [play, stop]);

  // Restore account-saved reminder settings on every device, not only on the Prayer page.
  useEffect(() => {
    let alive = true;
    const db = createClient();
    const restore = async () => {
      const { data: { user } } = await db.auth.getUser();
      if (!alive || !user) return;
      const { data } = await db.from("prayer_reminder_preferences")
        .select("enabled,method,volume,prayers").eq("user_id", user.id).maybeSingle();
      if (!alive || !data) return;
      const next = {
        enabled: data.enabled === true,
        method: (["2", "3", "4", "5"].includes(data.method) ? data.method : "2") as "2" | "3" | "4" | "5",
        volume: Math.max(0, Math.min(1, Number(data.volume ?? 0.8))),
        prayers: Object.fromEntries(ADHAN_PRAYERS.map(prayer => [prayer, data.prayers?.[prayer] !== false])) as Record<AdhanPrayer, boolean>
      };
      saveAdhanPreferences(next);
    };
    void restore();
    const { data: { subscription } } = db.auth.onAuthStateChange(() => { window.setTimeout(() => { void restore(); }, 0); });
    return () => { alive = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    let alive = true;
    const readProfileLocation = async () => {
      const saved = readLocation();
      if (alive) setPlace(saved);
      try {
        const db = createClient();
        const { data: { user } } = await db.auth.getUser();
        if (!user || !alive) return;
        const { data } = await db.from("profiles").select("city,state,country").eq("id", user.id).maybeSingle();
        if (!alive || !data?.city || !data?.country) return;
        setPlace({ city: data.city, state: data.state || "", country: data.country });
      } catch { /* Saved device location remains usable without an account. */ }
    };
    void readProfileLocation();
    const refreshLocation = () => void readProfileLocation();
    window.addEventListener("1muslim:location-updated", refreshLocation);
    window.addEventListener("1muslim:profile-saved", refreshLocation);
    const db = createClient();
    const { data: { subscription } } = db.auth.onAuthStateChange(() => { void readProfileLocation(); });
    return () => {
      alive = false;
      window.removeEventListener("1muslim:location-updated", refreshLocation);
      window.removeEventListener("1muslim:profile-saved", refreshLocation);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!prefs.enabled || !place.city.trim() || !place.country.trim()) { setSchedule(null); return; }
    const abort = new AbortController();
    setSchedule(null);
    void fetchPrayerSchedule(place, prefs.method, abort.signal)
      .then(data => { if (!abort.signal.aborted) setSchedule(data); })
      .catch(() => { if (!abort.signal.aborted) setSchedule(null); });
    return () => abort.abort();
  }, [place.city, place.state, place.country, prefs.enabled, prefs.method, refresh]);

  useEffect(() => {
    if (!prefs.enabled || !schedule) return;
    const check = () => {
      const now = locationClock(schedule.timezone);
      if (now.date !== schedule.date) { setRefresh(n => n + 1); return; }
      // Only fire at the start of the prayer, not after reopening a sleeping tab.
      if (now.second > 45) return;
      for (const prayer of ADHAN_PRAYERS) {
        if (!prefs.prayers[prayer] || prayerMinute(schedule.times[prayer]) !== now.minute) continue;
        const id = [schedule.date, place.city, place.state, place.country, prayer].join("|");
        try {
          if (localStorage.getItem(LAST_FIRED_KEY) === id) continue;
          localStorage.setItem(LAST_FIRED_KEY, id);
        } catch { /* Private browsing can disable persistence. */ }
        play(prayer);
        if (document.visibilityState !== "visible" && "Notification" in window && Notification.permission === "granted") {
          try { new Notification("It's time for " + prayer, { body: "1Muslim · Adhan for " + place.city }); }
          catch { /* Notification not supported in this browser context. */ }
        }
        break;
      }
    };
    check();
    const timer = window.setInterval(check, 10000);
    const wake = () => { if (document.visibilityState === "visible") check(); };
    document.addEventListener("visibilitychange", wake);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", wake); };
  }, [prefs, schedule, place, play]);

  if (!active) return null;
  const preview=active==="Sample";
  return <aside className="adhanPlayerToast adhanGlassNav" role="region" aria-label="Adhan prayer time and navigation">
    <div className="adhanGlassTop">
      <span className="adhanGlassBrand"><span aria-hidden="true">◈</span> 1MUSLIM <span aria-hidden="true">·</span> ADHAN</span>
      <button type="button" className="adhanGlassClose" onClick={stop} aria-label="Stop Adhan and close notification">×</button>
    </div>
    <div className="adhanGlassMain">
      <span className="adhanGlassSymbol" aria-hidden="true">
        <svg viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><path d="M7 26V14l5-3 4 3 4-3 5 3v12"/><path d="M4 27h24M11 26v-7h4v7M19 26v-7h4v7M16 5V2M13 8a5 5 0 0 0 7-5"/></svg>
      </span>
      <div className="adhanGlassText">
        <strong>{preview?"Adhan sound preview":`${active} · Time for Salah`}</strong>
        <p>{blocked?"Audio is paused by your browser. Tap Enable sound.":"Allahu Akbar · Allah is Greatest"}</p>
      </div>
      <span className={"adhanGlassPulse"+(blocked?" is-paused":"")} aria-label={blocked?"Sound blocked":"Adhan playing"} aria-hidden="true"><i/><i/><i/><i/></span>
    </div>
    <div className="adhanGlassProgress" aria-hidden="true"><span style={{width:`${playback}%`}}/></div>
    <nav className="adhanGlassActions" aria-label="Adhan actions">
      <span className="adhanGlassPlace">{place.city?<>⌖ {place.city}</>:"Prayer reminder"}</span>
      <div className="adhanGlassActionButtons">
        {blocked&&<button type="button" className="adhanGlassEnable" onClick={()=>play(active)} aria-label="Enable Adhan audio">▶ Enable sound</button>}
        <Link href="/profile?compass=1" onClick={()=>window.dispatchEvent(new Event("1muslim:open-qibla"))}>⌖ Qibla <span aria-hidden="true">↗</span></Link>
        <button type="button" className="adhanGlassStop" onClick={stop}>Stop <span aria-hidden="true">×</span></button>
      </div>
    </nav>
  </aside>;
}
