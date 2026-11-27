import {NextRequest,NextResponse} from "next/server";
import {createHmac} from "node:crypto";
import {createClient as createPublicClient} from "@supabase/supabase-js";
import {createClient as createSessionClient} from "../../../../utils/supabase/server";
import {adminDb} from "../../../../lib/stripe-unlocked";
import {ADMIN_GATE_COOKIE,signAdminGate} from "../../../../lib/admin-security-gate";
export const runtime="nodejs";
export async function POST(request:NextRequest){
 const origin=request.headers.get("origin");
 if(origin&&origin!==request.nextUrl.origin)return NextResponse.json({error:"Invalid origin"},{status:403});
 const db=await createSessionClient(),{data:{user}}=await db.auth.getUser();
 if(!user||(user.app_metadata?.role!=="admin"&&user.app_metadata?.is_admin!==true))
  return NextResponse.json({error:"Administrator access required"},{status:403});
 const body=await request.json().catch(()=>null);
 const password=typeof body?.password==="string"?body.password:"";
 if(password.length<1||password.length>256)return NextResponse.json({error:"Enter your account password"},{status:400});
 const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!serviceKey||!user.email)return NextResponse.json({error:"Admin verification isn't configured."},{status:503});
 try{
  const addr=request.headers.get("x-real-ip")||request.headers.get("x-forwarded-for")?.split(",")[0]||"unknown";
  const identity=createHmac("sha256",serviceKey).update(user.id+":"+addr).digest("hex").slice(0,42);
  const {data:allowed,error:limitError}=await adminDb().rpc("claim_search_api_quota",{
   p_key:"admin-recheck:"+identity,p_max:6,p_window_seconds:900
  });
  if(limitError||!allowed)return NextResponse.json({error:"Too many attempts. Please wait before trying again."},{status:429});
  // Separate ephemeral client: never place a user password in app_metadata,
  // logs, localStorage or our database.
  const oneTime=createPublicClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:verified,error}=await oneTime.auth.signInWithPassword({email:user.email,password});
  if(error||verified.user?.id!==user.id)return NextResponse.json({error:"Password could not be verified."},{status:401});
  const response=NextResponse.json({verified:true},{headers:{"Cache-Control":"private, no-store"}});
  response.cookies.set(ADMIN_GATE_COOKIE,signAdminGate(user.id),{
   httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/admin",maxAge:600
  });
  return response;
 }catch{return NextResponse.json({error:"Admin verification temporarily unavailable."},{status:503})}
}
