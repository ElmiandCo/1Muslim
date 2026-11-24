import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";

// Next resolves its server-only marker at build time. Resolve the marker to its
// server implementation for this standalone Node test.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return nextResolve("next/dist/compiled/server-only/empty.js", context);
    }
    return nextResolve(specifier, context);
  },
});
const { isReleaseReceiptEligible } = await import("../lib/server/release-receipt.ts");

const commit = "a".repeat(40);
function verified() {
  return {
    release: { id: "release-39", commit, version: "3.9", target: "main", rollback: false },
    production: { environment: "production", target: "main", state: "READY", rollback: false,
      deploymentId: "deployment-1", commit, mainHead: commit, version: "3.9" },
    ci: { kind: "integrated", status: "passed", complete: true, commit, version: "3.9",
      skippedTests: 0, checks: [{ name: "integrated suite", status: "passed" }] },
    smoke: { phase: "post-deployment", status: "passed", complete: true, commit, version: "3.9",
      deploymentId: "deployment-1", skippedTests: 0, checks: [{ name: "production smoke", status: "passed" }] },
  };
}

test("only a matching, verified production release is eligible", () => {
  assert.equal(isReleaseReceiptEligible(verified()), true);
});

test("missing or malformed evidence fails closed", () => {
  for (const input of [null, undefined, {}, [], { ...verified(), smoke: null },
    { ...verified(), ci: [] }, { ...verified(), release: { ...verified().release, commit: "abc123" } }]) {
    assert.equal(isReleaseReceiptEligible(input), false);
  }
});

test("preview, non-main, error, rollback and stale deployments are ineligible", () => {
  const changes = [
    ["release", "target", "release/v3.9"], ["release", "rollback", true],
    ["release", "rollback", undefined], ["production", "environment", "preview"],
    ["production", "target", "release/v3.9"], ["production", "state", "ERROR"],
    ["production", "state", "BUILDING"], ["production", "rollback", true],
    ["production", "rollback", undefined], ["production", "mainHead", "b".repeat(40)],
    ["production", "commit", "b".repeat(40)], ["production", "version", "3.8"],
    ["production", "deploymentId", ""],
  ];
  for (const [section, field, value] of changes) {
    const receipt = verified(); receipt[section][field] = value;
    assert.equal(isReleaseReceiptEligible(receipt), false, `${section}.${field}`);
  }
});

test("CI and smoke must be complete, passing, unskipped and bound to this release", () => {
  const changes = [
    ["ci", "kind", "standalone"], ["ci", "status", "failed"], ["ci", "complete", false],
    ["ci", "commit", "b".repeat(40)], ["ci", "version", "3.8"], ["ci", "skippedTests", 1],
    ["ci", "skippedTests", undefined], ["ci", "checks", []],
    ["ci", "checks", [{ name: "suite", status: "skipped" }]],
    ["smoke", "phase", "pre-deployment"], ["smoke", "status", "failed"],
    ["smoke", "complete", false], ["smoke", "commit", "b".repeat(40)],
    ["smoke", "version", "3.8"], ["smoke", "deploymentId", "old-deployment"],
    ["smoke", "skippedTests", 1], ["smoke", "skippedTests", undefined],
    ["smoke", "checks", []], ["smoke", "checks", [{ name: "smoke", status: "skipped" }]],
  ];
  for (const [section, field, value] of changes) {
    const receipt = verified(); receipt[section][field] = value;
    assert.equal(isReleaseReceiptEligible(receipt), false, `${section}.${field}`);
  }
});
