# 1Muslim — Homepage-First Experience Standard
**Status:** Canonical design and interaction specification · **Scope:** Entire 1Muslim product · **Rollout:** Draft integration PRs and verified preview
**Primary references:** `app/page.tsx`, `app/home-hub.module.css`, `app/layout.tsx`, existing shared components. **Never replace the established homepage with a generic dashboard.**

> **Core rule:** Every page should feel as if it belongs inside the homepage: same depth, layered glass, intelligent movement, tactile widgets, recognizable navigation, day/night treatment, and HudHud choreography. Reuse the real code, not an approximate visual recreation.

## 1. Source of truth and precedence
1. Inspect the **homepage implementation on the checked-out main baseline** and working components before modifying any UI.
2. Preserve the checked-out homepage behavior. Record the deployed homepage independently during the production baseline check.
3. This document defines intended behavior; code observations below are snapshots, not a claim that every interaction is already perfect or globally reusable.
4. Where screenshots, this document, and code conflict, confirm user intent rather than silently discarding an existing interaction.
5. Do **not** build a second design system for Originals, Quran, messages, streaming, or onboarding.

## 2. Visual architecture — layered, never flat
- **Layer 0: atmosphere:** deep emerald gradients, subtly lit pattern/grid, distant vignette and parallax; a quieter lighter atmosphere in day mode.
- **Layer 1: ambient motion:** independently drifting light particles, soft halos, slight motion in decorative artwork; never overpower reading or touch targets.
- **Layer 2: translucent surfaces:** nested, mirror/smoked/frosted glass cards with genuine backdrop blur where supported, thin warm metallic edging, internal highlights, soft depth shadows.
- **Layer 3: interactive content:** legible ivory/emerald text, meaningful icons, Arabic labels, status data, controls and user content.
- **Layer 4: navigation and HudHud:** orchestrated header and companion movement, floating quick access; never obstruct text fields, reading lines, camera controls, or safe areas.
- **Layer 5: overlays:** modals, onboarding, notices and focus experiences. Proper focus management, escape/close behavior where permitted, and explicit z-index ownership.

### Smoked mirror-glass recipe
Use the *actual* homepage card selectors and existing tokens where possible. Visual ingredients: dark tinted translucency + restrained linear/radial sheen + `backdrop-filter: blur(...)` + a fine low-opacity border + inset top highlight + ambient outer shadow. Avoid opaque plastic, solid flat green rectangles, milky glass that destroys contrast, heavy neon outlines, or uniform cards with no hierarchy. On devices without blur or with reduced transparency, supply a readable opaque fallback.

### Color and typography
Emerald, antique gold, warm ivory, muted sage; context-specific Quran Studio purple remains a deliberate exception within the shared interaction system. Reuse homepage typography and Arabic shaping. Never animate, blur, distort, or obscure Arabic glyphs themselves; only their surrounding environment may glow or move.

## 3. The comeback: a choreographed navigation transformation
**This is a signature 1Muslim interaction, not a simple show/hide toggle.**

When the user triggers the homepage navigation/HudHud control:
1. The top header anticipates movement and **smoothly lifts/collapses**, freeing its occupied space rather than disappearing abruptly.
2. HudHud's button/orb travels to its intended position **as part of the same shared movement timeline**, with a coherent relationship to the top navigation and floating bottom menu.
3. The surrounding content/grid **reflows to occupy the freed space**. Cards should not jump, flash, or snap.
4. The **“Assalamu Alaykum” greeting** moves from its central introductory position toward the **right-hand cleared position**, keeping the greeting visible, balanced, and away from HudHud.
5. On expansion, all elements **reverse together**: header returns from above, HudHud returns smoothly, greeting returns toward center, and content resettles.
6. Selecting a navigation destination should close/restore navigation with its exit choreography before or during route transition as appropriate. No overlapping floating bars.
7. Preserve keyboard, touch, and screen-reader operation; reduced-motion users receive an immediate stable layout.

**Observed preview implementation reference:** `navMotionCollapsed` / `navMotionExpanded` in `app/page.tsx` and `app/home-hub.module.css`; `introGreeting`; `controlHeaderCollapsed`; animations `navLiftAway`, `navReturn`, `navRefill`, `navRefillBack`. Current CSS documents a **shared 1.95-second** choreography. **Do not change this casually.** If central greeting placement varies by auth/device state, preserve the intended center→right relationship rather than hard-coding one offset.

