# Keemy's Adventure World — Game-only shift log

> **Protected integration rule:** This repository's website evolves independently. Never merge a whole game branch into main or production. Cherry-pick only reviewed game-path commits onto the *then-current* website integration branch. Preserve the newer feed, profile, Quran, navigation, GoLive, and site CSS. No automated production merge/deploy.

## 2026-10-27 · 08:30 CDT (America/Chicago) · Bot B / Living Worlds — Future City bioluminescent gardens

### Identity, baselines, no-regression contract

| Field | Observed / action |
| --- | --- |
| Bot and responsibility | **Game Bot B — Living Worlds**; isolated Future / futuristic world garden details |
| Protected start | `fix/profile-scroll-match-umma-20261027` at **`c856491131bb0c8056693652f8e5e58a26836831`**; created fresh branch from this exact SHA |
| Current main inspected before editing | **`d9e9cc6052456e308a75a2ee67057ec9f146ca42`**; diverged from protected start (19 ahead / 1 behind); no main changes made |
| Current production inspected before editing | Vercel `1muslim` **READY**, production source `feature/animated-image-text-cards-20261027` at **`e3b38d088fe119a8b03a4d35e64c31ea625b25bf`**; no production changes made |
| Layout contract inspected | `app/components/CanvasSecondaryApp.tsx` and `app/components/SharedGameLobby.module.css` on protected baseline; **neither edited** |
| Bot A handoff inspected | `game/world-engine-flight-lod-20261027-0800` at implementation `e37c717270eaf707705b62fabea9203ea48c09c7`, with progressive Main Street render culling and flight changes **only in `SharedGameLobby.tsx`**; do not overwrite it |
| Bot B previous handoff | `game/living-worlds-jurassic-riverlife-20261027-0730` implementation `e05ef735086e0e01b84531f802c9117be1cc5f19`; Jurassic ecology is separate and **not** copied into this branch |
| Working branch | `game/living-worlds-future-gardens-20261027-0830` |
| Implementation commits | `0b4f9bb5ef57fbf138a6d06e955e838bf7439218` and palette/type fix **`afe199c2999d6651df29a6fa335ba9507042bad8`** |
| Exact changed paths | **`app/components/FutureCityScene.ts`** (implementation) and **`docs/game-dev/SHIFT_LOG.md`** (handoff, this commit) |
| Explicitly untouched | `SharedGameLobby.tsx`, Jurassic scene, Belt Boyz Council, Masjid an-Nabawi, world picker/portals, physics, shop, voice, all site pages/nav/feed/profile/Quran/GoLive/CSS, main and production |

### Implemented this shift — Future City plaza ecology (not a proposal)

**Before:** `renderFutureWorld` already rendered a 64-tower futuristic city, central arrival plaza, 12 moving hover vehicles, 18 service robots/citizens, 10 drones, skyways and exit portal, but no planted garden pockets.

**After:** Added six luminous garden pockets around the existing central plaza, each with seven deterministic animated low-poly flower blooms, reflective ground-level water/glass basins, and one orbiting pollinator drone visible when nearby. Existing geometry, skyways, citizens, traffic, portal and collisions are preserved.

- **`FUTURE_GARDEN_SITES` / `FUTURE_GARDEN_BLOOMS`:** stable precomputed placement; sites at (±72,0), (±122,0), (0,72) and (0,112). Six sites × seven flowers = **42 blooms**, plus up to **6 decorative pollinators**.
- **`FUTURE_GARDEN_PALETTE` / `FUTURE_GARDEN_PETAL`:** module-scope mutable `number[]` color arrays compatible with the existing WebGL draw callback, avoiding new per-frame palette arrays.
- **`renderFutureGardens`:** distance-based draw guard at 150 units; mid-range flowers have a stem + bloom, near gardens add moving pollinators, and within 55 units each flower gains four individual petals. Small sways and pollinator orbits use existing `now`; no timers, assets, imports, new dependencies or React state.
- **`renderFutureWorld`:** one new helper call after the central plaza beacons, before existing towers; world portal coordinates and shared physics untouched.
- **Collision/safety:** basin height is 0.06 units, intentionally ground-level and non-blocking; blooms and pollinators are purely decorative, **not collidable**. No claims of solid props or physics changes.

