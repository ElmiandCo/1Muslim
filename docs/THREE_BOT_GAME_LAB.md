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
