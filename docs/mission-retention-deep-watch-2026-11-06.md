# 1Muslim — Mission, Retention & Deep Watch (production-based branch)

Baseline: production deployment dpl_CUY17W9qzph5ZDGdZmeQ7maneKmn, commit 3f37ca847e3b1eacd2d14c98e63ee8b20d6a57a8. Preserve existing Home UI, comments, Live, and playback. No automatic merge or production promotion.

## Mission
Create an About / Our Mission page: build a welcoming Muslim space centered on remembrance of Allah, Qur'an, patience, prayer, beneficial knowledge and community. Avoid manipulative engagement framing. Include clear invitation to bring others.

## Product audit and retention
Review four dimensions: Muslim community and education, niche social media, streaming/media, sustainable technology business. Audit Home, Magazine, Newsletter, Qibla/news, Qur'an, lessons, events, For You / Top 100, signup and return journeys. Community back pages are deferred for redesign. Finish XP/badges/levels and profile, lesson and Qur'an progress; provide meaningful progress surfaces and optional HudHud prompts without obstructing worship or media.

## Layer contracts
- ElmiLayerX: full-screen Deep Watch spotlight/dimming and its transitions; preserve existing comment animation behavior until verified.
- ElmiLayerY: player-local overlay (countdown, next-video arrows, 1Muslim mark).
- ElmiLayerZ: conceptual separation for floating live/chat and sent-comment animations; inventory actual code before refactoring. Do not break existing comments.
- HudHud renders above X and remains touchable.

## Deep Watch
- Default spotlight has three vertically selectable regions: top 10–40%, middle 30–70%, bottom 50–90% of viewport, feathered boundaries.
- Soft vertical hold/drag on dimmed space selects a region and snaps smoothly; avoid stealing ordinary page scrolling. Horizontal navigation to another app tab exits Deep Watch with a smooth fade.
- Night: black translucent mask; Day: white translucent mask, 80% opacity target. Preserve theme and readability.
- HudHud while Deep Watch is active: remains above overlay; may be moved horizontally/vertically to place spotlight freely, beyond the three vertical swipe presets. Normal anchor/behavior restored on exit.
- HudHud first tap expands spotlight vertically while preserving feathered dimming at edges; second tap fades dimming away entirely and releases controller mode.
- Quran Studio: recitation Play enables Deep Watch centered on current verse, follows verse changes; Pause, Stop, Previous verse and navigation exit. Keep controls usable and accessible.

## Acceptance
Mobile and desktop, day/night, swipe versus scroll, player navigation, Quran playback/pause/previous, HudHud tap/drag, existing comment animations and Live chat all regression tested. Never overwrite production UI while implementing these changes.
