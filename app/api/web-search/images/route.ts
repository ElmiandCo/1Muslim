import { NextRequest, NextResponse } from "next/server";
import { normalizeQuery, SearchProviderError } from "../../../../lib/server/one-muslim-web-search";
import { searchImages } from "../../../../lib/server/one-muslim-image-search";

export const runtime="nodejs";
export const dynamic="force-dynamic";
// Temporary in-instance protection. Distributed quotas required before public rollout.
const requests=new Map<string,{count:number;reset:number}>();
export async function GET(req:NextRequest){
  const query=normalizeQuery(req.nextUrl.searchParams.get("q"));
  if(query.length<2)return NextResponse.json({error:"Enter at least two characters."},{status:400});
  const identity=req.headers.get("x-real-ip")||req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown";
  const now=Date.now();const current=requests.get(identity);
  if(!current||current.reset<=now){if(requests.size>2000)requests.clear();requests.set(identity,{count:1,reset:now+300000});}
  else if(++current.count>20)return NextResponse.json({error:"Too many image searches. Try again soon."},{status:429});
  try{return NextResponse.json(await searchImages(query),{headers:{"Cache-Control":"public,max-age=0,s-maxage=45"}});}
  catch(error){return NextResponse.json({error:error instanceof SearchProviderError?error.message:"Images unavailable."},{status:error instanceof SearchProviderError?error.status:503,headers:{"Cache-Control":"no-store"}});}
}
