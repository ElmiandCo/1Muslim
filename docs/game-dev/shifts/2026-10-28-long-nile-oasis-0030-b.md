# Living Worlds / Bot B — Long Nile oasis life

**Date:** 2026-10-28 (America/Chicago, CDT)  
**Bot:** B — Living Worlds / environment and ambient NPCs  
**Scope:** GAME ONLY. No main, production, frozen preview or site changes.

## Read-only baseline and coordination
- **Protected site preview:** `fix/profile-scroll-match-umma-20261027` @ `c856491131bb0c8056693652f8e5e58a26836831` (ref confirmed in preceding Bot A handoff). No write.
- **Latest main inspected this run:** `SharedGameLobby.tsx` blob `dc1ac60b62a17f8269a8228b880df7ac2c124425`; `app/layout.tsx` blob `106fb71fe188c0ca1893ee7751f3d6ecfd6ee32f`; `app/page.tsx` blob `b066f01c810fe5fcfa58db09b426383e2e3c9797`.
- **Frozen preview contract:** same lobby and layout blobs; preview `app/page.tsx` blob `92ca9b508378fd462ae3cf8a1458d2d4467aeb56` differs from main. No site files copied or modified.
- **Starting GAME branch and exact SHA:** `game/world-engine-nile-long-banks-20261028-0000-a` @ `7a5b8caf6c450ffd189c8bada621d8d9d1876d0f`. Inherits Bot A's 3,400-unit playable/wadeable Nile, palace/market solids, Rome arena solidity, Bot B fisheries, and all previous world work.
- **Working branch:** `game/living-worlds-long-nile-oasis-20261028-0030-b`.
- **Code commit:** `1835ed275ed9f42b9e0c7717e2c758f7b99fe00e` (scene); `09b6674c4a14d70d57e345fb324bcd8f76f79bf8` (two-line integration); `881be0e31316fda3c0caa5cf089f580705fd7b93` (reproducible smoke script). Working tip at documentation time: `881be0e3` before documentation commits.
- **Reviewed other shift:** [Bot A long-Nile handoff](2026-10-28-long-nile-0000-a.md) and [coordination issue #126](https://github.com/ElmiandCo/1Muslim/issues/126). Bot A explicitly requested scenery and wildlife outside Z ±520, using existing `egyptRiverCenterX(z)`. No Bot A physics/terrain files changed.

## Exact changes and before/after
| Path | Symbols / change | Before → after |
| --- | --- | --- |
| `app/components/AncientEgyptLongNileLifeScene.ts` (new) | `LONG_NILE_OASIS_PALMS`, `LONG_NILE_REED_BEDS`, `LONG_NILE_SKIFFS`, `LONG_NILE_HERONS`, `longNileSkiffPose()`, `renderExtendedEgyptNileLife()` | Extended north/south Nile banks had continuous water/terrain but little ambient scenery. Adds **64 deterministic palms**, **24 reed beds**, **8 animated skiffs**, **16 animated herons** distributed outside central Egypt, along the actual river centerline. Palm fronds sway; boats bob and move gently; birds bob. |
| `app/components/SharedGameLobby.tsx` | One import and one Egypt-only render call after existing Nile fisheries call | Adds long-Nile scenery **only** when Ancient Egypt renders; all other world render paths, input, physics, shields, blasters, meeting, layout and portals unchanged. |
| `scripts/game-egypt-long-nile-life-smoke.mjs` (new) | TypeScript-transpiled source smoke test | Reproducible Node assertions for arrays, geometry, 600 camera views, 900 skiff poses, central-scene exclusion and draw budget. Not run natively this shift. |

## Verified and pending
- **PASS:** fetched actual committed scene source from GitHub and executed it in V8 with TypeScript-only annotations removed and the existing `egyptRiverCenterX`/width injected.
- **PASS:** 600 sampled camera positions and 900 skiff poses; **0** invalid or non-finite dimensions, colors, angles or alpha; **0** draws at `|z|<=520`; **0** draws for a camera at world origin; **0** out-of-bounds scenery instances; **99 maximum** render draw callbacks per sampled camera view (not measured GPU FPS).
- **PASS:** exact single import and render anchors matched before the two-line integration; GitHub comparison before test/docs showed **only two game files changed** (new helper 80 lines and +2 lobby lines), no other world or site files.
- **NOT RUN:** native Node smoke, Next.js/TypeScript build, Vercel preview, real browser/mobile FPS, boat piloting, collision or multiplayer test. Do not call these complete.
- **Limitations:** boats, herons, reed beds and palm trunks are **visual only**, not collidable. Bot A must add palm solids after collision/LOD coordination. Boats are not boardable and do not navigate via player input. Existing central Nile and river extension physics remain as before. Interpretive ancient Egyptian setting is not a claim about pyramid dates or Moses-era architecture.

## Integration and rollback
- **Never merge this branch wholesale into the site.** Against the then-current site integration branch, selectively apply `1835ed27` plus **only the two lines** from `09b6674c` in the Ancient Egypt game renderer; optionally include `881be0e3` smoke test. Keep the current site page/layout/feed/profile/Qur'an/GoLive and Bot A physics authoritative.
- Before integration, re-read `SharedGameLobby.tsx` on target and verify existing Egypt branch and imports; resolve collisions with Bot A's ongoing changes rather than overwriting them.
- Rollback: remove `renderExtendedEgyptNileLife` call and import and delete isolated helper; no persisted state or migrations.

## World-by-world preservation / progress
| World | This shift | State / follow-up |
| --- | --- | --- |
| **Ancient Egypt** | **Advanced**: north/south long Nile palms, reed beds, 8 skiffs, 16 herons | Great Pyramid, palace, markets, dock crews, central Nile, fisheries, ±1700 terrain, portals retained. Bot A to handle palm colliders and pilotable boats. |
| **Moses / Parted Sea** | Preserved | Existing Egypt portal and parted-sea physics untouched. |
| **Jurassic** | Preserved | Dinosaur AI, cave, terrain and solids untouched. |
| **Rome / Jerusalem / Jesus-era** | Preserved | Existing Rome arena, cats, collision index, portals untouched; authoritative lion pending Bot A. |
| **Muhammad-era Makkah/Madinah** | Preserved | Kaaba, Hajj, Nabawi congregation, desert road and sign untouched; visual and historical caveats remain. |
| **Future / RealMecca** | Preserved | Existing towers, skyways, koi gardens and portals untouched. |
| **Space / Moon / Blessed Chambers** | Preserved | Existing ship, EVA, meeting and portals untouched. |
| **Today / Belt Boyz** | Preserved | Roofless office, meeting, shop, weapons, shield, controls untouched. |

## Next Bot B shift
1. Coordinate with Bot A on palm trunk collider parity; no invisible obstacles or riverbank changes by Bot B.
2. Add small ancient riverbank settlement and markets only after collision design is agreed.
3. Run `node scripts/game-egypt-long-nile-life-smoke.mjs`, Next.js build and mobile camera/FPS playthrough on a checked-out preview.
4. Advance a **different** world (Jurassic forest life or Roman cats/arena crowd) in a separate isolated shift; keep all world identities.
