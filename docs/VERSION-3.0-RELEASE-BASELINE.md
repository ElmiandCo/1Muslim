# 1Muslim Version 3.0 — Protected Release Baseline

Status: recovery branch; **not approved for production** until complete homepage parity is verified.

## Protected modules
- **Home Canvas:** retain last approved four-workspace homepage, HudHud, widget positions, responsive sizing, Live and Qur'an experiences. No homepage source edits as part of Messenger release.
- **Arabic Lessons:** Alif/Bā/Tā, randomized 28-letter learning, quizzes, vowel practice, XP and Arabic Letters badge.
- **Avatars:** preserve earned Gold, Water, Silver and existing profile customization/storage.
- **Badges:** existing earned-state verification, three public slots, persistence and permission checks. Royal Carousel applies visual motion only; do not alter earning logic.
- **Messenger:** approved full-page design at /messages; guest browsing, sign-in on send/save; signed-in real DMs, groups, voice/video calling.
- **Translation previews:** preserve HudHud's translation preview experiences, language selection, translated text/audio preview and any existing live translation overlays. Review and recover work from `feature/hudhud-translation-stage6`; do not replace current implementation with placeholders.
- **Day/Night:** preserve movable orb and white/black Messenger surface.
- **Shared motion:** Royal Carousel (slide-spin badges/avatars/groups), Mirror Spin (lessons), Golden Reveal (rewards), Water Flow (avatars), Card Flip (Qur'an notes), Magnetic Snap (widgets), Orbit Spin (profile), Day/Night Morph.

## Release gate
1. Identify and compare last approved homepage code and assets against the release branch. Do not assume current main contains latest homepage.
2. Verify homepage desktop/mobile visually; Live, Qur'an, four workspaces, HudHud, widget placement, day/night.
3. Verify lessons, badge awards, Gold/Water/Silver avatar assets and spinning group selector.
4. Verify HudHud translation previews, language controls and any working audio/overlay previews against the approved implementation.
5. Verify guest /messages and authenticated messages, groups, attachments and calls.
6. Run Next.js production build and typecheck, then confirm READY deployment.
7. Snapshot/tag known-good source commit as v3.0 only after checks; deploy from approved reference.
8. Never merge unrelated feature branches or overwrite the homepage as part of Messenger work.

## Recovery checkpoints
- Current pre-release branch: release/3.0-recovery.
- Baseline branch created from main; existing homepage remains unchanged on this branch.
- Royal Carousel first applied to PublicBadgeSelector only; preserve database save behavior.
- **Not yet recovered:** verified last approved homepage commit and full feature parity.