### Verification / performance evidence

| Check | Result |
| --- | --- |
| Static wiring/source inspection | **PASS**: one call to `renderFutureGardens`; `FUTURE_TOWERS`, `FUTURE_SKYWAYS`, citizen loop, and `FUTURE_PORTAL` still present |
| Garden spatial clearance calculation | **PASS (model)**: minimum 27.4 units from nearest tower footprint, nearest garden 104.7 units from exit portal, at least 20 units from nearest skyway centerline; max bloom offset about 5 units |
| Draw budget smoke model | **PASS (model)**: 105 extra cube draw calls at spawn (0,0), 142 at (72,0), max **158** on a sampled 8-unit grid across Future bounds; no per-frame garden list generation. Not actual GPU profiling |
| TypeScript / Next.js build | **PASS**: automatic non-production Vercel preview for corrected implementation `afe199c` became **READY** at `https://1muslim-7tcku0ivm-elmiandco.vercel.app`; logs show compiled successfully in 9.3s, lint/type-validity phase, 101/101 static pages and completed output deployment. Earlier pre-fix commit `0b4f9bb` failed; corrected mutable palette commit passed. Warnings about webpack cache serialization and edge runtime were non-fatal |
| Mobile / gameplay / FPS | **NOT VERIFIED**: iPhone and desktop playtest needed, especially lighting and draw-call overhead |
| Integration scope | Implementation changes **only `FutureCityScene.ts`**; no shared lobby or site layout changes; final diff check below |

### World-by-world progress checklist (preserve and extend)

| World / mode | Evidence and current Bot B status | Next action |
| --- | --- | --- |
| **Future / futuristic / RealMecca concept** | **IMPLEMENTED THIS SHIFT:** six gardens, 42 luminous blooms, 6 near-only pollinators; retains towers, skyways, traffic, robots, portal | Device lighting/FPS check; optional more architectural materials without modifying colliders |
| **Jurassic** | Prior Bot B shift added 180 ferns + 28 dragonflies on separate branch; **not integrated here** | Keep ecology diff isolated; device FPS/cave test; coordinate with Bot A |
| **Time of Moses / Parted Sea** | Baseline world picker says **Preview pending**; no wired playable scene verified; user has prioritized recovering existing Moses world | Search all newer game branches/assets for existing Parted Sea before adding or wiring; do not claim world is connected |
| **Time of Muhammad ﷺ / Makkah–Madinah** | Existing interpretive environment, Kaaba, Madinah, Nabawi prayer controls; unchanged | Respectful seven-circuit tawaf→Safa–Marwa animation and praying congregations, with no invented historical certainty |
| **Time of Jesus / Jerusalem–Roman Judea** | Picker says Preview pending; no connected scene verified | Recover any newer existing module before creating new content |
| **Today / Main Street / districts** | Bot A's independent branch adds LOD and flight; Belt Boyz Council and XP shop unchanged here | Preserve latest roofless office; device test; store and shield work later |
| **Space / Moon / Blessed Chambers** | Existing ship, moon, EVA and observatory preserved; no separate Blessed Chambers module verified | Inspect independent assets; lunar atmosphere and movement detail without physics regressions |
| **Other districts** | Nile Quarter, Courtyard City, Skyline City, Beach City, Grand Metro unchanged | Distinct living-world vegetation and NPC activity in future isolated shifts |

### Known issues, integration and next-shift handoff

