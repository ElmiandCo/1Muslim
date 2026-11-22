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

export default function LocationPreferences({ onSaved }: { onSaved?: (location: LocationPreference) => void }) {
  const [value, setValue] = useState<LocationPreference>(EMPTY_LOCATION);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    let active = true;
    setValue(readLocation());
    void (async () => {
      const db = createClient();
      const { data: { user } } = await db.auth.getUser();
      if (!user || !active) return;
      const { data } = await db.from("profiles").select("city,state,country").eq("id", user.id).maybeSingle();
      if (!active || !data) return;
      const saved = readLocation();
      const next = { city: data.city || saved.city, state: data.state || saved.state, country: data.country || saved.country };
      setValue(next);
      if (next.city && next.country) localStorage.setItem(LOCATION_KEY, JSON.stringify(next));
    })();
    return () => { active = false; };
  }, []);

  const useDeviceLocation = () => {
    if (!navigator.geolocation) { setStatus("Device location is not available. Enter your city below."); return; }
    setDetecting(true); setStatus("Locating your city…");
    navigator.geolocation.getCurrentPosition(async position => {
      try {
        const response = await fetch("/api/profile/reverse-geocode", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ latitude: position.coords.latitude, longitude: position.coords.longitude })
        });
        if (!response.ok) throw new Error("We could not identify your city. Enter it manually instead.");
        const location = await response.json();
        if (!location.city || !location.country) throw new Error("City or country was not found. Enter it manually.");
        setValue({ city: location.city, state: location.state || "", country: location.country });
        setStatus("Location found. Review it and select Save location.");
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Location was not available.");
      } finally { setDetecting(false); }
    }, error => {
      setStatus(error.code === 1 ? "Location access was declined. You can enter a city manually." : "Unable to access location. Enter a city manually.");
      setDetecting(false);
    }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 });
  };

  const save = async () => {
    if (!value.city.trim() || !value.country.trim()) { setStatus("City and country are required."); return; }
    setBusy(true); setStatus("");
    const next = { city: value.city.trim(), state: value.state.trim(), country: value.country.trim() };
    try {
      const db = createClient();
      const { data: { user } } = await db.auth.getUser();
      if (user) {
        const { error } = await db.from("profiles").update(next).eq("id", user.id);
        if (error) throw new Error("Could not save your location: " + error.message);
      }
      localStorage.setItem(LOCATION_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("1muslim:location-updated"));
      onSaved?.(next);
      setStatus(user ? "Saved to your account." : "Saved on this device. Sign in to sync across devices.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save location.");
    } finally { setBusy(false); }
  };

  return <div className="prayerLocationForm" aria-label="Prayer location preferences">
    <div className="prayerLocationFormIntro">
      <div><strong>Prayer location</strong><p>Only your city, region and country are needed to calculate prayer times.</p></div>
      <span className="prayerLocationPrivate" aria-label="City-level data only">City-level only</span>
    </div>
    <button className="prayerLocateAction" type="button" disabled={busy || detecting} onClick={useDeviceLocation}>
      <span aria-hidden="true">⌖</span><span><strong>{detecting ? "Finding your location…" : "Use current location"}</strong><small>Detect your city securely</small></span><span aria-hidden="true">↗</span>
    </button>
    <div className="prayerLocationDivider"><span>OR ENTER A LOCATION</span></div>
    <div className="prayerLocationFields">
      <label className="prayerLocationField">City <span>Required</span>
        <input required autoComplete="address-level2" value={value.city} onChange={event => setValue(previous => ({ ...previous, city: event.target.value }))} placeholder="e.g. Minneapolis" />
      </label>
      <label className="prayerLocationField">State / region <span>Optional</span>
        <input autoComplete="address-level1" value={value.state} onChange={event => setValue(previous => ({ ...previous, state: event.target.value }))} placeholder="e.g. Minnesota" />
      </label>
      <label className="prayerLocationField">Country <span>Required</span>
        <input required autoComplete="country-name" value={value.country} onChange={event => setValue(previous => ({ ...previous, country: event.target.value }))} placeholder="e.g. United States" />
      </label>
    </div>
    <div className="prayerLocationFormFooter">
      <span>Your precise GPS coordinates are not stored.</span>
      <button className="prayerLocationSave" type="button" disabled={busy || detecting || !value.city.trim() || !value.country.trim()} onClick={() => void save()}>
        {busy ? "Saving…" : "Save location"} <span aria-hidden="true">→</span>
      </button>
    </div>
    {status && <p className="prayerLocationStatus" role="status">{status}</p>}
  </div>;
}
