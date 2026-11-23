export function isTikTokVideoId(value: unknown): value is string {
  return typeof value === "string" && /^\d{8,30}$/.test(value);
}

export function verifiedTikTokVideo(record: unknown, videoId: string) {
  if (!isTikTokVideoId(videoId) || !record || typeof record !== "object") return null;
  const video = record as Record<string, unknown>;
  if (video.id !== videoId || typeof video.share_url !== "string") return null;

  let url: URL;
  try {
    url = new URL(video.share_url);
  } catch {
    return null;
  }
  if (
    url.protocol !== "https:" ||
    !["tiktok.com", "www.tiktok.com"].includes(url.host) ||
    url.username || url.password ||
    !new RegExp(`^/@[A-Za-z0-9._]+/video/${videoId}/?$`).test(url.pathname)
  ) return null;

  const title = [video.title, video.video_description].find(
    (value): value is string => typeof value === "string" && Boolean(value.trim()),
  );
  return { id: videoId, title: title?.trim() || "TikTok video", url: url.origin + url.pathname };
}
