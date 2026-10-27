# Bot B / Living Worlds — Hajj pilgrim route animation (2026-10-27, 14:30–14:40 CDT)

> **Game-only, non-production development.** This is a respectful *interpretive* game scene, not a precise reconstruction of a historical Hajj, a ritual tutorial, or a depiction of any prophet. All NPCs are faceless.

## Provenance and no-regression gate

| Item | Verified evidence |
| --- | --- |
| Protected site baseline | `fix/profile-scroll-match-umma-20261027` @ `c856491131bb0c8056693652f8e5e58a26836831` |
| Actual latest game-code starting point | Bot A `game/world-engine-swept-vertical-20261027-1400` @ `46210b09ae1ac8ce57081939d105325475c22889` (descendant of protected preview) |
| Dedicated Bot B branch | `game/living-worlds-hajj-pilgrims-20261027-1430` |
| Current main / latest production, read-only | `main` @ `d10a5f91fa83a0a3745118c3ed2183c33be6fa74`; production Vercel `dpl_AYFy68LgFmbWSck689TcusAceSNL` READY at same SHA |
| Other shift reviewed | Bot A [14:00 swept vertical collision](2026-10-27-swept-vertical-flight.md) and Bot B [13:30 lunar research](2026-10-27-lunar-research.md), plus `docs/game-dev/SHIFT_LOG.md` |
| Site layout contract | `app/page.tsx` identical on main and protected baseline (blob `92ca9b5`); `SharedGameLobby.module.css` identical (blob `952bdfc`); `CanvasSecondaryApp.tsx` differs between site main and frozen preview. No site/layout files copied or edited |
| Implementation commits | `9fdf8f36` (new Hajj module); `06019dfb` (targeted shared-game renderer calls) |
| Test-script commit | `240ae375` (reproducible actual-TypeScript smoke test) |
| Runtime paths changed | **New** `app/components/HajjPilgrimScene.ts`; **7 inserted lines** in `app/components/SharedGameLobby.tsx` (one import, 2 render calls, interpretive historical footpath and comments) |
| Test / docs paths changed | **New** `scripts/game-hajj-pilgrims-smoke.mjs`; `docs/game-dev/shifts/2026-10-27-hajj-pilgrims.md`; `docs/game-dev/SHIFT_LOG.md` |
| Forbidden paths | No edits to `main`, production, site pages, navigation, feed, profile, Qur'an, GoLive, CSS, Supabase, other world modules, Bot A physics or collision helpers |

## Before → after: implemented

**Before:** Both the historical Makkah scene and the existing Today sanctuary had static Kaaba-inspired structures. The Today sanctuary already had a Safa–Marwa-inspired gallery. Neither scene had NPCs performing a full seven-circuit tawaf followed by seven traversals between Safa and Marwa.

**After:**

1. New pure `hajjRouteLengths(layout)` and `hajjPilgrimState(nowMs,index,layout)` calculate **seven full circular circuits** around the existing Kaaba (radius 17), a continuous walk to the Safa start, and **seven alternating Safa↔Marwa lengths** (starting Safa, finishing Marwa). Each phase reports completed circuit/traversal counts. The state fades out after completing the journey before recycling; there is no visible instantaneous teleport.
2. `renderHajjPilgrims(draw,nowMs,playerX,playerZ,layout)` draws **12 staggered, faceless, white-clothed walkers**, subtle gait/bob, shadow, diverse skin tones, no facial features or prophet likenesses. One NPC uses at most 7 small cube draws; nearby upper bound **84 additional draw calls**. Distance culling is 115 units; distant NPCs draw nothing.
3. `HISTORICAL_HAJJ_LAYOUT` uses the existing historical Kaaba at (0,0), with a simple unobstructed sandstone wayfinding footpath in the x=40 alley, outside the historical solid building footprints. **No modern roofed Sa'i gallery** was transplanted into the historical scene.
4. `TODAY_HAJJ_LAYOUT` uses the already-rendered sanctuary Kaaba at (0,184) and its existing x=57 Safa–Marwa gallery. The NPCs walk within the gallery, not through the arcade pillars.
5. Only the historical and Today scene render branches call the helper. All existing Jurassic, Future, Moses, Roman/Jerusalem, lunar/space, Makkah/Madinah/Nabawi, and Belt Boyz code paths are preserved. No game engine or collider modifications.

