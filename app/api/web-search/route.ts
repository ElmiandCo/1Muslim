import { NextRequest, NextResponse } from "next/server";
import {claimSearchQuota} from "../../../lib/server/search-api-quota";
import { normalizeQuery, searchWholeWeb, SearchProviderError, type WebVertical } from "../../../lib/server/one-muslim-web-search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req:NextRequest) {
  const query=normalizeQuery(req.nextUrl.searchParams.get("q"));
  const requested=req.nextUrl.searchParams.get("type");
  const kind:WebVertical=requested==="news"||requested==="video"||requested==="web"?requested:"all";
  if(query.length<2)return NextResponse.json({error:"Enter at least two characters."},{status:400});
  if(!process.env.BRAVE_SEARCH_API_KEY)return NextResponse.json({error:"Worldwide search is being connected. 1Muslim results are available below."},{status:503,headers:{"Cache-Control":"no-store"}});
  const decision=await claimSearchQuota(req,"web");
  if(decision!=="allowed")return NextResponse.json({
    error:decision==="limited"?"Too many searches. Try again shortly.":"Web search is temporarily unavailable."
  },{status:decision==="limited"?429:503,headers:{"Cache-Control":"no-store"}});
  try{
    return NextResponse.json(await searchWholeWeb(query,kind),{headers:{"Cache-Control":"public, max-age=0, s-maxage=45"}});
  }catch(error) {
    const status=error instanceof SearchProviderError?error.status:503;
    const message=error instanceof SearchProviderError?error.message:"Unable to search the web right now.";
    return NextResponse.json({error:message},{status,headers:{"Cache-Control":"no-store"}});
  }
}
