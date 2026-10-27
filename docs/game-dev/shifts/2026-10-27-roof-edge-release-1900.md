# Bot A — Roof/ceiling edge release and high-speed flight collision regression

**2026-10-27 · 18:57–19:04 CDT (America/Chicago)** · Game Bot A / World Engine · **GAME-ONLY branch** · **No production/main/frozen-site merge or production deployment**

## Source audit, baseline and handoff

| Contract | Verified |
| --- | --- |
| Protected site preview | `fix/profile-scroll-match-umma-20261027` @ `c856491131bb0c8056693652f8e5e58a26836831`; `app/page.tsx` blob `92ca9b508378fd462ae3cf8a1458d2d4467aeb56` |
| Latest main (read-only) | `main` @ `c043219f7a3eeb8e1529538013e97f311a3b938a`; `app/page.tsx` blob `b066f01c810fe5fcfa58db09b426383e2e3c9797` differs from frozen preview. **Do not copy site files.** |
| Actual GAME starting branch | Bot B `game/living-worlds-hyper-shield-aura-20261027-1830` @ `95d9e7a47c05e1b35eae50daf29830c55b605f28`; includes Bot A shield timing and Bot B emerald shield audio/visual, Egypt village/docklife, Moses↔Egypt portals, Hajj/Nabawi, all prior world/physics work |
| Other shift reviewed | [Bot B shield-aura handoff](2026-10-27-hyper-shield-aura-1830.md), [Bot A shield timing](2026-10-27-hyper-shield-1800.md), [Bot B Egypt village](2026-10-27-egypt-village-1730.md); [coordination issue #126](https://github.com/ElmiandCo/1Muslim/issues/126) |
| Dedicated working branch | `game/world-engine-ledge-release-20261027-1900` |
| Code/test commits | `02485126` roof/ceiling departure, `62354883` regression cases, `0ae037e7` preserve supported lateral motion, `9c02c355` additional tests; documentation-only commits follow |
| Exact changed paths | `app/components/gamePhysics.ts`, `scripts/game-swept-vertical-smoke.mjs`, this note, `docs/game-dev/SHIFT_LOG.md` |
| Scope | Physics helper and game-only smoke tests; **no** shared lobby, page, profile, feed, navigation, Qur'an, GoLive, game scene or asset modifications |

## Before → after behavior

**Bug found by executing the original committed collision function:** When a character was standing exactly on a solid roof and moved horizontally off its edge while beginning to fall, `resolveSweptVerticalGameMovement` treated a crossing at interpolation `t=0` as a landing and snapped the avatar to the original X/Z. The same start-of-frame issue occurred against the underside of a bridge or roof. Moving **along** the same roof also snapped X/Z backward, potentially making rooftop walking sticky.

**Implemented in `resolveSweptVerticalGameMovement`:**
1. For a crossing at `t<=EPS` (frame-start contact), **skip** that collider if the destination leaves its radius-expanded footprint. The character may fall off a ledge or ascend away from an underside.
2. If the destination **still overlaps** the same roof/underside at `t<=EPS`, keep the destination X/Z while applying the correct landing/ceiling Y; ordinary lateral rooftop motion remains possible.
3. Preserve true crossings later in the frame, roof-first selection, the existing `resolveVerticalGameMovement` stationary fallback, collision indexing, side-entry collision and high-altitude flight behavior. This is shared across ordinary-character Egypt, Moses, Jurassic, Future, Roman, Today and prophetic-world collision sources; it does not alter ship/plane/EVA/lunar paths.

## Verification (precise evidence)

- **PASS:** Eight direct V8 behavior assertions against the **actual GitHub-fetched modified function with only TypeScript annotations removed**: roof departure, underside departure, lateral rooftop traversal, lateral underside traversal, actual roof crossing after frame start, high-altitude no reset, diagonal roof landing and underside impact.
- **PASS:** GitHub compare to Bot B starting branch shows **only two game/test files** changed in implementation; no site or scene files changed.
- **PASS:** `app/page.tsx` blob on this branch matches frozen site preview exactly and differs from newer `main` as expected.
- **Committed but not executed in full checkout:** extended `node scripts/game-swept-vertical-smoke.mjs` with departure/traversal and indexed-parity cases. The existing script includes 100 deterministic indexed/array comparisons. The environment has connector GitHub access but no network checkout, so do not claim full suite success.
- **Preview build:** Vercel non-production deployment `dpl_91urCJhNY5CRJvEzvQ97eC7BgwtJ`, https://1muslim-96vy3by96-elmiandco.vercel.app, created at implementation/test SHA `9c02c355`. At documentation time build was **BUILDING**; verify status before claiming READY.
- **Unverified:** real mobile/desktop ledge walk, rooftop physics during low FPS, WebGL rendering, authoritative multiplayer shield, physical device FPS, full TypeScript/build status until deployment completes.

## Per-world preservation and next work

| World | Current state / this shift | Next verification |
| --- | --- | --- |
| Ancient Egypt | Great Pyramid construction, Nile/boats, palm trunks, docklife, porters, crops and solid stepped pyramids retained; shared edge release applies to pyramids/docks | Physically jump off pyramid steps/docks, test Nile bank and round-trip portal. Great Pyramid central framing is Bot B's separate priority. |
| Moses / Parted Sea | Egyptian-origin portal and return retained | Verify return, high-speed descending near shore/portal |
| Jurassic | Dinosaurs, cave, collision broadphase and shield guards retained | Dive from tree canopies and cave ledges |
| Future / RealMecca | Skyways and tall towers unchanged | Walk off skyway edge, ascend away from bridge underside |
| Makkah / Madinah / Nabawi / Hajj | Existing Hajj seven-circuit/Safa–Marwa NPCs and Nabawi congregation retained | Verify ordinary avatar physics near enterable buildings |
| Roman Judea / Jerusalem | World and collision source retained | Test rooftop edge traversal |
| Moon / Space / Blessed Chambers | Dedicated ship/EVA/lunar movement **unchanged** | Separate physics/performance test |
| Today / Belt Boyz / Meeting | Roofless Belt Boyz office and meeting remain unchanged | Bot B to rename meeting, improve controls and add Exit Meeting; do not remove office |
| Hyper Defense | Bot A 10s timer and Bot B emerald aura/audio preserved | **Not server-authoritative**; server validation remains necessary |

## Integration / rollback / next shift

- Integrate only the `gamePhysics.ts` hunk and its smoke test onto a **fresh integration branch from the then-current site head**. Do not merge/copy the whole older-site-descended game branch or replace app/pages.
- Rollback: revert `0ae037e7` and `02485126` (and optionally two smoke commits), restoring the Bot B `gamePhysics.ts` blob `9e19e0344866192a1f7c4cf105fdf8dbb9f1259e`.
- Bot B: keep your Egypt scene, shield sphere and audio; this shift does not modify them. Please test roof-edge movement and continue Great Pyramid centrality + Meeting UI on your own branch, reviewing the new physics hunk before integrating.
- Bot A next: run full Node smoke suite in an authenticated checkout, mobile edge/landing tests, audit riverbank collision, design genuinely server-authoritative multiplayer damage verification. Do not claim server authority until deployed and verified.

**No production deployment, main update, frozen-preview update or automatic merge.**
