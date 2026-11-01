# Community Posts 3.0 — Bot B Round Three handoff (2026-10-31)

**Status: BLOCKED on Bot A's Round Three canonical integration contract. Do not merge, deploy, or apply a production migration.** This branch contains an isolated media-feed safety fix, not a canonical database adapter.

## Provenance / required first-read
- [PR #307 canonical integration audit](https://github.com/ElmiandCo/1Muslim/pull/307) and `docs/community-posts-3.0/canonical-integration-audit.md` read.
- Bot A [PR #295](https://github.com/ElmiandCo/1Muslim/pull/295) and [PR #297](https://github.com/ElmiandCo/1Muslim/pull/297), including `docs/community-posts-3.0/bot-a-round2-handoff.md`, read.
- Bot B [PR #296](https://github.com/ElmiandCo/1Muslim/pull/296) and [PR #300](https://github.com/ElmiandCo/1Muslim/pull/300), including `docs/community-posts-3.0/bot-b-round2-handoff.md`, read.
- **Bot A Round Three handoff `docs/community-posts-3.0/bot-a-round3-handoff.md`: NOT FOUND** on `main`, Bot A Round Two branch, or an available Bot A Round Three branch at the time of this work. GitHub branch search for `round3` and `bot-a` returned no Bot A Round Three branch. This required contract cannot be assumed.

## Live schema (read-only query; no DDL/DML)
Supabase SecureApp project `njilnqgdfrvpvgbkodwl`, public schema:
- `posts(id uuid, user_id uuid, body text, created_at timestamptz, updated_at timestamptz)`.
- `post_media(id uuid, post_id uuid, user_id uuid, storage_path text, file_name text, mime_type text, created_at timestamptz)`; `post_media.post_id -> posts.id`.
- `comments(id uuid, post_id uuid, user_id uuid, body text, created_at timestamptz, updated_at timestamptz)`; `comments.post_id -> posts.id`. **No `parent_id` in current canonical comments table**.
- `post_likes(post_id uuid, user_id uuid, created_at timestamptz)`; `post_likes.post_id -> posts.id`.
- `ummah_feed_posts(id uuid, author_id uuid, body text, created_at timestamptz)`.
- `ummah_post_comments(id uuid, post_id uuid, author_id uuid, parent_id uuid nullable, body text, created_at timestamptz)`; `ummah_post_comments.post_id -> ummah_feed_posts.id`.
- `ummah_post_likes(post_id uuid, user_id uuid, created_at timestamptz)`; `ummah_post_likes.post_id -> ummah_feed_posts.id`.

PR #307 recorded counts: 1,237 `posts`, 69 `ummah_feed_posts`, 28 `post_media`, 30 `comments`, 3 `ummah_post_comments`, 115 `post_likes`, 32 `ummah_post_likes`. Counts are a snapshot, not a guarantee of current totals.

## Existing API and mapping contract (NOT yet unified)
- `GET /api/community-posts`: returns `{posts:[{id,author_id,body,created_at,author_name,author_handle}]}` sourced from `ummah_feed_posts`.
- `POST /api/community-posts`: accepts `{text,media?:{storage_path,file_name,mime_type}}`, inserts an `ummah_feed_posts` row and, when media exists, **separately inserts a `posts` row** and `post_media` row; returns `{post:{id,author_id,body,created_at}}` using the Ummah ID. **No durable mapping between the two IDs.** Do not claim this is one canonical post.
- `CommunityMediaFeed.tsx` reads `post_media`, then `posts`, then `profiles`, creates 3600-second signed `community-media` URLs, and links `/posts/{posts.id}`. This is intentionally unchanged until Bot A defines the canonical ID mapping.
- Bot A Round Two `UmmahConversation.tsx` reads `/api/ummah-comments?postId={ummah_feed_posts.id}`, `/api/ummah-post-likes?postId=...`, and `/api/ummah-post-shares?postId=...`. **Those endpoints cannot be passed a `posts.id` and assumed to work.**
- Canonical `posts.id` to `ummah_feed_posts.id` mapping: **UNDEFINED; no mapping was introduced here**. Migration name, adapter API, backfill algorithm and response payload contract: **PENDING BOT A HANDOFF**.

## Round Three changes on isolated Bot B branch
Base: `bot-b/community-posts3-round2-20261031`. Branch: `bot-b/community-posts3-round3-media-safety-20261031`.
1. `app/components/CommunityMediaFeed.tsx`: use a monotonically increasing request generation number and `isCurrent()` guard to prevent an older overlapping refresh (publish event / visibility / periodic refresh) from replacing newer media rows or signed URLs, or setting stale errors. No changed layout, storage, RLS, posting, or autoplay behavior. Commit `de51dbc264e2bf30c38e92cbc73e60212034c613`.
2. `scripts/community-post-content.test.mjs`: add static source-contract regression test for latest-request-wins, signed URL refresh and guarded error/loading states. Commit `bbc19909a6a981969a2c801c520910f4bc7a544d`.
3. This handoff document.

## Verification
- GitHub connector readback of both changed files: **9/9 targeted static source assertions passed** (request version, increment, latest-only, success/error/finally guards, test presence, no database writes, no autoplay in media feed). Existing test file now declares **7 Node tests**, including the new one.
- **Node CLI / TypeScript / Next.js build not run** in this connector-only execution. No Vercel preview or screenshot claim. Do not interpret static assertions as full QA.
- Round Two behavior retained: real media signed URLs, click-to-play video, YouTube click-to-load, profile avatars, theme CSS variables, scroll, reduced-motion styles. No changes to those implementations in this round.

## Required Bot A -> Bot B reconciliation before implementation
1. Bot A must commit and link its Round Three handoff with **exact canonical table/column names, migration name, ID mapping, API route and request/response shape, RLS and realtime contract, tests, branch SHA**.
2. Confirm whether Bot A preserves `ummah_feed_posts` as a projection or migrates to `posts`, and how it handles existing 69 Ummah rows and 1,237 canonical rows without guesses, duplication or loss.
3. Confirm how `post_media.post_id` joins to the same canonical ID that comments, likes and shares use, and how existing `/posts/[id]` and For You / All Videos resolve IDs.
4. Only after agreement, implement an atomic, idempotent server-side publishing adapter. Do not remove the legacy dual-write or alter schemas piecemeal: doing so before Bot A's mapping is available could silently orphan media or comments.
5. Run actual Node tests, `npx tsc --noEmit`, Next.js build, staged migration/backfill, cross-surface QA (iOS scroll, six themes, click-to-play, For You and All Videos) before merging. No production DB writes or deployment authorized.

**Outstanding discrepancy:** Bot A Round Two's Ummah comment/like IDs and Bot B's canonical media IDs remain separate. This branch does **not** claim to fix that architectural blocker.
