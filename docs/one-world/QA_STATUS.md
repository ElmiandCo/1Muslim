# ONE WORLD — Integration and QA gates
Updated 2026-11-18, Integration & QA initial pass.

## Verified by repository inspection
- Standalone route exists in World Architect branch `feat/one-world-playable-foundation` at `app/one-world/page.tsx`.
- Client-only demo: local plots, build placement, mode selector, zoom, and world overview placeholder.
- Main branch does NOT yet contain the route. Do not advertise production availability.
- No wallet, database writes, combat or authentication are connected on the demo page.
- Visual Studio PR #1368 and Civilization Systems PR #1369 were reported by sibling tasks but their implementation and compatibility are not yet independently verified. Integrate only after review.

## Security gates before production
- [ ] Require authenticated session and verify user identity on every server action.
- [ ] Persist plot ownership in database with row-level security and atomic claim/purchase transactions.
- [ ] Server-enforce both attacker and defender conquest mode. Peaceful players cannot initiate or receive attacks.
- [ ] Battle results must never automatically debit XP. Wallet debits only for explicit purchases/repairs with consent.
- [ ] Use integer XP amounts, idempotency keys, transaction ledger, and atomic wallet debit + asset repair.
- [ ] Store durability separately from wallet balance; authorize repairs against current asset owner.
- [ ] Implement server-authoritative offline defenses, repeat-attack defender advantage, and cooldown keyed by attacker/defender/plot.
- [ ] Implement atomic conquest ownership transfer and safe relocation of displaced player assets.
- [ ] Add abuse controls, audit logs, concurrency tests and replay protection.
- [ ] Run Next.js build and automated tests in CI; confirm no regression to existing 1Muslim routes.
- [ ] Verify Vercel preview URL on mobile and desktop, route loads, no console errors, touch gestures work.
- [ ] Keep route off primary navigation until explicit approval.

## Initial tests
`node --test tests/one-world-security.test.mjs` validates pure security rules; these are NOT server authorization or database protection. Build and Vercel preview not verified in this run.

## Reference image use
No screenshots inspected in this QA pass. No artwork copied. See REFERENCE_USAGE.md.

## Handoff
Visual Studio: integrate mobile gestures and accessible controls with existing page.
Civilization Systems: reuse these pure gates only as shared specification; implement DB-authoritative policies and transaction ledger before enabling gameplay writes.
World Architect: keep isolated route, add actual geographic map and persistence after QA review.
