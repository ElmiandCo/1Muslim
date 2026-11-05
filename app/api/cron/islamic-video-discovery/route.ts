import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
export const runtime="nodejs";
export const maxDuration=60;
const categories=["Allah","The Arsh","Qur'an","Prophets","Miracles","Death","Afterlife","Judgment Day","Paradise","Hell","Women & Marriage","Apologetics","Dawah"];
const searches=["Islamic Quran tafsir authentic lecture","Islamic dawah short reminder","Islamic prophets stories","Islamic afterlife paradise judgment day","Islamic marriage women lecture"];
function classify(title:string,description:string){const text=(title+" "+description).toLowerCase();return categories.filter(c=>{const terms:Record<string,string[]>={
 "Allah":["allah","tawhid","tawheed"],"The Arsh":["arsh","throne"],"Qur'an":["quran","qur'an","surah","tafsir"],"Prophets":["prophet","nabi","musa","isa","muhammad"],"Miracles":["miracle"],"Death":["death","grave"],"Afterlife":["afterlife","akhirah"],"Judgment Day":["judgment","qiyamah"],"Paradise":["paradise","jannah"],"Hell":["hell","jahannam"],"Women & Marriage":["marriage","wife","women","husband"],"Apologetics":["apologetic","christianity","bible"],"Dawah":["dawah","da'wah","revert","shahada"]};return terms[c]?.some(t=>text.includes(t))})}
function seconds(iso:string){const m=iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);return m?Number(m[1]||0)*3600+Number(m[2]||0)*60+Number(m[3]||0):0}
export async function GET(request:NextRequest){
 const token=process.env.CRON_SECRET;
 if(!token||request.headers.get("authorization")!==`Bearer ${token}`)return NextResponse.json({error:"Unauthorized"},{status:401});
 const key=process.env.YOUTUBE_DATA_API_KEY,service=process.env.SUPABASE_SERVICE_ROLE_KEY,url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 if(!key||!service||!url)return NextResponse.json({error:"Bot A/B not configured: YOUTUBE_DATA_API_KEY and Supabase service credentials required"},{status:503});
 const db=createClient(url,service,{auth:{persistSession:false}});
 try{
  // Bot A: constrained discovery; search only one topic per run to conserve API quota.
  const topic=searches[Math.floor(Date.now()/86400000)%searches.length];
  const search=new URL("https://www.googleapis.com/youtube/v3/search");
  search.searchParams.set("part","snippet");search.searchParams.set("type","video");search.searchParams.set("videoEmbeddable","true");search.searchParams.set("maxResults","12");search.searchParams.set("order","date");search.searchParams.set("q",topic);search.searchParams.set("key",key);
  const res=await fetch(search,{cache:"no-store"});if(!res.ok)throw Error("YouTube search "+res.status);
  const items=(await res.json()).items||[];
  const ids=items.map((x:{id?:{videoId?:string}})=>x.id?.videoId).filter(Boolean).join(",");
  if(!ids)return NextResponse.json({topic,discovered:0,reviewed:0});
  const details=new URL("https://www.googleapis.com/youtube/v3/videos");details.searchParams.set("part","snippet,contentDetails,status,statistics");details.searchParams.set("id",ids);details.searchParams.set("key",key);
  const detailRes=await fetch(details,{cache:"no-store"});if(!detailRes.ok)throw Error("YouTube details "+detailRes.status);
  const videos=(await detailRes.json()).items||[];
  let discovered=0,reviewed=0;
  for(const v of videos){
   if(v.status?.embeddable!==true||v.status?.privacyStatus!=="public")continue;
   const duration=seconds(v.contentDetails?.duration||"");
   if(duration<20)continue;
   const snippet=v.snippet||{};const matched=classify(snippet.title||"",snippet.description||"");
   // Bot B: metadata-only conservative screening. Never auto-approve.
   const risky=/\b(hate|kill all|violence|graphic|extremist|terrorist)\b/i.test((snippet.title||"")+" "+(snippet.description||""));
   const bot_b_reason=risky?"Flagged for manual safety review":matched.length===0?"Topic uncertain; human review required":"Relevant topic candidate; human approval required";
   const row={video_id:v.id,title:snippet.title||"Untitled",channel_id:snippet.channelId||"",channel_title:snippet.channelTitle||"",description:(snippet.description||"").slice(0,4000),thumbnail_url:snippet.thumbnails?.high?.url||null,duration_seconds:duration,format:duration<=180?"short":"full",language:snippet.defaultAudioLanguage||snippet.defaultLanguage||null,published_at:snippet.publishedAt||null,view_count:Number(v.statistics?.viewCount||0),categories:matched,source_query:topic,status:"pending",bot_b_reason};
   const {data:existing}=await db.from("islamic_video_registry").select("video_id").eq("video_id",v.id).maybeSingle();
   if(existing)continue;
   const {error}=await db.from("islamic_video_registry").insert(row);
   if(!error){discovered++;reviewed++}
  }
  return NextResponse.json({bot_a:"completed",bot_b:"metadata-screened; awaiting admin approval",topic,discovered,reviewed});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Discovery failed"},{status:502})}
}
