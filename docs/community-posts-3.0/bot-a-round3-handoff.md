# Bot A — Round Three canonical comments / likes handoff (2026-10-31)

**Status:** implemented on isolated branch, **NOT MERGED**, **NO DATABASE MIGRATION APPLIED**, **NOT PRODUCTION-READY**. Read this before Bot B changes its media adapter. Do not assume the two UUID families are interchangeable.

## Sources / provenance
- Connected production Supabase project: `SecureApp`, project ref `njilnqgdfrvpvgbkodwl`; read-only schema and FK inspection.
- Audit: [PR #307](https://github.com/ElmiandCo/1Muslim/pull/307).
- Bot A base: [PR #297](https://github.com/ElmiandCo/1Muslim/pull/297) stacked on [#295](https://github.com/ElmiandCo/1Muslim/pull/295).
- Bot B: [PR #300](https://github.com/ElmiandCo/1Muslim/pull/300) stacked on [#296](https://github.com/ElmiandCo/1Muslim/pull/296).
- Branch: `bot-a/community-posts3-canonical-round3-20261031`, based on `bot-a/community-posts-3-round2-20261031`; code head before this handoff: `0ebf0015130ccf4d192c7206202c87271169d4ee`. Review final head SHA in this draft PR.

## Verified live schema (NOT inferred)
| Purpose | Canonical media family | Existing legacy Ummah family |
|---|---|---|
| Post | `public.posts(id uuid PK, user_id uuid FK profiles.id, body text, created_at, updated_at)` | `public.ummah_feed_posts(id uuid PK, author_id uuid FK auth.users.id, body text, created_at)` |
| Comment | `public.comments(id uuid PK, post_id uuid FK posts.id, user_id uuid FK profiles.id, body text, created_at, updated_at)` | `public.ummah_post_comments(id uuid PK, post_id uuid FK ummah_feed_posts.id, author_id uuid FK auth.users.id, parent_id uuid FK self, body text, created_at)` |
| Post like | `public.post_likes(post_id uuid FK posts.id, user_id uuid FK profiles.id, created_at; composite PK)` | `public.ummah_post_likes(post_id uuid FK ummah_feed_posts.id, user_id uuid FK auth.users.id, created_at; composite PK)` |
| Comment like | `public.comment_likes(comment_id uuid FK comments.id, user_id uuid FK auth.users.id, created_at; composite PK)` | `public.ummah_comment_likes(comment_id uuid FK ummah_post_comments.id, user_id uuid FK auth.users.id, created_at; composite PK)` |
| Comment media | `public.comment_media(id,comment_id FK comments.id,user_id FK profiles.id,storage_path,file_name,mime_type,created_at)` | image path added to `ummah_post_comments` by Bot A round-one migration |
| Post media | `public.post_media(id,post_id FK posts.id,user_id FK profiles.id,storage_path,file_name,mime_type,created_at)` | no native legacy post-media FK |

At audit: `posts` 1,237, `ummah_feed_posts` 69, `comments` 30, `ummah_post_comments` 3, `post_likes` 115, `ummah_post_likes` 32, `comment_likes` 9, `comment_media` 1, `post_media` 28. Counts are point-in-time, not a live invariant.

## New migration and exact columns
File: `supabase/migrations/20261101014500_canonical_post_interactions.sql` (not applied).
- Adds `public.comments.parent_id uuid NULL FK comments(id) ON DELETE CASCADE` and `public.comments.image_path text NULL`.
- Replaces old 1,000-character `comments_body_check` with `canonical_comments_content_check` (max 1,500; nonempty text OR owner-scoped PNG/JPEG/WebP image). Existing comment rows remain; legacy `comment_media` remains and is read.
- `canonical_comment_thread_guard` trigger rejects self, cross-post, fourth-level, and ancestry edits. Existing `comments` PK/FKs and RLS remain.
- Adds `public.post_like_counts(post_id uuid PK FK posts.id, like_count int, updated_at timestamptz)` and `public.comment_like_counts(comment_id uuid PK FK comments.id, like_count int, updated_at timestamptz)`; read-only RLS SELECT for anon/authenticated, no liker IDs. Insert/delete triggers on EXISTING `post_likes` and `comment_likes` maintain counts; idempotent upsert backfill.
- Adds `public.community_post_links(ummah_post_id uuid PK FK ummah_feed_posts.id ON DELETE CASCADE, canonical_post_id uuid NOT NULL UNIQUE FK posts.id ON DELETE RESTRICT, linked_at timestamptz)`. SELECT to authenticated only, **NO client write grant, NO automatic backfill**. Only reviewed trusted migration/RPC may link proven matches. Mapping may be empty. Never match by timestamps/text.
- Adds Realtime publication for `comments`, `post_like_counts`, `comment_like_counts` only if missing.
- **Preserves authenticated-only RLS on `posts` and `comments`.** Anonymous users must not gain access to non-live videos by this change. Anonymous aggregate counters expose no member IDs.
- Independent of Bot A round-one migration `20261101004000_community_posts_3_interactions.sql`, which also remains unapplied.

## API contracts (all new canonical routes; existing /api/ummah-* unchanged)
1. `GET /api/post-comments?postId=<posts.id>` → `{comments: [{id,post_id,author_id,parent_id,body,created_at,name,username,avatar_url,image_path,image_url,likes,liked}]}`. `author_id` is normalized from `comments.user_id`. Sorted ascending by created_at, max 500. Existing `comment_media` images are included as fallback. Signed URLs expire after 1,800 seconds. Authenticated post visibility follows existing RLS.
2. `POST /api/post-comments` JSON `{postId:posts.id,parentId:comments.id|null,body:string,imagePath:string|null}` → 201 `{comment: <same shape>}`; authenticated, same-origin, UUID checks, max 1,500 chars, max three levels, 5 MB owner-scoped PNG/JPEG/WebP in `community-media` bucket. Image upload path remains `<user-id>/ummah-comments/<uuid>.<ext>` for viewer compatibility. Existing `comment_media` rows are not rewritten.
3. `GET /api/post-likes?postId=<posts.id>` → `{count:number,liked:boolean}` from public aggregate + own `post_likes`. `POST /api/post-likes` JSON `{postId}` toggles authenticated user's existing `post_likes`, returns same shape.
4. `POST /api/post-comment-likes` JSON `{commentId:comments.id}` toggles authenticated user's existing `comment_likes`, returns `{liked:boolean,count:number|null}`.
5. Existing `/api/ummah-comments`, `/api/ummah-post-likes`, `/api/ummah-comment-likes`, `/api/ummah-post-shares` retain legacy semantics and IDs. Do not call them with `posts.id`.

## Viewer / Bot B integration contract
`app/components/UmmahConversation.tsx` exports `UmmahConversationPost`:
```ts
{ id: string; author_id: string; body: string; created_at: string;
  source?: "ummah" | "posts"; author_name?: string;
  author_handle?: string; avatar_url?: string | null }
```
- For **Bot B canonical media**, pass `{id: posts.id, author_id: posts.user_id, body: posts.body, created_at: posts.created_at, source: "posts", ...}`. This is mandatory: source defaults to `ummah` for existing callers. Never infer source from UUID.
- For legacy `ummah_feed_posts`, pass `source:"ummah"` or omit. Existing comments, likes, shares and IDs remain untouched.
- Viewer routes requests and Realtime to matching tables, retains 30-second fallback, scroll position, focus trap, 16px composer and reduced-motion CSS. Canonical shares are **link-only** until Bot B defines a reviewed canonical share count source; it must not increment legacy Ummah shares.
- For You / All Videos should use the SAME `posts.id` and `post_media` record as the canonical Community card. Never insert a second `ummah_feed_posts` record just to make a media card. Preserve manual-play/Live priority and all six themes.
- Do not introduce a second `comment_likes` table. It **already exists**, with 9 rows at audit.
- The `community_post_links` table is **not** an excuse to fabricate mappings. For old unlinked records keep source-aware compatibility; migrate/merge only with provable identities and preservation of all authors, timestamps, likes and thread relationships.
- Bot B should not modify `app/api/post-comments`, `app/api/post-likes`, `app/api/post-comment-likes`, `UmmahConversation`, or the canonical SQL without first coordinating a patch.

## Files touched
- `supabase/migrations/20261101014500_canonical_post_interactions.sql` (new).
- `app/api/post-comments/route.ts` (new).
- `app/api/post-likes/route.ts` (new).
- `app/api/post-comment-likes/route.ts` (new).
- `app/components/UmmahConversation.tsx` (source-aware change).
- `scripts/community-posts3-canonical.test.mjs` (new).
- This handoff (new).

## QA and unresolved release gates
- 12/12 independent source-pattern checks passed against the exact branch files using connector-side JS. `node --test scripts/community-posts3-canonical.test.mjs`, TypeScript build and SQL execution **not yet verified** at the time of handoff. Source checks do NOT prove runtime behavior.
- Live Supabase was inspected READ-ONLY. Neither SQL migration was applied, and no rows were inserted, updated or deleted.
- Required: apply BOTH migrations on isolated staging clone, run SQL/RLS tests (including original 30 comments and 9 comment likes), 3-level replies, cross-post rejection, guest post gate, image-only comments and existing `comment_media` images, count trigger correctness, authenticated/guest, two-device Realtime, Safari keyboard/scroll, six themes, reduced motion.
- **Architectural blocker:** existing `main` publishes every Community post to `ummah_feed_posts` and creates a second `posts` row for media, with no persisted mapping. Bot B must stop this dual-write and provide provable linkage for any legacy media; this Bot A branch does NOT alter publishing or automatically merge historical comments.
- New canonical share counters and notifications are not implemented; existing Ummah shares/notifications remain unchanged. Bot B must not present a fabricated canonical share count.
- No production merge or deployment authorized.

**Bot B: consume `posts.id` as the canonical media post identifier, `comments.post_id -> posts.id`, `post_likes.post_id -> posts.id`, and `comment_likes.comment_id -> comments.id`. If your media adapter needs different names or payloads, comment on both draft PRs before writing incompatible code.**
