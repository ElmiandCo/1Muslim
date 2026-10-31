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


## Bot B follow-up — 2026-10-31: SecureApp blocker resolved at schema level

**Backend handoff received from Bot A:** draft PR [#210](https://github.com/ElmiandCo/1Muslim/pull/210), issue [#207](https://github.com/ElmiandCo/1Muslim/issues/207), and [Bot A handoff](https://github.com/ElmiandCo/1Muslim/blob/bot-a/liveguests1-backend-20261031/docs/liveguests-handoff.md). The concrete contract is:
- `request_live_guest(p_stream uuid,p_mode text)`: authenticated requester; mode `pfp` or `camera`; pending seat only.
- `POST /api/live-guests/moderate`: host-only JSON `{requestId,action}` where action is `approved|rejected|removed|mute|unmute`; approval enforces video 3 / audio 11, and remove/mute reconciles LiveKit.
- `GET /api/live-guests/roster?streamId=...`: server-authoritative approved roster (pending only for host); `mode`, `maxGuests`, `hostMuted`, `approvedAt`.
- `POST /api/livekit/token`: `{room,role:"guest"}`, approved UUID publisher identity, role-scoped microphone and optional camera; viewers cannot publish. Use explicit `Track.Source.Microphone` / `Track.Source.Camera`.
- `POST /api/live-mode`: voice to video must reject >3 approved seats with HTTP 409; host mic unmute must never auto-publish the guest mic.

**SecureApp (production-connected project `njilnqgdfrvpvgbkodwl`) DB actions explicitly authorized by user:**
- Preflight: no `live_guest_requests`, no guest RPCs, zero currently active streams, `live_streams` required columns/UUID foreign keys present.
- Applied Bot A's exact idempotent bootstrap+capacity SQL from `supabase/migrations/20261031070000_liveguests1_capacity_and_roles.sql` via Supabase migration tool. Recorded migration `20261031071703_liveguests1_capacity_and_roles`.
- Found a **security issue in Supabase default table grants**: `anon` and `authenticated` initially had `TRUNCATE` despite RLS. Applied `20261031071739_liveguests1_lockdown_client_table_grants`, tracked in Bot B branch as `supabase/migrations/20261031071704_liveguests1_lockdown_client_table_grants.sql`. This revokes all client privileges and regrants authenticated SELECT/INSERT only.
- Read-only postflight verified: eight table columns; unique `(stream_id,user_id)`, UUID FKs, status/mode checks, roster index; RLS enabled; two SELECT/INSERT policies; four RPCs exist with expected execute grants; anon has **zero** table privileges; authenticated cannot UPDATE/DELETE/TRUNCATE; service_role retains backend privileges. Database migration history versions differ from repository filename timestamps; reconcile migration tracking before future CLI migration pushes.
- **Not yet proven:** positive authenticated request→approve→LiveKit publish→remove integration, concurrent approvals, real device audio/video, and stream mode switches. No active stream or disposable real authenticated test users were available; do not create fake production accounts or interrupt live users. The table blocker is fixed, but end-to-end guesting is **not** yet guaranteed.
- No main merge or production UI deployment performed. Production database **was** intentionally modified only for the user-approved additive schema and grant hardening.

**Bot B frontend changes on isolated PR [#209](https://github.com/ElmiandCo/1Muslim/pull/209):**
- `components/LiveGuestStudio.tsx`: host moderation now calls server endpoint (not direct RPC); removed insecure direct-insert fallback; authenticated requests call `request_live_guest` and show retryable errors; explicit microphone/camera LiveKit track sources; no automatic unmute after host mute; new token on explicit mic rejoin; disconnect/cleanup and host controls. Visible-only 5-second status refresh instead of 2.5-second polling. Host stage copy reflects correct 3-video / 11-audio limits.
- `components/LiveGuestsStage.tsx`: preserve guest seat order across reconnects; avoid unnecessary rerenders when LiveKit events do not change visible guest state; deduplicate/cancel profile lookups; reuse attached track nodes.
- `components/LiveGuestsStage.module.css`, `components/LiveKitViewer.tsx`, `app/streaming/go-live/page.tsx`, `app/streaming/live/[id]/page.tsx`: previous responsive host/viewer stages and independent comments. Bot A backend files have now been **copied into the isolated Bot B branch** for integrated preview testing: moderation/roster routes, token/webhook/mode routes, guest policy, policy tests and bootstrap migration. This is NOT a merge of PR #210 into main or LiveGuests1.0; PRs #209 and #210 overlap, so reconcile/avoid double-merge during review. Keep PR draft until build and real end-to-end tests.

### Visual reference traceability — no fabricated image mapping

Six PNGs are present on `LiveGuests1.0` at [reference directory](https://github.com/ElmiandCo/1Muslim/tree/LiveGuests1.0/docs/liveguests/references), but **binary visual inspection is unavailable through the connected text-only GitHub tools**. Therefore the exact file-to-layout mapping is *not verified*; no specific PNG is claimed as visually implemented. The following are the exact available image paths for an image-capable reviewer:

| PNG (click to inspect) | Specific feature derived from image | Code implementing approved *written* design | Mobile / desktop |
| --- | --- | --- | --- |
| [5A7A4B70-1908-4C58-A168-131BBEE746FA.png](https://github.com/ElmiandCo/1Muslim/blob/LiveGuests1.0/docs/liveguests/references/5A7A4B70-1908-4C58-A168-131BBEE746FA.png) | Unmapped; requires visual review | Stage geometry in `LiveGuestsStage.tsx` | Not device-verified |
| [708DE5AB-0EA6-4D43-89BF-31E9AB49587E.png](https://github.com/ElmiandCo/1Muslim/blob/LiveGuests1.0/docs/liveguests/references/708DE5AB-0EA6-4D43-89BF-31E9AB49587E.png) | Unmapped; requires visual review | Stage geometry in `LiveGuestsStage.tsx` | Not device-verified |
| [9E6B95D4-25B1-42C1-8501-27B9EA0004D3.png](https://github.com/ElmiandCo/1Muslim/blob/LiveGuests1.0/docs/liveguests/references/9E6B95D4-25B1-42C1-8501-27B9EA0004D3.png) | Unmapped; requires visual review | Stage geometry in `LiveGuestsStage.tsx` | Not device-verified |
| [A4A34CCB-CAA3-4B1B-9498-60FA65F682F7.png](https://github.com/ElmiandCo/1Muslim/blob/LiveGuests1.0/docs/liveguests/references/A4A34CCB-CAA3-4B1B-9498-60FA65F682F7.png) | Unmapped; requires visual review | Stage geometry in `LiveGuestsStage.tsx` | Not device-verified |
| [B0C8D2D9-584A-402A-9220-70565A4E6D9D.png](https://github.com/ElmiandCo/1Muslim/blob/LiveGuests1.0/docs/liveguests/references/B0C8D2D9-584A-402A-9220-70565A4E6D9D.png) | Unmapped; requires visual review | Stage geometry in `LiveGuestsStage.tsx` | Not device-verified |
| [F39B020F-676F-4C34-95A8-7BAB2C90D32E.png](https://github.com/ElmiandCo/1Muslim/blob/LiveGuests1.0/docs/liveguests/references/F39B020F-676F-4C34-95A8-7BAB2C90D32E.png) | Unmapped; requires visual review | Stage geometry in `LiveGuestsStage.tsx` | Not device-verified |

The seven semantic layouts in the README remain the design specification: host solo; video host+1 50/50, host+2/3 dominant-left; audio host+1, +6, +11 centered/orbit; comments below. The seventh actual image has not been verified as uploaded. Before signoff, image-capable reviewer must annotate each PNG with its correct layout, deviations, responsive behavior, and tested devices.

### Verification and remaining integration gates

| Check | Status |
| --- | --- |
| SecureApp guest table/RPC migration and hardened privileges | **PASS** (SQL introspection) |
| Guest seat constraints, indexes, RLS, function grants | **PASS** (SQL introspection) |
| Positive authenticated guest-request flow | **PENDING** (no safe active test stream) |
| Bot B + Bot A API integration | **CODE INTEGRATED IN BOT B BRANCH**; Vercel build and live tests pending |
| LiveKit 0/1/2/3 video and 0/1/6/11 audio real sessions | **PENDING** |
| iPhone Safari and desktop visual reference comparisons | **PENDING** |
| Production UI deployment | **NOT AUTHORIZED / NOT DONE** |

**Next handoff:** Verify the integrated Bot B preview build (backend code copied from Bot A), confirm migrations already applied to SecureApp (do not blindly reapply), run build/typecheck and multi-device guest request/moderation tests on a safe dedicated stream with real authorized test users, reconcile overlapping PRs #209/#210, and only then consider preview approval.
