# Keemy's Adventure World — Game-only shift log

## 2026-10-27 · 23:00 CDT (America/Chicago) · Bot A / World Engine — Egypt palace and market solidity

**Detailed handoff:** [Egypt palace/market physics shift](shifts/2026-10-27-egypt-palace-market-solids-2300.md) · [Bot B palace/market visual handoff](shifts/2026-10-27-egypt-market-palace-2242.md) · [coordination #126](https://github.com/ElmiandCo/1Muslim/issues/126).

- **Source and protection:** Frozen preview `fix/profile-scroll-match-umma-20261027` @ `c856491`; latest checked `main` @ `c043219`; production checkpoint `518fddc`, all read-only. Started from Bot B `game/living-worlds-egypt-market-palace-20261027-2330` @ `5d9a9f7`, 8 commits ahead of Bot A projectile-camera branch. New game-only branch `game/world-engine-egypt-palace-market-solids-20261027-2300-a`; implementation `df06c80c`, wiring `201ad76b`, test `4c29d0c2`, detailed handoff `713109ab`.
- **Exact paths:** New `app/components/gameEgyptDistrictPhysics.ts` (`createEgyptDistrictColliders()`); `app/components/gameEgyptWorld.ts` (`createAncientEgyptColliders()` and existing `EGYPT_COLLISION_INDEX`); new `scripts/game-egypt-district-smoke.mjs`. Adds 149 static geometry-matched palace/market volumes without blocking the palace southern gate or market central walking spine. No site pages, nav, feed, profile, Quran, GoLive or other worlds modified.
- **Verification:** 7/7 committed-source/static checks passed; GitHub compare showed exactly three game/test files before documentation. **PASS:** automatic non-production Vercel preview for implementation+test commit `4c29d0c2` reached **READY** (`dpl_4zhKHYyzJ762bqP9xNomG917SgUs`, https://1muslim-oq4i68bev-elmiandco.vercel.app). Native smoke, local build, browser gameplay and mobile tests **not run**; preview build is not gameplay validation.
- **World matrix:** Egypt physics **updated**; Moses, Jurassic, Future/RealMecca, Rome/Jerusalem, Hajj/Nabawi, Space/Moon, Today/roofless Belt Boyz, flight, blasters and shield **preserved** as found in starting game source. Long Nile, authoritative lion/shield, real multiplayer and mobile FPS remain pending.
- **Integration/rollback:** cherry-pick only `df06c80c`, `201ad76b`, `4c29d0c2` against the **current** site's integration branch after layout comparison. Revert `201ad76b` to disable new solids. Never merge full branch or replace app page/layout. Bot B should retain existing palace visual dimensions; Bot A next runs native smoke/build and phone physics walkthrough.


## 2026-10-27 · 22:42 CDT (America/Chicago) · Bot B / Living Worlds — Egypt palace and Nile market

**Detailed handoff:** [Egypt market and palace shift](shifts/2026-10-27-egypt-market-palace-2242.md) · [coordination issue #126](https://github.com/ElmiandCo/1Muslim/issues/126).

- **Base:** `game/muhammad-madinah-midway-sign-20261027-2300` @ `6c915ddc`; protected `fix/profile-scroll-match-umma-20261027` unchanged; main `app/page.tsx` differs from baseline and was **not** touched.
- **Branch:** `game/living-worlds-egypt-market-palace-20261027-2330`. **Code commits:** `2289a216`, `40de5306`, `e699726c`; handoff `4c4a00db`.
- **Changed:** new `app/components/AncientEgyptMarketPalaceScene.ts` with open-gate mudbrick palace, columned courtyard, water garden, 5×3 Nile market with walking lane, faceless traders, animated cats and bounded LOD. Exactly two lines added to `SharedGameLobby.tsx` to import and render only in Ancient Egypt. No other game worlds, site UI, main or production touched.
- **Verification:** 11 static source/geometric checks passed; GitHub compare showed only two game files changed before documentation. **Build, browser, physics and mobile FPS NOT run**. All new structures visual-only; Bot A must integrate solids while preserving gate, market lane and riverbanks.
- **Integration:** cherry-pick only the three game implementation commits or targeted new helper + two-line call; never merge full lobby or page into site. Preserve every world and portal. Long navigable Nile remains pending.


## 2026-10-27 · 20:59 CDT (America/Chicago) · Bot A / World Engine — Nile dock cargo solids parity

**Full handoff:** [Egypt dock cargo collision shift](shifts/2026-10-27-egypt-dock-cargo-solids-2059.md) · [Bot B 20:30 Future koi](shifts/2026-10-27-future-koi-gardens-2030.md) · [coordination issue #126](https://github.com/ElmiandCo/1Muslim/issues/126).

- **Baseline:** frozen preview `fix/profile-scroll-match-umma-20261027` @ `c856491` (unchanged); read-only main `c043219` (newer layout diverged); started from latest Bot B game tip `game/living-worlds-future-koi-gardens-20261027-2030` @ `d901a021`. Work branch `game/world-engine-egypt-dock-cargo-solids-20261027-2100`.
- **Game-only change:** `app/components/gameEgyptWorld.ts` `createAncientEgyptColliders()` now adds the previously missing **fourth limestone cargo collider** at each of three Nile docks. Rendered cargo had four blocks per dock, but only three were solid. Static index remains active regardless of visual LOD. `scripts/game-egypt-integration-smoke.mjs` adds visual/solid parity, boosted walking and landing checks for all 12 blocks.
- **Commits:** `8873823d` game physics; `60c43c85` smoke; `966da14e` detailed shift doc. **Verification:** GitHub diff exactly two game/test paths before docs; 12/12 V8 exact collider checks, 24/24 V8 movement/landing checks using GitHub-fetched function bodies with TS annotations removed; 199 finite static colliders. Native Node smoke and real mobile testing pending. Non-production Vercel preview `dpl_3w8gvUFcKqnDWxC8YmHScAkUMS4H` is **READY** at https://1muslim-kiqqct5wh-elmiandco.vercel.app (Next.js compilation/type-check and 101/101 static pages completed).
- **World matrix:** Egypt **updated**; Moses, Jurassic, Future/RealMecca (including Bot B koi gardens), Roman Judea, Hajj/Nabawi, Space/Moon, Today/roofless Belt Boyz and client Hyper Defense **preserved**. Meeting UX and authoritative shield still pending.
- **Integration:** targeted cherry-pick of `8873823d` and `60c43c85` only against the then-current site; no full-page merge, no production deploy. Roll back these two commits if needed. **Next:** native smoke, phone FPS/collision walkthrough, multiplayer-authoritative shield design. Bot B owns scenery/meeting UX; coordinate any dock visual count changes.

## 2026-10-27 · 20:30 CDT (America/Chicago) · Bot B / Living Worlds — Future City luminous gardens and holographic koi

**Full handoff:** [Future City koi gardens shift](shifts/2026-10-27-future-koi-gardens-2030.md) · [Bot A 20:00 Egypt banks/arrival](shifts/2026-10-27-egypt-banks-arrival-2000.md) · [coordination #126](https://github.com/ElmiandCo/1Muslim/issues/126).

- **Baseline:** frozen preview `fix/profile-scroll-match-umma-20261027` @ `c856491`, current main `c043219` read-only (main layout diverged), started from latest Bot A game branch `game/world-engine-egypt-banks-arrival-20261027-2000` @ `f0dec211`. Working branch `game/living-worlds-future-koi-gardens-20261027-2030`.
- **Exact game/test paths:** `app/components/FutureCityScene.ts` (+63 lines, no deletions) and `scripts/game-future-koi-smoke.mjs` (new, +41 lines); implementation `10fe2747`, test `df86dba5`. No shared engine, collision, Egypt, profile, feed, navigation, Quran, GoLive or app page changes.
- **Before/after:** Existing Future City towers/skyways/traffic/citizens/portal preserved. Restored six animated bioluminescent garden sites from prior Bot B Future Gardens branch, plus **two holographic koi per near-detail basin**. Garden draw LOD at 55/84/150 world units; decorative non-solid geometry only.
- **Verified:** 30,619 direct V8 finite/alpha assertions against GitHub-fetched actual source across 140 camera samples; far garden draw 0, near sample 150, max sampled 166 callback draws; 8 preservation anchors and GitHub two-file game-only diff pass. Code commit `10fe2747` Vercel **preview READY**, https://1muslim-r3wacb7e7-elmiandco.vercel.app; test commit `df86dba5` non-production preview **READY** at https://1muslim-1yszgsegu-elmiandco.vercel.app (existing webpack/CSS warnings only). Native Node smoke, physical device FPS and actual gameplay pending.
- **World matrix:** Future **updated this shift**; Egypt/Nile/Great Pyramid, Moses, Jurassic, Hajj/Nabawi, Roman Judea, Space/Moon, Today/roofless Belt Boyz, shield all preserved. Earlier Jurassic river-life scene is on a separate Bot B branch and must be selectively integrated later. Meeting/Exit Meeting, server-authoritative shield, blaster/XP/voice improvements remain pending.
- **Integration:** cherry-pick **only** `10fe2747` (and optional `df86dba5` smoke) into the latest site/game integration branch after layout comparison; do not merge historical full branch. Rollback those commits independently. No production or main merge/deploy. Bot A retains physics/LOD/portal and multiplayer authority; Bot B owns scene visuals/audio.

## 2026-10-27 · 20:04–20:07 CDT (America/Chicago) · Bot A / World Engine — Nile bank floor match + Great Pyramid arrival

**Full handoff:** [Nile bank and pyramid arrival shift](shifts/2026-10-27-egypt-banks-arrival-2000.md) · [Bot B's Great Pyramid visual approach](shifts/2026-10-27-egypt-great-pyramid-approach-1930.md) · [coordination #126](https://github.com/ElmiandCo/1Muslim/issues/126).

- **Baseline:** frozen `fix/profile-scroll-match-umma-20261027` @ `c856491`, main @ `c043219` read-only; started from latest Bot B game branch @ `b5809dd`. Branch `game/world-engine-egypt-banks-arrival-20261027-2000`.
- **Exact game/test paths:** `app/components/gameEgyptWorld.ts` (Nile banks now render with near/far terrace LOD sampled from the existing physical floor, plus calculated Great Pyramid arrival yaw); `app/components/SharedGameLobby.tsx` (two narrow portal-heading substitutions); `scripts/game-egypt-integration-smoke.mjs` (floor/render/LOD/heading regressions). Code commits `d832435f`, `d2f020e8`, `8152a545`.
- **Before/after:** flat sand used to cover half of the 6m bank slope; nearby player feet could appear buried. Now dry sand stops at slope boundary and height-sampled banks follow collision floor; the Moses→Egypt arrival camera faces the existing Great Pyramid instead of defaulting north. No portal/physics index, scenery NPCs, shield, meeting, or site UI changes.
- **Verified:** 1,613 V8 assertions against actual fetched source function bodies (TypeScript parameter types removed only), draw budgets spawn 130 / bank 182 / high-altitude 300 / out-of-bounds 0; GitHub compare confirms **only three game/test paths**. Non-production preview `dpl_G5LxNcXCxPZSjz4zvZGneNrqi9yg` **READY**, Next.js compiled in 18.5s, build completed (~1m) with existing CSS warnings; physical-device playtest still pending. Native full Node smoke, mobile visual/FPS and authoritative multiplayer shield remain unverified.
- **Integration:** cherry-pick game-only commits into the then-current site/game branch after checking layout contract; never merge the old app page. Rollback these three commits if needed. **No production/main/frozen-preview changes.**
- **World coverage:** Ancient Egypt updated; Moses, Jurassic, Future, Makkah/Madinah/Nabawi, Roman Judea, Space/Moon, Today/Belt Boyz, Hyper Defense preserved. Bot B owns Egypt visual scene and meeting UX; Bot A owns portal/terrain/physics and authoritative multiplayer design.

## 2026-10-27 · 19:26–19:30 CDT (America/Chicago) · Bot B / Living Worlds — Great Pyramid focal approaches

**Full handoff:** [Egypt Great Pyramid approach shift](shifts/2026-10-27-egypt-great-pyramid-approach-1930.md) · [Bot A roof-edge handoff](shifts/2026-10-27-roof-edge-release-1900.md) · [coordination #126](https://github.com/ElmiandCo/1Muslim/issues/126).

- **Protected baseline:** `fix/profile-scroll-match-umma-20261027` @ `c856491`; latest `main` @ `c043219` read-only; game starting source Bot A `game/world-engine-ledge-release-20261027-1900` @ `e488164b`. Current site page differs from frozen; never copy it.
- **Dedicated branch:** `game/living-worlds-egypt-pyramid-approach-20261027-1930` from Bot A SHA. Implementation `77124efe`; test `31c583d3`; docs follow.
- **Exact implementation paths:** `app/components/AncientEgyptRiverScene.ts` (three deterministic, culled, visual-only sandstone routes to existing Great Pyramid, limestone course accents, eight windblown dust puffs); `scripts/game-ancient-egypt-smoke.mjs` (footprint, dry Nile bank, finite geometry, culling/draw budget checks). **Before:** isolated pyramid scene. **After:** readable Nile/arrival/yard approach network, with no collider/portal/terrain change.
- **Verified:** 6,158 full smoke assertions executed against GitHub-fetched helper in V8 with TS erased; focused 2,552 assertions, max representative scene draws 269, far 0, 74 unchanged solid descriptors. GitHub compare confirms only two game/test implementation paths. Native checkout/mobile FPS unverified. Non-production preview `dpl_PP2EZAmq7FbirVtFWTsfp6eskpWf` at `31c583d3` **PASS / READY** preview build (Next.js compiled and 101/101 static pages).
- **World progress:** Ancient Egypt improved this shift; Moses/Parted Sea, Jurassic, Future/RealMecca, Makkah/Madinah/Nabawi/Hajj, Roman Judea/Jerusalem, Moon/Space/Blessed Chambers, Today/Belt Boyz and existing portals **unchanged**. Next: mobile camera/LOD review, Bot A terrain integration, then one verified Jurassic or Roman scenery slice. Hyper Shield remains client-side, not server-authoritative.
- **Integration:** cherry-pick only `77124efe` (plus optional `31c583d3`) onto a freshly audited site integration branch; never merge the old-layout full branch. Rollback by reverting `77124efe`. No production deployment or main/frozen-site merge.

## 2026-10-27 · 18:57–19:04 CDT (America/Chicago) · Bot A / World Engine — roof/ceiling edge release

**Full handoff:** [roof-edge release and collision regression](shifts/2026-10-27-roof-edge-release-1900.md) · **Reviewed Bot B:** [Hyper Defense emerald aura](shifts/2026-10-27-hyper-shield-aura-1830.md) · [coordination issue #126](https://github.com/ElmiandCo/1Muslim/issues/126).

| Contract | Evidence |
| --- | --- |
| Frozen preview | `fix/profile-scroll-match-umma-20261027` @ `c856491`; `app/page.tsx` blob `92ca9b5` unchanged |
| Current main (read-only) | `c043219`; newer site page differs, never copied |
| Actual game starting branch | Bot B `game/living-worlds-hyper-shield-aura-20261027-1830` @ `95d9e7a` |
| Dedicated branch | `game/world-engine-ledge-release-20261027-1900`; game code/test commits `0248512`, `6235488`, `0ae037e`, `9c02c35` |
| Exact changed paths | `app/components/gamePhysics.ts` and `scripts/game-swept-vertical-smoke.mjs`; documentation only otherwise |
| Implemented | Characters can walk/fall off roof edges and ascend away from overhead slabs instead of snapping to start position; movement **along** supported roof/underside preserves destination X/Z; real roof/ceiling crossings still stop |
| Verification | **PASS:** 8 executed V8 assertions against exact modified helper source with TS annotations erased; GitHub compare game-only; frozen page SHA parity. Full committed smoke suite and real-device test **not run** |
| Preview | Non-production `dpl_91urCJhNY5CRJvEzvQ97eC7BgwtJ` at `9c02c35`, https://1muslim-96vy3by96-elmiandco.vercel.app; **PASS / READY**; Next.js compile, type/lint and 101/101 static pages succeeded |
| World coverage | Shared ordinary-avatar collision for Egypt/Moses/Jurassic/Future/Today/prophetic/Roman improved; Moon/Space dedicated physics untouched; all scene modules, Hajj/Nabawi, shield, meeting and roofless Belt Boyz office preserved |
| Integration / rollback | Cherry-pick **only** physics/test hunks onto latest site branch, never merge whole game branch. Revert `0ae037e` + `0248512` to restore Bot B physics blob `9e19e03`. No main/production deployment. |

**Next:** Real-device pyramid/skyway ledge tests, Nile banks, complete smoke suite, server-authoritative combat plan. Bot B owns Great Pyramid visual centering and Meeting UX/Exit Meeting. Shield remains client-authoritative.

---


## 2026-10-27 · 18:30 CDT (America/Chicago) · Bot B / Living Worlds — Emerald Hyper Defense sphere + sound

**Full handoff:** [Shield aura/audio 18:30](shifts/2026-10-27-hyper-shield-aura-1830.md) · **Reviewed:** [Bot A Hyper Defense 18:00](shifts/2026-10-27-hyper-shield-1800.md) and [Bot B Egypt village 17:30](shifts/2026-10-27-egypt-village-1730.md) · [Bot coordination #126](https://github.com/ElmiandCo/1Muslim/issues/126).

| Item | Evidence |
| --- | --- |
| Baseline / current site | Protected `fix/profile-scroll-match-umma-20261027` @ `c856491`; main @ `16ff227` read-only; app layout blobs diverge and **were not copied or changed**. |
| Actual game base | Bot A `game/world-engine-hyper-shield-20261027-1800` @ `9a39503b`, retaining Bot B Egypt village, Bot A Moses/Egypt portals, Nabawi/Hajj, all other worlds, and roofless Belt Boyz office. |
| Dedicated branch | `game/living-worlds-hyper-shield-aura-20261027-1830`; code/test commits `850d20dc`, `2d548b9a`, `c7b1e91e`. |
| Game-only changes | New `gameHyperShieldAura.ts` (50/26/8/0 LOD sphere and local WebAudio), five narrowly targeted substitutions in `SharedGameLobby.tsx` (render/activation/impact), new `game-hyper-shield-aura-smoke.mjs`. |
| Verified | 24 executed V8 source behavior assertions (14 unique), 11/11 game preservation markers, GitHub compare **only 3 game/test paths**. Committed Node smoke not executed in checkout; mobile/WebGL/audio not verified. |
| Preview | Non-production Vercel build `dpl_7niL12b4mshsUhZD1ufH9hWe7KXm` **PASS / READY** at `c7b1e91e`; Next.js compiled in 12s and lint/type stage completed. **No production deployment.** |
| Constraints | Existing exactly 10s local shield and 3s fade unchanged. **NOT server-authoritative**; audio/visual layer never grants damage immunity. No changes to site, physics, portal or world geometry. |
| Next | Bot A: integrate only game helper/lobby hunks after review, test server-authoritative combat separately. Bot B: Great Pyramid centrality and other world scenery, verify device FPS/audio. |

---

## 2026-10-27 · 18:04–18:10 CDT (America/Chicago) · Bot A / World Engine — Hyper Defense 10-second shield

**Detailed handoff:** [Hyper Defense shield, timing and combat](shifts/2026-10-27-hyper-shield-1800.md). **Reviewed Bot B:** [Egypt village / irrigation](shifts/2026-10-27-egypt-village-1730.md). Coordination [issue #126](https://github.com/ElmiandCo/1Muslim/issues/126).

| Contract | Verified evidence |
| --- | --- |
| Frozen site preview / main | `fix/profile-scroll-match-umma-20261027` @ `c856491`; main @ `82eddbf`; site layout unchanged, `app/page.tsx` frozen blob `92ca9b5`. |
| Actual game starting point | Bot B `game/living-worlds-egypt-village-20261027-1730` @ `d67780d` (contains Bot A fast descent and all Egypt/Moses/Hajj/Nabawi improvements). |
| Dedicated branch | `game/world-engine-hyper-shield-20261027-1800`; code/test commits `06f188d`, `e71b86d`, `ac03f2d`, docs commits follow. |
| Exact code/test paths | New `app/components/gameHyperShield.ts`, targeted `app/components/SharedGameLobby.tsx`, new `scripts/game-hyper-shield-smoke.mjs`; docs only otherwise. |
| Implemented | 10-second monotonic shield, final 3-second visual fade, 20s recharge (15s after 1,500 demo XP upgrade), all-angle local projectile/animal protection, Jurassic and Moses NPC damage guards, 13-cube rotating visible shield and bounded peer broadcast status. No new network channel. |
| Verification | PASS: 16 executed Node timing assertions on exact helper mirror; strict TypeScript helper check; 13 GitHub source checks; only 3 game/test paths changed vs Bot B. Committed full-checkout smoke not executed; mobile FPS/multiplayer device tests pending. |
| Preview build | **PASS / READY:** Next.js compiled and Vercel built successfully in 54s, deployment `dpl_k3nH9bMX37ZcY7fZysK13UCj6FGW` at `ac03f2d`: https://1muslim-dan49mlc0-elmiandco.vercel.app . **No production alias**. |
| Known limitation | Shield damage is **client-authoritative**, not trusted-server enforced. Does not protect from environmental fall/ship/sun. Audio/impact ripples pending. |
| Integration | Selectively cherry-pick game-only code/test commits or apply narrow shield patch to then-current site integration branch. Never merge full preview-descended branch into current main/production. Rollback to Bot B `d67780d` lobby and remove helper/test. |

**World matrix:** Egypt Nile/pyramids/village/docklife **preserved**; Moses and Jurassic attack defense **improved**; Future/RealMecca, Makkah/Madinah/Nabawi/Hajj, Roman Judea, Moon/Space, Today/Belt Boyz and roofless office **preserved**. Bot B next: user-requested **Meeting** rename, obvious **Exit Meeting** and compact controls, plus Great Pyramid arrival framing. Bot A next: full smoke and device tests, high-speed Egypt landings, server-authoritative combat plan.

**No main/production merge or deployment.**

---

## 2026-10-27 · 17:26–17:35 CDT (America/Chicago) · Bot B / Living Worlds — Egypt village porters and irrigated crops

**Detailed handoff:** [Egypt village / irrigation](shifts/2026-10-27-egypt-village-1730.md). **Reviewed Bot A:** [fast descent/stars](shifts/2026-10-27-fast-descent-stars.md); [Egypt portal/solids](shifts/2026-10-27-egypt-portal-colliders.md). [Coordination issue #126](https://github.com/ElmiandCo/1Muslim/issues/126).

| Contract | Evidence |
| --- | --- |
| Frozen preview baseline | `fix/profile-scroll-match-umma-20261027` @ `c856491`; `app/page.tsx` SHA identical to frozen preview |
| Actual starting game branch | Bot A `game/world-engine-fast-descent-20261027-1700` @ `97df686a402d8a2bdd29ff17c257b06bcae5826b` (contains Bot B Egypt docklife @ `7f03f67`) |
| Dedicated branch | `game/living-worlds-egypt-village-20261027-1730`; implementation `8bc190fc`, smoke `ed1f3ded`; documentation commits follow |
| Read-only main | `main` @ `82eddbf7`; current site diverges from protected preview; no site, main or production writes |
| Changed paths | `app/components/AncientEgyptRiverScene.ts`, `scripts/game-ancient-egypt-smoke.mjs`, `docs/game-dev/shifts/2026-10-27-egypt-village-1730.md`, this log; **no shared engine, portal or non-game changes** |
| Implemented | Eight faceless, unarmed porters in collision-clear village lane; 24 irrigated grain/flax beds with gentle near-camera sway and three ground-level water rills. Existing boats, pyramids, palms, dock crews, fish, herons and return portal unchanged. |
| Verification | **PASS:** 14/14 source/preservation checks; committed extended Node smoke **not executed** in checkout; mobile FPS/physics **not measured**. |
| Preview build | Vercel preview `dpl_GYPdkL1b6QY761GJNCeuiiYx1VqG` at `ed1f3ded`, https://1muslim-j734yalu7-elmiandco.vercel.app ; **PASS / READY**: Next.js compiled in 17.1s, type/lint passed, static/serverless output built, Vercel deployment READY (verified). No production alias. |
| Integration / rollback | Cherry-pick only the two game code/test commits, or narrowly transplant their additions into current Egypt scene; do **not** merge whole older-site-descended branch. Restore two game files from Bot A `97df686` to roll back. |

**World matrix:** Ancient Egypt **upgraded**; Moses/Parted Sea, Jurassic, Future/RealMecca, Makkah/Madinah/Nabawi/Hajj, Roman Judea/Jerusalem, Moon/Space/Blessed Chambers and Today/Belt Boyz **preserved**. Next: device test Egypt alley/portal, coordinate Bot A physics/LOD; integrate a separate Jurassic/Future/Roman ecology slice later. XP shop, blaster sound/aim, force field, held hand, current speaker and ten mosques remain pending.

---

## 2026-10-27 · 17:05–17:09 CDT (America/Chicago) · Bot A / World Engine — faster DOWN flight and progressive high-altitude stars

**Detailed handoff:** [2026-10-27 fast descent and star LOD](shifts/2026-10-27-fast-descent-stars.md). **Bot B latest reviewed:** [Egypt docklife](shifts/2026-10-27-egypt-docklife.md). Game coordination: [issue #126](https://github.com/ElmiandCo/1Muslim/issues/126).

| Contract | Verified evidence |
| --- | --- |
| Protected preview ancestor | `fix/profile-scroll-match-umma-20261027` @ `c856491` |
| Actual game starting point | Bot B `game/living-worlds-egypt-docklife-20261027-1630` @ `7f03f67` |
| Working branch | `game/world-engine-fast-descent-20261027-1700`; code/test tip `20ac366`, documentation-only commits follow |
| Main read-only | `main` @ `82eddbf`; newer site/feed files diverge from frozen preview; no site edits |
| Exact code/test paths | New `gameFlightVertical.ts`, targeted `SharedGameLobby.tsx` (+9/−5), new `game-flight-descent-smoke.mjs`; docs only otherwise |
| Implemented | Mobile hold DOWN + keyboard C; ordinary dive max −55 (boost −80) vs −22; faster aircraft and EVA descend; safe pointer release; 48–160 altitude stars vs fixed 270; existing swept collision preserved |
| Tests | PASS: 13 locally executed Node helper assertions, strict helper `tsc`, 12 GitHub source-wiring/preservation checks, game-only diff. Full committed smoke and device physics **not executed** |
| Build | **PASS / READY**: Vercel non-production preview `dpl_551s2FYDbVKsrT58zYpRm912UYvr` at `20ac366`; Next.js compiled/type-checked, build completed in 40s |
| World coverage | Ancient Egypt Nile/docklife, Moses portals, Jurassic, Future, Makkah/Nabawi/Hajj, Roman, Moon/ship and Today/Belt Boyz preserved; shared flight available in ordinary worlds |
| Integration | Cherry-pick **game-only** helper/lobby/test commits or narrowly transplant onto current site integration branch. Never merge full old-site-descended branch. No production deployment |


## 2026-10-27 · 16:25–16:35 CDT (America/Chicago) · Bot B / Living Worlds — Ancient Egypt dock cargo and Nile wildlife

**Detailed handoff:** [2026-10-27 Egypt docklife](shifts/2026-10-27-egypt-docklife.md). **Bot A starting handoff:** [Egypt portal and collision](shifts/2026-10-27-egypt-portal-colliders.md).

| Contract | Evidence |
| --- | --- |
| Frozen preview ancestor | `fix/profile-scroll-match-umma-20261027` @ `c856491131bb0c8056693652f8e5e58a26836831` |
| Actual GAME starting point | Bot A `game/world-engine-egypt-portal-colliders-20261027-1600` @ `a40c755e16257559758640e20dcbf58eb6d84f02` |
| Working branch | `game/living-worlds-egypt-docklife-20261027-1630`; implementation `a5b6576f`, test `a6082993`, TS cleanup `8f6dbf68`, docs `02c82c49` |
| Main/production read-only | `main` @ `82eddbf7`; `1muslim.live` READY at `dpl_DbtVZbtN1b7x5ccavV9PGxm1dZAY`; no main or production writes |
| Exact changed paths | `app/components/AncientEgyptRiverScene.ts`, `scripts/game-ancient-egypt-smoke.mjs`, `docs/game-dev/shifts/2026-10-27-egypt-docklife.md`, this log. No site or shared-engine files. |
| Implemented | Six faceless cargo crews unload limestone at three Nile docks; four fish and eight herons animate with distance LOD. West-bank paths stay clear of the riverbed. No new colliders or portal edits. |
| Verification | **PASS:** 1,474 actual-scene V8 assertions, bank 240 draws, construction 222, dock 242, distant 0; all near samples below 1,000 draw budget. Committed Node smoke not run in full checkout; device FPS not measured. |
| Build | Non-production Vercel preview `dpl_FkQ5pkYPDhi3KJj27GcN79VurEFg` created at `8f6dbf68`; Next.js compiled, type/lint passed, 101/101 pages generated, output build completed; Vercel **READY** (status verified), https://1muslim-25cl7jldy-elmiandco.vercel.app . |
| Integration / rollback | Cherry-pick only 3 game code/test commits onto then-current site branch, not full branch; restore two game files to revert. Bot A owns portal/physics/LOD; Bot B owns scenery. |

**World matrix:** Ancient Egypt **upgraded**; Moses/Parted Sea, Jurassic, Future/RealMecca, Makkah/Madinah/Nabawi/Hajj, Roman Judea/Jerusalem, Space/Moon/Blessed Chambers, Today/Belt Boyz **preserved**. Earlier Bot B Jurassic, Future and Roman side branches remain separate. **Next:** Bot A test Nile bank/cargo path and portal on device; Bot B next world-specific ecology slice. XP shop, blaster sound/aim, shield, held hand, current speaker and ten mosques remain pending.

---


## 2026-10-27 · 16:02–16:07 CDT (America/Chicago) · Bot A / World Engine — Ancient Egypt portal, Nile terrain and stepped solids

**Full per-shift handoff:** [Moses ↔ Ancient Egypt portal and collision integration](shifts/2026-10-27-egypt-portal-colliders.md). **Bot B source reviewed:** [Egypt riverlife](https://github.com/ElmiandCo/1Muslim/blob/game/living-worlds-ancient-egypt-riverlife-20261027-1530/docs/game-dev/shifts/2026-10-27-ancient-egypt-riverlife.md); [coordination issue #126](https://github.com/ElmiandCo/1Muslim/issues/126).

| Contract | Result |
| --- | --- |
| Protected baseline | `fix/profile-scroll-match-umma-20261027` @ `c856491` |
| Game starting point | Bot A `game/world-engine-3d-side-sweep-20261027-1500` @ `f86963e` |
| Working branch | `game/world-engine-egypt-portal-colliders-20261027-1600`; initial code/test tip `d1de8e4`, then safe re-entry `f43e0a4` and arch orientation `55e07d9`, followed by docs-only commits |
| Main/production read-only | `main` @ `82eddbf7`; **no site or production edits**; newer feed/profile and frozen layout contracts preserved |
| Exact changed code | New `AncientEgyptRiverScene.ts` (Bot B isolated import) and `gameEgyptWorld.ts`; targeted `SharedGameLobby.tsx` Egypt portal/physics/render and `PartedSeaScene.ts` arch tint; two game smoke scripts |
| Implemented | Positive-Z Moses Egyptian-origin portal → independent Nile/pyramids world → reciprocal return arch; 2.5s cooldown; persistent Moses NPC state; stepped pyramid/ramp, palm, hut wall/roof and dock solids; continuous desert and lowered Nile riverbed; render LOD |
| Verified | GitHub path diff **PASS**, connector-side source preservation markers **PASS**; new Node smoke **committed, not executed**; Next.js non-production Vercel preview at code/test commit `d1de8e4` **READY** (build completed; CSS warnings only); two portal safety follow-ups also **READY** on non-production preview at `55e07d9` |
| Pending | Actual portal walkthrough, real mobile FPS, river/wading physics, boat boarding, collision edge stress, high-altitude stars, faster descend; Bot B NPC refinements |
| Integration | **Game-only selective patches/cherry-picks**, never full branch/app replacement. See detailed shift note for rollback and per-world checklist. No production merge/deploy. |

## 2026-10-27 · 15:05–15:13 CDT (America/Chicago) · Bot A / World Engine — continuous 3D side entry and accurate roof crossing

**Full handoff:** [2026-10-27 swept sidewall flight](shifts/2026-10-27-swept-sidewall-flight.md). Reviewed [Bot B 14:40 Nabawi congregation](shifts/2026-10-27-nabawi-congregation.md) and [Bot A 14:00 vertical collision](shifts/2026-10-27-swept-vertical-flight.md).

| Contract | Verified evidence |
| --- | --- |
| Frozen preview baseline | fix/profile-scroll-match-umma-20261027 @ c856491131bb0c8056693652f8e5e58a26836831 |
| Actual game starting point | Bot B game/living-worlds-nabawi-congregation-20261027-1440 @ 1e4e84faa9439b104dd34a5b64c781e8cdd224fe |
| Dedicated branch and tested code SHA | game/world-engine-3d-side-sweep-20261027-1500 @ 0a61fabe7cd041a87238eb6b3e5a6d249a8df099 (before docs commit); final tip is branch ref |
| Current main read-only | main @ 82eddbf7a5a94fa5968550be2bd335a4aa46f823; site diverged from preview in ImmersiveVideoEntry.tsx and PostDesignStudio.tsx; no site, main or production writes |
| Changed implementation/test paths | app/components/gamePhysics.ts, app/components/SharedGameLobby.tsx, scripts/game-swept-side-smoke.mjs (new), scripts/game-swept-vertical-smoke.mjs |
| Code commits | 5f3cb9a6 (helper/wiring/tests), 947a1f9a (roof-edge precision), 3e9c2dfa (test endpoint correction), 0a61fabe (legacy smoke assertion) |
| Implemented | Swept sidewall entry at interpolated feet height for diagonal flight/fall; moving roof/underside crossings use swept X/Z rather than endpoint-first ghost landings; stationary vertical collision retained |
| Verification | PASS: new 11 cases + 120 index parity + 3 wiring; vertical 10 + 100 parity + 2 wiring; legacy physics 23 + 288 parity; Today 192; flight pose 16; Moses, Roman, lunar, Hajj; strict gamePhysics TypeScript |
| Build | PASS: Next.js 15.5.26 build, lint/type stage, 101/101 pages in isolated sandbox with dummy Supabase URL and publishable key. Unconfigured build failed on missing Supabase variables, not game code |
| World coverage | Shared ordinary movement: Today/Belt Boyz, Jurassic, Future, Moses, Roman, Muhammad ﷺ era. Space/ship/plane/EVA/Moon dedicated physics untouched. All scenes, Hajj/Nabawi NPCs and portals preserved |
| Limitations | No real device gameplay/FPS measurement; not all geometry has precise colliders; city/ground/roads, new mosques and other features remain pending |
| Integration/rollback | Game-only cherry-pick/targeted patch onto then-current site integration branch; never merge entire game branch or overwrite newer layout/feed/profile. Revert game commits in reverse order if needed. No production deployment |


## 2026-10-27 · 14:30–14:36 CDT (America/Chicago) · Bot B / Living Worlds — Hajj pilgrim seven-circuit tawaf → seven-trip sa'i

**Full persistent handoff:** [2026-10-27 Hajj pilgrim routes](shifts/2026-10-27-hajj-pilgrims.md) — provenance, exact files/functions, before/after, test evidence, performance, every-world checklist, Bot A coordination, rollback and selective integration.

| Contract | Evidence |
| --- | --- |
| Frozen site baseline | `fix/profile-scroll-match-umma-20261027` @ `c856491131bb0c8056693652f8e5e58a26836831` |
| Actual latest game starting point | Bot A `game/world-engine-swept-vertical-20261027-1400` @ `46210b09ae1ac8ce57081939d105325475c22889`; inherited swept collision and Bot B lunar additions |
| New game-only branch | `game/living-worlds-hajj-pilgrims-20261027-1430` |
| Implementation / test commits | `9fdf8f36` new scene module; `06019dfb` targeted shared-game wiring; `240ae375` smoke test |
| Changed paths | `app/components/HajjPilgrimScene.ts` (new), `app/components/SharedGameLobby.tsx` (+7/−0), `scripts/game-hajj-pilgrims-smoke.mjs` (new), this log and per-shift note; **no site or other game-engine files changed** |
| Implemented | **12 faceless pilgrim NPCs** follow seven full tawaf circuits, walk to Safa, traverse seven Safa–Marwa legs ending at Marwa, fade before recycling. Historical Makkah uses existing open alley; Today uses existing Safa–Marwa gallery. Deterministic animation, max 84 additional nearby cube draws, 115-unit LOD. |
| Verification | **PASS** 42 executed assertions on the exact GitHub module logic (type-only syntax removed for isolated JS execution); **PASS / READY** Vercel preview build `dpl_7zGkQSf5jbwZTNPLFHrMiRV5YA6S` at `240ae375`, compiled, type/lint checked and 101/101 pages generated. Full committed Node smoke script **not executed** in a checkout; real mobile FPS **not measured**. |
| Main / production (read-only) | `main` and latest production `d10a5f91fa83a0a3745118c3ed2183c33be6fa74` (Vercel `dpl_AYFy68LgFmbWSck689TcusAceSNL` READY). Site `app/page.tsx` and game CSS match protected baseline; site `CanvasSecondaryApp.tsx` differs. |
| Coordination / next | Bot A's swept flight, cached collisions and all world portals preserved. NPCs **visual-only, non-collidable**, approximate historically interpretive paths; next: iPhone corridor/pillar walkthrough, congregation slice or mosque model. Jurassic ecology, Future gardens, Roman market detail remain separate B branches. |
| Integration | **No main merge, no production deploy.** Cherry-pick only game implementation commits onto then-current site branch after layout conflict gate; transplant just new module + one import/two calls if shared lobby has drifted. Roll back those isolated additions only. |

**World coverage:** Muhammad ﷺ historical Makkah **changed** (pilgrims and ground marker); Today/Haram **changed** (pilgrims inside existing gallery). Madinah/Nabawi, Belt Boyz, Jurassic, Future/RealMecca, Moses/Parted Sea, Roman Judea/Rome, Moon/Space/Blessed Chambers concept, and five Today districts **preserved**. Remaining ten mosques, XP store, blaster sound/aim, force field, held hand, current speaker and congregational prayer **not implemented by this shift**.

---



## 2026-10-27 · 14:01–14:11 CDT (America/Chicago) · Bot A / World Engine — diagonal flight roof and underside collision

**Full persistent shift record:** [2026-10-27 swept vertical flight](shifts/2026-10-27-swept-vertical-flight.md) — provenance, code paths/functions, before/after, executed tests, per-world preservation, rollback, selective integration and next handoff.

| Contract | Evidence |
| --- | --- |
| Frozen preview ancestor | `fix/profile-scroll-match-umma-20261027` @ `c856491131bb0c8056693652f8e5e58a26836831` |
| Actual GAME starting point / other shift reviewed | Bot B `game/living-worlds-lunar-research-20261027-1330` @ `736ddf1f2387e0ee6761dd91341b3cdfc377eb67`; reviewed its lunar handoff and Bot A 13:00 collision handoff |
| Dedicated working branch | `game/world-engine-swept-vertical-20261027-1400` |
| Implementation / test commits | `a808789` physics helper; `a9e43e4` minimal shared lobby wiring; `b0569f9` regression tests; `d736066` strict TypeScript correction; `5ff3ee5` detailed note |
| Current main / production read-only | `main` @ `21119c711beda86de3f7766b18bdb0e1c39028d0`; production `dpl_3KxxhG8pRxuy64rN4D1Jn9jzgPHy` READY, no writes. Frozen preview site layout contract compared. |
| Exact paths changed | `app/components/gamePhysics.ts`, `app/components/SharedGameLobby.tsx` (targeted import/vertical block), `scripts/game-swept-vertical-smoke.mjs`, this log and `docs/game-dev/shifts/2026-10-27-swept-vertical-flight.md`. No site/profile/feed/Quran/GoLive/layout files. |
| Implemented | Analytic intermediate X/Z crossing of rooftops/raised undersides on diagonal flight; stops at impact X/Z and Y. Existing endpoint resolver remains first; no high-altitude clamp or new world replacement. |
| Verification executed | **PASS** new 10-case + 100 index-parity + 2 wiring smoke; legacy physics 23 + 288 parity + 4 index edges; flight 16; Today 192 parity; Moses, Roman (17 static), lunar smoke; strict TypeScript gamePhysics. First preview `dpl_Dm3hvRbQ6jT3TdHF6fD5oUguS3AE` at `b0569f9` FAILED strict TypeScript; fixed union type narrowing in `d736066`. **READY** non-production preview `dpl_HRon4tjWfCsWmha3JW7aoHtajSGp` at `d736066`: https://1muslim-81u6xv7mw-elmiandco.vercel.app . |
| Per-world status | Today/Belt Boyz, Jurassic, Future, Moses, Roman, Muhammad ﷺ era/Nabawi **preserved**, shared collision fallback applies. Moon/Space and Bot B lunar research **preserved**, dedicated lunar/ship physics bypassed. Separate Bot B Roman market/Jurassic ecology/Future gardens remain unmerged. |
| Limitations / next | Real-device FPS and gameplay untested; diagonal sidewall penetration, roof-edge floor snapping and ship/lunar dedicated collision remain open. Next A: audit 3D side-entry and mobile performance; B: scene-only ambience/Hajj NPC slice. |
| Integration / rollback | **No merge or production deployment.** Only game-only cherry-pick/targeted patch into then-current site branch after rechecking layout; revert small lobby fallback to restore old behavior. |

---

## 2026-10-27 · 13:28–13:32 CDT (America/Chicago) · Bot B / Living Worlds — lunar research ambience

**Full persistent shift record:** [2026-10-27 lunar research](shifts/2026-10-27-lunar-research.md) — exact provenance, paths/functions, before/after, executed tests, per-world checklist, performance limitations, Bot A handoff, selective integration and rollback.

| Contract | Evidence |
| --- | --- |
| Protected preview ancestor | `fix/profile-scroll-match-umma-20261027` @ `c856491131bb0c8056693652f8e5e58a26836831` |
| Actual game-code starting point | Bot A `game/world-engine-today-collision-cache-20261027-1300` @ `b2d00b2e1e0d1a1b7f4f866f86bd11c6f3273b4b` |
| New dedicated branch | `game/living-worlds-lunar-research-20261027-1330` |
| Implementation | `41a98e0` (new lunar module), `2496c3b` (only two insertions in shared lobby) |
| Tests / build source | `3d11009`; Vercel non-production deployment `dpl_BSn45gudks1bx4BANhaos4kEyRBX` **READY** |
| Current main / production (read-only) | `21119c711beda86de3f7766b18bdb0e1c39028d0`; site layout and frozen preview compared, no non-game edits |
| Changed files | `app/components/LunarResearchScene.ts`, `app/components/SharedGameLobby.tsx` (+2 lines), `scripts/game-lunar-research-smoke.mjs`, this log and the per-shift Markdown note |
| Status | **Implemented** four tracking solar arrays, eight pulsing approach beacons, two animated survey rovers with 75–130-unit render-only LOD; no new dependencies, physics or collision edits |
| Verification | **PASS**: actual lunar smoke, Bot A physics/flight/Today collider smokes, Bot B Moses/Roman smokes in a Vercel sandbox at exact code SHA; Next.js preview **READY**. Physical mobile FPS **not tested** |
| Cross-shift conflicts | Bot A 13:00 collision work inherited intact; Bot B Roman market `f66c6a7`, Jurassic ecology `e05ef735`, Future gardens `afe199c` remain separate, not silently merged |
| Production | **Untouched.** Integration only via reviewed game-only cherry-picks/targeted patch against the then-current site branch, with user approval |

**World checklist:** Moon/Space **changed** (research ambience); Today/Belt Boyz, Moses, Roman/Jerusalem, Jurassic, Future, Makkah/Madinah/Nabawi and five districts **preserved**; distinct Blessed Chambers module **unverified**. Roman market-life additions remain on another B branch. **Next:** device test lunar FPS and rover overlaps; then respectful Hajj NPC seven-circuit tawaf→sa'i slice or another isolated world. Ten mosques, XP shop, blaster sound/aim, shield, raised-hand hold, speaker indicators and prayer congregations are **not yet implemented** by this shift.

---


## 2026-10-27 · 12:55–13:05 CDT (America/Chicago) · Bot A / World Engine — cached Today collision geometry

### Provenance and protected site contract

| Contract | Evidence / decision |
| --- | --- |
| Bot | **Game Bot A — World Engine**, collision/physics/performance scope only |
| Frozen preview origin (read-only) | `fix/profile-scroll-match-umma-20261027` @ **`c856491131bb0c8056693652f8e5e58a26836831`** |
| Actual GAME starting point | **`game/living-worlds-roman-judea-restored-20261027-1230` @ `42fc1208e664649399cc82106ffbf6c446d1e9a5`**, descendant of the frozen preview and prior A work; retains B's latest Roman/Jerusalem restoration and Moses integration |
| Working branch | **`game/world-engine-today-collision-cache-20261027-1300`**; game implementation commits `60f1aa2`, `2c87106`, test `2f5a148`, build syntax correction `3970595` (documentation commit follows) |
| Other shift reviewed | Bot B 12:10–12:13 CDT Roman Judea/Moses handoff at top of inherited log; B's Roman renderer/colliders are left unchanged. Earlier B Jurassic ecology and Future gardens remain separate branches |
| Current main and production, read-only | `main` @ **`21119c711beda86de3f7766b18bdb0e1c39028d0`**; production deployment `dpl_3KxxhG8pRxuy64rN4D1Jn9jzgPHy` READY on that SHA. Frozen production `release/frozen-production-2026-10-27-perfect-for-you` @ `4e2a6c56bfbc75bd93560f6a02a2799deb885487` |
| Layout contract compared to frozen | `app/page.tsx` blob `92ca9b5` and `SharedGameLobby.module.css` blob `952bdfc` match main/frozen. `CanvasSecondaryApp.tsx` differs (`ac34d6b` main vs `4db1706` frozen); no site/layout file was touched or copied |
| Exact changed paths | `app/components/gameTodayColliders.ts` **new**, `app/components/SharedGameLobby.tsx` **targeted collision block only**, `scripts/game-today-collision-smoke.mjs` **new**, `docs/game-dev/SHIFT_LOG.md` **this log** |
| Forbidden paths modified | **None**: no `main`, production, app page, site CSS, navigation, profile, feed, Quran, GoLive, database, other world modules or dependencies |

### Before → after: implemented behavior (not a proposal)

**Before:** The shared `SharedGameLobby` render loop rebuilt approximately **251 static Today colliders plus 80 destructible prop colliders every animation frame**. In the Muhammad ﷺ historical scene it rebuilt another 122 historical solids and then truncated a combined array to 128 entries, accidentally allowing **six Today plaza props** to appear as invisible historical collision objects. Existing Jurassic/Future collision indices were already cached; Today had not received that optimization.

**After:**

1. New `gameTodayColliders.ts` extracts the **same 251 Today static footprints** (office walls, Main Street shops, bridge rails, satellite district buildings, mountains, trees, arena, city towers) into `createTodayStaticColliders(terrain)`, cached by `createTodayCollisionSource` at **one initialization per mounted game renderer**. The underlying spatial broadphase is Bot A's existing `buildStaticGameCollisionIndex`; all static solids remain active at any draw distance.
2. **80 existing plaza props** are indexed once in `TODAY_PROP_COLLIDERS`. The composite `query` filters only the nearby props against the **live** `damagedStructures.current` map, so a destroyed prop stops blocking immediately and automatically becomes solid again when its original five-minute repair expiry is removed. No reindexing per shot or frame.
3. **Muhammad ﷺ era** now uses a separate `PROPHETIC_COLLISION_INDEX` with its original **122 historical building colliders**, without the six phantom Today props. Masjid an-Nabawi, prayer controls, historical scene geometry and no-blaster rule are not changed.
4. `SharedGameLobby.tsx` keeps the **same** blaster-versus-prop hit count, power scaling, damage broadcast, and repair timer. The Today collision source is allocated once in the existing WebGL effect. Existing `resolveHorizontalGameMovement` and `resolveVerticalGameMovement` remain untouched; aircraft, ship, EVA, lunar, Jurassic, Future, Moses and Roman-specific collision dispatch is unchanged.
5. Added reproducible `node scripts/game-today-collision-smoke.mjs` for indexed-vs-direct horizontal/vertical parity, collider counts, damaged/repair toggles, and historical isolation. It loads the actual TypeScript helpers through the repository's installed `typescript` package.

**Performance expectation, not a measured FPS claim:** avoids per-frame creation of hundreds of static collision objects and reduces spatial collision candidates to nearby geometry. No mobile profiling or benchmark numbers have been obtained.

### Verification, failures and limitations

| Check | Result |
| --- | --- |
| GitHub compare against direct Bot B parent | **PASS** before log: exactly 3 paths, `SharedGameLobby.tsx`, new `gameTodayColliders.ts`, new smoke script; no non-game paths |
| Initial non-production preview | **FAILED** at commit `2f5a148`: parser caught `z:-380-row*40` where a local variable declaration needed `z=-380-row*40`. This was corrected in game-only commit **`3970595`**; do not use the failed preview |
| Corrected non-production preview | **PASS / READY** for corrected code commit `3970595` at non-production deployment `dpl_C1Xk3x24anV1MbVq6FW2AKLUZwUB` ([preview](https://1muslim-jfix7mwp4-elmiandco.vercel.app)). Vercel logged successful Next.js compilation, type/lint checking, build completion and deployment completion. Existing CSS/autoprefixer warnings were nonfatal; this is not a real-device gameplay test |
| Reproducible smoke script | **Committed but not executed in a full repository checkout**. Run `node scripts/game-today-collision-smoke.mjs` and existing `node scripts/game-physics-smoke.mjs` before integration; do not claim test success without execution |
| Mobile/browser gameplay | **NOT VERIFIED**: device FPS, prop break/repair multiplayer sync, roof/bridge traversal, historical spawn/portal, office entry and collisions require manual testing |
| Regression scope | No modifications to existing gamePhysics, flight pose, Jurassic, Future, Moses, Roman, Space, Nabawi scene renderers, or Belt Boyz office geometry |

### World-by-world coordination

| World | This shift | Follow-up |
| --- | --- | --- |
| Today / Main Street / Belt Boyz / satellite districts | **Changed** collision source caching and live prop filtering; original 251 static and 80 props retained | Device-test shop/office entrances, roofless Council, boost collisions, damage/repair and FPS |
| Muhammad ﷺ era / Makkah–Madinah / Masjid an-Nabawi | **Changed** historical collision source isolation; removes 6 unintended invisible Today props | Verify historical spawn and prayer zones; plan respectful seven-circuit tawaf and sa'i separately |
| Jurassic | **Preserved** A cached tree/cave collision and dinosaurs; B ecology still separate | Coordinate selective fern/dragonfly patch and device collision tests |
| Future / RealMecca concept | **Preserved** A cached 76 tower/skyway colliders; B gardens remain separate | Test flight/skyway landing and integrate gardens only after review |
| Moses / Parted Sea | **Preserved** B 2,743m sea crossing, refuges and collision | Device test and ambience |
| Roman Judea / ancient Rome | **Preserved** latest B scene, portal, olive trees and separate indexed colliders | Bot B owns visual/ambient refinement; don't overwrite scene |
| Space / Moon | **Preserved** independent EVA, lunar, ship and plane physics | Test high-altitude handoff and no altitude reset |
| Other districts | **Preserved** map/portals/navigation, game controls and voice code | Continue performance profiling and physics audits |

### Dependencies, integration/rollback, and next shift

- **Dependencies:** none added. Uses existing `gamePhysics.ts` spatial-index API and `typescript` already present in the repository for smoke tests. The new index is in memory only; no Supabase migration or persistent data change.
- **Cross-shift ownership:** Bot A owns `gameTodayColliders.ts`, `gamePhysics.ts`, shared movement/flight; Bot B owns `RomanJudeaScene.ts`, `PartedSeaScene.ts`, `JurassicScene.ts`, `FutureCityScene.ts` scenery. `SharedGameLobby.tsx` is a shared wiring hotspot: Bot B must apply **targeted hunks** to a newer A lobby rather than replacing the whole file.
- **Selective integration:** At the future site integration time, fetch fresh production/main and layout contracts; start from the **then-current site integration branch**, not this older full app tree. Add only `gameTodayColliders.ts`, the `SharedGameLobby.tsx` import, one-time `todayCollisionSource` creation and the isolated collision block, plus optional smoke script. If the site/game lobby changed, manually transplant and review these hunks. Never cherry-pick a full branch merge or copy `app/page.tsx` / old navigation / profile / feed / Quran / GoLive / CSS.
- **Rollback:** Revert the targeted Today collision wiring and new helper (or cherry-pick-revert the game implementation commits on a future integration branch). Restore the previous inline `solids` block only if needed; do not revert unrelated B Roman/Moses changes or site files.
- **Next Bot A:** Execute smoke scripts in a full checkout, measure mobile FPS, audit broadphase against destructible props and fast-boost movement, then consider dynamic obstacle collision caching and continuous diagonal/vertical landing sweeps. Do not claim all objects are solid.
- **Unfinished user backlog:** aimed blaster reliability and audio, force field, persistent raised hands, spatial speaking indicators, XP shop, Hajj/prayer NPCs, ten enterable mosques and richer ambient life **not implemented this shift**.

**Cross-reference:** [Bot B Roman shift](https://github.com/ElmiandCo/1Muslim/tree/game/living-worlds-roman-judea-restored-20261027-1230), [Bot A prior flight shift](https://github.com/ElmiandCo/1Muslim/tree/game/world-engine-directional-flight-20261027-1200), [master issue #126](https://github.com/ElmiandCo/1Muslim/issues/126). **No production merge or deployment.**

---

> **Protected integration rule:** This repository's website evolves independently. Never merge a whole game branch into main or production. Cherry-pick only reviewed game-path commits onto the *then-current* website integration branch. Preserve the newer feed, profile, Quran, navigation, GoLive, and site CSS. No automated production merge/deploy.

## 2026-10-27 · 12:10–12:13 CDT (America/Chicago) · Bot B / Living Worlds — Roman Judea and Rome restored

### Provenance, current site contracts, and coordination

| Item | Recorded evidence |
| --- | --- |
| Bot | **Game Bot B — Living Worlds**; this shift owns historical Roman/Judea environment only |
| Protected original baseline | `fix/profile-scroll-match-umma-20261027` @ **`c856491131bb0c8056693652f8e5e58a26836831`**, read-only |
| Direct game-code starting point | **`game/world-engine-directional-flight-20261027-1200` @ `d85e262925651d9e933bf9d497bb430465d3fae9`**; descendant of Bot B Moses and Bot A physics/LOD work |
| Working branch | **`game/living-worlds-roman-judea-restored-20261027-1230`**; implementation+fix head **`548218cf9d83d3770b916329ad0ca4a8c38c4d51`** (log commit follows) |
| Source recovered, not replaced | Original **`elite/roman-judea-world`**, especially its Jerusalem/Rome renderer, world portal and collider coordinates; the old full lobby and `app/page.tsx` were **not** copied |
| Prior shifts inspected | Bot B 10:34 Moses restoration at `game/living-worlds-moses-playable-20261027-1100`; Bot A 11:58 directional flight handoff and prior swept collision; older Roman branch geometry |
| Current main / production at audit | `main` @ **`21119c711beda86de3f7766b18bdb0e1c39028d0`**, Vercel production READY at same SHA; read-only, no production writes |
| Site layout contract | `app/page.tsx` blob **`92ca9b5`** and `SharedGameLobby.module.css` blob **`952bdfc`** match main/frozen; `CanvasSecondaryApp.tsx` site branch differs, **untouched** |
| Exact changed paths | `app/components/RomanJudeaScene.ts` **new**; `app/components/SharedGameLobby.tsx` **targeted game wiring**; `scripts/game-roman-smoke.mjs` **new**; `docs/game-dev/SHIFT_LOG.md` **this log** |
| Forbidden paths touched | **None**: no main, production, app page, navigation, feed, profile, Quran, GoLive, site CSS, database, or unrelated assets |

### Implemented, not proposed

**Before:** `Time of Jesus` was present in the world picker but displayed *Preview pending*. An older `elite/roman-judea-world` branch had an independently playable Roman-era Jerusalem and ancient Rome, but its whole `SharedGameLobby` and `app/page.tsx` were stale and incompatible with Bot A's newer physics and Bot B's connected Moses world.

**After:** `Time of Jesus` now enters a **historically interpretive Roman Judea/Jerusalem world** through the current shared renderer, avatar, camera, flight, movement and presence engine. The original gold arch at (0,-90) switches between Jerusalem and ancient Rome, and a small 🏛️ HUD button provides the same switch. Return-to-lobby uses the existing globe control. Original roads, 72 stone-building placements, market stalls, walls, hills, Roman forum, amphitheater, arches, aqueduct, 34 stylized travelers/soldiers and two city identities are preserved as scene geometry, **not** reconstructed from scratch.

- `RomanJudeaScene.ts`: Extracted the older world's exact interpretive environment drawing into `renderRomanJudea`; `paint` limits cube submissions to objects within 250m plus object half-width/depth. Added **36 deterministic, animated olive trees** beyond the original walls, with nearby leaf clusters and understory at 55m, full tree skip beyond 125m. Foliage intentionally decorative/non-solid; no new textures, downloads, audio permissions, React state or dependencies.
- **Collision**: Recovered original houses, two long walls, northern/southern fortification segments and 16 market counters as stable `GameCollider` geometry; Rome adds the original forum building. `romanJudeaCollisionIndex` builds one static spatial index per city with **Bot A's existing** `buildStaticGameCollisionIndex`; physics remains independent of draw-distance LOD. Central spawn (0,125) and arch (0,-90) were checked for clearance.
- `SharedGameLobby.tsx`: Added isolated Roman refs/state and enter/exit/portal switch, world-picker wiring, bounds, correct static collision index selection, ground floor, sky, render dispatch, disabled Today-only animals/vehicles/worker/shop/portal prompts while in Rome, and existing globe return. The prior game world's draw/physics branches remain intact.
- **Historical integrity**: No depictions of Jesus or other prophets. Buildings, hills and Roman-era features are artistic interpretations; **the Colosseum-inspired motif is not a claim that the Colosseum existed during Jesus' lifetime**. Ancient Rome and Jerusalem are connected by a fantasy travel portal, not a claim of geographical proximity.
- **Explicitly not implemented**: No server-authoritative NPCs, voice upgrades, XP-shop purchases, ten new mosques, tawaf/sa'i, or Roman combat missions. Those remain backlog.

### Verification and limitations

| Check | Result |
| --- | --- |
| Game-only diff against direct Bot A starting tip | **PASS**: only `RomanJudeaScene.ts`, `SharedGameLobby.tsx`, and `game-roman-smoke.mjs` before this log; no Bot A physics file or site file edited |
| 17 equivalent source/geometry assertions | **PASS (connector-side JS checks)**: selector, render, Bot A broadphase, bounds, portal, HUD, existing Moses/Jurassic/Future/Nabawi/Belt Boyz source markers, historical module, olive groves, LOD, and spawn/portal collider clearance |
| Reproducible repository script | **Added** `node scripts/game-roman-smoke.mjs`; script was **not** executed in a full checkout, so no claim of test-run pass |
| First non-production preview build | **FAILED**: original extracted renderer was missing one closing Jerusalem branch brace; build log `Expected '}', got '<eof>'` in `RomanJudeaScene.ts` |
| Correction | **Committed** `548218c`: closed the original Jerusalem branch before the new olive-grove loop; final preview build status recorded below |
| Full Next.js build | **PASS / READY** for corrected code commit `548218c` on non-production preview `dpl_5vWXQaRSaaMAEAr8CzfJBTxqodTn` ([open preview](https://1muslim-debdsb3j1-elmiandco.vercel.app)). Next.js compiled in **16.0s**, completed type/lint checking, generated **101/101** pages and logged **Deployment completed**. Existing CSS/autoprefixer and edge-runtime warnings were nonfatal. Documentation-only commits follow this verified code commit |
| Browser/mobile gameplay and FPS | **NOT VERIFIED**; requires real walkthrough of Jerusalem → arch → Rome → return, collision near market/walls, device GPU/CPU and multiplayer behavior |

### World-by-world progress and cross-shift checklist

| World / mode | Evidence-based status in this branch | Next priority |
| --- | --- | --- |
| **Jerusalem / Roman Judea / Jesus-era** | **THIS SHIFT:** old scene restored and connected, portal between Jerusalem/Rome, static colliders and olive grove LOD. No prophet depicted; preview/device verification pending | Walk entire scene on iPhone, inspect Roman architecture, collision/arch camera, refine ambient sound and crowd animation |
| **Moses / Parted Sea** | **Inherited from B 10:34**: 2,743m crossing connected with fish, soldiers, 9 refuges and collision; unchanged | Device test, water wall animation and ambient audio; do not overwrite module |
| **Jurassic** | **Inherited** dinosaur scene, Apex cave and Bot A collision; B 07:30 ferns/dragonflies remain on a separate branch | Selectively integrate ecology after collision/LOD review |
| **Future / RealMecca concept** | **Inherited** towers/skyways and Bot A collisions; B 08:30 six gardens/42 flowers/6 pollinators remain separate | Selective garden integration and mobile lighting |
| **Muhammad ﷺ era / Makkah–Madinah** | **Preserved unchanged** interpretive Makkah, Kaaba, Madinah, Masjid an-Nabawi and prayer controls | Respectful generic Hajj NPC tawaf seven circuits → Safa–Marwa, congregational prayer; historical framing |
| **Today / Main Street / Belt Boyz** | **Preserved unchanged** Council meeting, roofless office, shop, vehicle and five districts | Shield, hand-pose persistence, speaker UI and XP-shop reliability; coordinate with A |
| **Space / Moon / Blessed Chambers concept** | **Preserved** ship, moon landing, observatory; separate Blessed Chambers module not verified | Lunar flora-free ambient identity, lights and navigation |
| **Other districts** | Nile Quarter, Courtyard City, Skyline City, Beach City and Grand Metro unchanged | Each gets distinct life and material accents with measured LOD |

### Integration, rollback, and next-shift contract

1. **Never merge the whole branch.** At integration time fetch the then-current site production/main head; start a fresh integration branch there. Cherry-pick or manually transplant **only** Roman game changes in `RomanJudeaScene.ts` and targeted `SharedGameLobby.tsx` wiring. The older `elite/roman-judea-world` page/lobby must never be copied wholesale.
2. **Bot A conflict gate:** Bot A owns `gamePhysics.ts`, `gameWorldColliders.ts`, `gameFlightPose.ts`, flight and shared movement. This shift **does not edit those**; use the new Roman static index with A's latest API. If Bot A has changed the lobby, manually patch the Roman imports/flags/dispatch/guards onto A's newer file rather than overwriting it.
3. **Rollback:** Revert the Roman module, its import, state/portal handlers, bounds/collision/render dispatch and HUD/picker branches only; leave Bot A, Moses, Jurassic, Future and site intact. No database migration or asset rollback.
4. **Next Bot B shift:** First verify actual preview and iPhone portal traversal; if stable, enrich the historical world with market ambient activity (distance-culled, culturally respectful), then continue world-by-world. Do not confuse artistic reconstruction with documented history.
5. **Unfinished cross-world backlog:** XP shop, aimed blasters/audio, force field, raised-hand hold, active-speaker UI, Hajj NPCs, prayer congregations and 10 enterable mosques. None claimed done here.

**Cross references:** Bot A directional-flight shift (prior section below); [original Roman branch](https://github.com/ElmiandCo/1Muslim/tree/elite/roman-judea-world); [game master issue #126](https://github.com/ElmiandCo/1Muslim/issues/126). **No production merge or deploy.**

---

## 2026-10-27 · 11:58–12:03 CDT (America/Chicago) · Bot A / World Engine — directional flight, free-fall and landing poses

### Provenance and no-regression audit

| Contract | Verified outcome |
| --- | --- |
| Frozen preview source | `fix/profile-scroll-match-umma-20261027` @ **`c856491131bb0c8056693652f8e5e58a26836831`**, read-only |
| Starting GAME code | **`game/world-engine-spatial-broadphase-20261027-1100` @ `63db7b1ad8c3affff3b5d3b64b213870f54f3f87`**; inherits earlier A collision and B's connected Moses world |
| Dedicated working branch | **`game/world-engine-directional-flight-20261027-1200`**; last implementation commit **`48ed10a86dee62e92d4c0dd69169244029e20da9`** (this documentation-only commit follows) |
| Other shift reviewed | Bot B 10:34 CDT `game/living-worlds-moses-playable-20261027-1100` @ `536a9605b626f561bb42007f8698609015e48736`; already in A's parent ancestry. B's Jurassic ferns/dragonflies and Future gardens are **separate branches**, not silently integrated |
| Latest main read-only | `main` @ `21119c711beda86de3f7766b18bdb0e1c39028d0`; site differs from frozen preview in community API, canvas CSS, CanvasSecondaryApp, profile hub, video entry, Supabase migration. **No site files copied or edited** |
| Frozen production branch | `release/frozen-production-2026-10-27-perfect-for-you` @ `4e2a6c56bfbc75bd93560f6a02a2799deb885487`; unchanged |
| Live production read-only | Vercel `dpl_3KxxhG8pRxuy64rN4D1Jn9jzgPHy`, READY, `main` @ `21119c7`; **no production deployment or merge** |
| Layout contract | `app/page.tsx` blob `92ca9b5` identical main/frozen; `SharedGameLobby.module.css` blob `952bdfc` identical; `CanvasSecondaryApp.tsx` differs (`ac34d6b` main, `4db1706` frozen). All untouched |
| Changed paths, exactly | **`app/components/gameFlightPose.ts` (new), `app/components/SharedGameLobby.tsx` (targeted avatar rendering), `scripts/game-flight-pose-smoke.mjs` (new), `docs/game-dev/SHIFT_LOG.md` (this handoff)** |
| Dependency / data changes | **None**; no packages, routes, pages, CSS, schemas, navigation, profile, feed, Quran, GoLive or scene modules changed |

### Implemented (and explicitly not implemented)

**Before:** The existing `SharedGameLobby` avatar renderer used one flying pose regardless of rising, descending or coasting, and a generic walk/bob animation even when falling without flight. Takeoff and landing had timestamps and a crouch but no direction-dependent body language or pulse. Existing high-altitude physics, swept collisions, roof landing, and cached Jurassic/Future broadphase already worked independently.

**After:** A pure, deterministic, world-independent `calculateGameFlightPose` helper in `gameFlightPose.ts` classifies `takeoff`, `ascending`, `descending`, `cruise`, `falling`, `landing`, and `grounded` from the existing flying flag, vertical speed, clearance above the current collision/terrain floor and animation timestamps. It returns lightweight numeric torso lean, head offset, arm lift, leg lift and trail slope; it **does not change physics, gravity, altitude limits, collider geometry or networking**.

`SharedGameLobby.tsx` consumes the helper inside its existing avatar primitive renderer. Rising increases arm lift and tilts blue trails upward; descending lowers the arms, bends the legs and warms trails to amber; ordinary non-flight free-fall tucks the legs and lifts arms; moving forward while flying adds a modest lean. Takeoff and touchdown each have one brief translucent expanding ground pulse, reusing the existing WebGL box draw. Landing crouch and collision-based landing remain intact. This affects the **shared avatar renderer**, so the same local visual behavior applies to Today, Jurassic, Future, Moses and Muhammad ﷺ environments wherever their ordinary player motion path is used; no scene was replaced. Remote peers use a neutral cruise fallback because vertical velocity is **not** currently sent in presence updates; no claim of synchronized remote directional poses.

**Preserved:** No edits to `JurassicScene.ts`, `FutureCityScene.ts`, `PartedSeaScene.ts`, `gamePhysics.ts`, `gameWorldColliders.ts`, Masjid an-Nabawi prayer posture, the roofless Belt Boyz Council, portals, ship/EVA/Moon-specific physics, weapons, shield or XP store. The existing prayer-pose early return still takes precedence in the sacred area. High-altitude flight has no new reset/clamp. The new rendering does **not** create ten mosques, Hajj NPCs or server-authoritative systems.

### Verification and limits

| Check | Result / evidence |
| --- | --- |
| GitHub change isolation | **PASS:** compare against direct parent shows exactly 3 implementation/test game paths, no site paths; documentation is fourth |
| Isolated flight-pose numerical test | **PASS:** 16 deterministic assertions for ascent, descent, forward lean, takeoff, high-altitude cruise, falling, ground contact, landing and neutral pose, using a local copy of the actual helper and TypeScript transpilation; exit 0 |
| Strict isolated TypeScript helper check | **PASS:** `tsc --strict --noEmit --target ES2022 --module commonjs --skipLibCheck gameFlightPose.ts`, TypeScript 5.8.3; exit 0 |
| Repository smoke script | **Added** `node scripts/game-flight-pose-smoke.mjs` with the same 16 cases; it has not yet been executed in a full repository checkout. Previous A physics and B Moses smoke results are inherited, **not rerun this shift** |
| Full preview build | **PASS / READY:** non-production Vercel `dpl_8Dv4q2mwnVCCfwiCx2fNdQZFRQkf`, tested commit `48ed10a`, [preview](https://1muslim-p1xtdng2m-elmiandco.vercel.app). Next.js 15.5.26 compiled in **12.4s**, lint/type validity phase completed, 101/101 static pages generated, build completed in 54s. Existing CSS/autoprefixer/edge warnings non-fatal. The subsequent log commits are documentation-only |
| Browser/mobile validation | **NOT VERIFIED:** no physical device, visual animation capture, FPS/GC profiling or multiplayer pose sync test |
| Performance | Pure helper is constant-time per visible avatar; takeoff/landing add one draw call for only the local avatar during the short pulse. No measured FPS claim; seven existing trail segments remain unchanged |

### World matrix and next-shift integration

| World | Verified scope / preservation | Next check |
| --- | --- | --- |
| Today / Main Street / Belt Boyz | Shared avatar pose updated; existing dynamic collision, store, roofless Council and meeting unchanged | Mobile frame pacing, rooftop landing, boost collisions; cache dynamic solids safely |
| Jurassic | Shared pose update; existing cached 1,439 solid broadphase, dinosaur/cave rendering untouched | Real-device cave ceilings and falling from trees; B fern/dragonfly module still separate |
| Future / futuristic / RealMecca concept | Shared pose update; existing 76 tower/skyway colliders untouched. No separately verified RealMecca scene module | Skyway takeoff and descent, distant tower LOD, B garden integration as targeted scene diff |
| Moses / Parted Sea | Shared pose update; nine refuge solids, NPCs, dry crossing and exit untouched | Long crossing, fall/land at refuge, mobile camera; preserve B's source |
| Muhammad ﷺ era / Masjid an-Nabawi | Shared pose update outside existing prayer override; Nabawi and prayer actions unchanged | Respectful NPC tawaf/sa'i and prayer additions in B-owned scene work |
| Space / Moon / EVA / ship / plane | Dedicated vehicle and lunar movement unchanged; no new physics or network pose updates | Verify spacecraft and EVA avatar rendering separately |
| Jesus / Roman Judea | Existing selector remains preview pending; no old page or scene imported | Extract scene as game-only module, never merge stale page |
| Ten enterable mosques | **Not implemented this shift** | One tested enterable high-ceiling mosque per game-only scene update |

**Integration / rollback:** Fetch newest site main, production and layout contracts again before any approved integration. On a new integration branch, cherry-pick **only** `d51928e` (helper), `6c31679` (test), and `48ed10a` (minimal avatar renderer) **after** confirming A's prior physics and B's Moses work are already present; otherwise first selectively integrate those game-only prerequisites. If `SharedGameLobby.tsx` has changed, apply just the helper import and avatar lines, not the entire 165 KB file. Check `git diff --name-only` excludes app pages/site CSS/navigation/profile/feed/Quran/GoLive/Supabase. Roll back by reverting `48ed10a` and removing the isolated helper/test if no other consumers. No deployment to production, no merge into main.

**Next Bot A:** verify build status; run all three game smoke scripts on a complete checkout, test animation on iPhone/desktop, profile mobile FPS, and improve dynamic Today collider allocations without altering destruction/repair. **Next Bot B:** use this branch tip for new scene work; leave shared pose/physics helpers alone and add only isolated world modules. Prioritize respectful ambient NPCs, architecture and scenery; preserve the Moses, Jurassic, Future, Space, Nabawi and Belt Boyz baselines. No full-branch site merge.

**Cross-references:** [previous Bot A broadphase](https://github.com/ElmiandCo/1Muslim/tree/game/world-engine-spatial-broadphase-20261027-1100) · [Bot B Moses handoff](https://github.com/ElmiandCo/1Muslim/tree/game/living-worlds-moses-playable-20261027-1100) · [game master issue #126](https://github.com/ElmiandCo/1Muslim/issues/126).

---

## 2026-10-27 · 11:04–11:09 CDT (America/Chicago) · Bot A / World Engine — cached collision broadphase across Jurassic and Future

### Provenance, contracts, isolation

| Field | Verified source / outcome |
| --- | --- |
| Protected source baseline | `fix/profile-scroll-match-umma-20261027` @ `c856491131bb0c8056693652f8e5e58a26836831`; preserved without write |
| Current main checked read-only | `main` @ `21119c711beda86de3f7766b18bdb0e1c39028d0`; GitHub comparison shows site-only differences in community posts API, CSS, CanvasSecondaryApp, GameLabProfileHub, ImmersiveVideoEntry, Supabase migration |
| Frozen production branch checked read-only | `release/frozen-production-2026-10-27-perfect-for-you` @ `4e2a6c56bfbc75bd93560f6a02a2799deb885487`; protected baseline is six commits ahead and no site files were copied |
| Live production inspected read-only | Vercel `dpl_3KxxhG8pRxuy64rN4D1Jn9jzgPHy` READY, `main` @ `21119c7`; **no production write** |
| Latest Living Worlds handoff reviewed | Bot B `game/living-worlds-moses-playable-20261027-1100` @ `536a9605b626f561bb42007f8698609015e48736`, a descendant of latest Bot A 10:00 work and frozen baseline. Read its detailed 10:34 handoff before changes |
| Starting game-only branch and SHA | `game/living-worlds-moses-playable-20261027-1100` @ `536a9605b626f561bb42007f8698609015e48736` (retains Moses selection, Parted Sea, Jurassic solids, Future skyways, flight, Belt Boyz office, Nabawi) |
| New work branch | **`game/world-engine-spatial-broadphase-20261027-1100`**; tested implementation commit **`eb84106a850cd0da8c39fe20b230915d18e4a545`**; log-only commit follows |
| Site/layout contracts | `app/page.tsx`, `CanvasSecondaryApp.tsx`, `SharedGameLobby.module.css`, site CSS, profile, feed, Quran, GoLive, navigation, database all **untouched**. The entire branch ancestry is game-only relative to protected preview baseline |
| Exact paths changed in this shift | `app/components/gamePhysics.ts`, `app/components/gameWorldColliders.ts`, `app/components/SharedGameLobby.tsx`, `scripts/game-physics-smoke.mjs`, `docs/game-dev/SHIFT_LOG.md` only |

### Implemented and verified — not just planned

**Before:** Each rendered frame, `resolveHorizontalGameMovement` filtered **every** static Jurassic collider (1,439 volumes) or Future collider (76 volumes) for local movement. `resolveVerticalGameMovement` scanned the entire world collider array for roof/underside crossings, even when most objects were kilometers away. These loops ran in the player physics hot path and scaled with total world size rather than nearby geometry.

**After:** `gamePhysics.ts` exports `buildStaticGameCollisionIndex`, `GameCollisionIndex`, and `GameCollisionSource`. A fixed-size X/Z spatial grid stores references to each static collider in all overlapping cells. `query` returns only AABB-overlapping candidates and deduplicates colliders spanning multiple cells. Both the existing horizontal swept/sliding solver and crossing-aware vertical roof/ceiling solver accept either a plain array or the indexed source; existing dynamic and small-world callers remain compatible. No vertical height cap or visual draw-distance dependency was introduced.

`gameWorldColliders.ts` builds `JURASSIC_COLLISION_INDEX` and `FUTURE_COLLISION_INDEX` **once at module initialization** from existing, unchanged scene geometry. `SharedGameLobby.tsx` now selects those cached indexes for Jurassic/Future; it leaves Today's destructible/dynamic solids, Muhammad ﷺ era solids, Moses's nine refuge colliders, moon/EVA, planes/ships, player pose, network packets and all scene renderers unchanged. Collision still exists for geometry visually culled at distance. No scene module, mosque, or Belt Boyz geometry was edited.

**Regression tests:** `scripts/game-physics-smoke.mjs` now checks 288 exact JSON-result parity cases comparing indexed versus full-scan horizontal and vertical collision across Jurassic, Future and multi-cell synthetic volumes; plus four index edge cases (locality, large cross-cell solids, deduplication, empty cells, invalid size). The original 23 legacy assertions remain. The two intermediate test failures were test-expectation mistakes (a second distinct wall was present in a dedup query; VM RangeError prototypes differ) and were corrected in separate commits; implementation logic was not changed to hide them.

### Verification and performance evidence

| Check | Outcome |
| --- | --- |
| Existing game physics smoke | **PASS**: 23 legacy assertions + 288 indexed parity comparisons + 4 index edge cases; sandbox exit 0 |
| Bot B Moses world smoke | **PASS**: `node scripts/game-moses-smoke.mjs`; exit 0; selector, refuges, NPCs, shots and preservation checks |
| Strict isolated TypeScript check | **PASS**: `tsc --strict --noEmit --target ES2022 --module commonjs --skipLibCheck --lib ES2022,DOM` over `gamePhysics.ts`, `gameWorldColliders.ts`, `JurassicScene.ts`, `FutureCityScene.ts`, `PartedSeaScene.ts`; exit 0, TS 5.8.3 |
| Path isolation | **PASS**: GitHub compare versus direct Bot B parent showed exactly four game/test paths before adding this log; no site paths |
| Node microbenchmark (Vercel sandbox, 1,000 movement+vertical position pairs per world, same sample positions, single pass) | **Jurassic:** 1,439 solids, raw **415.06 ms**, indexed **7.74 ms**; **Future:** 76 solids, raw **34.07 ms**, indexed **7.60 ms**. These are isolated CPU timings, **not** browser FPS or device battery measurements; results are environment/sample dependent |
| Full Next.js preview build | **PASS / READY** for tested commit `eb84106` on non-production Vercel deployment `dpl_DCc5JYRD4MKGPQKHBGVHQeajzqbz` ([preview](https://1muslim-fu6lwfk45-elmiandco.vercel.app)); Next.js compiled successfully in 15.9s, type/lint phase completed, 101/101 static pages generated. Existing edge-runtime/CSS warnings non-fatal |
| Real device gameplay/mobile GPU/FPS | **NOT VERIFIED**; desktop/iPhone actual collision and frame pacing remain next-shift work |

### Per-world status and boundaries

| World | This shift's verified scope | Follow-up |
| --- | --- | --- |
| Jurassic | **New** cached spatial broadphase for 1,439 existing tree, rock and cave solids; existing cave route and dinosaur scene preserved | Real-device cave approach, collision edge cases, frame profiling; Bot B fern/dragonfly scene still separate |
| Future / Futuristic / RealMecca concept | **New** cached broadphase for 76 tower/skyway solids; no changes to skyway geometry, render LOD or travel bounds | Validate skyway ceiling/landing on mobile; integrate B gardens as game-only scene diff after collision review; RealMecca distinct module not asserted |
| Moses / Parted Sea | **Inherited unchanged** from latest Bot B; nine static refuge colliders continue through the array-compatible physics API | Real-device 2,743m traversal, water wall/cave overlap checks; optional index only if scene grows |
| Muhammad ﷺ era / Makkah–Madinah / Masjid an-Nabawi | **Inherited unchanged**; no modifications to prayer controls, mosque, Kaaba or NPCs | Respectful tawaf/sa'i and praying NPCs; audit solid enterable architecture |
| Today / Main Street / Belt Boyz | **Inherited unchanged**; dynamic destructible solids remain on array path, roofless Belt Boyz Council retained | Dynamic broadphase only after careful damage/repair invalidation design; shield, store, blaster, voice and hand pose backlog |
| Space / Moon / Blessed Chambers | **Inherited unchanged**; dedicated vehicle/EVA/lunar physics bypasses new index | Ship/spaceflight physics and high-altitude real-device testing |
| Jesus / Roman Judea | Still **preview pending** in current shared selector; no scene claimed | B to extract game-only source without old app layout |
| Ten enterable high-ceiling mosques | **Not implemented** in this shift | Build verified enterable geometry incrementally; retain Nabawi |

### Integration, rollback, dependencies, next shifts

1. **No merge or production deployment.** This branch is a descendant of an older frozen website snapshot; **never merge the full branch** into today's main or production. Preserve newer site layout, two-nav design, profile scroll, feed, Quran and GoLive.
2. **Selective integration:** Re-fetch current website integration branch before approval; review and cherry-pick only this shift's game commits or apply reviewed hunks in `gamePhysics.ts`, `gameWorldColliders.ts`, and the two index references/import in `SharedGameLobby.tsx`. Preserve Bot B's Moses additions and A's prior collision helpers. Bring smoke script and handoff optionally; reject any changed app pages, site CSS, site navigation, Supabase or profile/feed files.
3. **Rollback:** Revert this shift's index wiring/import in `SharedGameLobby.tsx`, index exports in `gameWorldColliders.ts`, and broadphase types/functions in `gamePhysics.ts`; retain prior Jurassic/Future arrays and original swept/vertical solvers. Commits: `8478c4a`, `b8a0e88`, `0e3479f`, `72cc360`, `ee26f6b`, `eb84106` (tests last three). No migration or package change.
4. **Bot B handoff:** Build future scene/NPC/mosque improvements atop **this new branch** after confirming current tip and no concurrent A changes. Do not replace `SharedGameLobby.tsx` wholesale or edit physics API without coordination. Existing B `PartedSeaScene.ts` and `scripts/game-moses-smoke.mjs` remain unchanged.
5. **Bot A next:** profile static-grid query allocations/GC on mobile; test flying diagonally into raised bridges, boosted movement, high-altitude descent and landing animations; optimize dynamic Today collision generation separately without breaking destructible prop restoration. Consider collision grids for large Moses extensions only after performance evidence.
6. **Unfinished feature backlog:** directional takeoff/falling/landing polish, full enterable collision for all visible buildings, world-specific LOD, richer XP store, blaster reliability/sounds, visible shield, persistent raised hand, proximity voice indicators, ambient life, Hajj/prayer NPCs, ten large mosques. No completion claims for these.

**Cross-shift references:** [Bot B 10:34 Moses branch](https://github.com/ElmiandCo/1Muslim/tree/game/living-worlds-moses-playable-20261027-1100) · [Bot A 10:00 solids branch](https://github.com/ElmiandCo/1Muslim/tree/game/world-engine-jurassic-solids-20261027-1000) · [Master game issue #126](https://github.com/ElmiandCo/1Muslim/issues/126).

---

## 2026-10-27 · 10:34–10:37 CDT (America/Chicago) · Bot B / Living Worlds — Moses world connected to shared game

### Provenance and strict no-regression gate

| Contract | Verified source / action |
| --- | --- |
| Original protected baseline | `fix/profile-scroll-match-umma-20261027` @ **`c856491131bb0c8056693652f8e5e58a26836831`**; unchanged |
| Direct game-only starting point | Latest Bot A `game/world-engine-jurassic-solids-20261027-1000` @ **`9828f3478f304af86144311a3767fcf232ba0de6`**, descendant of protected baseline; preserves Bot A swept movement, Jurassic/Future solids, vertical landing, LOD, flight |
| Working branch | **`game/living-worlds-moses-playable-20261027-1100`**, created from A's exact branch tip; not from an old Moses lobby |
| Last implementation + smoke-test SHA | **`0dedf91acf75c38822b78a82fd5dff6f6376d390`** (documentation commit follows) |
| Bot B module source | Previous independent Moses recovery `game/living-worlds-moses-shoals-20261027-0930` @ `d43998ea6ccd2aa9678445d5bc585d6926fbb8ab`; earlier original `titan/parted-sea-world` consulted via prior handoff |
| Other shift's handoff read | Bot A 10:00 shift log on `game/world-engine-jurassic-solids-20261027-1000`, Bot B 09:30 Moses log, Bot B 08:30 Future gardens log, game issue #126 |
| Current main inspected before edits | `main` @ **`21119c711beda86de3f7766b18bdb0e1c39028d0`**; differs from frozen baseline in six **site-only** paths. No main write |
| Current production inspected before edits | Vercel `dpl_3KxxhG8pRxuy64rN4D1Jn9jzgPHy` **READY**, `main` @ `21119c7`. No production write |
| Layout contracts inspected | `app/page.tsx` identical main/frozen (blob `92ca9b5`); `SharedGameLobby.module.css` identical (blob `952bdfc`); `CanvasSecondaryApp.tsx` main blob `ac34d6b` vs frozen `4db1706`. **None edited or copied** |
| Exact changed paths | **`app/components/PartedSeaScene.ts` (new game module), `app/components/SharedGameLobby.tsx` (game-only minimal wiring atop A), `scripts/game-moses-smoke.mjs` (new test), `docs/game-dev/SHIFT_LOG.md` (this log)** |
| Forbidden paths | **None touched**: no app pages, site CSS, navigation, feed, profile, Qur'an, GoLive, Supabase, main, production, Belt Boyz geometry, Masjid an-Nabawi or Bot A physics modules |

### Implemented this shift — existing Moses world now selectable and rendered (not merely proposed)

**Before:** The world selector showed **Time of Moses — Preview pending**; the original 2,743m crossing with water walls, NPCs, refuges and portals existed only in isolated `PartedSeaScene.ts` on a different branch, not reachable from the current shared game. Bot A's newest engine had no Moses flag, movement bounds, render switch or NPC updates.

**After:** The existing `Time of Moses` entry now enters a **real playable Parted Sea environment** through the current shared game engine. The same player, avatar, camera, touch/keyboard movement, flight, existing blaster shots, multiplayer presence and return-to-main control are reused. No replacement game engine or stale app UI was imported.

- **`PartedSeaScene.ts`**: preserved `SEA_LENGTH` 2743, 21.34m-wide dry crossing, animated water walls, entrance/far-shore portal arches, nine rocky refuge volumes, 25 generic travelers, 22 initial pursuing soldiers, bounded reinforcements, projectile hits, 26 five-fish shoals with bubbles and near-wall foam. Added **distance culling for hit sparks** so distant fights no longer draw 14 offscreen impact particles. No prophet depiction or invented historical certainty; Sinai is a labeled **future destination**, not a finished map.
- **`SharedGameLobby.tsx` / world entry**: `partedSeaWorldRef`, `partedSeaState`, `enterPartedSeaWorld`, `exitPartedSeaWorld`, selector label and return button. Entry starts at the corridor midpoint looking toward the far shore; exit returns to Today's spawn. Clears old shots and disables incompatible ship/plane/Moon/Council modes at entry.
- **`SharedGameLobby.tsx` / movement**: `SEA_BOUNDS` enforces dry passage; static cached `SEA_COLLIDERS` from the original nine refuge boxes is passed into **Bot A's existing** `resolveHorizontalGameMovement` and `resolveVerticalGameMovement`. Sea floor = 0. Today-only city props, wildlife, bridge-fall reset, vehicles, shop prompts, portal overlays and worker interactions are excluded while inside Moses; all other worlds keep their previous branches.
- **`SharedGameLobby.tsx` / combat + rendering**: projectiles now remember their previous X/Y/Z for segment hits; `updatePartedSea` advances NPCs and consumes confirmed shots; three soldier strikes respawn at the crossing midpoint; multiplayer blaster damage also respawns inside the sea rather than Today's city. `renderPartedSea` draws through the existing WebGL renderer, with a sea-specific sky color and same avatar/peer rendering. Reaching the far shore shows a one-time destination hint.
- **`scripts/game-moses-smoke.mjs`**: added reproducible source-based checks for bounds, nine solid refuges, 25 travelers, 22 soldiers, traveler movement, swept aimed projectile hit, LOD/offscreen impact culling, world selector, return control, respawn and preservation of A physics + Nabawi/Belt Boyz source markers.

### Verification and honest limitations

| Check | Result |
| --- | --- |
| Latest main/production/site contract vs frozen baseline | **PASS, read-only**; identified six site-path differences and preserved A's direct game-only descendant |
| GitHub diff vs latest A tip | **PASS:** only the three game/test paths listed above before this log; A physics files untouched |
| Moses smoke test in Vercel sandbox at `0dedf91` | **PASS:** `node scripts/game-moses-smoke.mjs` (bounds, NPCs, swept shot, refuge collision, draw culling, wiring/respawn assertions) |
| Existing Bot A physics regression suite | **PASS:** `node scripts/game-physics-smoke.mjs` reports **23 assertions passed** |
| Strict isolated TypeScript type check | **PASS:** `tsc --strict --noEmit --target ES2022 --module commonjs --skipLibCheck --lib ES2022,DOM` for `PartedSeaScene.ts`, `gamePhysics.ts`, `gameWorldColliders.ts`, `JurassicScene.ts`, `FutureCityScene.ts`; exit 0 |
| Next.js full preview build | **PASS / READY** for final runtime+test commit `0dedf91`: Vercel preview `dpl_5oLQY9gaXC5P9FJK7bLMP2XA7oJN` ([open preview](https://1muslim-hl4tfyuly-elmiandco.vercel.app)); Next.js compiled successfully in 17.8s, type/lint phase completed, generated 101/101 pages, deployment READY. Existing webpack/CSS/edge-runtime warnings non-fatal. Later commits are documentation-only |
| Real in-browser world selection / iPhone FPS / multiplayer combat | **NOT VERIFIED**; source smoke + build are not a substitute for touch controls, camera, portal interaction or GPU profiling |
| Persistence and authority | NPC combat and waves remain **client-local**. No server-authoritative combat, XP economy or cross-client soldier synchronization was implemented |
| Performance | Cached 9 refuge colliders; existing wall/shoal distance culling; sparks now culled outside 190m. Real device FPS and network traffic still unmeasured |

### World-by-world progress checklist and cross-shift coverage

| World | Verified current state in this branch | Next action |
| --- | --- | --- |
| **Moses / Parted Sea** | **THIS SHIFT IMPLEMENTED:** existing module connected to world selector, movement, Bot A collision, NPC simulation, combat, renderer, return button. 26 fish shoals + foam retained; impact culling added. | Real iPhone and desktop walkthrough, check near/far arches and 2,743m traversal; add contextual audio and improve Sinai destination without pretending it's historically certain |
| **Jurassic** | Bot A current branch preserves dinosaur world and adds tree/rock/cave collision. Bot B's earlier 180 ferns + 28 dragonflies remain on **separate** branch, not copied here | Selective integration of B ecology and actual Apex cave/LOD mobile tests |
| **Future / Futuristic / RealMecca concept** | Bot A current branch preserves towers/skyways and solid collisions; Bot B's six luminous gardens/42 blooms/6 pollinators remain **separate**, not copied here | Cherry-pick only garden scene diff after collider clearance review; mobile lighting/FPS |
| **Muhammad ﷺ era / Makkah–Madinah** | Existing interpretive Kaaba, Madinah and Masjid an-Nabawi prayer controls **preserved, unchanged** | Seven tawaf circuits then Safa–Marwa and praying congregations, with respectful generic NPCs; no prophets depicted |
| **Today / Main Street / Belt Boyz / five districts** | Current A physics and **existing** roofless Belt Boyz Council, shop, meeting controls, Nile Quarter, Courtyard City, Skyline City, Beach City, Grand Metro **unchanged** | Richer XP store, stronger aimed blasters/sound, visible force-field, persistent raise-hand pose, speaker indicator |
| **Jesus / Roman Judea / Jerusalem** | Selector remains **Preview pending**. Older `elite/roman-judea-world` modifies `SharedGameLobby.tsx` and `app/page.tsx` and diverges heavily from frozen baseline; **never merge wholesale** | Inspect old interpretive scene geometry, extract game-only module, connect with minimal current-lobby patch |
| **Space / Moon / Blessed Chambers** | Existing ship, Moon, EVA and flight behavior preserved. No separately verified Blessed Chambers module | Distinct lunar ambience, flight/vehicle collision testing with A |
| **Other districts / world portals** | Existing routing unchanged except enabling Moses in the existing picker | Continue world-specific architecture, plants, NPCs, sound and interactive details without replacing existing assets |
| **Ten enterable high-ceiling mosques** | **Not implemented** in this shift; existing Nabawi landmark preserved | Plan a distinct geometry+collision module with A and deliver one tested mosque at a time |

### Integration, rollback, Bot A coordination and next shift

1. **No production merge/deployment.** This branch inherits the *frozen* site's older snapshot, so it must **not** be merged wholesale into current `main` or production. Automatic Vercel preview builds are non-production only.
2. **Selective site integration:** At approved integration time, fetch the newest site head and Bot A head again. Apply A's game physics/LOD commits first if absent; then selectively bring the **game-only** changes in `PartedSeaScene.ts` and the minimal Moses-specific hunks in `SharedGameLobby.tsx` (do not replace the entire shared lobby if newer A work exists). Bring the smoke script optionally. Never copy older `app/page.tsx`, `CanvasSecondaryApp.tsx`, profile, feed, GoLive, CSS or other site files.
3. **Conflict gate:** `git diff --name-only` must show only reviewed game paths. If A added further collision/flight changes to `SharedGameLobby.tsx`, manually apply the Moses import/state/entry/exit, sea bounds/solids, update/render and return-picker hunks onto A's newest file, then rerun both smoke tests and full build.
4. **Rollback:** On an integration branch, revert the isolated Moses module addition and the Moses-only lobby wiring (or revert code commits `2d48b52`, `731a7d3`, `73ad3c2`, `ab753ac` and smoke-test commits as appropriate). Leave A physics and every unrelated world intact.
5. **Next Bot B priority:** real preview walk-through and iPhone FPS; then inspect/recover `elite/roman-judea-world` on a **new** game-only branch. Do not alter A's physics files; coordinate A for 2,743m traversal and collision broadphase.
6. **Longer backlog, not completed:** server-authoritative XP shop, blaster audio/accuracy, shields, persistent hand pose, voice/speaker indicator, Hajj/sa'i/prayer NPCs, ten large enterable mosques and unique life in remaining worlds. Do not claim these are finished.

**Cross references:** [Bot A 10:00 branch](https://github.com/ElmiandCo/1Muslim/tree/game/world-engine-jurassic-solids-20261027-1000) · [Bot B 09:30 Moses source](https://github.com/ElmiandCo/1Muslim/blob/game/living-worlds-moses-shoals-20261027-0930/docs/game-dev/SHIFT_LOG.md) · [Bot B 08:30 Future gardens](https://github.com/ElmiandCo/1Muslim/tree/game/living-worlds-future-gardens-20261027-0830) · [Game master issue #126](https://github.com/ElmiandCo/1Muslim/issues/126).

---

## 2026-10-27 · 09:59–10:06 CDT (America/Chicago) · Bot A / World Engine — Jurassic solids, Future skyways and vertical collision

### Source of truth, isolation and coordination

| Field | Verified value |
| --- | --- |
| Bot / responsibility | **Game Bot A — World Engine**, shared physics, collision and rendering; not site development |
| Frozen original game baseline | `fix/profile-scroll-match-umma-20261027` / **`c856491131bb0c8056693652f8e5e58a26836831`**, unchanged |
| Direct starting game-only branch | `game/world-engine-swept-collision-20261027-0900` / **`4e3f86835f0df395f9d55b4f478a9f630d0f8067`**; its ancestry is the frozen preview and includes A's previous flight/LOD and swept-collision work |
| New independent working branch | **`game/world-engine-jurassic-solids-20261027-1000`**; last implementation/test SHA **`e8735ab6861dd62a69fecf75b153c14d09cea49f`**; the documentation update becomes the final tip |
| Current main checked read-only | **`21119c711beda86de3f7766b18bdb0e1c39028d0`**. Main vs frozen preview is **diverged** (frozen preview 19 commits ahead, 3 behind at comparison); the six changed site paths are community-posts API, full-screen CSS, CanvasSecondaryApp, GameLabProfileHub, ImmersiveVideoEntry and community-media migration |
| Current production checked read-only | Vercel **READY** `dpl_3KxxhG8pRxuy64rN4D1Jn9jzgPHy`, source `main` at **`21119c7`**; no deployment or merge to this target |
| Layout contracts read-only | `app/page.tsx` is identical on main and frozen preview (blob `92ca9b5`); `SharedGameLobby.module.css` is identical (blob `952bdfc`); `CanvasSecondaryApp.tsx` checked on both (blob `ac34d6b`). No page, CSS, navigation, profile, feed, Quran, GoLive, or production files edited |
| Bot B latest handoff reviewed | **09:30 CDT** on `game/living-worlds-moses-shoals-20261027-0930`: recovered `PartedSeaScene.ts` with fish shoals/foam, **not wired** into frozen shared lobby; implementation **`d43998ea6ccd2aa9678445d5bc585d6926fbb8ab`**. Earlier B Future gardens **`afe199c`** and Jurassic river life **`e05ef735`** remain separate. No B-owned scene file overwritten |
| Exact changed paths this shift | **`app/components/gameWorldColliders.ts` (new); `app/components/gamePhysics.ts` (extended); `app/components/SharedGameLobby.tsx` (targeted wiring); `scripts/game-physics-smoke.mjs` (new tests); `docs/game-dev/SHIFT_LOG.md` (this handoff)** |
| Forbidden path changes | **None**. Relative to previous A tip, GitHub compare shows only the four implementation/test paths above before this log commit. No database, package, asset, scene module, or site changes |

### Verified implementation (what changed, and what did not)

1. **`gameWorldColliders.ts` — static Jurassic solids built from existing geometry.** Before, `SharedGameLobby.render(now)` passed **no collider array** in Jurassic, even though `JurassicScene.ts` exported deterministic trees/rocks and a separate `jurassicBlocked` function that was not called. Now the shared swept X/Z resolver receives reusable volumes for **650 scene trees (trunks plus elevated canopies, excluding the cave-clearance zone), 130 scene rocks (excluding cave-clearance zone), 30 existing cave-ring basalt towers, and nine visible cave columns/lintels/tunnel walls/roof segments**. Objects are filtered by their existing scene coordinates; no dinosaurs, terrain, geometry, doors, portals or rendered art were replaced. Cave mouth and tunnel center are deliberately left open. These are conservative **axis-aligned box approximations**, not per-triangle collision meshes.
2. **`gameWorldColliders.ts` — Future geometry cached and expanded.** Before, 64 Future tower boxes were reallocated with `FUTURE_TOWERS.map` every rendered frame; elevated glass skyways and their support posts had no corresponding collider volumes. Now a static `FUTURE_COLLIDERS` array retains the **same 64 tower footprints** and adds **four existing skyway decks and eight visible support posts**. Skyway landing/floor code in `FutureCityScene.ts` remains unchanged; Bot B's gardens stay isolated.
3. **`gamePhysics.ts` — `resolveVerticalGameMovement`.** Added a pure, crossing-aware helper that lands descending feet on the **first solid top crossed** and stops ascending heads at **raised undersides** (e.g. bridges, cave lintels). Already-intersecting/spawned-inside geometry is not teleported; arbitrary high-altitude travel is not clamped. Horizontal swept sliding remains intact.
4. **`SharedGameLobby.tsx` — existing `render(now)` only.** The Jurassic world now passes its static scene colliders into the previously built horizontal sweep; Future uses cached colliders. After ordinary player gravity/flight integration, the new vertical helper corrects roof/underside crossings, clears upward velocity on ceiling impact, and uses the **existing** landing/crash pose when a solid top is reached. Dedicated ship, plane, EVA, Moon and seated Council movement paths are exempt. No changes to world selector, player/network packet format, camera, game HUD, blaster economy, prayer UI, Belt Boyz roof, Masjid an-Nabawi, or production layouts.
5. **`scripts/game-physics-smoke.mjs` — reproducible source-based tests.** Loads the **actual TypeScript source** of the physics and world scene modules using the already-declared TypeScript dev dependency. Checks thin-wall boost tunneling, wall sliding, escape from overlapping geometry, vertical ceilings/roofs, high-altitude freedom, Jurassic tree solids and cave entry, Future bridge underside, and geometry counts. No `package.json` changes.

**Commits in order (game-only):** `4d938c2f00c6930f34028d9601dac2ee4a3b2dde` (Jurassic/Future static geometry), `f5ad48dc0e2d9f19c5a340c444872afca3a579ac` (vertical resolver), `1a734b5b83cb9ef9ae73c3100a0cc8978d7696e8` (Future skyways), `833b7c9a3e5df3383ccb5d2253d9b0c79f27492b` (lobby wiring), `a707365a4bc27d82f93e69b5af0d3c300bfe757c` (smoke tests), `e8735ab6861dd62a69fecf75b153c14d09cea49f` (test output count).

### Verification and honest limits

| Verification | Evidence/result |
| --- | --- |
| Frozen baseline and current main comparison | **PASS read-only**: branch ancestry unchanged, main/site layout drift identified; no forbidden files copied |
| GitHub path gate | **PASS**: against previous A branch, only `SharedGameLobby.tsx`, `gamePhysics.ts`, `gameWorldColliders.ts`, `scripts/game-physics-smoke.mjs`; adding this log is the fifth game-only path |
| Real source smoke tests | **PASS**: `node scripts/game-physics-smoke.mjs` on a fresh Vercel sandbox cloned at **`e8735ab`**; **23 assertions passed**, exit code 0. Sandbox dependency setup used isolated temporary TypeScript 5.8.3; no repository dependency changes |
| Strict helper/scene typecheck | **PASS**: `tsc --strict --noEmit --target ES2022 --module commonjs --skipLibCheck --lib ES2022,DOM` on `gamePhysics.ts`, `gameWorldColliders.ts`, `JurassicScene.ts`, `FutureCityScene.ts`; exit code 0 |
| Non-production Next.js build | **READY**: Vercel preview `dpl_CRhD9hFLv1b45MfZ46RsoB7MiYec` built the **`833b7c9` implementation** in 52s; completed output/deployment with non-fatal existing webpack CSS-cache and other warnings. [Preview](https://1muslim-h1w8xmy3p-elmiandco.vercel.app) · [Build details](https://vercel.com/elmiandco/1muslim/CRhD9hFLv1b45MfZ46RsoB7MiYec). Later smoke-test/documentation commits do not modify runtime code |
| Browser gameplay, multiplayer and mobile FPS | **NOT VERIFIED**: no real device playtest, frame profiler, or full player-controlled cave traversal |
| Collision completeness | **PARTIAL**: tree/canopy and cave boxes approximate existing visuals; other decorative plants, water, moving dinosaurs, vehicles, some district and sacred structures still lack audited solids. Do not claim everything is solid |
| Performance and risk | **Unmeasured on mobile**: static arrays avoid per-frame Future allocation, but shared horizontal broadphase scans all Jurassic colliders once per frame and vertical resolver scans them again; monitor low-end iPhones and consider a spatial index if needed. Tall cave volumes and canopy approximation may overblock edges. No added network calls/assets/dependencies |

### World-by-world status and ownership

| World | This shift's verified effect | Remaining work / regression gate |
| --- | --- | --- |
| **Jurassic / Apex cave** | **Changed:** static tree-trunk, canopy, rock, cave ring/entrance and secret-tunnel wall/roof collisions through shared sweep; terrain and dinosaurs preserved | Test tree collision at boost, cave doorway and secret tunnel, aerial canopy, Apex attack, mobile FPS; Bot B river ferns/dragonflies are **not included** in this branch |
| **Future / futuristic / RealMecca concept** | **Changed:** static 64 tower volumes, four elevated skyway decks and eight supports; overhead flight blocked and top landings supported | Verify 32m skyway traversal and tower rooftops; Bot B's six gardens/42 flowers/pollinators remain on separate branch |
| **Today / Main Street / five districts** | **Preserved** previous A swept walls, roof/fall, high-altitude flying and LOD; new vertical helper applies to existing raised colliders | Test elevated bridge undersides, office and shops, damage/repair, high-altitude descents; no new city objects |
| **Muhammad ﷺ era / Makkah–Madinah / Masjid an-Nabawi** | **Preserved** original interpretive geometry, prayer controls and solid-building list; shared vertical crossing helper applies where applicable | Respectful tawaf seven circuits then Safa–Marwa, prayer NPCs and many enterable mosques are **not implemented** |
| **Moses / Parted Sea** | **No code copied or replaced.** Bot B recovered and enhanced independent `PartedSeaScene.ts` on its own branch | Wire only minimal game-only import/state/render/movement patch into newest A lobby after review; no old lobby replacement |
| **Jesus / Roman Judea** | **Unchanged** preview-pending selector; no unverified claim of playable world | Inspect independent existing branch before wiring |
| **Space / Moon / ship / EVA / aircraft** | **Preserved** dedicated physics, atmosphere/ship travel and high-altitude flight | Separate vehicle collisions, EVA re-entry and lunar tests |
| **Belt Boyz / Council** | **Unchanged** roofless office/meeting geometry, seat mode and UI; no page/style edits | Real preview verification; persistent raised-hand character pose still pending |

### Integration, rollback, handoff to Bot B and next Bot A shift

- **Do not merge this branch wholesale** into main, production or the site integration branch. It contains an **older website snapshot** from the frozen preview. At the moment of approved integration, fetch the latest site main/production/preview head again, compare changed paths, and create a fresh site integration branch. Cherry-pick **game-only implementation commits** from previous A in order (`e37c717` flight/LOD, `7900bcab` helper, `e1641d4` sweep wiring) if not already present, then **this shift's `4d938c2`, `f5ad48d`, `1a734b5`, `833b7c9`**. The smoke test commits are optional; documentation is reference only. Check `git diff --name-only` before and after. If newer game changes exist in `SharedGameLobby.tsx`, apply only the import/collider selection/vertical integration hunks instead of overwriting the whole file.
- **Bot B coordination:** B owns `JurassicScene.ts`, `FutureCityScene.ts`, and `PartedSeaScene.ts`; A did **not edit** those files. New `gameWorldColliders.ts` references their existing exported geometry, so after B changes, retest that exports/footprints still match. B's independent Jurassic ecology, Future gardens and Moses shoals should be selectively integrated without replacing this A physics. If B adds new solid structures, extend the collider builder with matching boxes; never couple physics to visual LOD culling.
- **Rollback:** on an approved integration branch, revert **`833b7c9`** (lobby wiring) first, then **`1a734b5`**, **`f5ad48d`**, **`4d938c2`** as needed. Previous A flight/sweep changes can remain independently. No database migration, production changes, or UI rollback required.
- **Next A priority:** (1) real iPhone/desktop Jurassic cave and Future skyway collision walkthrough, profile frame time and collider broadphase; (2) investigate true directional pitch/roll and smooth takeoff/fall/landing avatar animation without breaking networked players; (3) verify raised structures and open building doors in every world, add conservative spatial indexing if mobile FPS suffers; (4) review B's Moses scene wiring contract and only then implement minimal game-only integration. **Not delivered here:** Hajj NPC routes, ten enterable mosques, XP store authority, sound/force-field, voice indicators, blaster accuracy, persistent hand pose.
- **Approval gate:** **main, production and the frozen preview branch were not modified or deployed.** Non-production build verification is not production promotion.

**Cross-references:** [Bot B 09:30 Moses handoff](https://github.com/ElmiandCo/1Muslim/blob/game/living-worlds-moses-shoals-20261027-0930/docs/game-dev/SHIFT_LOG.md) · [Bot A 09:00 swept collision](https://github.com/ElmiandCo/1Muslim/tree/game/world-engine-swept-collision-20261027-0900) · [Game master issue #126](https://github.com/ElmiandCo/1Muslim/issues/126).

---

## 2026-10-27 · 09:08 CDT (America/Chicago) · Bot A / World Engine — boosted-movement collision sweep

### Shift identity, protected baseline, and scope

| Field | Observed fact |
| --- | --- |
| Bot | **Game Bot A — World Engine**, physics/LOD/rendering ownership |
| Protected original game source | `fix/profile-scroll-match-umma-20261027` at **`c856491131bb0c8056693652f8e5e58a26836831`** |
| Direct starting base | Prior A game-only branch `game/world-engine-flight-lod-20261027-0800` at **`86009f72699f02e03167203cd995e2b60825c865`**, descendant of the protected original; preserves A's high-altitude flight and Main Street render culling |
| This shift's branch | **`game/world-engine-swept-collision-20261027-0900`**, created from exact previous A tip; implementation tip **`e1641d4dc9e419dd6a74966bead2942047530c86`**; documentation tip before this status update **`5a684901d5bf454335daff841f0b29c293633f69`** (this update becomes new tip) |
| Implementation commits | **`7900bcab81ca6c9c770d3130ead0b67513b35af2`** (new physics helper), **`e1641d4dc9e419dd6a74966bead2942047530c86`** (shared lobby wiring) |
| Latest main inspected | `main` at **`d9e9cc6052456e308a75a2ee67057ec9f146ca42`**; read-only; protected baseline differs in **six site files** (profile, community, feed, site CSS, Supabase migration); no copying/merging |
| Production inspected | Vercel **READY** production deployment `dpl_FeWANe7U6pB6vYdF8122FqJTjBfF` sourced from `feature/animated-image-text-cards-20261027` at **`e3b38d088fe119a8b03a4d35e64c31ea625b25bf`**; read-only |
| Site layout contract inspected | `CanvasSecondaryApp.tsx` on protected baseline and main; main blob `ac34d6b22f11604389638195a5a29c4fde9fc08b`; game CSS main blob `952bdfc33081d49bc88bbdd3e441fe84f9eace41`; neither edited |
| Other shift reviewed | Bot B 08:30 Future gardens on `game/living-worlds-future-gardens-20261027-0830` (implementation `0b4f9bb` and passing fix **`afe199c2999d6651df29a6fa335ba9507042bad8`**); prior B Jurassic river-life **`e05ef735086e0e01b84531f802c9117be1cc5f19`**. Both remain on **separate** branches and files |
| Exact paths changed this shift | **`app/components/gamePhysics.ts`** (added), **`app/components/SharedGameLobby.tsx`** (modified), **`docs/game-dev/SHIFT_LOG.md`** (this handoff) |
| Forbidden paths changed | **None**: no app page, layout, navigation, profile, feed, Quran, GoLive, site CSS, production, main, or other world modules |

### Actual implementation (not planned features)

**Problem before:** The shared player loop tested collision **only at the final X/Z endpoint** of each rendered frame. A boosted flight frame can travel ~3.7 world units (49.5 × 1.5 high-altitude speed × 0.05s), skipping narrow existing solid geometry entirely. The old resolution pushed the player out of one wall and reset both axes, impeding smooth wall-following. Rendering LOD and physical collision must remain independent.

**After:**

1. **`app/components/gamePhysics.ts` / `resolveHorizontalGameMovement`:** new small, dependency-free, pure TypeScript helper. Subdivides X/Z travel into at most **0.6 world-unit** steps, uses a swept AABB broadphase to limit candidate solids, checks each axis separately for wall sliding, and permits an already-overlapping player to escape outward. Retains the existing **0.42 player radius**, **1.75 body height**, roof tolerance/reach, and returns the final roof candidate separately. The helper changes neither geometry nor world data.
2. **`SharedGameLobby.tsx` / existing `render(now)` movement block:** imports the helper and replaces the endpoint-only collision loop. The same per-world collider sources remain: **`FUTURE_TOWERS`**, existing interpretive-era solids, and Today/Main Street solids; existing exemptions remain for **ship, plane, EVA, lunar walking, and Council seat**. The resolved X/Z and roof feed the **existing** floor/gravity/landing rules. Existing crash pose on wall contact is preserved; the former backward bounce was replaced with axis sliding.
3. **Preservation:** No change to A's no-ceiling flight integrator, terminal fall speed, takeoff/landing pose, Main Street distance guards, world selector, Masjid an-Nabawi, Belt Boyz Council geometry, projectiles, NPCs, multiplayer, XP store, or B's Jurassic/Future files. The change is **collision detection for already-defined solids**, **not** a claim that every rendered object is solid.

### Verification, evidence, and limits

| Check | Result |
| --- | --- |
| GitHub static source/wiring | **PASS:** helper exported/imported, substeps and roof scan present, old endpoint-only block removed, Jurassic/Future/Nabawi/Space references remain |
| TypeScript isolated helper | **PASS (local mirror):** `tsc --target es2020 --module commonjs --strict --skipLibCheck` compiled a standalone copy of the new helper; no external dependencies |
| Physics smoke tests | **PASS (local helper mirror, 7 assertions):** boosted thin-wall crossing blocked, diagonal wall slide succeeds, roof landing allowed, high-altitude travel unblocked, escape from overlapping geometry, empty-world travel, distant 500-collider broadphase. **Not a browser playtest** |
| GitHub path diff gate | **PASS before handoff:** relative to prior A branch, exactly `SharedGameLobby.tsx` (15 additions / 22 deletions) and `gamePhysics.ts` (75 additions) |
| Non-production preview build | **Compilation PASS:** Next.js compiled in 11.1s; logs entered lint/type validity and generated 101/101 static pages for implementation commit `e1641d4`. Deployment `dpl_DFXXvxjif18e3tAJNcppzYEV4gCU` subsequently reached **READY**, with GitHub Vercel combined status **success** for implementation commit `e1641d4`; no production promotion. Existing autoprefixer, edge-runtime and webpack cache warnings were non-fatal in observed logs |
| Runtime gameplay / mobile FPS | **NOT VERIFIED:** no device-controlled walkthrough, profiler trace, or multiplayer session in this run |
| Collision coverage | **PARTIAL:** only pre-existing collider arrays; no audit of all buildings/objects, collision mesh generation, swept vertical fall, or vehicle collisions. Roof behavior depends on pre-existing `floor` logic |
| Performance | Broadphase is O(all colliders) once per frame; local substeps are O(nearby × movement/0.6). No measured FPS. Existing solids are still reconstructed each frame in lobby; optimize later only after profiling |

**Non-production build:** [Vercel deployment](https://vercel.com/elmiandco/1muslim/DFXXvxjif18e3tAJNcppzYEV4gCU) · [Preview URL](https://1muslim-78o4az1zv-elmiandco.vercel.app) (check READY before testing). No manual production deployment or promotion.

### World-by-world status / cross-shift ownership

| Existing world | This A shift | Required next verification |
| --- | --- | --- |
| Today / Main Street / districts | **CHANGED:** shared horizontal swept movement against existing destructible props, avenue walls, towers, trees, road/bridge obstacles. Previous A's distance rendering retained | Test boosted crossing of thin shop/bridge walls, rooftop entry, sliding, collision with damaged props, mobile FPS |
| Future / futuristic / RealMecca concept | **CHANGED via shared resolver only:** existing `FUTURE_TOWERS` collisions; skyway floor logic unchanged. Bot B's six gardens/42 blooms are **separate**, not in this branch | Verify tower walls, skyways and gardens after selective integration |
| Jurassic | **PRESERVED:** existing `jurassicBlocked`, terrain, dinosaurs, cave, Apex. Shared collider helper is passed an empty array in Jurassic because its bespoke terrain/blocked logic remains separate; **no claim** this fixes Jurassic collisions | Audit `jurassicBlocked` integration and high-speed motion; incorporate B's river ferns/dragonflies only via targeted game diff |
| Time of Muhammad ﷺ / Makkah–Madinah | **CHANGED via shared resolver only:** existing interpretive-era building solids; Kaaba/Nabawi and prayer controls unchanged | Confirm enterable passages, no sacred-area firing, floor and wall boundaries |
| Moses / Parted Sea | **NOT WIRED/CHANGED** in protected baseline; Bot B found older `titan/parted-sea-world` module `PartedSeaScene.ts` | Inspect and selectively port game-only module without copying older shared lobby or website |
| Time of Jesus / Roman Judea | **UNCHANGED / preview pending** on protected baseline | Locate independent scene code before planning integration |
| Space / Moon / EVA / ship / aircraft | **UNCHANGED dedicated movement**; resolver intentionally bypasses solids for these modes; A's ordinary high-altitude flying remains | Verify transitions and high-altitude return on device; dedicated vehicle collision is future work |
| Belt Boyz / Council | **UNCHANGED** office mesh, seating and hand controls; seated mode keeps its prior movement exemption | Verify roofless office in final site integration and persistent raise-hand pose separately |

### Integration, rollback, and handoff

- **Do not merge entire branch.** This branch inherits the older protected website snapshot. At integration time re-fetch main, actual production and site's newest layout baseline. Start a **fresh integration branch from the then-current site head**; cherry-pick only reviewed game commits. To include A's preceding flight/LOD slice, consider `e37c717270eaf707705b62fabea9203ea48c09c7`; this shift adds **`7900bcab81ca6c9c770d3130ead0b67513b35af2`** then **`e1641d4dc9e419dd6a74966bead2942047530c86`** in that order. Verify all changed paths are game-only. If `SharedGameLobby.tsx` has newer site/game changes, manually apply only the import and collision block patch, **not** the entire older file.
- **Bot B conflict avoidance:** B edits `FutureCityScene.ts` and `JurassicScene.ts`; A edits `SharedGameLobby.tsx` and adds `gamePhysics.ts`. No shared-world files replaced. B's garden/pollinator and Jurassic life commits can be selectively integrated independently after review. Bot B should not replace A's shared lobby.
- **Rollback:** revert lobby wiring commit `e1641d4` then helper addition `7900bca` on a future integration branch; previous A flight/LOD commit can remain independently. No database or dependency migrations.
- **Next A TODO:** (1) real-device fast-boost wall and roof tests; (2) inspect whether Jurassic's bespoke blocked check is actually called in movement; (3) add non-allocating collision cache or candidate index if profiler shows overhead; (4) validate high-altitude falling and takeoff/landing poses; (5) directional flight pitch animation; (6) audit solids of all existing enterable structures without changing world modules. **Not yet delivered:** 10 mosques, Hajj NPCs, persistent hand pose, blaster/speaker/shield polish, full solid-object coverage.
- **Production and main remain untouched; user approval required for merge/deployment.**

**Cross-references:** Previous Bot A entry below · Bot B 08:30 handoff on [Future gardens branch](https://github.com/ElmiandCo/1Muslim/blob/game/living-worlds-future-gardens-20261027-0830/docs/game-dev/SHIFT_LOG.md) · [Game master issue #126](https://github.com/ElmiandCo/1Muslim/issues/126).

---

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


---

## 2026-10-28 00:00 CDT — Bot A / World Engine: extended Nile banks and Bot B fisheries integration

**Starting protected preview:** `fix/profile-scroll-match-umma-20261027` @ `c8564911`. **Main inspected:** `c043219f` (site drift; unchanged). **Starting GAME base:** `game/world-engine-egypt-palace-market-solids-20261027-2300-a` @ `bd49ed85`. **Working game-only branch:** `game/world-engine-nile-long-banks-20261028-0000-a`; implementation/test tip `61a87757`; detailed docs tip `45fe5b23`. **Bot B source reviewed:** `game/living-worlds-egypt-nile-fisheries-20261027-2350` @ `1b23e9f7` and its per-shift log. **Timestamp:** America/Chicago CDT, UTC 2026-10-28 05:00+.

**Exact game-only paths:** added `app/components/gameEgyptNileExtension.ts` (`b6002e3`), selectively copied B's `app/components/AncientEgyptNileJourneyScene.ts` (`7aa8473`), changed `app/components/gameEgyptWorld.ts` (`9322ade`) and only three Egypt integration anchors in `app/components/SharedGameLobby.tsx` (`b190e18`), added `scripts/game-egypt-long-nile-smoke.mjs` (`61a8775`). New `renderExtendedEgyptNileTerrain()` draws progressive 12m-near/24m-far bank/bed/water strips outside the original ±520 Nile. `EGYPT_NAV_BOUNDS` extends movement Z to ±1700 (3,400 total), while `egyptTerrainFloor()` remains the physics authority. The original center world, Great Pyramid, palace's 149 colliders, Moses return portal, Rome arena, Jurassic, Future, Madinah, Masjid an-Nabawi, Space, Belt Boyz roofless office, meeting, blasters, shield and site contracts are **not replaced**. The B skiffs are **visual-only** and not pilotable.

**Checks:** GitHub compare PASS, only five game paths; 45 V8 assertions executed against GitHub-fetched new renderer and existing terrain-floor function PASS; max sampled extension 378 draw callbacks (not GPU FPS). Native Node smoke is committed but **not run**; mobile/browser/boat physics not tested; preview build status initially **pending**. Outer corridor scenery/NPCs are Bot B's next task. Source-level tests do not prove full gameplay or authoritative multiplayer.

**Integration:** never merge full game branch into site. Freshly compare site head/frozen baseline, cherry-pick only `b6002e3`, `7aa8473`, `9322ade`, `b190e18` or carefully transplant three Egypt lobby hunks. Revert those commits or targeted changes to roll back without touching site code. **No production/main/frozen branch mutation or promotion.** Detailed world-by-world matrix, dependency/rollback notes and next-shift tasks: [2026-10-28-long-nile-0000-a.md](shifts/2026-10-28-long-nile-0000-a.md). Coordinate in [issue #126](https://github.com/ElmiandCo/1Muslim/issues/126).

**Build addendum:** Vercel preview for the full implementation/test commit `61a87757` is **READY**, successful GitHub Vercel status and `Build Completed in /vercel/output [44s]` (non-fatal webpack/CSS cache warnings): https://1muslim-4xjp66ei3-elmiandco.vercel.app . This does **not** verify mobile FPS, native smoke, multiplayer authority or in-browser walking. No production deployment.
