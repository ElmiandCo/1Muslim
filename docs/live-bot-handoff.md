# 1Muslim Live — Bot A → Bot B handoff
Date: 2026-10-30 (America/Chicago)

## Branch and review order
- Base main: current GitHub `main` (production untouched by this work).
- PR #188: https://github.com/ElmiandCo/1Muslim/pull/188
  - Branch: `fix/studio-three-mode-morph-and-voice-1030`
  - Original layout fix; **still open** when Bot A began.
- Bot A branch: `bot-a/live-audio-lifecycle-morph-20261030`
- Bot A stacked PR #190: https://github.com/ElmiandCo/1Muslim/pull/190
  - Base is PR #188's branch, not main. Review/merge #188 first, then retarget #190 to main after #188 merges.
- **DO NOT merge, promote, or deploy to production automatically.** Keep all changes reviewable.

## Bot A commits
1. `ed29564c178b80a32de59cc80710df2ea206f24b` — viewer metadata for audio-only mode; host identity and terminal signal subscription; host disconnect banner; DB terminal-state polling every 2 seconds even while connected.
2. `e5dce5e82c63a8ef66e0bfd14b3f74e08d1210ec` — viewer voice avatar with reactive aura; audio subscription and cleanup; microphone audio stage appears without waiting for video.
3. `cb8bad4ddec68d9a4681e90c866260a45731a2d6` — host explicit End Live: send reliable LiveKit data message (topic `live-status`, `type:live-ended`) and persist `live_streams.status=ended` before disconnect; host reconnection notices.
4. `016c1c8adf39bae9a40fc73096521d035cde729a` — remove serial LiveKit region prewarm before connect; allow audio-only getUserMedia; do not abort a live broadcast if MediaRecorder fails.
5. `4af74f19900c9519b8100a8d898894c07c9e1960` — support MediaRecorder audio-only formats for Voice Live.
6. `4af3aac603ecceaeaa22a9ec574cd18601da4975` — actual camera dimensions now interpolate over two seconds using container query units; motor sound sweeps for ~2 seconds; Phone fullscreen; Desktop 16:9 with gentle hover; Voice square.
7. `2f611d5fbae848401debaf462d0af44437ed8b51` — resilient profile query for avatar.
8. `349e4564c0e82c336450243acc99bd6d3fc99b13` — Voice Go Live button skips 3-second countdown and starts connection immediately; audio-only host counts as ready.
9. `9c6986e2545d750fcc7f8b77288a99c5e8b36fe8` — reset Voice launch guard on both success and failure.

## Scope
- `app/streaming/go-live/page.tsx`
- `components/LiveKitViewer.tsx`
- This handoff document only.
- All other application features left untouched.

## Behavior intended
- Phone: edge-to-edge, full-height video behind fixed controls.
- Desktop: full-width 16:9 camera 12px from top; subtle vertical floating, including during Live.
- Voice: compact centered square avatar; host uses local mic amplitude; viewer uses remote mic amplitude. Viewer avatar is visible while connecting to audio-only Live.
- Switching modes: 2-second canvas position/size morph, curtain and camera/zoom sounds. Do not change room ID when switching.
- Host clicks End Live: host UI responds immediately; send terminal LiveKit packet and update database, then disconnect; viewers handle data packet, Realtime update or 2-second polling fallback.
- Unexpected host network loss: viewers see reconnecting status via LiveKit host ParticipantDisconnected; **do not** mark broadcast ended on transient loss.
- Viewer refresh: join the same room with a fresh viewer token; host broadcast unaffected.

## Tests / verification
- Inspected GitHub main, PR #188 diff, host and viewer code and LiveKit token route.
- GitHub commits succeeded and Vercel automatically started preview builds. Several intermediate preview builds reached READY (through commit `4af3aac6`); the final head commit build remains to be checked. **No local TypeScript build, browser/iPhone session, or end-to-end LiveKit session has been performed.**
- Check https://vercel.com/elmiandco/1muslim/deployments and filter branch `bot-a/live-audio-lifecycle-morph-20261030`; use the newest commit's deployment, not an earlier build.
- Do not claim production is changed.

## Known limitations and next steps for Bot B (priority)
1. **Build check first.** Inspect latest preview build and logs. Fix TypeScript or CSS failures before testing.
2. **Mode switching during an already-running Live:** current `selectStudioMode` toggles local video-track.enabled, but does NOT publish a camera track when starting in Voice and switching to Phone/Desktop, nor unpublish when switching into Voice. Implement correct LiveKit track publish/unpublish and keep the same room/stream ID. Handle async race on repeated rapid taps.
3. **Avatar metadata:** viewer queries `live_streams.host_id,aspect_ratio` and `profiles` via Supabase. Verify public RLS allows reads. If not, use a secure server endpoint with only public display fields.
4. **Host disconnected but browser crash:** LiveKit ParticipantDisconnected notifies existing viewers when server removes host; actual delay depends on LiveKit timeout. Consider server-side room/webhook status and bounded grace period, but never mark ended on a momentary reconnect.
5. **Terminal status reliability:** host updates Supabase from browser and sends LiveKit data. Add retry/server-backed end endpoint if tests reveal RLS/network failure. No fabricated instant guarantee.
6. **Viewer audio playback:** autoplay policy can require tapping Unmute. Test iPhone Safari, signed-in and anonymous viewers, Audio Live startup, refresh and reconnect. Check remote analyser resumes after tap.
7. **Responsive layout:** test iPhone portrait, iPhone landscape, desktop. CSS uses `cqw` container units (supported in modern Safari), and prior overrides exist earlier in the same style tag; check computed styles and avoid another left-half clipping regression.
8. **Recording:** audio-only MediaRecorder creates audio MIME files in `live_recordings.video_path`. Check downstream playback and thumbnails for audio MIME; if incompatible, preserve broadcast and handle recording separately.
9. **Host audio without camera:** after choosing Voice, use "Enable camera & mic" to request audio-only; initial auto-preview defaults to Phone and may request camera before Voice selected. Test permission-denied recovery.
10. **End notification polling:** currently every 2s per viewer. Confirm load is acceptable, optimize via Realtime and appropriate backoff if needed.
11. **UX:** Host End Live should not wait for recording upload; confirm viewers see "Live complete" rather than reconnect error. Make host Audio Live avatar visible immediately on Go Live.
12. Keep PR #188 and #190 unmerged until reviewed; hand off a new PR or add commits only to Bot B's isolated branch.


