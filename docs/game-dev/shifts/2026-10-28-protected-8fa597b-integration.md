# Protected game integration — Shift A (2026-10-28 01:33 CDT)

## Protected source and branch
- Protected site commit: `8fa597b1a235aedad1dfe61b37fda0ed8362f346` (audio-on preference on video swipe).
- Work branch: `game/integrate-protected-8fa597b-20261028` created **directly** from protected commit, not from stale game branch.
- Latest known main from prior check: `c043219f7a3eeb8e1529538013e97f311a3b938a`; refresh before integration.
- Frozen preview reference: `fix/profile-scroll-match-umma-20261027` at `c856491131bb0c8056693652f8e5e58a26836831` (prior check; refresh).

## Inspected sources / non-regression finding
- Engine candidate: `game/world-engine-long-nile-palm-solids-20261028-0100-a`.
- Living Worlds candidate: `game/living-worlds-long-nile-oasis-20261028-0030-b`.
- Earlier integration candidate: `game/production-integration-20261027-verified`.
- GitHub comparison of protected commit against engine branch: **diverged**, 219 ahead / 63 behind, 70 changed paths, including `app/api/community-posts/route.ts`, `app/canvas-fullscreen-v1.css`, `app/components/ImmersiveVideoEntry.tsx`, and a Supabase migration. **Do not merge branch wholesale.**
- The engine branch adds `app/components/gameEgyptLongNilePhysics.ts`, importing `AncientEgyptLongNileLifeScene` and `gamePhysics`, neither present on protected commit. Standalone file cherry-pick would not compile; requires dependency and import integration review.
- Older game integration candidate diverges too (10 game-component files changed); shared `SharedGameLobby.tsx` must be reviewed against protected layout before patching.

## This run: implemented versus planned
- Implemented: isolated branch from protected SHA; this game-development-only handoff file. No game runtime code copied yet because dependencies and protected layout are not verified.
- Planned (NOT implemented): selective incorporation of engine + Living Worlds, then source-level smoke tests, full build, mobile interaction and preview.
- Exact changed path: `docs/game-dev/shifts/2026-10-28-protected-8fa597b-integration.md`.
- No runtime behavior changed; protected website, all worlds, Nabawi, and roofless Belt Boyz office preserved by leaving them untouched.

## Verification / risks
- Verified: protected SHA exists; branch created from that exact SHA; GitHub compare exposes unrelated app/API/style changes in candidate game branch; dependency check on Nile collider imports.
- NOT verified: full build, playable Egypt/Rome, runtime collision, shield authority, native phone FPS, site/game integration. Do not claim merged or READY.
- Main risk: copying stale `SharedGameLobby.tsx` or full app pages could revert newly locked profile/feed/video layout. Keep patches narrowly game-scoped.

## Next shift / Bot B handoff
1. Fetch current main, protected production SHA, current site layout contracts and latest Bot B handoff; compare all against `8fa597b`.
2. Inspect game entry and dependencies on protected version; inventory exact per-world scene imports. Preserve existing worlds and no roof in Belt Boyz office.
3. Review each candidate file against protected version; copy only safe game-only new modules and explicitly patch game imports. Avoid `app/canvas-fullscreen-v1.css`, feed, profile, API and migrations.
4. Implement minimal tested integration in this dedicated branch; add regression smoke tests, run TypeScript/Next build, verify scene and collision counts, then provide preview.
5. For future selective integration, cherry-pick only reviewed game-only commits/patches onto the site's **then-current** protected base; never merge this entire branch into production automatically. Rollback: discard this integration branch; no production changes made.

## Per-world status
- Egypt: long Nile and palm collider modules exist on source branch, **not integrated into protected base**.
- Rome: arena and lion source work requires independent integration/runtime validation.
- Moses / RealMecca / Jurassic / Space / Future / Nabawi / Belt Boyz: untouched in this branch; do not imply their source modules were copied or tested.
