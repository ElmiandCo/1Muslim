import Stripe from "stripe";
import {NextResponse} from "next/server";
import {adminDb,PRICE_ID,stripe} from "../../../../lib/stripe-unlocked";
export const runtime="nodejs";
export async function POST(req:Request) {
 const signature=req.headers.get("stripe-signature"), secret=process.env.STRIPE_WEBHOOK_SECRET;
 if(!signature||!secret)return NextResponse.json({error:"Webhook configuration missing"},{status:400});
 let event:Stripe.Event;
 try {event=stripe().webhooks.constructEvent(await req.text(),signature,secret);}catch{return NextResponse.json({error:"Invalid signature"},{status:400});}
 try {
 const db=adminDb(), s=stripe();
 if(event.type==="checkout.session.completed"){
  const session=event.data.object as Stripe.Checkout.Session;
  if(session.mode==="subscription"&&session.subscription&&session.client_reference_id){
   const sub=await s.subscriptions.retrieve(String(session.subscription));
   await sync(sub,session.client_reference_id,String(session.customer),db);
  }
 }
 if(["customer.subscription.created","customer.subscription.updated","customer.subscription.deleted"].includes(event.type)){
  const sub=event.data.object as Stripe.Subscription;
  let userId=sub.metadata.supabase_user_id;
  if(!userId){const {data}=await db.from("unlocked_subscriptions").select("user_id").eq("stripe_subscription_id",sub.id).maybeSingle();userId=data?.user_id;}
  if(userId)await sync(sub,userId,String(sub.customer),db);
 }
 if(event.type==="invoice.paid"||event.type==="invoice.payment_failed"){
  const invoice=event.data.object as Stripe.Invoice;
  const customerId=typeof invoice.customer==="string"?invoice.customer:invoice.customer?.id;
  if(customerId){const {data}=await db.from("unlocked_subscriptions").select("stripe_subscription_id").eq("stripe_customer_id",customerId).maybeSingle();
   if(data?.stripe_subscription_id){const sub=await s.subscriptions.retrieve(data.stripe_subscription_id);const userId=sub.metadata.supabase_user_id;if(userId)await sync(sub,userId,customerId,db);}
  }
 }
 return NextResponse.json({received:true});
 }catch(e){console.error("stripe webhook processing failed",event.id,e);return NextResponse.json({error:"Retry webhook"},{status:500});}
}
async function sync(sub:Stripe.Subscription,userId:string,customerId:string,db:ReturnType<typeof adminDb>){
 if(!sub.items.data.some(item=>item.price.id===PRICE_ID))return;
 const {data:previous}=await db.from("unlocked_subscriptions").select("trial_used").eq("user_id",userId).maybeSingle();
 const {error}=await db.from("unlocked_subscriptions").upsert({user_id:userId,trial_used:Boolean(previous?.trial_used)||sub.trial_start!=null,stripe_customer_id:customerId,stripe_subscription_id:sub.id,stripe_price_id:PRICE_ID,status:sub.status,cancel_at_period_end:sub.cancel_at_period_end,updated_at:new Date().toISOString()},{onConflict:"user_id"});
 if(error)throw error;
}
