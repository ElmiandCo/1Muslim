# Bot A / World Engine — 3D sidewall collision and roof crossing

**Timestamp:** 2026-10-27 15:05–15:13 CDT (America/Chicago, UTC−05:00)
**Bot:** Game Bot A — World Engine
**Scope:** Keemy's Adventure World game-only shared movement, regression tests and docs. No production deployment or main/site changes.

## Provenance and no-regression checks

- **Frozen preview:** fix/profile-scroll-match-umma-20261027 @ c856491131bb0c8056693652f8e5e58a26836831. This remains the protected site-layout baseline.
- **Latest main, read-only:** main @ 82eddbf7a5a94fa5968550be2bd335a4aa46f823. Compare with preview returned divergence (6 main-only, 19 preview-only commits) and site changes in app/components/ImmersiveVideoEntry.tsx and app/components/PostDesignStudio.tsx. No changes to those files or production.
- **Actual game starting branch/SHA:** Bot B game/living-worlds-nabawi-congregation-20261027-1440 @ 1e4e84faa9439b104dd34a5b64c781e8cdd224fe. Includes previous A broadphase/vertical collision, playable Moses/Parted Sea, Roman, Hajj, Nabawi congregation, Jurassic, Future and lunar modules.
- **Prior handoffs reviewed:** [Bot B Nabawi congregation](2026-10-27-nabawi-congregation.md), [Bot A swept vertical](2026-10-27-swept-vertical-flight.md).
- **Working branch:** game/world-engine-3d-side-sweep-20261027-1500. Verified code SHA 0a61fabe7cd041a87238eb6b3e5a6d249a8df099; final head includes this documentation commit (check branch ref).
- **Implementation commits:** 5f3cb9a6a4b5767bd1024a2d14dd45bdd69064f4 (initial physics, wiring, new smoke); 947a1f9ac5da03b1ff50c4f43b24784a552db3ef (precise roof edge); 3e9c2dfa5bc7c5244f135d4b4188d95e2faa3b5f (correct endpoint-overlap test); 0a61fabe7cd041a87238eb6b3e5a6d249a8df099 (legacy vertical smoke assertion update).
- **Exact implementation/test paths:** app/components/gamePhysics.ts (+49), app/components/SharedGameLobby.tsx (+18/−10), scripts/game-swept-side-smoke.mjs (+62 new), scripts/game-swept-vertical-smoke.mjs (+4/−2). Docs: docs/game-dev/SHIFT_LOG.md and docs/game-dev/shifts/2026-10-27-swept-sidewall-flight.md. No app pages, CSS, nav, feed, profile, Quran, GoLive, APIs, world scenes or dependencies changed.

## What actually changed

**gamePhysics.ts / resolveSweptSideGameMovement and GameSweptSideMovementResult.** Before: horizontal wall collision used the player's feet height at the START of the frame, so diagonal flight descending from above a tall wall could enter it later in the same frame below its roof. After: the new pure helper queries the existing array or static spatial index over the X/Z path, calculates entry into each player-radius-expanded wall, interpolates feet Y at that entry, and stops the avatar just outside the first genuinely overlapping sidewall. Spawn-inside escape, raised underpasses, and unobstructed high flight are preserved. It uses existing box colliders, not a new mesh or physics engine.

**SharedGameLobby.tsx / shared render-frame movement.** Before: endpoint-first vertical collision could falsely land on a roof the avatar entered only AFTER crossing roof height. After: ordinary avatar movement applies the height-aware side-entry sweep after gravity/flight integration and before vertical contact, then uses swept X/Z roof/underside crossing for moving avatars. Stationary avatars still use the existing endpoint vertical resolver. Side impacts use existing crash feedback. Ship, aircraft, EVA, lunar walking and seated meeting modes deliberately bypass this new sweep.

**Game-only regression tests.** New scripts/game-swept-side-smoke.mjs covers descending sidewalls, above-roof clearance, distant walls, spawn-inside escape, level-motion handoff, raised bridge clearance, false endpoint landing vs true swept roof contact, ceiling contact, 120 indexed/array parity cases and three lobby wiring checks. Updated scripts/game-swept-vertical-smoke.mjs for swept-first moving characters and stationary endpoint collision; numerical cases unchanged.

**Implemented, not merely planned:** the helper and shared lobby wiring above. **Not implemented:** new world geometry, city streets/ground, stars, faster descend button, ten enterable mosques, XP shop/blaster/shield changes, persistent hand pose, voice indicators, extra NPCs, or full per-object solid collision.

