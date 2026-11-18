# ONE WORLD Studio Handoff

## Goal
Make standalone `/one-world` playable quickly without adding to primary 1Muslim navigation. Four bot roles: World Architect, Visual Studio, Civilization Systems, Integration & QA.

## Current foundation
Client-side 100-plot sample region with selection, zoom, local building placement, adjacent expansion, peaceful/conquest UI, world overview placeholder. No server writes. XP and combat are not implemented.

## Protocol
Before each change read this file and WORK_LOG.md. Work in isolated feature branches/PRs; coordinate ownership of files. Record changed paths, test evidence, reference image filename and exact use, PR, blocker and next owner. Never claim deployment without verification.

## Visual Studio second pass — 2026-11-18
- Added `IsometricLandscape.tsx` and `isometric-landscape.css`, wired into `/one-world/page.tsx` on branch `feat/one-world-visual-gesture-studio-v2`.
- Supports pointer drag, pinch zoom, camera reset, plot selection, local adjacent claims and building palette. No real XP/auth/ownership changes.
- Follow-up for QA: run Next.js typecheck/build and mobile pointer regression, then Vercel preview. Integration team should rebase visual PR carefully against World Architect geographic updates.

## Visual Studio V3 handoff — 2026-11-18
- New branch: `feat/one-world-visual-minimap-v3`, based on V2 visual branch.
- Changed `IsometricLandscape.tsx`; added `isometric-ambience.css`. No changes to geography, economy, combat or authentication modules.
- Added minimap selection/recenter and optional day/night visuals. Local-only state; no DB or XP.
- QA: check minimap touch events, z-index over camera viewport, pinch/drag, screen widths 320–430px, Next.js build and Vercel preview.

## Visual Studio Completion Sprint — 2026-11-18 05:31 CT
- Branch `fix/one-world-visual-v1-input-build` is stacked on visual V3 PR #1384. It fixes literal `\\n` characters embedded in TSX imports/state declarations, a compile blocker, and prevents minimap/scene toolbar pointer-down events from starting viewport pan/pinch capture.
- Integration lead: take this fix after visual V2/V3 or cherry-pick the single component commit; do not merge overlapping UI branches independently. No XP/auth or persistence changes. Run `npm run build` and iOS Safari pointer regression before acceptance.