## Bot A follow-up — camera "mirror" flash regression (2026-10-30 23:36 CT)
- Commit `2a14b0b3eb06655414c4956384198ee1be39c53b`: removed the legacy 2-second opaque camera curtain and `studioCameraReturn` video fade (which deliberately hid live frames for the first ~46% of each switch). Removed the `studioCameraSettle` transform animation that could override front-camera orientation and look like a horizontal mirror flip. The frame's width/height/position transition and subtle border effect remain.
- Desktop ↔ Phone now changes layout only: **do not stop, disable, restart, replace, re-acquire, or re-publish the camera track** for this pair. Preserve the exact video element and stream. Voice remains intentionally camera-off; Bot B must implement LiveKit publish/unpublish for Voice transitions, with a single room ID.
- User explicitly does **not** want the mirror/flip/blackout effect when moving between Desktop and Phone. Check iPhone Safari, live and pre-live, with the front camera, back camera, and rapid repeated switches. Verify orientation stays constant and no blank frame appears; verify broadcast recipients see uninterrupted video.
- **PR dependency is mandatory:** PR #190 is stacked on PR #188's branch (`fix/studio-three-mode-morph-and-voice-1030`), not on `main`. Bot B should build on the correct base and avoid cherry-picking #190 onto `main` without #188. Merge neither without review, and do not deploy.
- Static source review only for this follow-up; the newest preview build and real-device behavior are **not yet verified**.

## Acceptance checklist
- [ ] Vercel preview build READY with no TS errors
- [ ] Phone camera fills the entire screen including bottom controls
- [ ] Desktop 16:9 high with 10–15px margin and continuous subtle float
- [ ] Voice square centered, host and viewer see same avatar
- [ ] Every pairwise mode switch animates smoothly for ~2s with audible zoom cues
- [ ] Desktop ↔ Phone never blanks, flips, mirrors, or restarts camera; live viewers see continuous frames
- [ ] Audio Live begins promptly, viewer sees avatar before/when audio arrives
- [ ] End Live signals viewers immediately without waiting for host reconnect
- [ ] Network interruption shows reconnecting promptly, not a false "ended"
- [ ] Viewer refresh reconnects to same broadcast, host stays live
- [ ] No regression in non-Live pages; no production merge


---

## Bot B continuation — 2026-10-30/31

### Branches / PR order
1. **PR #188** `fix/studio-three-mode-morph-and-voice-1030` — camera layout foundation.
2. **PR #190** `bot-a/live-audio-lifecycle-morph-20261030` — Bot A, stacked on #188.
3. **PR #193** `bot-b/live-track-switch-final-20261031` — Bot B, stacked on Bot A #190.

Review and merge **in that order only**, retargeting each downstream PR to `main` after its prerequisite merges. Never merge or deploy automatically. Earlier Bot B drafts **PR #189**, **PR #191**, and **PR #192** were superseded without merge: #189 overlapped Bot A's viewer code; #191 and #192 diverged while Bot A was still updating its branch. PR #193 starts from Bot A's completed head and supersedes them.

### What Bot A finished (verified in branch and handoff)
- Actual ~2-second three-mode camera canvas morph with lens motor/zoom sound; Phone full bleed, Desktop 16:9 with subtle hover, Voice centered square.
- Audio-only capture, local audio recording support, removal of serial LiveKit region prewarm.
- Host LiveKit reconnect status and reliable `live-status` packet (`type:live-ended`) on explicit End Live.
- Viewer voice avatar and remote microphone amplitude animation; authenticated host disconnect banner; 2-second terminal-state polling even while connected.
- One-tap immediate Voice launch when microphone preview is already ready (later Bot A commits).

### What Bot B added in PR #193
- **Live mode switching after broadcast starts:** serial camera `publishTrack` / `unpublishTrack`, without disconnecting LiveKit or replacing the microphone; requests video permission when switching from an audio-only Voice stream to Phone/Desktop. The mode queue and desired-mode ref prevent stale rapid-tap operations from winning.
- **Host-authorized mode metadata:** `POST /api/live-mode` verifies stream ownership and updates `aspect_ratio`, `video_width`, and `video_height`. Existing viewers follow Supabase Realtime / polling, and the viewer avatar also falls back to remote audio presence when no video is subscribed.
- **Host-authorized terminal endpoint:** `POST /api/live-end` verifies host ownership, idempotently persists `status=ended` / `ended_at` with service credentials, then best-effort closes the LiveKit room. The host sends its reliable terminal data packet first, calls this endpoint, falls back to a direct DB update if the endpoint fails, and does not wait for recording upload.
- **Viewer resilience:** automatic capped-backoff retry after initial connect failure or unexpected disconnect; deduplicated retry timers; clear stale errors when audio/video arrives; 2-second DB terminal checks with concurrency guard; stale host heartbeat is displayed as reconnecting, **never treated as terminal**; refresh status immediately when tab returns to foreground.
- **Refresh preserves room:** the server-rendered Live viewer page no longer treats stale heartbeat as a completed stream while the database status is still `live`. This allows a waiting viewer to refresh and rejoin the same room.
- **Voice one-tap permission flow:** when the first Voice Go Live tap must request microphone permission, the broadcast begins automatically when audio-only preview is ready; no second tap required.

### Build and test evidence
- GitHub file edits and PR creation succeeded.
- Vercel preview for Bot A commit `28c153c299` was **READY**.
- Bot B intermediate preview `5b7487d142` was **READY** after fixing a TypeScript argument mismatch for Bot A's `playCameraAdjustSound(mode)`.
- Later Bot B commits include the Voice permission-flow state initialization fix; check the newest PR #193 head deployment for final **READY**. Earlier preview errors are superseded and must not be treated as final status.
- **No real host/viewer LiveKit session, iPhone Safari camera test, browser UI screenshot, or runtime latency measurement was performed.** Static build success does not prove these interactions.

