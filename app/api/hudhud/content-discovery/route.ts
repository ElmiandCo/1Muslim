import {NextRequest,NextResponse} from "next/server";
import {createClient} from "../../../../utils/supabase/server";
export const runtime="nodejs";
const searches=["Islam Quran recitation short","Muslim Christian respectful debate Islam","Islamic reminder mercy kindness","Muslim converts inspiring story"];
const blocked=/\b(hate|kill|terror|violence|insult|humiliate|destroy|attack|graphic|explicit)\b/i;
const relevant=/\b(islam|muslim|quran|qur'an|allah|prophet|sunnah|hadith|shahada|mosque|dawah)\b/i;
async function admin(){const db=await createClient();const {data:{user}}=await db.auth.getUser();if(!user)return {db,ok:false};const {data}=await db.rpc("is_1muslim_admin");return {db,ok:data===true};}
export async function GET(){
 const {db,ok}=await admin();if(!ok)return NextResponse.json({error:"Admin only"},{status:403});
 const {data,error}=await db.from("hudhud_video_candidates").select("*").order("discovered_at",{ascending:false}).limit(100);
 return error?NextResponse.json({error:error.message},{status:503}):NextResponse.json({candidates:data},{headers:{"Cache-Control":"no-store"}});
}
export async function POST(request:NextRequest){
 const {db,ok}=await admin();if(!ok)return NextResponse.json({error:"Admin only"},{status:403});
 const input=await request.json().catch(()=>({}));
 if(input.action==="review"){
  if(!["approved","rejected"].includes(input.status)||typeof input.id!=="string")return NextResponse.json({error:"Invalid review"},{status:400});
  const {data:{user}}=await db.auth.getUser();
  const {error}=await db.from("hudhud_video_candidates").update({review_status:input.status,reviewed_at:new Date().toISOString(),reviewed_by:user!.id}).eq("id",input.id);
  return error?NextResponse.json({error:error.message},{status:503}):NextResponse.json({ok:true});
 }
 if(input.action!=="discover")return NextResponse.json({error:"Invalid action"},{status:400});
 const key=process.env.YOUTUBE_DATA_API_KEY;
 if(!key)return NextResponse.json({error:"Set YOUTUBE_DATA_API_KEY in Vercel preview environment to enable discovery."},{status:503});
 const found:Record<string,unknown>[]=[];
 for(const q of searches){
  const url=new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part","snippet");url.searchParams.set("type","video");url.searchParams.set("videoDuration","short");url.searchParams.set("safeSearch","strict");url.searchParams.set("maxResults","8");url.searchParams.set("order","relevance");url.searchParams.set("q",q);url.searchParams.set("key",key);
  const response=await fetch(url.toString(),{cache:"no-store"});
  if(!response.ok)return NextResponse.json({error:"YouTube discovery request failed",status:response.status},{status:502});
  const result=await response.json();
  for(const item of result.items||[]){
   const id=item.id?.videoId;const s=item.snippet;if(!id||!s)continue;
   const combined=String(s.title||"")+" "+String(s.description||"");
   if(!relevant.test(combined)||blocked.test(combined))continue;
   found.push({provider:"youtube",provider_video_id:id,title:String(s.title).slice(0,300),creator:String(s.channelTitle||"").slice(0,200),description:String(s.description||"").slice(0,2000),thumbnail_url:s.thumbnails?.high?.url||s.thumbnails?.default?.url||null,source_url:"https://www.youtube.com/watch?v="+encodeURIComponent(id),category:q,review_status:"pending",rights_status:"embed_only"});
  }
 }
 let inserted=0;
 for(const item of found){
  const {error}=await db.from("hudhud_video_candidates").upsert(item,{onConflict:"provider,provider_video_id",ignoreDuplicates:true});
  if(!error)inserted++;
 }
 return NextResponse.json({discovered:found.length,processed:inserted,note:"Candidates require manual review. No video was downloaded or clipped."});
}