## 4. Moving grid and tactile widget physics
The homepage grid is **interactive spatial UI**, not a static masonry mockup.
- Asymmetric card sizes and editorial hierarchy: compact, standard, expanded, featured, immersive, studio.
- Preserve a **stable packing algorithm** that respects user order, makes room for resized cards, and avoids overlaps.
- Grabbing a card must feel physical: pointer/touch lift, mild enlargement, stronger shadow, responsive following, velocity-aware movement, and a clear grabbing cursor where relevant.
- Nearby drop targets receive a **magnetic glow/perimeter indication**; other cards shift into preview positions to show the proposed arrangement.
- On valid release: cards **settle** with a soft spring-like transition into their new cells. On invalid release: return gracefully to origin. No teleports or unintended reorder.
- Keep drag thresholds large enough that taps, links, buttons, scrolling, and long presses do not accidentally reorder.
- Support resize, add/remove, restore/undo, and persisted user layouts; avoid a global reset from one widget change.
- Handle mobile with explicit drag handles or long-press affordances and touch-safe gesture cancellation.
- Avoid repeated layout thrashing: use transforms/`requestAnimationFrame` for gesture updates; save layout after settled changes.

**Observed implementation reference:** `packNearby`, `transitionLayout`, `previewMove`, `liftMagnetic`, `moveMagnetic`, `settleMagnetic`, `finishMagnetic`; `data-magnetic-grid`; CSS `hh-magnetic-lift`, `hh-magnetic-target`, `hhPerimeterTravel`. Preview CSS uses a **650ms layout-settle interval** and has magnetic perimeter animations around **2.4–3 seconds**. Preserve these relationships unless measured UX testing suggests improvement.

## 5. Ambient effects, timing and motion language
Motion should be **peaceful, independent, polished, and purposeful**—not every element bobbing in unison.
- **Micro interactions:** about 150–350ms, responsive to click, tap, focus and hover.
- **Card hover/press:** about 300–450ms with tiny translation/tilt and soft reflected light.
- **Layout settling:** approximately 650ms in the current homepage logic.
- **Navigation comeback:** **1,950ms shared timeline** in current preview styling.
- **Artwork drift:** existing homepage artwork floats on roughly **5.5–6.4s** loops, with staggered/negative delays and small displacement.
- **Ambient halos:** longer, low-contrast loops (current CSS includes a ~7s glow).
- **Magnetic halo/perimeter:** current CSS ~2.4–3s, only while relevant.
- Avoid mechanical synchronized bobbing, repeated big zooms, constant shimmer on text, surprise sound, and excessive GPU effects.
- Animate primarily `transform` and `opacity`; minimize expensive blur/filter and layout properties during drag.
- Respect `prefers-reduced-motion: reduce`, `prefers-reduced-transparency: reduce`, visibility/background tab state, and battery-sensitive/mobile devices.
- Motion preferences are **cinematic / balanced / minimal**, observed in `app/page.tsx` via `1muslim-widget-motion`. These must actually influence the effect budget site-wide; do not treat the preference as cosmetic.

## 6. Cards: content, hierarchy, and behavior
- Each card has a purposeful job and clear information hierarchy: recognizable title, relevant Arabic label where useful, primary content, subtle metric/status, obvious action.
- Main content (e.g. Quran reading, video, call) must get **more room** than secondary widgets.
- Mirror-glass cards may have independent very slight movement; **pause or stabilize while hovered, focused, dragged, typed into, or read**.
- Card borders, reflected highlights, soft smoke and internal depth must match the homepage; avoid creating a different design for every route.
- Every action should update locally without removing/re-adding the whole card (likes, progress, toggles, saves).
- Keep overlays inside safe boundaries and avoid clipping cards, videos, dropdowns or dialogs.

## 7. Navigation, HudHud, greeting, and persistent experiences
- Use the actual homepage navigation as the behavioral reference for header, search, floating/bottom menu, and mobile states.
- HudHud is a **companion/orb with meaningful states**, not a random decorative icon; active/listening, idle, disabled, and moving states must be distinguishable.
- The floating HudHud control and nav must coordinate so they do not collide. When the top nav opens, the lower floating menu can descend smoothly; when it closes, controls return in a controlled sequence.
- Preserve the **Assalamu Alaykum** center→right transition and the reverse transition as part of the nav choreography.
- Persistent video/call overlays must minimize without losing session state, retain clear close/expand controls, and not cover Quran text or other critical content.
- Keyboard focus should follow navigation state, not become trapped in collapsed controls.

