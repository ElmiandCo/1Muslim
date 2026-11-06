import {NextResponse} from "next/server";
export const runtime="nodejs";
export async function POST(request:Request){
 try{
  const raw=await request.text();
  if(raw.length>10000)return NextResponse.json({ok:false},{status:413});
  const data=JSON.parse(raw);
  const safe=(value:unknown,max:number)=>typeof value==="string"?value.slice(0,max):"";
  const streamId=safe(data.streamId,40);
  if(!/^[a-f0-9-]{36}$/i.test(streamId))return NextResponse.json({ok:false},{status:400});
  console.error("LIVE_VIEWER_CLIENT_EXCEPTION",JSON.stringify({streamId,section:safe(data.section,32),message:safe(data.message,400),stack:safe(data.stack,2000),componentStack:safe(data.componentStack,2000)}));
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({ok:false},{status:400});}
}
