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


## Bot 1 follow-up — 2026-11-08 02:01 UTC
- Reviewed Bot 2 draft PR #775 and its full handoff. Bot 2 now owns `app/game-labs/characters/character-contract.ts`, commit `e7e415bbf1f2931d1c06c185dc6a112e990ab6ec`; **do not duplicate character contracts in world code**. Shared stable IDs: `male` / `female`; actions `idle`, `walk`, `run`, `jump`, `dodge`, `attack`, `enter-vehicle`, `drive`, `hit`. Integrate only after branch reconciliation and actual GLB validation.
- Verified Bot 1 PR #771 is still **open, draft, unmerged**. Commit `3f9aa787370cbfec361eaaa598f1dd02a4256c63` has a successful Vercel deployment status; this does **not** verify gameplay, unit tests, TS build, or runtime correctness. PR mergeability currently reports false; inspect conflict/merge status before any future integration.
- Existing Node test file imports `.ts` directly; Node 24 type stripping may support this but **tests were not executed** here. Next run: `node --version && node --test tests/game-labs-mission-graph.test.mjs && npx tsc --noEmit` in a checked-out branch with dependencies. Report failures verbatim and fix on feature branch only.
- Prioritize next world deliverable: an engine-independent fixed-step vehicle controller with steering, braking, speed limits, collision interface and deterministic tests; then interaction proximity adapter for talk/collect/drive/defend/boss events. Do not connect gameplay to production UI.
- Bot 2: please supply concrete `CharacterPresentation`/`CharacterAction` exports and runtime GLB readiness shape, plus a tested animation clip mapping for `enter-vehicle` and `drive`; world vehicle controller will emit semantic actions rather than mutate rig state. Do not edit world files; coordinate integration via issue #767.
- No playable scene, physical vehicle, imported GLB, measured FPS, or completed runtime tests are claimed in this update. No merge to main.

## Bot 1 implementation — 2026-11-08 02:07 UTC
- Commit `987933a9e069ff57c974f64ebb57fd979f2cb703`: new `app/game-labs/world/vehicle-controller.ts` with engine-independent fixed-step arcade vehicle motion, bounded forward/reverse speeds, steering dependent on motion, braking/drag, and finite-value validation. This is **math only**, not a drivable rendered vehicle or physics collision system.
- Commit `9124f6e918a29f42448f6b913b640e9d999994ac`: `tests/game-labs-vehicle-controller.test.mjs` with three Node tests for acceleration/cap, steering/braking, deterministic stepping and invalid dt.
- **Tests not executed** in GitHub-connector-only environment. Required: `node --test tests/game-labs-mission-graph.test.mjs tests/game-labs-vehicle-controller.test.mjs`, `npx tsc --noEmit`, preview smoke test and FPS profiling. The earlier Vercel success applied to an earlier commit, not these changes.
- Bot 2: driving semantic action should map to your `drive` animation only after character GLB loaded; vehicle state stays separate from rig. Next Bot 1: implement collision adapter and input mapping, then NPC interaction radius tests. No production merge.

## Bot 1 follow-up — 2026-11-08 03:00 UTC (interaction adapter)
- Read Bot 2's current PR #775 and branch handoff as of commit `62f7d2f23e05881516cd36ea620306d5c1444ea4`. Bot 2 added pure `animation-controller.ts` (`d2cd65e4`) and unexecuted tests (`ef01f2a6`); world code intentionally does not import character branch modules until integration. Bot 2's `CharacterMotionInput` expects `enteringVehicle` then `inVehicle`, and speed is for pedestrian motion only.
- Commit `9948e562e807fbe73cc2d0882b3cccc32ca27b96`: `app/game-labs/world/interaction-adapter.ts` adds `currentObjective`, X/Z distance validation and `applyInteraction`. NPC talk, collect and reach require correct target and range; vehicle delivery requires `inVehicle && cargoSecured`; defense/boss completion requires safe civilians plus resolved encounter/boss. This is a pure logic gate, **not NPC AI, real collision, combat, renderer or playable gameplay**.
- Commit `8f60c715449e08b7e118054edf6b698bd15e1d91`: `tests/game-labs-interaction-adapter.test.mjs` covers objective order/proximity, defense civilian safety, vehicle cargo, and nonfinite coordinates. Tests **written, not executed** in connector-only environment.
- Verification required: `node --test tests/game-labs-*.test.mjs`, `npx tsc --noEmit`, and latest PR #771 Vercel preview after deployment. No claim of passing tests or runtime integration.
- **Bot 2 actionable contract:** world interaction emits semantic event and a new immutable `MissionProgress`; your character state should only respond to gameplay events (walk/run/enter-vehicle/drive/hit), not directly mutate mission graph. For NPC dialogue, use target IDs `npc-safiya`, `npc-idris`, `npc-nura`; do not change their IDs without coordinating. Keep both male/female rigs in your directory and avoid editing `app/game-labs/world/**`. Shared handoff updates live on independent branches; reconcile sections before future integration.
- **Next exact Bot 1:** add vehicle swept collision resolver + spatial query test fixtures, a fixed-timestep world update adapter, and a versioned save/load schema. Then integrate character action adapter only after Bot 2 GLB runtime validation exists. All gameplay remains preview-only; do not touch production Games Coming Soon.
