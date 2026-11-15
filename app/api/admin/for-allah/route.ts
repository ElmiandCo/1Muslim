import {NextRequest,NextResponse} from "next/server";
import {createClient} from "../../../../utils/supabase/server";
import {createClient as adminClient} from "@supabase/supabase-js";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
 const session=await createClient();
 const {data:{user}}=await session.auth.getUser();
 if(!user||user.email?.toLowerCase()!=="hudhudbyelmi@gmail.com")return NextResponse.json({error:"Forbidden"},{status:403});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:"Archive service unavailable"},{status:503});
 const db=adminClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const id=req.nextUrl.searchParams.get("id");
 if(id){
  if(!/^[a-f0-9-]{36}$/i.test(id))return NextResponse.json({error:"Invalid recording"},{status:400});
  const {data,error}=await db.from("for_allah_shahada_archive").select("storage_bucket,storage_path").eq("id",id).not("consented_at","is",null).not("approved_at","is",null).single();
  if(error||!data)return NextResponse.json({error:"Recording not authorized"},{status:404});
  const signed=await db.storage.from(data.storage_bucket).createSignedUrl(data.storage_path,90);
  if(signed.error||!signed.data?.signedUrl)return NextResponse.json({error:"Audio unavailable"},{status:404});
  return NextResponse.json({url:signed.data.signedUrl},{headers:{"Cache-Control":"no-store"}});
 }
 const {data,error,count}=await db.from("for_allah_shahada_archive").select("id,display_name,real_name,created_at,duration_seconds",{count:"exact"}).not("consented_at","is",null).not("approved_at","is",null).order("created_at",{ascending:false}).limit(250);
 if(error)return NextResponse.json({error:"Archive not initialized"},{status:503});
 return NextResponse.json({count:count||0,entries:data||[]},{headers:{"Cache-Control":"no-store"}});
}
