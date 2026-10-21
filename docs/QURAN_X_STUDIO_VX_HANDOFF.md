# Quran X Studio VX — five-builder handoff
Branch: feature/quran-x-studio-vx (branched from latest feature/umma-discovery-search-20261021).
Scope: Quran home canvas, existing Quran Studio and connected recording studio, plus narrowly scoped HudHud Profile/1Umma level controller and theme synchronization. Preserve all existing Canvas, Live, messages and other features. No new unrelated UI, no production release without successful build and review.

## Approved requirements
1. Quran canvas exactly 8px inside its outer frame on every edge, fixed bounds; do not shift verse text downward. Move previous-verse control INSIDE canvas near upper-left. Play button fixed near canvas bottom independent of verse changes; remove bottom "Open Quran Studio" button.
2. Reuse existing chapter:verse selector from Quran Studio; two slim progress bars: current surah completion and whole Quran completion, derived from canonical verse identifiers, not fake progress.
3. Bring existing Quran Studio blur (blur background BEHIND legible verse), dim, brightness, volume and subtle three-layer particles into canvas. Controls compact, roughly half previous length, with fade-out. Day mode significantly brighter globally; rose gold/silver/emerald theme changes must recolor nav, borders, controls and buttons consistently, not just background.
4. HudHud QUICK CIRCULAR SPIN gesture ONLY toggles settings bubbles. Bubbles emerge one by one with staggered distinctive motion, gentle pops, closing quicker into HudHud with soft suction and chirp; no canvas layout shifts. Preserve existing tap behaviors. Honor reduced motion / mute and avoid accidental activation while dragging.
5. Smooth swipe down into connected Quran Recording Studio. On transition while Quran playing, quick natural volume/pitch fade/stop, NO scratch/distortion of sacred recitation. Recording studio records, listens, compares with target verse, replays, user-approves, saves to secure vault, and returns to SAME Quran verse after verified save. Effects (echo/reverb/autotune) for user's recording only, optional separately controlled nasheed backing; do not alter original Quran audio. Share verse/chapter and saved audio into post where supported; do not claim unavailable services work.
6. XP per unique canonical verse and user, independently once ever: 250 for reading, 500 for playing FULL verse to completion, 1000 for user-approved, verified and saved recitation. Server-authoritative idempotent grants, not client-only flags. Reading needs a meaningful completion condition, not just appearing in viewport. Verification requires reliable verse-matching evidence, not a fake score or user self-approval alone. On successful verified save: ding, green confirmation, vault lock, return to same verse; completed verse displays subtle gold/emerald + linked to saved recording. XP and progress derived from durable user records; never farmable by replay.
7. Profile and 1Umma: HudHud remains bottom controller. Vertical drag up/down moves exactly ONE level, never jumps to top nav, avoids scroll conflicts; subtle controller affordance.
8. Mobile-first: no overlay displaces or resizes existing widgets. Keep current approved design, no new UI redesign.

## Builder responsibilities and durable handoff
Every builder MUST actually inspect and edit repository code where feasible, commit to THIS branch, validate relevant tests/build, and update this file with: timestamp, commits, completed, failed tests, risks, exact next steps. Do not pretend to have edited files or verified a build if not done. Read latest handoff before work; avoid parallel conflicting commits. If tool access or time prevents work, report blocked honestly.

Bot 1 Architect+Builder: create branch/handoff, inspect actual Quran components/styles/schema; implement highest-confidence layout fixes, map exact code paths and dependencies for Bot 2.
Bot 2 Builder: implement fixed canvas controls, theme, blur/particles and chapter selector; hand off implementation details to Bot 3.
Bot 3 Verification+Builder: check Bot 2; build recording/verse matching/secure vault and idempotent XP foundations; do not award XP if server enforcement or verification incomplete.
Bot 4 Integrator: fix remaining UI and connection between Quran and Recording Studio; HudHud circular settings and Profile/1Umma controller where feasible; check tests and merge readiness.
Bot 5 Release Guardian: audit branch vs latest main/preview, run build checks, report preview URL + status, commits, completed/incomplete, regressions. Merge into latest approved preview only if tests pass and no conflicts; NEVER push production automatically. Leave final report in handoff.