1. **No production merge/deploy**. Automatic Vercel preview for the corrected code passed, but real device FPS, interactions and lighting are not yet measured.
2. **Bot A coordination:** A owns shared flight, collision, and Main Street LOD in `SharedGameLobby.tsx`. B only touched `FutureCityScene.ts`; integration should retain A's newer shared-game logic, not copy this branch's older lobby.
3. **Cherry-pick only the implementation commits** `0b4f9bb` and `afe199c` (or apply their combined targeted diff to `FutureCityScene.ts`) onto a *new* branch from the then-current site integration head. Review `git diff --name-only`: game-only Future scene path; do not merge this branch wholesale. If another bot has edited Future City, manually reconcile the garden constants/helper/one call. Preserve site layout and newer game physics.
4. **Rollback:** revert the two implementation commits on the integration branch or remove only `FUTURE_GARDEN_*`, `renderFutureGardens`, and the one call; never revert surrounding Future City or site code.
5. **Next Bot B shift:** locate the existing Moses / Parted Sea assets and scene in game branches (especially newer branches); recover rather than recreate. If no scene is found, stage an isolated era-appropriate `MosesScene.ts` module with a separate minimal integration patch proposal, preserving all other portals. Do not assert historic details beyond scriptural interpretation.
6. **Longer backlog (not implemented here):** XP-authoritative shop, stronger aimed blasters with sound, visible shield, persistent hand pose, voice speaker indicators, congregational prayer, Hajj path animation, ten large enterable mosques, and per-world fauna/ambience.

