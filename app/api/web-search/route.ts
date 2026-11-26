import { NextRequest, NextResponse } from "next/server";
import { normalizeQuery, searchWholeWeb, SearchProviderError, type WebVertical } from "../../../lib/server/one-muslim-web-search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Best-effort, per-instance guard against accidental and scripted API spend.
// Apply an edge / distributed quota before a high-traffic public rollout.
const windows = new Map<string,{count:number;reset:number}>();
function allowed(req:NextRequest):boolean {
  const identifier=req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now=Date.now();
  const previous=windows.get(identifier);
  if(!previous || previous.reset<=now) {
    if(windows.size>2000)windows.clear();
    windows.set(identifier,{count:1,reset:now+300_000});
    return true;
  }
  previous.count++;
  return previous.count<=30;
}
export async function GET(req:NextRequest) {
  const query=normalizeQuery(req.nextUrl.searchParams.get("q"));
  const requested=req.nextUrl.searchParams.get("type");
  const kind:WebVertical=requested==="news"||requested==="video"||requested==="web"?requested:"all";
  if(query.length<2)return NextResponse.json({error:"Enter at least two characters."},{status:400});
  if(!allowed(req))return NextResponse.json({error:"Too many searches. Try again shortly."},{status:429,headers:{"Cache-Control":"no-store"}});
  try{
    return NextResponse.json(await searchWholeWeb(query,kind),{headers:{"Cache-Control":"public, max-age=0, s-maxage=45"}});
  }catch(error) {
    const status=error instanceof SearchProviderError?error.status:503;
    const message=error instanceof SearchProviderError?error.message:"Unable to search the web right now.";
    return NextResponse.json({error:message},{status,headers:{"Cache-Control":"no-store"}});
  }
}
