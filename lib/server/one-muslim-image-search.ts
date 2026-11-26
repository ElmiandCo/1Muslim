import { normalizeQuery, SearchProviderError } from "./one-muslim-web-search";

export type ImageSearchResult={title:string;pageUrl:string;imageUrl:string;thumbnailUrl:string;source:string;width?:number;height?:number};
export type ImageSearchResponse={query:string;results:ImageSearchResult[];total:number;provider:"Brave Search"};
type BraveImageResult={title?:unknown;url?:unknown;thumbnail?:{src?:unknown};properties?:{url?:unknown;width?:unknown;height?:unknown};meta_url?:{hostname?:unknown}};
const cache=new Map<string,{expires:number;response:ImageSearchResponse}>();

const httpsUrl=(value:unknown):string|null=>{
  if(typeof value!=="string")return null;
  try{const parsed=new URL(value);return parsed.protocol==="https:"?parsed.href:null;}catch{return null;}
};
const sourceUrl=(value:unknown):string|null=>{
  if(typeof value!=="string")return null;
  try{const parsed=new URL(value);return ["http:","https:"].includes(parsed.protocol)?parsed.href:null;}catch{return null;}
};
export async function searchImages(query:string):Promise<ImageSearchResponse>{
  const normalized=normalizeQuery(query);
  if(normalized.length<2)throw new SearchProviderError("Enter at least 2 characters.",400);
  const key=process.env.BRAVE_SEARCH_API_KEY;
  if(!key)throw new SearchProviderError("Image search is awaiting its Brave Search API key.",503);
  const cacheKey=normalized.toLowerCase();
  const previous=cache.get(cacheKey);
  if(previous && previous.expires>Date.now())return previous.response;
  const url=new URL("https://api.search.brave.com/res/v1/images/search");
  url.searchParams.set("q",normalized);
  url.searchParams.set("count","24");
  url.searchParams.set("safesearch","strict");
  let response:Response;
  try{response=await fetch(url.toString(),{headers:{"Accept":"application/json","X-Subscription-Token":key},cache:"no-store",signal:AbortSignal.timeout(9000)});}
  catch{throw new SearchProviderError("Image search provider did not respond. Try again.",503);}
  if(response.status===429)throw new SearchProviderError("Image search is busy. Try again shortly.",429);
  if(!response.ok)throw new SearchProviderError("Image search is temporarily unavailable.",503);
  const json=await response.json() as {results?:BraveImageResult[]};
  const results:ImageSearchResult[]=[];
  const seen=new Set<string>();
  for(const item of Array.isArray(json.results)?json.results:[]){
    const thumbnailUrl=httpsUrl(item.thumbnail?.src);
    const imageUrl=httpsUrl(item.properties?.url) || thumbnailUrl;
    const pageUrl=sourceUrl(item.url);
    if(!thumbnailUrl||!imageUrl||!pageUrl||seen.has(pageUrl+"|"+imageUrl))continue;
    const host=new URL(pageUrl).hostname.replace(/^www\./,"");
    seen.add(pageUrl+"|"+imageUrl);
    results.push({
      title:typeof item.title==="string"?item.title.replace(/<[^>]*>/g,"").slice(0,160):"Image result",
      pageUrl,imageUrl,thumbnailUrl,source:host,
      ...(typeof item.properties?.width==="number"?{width:item.properties.width}:{}),
      ...(typeof item.properties?.height==="number"?{height:item.properties.height}:{})
    });
  }
  const result:ImageSearchResponse={query:normalized,results,total:results.length,provider:"Brave Search"};
  if(cache.size>100)cache.clear();
  cache.set(cacheKey,{expires:Date.now()+60_000,response:result});
  return result;
}
