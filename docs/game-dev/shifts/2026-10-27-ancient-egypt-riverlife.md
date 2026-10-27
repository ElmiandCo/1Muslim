# Bot B / Living Worlds — Ancient Egypt Nile ecology and construction scene
**2026-10-27 15:28–15:39 CDT (America/Chicago)** · game-only development · **NOT deployed**

## Source, baseline, and no-regression gate
- Protected site baseline: `fix/profile-scroll-match-umma-20261027` @ `c856491131bb0c8056693652f8e5e58a26836831`.
- Dedicated Bot B branch: `game/living-worlds-ancient-egypt-riverlife-20261027-1530`, created directly from that baseline. Implementation commits `f9e8b78afa85d429604c874091c12e3b50354c56` (scene) and `81df85b9ca14888ffbff20d648c57d1e9560012d` (test).
- Read-only production/main gate at shift start: `main` @ `82eddbf7a5a94fa5968550be2bd335a4aa46f823`; Vercel production `dpl_DbtVZbtN1b7x5ccavV9PGxm1dZAY` READY on that SHA. Main and frozen preview **diverge in non-game files**, including community-posts, feed, and profile components; no site files were transplanted.
- Current site layout contract: `app/page.tsx` is unchanged across main/protected baseline in the inspected prior shift; preserve all frozen two-nav, posts/feed, profile-scroll, Qur'an and GoLive behavior. `SharedGameLobby.tsx` is a game-owned integration hotspot; this shift deliberately did **not** edit it.
- Other-shift handoffs reviewed: Bot A `game/world-engine-3d-side-sweep-20261027-1500` (vertical flight/culling; owns physics/LOD/portals) and Bot B `game/living-worlds-hajj-pilgrims-20261027-1430` (seven-circuit pilgrims). Prior Bot B Parted Sea `PartedSeaScene.ts` uses a cube-based draw signature. Cross-reference their `docs/game-dev/SHIFT_LOG.md` and `docs/game-dev/shifts/2026-10-27-hajj-pilgrims.md`. None of those branches was overwritten or merged.

## Exact changed paths and behavior
| Path | Scope | Before → after |
| --- | --- | --- |
| `app/components/AncientEgyptRiverScene.ts` | **NEW game-only scene helper** | No isolated Egypt riverside renderer → deterministic Nile water and fertile banks; 54 palm candidates with animated fronds; 22 faceless animated limestone carriers; 4 moving boats with linen sails and limestone cargo; 12 birds; 3 staged pyramid construction sites with ramps and scaffolding; 8 open-front settlement houses; 3 docks and unloading stacks. Exports `renderAncientEgyptRiverLife`, `egyptWorkerPose`, `egyptBoatPose`, `egyptRiverCenterX`, `ancientEgyptSolidProps`, scene bounds and prop arrays. |
| `scripts/game-ancient-egypt-smoke.mjs` | **NEW game-only test** | Reproducible Node 22.16+ TypeScript-strip smoke assertions for river placement, palm/boat motion, collider descriptors, near/far LOD, finite geometry and draw budget. |
| `docs/game-dev/shifts/2026-10-27-ancient-egypt-riverlife.md` | **NEW handoff** | This evidence, limitations, integration steps and world matrix. |
| `docs/game-dev/SHIFT_LOG.md` | **NEW on protected-baseline-derived branch** | Persistent game-only shift index; linked to earlier logs on other game branches. |

**No existing game file was replaced.** No changes to `main`, production, `app/page.tsx`, navigation, profile, feed, Qur'an, GoLive, CSS, Supabase, Belt Boyz office, Masjid an-Nabawi, portals, or Bot A physics. No new dependencies.

## Implemented vs pending
**Implemented, code-ready but not yet visible in the game:** scene geometry and deterministic animated NPC/boat/bird routines. The scene is deliberately a separate module until Bot A wires the Moses-side portal to a **new Ancient Egypt world**, including the return portal. It is not correct to describe this as a playable Egypt world yet.

**Pending with Bot A:** scene selection and portal pair; new world terrain and solid Nile banks; integrate `ancientEgyptSolidProps()` into actual collision broadphase; align ramp/scaffold and palm collisions to rendered geometry; test flight, roof/floor landings, water/boat behavior and mobile progressive LOD. Do not put Ancient Egypt inside the existing Moses world or replace the existing Nile Quarter in Today. Moses/Parted Sea must remain intact.