**Limitations:** These NPCs are **render-only, not network-synchronized and not collidable**; the path is an approximate scaled game layout. This does **not** simulate a real-world Hajj pilgrimage in full, and does not add congregational prayer, the requested ten mosques, XP shop, blaster improvements, shield, voice indicator or persistent raised-hand animation. The historic route's visual ground marker is decorative. The player's existing collision and movement remain authoritative.

## Verification / performance

| Check | Result |
| --- | --- |
| GitHub diff vs exact Bot A starting commit | **PASS** before docs: only new Hajj module, targeted `SharedGameLobby.tsx` +7/−0, and new game smoke script |
| Source inspection / render anchors | **PASS**: historical and Today calls each inserted exactly once; no other world renderer removed |
| `node scripts/game-hajj-pilgrims-smoke.mjs` | **Committed, not yet executed** in a full repository checkout; checks seven lap boundaries, seven sa'i trip boundaries, finishing at Marwa, historical building clearance, finite geometry, draw budget, animation, LOD and preservation |
| Next.js/Vercel preview build | **Pending result** for `240ae375` at `dpl_7zGkQSf5jbwZTNPLFHrMiRV5YA6S`; update this record after verification |
| Physical mobile FPS and NPC visual route | **Not measured**. Must play-test on iPhone and desktop near Kaaba, corridor pillars, historical alleys, and world switches |

## World-by-world progress and coordination

| World | Status in this shift | Follow-up |
| --- | --- | --- |
| Muhammad ﷺ era / historical Makkah–Madinah | **Changed:** faceless seven-tawaf→seven-sa'i NPCs and low-profile route marker; historical buildings, camel silhouettes and Nabawi prayer controls unchanged | Visual-check historic alley clearance; respectful congregation movement later |
| Today / existing Haram-inspired sanctuary | **Changed:** same NPC journey through existing gallery; no architecture replacement | Verify NPCs don't clip pillars; profile 84-call near cap on iPhone |
| Today / Belt Boyz / satellite districts | **Preserved:** office, meeting controls, roof and all city geometry unchanged | Validate roofless Council in eventual site integration |
| Jurassic | **Preserved:** dinosaurs/Apex; B riverbank ecology remains separate `e05ef735` | Review selective integration of fern/dragonfly additions |
| Futuristic / RealMecca | **Preserved:** towers/skyways; B garden branch `afe199c` separate | Merge only reviewed game file, test collision clearances |
| Moses / Parted Sea | **Preserved:** playable crossing, fish and soldier behavior | Mobile collision, fish render profiling |
| Jesus era / Roman Judea–Rome | **Preserved:** Jerusalem/Rome portals and base scene; B market-life branch `f66c6a7` separate | Check Roman market detail integration, mobile FPS |
| Moon / Space / Blessed Chambers | **Preserved:** Bot B lunar arrays, lights, rovers and ship physics; distinct Blessed Chambers module not verified | Rover/lander overlaps and mobile FPS |
| Other districts | **Preserved** Nile Quarter, Courtyard City, Skyline City, Beach City, Grand Metro | Per-district ambient life and LOD |

## Integration / rollback and next shift

- **Never merge this whole branch into the website.** On the then-current site integration head, inspect `main`/production and site layout first; selectively cherry-pick game-only commits `9fdf8f36` and `06019dfb` or transplant the new module plus 1 import/2 calls if `SharedGameLobby.tsx` has drifted. Do not overwrite newer Bot A flight, LOD, collision or site UI.
- If the shared-game file conflicts, retain the **newest** Bot A physics and renderer, add only `renderHajjPilgrims` import and calls inside the two existing Kaaba branches; ensure no new import of stale app pages.
- **Rollback:** remove the 3 inserted import/call statements, the historical ground marker, and the standalone Hajj module; all existing scene geometry and physics remain unchanged.
- **Next Bot B shift:** device-test Hajj animation and gallery clearance; add a small, respectful prayer congregation slice in the historical Nabawi area (not an invented depiction of the Prophet), or a standalone high-ceiling mosque model after verifying existing buildings and Bot A colliders.
- **Next Bot A coordination:** Do not merge shared-game file wholesale from an older branch. New NPCs are visual-only; any dynamic collision or pathfinding should be Bot A-owned and must not cull solid geometry with render LOD.
- **No production merge or deployment was performed.** Any production integration requires explicit user approval.
