import "server-only";

/**
 * This predicate does not authenticate receipts or fetch current state. Its caller
 * must obtain each field from trusted, independently verified sources immediately
 * before use; cached or caller-supplied claims are not release evidence. Delivery,
 * authorization, atomic deduplication and rechecking at send time belong to the
 * future sender integration.
 */
export function isReleaseReceiptEligible(input: unknown): boolean {
  if (!isRecord(input)) return false;
  const { release, production, ci, smoke } = input;
  if (!isRecord(release) || !isRecord(production) || !isRecord(ci) || !isRecord(smoke)) return false;

  if (!nonEmpty(release.id) || !fullCommit(release.commit) || !nonEmpty(release.version)) return false;
  if (release.target !== "main" || release.rollback !== false) return false;

  // The observed current production deployment and current main head must both
  // identify this release, not just an older READY deployment of the same commit.
  if (production.environment !== "production" || production.target !== "main" ||
      production.state !== "READY" || production.rollback !== false ||
      !nonEmpty(production.deploymentId) || production.commit !== release.commit ||
      production.mainHead !== release.commit || production.version !== release.version) return false;

  if (ci.kind !== "integrated" || ci.status !== "passed" || ci.complete !== true ||
      ci.commit !== release.commit || ci.version !== release.version ||
      ci.skippedTests !== 0 || !passedChecks(ci.checks)) return false;

  return smoke.phase === "post-deployment" && smoke.status === "passed" &&
    smoke.complete === true && smoke.commit === release.commit &&
    smoke.version === release.version && smoke.deploymentId === production.deploymentId &&
    smoke.skippedTests === 0 && passedChecks(smoke.checks);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.trim() === value;
}

function fullCommit(value: unknown): value is string {
  return typeof value === "string" && /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(value);
}

function passedChecks(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0 && value.every(
    (check) => isRecord(check) && nonEmpty(check.name) && check.status === "passed",
  );
}
