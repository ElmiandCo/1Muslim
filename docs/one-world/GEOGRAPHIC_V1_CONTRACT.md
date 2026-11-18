# ONE WORLD V1 — Geographic plot contract (World Architect, 2026-11-18)

## Integration scope
Draft PR #1388 targets `integration/one-world-v1-completion`. World → country → state → region → plot navigation and the isometric scene share a selected plot index, but the region list is illustrative and the terrain grid is still local-only. This document defines the minimal interface for the Integration lead, Visual Studio, and Civilization Systems; it does **not** assert persistence exists.

## Canonical data model
- `worldId`, `countryId`, `stateId`, `regionId`, `plotId` are stable, server-issued identifiers, not translated display names or array indices.
- Each plot has server-owned `regionId`, integer `x` and `y`, `terrainKind`, `resourceKind[]`, `ownerUserId | null`, and optional persisted `buildingId`. Unique constraint on `(regionId,x,y)`; unique `plotId`.
- Orthogonal adjacency: same region and `abs(dx)+abs(dy)===1`. Never use cross-region index arithmetic, display labels, or client-provided coordinates for purchases.
- Viewport selection should use `plotId`; a region-specific `plotId → {x,y}` map converts it to isometric coordinates. Switching regions must load a new region snapshot, not reuse the previous region's selected numeric index.
- The 12×12 (144 tile) prototype uses `index=y*12+x` only for display. Its sample plot #79 and three region names must never be treated as authenticated starter ownership.

## Persistence and security handoff
Integration & QA: load a server-authoritative region snapshot for the signed-in user; assign a starter plot once per user in a transaction; verify reload; keep route hidden from navigation. Civilization Systems: authenticated server transactions must read trusted coordinates, wallet, ownership and costs from DB; lock rows; enforce idempotency and rollback. Visual Studio: render owner borders and resources from the snapshot, preserve drag/pinch/tap, and route claim/place actions through server responses rather than local `setTiles`. Until implemented, keep all actions clearly labeled as nonpersistent sandbox and disable real XP deductions.

## This run
- Changed `app/one-world/page.tsx`: restored missing component closing brace on PR #1388 branch; commit `daf9e59b2184ebff1046d8d969db3d8f5c8d42a8`.
- Changed this document to establish canonical IDs, adjacency, viewport and persistence integration contract.
- Reviewed `STUDIO_HANDOFF.md`, `WORK_LOG.md`, `REFERENCE_USAGE.md`, `QA_STATUS.md` on integration branch and PRs #1387–#1392. No merges or conflict resolutions attempted; PR #1388 reports not mergeable and needs lead review.
- Reference screenshots actually accessed/used: none; filenames: none. No proprietary art copied.
- Tests, production build, mobile QA, Vercel preview and authenticated route load: **not executed or verified**. Closing a syntax error is not proof of a passing build.
- Next: Integration lead reconcile page.tsx against integration's prior syntax fix, integrate PR #1388 without overwriting Visual Studio PR #1391, and verify exact-SHA build; Civilization Systems connect authoritative ownership/persistence before release.
