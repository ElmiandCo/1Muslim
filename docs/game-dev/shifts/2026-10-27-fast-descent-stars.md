# Bot A / World Engine — hold-to-descend flight and progressive star LOD
**2026-10-27 17:05–17:09 CDT (America/Chicago)** · game-only shift · **NO production merge or deployment**

## Baseline, branch provenance and coordination
- **Protected site preview ancestor:** `fix/profile-scroll-match-umma-20261027` @ `c856491131bb0c8056693652f8e5e58a26836831` (read-only).
- **Actual game starting point:** Bot B `game/living-worlds-egypt-docklife-20261027-1630` @ `7f03f67c8a2473458434ff72b1210364e211fd4c`, descendant of Bot A Egypt portal/collider branch `a40c755e`. This carries the Nile riverlife, six dock workers, wildlife, Moses↔Egypt portals, Hajj, Nabawi, swept collisions and all earlier game worlds.
- **Other shift handoff reviewed before edits:** [Bot B Egypt docklife](2026-10-27-egypt-docklife.md) and [Bot A Egypt portal/collision](2026-10-27-egypt-portal-colliders.md); coordination through [game issue #126](https://github.com/ElmiandCo/1Muslim/issues/126). Bot B retains ownership of Egypt NPCs/scenery; Bot A changes shared flight only.
- **Working branch:** `game/world-engine-fast-descent-20261027-1700`. Game implementation commits: `ca63dc9ffdb9d963fa657283735954d7262276a0` (pure helper), `0476bad22532908e7714241b391d02a3bb69198d` (game lobby wiring), `20ac366dd5402ea53818ebd32b577fa88f3a7517` (smoke). Final branch SHA advances with documentation only.
- **Main / production read-only:** `main` @ `82eddbf7a5a94fa5968550be2bd335a4aa46f823` at start. Compared `main` to protected preview: site/feed files `ImmersiveVideoEntry.tsx` and `PostDesignStudio.tsx` have diverged. **No changes** to `main`, production, protected preview, app pages, site navigation, profile/feed, Qur'an, GoLive or game CSS. Never merge this entire older-site-descended branch into the current website.

## Exact changed paths and before → after
| Path | Changes and exports |
| --- | --- |
| `app/components/gameFlightVertical.ts` (**new**) | Exports `nextGameFlightVerticalSpeed(input)` and `gameFlightStarBudget(atmosphere)`. Before: ordinary flight descent acceleration −19, max descent −22 world units/s; starfield always 270 cubes when visible. After: hold descend acceleration −65, terminal −55; with existing boost, −90 acceleration and terminal −80. Inputs are time-step bounded to 50ms. Stars appear progressively, 48–160 draws at altitude; 0 below atmospheric threshold. |
| `app/components/SharedGameLobby.tsx` (**targeted +9/−5 lines**) | Imports helper; adds a 54px **DOWN** hold button while ordinary flight, plane or EVA is active; pointer capture, cancel/lost-capture/blur release and keyboard accessibility. Dedicated `descendTouch` key does not interfere with keyboard `C` or canvas ascend gesture. Wires shared ordinary-avatar velocity helper, speeds plane descent from 10 to 22 units/s and strengthens EVA downward thrust (including high-altitude EVA). Replaces fixed 270-star loop with helper budget. Existing swept roof/side collisions, world selectors, Egypt/Moses portals, Hajj/Nabawi, Belt Boyz, ship and other world renderers retained. |
| `scripts/game-flight-descent-smoke.mjs` (**new**) | 25 deterministic assertions: 13 numeric speed/altitude/star tests and 12 source-wiring/preservation markers. Run with `node --experimental-strip-types scripts/game-flight-descent-smoke.mjs` on Node 22.16+ in a full repository checkout. |
| `docs/game-dev/shifts/2026-10-27-fast-descent-stars.md`, `docs/game-dev/SHIFT_LOG.md` | This detailed handoff and cumulative game-only index. |

## Implemented behavior (not just planned)
1. **Ordinary avatar flight:** Holding mobile DOWN or keyboard C accelerates descent substantially faster, including above the atmosphere, without a height-triggered teleport. Existing roof and side collision sweeps remain active. Boost makes the dive faster; max speed is bounded for collision sampling.
2. **Mobile control:** DOWN appears in the existing right-side game action stack only when flying, piloting or EVA; press-and-hold controls motion. The button releases on pointer up/cancel/lost capture, blur or keyboard release. It does not modify the website UI.
3. **Aircraft / EVA:** The same touch signal works for aircraft descent and EVA spacewalk. Aircraft keeps its pre-existing height limits. Ship launch, flight path and Moon landing remain unchanged.
4. **Atmosphere:** Existing sky-darkening and camera-relative stars are preserved; stars now fade in through a 48→160 cube LOD budget rather than 270 every high-altitude frame. The reduction at full atmosphere is 110 cubes (~40.7%) **by source count**, not a measured FPS improvement.

## Verification and limits
| Check | Result |
| --- | --- |
| Source ancestry | **PASS**: Bot B branch is 10 commits ahead of Bot A Egypt branch, 0 behind. New branch is 3 commits ahead of Bot B, 0 behind. |
| Game-only diff | **PASS**: precisely the two game component paths and one game smoke script before docs. No app page, site CSS, production or other world module edits. |
| Numeric helper execution | **PASS**: 13 actual Node 22.16 type-stripped assertions on locally mirrored helper; global TypeScript `tsc --noEmit --strict --target ES2022 --module ESNext` passed for the helper. |
| Source wiring / preservation | **PASS**: 12 connector-side checks against committed GitHub lobby source for touch down/up, shared helper, star LOD, Egypt collision, Moses/Hajj/Nabawi, swept vertical physics and Belt Boyz markers. These are static, not gameplay tests. |
| Full committed smoke | **NOT RUN** in a complete checkout (connector-only repository access). The smoke file is committed for the next full-checkout run. |
| Preview Next.js build | **PASS / READY** at implementation/test SHA `20ac366dd5402ea53818ebd32b577fa88f3a7517`: Vercel non-production deployment `dpl_551s2FYDbVKsrT58zYpRm912UYvr`, [preview](https://1muslim-r0jcyspcb-elmiandco.vercel.app). Logs: Next.js 15.5.26 compiled, type/lint checked, static output and serverless functions built; Build Completed in 40s. Existing CSS autoprefixer warnings. This is **not** a physical playtest. |
| Device physics / mobile FPS | **NOT VERIFIED**: test repeated fast diving onto rooftops/pyramids, touch capture when multitouch/panning, altitude stars and EVA/plane transitions on iPhone/Android. |

## Per-world status / no-regression matrix
| World | This shift | Next verification |
| --- | --- | --- |
| **Ancient Egypt / Nile / pyramids** | Existing scenery, solid palms, riverbanks, docks, workers, boats, return portal preserved; shared fast flight now available. | Bot A: dive onto stepped pyramids/docks, shallow Nile seams and portal walkthrough; Bot B: riverlife polish. |
| **Moses / Parted Sea** | Existing Egyptian-origin departure portal, sea crossing, NPCs and return untouched; shared flight upgrade available. | Test both portals with held DOWN and boost. |
| **Jurassic** | Existing dinosaur scenes and collision preserved; shared flight upgrade available. | Stress landings near caves and tall structures. |
| **Future / RealMecca** | Skyways/towers and indexed collision preserved; shared flight upgrade available. | Dive onto skyway roofs, verify no tunneling. |
| **Makkah / Madinah / Nabawi / Hajj** | Hajj seven circuits, Safa–Marwa and prayer scene untouched. | Mobile LOD / respectful NPC path walkthrough. |
| **Roman Judea / Jerusalem** | Portal and scene unchanged. | Rooftop and alley landing tests. |
| **Space / Moon / ship / EVA** | Ship and Moon systems untouched; EVA down thrust and atmosphere star LOD improved. | EVA high-altitude descent and shuttle reboarding. |
| **Today / Belt Boyz / XP store** | Office, meeting and game shop untouched; ordinary flight improved. | Roofless council regression, rooftop descent and proximity voice. |

## Dependencies, integration, rollback and next-shift TODO
- **Dependencies:** none added; no DB migrations, new assets, site components, external APIs or CSS changes.
- **Integration:** compare then-current website main/production and frozen layout again. Selectively cherry-pick the three game commits `ca63dc9`, `0476bad`, `20ac366` onto the latest **site integration branch** after existing Egypt/Nabawi game dependencies are present. If the shared lobby diverged, transplant only the import, control and flight/star changes; never copy whole `SharedGameLobby.tsx` over newer game work, never merge this full branch or stale site files.
- **Rollback:** revert `20ac366`, `0476bad`, `ca63dc9` in reverse order, or restore the shared lobby and remove the helper/smoke script. No data migrations.
- **Bot B handoff:** Egypt dock worker and wildlife logic remains intact; no edits to `AncientEgyptRiverScene.ts`. Please continue independent scenery slice from this verified branch or selectively transplant onto your new branch, and preserve the new `descendTouch` mapping when editing shared lobby.
- **Bot A next:** run the committed full Node smoke; mobile pointer/flight/roof collision playtest; verify fast vertical sweeps at 55/80 units/s across Egypt pyramid tiers, Future skyways, Today rooftops and Moses arches. If tunneling appears, add bounded substep physics rather than raising render draw budget. Consider terrain/riverbank seams and a clearer altitude transition after physics validation.
- **Outstanding user requests:** more solid enterable mosques, XP shop/blasters/sounds, visible shield, persistent raised-hand animation, proximity speaker indicators, richer ambient life. These are **not implemented in this shift**.
- **Production:** **NO merge, NO alias promotion, NO production deployment** without user approval.
