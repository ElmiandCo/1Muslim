# 1Muslim — Homepage-First Experience Standard
**Status:** Canonical design and interaction specification · **Scope:** Entire 1Muslim product · **Initial rollout:** Preview only
**Primary references:** `app/page.tsx`, `app/home-hub.module.css`, `app/layout.tsx`, existing shared components. **Never replace the established homepage with a generic dashboard.**

> **Core rule:** Every page should feel as if it belongs inside the homepage: same depth, layered glass, intelligent movement, tactile widgets, recognizable navigation, day/night treatment, and HudHud choreography. Reuse the real code, not an approximate visual recreation.

## 1. Source of truth and precedence
1. Inspect the **current preview homepage implementation** and working components before modifying any UI.
2. Preserve its existing behavior; use the original scrolling Video-of-the-Day homepage in **production** as the protected public experience until separately authorized.
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
1. **Preview first:** implement and validate on `feature/dashboard-custom-widgets`. Do not change production or `main` without explicit instruction.
2. **Read before writing:** inspect `app/page.tsx`, `app/home-hub.module.css`, relevant shared components and current deployed behavior.
3. **Reuse before inventing:** extract shared primitives/tokens from working code incrementally, with screenshots/behavior comparison before and after.
4. **No silent regressions:** preserve nav choreography, HudHud travel, greeting shift, grid drag/packing, preferences, video, auth and existing routes.
5. **Test states:** signed in/out; day/night; cinematic/balanced/minimal; desktop/mobile; slow device; reduced motion; reduced transparency; keyboard/touch; modal open; dragging/resizing.
6. **Verify deployment:** a GitHub commit does **not** mean the Vercel build succeeded. Report build READY/ERROR accurately and check runtime behavior.
7. **No fake functionality:** support forms must store and notify; countdowns require a real date; invite codes must validate securely; store buttons require a real approved listing.
8. **Protect public launch:** the restored production scrolling homepage with Video of the Day stays protected until an explicitly approved release.

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
