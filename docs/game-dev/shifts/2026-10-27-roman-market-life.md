# Bot B / Living Worlds — Roman market life (2026-10-27, 12:27–12:31 CDT, America/Chicago)

> **Game-only shift. No merge or deployment to production.** This note is a handoff, not a claim of browser/mobile playtesting.

## Provenance and no-regression audit

| Field | Exact record |
| --- | --- |
| Bot | Game Bot B — Living Worlds |
| Protected starting baseline (ancestor; read-only) | `fix/profile-scroll-match-umma-20261027` @ `c856491131bb0c8056693652f8e5e58a26836831` |
| Direct GAME source branch | `game/living-worlds-roman-judea-restored-20261027-1230` @ `42fc1208e664649399cc82106ffbf6c446d1e9a5` |
| Dedicated working branch | `game/living-worlds-roman-market-life-20261027-1227` |
| Implementation commit | `f66c6a753ae702c44027508520e8a17a80d94d79` |
| Test commits | `187d39655d02aa817c5fe855f7551c448f880fa5`, `dac8f97c07a4e53400076bf496b05ff37f728e0f` |
| Current main and Vercel production (read-only) | `main` @ `21119c711beda86de3f7766b18bdb0e1c39028d0`; latest observed production READY at that same SHA, not this branch |
| Layout contracts inspected | `app/page.tsx` blob `92ca9b5` and `SharedGameLobby.module.css` blob `952bdfc` identical on main/protected baseline; `CanvasSecondaryApp.tsx` differs (main `ac34d6b`, protected `4db1706`), **never copied or edited** |
| Prior shifts read | Bot B Roman restoration (12:10), Bot A directional flight (11:58), Moses recovery (10:34), and [game issue #126](https://github.com/ElmiandCo/1Muslim/issues/126) |
| Exact changed paths | `app/components/RomanJudeaScene.ts`, `scripts/game-roman-market-smoke.mjs` (new), `docs/game-dev/shifts/2026-10-27-roman-market-life.md` (this note), `docs/game-dev/SHIFT_LOG.md` (index entry) |
| Forbidden paths | **No changes** to main, production, shared physics, lobby, game CSS, site layout, feed, profile, Quran, GoLive, navigation, database or assets |

## Implemented in this shift (versus before)

**Before:** The connected Jerusalem/Rome scene had 16 static stalls, 34 roaming stylized travelers/soldiers and 36 distance-culled olive trees, but no market traders, wares or birds. The gold intercity portal, stone architecture, original city colliders, Moses, Future, Jurassic and Belt Boyz were already present in the inherited game.

**After:** Added an isolated `renderRomanMarketLife` helper called from the existing `renderRomanJudea` function, preserving the entire original scene verbatim apart from this addition and its call:

- **16 market traders**, stationed behind the existing counters with subtle waving/working-arm animation; no prophet depictions, combat or NPC network state.
- **16 pairs of gently fluttering cloth valances** added to the existing awnings; **pottery, woven baskets and colored produce** rest on existing stall counters. Jerusalem and Rome have distinct muted material palettes.
- **12 small animated street birds** circling above the central road; body and wings simplify at a distance.
- **Stable placements and independent render LOD:** valances only within 115 game units, detailed stalls/traders within 65, bird bodies within 95 and wing detail within 55; one additional basket detail within 32. Geometry uses the existing box renderer and `now` clock; no new textures, assets, downloads, dependencies, audio autoplay or React state.
- **Collision and physics unchanged:** all new geometry is decorative, not solid. Traders stand behind the pre-existing market colliders; wares are above existing counters; birds fly overhead. The old `solids` arrays, static indices, arch portal, spawn, city bounds, renderer, scene switching and Bot A movement/LOD remain intact.
- **Historical caution:** An interpretive, stylized ancient market rather than a claim of exact architecture, costumes, trade goods or wildlife at a specific date.

## Verification / limitations

| Check | Result |
| --- | --- |
| Direct branch compare against Roman restoration | **PASS**: 41 additive lines in `RomanJudeaScene.ts` plus new game-only smoke script; no unrelated code paths |
| Original source reconstruction | **PASS**: removing only the inserted helper and its one invocation reproduces the prior Roman scene **byte-for-byte** |
| Runtime helper checks (executed against function extracted from GitHub source) | **9/9 PASS**: both city palettes, deterministic animation, time-dependent motion, near/far culling, valid draw coordinates/RGB, birds above road, render call wiring and sampled geometry budget |
| Render submission budget (actual helper sampled at fixed positions/timestamp) | **93** extra decorative cube submissions near central market (0,0), sampled max **93** across a 3×7 market grid, **0** when far (600,600); these are sample counts, **not** measured device draw calls/FPS |
| Reproducible full-repository test | Added `node scripts/game-roman-market-smoke.mjs`, which transpiles the actual scene module and stubs only the collision-index builder to exercise the renderer, collision-clearance, animation and culling. **Not executed in a full checkout** this shift. Fixed initial test mistake (mistakenly treating RGB argument as a coordinate) in `dac8f97`. |
| Non-production preview build | Vercel deployment `dpl_E8UPoyouWqRPKrrEsRjpJMZhitDh` from test commit `187d396`: Next.js **compiled successfully in 12.6s**, entered type/lint validation, generated **101/101** pages; final READY status to be checked before claiming full deployment completion. Test-only correction `dac8f97` follows that build SHA. |
| Browser/mobile, voice, multiplayer and FPS | **Not tested**; verify actual Jerusalem/Rome visuals and touch movement on a real device. No performance guarantee from sampled box counts. |

## World-by-world progress and handoff

| World / mode | Status in this game branch | Next |
| --- | --- | --- |
| **Jerusalem / Roman Judea / Rome / Jesus-era** | **THIS SHIFT:** 16 animated markets/traders, pottery, distinct palettes and 12 culled birds added to the connected two-city world; old olive groves, architecture, portal and colliders retained | Real iPhone walkthrough, verify merchant placement and camera; ambient audio later with consent-safe controls |
| **Moses / Parted Sea** | Inherited connected 2,743m crossing, water walls, fish shoals, travelers/soldiers, 9 refuges, Bot A collision | Mobile traversal, far-shore arrival, water effects and audio |
| **Jurassic** | Inherited dinosaurs, cave/Apex and collision. Bot B fern/dragonfly ecology exists separately at `e05ef735` | Selectively integrate scene-only ecology, test FPS |
| **Future / RealMecca concept** | Inherited towers, skyways and collision. Bot B 6 gardens/42 flowers/6 pollinators exist separately at `afe199c` | Review targeted scene-only garden patch; lighting and device tests |
| **Muhammad ﷺ era / Makkah–Madinah** | Kaaba, interpretive historic environment, Masjid an-Nabawi and prayer controls preserved, unchanged | Respectful seven-circuit tawaf→Safa–Marwa, congregational prayer; avoid false historical certainty |
| **Today / Belt Boyz / districts** | Council roofless-office behavior, meetings, store, vehicles, Nile Quarter, Courtyard City, Skyline, Beach, Grand Metro preserved, unchanged | XP shop, visible shield, blaster aim/audio, hand hold and active speaker |
| **Space / Moon / Blessed Chambers** | Ship, Moon, observatory and EVA code preserved; separate Blessed Chambers module not independently verified | Next distinct world slice: efficient lunar lights, surface markers, observatory ambience; coordinate with Bot A on flight/LOD |

## Dependencies, integration and rollback

1. **No new runtime dependencies**. Only the existing `RomanJudeaScene.ts` scene renderer is changed; Bot A retains ownership of `gamePhysics.ts`, `gameWorldColliders.ts`, `gameFlightPose.ts` and shared flight/collision/LOD.
2. **Integration prerequisite:** The current site main may not yet contain Roman Judea. First integrate the **reviewed Roman scene module and minimal game-only lobby wiring** from `548218c` onto a fresh branch based on the *then-current* site. Do not merge the full 43-commit game ancestry or replace site pages. Then selectively apply **only** `f66c6a7` (Roman market helper and call), plus optional test commits. If the scene has evolved, transplant the helper and single invocation manually. Check the diff for game-only paths and preserve all newer site UI.
3. **Rollback:** Revert `f66c6a7` or remove the standalone `renderRomanMarketLife` helper, its palette constants and the one call. This leaves the original Roman scene and its colliders unchanged. The smoke script can be removed independently.
4. **Bot A coordination:** This shift does **not** touch shared physics or flight. Please avoid replacing `RomanJudeaScene.ts` with an older version when modifying world LOD; its independent render culling is visual only. Shared progressive LOD and flight motion remain Bot A-owned.
5. **Not implemented this shift:** server-backed XP purchases, aimed/sounding blasters, force field, persistent hand animation, voice/speaker indicators, Hajj NPCs, congregational prayer, 10 enterable mosques, new Space environment, or automatic production release. These are backlog, not accomplishments.

**Cross-references:** [Previous Roman restoration](../SHIFT_LOG.md) · [Bot A handoff in shift log](../SHIFT_LOG.md) · [Game coordination issue #126](https://github.com/ElmiandCo/1Muslim/issues/126).
