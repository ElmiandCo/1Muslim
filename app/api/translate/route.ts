import { NextRequest, NextResponse } from "next/server";
export const runtime="nodejs";
const langs=["en","ar"];
export async function POST(req:NextRequest){
  try{
    const {texts,target}=await req.json();
    if(!langs.includes(target)||!Array.isArray(texts)||texts.length>30||texts.some((x:unknown)=>typeof x!=="string"||(x as string).length>2500))return NextResponse.json({error:"Invalid translation request"},{status:400});
    const endpoint=process.env.LIBRETRANSLATE_URL;
    if(!endpoint)return NextResponse.json({error:"Translation provider not configured"},{status:503});
    let url:URL;try{url=new URL(endpoint);if(url.protocol!=="https:"&&!(process.env.NODE_ENV!=="production"&&url.hostname==="localhost"))throw Error("HTTPS required")}catch{return NextResponse.json({error:"Translation provider configuration invalid"},{status:503})}
    const translations=[];
    for(const q of texts){
      const res=await fetch(url.toString().replace(/\/$/,"")+"/translate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({q,source:"auto",target,format:"text",api_key:process.env.LIBRETRANSLATE_API_KEY||undefined}),cache:"no-store",signal:AbortSignal.timeout(12000)});
      if(!res.ok)return NextResponse.json({error:"Translation provider error"},{status:502});
      const data=await res.json();translations.push(data.translatedText??q);
    }
    return NextResponse.json({translations},{headers:{"Cache-Control":"no-store"}});
  }catch{return NextResponse.json({error:"Translation failed"},{status:500})}
}