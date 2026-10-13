import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import webpush from "web-push";
import {timingSafeEqual} from "node:crypto";
export const runtime="nodejs";
export async function POST(req:Request){
 const secret=process.env.PUSH_WEBHOOK_SECRET;const received=req.headers.get("x-push-webhook-secret")||"";
 if(!secret||Buffer.byteLength(secret)!==Buffer.byteLength(received)||!timingSafeEqual(Buffer.from(secret),Buffer.from(received)))return NextResponse.json({error:"Unauthorized"},{status:401});
 try{const body=await req.json();const row=body?.record;if(body?.type!=="INSERT"||!row?.recipient_id||!row?.id)return NextResponse.json({skipped:true});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 const pub=process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,priv=process.env.VAPID_PRIVATE_KEY,subject=process.env.VAPID_SUBJECT;
 if(!url||!key||!pub||!priv||!subject)return NextResponse.json({error:"Push environment missing"},{status:503});
 const db=createClient(url,key,{auth:{persistSession:false}});
 const {data,error}=await db.from("push_subscriptions").select("endpoint,subscription").eq("user_id",row.recipient_id).limit(25);if(error)throw error;
 webpush.setVapidDetails(subject,pub,priv);
 const message=JSON.stringify({title:String(row.title||"1Muslim").slice(0,120),body:"You have a new notification.",tag:String(row.id)});
 const results=await Promise.allSettled((data||[]).map(async entry=>{try{await webpush.sendNotification(entry.subscription,message,{TTL:3600})}catch(e){const status=(e as {statusCode?:number}).statusCode;if(status===404||status===410)await db.from("push_subscriptions").delete().eq("endpoint",entry.endpoint);else throw e}}));
 return NextResponse.json({sent:results.filter(r=>r.status==="fulfilled").length,failed:results.filter(r=>r.status==="rejected").length});
 }catch{return NextResponse.json({error:"Push dispatch failed"},{status:500})}
}
