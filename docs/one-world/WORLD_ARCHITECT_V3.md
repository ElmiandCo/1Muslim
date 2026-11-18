# World Architect — bounded world index (2026-11-18)

## Delivered
New isolated `lib/one-world/world-index.ts`: canonical geography identifiers, stable plot IDs, sample country/state/region directory, deterministic biome/resource classification, 625-plot maximum viewport, adjacent neighbors, ownership border calculation and relocation proposal generation. The module makes no DB calls and never modifies XP.

## Integration handoff
Visual Studio: consume `viewport()` for visible tiles, `ownershipBorders()` for borders and `REGIONS` for navigation. Existing playable prototype remains untouched to avoid overwriting PR #1377.
Civilization Systems: use `Plot.resources` as display hints only; authoritative harvesting requires server validation.
Integration & QA: add authenticated persisted ownership, concurrency-safe relocation, validated avatar URLs, anti-raid logic, and tests before multiplayer enablement.

## Verification
Source committed; automated test execution and Vercel preview not verified in this run. Do not describe deterministic sample biomes as real geospatial data. The 100k-player goal requires database indexes, partitioning and load tests.

## Reference use
No image files were accessed or copied in this run. Reference usage remains documented in `docs/one-world/REFERENCE_USAGE.md` on the foundation branch.
