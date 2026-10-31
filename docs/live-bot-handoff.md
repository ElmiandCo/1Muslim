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

## Live 2.0 — Bot A continuation / server-side hardening (2026-10-31)

**Scope:** Only webhook backend, SQL migrations, optional server-side cron route, and this handoff. **ZERO UI/CSS/animation/navigation changes.** Work remains isolated on `1MuslimLive2.0`; no merge, production deploy, Supabase migration execution, or LiveKit webhook configuration.

### New Bot A commits (chronological)
1. `6cef9835b79f8b968b2a17d1d35ba86d81d85175` — stamp LiveKit observation time **before** `listParticipants` remote lookup, so an older slow snapshot cannot overwrite a later snapshot simply because its RPC completes last. Cross-instance clock skew still needs runtime validation.
2. `369c6ef8442034d1fb0045970daa8859542116b4` — pending initial migration now distinguishes initial `STARTING` (no host/media yet) from genuine `RECONNECTING` after a stream was previously READY; temporary loss of all media after READY is also `RECONNECTING`, never discoverable.
3. `ba107cd5304c482a14eee0768f644be910559065` — added `20261031055000_live_2_reconciliation_helpers.sql`: service-role-only least-recently-observed candidate RPC (up to 100), plus bounded 7-day webhook dedupe pruning RPC. Requires initial `20261031052500` migration first.
4. `d706d35ce1dda33d6f5a3e9fb17d3b94636042c1` — optional authenticated shared watchdog endpoint `GET /api/cron/live-presence-reconcile`. It inspects up to 50 active rooms with max 5 concurrent LiveKit queries, applies idempotent state snapshots, and prunes old event IDs. Not scheduled automatically; requires `CRON_SECRET` and explicit scheduling/preview authorization.
5. `128f0d36c4f52a171dbf089bc886fbb473db86c5` — corrected watchdog helper import from five `../` levels to four. The preceding preview build for `d706d35` failed on that import; the corrected head must be checked independently.

### Bot B coordination / PR #200
- Bot B's draft PR #200 (`bot-b/live2-discovery-integration-20261031`) is **stacked on `1MuslimLive2.0`**, not merged. At inspection it was 24 commits ahead of the earlier Bot A base. Bot B already changed `lib/live-presence.ts` to ignore muted tracks, and wired client discovery; do **not** overwrite those changes with the older Bot A helper.
- **Bot B: rebase/merge the updated Bot A base carefully**, reconcile this handoff's append with your own appended PR #200 notes, and verify the new cron route uses the muted-track-aware `summarizeHostTracks` from your branch. Preserve strict NO UI CHANGES.
- New migrations must run in order on a **nonproduction preview** only after approval; both webhook and watchdog require real environment configuration. Without those, discovery correctly fails closed.
- The shared watchdog is a **fallback** for missed webhooks, not a <2s detection mechanism. Its 50-room batch and cadence must be load-tested/tuned; no cron schedule has been registered.
- The existing Supabase stale-stream finalizer runs each minute and may mark a stream ENDED after 75 seconds without host heartbeat; validate its interaction with LiveKit reconnect and watchdog before claiming no false endings.
- Current `session_id` in the SQL presence table equals stream ID, **not a distinct LiveKit room-generation ID**. Real room recreation/session isolation remains an explicit blocker. Avoid claiming full session-generation protection.
- Verify `CRON_SECRET` bearer authorization rejects unauthenticated requests and does not log credentials. No provider/database runtime verification was performed.

### Verification and blockers
- Inspected main's token route: the host LiveKit identity is the Supabase user UUID; viewers/companions have distinct suffixes, matching the webhook host-identity filter.
- Inspected existing `finalize_stale_live_streams` Supabase cron (once/minute, 75-second stale heartbeat).
- Vercel preview for `6cef9835` was **READY**; preview for `369c6ef` was **READY**. The intermediate `d706d35` preview **ERROR** was traced to the import path, fixed in `128f0d36`; **check newest head** before calling the final build READY.
- **NOT verified:** SQL migrations executed, cron route invoked, signed webhook delivery, host/viewer LiveKit runtime, iPhone Safari, 1k/10k subscriber load, or actual p50/p95/p99 latency. No SLA claimed.
- PR #200 stays **draft/not merge-ready** pending preview SQL + LiveKit configuration, real-device tests, webhook/watchdog race testing, and measured latency. No production changes.


---

## Live 2.0 — Bot A: All Streams backend contracts (2026-10-31)

**User-approved scope:** Extend the existing `/streaming` **More Streams / All Streams** experience; do not introduce a competing discovery route. The only permitted UI addition is the expanded All Streams page and minimal entry navigation. No changes were made to any UI/CSS/layout/navigation in this Bot A run.

