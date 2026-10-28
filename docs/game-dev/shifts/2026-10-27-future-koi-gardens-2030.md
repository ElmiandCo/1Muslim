# Bot B / Living Worlds — Future City bioluminescent gardens and holographic koi

**Shift:** Tuesday, 2026-10-27, 20:30 CDT (America/Chicago)  
**Scope:** GAME-ONLY, dedicated non-production branch. No main, production, frozen-preview, site, navigation, feed, profile, Quran or GoLive edits.

## 1. Baseline, source audit, coordination

| Contract | Observed |
| --- | --- |
| Frozen protected site | `fix/profile-scroll-match-umma-20261027` @ `c856491131bb0c8056693652f8e5e58a26836831`; `app/page.tsx` blob `92ca9b508378fd462ae3cf8a1458d2d4467aeb56`. |
| Main / production code, read only | `main` @ `c043219f7a3eeb8e1529538013e97f311a3b938a`, `app/page.tsx` blob `b066f01c810fe5fcfa58db09b426383e2e3c9797`. **Main's newer site layout differs from frozen game branch; never transplant an entire app page.** |
| Starting game source | Bot A `game/world-engine-egypt-banks-arrival-20261027-2000` @ `f0dec21109c91b11098373d27b1249bfd24addf3`. This includes the 20:00 Nile bank slope/Great Pyramid arrival heading and prior Egypt, shield, Moses, Roman, Hajj/Nabawi, Moon, roof-edge physics. |
| Current Bot B branch | `game/living-worlds-future-koi-gardens-20261027-2030`, based on the **exact** Bot A SHA above. |
| Other shifts inspected | Bot A [Egypt bank/arrival handoff](2026-10-27-egypt-banks-arrival-2000.md), Bot B [Great Pyramid approach](2026-10-27-egypt-great-pyramid-approach-1930.md), original [Future Gardens branch](https://github.com/ElmiandCo/1Muslim/tree/game/living-worlds-future-gardens-20261027-0830), [coordination issue #126](https://github.com/ElmiandCo/1Muslim/issues/126). |
| Shared game integration contract | `SharedGameLobby.tsx` already calls `renderFutureWorld`; `FutureCityScene.ts` already has towers, portal, skyways, traffic, drones and citizens. No need to edit shared engine or Bot A collision/LOD. |

## 2. Implemented, not merely proposed

**Code commit:** [`10fe2747`](https://github.com/ElmiandCo/1Muslim/commit/10fe2747aa1a863d5c4ba90dc6ccfeab8cd98748)

**Exact implementation path:** `app/components/FutureCityScene.ts` (**+63 lines, no deletions**).

- **Reused prior Bot B world-specific work instead of recreating it:** restored six luminous Future City garden sites, deterministic seven-bloom arrangements, animated flower heads, ground-level reflective basins and small hovering pollinators from `game/living-worlds-future-gardens-20261027-0830`. The current A branch did **not** yet contain these gardens.
- **New detail:** two translucent holographic koi loop in opposite directions inside each basin when the player is within **55 world units**. Koi are small, non-solid and visually translucent; they do not intercept blasters or cause damage.
- **LOD:** sites beyond **150 units** render nothing; at 84–150 units only basin/low-detail stems and blossoms draw; at 55–84 units animated stems and pollinators draw; at <55 units the koi and four-petal blossoms are added. Geometry uses the existing `draw(vp,...)` API, no textures, new packages, physics, new React components, or network updates.
- **Placement:** gardens sit away from the existing `FUTURE_PORTAL` and avoid central spawn/portal; no tower, skyway, terrain, or collision geometry moved.
- **Before/after:** Bot A's 20:00 Future City scene had towers, plazas, flying vehicles and citizens but no planted gardens or koi. Now the same existing `renderFutureWorld` calls `renderFutureGardens` between the arrival plaza and towers; all original world renderer code remains.

**Test commit:** [`df86dba5`](https://github.com/ElmiandCo/1Muslim/commit/df86dba5ef86a6af1e7262ac8a4138de3762c122)  
**Exact test path:** `scripts/game-future-koi-smoke.mjs` (**new**, +41 lines). Source-based Node smoke script imports the actual TypeScript module via `typescript.transpileModule` and VM, checks skyways/portal, render culling, draw budget, finite geometry, koi motion and preserved Future City components. Run in checkout: `node scripts/game-future-koi-smoke.mjs`.

## 3. Verification and limits

| Check | Result |
| --- | --- |
| Direct V8 execution of **actual GitHub-fetched** garden function source | **PASS: 30,619** finite geometry and alpha assertions across 140 sampled positions/time steps, plus preserved-symbol/portal checks. Removed only TypeScript annotations in the test harness. |
| Render draw budget (garden only) | **PASS:** 0 garden draw calls at far coordinates (1200,1200); 150 at sample (-72,0); **max 166** garden calls across sampled camera positions. These are *renderer callback counts*, not measured WebGL GPU draw calls or FPS. |
| Koi | **PASS:** 4 visible koi at (-72,0) because two basins are within the 55-unit detail radius (2 per basin). No collision, damage, server, or audio behavior introduced. |
| Preservation | **PASS:** 8 original Future City source anchors intact (bounds, portal, towers, skyways, floor helper, traffic, citizens, exit). GitHub compare from Bot A base: **only two game/test paths** changed before documentation. |
| Preview build | The code-only commit `10fe2747` auto-generated a **READY non-production Vercel preview**: https://1muslim-r3wacb7e7-elmiandco.vercel.app . The later smoke-test commit `df86dba5` had previews **BUILDING** at last status check. This does not prove mobile visuals/FPS. |
| Native checkout smoke and physical device | **NOT VERIFIED:** V8 source test ran, but the checked-out Node smoke file and real iPhone/Android walkthrough were not executed here. |
| Multiplayer / shield authority | **NOT ADDRESSED:** server-authoritative Hyper Defense remains unverified; this shift changes only Future City visuals. |

## 4. World-by-world progress and preservation

| World | Current status and next |
| --- | --- |
| **Future / Futuristic / RealMecca** | **THIS SHIFT:** restored luminous garden scenery from prior Bot B branch and added looping holographic koi. Verify near/far LOD, mobile FPS and safe portal access. |
| Ancient Egypt / Great Pyramid | **Preserved:** 65 approach tiles, Nile docks/boats/crews, palm groves, village/crops, 74 scenery solids, riverbank height match, camera facing pyramid. Next: visually inspect Egypt shoreline and construction ramps with Bot A. |
| Moses / Parted Sea | Preserved reciprocal Egypt portal and existing world/physics; device traversal pending. |
| Jurassic | Existing dinos, giant cave, terrain and collision preserved. **Prior separate Bot B Jurassic river-life branch was inspected and is NOT yet in this starting A branch**; integrate via targeted diff later, not by replacing the current Jurassic scene. |
| Makkah / Madinah / Muhammad-era | Preserved Hajj seven-circuit/Safa–Marwa visuals, Nabawi prayer congregations and sacred-zone gameplay. No new historical claims. |
| Jerusalem / Roman Judea / Jesus-era | Preserved Roman settlement/market modules; historically interpretive scenes remain labeled speculative. |
| Space / Moon / Blessed Chambers | Preserved spacecraft, EVA and lunar research scene. |
| Today / Belt Boyz / Meeting | Roofless office and existing controls preserved. Compact mobile Meeting settings, generic label and Exit Meeting remain open tasks; do not edit shared lobby without Bot A coordination. |
| Combat / XP / audio | Existing shield aura and timer preserved; server-authoritative damage, stronger aimed blasters, shop, raise-hand hold and speaker indicators remain open. |

## 5. Integration / rollback / cross-bot handoff

- **No production deployment, main merge or frozen site edits.** Automatic Vercel builds were **preview-only** (target null).
- **Selective integration:** after obtaining the then-current site SHA and comparing layout contracts, cherry-pick **only** implementation `10fe2747` and optional test `df86dba5` into a fresh game integration branch. `FutureCityScene.ts` is the sole runtime implementation path. If that file has changed, transplant only the garden constants/function and the one call to `renderFutureGardens`, preserving newer towers/portal/skyways and Bot A's LOD/collisions.
- **Rollback:** revert implementation commit `10fe2747` (and optional test commit `df86dba5`) on the integration branch. No other app code should change.
- **Bot A coordination:** This shift did not touch `SharedGameLobby.tsx`, `gameEgyptWorld.ts`, `gamePhysics.ts`, or collision indexes. Bot A can continue portal/terrain/swept movement/authoritative combat work. Please review Future City garden footprints when integrating solid geometry and share progressive LOD guidelines; **do not add invisible garden colliders**.
- **Next Bot B:** inspect latest Bot A handoff and world list; validate latest preview build; integrate Jurassic river life by a minimal scene-only patch or advance another untouched world; prioritize phone FPS and draw budget. Continue Egypt scenery/NPC/palms while Bot A owns Egypt portal/terrain/physics. Other user priorities remain in backlog and are **not falsely marked complete**.

**Cross-reference:** [Game coordination issue #126](https://github.com/ElmiandCo/1Muslim/issues/126) and [cumulative game-only log](../SHIFT_LOG.md).
