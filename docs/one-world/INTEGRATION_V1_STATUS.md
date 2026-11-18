# ONE WORLD V1 — integration control plane

Updated 2026-11-18 06:04 CT by Integration & QA.

## Single candidate branch
`integration/one-world-v1-completion` starts from `fix/one-world-visual-v1-input-build`, incorporating the foundation and stacked Visual Studio V2/V3 and compile/gesture fixes. This is a **candidate only**; no merge to main or launch authorization.

## Audited incoming PR sequence
- #1367 foundation (base for visual work)
- #1377 Visual Studio V2 → #1384 V3 → #1385 TSX/gesture fix (included in integration branch ancestry)
- #1374 and #1383 geography models: review overlapping world-index implementations; integrate **one** authoritative model, do not blindly merge duplicates.
- #1369 → #1380 → #1386 civilization/ledger: pure simulations and replay test, **not** a live wallet; keep disconnected until real server-authoritative transaction APIs and RLS exist.
- #1370 and #1382 QA docs/tests: reconcile QA status, preserve test cases.

## Critical V1 release gates (ALL unchecked unless independently evidenced)
- [ ] Next.js build passes on exact integration SHA; TypeScript compilation and tests pass.
- [ ] Browser actually opens /one-world on iPhone Safari; pan, pinch, selection, placement tested.
- [ ] Authenticated user/profile/avatar are reused; unauthorized users cannot mutate world.
- [ ] Starter plot allocated exactly once, safely under concurrent sessions; persists on reload.
- [ ] Adjacent plot purchase uses DB-atomic idempotent debit, authenticated ownership and XP ledger.
- [ ] Building and resource state persists and is server-authoritative.
- [ ] Peaceful users cannot initiate or receive attacks; disable live combat endpoints for V1.
- [ ] XP wallet never debited automatically for combat/damage; durability separate; repairs explicit and atomic.
- [ ] Vercel preview for **integration branch SHA** reports READY and page rendered successfully.
- [ ] No primary navigation entry; no production/main merge without authorization.

## Owners / next actions
- Visual Studio: own isometric component and CSS; confirm mobile gesture fixes and browser screenshot.
- World Architect: choose canonical world-index module, wire viewport/ownership into visible scene, coordinate interfaces with Visual Studio.
- Civilization Systems: implement **server-side** atomic XP purchase/repair and persistence; do not activate simulated combat.
- Integration & QA: own integration branch, CI/build, test verification, security review and release gate. Reject incomplete wallet/security changes.

## Evidence and limitations
- Foundation preview previously recorded READY in QA PR #1382 at https://1muslim-h24is5dap-elmiandco.vercel.app/one-world ; this does **not** verify the current integration branch or gameplay.
- Vercel connector deployment lookup failed with tool unavailable in this run. Build, tests, HTTP rendering, iPhone QA and deployment are **not verified**.
- Reference images: none accessed or used in this run; no filenames to register. No proprietary art copied.
- No production code, auth, XP tables, migrations or primary nav modified by this QA change.
