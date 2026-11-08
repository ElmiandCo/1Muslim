# Game Bot 2 — 3D visual handoff (2026-11-08)
Branch: `game/unified-worlds-visual-physics-v2-20261108`. Do not merge to production without build + hands-on gameplay QA.

## Verified source evidence
- `app/components/SharedGameLobby.tsx` contains world picker: Jurassic, Time of Moses, Time of Jesus, Time of Muhammad ﷺ, Today, Future. This confirms picker references, **not** that each world has passed a gameplay test.
- `app/components/JurassicScene.ts` and `app/components/FutureCityScene.ts` are imported into SharedGameLobby; confirm their scene contents and collisions before sign-off.
- `docs/future-world-handoff.md` describes a separate /future prototype and explicitly says its prior integration was incomplete.
- Historical PR #129: game-only Egypt, Rome lion, worlds and collision engine integration; PR #128 warned about unsafe unrelated changes. Inspect both and older game commits before declaring all worlds recovered.
- `HudHudArenaPrototype.tsx` explicitly calls its scene a genuine WebGL procedural training prototype, not production-level 3D art.

## Bot 2 change
Commit `451bb2a653fb57b7222e7074e86357d853226479`: additive suit-material accent bands, darker boots and movement-dependent leg offset in the unified player renderer. Existing camera, input bindings, combat, flight and physics logic left untouched. This remains box-geometry rendering: **not a skinned mesh, not a skeletal rig, not GTA-grade art**. Build and mobile playtesting pending.

## Integration contracts
Bot 1: retain every recovered world, preserve picker IDs and transitions, identify canonical world IDs and playable portals; avoid overwriting avatar renderer.
Bot 3: verify movement, foot clearance, ground collision, jump/fly/landing, mobile touch camera and controls across each world; check new gait offset against terrain.
Bot 2 next: introduce glTF/GLB asset loader with fallback to current procedural player, rigged character animation blending, physically based textures/materials, shadows and lighting, LOD and device performance budgets. Do not replace playable scene until tested.

## Evidence-based progress (conservative, estimates, not QA sign-offs)
World recovery: Jurassic picker/import 25%; Moses picker 10%; Jesus picker 10%; Muhammad picker 10%; Today picker 10%; Future picker/import plus legacy prototype note 30%. These are **evidence coverage estimates**, not percentage of functional gameplay. Per-world actual integration/playability percentage **unverified**.
Visual transformation: mesh 10%, rig 0%, textures/PBR 0%, animation 10% (procedural offsets only), lighting 10% (existing basic WebGL shading). Physics completion **unverified**. Overall game completion **unverified**. Gameplay-test readiness: code present; **not verified on device**.

