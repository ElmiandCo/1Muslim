import assert from "node:assert/strict";
import test from "node:test";
import {
  guestLimitForAspectRatio, guestMayPublishCamera,
  guestMayPublishMicrophone, isGuestIdentity,
} from "../lib/live-guest-policy.ts";

test("video seats cap at 3; audio seats cap at 11", () => {
  assert.equal(guestLimitForAspectRatio("9:16"), 3);
  assert.equal(guestLimitForAspectRatio("16:9"), 3);
  assert.equal(guestLimitForAspectRatio("1:1"), 11);
});
test("camera never publishes in audio or PFP mode", () => {
  assert.equal(guestMayPublishCamera("1:1", "camera"), false);
  assert.equal(guestMayPublishCamera("9:16", "pfp"), false);
  assert.equal(guestMayPublishCamera("16:9", "camera"), true);
});
test("host mic mute overrides guest publication", () => {
  assert.equal(guestMayPublishMicrophone(true), false);
  assert.equal(guestMayPublishMicrophone(false), true);
});
test("host and viewer identities cannot be treated as guest seats", () => {
  const host = "00000000-0000-0000-0000-000000000001";
  const guest = "00000000-0000-0000-0000-000000000002";
  assert.equal(isGuestIdentity(host, host), false);
  assert.equal(isGuestIdentity(guest, host), true);
  assert.equal(isGuestIdentity(guest + ":viewer:abcd", host), false);
  assert.equal(isGuestIdentity("anonymous-viewer:123", host), false);
});
