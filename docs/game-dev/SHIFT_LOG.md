# 1Muslim — Game-only shift log (Bot B working branch)
> This file is branch-local. It does not replace the larger logs on Bot A's and earlier Bot B's independent game branches. Never merge this branch wholesale into the current site. All game changes require selective integration and user approval before production.

## 2026-10-27 · 15:28–15:39 CDT — Bot B / Living Worlds
**Protected base:** `fix/profile-scroll-match-umma-20261027` @ `c856491131bb0c8056693652f8e5e58a26836831`.
**Working branch:** `game/living-worlds-ancient-egypt-riverlife-20261027-1530`.
**Main and production read-only gate:** `82eddbf7a5a94fa5968550be2bd335a4aa46f823` (Vercel production READY, `dpl_DbtVZbtN1b7x5ccavV9PGxm1dZAY`). Site divergence exists; no non-game changes copied.
**Implementation SHA:** `f9e8b78afa85d429604c874091c12e3b50354c56`; **smoke test SHA:** `81df85b9ca14888ffbff20d648c57d1e9560012d`; **detailed handoff SHA:** `b5dffe279ad32f21331f5957d38022bbb33386a8`.

### Changed paths and exact modules
- `app/components/AncientEgyptRiverScene.ts` **new** — `renderAncientEgyptRiverLife`, `egyptWorkerPose`, `egyptBoatPose`, `egyptRiverCenterX`, `ancientEgyptSolidProps`; deterministic Nile ecology, construction scaffolds/ramps, limestone carriers, boats, birds, solid-trunk candidate descriptors and distance-based LOD. **Not wired into gameplay yet**.
- `scripts/game-ancient-egypt-smoke.mjs` **new** — reproducible TypeScript-stripped Node smoke test; committed but not run in a full checkout.
- `docs/game-dev/shifts/2026-10-27-ancient-egypt-riverlife.md` **new** — complete test evidence, before/after, per-world matrix, limitations, integration and rollback.
- `docs/game-dev/SHIFT_LOG.md` **new** — this shift index.
- **No existing files changed**; no dependencies added.

### Verification
- PASS — baseline GitHub diff contained exactly the two new implementation/test paths before documentation.
- PASS — actual scene logic run in isolated V8 after removing type annotations: 510 assertions, zero failures; 224 riverbank, 222 construction, 0 distant draw callbacks. This is not a GPU FPS measurement.
- NOT RUN — full Next.js build, full TypeScript project typecheck, committed Node script, mobile WebGL/physics playtest.
- Known limitations — scenery not playable until Bot A wires new world and portals; river, ramp, huts and palms require collider integration/refinement; pyramid descriptor currently too coarse for stepped solids.
- Integration: cherry-pick **only** `f9e8b78` (new game module), then targeted Bot A renderer/portal/collider patch against **latest site branch**; preserve all frozen site layouts, Belt Boyz roofless office, Masjid an-Nabawi and existing worlds. Rollback removes only Egypt import/wiring. No merge/deploy to production.

### World-by-world status
| World | State |
| --- | --- |
| Ancient Egypt (new) | **New isolated scenery helper implemented**; portal and physics pending Bot A |
| Moses / Parted Sea | Existing B scene preserved; portal on departure side to Egypt pending |
| Jurassic | Existing dinosaur and B river-life modules preserved |
| Future / RealMecca | Existing towers/skyways and B gardens preserved |
| Makkah / Madinah / Muhammad-era | Existing Nabawi and B seven-circuit Hajj work preserved |
| Roman Judea / Jesus-era / Jerusalem | Existing B scene preserved |
| Space / Blessed Chambers / Moon | Existing B lunar and Bot A flight work preserved |
| Today / Belt Boyz | Existing shop/city/roofless meeting design preserved; no edits |

### Cross-shift coordination
- Reviewed Bot A `game/world-engine-3d-side-sweep-20261027-1500` log: A owns portal, terrain, collision and LOD. B avoids `SharedGameLobby.tsx` entirely.
- Reviewed Bot B `game/living-worlds-hajj-pilgrims-20261027-1430` and `PartedSeaScene.ts` on separate branch. Do not overwrite their modules.
- Prior detailed logs: `docs/game-dev/SHIFT_LOG.md` on those branches, plus `docs/game-dev/shifts/2026-10-27-hajj-pilgrims.md`.
- Next: coordinate Egypt portal/collision integration with A; B extend dock unloading and fauna; run full build and real-device checks. Shop/blasters/shield/hand/voice/ten mosques remain unimplemented in this shift.

**Full handoff:** [Ancient Egypt riverlife](shifts/2026-10-27-ancient-egypt-riverlife.md).