## 04:48 CST follow-up — verified repository inspection
- New cosmetic-only commit [8702f5e](https://github.com/ElmiandCo/1Muslim/commit/8702f5e1934e178562f552d963b8e8e32a90b7a4): chest armor panel/trim, shoulder plates and helmet visor details on the **existing** primitive avatar renderer. No input, collision, world transitions, networking or camera code changed. This is still a procedural box mesh, not a skinned humanoid. No runtime test or build verified.
- Historical branch search found **40 game branches in the first returned page**, including `game/living-worlds-moses-playable-20261027-1100`, `game/living-worlds-roman-judea-restored-20261027-1230`, `game/living-worlds-nabawi-congregation-20261027-1440`, `game/living-worlds-jurassic-pterosaurs-20261028-0230-b`, `game/living-worlds-future-sky-couriers-20261028-0130-b`, `game/living-worlds-egypt-market-palace-20261027-2330`, and `game/integration-all-worlds-lunar-plus-prayer-20261027`. Existence confirmed; contents and integration remain unverified. Bot 1 should diff each candidate against unified branch, preserve unique gameplay and worlds, and avoid destructive replacements.
- Additional historical PRs: [#119](https://github.com/ElmiandCo/1Muslim/pull/119), [#120](https://github.com/ElmiandCo/1Muslim/pull/120), [#771](https://github.com/ElmiandCo/1Muslim/pull/771), [#775](https://github.com/ElmiandCo/1Muslim/pull/775), [#796](https://github.com/ElmiandCo/1Muslim/pull/796), [#812](https://github.com/ElmiandCo/1Muslim/pull/812). Particularly inspect #775 rigged-character contract and #796 bounded GLB streaming before creating a duplicate loader.
- Bot 3: please run browser/mobile tests for standing, walking, flying, prayer postures, projectile combat, camera orbit, ground clearance and multiplayer avatar rendering; inspect visual-only draw calls for draw order/depth.
- Progress remains **unchanged from prior evidence coverage estimates**: world Jurassic 25%, Moses 10%, Jesus 10%, Muhammad 10%, Today 10%, Future 30%; mesh 10%, rig 0%, textures/PBR 0%, animation 10%, lighting 10%. These are NOT gameplay percentages. Physics, overall completion, build readiness and playtest readiness are **unverified**. Do not merge production.


## 05:45 CST audit — asset pipeline and preservation gate

Inspected the actual unified renderer at `app/components/SharedGameLobby.tsx` on this branch. It uses a custom matrix/WebGL draw pipeline (`draw(vp,...)`) and currently builds the humanoid from procedural box primitives. The newly added chest/visor/shoulder decorations remain box draw calls; they do **not** provide a skeleton, skin weights, GLB model, or PBR texture sampling. World picker IDs are exactly Jurassic, Time of Moses, Time of Jesus, Time of Muhammad ﷺ, Today, Future; `JurassicScene` and `FutureCityScene` are explicit imports. No world content was deleted or replaced in this audit.

Historical [PR #775](https://github.com/ElmiandCo/1Muslim/pull/775) explicitly describes a male/female skinned-GLB *metadata contract*, nine animation mappings, license/LOD validation, **but no real GLBs or playable scene**. [PR #796](https://github.com/ElmiandCo/1Muslim/pull/796) explicitly describes bounded GLB streaming and cancellation, **but no assets or verified gameplay**. Neither should be represented as a finished 3D character. Reuse their contracts only after reviewing compatibility with the current custom WebGL renderer.

### Non-destructive visual migration sequence
1. Bot 1: preserve all six picker IDs and compare historical branches by file/scene/portal; publish per-world import and gameplay evidence. Never overwrite unified game with an older partial batch.
2. Bot 2: obtain licensed GLB with humanoid skeleton, skinned mesh, UV/PBR maps and clips (idle/walk/run/jump/fall/land/fly/attack/prayer); validate clip names, triangle count, scale, orientation and material limits using #775/#796. Keep procedural player as fallback.
3. Bot 2: integrate a **separate** model renderer (or documented GLB-to-custom-WebGL adapter) behind an explicit feature flag. Current draw pipeline does not directly accept glTF or skeletal transforms. Preserve existing position/yaw/flight/collision as authoritative; animation consumes motion state but never writes it.
4. Bot 3: run paired old/new avatar comparisons for movement speed, jump height, collision capsule, camera orbit, touchscreen analog+swipe, combat and world portal transitions. Log FPS/frame times on mobile and desktop, including GLB load failure fallback.
5. Only after verified build + real browser/device gameplay tests consider enabling the flag in preview; **no production merge**.

### Updated evidence table
| World | Historical evidence coverage (estimate) | Actual integrated world % | Playability verified |
| --- | ---: | --- | --- |
| Jurassic | 25% | Unknown | No |
| Time of Moses | 10% | Unknown | No |
| Time of Jesus | 10% | Unknown | No |
| Time of Muhammad ﷺ | 10% | Unknown | No |
| Today | 10% | Unknown | No |
| Future | 30% | Unknown | No |

Visual milestones (rough implementation evidence only): procedural mesh detailing 10%; actual skinned humanoid mesh 0%; rig 0%; PBR textures 0%; procedural animation 10%, skeletal animation 0%; lighting 10%. Physics completion unknown; overall game completion unknown; gameplay-test readiness **not verified**. The percentages are *not* a measured completion forecast. This audit adds documentation only, not an untested renderer replacement.
