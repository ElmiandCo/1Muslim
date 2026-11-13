import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
export const PRICE_ID = process.env.STRIPE_UNLOCKED_PRICE_ID || "";
export function stripe() { if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe key missing"); return new Stripe(process.env.STRIPE_SECRET_KEY); }
export function adminDb() {
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key) throw new Error("Supabase service credentials missing");
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
export async function authenticatedUser() {
 const {createClient}=await import("../utils/supabase/server");
 const db=await createClient(); const {data:{user},error}=await db.auth.getUser();
 if(error||!user) return null; return user;
}
export function origin(req:Request) {const url=new URL(req.url); return url.origin;}
