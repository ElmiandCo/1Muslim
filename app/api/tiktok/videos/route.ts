import { isTikTokVideoId, verifiedTikTokVideo } from "../../../../utils/tiktok/public-video";
import { hasTikTokImportScopes } from "../../../../utils/tiktok/oauth";
import { NextResponse } from "next/server";
import { createClient } from "../../../../utils/supabase/server";
import { createClient as adminClient } from "@supabase/supabase-js";
import { canUseTikTokReview } from "../../../../utils/tiktok/review-access";

export async function GET(request: Request) {
 const db=await createClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({error:"Sign in first"},{status:401});
 if(!canUseTikTokReview(user))return NextResponse.json({error:"TikTok connections are coming soon",available:false},{status:403,headers:{"Cache-Control":"private, no-store"}});
 const rawCursor = new URL(request.url).searchParams.get("cursor");
 const cursor = rawCursor === null ? undefined : Number(rawCursor);
 if (rawCursor !== null && (!/^\d+$/.test(rawCursor) || !Number.isSafeInteger(cursor))) {
  return NextResponse.json({error:"Invalid gallery cursor"},{status:400});
 }
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:"Connection storage unavailable"},{status:503});
 const admin=adminClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:connection,error}=await admin.from("tiktok_connections").select("access_token,refresh_token,expires_at").eq("user_id",user.id).maybeSingle();
 if(error)return NextResponse.json({error:"Unable to read TikTok connection"},{status:503});
 if(!connection)return NextResponse.json({connected:false,videos:[]});
 let access=connection.access_token;
 if(Date.parse(connection.expires_at)<Date.now()+60_000){
  if(!connection.refresh_token||!process.env.TIKTOK_CLIENT_KEY||!process.env.TIKTOK_CLIENT_SECRET)return NextResponse.json({connected:true,error:"Reconnect TikTok to renew access",videos:[]},{status:409});
  const form=new URLSearchParams({client_key:process.env.TIKTOK_CLIENT_KEY,client_secret:process.env.TIKTOK_CLIENT_SECRET,grant_type:"refresh_token",refresh_token:connection.refresh_token});
  const refresh=await fetch("https://open.tiktokapis.com/v2/oauth/token/",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:form,cache:"no-store",signal:AbortSignal.timeout(10000)}).catch(()=>null);
  const token=await refresh?.json().catch(()=>null);
  if(!refresh?.ok||!token?.access_token||!Number.isFinite(token.expires_in)||token.expires_in<=0)return NextResponse.json({connected:true,error:"TikTok session expired. Please reconnect.",videos:[]},{status:409});
  if (token.scope !== undefined && !hasTikTokImportScopes(token.scope)) {
   return NextResponse.json({error:"Reconnect TikTok and grant both import permissions."},{status:403});
  }
  access=token.access_token;
  const {data: renewed, error: renewalError} = await admin.from("tiktok_connections").update({access_token:access,refresh_token:token.refresh_token||connection.refresh_token,expires_at:new Date(Date.now()+Number(token.expires_in)*1000).toISOString()}).eq("user_id",user.id).eq("access_token",connection.access_token).select("user_id").maybeSingle();
  if (renewalError || !renewed) return NextResponse.json({error:"TikTok connection changed. Refresh your gallery."},{status:409});
 }
 const response=await fetch("https://open.tiktokapis.com/v2/video/list/?fields=id,title,video_description,cover_image_url,share_url,duration",{method:"POST",headers:{Authorization:"Bearer "+access,"Content-Type":"application/json"},body:JSON.stringify({max_count:20,cursor}),cache:"no-store",signal:AbortSignal.timeout(12000)}).catch(()=>null);
 const payload=await response?.json().catch(()=>null);
 if (response?.status === 401 || payload?.error?.code === "access_token_invalid") {
  return NextResponse.json({error:"TikTok authorization expired or was revoked. Reconnect TikTok."},{status:409});
 }
 if (payload?.error?.code === "scope_not_authorized") {
  return NextResponse.json({error:"Reconnect TikTok and grant video.list to view public videos."},{status:403});
 }
 if (!response?.ok || payload?.error?.code !== "ok") {
  return NextResponse.json({error:"TikTok could not load your gallery. Try again later."},{status:response?.status === 429 ? 429 : 502});
 }
 const records: Record<string, unknown>[] = Array.isArray(payload.data?.videos) ? payload.data.videos : [];
 const videos = records.flatMap(record => {
  const video = isTikTokVideoId(record?.id) && verifiedTikTokVideo(record, record.id);
  return video ? [{
   ...video,
   cover: typeof record.cover_image_url === "string" && record.cover_image_url.startsWith("https://") ? record.cover_image_url : "",
   embed: `https://www.tiktok.com/player/v1/${video.id}`,
   duration: typeof record.duration === "number" && record.duration > 0 ? Math.floor(record.duration) : 0,
  }] : [];
 });
 const next = payload.data?.cursor;
 const nextCursor = payload.data?.has_more && Number.isSafeInteger(next) && next >= 0 && next !== cursor ? next : null;
 return NextResponse.json({connected:true,videos,nextCursor},{headers:{"Cache-Control":"private, no-store"}});
}
