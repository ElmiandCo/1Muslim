/**
 * Recognize a YouTube video link in a shared Ummah post without confusing
 * a thumbnail image URL for an actual playable media stream.
 *
 * Supports watch URLs (including non-leading v query parameters), Shorts,
 * live streams, youtu.be, mobile/music hosts and privacy-enhanced embeds.
 */
export function youtubeIdFromText(text:string|null|undefined):string|null{
 if(!text)return null;
 const candidates=text.match(/(?:https?:\/\/)?(?:www\.|m\.|music\.)?(?:youtube(?:-nocookie)?\.com|youtu\.be)\/[^\s<>"'\]\[{}]+/gi)||[];
 for(const candidate of candidates){
  const value=candidate.replace(/[),;.!?]+$/g,"");
  let url:URL;
  try{url=new URL(/^https?:\/\//i.test(value)?value:"https://"+value)}catch{continue}
  const host=url.hostname.toLowerCase().replace(/^www\./,"");
  if(!["youtube.com","m.youtube.com","music.youtube.com","youtube-nocookie.com","youtu.be"].includes(host))continue;
  const parts=url.pathname.split("/").filter(Boolean);
  const id=host==="youtu.be"?parts[0]:
   parts[0]==="watch"?url.searchParams.get("v"):
   ["shorts","live","embed","v"].includes(parts[0])?parts[1]:
   url.searchParams.get("v");
  if(id&&/^[A-Za-z0-9_-]{11}$/.test(id))return id;
 }
 return null;
}
export function youtubeIdFromPost(body:string|null|undefined,mediaUrl?:string|null):string|null{
 return youtubeIdFromText(mediaUrl)||youtubeIdFromText(body);
}
export function youtubeThumbnail(id:string):string{
 return "https://i.ytimg.com/vi/"+encodeURIComponent(id)+"/hqdefault.jpg";
}