**Historical caution:** these are deliberately interpretive construction-era scenes, not a statement that pyramid construction occurred during Moses's lifetime. No prophet depiction or asserted historical date. Workers and boats are visual-only; the exported prop volumes are **not live colliders** until integrated.

## Verification
- **PASS**: GitHub compare against exact protected baseline after implementation shows only `app/components/AncientEgyptRiverScene.ts` and `scripts/game-ancient-egypt-smoke.mjs` (two additions, zero existing-file edits).
- **PASS**: direct execution of the new scene's actual JavaScript logic after stripping TypeScript-only annotations in an isolated V8 test harness: **510 assertions**, 0 failures; riverbank camera **224** draw calls, construction camera **222**, far camera **0**. Checked geometry finite, palm bank clearance, boat follows river curve, scene prop count and near/far budget. These are measured helper draw callback counts, **not GPU frame timings**.
- **NOT RUN**: committed Node smoke script in a full checkout; full Next.js build, TypeScript project typecheck, WebGL render, device FPS and multiplayer playtest. No deployment was attempted.
- **Performance guardrails**: river tiles restricted to ±230m; palms within 230m (near detail 100m); NPCs within 135m; boats within 200m; bird wings within 80m; pyramid detail within 410m. Draw counts are deterministic at the sampled positions; wider mobile-device profiling is still required.
- **Known limitation**: current solid descriptors include full pyramid bounding boxes, which must be refined into stepped collision geometry by Bot A to avoid invisible walls; huts are open-front visually but need proper wall/roof collider decomposition before calling them enterable. River water is visual only.

## Per-world progress checklist
| World | Existing code/handoff | This shift | Next action |
| --- | --- | --- | --- |
| **Ancient Egypt (new separate world)** | Existing Today Nile Quarter is **not** the requested new world | **New isolated Nile/palms/workers/boats/pyramid scene module** | Bot A portal and terrain/riverbank/collider integration; B refine unload interactions |
| Moses / Parted Sea | Bot B `PartedSeaScene.ts` on separate branch; water-wall shoals and NPC pursuit | Preserved; no modifications | Bot A connects portal at **side fled FROM** to new Egypt and back |
| Jurassic | `JurassicScene.ts` and Bot B river ferns/dragonflies branch | Preserved | Selectively integrate river-life diff; test cave solidity |
| Future / RealMecca | `FutureCityScene.ts`, gardens branch | Preserved | Integrate gardens and test tower/skyway collisions |
| Muhammad-era / Makkah / Madinah | Historical scene, Kaaba, Nabawi; Hajj helper on B's previous branch | Preserved | Review seven-circuit NPC integration, prayer groups |
| Roman Judea / Jesus-era / Jerusalem | Bot B `RomanJudeaScene.ts` on prior branch | Preserved | Selective integration; preserve distinct world |
| Space / Blessed Chambers / Moon | Bot B `LunarResearchScene.ts`; Bot A flight/LOD | Preserved | Test high-altitude transitions and EVA |
| Today / Main Street / Belt Boyz | Protected baseline and Bot A physics branches | Preserved | Check roofless Belt Boyz, XP shop, voice and hand animation |

## Integration and rollback — **manual review only**
1. At integration time re-fetch latest `main`, production and frozen site integration branch; compare `app/page.tsx`, `SharedGameLobby.tsx`, CSS and site contracts before changing anything.
2. Cherry-pick **only** the Egypt implementation commit `f9e8b78afa85d429604c874091c12e3b50354c56` (adds one new game module), or copy that new module as a targeted file. The smoke test commit is optional but recommended. Do **not** merge this entire branch or import stale pages.
3. Bot A should import `renderAncientEgyptRiverLife` into the separate Egypt world render branch using the existing cube draw adapter, connect reciprocal portals, and add **real** collider integration using refined `ancientEgyptSolidProps`. Avoid changing the protected Moses scene.
4. Rollback: remove the new module import/render call and any targeted Egypt-world portal/collider wiring; no site component rollback should be needed.
5. Test `node --experimental-strip-types scripts/game-ancient-egypt-smoke.mjs`, project build, and actual phone playtest before integration. **No production deploy or merge without explicit user approval.**

## Next Bot B shift
Refine dock unloading NPCs, date-palm frond/ground transitions and settlement life in this independent scene; inspect Bot A's new Egypt portal handoff first. Other requested XP shop/blasters/force field/raised hands/voice indicators/ten mosques remain open; do not claim they were completed here.
