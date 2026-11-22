import {NextRequest,NextResponse} from "next/server";

export const runtime = "nodejs";

const METHODS = new Set(["2","3","4","5"]);
const PRAYERS = ["Fajr","Sunrise","Dhuhr","Asr","Maghrib","Isha"] as const;
type PrayerName = (typeof PRAYERS)[number];
type ParsedSchedule = {date:string;timezone:string;times:Record<PrayerName,string>};

function validDate(value:string) {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
 const parsed=new Date(value+"T12:00:00Z");
 return !Number.isNaN(parsed.getTime())&&parsed.toISOString().slice(0,10)===value
  && Math.abs(Date.now()-parsed.getTime())<4*86400000;
}
function normalize(value:string){return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();}
function countryName(value:string) {
 const name=normalize(value);
 return ["usa","us","united states of america"].includes(name)?"united states":
  ["uk","gb","great britain"].includes(name)?"united kingdom":name;
}
function parseSchedule(body:unknown,date:string):ParsedSchedule|null {
 if(!body||typeof body!=="object")return null;
 const payload=body as {code?:number;data?:{timings?:Record<string,string>;meta?:{timezone?:string}}};
 const times=payload.data?.timings, timezone=payload.data?.meta?.timezone;
 if(payload.code!==200||!times||typeof timezone!=="string"||!timezone)return null;
 try{new Intl.DateTimeFormat("en-US",{timeZone:timezone})}catch{return null}
 const result={} as Record<PrayerName,string>;
 for(const prayer of PRAYERS){
  const match=/^(\d{1,2}):(\d{2})/.exec(String(times[prayer]||""));
  if(!match||+match[1]>23||+match[2]>59)return null;
  result[prayer]=match[1].padStart(2,"0")+":"+match[2];
 }
 return {date,timezone,times:result};
}
async function readProvider(url:string,date:string) {
 const response=await fetch(url,{next:{revalidate:3600},signal:AbortSignal.timeout(7500)});
 if(!response.ok)return null;
 const body=await response.json();
 return parseSchedule(body,date);
}
async function fromCity(date:string,params:URLSearchParams) {
 const [year,month,day]=date.split("-");
 const apiDate=day+"-"+month+"-"+year;
 return readProvider("https://api.aladhan.com/v1/timingsByCity/"+apiDate+"?"+params,date);
}
async function fromMonthlyCalendar(date:string,params:URLSearchParams) {
 const [year,month,day]=date.split("-");
 const response=await fetch("https://api.aladhan.com/v1/calendarByCity/"+year+"/"+Number(month)+"?"+params,{
  next:{revalidate:3600},signal:AbortSignal.timeout(7500)
 });
 if(!response.ok)return null;
 const body=await response.json() as {code?:number;data?:unknown[]};
 if(body.code!==200||!Array.isArray(body.data))return null;
 return parseSchedule({code:200,data:body.data[Number(day)-1]},date);
}
async function fromCoordinates(date:string,params:URLSearchParams,city:string,state:string,country:string) {
 // The coordinate endpoint avoids intermittent AlAdhan byCity geocoding failures.
 // Resolve only a matching city and country; never silently choose an ambiguous city.
 const query=new URLSearchParams({name:city,count:"30",language:"en",format:"json"});
 const geoResponse=await fetch("https://geocoding-api.open-meteo.com/v1/search?"+query,{
  next:{revalidate:86400},signal:AbortSignal.timeout(6500)
 });
 if(!geoResponse.ok)return null;
 const geo=await geoResponse.json() as {results?:Array<{name:string;country:string;country_code?:string;admin1?:string;latitude:number;longitude:number}>};
 const candidates=(geo.results||[]).filter(point=>
  normalize(point.name)===normalize(city)&&
  (countryName(point.country)===countryName(country)||countryName(point.country_code||"")===countryName(country))&&
  Number.isFinite(point.latitude)&&Number.isFinite(point.longitude));
 const byState=state?candidates.filter(point=>normalize(point.admin1||"")===normalize(state)):candidates;
 const match=byState.length===1?byState[0]:candidates.length===1?candidates[0]:null;
 if(!match)return null;
 const p=new URLSearchParams({latitude:String(match.latitude),longitude:String(match.longitude),method:params.get("method")||"2",school:"0"});
 const [year,month,day]=date.split("-");
 return readProvider("https://api.aladhan.com/v1/timings/"+day+"-"+month+"-"+year+"?"+p,date);
}

export async function GET(request:NextRequest) {
 const params=request.nextUrl.searchParams;
 const city=(params.get("city")||"").trim();
 const state=(params.get("state")||"").trim();
 const country=(params.get("country")||"").trim();
 const method=params.get("method")||"2";
 const date=params.get("date")||"";
 if(!city||!country||city.length>100||state.length>100||country.length>100||!METHODS.has(method)||!validDate(date)){
  return NextResponse.json({error:"Enter a valid prayer city, country, method and date."},{status:400});
 }
 const providerParams=new URLSearchParams({city,country,method,school:"0"});
 if(state)providerParams.set("state",state);
 let schedule:ParsedSchedule|null=null;
 try{schedule=await fromCity(date,providerParams)}catch{/* Try the monthly endpoint. */}
 if(!schedule)try{schedule=await fromMonthlyCalendar(date,providerParams)}catch{/* Try coordinates. */}
 if(!schedule)try{schedule=await fromCoordinates(date,providerParams,city,state,country)}catch{/* No verified schedule. */}
 if(!schedule)return NextResponse.json({error:"Prayer times could not be retrieved. Please retry."},{status:503,headers:{"Cache-Control":"no-store"}});
 return NextResponse.json(schedule,{headers:{"Cache-Control":"public, s-maxage=900, stale-while-revalidate=3600"}});
}
