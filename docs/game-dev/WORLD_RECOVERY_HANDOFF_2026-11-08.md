# Game Bot 1 — World recovery / cross-bot handoff (2026-11-08)

## Evidence and safety
This is a discovery/integration handoff, NOT a claim of playable restoration. Do not merge to production. Branch: `game/unified-worlds-visual-physics-v2-20261108`. Existing `app/components/SharedGameLobby.tsx` is ~161 KB and currently references JurassicScene, FutureCityScene, gamePhysics and a six-world selector (Jurassic, Time of Moses, Time of Jesus, Time of Muhammad ﷺ, Today, Future). It contains moon logic, a joystick and projectile stepping. These are source-code observations only, not runtime QA. The selector does NOT prove Rome/Egypt/Moses content is restored.

## Historical recovery inventory (confirmed branch names)
- Rome / lions / cats: `game/living-worlds-rome-grand-arena-cats-20261027-2130`, `game/living-worlds-roman-market-life-20261027-1227`, `game/living-worlds-roman-judea-restored-20261027-1230`, `game/world-engine-rome-lion-20261028-0200-a`, `game/world-engine-rome-arena-solids-20261027-2200-a`.
- Moses / parted sea: `game/living-worlds-moses-playable-20261027-1100`, `game/living-worlds-moses-shoals-20261027-0930`, `titan/parted-sea-world`.
- Egypt / Nile: `game/living-worlds-ancient-egypt-riverlife-20261027-1530`, `game/living-worlds-egypt-docklife-20261027-1630`, `game/living-worlds-egypt-village-20261027-1730`, `game/living-worlds-egypt-pyramid-approach-20261027-1930`, `game/living-worlds-egypt-market-palace-20261027-2330`, `game/living-worlds-egypt-nile-fisheries-20261027-2350`, `game/living-worlds-long-nile-oasis-20261028-0030-b`, plus `game/world-engine-egypt-*` and `game/world-engine-nile-*` branches.
- Jurassic: `game/living-worlds-jurassic-riverlife-20261027-0730`, `game/living-worlds-jurassic-pterosaurs-20261028-0230-b`, `game/world-engine-jurassic-solids-20261027-1000`, `nova/jurassic-world`.
- Future: `game/living-worlds-future-gardens-20261027-0830`, `game/living-worlds-future-koi-gardens-20261027-2030`, `game/living-worlds-future-sky-couriers-20261028-0130-b`.
- Moon: `game/living-worlds-lunar-research-20261027-1330`, `game/integration-all-worlds-lunar-plus-prayer-20261027`.
- Other: `game/living-worlds-hajj-pilgrims-20261027-1430`, `game/living-worlds-nabawi-congregation-20261027-1440`, `game/muhammad-madinah-midway-sign-20261027-2300`.
- Physics/control sources: `game/world-engine-projectiles-camera-20261027-2240`, `game/world-engine-directional-flight-20261027-1200`, `game/world-engine-swept-collision-20261027-0900`, `game/world-engine-spatial-broadphase-20261027-1100`, `game/world-engine-rome-lion-20261028-0200-a`.

## PR evidence
- #119 Jurassic official Game v1, #120 Jurassic v1.1, #114 flight/HUD/lunar, #128 draft frozen-production integration, #129 game-only Egypt/Rome lion/worlds/collision engine.
- #771 Bot 1 original world + mission foundation; #775 Bot 2 rigged-character contract; #743 fullscreen WebGL training; #746 secret-admin arena.
- Commit search matched Jurassic `4f84711c`, `8a6b1e9e`, `50039cca`, `d73602cc`, `616c92bf`; moon `1af32bbb`, `e9806f68`, `922eaf5d`, `a9870a99`. Exact per-file provenance requires compare/fetch before cherry-pick.

