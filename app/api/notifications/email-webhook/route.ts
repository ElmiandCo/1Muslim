import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
// Called by a Supabase Database Webhook on INSERT into public.notifications.
// Never expose the secret or service-role key to the browser.
export async function POST(req:NextRequest) {
 const secret=process.env.NOTIFICATION_WEBHOOK_SECRET;
 if(!secret||req.headers.get("x-notification-secret")!==secret)return NextResponse.json({error:"Unauthorized"},{status:401});
 const resendKey=process.env.RESEND_API_KEY;
 const from=process.env.RESEND_FROM_EMAIL;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!resendKey||!from||!url||!key)return NextResponse.json({error:"Email delivery not configured"},{status:503});
 let payload:{type?:string;record?:{id?:string;recipient_id?:string;type?:string;entity_type?:string;entity_id?:string;title?:string}};
 try{payload=await req.json()}catch{return NextResponse.json({error:"Invalid payload"},{status:400})}
 const record=payload.record;
 if(payload.type!=="INSERT"||!record?.id||!record.recipient_id||!["dm_message","dm_reply","featured_comment_reply","featured_comment","post_comment","recording_comment","xp_tier"].includes(record.type??""))return NextResponse.json({ignored:true});
 const admin=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
 const {data:notification}=await admin.from("notifications").select("id,recipient_id,type,title,entity_type,entity_id").eq("id",record.id).eq("recipient_id",record.recipient_id).maybeSingle();
 if(!notification)return NextResponse.json({error:"Notification not found"},{status:404});
 const {data:userData,error:userError}=await admin.auth.admin.getUserById(notification.recipient_id);
 if(userError||!userData.user?.email)return NextResponse.json({ignored:true});
 const preferenceKey=notification.type==="dm_message"?"email_messages":notification.type==="dm_reply"?"email_replies":notification.type==="xp_tier"?"email_xp":"email_comments";
 const {data:preferences}=await admin.from("notification_preferences").select("email_messages,email_replies,email_comments,email_xp").eq("user_id",notification.recipient_id).maybeSingle();
 if(preferences&&preferences[preferenceKey as keyof typeof preferences]===false)return NextResponse.json({ignored:true,reason:"User disabled email category"});
 const id=notification.entity_id??"";
 const base=(process.env.NEXT_PUBLIC_SITE_URL||"https://1muslim.vercel.app").replace(/\/$/,"");
 const path=notification.entity_type==="dm_message"?"/messages?message="+encodeURIComponent(id):notification.entity_type==="featured_video_comment"?"/?comment="+encodeURIComponent(id)+"#featured-video-comments":notification.entity_type==="xp_tier"?"/notifications":"/notifications";
 const title=notification.title||"You have a new notification";
 // Idempotency key prevents duplicate email if the webhook retries.
 const response=await fetch("https://api.resend.com/emails",{
  method:"POST",headers:{"Authorization":"Bearer "+resendKey,"Content-Type":"application/json","Idempotency-Key":"1muslim-reply-"+notification.id},
  body:JSON.stringify({from,to:[userData.user.email],subject:"1Muslim · "+title,text:title+"\n\nOpen your reply: "+base+path+"\n\nYou received this because someone replied to you on 1Muslim."})
 });
 if(!response.ok)return NextResponse.json({error:"Email provider rejected delivery"},{status:502});
 return NextResponse.json({ok:true});
}
