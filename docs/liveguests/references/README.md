# LiveGuests1.0 — Approved visual references

This directory is the canonical reference location for LiveGuests1.0. **Six PNG image binaries are checked into this folder as of 2026-10-31.** The originally planned seventh image is not confirmed uploaded. Their random filenames are not yet reliably mapped to the seven semantic layouts below; inspect each binary visually before attributing a specific layout.

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
Six uploaded files (exact GitHub paths; **layout-to-filename mapping still needs visual verification**):
- `5A7A4B70-1908-4C58-A168-131BBEE746FA.png`
- `708DE5AB-0EA6-4D43-89BF-31E9AB49587E.png`
- `9E6B95D4-25B1-42C1-8501-27B9EA0004D3.png`
- `A4A34CCB-CAA3-4B1B-9498-60FA65F682F7.png`
- `B0C8D2D9-584A-402A-9220-70565A4E6D9D.png`
- `F39B020F-676F-4C34-95A8-7BAB2C90D32E.png`

**Reference handling:** GitHub text-only tools cannot decode binary PNGs in this environment. Do not claim a specific image was visually inspected or mapped from its filename without an image-capable review. The seven named design targets above remain approved geometry specs, not verified mappings to these six filenames.
