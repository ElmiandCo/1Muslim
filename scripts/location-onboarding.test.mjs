import assert from "node:assert/strict";
import test from "node:test";
import { shouldPromptForLocation } from "../lib/location-onboarding.ts";

test("only members without a saved decision see the automatic location prompt", () => {
  assert.equal(shouldPromptForLocation(null), true);
  assert.equal(shouldPromptForLocation({ decision: "declined" }), false);
  assert.equal(shouldPromptForLocation({ decision: "accepted" }), false);
});
