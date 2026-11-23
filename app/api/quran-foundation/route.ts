import {NextRequest,NextResponse} from "next/server";

export const runtime="nodejs";
type Token={value:string;expiresAt:number};
let cachedToken:Token|null=null;
const isProduction=()=>process.env.QF_ENV==="production";
const authBase=()=>isProduction()?"https://oauth2.quran.foundation":"https://prelive-oauth2.quran.foundation";
const apiBase=()=>isProduction()?"https://apis.quran.foundation":"https://apis-prelive.quran.foundation";
const allowed=new Set(["chapters","verse","verses"]);
async function token(force=false):Promise<string>{
 const id=process.env.QF_CLIENT_ID,secret=process.env.QF_CLIENT_SECRET;
 if(!id||!secret)throw new Error("Quran Foundation credentials not configured");
 if(!force&&cachedToken&&cachedToken.expiresAt>Date.now()+60000)return cachedToken.value;
 const scope=process.env.QF_CONTENT_SCOPE||"content.quran.read";
 const response=await fetch(authBase()+"/oauth2/token",{
  method:"POST",headers:{Authorization:"Basic "+Buffer.from(id+":"+secret).toString("base64"),"Content-Type":"application/x-www-form-urlencoded"},
  body:new URLSearchParams({grant_type:"client_credentials",scope}),cache:"no-store"
 });
 if(!response.ok)throw new Error("Quran Foundation authorization failed ("+response.status+")");
 const data=await response.json() as {access_token:string;expires_in?:number};
 if(!data.access_token)throw new Error("Quran Foundation token missing");
 cachedToken={value:data.access_token,expiresAt:Date.now()+(data.expires_in||3600)*1000};
 return data.access_token;
}
export async function GET(request:NextRequest){
 const url=new URL(request.url),kind=url.searchParams.get("resource")||"chapters";
 if(!allowed.has(kind))return NextResponse.json({error:"Unsupported resource"},{status:400});
 const chapter=Number(url.searchParams.get("chapter")||1),verse=Number(url.searchParams.get("verse")||1);
 if(!Number.isInteger(chapter)||chapter<1||chapter>114||!Number.isInteger(verse)||verse<1||verse>286)return NextResponse.json({error:"Invalid chapter or verse"},{status:400});
 if(!process.env.QF_CLIENT_ID||!process.env.QF_CLIENT_SECRET)return NextResponse.json({error:"Quran Foundation connection requires QF_CLIENT_ID and QF_CLIENT_SECRET on the server",configured:false},{status:503});
 const path=kind==="chapters"?"/chapters":kind==="verse"?"/verses/by_key/"+chapter+":"+verse:"/verses/by_chapter/"+chapter;
 const params=new URLSearchParams();
 if(kind==="verses"){params.set("page",String(Math.max(1,Math.min(1000,Number(url.searchParams.get("page"))||1))));params.set("per_page","50");}
 const endpoint=apiBase()+"/content/api/v4"+path+(params.size?"?"+params:"");
 try{
  const fetchContent=async(accessToken:string)=>fetch(endpoint,{headers:{"x-auth-token":accessToken,"x-client-id":process.env.QF_CLIENT_ID!},next:{revalidate:3600}});
  let response=await fetchContent(await token());
  if(response.status===401){cachedToken=null;response=await fetchContent(await token(true));}
  if(!response.ok)return NextResponse.json({error:"Quran Foundation content request failed",status:response.status},{status:response.status>=500?502:response.status});
  return NextResponse.json(await response.json(),{headers:{"Cache-Control":"public, s-maxage=3600, stale-while-revalidate=86400"}});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Quran Foundation unavailable"},{status:502});}
}
