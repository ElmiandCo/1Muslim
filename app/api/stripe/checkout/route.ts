import { NextResponse } from "next/server";
import {
 adminDb, authenticatedUser, stripe, origin, unlockedPriceIds,
 UNLOCKED_PLAN_SPECS, isUnlockedPlan, isUnlockedV39CheckoutConfigured,
} from "../../../../lib/stripe-unlocked";

export const runtime = "nodejs";

export async function POST(req: Request) {
 try {
  const user = await authenticatedUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const plan = new URL(req.url).searchParams.get("plan");
  if (!isUnlockedPlan(plan)) return NextResponse.json({ error: "Choose a weekly, monthly, or yearly plan." }, { status: 400 });

  // Do not interrupt the rest of v3.9 if Stripe IDs are supplied after the release.
  // Never fall back to the legacy $3.99 price or send a member to checkout at the wrong price.
  if (!isUnlockedV39CheckoutConfigured()) {
   return NextResponse.json({ error: "New membership checkout is being prepared. Please check back shortly." }, { status: 503 });
  }

  const db = adminDb();
  const { data: existing, error } = await db.from("unlocked_subscriptions")
   .select("stripe_customer_id,status").eq("user_id", user.id).maybeSingle();
  if (error) throw error;
  if (existing?.status === "active" || existing?.status === "trialing") {
   return NextResponse.json({ error: "Subscription already active" }, { status: 409 });
  }

  const priceId = unlockedPriceIds()[plan];
  const expected = UNLOCKED_PLAN_SPECS[plan];
  const s = stripe();
  const price = await s.prices.retrieve(priceId);
  if (!price.active || price.type !== "recurring" || price.unit_amount !== expected.amount
   || price.currency !== "usd" || price.recurring?.interval !== expected.interval
   || price.recurring?.interval_count !== expected.count) {
   console.error("Unlocked checkout price configuration mismatch", { plan, priceId });
   return NextResponse.json({ error: "This membership price is not ready yet. Please contact support." }, { status: 503 });
  }

  let customer = existing?.stripe_customer_id;
  if (!customer) {
   const created = await s.customers.create(
    { email: user.email, metadata: { supabase_user_id: user.id } },
    { idempotencyKey: "unlocked-customer-" + user.id },
   );
   customer = created.id;
  }

  const session = await s.checkout.sessions.create({
   mode: "subscription",
   customer,
   line_items: [{ price: priceId, quantity: 1 }],
   client_reference_id: user.id,
   subscription_data: { metadata: { supabase_user_id: user.id, unlocked_plan: plan } },
   success_url: origin(req) + "/unlocked?checkout=success&session_id={CHECKOUT_SESSION_ID}",
   cancel_url: origin(req) + "/unlocked?checkout=cancel",
   allow_promotion_codes: false,
  });
  return NextResponse.json({ url: session.url });
 } catch (e) {
  console.error("stripe checkout", e);
  const code = typeof e === "object" && e !== null && "code" in e ? String(e.code) : "";
  return NextResponse.json({
   error: code === "resource_missing"
    ? "Subscription pricing needs updating. Please contact support."
    : "Checkout is temporarily unavailable. Please try again.",
  }, { status: 500 });
 }
}
