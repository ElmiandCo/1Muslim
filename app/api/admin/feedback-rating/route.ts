import {NextResponse} from "next/server";
import {createClient} from "../../../../utils/supabase/server";
import {createClient as serviceClient} from "@supabase/supabase-js";
export const runtime="nodejs";
export async function GET(){
 const db=await createClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user||user.email?.toLowerCase()!=="hudhudbyelmi@gmail.com")return NextResponse.json({error:"Unauthorized"},{status:403});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:"Analytics unavailable"},{status:503});
 const admin=serviceClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 let start=0,total=0,sum=0;
 for(;;){
  const {data,error}=await admin.from("dm_messages").select("body").ilike("body","%feedback%").range(start,start+999);
  if(error)return NextResponse.json({error:"Analytics unavailable"},{status:500});
  for(const row of data||[]){
   const body=String(row.body||"");
   if(!(/1Muslim Feedback:|1Muslim Live feedback|Live quality feedback/i.test(body)))continue;
   const match=body.match(/([1-5])\/5/);
   if(match){total++;sum+=Number(match[1])}
  }
  if(!data||data.length<1000)break;
  start+=1000;
 }
 return NextResponse.json({average:total?Number((sum/total).toFixed(2)):null,count:total},{headers:{"Cache-Control":"no-store"}});
}
