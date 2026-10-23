# Parted Sea — isolated preview implementation

This branch contains a playable, fictionalized historical Parted Sea environment; no prophets are depicted. It is **not merged to main**.

## Entry points
- Direct full-screen preview route: `/games/parted-sea` (guest-accessible on this branch).
- Existing 1Muslim Games world selector: **Time of Moses**.
- Vercel deployments must target **Preview**, never Production.

## Implemented
- ~2,743m (~9,000ft) dry corridor, ~21.34m (~70ft) wide, towering permanent animated blue water walls, seabed terrain, rocks and visible fish.
- Spawn at corridor midpoint, far Sinai portal, near entrance portal with Yes/No confirmation, always-visible return-to-lobby button.
- Existing third-person controls, movement, jumping, flying, boost, mobile joystick and blaster preserved.
- Solid rocky refuges that players can land on; soldiers navigate around them instead of climbing.
- Generic fleeing traveler NPCs and pursuing soldier NPCs with local bounded wave spawning and near-player targeting.
- Soldiers attack at close range; three spear strikes within ten seconds respawn the player in the modern lobby. One blaster hit defeats a soldier.
- Basic NPC defeat/fall, distant-geometry culling and bounded AI for mobile performance.
- Multiplayer avatar movement broadcasts now include a world label to avoid drawing modern-lobby peers in the sea scene; blaster broadcasts are scoped by world.
- Guest preview route is excluded from the 60-second welcome overlay. Other world branches and production were not modified.

## Known gaps before full multiplayer release
- **NPC state and soldier counts are client-local**, not server authoritative; players can see different soldier outcomes. Multiplayer avatar movement remains shared, but enemy combat is not synchronized.
- Simulation is intentionally bounded to 72 active soldiers, not the requested 4,000-per-lobby army. A server-driven/LOD population system is required for that scale.
- Sinai beyond the far portal is a placeholder, not a finished encampment.
- Swim controls and fish fall-out are not implemented; water walls remain visually parted.
- Browser-based mobile and multi-user playtests are still required; successful Next.js build alone does not prove gameplay quality.

## Validation
Check the Vercel preview deployment for this branch, open `/games/parted-sea`, confirm no auth redirect, then manually test movement, flight, wall collision, NPC combat, portal prompt and return. Record any regressions before merging.
