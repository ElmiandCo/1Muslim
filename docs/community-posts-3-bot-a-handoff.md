# Community Posts 3.0 — Bot A handoff (2026-10-31)

**Branch:** `bot-a/community-posts-3-interactions-20261031` from latest `main`. **Never merge/deploy without approval.**

## Delivered
- Reused production schema: `ummah_feed_posts`, `ummah_post_comments`, `ummah_post_likes`, `ummah_comment_likes`, `profiles` and existing `community-media` storage bucket. No per-user database.
- Added `UmmahConversation` full-screen, responsive glass viewer: comment/reply trees with collapse/expand, max 3 levels, tap comment to drill in/back, author avatar/name opens profile modal, post/comment likes, native/copy sharing, 5MB PNG/JPEG/WebP comment image uploads, accessible controls and 16px iOS composer.
- Added `/api/ummah-post-likes` and `/api/ummah-post-shares` engagement endpoints. Existing `/api/ummah-comments` now enriches comment authors, signs approved comment images and validates ancestry/attachments. Shares are counted only for successful authenticated share actions; anonymous users can still share.
- Integrated the viewer into `app/community/page.tsx`, `CanvasSecondaryApp.tsx` and `CanvasUmmaGallery.tsx`; replaced Community page's nonpersistent like stub.
- Added migration `20261101004000_community_posts_3_interactions.sql`: nullable image path, relaxed image-only comment constraint, DB-enforced ancestry validation trigger, RLS-protected share-event table and Supabase Realtime publication. Existing RLS on comments and likes was inspected read-only in connected SecureApp project. **Migration NOT applied to any database.**
- Realtime listens to comment inserts/deletes, comment likes, post likes and shares; a 30-second fallback refresh remains for reconnection resilience.

## Bot B coordination / no conflict
Bot B owns **media templates, YouTube/player thumbnails, visual post-card design and one-upload video distribution**. Please preserve Bot A's new `UmmahConversation.tsx`, `UmmahConversation.module.css`, `/api/ummah-*` endpoints and migration. If editing `app/community/page.tsx`, `CanvasSecondaryApp.tsx`, `CanvasUmmaGallery.tsx` or `/api/community-posts/route.ts`, integrate these changes rather than overwriting them. Bot B should ensure the post card's media preview is included in full-screen view (Bot A viewer currently renders post text + comments; media templates remain Bot B's scope). Video uploads must reference a single media asset across Posts, For You and All Videos; the existing `ummah_feed_posts` and `posts` are separate tables, so inspect current media flow before claiming single-record architecture.

## Required validation before approval
1. Run `node --test scripts/community-posts-3.test.mjs`, `npx tsc --noEmit`, `npm run build` on isolated branch.
2. Apply SQL migration **only to an approved preview/staging DB**; verify comments, parent ancestry, 4th-level rejection, cross-post rejection, image-only comments, spoofed path rejection, share RLS (anon/authenticated), realtime publication, and file size/MIME checks. Do not apply production migration implicitly.
3. Test signed-out read and share, signed-in comment/like/image upload, two-device realtime updates, comment deletion cascade, mobile keyboard/scrolling, Escape/back navigation, all six themes and reduced-motion.
4. Validate the existing `community-media` storage policy and service key: signed image URLs for public comments are minted server-side only for RLS-readable comment-linked owner-scoped paths. Without service role configuration, guest image URLs may be unavailable.
5. Check Bot B's concurrent PR for conflicts; do not merge until the two PRs are reconciled.

## Known limitations
- No production schema changes, user-generated test data, browser QA, or deployment performed by Bot A.
- Comment likes listen to global comment-like events while a viewer is open; the 300ms debounce limits reloads, but scale testing is still needed.
- Legacy inline comments handlers remain in older canvas components but their overlay was replaced; clean up dead handlers during integration to reduce extra fetches.
- The Community page's old Share button still uses the prior share path; the full-screen viewer uses the new deep link and tracked share endpoint. Bot B can unify the card share action.
- A PR build may reveal type/format issues; treat CI as mandatory before approval.
