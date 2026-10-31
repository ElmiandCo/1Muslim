# LiveGuests1.0 — Approved visual references

This directory is the canonical reference location for LiveGuests1.0. **The original image binaries are not yet checked into this folder.** Do not claim screenshots are present until they are uploaded.

## Seven approved screenshots (from user's October 31 chat)
1. `01-video-host-one-guest.jpg` — equal side-by-side host/guest, comments below.
2. `02-video-host-two-guests.jpg` — host large left, two guests stacked right.
3. `03-video-host-two-guests-alternate.jpg` — second reference for two guests.
4. `04-video-host-three-guests.jpg` — host dominant left, three guests stacked right; maximum video guests.
5. `05-audio-host-one-guest.jpg` — existing solo Voice screen expanded to one guest, preserve actual app UI.
6. `06-audio-host-six-guests.jpg` — centered host with six clock-distributed guests, comments below.
7. `07-audio-host-eleven-guests.jpg` — centered host with eleven guests around clock; use exactly eleven slots, ignore any numbering inconsistency in mockup.

## Implementation contracts
- Video: host + up to **3** guests with camera/mic, mobile and desktop. Responsive, animated reflow, host priority with 2/3 guests.
- Audio: host + up to **11** mic-only guests. Clockwise join-order slots, redistribute evenly when fewer guests, smoothly scale and reposition without shifting global UI.
- Viewer: same stage, no host-only controls. Host: invite, approve, remove, mute. Guest: request, accept, leave, microphone/camera controls subject to permissions.
- Preserve 1Muslim current header, title, comments, stream controls, theme, scroll and player. No unrelated redesigns.
- Real LiveKit tracks and Supabase state, no fake attendees/viewer counts.
- Bot A issue #207 owns backend; Bot B issue #208 owns UI. Coordinate in `docs/liveguests-handoff.md`.
- Develop on isolated branches from `LiveGuests1.0`, PR back into that branch. Do not merge to main or production.

## Reference image status
User-provided image files are attached to the ChatGPT conversation. Upload the seven image files to this folder to make them available to GitHub-only bots. Until then, follow the detailed layout descriptions above.
