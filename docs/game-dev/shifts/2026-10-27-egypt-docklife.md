# Bot B — Ancient Egypt Nile dock unloading and wildlife
**2026-10-27 · 16:25–16:35 CDT (America/Chicago)** · Game-only independent shift · **No production deploy or merge**

## Provenance and protected contract
- **Protected site preview ancestor:** `fix/profile-scroll-match-umma-20261027` @ `c856491131bb0c8056693652f8e5e58a26836831`.
- **Actual game starting point:** Bot A's `game/world-engine-egypt-portal-colliders-20261027-1600` @ `a40c755e16257559758640e20dcbf58eb6d84f02`. This is a descendant of the protected preview and includes the separately integrated Nile/Ancient Egypt world, Moses-side departure portal, reciprocal return, indexed collision, Hajj, Nabawi congregation, and prior swept-flight physics.
- **Dedicated branch:** `game/living-worlds-egypt-docklife-20261027-1630`. **Implementation** `a5b6576f4b77a5fd964722102abad7831559a09f`; **smoke extension** `a6082993aab90b6c5869685d1694ca86922d7d25`; **type simplification** `8f6dbf68afdd466927201e6eafb817a4e64b945f`. Documentation-only commits follow.
- **Read-only site/production check:** `main` @ `82eddbf7a5a94fa5968550be2bd335a4aa46f823`; production `1muslim.live` deployment `dpl_DbtVZbtN1b7x5ccavV9PGxm1dZAY` **READY** at the same SHA. Current main and frozen preview diverge in site/feed/profile/video files. Their app layout contract, two-nav design, scrollable Profile, feed, Quran and GoLive are **not** touched.
- **Cross-shift reviewed:** Bot A [Egypt portal and collision handoff](2026-10-27-egypt-portal-colliders.md), Bot B [original Egypt riverlife handoff](2026-10-27-ancient-egypt-riverlife.md), and Bot A's cumulative `SHIFT_LOG.md`. Bot A owns portal, terrain, solidity, LOD/flight integration; Bot B owns scenery, ambient life and visual NPCs.

## Exactly what changed
| Path | Before | After |
| --- | --- | --- |
| `app/components/AncientEgyptRiverScene.ts` | Three docks and stone piles existed, but no unloading crew or riverside wildlife except flying birds. | Adds six deterministic faceless cargo NPCs (two per dock), inland limestone delivery/empty return, close-only stepping animation, eight riverside herons and four fish with gentle surface ripples. Exact exports: `EGYPT_DOCK_CREWS`, `EGYPT_RIVER_WILDLIFE`, `egyptDockWorkerPose`; adds two cull-bounded rendering loops to `renderAncientEgyptRiverLife`. Existing palms, pyramids, boats, workers, Nile, birds and portal data unchanged. |
| `scripts/game-ancient-egypt-smoke.mjs` | Original deterministic scene smoke. | Extends with 6 crew/12 wildlife counts, 30 finite cargo poses, west-bank position bounds, carrying/return phase, two wildlife types, and near-dock draw budget. |
| `docs/game-dev/shifts/2026-10-27-egypt-docklife.md` | Absent. | This detailed shift record. |
| `docs/game-dev/SHIFT_LOG.md` | Previous Bot A and Bot B shift index. | Prepended this shift's entry; old history retained. |

**Not modified:** `SharedGameLobby.tsx`, `gameEgyptWorld.ts`, `gamePhysics.ts`, `PartedSeaScene.ts`, app pages, profile/feed/navigation, CSS, Quran, GoLive, Belt Boyz office, Supabase, assets, dependencies. **No new portals or colliders.**

