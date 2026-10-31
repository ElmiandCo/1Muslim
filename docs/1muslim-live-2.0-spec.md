# 1Muslim Live 2.0 — Event-driven discovery and lifecycle

Status: design specification; implementation pending. Branch: `1MuslimLive2.0` from `main`. No production deployment.

## Product goals
- Abundant, promptly discoverable active Lives on every eligible Live-capable screen (For You, Live discovery, and relevant previews). New Live announcements must not force a viewer away from an already-playing Live.
- Publish to discovery only when a server-confirmed LiveKit host is connected and at least one intended media track (camera/screen video or microphone audio) is published. Audio-only Live is valid. Do not mistake absent video for absent audio.
- Event-driven notification, not viewer-by-viewer two-second database polling. No indefinite `Waiting for host video` cards in For You.
- Target p95 under healthy connectivity: host start to discoverable <1s; explicit End Live to removal <500ms; observable disconnect indication 1–2s; reconnect indication <1s; viewer delivery <500ms after server notification. Measure end-to-end on real devices. Sudden silent network loss detection cannot be guaranteed within 2s; report actual LiveKit detection time separately.

## Server-authoritative state machine
`STARTING -> READY_VIDEO | READY_AUDIO -> RECONNECTING -> READY_VIDEO | READY_AUDIO | ENDED`.
Explicit End Live: authenticated server writes terminal state, emits versioned event, then closes LiveKit room. `ENDED` is terminal. Unexpected connection loss: immediately emit `RECONNECTING` when transport/server detects it; retain stream for configurable grace period; do not mislabel it ended. On return, require host identity + published track before `READY`. Distinguish user-selected audio-only from failed camera publishing.

## Event and discovery algorithm
1. Server listens to authenticated LiveKit room/participant/track webhooks (verify signatures; idempotent processing, tolerate reorder). Host identity and media publication drive READY state. Never trust a client-provided `isLive` flag alone.
2. Maintain a cached READY-only discovery index keyed by stream ID, with version/sequence, host ID, media type, timestamp and expiry. Expose a lightweight initial snapshot endpoint; fan out subsequent deltas (`LIVE_READY`, `LIVE_MODE_CHANGED`, `HOST_RECONNECTING`, `HOST_RECONNECTED`, `LIVE_ENDED`) via realtime subscription. Emit one event per state change, not per viewer.
3. Eligible screens subscribe to a single multiplexed discovery channel and update in-place. Prefer verified active Lives in For You, with fair rotation, deduplication, and stable playback for existing viewers. For a READY stream whose media subscription fails, show a short recoverable loading state, then skip and retry in background rather than trap the user.
4. When the host disconnects, remove from *new* discovery while existing viewers see reconnecting. On End Live, remove immediately and advance the feed without a dead card.
5. Use a shared server-side watchdog and sparse host heartbeat only for silent failure recovery, not primary UI responsiveness. No per-viewer steady-state DB polling. On realtime interruption, refresh a snapshot with exponential backoff and full jitter (2, 4, 8, 16, 30s max), stop on subscription recovery; cap retries and use caching to avoid thundering herds.
6. Include event `streamId`, `sessionId`, monotonic `version`, `state`, `mediaType`, `serverTimestamp`. Clients ignore stale versions; ENDED wins over delayed reconnect events. Handle duplicate webhooks, reconnect races, and room recreation with session IDs.

## Safety, scale, acceptance
- Authorize host-only state transitions, validate webhook authenticity, rate-limit recovery endpoints, avoid PII in public events.
- Instrument p50/p95/p99 of start-to-ready, event-to-viewer, End Live, disconnect-detection and reconnect. Log event version and state-transition reasons.
- Load-test 1k/10k subscribers and reconnect storms; count DB reads, fanout bandwidth, dropped messages, cache hit rate, server costs. No claim of near-zero *total* DB usage.
- Test iPhone Safari and desktop with two devices: video, audio-only, signed-out viewer, host End Live, force-close, airplane mode, weak Wi-Fi, rapid mode changes, reconnect, duplicate/out-of-order events, and 1k simulated viewers.
- Preserve current LiveKit audio/video, autoplay gesture fallback, accessibility/reduced-motion, and production behavior until reviewed. No merge/deploy without approval.
