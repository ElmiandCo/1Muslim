# 1Muslim Live — Real-time quality acceptance contract

Status: implementation required; targets are not guarantees. Preserve approved production UI and existing host/viewer layouts.

## Seven acceptance targets
1. Host-to-viewer glass-to-glass latency: p95 < 1000 ms on healthy supported networks; instrument actual capture-to-render delay, not just signaling RTT. Alert and record failures.
2. Video: adaptive simulcast/dynacast where supported; prefer 1080p on strong links, step down to 720p and lower on constrained networks; do not force 1080p. No persistent freezes.
3. Audio: prioritize audio over video, enable echo cancellation/noise suppression where appropriate, maintain A/V sync and avoid audio interruptions during video downgrade.
4. Comments: p95 server-ack-to-viewer display < 500 ms on healthy networks; use reliable delivery, persistent ordering, deduplication and pagination; separate comment channel from media.
5. Reactions: best-effort low-latency ephemeral data; batch/throttle and cap render count; never block media or comments.
6. Guests: explicit request/approve/reject/remove state machine, room permissions enforced on server, graceful camera/audio transitions, no duplicate publishing, host controls retained.
7. Recovery: reconnect automatically with exponential backoff and jitter; preserve session and UI state; recover tracks and subscriptions; surface offline/reconnecting states; prevent duplicate messages.

## Engineering tasks
- Audit existing LiveKit room creation, tokens, viewer/host clients and screen-share components before editing.
- Instrument LiveKit connection quality, packet loss, jitter, bitrate, reconnect events, render stalls, and A/V drift. Track percentiles by mobile/desktop and region; avoid storing raw user media.
- Configure adaptiveStream/dynacast/simulcast and codec compatibility where supported by installed SDK and infrastructure.
- Add message IDs, timestamps, idempotent persistence and fan-out for comments; reactions use a separate lossy path.
- Add server-side guest authorization; never trust client role flags.
- Implement reconnect and fallback for camera/mic permissions, backgrounding, network switching and LiveKit interruptions.
- Test 1 host/1 viewer, 1 host/6 guests, 100 viewers, weak 3G/4G, Wi-Fi to cellular, iOS Safari, Android Chrome, desktop, and audio-only.
- Run build, typecheck, regression and real-device tests. Gate production promotion on measured results and rollback plan.

## Rollout
Stage behind a feature flag in Preview; no homepage, navigation, swipe, canvas, or visual theme changes. Publish only after verified metrics and approval. Report achieved p50/p95, device/network sample, failures, and commit SHA.
