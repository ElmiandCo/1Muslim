import type {HudHudWebResult} from "../hudhud/HudHudFocusStage";

/** Independent website retrieval is opt-in by intent, never shown under a
 * normal chat answer just because external search happened to return a link. */
export function isHudHudLinkRequest(message:string):boolean{
 const text=message.trim().toLowerCase();
 if(!text||text.length>250)return false;
 return /\b(?:find|show|give|send|share|provide|open|search|look up|where can i find|take me to)\b.{0,85}\b(?:link|url|website|web page|site)\b/i.test(text)
  || /\b(?:link|url|website|web page)\b.{0,85}\b(?:for|to|of|about)\b/i.test(text)
  || /\b(?:go to|take me to)\b.{0,85}\bwebsite\b/i.test(text);
}

type WebPayload={results?:Array<{title?:string;url?:string;source?:string;description?:string;thumbnailUrl?:string}>};

/** Return the independent web provider's first valid hit. Never promote a
 * domain by owner, religious affiliation, popularity, or advertising. */
export async function getHudHudTopWebResult(query:string,signal?:AbortSignal):Promise<HudHudWebResult|undefined>{
 const normalized=query.trim().slice(0,120);
 if(normalized.length<2||!isHudHudLinkRequest(query))return;
 const response=await fetch("/api/web-search?q="+encodeURIComponent(normalized)+"&type=web",
   {cache:"no-store",signal});
 if(!response.ok)return;
 const payload=await response.json() as WebPayload;
 for(const result of payload.results||[]){
  if(!result.title||!result.url)continue;
  let url:URL;
  try{url=new URL(result.url)}catch{continue}
  if(url.protocol!=="https:"&&url.protocol!=="http:")continue;
  return {title:result.title,url:url.href,source:result.source||url.hostname,
   description:result.description||"",
   thumbnailUrl:result.thumbnailUrl?.startsWith("https://")?result.thumbnailUrl:undefined};
 }
}
