# Keemy's Adventure World — Game-only shift log

> **Protected integration rule:** Site and game workstreams are independent. Do not merge this whole branch into main/production. Selectively transplant reviewed game-only changes onto the then-current site/game integration head, preserving newer navigation, feed, profile, Qur'an, GoLive, CSS, and Bot A physics. No automatic production deployment.

## 2026-10-27 · 09:30–09:35 CDT (America/Chicago) · Bot B / Living Worlds — Parted Sea recovered and enriched

### Provenance, coordination and exact scope

| Field | Evidence |
| --- | --- |
| Protected game baseline | `fix/profile-scroll-match-umma-20261027` at **`c856491131bb0c8056693652f8e5e58a26836831`** |
| Working branch | **`game/living-worlds-moses-shoals-20261027-0930`**, created from protected SHA, not from a stale site merge |
| Game implementation commit | **`d43998ea6ccd2aa9678445d5bc585d6926fbb8ab`** |
| Working branch documentation checkpoint | **`0c8c522bc149f1b996761712e6d21cddfe3365f1`** (handoff created); this verification update is documentation-only implementation |
| Current main inspected | **`d9e9cc6052456e308a75a2ee67057ec9f146ca42`**; baseline/main diverged (19 ahead, 1 behind), with six unrelated site paths |
| Production inspected | Vercel **READY** production deployment `dpl_FeWANe7U6pB6vYdF8122FqJTjBfF`, source `feature/animated-image-text-cards-20261027` at **`e3b38d088fe119a8b03a4d35e64c31ea625b25bf`** |
| Site layout contract inspected | `CanvasSecondaryApp.tsx` and `SharedGameLobby.module.css` on protected baseline; read-only |
| Latest Bot A handoff inspected | `game/world-engine-swept-collision-20261027-0900` with swept collision helper `gamePhysics.ts`, shared-lobby wiring `7900bcab` / `e1641d4`; **not copied or edited** |
| Previous Bot B handoff inspected | `game/living-worlds-future-gardens-20261027-0830`, implementation `afe199c`; earlier Jurassic river ecology `e05ef735` |
| Original world source recovered from | `titan/parted-sea-world` / `app/components/PartedSeaScene.ts` (blob `87de93d82cfdb7a13807d51f9b9cb60494617b57`) and `docs/parted-sea-implementation-status.md` |
| Exact changed paths | **Added `app/components/PartedSeaScene.ts`**; **added `docs/game-dev/SHIFT_LOG.md`** |
| Forbidden paths changed | **None**: no shared lobby, app pages, navigation, profile, feed, Qur'an, GoLive, site CSS, main, production, Jurassic, Future City, Nabawi, Belt Boyz or Bot A physics |

### What is actually implemented

**Recovered the original Parted Sea world module** rather than re-creating or replacing it. The original module retains:

- `SEA_LENGTH=2743`, `SEA_WIDTH=21.34`, `SEA_BOUNDS`, midpoint spawn, dry seabed, two animated towering water walls, existing fish, rocky refuges, entrance/Sinai portal arches.
- `createPartedSeaState`: 25 generic fleeing traveler NPCs, 22 initial pursuing soldier NPCs; `updatePartedSea`: bounded wave AI, spear attacks, projectile hits, fall/respawn state; `partedSeaColliders`: existing refuge boxes; `renderPartedSea`: original scene and impact effects. No prophet depiction.
- These are **game modules, not currently connected to the protected baseline's world selector**. This shift deliberately did **not** copy the older `SharedGameLobby.tsx`, which would overwrite Bot A's newer physics and current world features.

**New visual slice (implemented):** living fish shoals and inner-wall foam.

- Added deterministic module-scope `SEA_SHOALS` (**26** sites, spaced 102 game meters along the corridor, on alternating sides).
- Added `renderSeaShoals`: each nearby site has **5 animated fish**, near-only fins and four rising bubble accents, all placed at |X| >= 14.6 **behind the water walls**, outside the dry player corridor (player bounds |X| <= 10.1). Uses existing `now` clock, no timers/assets/imports/dependencies.
- Added intermittent inner-wall foam glints in `renderPartedSea`, visible only within 175 meters and every third seabed segment. They are translucent visual effects, not barriers.
- Culling: shoals farther than 190 meters along Z are skipped; fins/bubbles appear within 105 meters. Module-scope colors and site coordinates avoid generating world lists each frame. Existing 460–470m terrain/wall culling is untouched.
- **Before:** one-off fish silhouettes and uninterrupted wall surface. **After:** schooling aquatic movement behind walls, bubbling, and wind-driven foam near the player, preserving the original crossing.
- **Historical framing:** interpretive game setting, not a claim about exact Exodus dating, location, events, fauna, or the appearance of any prophet.

### Verification / evidence