## 8. Mobile, responsive and accessibility contract
- Mobile-first visual consistency; respect iOS safe areas, virtual keyboard, viewport height changes, notch, and bottom home indicator.
- Reading/call/streaming screens prioritize a stable primary viewport; minimize unnecessary scrolling, but do not clip critical controls or force inaccessible fixed heights.
- Touch targets ideally ≥44×44 CSS px; visible focus styles, semantic buttons, accessible names, keyboard drag alternative.
- Contrast must remain readable through translucent glass. Day/night must be fully legible, not merely inverted.
- All timers and auto-hiding controls need a reliable way to reopen; respect reduced motion.
- No unbounded animation on offscreen cards.

## 9. Application of the standard: 1Muslim Originals
**Name:** 1Muslim Originals. **Member identity:** Original. **Scope:** preview only until release approval.
- Invite-code entry, email sign-in, verification, welcome, badge, numbered founding identity, missions and feedback **all inherit the homepage layers/cards/nav/motion language**.
- The cinematic welcome is a variation on existing overlay patterns, not a second design system.
- Unique codes are server-side, single-use and bound to a verified account. Founding numbers assigned transactionally. Never grant admin rights solely for an Originals code.
- Missions: discover, create useful content, go live, connect, report issues, suggest improvements. Reward quality, not volume.
- Support reduced motion and accessibility throughout.

## 10. Development guardrails and verification
1. **Preview first:** start from current main and validate in an isolated draft PR and preview. Do not change production or `main` without explicit instruction.
2. **Read before writing:** inspect `app/page.tsx`, `app/home-hub.module.css`, relevant shared components and current deployed behavior.
3. **Reuse before inventing:** extract shared primitives/tokens from working code incrementally, with screenshots/behavior comparison before and after.
4. **No silent regressions:** preserve nav choreography, HudHud travel, greeting shift, grid drag/packing, preferences, video, auth and existing routes.
5. **Test states:** signed in/out; day/night; cinematic/balanced/minimal; desktop/mobile; slow device; reduced motion; reduced transparency; keyboard/touch; modal open; dragging/resizing.
6. **Verify deployment:** a GitHub commit does **not** mean the Vercel build succeeded. Report build READY/ERROR accurately and check runtime behavior.
7. **No fake functionality:** support forms must store and notify; countdowns require a real date; invite codes must validate securely; store buttons require a real approved listing.
8. **Protect public launch:** capture the actual deployed guest entry before any rollout and preserve it until an explicitly approved release.

## 11. Change acceptance checklist
- [ ] Visually belongs to the real homepage (glass, smoke, mirror highlights, depth, color, typography).
- [ ] Header comeback and HudHud motion remain coordinated (~1.95s in current implementation).
- [ ] Assalamu Alaykum moves center→right and reverses without collisions.
- [ ] Grid drag, magnetic target, responsive repacking and settling still work.
- [ ] Motion is staggered and calm, with cinematic/balanced/minimal preferences honored.
- [ ] Cards are readable and usable on iPhone and desktop, day and night.
- [ ] Reduced-motion and reduced-transparency paths work.
- [ ] Existing functionality remains intact; no console/runtime/build errors.
- [ ] Preview deployment verified; production untouched unless expressly authorized.

**Principle:** The homepage is not just a color palette. It is the *behavioral, spatial, kinetic, and visual contract* for the entire 1Muslim experience.

## 12. v3.9 integration baseline and ownership

Source baseline `d52ceb99` (96 tracked page files). Profile editor and save actions come from #1586 (`81b04a18`), visitor-first cinema and edge-to-edge Spotlight from #1590 (`1d084f0f`), and compact Appearance and text/link Spotlight from #1591 (`2d89af48`). Preserve those entry points and the Spotlight schema. The table assigns review and file locks by workstream. Parameterized segments below are Next.js filesystem segments. The exact page inventory can be regenerated with `git ls-files 'app/**/page.tsx' app/page.tsx`.

