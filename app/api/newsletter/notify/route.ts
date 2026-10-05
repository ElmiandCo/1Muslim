import {NextResponse} from "next/server";
import {createClient} from "../../../utils/supabase/server";
import {createClient as createAdmin} from "@supabase/supabase-js";

export async function POST(req:Request){
 const s=await createClient();
 const {data:{user}}=await s.auth.getUser();
 if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const {data:ad}=await s.from("admin_users").select("user_id").eq("user_id",user.id).maybeSingle();
 if(!ad)return NextResponse.json({error:"Forbidden"},{status:403});
 const {article}=await req.json();
 if(!article?.id)return NextResponse.json({error:"Missing article"},{status:400});
 const {data:topic}=await s.from("newsletter_topics").select("id,name").eq("name",article.category).maybeSingle();
 if(!topic)return NextResponse.json({sent:0});
 const {data:subs}=await s.from("newsletter_subscriptions").select("user_id").eq("topic_id",topic.id);
 const ids=(subs??[]).map(x=>x.user_id);
 if(ids.length) await s.from("notifications").insert(ids.map(id=>({recipient_id:id,actor_id:user.id,type:"newsletter",title:"New 1Muslim newsletter",body:article.title,entity_type:"newsletter",entity_id:article.id,metadata:{url:"/newsletter/"+article.slug,category:article.category}})));
 let emailed=0;
 if(process.env.RESEND_API_KEY){
   const admin=createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);
   const {data:{users}}=await admin.auth.admin.listUsers({perPage:1000});
   const recipients=(users??[]).filter(u=>ids.includes(u.id)&&u.email).map(u=>u.email!);
   if(recipients.length){
     const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+process.env.RESEND_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({from:process.env.RESEND_FROM_EMAIL||"1Muslim <onboarding@resend.dev>",to:recipients,subject:"New 1Muslim newsletter: "+article.title,html:`<h1>${article.title}</h1><p>${article.excerpt||""}</p><p><a href="${process.env.NEXT_PUBLIC_SITE_URL||"https://1muslim.vercel.app"}/newsletter/${article.slug}">Read on 1Muslim</a></p>`})});
     if(r.ok)emailed=recipients.length;
   }
 }
 return NextResponse.json({sent:ids.length,emailed});
}