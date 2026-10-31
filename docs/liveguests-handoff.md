# LiveGuests1.0 — Bot A backend ↔ Bot B frontend handoff
Updated: 2026-10-31. Base: `LiveGuests1.0` (production-derived snapshot `060357295d3e5ac125f7f8a57ce273bbe4fcc683`).
Bot A branch: `bot-a/liveguests1-backend-20261031`. Bot B issue: #208.
**Do not merge into main, apply production migrations, or promote Vercel preview without user approval.**

## Product limits and approved visual contract
- Video (Phone 9:16 or Desktop 16:9): **host + max 3 guests**, each guest may publish camera and microphone if approved for `mode=camera`; PFP requests publish microphone only. Host remains dominant with 2 or 3 guests.
- Audio (Voice 1:1): **host + max 11 guests**, microphone only, no camera. Host is centered, guests ordered by `approvedAt` and spaced around a clock. With fewer than 11, redistribute evenly and animate position/scale without changing order.
- Viewers: subscribe only. Anonymous viewers allowed only for public streams. Comments occupy a separate scrollable area below the stage.
- Preserve the existing production header, Settings, live title, Desktop/Phone/Voice, Effects, and Go Live controls; do not replace them with a new ornamental room design.
- UI must support host, guest and viewer roles on iPhone Safari, Android Chrome and desktop.

## Backend contract for Bot B
1. **Request stage:** authenticated guest calls existing Supabase RPC `request_live_guest({p_stream: streamId, p_mode: 'pfp'|'camera'})`. In Voice use `pfp`; camera requests are rejected by DB in Voice. Repeated requests do not reset an already approved seat.
2. **Host approval:** `POST /api/live-guests/moderate` JSON `{requestId, action:'approved'|'rejected'|'removed'|'mute'|'unmute'}`. **Use this route rather than directly calling `moderate_live_guest` from UI**, so remove also kicks the active LiveKit participant, and mute reaches the active audio track. Host-only, 409 on full/invalid transition, 503 on service failure.
3. **Roster:** `GET /api/live-guests/roster?streamId=<uuid>` returns `{streamId,hostId,mode:'audio'|'video',maxGuests,guests:[{requestId,userId,username,avatarUrl,mode,hostMuted,approvedAt}], requests?:[same]}`. Only host receives `requests` and the internal `requestId` field; anonymous public viewers receive approved guests only. Poll or subscribe to changes; do not use the RLS-restricted guest table to render viewer roster.
4. **LiveKit track source:** guest token grants allow only LiveKit `MICROPHONE` and, when camera-approved in video mode, `CAMERA`. When publishing native MediaStreamTracks, explicitly pass LiveKit client `Track.Source.Microphone` / `Track.Source.Camera` (or use `setMicrophoneEnabled` / `setCameraEnabled`). The legacy `LiveGuestStudio` publishes native tracks without explicit sources and may fail with strict grants; Bot B must fix this.
5. **LiveKit token:** existing `POST /api/livekit/token` JSON `{room,role:'host'|'guest'|'viewer'|'companion'}`. Guest requires approved seat and authentication. Returns `{token,url,role,mode,maxGuests}`. Guest identity is stable `user.id`, viewer identity is unique, and companion remains host-only. **Use a fresh token when joining/rejoining after a full disconnect.**
6. **Stream mode:** existing `POST /api/live-mode` JSON `{streamId,mode:'phone'|'desktop'|'voice'}`. Uses an atomic service-role RPC; video mode returns 409 if more than three audio guests are approved. Show a host message to remove extra guests first. When changing from video to audio, guest camera must stop; a newly issued guest token cannot publish camera.
7. **Audio muted:** `hostMuted=true` in roster means the host muted the guest. Do not automatically republish the mic until unmuted. When the host lifts the mute, **never remotely activate the microphone**: the guest must explicitly opt in to re-enable/re-publish audio, possibly after refreshing their token.
8. **Ordering:** `approvedAt` is set when host approves. Sort by `approvedAt` (fallback `created_at` for legacy approvals). Do not reorder on reconnect.
9. **Host role:** only the host publishes the terminal LiveKit data packet. Guest/viewer `canPublishData=false`; stage microphone and camera are LiveKit tracks, comments remain Supabase chat.