## Divergence risk
Compared to this target branch, the historical all-worlds branch is 92 commits ahead and 1129 behind; Rome arena cats is 190 ahead / 1129 behind; Moses playable is 42 ahead / 1129 behind; Jurassic pterosaurs is 222 ahead / 1129 behind; Future couriers is 217 ahead / 1129 behind. NEVER merge these branches wholesale. Extract and adapt scene modules/behavior with focused changes, preserving current auth, Home and game controls.

## Verified progress matrix (conservative evidence-only; not feature-completion claims)
World | Discovery | Restoration | Integration | Navigation | Gameplay | QA
---|---:|---:|---:|---:|---:|---:
Rome lion/cats | 100% branch located | 0% verified | 0% verified | 0% verified | 0% verified | 0% verified
Moses | 100% | 0% | selector only, unverified | 0% | 0% | 0%
Egypt/Nile | 100% | 0% | 0% | 0% | 0% | 0%
Jurassic | 100% | source references exist, unverified | source references exist, unverified | 0% verified | 0% verified | 0%
Future | 100% | source references exist, unverified | source references exist, unverified | 0% verified | 0% verified | 0%
Moon | 100% | moon code exists, unverified | moon code exists, unverified | 0% verified | 0% verified | 0%
Other (Hajj/Nabawi/Madinah) | 100% branch located | 0% | 0% | 0% | 0% | 0%

Overall unification: 0% **verified end-to-end**; graphics: unverified; physics: unverified; gameplay-test readiness: NOT READY (no successful cross-world smoke test captured). This does not imply the historical worlds never worked; it means the target branch has not been validated.

## Shared handoff — Bot 2 (visual)
Use historical world branch names above for source art/scene discovery. Keep exact world identifiers and scene contracts stable. Upgrade to rigged 3D characters/lighting/materials incrementally; avoid overwriting joystick, camera, projectile or travel logic. Record asset paths, poly/texture budgets and preview screenshots.

## Shared handoff — Bot 3 (physics / QA)
Inspect the historical `game/world-engine-*` branches and existing `gamePhysics`/projectile code. Define deterministic smoke tests for each world: spawn, camera swipe, bottom-left analog movement, jump/flight, projectile collision, portal round trip, death/respawn, mobile touch. Capture actual test outputs and device/browser; no claim of passing without evidence.

## Bot 1 next actions
1. Compare/fetch scene-specific files from the most complete historical world branch and build a provenance manifest of path + SHA + dependency graph.
2. Restore world scenes as isolated modules, not wholesale branch merges.
3. Wire a single world-travel selector and bidirectional portals while preserving original camera/joystick/projectile contracts.
4. Run TypeScript/build and per-world navigation smoke tests; update matrix based on actual results.
5. Coordinate integration conflicts via this document; production remains untouched until tested and explicitly approved.


## Run 2 — direct historical file verification (2026-11-08)
Fetched `app/components/SharedGameLobby.tsx` from six historical branches. The values below are **Git blob SHAs** (not commit IDs), and sizes are text-character lengths, not compiled bundle sizes:

| Historical branch | Blob SHA | Characters |
|---|---|---:|
| `game/living-worlds-rome-grand-arena-cats-20261027-2130` | `f5e9ce5d0bd5db63c6767088eb3537011157b019` | 177017 |
| `game/living-worlds-moses-playable-20261027-1100` | `1577012a2a1d7816297dce0488165c5184eeaedc` | 164590 |
| `game/living-worlds-ancient-egypt-riverlife-20261027-1530` | `dc1ac60b62a17f8269a8228b880df7ac2c124425` | 161494 |
| `game/living-worlds-jurassic-pterosaurs-20261028-0230-b` | `b9ace47c6053e8216da881212cad73552026547d` | 178417 |
| `game/living-worlds-future-sky-couriers-20261028-0130-b` | `b9ace47c6053e8216da881212cad73552026547d` | 178417 |
| `game/living-worlds-lunar-research-20261027-1330` | `ee74618bc30772cbbeae5ecab428445c52ff6a6a` | 166820 |

