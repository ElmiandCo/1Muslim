# World Architect — 2026-11-18 follow-up
## Scope
Added pure, independently integrable geographic hierarchy and plot allocation primitives in `lib/one-world/geography.ts`. No existing UI files modified, avoiding Visual Studio conflicts.

## Geography
Earth → country → state → region → stable plot IDs; sample regions for US/Minnesota, Somalia/Banaadir and Türkiye/Istanbul are illustrative, not authoritative GIS boundaries. Biome resource lookup, deterministic prototype terrain, adjacency, bounded visible-tile queries and a relocation *plan* type are included.

## Scale and security
A 625-tile viewport cap avoids materializing all plots for 100k+ players. This is not a benchmark or proof of production scalability. Relocation must be committed atomically by an authenticated server after checking candidate ownership; the client helper must never perform the transfer. Ownership, XP, persistence and real geography remain unimplemented.

## Testing
Added six Node test cases; not executed in this environment. Existing game route remains in PR #1367, not yet merged to main. No preview deployment verified.

## References
No image files were fetched or used in this change. See REFERENCE_USAGE.md on the foundation branch.

## Next handoff
Visual Studio: wire hierarchy breadcrumb and region selection to the UI when its branch is integrated. Civilization: use stable plot IDs and server-owned claim transactions. Integration & QA: run tests, confirm Next.js compilation, review authentication and safe relocation RPC.
