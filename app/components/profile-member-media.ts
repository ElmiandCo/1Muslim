"use client";
import {createClient} from "../../utils/supabase/client";

export type MemberMediaKind="image"|"video";
const allowed=new Set(["image/jpeg","image/png","image/webp","image/gif","video/mp4","video/webm","video/quicktime"]);
const suffix:Record<string,string>={"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/gif":"gif","video/mp4":"mp4","video/webm":"webm","video/quicktime":"mov"};
export function safeMediaUrl(value:string):string|null{
 try{const url=new URL(value.trim());if(url.protocol!=="https:"||!url.hostname||url.username||url.password||url.toString().length>2048)return null;return url.toString()}catch{return null}
}
export function youtubeEmbed(value:string):string|null{
 const parsed=safeMediaUrl(value);if(!parsed)return null;
 try{
  const u=new URL(parsed),host=u.hostname.toLowerCase().replace(/^www\./,"");
  if(!["youtube.com","m.youtube.com","youtube-nocookie.com","youtu.be"].includes(host))return null;
  let id=host==="youtu.be"?u.pathname.slice(1):u.pathname.startsWith("/shorts/")?u.pathname.split("/")[2]:u.pathname.startsWith("/live/")?u.pathname.split("/")[2]:u.pathname.startsWith("/embed/")?u.pathname.split("/")[2]:u.searchParams.get("v");
  if(!id||!/^[A-Za-z0-9_-]{11}$/.test(id))return null;
  return "https://www.youtube-nocookie.com/embed/"+id+"?rel=0";
 }catch{return null}
}
export function isDirectVideo(value:string):boolean{
 try{return /\.(mp4|webm|mov|m4v)(?:$|\?)/i.test(new URL(value).pathname)}catch{return false}
}
export async function uploadMemberMedia(file:File,ownerId:string):Promise<{url:string;kind:MemberMediaKind}>{
 if(!allowed.has(file.type))throw Error("Choose a JPG, PNG, WebP, GIF, MP4, WebM or MOV file.");
 if(file.size>50*1024*1024)throw Error("Uploads must be 50 MB or smaller. For larger videos, paste a YouTube link.");
 if(!file.size)throw Error("Select a non-empty media file.");
 const db=createClient(),{data:{user},error:authError}=await db.auth.getUser();
 if(authError||user?.id!==ownerId)throw Error("Please sign in to upload your own media.");
 const kind:MemberMediaKind=file.type.startsWith("image/")?"image":"video";
 const path=ownerId+"/"+crypto.randomUUID()+"."+suffix[file.type];
 const {error}=await db.storage.from("profile-page-media").upload(path,file,{contentType:file.type,upsert:false,cacheControl:"3600"});
 if(error)throw Error("Upload failed: "+error.message);
 return {url:db.storage.from("profile-page-media").getPublicUrl(path).data.publicUrl,kind};
}
