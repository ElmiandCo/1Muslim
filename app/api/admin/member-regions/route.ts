import {NextResponse} from "next/server";
import {createClient} from "../../../../utils/supabase/server";
import {createClient as serviceClient} from "@supabase/supabase-js";
import {canonicalCountry} from "../../../../lib/member-region-country";
import {canonicalUsState,isKnownUsState} from "../../../../lib/member-region-state";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const noCache={"Cache-Control":"private, no-store"};
type RegionRow={user_id:string;consented_at:string};
type ProfileLocation={id:string;country:string|null;state:string|null};
/** Only explicit "Yes, share my region" choices are counted; prayer GPS is never included. */
export async function GET(){
 const auth=await createClient();const {data:{user},error:authError}=await auth.auth.getUser();
 if(authError||user?.email?.toLowerCase()!=="hudhudbyelmi@gmail.com")
  return NextResponse.json({error:"Forbidden"},{status:403,headers:noCache});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:"Private location analytics unavailable"},{status:503,headers:noCache});
 const db=serviceClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const optedInUsers=new Set<string>();let truncated=false;
 for(let offset=0;offset<50000;offset+=1000){
  const {data,error}=await db.from("member_region_preferences").select("user_id,consented_at").not("consented_at","is",null).order("user_id").range(offset,offset+999);
  if(error){console.error("Region opt-in query failed",error.code);return NextResponse.json({error:"Saved opt-in preferences unavailable; check the member_region_preferences migration."},{status:503,headers:noCache})}
  for(const row of (data||[]) as RegionRow[])if(row.user_id)optedInUsers.add(row.user_id);
  if(!data||data.length<1000)break;
  if(offset===49000)truncated=true;
 }
 const countries=new Map<string,number>(),usStates=new Map<string,number>();let mapped=0,unmapped=0,usLocated=0;
 const ids=[...optedInUsers];
 for(let i=0;i<ids.length;i+=100){
  const {data,error}=await db.from("profiles").select("id,country,state").in("id",ids.slice(i,i+100));
  if(error){console.error("Region profile aggregation failed",error.code);return NextResponse.json({error:"Saved member locations unavailable"},{status:503,headers:noCache})}
  for(const p of (data||[]) as ProfileLocation[]){
   const country=canonicalCountry(p.country);if(!country){unmapped++;continue}
   mapped++;countries.set(country,(countries.get(country)||0)+1);
   if(country==="United States"){usLocated++;const state=canonicalUsState(p.state);if(isKnownUsState(state))usStates.set(state,(usStates.get(state)||0)+1)}
  }
 }
 const ordered=(map:Map<string,number>,key:"country"|"state")=>[...map.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(([label,count])=>({[key]:label,count}));
 const {count:totalMembers,error:totalError}=await db.from("profiles").select("id",{count:"exact",head:true});
 return NextResponse.json({
  optedIn:optedInUsers.size,mapped,withoutCountry:Math.max(0,optedInUsers.size-mapped),
  totalMembers:totalError?null:totalMembers,
  usLocated,usWithState:[...usStates.values()].reduce((n,v)=>n+v,0),
  countries:ordered(countries,"country"),usStates:ordered(usStates,"state"),
  updatedAt:new Date().toISOString(),truncated,
  definition:"Only accounts that explicitly saved an Ummah region consent are counted. Country and optional state are read from their saved profiles; device GPS and prayer-only location settings are excluded."
 },{headers:noCache});
}
