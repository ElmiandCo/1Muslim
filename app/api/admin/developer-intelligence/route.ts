import {NextResponse} from "next/server";
import {createClient} from "../../../../utils/supabase/server";
import {createClient as serviceClient} from "@supabase/supabase-js";
import Stripe from "stripe";
export const dynamic="force-dynamic";
export async function GET(){
 const headers={"Cache-Control":"private, no-store"};
 try{
  const auth=await createClient();const {data:{user}}=await auth.auth.getUser();
  if(!user||user.email?.toLowerCase()!=="hudhudbyelmi@gmail.com")return NextResponse.json({error:"Forbidden"},{status:403,headers});
  const results:Record<string,unknown>={generatedAt:new Date().toISOString(),sources:{},metrics:{}};
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(url&&key){
   const db=serviceClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
   const start=Date.now();
   const ping=await db.from("profiles").select("id",{count:"exact",head:true});
   (results.sources as Record<string,unknown>).database={status:ping.error?"degraded":"healthy",latencyMs:Date.now()-start,error:ping.error?"Query unavailable":undefined};
   if(!ping.error)(results.metrics as Record<string,unknown>).profiles=ping.count;
   const since=new Date(Date.now()-30*86400000).toISOString();
   const recent=await db.from("profiles").select("id",{count:"exact",head:true}).gte("created_at",since);
   if(!recent.error)(results.metrics as Record<string,unknown>).newProfiles30d=recent.count;
   const incidents=await db.from("developer_incidents").select("id,created_at,source,severity,message,occurrences").order("created_at",{ascending:false}).limit(30);
   if(!incidents.error){results.incidents=incidents.data;(results.sources as Record<string,unknown>).incidentStore={status:"healthy"}}
   else (results.sources as Record<string,unknown>).incidentStore={status:"unconfigured"};
  }else (results.sources as Record<string,unknown>).database={status:"unconfigured"};
  if(process.env.STRIPE_SECRET_KEY){
   try{
    const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);
    const subscriptions=await stripe.subscriptions.list({status:"all",limit:100});
    const counts:Record<string,number>={};for(const s of subscriptions.data)counts[s.status]=(counts[s.status]||0)+1;
    (results.metrics as Record<string,unknown>).stripeSample={counts,partial:subscriptions.has_more,description:"First 100 subscriptions; not MRR or verified totals"};
    (results.sources as Record<string,unknown>).stripe={status:"healthy"};
   }catch{(results.sources as Record<string,unknown>).stripe={status:"degraded",error:"Stripe request failed"}}
  }else (results.sources as Record<string,unknown>).stripe={status:"unconfigured"};
  return NextResponse.json(results,{headers});
 }catch{return NextResponse.json({error:"Diagnostics unavailable"},{status:503,headers})}
}
