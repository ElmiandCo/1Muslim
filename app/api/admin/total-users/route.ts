import {NextResponse} from "next/server";
import {createClient} from "../../../../utils/supabase/server";
import {createClient as createAdminClient} from "@supabase/supabase-js";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
 const db=await createClient();
 const {data:{user},error:authError}=await db.auth.getUser();
 if(authError||!user||user.email?.toLowerCase()!=="hudhudbyelmi@gmail.com")return NextResponse.json({error:"Unauthorized"},{status:403});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:"Service credentials not configured",code:"SERVICE_CONFIG_MISSING"},{status:503});
 const admin=createAdminClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 try{
  let total=0;
  for(let page=1;page<=1000;page++){
   const {data,error}=await admin.auth.admin.listUsers({page,perPage:1000});
   if(error)throw error;
   total+=data.users.length;
   if(data.users.length<1000)break;
   if(page===1000)throw Error("Pagination limit exceeded");
  }
  return NextResponse.json({totalUsers:total},{headers:{"Cache-Control":"private, no-store, max-age=0"}});
 }catch(error){console.error("Admin account count unavailable",error instanceof Error?error.message:"Unknown error");return NextResponse.json({error:"Supabase Auth account count unavailable",code:"AUTH_COUNT_FAILED"},{status:503,headers:{"Cache-Control":"no-store"}})}
}
