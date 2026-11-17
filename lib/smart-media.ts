"use client";

/** Shared, bounded media preparation. Avoids downloading entire offscreen videos. */
const MAX_PREPARED = 3;
const prepared = new Map<string, HTMLLinkElement>();
const positions = new Map<string, number>();
const MAX_POSITIONS = 120;
const STORAGE_KEY = "1muslim:media-positions:v1";
let hydrated = false;
function hydratePositions() {
 if (hydrated || typeof sessionStorage === "undefined") return;
 hydrated = true;
 try { const entries = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]") as [string,number][];
  for (const [key,value] of entries.slice(-MAX_POSITIONS)) if (typeof key === "string" && Number.isFinite(value)) positions.set(key,value);
 } catch { /* private browsing or invalid previous data */ }
}
function safeKey(key:string) {
 // Never persist signed URLs or access tokens to web storage.
 return !/^https?:/i.test(key) && key.length < 180;
}


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
  hydratePositions();
  positions.delete(url);
  positions.set(url, seconds);
  if (positions.size > MAX_POSITIONS) positions.delete(positions.keys().next().value!);
  if (safeKey(url)) try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...positions].filter(([key])=>safeKey(key)))); } catch {}
}

export function recallPlayback(url: string): number {
  hydratePositions();
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
