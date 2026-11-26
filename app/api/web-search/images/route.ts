import { NextRequest, NextResponse } from "next/server";
import {claimSearchQuota} from "../../../../lib/server/search-api-quota";
import { normalizeQuery, SearchProviderError } from "../../../../lib/server/one-muslim-web-search";
import { searchImages } from "../../../../lib/server/one-muslim-image-search";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
  const query=normalizeQuery(req.nextUrl.searchParams.get("q"));
  if(query.length<2)return NextResponse.json({error:"Enter at least two characters."},{status:400});
  if(!process.env.BRAVE_SEARCH_API_KEY)return NextResponse.json({error:"Worldwide images are being connected. Please try again later."},{status:503});
  const decision=await claimSearchQuota(req,"images");
  if(decision!=="allowed")return NextResponse.json({
    error:decision==="limited"?"Too many image searches. Try again soon.":"Image search temporarily unavailable."
  },{status:decision==="limited"?429:503});
  try{return NextResponse.json(await searchImages(query),{headers:{"Cache-Control":"public,max-age=0,s-maxage=45"}});}
  catch(error){return NextResponse.json({error:error instanceof SearchProviderError?error.message:"Images unavailable."},{status:error instanceof SearchProviderError?error.status:503,headers:{"Cache-Control":"no-store"}});}
}
