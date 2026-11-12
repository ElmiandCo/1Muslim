import {NextResponse} from "next/server";
import {adminDb,authenticatedUser,PRICE_ID,stripe,origin} from "../../../../lib/stripe-unlocked";
export const runtime="nodejs";
export async function POST(req:Request) {
 try {
 const user=await authenticatedUser(); if(!user) return NextResponse.json({error:"Sign in required"},{status:401});
 const db=adminDb(); const {data:existing,error}=await db.from("unlocked_subscriptions").select("stripe_customer_id,status,trial_used").eq("user_id",user.id).maybeSingle();
 if(error) throw error;
 if(existing?.status==="active"||existing?.status==="trialing") return NextResponse.json({error:"Subscription already active"},{status:409});
 const s=stripe(); let customer=existing?.stripe_customer_id;
 if(!customer) {const created=await s.customers.create({email:user.email,metadata:{supabase_user_id:user.id}},{idempotencyKey:"unlocked-customer-"+user.id});customer=created.id;}
 const prior=await s.subscriptions.list({customer,limit:100,status:"all"});const hadTrial=Boolean(existing?.trial_used)||prior.data.some(sub=>sub.trial_start!=null)||prior.data.some(sub=>sub.status==="trialing");const hasPaid=prior.data.some(sub=>["active","trialing","past_due","unpaid","incomplete"].includes(sub.status));if(hasPaid)return NextResponse.json({error:"An existing subscription must be managed before starting another."},{status:409});
 const session=await s.checkout.sessions.create({mode:"subscription",customer,line_items:[{price:PRICE_ID,quantity:1}],client_reference_id:user.id,subscription_data:{metadata:{supabase_user_id:user.id},...(hadTrial?{}:{trial_period_days:7})},payment_method_collection:"always",success_url:origin(req)+"/unlocked?checkout=success",cancel_url:origin(req)+"/unlocked?checkout=cancel",allow_promotion_codes:false});
 return NextResponse.json({url:session.url});
 }catch(e){console.error("stripe checkout",e);return NextResponse.json({error:"Checkout unavailable"},{status:500});}
}
