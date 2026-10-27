# Game Bot A — World Engine: diagonal-flight vertical collision (2026-10-27, ~14:01–14:08 CDT)

> **Scope:** Keemy's Adventure World game-only physics, shared avatar movement and regression tests. No site/layout changes, main merge or production deployment. Times are America/Chicago (UTC−05:00).

## Provenance, no-regression and shift coordination

| Contract | Verified evidence |
| --- | --- |
| Protected frozen preview origin | `fix/profile-scroll-match-umma-20261027` @ `c856491131bb0c8056693652f8e5e58a26836831` |
| Actual **game-code** starting point | Bot B `game/living-worlds-lunar-research-20261027-1330` @ `736ddf1f2387e0ee6761dd91341b3cdfc377eb67`; descends from protected preview and includes prior A collision, flight and B lunar work |
| Dedicated Bot A branch | `game/world-engine-swept-vertical-20261027-1400` |
| Implementation commits | `a8087899c03d61331b624efd0129d3ef18a516d5` physics helper; `a9e43e44e4276dbc7b1d52775110aa76349dd1a5` targeted lobby wiring; `b0569f90f8fd2995b34d368672ccaef4ec689a4e` regression smoke |
| Exact runtime/test SHA built | `b0569f90f8fd2995b34d368672ccaef4ec689a4e` (documentation commit follows) |
| Latest site main / production read-only | `main` @ `21119c711beda86de3f7766b18bdb0e1c39028d0`; production deployment `dpl_3KxxhG8pRxuy64rN4D1Jn9jzgPHy` READY at same SHA. No writes to either. |
| Frozen site layout contract | `app/page.tsx` blob `92ca9b508378fd462ae3cf8a1458d2d4467aeb56` and `app/canvas-fullscreen-v1.css` blob `7dcaf744a7c969d133452933c168806cb62f4361` match preview/game branch; `app/page.tsx` also matches main. Main vs frozen preview has site differences in `CanvasSecondaryApp.tsx` and CSS: do not merge full branch into site. |
| Other shift handoff read | [Bot B 13:30 lunar research](2026-10-27-lunar-research.md) and inherited [Bot A 13:00 cached Today collision](../SHIFT_LOG.md). Bot B owns scene ambience; Bot A owns shared physics. |
| Changed paths, runtime | `app/components/gamePhysics.ts` (+48 lines, pure helper); `app/components/SharedGameLobby.tsx` (+11/−2 lines, only import and vertical resolution block) |
| Changed paths, test/docs | `scripts/game-swept-vertical-smoke.mjs` (new), `docs/game-dev/shifts/2026-10-27-swept-vertical-flight.md` (this note), `docs/game-dev/SHIFT_LOG.md` (summary) |
| Forbidden paths | **No changes** to `app/page.tsx`, CSS, profile, feed, navigation, Quran, GoLive, LiveKit, Supabase, other world modules, site layouts, dependencies, `main` or production. |

## Before → after (implemented and limited)

**Before:** `resolveVerticalGameMovement` tested only the avatar's **destination X/Z** for a crossing of a rooftop or raised underside. A fast diagonal flight could pass *over a narrow solid roof in the middle of the frame* and finish beyond it; the endpoint-only test would miss the impact. The separate horizontal resolver already used bounded substeps and a spatial index, but could not catch this vertical crossing.

**After:**
1. `gamePhysics.ts` adds pure `resolveSweptVerticalGameMovement(startFeetY,endFeetY,startX,startZ,endX,endZ,colliders)`. It analytically computes the X/Z position at each candidate roof/underside altitude crossing, checks the existing avatar radius against that structure, chooses the first roof/underside encountered, and returns **impact X/Z as well as Y**. It accepts the same array or spatial-index collider sources used in Jurassic, Future, Today, Moses, Roman and prophetic worlds; visual LOD never removes solids.
2. `SharedGameLobby.tsx` keeps the original endpoint vertical check first. **Only when it finds no hit and the avatar has moved horizontally**, it tries the new swept fallback. On a swept hit it stops at the impact X/Z, preventing a ghost landing at a distant endpoint. Existing landing/crash/flight state transitions, roof selection, high-altitude flight, ground gravity, controls, portals and animations remain in place.
3. Dedicated smoke tests exercise missed intermediate roof hits, overhead bridge hits, correct impact coordinates, high-altitude flight, false-positive avoidance, highest-roof priority, stationary path behavior, 100 spatial-index/array parity cases, and lobby wiring.

**Not implemented by this shift:** full continuous 3D sidewall collision while descending into a structure; geometry for every small prop; high-speed ship/plane/EVA/lunar collision (those modes deliberately keep their dedicated physics); new animations, store, mosques or NPCs. The fallback does not replace the existing endpoint collision resolver.

## Verification and performance

