# World Engine / Shift A — Solid long-Nile oasis palms

**Timestamp:** 2026-10-28 00:55 CDT (America/Chicago; 05:55 UTC), game-only shift  
**Bot:** Game Bot A — World Engine  
**Safety:** Dedicated game branch only; no production/main/frozen-preview mutations, site page/layout/profile/feed/Qur'an/GoLive/CSS changes, production deployment or merge.

## Starting refs, review and site contract

| Reference | Verified SHA / state | Action |
| --- | --- | --- |
| Protected preview | `fix/profile-scroll-match-umma-20261027` @ `c856491131bb0c8056693652f8e5e58a26836831` | Inspected, read-only |
| Current main | `main` @ `c043219f7a3eeb8e1529538013e97f311a3b938a` | Inspected, read-only |
| Frozen production | `freeze/production-20261026-1824` @ `518fddcc3ec4530a66d3e857f7c4257bb8914cff` | Inspected, read-only |
| Bot A prior long Nile | `game/world-engine-nile-long-banks-20261028-0000-a` @ `7a5b8caf6c450ffd189c8bada621d8d9d1876d0f` | Reviewed previous terrain/LOD handoff |
| **Starting game source / Bot B handoff** | `game/living-worlds-long-nile-oasis-20261028-0030-b` @ `ea5ae7f895478647e806b3b43bf3c2b53fe5d1a8` | **Branch created directly from this game tip**, carrying forward B's 64 palms, 24 reeds, 8 skiffs, 16 herons |
| **Working branch** | `game/world-engine-long-nile-palm-solids-20261028-0100-a` | Commits listed below; no shared branch edited |

**Contract:** `app/layout.tsx` is the same blob (`106fb71f`) on current main and frozen preview. `app/page.tsx` differs (`b066f01c` main versus `92ca9b50` preview); never copy or merge it. Current main vs preview diverged (19 commits each direction); this branch must **not** be merged wholesale into current site. Reviewed Bot B's [long Nile oasis handoff](2026-10-28-long-nile-oasis-0030-b.md) and [coordination issue #126](https://github.com/ElmiandCo/1Muslim/issues/126). Bot B owns the visuals and must be consulted if palm positions/heights change.

## Implemented changes — exact paths and commits

| Path | Commit | Functions and before → after |
| --- | --- | --- |
| `app/components/gameEgyptLongNilePhysics.ts` **new** | `b50c95f5f7cead0b5f25d38bd7dcf9716c45d239` | `createLongNilePalmColliders()` derives 64 immutable solid trunk AABBs from Bot B's actual `LONG_NILE_OASIS_PALMS` coordinates/heights. Trunk half-width .575m, height .9× visual palm height, bottom 0. No solid fronds, reeds, birds or skiffs. |
| `app/components/gameEgyptWorld.ts` | `8275b9bef82d57b5a289a1ede2d9526a1b22c223` | `createAncientEgyptColliders()` adds these trunks to the existing static `EGYPT_COLLISION_INDEX`. All previous pyramid, palace/market, dock, portal and original palm solids remain. The physics stays active even when visual LOD culls a distant palm. |
| `scripts/game-egypt-long-nile-palm-solids-smoke.mjs` **new** | `5c590cfca2c3c8206c84f10e515723ee8f724794` | Native regression script loads real TypeScript game modules with the repository's `typescript` devDependency and asserts 64 geometry/index matches, bank clearance, blocked on-foot movement, unobstructed above-canopy flight, descending roof landing and cross-world integration markers. |

**Behavior:** Before this shift, Bot B's 64 visually solid-looking long-Nile date palms could be walked or flown through because the new outer oasis trunks were not in Egypt's collision index. After this shift, their trunks are solid for walking and low-altitude flight and can be landed on from above; high-altitude flight remains unrestricted. These are axis-aligned collision volumes matching Bot B's box-drawn trunks, not true circular mesh colliders. **No new visuals** or boat physics were added.

## Verification and evidence

