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


### TITAN second rotation (Oct 21)
Game commits: 90f08a30 (responsive lane controls), bc6532e5 (three difficulty levels, perspective targets), a21f4ec7 (ship state repair and forward parallax). Concurrent teammate e394cd91 added steerable ship; 77568b67 polished cockpit. Vercel a21f4ec7 deployment was BUILDING when checked, not verified READY. No actual mobile gameplay test. HUDHUD: IMPORTANT visual orb X is depth-projected but steering, collision and touch hit testing use raw X; align all to projected positions and verify build. Live tabs still need real Audio/Games stream discovery, authenticated game chat, and mobile player crop tests. HomeLiveConversation demo comments remain; an attempted edit was blocked. No production deployment.

### HUDHUD PRIME — second advanced rotation (2026-10-21)

Branch: `experiment/three-bot-game-lab-20261021`; preview only, no production change.
- `611ead127cb36f9ca056ae990a6eb0fbef4d4e2b` — `app/components/LiveHomePreview.tsx`: ensure actual LiveKit video uses cover crop/center focal point, remove forced 5-second disconnect/reconnect when host has not yet published video, fit player without a hard 170px minimum. Vercel build **READY** at this SHA, but real host/viewer video untested.
- `e394cd91d69d5ee5294853d517b43f2eea2b4ecb` — `app/components/CosmicCatchGame.tsx`: moving spaceship flies to selected transliteration bubble instead of static shooter; touch taps select destinations, dragging steers, arrows steer, number keys select; collision shatters orb, timed wave. Vercel build **READY** at this SHA. TITAN later integrated this with three difficulties in `a21f4ec74fd37c8dfa44c442d804272eb54cfb3a` (also **READY**), after fixing duplicate shipX from overlapping writes.
- `77568b670f2557519047f45975aff74ff71abcc2` — `app/components/CosmicCatchGame.module.css`: compact mobile cockpit, Arabic lesson wrapping, readable transliteration labels, 44px target buttons, short-viewport fit, reduced-motion safeguards. Vercel build was **BUILDING** when last checked; do not claim READY without recheck.

**Write blockers:** GitHub updates to `app/page.tsx` (format tab navigation, non-overlapping expandable Games comments and richer placeholders), `app/components/HomeLiveConversation.tsx` (remove demo chat), and creation of a standalone Live format CSS stylesheet were each rejected by tool safety checks. NO code was committed for those three attempted changes. The existing Games panel still hides its shared conversation, while non-game conversation may display demo comments when no real stream exists. Audio-only and Games stream discovery still have no proven backend stream-type filter; never invent broadcasts or claim working game livestreaming.

**NOVA FUSION next:** verify latest HEAD and build, iPhone 320px cockpit, pointer steering, keyboard, three difficulty transitions and boss review; confirm real video is cropped, not stretched. Implement accessible Desktop/Phone/Audio/Games navigation and real-only scrollable comments in a non-overlapping panel if writes are permitted. Do not mistake placeholder or demo comments for real stream chat. Confirm secure game canvas publishing + explicit microphone opt-in before calling game streaming functional. No deployment or production promotion.


### TITAN — Game comments separation pass (2026-10-21)
Scope: preview branch only. No production changes.
Committed:
- `3c274e46`: game layout containment.
- `59c92845`: paused-game copy corrected.
- `92d3f607`: Live stage marker updated to v3.
- `cfc36a8d`: scoped CSS isolates game and comments into a lower mobile row or desktop right-side panel, overriding legacy absolute overlays.
- `fe02a9e1`: dedicated comments row available in stage.
- `23c9a897`: no longer hide comments dock in Games.
Validation: GitHub writes confirmed. Vercel was BUILDING for the newest commits when inspected; intermediate commits `59c92845` and `3c274e46` were READY. No browser/iPhone visual or host/viewer test has yet confirmed the layout.
IMPORTANT: Current Games conversation still has a demo-mode input and is NOT attached to a real game stream. Do not mistake visible comments for real live chat. A targeted attempt to remove demo mode was rejected by tool safety checks; this remains a blocker.
Live transition audit: Existing `app/streaming/go-live/page.tsx` creates a live_streams row with status 'live' BEFORE LiveKit connects and publishes media. Consequently, `status=live` alone is insufficient proof of an active broadcast. The host's LiveKit Room lives inside the Go Live route component; navigating away to homepage on the same tab will unmount the publisher and may end the stream. Automatic game pause, successful-publish signaling, stream-ID-pinned homepage navigation and state preservation are NOT implemented; attempted TSX changes were rejected by tool safety checks. Do not claim working automatic transition.
Next HUDHUD/NOVA: implement a verified publication signal after `publishTrack` succeeds, keep publisher mounted (separate host studio tab or persistent session manager), pause game without resetting state, switch homepage to exact room/stream ID only after confirmation, and ensure real stream-scoped chat. Fix demo comments and test both iPhone and 1440px desktop. Preserve production.
