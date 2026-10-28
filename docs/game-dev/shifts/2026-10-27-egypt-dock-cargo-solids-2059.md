# Game Bot A / World Engine — Nile dock cargo collision parity

**Shift:** Tuesday, 2026-10-27, 20:59 CDT (America/Chicago)  
**Scope:** game-only; dedicated non-production branch; no main, frozen site, profile/feed/Quran/GoLive, or production changes.

## Baseline and coordination

| Item | Verified |
| --- | --- |
| Protected frozen preview | `fix/profile-scroll-match-umma-20261027` @ `c856491131bb0c8056693652f8e5e58a26836831` |
| Current main (read-only) | `main` @ `c043219f7a3eeb8e1529538013e97f311a3b938a`; layout differs from frozen baseline, so **never merge entire pages** |
| Latest Bot B game source | `game/living-worlds-future-koi-gardens-20261027-2030` @ `d901a021a802ff9b2a11f13238f8d9224c031618` |
| Dedicated work branch | `game/world-engine-egypt-dock-cargo-solids-20261027-2100`, created at the exact Bot B tip above |
| Other-shift handoff reviewed | Bot B's 20:30 Future City koi handoff in `docs/game-dev/shifts/2026-10-27-future-koi-gardens-2030.md` and [coordination issue #126](https://github.com/ElmiandCo/1Muslim/issues/126) |
| Source inspection | `gameEgyptWorld.ts`, `AncientEgyptRiverScene.ts`, `gamePhysics.ts`, `SharedGameLobby.tsx`, Egypt integration smoke and recent commits |

## Implemented (verified source change)

1. **`app/components/gameEgyptWorld.ts`**, `createAncientEgyptColliders()`: the existing Nile dock renderer shows **four** separate limestone cargo cubes on each of the three docks, but the physics index contained only **three** per dock. Players could pass through or fall through the fourth visible cube. Corrected the immutable collider generation from `k<3` to `k<4` and documented the visual/physical parity contract. This adds exactly **three** static colliders, one for each dock's formerly missing fourth cargo cube. Each uses the renderer's actual center and dimensions (x offset `-2+k*1.35`, z offset `-2`, half-size 0.55, height 0.55–1.65). Existing planks, boats, worker animations, Egypt portal, terrain, pyramid, palm trees and scaffolds are untouched. The same prebuilt `EGYPT_COLLISION_INDEX` remains in use regardless of visual draw distance.
2. **`scripts/game-egypt-integration-smoke.mjs`**: added 12 render/solid parity checks plus 12 horizontal boosted-entry checks and 12 downward-landing checks across all three docks/four cargo cubes. The script executes the actual TypeScript modules through the project's TypeScript devDependency when run from a full checkout. **Native Node execution has not yet been performed in this shift.**

**Implementation commit:** [`8873823d`](https://github.com/ElmiandCo/1Muslim/commit/8873823d344d7b0987c2069615f98e48c89175fe)  
**Smoke-test commit:** [`60c43c85`](https://github.com/ElmiandCo/1Muslim/commit/60c43c859621b843ee84982a8175a9f10d39709b)

## Verification and known limits

| Check | Result |
| --- | --- |
| GitHub compare vs exact Bot B source | **PASS:** exactly two changed paths, both game/game-test; +3/-1 game source lines, +26 smoke lines |
| Direct V8 evaluation of GitHub-fetched `createAncientEgyptColliders` with only TS type annotations removed | **PASS:** 12/12 exact cargo collider checks; 199 total static colliders; all finite |
| Direct V8 evaluation of GitHub-fetched `resolveHorizontalGameMovement` and `resolveVerticalGameMovement` with only TS type annotations removed | **PASS:** 24/24 walking-block and landing-height checks across all cargo cubes |
| Scene visual source parity | **PASS:** verified four visible cargo blocks per dock, matching all twelve static volumes |
| Full native Node smoke script | **Not run** (no repository checkout/dependencies in this tool environment) |
| Vercel non-production preview | [Preview deployment](https://1muslim-kiqqct5wh-elmiandco.vercel.app), `dpl_3w8gvUFcKqnDWxC8YmHScAkUMS4H`; **READY verified at 21:00 CDT** (Next.js compiled, type checks completed, 101/101 static pages generated; existing CSS warnings) |
| Physical mobile FPS and player walk/landing | **Pending** |
| Shield server authority and meeting exit UX | **Still pending**; no claim of implementation |

## World-by-world preservation

| World / feature | This shift |
| --- | --- |
| Ancient Egypt / Nile / Great Pyramid | **Updated:** all twelve visible dock cargo cubes now have matching colliders; pyramid-centered arrival and banks unchanged |
| Moses / Parted Sea | Unchanged; reciprocal portals and refuge geometry preserved |
| Futuristic / RealMecca | Unchanged; Bot B's luminous gardens and holographic koi retained |
| Jurassic | Unchanged; dinosaur and collision modules preserved |
| Muhammad-era Makkah / Madinah, Hajj and Masjid an-Nabawi | Unchanged; existing pilgrim and prayer scenes preserved |
| Roman Judea / Jerusalem | Unchanged |
| Space / Moon / Blessed Chambers | Unchanged |
| Today / Belt Boyz office | Unchanged; roofless office preserved |
| Hyper Defense | Existing client-side 10-second shield retained; **server-authoritative protection remains outstanding** |
| Meeting | Existing controls retained; user-friendly rename/Exit Meeting still owned by Bot B |

## Integration, rollback, next shift

**Integration:** Start from the website's then-current integration branch, inspect its layout and game files, then selectively cherry-pick the two game-only commits above (or apply only the 3-line `createAncientEgyptColliders` correction plus the test hunk). Do **not** merge this full branch, replace `app/page.tsx`, or overwrite newer feed/profile/navigation. The fix does not require site changes or new packages. **Rollback:** revert `8873823d` to restore the former three-block collision layout; revert `60c43c` to remove the new tests.

**Bot B handoff:** Continue Egypt visual scenery/worker/river life or other worlds without editing `gameEgyptWorld.ts` collider generation. If changing dock cargo count or positions, coordinate the matching physics change and tests with Bot A. Retain the Great Pyramid center and existing Egypt portals. The Future City koi garden scene from your 20:30 shift is preserved in this branch.

**Next Bot A:** execute native `node scripts/game-egypt-integration-smoke.mjs` in a full checkout; physical-device dock walkthrough, mobile FPS and collision regression; review server-authoritative Hyper Defense implementation path and world-independent high-altitude flight. Preserve the protected frozen website baseline. **No production deploy or merge.**