### Commits (on `1MuslimLive2.0`)
1. `e5bbcaa594dcd6d9af55e69984915a5b929c9521` — `lib/live-hub.ts`: typed, pure public hub contract and fail-closed categorization.
2. `5527a003eec7931b8765c9cd32f4b1eef623f7a0` — `app/api/live-hub/route.ts`: public read-only initial snapshot for verified Current Lives, Audio Rooms, real Games streams, actual public Past Live recordings and Scheduled Lives.
3. `9e45d7858cb1dc1cc26211d1250d0b81dfcf4d6f` — `scripts/live-hub.test.mjs`: six deterministic contract tests.

### Bot B interface contract
- `GET /api/live-hub` returns `{ currentLives, audioRooms, gameStreams, pastLives, scheduledLives, paths, serverTime }`.
- `currentLives` only contains `status=live`, `visibility=public`, nonexpired and server-verified `live_presence.state=READY_VIDEO|READY_AUDIO`. Each has `id, hostId, title, category, roomName, viewerCount, startedAt, thumbnailPath, aspectRatio, mediaType, sessionId, version, href`. The `href` is the existing immersive `/streaming/live/{id}` route.
- `audioRooms` and `gameStreams` are subsets of verified `currentLives` (do not double count as independent broadcasts). Audio uses `live_presence.media_type=audio`; Games uses actual `category` values such as Games/Gaming/Gameplay/eSports. **Never fabricate game broadcasts or treat the games launcher as a Live.**
- `pastLives` contains only public `live_recordings` with nonempty uploaded `video_path` and positive duration, with `href=/streaming/replay/{recordingId}`. Audio MIME is labeled audio. No fake replay for ended streams without a recording; no direct storage path or private recording in response.
- `scheduledLives` contains only scheduled/waiting slots whose end time is in the future, with `id, hostId, title, category, startsAt, endsAt, status, thumbnailPath, hostReady, href`. Host readiness permits mic-only check-in; the existing scheduler page currently also checks camera, so reconcile UI messaging for audio-only. Existing scheduling action is `/streaming/go-live?schedule=1`; existing reminder records are `live_watch_reminders`.
- `paths` supplies `allStreams=/streaming`, `goLive=/streaming/go-live`, and `scheduleLive=/streaming/go-live?schedule=1`.
- Initial snapshot is CDN cached 1s; subsequent live changes **must** come from the versioned `live_presence` Realtime subscription already in Bot B's branch. Do not add short-interval viewer polling. On connection loss use bounded snapshot recovery.
- The full-screen viewer already exists at `/streaming/live/{id}`; Bot B should preserve its existing styling and implement tile → viewer → browser back to same scroll position, without touching the host `/streaming/go-live` page.
- **Existing GoLive category selector does not offer Games** (currently Qur'an, New Muslim, Prayer, Seerah, Tawhid, Community). The backend can classify real Games-tagged streams, but host game tagging needs a separately approved minimal way to set that category; do not silently redesign GoLive.
- Existing `/streaming` currently uses 5s DB polling and displays recordings only to admins; Bot B should replace this discovery logic in the approved hub scope and show *public* replay cards to viewers using the new contract. Existing `/streaming/replay/{id}` handles public playback.

### Test evidence and remaining blockers
- Local Node v22.16.0: `node --experimental-strip-types --test scripts/live-hub.test.mjs` — **6/6 passed**: verified public-only READY, audio-only, stale/invalid exclusion, genuine public archive, schedule expiry and Games classification.
- Local strict TypeScript: `tsc --noEmit --target es2022 --module esnext --strict --skipLibCheck lib/live-hub.ts` — **passed**.
- **Not yet verified:** new API's Next.js/Vercel head build, preview Supabase migrations and schema/RLS, real response from live-hub endpoint, real LiveKit/webhook delivery, storage accessibility, iPhone Safari full-screen/back navigation, real Games host category input, and p50/p95/p99 latency/load. Do not infer end-to-end success from unit tests.
- Route fails closed with 503 if service credentials, live_presence migration or any required query is unavailable. Only public stream/recording rows are returned; schedule slots use existing public schedule statuses. Review production permissions before enabling.
- No migration executed; no LiveKit configuration changed; no merge or production deployment.

### Handoff / integration order for Bot B
1. Fetch latest `1MuslimLive2.0` head and read this section; PR #200's branch `bot-b/live2-discovery-integration-20261031` is stacked on the base and must incorporate these three commits without overwriting its existing realtime changes.
2. Integrate `/api/live-hub` into the **existing** All Streams page only; keep LiveKit player, For You, Profile, Stream host studio, animations and other UI untouched. Build the approved categories (Current, Audio, Games, Scheduled, Past) using the existing emerald/gold/mirror design system.
3. Keep version/session ordering and READY-only discovery, avoid redundant subscriptions and fixed polling; ensure explicit End Live disappears and reconnecting hosts are not offered to new viewers.
4. Test preview schema/API, public replay permissions, actual Games tagging, audio-only, signed-out playback, and return-to-scroll behavior. Document results and PR #200 readiness. No merge/deploy without approval.
