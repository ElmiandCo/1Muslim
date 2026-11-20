import {NextResponse} from "next/server";
import {createClient} from "../../../../utils/supabase/server";
export async function POST(request:Request){
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({error:"Sign in required"},{status:401});
 const input=await request.json().catch(()=>({}));
 const videoId=typeof input.id==="string"?input.id:"";
 const title=typeof input.title==="string"?input.title:"TikTok video";
 const url=typeof input.url==="string"?input.url:"";
 if(!/^\d{8,30}$/.test(videoId)||!/^https:\/\/(www\.)?tiktok\.com\//.test(url))return NextResponse.json({error:"Invalid TikTok video"},{status:400});
 const {data,error}=await db.rpc("share_tiktok_to_ummah",{p_video_id:videoId,p_title:title,p_url:url});
 if(error)return NextResponse.json({error:"Could not share TikTok video. Check connection and try again."},{status:503});
 const row=Array.isArray(data)?data[0]:data;
 return NextResponse.json({postId:row?.post_id,alreadyShared:!!row?.already_shared});
}
