# Civilization Systems completion handoff — 2026-11-18 05:45 CT

## Reviewed
Open PRs #1367, #1369, #1370, #1380, #1382, #1383, #1384 and #1385. Existing foundation documentation read: STUDIO_HANDOFF.md, WORK_LOG.md, REFERENCE_USAGE.md. QA_STATUS.md absent on foundation branch; belongs to QA PR. No screenshots accessed or used.

## This patch
Based on Civilization ledger PR #1380; only changes `lib/one-world/ledger-core.ts` and adds `lib/one-world/ledger-idempotency.test.ts`. Fixes a concrete replay bug: a client could reuse a successful build idempotency key with a different building and receive success without matching the original request. Ledger now records building choice and replay requires equality. No schema, route, wallet, or UI changed. No conflicts expected with visual/world PRs.

## Verification and blockers
Test committed but NOT executed; GitHub connector cannot run Node or production build. Integration lead must run TS tests and npm build on combined branch. Critical V1 blockers: actual Supabase auth/RLS, atomic XP wallet+plot ledger RPC, adjacent-plot authorization, persisted resources/buildings, server allocation, and integrated mobile UI. Current pure simulation MUST NOT be exposed as a production XP endpoint. Peaceful-mode combat remains unimplemented; do not enable real attacks. No preview or deployment verified in this run.

## Next owner
Integration & QA: cherry-pick/merge this small patch after PR #1380, run tests, and coordinate schema/API with current 1Muslim XP source. Avoid duplicate simulation engines (#1369 vs #1380) without choosing one canonical implementation.
