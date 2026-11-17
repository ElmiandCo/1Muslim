/* 1Muslim public media cache: strictly public, same-origin versioned/static assets. */
const IMAGE_CACHE="1muslim-public-images-v2";
const SEGMENT_CACHE="1muslim-public-hls-segments-v1";
const ALLOWED=["/assets/","/media/"];
function eligible(request){
 const url=new URL(request.url);
 if(url.origin!==self.location.origin||url.search||request.method!=="GET"||request.credentials==="include"||request.headers.has("authorization")||request.headers.has("range"))return null;
 if(!ALLOWED.some(p=>url.pathname.startsWith(p)))return null;
 if(/\\.(png|jpe?g|webp|avif|gif)$/i.test(url.pathname))return IMAGE_CACHE;
 if(/\\.(ts|m4s|mp4)$/i.test(url.pathname)&&url.pathname.includes("/hls/"))return SEGMENT_CACHE;
 return null;
}
self.addEventListener("install",event=>event.waitUntil(self.skipWaiting()));
self.addEventListener("activate",event=>event.waitUntil(self.clients.claim()));
self.addEventListener("fetch",event=>{
 const request=event.request, cacheName=eligible(request);
 if(!cacheName)return;
 event.respondWith((async()=>{
  const cache=await caches.open(cacheName);
  const cached=await cache.match(request);
  if(cached)return cached;
  const response=await fetch(request);
  if(response.ok&&response.type==="basic"&&!response.headers.has("set-cookie")&&response.headers.get("cache-control")?.toLowerCase().includes("private")!==true){
   const limit=cacheName===IMAGE_CACHE?2_000_000:4_000_000;
   const length=Number(response.headers.get("content-length")||0);
   if(length>0&&length<=limit){
    event.waitUntil((async()=>{try{
     await cache.put(request,response.clone());
     const keys=await cache.keys(),max=cacheName===IMAGE_CACHE?60:24;
     await Promise.all(keys.slice(0,Math.max(0,keys.length-max)).map(k=>cache.delete(k)));
    }catch{}})());
   }
  }
  return response;
 })());
});
