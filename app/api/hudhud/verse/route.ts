import {NextRequest,NextResponse} from "next/server";
export const runtime="nodejs";
const headers={"Cache-Control":"public, s-maxage=1800, stale-while-revalidate=3600"};
export async function GET(request:NextRequest){
 const key=request.nextUrl.searchParams.get("key")||"";
 if(!/^(?:[1-9]|[1-9]\d|1(?:0\d|1[0-4])):[1-9]\d{0,2}$/.test(key))return NextResponse.json({error:"Invalid verse reference"},{status:400});
 const [chapter,verse]=key.split(":").map(Number);
 if(chapter<1||chapter>114||verse<1||verse>286)return NextResponse.json({error:"Invalid reference"},{status:400});
 try{
  // These are verified texts from a Qur'an translation provider, not generated
  // by the assistant. Never invent missing Arabic or English to fill a card.
  const [arabic,english]=await Promise.all(
   ["ar.alafasy","en.asad"].map(async edition=>{
    const response=await fetch("https://api.alquran.cloud/v1/ayah/"+encodeURIComponent(key)+"/"+edition,{
     signal:AbortSignal.timeout(4800),next:{revalidate:86400}
    });
    if(!response.ok)throw Error("Qur'an source unavailable");
    const data=await response.json();
    if(data?.data?.surah?.number!==chapter||data?.data?.numberInSurah!==verse)throw Error("Incorrect verse");
    return String(data?.data?.text||"").trim();
   })
  );
  if(!arabic||!english)throw Error("Incomplete verse");
  return NextResponse.json({key,arabic,english,translation:"Muhammad Asad",source:"AlQuran Cloud"},{headers});
 }catch{return NextResponse.json({error:"Source text unavailable"},{status:503,headers:{"Cache-Control":"no-store"}})}
}
