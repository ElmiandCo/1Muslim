# 1Muslim — V1 Completion Checklist

**Purpose:** Internal release-readiness tracker. Review before declaring 1Muslim V1 complete.
**Status key:** [ ] Not yet verified · [x] Verified. Do not mark complete based solely on a code commit.

## 1. Release and reliability
- [ ] Latest `main` commit deploys successfully to Vercel (READY).
- [ ] Production homepage loads on iPhone and desktop.
- [ ] No blocking TypeScript, runtime, or missing-environment-variable errors.
- [ ] Database migrations and Supabase RLS policies are verified.
- [ ] All navigation routes, links, dialogs, and close buttons work.
- [ ] Mobile dock stays at the bottom without covering controls.
- [ ] Day/night theme and accessibility (contrast, touch targets, reduced motion) work.

## 2. Accounts, onboarding, and Shahada
- [ ] Email and Google sign-in and sign-out work.
- [ ] Guest access has the intended read-only restrictions.
- [ ] Shahada audio or checkbox path works and awards the correct badge/XP.
- [ ] First-visit welcome and page tutorials appear only as intended and can be dismissed.
- [ ] Profiles, avatar changes, handles, and account deletion work.
- [ ] Admin-only features are enforced server-side, not just hidden in the UI.

## 3. Community and social
- [ ] Member posts support text and video upload with persistent storage.
- [ ] Likes, comments, replies, and sharing persist across accounts/devices.
- [ ] Stories show correctly and respect sign-in restrictions.
- [ ] Ashab follows/requests and notifications work end to end.
- [ ] User privacy, report, block, and moderation controls work.

## 4. 1Muslim Videos
- [ ] Home page has a Videos shortcut next to Stories using `public/assets/1muslim-videos-icon.png`.
- [ ] `/videos` displays actual eligible member-post videos, not browser-only drafts.
- [ ] Vertical swipe/scroll, autoplay, pause, mute, next/previous work on mobile.
- [ ] Creator attribution, post links, share, and interactions work.
- [ ] Private/deleted content is excluded; signed media URLs refresh as needed.
- [ ] Empty, loading, error, and slow-network states are tested.

## 5. Live Studio and livestreams
- [ ] Camera preview starts automatically when permission is available.
- [ ] The saved auto-start camera setting works; camera can be turned off.
- [ ] Flip camera, microphone, title validation, and Go Live button work.
- [ ] Actual LiveKit stream is visible and audible on a second device.
- [ ] Live comments/reactions appear in the player, including host comments.
- [ ] **Live filters:** choose, preview, change, and remove filters/effects.
- [ ] Five continuous video effects are tested; decide whether effects must appear in outgoing stream and recordings.
- [ ] Public/Ashab visibility is enforced for viewers.
- [ ] Scheduled Lives, countdowns, check-in, and featured-home playback work.
- [ ] End Live, recordings, thumbnails, replay, and retention/Pro permissions work.
- [ ] Failed camera permissions, disconnected networks, and stream recovery are handled.

## 6. Qur'an Studio and learning
- [ ] Qur'an Studio navigation, reading, audio, and progress work.
- [ ] Easy and Advanced learning paths are complete.
- [ ] Shahada-to-Tajwid unlock and lessons (Al-Fatihah, An-Nas, Al-Falaq, Al-Ikhlas) work.
- [ ] Lessons, XP, badges, and rewards persist and cannot be awarded repeatedly by mistake.
- [ ] Quran references and educational material are checked for accuracy.

## 7. Messaging and notifications
- [ ] One-to-one messages send, receive, and persist.
- [ ] Conversation list, unread counts, and message permissions work.
- [ ] Notifications work for messages, replies, follows/Ashab, and live events.
- [ ] Blocking, reporting, and abuse protection work.

## 8. HudHud assistant
- [ ] Orb opens chat, voice, guidance, and settings reliably.
- [ ] Sight information cards are movable, translucent, and relevant to the page.
- [ ] Day/night and Sight settings persist and synchronize.
- [ ] HudHud links and suggestions navigate to working features.
- [ ] HudHud does not obstruct navigation or freeze tutorials.

## 9. Final acceptance tests
- [ ] New visitor → welcome → sign-up → Shahada → profile → post → comment.
- [ ] Host → camera → title → live → viewer joins → comments → end → replay.
- [ ] Member → uploads video → another account watches it in Videos → opens post.
- [ ] Two members → follow/Ashab → message → receive notification.
- [ ] Test on iPhone Safari, Android Chrome, and desktop.
- [ ] Verify production data, privacy, moderation, and storage cost limits.

## Release rule
**V1 is complete only when every release-blocking item is checked and the production build is READY.** Keep enhancements separate from blockers so the finish line does not move.
