import {NextResponse} from "next/server";
import {createClient} from "../../../../utils/supabase/server";
import {createClient as adminClient} from "@supabase/supabase-js";
export const runtime="nodejs";
function admin(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw Error("Push service is not configured");return adminClient(url,key,{auth:{persistSession:false}})}
export async function POST(req:Request){
 try{const db=await createClient();const {data:{user}}=await db.auth.getUser();if(!user)return NextResponse.json({error:"Sign in required"},{status:401});
 const {subscription}=await req.json();if(typeof subscription?.endpoint!=="string"||!subscription.endpoint.startsWith("https://")||subscription.endpoint.length>2048||typeof subscription?.keys?.p256dh!=="string"||typeof subscription?.keys?.auth!=="string")return NextResponse.json({error:"Invalid subscription"},{status:400});
 const {error}=await admin().from("push_subscriptions").upsert({user_id:user.id,endpoint:subscription.endpoint,subscription},{onConflict:"endpoint"});if(error)throw error;return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"Push subscription unavailable"},{status:503})}
}
export async function DELETE(req:Request){
 try{const db=await createClient();const {data:{user}}=await db.auth.getUser();if(!user)return NextResponse.json({error:"Sign in required"},{status:401});
 const {endpoint}=await req.json();if(typeof endpoint!=="string")return NextResponse.json({error:"Invalid endpoint"},{status:400});
 const {error}=await admin().from("push_subscriptions").delete().eq("user_id",user.id).eq("endpoint",endpoint);if(error)throw error;return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"Could not unsubscribe"},{status:503})}
}
