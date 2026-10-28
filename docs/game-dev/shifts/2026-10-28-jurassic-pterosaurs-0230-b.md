# Game Bot B — Jurassic pterosaur flock (2026-10-28 · 02:30 CDT, America/Chicago)

**Owner:** Bot B / Living Worlds (ambient scenery and NPC visuals only).  
**Protected site baseline:** `fix/profile-scroll-match-umma-20261027` @ `c856491131bb0c8056693652f8e5e58a26836831` (read-only).  
**Latest inspected main:** main, with `SharedGameLobby.tsx` blob `dc1ac60b62a17f8269a8228b880df7ac2c124425` (same as frozen baseline).  
**Additional protected site ref inspected:** `8fa597b1a235aedad1dfe61b37fda0ed8362f346`, read-only.  
**Starting GAME source:** `game/living-worlds-future-sky-couriers-20261028-0130-b` @ `a5e62e51aa32256024cb980a419ae844bde5f337`.  
**Working GAME branch:** `game/living-worlds-jurassic-pterosaurs-20261028-0230-b`.  
**Implementation commits:** `6f4a7f0380f906c50389a6cd1c7ae49727a0b81b` (new module), `ffdd462d96985867bd68793e25046a5a5d09ab03` (Jurassic-only integration), `a7c5703bc635e63c17596ad83ca9e85036401714` (smoke test). Documentation commit follows.

## Preflight and cross-bot coordination

Read `app/components/JurassicScene.ts` and latest Bot B master shift log. Read Bot A's [Rome lion handoff](https://github.com/ElmiandCo/1Muslim/blob/game/world-engine-rome-lion-20261028-0200-a/docs/game-dev/shifts/2026-10-28-rome-lion-0200-a.md), which confirms its Rome physics/lion changes are on a **different** branch; do not merge them wholesale. Read `app/layout.tsx` on main and frozen baseline (same blob `106fb71fe188c0ca1893ee7751f3d6ecfd6ee32f`). Verified site `app/page.tsx`, `CanvasSecondaryApp.tsx` and `canvas-fullscreen-v1.css` have differing blobs between main, frozen baseline and newer protected site ref; these files MUST NOT be copied or overwritten. `SharedGameLobby.tsx` main/frozen blob matches, but game branches have distinct improvements and must be selectively integrated.

## Changed paths, before → after

| Path | Before | After | Commit |
| --- | --- | --- | --- |
| `app/components/JurassicPterosaurScene.ts` | Absent | New render-only deterministic flock of **14** animated pterosaurs; 315-unit hard draw cull, 355-unit pre-cull, 155-unit close-detail threshold, wingbeat animation, varied stone/earth tones; no particles/physics | `6f4a7f03` |
| `app/components/JurassicScene.ts` | Existing dinosaurs, giant cave, river, forest, rock-city and collisions | One import and one call to `renderJurassicPterosaurs` inside existing `drawJurassic`; preserves existing logic | `ffdd462d` |
| `scripts/game-jurassic-pterosaurs-smoke.mjs` | Absent | Repeatable Node smoke using TS transpile + VM, 1200 pose and 1200 camera checks, far culling, draw budget, integration anchors | `a7c5703b` |
| `docs/game-dev/shifts/2026-10-28-jurassic-pterosaurs-0230-b.md` | Absent | This handoff | documentation |
| `docs/game-dev/SHIFT_LOG.md` | Previous shifts retained | New summary prepended | documentation |

**Functions:** `jurassicPterosaurPose`, `renderJurassicPterosaurs`, `drawJurassic` (call site only). No modifications to `updateJurassicDinos`, `jurassicBlocked`, `jurassicTerrain`, shared physics, flight, XP, blasters, shields, portals, networking, or site components.

## Verification

- **PASS:** Executed the actual committed TypeScript module source in V8 with TypeScript-only annotations removed; 1,200 time/pose samples and 1,200 camera-position samples, **12,565 assertions**, zero failures; maximum **36 draw callbacks** in sampled views, no distant camera draws, all dimensions/colors finite, positive sizes, and positions within Jurassic bounds.
- **PASS:** GitHub comparison from starting B SHA to implementation/test tip: branch **3 commits ahead, 0 behind**, exactly two game scene files plus one game smoke script. No site files changed.
- **NOT RUN:** committed Node smoke natively, Next.js/TypeScript build, Vercel preview, in-browser gameplay, device FPS, touch controls, screen reader/audio, multiplayer or server-side verification. Source execution alone does not establish a successful full build.
- **Performance:** fixed 14-element flock; no frame-by-frame state mutations or network activity; cheap pre-cull and near/far LOD. Real mobile FPS unmeasured.
- **Limitations:** pterosaurs are scenery, not collidable, hostile, mountable or synchronized multiplayer creatures; visual wingbeat is stylized. Jurassic riverlife already present in prior branches remains unmodified.

## World-by-world no-regression checklist

| World | Status in this branch |
| --- | --- |
| Jurassic | **Advanced this shift:** 14 ambient aerial pterosaurs, deterministic animation and LOD; existing dinos/cave/river preserved |
| Ancient Egypt / long Nile / Great Pyramid | Preserved from B starting branch; no changes to boats, palace, markets, palms, river, portal |
| Moses / Parted Sea | Preserved; no changes to portal or split-sea behavior |
| Rome | Existing Rome scenery from source branch preserved; **Bot A's 02:00 lion work is NOT integrated**; requires selective integration |
| Jerusalem / Roman Judea / Jesus-era | Preserved; no changes |
| Makkah / Madinah / Nabawi / Hajj | Preserved; no changes to congregations or tawaf/sa'i |
| Future / RealMecca | Preserved B 01:30 aerial couriers and earlier koi gardens; no changes |
| Space / Moon / Blessed Chambers | Preserved; no changes |
| Today / Belt Boyz / Meeting | Preserved; roofless office, meeting UX, blaster/XP/shield untouched |

## Integration, rollback, next shift

1. On a fresh integration branch from the **then-current protected site** (not stale main), selectively cherry-pick `6f4a7f03` (new Jurassic scene), `ffdd462d` (only JurassicScene import + render call), and optionally `a7c5703b` (smoke). Do **not** merge the B branch wholesale; it diverges from Bot A's new lion branch. Do not overwrite site pages or game engine.
2. Rollback: remove the import/call and the new isolated module; no saved data, database or network rollback needed.
3. Bot A retains physics/collision/flight, lion, long Nile riverbanks, authoritative shield; Bot B's pterosaurs are purely cosmetic. Coordinate via [issue #126](https://github.com/ElmiandCo/1Muslim/issues/126).
4. Next shift: run native `node scripts/game-jurassic-pterosaurs-smoke.mjs` and Next build; test mobile draw performance; advance Jerusalem/Roman Judea or Moon scenery; selectively integrate Bot A lion work and newer game-only camera/projectile improvements when verified. No deployment or merge to main without explicit user approval.
