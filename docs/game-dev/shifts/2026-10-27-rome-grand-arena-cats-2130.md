# Game Bot B / Living Worlds — Rome grand amphitheater and street cats

**Shift:** 2026-10-27, 21:32 CDT (America/Chicago)  
**Scope:** Game-only, non-production; Rome-specific visuals and a reusable lion *visual* adapter.  
**Status:** Implemented and source-executed in V8; preview build pending as of first handoff. No native phone playtest.

## Provenance and no-regression gate

| Contract | Observed at shift start |
| --- | --- |
| Protected site preview | `fix/profile-scroll-match-umma-20261027` @ `c856491131bb0c8056693652f8e5e58a26836831` |
| Latest `main` (read only) | `c043219f7a3eeb8e1529538013e97f311a3b938a` |
| Latest READY production deployment (read only) | `dpl_3z8Knt4fyG7s9nyCW6EM3Lkuv1mR` from `fix/preserve-profile-tab-scroll-20261027` @ `d219f7ee3a3a813b5c143d6fd32d57bbe86cb512` |
| Bot A source and handoff reviewed | `game/world-engine-egypt-dock-cargo-solids-20261027-2100` @ `7740a22b9a0d1f83b029383191214a9cb97297c8`, [20:59 handoff](2026-10-27-egypt-dock-cargo-solids-2059.md), [coordination issue #126](https://github.com/ElmiandCo/1Muslim/issues/126) |
| Working branch | `game/living-worlds-rome-grand-arena-cats-20261027-2130`, created from Bot A's exact `7740a22b` game SHA |
| Bot B earlier source preserved | Future koi gardens `d901a021` are already an ancestor of Bot A's branch |
| Integration constraint | `main` differs from frozen preview in page, CSS, profile, feed, videos and gallery files. **Do not merge this branch wholesale.** |

## Implemented this shift (not just planned)

1. **`app/components/RomanArenaScene.ts`** (new):
   - `ROMAN_GRAND_ARENA`: new monumental arena at (365, -345), outer ellipse radii 90×68 world units, 31-unit upper facade, open south entrance (16 units). This is an *interpretive* Roman-inspired structure outside the existing walled city; original smaller amphitheater is preserved.
   - `renderRomanGrandArena()`: tiered travertine arcades, open interior sand floor, stepped seating, gate markers, paved approach, upper banners, sparse animated spectators. Near/mid/far visual LOD: 32 / 16 / 0 ring segments at 155 / 315 distance. Rendering culls independently of physics.
   - `renderRomanCats()`: fourteen deterministic low-poly roaming cats in Rome market streets and the new arena district; near-only ear/tail/eye details, distance culling at 75 units.
   - `renderRomanArenaLion()`: **reusable lion visual interface only**, with attack/leap pose input from future Bot A AI. Intentionally **not spawned or wired** until authoritative hostile lion state exists. No claims of damage, five hits, speed, respawn or AI.
2. **`app/components/RomanJudeaScene.ts`**:
   - Imports and calls only `renderRomanGrandArena()` and `renderRomanCats()` under `if(inRome)`, preserving Jerusalem's scene, the original Rome forum/market/smaller arena, portal, colliders and index byte-for-byte apart from those two additions.
   - No `SharedGameLobby.tsx`, `gamePhysics.ts`, terrain, collision, portal, meeting, shield or site files modified.
3. **`scripts/game-rome-arena-smoke.mjs`** (new): executable Node source-smoke test for LOD, finite draw calls, entry gap, cat culling, inactive lion visual and preserved Roman exports.

**Exact implementation commits:** `fe798f67` (new scene), `e3518e45` (Rome render wiring), `fedfef5b` (32/16 LOD optimization), `f80991b8` (smoke script).

## Verification and limits

- **Executed in JavaScript V8 on actual GitHub-fetched module body:** **818 assertions PASS**, 0 failures; near 306 arena draw calls, medium 67, far 0; 56 cat calls near market, 0 far; open south entrance has 0 blocking high wall draw calls; inactive lion draws 0; active lion adapter draws 8 primitives.
- **Source preservation:** comparison against exact Bot A starting `RomanJudeaScene.ts` matches after stripping the new import and new `if(inRome)` call. Rome/Jerusalem colliders, portal, and original renderer are unchanged.
- **GitHub diff check:** only `app/components/RomanArenaScene.ts`, `app/components/RomanJudeaScene.ts`, `scripts/game-rome-arena-smoke.mjs` before docs.
- **Node smoke:** committed, but **not executed natively** in a checked-out Node runtime. Run `node scripts/game-rome-arena-smoke.mjs`.
- **Next.js preview:** non-production deployment `dpl_vXCcoaD8bZuWRxkL8PLYb54DEqbE` (`https://1muslim-lqpsiawb1-elmiandco.vercel.app`) **BUILDING** at first log; confirm status before reporting success.
- **Not verified:** physical mobile FPS, navigation/entry with solid colliders, AI lion combat, collision parity, and arena sightlines from city gate. No invented performance numbers.
- **Collision ownership:** New arena walls/seating are visual only; **Bot A must create solid ring/stands with clear gate openings, accessible routes and tested camera/terrain physics** before declaring the arena fully enterable. Existing Roman house/wall solids remain untouched. Cat models are non-solid decorative life.

## World-by-world progress / next work

| World | Existing module/behavior inspected or identified | Status / next verified slice |
| --- | --- | --- |
| **Rome** | `RomanJudeaScene.ts`, existing forum, portal and original small amphitheater | **This shift:** large arena + cats visualized. Next: Bot A colliders, lion 4× base movement vs 3× boost, 5 verified hits, 5-min respawn, ground-only AI; integrate `renderRomanArenaLion` using authoritative state |
| **Jerusalem / Roman Judea / Jesus-era** | Same renderer's `Jerusalem` branch and olive groves | Preserved; no historical certainty implied; next city-specific ambient life |
| **Ancient Egypt / Nile** | `AncientEgyptRiverScene.ts`, `gameEgyptWorld.ts`, Bot A 21:00 dock solids | Preserved; next **long navigable Nile**, authentic banks, ancient markets, era-appropriate palace, cats. Bot A owns river terrain/collision |
| **Moses / Parted Sea** | `PartedSeaScene.ts`, Egypt portal imports in shared lobby | Preserved; inspect portal-side geography before edits |
| **Jurassic** | `JurassicScene.ts` and river-life work in prior shifts | Preserved; next wildlife + collision/LOD audit |
| **Future / RealMecca** | `FutureCityScene.ts` and 20:30 koi gardens | Preserved in branch ancestry; next mobile scene test |
| **Muhammad-era / Makkah / Madinah** | `HajjPilgrimScene.ts`, `NabawiCongregationScene.ts` imports | Preserved; verify seven circuits + Safa–Marwa movement and congregations in runtime |
| **Space / Moon / Blessed Chambers** | `LunarResearchScene.ts`, `MOON_BOUNDS` | Preserved; next orbital environment / scene LOD audit |
| **Today / other districts** | `TODAY_PROP_COLLIDERS`, existing shared lobby waypoints | Preserved; 10 enterable showcase mosques still require evidence and physics validation |

## Bot A handoff / integration / rollback

- **Bot A owns:** arena collision/terrain/LOD coordination, accessible gate physics, hostile lion authoritative speed/attack/5-hit/5-minute respawn, Egypt long Nile terrain and shore solidity, shield combat authority.
- **Bot B owns:** Roman arena/cat/lion visuals, Egypt scenery, NPCs, river palms, ambient audio; continue to preserve existing world-specific modules.
- Integrate into a **fresh branch from the site's then-current integration/production head**, not this old full app snapshot. Selectively cherry-pick the four game/test commits above or transplant only `RomanArenaScene.ts` plus two import/call lines in `RomanJudeaScene.ts`. Do not transplant `app/page.tsx`, `SharedGameLobby.tsx`, layouts, nav, feed, profile, Quran, GoLive or CSS.
- **Rollback:** revert the two visual integration lines/import and remove the new scene module. This does not change existing Rome/Jerusalem solids or portals.
- Prior shift references: [Bot A Egypt dock collision](2026-10-27-egypt-dock-cargo-solids-2059.md), [Bot B Future koi](2026-10-27-future-koi-gardens-2030.md), [master issue #126](https://github.com/ElmiandCo/1Muslim/issues/126).

**Production/main/frozen preview unchanged by this shift. No production deployment or merge.**