**Important:** Jurassic-pterosaurs and Future-sky-couriers resolve to the *identical lobby blob*, so these are not two independent source implementations at that path. Branch titles alone cannot prove unique content. The string presence of world names, portal, or projectile does not prove runtime behavior. No historical source was copied into the target game runtime in this run.

**Integration plan:** First compare the distinct lobby blobs and inspect imported scene modules and assets. Extract the missing Rome/Moses/Egypt components into isolated game-only modules, avoiding replacement of current SharedGameLobby and preserving joystick/camera/projectiles. Then connect portals and record actual build/runtime tests. Bot 2 should use the above blob identities to avoid duplicate asset work; Bot 3 should not mark physics QA complete based on these source reads. All world-level restoration/integration/navigation/gameplay/QA percentages remain **0% verified**, except prior source references (unverified behavior). Overall unification **0% verified end-to-end**; graphics/physics percentages **unverified**; gameplay-test readiness **not verified**. Production untouched.


## Run 3 — concrete missing scene modules and provenance (2026-11-08)

Compared the **historical Rome grand-arena lobby** against the unified target lobby, then fetched five historical scene modules at exact paths. Historical lobby blob `f5e9ce5d0bd5db63c6767088eb3537011157b019` imports Moses, Rome, Egypt and lunar modules, while target lobby blob `45cc9ab2b673b8c0f806065e6010ec2fcfe6a62b` imports only JurassicScene, FutureCityScene and gamePhysics (besides shared UI). These are code-path differences, not proof of runtime operation.

| Historical module path (under app/components/) | Git blob SHA from `game/living-worlds-rome-grand-arena-cats-20261027-2130` | Characters | Same path in unified target |
|---|---|---:|---|
| `PartedSeaScene.ts` | `5a3acba3d1680130e104e8eac4299e4847da8ef4` | 9,449 | Not found |
| `RomanJudeaScene.ts` | `de71aa5740685f2a79b6be200c9bfbea0e2f3037` | 5,972 | Not found |
| `LunarResearchScene.ts` | `de9938f1fdf05f529e4d9e76c6d9b131854ecad9` | 2,810 | Not found |
| `AncientEgyptRiverScene.ts` | `6d3446fb31c4a76a691e8c46c1919521f396b43e` | 16,452 | Not found |
| `gameEgyptWorld.ts` | `18108a13889a2fbb445d87d442478595b97730dd` | 6,586 | Not found |

**Major new finding:** The historical Egypt-riverlife lobby blob `dc1ac60b62a17f8269a8228b880df7ac2c124425` does not import any Egypt module, despite the branch name. Do not infer restoration from branch naming; use the later Rome grand-arena branch as a more complete candidate for scene-module provenance. The historical Moses-playable and lunar-research lobbies do import `PartedSeaScene`, and lunar-research also imports `RomanJudeaScene` and `LunarResearchScene`.

**Integration blocker now concrete:** Five required scene modules are absent from the target at their historical paths. Their content was read and provenance verified, but **none has yet been restored**. Directly copying the old 177 KB lobby would overwrite newer controls and collision code; instead isolate the five modules, check their transitive dependencies, then adapt the world router and bidirectional portal interfaces without changing the existing joystick, camera swipe or projectile mechanics.

**Bot 2:** Start art/geometry comparisons using these five exact blob SHAs; do not recreate them blindly or treat them as high-end 3D meshes. **Bot 3:** Add missing-scene module tests and per-world portal/analog/projectile smoke tests after restoration. In particular, test Egypt ↔ Moses and Rome travel before approving gameplay readiness.

**Verified progress:** Discovery/provenance is 100% for the seven world families already enumerated, with five exact missing module blobs now verified. Restoration, integration, navigation, gameplay and QA remain **0% verified** for Rome, Moses, Egypt, Jurassic, Future, Moon and other worlds in this target. Overall cross-world unification **0% end-to-end verified**; graphics and physics completion percentages **unverified**; gameplay-test readiness **not verified**. No production merge and no claims of passed gameplay tests.
