export const ADHAN_PREFS_KEY = "1muslim:adhan-preferences:v1";
export const ADHAN_SETTINGS_EVENT = "1muslim:adhan-settings-updated";
export const ADHAN_PREVIEW_EVENT = "1muslim:adhan-preview";
export const ADHAN_STOP_EVENT = "1muslim:adhan-stop";
export const ADHAN_AUDIO_URL = "https://cdn.aladhan.com/audio/adhans/a1.mp3";
export const ADHAN_PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;
export type AdhanPrayer = (typeof ADHAN_PRAYERS)[number];
export type AdhanMethod = "2" | "3" | "4" | "5";
export type AdhanPreferences = {
  enabled: boolean;
  method: AdhanMethod;
  volume: number;
  prayers: Record<AdhanPrayer, boolean>;
};
export type AdhanLocation = { city: string; state: string; country: string };
export type PrayerSchedule = {
  date: string; // YYYY-MM-DD in the prayer location
  timezone: string;
  times: Record<AdhanPrayer, string> & { Sunrise: string };
};
export const DEFAULT_ADHAN_PREFERENCES: AdhanPreferences = {
  enabled: false, method: "2", volume: 0.8,
  prayers: { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true }
};

export function readAdhanPreferences(): AdhanPreferences {
  if (typeof window === "undefined") return DEFAULT_ADHAN_PREFERENCES;
  try {
    const saved = JSON.parse(localStorage.getItem(ADHAN_PREFS_KEY) || "{}");
    const method = ["2", "3", "4", "5"].includes(saved.method) ? saved.method as AdhanMethod : "2";
    const volume = Number(saved.volume);
    return {
      enabled: saved.enabled === true,
      method,
      volume: Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : 0.8,
      prayers: Object.fromEntries(ADHAN_PRAYERS.map(prayer => [prayer, saved.prayers?.[prayer] !== false])) as Record<AdhanPrayer, boolean>
    };
  } catch { return DEFAULT_ADHAN_PREFERENCES; }
}
export function saveAdhanPreferences(preferences: AdhanPreferences) {
  localStorage.setItem(ADHAN_PREFS_KEY, JSON.stringify(preferences));
  window.dispatchEvent(new Event(ADHAN_SETTINGS_EVENT));
}
export function locationClock(timezone: string, at = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
    }).formatToParts(at);
    const fields = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return {
      date: [fields.year, fields.month, fields.day].join("-"),
      minute: Number(fields.hour) * 60 + Number(fields.minute),
      second: Number(fields.second)
    };
  } catch {
    return {
      date: [at.getFullYear(), String(at.getMonth() + 1).padStart(2, "0"), String(at.getDate()).padStart(2, "0")].join("-"),
      minute: at.getHours() * 60 + at.getMinutes(), second: at.getSeconds()
    };
  }
}
export function prayerMinute(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!match) return null;
  const hours = Number(match[1]), minutes = Number(match[2]);
  return hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60 ? hours * 60 + minutes : null;
}
export function displayPrayerTime(time: string) {
  const minute = prayerMinute(time);
  if (minute === null) return "—";
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" })
    .format(new Date(Date.UTC(2020, 0, 1, Math.floor(minute / 60), minute % 60)));
}
function dateForApi(date: string) {
  const [y, m, d] = date.split("-");
  return d + "-" + m + "-" + y;
}
async function readDay(location: AdhanLocation, method: AdhanMethod, date: string, signal?: AbortSignal): Promise<PrayerSchedule> {
  const query = new URLSearchParams({ city: location.city, country: location.country, method, school: "0" });
  if (location.state) query.set("state", location.state);
  const response = await fetch("https://api.aladhan.com/v1/timingsByCity/" + dateForApi(date) + "?" + query.toString(), {
    signal, cache: "no-store"
  });
  if (!response.ok) throw new Error("Prayer-time service is unavailable.");
  const body = await response.json();
  const data = body?.data;
  if (body?.code !== 200 || !data?.timings || !data?.meta?.timezone) throw new Error("Could not calculate prayer times for this location.");
  const raw = data.timings as Record<string, string>;
  const names = [...ADHAN_PRAYERS, "Sunrise"] as const;
  if (names.some(name => prayerMinute(raw[name] || "") === null)) throw new Error("Prayer-time service returned invalid times.");
  return {
    date, timezone: String(data.meta.timezone),
    times: Object.fromEntries(names.map(name => [name, raw[name]])) as PrayerSchedule["times"]
  };
}
export async function fetchPrayerSchedule(location: AdhanLocation, method: AdhanMethod, signal?: AbortSignal): Promise<PrayerSchedule> {
  const browserDate = locationClock(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC").date;
  const first = await readDay(location, method, browserDate, signal);
  // A traveler may be in another timezone: use the chosen city's calendar day, not the device's.
  const actualDate = locationClock(first.timezone).date;
  return actualDate === first.date ? first : readDay(location, method, actualDate, signal);
}

/** Read a specific day for accurate after-Isha next-Fajr previews. */
export function fetchPrayerScheduleOnDate(location: AdhanLocation, method: AdhanMethod, date: string, signal?: AbortSignal): Promise<PrayerSchedule> {
  return readDay(location, method, date, signal);
}
