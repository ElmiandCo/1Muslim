# Bot B — Ancient Egypt Great Pyramid approach and construction atmosphere

**2026-10-27 · 19:26–19:36 CDT (America/Chicago)** · Game Bot B / Living Worlds · **game-only development** · **NO production, main, or frozen-preview merge**.

## Baseline / no-regression audit

| Item | Verified source |
| --- | --- |
| Protected frozen preview | `fix/profile-scroll-match-umma-20261027` @ `c856491131bb0c8056693652f8e5e58a26836831`; `app/page.tsx` blob `92ca9b508378fd462ae3cf8a1458d2d4467aeb56`. |
| Main / current site (read-only) | `main` @ `c043219f7a3eeb8e1529538013e97f311a3b938a`; `app/page.tsx` blob `b066f01c810fe5fcfa58db09b426383e2e3c9797`. Main and frozen preview **diverged** in site/feed/profile code; do not merge old page/layout. |
| Actual starting GAME source | Bot A `game/world-engine-ledge-release-20261027-1900` @ `e488164b0f71c3409cdb62a88735b489f0436884`, which retains Bot B's shield aura, Egypt village, Nile docks, Moses↔Egypt portal and all worlds. |
| Working branch | `game/living-worlds-egypt-pyramid-approach-20261027-1930`, implementation `77124efe2cbb6433642732ab9f40fa3370f5638d`, smoke update `31c583d3b09d76ffb670309de346a5f3fc700cf5`; documentation commits follow. |
| Other-shift handoff reviewed | [Bot A roof/ceiling edge release](2026-10-27-roof-edge-release-1900.md), [Bot B shield aura](2026-10-27-hyper-shield-aura-1830.md), [Bot B Egypt village](2026-10-27-egypt-village-1730.md), [coordination issue #126](https://github.com/ElmiandCo/1Muslim/issues/126). |

## Implemented this shift (not merely planned)

**Exact implementation paths:**
1. `app/components/AncientEgyptRiverScene.ts` — added `EGYPT_GREAT_PYRAMID`, `EGYPT_GREAT_APPROACH_ROUTES`, `EGYPT_GREAT_APPROACH_TILES`, and two LOD-culling render blocks in `renderAncientEgyptRiverLife`. **Before:** largest pyramid was present, but there was no coherent visual route tying its worksite to the Nile quay and player approach. **After:** 65 thin, visual-only sandstone approach tiles across three deterministic routes (Nile limestone supply, southern arrival, western yard), near-only subtle stone-wear accents, 18 shallow limestone course lines on the Great Pyramid's existing faces, and eight low-opacity moving construction dust puffs. No pyramid relocation, portal change, water/terrain physics change or new colliders.
2. `scripts/game-ancient-egypt-smoke.mjs` — expanded source smoke checks for exact Great Pyramid identity, 65 bounded tiles, finite sizes, world bounds, no tile overlapping the Great Pyramid collider, dry-bank Nile delivery, five close camera draw budgets and unchanged solid count.

**Geometry contract:** Existing pyramid footprint, height, stages and `ancientEgyptSolidProps()` are unchanged. New approach tiles are low-height ground overlays, not solid roads. Nile, dock, palm and construction footprints remain where Bot A's portal/terrain physics expects them. The visual paths **do not imply** historically verified pyramid building in Moses's era.

**Performance:** 65 approach tiles total, individually culled at 105 units; secondary stone wear at 48 units; 18 pyramid course accent draws within 175 units; eight dust draws within 110 units. No new audio, network, textures, dynamic physics, dependencies or NPC instances.

## Verification

- **PASS:** 6,158 assertions executing the **actual fetched source and full committed Egypt smoke script** in V8 after removing only TypeScript annotations and replacing Node's assertion import with an equivalent assertion function. This includes existing river, palms, boats, village, docks and workers checks plus new Great Pyramid tests. This is behavior-level JS verification, not a native Node checkout or TypeScript compiler run.
- **PASS:** 2,552 focused runtime checks of actual fetched scene helper. Representative primitive draw counts: Great Pyramid **269**, eastern work route **254**, southern route **202**, western route **210**, Nile dock route **259**, far-off view **0**; all under the existing 1,000-draw scene smoke budget. Existing scene solid descriptor count remains **74**.
- **PASS:** GitHub compare from starting Bot A SHA shows exactly **two game/test implementation paths**, no app page/layout/profile/feed/Quran/GoLive/physics changes.
- **Preview build:** Non-production Vercel build `dpl_PP2EZAmq7FbirVtFWTsfp6eskpWf` at `31c583d3` — [preview](https://1muslim-6kxbwi54e-elmiandco.vercel.app); **building at time of note**. Do not count this as passed until READY is verified.
- **Not verified:** actual iPhone/Android FPS, real WebGL visuals, full native Node smoke in an authenticated checkout, or multiplayer authoritative damage. No claims of shield server enforcement.

## World-by-world preservation / progress

| World | Current state / next slice |
| --- | --- |
| **Ancient Egypt** | **This shift:** Great Pyramid limestone face detail and three visual approaches; existing Nile, limestone boats, dock crews, 54 candidate palms, porters, crop plots, settlements and construction workers retained. **Next:** Bot A to verify approach versus solid terrain and pyramid camera framing; mobile device visual check. |
| Moses / Parted Sea | Existing Egypt-origin portal and return unchanged. Next: verify both directions and bank solidity. |
| Jurassic | Existing dinosaurs, caves, riverlife and swept collision unchanged. Next Bot B slice: layered forest/ambient wildlife LOD. |
| Future / RealMecca | Existing futuristic towers and gardens unchanged. Next: distinct ambient street life with LOD. |
| Makkah / Madinah / Nabawi | Hajj seven-circuit/Safa–Marwa and Nabawi congregations preserved; next: respectful congregational animation verification. |
| Roman Judea / Jerusalem / Jesus-era | Existing Roman settlement and market preserved; historical scenes remain interpretive, not factual reenactments. Next: market props and ambience. |
| Space / Moon / Blessed Chambers | Ship, lunar EVA and research scene unchanged; next: low-cost environment detail. |
| Today / Belt Boyz / Meeting | Roofless Belt Boyz office unchanged; meeting label/compact UI/Exit Meeting still pending and owned by Bot A/shared game UI unless separately coordinated. |
| Hyper Defense | Bot A's 10s local protection and Bot B emerald sphere/audio retained. **Multiplayer shield is not server-authoritative.** |

## Dependencies, selective integration, rollback and next-shift TODO

- **No new dependencies.** No change to shared lobby, physics, LOD index, portals, meeting UI or page components.
- **Bot A ownership:** world/portal geometry, solid terrain/road/riverbank, physics and progressive LOD; Bot B owns Egypt visuals/NPCs/river/palms. New visual ground lanes require Bot A's later terrain-height/collision review before integration.
- **Integration:** at integration time re-fetch current site branch, compare frozen layout, and cherry-pick **only** `77124efe2cbb6433642732ab9f40fa3370f5638d` and optional smoke commit `31c583d3b09d76ffb670309de346a5f3fc700cf5`, or apply the exact Egypt-scene hunk to newest game module. Do **not** merge this full old-layout-descended branch or copy `app/page.tsx`.
- **Rollback:** revert implementation commit `77124efe` on a future integration branch; this restores previous Egypt visuals without touching portals/collision or any other world.
- **Next Bot B shift:** review Bot A's next handoff, verify Great Pyramid sightline and scene draw calls on mobile, then move to another underdeveloped existing world (Jurassic/Roman/Future) with one verified scenery/NPC slice. Keep world progress table current. Avoid touching shared game engine while Bot A edits it.
- **No production deployment or main merge.** A preview build is for validation only.
