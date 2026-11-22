"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "../../utils/supabase/client";
import { readLocation } from "./LocationPreferences";
import {
  ADHAN_AUDIO_URL, ADHAN_PRAYERS, ADHAN_PREVIEW_EVENT, ADHAN_SETTINGS_EVENT,
  ADHAN_STOP_EVENT, type AdhanLocation, type AdhanPrayer,
  fetchPrayerSchedule, locationClock, prayerMinute, readAdhanPreferences,
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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(ADHAN_AUDIO_URL);
    audio.preload = "none";
    const ended = () => setActive(null);
    audio.addEventListener("ended", ended);
    audioRef.current = audio;
    return () => { audio.pause(); audio.removeEventListener("ended", ended); audioRef.current = null; };
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      try { audio.currentTime = 0; } catch { /* Stream might not be buffered. */ }
    }
    setActive(null);
    setBlocked(false);
  }, []);

  const play = useCallback((prayer: AdhanPrayer | "Sample") => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    try { audio.currentTime = 0; } catch { /* Stream might not be buffered. */ }
    audio.volume = readAdhanPreferences().volume;
    setActive(prayer);
    setBlocked(false);
    void audio.play().then(() => setBlocked(false)).catch(() => setBlocked(true));
  }, []);

  useEffect(() => {
    const updatePrefs = () => {
      const next = readAdhanPreferences();
      setPrefs(next);
      if (!next.enabled) stop();
    };
    const preview = () => play("Sample");
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
  return <aside className="adhanPlayerToast" role="status" aria-live="polite" aria-label="Call to prayer player">
    <span className="adhanEyebrow">🕌 1MUSLIM · ADHAN</span>
    <strong>{active === "Sample" ? "Adhan audio preview" : active + " · Time for Salah"}</strong>
    <p>{blocked
      ? "Your browser blocked automatic audio. Tap Play to listen. On iPhone, scheduled sounds require the site to remain active."
      : "Allahu Akbar · Allah is Greatest"}</p>
    <div className="adhanPlayerToastActions">
      <button type="button" onClick={() => play(active)}>▶ {blocked ? "Play Adhan" : "Replay"}</button>
      <button type="button" onClick={stop}>■ Stop & close</button>
    </div>
  </aside>;
}
