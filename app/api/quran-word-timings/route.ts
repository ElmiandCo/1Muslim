import {NextRequest,NextResponse} from "next/server";

type Timing={index:number;start:number;end:number};
const reciters=new Set(["ar.alafasy","ar.abdurrahmaansudais","ar.husary"]);
export async function GET(request:NextRequest){
 const q=request.nextUrl.searchParams;
 const reciter=q.get("reciter")||"";
 const chapter=Number(q.get("chapter"));
 const verse=Number(q.get("verse"));
 if(!reciters.has(reciter)||!Number.isInteger(chapter)||chapter<1||chapter>114||!Number.isInteger(verse)||verse<1||verse>286){
  return NextResponse.json({timings:[],available:false},{status:400});
 }
 // Must refer to a manifest generated from and verified against the exact audio recording.
 const base=process.env.QURAN_WORD_TIMINGS_PUBLIC_BASE_URL;
 if(!base)return NextResponse.json({timings:[],available:false});
 try{
  const root=new URL(base.endsWith("/")?base:base+"/");
  if(root.protocol!=="https:")throw new Error("HTTPS required");
  const target=new URL(`${reciter}/${chapter}/${verse}.json`,root);
  const response=await fetch(target,{next:{revalidate:86400}});
  if(!response.ok)throw new Error("Unavailable");
  const data=await response.json() as {reciter?:string;chapter?:number;verse?:number;timings?:Timing[]};
  if(data.reciter!==reciter||data.chapter!==chapter||data.verse!==verse||!Array.isArray(data.timings)||data.timings.length>300)throw new Error("Mismatched manifest");
  const timings=data.timings;
  if(!timings.every((t,i)=>Number.isInteger(t.index)&&t.index===i&&Number.isFinite(t.start)&&Number.isFinite(t.end)&&t.start>=0&&t.end>t.start&&(i===0||t.start>=timings[i-1].start)))throw new Error("Invalid timings");
  return NextResponse.json({timings,available:timings.length>0});
 }catch{return NextResponse.json({timings:[],available:false})}
}
