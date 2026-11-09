import {NextRequest,NextResponse} from "next/server";
export const dynamic="force-dynamic";
/** Word timing feed: VIDEO_WORD_CAPTIONS_JSON maps YouTube IDs to [{word,start,end}]. */
export async function GET(request:NextRequest){
 const videoId=request.nextUrl.searchParams.get("videoId")??"";
 if(!/^[a-zA-Z0-9_-]{11}$/.test(videoId))return NextResponse.json({words:[]},{status:400});
 let source:Record<string,unknown>={};
 try{source=JSON.parse(process.env.VIDEO_WORD_CAPTIONS_JSON??"{}")}catch{}
 const raw=source[videoId];
 const words=Array.isArray(raw)?raw.filter(w=>typeof w?.word==="string"&&Number.isFinite(w.start)&&Number.isFinite(w.end)&&w.end>w.start).slice(0,20000):[];
 return NextResponse.json({videoId,words,available:words.length>0},{headers:{"Cache-Control":"no-store"}});
}
