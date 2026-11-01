# Bot A — Round Four canonical source / Bot B integration contract

**Date:** 2026-10-31 (US Central). **Status: DRAFT ONLY; NO PRODUCTION DDL/DML; DO NOT MERGE OR DEPLOY.**

## Read first / immutable provenance

- This branch: `bot-a/community-posts3-round4-contract-20261031`, based on Bot A Round Three `bot-a/community-posts3-canonical-round3-20261031` at `923fe32b7021dd768055a3020e35a7e7629330fe`. For the final branch commit SHA, inspect this PR's HEAD (document updates change the SHA).
- Bot A PRs: [#309](https://github.com/ElmiandCo/1Muslim/pull/309) -> [#297](https://github.com/ElmiandCo/1Muslim/pull/297) -> [#295](https://github.com/ElmiandCo/1Muslim/pull/295).
- Bot B PRs: [#308](https://github.com/ElmiandCo/1Muslim/pull/308) -> [#300](https://github.com/ElmiandCo/1Muslim/pull/300) -> [#296](https://github.com/ElmiandCo/1Muslim/pull/296).
- Audit [#307](https://github.com/ElmiandCo/1Muslim/pull/307); Bot A [Round Three handoff](./bot-a-round3-handoff.md).
- Live Supabase SecureApp ref `njilnqgdfrvpvgbkodwl` was inspected **read-only** with `information_schema`, `pg_constraint`, `pg_policies` and aggregate counts. Nothing was migrated or modified.

## Decision: two source namespaces, NEVER UUID guessing

| Surface | Exact post identifier | Comments | Post likes | Comment likes | Media |
|---|---|---|---|---|---|
| Canonical media, For You, All Videos, `/posts/[id]` | `public.posts.id` | `public.comments.post_id` | `public.post_likes.post_id` | `public.comment_likes.comment_id` | `public.post_media.post_id` |
| Existing Ummah text feed, legacy Community | `public.ummah_feed_posts.id` | `public.ummah_post_comments.post_id` | `public.ummah_post_likes.post_id` | `public.ummah_comment_likes.comment_id` | **no native legacy post_media FK** |

**Canonical ID mapping is NOT an identity function.** `posts.id != ummah_feed_posts.id` in general. There is currently no live `community_post_links` table and no proven historical pair list. The *proposed* additive `public.community_post_links(ummah_post_id uuid PRIMARY KEY FK ummah_feed_posts.id ON DELETE CASCADE, canonical_post_id uuid NOT NULL UNIQUE FK posts.id ON DELETE CASCADE, linked_at timestamptz DEFAULT now())` records **only independently verified one-to-one pairs**. It begins empty, has no automatic backfill, is SELECT-only to authenticated, and requires a trusted reviewed migration/RPC to write. Never match by timestamp, body, author, filename, or proximity alone. An unmapped legacy post remains on the legacy API with all its comments/likes/shares. No post/media rows may be duplicated or deleted to force a match.

**Live row counts at this review:** posts 1,237; post_media 28; comments 30; comment_likes 9; comment_media 1; post_likes 115; ummah_feed_posts 69; ummah_post_comments 3; ummah_post_likes 32; ummah_comment_likes 1. Counts are a snapshot.

## Exact live columns, keys and policies (before migrations)

- `posts(id uuid PK DEFAULT gen_random_uuid(), user_id uuid NOT NULL FK profiles.id ON DELETE CASCADE, body text NOT NULL CHECK length 0..1000, created_at timestamptz, updated_at timestamptz)`.
- `post_media(id uuid PK, post_id uuid NOT NULL FK posts.id ON DELETE CASCADE, user_id uuid NOT NULL FK profiles.id, storage_path text, file_name text, mime_type text, created_at timestamptz)`.
- `comments(id uuid PK, post_id uuid NOT NULL FK posts.id ON DELETE CASCADE, user_id uuid NOT NULL FK profiles.id ON DELETE CASCADE, body text NOT NULL CHECK length 0..1000, created_at timestamptz, updated_at timestamptz)`. **No live parent_id/image_path** until the proposed migration.
- `post_likes(post_id uuid FK posts.id ON DELETE CASCADE, user_id uuid FK profiles.id ON DELETE CASCADE, created_at timestamptz, PRIMARY KEY(post_id,user_id))`.
- `comment_likes(comment_id uuid FK comments.id ON DELETE CASCADE, user_id uuid FK auth.users.id ON DELETE CASCADE, created_at timestamptz, PRIMARY KEY(comment_id,user_id))`. This is existing data, NOT a new table.
- `comment_media(id uuid PK, comment_id uuid FK comments.id ON DELETE CASCADE, user_id uuid FK profiles.id ON DELETE CASCADE, storage_path, file_name, mime_type, created_at)`.
- `ummah_feed_posts(id uuid PK, author_id uuid NOT NULL, body text NOT NULL, created_at timestamptz)`.
- `ummah_post_comments(id uuid PK, post_id uuid FK ummah_feed_posts.id ON DELETE CASCADE, author_id uuid FK auth.users.id ON DELETE CASCADE, parent_id uuid NULL FK ummah_post_comments.id ON DELETE CASCADE, body text NOT NULL, created_at timestamptz)`.
- `ummah_post_likes(post_id uuid FK ummah_feed_posts.id ON DELETE CASCADE, user_id uuid FK auth.users.id ON DELETE CASCADE, created_at timestamptz, PRIMARY KEY(post_id,user_id))`.
- `ummah_comment_likes(comment_id uuid FK ummah_post_comments.id, user_id uuid FK auth.users.id, created_at timestamptz)`.
- RLS live: `posts` and `comments` SELECT authenticated only; `comments` INSERT owner-scoped; `post_likes` INSERT/DELETE owner-scoped; `comment_likes` INSERT/DELETE owner-scoped, existing SELECT public. `ummah_feed_posts` SELECT allows anon and authenticated; `ummah_post_comments` SELECT public. **Do not widen canonical post visibility to anon**, including the signed media URL path.

## Migration contract — idempotent, unapplied

Bot A Round Three already proposes `supabase/migrations/20261101014500_canonical_post_interactions.sql`, which MUST run **after** the separate legacy `20261101004000_community_posts_3_interactions.sql` on an isolated staging clone. Do not copy either migration into Bot B or invent another counter/mapping table.

It adds nullable `comments.parent_id` FK to `comments.id`, nullable `comments.image_path`, 1,500-character or image-only content check, parent guard for at most 3 levels and same-post ancestry, indexes, `post_like_counts` and `comment_like_counts` (public aggregate SELECT only, trigger-maintained), `community_post_links` (verified-only, empty), and Realtime publication registration. Existing 30 canonical comments, 9 canonical comment likes, 3 Ummah comments and 32 Ummah post likes MUST remain unchanged. Existing `comment_media` is read as fallback.

**SQL is a proposed file, NOT applied.** Migration is designed for rerun (`IF NOT EXISTS`, drop/create named triggers/policies, `ON CONFLICT` counter backfill), but actual staging replay and concurrent-write tests are **not yet verified**. Run twice in staging, verify data snapshots, counters and RLS; do not assume idempotence is proven by source inspection. No historical `community_post_links` insert is included.

## Exact API contracts (Bot A Round Three source)

**Canonical source `source:"posts"`**
- `GET /api/post-comments?postId=<posts.id>` -> `{comments:[{id,post_id,author_id,parent_id,body,created_at,name,username,avatar_url,image_path,image_url,likes,liked}]}` (max 500 sorted oldest first; authenticated visibility via `posts` RLS; signed image URLs 1800 seconds).
- `POST /api/post-comments` JSON `{postId:posts.id,parentId:comments.id|null,body:string,imagePath:string|null}` -> HTTP 201 `{comment:<same shape>}`; auth, origin/UUID, same-post, max 3 levels, PNG/JPEG/WebP up to 5 MB owner-scoped path.
- `GET /api/post-likes?postId=<posts.id>` -> `{count:number,liked:boolean}`; `POST /api/post-likes` JSON `{postId:posts.id}` -> same shape, authenticated toggle.
- `POST /api/post-comment-likes` JSON `{commentId:comments.id}` -> `{liked:boolean,count:number|null}`, authenticated toggle.
- `UmmahConversation` prop: `{id:posts.id, author_id:posts.user_id, body:posts.body, created_at:posts.created_at, source:"posts", author_name?, author_handle?, avatar_url?}`. **Always supply source**. Its canonical Realtime tables are `comments`, `comment_like_counts`, `post_like_counts`; 30-second fallback; scroll/focus/16px composer retained.
- Canonical shares are **link-only** until a reviewed canonical share table/counter exists. Never increment `ummah_post_share_counts` for a `posts.id`.

**Legacy source `source:"ummah"` (or omit only for old callers)**
- `GET/POST /api/ummah-comments` with `postId:ummah_feed_posts.id`; `/api/ummah-post-likes`, `/api/ummah-comment-likes`, `/api/ummah-post-shares` all remain on legacy IDs. Their contracts must not be silently redirected to `posts`.
- Existing `GET /api/community-posts` returns legacy `{posts:[{id,author_id,body,created_at,author_name,author_handle}]}`; existing `POST /api/community-posts` takes `{text,media?:{storage_path,file_name,mime_type}}`, currently inserts legacy post and for media *also* canonical `posts` + `post_media` with unrelated UUIDs. **This is the dual-write bug Bot B owns**.

**Bot B must implement:** For newly published media, persist one `posts` + `post_media` identity and use `posts.id` in Community media card, For You, All Videos and `/posts/[id]`; pass `source:"posts"` to the Bot A viewer. Legacy text posts stay on `ummah_feed_posts` until a separately reviewed migration/adapter. Do not delete the old legacy write without verifying daily-post, moderation and legacy feed behavior; a server-side transactional publish path is required for atomicity. Return a source discriminator to clients for mixed feeds. If an actual projection is needed, create it only after both bots agree on its contract and a staged migration. Preserve manual-play/no-autoplay, six themes, mobile scroll, existing uploads and legacy data.

## Bot B compatibility checklist

1. Import the source-aware viewer from Bot A PR #309 and use `source:"posts"` for `CommunityMediaFeed` cards. Do not pass `posts.id` to any `/api/ummah-*` endpoint.
2. No duplicate `ummah_feed_posts` creation for newly published canonical media. Do not synthesize an `ummah_feed_posts.id` from a `posts.id`.
3. Keep legacy `ummah_feed_posts` cards on `source:"ummah"`; never hide 69 existing rows or orphan their interactions.
4. Preserve the same `post_media.storage_path`/canonical ID for For You and All Videos. No second upload.
5. Check the existing `posts.body` 1,000-character CHECK when adapting the 2,000-character Community editor; agree on validation or separate migration before shipping.
6. Test idempotent request retries and atomicity, moderation/daily-post flows, RLS, image-only comments, 3-level replies, like counters, iOS keyboard and scrolling, themes, no autoplay.
7. If Bot B needs different API keys, mapping semantics or migrations, comment on BOTH draft PRs before changing code.

## Verification / blockers

- Reviewed PRs #307, #295, #297, #296, #300, #308 and #309 and their available handoffs.
- Re-read live columns, FKs, RLS and counts read-only; canonical `comments.parent_id`, `comments.image_path`, counters and mapping table **not present**.
- Existing Round Three source-contract checks: 12/12 connector assertions reported; Node, TypeScript, Next build, SQL replay, device/browser QA **not yet verified in Round Four**.
- **Critical risk:** `posts.body` has a live 1,000-character limit; current Community editor accepts 2,000. Bot B must handle explicitly. **Critical risk:** current Community media dual-write is non-atomic and leaves no identity mapping. **Critical risk:** legacy anon-readable posts differ from canonical authenticated-only posts.
- No live database writes, no merge and no production deployment. Do not mark integrated until both branches are combined and staged tests pass.

## Round Four implemented interaction hardening (on this branch)

- `app/api/post-likes/route.ts`: GET now first resolves `posts.id` under the caller's existing RLS, returning 404 when unavailable instead of disclosing like counts for a non-readable canonical post. The POST toggle uses `INSERT` rather than `UPSERT`, because live `post_likes` RLS grants INSERT/DELETE but no UPDATE; unique-violation `23505` is handled as an already-existing like and actual state is read back.
- `app/api/post-comment-likes/route.ts`: same `INSERT` vs `UPSERT` correction under existing `comment_likes` RLS; handles `23505`, reads back actual `liked` state rather than assuming `!existing`.
- `scripts/community-posts3-canonical.test.mjs`: adds two regression cases covering INSERT-only policies, actual-state response and post-visibility gating.
- **Connector-side verification:** 16/16 targeted source readback assertions passed after the edits. This is *static verification only*, not a successful Node/TypeScript/Next build or staged SQL test. Full CI, device, concurrent-toggle and RLS tests remain required.
- **Privacy audit note:** live `comment_likes` has a pre-existing public SELECT policy on raw `user_id` rows. New aggregate counters are privacy-preserving, but this older raw policy is not; tightening it requires a separate compatibility audit because other site components may read the table. Do not claim the whole platform's liker IDs are hidden.
- The changes above do **not** alter legacy Ummah routes/tables, `post_media`, publishing, or the migration SQL. No database writes occurred.

**Round Four draft:** [PR #310](https://github.com/ElmiandCo/1Muslim/pull/310). Bot B handoff comment posted on [PR #308](https://github.com/ElmiandCo/1Muslim/pull/308). Final branch SHA must be read from PR #310 after the last documentation update.
