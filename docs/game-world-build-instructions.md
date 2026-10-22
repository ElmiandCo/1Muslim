# Titan — Parted Sea World (priority 1)
Implement a distinct selectable world in SharedGameLobby.tsx, keeping other worlds unchanged. No prophet depictions. Fictionalized, respectful historical interpretation, not an asserted exact crossing site.

## Geography / visuals
- 9,000-foot playable corridor; 70 feet wide (approximate game-scale); two permanently parted, animated shimmering walls of water; fish visible behind the walls and very rare fish fall-out. Water NEVER closes.
- Bright, elevated sky and visible top edges of water walls. Rocky climbing refuges on the dry path; soldiers cannot climb and circle/wait at their bases.
- Flying and boost enabled for every player. Enter water to expose a Swim action; exiting water applies gravity and lands naturally.
- Player enters at 50% of corridor. No cluttering informational signs. Entrance portal near start displays 1Muslim; returning to that portal asks via small transparent Yes/No card whether to return to 1Muslim Home. Far portal leads to future Sinai/encampment content; do not build Egypt palace yet.

## Simulation
- Israelites flee toward far portal in variable periodic bursts; some spawn near the halfway point with a head start. Soldiers pursue from starting portal, move 2x base walking speed, can progress at most 75% of corridor, never exit far portal.
- Target nearest reachable player or Israelite, navigate around obstacles, circle and wait beneath elevated refuge stones; use spear attacks with readable wind-up.
- Three spear hits within 10 seconds respawn the player in modern lobby. Three hits to an Israelite => fall animation then despawn. One blaster hit defeats a soldier.
- Soldier waves begin with first player; surviving soldiers accumulate up to 4,000 per shared lobby; stop spawning at cap. Only nearby soldiers run detailed AI, distant ones use low-cost formations / impostors. Prevent spawn-camping with temporary invulnerability on arrival.
- Multiplayer state authoritative where possible, not separate client-only counts. Performance budget mobile-first. Preserve other realities and existing player controls.

## Deliverables
Implement in your OWN branch only, validate Next.js TypeScript build, publish isolated preview, and report SHA, URL, test evidence, known limitations. Do not merge to main.