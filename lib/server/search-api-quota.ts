/** Shared, fail-closed budget guard for public search APIs.
 * Uses an atomic Supabase RPC so every Vercel instance shares the same limits.
 * Client IPs are HMAC-hashed (never stored in plain text).
 */
import {createHmac} from "node:crypto";
import type {NextRequest} from "next/server";

export type SearchQuotaKind="web"|"images"|"summary"|"voice";
export type SearchQuotaDecision="allowed"|"limited"|"unavailable";
const policies:Record<SearchQuotaKind,{perVisitor:number;windowSeconds:number;globalDaily:number}>={
  web:{perVisitor:30,windowSeconds:300,globalDaily:1500},
  images:{perVisitor:15,windowSeconds:300,globalDaily:400},
  summary:{perVisitor:6,windowSeconds:900,globalDaily:100},
  voice:{perVisitor:22,windowSeconds:600,globalDaily:900}
};
async function claim(url:string,key:string,requestKey:string,max:number,seconds:number):Promise<boolean|null>{
  let response:Response;
  try{
    response=await fetch(url+"/rest/v1/rpc/claim_search_api_quota",{
      method:"POST",headers:{"Content-Type":"application/json","apikey":key,"Authorization":"Bearer "+key},
      body:JSON.stringify({p_key:requestKey,p_max:max,p_window_seconds:seconds}),
      signal:AbortSignal.timeout(4000),cache:"no-store"
    });
    if(!response.ok)return null;
    return await response.json()===true;
  }catch{return null;}
}
export async function claimSearchQuota(req:NextRequest,kind:SearchQuotaKind):Promise<SearchQuotaDecision>{
  const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/,"");
  const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!supabaseUrl||!serviceKey)return "unavailable";
  const ip=req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    ||req.headers.get("x-real-ip")||req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ||"unknown";
  const hashed=createHmac("sha256",serviceKey).update(ip).digest("hex").slice(0,40);
  const policy=policies[kind];
  const visitor=await claim(supabaseUrl,serviceKey,kind+":v:"+hashed,policy.perVisitor,policy.windowSeconds);
  if(visitor===null)return "unavailable";
  if(!visitor)return "limited";
  const global=await claim(supabaseUrl,serviceKey,kind+":global",policy.globalDaily,86400);
  return global===null?"unavailable":global?"allowed":"limited";
}
