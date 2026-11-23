"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../utils/supabase/client";

export const LOCATION_KEY = "1muslim:location:v1";
export type LocationPreference = { city: string; state: string; country: string };
const EMPTY_LOCATION: LocationPreference = { city: "", state: "", country: "" };

export function readLocation(): LocationPreference {
  if (typeof window === "undefined") return EMPTY_LOCATION;
  try {
    const saved = JSON.parse(localStorage.getItem(LOCATION_KEY) || "{}");
    return { city: String(saved.city || ""), state: String(saved.state || ""), country: String(saved.country || "") };
  } catch { return EMPTY_LOCATION; }
}

/** Permission is requested only following an explicit button press. GPS coordinates are never persisted. */
export async function detectPrayerLocation(): Promise<LocationPreference> {
  if (!navigator.geolocation) throw new Error("Location unavailable. Enter your city manually.");
  const position = await new Promise<GeolocationPosition>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false, timeout: 12000, maximumAge: 300000
    })
  ).catch((error: GeolocationPositionError) => {
    throw new Error(error.code === 1
      ? "Location access declined. You can enter a location manually."
      : "Unable to locate your device. Enter a location manually.");
  });
  const response = await fetch("/api/profile/reverse-geocode", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ latitude: position.coords.latitude, longitude: position.coords.longitude })
  });
  if (!response.ok) throw new Error("Unable to identify your location. Enter it manually.");
  const data = await response.json();
  if (typeof data.city !== "string" || !data.city.trim() ||
      typeof data.country !== "string" || !data.country.trim()) {
    throw new Error("A city is required for accurate prayer times. Enter one manually.");
  }
  return { city: data.city.trim(), state: String(data.state || "").trim(), country: data.country.trim() };
}

/** Save prayer location separately from optional permission to appear in anonymous Ummah map totals. */
export async function persistPrayerLocation(next: LocationPreference, joinMap = false): Promise<boolean> {
  const location = { city: next.city.trim(), state: next.state.trim(), country: next.country.trim() };
  if (!location.city || !location.country) throw new Error("A city and country are needed for accurate prayer times.");
  const db = createClient();
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (authError) throw new Error("Could not verify your account.");
  if (user) {
    const { error } = await db.from("profiles").update(location).eq("id", user.id);
    if (error) throw new Error("Could not save your location: " + error.message);
    if (joinMap) {
      // A checked opt-in adds only aggregated state/country map counts; never avatar/name.
      const { error: consentError } = await db.from("member_region_preferences").upsert({
        user_id: user.id, region_level: location.state ? "state" : "country",
        directory_visible: false, consented_at: new Date().toISOString()
      }, { onConflict: "user_id" });
      if (consentError) throw new Error("Prayer location saved, but map sharing failed. Try again.");
    }
  }
  localStorage.setItem(LOCATION_KEY, JSON.stringify(location));
  window.dispatchEvent(new Event("1muslim:location-updated"));
  return Boolean(user);
}

export default function LocationPreferences({ onSaved }: { onSaved?: (location: LocationPreference) => void }) {
  const [value, setValue] = useState<LocationPreference>(EMPTY_LOCATION);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [shareOnMap, setShareOnMap] = useState(false);

  useEffect(() => {
    let active = true;
    setValue(readLocation());
    void (async () => {
      const db = createClient();
      const { data: { user } } = await db.auth.getUser();
      if (!user || !active) return;
      const { data } = await db.from("profiles").select("city,state,country").eq("id", user.id).maybeSingle();
      if (!active || !data) return;
      const { data: mapPreference } = await db.from("member_region_preferences").select("user_id").eq("user_id", user.id).maybeSingle();
      if (!active) return;
      setShareOnMap(Boolean(mapPreference));
      const saved = readLocation();
      const next = { city: data.city || saved.city, state: data.state || saved.state, country: data.country || saved.country };
      setValue(next);
      if (next.city && next.country) localStorage.setItem(LOCATION_KEY, JSON.stringify(next));
    })();
    return () => { active = false; };
  }, []);

  const useDeviceLocation = async () => {
    setDetecting(true); setStatus("Finding and saving your location…");
    try {
      const next = await detectPrayerLocation();
      const synced = await persistPrayerLocation(next, shareOnMap);
      setValue(next);
      onSaved?.(next);
      setStatus(synced ? "Location saved to your account." : "Saved on this device. Sign in to sync.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save location.");
    } finally { setDetecting(false); }
  };

  const save = async () => {
    if (!value.city.trim() || !value.country.trim()) { setStatus("City and country are required for accurate prayer times."); return; }
    setBusy(true); setStatus("");
    try {
      const next = { city: value.city.trim(), state: value.state.trim(), country: value.country.trim() };
      const synced = await persistPrayerLocation(next, shareOnMap);
      onSaved?.(next);
      setStatus(synced ? "Location saved to your account." : "Saved on this device. Sign in to sync.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save location.");
    } finally { setBusy(false); }
  };

  return <div className="prayerLocationForm prayerLocationFast" aria-label="Prayer location preferences">
    <button className="prayerLocateAction" type="button" disabled={busy || detecting} onClick={() => void useDeviceLocation()}>
      <span aria-hidden="true">⌖</span><span><strong>{detecting ? "Saving your location…" : "Use my location · Save instantly"}</strong><small>One tap · city used privately for prayer accuracy</small></span><span aria-hidden="true">↗</span>
    </button>
    <label className="prayerMapConsent">
      <input type="checkbox" checked={shareOnMap} onChange={event => setShareOnMap(event.target.checked)} />
      <span>Also include my state/country in anonymous Ummah map counts. Optional; your name and avatar stay private.</span>
    </label>
    <details className="prayerManualDetails">
      <summary>Set location manually <span aria-hidden="true">⌄</span></summary>
      <div className="prayerLocationFields">
        <label className="prayerLocationField">City <span>For accurate prayer times</span>
          <input required autoComplete="address-level2" value={value.city} onChange={event => setValue(previous => ({ ...previous, city: event.target.value }))} placeholder="e.g. Minneapolis" />
        </label>
        <label className="prayerLocationField">State / region
          <input autoComplete="address-level1" value={value.state} onChange={event => setValue(previous => ({ ...previous, state: event.target.value }))} placeholder="e.g. Minnesota" />
        </label>
        <label className="prayerLocationField">Country
          <input required autoComplete="country-name" value={value.country} onChange={event => setValue(previous => ({ ...previous, country: event.target.value }))} placeholder="e.g. United States" />
        </label>
      </div>
      <button className="prayerLocationSave" type="button" disabled={busy || detecting || !value.city.trim() || !value.country.trim()} onClick={() => void save()}>
        {busy ? "Saving…" : "Save location"} <span aria-hidden="true">→</span>
      </button>
    </details>
    {status && <p className="prayerLocationStatus" role="status">{status}</p>}
  </div>;
}
