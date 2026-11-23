import {NextResponse} from "next/server";
import {createClient as serviceClient} from "@supabase/supabase-js";

export const runtime="nodejs";
export const dynamic="force-dynamic";

// The public atlas returns aggregate counts ONLY, never user IDs, city, masjid,
// coordinates, or prayer location. Member-region consent is the source of truth.
type ProfileRegion={id:string;country:string|null;state:string|null};
type ConsentRow={user_id:string};
const headers={"Cache-Control":"public, max-age=0, s-maxage=30, stale-while-revalidate=90"};
const stateNames=Object.fromEntries(("AL:Alabama,AK:Alaska,AZ:Arizona,AR:Arkansas,CA:California,CO:Colorado,CT:Connecticut,DE:Delaware,FL:Florida,GA:Georgia,HI:Hawaii,ID:Idaho,IL:Illinois,IN:Indiana,IA:Iowa,KS:Kansas,KY:Kentucky,LA:Louisiana,ME:Maine,MD:Maryland,MA:Massachusetts,MI:Michigan,MN:Minnesota,MS:Mississippi,MO:Missouri,MT:Montana,NE:Nebraska,NV:Nevada,NH:New Hampshire,NJ:New Jersey,NM:New Mexico,NY:New York,NC:North Carolina,ND:North Dakota,OH:Ohio,OK:Oklahoma,OR:Oregon,PA:Pennsylvania,RI:Rhode Island,SC:South Carolina,SD:South Dakota,TN:Tennessee,TX:Texas,UT:Utah,VT:Vermont,VA:Virginia,WA:Washington,WV:West Virginia,WI:Wisconsin,WY:Wyoming,DC:District of Columbia").split(",").map(item=>item.split(":")));
function normalizeCountry(value:string|null):string{
 const raw=(value||"").trim();const key=raw.toLowerCase().replace(/[.\s]+/g," ").trim();
 const aliases:Record<string,string>={"us":"United States","u s":"United States","usa":"United States","u s a":"United States","america":"United States","united states of america":"United States","uk":"United Kingdom","u k":"United Kingdom","great britain":"United Kingdom","britain":"United Kingdom","uae":"United Arab Emirates","u a e":"United Arab Emirates","emirates":"United Arab Emirates","turkey":"Türkiye","turkiye":"Türkiye","ksa":"Saudi Arabia","somaliland":"Somaliland"};
 if(aliases[key])return aliases[key];
 if(raw.length===2&&/^[a-z]{2}$/i.test(raw)){try{const name=new Intl.DisplayNames(["en"],{type:"region"}).of(raw.toUpperCase());if(name&&name!==raw.toUpperCase())return name}catch{}}
 return raw;
}
function normalizeState(value:string|null):string{
 const raw=(value||"").trim();return stateNames[raw.toUpperCase()]||Object.values(stateNames).find(name=>name.toLowerCase()===raw.toLowerCase())||raw;
}
export async function GET(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:"Member atlas unavailable"},{status:503});
 const db=serviceClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const ids:string[]=[];let limited=false;
 // Query only explicit opt-ins. Service access is server-only and is never sent to clients.
 for(let offset=0;offset<30000;offset+=1000){
  const {data,error}=await db.from("member_region_preferences").select("user_id").not("consented_at","is",null).order("user_id").range(offset,offset+999);
  if(error){console.error("Public atlas consent read failed",error.code);return NextResponse.json({error:"Member atlas temporarily unavailable"},{status:503})}
  ids.push(...(data||[]).map((row:ConsentRow)=>row.user_id).filter(Boolean));
  if(!data||data.length<1000)break;
  if(offset===29000)limited=true;
 }
 const countries=new Map<string,number>(),states=new Map<string,number>();
 let recorded=0,unplaced=0,usCount=0;
 for(let at=0;at<ids.length;at+=100){
  const {data,error}=await db.from("profiles").select("id,country,state").in("id",ids.slice(at,at+100));
  if(error){console.error("Public atlas profile read failed",error.code);return NextResponse.json({error:"Member atlas temporarily unavailable"},{status:503})}
  for(const row of (data||[]) as ProfileRegion[]){
   const country=normalizeCountry(row.country);
   if(!country){unplaced++;continue}
   recorded++;countries.set(country,(countries.get(country)||0)+1);
   if(country==="United States"){usCount++;const state=normalizeState(row.state);if(state)states.set(state,(states.get(state)||0)+1)}
  }
 }
 const rows=(source:Map<string,number>)=>[...source.entries()].map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name));
 return NextResponse.json({countries:rows(countries),states:rows(states),optedIn:ids.length,recorded,unplaced,usCount,updatedAt:new Date().toISOString(),limited},
  {headers});
}