| Check | Actual result |
| --- | --- |
| Sandbox source checkout | **PASS** at exact SHA `b0569f9`, Vercel sandbox `game-a-swept-vertical-20261027-1400` |
| `node scripts/game-swept-vertical-smoke.mjs` | **PASS:** 10 collision cases + 100 indexed parity cases + 2 lobby wiring checks |
| `node scripts/game-physics-smoke.mjs` | **PASS:** 23 legacy assertions + 288 indexed parity + 4 index edge cases |
| `node scripts/game-flight-pose-smoke.mjs` | **PASS:** 16 deterministic pose assertions |
| `node scripts/game-today-collision-smoke.mjs` | **PASS:** 192 parity, live damage/repair, static/prop/historical counts |
| `node scripts/game-moses-smoke.mjs`, `game-roman-smoke.mjs`, `game-lunar-research-smoke.mjs` | **PASS:** all three executed, including Roman's 17 static checks and lunar LOD budget |
| `tsc --strict --noEmit --target es2022 --module commonjs --skipLibCheck app/components/gamePhysics.ts` | **PASS** in sandbox with temporary TypeScript 5.9.3, no repository dependency changes |
| GitHub diff vs Bot B source | **PASS:** exactly three game-only paths before docs; +115/−2 lines total |
| Next.js non-production preview | Vercel deployment `dpl_Dm3hvRbQ6jT3TdHF6fD5oUguS3AE` at `b0569f9`, [preview](https://1muslim-7s4y8tdso-elmiandco.vercel.app). **Build state must be checked before claiming READY**. |
| Real iOS/Android gameplay, FPS and networked avatar movement | **NOT TESTED**. No mobile performance claims. |

The helper queries the swept X/Z broadphase only when the cheap destination check found no hit and horizontal movement occurred. In worst cases a very long diagonal flight crosses more spatial-index cells; no measured mobile frame-time data yet. Sandbox installed TypeScript in `/tmp/game-a-ts` and linked it in an untracked sandbox-only `node_modules`; GitHub lockfiles and dependencies unchanged.

## Per-world progress and preserved contracts

| World / mode | Evidence and this shift |
| --- | --- |
| **Today / Belt Boyz / satellite districts** | Preserves 251 cached static solids, 80 destructible props, roofless Belt Boyz office/meeting controls and portals; swept vertical fallback now available. No visual change; device verify office still roofless. |
| **Jurassic** | Preserves 1,439+ indexed tree/rock/cave solids, Apex cave and dinosaurs. New fallback can catch diagonal roof/cave lintel crossings; B's separate fern/dragonfly patch remains unmerged. |
| **Future / RealMecca concept** | Preserves 64 towers, skyways/supports and distance-based rendering. New fallback covers diagonal overhead skyway/roof crossings. B's separate gardens patch not merged. |
| **Moses / Parted Sea** | Preserves 2,743m crossing, water walls, refuge/solids, shoals and NPCs. Fallback uses existing collider array; no scene changes. |
| **Roman Judea / Jerusalem / Jesus era** | Preserves restored scene, Rome portal, olive groves and indexed solids. B's separate market-life branch remains unmerged. |
| **Muhammad ﷺ era / Makkah / Madinah / Masjid an-Nabawi** | Preserves 122 isolated prophetic-era solids and existing Nabawi prayer controls; no sacred-area weapons behavior changed. Hajj seven tawaf laps → Safa/Marwa and prayer congregations still planned, not implemented here. |
| **Moon / Space / ship / EVA** | Preserves Bot B's four solar arrays, eight beacons and two decorative rovers plus ship/lunar physics. Swept fallback intentionally bypasses ship, aircraft, EVA and lunar movement; no claim that decorative rovers are solid. |
| **Other worlds / districts** | No replacements; existing selector, Nile Quarter, Courtyard City, Skyline, Beach, Grand Metro and world transitions retained. Distinct Blessed Chambers module unverified. |

## Selective integration, rollback and next handoff

- **Never merge this entire game branch into main/production.** At integration time re-fetch then-current site branch and compare app/page, CanvasSecondaryApp, CSS, profile/feed/Quran/GoLive. Cherry-pick only `a808789` (physics helper) and carefully transplant the **small vertical collision block** from `a9e43e4` into the then-current `SharedGameLobby.tsx`; do not replace the whole file. Include `b0569f9` test optionally. Resolve collisions against newer B game work by reapplying the import and block, not copying stale scene code.
- **Rollback:** remove the swept helper import and fallback block (restore `const vertical=resolveVerticalGameMovement(...)`), then optionally delete unused helper and smoke test; the old endpoint solver remains intact. No schema or external dependencies.
- **Bot B handoff:** Latest lunar ambience is inherited, not overwritten. Bot B can continue in `LunarResearchScene.ts` or a dedicated new world module; do not replace shared lobby or physics. Roman market `f66c6a7`, Jurassic ecology `e05ef735`, Future gardens `afe199c` remain separate.
- **Bot A next:** inspect and reproduce 3D side-entry collisions on diagonal descents; audit roof-floor snap near edges; real-device FPS, high-speed boosts and landing; consider inexpensive dynamic collider for moving lunar rovers without touching Bot B's renderer. Keep collision broadphase independent of visual LOD.
- **Longer backlog (not completed):** richer XP shop, blaster aim/sounds, visible shield, persistent raised hand, spatial voice speaker indicators, Hajj/prayer NPCs and 10 enterable high-ceiling themed mosques. These need separate verified slices.

**References:** [Prior Bot B lunar shift](2026-10-27-lunar-research.md) · [Persistent cross-shift log](../SHIFT_LOG.md) · [Game coordination issue #126](https://github.com/ElmiandCo/1Muslim/issues/126).