| Check | Result |
| --- | --- |
| Existing source and handoffs read | **PASS**: protected shared lobby, older Moses scene/wiring/status, Bot A 09:00 log, Bot B 08:30 log, baseline site layout and game CSS |
| Source preservation assertions | **PASS (static)**: `createPartedSeaState`, `updatePartedSea`, `renderPartedSea`, `partedSeaColliders`, bounds, portal arches and soldier NPC code all retained |
| New helper integration | **PASS (static)**: `renderSeaShoals` invoked once from `renderPartedSea`; foam inserted in existing water-wall loop |
| Placement and LOD | **PASS (calculated)**: 26 deterministic sites, Z -76 through -2626 within 2743m corridor; all fish behind |X| 10.1 movement bounds; <= 4 nearby sites per 190m range, near-only extra details |
| Protected baseline diff gate | **PASS** before documentation: only `app/components/PartedSeaScene.ts` added (133 lines); no shared-lobby or site changes |
| Full Next.js / TypeScript preview build | **PASS:** non-production Vercel `dpl_Ebrh4WZkUGSCMbnXpKyK6PbacDbv` reached **READY** for implementation `d43998e`; Next.js compiled in **12.8s**, lint/type-check phase completed, generated **101/101** static pages, build output completed in **60s**. Existing webpack cache, edge-runtime and npm configuration warnings were non-fatal. [Preview build](https://1muslim-a4ymkk75f-elmiandco.vercel.app) is a build verification, **not** a playable Moses world (not wired). |
| Interactive world selector / portals | **NOT TESTED / NOT CONNECTED** in this branch; source module alone does not make the world playable |
| Mobile GPU FPS / multiplayer NPC state | **NOT MEASURED**; original soldiers and hits are client-local, not server-authoritative |

### World-by-world progress checklist

| World | Current evidence / Bot B status | Next slice |
| --- | --- | --- |
| **Moses / Parted Sea** | **THIS SHIFT:** original world module recovered, added 26 distance-culled five-fish shoals and near-wall foam. **Not yet wired** to current world picker | Coordinate with Bot A, wire minimal import/ref/movement/render/portal patch into latest shared lobby; preview playtest; preserve A collision resolver |
| **Future / RealMecca concept** | Prior Bot B separate branch: 6 luminous gardens, 42 flowers, 6 pollinators, passing build | Selectively integrate prior game-only diff; test skyways and garden LOD |
| **Jurassic** | Prior Bot B separate branch: 180 river ferns, 28 dragonflies, passing build; Jurassic exists in protected lobby | Verify mobile cave/Apex, preserve physics and dinosaur attacks |
| **Muhammad ﷺ era / Makkah–Madinah** | Existing historically interpretive Kaaba, Madinah and Nabawi prayer controls in shared lobby, **unchanged** | Respectful seven-circuit tawaf→Safa–Marwa, congregations; do not depict prophets |
| **Today / Belt Boyz / districts** | Existing Belt Boyz office, meeting controls, XP shop, Nile Quarter, Courtyard City, Skyline City, Beach City, Grand Metro **unchanged** | Preserve roofless office; later add richer XP shop, hand pose, voice indicator |
| **Jerusalem / Jesus era** | World picker exists but scene still marked preview pending in inspected baseline; `elite/roman-judea-world` branch exists, not inspected this shift | Inspect existing Roman Judea module before any new geometry |
| **Space / Moon / Blessed Chambers** | Existing ship/moon/EVA in shared lobby, **unchanged** | Distinct lunar ecology/ambience and safe movement without overwriting A flight |
| **Other worlds/portals** | Original selector and existing portal behaviors unchanged | Maintain exact routing and scene identity in future integration |

### Known issues, ownership and next-shift TODO

1. **Top priority — integration:** Bot A owns `SharedGameLobby.tsx`, flight, swept collision, LOD. Do not overwrite it with the old Moses branch. Ask A to integrate the new **isolated module** via a minimal reviewed game-only patch on top of their newest lobby. The old `titan/parted-sea-world` lobby is a **reference**, never a merge target.
2. **Minimal wiring contract:** import `SEA_LENGTH`, `SEA_BOUNDS`, `SEA_SPAWN_Z`, `createPartedSeaState`, `partedSeaColliders`, `updatePartedSea`, `renderPartedSea`; introduce a sea world flag/state and world-picker entry; scope multiplayer presence/shots to the sea; use SEA_BOUNDS + refuge colliders with A's **current swept movement**; update sea NPC simulation; draw sea in the existing render switch; preserve other world/portal branches; add return-to-lobby and entrance/Sinai handling. If preview route is desired, add only a **new game-specific** route after the shared lobby supports `initialWorld`, never replace existing pages.
3. **Physics/performance:** visual shoals and foam are intentionally non-solid and beyond movement bounds. Refuges already have colliders; fish and bubbles do not. Existing NPC local state is not authoritative; no claim of shared enemy combat. Check real iPhone FPS before widening draw distance.
4. **Backlog not completed:** XP-authoritative shop, stronger aimed blasters/sound, force-field collision, persistent raise-hand pose, speaker indicator/voice improvements, Hajj NPC routes, 10 enterable mosques, historical/Jerusalem and lunar ambience. None is implied by this module recovery.
5. **Selective integration:** on the then-current site head, apply **only `app/components/PartedSeaScene.ts`** from implementation commit `d43998ea6ccd2aa9678445d5bc585d6926fbb8ab`; independently review a later minimal shared-lobby patch against Bot A's newest version. Check `git diff --name-only` and build. Do **not** cherry-pick older `titan/parted-sea-world` branch, current B branch as a whole, or any site code.
6. **Rollback:** delete the isolated `PartedSeaScene.ts` file (or revert implementation commit) before wiring; after wiring, revert only the sea import/ref/render/selector patch. All existing worlds, physics, and website should remain intact.

### Cross-shift references

- [Original Parted Sea module](https://github.com/ElmiandCo/1Muslim/blob/titan/parted-sea-world/app/components/PartedSeaScene.ts)
- [Original Parted Sea implementation notes](https://github.com/ElmiandCo/1Muslim/blob/titan/parted-sea-world/docs/parted-sea-implementation-status.md)
- [Bot A 09:00 collision shift](https://github.com/ElmiandCo/1Muslim/tree/game/world-engine-swept-collision-20261027-0900)
- [Bot B 08:30 Future gardens shift](https://github.com/ElmiandCo/1Muslim/tree/game/living-worlds-future-gardens-20261027-0830)
- [Bot B 07:30 Jurassic shift](https://github.com/ElmiandCo/1Muslim/tree/game/living-worlds-jurassic-riverlife-20261027-0730)
- [Game master brief #126](https://github.com/ElmiandCo/1Muslim/issues/126)
