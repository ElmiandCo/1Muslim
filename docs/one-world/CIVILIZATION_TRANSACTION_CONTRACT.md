# Civilization Systems V1 transaction handoff — 2026-11-18

## Scope and branch
Branch: `feat/one-world-civilization-v1-transaction-contract`, based on `integration/one-world-v1-completion`. This is an isolated PR; do not merge into production. Existing simulation and UI untouched.

## Changes
- `lib/one-world/purchase-guard.ts`: pure fail-closed adjacent purchase validation. Rejects diagonal/cross-region expansion, unowned/other-owner anchors, occupied targets, invalid coordinates, malformed idempotency keys, non-integer costs/wallet balances and insufficient XP.
- `lib/one-world/purchase-guard.test.ts`: nine focused regression cases.
- This handoff document.

## Security integration contract (NOT IMPLEMENTED)
1. Authenticate user on server and derive actor ID from session, never request body.
2. Begin a DB transaction; lock wallet row and target/adjacent plot ownership rows. Load canonical coordinates, owner IDs and cost from database, not client input.
3. Enforce a UNIQUE(actor_id, idempotency_key) ledger constraint. Store request fingerprint (target, amount, operation), reject mismatched replay, return original result for matching replay.
4. Allocate starter plot once per user under unique ownership constraint; check ownership and peaceful mode server-side.
5. Invoke purchase guard using trusted locked DB data, then atomically insert ledger debit, decrement wallet with sufficient-balance condition, assign target ownership, and commit. Roll back everything on any failure. Keep durability separate from wallet XP.
6. Persist buildings/resources with authenticated ownership checks and resource/cost validation; repair operations require own-object authorization, durable object state, and distinct idempotent ledger entry. No automatic XP deductions from peaceful/noncombatant players.
7. Disable all combat endpoints until V1.1 security review.

## Evidence and coordination
Read `STUDIO_HANDOFF.md`, `WORK_LOG.md`, `REFERENCE_USAGE.md`, `QA_STATUS.md` on integration branch. Inspected changed-file lists for PRs #1386, #1387, #1388, #1389, #1390, #1391. Existing ledger-core changes overlap between #1386/#1390; this branch deliberately avoids modifying ledger-core to prevent conflict. No merges attempted. No reference screenshots used; filenames: none.

GitHub file commits verified. Tests authored but **not executed**; no local checkout, CI evidence, mobile QA or Vercel preview verified. This guard is not a transaction and must not be wired to a real wallet without DB-atomic implementation.

## Owners and next steps
- Civilization Systems: implement DB transaction/RLS and idempotent ledger, persistence and repair; execute tests against authenticated DB.
- World Architect: supply canonical plot IDs/coordinates and authoritative adjacency.
- Visual Studio: display server-returned wallet/ownership and persisted buildings; never debit XP locally.
- Integration & QA: review guard against #1390 behavior, execute test suite/build, verify mobile page and transaction rollback before any release.
