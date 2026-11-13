import {NextRequest,NextResponse} from "next/server";
export async function POST(req:NextRequest){
 try{
  const body=await req.json();
  const latitude=Number(body.latitude),longitude=Number(body.longitude);
  if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180)return NextResponse.json({error:"Invalid coordinates"},{status:400});
  const url=new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
  url.searchParams.set("latitude",String(latitude));url.searchParams.set("longitude",String(longitude));url.searchParams.set("localityLanguage","en");
  const response=await fetch(url,{cache:"no-store",signal:AbortSignal.timeout(9000)});
  if(!response.ok)return NextResponse.json({error:"Geocoding unavailable"},{status:502});
  const data=await response.json();
  const state=(data.principalSubdivision||"").trim();
  const country=(data.countryName||"").trim();
  const city=(data.city||data.locality||"").trim();
  if(!state||!country)return NextResponse.json({error:"Incomplete location"},{status:422});
  return NextResponse.json({city,state,country},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Location lookup failed"},{status:502})}
}
