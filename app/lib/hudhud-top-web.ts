import type {HudHudWebResult} from "../hudhud/HudHudFocusStage";

/** Only an explicit request for a website/link should show a web result.
 * Ordinary conversation must never attach unrelated search cards.
 */
export function isHudHudLinkRequest(message:string):boolean{
 const text=message.trim().toLowerCase();
 if(text.length<4)return false;
 return /\b(?:find|show|give|send|share|provide|open|search|look\s*up|where\s+can\s+i\s+find)\b.{0,90}\b(?:link|url|website|web\s?page|site)\b/.test(text)
  || /\b(?:link|url|website|web\s?page)\b.{0,65}\b(?:for|to|of|about)\b/.test(text);
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
