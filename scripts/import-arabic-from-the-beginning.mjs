/**
 * One-time, owner-curated DeepWatch import.
 * Original YouTube embeds only; never download, mirror, or rehost videos.
 * Playlist: Arabic from the Beginning (Dr. Imran Alawiye).
 * It contains 18 numbered lessons plus two supplemental items.
 *
 * Idempotent. Existing rejections are respected. No guessed video IDs.
 */
const PLAYLIST_ID = "PLWl0zRDk50wKM4WZAZEx_gwUDFKwe2ObX";
const ANCHOR_VIDEO_ID = "Qwdyx9kAPlU";
const EXPECTED_COUNT = 20;
const SERIES_SLUG = "arabic-from-the-beginning-imran-alawiye";
const { YOUTUBE_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!YOUTUBE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw Error("Missing YOUTUBE_API_KEY, SUPABASE_URL, or SUPABASE_SERVICE_ROLE_KEY");
}
const yt = async (endpoint, params) => {
  const url = new URL("https://www.googleapis.com/youtube/v3/" + endpoint);
  for (const [key, value] of Object.entries({ ...params, key: YOUTUBE_API_KEY })) {
    url.searchParams.set(key, String(value));
  }
  const res = await fetch(url);
  if (!res.ok) throw Error("YouTube " + res.status + ": " + (await res.text()).slice(0, 350));
  return res.json();
};
const db = async (path, { method = "GET", body, prefer } = {}) => {
  const res = await fetch(SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/" + path, {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: "Bearer " + SUPABASE_SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {})
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  if (!res.ok) throw Error("Supabase " + res.status + ": " + (await res.text()).slice(0, 500));
  const response = await res.text();
  return response ? JSON.parse(response) : null;
};
const parseDuration = (iso) => {
  const match = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || "");
  return match ? (+match[1] || 0) * 86400 + (+match[2] || 0) * 3600 + (+match[3] || 0) * 60 + (+match[4] || 0) : null;
};
const playlistItems = [];
let pageToken;
do {
  const page = await yt("playlistItems", {
    part: "snippet,contentDetails", playlistId: PLAYLIST_ID, maxResults: 50,
    ...(pageToken ? { pageToken } : {})
  });
  playlistItems.push(...(page.items || []));
  pageToken = page.nextPageToken;
} while (pageToken && playlistItems.length < 100);
const orderedIds = playlistItems.map(item => item.contentDetails?.videoId || item.snippet?.resourceId?.videoId);
if (orderedIds.length !== EXPECTED_COUNT || new Set(orderedIds).size !== EXPECTED_COUNT ||
    orderedIds[0] !== ANCHOR_VIDEO_ID || orderedIds.some(id => !/^[A-Za-z0-9_-]{11}$/.test(id || ""))) {
  throw Error("Unexpected playlist membership/order. Expected exactly 20 official items starting with Lesson 1; got " +
    JSON.stringify(orderedIds));
}
const metadata = (await yt("videos", {
  part: "snippet,contentDetails,status,statistics", id: orderedIds.join(",")
})).items || [];
const byId = new Map(metadata.map(v => [v.id, v]));
const anchor = byId.get(ANCHOR_VIDEO_ID);
if (!anchor?.snippet?.channelId || !/^Lesson 1\b/i.test(anchor.snippet.title || "")) {
  throw Error("Unable to establish the authentic presenter/channel from official Lesson 1");
}
const rejected = [];
const accepted = [];
for (let index = 0; index < orderedIds.length; index++) {
  const id = orderedIds[index], video = byId.get(id), s = video?.snippet;
  const lesson = index < 18;
  const official = s?.channelId === anchor.snippet.channelId;
  const rightLesson = !lesson || new RegExp("^Lesson\\s+" + (index + 1) + "\\b", "i").test(s.title || "");
  const playable = video?.status?.privacyStatus === "public" && video.status.embeddable === true;
  const region = video?.contentDetails?.regionRestriction;
  const accessibleUS = !region?.blocked?.includes("US") && (!region?.allowed || region.allowed.includes("US"));
  if (!official || !rightLesson || !playable || !accessibleUS) {
    rejected.push({ position: index + 1, id, official, rightLesson, playable, accessibleUS });
    continue;
  }
  accepted.push({ index, video });
}
if (accepted.length === 0) throw Error("No authentic public embeddable videos found: " + JSON.stringify(rejected));
const title = "Arabic from the Beginning";
const series = await db("deepwatch_series?on_conflict=slug", {
  method: "POST",
  prefer: "resolution=merge-duplicates,return=representation",
  body: [{
    slug: SERIES_SLUG,
    canonical_title: title,
    original_title: title,
    synopsis: "18 beginning Arabic lessons taught by Dr. Imran Hamza Alawiye, plus two playlist bonus videos. Presented in the original publisher's YouTube player.",
    publisher: anchor.snippet.channelTitle,
    language: "en",
    cover_url: "https://i.ytimg.com/vi/" + ANCHOR_VIDEO_ID + "/hqdefault.jpg",
    genres: ["Education", "Language Learning"],
    categories: ["Series", "Arabic Language", "Educational Series"],
    status: "approved"
  }]
});
const seriesId = series?.[0]?.id;
if (!seriesId) throw Error("Failed to establish DeepWatch series");
const rows = accepted.map(({ index, video }) => {
  const snippet = video.snippet;
  const lesson = index < 18;
  return {
    video_id: video.id,
    title: snippet.title,
    channel_id: snippet.channelId,
    channel_title: snippet.channelTitle,
    description: (snippet.description || "").slice(0, 4000),
    thumbnail_url: snippet.thumbnails?.high?.url || "https://i.ytimg.com/vi/" + video.id + "/hqdefault.jpg",
    duration_seconds: parseDuration(video.contentDetails?.duration),
    format: "full",
    language: "en",
    published_at: snippet.publishedAt || null,
    view_count: Number(video.statistics?.viewCount || 0),
    categories: ["Series", "Educational Series", "Arabic Language", lesson ? "Arabic Lessons" : "Bonus", "Imran Alawiye"],
    source_query: "owner-curated-youtube-playlist:" + PLAYLIST_ID,
    status: "approved",
    content_type: "series",
    canonical_title: title,
    original_title: snippet.title,
    episode_title: snippet.title,
    series_id: seriesId,
    season_number: 1,
    episode_number: index + 1,
    genres: ["Education", "Language Learning"],
    metadata_review_status: "reviewed",
    bot_b_reason: "Owner-curated official public, YouTube-embeddable original video; not rehosted."
  };
});
await db("islamic_video_registry?on_conflict=video_id", {
  method: "POST", prefer: "resolution=ignore-duplicates,return=representation", body: rows
});
// Pre-existing pending uploads may be published, but preserve any explicit admin rejection.
await db("islamic_video_registry?video_id=in.(" + accepted.map(v => v.video.id).join(",") + ")&status=eq.pending", {
  method: "PATCH", prefer: "return=minimal", body: { status: "approved", series_id: seriesId, canonical_title: title }
});
const confirmed = await db("islamic_video_registry?select=video_id,status,episode_number,series_id&video_id=in.(" +
  orderedIds.join(",") + ")&status=eq.approved");
const confirmedIds = new Set((confirmed || []).filter(r => r.series_id === seriesId).map(r => r.video_id));
const report = {
  playlist: PLAYLIST_ID, listed: orderedIds.length, checked: metadata.length, embeddable_official: accepted.length,
  approved_in_DeepWatch: confirmedIds.size, rejected, missing: orderedIds.filter(id => !confirmedIds.has(id))
};
console.log("ARABIC_COURSE_IMPORT_REPORT " + JSON.stringify(report));
if (confirmedIds.size !== EXPECTED_COUNT) process.exitCode = 2;
