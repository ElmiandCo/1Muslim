"use client";

/** Shared, bounded media preparation. Avoids downloading entire offscreen videos. */
const MAX_PREPARED = 3;
const prepared = new Map<string, HTMLLinkElement>();
const positions = new Map<string, number>();
const MAX_POSITIONS = 120;

export function prepareMedia(url: string, kind: "image" | "video" = "image") {
  if (typeof document === "undefined" || !url || prepared.has(url)) return;
  let parsed: URL;
  try { parsed = new URL(url, location.href); } catch { return; }
  if (!["https:", "http:"].includes(parsed.protocol)) return;
  // Never prefetch expiring signed media URLs or remote video bodies.
  if (kind === "video" || /(?:token|signature|sig|expires)=/i.test(parsed.search)) return;
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.as = "image";
  link.href = parsed.href;
  document.head.appendChild(link);
  prepared.set(url, link);
  while (prepared.size > MAX_PREPARED) {
    const oldest = prepared.keys().next().value;
    if (!oldest) break;
    prepared.get(oldest)?.remove();
    prepared.delete(oldest);
  }
}

export function rememberPlayback(url: string, seconds: number) {
  if (!url || !Number.isFinite(seconds) || seconds < 0) return;
  positions.delete(url);
  positions.set(url, seconds);
  if (positions.size > MAX_POSITIONS) positions.delete(positions.keys().next().value!);
}

export function recallPlayback(url: string): number {
  return positions.get(url) ?? 0;
}

export function observeVideo(
  video: HTMLVideoElement,
  options: { threshold?: number; onVisibility?: (visible: boolean) => void } = {},
): () => void {
  const threshold = options.threshold ?? 0.55;
  const observer = new IntersectionObserver(([entry]) => {
    const visible = entry.isIntersecting && entry.intersectionRatio >= threshold && !document.hidden;
    if (!visible) {
      if (!video.paused) video.pause();
      rememberPlayback(video.currentSrc || video.src, video.currentTime);
    }
    options.onVisibility?.(visible);
  }, { threshold: [0, threshold, 1] });
  observer.observe(video);
  const onHidden = () => {
    if (document.hidden) {
      video.pause();
      rememberPlayback(video.currentSrc || video.src, video.currentTime);
      options.onVisibility?.(false);
    }
  };
  document.addEventListener("visibilitychange", onHidden);
  return () => {
    observer.disconnect();
    document.removeEventListener("visibilitychange", onHidden);
    rememberPlayback(video.currentSrc || video.src, video.currentTime);
  };
}
