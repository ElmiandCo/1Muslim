import assert from "node:assert/strict";
import test from "node:test";
import {
 UNLOCKED_PLAN_SPECS, isUnlockedPlan, unlockedPriceIds,
 isUnlockedV39CheckoutConfigured, isRecognizedUnlockedPriceId,
} from "../lib/stripe-unlocked.ts";

test("one entitlement has exact weekly, monthly and annual USD amounts", () => {
 assert.deepEqual([UNLOCKED_PLAN_SPECS.weekly.amount,UNLOCKED_PLAN_SPECS.monthly.amount,UNLOCKED_PLAN_SPECS.yearly.amount],[599,999,3500]);
 assert.equal(isUnlockedPlan("weekly"),true);
 assert.equal(isUnlockedPlan("monthly"),true);
 assert.equal(isUnlockedPlan("yearly"),true);
 assert.equal(isUnlockedPlan("legacy"),false);
 assert.equal(isUnlockedPlan(null),false);
 assert.equal(999*12-3500,8488);
});

test("checkout remains disabled until three unique real-looking Stripe prices exist", () => {
 const names=["STRIPE_UNLOCKED_WEEKLY_PRICE_ID","STRIPE_UNLOCKED_MONTHLY_PRICE_ID","STRIPE_UNLOCKED_YEARLY_PRICE_ID"];
 const old=names.map(n=>process.env[n]);
 const ids=["price_WeeklyABC1","price_MonthlyABC2","price_YearlyABC3"];
 try {
  names.forEach(n=>delete process.env[n]);
  assert.equal(isUnlockedV39CheckoutConfigured(),false);
  names.forEach((n,i)=>process.env[n]=ids[i]);
  assert.deepEqual(Object.values(unlockedPriceIds()),ids);
  assert.equal(isUnlockedV39CheckoutConfigured(),true);
  assert.equal(isRecognizedUnlockedPriceId(ids[0]),true);
  process.env[names[2]]=ids[1]; assert.equal(isUnlockedV39CheckoutConfigured(),false);
  process.env[names[2]]="price_live_yearly_id_here"; assert.equal(isUnlockedV39CheckoutConfigured(),false);
  process.env[names[2]]=""; assert.equal(isUnlockedV39CheckoutConfigured(),false);
 } finally {
  names.forEach((n,i)=>{if(old[i]===undefined)delete process.env[n];else process.env[n]=old[i]});
 }
});
