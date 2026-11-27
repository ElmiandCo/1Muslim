"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "../../utils/supabase/client";
import { acceptLocation, shouldPromptForLocation } from "../../lib/location-onboarding";

type Place = { city: string; state: string; country: string };
type Phase = "idle" | "locating" | "saving" | "declining";

function locate(): Promise<Place> {
  if (!navigator.geolocation) return Promise.reject(new Error("Location isn't supported by this browser."));
  return new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 });
  }).catch((error: GeolocationPositionError) => {
    throw new Error(error.code === 1 ? "Location permission was denied. You can choose Not now." : "Could not access your location. Try again.");
  }).then(async position => {
    const response = await fetch("/api/profile/reverse-geocode", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ latitude: position.coords.latitude, longitude: position.coords.longitude })
    });
    if (!response.ok) throw new Error("Could not identify your location. Try again.");
    const data = await response.json() as Place;
    if (typeof data.city !== "string" || typeof data.state !== "string" || !data.state || typeof data.country !== "string" || !data.country) {
      throw new Error("Location details are incomplete. Try again.");
    }
    return { city: data.city, state: data.state, country: data.country };
  });
}

export default function LocationOnboarding() {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const account = useRef<string | null>(null);
  const generation = useRef(0);
  const checking = useRef(0);
  const phaseRef = useRef<Phase>("idle");
  const decided = useRef(new Set<string>());
  const dialog = useRef<HTMLElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const changePhase = (next: Phase) => { phaseRef.current = next; setPhase(next); };

  useEffect(() => {
    let active = true;
    const db = createClient();
    const check = async () => {
      const current = ++checking.current;
      const { data: { user }, error: authError } = await db.auth.getUser();
      if (!active || current !== checking.current || authError) return;
      const id = user?.id ?? null;
      if (id !== account.current) {
        generation.current++;
        account.current = id;
        phaseRef.current = "idle";
        setPhase("idle"); setVisible(false); setError(""); setSaved(false);
      }
      if (!id || phaseRef.current !== "idle" || decided.current.has(id)) return;
      // Defer optional location until Shahada is complete and the person is settled.
      if(new URLSearchParams(window.location.search).has("auth")||window.location.pathname==="/onboarding")return;
      const {data:profile}=await db.from("profiles").select("shahada_verified_at").eq("id",id).maybeSingle();
      if(!profile?.shahada_verified_at)return;
      const { data, error: readError } = await db.from("profile_location_prompts").select("decision").eq("user_id", id).maybeSingle();
      if (active && current === checking.current && account.current === id && phaseRef.current === "idle" && !decided.current.has(id) && !readError) {
        if(shouldPromptForLocation(data)){
          window.setTimeout(()=>{if(active&&phaseRef.current==="idle"&&!new URLSearchParams(window.location.search).has("auth"))setVisible(true)},9000);
        }else setVisible(false);
      }
    };
    void check();
    // Supabase auth callbacks should not await another Supabase call synchronously.
    const { data: { subscription } } = db.auth.onAuthStateChange(() => { window.setTimeout(() => { if (active) void check(); }, 0); });
    return () => { active = false; generation.current++; checking.current++; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!visible) return;
    // Optional white cue never hijacks focus or blocks search/reading.
    return () => {};
  }, [visible]);

  useEffect(() => {
    if (!saved) return;
    const timer = window.setTimeout(() => setSaved(false), 4000);
    return () => window.clearTimeout(timer);
  }, [saved]);

  const record = async (id: string, decision: "accepted" | "declined") => {
    const db = createClient();
    const { data: { user }, error: authError } = await db.auth.getUser();
    if (authError || user?.id !== id || account.current !== id) throw new Error("Please sign in again.");
    const { error: writeError } = await db.from("profile_location_prompts").upsert({ user_id: id, decision, decided_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (writeError) throw new Error("Could not save your choice. Please try again.");
  };

  const decline = async () => {
    const id = account.current;
    if (!id || phaseRef.current === "saving" || phaseRef.current === "declining") return;
    const current = ++generation.current;
    ++checking.current;
    changePhase("declining"); setError("");
    try {
      await record(id, "declined");
      if (account.current !== id || current !== generation.current) return;
      decided.current.add(id); setVisible(false);
    } catch (cause) {
      if (account.current === id && current === generation.current) { setVisible(true); setError(cause instanceof Error ? cause.message : "Could not save your choice."); }
    } finally {
      if (account.current === id && current === generation.current) changePhase("idle");
    }
  };

  const useLocation = async () => {
    const id = account.current;
    if (!id || phaseRef.current !== "idle") return;
    const current = ++generation.current;
    ++checking.current;
    const isCurrent = () => account.current === id && generation.current === current;
    changePhase("locating"); setVisible(false); setError("");
    try {
      const completed = await acceptLocation({
        locate,
        isCurrent,
        savePlace: async place => {
          changePhase("saving");
          const db = createClient();
          const { data: { user }, error: authError } = await db.auth.getUser();
          if (authError || user?.id !== id || !isCurrent()) throw new Error("Please sign in again.");
          const { data, error: writeError } = await db.from("profiles").update(place).eq("id", id).select("id").maybeSingle();
          if (writeError || !data) throw new Error("Could not save your location. Please try again.");
        },
        recordAccepted: () => record(id, "accepted")
      });
      if (completed) {
        decided.current.add(id); setSaved(true);
        window.dispatchEvent(new Event("1muslim:profile-saved"));
      }
    } catch (cause) {
      if (isCurrent()) { setVisible(true); setError(cause instanceof Error ? cause.message : "Location lookup failed."); }
    } finally {
      if (isCurrent()) changePhase("idle");
    }
  };

  return <>
    {visible && <div className="locationConsentBackdrop">
      <section ref={dialog} role="region" aria-labelledby="locationConsentTitle" className="locationConsentCard" onKeyDown={event => {
        if (event.key === "Escape") { event.preventDefault(); void decline(); }
        if (event.key !== "Tab") return;
        const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), summary, a[href]'));
        if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }}>
        <h2 id="locationConsentTitle">Add your location?</h2>
        <p>Optional. Your city may appear on your profile.</p>
        <details><summary>How it's used</summary><p>We send your coordinates to BigDataCloud to find your city, state and country. Precise coordinates are not saved to your profile. You can change your location in Settings.</p></details>
        {error && <p role="alert" className="locationConsentError">{error}</p>}
        <div className="locationConsentActions"><button type="button" disabled={phase !== "idle"} onClick={() => void useLocation()}>Use location</button><button type="button" disabled={phase !== "idle"} onClick={() => void decline()}>Not now</button></div>
      </section>
    </div>}
    {(phase === "locating" || phase === "saving") && <div className="locationConsentStatus" role="status">{phase === "locating" ? "Finding your location…" : "Saving your location…"}{phase === "locating" && <button type="button" onClick={() => void decline()}>Not now</button>}</div>}
    {saved && <div className="locationConsentStatus" role="status">Location saved.</div>}
    <style>{`
      .locationConsentBackdrop{position:fixed;inset:0;z-index:2147482000;display:flex;align-items:flex-end;justify-content:center;background:rgba(6,12,19,.42);backdrop-filter:blur(5px);padding:16px 16px max(16px,env(safe-area-inset-bottom))}
      .locationConsentCard{width:min(430px,100%);max-height:75dvh;overflow:auto;box-sizing:border-box;border:1px solid rgba(255,255,255,.3);border-radius:24px;padding:18px;background:rgba(28,33,39,.88);color:#fff;box-shadow:0 20px 60px #0005;backdrop-filter:blur(24px)}
      .locationConsentCard h2{font-size:19px;line-height:1.2;margin:0 0 6px}.locationConsentCard p{font-size:14px;line-height:1.4;margin:0 0 8px}.locationConsentCard details{font-size:13px;color:#e1e4e8}.locationConsentCard summary{cursor:pointer;min-height:30px}.locationConsentCard details p{margin:4px 0 10px}.locationConsentActions{display:flex;gap:10px;margin-top:8px}.locationConsentActions button{min-height:46px;flex:1;border:0;border-radius:14px;background:#fff;color:#20262b;font-weight:700}.locationConsentActions button+button{background:rgba(255,255,255,.14);color:#fff}.locationConsentCard button:focus-visible,.locationConsentCard summary:focus-visible,.locationConsentStatus button:focus-visible{outline:3px solid #fff;outline-offset:2px}.locationConsentCard button:disabled{opacity:.6}.locationConsentError{color:#ffd1d1}.locationConsentStatus{position:fixed;z-index:2147482000;bottom:max(18px,env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);padding:12px 16px;border-radius:16px;background:#252b30;color:white;box-shadow:0 8px 24px #0004;font-size:14px}.locationConsentStatus button{margin-left:12px;min-height:36px;border:0;background:transparent;color:white;text-decoration:underline}

      /* Premium white Search Home: only a small, optional location cue. */
      .locationConsentBackdrop{inset:auto!important;top:calc(92px + env(safe-area-inset-top))!important;right:12px!important;bottom:auto!important;left:auto!important;display:block!important;padding:0!important;width:min(335px,calc(100vw - 24px));background:none!important;backdrop-filter:none!important;pointer-events:none!important}
      .locationConsentCard{pointer-events:auto!important;border:1px solid #e2e9e5!important;border-radius:21px!important;padding:15px 17px!important;background:#fff!important;color:#24372b!important;box-shadow:0 14px 40px #17362b1c!important;backdrop-filter:none!important;width:100%!important;max-height:unset!important}
      .locationConsentCard h2{font-size:15px!important;font-weight:690!important;letter-spacing:-.025em}.locationConsentCard p{font-size:12px!important;color:#708176!important}.locationConsentCard details{color:#62776a!important;font-size:11px!important}
      .locationConsentActions{margin-top:13px!important}.locationConsentActions button{min-height:38px!important;border-radius:999px!important;background:#20483b!important;color:#fff!important;font-size:12px!important}.locationConsentActions button+button{border:1px solid #e2e8e5!important;background:#fff!important;color:#657b6d!important}
      .locationConsentStatus{background:#fff!important;color:#254332!important;border:1px solid #e5ebe6!important;box-shadow:0 10px 35px #1433291c!important;font-size:12px!important}
      .locationConsentStatus button{color:#365e4a!important}
      @media(max-width:500px){.locationConsentBackdrop{top:calc(82px + env(safe-area-inset-top))!important;right:10px!important;left:10px!important;width:auto!important}}
    `}</style>
  </>;
}
