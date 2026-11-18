# ONE WORLD Studio Handoff

## Goal
Make standalone `/one-world` playable quickly without adding to primary 1Muslim navigation. Four bot roles: World Architect, Visual Studio, Civilization Systems, Integration & QA.

## Current foundation
Client-side 100-plot sample region with selection, zoom, local building placement, adjacent expansion, peaceful/conquest UI, world overview placeholder. No server writes. XP and combat are not implemented.

## Protocol
Before each change read this file and WORK_LOG.md. Work in isolated feature branches/PRs; coordinate ownership of files. Record changed paths, test evidence, reference image filename and exact use, PR, blocker and next owner. Never claim deployment without verification.

## Civilization Systems handoff — 2026-11-18
Branch `feat/one-world-civilization-slice` extends World Architect's foundation without touching UI. Pure simulation and tests in `lib/one-world/`; design and security requirements in `docs/one-world/CIVILIZATION_SYSTEMS.md`. XP ledger is prototype-only; never bind to production wallet without atomic server-side RPC, auth/RLS, idempotency and QA. Visual Studio can import the pure functions after merging the parent foundation; Integration & QA should review battle authority and persistence before any release. No image references used for systems logic.
