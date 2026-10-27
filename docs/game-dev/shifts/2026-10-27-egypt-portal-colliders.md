# Bot A / World Engine — Moses ↔ Ancient Egypt portal, Nile terrain and stepped solids
**2026-10-27 16:02–16:07 CDT (America/Chicago)** · game-only shift · **NO production merge or deployment**

## Starting point, site safety and cross-shift coordination
- **Protected preview baseline:** `fix/profile-scroll-match-umma-20261027` @ `c856491131bb0c8056693652f8e5e58a26836831`.
- **Actual game-code starting point:** Bot A `game/world-engine-3d-side-sweep-20261027-1500` @ `f86963e36b3d1d23388d49ea319ebed97c30ddd9`, descendant of the protected baseline. This preserves Bot A's 3D swept collisions, ordinary flight, Hajj/Nabawi, Moses, Roman Judea, lunar research and the Belt Boyz meeting area.
- **Bot B handoff reviewed first:** `game/living-worlds-ancient-egypt-riverlife-20261027-1530` @ `d9c84d2`; isolated scene implementation `f9e8b78`, test `81df85b`, detailed [Egypt handoff](https://github.com/ElmiandCo/1Muslim/blob/game/living-worlds-ancient-egypt-riverlife-20261027-1530/docs/game-dev/shifts/2026-10-27-ancient-egypt-riverlife.md), [coordination issue #126](https://github.com/ElmiandCo/1Muslim/issues/126). **Only** its two new game files were selectively copied; its older baseline and site files were not merged.
- **Read-only main/production at shift start:** `main` @ `82eddbf7a5a94fa5968550be2bd335a4aa46f823`. Compared against protected preview: they diverge in newer site/feed/profile and community-post files. No site layout contract was changed; the existing two-nav, posting, profile-scroll, Qur'an, GoLive and app pages must remain untouched.
- **Dedicated branch:** `game/world-engine-egypt-portal-colliders-20261027-1600`. Initial implementation/test head `d1de8e48ab053078f9a179dd6639ef1721167036`; safety follow-ups `f43e0a4` (Moses re-entry grace period) and `55e07d9` (correctly facing return arch). Later log-only commits advance the branch. No write to `main`, frozen production, or protected preview.

## Exact changed paths and implementation
| Path | What changed, before → after |
| --- | --- |
| `app/components/AncientEgyptRiverScene.ts` | **NEW**, copied byte-for-byte from Bot B's `f9e8b78` scene. Nile water, green banks/reeds, 54 palm candidates, 22 faceless limestone carriers, 4 boats, 12 birds, 3 staged construction pyramids, scaffolding/ramps, settlement huts, docks, and scene-local LOD. Bot B owns future refinement. |
| `app/components/gameEgyptWorld.ts` | **NEW**, Bot A. Exports `MOSES_TO_EGYPT_PORTAL`, `EGYPT_TO_MOSES_PORTAL`, `EGYPT_MOSES_RETURN`, `MOSES_PORTAL_COLLIDERS`, `EGYPT_COLLIDERS`, `EGYPT_COLLISION_INDEX`, `egyptTerrainFloor`, `renderAncientEgyptTerrain`, `renderAncientEgyptReturnPortal`, `createAncientEgyptColliders`. Implements permanent collider index independent of visual LOD, accurately stepped pyramid tiers and ramp segments, palm trunks, six scaffold posts plus beams, limestone stacks, open-door hut wall/roof decomposition, dock platforms, portal supports and lintels. 44 longitudinal terrain segments cover continuous sandy banks, with a lower shallow riverbed and distant Nile water silhouette. |
| `app/components/SharedGameLobby.tsx` | **Targeted game-only wiring**, no replacement. Adds independent Egypt ref/state, enter/return/exit handlers, 2.5s portal cooldown, positive-Z Moses arch trigger (fleeing FROM Egypt) and Egypt return arch. Keeps existing Moses NPC state across a portal round trip; uses unique `p.world="Ancient Egypt"` for presence. Selects Egypt bounds, indexed collision, riverbed floor, render dispatch and atmosphere; excludes Egypt from Today-only worker/shop/animal/bridge/picker behavior; retains existing worlds, Hajj, Nabawi, office, flight and all original UI. Main-lobby return control works from Egypt. |
| `app/components/PartedSeaScene.ts` | **Two-line targeted arch styling**: near positive-Z Egyptian-origin arch is warm amber, far Sinai arch stays teal/reserved. Existing crossing, nine refuge colliders, pursuit NPCs and sea walls untouched. |
| `scripts/game-ancient-egypt-smoke.mjs` | **NEW**, Bot B's original deterministic geometry/LOD smoke test copied byte-for-byte. |
| `scripts/game-egypt-integration-smoke.mjs` | **NEW**, Bot A executable Node/TypeScript-transpile smoke: real module logic for portal placement, return distance, palm solidity, stepped pyramid landings, enterable hut doors and roofs, riverbed, bounded terrain draws and preservation markers. |
| `docs/game-dev/shifts/2026-10-27-egypt-portal-colliders.md` and `docs/game-dev/SHIFT_LOG.md` | **Game-only handoff**, this note and cumulative index. |

**Implementation commits:** `b002c78` / `e5a4179` (selective Bot B scene and test); `ea4a897` (new physics/terrain module); `cdcd087` (portal state); `72bceb6` (movement, render and collision wiring); `2cf04bb` (distinct Moses arch); `d1de8e4` (integration smoke); `f43e0a4` (safe re-entry); `55e07d9` (gateway orientation). All on the dedicated game branch.

## Exact portal behavior
1. Choose **Time of Moses** in the existing game universe selector. The Parted Sea remains a separate, 2,743m-long crossing with its own NPCs and physics.
2. Head **toward positive Z** to the amber arch at `(0,-14)`, the direction travelers are fleeing **from**. Enter within six world units while below eight units altitude to teleport to **Ancient Egypt**, spawning at `(-28,2,120)`.
3. Egypt is a **separate** scene/world; explore the Nile and pyramid-construction district. The turquoise return arch at `(-28,170)` leads back to the sea at `(0,1,-48)`, safely away from the original arch to avoid instant bounce. Returning players receive 3.5 seconds of Moses NPC invulnerability.
4. The existing main-lobby Earth control exits Egypt directly to Today. The far Parted Sea/Sinai arch is visually preserved but **not** repurposed.
5. Historical caution: the Egypt construction scene is an **artistic interpretation**, not a claim that pyramids were being built in Moses's lifetime; no prophets depicted.

## Verification performed and limitations
| Check | Result / evidence |
| --- | --- |
| GitHub exact baseline diff | **PASS:** branch ahead of A by seven implementation/test commits, zero behind; six changed game/test paths, no app page, feed, profile, Quran, GoLive, CSS, production, or main edits. |
| Connector-side source assertions | **PASS:** confirmed actual current branch contains portal triggers, independent Egypt world, terrain, collision index, render, reciprocal return, and preserved Moses, Hajj, Nabawi, Jurassic, Future, Roman, Council/meeting source markers. Static checks only, not playtest. |
| Bot B original scene assertions | Prior B reported 510 direct V8 assertions; this shift **did not rerun** them. Original source copied byte-for-byte. |
| New Node smoke scripts | **COMMITTED, NOT YET RUN** in full checkout. Run `node scripts/game-ancient-egypt-smoke.mjs` and `node scripts/game-egypt-integration-smoke.mjs` with project dependencies installed. |
| Next.js/Vercel preview build | **PASS for implementation/test commit `d1de8e4`:** Vercel non-production preview `dpl_9UGKbgBN97R7bff1xYXidMfKzzGS` reached **READY** after Next.js 15.5.26 compilation and build completion (~46s). Build emitted pre-existing CSS autoprefixer/webpack cache warnings. This does **not** execute the two Node smoke scripts or prove in-browser portal traversal. Two later game-only safety fixes are pending their own preview status. |
| Device/WebGL and multiplayer | **NOT VERIFIED:** no real mobile/desktop portal walkthrough, collision stress, actual FPS, network presence or live boat interactions. |
| Performance | Scene-local B LOD retained. A terrain uses max 44 Z strips × 3–4 cubes, culled by player Z/altitude; immutable collider index avoids per-frame rebuild. **No GPU/mobile benchmark**. |
| Known gameplay limits | River is shallow-wading terrain, **not swimming/boat boarding**. Workers/boats/birds are visual NPCs. Pyramid ramps are solid stepped boxes (not smooth slopes); high-speed boosted traversals and seam edges need in-game testing. Portal trigger is proximity + altitude; no touch-to-enter UI. |

## World-by-world handoff
| World | Status this shift | Next test / owner |
| --- | --- | --- |
| **Ancient Egypt** | **New playable-wiring code** for separate scene, Nile banks, return arch, solid palm/pyramid/house/ramps and LOD. Actual browser traversal pending. | Bot B: unloading, settlements, ambient life; Bot A: mobile physics/river seam and portal test. |
| **Moses / Parted Sea** | Positive-Z Egyptian-origin portal wired; existing crossing/NPCs/refuges preserved. Sinai exit unchanged. | Walk both portals; check NPC state resumes and arch collision. |
| **Jurassic** | Unchanged module and physics. | Preserve Jurassic river ecology branch; cave solids/device test. |
| **Future / RealMecca** | Unchanged towers, skyways, collision index and Future world selection. | Preserve separate Future gardens branch. |
| **Muhammad ﷺ era / Makkah–Madinah / Nabawi** | Hajj and congregation helpers, prayer area and existing portal untouched. | Mobile pilgrimage/prayer path checks; no sacred depictions. |
| **Roman Judea / Jerusalem / Rome** | Unchanged renderer, two-city portal, static index. | Preserve Bot B market-life branch separately. |
| **Space / Moon / ship / EVA** | Unchanged dedicated physics and lunar research scene. | High-altitude stars, descend control and real-device testing. |
| **Today / Belt Boyz / XP Store** | Existing world and roofless Council/meeting preserved; no non-game app edits. | Regression walk, solid roofs, weapon/voice and shop checks. |

## Dependencies, selective integration and rollback
- **No new runtime dependencies, database changes, site layout files or API routes.** New Node smoke uses existing `typescript` devDependency.
- **Do not merge this full branch into the then-current site.** First fetch fresh main/production/site integration head and inspect frozen two-nav/profile/feed/Quran/GoLive contracts. Cherry-pick or transplant only the new Egypt scene, `gameEgyptWorld.ts`, the narrowly reviewed `PartedSeaScene.ts` arch line and the targeted `SharedGameLobby.tsx` Egypt-only hunks. Preserve all newer game/site features; reconcile any lobby conflicts manually. Include smoke scripts as optional game-only tests.
- **Rollback:** remove Egypt imports/refs/handlers, bounds/collision/render dispatch and portal triggers from lobby; revert the arch tint; remove the two Egypt modules and tests. Do not revert entire app pages or site layout. Previous A commit `f86963e` is a known intact game starting point.
- **Next Bot A:** verify final preview build and execute both Node smoke tests in a checkout, then real desktop/mobile portal and riverbank tests; inspect ramp/collider seams, high-altitude return, and add robust 3D starfield/fast descend control without changing Moon/EVA. Coordinate with Bot B's next Egypt scene work via issue #126.
- **Next Bot B:** continue Nile unloading/ambient NPCs/palms in the isolated `AncientEgyptRiverScene.ts`; do not replace A's new portal/collision integration. If editing shared lobby, first inspect this branch and use minimal targeted hunks.

**No production promotion, main merge, or protected-preview changes were made.**
