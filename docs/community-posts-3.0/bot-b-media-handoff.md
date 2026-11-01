# Community Posts 3.0 — Bot B media/UI handoff

Base: main at c62d6f112b3d64fa0879e443c892c08140ad2611. Branch: bot-b/community-posts3-media-20261031. **Review only — no merge or deployment authorized.**

## Implemented
- Shared \`CommunityPostPresentation\` renders text, Qur'an Arabic/translation/reference, image, video, and Qur'an + video without creating new media assets. Reused by the composer live preview, main canvas Posts, /community, and /posts/[id].
- All six global themes are inherited through \`--theme-accent\`, \`--theme-edge\`, \`--theme-surface\`, \`--theme-secondary\`. Includes light mode, reduced motion, compact typography, and touch-friendly media scrolling.
- Uploaded videos show a seeked native video thumbnail with a Play overlay; only after a tap is the playable video mounted. YouTube links show the provider thumbnail; iframe is mounted only after a tap and does **not** autoplay. External links are parsed with a strict YouTube host/ID whitelist.
- \`CommunityMediaFeed\` reads existing \`posts\` + \`post_media\` + \`community-media\` signed URLs, groups multiple attachments under the **same canonical post**, and shows them in canvas Posts and /community. No duplicate media uploads.
- Media POSTs now create only the canonical \`posts\` content row plus its \`post_media\` attachment metadata, instead of also creating a second \`ummah_feed_posts\` content row. Existing text-only \`ummah_feed_posts\` publishing is unchanged. For You and All Videos already read \`posts\`/\`post_media\`, so the same uploaded media appears in all three surfaces. For You refreshes after a successful community publication without opening the player automatically.
- Added parser regression tests to the CI workflow.

## Bot A coordination
- Bot A owns likes, replies, comment images, live subscriptions, full-screen comment navigation, and comment security. **Do not replace Bot A's interaction code** with the legacy controls in this branch.
- The current data model has two post families: text-only \`ummah_feed_posts\` and canonical uploaded \`posts\`. The new media feed links canonical media to \`/posts/[id]\`; Bot A must explicitly support canonical media post comments/likes if unified interaction behavior is required. Do not silently insert duplicate \`ummah_feed_posts\` rows to achieve this.
- Conflict-prone files: \`app/components/CanvasSecondaryApp.tsx\`, \`app/api/community-posts/route.ts\`, \`app/community/page.tsx\`. Integrate Bot A and B surgically; preserve both changes.
- PR #275 contains a separate 30-layout typed registry. Reconcile its layout metadata with this shared renderer rather than building another parallel engine.
- PR #276 changes Daily-post selection. It also touches the API/composer; reconcile Daily logic and quota checks with the canonical media publishing path before merging.

## QA checklist (must be tested on preview)
1. Create text, Qur'an, image, video, and Qur'an+video; check Arabic, translation, reference, long text, responsive layouts.
2. Check all six themes plus Day/Night contrast and reduced-motion preference.
3. Verify uploaded video has **one** canonical \`posts\` row, one \`post_media\` row, and one storage object; it appears in Posts, For You and All Videos, with no duplicate feed entry for a new upload.
4. Verify YouTube watch/shorts/live/youtu.be preview thumbnail, tap-to-load player, no autoplay on initial feed or landing.
5. Verify iOS Safari poster frame, video controls, signed URL expiry/reload, landscape and portrait media.
6. Verify canvas and /community can scroll to the bottom, with no trapped touch or clipped controls.
7. Verify signed-in/guest RLS, content moderation, daily post status, post deletion and stale signed URLs.
8. Verify no regressions to For You's manual-open rule, active Live priority, or upload flow.

## Known limitations
- This branch does not add GIF comments, comment video uploads, or new database tables.
- Older media posts created by the previous dual-record flow may still have a corresponding historical text post; this patch prevents new duplicates but does not retroactively migrate them.
- Photo/video cards currently open canonical \`/posts/[id]\` for discussion; Bot A must wire the full three-level comment interaction across both post families.
- Build, visual QA and device verification must be confirmed by GitHub CI/Vercel before approval. No claim of production readiness without those checks.
