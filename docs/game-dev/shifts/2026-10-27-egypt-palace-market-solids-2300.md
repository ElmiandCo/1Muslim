# Bot A / World Engine — Ancient Egypt palace and market collision parity

**Shift:** 2026-10-27 23:00 CDT (America/Chicago; 2026-10-28 04:00 UTC)  
**Scope:** game-only Ancient Egypt static physics, geometry parity and regression coverage. **No production merge or deployment.**

## Baselines and source inspection
- **Frozen site preview (read-only):** `fix/profile-scroll-match-umma-20261027` @ `c856491131bb0c8056693652f8e5e58a26836831`.
- **Latest checked `main` (read-only):** `c043219f7a3eeb8e1529538013e97f311a3b938a`; **frozen production checkpoint (read-only):** `freeze/production-20261026-1824` @ `518fddcc3ec4530a66d3e857f7c4257bb8914cff`.
- **Layout contract check:** `app/layout.tsx` identical blob `106fb71f` on main and frozen preview; `app/components/SharedGameLobby.tsx` identical base blob `dc1ac60b`; **`app/page.tsx` differs** (main `b066f01c`, frozen `92ca9b50`). No app page/layout, nav, profile, feed, Quran or GoLive files were touched. Current game branch's lobby includes additional game-only scene wiring; do **not** replace the live site's lobby blindly.
- **Starting GAME source:** latest Bot B handoff `game/living-worlds-egypt-market-palace-20261027-2330` @ `5d9a9f79b425c690e1b2fc482c75c32fc6a0fee4`; compare to prior Bot A projectile-camera branch `game/world-engine-projectiles-camera-20261027-2240` showed this Bot B branch is **8 commits ahead and 0 behind**. It includes the newer game improvements, so no stale engine replacement was needed.
- **Working branch:** `game/world-engine-egypt-palace-market-solids-20261027-2300-a`; implementation/test tip `4c29d0c23f6a291d7ad2f2ad5b0909544e5ba639` before documentation.
- **Other shift handoff reviewed:** [Bot B palace/market](2026-10-27-egypt-market-palace-2242.md) and [coordination issue #126](https://github.com/ElmiandCo/1Muslim/issues/126). Bot B owns scenery/NPCs; Bot A owns terrain, solid geometry, collision index and physics.

## Exact changes and before/after
| Commit | Path | Symbols | Before → After |
| --- | --- | --- | --- |
| `df06c80c` | `app/components/gameEgyptDistrictPhysics.ts` (new) | `createEgyptDistrictColliders()` | Visual-only palace/market architecture → **149 render-matched static AABB colliders**: split perimeter and open southern gate, pylons and high lintel, hall columns/capitals and dais, decorative crates, 12 stall bases, 48 posts, 12 awnings and 36 merchandise piles. Market center column deliberately omitted so the walking lane remains open. |
| `201ad76b` | `app/components/gameEgyptWorld.ts` | `createAncientEgyptColliders()`, `EGYPT_COLLISION_INDEX` | Existing Nile/palm/pyramid/dock/portal solids retained; adds `createEgyptDistrictColliders()` to the existing immutable indexed world solids, **independent of visual draw distance**. |
| `4c29d0c2` | `scripts/game-egypt-district-smoke.mjs` (new) | Native TS transpile test loader, physical entry/landing/LOD checks | New regression test checks 149 volumes, gate entry, perimeter and pylon blocking, high lintel landing, 12 stall collisions and awning landings, open market spine, render correspondence and other world wiring. |

**Important:** These are new *client/game physics* colliders, not server-authoritative NPC or multiplayer combat. No new building visuals, NPC paths, boat mechanics, river bounds, or UI were added. The scene retains its historically interpretive framing; there is no claim the pyramids were built during Moses's lifetime.

## Verification and limitations
- **PASS — GitHub source checks:** 7/7 integration/static contract checks on the **actual committed GitHub files**: new collider factory, open gate, open market spine, imported visual dimensions, immutable Egypt index wiring, native smoke harness present, and game-only diff scope.
- **PASS — GitHub compare:** source branch → implementation tip is **ahead**, with exactly three changed paths (two `app/components/game*` and one `scripts/game-*`); **zero** site/page/layout changes. File additions: +49, +4 and +87 respectively.
- **NOT RUN:** `node scripts/game-egypt-district-smoke.mjs` (native checkout and node_modules unavailable in this connector runtime); `npm run build` locally, WebGL walkthrough, mobile FPS, real device, server-authoritative multiplayer. The new smoke script is committed but **not claimed as passing**.
- **Preview CI:** Vercel automatically initiated non-production preview builds for code commits; at documentation time, latest test commit `4c29d0c2` was **BUILDING** (`dpl_4zhKHYyzJ762bqP9xNomG917SgUs`). Check status before asserting compilation passes. This was an automatic branch preview, not a production promotion.
- **Performance:** immutable AABBs are inserted once into the existing 48-unit spatial broadphase. Collision persists beyond visual LOD; near/far WebGL rendering remains Bot B's existing distance-gated helper. Mobile frame time has not been measured.
- **Potential follow-up:** run native smoke, validate collisions against visible geometry on phone, check flying under/onto lintel and stalls; decorative garden/papyrus are not solid, NPCs/cats remain visual-only.

## World preservation and ownership
| World/system | This shift |
| --- | --- |
| Ancient Egypt / Nile / Great Pyramid | **Updated** palace and market collision volumes; all existing pyramid, dock, limestone cargo, palm, bank and return portal geometry preserved; long navigable Nile and boats remain pending |
| Moses / Parted Sea | Unchanged; departure-side portal and reciprocal return retained |
| Makkah / Madinah / Nabawi / Hajj | Unchanged; seven circuits and Safa–Marwa and congregation behavior retained as present in starting source |
| Rome / Roman Judea / Jerusalem | Unchanged; amphitheater/cats and lion helper from other branches require selective integration and real combat verification |
| Jurassic | Unchanged; original world and collisions retained |
| Future / RealMecca | Unchanged; koi gardens and future portal retained |
| Space / Moon / Blessed Chambers | Unchanged |
| Today / roofless Belt Boyz / Meeting | Unchanged; preserve roofless office and Exit Meeting; do not overwrite meeting UI |
| Hyper Defense, blasters, flight, XP, voice | Unchanged; server-authoritative shield and lion combat still unverified |

## Integration, rollback and next shift
1. **Do not merge the whole branch into the site.** Re-check current main/production layout and cherry-pick only `df06c80c`, `201ad76b`, `4c29d0c2` (or manually apply the two game physics files and test) onto the **then-current** integration branch. Resolve any `gameEgyptWorld.ts` conflicts narrowly; preserve new site layout and all other worlds.
2. **Rollback:** revert `201ad76b` to remove the physics index wiring, then remove new helper/test if desired; no renderer changes to undo.
3. **Bot A next:** execute native `node scripts/game-egypt-district-smoke.mjs`, `node scripts/game-egypt-integration-smoke.mjs`, `npm run build`; inspect Vercel preview result, mobile walkthrough, Nile extension/riverbank solids, lion authoritative combat integration and shield sync design.
4. **Bot B next:** continue market/palace life and visual polish without changing collider footprints silently; coordinate any wall/gate/stall dimension changes. Keep scene helpers separate and LOD bounded.
5. **Handoff:** reference this note and [issue #126](https://github.com/ElmiandCo/1Muslim/issues/126); no production deployment without explicit approval.
