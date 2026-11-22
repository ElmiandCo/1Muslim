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
function scheduleCacheKey(location:AdhanLocation,method:AdhanMethod,date:string) {
 const key=[location.city,location.state,location.country].map(part=>part.trim().toLowerCase()).join("|");
 return "1muslim:prayer-times:v2:"+key+"|"+method+"|"+date;
}
function validatedSchedule(value:unknown,date:string):PrayerSchedule|null {
 if(!value||typeof value!=="object")return null;
 const data=value as Partial<PrayerSchedule>;
 if(data.date!==date||typeof data.timezone!=="string"||!data.times)return null;
 try{new Intl.DateTimeFormat("en-US",{timeZone:data.timezone})}catch{return null}
 const names=[...ADHAN_PRAYERS,"Sunrise"] as const;
 if(names.some(name=>prayerMinute(data.times?.[name]||"")===null))return null;
 return data as PrayerSchedule;
}
function cachedPrayerSchedule(key:string,date:string):PrayerSchedule|null {
 if(typeof window==="undefined")return null;
 try{return validatedSchedule(JSON.parse(localStorage.getItem(key)||"null"),date)}catch{return null}
}
function savePrayerSchedule(key:string,schedule:PrayerSchedule) {
 if(typeof window==="undefined")return;
 try{localStorage.setItem(key,JSON.stringify(schedule))}catch{/* Restricted device storage is optional. */}
}
async function readDay(location:AdhanLocation,method:AdhanMethod,date:string,signal?:AbortSignal):Promise<PrayerSchedule> {
 const key=scheduleCacheKey(location,method,date);
 const query=new URLSearchParams({city:location.city,country:location.country,method,date});
 if(location.state)query.set("state",location.state);
 try{
  // The browser must not call a third-party prayer-time service directly:
  // regional filters, CORS and transient upstream failures affected only some accounts.
  const response=await fetch("/api/prayer-times?"+query,{signal});
  if(!response.ok)throw new Error("Prayer-time service is temporarily unavailable.");
  const schedule=validatedSchedule(await response.json(),date);
  if(!schedule)throw new Error("Prayer-time service returned invalid times.");
  savePrayerSchedule(key,schedule);
  return schedule;
 }catch(error){
  if(signal?.aborted)throw error;
  // Preserve the exact city's already verified times when connectivity drops.
  // Never substitute another city, date or calculation method.
  const cached=cachedPrayerSchedule(key,date);
  if(cached)return cached;
  throw error;
 }
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
