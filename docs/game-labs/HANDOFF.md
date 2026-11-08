# Game Labs shared handoff

Updated: 2026-11-08 00:55 UTC. **Bot 1 (World)**. Issue: [#767](https://github.com/ElmiandCo/1Muslim/issues/767).

## Shared safety contract
- **Production Games tab remains GameLabsComingSoon.** Do not change `app/page.tsx`, `app/components/GameLabsComingSoon.tsx`, Home/Live/comments/Qur'an/Profile, or main without explicit user approval.
- Work in independent feature branches. World Bot 1 owns `app/game-labs/world/**`, world tests, and mission/driving/performance systems. Character Bot 2 owns `app/game-labs/characters/**`, GLB asset acquisition, rigs, materials, animations, gender selection and character-specific UI. Both bots should append their own dated section here only after re-fetching latest blob SHA to avoid clobbering.
- Real character assets must be rigged GLB with documented license/provenance; no cube placeholders. The user's emerald/ivory/gold male/female references and gameplay.mp4 were in chat, **not available as repository assets**. Do not claim exact fidelity until they are provided to the art pipeline.
- Keep original IP and Muslim-appropriate story, avoid copying GTA assets, trademarked world, narrative or character designs.

## Bot 1 work completed (this branch only)
- Branch: `feat/game-labs-world-mission-foundation-20261107-bot1` from main.
- Commit `4e7068a9d8938234588d84613b8061a220ed37b1`: `app/game-labs/world/mission-graph.ts`, typed four-district compact city layout (Safina Harbor, Lantern Quarter, Gardens of Aman, Qamar Ridge); four quests with sequential objectives, NPC dialogue hooks, collection, defense, vehicle delivery and **late dragon boss**; pure deterministic progression, prerequisites and graph validator.
- Commit `8343df0bc33e0626ccef1fcbdba388b806ef09bc`: `tests/game-labs-mission-graph.test.mjs`, three regression tests for graph validity, gated boss and objective order.
- **Not yet built or run in this connector-only environment**. No renderer, GLB, physics, driving, NPC AI or playable scene is claimed. No production changes.
- Existing main `app/components/HudHudArenaPrototype.tsx` is a low-quality procedural prototype, explicitly not accepted as final gameplay.
- Current `package.json` has Next 15, React 19, TypeScript 5.8 but no 3D renderer. Recommend isolated `three` + `@react-three/fiber` + `@react-three/drei` or a separately bundled engine, after perf review.

## Bot 2 handoff / contract
- **No previous Bot 2 handoff was present at this path** on main when checked. If Bot 2 has work on another branch, inspect that branch before integrating.
- Character selection IDs should be stable `male` and `female`; both are faceless and should map to independently rigged GLBs. Keep visual identity emerald, ivory and gold with detailed fabric and metal PBR. Provide `idle`, `walk`, `run`, `jump`, `dodge`, `attack`, `enter-vehicle`, `drive`, `hit` clips, plus authored animation names/retarget map and a consistent metre scale, forward axis and ground origin.
- The mission engine accepts `QuestId` and `MissionProgress` independent of character presentation. Bot 2 must not edit `app/game-labs/world/mission-graph.ts`; propose interfaces in issue #767 instead.
- Do not substitute primitive boxes for missing GLBs. Show a tasteful loading/asset-unavailable screen in preview if assets are absent.

## Exact next Bot 1 steps
1. Verify CI/preview and run `node --test tests/game-labs-mission-graph.test.mjs` under Node 24, plus `npx tsc --noEmit`. Fix any TypeScript/Node extension resolution issues.
2. Add world streaming chunks and original modular environment assets, NPC/quest interaction adapter and save/load versioning. Use fixed-step simulation, spatial queries, interaction distances and accessibility prompts.
3. Prototype vehicle controller with steering/braking/traction, camera collision and deterministic test fixtures; no reckless civilian-harm rewards.
4. Integrate high-quality GLBs from Bot 2 behind a feature-flagged preview-only route. Target 30fps mobile/60fps desktop, capped DPR, instancing, LOD, texture compression and GPU profiling.
5. Deliver a recorded iPhone gameplay walkthrough and actual performance measurements before requesting production approval.

## Integration / blockers
- There is no gameplay demo, no verified 3D renderer, no character asset repository or licensed rigged models at this stage.
- Shared handoff updates from other branches require cherry-pick/rebase or GitHub issue coordination; do not overwrite another bot's updates.
- The original world layout and quest graph are a foundation, not an implemented playable open world.

## Bot 2 update — 2026-11-08 01:27 UTC (character systems)
- Separate branch `feat/game-labs-character-contract-20261107-bot2`, based on main; does **not** modify Bot 1's world mission files or production UI.
- Commit `e7e415bbf1f2931d1c06c185dc6a112e990ab6ec`: `app/game-labs/characters/character-contract.ts` defines male/female stable IDs, nine named animation actions, rig/scale/axis contract, GLB path, provenance, LOD metadata, and metadata validation. It deliberately supplies **no cuboid/placeholder characters**.
- **Tests:** Not run (GitHub connector only); no GLB imported or inspected, no renderer, no animations actually playable, no mobile FPS data. The metadata gate is **not** a runtime asset verifier: before enabling Begin Story Mode, implement actual GLB fetch, skinned-mesh/bone validation, animation clip inspection, material/provenance review and readiness checks.
- **Blockers:** Original emerald/ivory/gold faceless male/female reference images are not in GitHub. Obtain authorized source meshes or commission originals; create skinned, weight-painted GLBs with consistent bone naming, realistic cloth folds, metal and gemstone PBR materials, and separate mobile LODs. Ensure both sexes use independent silhouette-appropriate meshes, not scaled primitives.
- **Next exact Bot 2 steps:** (1) secure licensed original GLBs and attach provenance; (2) implement GLB loader, skin/clip validation and explicit asset-unavailable state; (3) add male/female character select and Begin Story Mode only in isolated preview route; (4) rig animation state machine with idle/walk/run/jump/dodge/attack/vehicle/hit; (5) verify on mobile, capture actual 30fps measurements and record walkthrough. No production merge.
- **For Bot 1:** Consume `CharacterPresentation` and `CharacterAction` from the character contract when integrating quest/NPC/vehicle animation; do not edit Bot 2's character directory. Mission graph remains engine-independent. Coordinate via issue #767 and cherry-pick or rebase shared handoff when needed.


## Bot 2 follow-up — 2026-11-08 02:28 UTC
- Read Bot 1's latest handoff on branch `feat/game-labs-world-mission-foundation-20261107-bot1`: Bot 1 added math-only vehicle controller `987933a9` and tests `9124f6e9`; those files are not imported or modified here. The world branch's handoff has newer Bot 1 sections not yet cherry-picked into this branch; this note preserves their key details.
- Character branch commit `d2cd65e480033c1baf0c2c5ddb4d34cf4f7c33cc` adds `app/game-labs/characters/animation-controller.ts`: pure semantic action decision with hit > vehicle entry > drive > dodge > attack > jump > run > walk > idle priority; loops/crossfade hints; checks actual loaded clip names for missing or duplicated mappings. `drive` is selected by vehicle state, not speed; `enter-vehicle` is a one-shot. This is **not** a rig driver, GLB loader, or playable animation.
- Commit `ef01f2a665e66d889ccf2d2aceaff3de631f5f41` adds `tests/game-labs-character-animation.test.mjs` for movement thresholds, vehicle transitions, priority, invalid speed and clip readiness. **Not executed** in GitHub-only environment. Run `node --test tests/game-labs-character-animation.test.mjs` with Node 24 TS type stripping, `npx tsc --noEmit`, and browser preview before integration.
- **Bot 1 integration note:** Emit `CharacterMotionInput` from world motion and vehicle state. In particular `enteringVehicle=true` during mount animation, then `inVehicle=true` for `drive`; never equate vehicle speed with character run speed. Import this module only after branch integration; do not edit Bot 2 character directory. NPC/quest system remains independent.
- **Next exact Bot 2 work:** acquire licensed original male/female faceless GLBs matching emerald/ivory/gold reference; add runtime skinned mesh/bone/clip/material validator; animation mixer binding and transition completion; preview-only character select and Begin Story Mode gated on both real assets; verify mobile/desktop FPS. No real models or user reference images are currently available in repository. No production changes, no main merge.
