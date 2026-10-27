# Game Bot B — Living Worlds: lunar research ambience (2026-10-27, 13:28–13:32 CDT)

> **Scope:** game-only Moon / Space visual slice. **No production deployment, no main merge, no website/layout changes.** This is an artistic lunar settlement, not a claim about a real mission. Moon exterior is silent in a vacuum; no inappropriate exterior ambient audio was introduced.

## Identity, provenance and protected contracts

| Item | Verified value |
| --- | --- |
| Shift / timezone | Bot B — Living Worlds; 2026-10-27 13:28–13:32 CDT (America/Chicago; UTC−05:00) |
| Protected original preview baseline | `fix/profile-scroll-match-umma-20261027` @ `c856491131bb0c8056693652f8e5e58a26836831` |
| Actual GAME-code source (Bot A's newest verified branch) | `game/world-engine-today-collision-cache-20261027-1300` @ `b2d00b2e1e0d1a1b7f4f866f86bd11c6f3273b4b` |
| Dedicated working branch | `game/living-worlds-lunar-research-20261027-1330` |
| Implementation commits | `41a98e0b8179ccd9fa7d9d274aa00d93cf66a6a6` (new scene), `2496c3b21ac506bd32b557f13f557518cbb19c6c` (two-line lobby wiring) |
| Test commits / preview SHA | `f27e436d9ab8288716c813052b15c2d1b17a0278` (smoke), `3d11009b253a386b62a39f13537aaf00a22c323f` (test threshold correction); Vercel preview built this exact SHA |
| Current main and production at start (read-only) | `main` @ `21119c711beda86de3f7766b18bdb0e1c39028d0`; Vercel production `dpl_3KxxhG8pRxuy64rN4D1Jn9jzgPHy` **READY** on same SHA |
| Site layout contract | `app/page.tsx` blob `92ca9b5` and `SharedGameLobby.module.css` blob `952bdfc` match current main, frozen preview and A branch. `CanvasSecondaryApp.tsx` differs between site and preview; untouched. Main/preview are diverged, so full branch merging is forbidden. |
| Other shift reviewed | Bot A 13:00 cached Today collision handoff in `SHIFT_LOG.md`; Bot B 12:27 Roman market life on `game/living-worlds-roman-market-life-20261027-1227` @ `d0acda004c271fd0623dd344a1bbaf3411d342f5`; issue #126 |
| Exact changed paths | `app/components/LunarResearchScene.ts` (new), `app/components/SharedGameLobby.tsx` (2 inserted lines: import + render call), `scripts/game-lunar-research-smoke.mjs` (new), `docs/game-dev/shifts/2026-10-27-lunar-research.md` and `docs/game-dev/SHIFT_LOG.md` (documentation only) |
| Forbidden paths | **None touched**: no app page, CSS, feed, profile, navigation, Quran, GoLive, Supabase, main, frozen production or Bot A physics modules |

## Before → after (implemented, not merely proposed)

**Before:** The existing Moon landing mode already drew the lunar ground, 75 scattered rocks, three settlement domes, lander/pad, crater rims, rooftop observatory, constellation stars and meteor trails. The independent ship / EVA / lunar gravity movement was functional in the game branch. There were no separate, nearby solar research arrays, illuminated footpath markers, or autonomous lunar survey rovers in the renderer.

**After:** `LunarResearchScene.ts` adds `renderLunarResearchLife(draw, now, playerX, playerZ)` to that **existing** Moon render branch only. It contributes:
- **Four anchored, sun-tracking solar arrays** at the outskirts of the existing settlement; each has a footing, mast, gold pivot, twin dark-blue photovoltaic panels and cyan panel highlights. Tracking motion is deterministic and very slow.
- **Eight gently pulsing cyan approach beacons** flanking the route between the lander and existing observatory; the lights are small, low to the ground and do not block walking.
- **Two animated, wheeled survey rovers** on separate remote elliptical loops, with four wheels, a raised sensor mast, a scanning dish and a blinking forward lamp. These are stylized autonomous props, **not** simulated physical vehicles.
- **Render-only mobile LOD**: cheap axis-aligned distance tests skip solar equipment beyond 130 game units, beacons beyond 75, and rovers beyond 100. No new textures, external assets, React state, timers, audio, network requests, or dependencies.
- **One isolated Moon-only invocation** in `SharedGameLobby.tsx` just before its pre-existing lunar starfield; the same shared WebGL draw function is reused. Ship flight, Moon gravity, lunar terrain, original observatory and crater geometry, and Bot A's collision source are unchanged.

**Known limitations:** New equipment is decorative/non-solid. Rovers can overlap a player or scattered lunar rocks until Bot A adds a low-cost dynamic collider or movement avoidance. The existing Moon landing/ship controls, camera and terrain were not changed. Physical device FPS, visual polish and multiplayer behavior remain unverified. This shift did not add lunar audio (appropriate to a vacuum), nor did it establish a separate Blessed Chambers world module.

## Verification evidence

| Check | Result |
| --- | --- |
| GitHub diff vs exact A source SHA | **PASS**: only `LunarResearchScene.ts`, two insertions in `SharedGameLobby.tsx`, and new lunar smoke script before docs; 0 deletions in lobby; no non-game code |
| Reproducible new test, **actually executed** | **PASS**: `node scripts/game-lunar-research-smoke.mjs` on Vercel sandbox checkout of exact SHA `3d11009`; tests actual TypeScript-transpiled helper, near/far culling, draw budget, finite RGB/geometry, deterministic animation, Moon-only wiring and other-world source markers |
| Bot A engine regression smoke, **actually executed** | **PASS**: `node scripts/game-physics-smoke.mjs` (23 legacy assertions + 288 indexed collision parity cases + 4 index edges); `node scripts/game-flight-pose-smoke.mjs` (16 assertions); `node scripts/game-today-collision-smoke.mjs` (192 parity cases, 251 Today statics, 80 props, 122 historical solids) |
| Bot B world regression smoke, **actually executed** | **PASS**: `node scripts/game-moses-smoke.mjs`; `node scripts/game-roman-smoke.mjs` (17 static checks, world wiring and portal clearance) |
| Full Next.js non-production preview build | **PASS / READY**: Vercel deployment `dpl_BSn45gudks1bx4BANhaos4kEyRBX` on SHA `3d11009`, [preview](https://1muslim-g68d6rf0g-elmiandco.vercel.app). Build events include `Build Completed` and `Deployment completed`. |
| Real iPhone / Android FPS and game traversal | **NOT TESTED**. Requires actual device testing; no measured FPS claim. |
| Production/main | **UNCHANGED**; only a non-production preview was built |

**Sandbox detail:** Temporary non-persistent Vercel sandbox `game-b-lunar-smoke-20261027-1330` checked out exact commit SHA. It installed TypeScript only into a temporary test directory and symlinked it locally for smoke execution; no package lock or GitHub file changed.

## World-by-world progress and next checks

| World / mode | Current branch evidence | This shift / next task |
| --- | --- | --- |
| **Moon / Space / ship / EVA** | Existing lander, domes, observatory, crater rims, ship launch/orbit, EVA and lunar gravity | **THIS SHIFT IMPLEMENTED** arrays + beacons + rovers + LOD. Next: device test, survey rover collision avoidance and rover sound only in pressurized cabin, not lunar exterior |
| **Today / Belt Boyz / five satellite districts** | Bot A's cached 251 static Today colliders + 80 destructible props, existing roofless office/meeting logic and portals | **Preserved**. Visually verify office roof/meeting in device test; no geometry change |
| **Moses / Parted Sea** | Recovered 2,743m crossing, walls, fish shoals, NPCs, combat, refuges, selector integration | **Preserved**, smoke passed; device traversal and FPS pending |
| **Roman Judea / Jerusalem / Rome / Jesus-era** | Restored scene, two-city portal, olive groves, indexed colliders | **Preserved**. Bot B's *newer market traders and birds* (`f66c6a7`) are **on a separate B branch**, not in this A-based branch; selectively integrate later without replacing A's lobby |
| **Jurassic** | Existing dinosaurs, river, Apex cave, tree/cave colliders | **Preserved**. B's 180 ferns/28 dragonflies (`e05ef735`) remain a separate scene-only patch for review |
| **Future / RealMecca concept** | Existing towers, skyways, futuristic traffic and collision | **Preserved**. B's six gardens/42 flowers/six pollinators (`afe199c`) remain separate; integrate scene-only |
| **Muhammad ﷺ era / Makkah–Madinah / Masjid an-Nabawi** | Existing interpretive historical scene, Kaaba, Madinah, Nabawi prayer controls and historical collision isolation | **Preserved**. Seven-circuit tawaf→sa'i NPC sequence and prayer congregations still TODO; do not imply historical certainty |
| **Other districts** | Nile Quarter, Courtyard City, Skyline City, Beach City, Grand Metro | **Preserved**; distinct ambient upgrades pending |
| **Blessed Chambers** | Separate scene module not verified in this branch; space/ship/lunar systems exist | **Not claimed as implemented**. Search newer game branches/assets before adding |

## Bot A coordination, selective integration and rollback

1. **Do not merge the whole branch into production or site main.** At integration time fetch the then-current site branch and production SHA, compare layout/navigation/profile/feed/Quran/GoLive contracts again. This branch is based on game code, not a replacement for the site's newer app.
2. Cherry-pick only the new `LunarResearchScene.ts` implementation commit `41a98e0` and the **two-line** import/render wiring from `2496c3b`, or manually transplant them into the newer `SharedGameLobby.tsx` if Bot A has changed the shared lobby. The test script `f27e436` and correction `3d11009` are optional for runtime, recommended for verification. Do not copy full `SharedGameLobby.tsx` from this branch over newer engine/site work.
3. **Bot A ownership:** collision broadphase, lunar vehicle physics, flight motion, and progressive LOD engine. Bot B owns lunar decorative helper. Bot A can add nonblocking rover movement avoidance/dynamic collision without replacing the Moon ambience renderer.
4. **Separate branches:** Bot B Roman market (`f66c6a7`), Jurassic ecology (`e05ef735`), and Future gardens (`afe199c`) are **not bundled** in this shift. Integrate each separately after conflict checks; do not silently lose them.
5. **Rollback:** Remove the two-line Moon import/call and the unused `LunarResearchScene.ts` module, or revert implementation commits on a future integration branch. Existing Moon, ship, Roman, Moses, Jurassic, Future, Nabawi and Belt Boyz behavior remains as before.
6. **Next Bot B atomic task:** after mobile preview check, add a small, verified **Muhammad-era respectful Hajj NPC state machine** (seven tawaf laps then sa'i) in a game-only module, or add another distinct world slice if shared lobby ownership conflicts. Preserve sacred-area no-blaster behavior. Remaining backlog: XP shop, correctly aimed blaster sound/impact, shield bubble, held raise-hand animation, voice speaker indicators, 10 enterable mosques, congregations.

**Prior handoffs:** [Bot A 13:00](../SHIFT_LOG.md) · [Bot B Roman market](2026-10-27-roman-market-life.md) · [master issue #126](https://github.com/ElmiandCo/1Muslim/issues/126).
