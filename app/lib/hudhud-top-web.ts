import type {HudHudWebResult} from "../hudhud/HudHudFocusStage";

/** Request a provider result only when someone really asks to find/open a site.
 * A conversational answer must not attract unrelated link cards, and the
 * existing /api/web-search ranking, guest access, quotas and caching remain
 * completely untouched.
 */
export function isHudHudLinkRequest(message:string):boolean{
 const text=message.trim().toLowerCase();
 if(text.length<4)return false;
 return /\b(?:find|show|give|send|share|provide|open|visit|search|look\s*up|take\s+me\s+to|bring\s+me\s+to|navigate\s+to|recommend|suggest)\b.{0,110}\b(?:links?|urls?|websites?|web\s?pages?|sites?)\b/.test(text)
  || /\b(?:where\s+(?:can|could)\s+i\s+(?:find|visit)|what(?:'s|\s+is)\s+the\s+(?:best|official))\b.{0,110}\b(?:links?|urls?|websites?|web\s?pages?|sites?)\b/.test(text)
  || /^(?:(?:a|an|the)\s+)?(?:link|url|website|web\s?page|site)\s+(?:for|about|to)\b/.test(text);
}

type WebPayload={results?:Array<{title?:string;url?:string;source?:string;description?:string;thumbnailUrl?:string}>};

/** Return the independent web provider's first valid HTTPS hit. The provider
 * retains its original neutral ranking: do not boost any site or fabricate URLs.
 * Opening the verified result remains a deliberate user selection.
 */
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
  if(url.protocol!=="https:")continue;
  return {title:result.title,url:url.href,source:result.source||url.hostname,
   description:result.description||"",
   thumbnailUrl:result.thumbnailUrl?.startsWith("https://")?result.thumbnailUrl:undefined};
 }
}
