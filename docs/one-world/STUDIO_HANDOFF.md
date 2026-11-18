# ONE WORLD Studio Handoff

## Goal
Make standalone `/one-world` playable quickly without adding to primary 1Muslim navigation. Four bot roles: World Architect, Visual Studio, Civilization Systems, Integration & QA.

## Current foundation
Client-side 100-plot sample region with selection, zoom, local building placement, adjacent expansion, peaceful/conquest UI, world overview placeholder. No server writes. XP and combat are not implemented.

## Protocol
Before each change read this file and WORK_LOG.md. Work in isolated feature branches/PRs; coordinate ownership of files. Record changed paths, test evidence, reference image filename and exact use, PR, blocker and next owner. Never claim deployment without verification.

## Visual Studio handoff — 2026-11-18
- New isolated `app/one-world/OneWorldStudio.tsx` and `studio.css`; page entry delegates to studio component on feature branch `feat/one-world-visual-studio-01`.
- Original CSS isometric tile art, terrain colors, cottage/farm/garden/stable/school symbols, responsive controls, pointer drag/pan and two-pointer pinch zoom, mouse-friendly zoom buttons and reset camera.
- Local-only data. No XP charges, persistence, map tiles or actual conquest. Integration & QA: check mobile gesture capture and app-wide navigation overlay before merge; review the base foundation PR #1367 dependency. Civilization Systems: avoid editing UI component directly; expose service APIs for land and buildings.
