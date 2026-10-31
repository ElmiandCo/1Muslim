export type CinemaMode = "desktop" | "phone";
export function cinemaFit(mode: CinemaMode): "contain" | "cover" {
  return mode === "phone" ? "cover" : "contain";
}
export function cinemaKeyboardOffset(layoutHeight: number, visualHeight: number, visualTop: number): number {
  if (![layoutHeight, visualHeight, visualTop].every(Number.isFinite)) return 0;
  return Math.max(0, Math.min(layoutHeight, Math.round(layoutHeight - visualHeight - visualTop)));
}
export function cinemaAudioActive(
  connected: boolean, remoteAudio: boolean, muted: boolean, needsGesture: boolean, playing: boolean,
): boolean {
  return connected && remoteAudio && !muted && !needsGesture && playing;
}
