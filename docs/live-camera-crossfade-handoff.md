# 1Muslim Live Cinema — Frozen-frame camera flip handoff
Date: 2026-10-31 (America/Chicago)

## Scope and branch safety
- **Integration branch:** `integration/live-cinema-camera-crossfade-20261031`, forked from `bot/live-cinema-viewer-polish-20261031` (which itself was forked from production `main`). This preserves the already-developed Live Cinema viewer controls, keyboard-safe full-screen comments, red/green audio state, blurred desktop video backdrop, camera publication fix and tests.
- **Original independent work branch:** `bot/live-camera-frozen-crossfade-20261031` retained for audit/rollback; no force pushes or branch deletions.
- The viewer-polish branch continued to receive commits after this integration snapshot. **Before promotion, reconcile its newer commits and CI workflow without overwriting them.** In particular, preserve `.github/workflows/validate.yml`, `scripts/live-cinema-integration.test.mjs`, and latest `docs/live-bot-handoff.md`.
- No `main` merge, production deploy, Supabase changes, LiveKit webhook changes, or secret changes.

## Implemented
- `lib/live-camera-crossfade.ts`: bounded-resolution canvas capture of the outgoing preview frame (maximum dimension 960px), frame callback/older Safari fallback, 400ms dissolve (instant for reduced-motion). Image remains only in memory and is never uploaded/published.
- `app/streaming/go-live/page.tsx`: still canvas overlay matching outgoing front-camera mirror, crop, rotation and zoom. Capture occurs before switching. The existing `flipLiveCamera` helper retains the LiveKit room, microphone and camera publication; after the new track's first preview frame, the old still fades to live video. On restart or first-frame failure, attempt to restore the original camera; release canvas in `finally`. Double-tap flip remains available.
- `scripts/live-cinema.test.mjs`: frozen-frame resolution and capture-failure tests, incoming-frame gating, reduced-motion cleanup. Existing viewer and camera publication continuity tests retained.

## Acceptance and testing
- Confirm Next.js/TypeScript Vercel preview build reaches READY on the **latest integration branch commit**.
- Run `node --experimental-strip-types --test scripts/live-cinema.test.mjs scripts/live-cinema-integration.test.mjs` using Node 22. Integration tests live on the viewer branch and must be included before final review.
- On two physical devices: go Live from iPhone Safari, flip front ↔ rear repeatedly, verify no black/mirror flash, audio continues, same room and published camera, viewers never disconnect. Verify camera permission-denied rollback and reduced-motion behavior.
- Viewer Phone fullscreen must retain readable scrollable comments, composer and Send above the iPhone keyboard. Desktop restores 16:9 and blurred backdrop; mode morphs do not restart streams. Audio indicator green only when remote audio actually playing and unmuted.
- Do not claim real-device, live-session, or CI verification until performed.

## Release gate
This work is **not production approved by this automation**. Integrate the latest viewer branch changes, review CI and real-device acceptance, then obtain explicit promotion approval. Never replace `main` with this branch or force-reset another branch.
