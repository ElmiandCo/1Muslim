import { NextResponse } from "next/server";
import { isUnlockedV39CheckoutConfigured } from "../../../../lib/stripe-unlocked";

export const runtime = "nodejs";

export async function GET() {
 // This endpoint reports readiness only; it never exposes secret keys or Stripe price IDs.
 const configured = isUnlockedV39CheckoutConfigured()
  && !!process.env.STRIPE_SECRET_KEY
  && !!process.env.STRIPE_WEBHOOK_SECRET
  && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

 return NextResponse.json(
  { configured, plans: { weekly: 599, monthly: 999, yearly: 3500 }, currency: "usd" },
  { headers: { "Cache-Control": "private, no-store, max-age=0" } },
 );
}
