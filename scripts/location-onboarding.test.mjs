import assert from "node:assert/strict";
import test from "node:test";
import { shouldPromptForLocation } from "../lib/location-onboarding.ts";

test("only members without a saved decision see the automatic location prompt", () => {
  assert.equal(shouldPromptForLocation(null), true);
  assert.equal(shouldPromptForLocation({ decision: "declined" }), false);
  assert.equal(shouldPromptForLocation({ decision: "accepted" }), false);
});

test("a permitted location is saved before acceptance is recorded", async () => {
  const { acceptLocation } = await import("../lib/location-onboarding.ts");
  const calls = [];
  const place = { city: "London", state: "England", country: "United Kingdom" };
  assert.equal(await acceptLocation({
    locate: async () => { calls.push("locate"); return place; },
    isCurrent: () => true,
    savePlace: async value => { assert.deepEqual(value, place); calls.push("save"); },
    recordAccepted: async () => { calls.push("accepted"); }
  }), true);
  assert.deepEqual(calls, ["locate", "save", "accepted"]);
});

test("denial or failed profile save never records acceptance", async () => {
  const { acceptLocation } = await import("../lib/location-onboarding.ts");
  for (const failAt of ["locate", "save"]) {
    let recorded = false;
    await assert.rejects(acceptLocation({
      locate: async () => { if (failAt === "locate") throw new Error("denied"); return { city: "", state: "Region", country: "Country" }; },
      isCurrent: () => true,
      savePlace: async () => { if (failAt === "save") throw new Error("save failed"); },
      recordAccepted: async () => { recorded = true; }
    }));
    assert.equal(recorded, false);
  }
});

test("a cancelled request or account change does not save or accept", async () => {
  const { acceptLocation } = await import("../lib/location-onboarding.ts");
  let current = false;
  let writes = 0;
  const steps = {
    locate: async () => ({ city: "", state: "Region", country: "Country" }),
    isCurrent: () => current,
    savePlace: async () => { writes++; current = false; },
    recordAccepted: async () => { writes++; }
  };
  assert.equal(await acceptLocation(steps), false);
  assert.equal(writes, 0);
  current = true;
  assert.equal(await acceptLocation(steps), false);
  assert.equal(writes, 1);
});

test("an unsuccessful acceptance write is reported to the caller", async () => {
  const { acceptLocation } = await import("../lib/location-onboarding.ts");
  await assert.rejects(acceptLocation({
    locate: async () => ({ city: "", state: "Region", country: "Country" }),
    isCurrent: () => true,
    savePlace: async () => {},
    recordAccepted: async () => { throw new Error("decision write failed"); }
  }), /decision write failed/);
});