- **PASS, GitHub compare:** from Bot B starting SHA, exactly **3 game-only paths** changed (2 new, 1 modified) before documentation; no `SharedGameLobby.tsx`, page/layout, non-game files or other-world changes.
- **PASS, 394 source-executed V8 checks:** executed the **actual GitHub-fetched** Bot B palm array, newly committed collider helper, and existing `resolveHorizontalGameMovement` / `resolveVerticalGameMovement` function bodies after removing TypeScript-only annotations. All 64 trunks match visual X/Z/width/height, lie beyond central ±520 but within ±1700, leave the Nile river channel clear, block ground traversal, allow above-canopy flight and support downward landing. Source checks verified static index wiring and existing Moses/Nabawi/Belt Boyz/Rome/Egypt lobby anchors.
- **PENDING:** Vercel preview build status for `5c590cf` was `pending` when checked. **Do not claim build success yet.** No preview deployment was requested; automatic branch CI is not production.
- **NOT RUN:** committed native Node smoke, local Next.js/TypeScript build, actual browser/mobile walking/flying/FPS, multiplayer and server-authoritative combat. V8 checks use real function bodies but an array collision source, not the full runtime spatial-index path; the committed native smoke covers the index.
- **Known risks:** AABB approximation may feel square at tree corners; visual tree LOD at 150m may hide a trunk while physics remains active at distance (by design). Bot B's palms are on dry banks; they do not collide with the river channel. Any future visual palm relocation/scale change must be reflected by this shared data-driven helper. Collision performance on a phone is unmeasured.

## Per-world status and ownership

| World | Status this shift | Outstanding |
| --- | --- | --- |
| **Ancient Egypt / long Nile** | **Changed:** 64 outer-oasis palm trunks are now static solids, preserving Bot B's scenery, 3,400-unit river corridor, Great Pyramid, market, palace and return portal | Native smoke/build, walking/landing on real device, river seams at ±520, boat steering/swimming, riverbank navigation |
| Moses / Parted Sea | Preserved unchanged | Verify departure-side Egypt portal with browser movement |
| Rome / Jerusalem | Preserved arena/cats/lion helper unchanged | Ground-only hostile lion with five authoritative hits and 300s respawn, live combat/network tests |
| RealMecca / Hajj / Madinah / Nabawi | Preserved unchanged | Sacred-zone and pilgrim-path tests, ten enterable mosque goal |
| Jurassic | Preserved unchanged | Cave/terrain solidity and mobile LOD |
| Future City / RealMecca concept | Preserved unchanged | Tall building flight/landing and spatial voice |
| Space / Moon / Blessed Chambers | Preserved unchanged | High-altitude flight and space-transition regression |
| Today / Belt Boyz / XP store | Preserved unchanged, including roofless office | Meeting Exit restoration, raise hand, authoritative Hyper Defense shield, blaster/XP checks |

## Dependencies, integration, rollback, next shift

- **Dependencies:** no new runtime dependencies. Native smoke uses existing `typescript` devDependency.
- **Integration:** fetch current main, frozen preview and production refs again before any future integration. Cherry-pick **only** `b50c95f` (new helper) and `8275b9b` (three-line Egypt-only integration), optionally `5c590cf` (smoke), onto the site's then-current game integration branch. Bot B's visual helper must already be present. Do **not** merge/copy entire `SharedGameLobby.tsx`, page/layout or stale site code.
- **Rollback:** revert `8275b9b` to remove palm collision wiring; remove `b50c95f` helper if no longer referenced. Keep Bot B scenery and all prior Egypt colliders.
- **Bot B handoff:** 64 existing palms now have data-derived trunk colliders. Please preserve `LONG_NILE_OASIS_PALMS` X/Z/height or coordinate any redesign; fronds, reeds, herons and skiffs remain visual-only. No edit to your scene helper this shift.
- **Next Bot A:** check automatic preview status, run native Node smoke/Next.js build in a checkout, physically test walking/flying/landing and river seams, then progress authoritative lion/shield/projectile systems with actual server validation. Do not claim multiplayer authority without evidence.
- **Next Bot B:** continue river settlement/shoreline/era-appropriate life visuals in separate branch, preserving physics coordinates and existing game worlds.

**No production deployment, merge, or mutation of main/frozen preview.**
