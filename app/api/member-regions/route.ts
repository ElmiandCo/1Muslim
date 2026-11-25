import {NextResponse} from "next/server";
import {createClient as serviceClient} from "@supabase/supabase-js";
import {canonicalCountry} from "../../../lib/member-region-country";
import {canonicalUsState,isKnownUsState} from "../../../lib/member-region-state";

export const runtime="nodejs";
export const dynamic="force-dynamic";

// The public atlas returns country and state aggregate counts ONLY, never user IDs,
// cities, coordinates, or prayer location. Explicit map consent is the source of truth.
type ProfileRegion={id:string;country:string|null;state:string|null};
type ConsentRow={user_id:string};
// Consent changes must appear on the map immediately, even when a CDN has cached prior counts.
const headers={"Cache-Control":"private, no-store, max-age=0"};
export async function GET(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:"Member atlas unavailable"},{status:503});
 const db=serviceClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const ids:string[]=[];let limited=false;
 // Query only explicit opt-ins. Service access is server-only and is never sent to clients.
 for(let offset=0;offset<50000;offset+=1000){
  const {data,error}=await db.from("member_region_preferences").select("user_id").not("consented_at","is",null).order("user_id").range(offset,offset+999);
  if(error){console.error("Public atlas consent read failed",error.code);return NextResponse.json({error:"Member atlas temporarily unavailable"},{status:503})}
  ids.push(...(data||[]).map((row:ConsentRow)=>row.user_id).filter(Boolean));
  if(!data||data.length<1000)break;
  if(offset===49000)limited=true;
 }
 const countries=new Map<string,number>(),states=new Map<string,number>();
 let recorded=0,unplaced=0,usCount=0;
 for(let at=0;at<ids.length;at+=100){
  const {data,error}=await db.from("profiles").select("id,country,state").in("id",ids.slice(at,at+100));
  if(error){console.error("Public atlas profile read failed",error.code);return NextResponse.json({error:"Member atlas temporarily unavailable"},{status:503})}
  for(const row of (data||[]) as ProfileRegion[]){
   const country=canonicalCountry(row.country);
   if(!country){unplaced++;continue}
   recorded++;countries.set(country,(countries.get(country)||0)+1);
   if(country==="United States"){
    usCount++;
    // The consented member may elect not to share a state. Never create a fake dot.
    if(isKnownUsState(row.state)){
     const state=canonicalUsState(row.state);
     states.set(state,(states.get(state)||0)+1);
    }
   }
  }
 }
 const rows=(source:Map<string,number>)=>[...source.entries()].map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name));
 return NextResponse.json({countries:rows(countries),states:rows(states),optedIn:ids.length,recorded,unplaced,usCount,updatedAt:new Date().toISOString(),limited},
  {headers});
}
