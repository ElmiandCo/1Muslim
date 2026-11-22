"use client";
import { useEffect, useState } from "react";
import LocationPreferences, { readLocation } from "../../components/LocationPreferences";
import AdhanSettings from "../../components/AdhanSettings";
import { createClient } from "../../../utils/supabase/client";
import {
  ADHAN_PRAYERS, ADHAN_SETTINGS_EVENT, displayPrayerTime, fetchPrayerSchedule,
  locationClock, prayerMinute, readAdhanPreferences, type AdhanLocation, type PrayerSchedule
} from "../../lib/adhan";

export default function PrayerTimes() {
  const [place, setPlace] = useState<AdhanLocation>({ city: "", state: "", country: "" });
  const [method, setMethod] = useState(readAdhanPreferences().method);
  const [schedule, setSchedule] = useState<PrayerSchedule | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [editLocation, setEditLocation] = useState(false);

  useEffect(() => {
    let active = true;
    const local = readLocation();
    setPlace(local);
    setEditLocation(!local.city || !local.country);
    void (async () => {
      try {
        const db = createClient();
        const { data: { user } } = await db.auth.getUser();
        if (!user || !active) return;
        const { data } = await db.from("profiles").select("city,state,country").eq("id", user.id).maybeSingle();
        if (!active || !data) return;
        const next = { city: data.city || local.city, state: data.state || local.state, country: data.country || local.country };
        setPlace(next);
        setEditLocation(!next.city || !next.country);
      } catch { /* Continue with saved location. */ }
    })();
    const sync = () => setMethod(readAdhanPreferences().method);
    window.addEventListener(ADHAN_SETTINGS_EVENT, sync);
    window.addEventListener("storage", sync);
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => { active = false; window.removeEventListener(ADHAN_SETTINGS_EVENT, sync); window.removeEventListener("storage", sync); clearInterval(timer); };
  }, []);
  useEffect(() => {
    if (!place.city.trim() || !place.country.trim()) { setSchedule(null); return; }
    const abort = new AbortController();
    setLoading(true); setMessage(""); setSchedule(null);
    void fetchPrayerSchedule(place, method, abort.signal)
      .then(data => { if (!abort.signal.aborted) setSchedule(data); })
      .catch(error => { if (!abort.signal.aborted) setMessage(error instanceof Error ? error.message : "Could not load prayer times."); })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [place.city, place.state, place.country, method, now.toDateString()]);

  const clock = schedule ? locationClock(schedule.timezone, now) : null;
  const nextPrayer = schedule && clock?.date === schedule.date
    ? ADHAN_PRAYERS.find(prayer => (prayerMinute(schedule.times[prayer]) ?? -1) > clock.minute)
    : null;

  return <div style={{ display: "grid", gap: 16 }}>
    <p style={{ opacity: .8, margin: 0 }}>Accurate local prayer times and a personalized Adhan. Configure your city below, then enable the call to prayer.</p>
    {place.city && place.country && !editLocation
      ? <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <strong>📍 {[place.city, place.state, place.country].filter(Boolean).join(", ")}</strong>
          <button type="button" onClick={() => setEditLocation(true)} style={{ border: "1px solid #b6a76b88", color: "inherit", borderRadius: 12, background: "transparent", padding: 10, cursor: "pointer" }}>Change location</button>
        </div>
      : <LocationPreferences onSaved={location => { setPlace(location); setEditLocation(false); }} />}
    {loading && <p role="status">Calculating prayer times…</p>}
    {message && <p role="alert">{message}</p>}
    {schedule && <section aria-label="Today's prayer times" style={{ display: "grid", gap: 8 }}>
      <div style={{ fontSize: 12, opacity: .72 }}>Today · {schedule.date} · {schedule.timezone}
        {nextPrayer ? " · Next: " + nextPrayer + " at " + displayPrayerTime(schedule.times[nextPrayer]) : " · The next day's schedule updates after midnight"}
      </div>
      {(["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"] as const).map(prayer =>
        <div key={prayer} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 15px", borderRadius: 13,
          background: nextPrayer === prayer ? "#c6a85b25" : "#ffffff0d", border: nextPrayer === prayer ? "1px solid #d7bf76" : "1px solid #ffffff13"
        }}>
          <span>{prayer}{prayer === "Sunrise" ? " · not a salah" : ""}</span>
          <strong>{displayPrayerTime(schedule.times[prayer])}</strong>
        </div>)}
    </section>}
    <AdhanSettings inPrayerPage />
    <small style={{ opacity: .65 }}>Times are calculated by the AlAdhan API. Different calculation methods, mosque timetables, and local adjustments can vary by several minutes. Sunrise is not one of the five daily prayers.</small>
  </div>;
}
