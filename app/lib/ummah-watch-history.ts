// Client-only, device-local watch history. A post enters this list only after video playback,
// not merely because it appeared in the Discover grid or was prefetched.
export const UMMAH_WATCH_HISTORY_KEY = "1muslim:ummah:watched:v1";
export const UMMAH_PLAY_QUEUE_KEY = "1muslim:ummah:immersive-queue:v1";
export const UMMAH_WATCH_UPDATED_EVENT = "1muslim:ummah:watched-updated";
export type WatchedPost = { id:string; authorId:string; watchedAt:number };
const isId = (id:unknown): id is string => typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id);

export function readWatchedPosts():WatchedPost[]{
 if(typeof window==="undefined")return [];
 try{
  const entries:unknown=JSON.parse(localStorage.getItem(UMMAH_WATCH_HISTORY_KEY)||"[]");
  if(!Array.isArray(entries))return [];
  return entries.filter((row):row is WatchedPost=>{
   if(!row||typeof row!=="object")return false;
   const item=row as Partial<WatchedPost>;
   return isId(item.id)&&isId(item.authorId)&&typeof item.watchedAt==="number"&&Number.isFinite(item.watchedAt)&&item.watchedAt>0;
  }).sort((a,b)=>b.watchedAt-a.watchedAt).slice(0,120);
 }catch{return []}
}
export function rememberWatchedPost(id:string,authorId:string){
 if(!isId(id)||!isId(authorId)||typeof window==="undefined")return;
 try{
  const next=[{id,authorId,watchedAt:Date.now()},...readWatchedPosts().filter(row=>row.id!==id)].slice(0,120);
  localStorage.setItem(UMMAH_WATCH_HISTORY_KEY,JSON.stringify(next));
  window.dispatchEvent(new Event(UMMAH_WATCH_UPDATED_EVENT));
 }catch{/* A blocked storage API should never interrupt a video. */}
}
export function storeImmersiveQueue(ids:string[]){
 if(typeof window==="undefined")return;
 try{sessionStorage.setItem(UMMAH_PLAY_QUEUE_KEY,JSON.stringify([...new Set(ids.filter(isId))].slice(0,200)))}catch{}
}
export function readImmersiveQueue():string[]{
 if(typeof window==="undefined")return [];
 try{
  const value:unknown=JSON.parse(sessionStorage.getItem(UMMAH_PLAY_QUEUE_KEY)||"[]");
  return Array.isArray(value)?value.filter(isId).slice(0,200):[];
 }catch{return []}
}
