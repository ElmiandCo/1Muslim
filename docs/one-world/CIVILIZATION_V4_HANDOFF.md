# Civilization Systems V4 — 2026-11-18 06:44 CT

## Scope and coordination
Based on PR #1386, not the shared integration branch. Integration lead owns merging. Read STUDIO_HANDOFF.md, WORK_LOG.md, REFERENCE_USAGE.md, INTEGRATION_V1_STATUS.md; QA_STATUS.md missing from integration branch. Reviewed changed paths for PRs #1380, #1386, #1387, #1388, #1389. No reference images accessed or used; filenames: none.

## Changed files
- lib/one-world/ledger-core.ts: land purchases now require integer x/y coordinates, same region, and orthogonal adjacency to one of actor's owned plots. Missing geometry fails closed. Idempotent replay still returns prior ledger entry.
- lib/one-world/ledger-core.test.ts: updates seeded geometry and covers far, diagonal, cross-region and missing-geometry denial; verifies no XP debit or mutation on rejection.

## Integration requirements
World Architect must supply canonical regionId/x/y on plots from a trusted server-side mapping, not client-provided coordinates. Server must authenticate user, lock wallet and ownership rows, allocate starter plot, enforce DB uniqueness, and atomically commit XP debit + ledger + land ownership. Existing pure transact() is NOT a secure endpoint and must not be called from a client to authorize real purchases. Confirm coordinate convention with geographic module before enabling purchases. No real combat; peaceful players protected. Wallet XP separate from building durability.

## Verification
GitHub commits succeeded. Automated tests, build, preview, mobile QA and server persistence were NOT executed/verified. No production/main/navigation changes. PR stacked on #1386 to avoid conflicting changes.

## Next owner
Integration & QA: merge after #1386; connect canonical coordinates; execute Node TS tests, Next build, server transaction/RLS tests and mobile gameplay. Do not mark V1 released until all release gates pass.
