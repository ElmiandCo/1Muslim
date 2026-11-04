import {NextResponse} from "next/server";
import {createClient as sessionClient} from "../../../../utils/supabase/server";
import {createClient} from "@supabase/supabase-js";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
 const session=await sessionClient();
 const {data:{user}}=await session.auth.getUser();
 if(!user||user.email?.toLowerCase()!=="hudhudbyelmi@gmail.com")return NextResponse.json({error:"Unauthorized"},{status:403});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:"Analytics unavailable"},{status:503});
 const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await admin.auth.admin.listUsers({page:1,perPage:1});
 if(error)return NextResponse.json({error:"Unable to load account count"},{status:503});
 // Auth Admin pagination includes the total across all pages.
 const total=data?.total;
 if(typeof total!=="number")return NextResponse.json({error:"Count unavailable"},{status:503});
 return NextResponse.json({total},{headers:{"Cache-Control":"private, no-store"}});
}
