# LiveGuests1.0 — Bot B handoff (2026-10-31)

Target: `LiveGuests1.0`. Source: `bot-b/liveguests-responsive-stage-20261031`. Production/main must not be modified.

## User-approved stage behavior
- Video: host solo full frame; host + one guest 50/50; host + two or three guests ~60% dominant host left and equal stacked right guests. Camera/mic on mobile and desktop.
- Audio: host centered; 1–11 avatar guests orbit it. At capacity, clockwise seat 1 = 1 o'clock, seat 11 = 11 o'clock; fewer guests redistribute evenly, with a single guest below the host. Smooth position/size transitions and reduced-motion support.
- Viewer has separate scrolling comments area below video/audio stage. Host preview keeps its persistent video element; no camera toggle/remount when guests arrive. Keep existing app navigation, titles, settings and visual identity unchanged.
- The provided mockups are references for geometry and proportions, NOT permission to redesign the background or controls.

## Implemented in Bot B branch
- `components/LiveGuestsStage.tsx` and `.module.css`: shared responsive video/audio stage, remote guest video track attachments, audio orbit, fallback avatars, active speaker indicators, and stable participant order.
- `components/LiveKitViewer.tsx`: guests render in their own video tiles instead of overwriting the host camera; audio avatar stage handles guest roster. Existing host/screen-share and audio playback paths remain.
- `app/streaming/go-live/page.tsx`: host's persistent preview shrinks into left position while remote guest tiles occupy the right; audio host preview shows avatar ring; host has a guest moderation drawer.
- `app/streaming/live/[id]/page.tsx`: dedicated scrollable viewer chat section below stage.
- No database schema, token permissions, or production deployment changed.

## Bot A interface contract / blockers
1. Host identity is the auth user UUID. Approved guests publish with UUID identity. Viewer identities are suffixed (`uuid:viewer:...`) or anonymous; screen companions are suffixed (`uuid:screen:...`). Bot B filters remote guest participants to plain UUIDs not equal to host. If Bot A changes token identities, update this filter.
2. Video guests max 3, audio guests max 11 MUST be enforced server-side by Bot A. Client `slice` is a display safeguard only.
3. Guest video track source `Track.Source.Camera`; audio `Track.Source.Microphone`. Guest profile metadata is read from public `profiles` table by participant identity, with safe generic fallback.
4. Host approval, remove, mute, and reconnect need server-authoritative enforcement. Current `LiveGuestStudio` requests use Supabase `live_guest_requests` and `request_live_guest`/`moderate_live_guest` RPCs; Bot A owns these changes.
5. For audio rooms, `GoLivePage.selectStudioMode("voice")` sets stream `aspect_ratio="1:1"`; viewer uses this to select audio stage. A dedicated stream media type would be safer long-term.
6. For security, never trust client-side participant count, name, mute, or room mode as authority.
7. Avoid touching `components/LiveGuestsStage*`, `components/LiveKitViewer.tsx`, `app/streaming/go-live/page.tsx`, and `app/streaming/live/[id]/page.tsx` concurrently without rebasing/coordination.

## Review/test checklist (not yet fully verified)
- Run `npm ci && npm run build` and TypeScript check. Verify host+1, +2, +3 video and host+1, +6, +11 audio on iPhone Safari and desktop.
- Verify viewer and host stage, microphone playback, camera switching, screen share, guest join/leave, reconnect, mute, host remove, no host mirror flash.
- Verify 3+ video and 11+ audio requests rejected by server, viewers cannot publish, and no stale participant cards.
- Verify no overlapping labels at 320px width, reduced-motion, long usernames, and comments scrolling while live video stays visible.
- This is a draft UI integration until CI, real device tests, and Bot A's backend enforcement pass. Do not merge to main/production.
