# Living Worlds / Bot B — Future City sky couriers

**Shift:** 2026-10-28 01:33 CDT (America/Chicago; 06:33 UTC)  
**Bot:** B — Living Worlds, world-specific scenery and ambient life  
**Scope:** GAME ONLY. No main, frozen preview, production, site navigation, profile, feed, Qur'an, GoLive, Belt Boyz or shared physics writes.

## Baseline, coordination and contracts

| Reference | Exact ref / SHA | Checked |
| --- | --- | --- |
| Frozen site preview | `fix/profile-scroll-match-umma-20261027` @ `c856491131bb0c8056693652f8e5e58a26836831` | Read-only; `app/page.tsx` and layout inspected |
| Latest main / production code branch | `main` @ `c043219f7a3eeb8e1529538013e97f311a3b938a` | Read-only; **deployment status not checked** |
| Source GAME branch | `game/living-worlds-long-nile-oasis-20261028-0030-b` @ `ea5ae7f895478647e806b3b43bf3c2b53fe5d1a8` | Existing all-world code preserved |
| Working branch | `game/living-worlds-future-sky-couriers-20261028-0130-b` @ `27d1d03902fd5a061cb1989eece85f116888b51c` (before docs) | Dedicated game-only branch |

**Contract comparison:** main and frozen preview have identical `SharedGameLobby.tsx` blob `dc1ac60b62a17f8269a8228b880df7ac2c124425` and `app/layout.tsx` blob `106fb71fe188c0ca1893ee7751f3d6ecfd6ee32f`; `app/page.tsx` differs (`b066f01c...` vs `92ca9b50...`). The baseline-to-main comparison shows **site-only changes**. Do not copy old site pages or replace main with a game branch.

**Other shift reviewed:** [Bot A long-Nile terrain/physics handoff](2026-10-28-long-nile-0000-a.md), [Bot B long-Nile scenery handoff](2026-10-28-long-nile-oasis-0030-b.md), and [game coordination issue #126](https://github.com/ElmiandCo/1Muslim/issues/126). Bot A retains collision/flight/LOD engine ownership; this shift deliberately changes none of those.

## Implemented and committed

| Commit | Changed path | Before → after |
| --- | --- | --- |
| `022d18c1cfdb178f9239e7048d2c1043458f2790` | `app/components/FutureSkyCourierScene.ts` (new) | Adds 12 deterministic high-altitude courier routes, `futureCourierPose()` and `renderFutureSkyCouriers()`. Animated yaw, bobbing, glowing nose/wing tips and low-alpha trails; three accent palettes. |
| `be2ba1edbc89748a21d4939f2d60df1b2cfb2c1b` | `app/components/FutureCityScene.ts` | Adds **one import and one render call** after existing `renderFutureGardens()`, only inside the Future world. Existing towers, koi gardens, skyways, portal and player controls unchanged. |
| `27d1d03902fd5a061cb1989eece85f116888b51c` | `scripts/game-future-sky-couriers-smoke.mjs` (new) | Reproducible Node + TypeScript-transpiled source smoke covering positions, bounds, finite draw geometry, draw budget and far-camera culling. |

**LOD and collision separation:** 12 fixed routes, radii 88–243, altitudes 166–196 (above highest 137-unit tower), world bounds ±380; 270-unit horizontal culling, silhouette-only beyond 155 units, wing lights/trails only within 95 units. Visual-only: no physical colliders, weapons, damage, network messages or movement changes. No additional audio or gameplay interactions claimed.

## Verification performed

- **PASS:** fetched the committed TypeScript source from GitHub, stripped TypeScript-only annotations and executed the actual render and pose functions in V8.
- **PASS:** 1,200 simulated camera views + 1,200 courier pose samples, all finite positive geometry; no alpha outside 0–1; 12 routes in bounds and above tower height.
- **PASS:** max **48 draw callbacks** across sampled views, **zero** draw callbacks at a far camera (1000,1000). This is a synthetic geometry/draw-count check, **not** a GPU/FPS measurement.
- **PASS:** GitHub branch comparison before adding smoke/docs showed **exactly two game files** changed (one new scene, +3 lines in FutureCityScene); no site, other-world or Bot A files.
- **NOT RUN:** native `node scripts/game-future-sky-couriers-smoke.mjs`, `npm run build`, Vercel preview, browser/mobile FPS, multiplayer or collision integration. No deployment was performed.
- **Known limitations:** Drone paths are decorative and do not physically avoid players/flight vehicles; at altitude they may be hard to see from ground without looking up. They are not boardable, damageable or synced as authoritative entities. Avoid claiming these features.

## Integration and rollback

1. On the **then-current** site integration branch, re-check game and site contracts. **Never merge this branch wholesale.**
2. Cherry-pick **only** `022d18c1` (new scene) and the three-line Future City integration hunk from `be2ba1ed`; optionally include the smoke script `27d1d039`. Resolve any Future City overlap with Bot A manually.
3. Run native smoke, TypeScript/Next.js build, gameplay test in Future world, mobile FPS, and regression smoke in other worlds before any user-approved production deployment.
4. Roll back by removing `renderFutureSkyCouriers` import/call and deleting the isolated scene; no persisted data or schema changes.

## World-by-world checklist

| World | Shift status | Preserved / next |
| --- | --- | --- |
| **Future / RealMecca** | **Advanced**: 12 animated skyline couriers, tiered LOD | Existing towers, skyways, portal, gardens and koi unchanged; mobile visual verification next |
| **Ancient Egypt** | Preserved | Great Pyramid, long Nile, banks, fisheries, markets, palace, oasis life, portals retained; Bot A owns terrain/collision |
| **Moses / Parted Sea** | Preserved | Egypt entry/return portals, sea physics and NPCs unchanged |
| **Jurassic** | Preserved | Dinosaur AI, cave, terrain, riverside life and collisions unchanged |
| **Rome / Jerusalem / Jesus-era** | Preserved | Amphitheater, cats, Judea scene and portals unchanged; authoritative lion combat remains Bot A TODO |
| **Muhammad-era Makkah / Madinah** | Preserved | Kaaba, Hajj circuits/sa'i, Nabawi congregation, desert road and crossroads sign unchanged; historical reconstruction remains interpretive |
| **Space / Moon / Blessed Chambers** | Preserved | Ship, lunar station and existing game systems untouched |
| **Today / Belt Boyz / Meeting** | Preserved | Roofless office, meeting controls, Exit Meeting, shield, blaster and XP shop unchanged |

## Next shift

1. Verify Future courier readability in browser and mobile; if needed add subtle ground-level landing beacons **without** adding solids or obscuring the portal.
2. Advance a different world-specific slice (Jurassic or Roman Judea) with scenery-only helpers, respecting Bot A collision ownership.
3. Coordinate Bot A lion authority, solid riverbank/palms, progressive flight LOD and shield multiplayer enforcement via issue #126.
4. Keep a strict selective game-only integration diff; no production deployment without explicit user approval.
