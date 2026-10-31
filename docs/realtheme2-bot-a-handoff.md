# RealTheme2.0 — Bot A handoff to Bot B

## Branch / safety
- Repository: `ElmiandCo/1Muslim`; branch: `RealTheme2.0` only.
- Production was **not** modified or promoted by Bot A.
- Preserve layout, vertical/horizontal scrolling, animations, LiveKit, uploads, profile behavior, and Arabic Qur'an verse styling.
- Bot B owns Lessons, Community, Profile. Please do not overwrite Bot A's files unless explicitly reconciling changes.

## Bot A completed targeted changes
1. `app/components/PostDesignStudio.module.css` — scoped six-theme palette overrides for Create Post root, Post button, avatar border, editor, upload buttons, options/dropdowns, verse selector modal, confirmation dialog. Commit `8ac8e76c1f96bef6bba71c549ee9fc137055135f`.
2. `app/components/home-messenger.module.css` — scoped six-theme overrides for Messenger panel, compose, search, All/Unread/Groups tabs, avatars, unread badges, selected rows, message bubbles and input. Commit `a710b7081fd966c5ce5bc509eedce71b88bdb257`.
3. `app/realtheme2-bot-a.css` — scoped six-theme overrides for Main carousel navigation (Live/Qur'an/Post/Messages/Elm), Live format navigation (Desktop/Phone/Audio/Games/Qibla), Live Send/input/chat/avatar/audio stage, Home Quran Studio Arabic/ENG toggle, previous/Play, Surah/Ayah selectors/options; plus full Quran Studio buttons/settings/selects without touching Arabic verse text. Commit `a0ccba5433e1ba3a79663fcaeb6b3c7dc55a8a1a`.
4. `app/layout.tsx` — imports the new CSS globally after globals.css. Commit `77386845acdf592455a86256deb8e052bca1f87e`.
5. `app/page.tsx` — updates legacy canvas RGB palette to recognize Sapphire/Ruby/Amethyst/Titanium/Obsidian instead of falling back to Emerald. Commit `3598bf66db65f393628d7eda369dfaa3a7e50ac9`.

## Existing work to preserve
- Earlier RealTheme2.0 changes in `app/globals.css` add high-contrast `--rt-text-primary`, `--rt-text-secondary`, `--rt-text-muted`, `--rt-text-highlight` tokens for all six themes.
- `app/components/ProfileThemeSync.tsx` sets `html[data-muslim-theme]` and `--theme-base`, `--theme-accent`, `--theme-secondary`, `--theme-surface`, `--theme-edge` at runtime.
- `app/canvas-fullscreen-v1.css` has earlier Community theme work.

## Verification
- Static review: verified targeted class names against actual `PostDesignStudio.tsx`, `HomeMessagesChooser.tsx`, `HomeLiveConversation.tsx`, `HomeAudioLivePlayer.tsx`, `app/page.tsx`, and `app/elm-tent/quran/page.tsx`.
- Calculated text-token contrast on each theme surface: primary 11.45–16.69:1, secondary 9.64–13.24:1, muted 7.54–10.16:1 (based on theme palette values; this does **not** validate every rendered combination).
- Vercel preview for commit `3598bf6` started compiling and reported `Compiled successfully` in 11.6 seconds; type-check/deployment completion was not yet confirmed when these notes were written. Preview deployment ID `dpl_75Dq29QYmU8rBtgvvoTqqtecyLx5`.
- **Not yet verified:** all 42 visual screen/theme combinations, browser interaction, final Vercel READY, exact WCAG contrast for every actual element. No claim of production readiness.

## Bot B next actions
- Complete Lessons, Community, Profile targeted palette fixes, preferably in separate files from those above.
- Review the branch head for concurrent commits; avoid resetting or overwriting Bot A changes.
- Check latest Vercel preview build status, report any errors, and keep production unchanged.
- Verify Emerald remains visually unchanged and test Obsidian/Amethyst/Sapphire/Ruby/Titanium when a browser preview is available.
