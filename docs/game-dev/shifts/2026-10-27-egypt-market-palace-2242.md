# Living Worlds / Bot B — Ancient Egypt palace and Nile market
**Shift:** 2026-10-27 22:42 CDT (America/Chicago; 2026-10-28 03:42 UTC)  
**Scope:** game-only visual scenery, Ancient Egypt. **No deployment or merge.**

## Branches and inspected contracts
- Protected site baseline: `fix/profile-scroll-match-umma-20261027` (read only).
- Latest checked `main`: `app/components/SharedGameLobby.tsx` blob `dc1ac60b`, `app/layout.tsx` blob `106fb71f`, `app/page.tsx` blob `b066f01c`.
- Frozen preview baseline: lobby blob `dc1ac60b`, layout blob `106fb71f`, **different page blob** `92ca9b50`. Thus NEVER overwrite or merge `app/page.tsx`.
- Starting game branch: `game/muhammad-madinah-midway-sign-20261027-2300` @ `6c915ddc372405dae13885a7fcbb11cc711e0df7`. Preserves prior Mecca–Madinah crossroads, reddish interpretive Kaaba, camera/projectiles, Egypt, Moses and all existing game scenes.
- Working branch: `game/living-worlds-egypt-market-palace-20261027-2330` @ `e699726c3fd3c30b37b2a1e23eb63c7016c0d618` **before this documentation commit**.
- Related prior shifts: `docs/game-dev/shifts/2026-10-27-rome-lion-rules-2205.md`, `docs/game-dev/shifts/2026-10-27-projectiles-camera-2240.md`, existing `SHIFT_LOG.md`, issue [#126](https://github.com/ElmiandCo/1Muslim/issues/126).
- Bot A owns terrain/riverbank solidity, world portal, collision/LOD, authoritative combat. Bot B adds render-only scene; no shared physics changes.

## Actual changes
| Path | Symbols / changes | Before → After |
| --- | --- | --- |
| `app/components/AncientEgyptMarketPalaceScene.ts` (new) | `EGYPT_PALACE`, `EGYPT_MARKET`, `EGYPT_DISTRICT_FOOTPRINTS`, `renderEgyptMarketPalace()` | No palace/market module → separate bounded visual district with historically interpretive mudbrick palace walls, **open southern gate**, pylon entry, painted columns, courtyard, shaded water garden/papyrus; Nile-side 5×3 market stalls with a clear walking spine, baskets/pottery, faceless porters and animated cats |
| `app/components/SharedGameLobby.tsx` (2 added lines only) | Egypt import and Egypt-only render call | Existing Egypt river, pyramids, portals and NPCs retained; new visuals called after `renderAncientEgyptRiverLife()` |

**Implementation commits:** `2289a216` initial scene, `40de5306` open-gate correction, `e699726c` two-line renderer integration.  
**World coordinates:** palace center (15, -370), half-extent (56,70); market center (-20,290), extent (54,43); inside current Egypt bounds ±460 X, ±520 Z, away from pyramid centers. Market center column intentionally omitted to leave open walking spine. Distance culling 380/330 units, near-detail 170/145 units. NPCs/cats visual only.

## Verification (no inflated claims)
- **PASS:** 11 source and numeric invariants checked against the GitHub-fetched committed files: renderer import/call, original river call retained, split/open gate, market lane, culling guard, collider planning footprints, bounds and separation from pyramid landmarks.
- **PASS:** GitHub compare shows exactly **2 game paths changed**, one new scene and two inserted lines in existing lobby; no site, profile, feed, Quran, GoLive, CSS or other world modules modified.
- **NOT RUN:** `npm run build`, TypeScript compiler, WebGL browser smoke, multiplayer, mobile FPS, collision/portal playthrough. This is **committed and statically checked, not fully gameplay verified**.
- **Performance:** deterministic fixed 5×3 stalls, 10 market shoppers, 4 cats; distance LOD and no network messages; estimated a few hundred WebGL box draws when near both districts, **not measured**.
- **Known limitation:** all palace/market architecture currently visual-only; walls/columns/roof props do NOT have matching physics solids, so players can pass through them until Bot A integrates selectively. Palace is visually enterable via open gate. Water garden is decorative, not a navigable river. This shift does **not** extend Nile bounds, implement boats/navigation or add server-authoritative AI.
- **Historical caution:** this is an era-inspired reconstruction; no assertion these buildings existed in Moses's lifetime.

## Per-world progress and preservation checklist
- **Ancient Egypt:** NEW palace and market visuals integrated in branch; existing Great Pyramid, construction workers, river/docks, boats, date palms, wildlife and Moses return portal preserved. Long navigable Nile, palace/market selective colliders and mobile verification pending.
- **Moses / Parted Sea:** untouched; preserve departure-side Egypt portal, refuge and return behavior.
- **Muhammad-era / Mecca / Madinah:** untouched this shift; preserve existing Nabawi congregation, respectful Hajj seven circuits + Safa–Marwa behavior, historical Kaaba, crossroads and spawn.
- **Jerusalem / Roman Judea / Rome:** untouched; Rome grand arena/cats and lion helper are in **other** branches, not automatically included; arena solidity and authoritative lion combat pending.
- **Jurassic:** untouched; preserve dinosaurs, cave and river life.
- **Future / RealMecca:** untouched; preserve architecture, koi gardens, portal.
- **Space / Blessed Chambers / Moon:** untouched; preserve spaceships, lunar life and portals.
- **Today / Belt Boyz / Meeting:** untouched; preserve roofless office, meeting exit, shield, XP shop, flight, multiplayer.

## Integration / rollback contract
1. Confirm current site integration branch and compare with frozen baseline **at integration time**; never replace `app/page.tsx` or site layout.
2. Cherry-pick only the game-scoped commits `2289a216`, `40de5306`, `e699726c` (or copy new scene + **two-line** import/call patch) onto the then-current game integration branch; review `SharedGameLobby.tsx` conflicts line-by-line.
3. Reconcile latest Bot A Egypt collision and LOD code; do not introduce solid courtyard blocking the gate, invisible market obstacles or collisions tied to render distance.
4. Run `npm run build`, browser portal/market/palace navigation, mobile FPS and world regression checks before asking for release approval.
5. Rollback: revert the three implementation commits or remove Egypt-only render call/import and new helper. No production/main changes have occurred.

## Next shift
- Bot A: design physically enterable palace/market wall colliders, clear gate and walking lane; extend Nile bounds/riverbanks and boat navigability with consistent collision/LOD.
- Bot B: add period-appropriate market trade animation and palace vegetation detail after physics coordination; preserve low draw counts. Continue other worlds one tested slice at a time.
- Cross-reference issue #126; do not claim live multiplayer, build or production readiness until independently verified.
