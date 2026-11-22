import { NextResponse } from "next/server";
import { createClient } from "../../../../utils/supabase/server";
import { createClient as adminClient } from "@supabase/supabase-js";
import { canUseTikTokReview } from "../../../../utils/tiktok/review-access";

export async function GET() {
 const db=await createClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({error:"Sign in first"},{status:401});
 if(!canUseTikTokReview(user))return NextResponse.json({error:"TikTok connections are coming soon",available:false},{status:403,headers:{"Cache-Control":"private, no-store"}});
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
  if(!refresh?.ok||!token?.access_token)return NextResponse.json({connected:true,error:"TikTok session expired. Please reconnect.",videos:[]},{status:409});
  access=token.access_token;
  await admin.from("tiktok_connections").update({access_token:access,refresh_token:token.refresh_token||connection.refresh_token,expires_at:new Date(Date.now()+Number(token.expires_in)*1000).toISOString()}).eq("user_id",user.id);
 }
 const response=await fetch("https://open.tiktokapis.com/v2/video/list/?fields=id,title,video_description,cover_image_url,share_url,embed_link,create_time,duration",{method:"POST",headers:{Authorization:"Bearer "+access,"Content-Type":"application/json"},body:JSON.stringify({max_count:20}),cache:"no-store",signal:AbortSignal.timeout(12000)}).catch(()=>null);
 const payload=await response?.json().catch(()=>null);
 if(!response?.ok||payload?.error?.code!=="ok")return NextResponse.json({connected:true,videos:[],error:payload?.error?.message||"Video access unavailable. Check TikTok Display API approval and video.list scope."},{status:502});
 const videos=(Array.isArray(payload?.data?.videos)?payload.data.videos:[]).map((v:Record<string,unknown>)=>({id:String(v.id||""),title:String(v.title||v.video_description||"TikTok video"),cover:String(v.cover_image_url||""),url:String(v.share_url||""),embed:String(v.embed_link||""),duration:Number(v.duration||0)})).filter((v:{id:string;url:string})=>/^\d+$/.test(v.id)&&/^https:\/\//.test(v.url));
 return NextResponse.json({connected:true,videos,hasMore:!!payload?.data?.has_more},{headers:{"Cache-Control":"private, no-store"}});
}
