# Community Posts 3.0 — Bot B Round Two handoff

**Scope:** visual/media refinement only. **Branch:** `bot-b/community-posts3-round2-20261031` based on round-one Bot B `bot-b/community-posts3-media-20261031`. No production changes or merges authorized.

## First-read provenance
- Round-one Bot A [PR #295](https://github.com/ElmiandCo/1Muslim/pull/295) and its handoff; round-two Bot A [PR #297](https://github.com/ElmiandCo/1Muslim/pull/297) and `docs/community-posts-3.0/bot-a-round2-handoff.md` reviewed before implementation.
- Round-one Bot B [PR #296](https://github.com/ElmiandCo/1Muslim/pull/296) and `docs/community-posts-3.0/bot-b-media-handoff.md` reviewed before implementation.
- [Reference PNG 1 — 91972156](https://github.com/ElmiandCo/1Muslim/blob/docs/community-posts-3-reference-folder/docs/community-posts-3.0/references/91972156-9A1F-41A8-BF17-8CB8484984AE.png)
- [Reference PNG 2 — EFB1C829](https://github.com/ElmiandCo/1Muslim/blob/docs/community-posts-3-reference-folder/docs/community-posts-3.0/references/EFB1C829-EAE6-42DA-8AEF-8C681871E2B7.png)
- Both files exist on the reference branch; connector returned Git blob SHA but **no PNG bytes** for either, and the raw GitHub endpoint was inaccessible to the image runner. The user's earlier in-conversation screenshot visibly shows reference 1 embedded on GitHub. **Reference 2's visual content remains uninspected.** Do not claim pixel-perfect fidelity.

## Reference-to-component mapping
| Reference detail | Component / Round Two treatment |
| --- | --- |
| Ref 1: emerald/gold Qur'an reflection with fine ornament, reference badge and Arabic | `CommunityPostPresentation.module.css`: theme-aware gold trim, compact eyebrow badge, luminous verse surface and pill-shaped reference; actual verse content only |
| Ref 1: landscape video with center Play and duration | `CommunityPostPresentation.tsx`: actual uploaded video frame requested near viewport, natural video aspect ratio, real metadata duration badge, click-to-play only |
| Ref 1: one large landscape plus two stacked image thumbnails | `CommunityPostPresentation.tsx` + CSS: two-to-four-image responsive mosaic; single/large galleries preserve horizontal scrolling |
| Ref 1: real author portraits, compact type label and glowing avatar | `CommunityMediaFeed.tsx` + CSS: existing saved `ProfileAvatar` config, profile deep link, small Qur'an/Video/Photos badge; no invented usernames or metrics |
| Ref 2: second uploaded image | **Visual inspection blocked**; preserve its source link and require human screenshot comparison before approval |

## Implemented in Round Two
1. **No eager video fetch for offscreen posts:** native poster video metadata is requested only when within 320px of the viewport using IntersectionObserver. Existing tap-to-play behavior stays intact. The video file is never duplicated.
2. **Responsive video poster:** use native width/height metadata (clamped to practical feed ratios) and duration. iOS may decline preloading a frame; a theme-aware placeholder with a real Play button remains visible, never a fabricated image.
3. **Photo mosaic:** 2 images side-by-side, 3 images large+two stacked, 4 images 2x2. Other galleries remain scrollable. No new media assets or altered storage paths.
4. **Real member avatar:** use the saved profile avatar configuration and deep-link to the member profile; small theme-aware content-type badge.
5. **Qur'an card polish:** layered gold trim, subtle light and theme-aware borders; no fabricated mosque art or audio waveform.
6. **Contract tests:** verify poster lazy loading, tap-to-play, no YouTube autoplay, mosaic classes, actual profile avatars and reduced-motion support.

## Before/after and visual QA
- **Before:** Round-one Bot B [preview](https://1muslim-nvogdadpz-elmiandco.vercel.app) (head `d19892a`).
- **After:** use the new stacked PR's Vercel preview once READY; compare /community, Canvas Posts and /posts/[id] on 390px iPhone and desktop widths.
- **Actual before/after screenshots:** **NOT CAPTURED**. This automation has GitHub/Vercel API access but no authenticated screenshot browser to capture the private preview; do not represent mockups as device screenshots. A reviewer must attach both real preview screenshots to the PR before approval.
- QA gates: verify all six themes, Day/Night, reduced motion, iOS Safari poster/keyboard/scroll, portrait and landscape video, two-to-four-image mosaics, YouTube click-to-load, stale signed URLs and profile avatar privacy/RLS.

## Integration blocker (not hidden)
Bot A's 3-level comments use `ummah_feed_posts` / `ummah_post_comments`; canonical media uses `posts` / `post_media` / legacy `comments`. **This branch does not pretend these are one schema.** Do not merge PR #295/#297 and #296/this PR independently; first implement an explicit canonical media interaction adapter without duplicate post rows. Also reconcile pending typed templates PR #275 and Daily-post rules PR #276. Bot A's `UmmahConversation`, its API endpoints, SQL migration and tests were **not modified**.

## Release
- Stacked PR for review only. No merge to `main`, no Supabase migration and no production deployment.