### Remaining risks / required acceptance testing
1. Open the **newest** PR #193 preview, test Phone, Desktop, Voice and all six mode-switch directions on iPhone portrait/landscape and desktop. Confirm full-bleed Phone camera through the bottom edge, Desktop 12px top margin and subtle floating, Voice centered, no left-half clipping.
2. While actively live, switch Voice → Phone → Desktop → Voice. Verify camera publications appear/disappear and microphone remains uninterrupted. Try very rapid taps and camera-permission denial.
3. With two devices, start Audio Live, refresh the viewer repeatedly, confirm the same room ID and avatar/remote audio; tap Unmute if browser autoplay blocks sound.
4. Explicit End Live must show the viewer completion notice via host packet, Supabase Realtime, or <=2s polling when online. Verify server route returns success and LiveKit room is deleted after terminal status.
5. Simulate Wi-Fi loss and recovery for host and viewer. Display reconnecting promptly but do not mark ended unless authoritative terminal status arrives. Actual LiveKit disconnect detection latency depends on server/network.
6. Confirm public-profile RLS permits viewer avatar reads; fallback avatar exists when it does not. Verify recorded audio MIME playback and post-live recording UI.
7. Monitor 2-second per-viewer DB polling load under audience scale; consider a server-side status fan-out or longer fallback interval if necessary.
8. Review auth and service-role environment variables for the new `/api/live-mode` and `/api/live-end` endpoints.
9. Do not claim these changes are production/live until explicitly merged and Vercel production is READY.

### Bot B implementation notes
- Host switches use `room.localParticipant.videoTrackPublications`, `unpublishTrack(track,false)` and `publishTrack(mediaStreamTrack,{source:Track.Source.Camera})`. Camera-only permission requests never replace the active microphone.
- A failed camera permission leaves the audio broadcast connected and displays an error. No room or stream ID is regenerated by mode switching.
- A stale heartbeat is evidence of a possible disconnect, **not** evidence of End Live; only terminal DB status or an authenticated host LiveKit packet closes the viewer.
- If host closes the browser without pressing End Live, a separate server-side cleanup policy is still needed to eventually mark abandoned streams ended. This PR intentionally does not falsely end a recoverable stream.


### Bot B second review — 2026-10-30 23:41 CT
- Re-read PR #188, Bot A PR #190, Bot B PR #193 and current main. Confirmed PR dependency order remains **#188 → #190 → #193** and all three remain unmerged.
- Static review identified a concrete Phone-mode viewport regression in the final CSS: the camera stage was still `100dvh - 74px - safe-area`, which leaves the lower part of the viewport uncovered even though the video child uses `height:100%`. Fixed the authoritative stage height to **100% of its full-viewport parent panel**, allowing Phone camera pixels behind the fixed bottom controls and header overlay. The video element still morphs over 2 seconds to Desktop geometry and Voice's centered square; the camera track remains stable across Desktop ↔ Phone.
- Fixed the Voice first-tap button label: it now says **Go Live**, not **Enable Camera**, when audio-only microphone permission is still needed. The one-tap permission/launch logic remains unchanged.
- Code commit: `1a151a0a9c1e7eb94c866a6614108e0443775d03` — `Fix Phone full-viewport camera stage and Voice one-tap launch label` on PR #193.
- Vercel preview build for this new code commit was **INITIALIZING** at initial check (deployment `dpl_GFVUg1gUtn5TJpi7dpUtsREuZ9fZ`). Earlier PR #193 head `c6f4989b` was **READY**, but that result does not validate this new commit. Check newest deployment before claiming build success.
- **Still unverified:** real iPhone Safari computed styles/frames, host-viewer two-device LiveKit audio, remote avatar reaction, rapid live camera switches, permission-denied recovery, measured End Live latency, reconnect/disconnect latency and audio-only recording playback. No production changes. 


---

## Bot A continuation after Bot B PR #193 — 2026-10-31

### Verified starting point
- Inspected GitHub `main` at `81e7f39235e7`, PR #188 (layout), PR #190 (Bot A), and Bot B's final PR #193, commits, diff and handoff.
- Bot B's final branch `bot-b/live-track-switch-final-20261031` is stacked on PR #190, which is stacked on PR #188. The branch was 25 commits ahead of `main` and zero behind at inspection.
- Verified through Vercel that Bot B's final handoff commit `84189159c212` and Phone viewport fix `1a151a0a9c1e` both have READY preview deployments. This validates compilation/deployment, **not** live camera or microphone behavior.
- Earlier Bot B PRs #189/#191/#192 were superseded and should not be merged.

### New isolated Bot A branch
- Branch: `bot-a/live-audio-autoplay-preview-recovery-20261031`, based directly on Bot B final PR #193 branch; review stack **#188 → #190 → #193 → new Bot A PR**.
- `4f969eab280eb174f65ee16b0bdc3282a8a7ab31`: viewers now attempt audible host audio immediately instead of deliberately starting muted. When browser autoplay blocks it, show a prominent “Hear Live” button and explanation; one tap resumes playback and the audio analyser. Browsers requiring a user gesture cannot be bypassed.
- `a50aa6c52d9869ac0d5f34ba336ce70f829dd992`: repair pre-live Voice → Phone/Desktop when the initial preview was microphone-only. Request only the camera track, keep the existing microphone and stream, attach video to the same preview element, and prevent Go Live while the camera permission request is pending. Desktop ↔ Phone remains geometry-only, with no camera stop/restart/flip.
- No change to room ID, active video-to-video track identity, LiveKit audio publishing, recording, auth or End Live APIs.

### Verification and remaining acceptance work
- Source reviewed for targeted changes. GitHub commits succeeded; **new branch Vercel head build must be confirmed READY** before review. No local build, browser UI, real iPhone Safari test, or two-device LiveKit session was run.
- Test a viewer on desktop with autoplay permitted: sound should start automatically. On iPhone Safari with blocked autoplay, tap “Hear Live” once and verify host audio and reactive avatar. Test Mute/Unmute and reconnect.
- Test pre-live Voice-only microphone permission → Phone/Desktop camera permission; verify microphone track identity remains unchanged, preview shows video, and Go Live publishes camera + microphone. Deny camera permission and verify audio stream is not destroyed.
- Test six pairwise mode directions while live, especially Desktop ↔ Phone front/back camera, rapid taps and no black/mirrored frames. Verify viewer audio remains uninterrupted, End Live terminal notice arrives, and reconnect/refresh reuses the room.
- Test anonymous viewers, host avatar public RLS, recording MIME playback, heartbeat behavior and polling load. None of these are claimed verified by a READY build.
- Do **not** merge, promote or deploy to production automatically.


