/** Gentle guest-theme transition sound. Never bypass browser autoplay policies. */
let context: AudioContext | null = null;
let enabled = false;
export function enableGuestIntroSound(): void {
 if (typeof window === "undefined") return;
 enabled = true;
 try {
  const AudioContextClass = window.AudioContext;
  if (!context) context = new AudioContextClass();
  if (context.state === "suspended") void context.resume();
 } catch { enabled = false; }
}
export function playGuestIntroSound(kind: "reveal" | "transition"): void {
 if (!enabled || !context || context.state !== "running") return;
 try {
  const now = context.currentTime;
  const duration = kind === "reveal" ? 1.7 : 1.2;
  const gain = context.createGain();
  const filter = context.createBiquadFilter();
  filter.type = "lowpass"; filter.frequency.value = 750;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.012, now + 0.24);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  filter.connect(gain); gain.connect(context.destination);
  for (const [index, frequency] of [220, 329.63, 440].entries()) {
   const osc = context.createOscillator();
   osc.type = "sine";
   osc.frequency.setValueAtTime(frequency * (kind === "reveal" ? 0.97 : 1), now);
   osc.frequency.linearRampToValueAtTime(frequency * 1.015, now + duration);
   const voice = context.createGain();
   voice.gain.value = index === 0 ? 0.32 : 0.16;
   osc.connect(voice); voice.connect(filter);
   osc.start(now); osc.stop(now + duration + 0.02);
   osc.onended = () => { osc.disconnect(); voice.disconnect(); };
  }
  window.setTimeout(() => { filter.disconnect(); gain.disconnect(); }, (duration + 0.15) * 1000);
 } catch { /* Silent fallback when audio is unavailable. */ }
}