| Owner | Checked-out routes and implementation boundary |
| --- | --- |
| A | `/auth`, `/onboarding`, `/welcome`, `/welcome/original`, `/recording-studio/shahadah`. Own auth/onboarding and `SeamlessEntry` / `LocationOnboarding`. B owns mounting from the shell. |
| B | `/`, `/features`, `/features/[slug]`, `/search`, `/settings`. Own `app/page.tsx`, `home-hub.module.css`, `GlobalNavigation`, `HudHudMotionShell` and root layout/styles. Explore work starts by tracing the existing home grid and feature routes. |
| C | `/profile`, `/profile/[id]` (redirects to the Muslimeen member selection), `/badges`, `/arabic-badges`, `/help/xp-levels`. Own both profile pages, appearance, Spotlight and `ProfileCinematicOverlay`. J supplies eligibility, H supplies background media, I supplies discovery. |
| D | `/streaming`, `/streaming/{go-live,library,recordings,scheduled}`, `/streaming/{live,replay,watch}/[id]`, `/audio-rooms`, `/live/companion`. Own Live media and mini-player lifecycle. |
| E | `/ummah`, `/posts`, `/posts/[id]`, `/posts/story/[id]`, `/community`, `/create`. Own post/deck/player integration including TikTok post rendering. |
| F | `/elm-tent`, `/elm-tent/{islam-trivia,lessons,quran,training}`, `/learn/elm-tent`, `/learn/elm-tent/{lessons,library}`, `/quran-{library,practice,recitals,studio}`. Lock reader, studio and Qur'an assets to F. |
| G | `/widget-tools/prayer/{learn,story}`. Own `PrayerLearning` and prayer experience styles. Coordinate the shared `/widget-tools/[tool]` route with B. |
| H | `/deepwatch`. Own player and watch synchronization. C mounts any profile background integration after agreeing the slot and media lifecycle. |
| I | `/find`, `/ashab`, `/as-sahaba` and the profile discovery surface. Own `RegionDiscovery`, `MemberDiscoveryContent` and member-region APIs. C owns profile mount changes. |
| J | `/unlocked`, `/premium`. Own Stripe and entitlement integration. Coordinate badge presentation with C. |
| K | `/admin/control`, `/admin/headquarters`, `/admin/desk` and HudHud launcher/voice behavior. B owns the shell slot. |
| L | `/admin/releases`, `/messages`, `/messages/{groups,new,public,sync}`, `/messages/call/[id]`, `/messages/call/dm/[id]`, `/notifications`. Release receipt changes enter through authenticated messaging contracts. Existing call and notification owners review shared changes. |
| TikTok | `/tiktok` and `/api/tiktok/*`. E owns post rendering. Keep the reviewer gate and explicit individual share. |
| Existing maintainers | Other `/admin/*`, `/hudhud/videos`, `/qibla` and its command, studio and newsroom routes, `/newsletter` and `/newsletter/[slug]`, `/video-of-the-day`, `/videos`, `/about`, `/data-policy`, `/discovery-files`, `/future`, `/growth`, `/messenger-design`, `/platform`, `/privacy`, `/support`, `/terms`. Coordinate cross-route changes through Bot 00. |

**Navigation inventory.** Root layout mounts `GlobalNavigation` within `HudHudMotionShell`. The global rail covers search, profile, Muslimeen, posts, messages, notifications, Qur'an, DeepWatch and Unlocked, with render exclusions for Home, onboarding, Go Live, auth/login, story detail and Create. Home uses its own choreography. Legacy `SiteNav` still has live call sites including Welcome, Find, Ashab and Community. `HudHudCollapsibleNav` has no app call sites in the baseline. Inventory page-local bars and persistent overlays before changing a shell exclusion (`rg -n 'SiteNav|HudHudCollapsibleNav|GlobalNavigation' app components`). Check root persistent Live, calls and Qur'an studio alongside the launcher. B owns preventing duplicate fixed chrome.

**Typography.** Preserve system fallbacks and existing Arabic shaping. Newsroom CSS imports DM Serif Display, Inter, Playfair Display and UnifrakturCook from Google Fonts. Their CSS references do not establish redistribution rights. The tracked tree has no WOFF/TTF/OTF files. F must record the source edition, license text and glyph/recitation validation before importing a Qur'an font or dataset.

## 13. Shared motion and cache contracts

B owns the first extraction from Home's existing magnetic handlers and settle timing. Proposed interface for consumers to review before implementation:

- Motion policy resolves the OS preference and existing `1muslim-widget-motion` preference. Reduced motion wins, with immediate final position, working actions and no decorative drift. CSS handles the initial preference before hydration.
- A gesture supplies pointer ID, start and sampled position/time, and a caller-selected axis and activation threshold. Return offset and velocity in CSS pixels and CSS pixels per second. Touch and mouse use Pointer Events. Capture only after activation, preserve native scrolling on the orthogonal axis and settle to rest on pointer cancel or lost capture. Suppress click only after an actual drag.
- Consumers own target geometry, allowed actions and commit decisions. The helper provides frame-batched transforms and settling. Keep Home packing, E deck dismissal and C avatar docking in their owners' code. A keyboard-accessible action invokes the same commit path and keeps focus on the moved item or its successor. Haptics are optional after committed input and degrade to the existing visual feedback on unsupported devices.
- The shell owns safe-area insets and overlay stacking. Feature controls use local scrolling, logical sizing and a 44 CSS px minimum hit area. Mount only active media, reserve dimensions for lazy posters and keep transforms off Arabic glyphs.

