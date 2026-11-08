# Unified game — Bot 2 visual recovery handoff
Updated 2026-11-08. This is an evidence ledger, NOT a claim that the game has been play-tested.

## Recoverable historical branches (verified to exist)
- Rome arena/cats: `game/living-worlds-rome-grand-arena-cats-20261027-2130` — SharedGameLobby blob `f5e9ce5d0bd5db63c6767088eb3537011157b019`
- Moses playable: `game/living-worlds-moses-playable-20261027-1100` — blob `1577012a2a1d7816297dce0488165c5184eeaedc`
- Lunar research: `game/living-worlds-lunar-research-20261027-1330` — blob `ee74618bc30772cbbeae5ecab428445c52ff6a6a`
- Egypt batches: `game/living-worlds-egypt-village-20261027-1730`, `game/living-worlds-egypt-market-palace-20261027-2330`, `game/living-worlds-egypt-nile-fisheries-20261027-2350`
- Jurassic: `game/living-worlds-jurassic-pterosaurs-20261028-0230-b`, `game/living-worlds-jurassic-riverlife-20261027-0730`
- Future: `game/living-worlds-future-koi-gardens-20261027-2030`, `game/living-worlds-future-sky-couriers-20261028-0130-b`
- Integration candidates: `game/integration-all-worlds-lunar-plus-prayer-20261027`, `game/production-integration-20261027-verified`, PR #129.
- Previous isolated character pipeline: `game-labs/bot2-character-pipeline-20261107`, PRs #775, #796, #812. Their descriptions explicitly say no real GLBs, playable scene, or verified tests. DO NOT mistake metadata contracts for actual visual transformation.

## Verified current baseline
- Target branch `game/unified-worlds-visual-physics-v2-20261108` contains `app/components/SharedGameLobby.tsx` blob `dc1ac60b62a17f8269a8228b880df7ac2c124425`.
- Renderer uses raw WebGL, a simple vertex/fragment shader with directional lighting and cube drawElements. This is a functioning rendering implementation in source, NOT evidence of GTA-level assets.
- World list includes Jurassic, Moses, Jesus, Muhammad, Today, Future. Moon bounds and Nile/city districts exist in source.
- Historical world branches are real; their integration/playability on the target branch has NOT been established by runtime testing.

## Required visual pipeline (do not overwrite playable controls)
1. Freeze current input, collisions, camera state, world IDs, and character coordinates. Compare old branches and cherry-pick game-only world improvements.
2. Acquire legitimately licensed male/female GLB meshes, rigged humanoid skeletons, LODs, materials, textures and animations. A placeholder cannot be called GTA-grade.
3. Introduce a separate model renderer behind a feature flag; preserve raw-WebGL character as fallback and retain hitbox/physics anchor independent of visuals.
4. Implement animation state machine (idle, walk, run, jump, fall, prayer, gestures) driven by actual player velocity, with crossfade and camera interpolation.
5. Profile mobile DPR, draw calls, asset streaming, GPU memory and FPS; add quality presets and WebGL-context-loss fallback.
6. Capture same-world before/after screenshots and on-device gameplay footage, run build and TypeScript tests before any PR promotion.

## Progress accounting — audited, no invented percentages
| World | Historical source located | Restored into unified branch | Runtime navigation | Gameplay verified |
|---|---|---|---|---|
| Rome | yes | unverified | unverified | unverified |
| Moses | yes | unverified | unverified | unverified |
| Egypt | yes | unverified | unverified | unverified |
| Jurassic | yes | unverified | unverified | unverified |
| Future | yes | unverified | unverified | unverified |
| Moon | yes | unverified | unverified | unverified |
| Jesus / Muhammad / Today | names in target source | unverified | unverified | unverified |

**Percentages:** historical branch discovery for six named worlds 6/6 = **100% located** (not 100% recovered). World integration, mesh quality, rig, texture, animation, lighting, physics and overall completion: **not yet measurable** until baseline runtime audit and test matrix. GTA-quality transformation **0% verified** (no real production-ready GLBs verified). Gameplay-test readiness **not verified** (no browser/device run this pass). Do not conflate source presence with gameplay readiness.

## Handoff
Bot 1: compare branch changes for each world, record recovered behavior and cherry-pick only game-scoped improvements. Bot 3: define reproducible smoke test for movement, camera, world travel, collision, projectiles and FPS. Bot 2 next: inspect existing isolated character pipeline branch, then implement a gated GLB adapter with fallback only after asset and renderer validation. Do not merge to production.
