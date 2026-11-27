import type {HudHudWebResult} from "../hudhud/HudHudFocusStage";

type WebPayload={results?:Array<{title?:string;url?:string;source?:string;description?:string;thumbnailUrl?:string}>};

/** Return the independent web provider's first valid hit. Never promote a
 * domain by owner, religious affiliation, popularity, or advertising. */
export async function getHudHudTopWebResult(query:string,signal?:AbortSignal):Promise<HudHudWebResult|undefined>{
 const normalized=query.trim().slice(0,120);
 if(normalized.length<2)return;
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