## Initial handoff — Bot 1
Created branch from latest active preview feature branch and documented complete acceptance criteria. Known starting point: app/page.tsx contains previous verse control using workspaceStyles.quranHudHudPositionToggle and event 1muslim:quran-previous-verse; inspect surrounding markup before moving. Existing active preview branch may have outstanding Vercel build issues; verify rather than assuming success. Next: locate Quran widget/studio styles, implement isolated layout improvement and commit; inspect data layer for XP schema and verification.


## Bot 1 completed — 2026-10-21 04:10–04:13 CDT
**Actual committed code, preview branch only:**
- `bd92dc472d8f3267564dbf9ff1f7d8eaded9c03c` — app/page.tsx: move previous-verse button into Quran verse frame, move play button OUT of scrollable verse content into a stable frame overlay, disable play until verse loaded, remove bottom Open Quran Studio link. Existing audio element and navigation event retained.
- `583edda58bd4da7fd34fa0bd41f8eb92082c35c6` — new app/quran-vx-controls.module.css: isolated stable layout and 8px widget inset; no global redesign.
- `e7d1a489d720dd6ca012c2a691bdf4dc5a1edc22` — app/page.tsx: import and bind new scoped CSS module classes to Quran widget, frame, verse article, previous control and play control.
- `b42fae277e43fe6834d715a5127e98920268abed` — increase inset selector specificity in scoped CSS module.

**Inspection map:** Quran homepage lives in `app/page.tsx` (~106KB), styles `app/workspace-presentation.module.css` (~48KB) plus `app/home-hub.module.css`. Main Quran Studio is `app/elm-tent/quran/page.tsx` (~160KB). It imports `VerseRecorder` from `app/elm-tent/quran/VerseRecorder.tsx` (~10KB), which currently uploads to Supabase bucket `quran-recitation-vault` and upserts `quran_recitations` but contains no verified verse matching. Studio has `readerBlur`/`readerDim` state and `<select aria-label="Choose surah">`; use those as reference for Bot 2. Homepage uses `loadQuranVerse`, `quranPreview`, `quranAudioRef`, `quranAudioFinished` and custom events `1muslim:quran-next-verse` / `1muslim:quran-previous-verse`.

**Validation:** Structural source checks confirmed exactly one new frame, previous button and play button in homepage source; no production change. Vercel preview deployment for first code commit `bd92dc4` reported READY. Deployment for final CSS commit `b42fae2` was still BUILDING at last check; no complete final-build or mobile gesture validation claimed. Earlier build `e7d1a4` reported successful Next.js compilation, with type-check still in progress when inspected. Do not infer later deployment success from this.

**Bot 2 immediate steps:**
1. FIRST check latest branch deployment for `b42fae2` is READY; inspect Vercel build logs and fix any CSS-module/TS errors. Source currently references `workspaceStyles.quranVerseFrame` as one member of a className array, but that class is NOT declared in legacy workspace CSS; safely simplify to `className={quranVxStyles.quranFrame}` (the other class is harmless undefined at runtime, but remove it for cleanliness).
2. Check CSS specificity and inspect mobile: `:global(.fillArea)` in the new module may not match CSS-module-hashed legacy `fillArea`; ensure actual 8px padding via a reliable selector scoped to the Quran slide (e.g. `:global([data-workspace-page="1"]) .quranWidget`) and avoid touching other slides.
3. Confirm play and previous controls remain visually fixed as verse content scrolls, do not obstruct Arabic text; verify no overflow and that previous control is INSIDE the glass pane at upper left. Retain the Quran widget's existing click-through to Studio via the surrounding Link.
4. Add chapter:verse selector, legitimate progress bars, compact dim/brightness/volume/blur, particle polish, theme synchronization, as possible; commit changes and update handoff for Bot 3.
5. NEVER award XP based on client events; no backend XP or verified recitation exists in this Bot 1 work. Bot 3 must design server-authoritative idempotent grants and real verse verification.

**Known risks:** No full interactive browser/mobile test yet. Legacy Quran CSS has multiple !important declarations, so screenshots are needed to prove geometry. This branch has NOT been merged or promoted to production.
