import {NextRequest,NextResponse} from "next/server";
import {createClient} from "../../../../utils/supabase/server";
import {createClient as serviceClient} from "@supabase/supabase-js";
export async function POST(req:NextRequest){
 const auth=await createClient();const {data:{user}}=await auth.auth.getUser();
 if(user?.email?.toLowerCase()!=="hudhudbyelmi@gmail.com")return NextResponse.json({error:"Forbidden"},{status:403});
 const body=await req.json().catch(()=>null);
 const source=typeof body?.source==="string"?body.source.slice(0,80):"";
 const message=typeof body?.message==="string"?body.message.slice(0,500):"";
 if(!source||!message||message.includes("@")||/bearer\s|sk_live_|eyJ[A-Za-z0-9_-]{30}/i.test(message))return NextResponse.json({error:"Invalid or sensitive incident"},{status:400});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:"Incident storage unavailable"},{status:503});
 const db=serviceClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {error}=await db.from("developer_incidents").insert({source,message,severity:"error"});
 return error?NextResponse.json({error:"Incident storage unavailable"},{status:503}):NextResponse.json({ok:true});
}
