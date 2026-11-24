import assert from "node:assert/strict";
import test from "node:test";
import { canStartAdminVoice } from "../app/api/admin/hudhud-voice/authorization.ts";

test("only the authenticated owner email is allowed", () => {
  assert.equal(canStartAdminVoice({ email: "hudhudbyelmi@gmail.com" }, null), true);
  assert.equal(canStartAdminVoice({ email: "HUDHUDBYELMI@gmail.com" }, null), true);
  assert.equal(canStartAdminVoice(null, null), false);
  assert.equal(canStartAdminVoice({}, null), false);
  assert.equal(canStartAdminVoice({ email: "other@example.com" }, null), false);
  assert.equal(canStartAdminVoice({ email: "hudhudbyelmi@gmail.com.evil.test" }, null), false);
});

test("authentication errors and unapproved role or name claims fail closed", () => {
  assert.equal(canStartAdminVoice({ email: "hudhudbyelmi@gmail.com" }, new Error("auth failed")), false);
  assert.equal(canStartAdminVoice({ email: "other@example.com", role: "admin" }, null), false);
  assert.equal(canStartAdminVoice({ email: "other@example.com", role: "vp", name: "Sav" }, null), false);
});
