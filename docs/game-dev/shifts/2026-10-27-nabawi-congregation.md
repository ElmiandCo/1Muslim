# Bot B / Living Worlds — Nabawi congregation shift
**Timestamp:** 2026-10-27 14:40 CDT (America/Chicago)  
**Protected baseline:** fix/profile-scroll-match-umma-20261027 @ c856491131bb0c8056693652f8e5e58a26836831  
**Game starting point:** game/living-worlds-hajj-pilgrims-20261027-1430 @ 42082e4fc7e2cfedab4f42ab514b34d99ce7958c  
**Working branch:** game/living-worlds-nabawi-congregation-20261027-1440  
**Main/production:** read-only; compared against prior Hajj handoff. Do not copy site layout from this branch.  
**Previous handoff:** docs/game-dev/shifts/2026-10-27-hajj-pilgrims.md. Bot A owns engine physics, flight and collision.

## Implemented
- New `app/components/NabawiCongregationScene.ts`: `congregationPose` deterministic 72-second standing/bowing/prostrating/sitting loop; `renderNabawiCongregation` draws 21 faceless congregants in three rows near historical Medina courtyard x=0,z=-430.
- `app/components/SharedGameLobby.tsx`: one game-only import and one historical-world render call after Hajj pilgrims. No edits to other worlds, portals, Belt Boyz, Nabawi structure, or site UI.
- Before: no synchronized congregation. After: visible cyclical, stylized prayer poses near Medina when camera is nearby.
- Not implemented: first enterable high-ceiling mosque (next shift), collidable NPCs, authoritative prayer timing, audio, XP, blaster/shop changes.

## Verification
- GitHub comparison against Hajj branch: **PASS**, only two game paths, +32 lines, no deletions.
- Static wiring: **PASS**, exactly one import and one historical-world render call.
- Build and physical device FPS: **NOT YET VERIFIED**. Rendering is culled beyond 145 world units; max 42–63 draw calls depending on pose, plus 21 mats. Need inspect scene placement visually for courtyard obstructions and prayer direction. No claim of ritual precision.
- Runtime test: not yet executed. Do not promote before preview build and device walkthrough.

## World coverage
- Jurassic: existing river ecology; unchanged.
- Future/RealMecca: existing gardens; unchanged.
- Moses: playable Parted Sea; unchanged.
- Roman Judea/Rome: markets and birds; unchanged.
- Historical Makkah/Madinah: Hajj pilgrims retained; **new Nabawi-area congregation**.
- Today: Hajj pilgrims retained; unchanged.
- Moon/Blessed Chambers: existing rovers/arrays; unchanged.
- Belt Boyz: open-roof meeting hall retained; unchanged.

## Integration / rollback
Review the **two game paths only** against the then-current site integration branch. Prefer cherry-picking commits 5f7e9f3 and d488d3c or transplanting the import/call and new module; never merge the whole branch or overwrite a newer SharedGameLobby. Rollback removes the new module and two added lines. Coordinate shared rendering/LOD and flight with Bot A; do not change engine physics without joint review.

## Next shift
1. Build and device-test congregation and verify location/direction near Nabawi.
2. Create first **enterable, high-ceiling mosque** as a standalone game-only scene with solid walls, clear doorways, collision and mobile LOD; test against Bot A physics.
3. Continue world-by-world checklist and note conflicts before selective integration. No production deploy without explicit approval.
