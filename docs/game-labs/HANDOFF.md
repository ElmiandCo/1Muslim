# Game Labs — Cross-bot handoff

Updated: 2026-11-07 18:34 America/Chicago
Issue: https://github.com/ElmiandCo/1Muslim/issues/767
Branch: game-labs/bot2-character-pipeline-20261107 (Bot 2 working branch; not merged)

## Current status
- Bot 2 reviewed issue #767 and confirmed acceptance criteria. No actual 3D character asset or preview has been verified yet.
- Existing reference images and gameplay.mp4 are described in the issue but not available as repository assets; do not invent or substitute low-quality cuboids.
- Preserve production Coming Soon and all Home/Live/comments/Qur'an/Profile behavior.

## Bot 2 — character pipeline specification
1. Establish licensed original GLB source models for male/female with smooth faceless heads and distinct emerald/ivory/gold silhouettes. Verify provenance, rig hierarchy, and actual skinned mesh weights before integration.
2. Require humanoid skeleton, idle/walk/run/jump/dodge/attack clips with consistent root motion policy and crossfade animation state machine. Cloth/hijab/turban must not clip during animation.
3. PBR: fabric roughness, embroidered trims, gold metallic accessories and physically plausible gemstone surfaces; texture atlases, KTX2/Basis compression, LOD and sensible mobile draw calls.
4. Character select previews must load lazily inside Games only; choose Male/Female, persist session selection, then Begin Story Mode. Camera, animation and collision use the same world-scale contract as Bot 1.
5. Test: valid GLB/GLTF, animation playback, no broken skinning, no copyrighted assets, phone 30fps target and desktop 60fps target measured rather than claimed.

## Bot 1 — coordination contract
- Own world, vehicle physics, mission graph, NPC navigation, camera/world collisions and game performance.
- Define player spawn coordinates, character height and capsule dimensions, input action names, animation events, mount/exit vehicle hooks, and quest triggers.
- Integrate Bot 2 character prefab through a documented interface; do not create placeholder blocky humanoids as final art.
- Keep a compact, original city; story should be Muslim-appropriate without copying GTA narrative or assets. Dragon only late/final boss.

## Next exact steps
- Bot 1: read this handoff, document player controller API and world scale, commit to own feature branch, then append handoff without overwriting Bot 2 notes.
- Bot 2: locate approved reference assets or obtain licensed original character source, implement loader and selection in isolated feature branch, capture screenshots and actual device FPS, update handoff.
- Do not merge to main without explicit user approval; preview and test before requesting review.

## Commits/tests/blockers
- This file is a planning/handoff commit only. No build, runtime test, rigged asset or preview is claimed.
- Blockers: reference image/model bytes not yet available in repository; character art production required.
