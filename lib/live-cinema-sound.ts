/** Reuses GoLive's two-second lens sweep for viewer layout changes. */
export function playLiveCinemaMorphSound(mode: "desktop" | "phone" | "voice") {
  if (typeof AudioContext === "undefined") return;
  try {
    const context = new AudioContext();
    void context.resume().then(() => {
      const start = context.currentTime;
      [0, .16, .34].forEach((offset, i) => {
        const oscillator = context.createOscillator(), gain = context.createGain();
        oscillator.type = i === 1 ? "triangle" : "sine";
        oscillator.frequency.setValueAtTime([420, 570, 740][i], start + offset);
        oscillator.frequency.exponentialRampToValueAtTime([510, 660, 920][i], start + offset + .12);
        gain.gain.setValueAtTime(.0001, start + offset);
        gain.gain.exponentialRampToValueAtTime(.055, start + offset + .015);
        gain.gain.exponentialRampToValueAtTime(.0001, start + offset + .14);
        oscillator.connect(gain); gain.connect(context.destination);
        oscillator.start(start + offset); oscillator.stop(start + offset + .15);
      });
      const motor = context.createOscillator(), motorGain = context.createGain();
      motor.type = "sine";
      const from = mode === "voice" ? 440 : mode === "phone" ? 170 : 280;
      const to = mode === "voice" ? 180 : mode === "phone" ? 530 : 370;
      motor.frequency.setValueAtTime(from, start);
      motor.frequency.exponentialRampToValueAtTime(to, start + 1.85);
      motorGain.gain.setValueAtTime(.0001, start);
      motorGain.gain.exponentialRampToValueAtTime(.025, start + .2);
      motorGain.gain.setValueAtTime(.025, start + 1.2);
      motorGain.gain.exponentialRampToValueAtTime(.0001, start + 1.9);
      motor.connect(motorGain); motorGain.connect(context.destination);
      motor.start(start); motor.stop(start + 1.92);
      window.setTimeout(() => void context.close().catch(() => {}), 2300);
    }).catch(() => void context.close().catch(() => {}));
  } catch { /* Visual transition remains usable if sound is blocked. */ }
}