The current global rail warms six routes after a 450 ms timer and also prefetches on pointer/touch and selection. B owns replacing eager warming after baseline capture. Proposed budget is one active warmup and one replaceable pending intent. Cancel caller-owned fetches on changed intent and skip speculative work with Save-Data or slow connections. Next router cache remains framework-owned. Preserve query parameters that identify a destination.

| Surface | Warm on intent | Invalidation and limits |
| --- | --- | --- |
| Auth | Public sheet code after opener interaction | User/session changes clear scoped client caches. No speculative private fetch or mic/location permissions. |
| Posts | Current and next poster only | Invalidate affected post and feed on publish/delete. Pause offscreen media and discard poster references when leaving the deck. |
| Live | Discovery metadata only | Reconcile realtime with server status after reconnect. Never preload tokens, camera or viewer sessions. End and disconnect invalidate active status. |
| Profiles | Public shell and already-authorized avatar metadata | Key by viewer plus target for private reads. Refresh on edits, consent changes and session changes. |
| Map | Anonymous aggregates for current viewport/zoom | Cancel superseded bounds requests. Consent revocation invalidates previews. No precise coordinates or identity speculation. |
| Players | Poster and current episode metadata | Tear down unused players, tracks and subscriptions. Keep an explicitly active persistent player mounted across navigation. |

## 14. Acceptance and rollout gates

The following budgets are proposed integration targets. The offline source baseline contains no comparable FPS or Core Web Vitals measurements for this commit. With CI placeholder Supabase values, Next reported 177 kB of first-load JavaScript for Home (103 kB shared across routes) and generated 165 static pages. These are build figures. Local preview could not bind to loopback in this sandbox, so reference captures remain pending. Capture baseline first under the same device, account, network, motion setting and cold/warm cache conditions. Use five lab repetitions with median and worst values, plus field p75 where available. Record trace and build SHA with each result.

| Gate | Evidence required |
| --- | --- |
| Entry and navigation | Guest LCP ≤2.5 s, CLS ≤0.1 and field INP ≤200 ms. Warm navigation click-to-content ≤500 ms median. Save network waterfall and note empty frames, duplicate chrome and blue flashes. |
| FPS and memory | Aim for 60 fps on supported reference devices and p95 frame interval ≤20 ms during drag on a 60 Hz display. After ten route round trips, settled retained JS heap within 10% of warmed baseline in a comparable Chromium trace. Check Safari allocations and detached media separately. |
| Media | Zero speculative video bytes for queued deck items. Current + next poster maximum. Capture first-frame and reconnect timings versus baseline, track counts and teardown after exit. |
| iOS Safari and desktop capture | At minimum, capture guest → auth → Home in light and dark, shell collapse and back, profile owner Appearance and visitor Spotlight close, Ummah gentle release and flick, Qur'an reflow, Salah resume, map zoom, and Live start/minimize/restore/end. Record phone orientation, viewport and browser version. Repeat reduced motion and slow network. |
| Accessibility | Keyboard tab order, focus restore, Escape, equivalent drag actions, VoiceOver on iOS, desktop accessible names, contrast, touch targets, safe areas and virtual keyboard. |
| Data, RLS and permissions | Verify guests, two distinct members and admin against a disposable authorized environment. Session refresh starts in `middleware.ts` via `utils/supabase/proxy.ts`. Verify guest redirects preserve the destination, including query parameters, and test access at the API/RLS layer as well as through the shell. Verify storage and RLS denial for private Shahada, profile/message cross-user access, and revoked map consent (`20261122214000_member_country_directory_consent.sql`). Exercise LiveKit token ACL and guest capacity policy (`20261031071703_liveguests1_capacity_and_roles.sql`), denied mic/camera, stop and reconnect, plus role checks for admin voice, releases and region routes. Verify Stripe checkout disabled without verified IDs and legacy subscription status using test-only access. Source and migration presence cannot establish deployed grants. |
| CI and release | `validate.yml` runs four Live Cinema/LiveGuests test files, TypeScript and build. Run `node --test scripts/*.test.mjs` for all seven files. Browser, real RLS, media QoE and Web Vitals require separate evidence. Record preview READY, scoped smoke and rollback SHA before requesting readiness. |

**Sequence.** Bot 00 locks shared files, records reference captures and approves B's interface PR before dependent UI PRs. A, C, D and K submit shell integration through B. I and H submit profile interfaces to C before mounting. E integrates TikTok rendering after the post contract. C consumes J's achievement contract after eligibility is verified. L waits for verified production READY and smoke before sending the single release receipt. Each draft records its parent dependency and flag/default. Flags for risky work default to the existing path and roll back independently. Stop shared runtime changes when the baseline is unverified or a regression is active.
