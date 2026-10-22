# Nova lobby visual handoff — Issue #99

Branch: `feature/nova-spatial-lobby-integrated-20261021`
Base: `feature/titan-six-world-physics-20261021`
Scope: Preview-only. No production merge.

## Implemented
- The existing Games tab now opens `OneMuslimWorldGame` through the `CosmicCatchGame` entrypoint. Other Live workspace tabs and `app/page.tsx` are untouched.
- Lightweight third-person perspective renderer with bright white world, subtle floor grid, sun glow, stylized full-body avatar and Gold/Silver/Cosmic/Diamond preview suit colors.
- Spatial glass Live waiting screen at (0, 7.2, -18.3), approximately 20 yards behind spawn. It **only displays the waiting state** and is not yet connected to LiveKit.
- Large portal at (0, 12, 120) opposite the screen, glowing rings, particles, clear `Jump Into 1MuslimGames` sign, run/fly approach and world selector.
- Keyboard WASD, arrow look, F flight, Shift boost, Space jump/rise, E enter. Touch joystick, drag look, jump/fly/boost/descend.
- Six universe cards accurately marked under construction; existing Arabic Letter Quest remains playable.
- Responsive emerald/gold glass HUD with controls constrained to the existing Games slot. Reduced-motion mode minimizes particles.
- Fixed missing Titan `landmarks` export that blocked type checking.

## Still required (Titan/HudHud)
- **Real multiplayer is not implemented.** The UI deliberately reads SOLO PREVIEW. Add secure rooms, position and avatar state synchronization, interpolation and two-device validation.
- **Live video is not connected.** Bind the glass panel to the real LiveKit stream/player and honest live/waiting states.
- 3D WebGL terrain/rigged avatars, physics, profile-selected suit integration, mobile touch and performance validation.
- Six world environments are not yet playable; no misleading unlocked states.
- Real XP persistence and anti-abuse checks are not in this visual branch.

## QA checklist
- Vercel build and TypeScript pass.
- iPhone Safari and desktop verify no clipping/overflow in Games tab, and neighboring tabs unchanged.
- Walk ~120m and fly above 4m to enter portal; return to lobby; play original Arabic Letter Quest.
- Turn 180° to see floating waiting screen about 18.3m behind spawn.
- Verify keyboard and mobile controls; reduced motion.
- Two real players only after multiplayer backend integration.

Do not merge to production before Titan/HudHud integration and verification.