## Supabase and LiveKit setup
- Apply migration `supabase/migrations/20261031070000_liveguests1_capacity_and_roles.sql` in a **staging database first**. It bootstraps `live_guest_requests` with RLS if absent, or preserves existing rows; adds `approved_at` and `host_muted`; replaces request/approval RPCs with per-stream row locks; adds `set_live_guest_stream_mode` (service-role only) and `set_live_guest_host_mute` (host only). Existing data is preserved.
- Read-only inspection on 2026-10-31 found only one connected Supabase project, **SecureApp** (`njilnqgdfrvpvgbkodwl`), and its public schema currently lacks `live_guest_requests`. This is likely production: **no migrations were applied**. Create/configure an isolated staging Supabase environment before any database-backed preview testing.
- Vercel preview configuration has LiveKit and Supabase environment variable **names** configured; values and whether preview points at production were not inspected. Do not exercise preview writes until isolation is confirmed.
- The migration **must be applied before testing these preview API routes**. A preview using production Supabase without this migration will return 503 on new RPC/column access. Do not apply it to production until review/approval.
- Configure preview/staging `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`.
- LiveKit webhook must point to `/api/livekit/webhook` and include participant_joined, track_published, participant_left and room lifecycle events. The endpoint verifies the signed raw body, checks the approved seat on guest join, evicts revoked guests and enforces audio/PFP camera prohibition and host microphone mute. Existing host presence/discovery logic remains unchanged.
- LiveKit host/guest tokens remain valid for 2 hours to preserve reconnection behavior; the webhook and host eviction enforce revocation even while a previously minted token is valid. Test delayed webhook delivery and retries before production.

## Test matrix (staging only)
- Anonymous public viewer connects, never publishes; signed private nonhost viewer is denied.
- Guest without approval cannot mint a publishing token; host can approve/reject/remove.
- Two simultaneous host approvals near capacity: video stays at 3; audio stays at 11 (DB row lock). Re-approval is idempotent; invalid status transitions return 409.
- Guest camera denied in Voice; PFP camera denied in Video; mic denied when hostMuted. Host remove disconnects guest; stale guest JWT rejoin is evicted by signed webhook.
- Voice→Video with 4+ approved guests returns 409; Voice→Video with <=3 succeeds. Phone↔Desktop retains the same room and approved guests.
- Host camera/mic, guest camera/mic, viewer audio/video, 2+ guests, network reconnect, Safari autoplay, host End Live and unexpected disconnect.
- Run `node --test scripts/live-guests.test.mjs`, `node --test scripts/live-presence.test.mjs`, `npx tsc --noEmit`, `npm run build`. Run real LiveKit and Supabase integration tests against staging.

## Known limitations / next actions
- Current legacy `components/LiveGuestStudio.tsx` still calls Supabase `moderate_live_guest` directly; Bot B must switch to the host moderation endpoint for immediate kick/mute.
- The backend does not automatically downshift camera tracks on a **running** guest connection when host changes mode. Bot B should stop camera publication and refresh guest token on mode change; LiveKit webhook evicts any guest who publishes forbidden video. Consider a future server-side participant permission refresh if seamless mode switching requires it.
- DB approvals are authoritative capacity, not active LiveKit participant count; disconnected approved seats remain reserved until host removes them. Bot B should display reserved seats.
- The RLS policy on `live_guest_requests` only lets guests/hosts read requests. The roster endpoint is the approved viewer-safe projection.
- Build checks and real multi-device end-to-end sessions are still required. Do not describe these as verified until actually tested.