**Cross references:** [Bot A implementation](https://github.com/ElmiandCo/1Muslim/commit/e37c717270eaf707705b62fabea9203ea48c09c7) · [prior Bot B Jurassic implementation](https://github.com/ElmiandCo/1Muslim/commit/e05ef735086e0e01b84531f802c9117be1cc5f19) · [Game master issue #126](https://github.com/ElmiandCo/1Muslim/issues/126).

## 2026-10-27 · 07:26–07:35 CDT (America/Chicago) · Bot B / Living Worlds

### Identity and provenance

| Item | Evidence |
| --- | --- |
| Owner / focus | **Game Bot B — Living Worlds**; Jurassic riverbank ecology and mobile-friendly near/far detail |
| Protected starting baseline | `fix/profile-scroll-match-umma-20261027` at **`c856491131bb0c8056693652f8e5e58a26836831`** |
| Observed main head before editing | **`d9e9cc6052456e308a75a2ee67057ec9f146ca42`** (read-only); main vs baseline diverged (baseline 19 ahead, 1 behind), including non-game site changes |
| Working branch | `game/living-worlds-jurassic-riverlife-20261027-0730` |
| Implementation commit | **`e05ef735086e0e01b84531f802c9117be1cc5f19`**; later documentation-only commit is the branch tip |
| Other-shift handoff inspected | [Game master brief #126](https://github.com/ElmiandCo/1Muslim/issues/126), no comments at inspection; [older Future City handoff](../future-world-handoff.md). No current Bot A commit/shift note found on this baseline. |
| Changes | `app/components/JurassicScene.ts` (game logic only); `docs/game-dev/SHIFT_LOG.md` (this log only) |
| Forbidden paths touched | **None**: no main, production, feed, profile, Qur'an, GoLive, navigation, shared app CSS, assets or game lobby wiring changed |

### Implemented this shift (not just planned)

**Jurassic — animated riverbank ecosystem** built on the existing `JurassicScene.ts`, `drawJurassic`, `jurassicTerrain`, and the shared renderer, without recreating any world:

- **Before:** Jurassic contained 650 trees, 130 rocks, 38 roaming dinosaurs, river ground cells, a cave/giant Apex, and collision checks; riverbanks had no small animated wildlife or fern understory.
- **After:** Added **180 deterministic riverbank fern placements** and **28 deterministic dragonfly placements**. `jurassicRiverFerns` excludes the giant cave's protected 155-unit radius; the new `jurassicDragonflies` fly and flutter above the sinuous river.
- **Functions and components:** `jurassicRiverZ` (river centerline), `jurassicRiverFerns` and `jurassicDragonflies` (stable placement), `drawJurassicRiverLife` (animated near/far rendering); `drawJurassic` calls the helper after existing trees and before existing rocks. No new imports, network requests, dependencies, textures, React state or assets.
- **LOD:** Skip ferns outside 130 units and insects outside 105 units. Each fern is 2 draw calls in the mid-distance or 7 nearby; each nearby dragonfly is 3 draw calls. Animations use the existing `now` clock. No GPU particle system or new allocation of world arrays per frame.
- **Physics:** Decorative plants/insects are intentionally non-solid, not player obstacles; `jurassicBlocked`, existing tree/rock collision, dinosaur behavior, Apex damage/respawn and portal entry/exit were left unchanged. Collision fidelity remains a separate Bot A engine responsibility.
- **Historical/nature framing:** Stylized fern-like prehistoric vegetation and dragonfly-like insects; not a claim of exact Jurassic species reconstruction.

### Verification and performance evidence

| Check | Result |
| --- | --- |
| Read and inspect current source | **PASS**: `SharedGameLobby.tsx`, `JurassicScene.ts`, `FutureCityScene.ts`, game CSS, Future City handoff and master issue inspected |
| Code presence / wiring | **PASS (static)**: new exported helper exists, called exactly once from `drawJurassic`; `jurassicBlocked` and Apex hit-count constants still present |
| Deterministic generation | **PASS (calculation)**: 180 ferns and 28 dragonflies; no cave-proximate ferns |
| Geometry budget | **PASS (calculation)**: 81 extra cube draw calls near spawn (0,0), 86 near (500,0), 0 near Apex cave (650,420); sampled 25×20-unit grid maximum **110 extra calls** along river |
| Branch diff gate | **PASS** after implementation: only `app/components/JurassicScene.ts` changed relative to protected baseline |
| TypeScript/full Next.js build | **PASS (automatic non-production Vercel CI)** for implementation commit `e05ef735`: Next.js compiled successfully in 13.8s, passed type-check/lint phase, generated routes, and completed build/output deployment; no local checkout was available |
| Preview/CI | **READY**: automatic non-production preview for implementation commit `e05ef735` at [1muslim-453engdjo-elmiandco.vercel.app](https://1muslim-453engdjo-elmiandco.vercel.app); build log confirms `Deployment completed`. No manual deployment, production promotion, or merge was requested/performed |
| iPhone FPS and interactions | **Not measured**; requires real mobile preview to confirm smoothness and visual polish |

### World-by-world progress checklist (this baseline, evidence-based)

| World / mode | Existing inspected implementation | Bot B shift status | Follow-up |
| --- | --- | --- | --- |
| **Jurassic** | `JurassicScene.ts` with dinosaurs, trees, river, giant cave/Apex, terrain/collision; selectable portal in `SharedGameLobby` | **Implemented** ferns + dragonflies with distance LOD; static checks pass; device check pending | Validate mobile frame time, cave visibility, then layered ambient calls and fauna interaction |
| **Future / futuristic (RealMecca concept)** | `FutureCityScene.ts` with 64 towers, skyways, vehicles/citizens; separate `app/future/*` prototype and historical handoff | **Inspected, unchanged** | Add futuristic gardens/robots and material variation without disrupting tower/skyway colliders |
| **Time of Muhammad ﷺ / Makkah–Madinah** | Enterable historical-*interpretive* scene embedded in `SharedGameLobby`, Kaaba, desert road, oasis, Madinah, camel shapes, Nabawi prayer controls | **Inspected, unchanged** | Respectful illustrative tawaf→sa'i NPC path; test no sacred-area blaster use; no invented historical certainty |
| **Today / shared main lobby** | Main Street shop, Belt Boyz Council/meeting controls, five satellite districts, traffic, birds, cats, moon/space vehicle entry | **Inspected, unchanged** | Verify current Belt Boyz roofless state visually before any geometry edit; future garden, shop and shield polish |
| **Space / Moon / Blessed Chambers concept** | Moon/ship/observatory/space geometry in shared game; no separately verified Blessed Chambers world module | **Inspected, unchanged** | Distinct lunar ambience and efficient settlement detail, preserve ship physics |
| **Time of Moses / Parted Sea** | World name in picker; picker explicitly reports **Preview pending**; no connected scene found in inspected baseline | **Not implemented** | Locate any newer game-only modules on Bot A branch before integration; never replace a newer Parted Sea scene |
| **Time of Jesus / Jerusalem–Roman Judea** | World name in picker; **Preview pending**; Jerusalem route in Muhammad-era scene is closed | **Not implemented** | Find newer module/portal if present, else stage historically interpretive environment as new isolated game module |
| **Other districts** | Nile Quarter, Courtyard City, Skyline City, Beach City, Grand Metro in `SharedGameLobby` | **Unchanged** | Per-district ambient identity, foliage, pedestrian routines and LOD |

### Known risks, coordination, and next shift

1. **Bot A coordination:** The new ecology lives only in `JurassicScene.ts`. Bot A should avoid replacing this file from an older copy when changing engine/LOD; integrate via the single implementation commit or a reviewed targeted patch. Bot A owns shared flight/altitude/collision/LOD; existing shared game code still has an altitude boundary reset and should be reviewed separately.
2. **Visual limitation:** Box-based WebGL renderer approximates fern fronds and translucent wings; device screenshots and real FPS are needed before calling it premium/final. Ambient audio was not added (no unverified autoplay or permission behavior).
3. **Game economy:** XP shop is session/demo based in inspected `SharedGameLobby.tsx`; do not imply server-authoritative purchases until Supabase/API integration is built.
4. **Meeting hand gesture:** The existing Council roster broadcasts raised-hand state, but the standalone gesture button uses a five-second emote timer. Persistent avatar pose is still TODO, ideally in a small shared-game-only patch after Bot A confirms animation ownership.
5. **Next Bot B atomic task:** Add an independently culled, era-appropriate Future City plaza garden/citizen detail **in `FutureCityScene.ts` only**, or, after checking Bot A's new commits, implement a tiny verified Council hand-pose fix without touching site UI.
6. **Priority backlog (not implemented this shift):** aim/sound/stronger blasters, visible collision-aware shield, speaker indicator and voice quality, XP-authoritative shop, 10 enterable high-ceiling mosques, seven-circuit tawaf then Safa–Marwa sa'i, congregational prayer, and remaining world coverage.

### Integration, conflict gate and rollback

**Do not merge this whole branch.** First fetch the then-current main/production/site integration head and inspect its changed paths. Only bring in implementation commit `e05ef735086e0e01b84531f802c9117be1cc5f19` (one game file) with a reviewed cherry-pick onto a fresh branch from the current website integration head. Confirm `git diff --name-only` contains only `app/components/JurassicScene.ts` before proposing integration; if Bot A also changed this file, manually transplant just the `jurassicRiver*`, `jurassicDragonflies`, `drawJurassicRiverLife` definitions and one call into Bot A's newer file. Do not overwrite their collision/LOD changes. Keep this Markdown log as reference, not a reason to merge stale app snapshots. Roll back this slice by reverting `e05ef735` on the integration branch (or removing the isolated definitions and call). **Await user approval for any production merge/deploy.**

**Prior context:** [2026-10-22 Future City handoff](../future-world-handoff.md) · [Game master issue #126](https://github.com/ElmiandCo/1Muslim/issues/126).


---

## 2026-10-27 · 07:56–08:04 CDT (America/Chicago) · Bot A / World Engine

### Starting point and non-regression gate

| Field | Recorded value |
| --- | --- |
| Shift | **Game Bot A — World Engine**, physics + distance-aware rendering only |
| Source branch / SHA | `fix/profile-scroll-match-umma-20261027` / `c856491131bb0c8056693652f8e5e58a26836831` |
| Read-only main head at inspection | `d9e9cc6052456e308a75a2ee67057ec9f146ca42` |
| Production/layout check | `main` and protected preview baseline **diverged** (19 preview commits ahead, 1 main commit behind). Changed site files include `app/components/CanvasSecondaryApp.tsx`, `GameLabProfileHub.tsx`, `ImmersiveVideoEntry.tsx`, `app/canvas-fullscreen-v1.css`, community API/migration. **None copied or edited.** Current frozen layout must remain authoritative on future integration. |
| Other shift reviewed | Bot B's 07:26–07:35 CDT entry above; game-only implementation `e05ef735086e0e01b84531f802c9117be1cc5f19` in `JurassicScene.ts` on `game/living-worlds-jurassic-riverlife-20261027-0730`. A deliberately did **not** modify that file. |
| Dedicated A branch | `game/world-engine-flight-lod-20261027-0800` |
| Implementation SHA | `e37c717270eaf707705b62fabea9203ea48c09c7` |
| Working branch SHA before this log commit | `e37c717270eaf707705b62fabea9203ea48c09c7`; the **log commit** becomes the branch tip |
| Changed paths | **Only** `app/components/SharedGameLobby.tsx` (implementation) and `docs/game-dev/SHIFT_LOG.md` (handoff). No app page, layout, navigation, profile, feed, Quran, GoLive, site CSS, production branch or main edits. |

### Implemented and exact code behavior

**SharedGameLobby.tsx / existing WebGL `render(now)` game loop:**

1. **Uninterrupted high-altitude flying.** Previously, normal flight was clamped to 170 world units; after ~2 seconds near that ceiling, a full player-position reset/respawn occurred. Now the vertical flying integrator uses `Math.max(floor,p.y+velocity*dt)` with no upper-altitude clamp. Removed the height-triggered respawn, timer state, red countdown overlay and warning. **Not** a new space world or ship physics change; ship/EVA/plane/moon modes keep their existing distinct logic.
2. **Safer non-flying falls and landing pose.** Previously, normal gravity had no terminal fall speed and ground contact zeroed velocity without triggering the landing pose. Now non-flying gravity is capped at **-35 units/s** and crossing the computed floor updates `flightPose.current.landing`; impacts faster than **11 units/s** trigger the existing crash/crouch visual. Existing flight takeoff, flight descent and moon/EVA rules remain.
3. **Today/Main Street progressive geometry visibility.** Previously, the shop, all 58 road tiles, 25 mountain-row pairs, 9 tunnel segments, 46 satellite buildings, all building window bands and 75 trees were drawn even when the player was far away. Now inexpensive X/Z-distance tests skip distant draws: shop within 480; road/tunnel within 460 Z and 360 X; mountains within 500; buildings within 450; trees within 320. Building base/roof remain visible in mid-range; window-band detail is rendered only within **180** X/Z units. These are **render-only** guards; the existing collision-volume construction and damage logic were not modified.
4. **World compatibility.** The new flight and landing logic is shared where the ordinary player movement path is used. Jurassic terrain floors, Future skyway floors and prophetic-era floor selection are still computed through their existing modules/conditions. Separate ship, plane, EVA and lunar paths are untouched. No changes to Belt Boyz meeting roof geometry, Masjid an-Nabawi, blasters, shop purchase rules, NPCs, or portals.

### Verification and limits

| Check | Result |
| --- | --- |
| GitHub diff and path gate | **PASS**: comparison against protected baseline shows one implementation path, `app/components/SharedGameLobby.tsx`, 11 additions / 11 deletions. No other app files changed. |
| Source assertions | **PASS (static)**: no `spaceEdgeSince`, `spaceEdgeWarning`, 170-unit clamp, or punitive respawn string; terminal fall and landing pose are present; Jurassic/Future/prophetic entry points remain. |
| Flight numerical smoke simulation | **PASS (model only)**: from altitude 169, 20s of simulated held ascend reaches ~379 with no forced reset; simulated unpowered fall lands with max downward speed 35. This is a calculation of the edited formulas, **not** an in-browser game test. |
| Rendering count smoke test | **PASS (model only)**: at spawn (0,0), selected distant road/mountain/building/tree sets draw 0 items; at (0,-700) nearby sets remain (34 road, 36 mountain, 46 building, 75 tree objects); far district (-1260,-170) draws none of those Main Street sets. Not a measured GPU draw-call total. |
| Build / typecheck | **PASS for automatic non-production Vercel preview build** at branch tip `b8d2c51`: `npm run build` / Next.js 15.5.26 completed and deployment became **READY** with successful GitHub Vercel status. Compiler emitted **warnings** (webpack CSS cache serialization), not a failing build. No separate local `tsc` or device test; build log did not explicitly confirm an independent typecheck phase. [Build details](https://vercel.com/elmiandco/1muslim/6JfnwzauJqaENaMFkvZWCRTgnZLT). |
| Device / playtest / FPS | **NOT VERIFIED**: requires real mobile and desktop testing, including terrain silhouettes at draw-distance boundaries, high-altitude return and falls onto roofs. Automatic Vercel non-production preview exists at [1muslim-en8ayedtd-elmiandco.vercel.app](https://1muslim-en8ayedtd-elmiandco.vercel.app); this was **not** promoted to production. |
| Physics completeness | **PARTIAL**: ordinary collision volumes remain as-is; this shift did not add colliders to every rendered building/object or fix tunneling at high horizontal speed. |

### Per-world handoff matrix

| World | This shift | Next validation |
| --- | --- | --- |
| Today / Main Street / satellite districts | **Changed** distant drawing and ordinary flight/fall integration; collision data unchanged | Mobile FPS and near/far pop-in; shop and road visibility; test bridge fall and collision |
| Jurassic | **Preserved** existing dinosaur/terrain/cave module; **Bot B riverbank life lives only on B's branch** | Merge **only** Bot B's `JurassicScene.ts` game diff after reviewing both branches; test high-altitude landings on Jurassic terrain |
| Future / futuristic / RealMecca concept | **Preserved** existing `FutureCityScene.ts` tower, skyway and portal logic | Test tall tower roof landings and skyway floors; Bot B may add future plaza gardens independently |
| Time of Muhammad ﷺ / Makkah–Madinah | **Preserved** interpretive Kaaba scene and Masjid an-Nabawi prayer behavior | Validate sacred-area no-blaster rule, collision and historical sensitivity |
| Moses / Parted Sea | **No scene added or overwritten**. Protected baseline picker still labels this **preview pending**; other branches may hold newer content | Locate any newer Moses world module before wiring; no wholesale branch replacement |
| Jesus / Roman Judea | **No scene added or overwritten**; baseline picker indicates preview pending | Locate existing separate work before planning connection |
| Space / Moon / ship / EVA | **Unchanged dedicated physics**; no new ship behavior | Check shared camera at high altitude and EVA transition, retain current ship routes |
| Belt Boyz / Council | **Unchanged** meeting geometry and interaction | Visually confirm roofless/open office in the intended integration branch before cherry-pick |

### Dependencies, integration and rollback

- **Dependencies:** none added. `SharedGameLobby.tsx` remains the only modified game implementation file; the Jurassic and Future scene imports remain unchanged.
- **Cross-shift conflict avoidance:** Bot B's implementation is in `app/components/JurassicScene.ts`; A's is in `SharedGameLobby.tsx`. Keep these separate. A's branch is based on the protected preview SHA, **not** on B's branch; the B river-life commit is **not** included here.
- **Integration rule:** obtain fresh `main` / production / site integration SHAs **at integration time**, compare frozen layout and newest site changes, and create a fresh integration branch from the newest site head. Cherry-pick **only** A's implementation commit `e37c717270eaf707705b62fabea9203ea48c09c7` and B's `e05ef735086e0e01b84531f802c9117be1cc5f19` if desired; inspect file-level diff. If `SharedGameLobby.tsx` has since changed, transplant only the vertical flight/fall and selected render-culling hunks rather than replacing the full file. Do not cherry-pick documentation commits as app behavior.
- **Rollback:** revert A's implementation commit on the future integration branch or undo only its flight/fall/culling hunks. Revert B's Jurassic implementation separately. Do not revert or overwrite site pages, navigation, CSS, profile, feed, Quran or GoLive.
- **No automatic production merge or deployment** performed or authorized.

### Next shift TODO (priority order)

1. Re-check main/preview heads, this A log and B log, and CI build status before editing; resolve site/game drift without touching non-game paths.
2. **Physics:** swept horizontal collision or substep tests to prevent fast-boost tunneling; audit solids against actually rendered geometry (especially enterable buildings, roofless Council, Future towers, Jurassic cave and historical structures).
3. **Rendering:** instrument actual draw calls / mobile FPS; expand conservative distance LOD to dynamic NPCs and districts with hysteresis to reduce pop-in; avoid changing world geometry colliders when only rendering.
4. **Flight animation:** add true directional pitch/up/down poses for local and remote avatars, smoother takeoff/landing timing, and test toggling flight off from very high altitude.
5. Coordinate with Bot B on Future City garden details and Jurassic river-life integration; preserve independent modules. Remaining requested mosques, Hajj NPCs, hand persistence, shield, blaster reliability, voice indicators and XP store are **not implemented by this shift**.

**Cross-reference:** Bot B handoff above; [Game master brief #126](https://github.com/ElmiandCo/1Muslim/issues/126); [implementation diff](https://github.com/ElmiandCo/1Muslim/commit/e37c717270eaf707705b62fabea9203ea48c09c7).
