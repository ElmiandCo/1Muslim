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

/** Cache only public same-origin images; never cache authenticated responses or signed URLs. */
const PUBLIC_CACHE = "1muslim-public-images-v1";
const MAX_IMAGE_ENTRIES = 60;
function publicImageUrl(input:string):string|null {
 if(typeof window==="undefined")return null;
 try {
  const u=new URL(input,location.href);
  if(u.origin!==location.origin||u.search||!/\\.(?:png|jpe?g|webp|avif|gif)$/i.test(u.pathname))return null;
  if(!u.pathname.startsWith("/assets/")&&!u.pathname.startsWith("/images/"))return null;
  return u.href;
 }catch{return null}
}
export async function cachePublicImage(url:string):Promise<void>{
 const href=publicImageUrl(url);
 if(!href||typeof caches==="undefined"||document.hidden)return;
 const connection=(navigator as Navigator & {connection?:{saveData?:boolean}}).connection;
 if(connection?.saveData)return;
 try{
  const cache=await caches.open(PUBLIC_CACHE);
  if(await cache.match(href))return;
  const response=await fetch(href,{credentials:"omit",mode:"same-origin",cache:"force-cache"});
  if(!response.ok||response.type==="opaque"||!response.headers.get("content-type")?.startsWith("image/"))return;
  const size=Number(response.headers.get("content-length")||0);
  if(size>2_000_000)return;
  await cache.put(href,response);
  const keys=await cache.keys();
  await Promise.all(keys.slice(0,Math.max(0,keys.length-MAX_IMAGE_ENTRIES)).map(key=>cache.delete(key)));
 }catch{/* Storage quota, private browsing, and network errors are nonfatal. */}
}
export async function cachedPublicImage(url:string):Promise<string|null>{
 const href=publicImageUrl(url);
 if(!href||typeof caches==="undefined")return null;
 try{
  const match=await (await caches.open(PUBLIC_CACHE)).match(href);
  if(!match)return null;
  // Browser HTTP cache remains the normal display path; Cache Storage is a fallback.
  const blob=await match.blob();
  return URL.createObjectURL(blob);
 }catch{return null}
}

/** Warm browser-managed metadata/range requests for at most two upcoming public videos.
 * This does NOT download full files or bypass platform/CDN restrictions.
 */
const videoWarmers=new Map<string,HTMLVideoElement>();
const MAX_WARMERS=2;
export function predictVideo(url:string):void{
 if(typeof document==="undefined"||document.hidden||!url||videoWarmers.has(url))return;
 const connection=(navigator as Navigator & {connection?:{saveData?:boolean;effectiveType?:string}}).connection;
 if(connection?.saveData||/2g/.test(connection?.effectiveType||""))return;
 let parsed:URL;
 try{parsed=new URL(url,location.href)}catch{return}
 // Supabase public Storage may be browser-prefetched, never stored in our SW.
 // Exclude signed/private endpoints and query tokens entirely.
 const publicCommunityVideo = parsed.protocol==="https:" &&
   parsed.hostname==="njilnqgdfrvpvgbkodwl.supabase.co" &&
   parsed.pathname.startsWith("/storage/v1/object/public/community-media/");
 if(parsed.search || !/\.(?:mp4|webm)$/i.test(parsed.pathname) ||
    (parsed.origin!==location.origin && !publicCommunityVideo))return;
 const video=document.createElement("video");
 video.preload="metadata";video.muted=true;video.playsInline=true;
 video.src=parsed.href;
 videoWarmers.set(url,video);
 while(videoWarmers.size>MAX_WARMERS){
  const first=videoWarmers.keys().next().value;
  if(!first)break;
  const old=videoWarmers.get(first);
  old?.removeAttribute("src");old?.load();
  videoWarmers.delete(first);
 }
 video.load();
}

/** Install an opt-in, tightly scoped public-media service worker. */
let workerStarted=false;
export function enablePublicMediaCache():void{
 if(workerStarted||typeof navigator==="undefined"||!("serviceWorker" in navigator)||location.protocol!=="https:")return;
 workerStarted=true;
 void navigator.serviceWorker.register("/media-cache-sw.js",{scope:"/"}).catch(()=>{workerStarted=false});
}

/** Prepare up to three first HLS media segments of a public same-origin playlist.
 * Browser playback uses the cached responses only when its requests pass through our SW.
 * DRM, signed manifests, YouTube and third-party sources are deliberately unsupported.
 */
const activePlaylists=new Set<string>();
export async function bufferPublicHls(playlist:string):Promise<void>{
 if(typeof window==="undefined"||document.hidden||activePlaylists.has(playlist))return;
 const connection=(navigator as Navigator & {connection?:{saveData?:boolean;effectiveType?:string}}).connection;
 if(connection?.saveData||/2g/.test(connection?.effectiveType||""))return;
 let url:URL;
 try{url=new URL(playlist,location.href)}catch{return}
 if(url.origin!==location.origin||url.search||!url.pathname.startsWith("/media/hls/")||!url.pathname.endsWith(".m3u8"))return;
 activePlaylists.add(playlist);
 try{
  enablePublicMediaCache();
  const response=await fetch(url.href,{credentials:"omit"});
  if(!response.ok||Number(response.headers.get("content-length")||0)>150_000)return;
  const manifest=await response.text();
  if(manifest.length>150_000||!manifest.startsWith("#EXTM3U")||manifest.includes("#EXT-X-KEY")||manifest.includes("#EXT-X-SESSION-KEY"))return;
  const lines=manifest.split(/\\r?\\n/).map(line=>line.trim()).filter(line=>line&&!line.startsWith("#"));
  const segments=lines.filter(line=>/\\.(?:ts|m4s)(?:$|\\?)/i.test(line)).slice(0,3);
  for(const segment of segments){
   const target=new URL(segment,url);
   if(target.origin!==location.origin||target.search||!target.pathname.startsWith("/media/hls/"))continue;
   try{
    const head=await fetch(target.href,{method:"HEAD",credentials:"omit"});
    const size=Number(head.headers.get("content-length")||0);
    if(!head.ok||!size||size>4_000_000)continue;
    // Fetch via the service worker; it persists eligible responses to Cache Storage.
    await fetch(target.href,{credentials:"omit"});
   }catch{}
  }
 }catch{}finally{activePlaylists.delete(playlist)}
}
