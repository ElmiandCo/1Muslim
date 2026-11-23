import {NextRequest,NextResponse} from "next/server";

export const runtime="nodejs";
export const dynamic="force-dynamic";

/**
 * City-centre coordinates for sun/moon rendering only.
 * Prayer times, location permissions and settings are handled by the existing
 * 1Muslim Prayer application. Never use or store device GPS here.
 */
const US_STATES=Object.fromEntries(("AL:Alabama,AK:Alaska,AZ:Arizona,AR:Arkansas,CA:California,CO:Colorado,CT:Connecticut,DE:Delaware,FL:Florida,GA:Georgia,HI:Hawaii,ID:Idaho,IL:Illinois,IN:Indiana,IA:Iowa,KS:Kansas,KY:Kentucky,LA:Louisiana,ME:Maine,MD:Maryland,MA:Massachusetts,MI:Michigan,MN:Minnesota,MS:Mississippi,MO:Missouri,MT:Montana,NE:Nebraska,NV:Nevada,NH:New Hampshire,NJ:New Jersey,NM:New Mexico,NY:New York,NC:North Carolina,ND:North Dakota,OH:Ohio,OK:Oklahoma,OR:Oregon,PA:Pennsylvania,RI:Rhode Island,SC:South Carolina,SD:South Dakota,TN:Tennessee,TX:Texas,UT:Utah,VT:Vermont,VA:Virginia,WA:Washington,WV:West Virginia,WI:Wisconsin,WY:Wyoming,DC:District of Columbia").split(",").map(s=>s.split(":"))) as Record<string,string>;
const aliases:Record<string,string>={"us":"united states","usa":"united states","united states of america":"united states","america":"united states","uk":"united kingdom","gb":"united kingdom","great britain":"united kingdom","uae":"united arab emirates","turkiye":"turkey","tr":"turkey"};
function normalize(value:string){
 return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();
}
function country(value:string){const valueKey=normalize(value);return aliases[valueKey]||valueKey}
function state(value:string){const key=value.trim().toUpperCase();return normalize(US_STATES[key]||value)}
type GeoRow={name:string;country:string;country_code?:string;admin1?:string;latitude:number;longitude:number;timezone?:string};
export async function GET(request:NextRequest){
 const params=request.nextUrl.searchParams;
 const city=(params.get("city")||"").trim(),region=(params.get("state")||"").trim(),countryValue=(params.get("country")||"").trim();
 if(!city||!countryValue||city.length>100||region.length>100||countryValue.length>100)
  return NextResponse.json({error:"Choose a valid saved prayer city."},{status:400,headers:{"Cache-Control":"no-store"}});
 const qs=new URLSearchParams({name:city,count:"40",language:"en",format:"json"});
 try{
  const response=await fetch("https://geocoding-api.open-meteo.com/v1/search?"+qs,{
   next:{revalidate:86400},signal:AbortSignal.timeout(6500)
  });
  if(!response.ok)throw Error("City coordinates unavailable");
  const payload=await response.json() as {results?:GeoRow[]};
  const places=(payload.results||[]).filter(point=>
   normalize(point.name)===normalize(city)&&
   (country(point.country)===country(countryValue)||country(point.country_code||"")===country(countryValue))&&
   Number.isFinite(point.latitude)&&Math.abs(point.latitude)<=90&&Number.isFinite(point.longitude)&&Math.abs(point.longitude)<=180);
  const byRegion=region?places.filter(point=>state(point.admin1||"")===state(region)):[];
  // Never pick an arbitrary homonymous town with no matching state.
  const verified=region&&byRegion.length===1?byRegion[0]:!region&&places.length===1?places[0]:region&&byRegion.length===0&&places.length===1?places[0]:null;
  if(!verified)return NextResponse.json({error:"City could not be uniquely matched to the saved region."},{status:404,headers:{"Cache-Control":"no-store"}});
  return NextResponse.json({latitude:verified.latitude,longitude:verified.longitude,timezone:verified.timezone||null,precision:"city-center"},
   {headers:{"Cache-Control":"private, max-age=3600"}});
 }catch{
  return NextResponse.json({error:"Local sky positions are temporarily unavailable."},{status:503,headers:{"Cache-Control":"no-store"}});
 }
}
