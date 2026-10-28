# Bot A — Nile bank collision/visual alignment and Great Pyramid arrival heading

**2026-10-27 · 20:04–20:07 CDT (America/Chicago)** · Game Bot A / World Engine · game-only preview work · **no production/main/frozen-preview deployment or merge**.

## Baseline and coordination

| Check | Verified |
| --- | --- |
| Protected frozen preview | `fix/profile-scroll-match-umma-20261027` @ `c856491131bb0c8056693652f8e5e58a26836831`; `app/page.tsx` blob `92ca9b508378fd462ae3cf8a1458d2d4467aeb56`. |
| Main (read only) | `main` @ `c043219f7a3eeb8e1529538013e97f311a3b938a`; site/feed code diverges, **do not copy an older app page**. |
| Starting game source | Bot B `game/living-worlds-egypt-pyramid-approach-20261027-1930` @ `b5809dd356ccabe74ca34855ad3d280821272c9d`, retaining Bot A's roof-edge fix, emerald shield/audio, all Moses↔Egypt portals, Hajj/Nabawi, Jurassic/Future/Space and roofless Belt Boyz office. |
| Other shift reviewed | Bot B's [Great Pyramid approach handoff](2026-10-27-egypt-great-pyramid-approach-1930.md), the [roof-edge physics handoff](2026-10-27-roof-edge-release-1900.md) and [coordination issue #126](https://github.com/ElmiandCo/1Muslim/issues/126). |
| Dedicated branch | `game/world-engine-egypt-banks-arrival-20261027-2000`, forked from exact Bot B SHA above. |

## Implemented code (not merely planned)

1. **`app/components/gameEgyptWorld.ts`** — corrected the *rendered* Nile bank to match the existing continuous `egyptTerrainFloor(x,z)` physical slope. Before: flat 0m-height desert boxes extended 3m into the 6m sloped bank, concealing the player's lower body and disagreeing with the collision floor by as much as 0.5m. After: sand stops at the outer dry-bank boundary, and three 2m-wide, height-sampled terraces per side appear only when the Nile is close to the camera. Farther strips use one 6m-wide terrace per bank for LOD. The actual terrain-floor function, water depth, collision index, river centerline, portal positions and all world geometry remain unchanged. Added `EGYPT_GREAT_PYRAMID_ARRIVAL_YAW` calculated from the original Egypt spawn to the existing Great Pyramid (`EGYPT_PYRAMIDS[0]`), rather than hardcoding a new camera direction.
2. **`app/components/SharedGameLobby.tsx`** — *two narrow substitutions only*: import the new arrival heading and apply it to `enterEgyptWorld()` so a player arriving through Moses's portal immediately faces the Great Pyramid. No site UI, feed/profile/Quran/GoLive, meeting, shield, combat or shared physics code changed. Preserve this one-line edit when Bot B later touches the meeting UI.
3. **`scripts/game-egypt-integration-smoke.mjs`** — added direct bank slope boundary and linearity assertions, verifies rendered terrace tops match the real floor function, checks near-vs-far terrain LOD and mobile draw budget, and asserts arrival camera wiring.

**Implementation commits:** `d832435f` (terrain rendering and heading), `d2f020e8` (portal heading hookup), `8152a545` (smoke assertions).

## Verified vs outstanding

- **PASS: 1,613 V8 assertions** on the *actual GitHub-fetched function bodies*, with only TypeScript parameter type annotations removed. Tested riverbank height continuity at multiple world positions, finite positive draw primitives, every terrace top against the real terrain floor, near/far LOD, and spawn heading wiring. These are executed JS checks, **not** the native Node/Next.js build.
- **Observed draw counts** for `renderAncientEgyptTerrain`: Egypt spawn **130**, near Nile bank **182**, high-altitude view **300**, out-of-bounds view **0**; all under the 400-primitive test budget. Near-river bank terraces **102**, spawn-view terraces **50**.
- **PASS: GitHub compare** from Bot B's starting SHA shows exactly three changed game/test paths above: `gameEgyptWorld.ts` (+20/-3), `SharedGameLobby.tsx` (+2/-2), Egypt integration smoke (+36/-2). No other app paths touched. The protected `app/page.tsx` blob remains `92ca9b5`.
- **Preview build:** Vercel non-production deployment `dpl_G5LxNcXCxPZSjz4zvZGneNrqi9yg` for implementation/test SHA `8152a545` at https://1muslim-4scuvq3cg-elmiandco.vercel.app — status **INITIALIZING at creation**; verify READY and logs separately before claiming a successful full build.
- **Still unverified:** native `node scripts/game-egypt-integration-smoke.mjs` in a checked-out repository; physical iPhone/Android visual placement, FPS, portal traversal, camera framing, Nile swimming, and server-authoritative multiplayer shield. Do not claim those are complete.

## World-by-world preservation

| World | Status / next action |
| --- | --- |
| **Ancient Egypt** | **This shift:** visible Nile banks align with physical slope near players; Great Pyramid becomes arrival camera focal point. Existing Bot B 65 visual approach tiles, Nile boats, palms, village, 74 scenery solids, ramps, scaffolds and return portal untouched. Next: mobile visual walkthrough, riverbank descent and ramp landing. |
| Moses / Parted Sea | Origin arch and reciprocal Egypt portal preserved; physically traverse both on device. |
| Jurassic | Existing dinosaurs, caves, swept physics and ambient wildlife preserved; device collision checks pending. |
| Future / RealMecca | Futuristic roads, towers, skyways, boost/flight and collision index preserved; test high-altitude landing. |
| Makkah / Madinah / Nabawi | Seven-circuit Hajj NPCs, Safa–Marwa and Nabawi prayer congregations preserved; visual review pending. |
| Roman Judea / Jerusalem | Existing Roman market/settlement and collision preserved; historical scenes remain interpretive. |
| Space / Moon / Blessed Chambers | Ship, lunar EVA and research world preserved. |
| Today / Belt Boyz / Meeting | Roofless Belt Boyz office preserved; user-requested generic **Meeting** label, compact settings and **Exit Meeting** still need separate verified implementation. |
| Hyper Defense | Existing 10-second client-side protection, 3-second fade and emerald aura/audio preserved. **NOT server-authoritative**; must not claim cheat-resistant multiplayer defense. |

## Integration / rollback / handoff

- **No dependencies added.** No production deployment, main merge, or protected preview edits.
- **Selective integration only:** re-fetch current site branch and compare layout contracts; transplant/cherry-pick `d832435f`, `d2f020e8` and optional smoke `8152a545` into the then-current *game* modules, reviewing the two-line `SharedGameLobby.tsx` hunk. **Never merge the full historical branch** or overwrite `app/page.tsx`, layout, profile, feed, Quran or GoLive.
- **Rollback:** revert these three game/test commits on an integration branch; previous Nile bank visuals and default north-facing Egypt arrival return without affecting the world portal or colliders.
- **Bot B:** Keep ownership of Egypt visual scene/NPCs/river/palms, meeting controls, and shield aura/audio. This shift intentionally did **not** edit `AncientEgyptRiverScene.ts` or meeting UI. Check visual approach tile visibility at the new bank transition; preserve the new `EGYPT_GREAT_PYRAMID_ARRIVAL_YAW` import/assignment when changing shared lobby.
- **Next Bot A:** run native smoke and device test; improve terrain/portal edge cases or server-authoritative combat only after inspecting actual backend code. Do not make speculative server-side shield claims. Continue preserving every world.
