import {NextRequest,NextResponse} from "next/server";
import {createClient} from "../../../../utils/supabase/server";
import {createClient as adminClient} from "@supabase/supabase-js";
export const runtime="nodejs";export const dynamic="force-dynamic";
async function authorized(){const client=await createClient();const {data:{user}}=await client.auth.getUser();if(user?.email?.toLowerCase()!=="hudhudbyelmi@gmail.com")return null;const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;return url&&key?adminClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):null}
const fail=(message:string,status=400)=>NextResponse.json({error:message},{status});
const validId=(v:unknown):v is string=>typeof v==="string"&&/^UC[A-Za-z0-9_-]{22}$/.test(v);
export async function GET(){const db=await authorized();if(!db)return fail("Forbidden",403);const [channels,runs]=await Promise.all([db.from("deepwatch_discovery_channels").select("*").order("priority",{ascending:true}).order("created_at",{ascending:true}),db.from("deepwatch_discovery_runs").select("*").order("created_at",{ascending:false}).limit(12)]);if(channels.error||runs.error)return fail(channels.error?.message||runs.error?.message||"Database unavailable",500);return NextResponse.json({channels:channels.data,runs:runs.data},{headers:{"Cache-Control":"private, no-store"}})}
export async function POST(req:NextRequest){const db=await authorized();if(!db)return fail("Forbidden",403);const body=await req.json().catch(()=>null);if(!body)return fail("Invalid request");
if(body.action==="remove"||body.action==="priority"){
 const id=String(body.channel_id||"");if(!validId(id))return fail("Invalid channel");
 if(body.action==="remove"){const {error}=await db.from("deepwatch_discovery_channels").update({enabled:false}).eq("channel_id",id);if(error)return fail(error.message,500);return NextResponse.json({updated:true});}
 const priority=Number(body.priority);if(!Number.isInteger(priority)||priority<1||priority>100000)return fail("Invalid priority");
 const {error}=await db.from("deepwatch_discovery_channels").update({priority}).eq("channel_id",id).eq("enabled",true);if(error)return fail(error.message,500);return NextResponse.json({updated:true});
}
if(body.action==="add"){
 const raw=String(body.channel||"").trim();if(raw.length>250)return fail("Channel link too long");
 const token=process.env.YOUTUBE_API_KEY||process.env.YOUTUBE_DATA_API_KEY;if(!token)return fail("YOUTUBE_API_KEY is required on the server",503);
 let channelId=validId(raw)?raw:"";let handle="";
 try{const parsed=new URL(raw.startsWith("http")?raw:"https://www.youtube.com/"+raw.replace(/^@?/,"@"));if(!["youtube.com","www.youtube.com","m.youtube.com"].includes(parsed.hostname))return fail("Use a YouTube channel URL or @handle");const match=parsed.pathname.match(/^\/channel\/(UC[A-Za-z0-9_-]{22})\/?$/);if(match)channelId=match[1];else{const h=parsed.pathname.match(/^\/@([A-Za-z0-9._-]+)\/?$/);if(h)handle=h[1];else if(!channelId)return fail("Use a YouTube @handle or /channel/ID URL")}}catch{return fail("Invalid YouTube URL")}
 const params=new URLSearchParams({part:"snippet",key:token,...(channelId?{id:channelId}:{forHandle:handle})});
 const res=await fetch("https://www.googleapis.com/youtube/v3/channels?"+params,{cache:"no-store"});if(!res.ok)return fail("YouTube channel verification failed",502);
 const data=await res.json();const item=data.items?.[0];if(!item||!validId(item.id))return fail("YouTube channel not found",404);
 const {error}=await db.from("deepwatch_discovery_channels").upsert({channel_id:item.id,channel_title:String(item.snippet?.title||"YouTube channel").slice(0,200),channel_url:"https://www.youtube.com/channel/"+item.id,enabled:true},{onConflict:"channel_id"});
 if(error)return fail(error.message,500);return NextResponse.json({added:true,channel_id:item.id,title:item.snippet?.title});
}
if(body.action==="run"){
 const id=body.channel_id;if(!validId(id))return fail("Choose an approved channel");
 const {data:channel,error:lookupError}=await db.from("deepwatch_discovery_channels").select("channel_id").eq("channel_id",id).eq("enabled",true).maybeSingle();if(lookupError||!channel)return fail("Channel not approved",403);
 const token=process.env.GITHUB_WORKFLOW_TOKEN;if(!token)return fail("GITHUB_WORKFLOW_TOKEN not configured in Vercel environment",503);
 const {data:run,error}=await db.from("deepwatch_discovery_runs").insert({requested_channel_id:id,status:"queued"}).select("id").single();if(error||!run)return fail(error?.message||"Unable to queue",500);
 const response=await fetch("https://api.github.com/repos/ElmiandCo/1Muslim/actions/workflows/hourly-video-discovery.yml/dispatches",{method:"POST",headers:{Authorization:"Bearer "+token,Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28","Content-Type":"application/json"},body:JSON.stringify({ref:"main",inputs:{channel_id:id,run_id:run.id,quran_114:"false"}}),cache:"no-store"});
 if(!response.ok){await db.from("deepwatch_discovery_runs").update({status:"failure",message:"GitHub dispatch failed: "+response.status,finished_at:new Date().toISOString()}).eq("id",run.id);return fail("GitHub workflow dispatch failed ("+response.status+")",502)}
 return NextResponse.json({started:true,run_id:run.id,status:"queued"});
}
return fail("Unknown action")}
