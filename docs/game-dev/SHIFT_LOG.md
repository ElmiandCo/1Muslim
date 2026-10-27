# Keemy's Adventure World — Game-only shift log

> **Protected integration rule:** This repository's website evolves independently. Never merge a whole game branch into main or production. Cherry-pick only reviewed game-path commits onto the *then-current* website integration branch. Preserve the newer feed, profile, Quran, navigation, GoLive, and site CSS. No automated production merge/deploy.

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
| TypeScript/full Next.js build | **Not independently executed**; no local repository checkout or dependency installation available in this shift |
| Preview/CI | GitHub's automatic Vercel **non-production** preview check was **pending/building** at inspection; no production deployment or merge was requested or performed |
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
