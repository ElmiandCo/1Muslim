/** Server-only global web retrieval for 1Muslim Search.
 * Preserve the search provider's rank order without boosting 1Muslim,
 * religious websites or sources affiliated with any specific viewpoint.
 * Islamic context is supplied separately, with cited evidence, in HudHud.
 */
export type WebResultKind = "web" | "news" | "video";
export type WebResult = {
  title: string;
  url: string;
  description: string;
  source: string;
  kind: WebResultKind;
  score: number;
  publishedAt?: string;
  thumbnailUrl?: string;
};
export type WebSearchResponse = {
  query: string;
  results: WebResult[];
  total: number;
  provider: "Brave Search";
  partial: boolean;
};

const clean = (value: unknown, limit: number) =>
  typeof value === "string" ? value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, limit) : "";

type RawResult = { title?:unknown; url?:unknown; description?:unknown; age?:unknown; page_age?:unknown; video?:{url?:string}; thumbnail?:{src?:unknown}; };
type BravePayload = {
  web?:{results?:RawResult[]};
  news?:{results?:RawResult[]};
  videos?:{results?:RawResult[]};
};

function mapResult(item: RawResult, kind: WebResultKind, index: number): WebResult | null {
  if (typeof item.url !== "string") return null;
  let url: URL;
  try { url = new URL(item.url); } catch { return null; }
  if (!["https:", "http:"].includes(url.protocol)) return null;
  const title = clean(item.title, 170);
  if (!title) return null;
  const description = clean(item.description, 550);
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  // No domain, religion, brand, or keyword-based preference: rank solely by provider order.
  const image=typeof item.thumbnail?.src==="string"?item.thumbnail.src:"";
  let thumbnailUrl:string|undefined;
  try{if(new URL(image).protocol==="https:")thumbnailUrl=image;}catch{}
  return { title, url:url.href, description, source:host, kind, score:100-index*2,
    ...(typeof item.age==="string"?{publishedAt:item.age}:typeof item.page_age==="string"?{publishedAt:item.page_age}:{}),
    ...(thumbnailUrl?{thumbnailUrl}:{}) };
}
const memory = new Map<string, { expires: number; payload: WebSearchResponse }>();
export class SearchProviderError extends Error {
  status:number;
  constructor(message:string,status:number){super(message);this.status=status;}
}
export function normalizeQuery(input: unknown): string {
  return typeof input==="string"?input.trim().replace(/\s+/g," ").slice(0,120):"";
}
export type WebVertical = "all" | "web" | "news" | "video";
export async function searchWholeWeb(query: string, vertical: WebVertical = "all"): Promise<WebSearchResponse> {
  const normalized=normalizeQuery(query);
  if(normalized.length<2)throw new SearchProviderError("Enter at least 2 characters.",400);
  const key=process.env.BRAVE_SEARCH_API_KEY;
  if(!key)throw new SearchProviderError("Global web search is awaiting its Brave Search API key. 1Muslim directory search remains available.",503);
  const cacheKey=vertical+":"+normalized.toLowerCase();
  const saved=memory.get(cacheKey);
  if(saved && saved.expires>Date.now())return saved.payload;
  const endpoint=vertical==="news"?"news":vertical==="video"?"videos":"web";
  const url=new URL("https://api.search.brave.com/res/v1/"+endpoint+"/search");
  url.searchParams.set("q",normalized);
  url.searchParams.set("count","20");
  if(endpoint==="web")url.searchParams.set("extra_snippets","false");
  url.searchParams.set("safesearch","moderate");
  let response:Response;
  try {
    response=await fetch(url.toString(),{
      headers:{"Accept":"application/json","X-Subscription-Token":key},
      cache:"no-store",signal:AbortSignal.timeout(9000)
    });
  } catch {
    throw new SearchProviderError("The global search provider did not respond. Try again.",503);
  }
  if(response.status===429)throw new SearchProviderError("Search is busy. Please retry in a moment.",429);
  if(!response.ok)throw new SearchProviderError("Global search is temporarily unavailable.",503);
  const payload=await response.json() as BravePayload & {results?:RawResult[]};
  const combined:WebResult[]=[];
  const buckets:Array<[WebResultKind,RawResult[]|undefined]>=vertical==="news"?[["news",payload.results]]
    :vertical==="video"?[["video",payload.results]]
    :vertical==="web"?[["web",payload.web?.results]]
    :[["web",payload.web?.results],["news",payload.news?.results],["video",payload.videos?.results]];
  for(const [kind,values] of buckets){
    for(const [index,value] of (values||[]).entries()) {
      const mapped=mapResult(value,kind,index);
      if(mapped)combined.push(mapped);
    }
  }
  const seen=new Set<string>();
  const results=combined.sort((a,b)=>b.score-a.score).filter(item=>{
    const identity=item.url.replace(/\/$/,"");
    if(seen.has(identity))return false;
    seen.add(identity);return true;
  }).slice(0,35);
  const result={query:normalized,results,total:results.length,provider:"Brave Search" as const,partial:false};
  if(memory.size>100)memory.clear();
  memory.set(cacheKey,{expires:Date.now()+60_000,payload:result});
  return result;
}
