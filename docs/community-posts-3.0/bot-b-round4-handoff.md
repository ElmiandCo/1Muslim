# Bot B — Round Four canonical media integration handoff

**Date:** 2026-10-31 Central. **Status: DRAFT; NOT MERGED; NOT DEPLOYED; NO LIVE DATABASE MIGRATION.** This is an isolated Bot B patch stacked on Bot B Round Three, not a fully combined Bot A + Bot B release.

## Required first-read and provenance

- **Read FIRST:** Bot A [Round Four handoff](https://github.com/ElmiandCo/1Muslim/blob/bot-a/community-posts3-round4-contract-20261031/docs/community-posts-3.0/bot-a-round4-handoff.md), published in [PR #310](https://github.com/ElmiandCo/1Muslim/pull/310). Also read Bot A [Round Three handoff](https://github.com/ElmiandCo/1Muslim/pull/309) and PRs #297/#295.
- Reviewed [audit #307](https://github.com/ElmiandCo/1Muslim/pull/307), Bot B [#308](https://github.com/ElmiandCo/1Muslim/pull/308), #300/#296.
- Branch: `bot-b/community-posts3-round4-atomic-media-20261031`; base: `bot-b/community-posts3-round3-media-safety-20261031`. Final head SHA: inspect this draft PR after documentation commit.
- Key commits: SQL RPC `36259309e7342e329a8def5704e04a8e5fffc94d`; API `86cde930744cf3b0a1543568d48b3e1c75fe3e95`; studio `06cef7c79d4870d196b16cd601b194a062445162`; media feed `596fd5c3b2349e552d906833a38a535f8f1d074d`; Daily retry `fb1afd3b1a15c56488e51482e66e6e0bb7f3f7f3`; tests `2c0bc040ba0f89e6203459e5871fb751d97ee1b4`; mobile action wrap `a66fcf5b397d7a4cced93826c54ed9c7b48630c4`; follow-up test `c862a5123fa6c4a4c6cd5ffa1071b560f53e1eb7`.
- Bot B posted a contract coordination comment on Bot A PR #310 **before implementation**. No incompatible Bot A schema or migration was copied.

## Canonical identity: exact Bot A agreement

| Surface | Post ID | Comments | Likes | Media |
|---|---|---|---|---|
| New media / For You / All Videos / `/posts/[id]` | `public.posts.id` | `public.comments.post_id -> posts.id` | `public.post_likes.post_id -> posts.id`, `comment_likes.comment_id -> comments.id` | `public.post_media.post_id -> posts.id` |
| Existing legacy Ummah text and interactions | `public.ummah_feed_posts.id` | `public.ummah_post_comments.post_id -> ummah_feed_posts.id` | `ummah_post_likes`, `ummah_comment_likes` | No legacy media FK |

These IDs are **never interchangeable**. Bot A's proposed `community_post_links` stays empty until independently proven historical pairs exist. **No historical backfill, deletion, migration or guessed mapping** was added. Legacy text posts and their comments/likes remain on the legacy API. The live RLS distinction remains: canonical posts authenticated-only, legacy Ummah feed anonymously readable.

## Round Four implementation

1. **New proposed SQL function** `supabase/migrations/20261101021500_community_media_atomic_publish.sql` (NOT applied). `public.publish_community_media_post(p_post_id uuid,p_body text,p_storage_path text,p_file_name text,p_mime_type text)` returns one row `{post_id:uuid,created_at:timestamptz,reused:boolean}`. `SECURITY INVOKER`, only authenticated EXECUTE, owner-scoped storage path and `auth.uid()`, validates body <=1000 and image/video MIME. Uses **existing** `posts` and `post_media` tables, no new mapping table or columns. A single Postgres function call inserts exactly one canonical post and one media attachment in the same transaction. `posts.id` and the one attachment's `post_media.id` are the client-generated `p_post_id` for retry idempotency; `post_media.post_id=p_post_id`. On conflict, it verifies identical owner/body/media payload; conflicting IDs fail. Failed attachment rolls back new post.
2. **`app/api/community-posts/route.ts`**: media POST now calls the RPC once; no separate PostgREST inserts or best-effort DELETE rollback. Accepts optional `postId` UUID (older clients without one get a server UUID but cannot guarantee retry idempotency), `text`, `media:{storage_path,file_name,mime_type}`. Media response HTTP 201 `{post:{id,user_id,body,created_at},source:"posts",reused:boolean}`. Legacy text GET entries carry `source:"ummah"`; text POST response `{post:{id,author_id,body,created_at},source:"ummah"}`. Invalid media/UUID rejected. Media caption max 1,000 (live DB check); legacy text remains max 2,000. Daily-post check excludes the same canonical `postId` on retries; existing daily and moderation logic otherwise preserved.
3. **`app/components/PostDesignStudio.tsx`**: stores a stable `postId` and `uploadPath` in `publishAttemptRef` for the same user/file/body, reuses the completed upload on network retry, and clears after success. Does not upload a second copy on retry after a successful upload.
4. **`app/components/CommunityMediaFeed.tsx`**: explicit `source:"posts"`, `data-canonical-post-id`, canonical `/posts/{id}` link and optional `onOpenConversation({id,author_id,body,created_at,source:"posts",author_name,author_handle})` adapter matching Bot A's `UmmahConversationPost` contract. The callback is **not wired yet** because the Bot A viewer/API is on a separate branch. A future integration parent can render `UmmahConversation` with that exact object. No fake legacy comments/likes/shares.
5. **`scripts/community-post-content.test.mjs`**: four new static contract tests (atomic source, retry identity, source-aware media callback, Daily retry), for **11 declared tests total**. Media action row now uses `flex-wrap:wrap` to avoid three-button overflow at narrow widths; no scrolling lock or container-height changes. No modifications to For You player, All Videos, media presentation play gate, six-theme palette, or global navigation.

## Existing surface compatibility evidence

- `ImmersiveVideoEntry.tsx` queries `post_media.post_id` and `posts.id` for For You video/images; `/posts/[id]/page.tsx` uses the same join and signed media paths. The new RPC inserts into those exact tables. No second upload or synthetic legacy post is needed.
- `CommunityPostPresentation.tsx` mounts its video player only after user clicks Play; YouTube is click-to-load. For You's existing video autoplay is **inside the manually opened immersive player**, not changed by this branch.
- Media feed styles use `--theme-accent`, `--theme-edge`, `--theme-surface`; six theme definitions and reduced-motion CSS remain unchanged. No scroll container height, `overflow`, `touch-action`, or body lock changed.
- Connector-side readback performed **20 targeted static checks**, all passed, covering RPC/source/IDs/retry/join/visual constraints. This is **not** Node, TypeScript, SQL, Next build, Safari, or runtime validation. The 11 Node tests are committed but **not executed** in this connector-only run.

## Required integration and release gates (DO NOT SKIP)

1. Combine the Bot A PR #310/#309 changes with this Bot B branch **without overwriting either side**. In the Community parent, wire `CommunityMediaFeed.onOpenConversation` to Bot A's source-aware `UmmahConversation` with `source:"posts"`. Legacy `source:"ummah"` must stay on legacy routes. Do not pass `posts.id` to `/api/ummah-*`.
2. On isolated staging clone, apply legacy `20261101004000_community_posts_3_interactions.sql`, canonical `20261101014500_canonical_post_interactions.sql`, then proposed atomic media RPC `20261101021500_community_media_atomic_publish.sql`. Run twice and verify migration replay, RLS, privileges, idempotent same-ID concurrent requests, rollback on invalid media, original counts, 3-level comments, likes, counters, realtime. **None has been applied to production.**
3. Run `node --experimental-strip-types --test scripts/community-post-content.test.mjs scripts/community-posts3-canonical.test.mjs`, `npx tsc --noEmit`, `npm run build`, and iPhone/desktop manual QA. Test all six themes, never-blocked scrolling, manual-play landing, For You/All Videos and canonical comment modal.
4. Validate anonymous legacy reading vs authenticated canonical media; do not widen canonical RLS or expose signed media URLs to guests. Validate moderation, Daily Post uniqueness under concurrent text/media submissions, long captions, failed uploads, retries, old clients and legacy 69 posts.
5. **Known limitation:** RPC is a new draft migration not in live Supabase, so media publishing on this branch will return a safe 503 until deployed to a tested environment. Existing legacy text continues to use its original path. Cross-namespace historical duplicates cannot be automatically reconciled without proven pairs. A concurrent legacy-text Daily Post and media Daily Post can still race because the legacy path has no shared transaction/lock. No false claim of production readiness.
6. PR is stacked on Bot B Round Three; merge/cherry-pick selectively into a new integration branch rather than blindly merging stale app snapshots. Do not deploy or merge before integration tests.

**Status:** canonical media RPC + retry-safe client + explicit Bot A source contract committed. Full combined comments UI, staging SQL verification, CI and browser QA are pending.
