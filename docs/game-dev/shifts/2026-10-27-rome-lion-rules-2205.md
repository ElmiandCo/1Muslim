# Bot B shift — 2026-10-27 22:05 CDT

## Starting point and isolation
- Protected site baseline: `fix/profile-scroll-match-umma-20261027` (previously recorded `c856491`; not revalidated this shift).
- Game source: `game/living-worlds-rome-grand-arena-cats-20261027-2130`; existing `RomanArenaScene.ts` inspected.
- Working branch: `game/living-worlds-rome-egypt-build-20261027-2205`.
- Implementation commit: `f0b9b10f847b5df463a6af9027d776740eedffbe`.
- Reviewed existing Bot A branches and issue #126 coordination. No shared physics edits.

## Implemented (not yet integrated)
- Added `app/components/romanLionCombatRules.ts`, a pure isolated combat helper.
- `ROMAN_LION_RULES`: 4× base ground speed, five confirmed hits, 300000ms respawn, 3.5-unit attack reach and 1800ms lunge cooldown.
- `registerConfirmedLionHit`: only increments after caller validates collision; stops after defeat.
- `advanceLionRespawn`: resets after five minutes.
- `canLionLunge`: checks reach and cooldown.
- `lionGroundVelocity`: normalized ground vector, y=0, no flight.

## Verification and limitations
- GitHub successfully committed new isolated file. **No build, automated test, mobile test or multiplayer test run** in this shift. This module is NOT wired into game or server; it provides no actual live lion combat yet.
- No arena colliders implemented. Ancient Egypt river expansion, palace and markets remain TODO.
- Production/main and all existing game scenes unchanged. New file is additive and unused.
- Server authority, projectile deduplication, lion state replication, damage immunity, arena collision and lunge hit detection must be implemented/tested by Bot A before release.

## Integration / rollback
- Review and selectively cherry-pick ONLY `f0b9b10` into current game integration branch; do not copy site pages or old lobby. Delete the isolated module to roll back.
- Coordinate Bot A ownership of physics, lion AI and collision; Bot B will supply arena/market/palace visual assets and LOD.

## Per-world checklist
- Rome: arena and cats on earlier branch; combat constants/helper added this shift; arena colliders and server-authoritative combat pending.
- Ancient Egypt: pyramid approach, docks, village and Nile on earlier branches; long navigable Nile, ancient markets and palace pending.
- Moses/Parted Sea: preserve existing portal, terrain and sea behavior.
- Jurassic: preserve existing riverlife and collisions.
- RealMecca/Futuristic: preserve koi gardens and existing architecture.
- Muhammad-era/Madinah: preserve Nabawi, congregations and Hajj work.
- Jerusalem/Roman Judea: preserve existing world scenes and portals.
- Space/Blessed Chambers: preserve existing world and portals.

## Next shift
1. Bot A: integrate/test lion host state, five-hit verified projectile contacts, five-minute respawn, solid arena collisions and nonflying lunge.
2. Bot B: build isolated Nile extension + historically interpretive palace/markets; coordinate terrain, boat navigation and riverbank solidity with Bot A.
3. Run TypeScript, smoke, browser and mobile performance checks; only then request production integration.
