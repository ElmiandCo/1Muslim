# ONE WORLD — QA status (Integration & QA, 2026-11-18 07:02 CT)

## Candidate and audit
- Candidate branch: `integration/one-world-v1-completion`, draft PR #1387. Do not merge to main or add to primary navigation.
- PR #1388 changes `GeographicNavigator.tsx`, `page.tsx` and shared handoff docs. Geographic view remains illustrative; integrate with the visible isometric plot data only after agreeing on a single coordinate/ownership contract.
- PR #1389 changes `isometric-landscape.css` and shared docs. Review touch targets and safe-area behavior on an actual iPhone; coordinate shared documentation edits to avoid conflicts.
- PR #1386 and #1390 both change `lib/one-world/ledger-core.ts`; preserve their stacking order and test replay and adjacency together. This is still a simulation, not real wallet security.
- PR #1382 contains an earlier QA_STATUS.md for the foundation branch, but that file was absent from the integration branch at audit time. This file records the current candidate's status instead of misattributing the foundation deployment.

## Evidence
- GitHub file reads verified STUDIO_HANDOFF.md, WORK_LOG.md, REFERENCE_USAGE.md and INTEGRATION_V1_STATUS.md on candidate branch.
- GitHub changed-file listings verified PR #1387, #1388, #1389, #1386, #1390 and #1382.
- Earlier foundation Vercel READY claim is documented in PR #1382, **not** evidence of current integration readiness.
- Vercel deployment inspection was attempted, but the connector returned `Tool open_deployments not found`. No candidate preview status or URL verified.
- No local repository checkout/build runner or authenticated iPhone browser was available for this audit. **No build, tests, HTTP page render, gestures, persistence or wallet security verified.**
- Reference screenshots actually accessed: none; filenames: none. No assets copied.

## Mandatory release gates (all BLOCKED)
- [ ] Exact integration SHA passes Next.js production build, typecheck and tests.
- [ ] Authenticated mobile user opens /one-world; camera pan/pinch, plot selection, placement work.
- [ ] Server allocates one starter plot per player, atomically and persistently.
- [ ] Adjacent purchase validates trusted coordinates, server-side ownership, sufficient XP and idempotency in one DB transaction.
- [ ] Persistent buildings/resources survive reload and are not client-authoritative.
- [ ] Peaceful mode is server-enforced, live combat disabled, XP wallet separate from durability.
- [ ] Candidate Vercel preview READY **and** authenticated route actually rendered.
- [ ] Main navigation and production unchanged.

## Owner-specific blockers
- **World Architect:** agree canonical plot IDs and coordinates with Visual Studio; replace sample geography, expose authoritative ownership interface; avoid duplicate world-index models.
- **Visual Studio:** bind selected geographic plot to the actual isometric scene, verify mobile pan/pinch/placement, document measured layout behavior.
- **Civilization Systems:** implement and test authenticated DB-atomic XP debit and ledger, ownership authorization, starter allocation, persistent buildings/resources; do not connect simulation directly to real wallet.
- **Integration & QA:** integrate stacked PRs in dependency order after conflict review, execute build/tests on exact SHA, inspect Vercel preview and authenticated iPhone browser. Reject release until all gates pass.

## Changed paths in this run
- `docs/one-world/QA_STATUS.md` only. No app code, migrations, XP or navigation modified.

## Next step
Integrate one small vertical slice: login → starter plot → place building → refresh → persisted building; then add atomic adjacent purchase and security regression tests. Keep candidate in draft until verified.
