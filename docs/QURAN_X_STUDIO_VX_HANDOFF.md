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

## Bot 2 — implementation and verification, 2026-10-21 04:12–04:16 CDT
**Committed on feature branch (not production):**
- `39eddd58dab506b2180cb4d5b83648927b75b96b` — `app/quran-vx-controls.module.css`: scoped Quran widget now reads the existing Canvas theme RGB CSS variables (`--canvas-control-surface-rgb`, `--canvas-control-border-rgb`, `--canvas-control-accent-rgb`) for glass, border, previous and play controls. Brighter light-mode Quran verse article; text contrast is adjusted for the light background. Added `--qvx-blur` and `--qvx-brightness` CSS variable hooks, but these do NOT yet have functional user sliders.
- `2f46f3a771b00684a85bf759f2fa4515ec074f64` — scoped subtle mid/foreground particle layers in the Quran frame, supplementing the existing behind-widget particles; pointer-events:none, reduced-motion fallback.
- `7c6054cd8378e9a707f19f62b6b826e6bd81fd94` — hash-safe attribute selector targeting Quran slide and widget to enforce 8px inset, avoiding dependence on legacy CSS-module class names. This is a source-level correction; physical 8px geometry still requires browser screenshot validation.

**Validation evidence:**
- Vercel preview for `39eddd58` is **READY** at `https://1muslim-o9znctd6q-elmiandco.vercel.app`. This means deployment built, NOT that UI behavior was tested.
- At last Vercel check, `2f46f3a` and `7c6054c` were **BUILDING**; do not call the latest branch READY until those finish. No full browser/mobile interaction or screenshot verification was possible here.
- Bot 1's earlier `b42fae2` preview is **READY**.
- No production deployment or merge performed.

**Critical write blocker:** GitHub connector safety checks blocked two attempted new `.tsx` component creates (Quran verse selector / position bars and atmosphere controls), and one attempted minimal `app/page.tsx` change (validate canonical verse metadata and store surah total). These attempts made **NO CODE CHANGES**. Scoped CSS updates succeeded. Do not report a working chapter selector, progress bars, dim/volume sliders or HudHud settings bubbles yet.

**Bot 3 precise instructions:**
1. First re-fetch branch files and verify Vercel deployment of `7c6054c`; inspect build logs if ERROR. Do not overwrite Bot 2 CSS without checking SHA.
2. Fix pending `app/page.tsx` integration when code writes are allowed: existing `loadQuranVerse(chapter,verse,save)` calls `api.alquran.cloud/v1/ayah/{chapter}:{verse}/ar.alafasy` and `en.sahih`; validate returned `data.surah.number`, `data.numberInSurah`, `data.surah.numberOfAyahs` and `data.number` before updating. Store `chapterTotal` in `quranPreview` for accurate current-surah position. Do not accept arbitrary verse<=286 as sufficient validation.
3. Add compact chapter:verse form to Quran frame, with accessible label, validation, disabled loading, and error feedback; call `loadQuranVerse(chapter,verse,true)` and keep existing audio pause/continuous behavior. Reuse chapter selector semantics from `app/elm-tent/quran/page.tsx`, not a duplicate fake data source. Two slim bars can initially display *position* (verse/chapterTotal, globalAyah/6236), explicitly labelled **position**, NOT completion. For true completion bars, use durable server-authoritative verified per-verse read/listen/recite records.
4. Studio's current `1muslim-quran-visited-v1` localStorage marks verses visited merely on focus; it is NOT reading completion and MUST NOT be used for completion XP or completed progress.
5. Implement recording vault/verse verification/XP carefully: `app/elm-tent/quran/VerseRecorder.tsx` uploads to Supabase `quran-recitation-vault` and upserts `quran_recitations`, but currently does not establish trustworthy verse-matching. Require real verification and idempotent server-side grants, never client-only XP. Keep original Quran audio unaltered.
6. Bot 4 should connect HudHud quick circular spin to scoped reading settings (blur/dim/brightness/volume) via UI state; use CSS hooks in `quran-vx-controls.module.css`. Do not let settings resize the canvas. Verify theme changes, mobile gestures, pointer events, reduced-motion and readability before release.
7. Inspect `app/page.tsx` frame className `[workspaceStyles.quranVerseFrame,quranVxStyles.quranFrame]`; `workspaceStyles.quranVerseFrame` appears undeclared and can be removed safely if TSX write permitted. Check whether `data-widget="Qur’an"` is present on the actual wrapper before relying on the 8px attribute selector.

**Remaining:** functional selector, completion bars, atmosphere sliders, HudHud spin/bubble animation, recording transition, reliable verification, secure XP, and real mobile QA. Preserve approved homepage and never promote unverified code.


## TITAN retry — 2026-10-21
- Commit `f82b471c2f94e818baabd589614f6f8525eaa203` modifies only `app/quran-vx-controls.module.css` on feature/quran-x-studio-vx.
- Quran frame is absolutely inset 8px on every side relative to positioned Quran widget; removes conflicting flex height sizing. Light-mode settings text now uses `--qvx-accent` rather than hardcoded green.
- GitHub write succeeded; browser-measured dimensions, visual regression and build/test results are NOT yet verified. HUDHUD PRIME/NOVA: verify actual rendered frame/card geometry on mobile and desktop, inspect clipping and previous/play controls, and confirm three saved themes in day/night before claiming acceptance. Do not merge into main or production.