## 2026-10-31 — Bot A cinematic stage correction (handoff to Bot B)

- **Starting point:** production `main` merge `21667cab863693b1ab02963c7b3d6423bf35b956`.
- **Branch:** `bot-a/live-cinematic-zoom-tilt-fullbleed-20261031`.
- **Pull request:** [#195](https://github.com/ElmiandCo/1Muslim/pull/195) (draft, against `main`; Bot B should branch from this head and open a dependent PR).
- **Implementation commit:** `d8741320ec034dd57381f23607ba239d9a3d3e04`.
- **File:** `app/streaming/go-live/page.tsx` only for runtime changes.
- Replaced direct child video geometry with an always-mounted `.studioCameraFrame` clip wrapper. The frame animates position, width, height, border radius, and slight rotation over 2 seconds. The existing `<video ref={videoRef}>` remains a single persistent DOM node, with independent `scale` and `rotate` CSS longhands for image zoom/tilt while preserving the `frontCamera` CSS mirror transform. No media track or LiveKit changes.
- Desktop stage now sits lower in the canvas, with a visible 16px peak-to-peak, 5.5-second float; Phone uses a full-height zero-radius stage behind overlay controls. Mobile layout/preview/panel are explicitly `100dvh`; camera frame covers `100dvh` without subtracting the footer or safe area.
- Voice stage retains its existing avatar and hides the camera wrapper; existing voice camera unpublish logic remains untouched. Reduced-motion mode disables camera/frame animation.
- **Bot B:** Continue on this exact branch (or create a child branch based on its latest SHA), check CSS precedence and iPhone Safari runtime; test Desktop↔Phone during an active LiveKit broadcast, including no blackout, no mirroring change, no track republish; test Voice↔Phone, audio, End Live, reconnect, landscape and short viewport. Adjust the cinematic zoom/tilt strength and desktop vertical placement if needed. Build and provide preview. **Do not merge/deploy to production automatically.**
- **Testing still required:** real iPhone Safari with two devices, exact viewport under bottom controls, camera-track identity, continuous audio, and mode transition appearance. GitHub code changes alone are not evidence of device pass.

## 2026-10-31 — Bot B viewport cascade / cinema placement polish

- **Dependency:** Bot A PR #195, branch `bot-a/live-cinematic-zoom-tilt-fullbleed-20261031`, final head `25d352952630ead1e218dcb3beb7535c8ed9e1b6` (including Bot A's PR #195 documentation). Bot B branched from that exact final head, preserving the persistent camera-frame wrapper and media-track continuity.
- **Bot B branch:** `bot-b/live-cinema-viewport-final-20261031`.
- **Code commit:** `e7f263c367e41e24dd586c2651ca21b600423cba`.
- **Root-cause fix:** Earlier CSS still declares `.preview.studioTransform` at `height:calc(100dvh - 74px - safe-area)` with `!important` and a more specific selector than Bot A's later generic `.preview` rule. That legacy declaration can still win in Safari and truncate the Phone stage. Bot B overrides the **exact** `.preview.studioTransform` and per-mode selectors after the legacy blocks: on mobile, preview is exactly `100dvh` (no footer/safe-area subtraction); on desktop, it fills 100% of its stage panel. The Phone camera frame remains edge-to-edge behind bottom overlay controls.
- **Placement polish:** Desktop frame top offset increased to `clamp(150px,21dvh,230px)` on phones and `clamp(110px,15dvh,190px)` on wider displays after reviewing the user-provided 4.17s iPhone recording (`flipped.mp4`), which shows Desktop video reaching up under the header and Phone mode collapsing into a top strip with empty space below. The new frame-wrapper + viewport fix directly targets those failures. The 2-second frame + independent lens zoom/tilt and 5.5-second 16px floating motion from Bot A are preserved.
- **Follow-up placement commit:** `52efa28e69c104e4a62f3c4f4637670c5de0fa2a`.
- **Static safety review:** No React tree remount, `srcObject` reassignment, media acquisition, `getUserMedia`, `publishTrack`, `unpublishTrack`, End Live API, recording or viewer changes in Bot B commit. Existing `frontCamera` `scaleX(-1)` transform remains separate from the new image `scale`/`rotate` longhands.
- **Verification required before merge:** Confirm newest Bot B Vercel preview is READY; test on real iPhone Safari (including notch/safe area, portrait/landscape, short screen), desktop stage placement, continuous track identity and audio during Desktop↔Phone↔Voice, rapid mode switching, End Live terminal notice, reconnect and refresh. A green build alone does **not** establish those runtime results. Do not merge or promote to production automatically.


---

## 1MuslimLive2.0 — Bot A backend implementation (2026-10-31)

**Strict scope:** No UI/CSS/layout/animation/navigation changes. Isolated branch `1MuslimLive2.0` (base: main at initial spec commit `e258315dc2f857f5ef8a8fc99278fbbfa3bc2ba2`). No merge or production promotion.

### Bot A commits, in order
1. `43df59322af333bb1d0944fd131760f47de02201` — `supabase/migrations/20261031052500_live_2_event_presence.sql`: RLS-protected live_presence, private observation and webhook dedupe tables, service-role-only transactional snapshot RPC, monotonic version on state changes, terminal-status trigger, Supabase Realtime publication.
2. `dff029f08a4d52b82f2d1f4dfe8863ebad2eba0a` — `lib/live-presence.ts`: server-side host track classification.
3. `4b43571cb5cd3dee82a1679d49b864c25cee12e8` — `scripts/live-presence.test.mjs`: five readiness classification tests.
4. `4f5dc133d9cf78bfdf0002319d20fd72eb3164b6` — `app/api/livekit/webhook/route.ts`: raw-body signature verification with LiveKit WebhookReceiver, host identity check, current LiveKit room participant/track snapshot, idempotent ordered DB RPC. Viewer/guest events cannot promote a Live.
5. `315c54230aa72eeda9feedac4389ea126d3feda1` — `app/api/live-discovery/route.ts`: public, 1-second CDN-cacheable snapshot of verified READY_AUDIO/READY_VIDEO broadcasts; fails closed if DB/migration unavailable.

### Design and safety
- READY only after LiveKit reports a connected host and at least one published audio/video track. Guest and viewer media do not qualify. Audio-only streams are first-class.
- Webhook is verified against LIVEKIT_API_KEY/SECRET, not a browser-supplied isLive flag. Event IDs are deduplicated. Snapshot observations are ordered and state transitions serialized with live_streams row locks; ENDED is terminal and wins over late webhook observations.
- Existing `POST /api/live-end` and host fallback update live_streams.status; the new SQL trigger atomically changes presence to ENDED. The room close remains best-effort.
- Public realtime RLS restricts presence to public streams (or stream host). Observations and webhook events are not exposed to viewers. Discovery returns only public streams.
- No extra per-viewer polling was added. Existing 2-second polling in `components/LiveKitViewer.tsx` and 5-second polling in `app/streaming/page.tsx` remain until Bot B replaces them.
- Do not enable this endpoint in production until migration and LiveKit webhook URL are configured. New webhook URL: `https://<deployment-host>/api/livekit/webhook`. LiveKit must be configured to POST signed webhooks to it.

### Verification
- Inspected production main's live-end, live-heartbeat, live-mode, livekit/token, live-alert, streaming discovery and LiveKitViewer code before changes.
- Node v22.16.0: `node --experimental-strip-types --test scripts/live-presence.test.mjs` — 5/5 passed on a local copy of the committed helper and tests.
- **NOT verified:** SQL migration execution on Supabase, Next.js TypeScript build, Vercel preview READY, webhook delivery/signature end-to-end, LiveKit real rooms, browser/iPhone latency, performance at 1k viewers. Do not claim the target latencies as measured.
- Database migration is not applied by a GitHub commit alone. No live data was modified.

### Bot B integration priorities
1. Check branch HEAD and this handoff before modifying. Preserve Bot A files. Run Next build and inspect Vercel preview; fix any type/schema errors.
2. Wire eligible Live-capable surfaces to `GET /api/live-discovery` initial snapshot + Supabase `live_presence` Realtime changes. Use version/session_id to ignore stale updates, and one multiplexed subscription rather than repeated per-viewer queries. Preserve ALL existing UI and styling.
3. Replace 2-second `LiveKitViewer` terminal polling and 5-second streaming discovery polling with realtime events; use bounded exponential backoff/jitter only when disconnected. Keep host LiveKit packet for fastest explicit End Live.
4. Verify signed-out discovery, host audio-only, screen share, viewer refresh, mode switching, host disconnect/reconnect, explicit End Live, out-of-order events, and room recreation. Test that reconnecting streams are removed from new discovery but existing viewers remain in their room.
5. Configure and test the LiveKit webhook on preview only when authorized. The webhook endpoint cannot work without its URL configured at LiveKit and the migration applied to the relevant Supabase environment.
6. Add a server-side periodic reconciliation/watchdog for missed webhooks and stale READY entries; current existing 75-second stale-stream cron remains an emergency terminal fallback. Do not confuse 15-second heartbeat with viewer latency.
7. Assess security: service-role-only RPC, public/private visibility, anon subscriptions, database table growth and webhook event retention. Add pruning for webhook event dedupe rows and load tests.
8. Measure actual p50/p95/p99 event latency. Targets (<1s start, <500ms End Live, 1–2s disconnect notice) are **not guarantees**; silent network loss may exceed 2s.
9. No merge, no production deployment, no UI changes without explicit approval.


---

## 1MuslimLive2.0 — Bot B verified discovery integration (2026-10-31)

### Isolation, review, and production safety
- Bot A starting head: `24a17649bfb486a02d0a92bc5acc58ca727c93ac` on `1MuslimLive2.0`.
- Bot B isolated follow-up branch: `bot-b/live2-discovery-integration-20261031`.
- **Draft stacked PR #200:** https://github.com/ElmiandCo/1Muslim/pull/200 — base is `1MuslimLive2.0`, **not** `main`. Do not merge/deploy without approval.
- Bot A backend commits/migration/webhook were preserved. Bot B did not edit CSS, JSX presentation, layout, visual effects, buttons, navigation, or animations. The only changes are TS data/control logic, verified snapshot API metadata/cache, tests, and this handoff.
- `main` had advanced since the original Bot A base; review/reconcile main changes before any future merge. No production changes performed.

### Implementation
1. `lib/live-discovery-client.ts` — one browser-wide `useSyncExternalStore` subscription to `live_presence` Realtime, shared by eligible screens. Subscribe-before-snapshot recovery, version/session guards, terminal event handling, CDN-backed initial snapshot, short retry after READY to account for cache staleness, visibility/focus refresh, cleanup, bounded jittered 2→4→8→16→30s recovery **only while realtime is unavailable**. A small capped retry also handles transient snapshot failures.
2. `lib/live-discovery-state.ts` — pure `isDiscoverableLive` and monotonic terminal-state guards. READY_AUDIO and READY_VIDEO qualify; STARTING, RECONNECTING, ENDED do not.
3. `app/components/ImmersiveVideoEntry.tsx` — signed-out/signed-in For You discovery now consumes verified READY streams, not raw `status=live`; removes its previous 3s discovery polling and preserves the currently playing stream during RECONNECTING (not for new viewers).
4. `app/streaming/page.tsx` — verified discovery replaces 5s `live_streams` polling; retains profile lookups and selected stream across list reorder/temporary reconnect.
5. `app/components/LiveNowFocus.tsx` — Live focus and carousel consume verified READY streams immediately; existing 10s refresh of **non-Live scheduling/curated content** remains. Keep the selected item stable as new Lives arrive.
6. `app/components/HudHudLiveMiniPlayer.tsx` — shared verified discovery replaces 10s Live polling; existing mini-player stays attached during host RECONNECTING.
7. `components/LiveKitViewer.tsx` — replace per-viewer 2s terminal-state polling with `live_presence` INSERT/UPDATE + existing `live_streams` UPDATE and LiveKit host terminal packet. Initial/visibility checks remain; capped jittered status recovery occurs only when subscriptions fail. Explicit ENDED is terminal.
8. `app/api/live-discovery/route.ts` — add `scheduled_end_at` required by existing streaming UI; public CDN cache `s-maxage=1`, no stale-while-revalidate beyond that.

### Bot B code commits
- `7ef887ebb668` — shared realtime discovery store.
- `4cbc85f92e54` — scheduled-end snapshot field.
- `1106fb07f10d` — For You integration and reconnect retention.
- `79273b16bd16` — streaming page integration.
- `959227030831` — HudHud mini-player integration.
- `b09c7b004fa3` — LiveNowFocus integration.
- `118288184908` — LiveKitViewer terminal/reconnect polling replacement.
- `1be458f5e63b` — lazy browser client and recovery cleanup.
- `9a504f1c6c43` — preserve carousel active item.
- `a1e2e833b4a1` — preserve selected stream on streaming page.
- `2b9e7669a25d`, `b393c71ed253` — CDN cache request and response semantics.
- `9ec3b174c2dd` — fix strict TypeScript nullable channel declaration after Vercel exposed compile error.
- `61b9d41e3a15`, `289d9ce8df80`, `a3d886346fbb` — pure event guards and four state tests.
- `d5449fc881bd` — ignore stale subscription callbacks.
- `fdcfc1d4036d` — prevent stale in-flight snapshot requests blocking a new subscription generation.

### Checks actually performed
- Node v22.16.0, `node --experimental-strip-types --test scripts/live2-discovery-state.test.mjs`: **4/4 passed** on a local copy of the committed pure state module and equivalent test assertions (READY_AUDIO/VIDEO, duplicates, delayed events, terminal resurrection, session mismatch, invalid versions).
- Source-level integration assertions: **10/10 passed** (verified feed, streaming, focus, mini-player, viewer presence events, no 2s/3s/5s/10s discovery polling, shared subscription and bounded jitter).
- Vercel preview for commit `9ec3b174c2dd` was **READY**. Intermediate commits `1be458f5` through `b393c71e` were **ERROR** because the nullable Supabase channel type was invalid; fixed in `9ec3b174`. Later preview builds must be checked by exact SHA; **do not infer final head READY from an earlier commit**.
- No real device, real LiveKit host/viewer session, signed-out runtime, SQL migration execution, webhook delivery, or measured latency/load test was performed. Source checks are not runtime validation.

### Blocking operational prerequisites and risks
1. **Apply migration to isolated Supabase preview only after approval**: `supabase/migrations/20261031052500_live_2_event_presence.sql`. Register the **signed** LiveKit webhook URL for that environment. Without both, the verified discovery endpoint deliberately fails closed (no unverified Lives). No migration/webhook was applied by Bot B.
2. **Add server-side missed-webhook reconciliation/watchdog and dedupe retention cleanup** before claiming robust lifecycle recovery; an orphaned READY presence record can remain until existing stream-status cron terminates it.
3. **Test public RLS + Supabase Realtime** for anonymous and signed-in subscribers; confirm event INSERT/UPDATE payloads include stream_id/version/session_id and delivery latency under load. Realtime Postgres Changes fanout can have per-subscriber RLS costs even without database polling.
4. **Test real devices**: iPhone Safari/desktop, audio-only, video, screen share, host End Live, host crash/airplane mode, reconnect, viewer refresh, rapid mode changes, browser autoplay and signed-out For You. No sub-second or 1–2s claims are proven.
5. **Measure p50/p95/p99 and load** with 1k/10k subscribers, cache hit rates, DB reads, fanout costs and reconnect storms. Snapshot caching is one second, so first discovery may require a retry if the first cached snapshot predates READY.
6. **Remaining independent polling:** For You live-chat messages still refresh every 2s while displayed; viewer count refreshes every 5s; Live focus scheduling/curated data refreshes every 10s. These are **not** Live status polling and should be evaluated separately for scale.
7. Keep PR #200 **draft/not merge-ready** until migration/webhook are verified in preview, newest Vercel build is READY, and host/viewer runtime QA passes. No production deployment.



### Final Bot B readiness refinement
- `4f0225db5b3e` — LiveKit track classification now ignores `muted: true` tracks. A published-but-muted camera is **not** READY_VIDEO; if microphone remains active, the stream is READY_AUDIO. This prevents advertising known-unplayable video as a healthy Live. No visual/host-studio changes.
- `ad21721b4ccb` — three regression tests for muted camera, active audio with muted camera, and muted microphone.
- Node v22.16.0, `node --experimental-strip-types --test scripts/live-presence.test.mjs scripts/live2-discovery-state.test.mjs` — **12/12 passed** using local copies of the committed helpers and equivalent tests (8 readiness + 4 monotonic-state cases).
- Vercel preview for core integration commit `fdcfc1d4036d` reached **READY**. Recheck the final docs/test head before claiming it is READY. No end-to-end LiveKit or device runtime QA.
- Diff from Bot A `1MuslimLive2.0` to Bot B: **no CSS files and no host Go Live studio file modified**. Draft PR #200 remains the review boundary.

---

## Bot B continuation — stalled Realtime recovery and cross-session safety (2026-10-31)

**Review boundary:** draft PR #200 (branch `bot-b/live2-discovery-integration-20261031`, based on `1MuslimLive2.0`). Read Bot A's backend commits and spec, current `main`, PR #193, and the previous Bot B handoff before editing. At inspection, `1MuslimLive2.0` was **2 commits behind main**; reconcile before final merge. No changes to host studio, CSS, JSX presentation, animations, navigation, or production.

### New commits, in order
1. `57827bb2c93d110aa0df13cadad699d019f1ad3b` — reject malformed `live_presence.state` payloads before updating shared discovery.
2. `63d956f437c9c9394eab5f3d477b7e61300de3e8` — viewer now uses the shared version/session/terminal guard instead of accepting a higher-version event from an unrelated session.
3. `6aebe6cdfbe9f38f12bb2458144a1f0f5e9eff19` — one-shot 8-second watchdog for a shared discovery Realtime channel that never acknowledges `SUBSCRIBED`; detach the stalled channel and enter existing bounded jittered snapshot/reconnect recovery. On visibility resume, ensure disconnected subscriptions enter fallback. **No steady-state polling while subscribed.**
4. `a90bb4968b53e3e9c332af2dbddaacd93f939bd2` — regression test for malformed state events.
5. `dab280b1562fae3758a2e3a600d39a017129144f` — one-shot 8-second watchdog for a LiveKitViewer terminal/presence subscription that hangs without a status callback. Only while subscription is incomplete, start existing capped recovery checks; clear watchdog after both subscriptions succeed or component unmounts.

### Checks actually performed
- Node v22.16.0, `node --experimental-strip-types --test scripts/live2-discovery-state.test.mjs`: **5/5 passed**, on a local copy matching the committed pure state helper and equivalent test assertions. This is **not** a full repository test run.
- GitHub Vercel commit status for `dab280b1`: **success**; Vercel deployment `dpl_3uuddx9aVVBzKZ7iyCjnRcNa4z6z` explicitly reports **READY** and references that exact commit. This verifies a preview build, not a real Live session.
- All changes were restricted to `lib/live-discovery-state.ts`, `lib/live-discovery-client.ts`, `components/LiveKitViewer.tsx`, `scripts/live2-discovery-state.test.mjs`, and this handoff. No visual or production changes requested or performed.

### Still blocked / next Bot A and Bot B priorities
- Apply SQL migration only to a separately authorized **preview** Supabase environment, then configure and verify signed LiveKit webhook delivery there; otherwise the new discovery route fails closed. No migration or webhook configuration was changed in this run.
- Add a server-side reconciliation/watchdog for missed webhook events, stale READY state, and retention/pruning of dedupe events; preserve explicit ENDED terminal semantics and temporary reconnect grace.
- Confirm anonymous RLS/Realtime access and test real host/viewer sessions: video, audio-only, screen share, signed-out For You, viewer refresh, explicit End Live, host crash, recovery, room recreation, rapid mode changes, and Safari autoplay.
- Measure p50/p95/p99 start/end/disconnect delivery and 1k/10k viewer load; none measured here. Live chat 2s polling, viewer count 5s polling, and scheduled-content 10s polling remain separate from Live discovery.
- **PR #200 remains draft and NOT merge-ready**. Do not merge, deploy, or modify the UI without explicit approval.

---

## Bot B — All Streams integration and preview safety review (2026-10-31)

### Scope and branch
- Worked exclusively on `bot-b/live2-discovery-integration-20261031` / draft PR #200; base is `1MuslimLive2.0`. No production merge, deployment, database migration, or secret mutation.
- Read Bot A's current base handoff and Live 2.0 specification, PR #200 and legacy PR #193. Preserved existing event-driven discovery, LiveKit viewer and host studio behavior.
- Integrated Bot A's verified hub backend **without overwriting Bot B's newer realtime changes**:
  - `b4d519fe`: `lib/live-hub.ts`
  - `f0d03f1f`: `app/api/live-hub/route.ts`
  - `06c7ae3e`: `scripts/live-hub.test.mjs`
- Integrated missing Bot A hardening from the newer base:
  - `046f2625`: signed LiveKit webhook route with observation timestamps captured before provider snapshots
  - `d348be01`: monotonic SQL snapshot ordering and STARTING/RECONNECTING handling
  - `3403c631`: optional authenticated server reconciliation watchdog route
  - `45d74706`: reconciliation candidate and bounded webhook-dedupe cleanup SQL helpers
- All above were copied from Bot A's current base file contents. Bot B's existing `lib/live-presence.ts` muted-track readiness and realtime client logic were **not replaced**.

### Approved legacy All Streams page
- `7d457859` and `23f9b129`: enhanced the **existing** `/streaming` page (no competing new route) with a legacy emerald/gold design, section navigation, Current Lives, verified Audio Rooms, real Games-tagged Lives, upcoming Scheduled Lives, and genuine public Past Live replays.
- The page consumes `GET /api/live-hub` for public schedule/replay discovery; active Lives, Audio and Games use the existing shared `useLiveDiscovery` READY-only realtime store. The hub snapshot is refreshed on state changes/visibility return, **not fixed-interval browser polling**.
- Current Live and audio/game cards link to existing `/streaming/live/{id}`; replays link to `/streaming/replay/{id}`. Before navigating, the page records scroll position in session storage and restores it on return.
- Replaced admin-only Past Lives listing with public-only uploaded replay contract; no synthetic archive from an ended stream without an actual recording. No fake Games broadcasts. Schedule creation reuses `/streaming/go-live?schedule=1`.
- No changes to For You presentation, Profile, Qur'an, host `/streaming/go-live`, LiveKit player, or camera animations. **The only UI code touched is the approved `app/streaming/page.tsx`.**

### Actual verification
- Local Node 22.16.0: `node --experimental-strip-types --test scripts/live-hub.test.mjs` — **6/6 passed** (public READY, audio-only, stale/invalid, actual archive, schedule expiry, Games classification). Pure unit tests; not LiveKit end-to-end.
- Also ran the combined local Node 22.16.0 suite: `node --experimental-strip-types --test scripts/live-hub.test.mjs scripts/live-presence.test.mjs scripts/live2-discovery-state.test.mjs` — **19/19 passed**, covering hub classification, muted media readiness, monotonic event ordering, session isolation and terminal-state protection. Tests execute pure source logic; no real provider session.
- Vercel preview for UI commit `7d457859` reported **READY**, validating Next.js build and type checks for that page. Newer head status must be checked before declaring the *entire* integrated branch READY.
- Verified Vercel Preview environment has names `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`; **did not retrieve/decrypt or expose values**. `CRON_SECRET` is **not configured**, so the optional reconciliation endpoint deliberately returns 503.
- Supabase connection exposed only project `SecureApp` and **zero development branches**. No confirmed isolated preview database exists. To avoid touching what may be production data, **no SQL migration or live webhook test was run** against that project. Preview environment variables existing does not prove they point to an isolated database.
- LiveKit Cloud webhook registration/delivery could not be inspected with available connected tools. Source statically verifies raw-body signed webhook receiver and host identity check, but a real signed webhook was **not delivered/tested**.
- No two-device host/viewer LiveKit session, iPhone Safari, signed-out runtime playback, or p50/p95/p99 latency/load test was performed. **Do not claim sub-second targets met.**

### Blocking acceptance checklist
1. Provision or identify an isolated Supabase preview branch/project, then apply `20261031052500_live_2_event_presence.sql` and `20261031055000_live_2_reconciliation_helpers.sql` **only there**; validate schema/RLS, RPC authorization and Realtime publication.
2. Confirm LiveKit Cloud's preview webhook destination points to the preview deployment, send authentic signed events, test duplicate/out-of-order, host track READY_AUDIO/READY_VIDEO, host End Live, disconnect/reconnect, and room recreation.
3. Set a preview-only `CRON_SECRET` and schedule reconciliation **only after** isolated preview DB/LiveKit room are verified. Test watchdog and dedupe retention without touching production.
4. Run real iPhone Safari and desktop host/viewer/signed-out flows; measure end-to-end latency and 1k/10k fanout, verify audio autoplay fallback and full-screen viewer return scroll.
5. GoLive category selector currently lacks Games; only actual Games-tagged Lives can appear. A separately approved minimal host category control is needed for first-class game stream creation.
6. Reconcile branch divergence against latest `main` and Bot A base before merge, preserving all existing UI freezes. **Do not merge/deploy without user approval.**


---

## Live Cinema camera/viewer polish — 2026-10-31 (isolated draft PR #214)

- **Base:** GitHub `main` commit `6b3fd144d1ac5981b36dbbd67e72c39115629b66` (checked before editing).
- **Isolated branch:** `bot/live-cinema-viewer-polish-20261031`.
- **Draft PR:** https://github.com/ElmiandCo/1Muslim/pull/214 (base `main`); not merged or promoted.
- **Reviewed before editing:** existing GoLive host track switch and two-second lens sound, `LiveKitViewer`, `LiveChat`, full-screen route, PR #193 and #200, this handoff and Live 2.0 specification. Changes are isolated to Live-related components, helpers, tests and CI.

### Host camera flip
- Previously `flipCamera` acquired a new browser video track, stopped the old video track and replaced it in the preview MediaStream, but **never replaced the already-published LiveKit sender**. The published video could stop while the room/mic remained connected. This is the concrete source-level cause of camera-flip broadcast loss.
- New `flipLiveCamera` helper uses the existing `LocalVideoTrack.restartTrack({facingMode,resolution})` for an already-published camera, preserving the same room, camera publication, RTCRtpSender and microphone track. On failure, it best-effort restarts the original facing camera and surfaces an error without disconnecting the room.
- Pre-live preview has a Safari release-first retry if the second camera cannot be acquired while the first is active, and best-effort preview restoration. Rapid repeated flips are guarded against overlapping requests.
- Desktop ↔ Phone **host studio** remains geometry-only; no camera restart. The GoLive sound implementation is shared with viewer transitions without changing its envelope.

### Viewer cinematic layout and audio
- Full-screen live viewer has Desktop/Phone mode buttons. Mode is local display state only: Phone stage fills viewport with `object-fit:cover` (cropped sides); Desktop stage animates to 16:9 with `object-fit:contain`. Two-second width/height/position/border-radius morph; GoLive lens motor sound on the user's mode tap. No new LiveKit room or subscription and no change to transmitted stream.
- Desktop unused area uses a 160×90 canvas refreshed at most four times/second from the **existing subscribed video element**, enlarged and blurred. It is not a second video/player or network stream; disabled outside Desktop mode and while page hidden.
- Transparent side audio button is red when playback is unavailable/blocked/muted and green only with connected remote audio and unmuted, successfully playing HTMLMediaElement. Explicit user mute preference persists locally; iOS autoplay failure exposes tap-to-hear. A green indicator cannot prove the host is speaking or device speakers are physically audible.
- Full-screen chat remains rendered and scrollable with Send/composer and iOS 16px input. `visualViewport` resize/scroll updates a bottom keyboard offset, safe-area inset remains honored, and guest controls hide while typing to free space. Viewer video stays full-bleed in Phone mode.
- Embedded/For You player is not given the full-screen mode controls. Existing other site pages and host layout are unchanged.

### Verification and release gates
- Focused unit tests: `scripts/live-cinema.test.mjs` (view mode, keyboard offset, playback state, published camera track continuity, Safari preview retry and failure restoration).
- Static integration assertions: `scripts/live-cinema-integration.test.mjs` (host flip never disconnects/unpublishes, viewer mode does not recreate room, single canvas, mobile comment composer, accessibility and audio state).
- PR CI runs both suites, TypeScript validation and Next.js build; Vercel preview builds automatically. **Final results must be recorded below only after the latest commit completes.**
- **Unverified and blocking merge:** real iPhone Safari front↔rear flipping during active Live; two-device host/viewer microphone continuity and video; repeat flips under poor Wi-Fi; recording behavior after capture restart; browser keyboard and Send-button usability; actual audible sound effects; green/red indicator and autoplay permission; p50/p95 switch and viewer morph latency. Static/CI success does not prove runtime acceptance.
- **Safety:** no production merge/deployment, Supabase migration, LiveKit webhook/config or secret changes.


### Verified preview/CI evidence (2026-10-31 UTC)
- GitHub Actions run https://github.com/ElmiandCo/1Muslim/actions/runs/41184213151 completed **success** on code head `07d11fa52ef15b0ecb6ea8ee4310c85cbfed77d3`: **12/12 focused unit/static integration tests passed**, TypeScript validation passed, and `npm run build` passed. The test count comprises 6 pure behavior tests and 6 static integration assertions. These are not real-device tests.
- Vercel deployment `dpl_9vbFBrrjxttPBSnoPEX7N8KCgFAy` reached **READY** for exact code head `07d11fa52ef15b0ecb6ea8ee4310c85cbfed77d3`: https://1muslim-e2baoupfu-elmiandco.vercel.app. Open a genuine live stream via `/streaming` to exercise the full-screen viewer.
- Additional concurrent branch commit `1f530c63cc8c87dfe220a5e692eec76c818226c0` added a 400ms frozen-frame camera crossfade to the host flip; it was inspected and preserved, not overwritten.
- Viewer initial mode follows the host stream's `aspect_ratio`: Desktop for `16:9`, Phone otherwise, so tapping Phone on a landscape stream performs the requested visible zoom/crop.
- **Final release gate remains blocked** pending real iPhone Safari and two-device host/viewer runtime checks, actual recording continuity, browser audio/keyboard and measured latency. No merge or production changes.