## Executed verification

Tests executed in an isolated Vercel sandbox cloned from the exact code SHA 0a61fabe with Node 24.22.1, npm install --legacy-peer-deps, and no production deployment.

| Check | Result |
| --- | --- |
| New swept side smoke | PASS — 11 cases + 120 indexed parity + 3 wiring |
| Existing swept vertical smoke | PASS — 10 cases + 100 parity + 2 wiring |
| Existing physics smoke | PASS — 23 assertions + 288 parity + 4 index edge cases |
| Today collision smoke | PASS — 192 parity, damage/repair, 251 static + 80 props + 122 historical solids |
| Flight pose smoke | PASS — 16 deterministic cases |
| Moses smoke | PASS — bounds, refuge, LOD, selectors and wiring |
| Roman smoke | PASS — 17 static checks, portal, world preservation |
| Lunar research smoke | PASS — draw budget, finite geometry, Moon-only wiring |
| Hajj pilgrims smoke | PASS — 28 ritual boundaries, route, LOD and wiring |
| Strict TypeScript on gamePhysics.ts | PASS |
| npm run build (Next.js 15.5.26) | PASS — compiled in 22.5s, lint/type stage, 101/101 pages with dummy non-secret NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY |
| Unconfigured build | FAILED on prerender /_not-found because Supabase environment variables were missing; no game compilation/type error. Re-ran with dummy vars and succeeded |
| Initial new smoke | FAILED at edge tolerance and synthetic endpoint fixture; fixed implementation precision and fixture; final suite passed |
| Real mobile/desktop playtest, FPS, GPU draw calls | NOT TESTED; no runtime quality claim |

## Per-world progress and coordination

| World | Status | Remaining validation |
| --- | --- | --- |
| Today / Main Street / Belt Boyz | Shared physics updated; existing geometry, shop, damage and roofless meeting office preserved | Roof/sidewall device test, continuous ground/roads |
| Jurassic | Shared sweep uses existing JURASSIC_COLLISION_INDEX; ecology, dinosaurs, caves preserved | Canopy, cave, phone FPS |
| Future / RealMecca | Shared sweep uses FUTURE_COLLISION_INDEX; towers, skyways, gardens preserved | Elevated deck and tower roof tests |
| Moses / Parted Sea | Shared sweep uses existing SEA_COLLIDERS; playable world/refuge unchanged | Sea wall contact, mobile walkthrough |
| Roman Judea / Rome | Shared sweep uses existing Roman index; markets/portals unchanged | Roman building contact |
| Muhammad ﷺ-era Makkah/Madinah | Shared sweep uses prophetic index; Hajj pilgrims and Nabawi congregation preserved | Mosque solids and historical-world testing |
| Space/Moon/ship/plane/EVA | Dedicated movement deliberately untouched; lunar research scene retained | Future separate collision audit |

## Dependencies, integration, rollback, next shift

- No new dependencies. Existing GameCollisionSource and indices are reused. No scene module was replaced.
- **Integration:** refresh main, production, frozen preview and site layout contracts at integration time. Create a fresh site integration branch and cherry-pick only the four game commits listed above, or transplant exact game-only hunks if SharedGameLobby.tsx has newer game edits. All previous A/B scene modules must be present first. Do not merge/copy full game branch, old app pages, navigation, profile/feed, Quran, GoLive or CSS. Re-run tests/build and preview before requesting explicit production approval.
- **Rollback:** on the integration branch, revert 0a61fabe, 3e9c2dfa, 947a1f9a, 5f3cb9a6 in reverse order, or remove only the new physics helper and two targeted lobby movement changes. Do not revert site changes.
- **Next Bot A:** real mobile and desktop collision/roof testing, benchmark indexed broadphase and draw calls, audit exact building/prop collision coverage, improve sliding during diagonal descent and continuous ground/road/flight descend behavior.
- **Next Bot B:** preserve shared gamePhysics and movement wiring; add enterable high-ceiling mosque/world ambience as standalone scene-only changes, coordinate collider additions with A; do not overwrite the engine. Preserve Moses, Nabawi, Hajj and Belt Boyz.
- **Unverified:** actual frame-rate, cross-device animation feel, per-building collision accuracy, gameplay across all portals. The successful build and smoke checks do not prove these.

Cross-reference: [Bot B handoff](2026-10-27-nabawi-congregation.md), [Bot A previous](2026-10-27-swept-vertical-flight.md), [game master brief #126](https://github.com/ElmiandCo/1Muslim/issues/126).
