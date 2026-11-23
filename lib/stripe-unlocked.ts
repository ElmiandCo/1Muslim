import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

/** Existing subscriber price; retain for webhook reconciliation. NEVER offer for new v3.9 checkouts. */
export const PRICE_ID = process.env.STRIPE_UNLOCKED_PRICE_ID || "";

export const UNLOCKED_PLAN_SPECS = {
 weekly: { amount: 599, interval: "week", count: 1, label: "weekly" },
 monthly: { amount: 999, interval: "month", count: 1, label: "monthly" },
 yearly: { amount: 3500, interval: "year", count: 1, label: "yearly" },
} as const;

export type UnlockedPlan = keyof typeof UNLOCKED_PLAN_SPECS;

export function unlockedPriceIds(): Record<UnlockedPlan, string> {
 return {
  weekly: process.env.STRIPE_UNLOCKED_WEEKLY_PRICE_ID || "",
  monthly: process.env.STRIPE_UNLOCKED_MONTHLY_PRICE_ID || "",
  yearly: process.env.STRIPE_UNLOCKED_YEARLY_PRICE_ID || "",
 };
}

/** V3.9 can deploy before the owner supplies Stripe Price IDs; new checkout waits safely. */
export function isUnlockedV39CheckoutConfigured(): boolean {
 const ids = Object.values(unlockedPriceIds());
 return ids.every(id => /^price_[A-Za-z0-9]+$/.test(id) && id !== PRICE_ID)
  && new Set(ids).size === ids.length;
}

export function isRecognizedUnlockedPriceId(priceId: string): boolean {
 return !!priceId && (priceId === PRICE_ID || Object.values(unlockedPriceIds()).includes(priceId));
}

export function isUnlockedPlan(value: string | null): value is UnlockedPlan {
 return value === "weekly" || value === "monthly" || value === "yearly";
}

export function stripe() { if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe key missing"); return new Stripe(process.env.STRIPE_SECRET_KEY); }
export function adminDb() {
 const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
 if (!url || !key) throw new Error("Supabase service credentials missing");
 return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
export async function authenticatedUser() {
 const { createClient } = await import("../utils/supabase/server");
 const db = await createClient(); const { data: { user }, error } = await db.auth.getUser();
 if (error || !user) return null; return user;
}
export function origin(req: Request) { const url = new URL(req.url); return url.origin; }
