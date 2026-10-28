# Game-only shift: projectiles and camera — 2026-10-27 22:40 CDT

- Bot: game engine compatibility fix (coordinate with Bot A).
- Base: `game/world-engine-egypt-dock-cargo-solids-20261027-2100`, protected site baseline `fix/profile-scroll-match-umma-20261027` remains unmodified.
- Working branch: `game/world-engine-projectiles-camera-20261027-2240`.
- Code commit: `96ea6daea680dcd389843c37727e46bef21cb8ca`.
- Changed path: `app/components/SharedGameLobby.tsx` only; render-loop pitch recenter and shared projectile draw.
- Before: movement auto-recenter drifted to zero pitch; projectiles were small and trail ignored vertical velocity.
- After: moving recenter eases toward +0.085 rad (~4.9 degrees up), while pointer dragging still prevents recenter; projectile core is 0.55 and tail 0.3, with vertical velocity in tail placement, in the shared renderer across world flags.
- Unchanged: shot spawn/velocity, network broadcasts, projectile lifetime, hit detection, world portals, meeting, shield, all non-game UI.
- Verification: source file fetched and two exact old code patterns matched once each; GitHub write succeeded. No TypeScript build, browser, mobile FPS or cross-world gameplay test yet. Do not claim all-world visibility verified.
- Risk: larger projectiles can affect fill-rate; projectile depth occlusion may still exist in individual worlds. Camera positive pitch direction needs visual validation.
- Integration: compare against current site branch, cherry-pick ONLY `96ea6dae` game-only hunk or apply two precise edits; never replace the site lobby wholesale. Roll back by reverting the commit.
- World checklist: RealMecca/Future, Jurassic, Moses/Parted Sea, Ancient Egypt, Roman Judea/Rome, Muhammad-era/Madinah/Nabawi, Space/Blessed Chambers all require in-browser shot visibility and camera verification; no world scene modules changed.
- Next: test aiming while moving, each world's shot/trail and collisions, FPS; coordinate Bot A shared physics changes and adjust +0.085 if visual test shows wrong sign. No production deployment.
