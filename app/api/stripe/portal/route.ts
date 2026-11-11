import {NextResponse} from "next/server";
import {adminDb,authenticatedUser,stripe,origin} from "../../../../lib/stripe-unlocked";
export const runtime="nodejs";
export async function POST(req:Request) {
 try {const user=await authenticatedUser();if(!user)return NextResponse.json({error:"Sign in required"},{status:401});
 const {data,error}=await adminDb().from("unlocked_subscriptions").select("stripe_customer_id").eq("user_id",user.id).maybeSingle();
 if(error||!data?.stripe_customer_id)return NextResponse.json({error:"No billing account"},{status:404});
 const session=await stripe().billingPortal.sessions.create({customer:data.stripe_customer_id,return_url:origin(req)+"/unlocked"});
 return NextResponse.json({url:session.url});
 }catch(e){console.error("billing portal",e);return NextResponse.json({error:"Billing portal unavailable"},{status:500});}
}
