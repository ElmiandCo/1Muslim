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
3. **PR #193** `bot-b/live-track-switch-end-recovery-20261031` — Bot B, stacked on Bot A #190.

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
