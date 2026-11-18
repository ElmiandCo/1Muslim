import { strict as assert } from "node:assert";
import { test } from "node:test";
import { validateAdjacentPurchase, type PurchaseRequest } from "./purchase-guard";

const base: PurchaseRequest = {
  actorId: "alice", idempotencyKey: "req-1", walletXp: 100, costXp: 25,
  target: { id: "b", regionId: "r1", x: 2, y: 1, ownerId: null },
  ownedPlots: [{ id: "a", regionId: "r1", x: 1, y: 1, ownerId: "alice" }]
};
test("allows cardinal adjacent purchase with sufficient XP", () => assert.deepEqual(validateAdjacentPurchase(base), { ok: true }));
test("rejects diagonal plot", () => assert.equal(validateAdjacentPurchase({ ...base, target: { ...base.target, y: 2 } }).ok, false));
test("rejects different region", () => assert.equal(validateAdjacentPurchase({ ...base, target: { ...base.target, regionId: "r2" } }).ok, false));
test("rejects plots owned by someone else", () => assert.equal(validateAdjacentPurchase({ ...base, ownedPlots: [{ ...base.ownedPlots[0], ownerId: "bob" }] }).ok, false));
test("rejects occupied target", () => assert.equal(validateAdjacentPurchase({ ...base, target: { ...base.target, ownerId: "bob" } }).ok, false));
test("rejects insufficient funds", () => assert.equal(validateAdjacentPurchase({ ...base, walletXp: 24 }).ok, false));
test("rejects negative or fractional costs", () => {
  assert.equal(validateAdjacentPurchase({ ...base, costXp: -5 }).ok, false);
  assert.equal(validateAdjacentPurchase({ ...base, costXp: 1.5 }).ok, false);
});
test("rejects missing trusted coordinates", () => assert.equal(validateAdjacentPurchase({ ...base, target: { ...base.target, x: NaN } }).ok, false));
test("rejects missing idempotency key", () => assert.equal(validateAdjacentPurchase({ ...base, idempotencyKey: "" }).ok, false));

test("rejects whitespace-only or non-string identity and replay keys", () => {
  assert.equal(validateAdjacentPurchase({ ...base, actorId: "  " }).ok, false);
  assert.equal(validateAdjacentPurchase({ ...base, idempotencyKey: "  " }).ok, false);
  assert.equal(validateAdjacentPurchase({ ...base, idempotencyKey: 123 as unknown as string }).ok, false);
});
test("rejects malformed runtime ownership and target payloads", () => {
  assert.equal(validateAdjacentPurchase(null as unknown as PurchaseRequest).ok, false);
  assert.equal(validateAdjacentPurchase({ ...base, ownedPlots: null as unknown as PurchaseRequest["ownedPlots"] }).ok, false);
  assert.equal(validateAdjacentPurchase({ ...base, ownedPlots: [null] as unknown as PurchaseRequest["ownedPlots"] }).ok, false);
  assert.equal(validateAdjacentPurchase({ ...base, target: { ...base.target, regionId: "  " } }).ok, false);
});