## Implementation vs. verification
- **Implemented:** deterministic cargo pose over a 2-phase route, carrying limestone toward inland shore and returning empty-handed; six faceless workers across three docks. NPCs are render-only and their west-bank path stays within 15 world units of their dock; existing Bot A physics and colliders are untouched.
- **Implemented:** twelve fixed river-life seeds (four fish and eight herons), with nearby ripples, wingless resting herons and gentle movement. Fish and birds are decorative, not catchable or physically solid.
- **Performance:** no timers, audio nodes, network requests, random per-frame allocation of scene seeds, or textures. Camera LOD: crews 125-unit radius, wildlife 105 units; detailed legs/ripples/beaks at 55–75 units. Adds at most roughly 80–100 cube draw calls if every animal and crew is near the player; actual counts are view-dependent. This is not a mobile FPS benchmark.
- **Executed source-level smoke:** **PASS — 1,474 V8 assertions** against the actual branch TypeScript scene after stripping type-only annotations; camera samples: riverbank 240 draws, construction 222, dock 242, far 0. Checked finite positive draw dimensions, 6 cargo routes across 5 timestamps, west-bank bounds, phase change and local budget. This is not a substitute for a checked-out Node script or real WebGL playtest.
- **Committed Node smoke:** `node --experimental-strip-types scripts/game-ancient-egypt-smoke.mjs` (Node 22.16+). **Not executed in a full checkout** in this shift.
- **Build:** non-production Vercel preview `dpl_FkQ5pkYPDhi3KJj27GcN79VurEFg` at `8f6dbf68`; see latest deployment state before claiming READY. Does not alter live aliases.
- **Known limits:** boat cargo remains a visual prop; no physical boat boarding or cargo inventory; worker route is stylized, not pathfinding; dock piles and NPC feet may need device-level visual alignment; no field-recorded audio, no historical claim that pyramids were built in Moses's lifetime.

## World-by-world coverage and preservation checklist
| World | Status this shift | Ownership / next |
| --- | --- | --- |
| **Ancient Egypt / Nile** | **Upgraded** dock unloading and wildlife, on top of existing construction pyramids, palm clusters, boats, settlements and separate portal. | Bot B: shoreline ecology, village life, unloading animation polish; Bot A: dock/water solidity, terrain seams, LOD and device portal walkthrough. |
| **Moses / Parted Sea** | **Preserved**, departure-side portal and return unchanged. | Bot A: portal/physics regression on device. |
| **Jurassic** | **Preserved** existing scene; earlier Bot B river-life branch remains separate. | Bot B: integrate isolated ecology later by selective patch. |
| **Future / RealMecca** | **Preserved** towers, skyways and portal; separate B gardens branch not silently merged. | Bot B: future gardens integration after review. |
| **Muhammad ﷺ era / Makkah / Madinah / Nabawi** | **Preserved** Hajj NPC circuits, seven Safa–Marwa legs and congregation helper; no sacred figures represented. | Bot B: prayer/crowd performance checks. |
| **Roman Judea / Jerusalem / Rome** | **Preserved** existing module and portal; separate B market-life branch not silently merged. | Bot B: market props and life when integrated. |
| **Space / Blessed Chambers / Moon** | **Preserved** ship, EVA and lunar research; distinct Blessed Chambers scene not verified. | Bot A: flight/LOD; Bot B: lunar ambient detail. |
| **Today / Belt Boyz / XP shop** | **Preserved**, including roofless office and meeting controls. | Future B slices: XP shop, blaster sounds/aim, force field, raised-hand pose, speaker indicator and ten large mosques. |

## Integration, rollback and next handoff
1. **Never merge this branch wholesale into current site**: it descends from an older frozen preview while `main` and the site preview have diverged. On the **then-current** integration branch, apply only the three implementation commits touching `AncientEgyptRiverScene.ts` and its smoke script (or cherry-pick a reviewed patch), and re-check game-only diff; do not copy app pages, navigation, profile, feed or stale CSS.
2. Requires Bot A's existing `gameEgyptWorld.ts` and `SharedGameLobby.tsx` Ancient Egypt wiring. If the site lacks it, first selectively integrate Bot A's **game-only** Egypt portal/collider changes; avoid overwriting newer site/game source.
3. Rollback: revert `8f6dbf68`, `a6082993`, `a5b6576f` in reverse order, or restore just the two affected game files. No migrations or assets to remove.
4. Bot A: please preserve `egyptDockWorkerPose` and keep these visual-only NPCs out of the collider index; test dock steps, shallow Nile seam and Egypt↔Moses return. Bot B next: add small enterable shoreline market/boats interaction or distinct world-specific flora; first inspect newest Bot A handoff. Run full Node smoke and real iPhone FPS check when checkout available.
5. No production deployment or merge without explicit user approval.
