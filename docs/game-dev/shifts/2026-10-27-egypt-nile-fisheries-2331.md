# Living Worlds / Bot B — Nile fishing landings and river journey

**Shift:** 2026-10-27 23:31 CDT (America/Chicago; 2026-10-28 04:31 UTC)  
**Scope:** Ancient Egypt visual-only game slice; no production deployment or site changes.

## Source-of-truth / coordination
- **Protected preview baseline:** `fix/profile-scroll-match-umma-20261027` @ `c856491131bb0c8056693652f8e5e58a26836831`; read-only.
- **Current main:** inspected `app/components/SharedGameLobby.tsx` blob `dc1ac60b`, `app/layout.tsx` blob `106fb71f`, `app/page.tsx` blob `b066f01c`. Frozen baseline lobby/layout blobs match main; baseline page blob `92ca9b50` **differs**. GitHub comparison shows main and frozen baseline diverged (19 ahead / 19 behind). No site file touched.
- **Starting game branch:** `game/living-worlds-egypt-market-palace-20261027-2330` @ `5d9a9f79b425c690e1b2fc482c75c32fc6a0fee4`. Reused its Egypt river, palace and market scene and its game-only render call. Did not overwrite previous work.
- **Working branch:** `game/living-worlds-egypt-nile-fisheries-20261027-2350`.
- **Code commits:** `a223315b25dd1177620c92236effedbb463810b2` (new scene), `7b98c89ea1af94603acefbaf78491e6125664d4a` (two-line Egypt-only integration).
- **Other bot:** reviewed Bot A's latest issue #126 Rome arena solidity handoff `game/world-engine-rome-arena-solids-20261027-2200-a` @ `881d9b9e`; Bot A owns colliders, physics, riverbank solidity, portal/LOD, authoritative lion and shield. This shift changes none of these.
- **Prior Bot B shift:** [Egypt palace and market](2026-10-27-egypt-market-palace-2242.md); coordination [issue #126](https://github.com/ElmiandCo/1Muslim/issues/126).

## Exact changed paths and behavior
| Path | Symbols / change | Before → after |
| --- | --- | --- |
| `app/components/AncientEgyptNileJourneyScene.ts` (new) | `NILE_FISHING_LANDINGS`, `NILE_FISHING_SKIFFS`, `nileFishingSkiffPose()`, `renderAncientEgyptNileJourney()` | Existing 1,040-unit Nile corridor gained six distributed reed-lined fishing/mooring landings, three gently moving skiffs with faceless fishermen, current glints, and simple fishing nets. |
| `app/components/SharedGameLobby.tsx` (+2 lines only) | Import and Egypt-only render call | Existing Egypt terrain, river life, palace/market and return portal retained. Added new visual scene between river-life and palace calls; other worlds never render it. |

**Geometry and performance:** six fixed shore stations at z -440/-310/-80/90/290/450; three skiffs at z -345/-30/335 with bounded ±24-unit movement; all inside existing Egypt bounds. Skiffs offset approximately 13 units from river center, leaving the center channel unobstructed. Fixed culling radius 145–165 units, near detail 72–85 units; no React state, network calls, timers, audio loops or new collision bodies. The river is **not** longer than its current bounds and skiffs are visual-only, **not player-pilotable**.

## Verification
- **PASS:** executed the **actual GitHub-fetched new scene source** in V8 with only TypeScript type annotations/import removed and the existing river width/center function injected. 600 sampled player camera positions across the corridor and 900 skiff pose checks.
- **PASS:** maximum 51 WebGL draw callbacks in sampled frames; 0 non-finite positions/colors or invalid alpha; 0 far-camera draws; 0 skiffs entering the reserved central lane in the sampled poses.
- **PASS:** GitHub comparison with parent shows exactly two game files changed: one new 99-line helper and two added lines in `SharedGameLobby.tsx`. No site page, layout, feed, profile, Quran, GoLive, CSS or physics files changed.
- **PASS:** verified unique existing import and render anchor before updating the shared lobby, preserving all other render branches.
- **PENDING:** Vercel preview build was observed BUILDING for commit `7b98c89e` at `https://1muslim-je1d3xleq-elmiandco.vercel.app` at shift log time; do not claim READY until checked.
- **NOT RUN:** native Node/TypeScript build, physical browser playthrough, touch-device FPS, river navigation, collision testing or multiplayer testing.

## Limitations, integration and rollback
- Visual-only skiffs/shore nets do not create solids or navigable water physics. No actual long-river world extension, boat boarding, pathfinding, server-authoritative state or collision change. Bot A must handle river terrain/bank extensions and navigability.
- Historical appearance is interpretive; does not assert that these settlements or pyramids existed in Moses's lifetime.
- For integration into then-current site: selectively cherry-pick `a223315b` and `7b98c89e`, or add the new module and **only two exact import/render lines** to the latest site game component. **Never wholesale-merge or replace the old lobby, app page, site nav or layout.** Review current app contract and Bot A branch before integration. Revert these two commits or remove the two render lines + helper to roll back.
- No production merge/deploy approved or attempted.

## World-by-world checklist
| World | This shift | Preservation / next step |
| --- | --- | --- |
| **Ancient Egypt** | Added six Nile fishing landings, three skiffs, river glints, reed beds and faceless fishermen | Preserve Great Pyramid, construction, cargo docks, market/palace, river wildlife, palms and return portal. Bot A: long river, boat physics, shore solidity, palace colliders |
| **Moses / Parted Sea** | Unchanged | Preserve departure-side Egypt portal and sea crossing |
| **Muhammad-era / Mecca / Madinah** | Unchanged | Preserve Hajj seven circuits + Safa–Marwa, Nabawi congregation, historic Kaaba, crossroads spawn/sign |
| **Jerusalem / Roman Judea / Rome** | Unchanged | Preserve existing Rome market/arena/cats in their branches; Bot A owns arena solids and authoritative lion |
| **Jurassic** | Unchanged | Preserve prehistoric wildlife, terrain and collision |
| **Future / RealMecca** | Unchanged | Preserve koi gardens, towers, skyways and portal |
| **Today / Belt Boyz** | Unchanged | Preserve roofless office, meeting, XP shop, blasters and shields |
| **Space / Moon / Blessed Chambers** | Unchanged | Preserve spaceflight, lunar research and meeting HQ |
| **Other / world picker** | Unchanged | Preserve portals, worlds, game navigation |

## Next shift
1. Check Vercel preview build result and run browser/mobile FPS and river visibility playthrough.
2. Coordinate with Bot A to extend navigable Nile terrain/riverbanks without desynchronizing the visual centerline, add boat boarding/collision only after physics review.
3. Consider another world-specific visual slice (Jurassic or Madinah) before returning to Egypt, while keeping the per-world checklist current.

## Preview build verification addendum
- **PASS — Vercel preview build READY** for implementation SHA `7b98c89ea1af94603acefbaf78491e6125664d4a`, deployment `dpl_GmhXUgV2agctapd74Qw6xXPmDqkQ` at https://1muslim-je1d3xleq-elmiandco.vercel.app . This confirms the preview deployment reached READY, not an interactive browser/phone gameplay pass. The documentation-only commits do not change that code SHA.
- **Still not tested:** mobile FPS, player-controlled skiff navigation, shore solidity and multiplayer. Preview is not production.
