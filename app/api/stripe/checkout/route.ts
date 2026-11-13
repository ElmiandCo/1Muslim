import {NextResponse} from "next/server";
import {adminDb,authenticatedUser,PRICE_ID,stripe,origin} from "../../../../lib/stripe-unlocked";
export const runtime="nodejs";
export async function POST(req:Request) {
 try {
 const user=await authenticatedUser(); if(!user) return NextResponse.json({error:"Sign in required"},{status:401});
 const db=adminDb(); const {data:existing,error}=await db.from("unlocked_subscriptions").select("stripe_customer_id,status").eq("user_id",user.id).maybeSingle();
 if(error) throw error;
 if(existing?.status==="active"||existing?.status==="trialing") return NextResponse.json({error:"Subscription already active"},{status:409});
 if(!PRICE_ID) return NextResponse.json({error:"Subscription pricing is not configured yet. Please contact support."},{status:503});
 const s=stripe(); const price=await s.prices.retrieve(PRICE_ID); if(!price.active||price.type!=="recurring"||price.unit_amount!==399||price.currency!=="usd"||price.recurring?.interval!=="month"||price.recurring?.interval_count!==1) return NextResponse.json({error:"Checkout price mismatch: expected $3.99 per month. Contact support before subscribing."},{status:503}); let customer=existing?.stripe_customer_id;
 if(!customer) {const created=await s.customers.create({email:user.email,metadata:{supabase_user_id:user.id}},{idempotencyKey:"unlocked-customer-"+user.id});customer=created.id;}
 const session=await s.checkout.sessions.create({mode:"subscription",customer,line_items:[{price:PRICE_ID,quantity:1}],client_reference_id:user.id,subscription_data:{metadata:{supabase_user_id:user.id}},success_url:origin(req)+"/unlocked?checkout=success&session_id={CHECKOUT_SESSION_ID}",cancel_url:origin(req)+"/unlocked?checkout=cancel",allow_promotion_codes:false});
 return NextResponse.json({url:session.url});
 }catch(e){console.error("stripe checkout",e);const code=typeof e==="object"&&e!==null&&"code" in e?String(e.code):"";return NextResponse.json({error:code==="resource_missing"?"Subscription pricing needs updating. Please contact support.":"Checkout is temporarily unavailable. Please try again."},{status:500});}
}
