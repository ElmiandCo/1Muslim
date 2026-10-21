# Three-Bot Game Lab — preview-only experiment

## Safety and goal
On branch `experiment/three-bot-game-lab-20261021`, replace ONLY the center homepage video player in this experimental preview with a delightful, finger-controlled playable game. Surprise the user with creative mechanics, perhaps cosmic/space-inspired. All three bots (TITAN, HUDHUD PRIME, NOVA FUSION) may code, design, test, polish, and fix each other's work. Preserve all other homepage behavior and layouts. Do not merge or deploy production; no destructive DB or security changes.

## Build rules
- Inspect the actual homepage video player and relevant components before editing. Prefer an isolated game component with a preview-branch-only integration; keep video code recoverable in main.
- Touch/swipe/drag gameplay on iPhone; also keyboard/mouse support; clear restart, score/progress, reduced-motion option, no accidental page swipe or scrolling conflicts.
- Each turn: read this handoff and latest branch SHA; implement one meaningful tested increment; commit; record exact SHA, changed files, tests, blockers, screenshots/preview if available, and next action.
- Only one bot edits at a time. Verify Vercel build status, and never claim playable until actually tested.
- Scheduling experiment: ideally each bot ends by disabling its completed one-time task and enabling/scheduling the next bot ~1 minute after its own work finishes, using automation tools ONLY if genuinely accessible within its run. A bot must not claim it switched another bot without tool confirmation. If self-scheduling is unavailable, leave clear status and use externally prearranged one-time schedule. Avoid loops or duplicate concurrent runs; cap initial experiment at three passes (TITAN → HUDHUD PRIME → NOVA FUSION), then assess before indefinite rotation.

## Handoffs
### TITAN
Completed initial implementation. Read docs/TITAN_GAME_LAB_HANDOFF.md for commits, tests, blockers and next steps.
### HUDHUD PRIME — follow-up integration (2026-10-21)
Commit: `94cd599936d5b25aa48d52b31ae7846d477f387a`
Changed: `app/page.tsx` — added Desktop/Phone/Audio/Games format tabs, isolated Cosmic Catch to Games, routed Desktop/Phone to LiveHomePreview, added empty-state links and stream navigation. Existing conversation remains below player.
Tests: GitHub write returned commit SHA; no build, browser, or iPhone gameplay test completed. Blockers: audio-only tab currently displays a placeholder rather than an actual audio player; live-stream filtering currently queries desktop/phone by aspect ratio and does not query audio streams. LiveHomePreview is muted and thumbnail-oriented; production-grade interactive viewing still requires validation. The shared conversation can still show demo mode in Games.
Next for NOVA FUSION: verify TypeScript/Vercel build, actual LiveKit room playback, touch switching and responsive layout; implement audio stream discovery/player and disable live chat in Games if appropriate. Preserve production and other homepage features.

### NOVA FUSION
Pending.


### TITAN — Arabic Letter Quest lead pass (2026-10-21, later experimental rotation)
Scope: experiment/three-bot-game-lab-20261021 ONLY. No main or production changes, no automation changes.
Commits:
- `c926cd551d538e503cb29d2cdd57e09b5c7f7660`: rewrote `app/components/CosmicCatchGame.tsx` with 28 Arabic letters, five staged challenges (6/6/6/6/4 letters), three-round Guardian review boss, target waves that always include the correct letter, 100+ point scoring, five hearts, correct/incorrect feedback, tap-to-shoot, 3D-style radial spheres/perspective field, shatter shards and laser flash, accessible numbered shoot buttons, keyboard 1–4, pause/resume, current-level restart, reduced-motion control, optional WebAudio only after explicit Sound on.
- `794f869c065aa17e1d51fc21bb8674234e85d7d5`: corrected initial `mistakes` counter field. The preceding `c926cd5` Vercel deployment FAILED TypeScript checking specifically for this typo; fixed commit `794f869` Vercel deployment `dpl_2M2CFHiJVjXWKRhCAyLQNqRL54wy` was confirmed READY.
- `cbac3ebbbe4aa0adf43d8509b25ea0f34287601b`: appended responsive styling in `app/components/CosmicCatchGame.module.css` for proportionally sized canvas, letter target buttons, HUD, and accessible controls. Vercel deployment `dpl_3KSGg24HytkR8qq2XQ8hzY1cbySh` confirmed READY.
- `cffda54e4cffc7f218734e7b1ab2ca3035db650f`: refilled five hearts at new-level checkpoints and on current-level retry. Vercel deployment `dpl_7i6Ptm2cjJ8i45NqfsRFtqJB16YQ` was BUILDING at the last inspection; do not claim READY without checking.
Files modified: `app/components/CosmicCatchGame.tsx`, `app/components/CosmicCatchGame.module.css`, and this handoff document.
Validation: GitHub commits returned actual SHAs; Vercel Next.js deployment READY on two intermediate commits (build/type-check evidence). Earlier build failure was read from Vercel logs and fixed. No actual iPhone/desktop browser gameplay, touch hit-testing, sound, screen-reader, or anonymous-access smoke test has been performed in this pass.
HUDHUD PRIME next: read fresh branch HEAD before editing. Verify latest Vercel build and inspect logs. Test touch taps on orbs and numbered accessibility buttons, keyboard 1–4, correct/wrong letter scoring, five-heart retry, stages 1–5, Guardian review victory, pause/background freeze, reduced motion, audio opt-in, and stage layout at 320px/iPhone. Fix issues and record exact SHA/test proof. Preserve Desktop/Phone/Audio/Games tab routing and production. In particular, verify any parent homepage swipe interception and stage height at short viewports. NOVA FUSION then performs independent QA.
