# 1Muslim Unified Canvas — approved implementation specification (Preview only)

BASELINE: production READY commit 3eb8c6e7ddcd725829e2e6dac550ee18312e56a9. Never merge from older main, reset the approved Canvas, reintroduce green floating launcher, change Sign In/Out from far right, or remove HudHud, existing artwork, parallax, day/night, backgrounds, particles, navigation, auth, or live functionality.

## Geometry
Five vertical layers: (1) Live, (2) Profile & Avatars, (3) Badges & XP, (4) My Posts, (5) Settings. Down from Settings wraps to Live; upward is reversible. Bottom arrow advances and offers return to Live on last layer. Preserve existing horizontal home workspace functionality where possible; migrate deliberately rather than silently deleting Qur'an, Messages, Elm Tent, or Community Map.

Within Live, horizontal three-mode carousel: Desktop Live; Mobile Streaming; Audio Rooms. Use consistent animation kit for vertical and horizontal motion. Distinguish stream type using actual stored format/orientation and route to matching player; never show mobile streams in desktop/audio. Preserve distinct comment histories for each mode and allow long independent scrolling. Placeholder copy must never imply fake activity: "No desktop streams live right now", "No mobile streams live right now", "No audio rooms open right now". Only say "Connecting to the next audio room" when connecting. Audio orb only when real room is active; otherwise leave translucent empty state. Remove user-facing "test"/"demo" terminology, but do not misrepresent generated waiting-room comments as real.

## Profile layers
Profile & Avatars: edit name, avatar carousel with unlocked/locked states, view XP and linked connections. Badges & XP: earned/locked badges and progress, no duplicated awards. Posts: horizontal Posts/Videos/Images/Links/Files; create/upload in place and persist to signed-in user's records using existing storage and RLS, then show on profile. Settings: reuse existing settings and avoid a parallel, divergent settings implementation.

## Gesture contract (global)
Scrollable descendants own their gestures until touch release. Never convert scrolling of comments, posts, avatars, or settings into a Canvas navigation gesture even at boundaries. Direction lock after threshold; dragging is continuous, interruptible, reversible, and can stop halfway. Release settles to nearest layer. Navigation gestures start only on noninteractive, nonscrollable Canvas areas; bottom arrow is always available. Keyboard accessibility, reduced-motion preferences, and independent nested scrolling required. Background image keeps parallax linked to drag progress with modest zoom to cover edges.

## Acceptance gates
- Preview-only commits and deployment, production untouched.
- All 5 layers and 3 Live modes accessible by drag and buttons; wraps after Settings.
- Scroll 30+ posts and 30+ comments without accidental navigation.
- Halfway drag reversal, interruption, touch + desktop wheel/trackpad verified.
- Parallax and approved background visible, no empty edges.
- No green floating orb, no new test/demo labels, Sign In/Out remains rightmost.
- Existing live, Qur'an, messaging, HudHud and account features not regressed.
- Report exact commit, READY Preview URL, results and any gaps; await explicit production approval.
