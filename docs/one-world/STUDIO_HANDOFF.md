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
