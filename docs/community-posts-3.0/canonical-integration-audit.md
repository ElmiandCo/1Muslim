# Community Posts 3.0 — canonical integration audit (2026-10-31)

Status: **integration blocked; do not merge Bot A/B yet**. This is an evidence-backed handoff, not a completed adapter.

## Live database (read-only)
Connected Supabase project SecureApp `njilnqgdfrvpvgbkodwl` contains **one** database, with two separate post families:
- `posts`: 1,237 rows; `comments`: 30; `post_likes`: 115; `post_media`: 28.
- `ummah_feed_posts`: 69 rows; `ummah_post_comments`: 3; `ummah_post_likes`: 32.

FK inspection confirms each comment/like family points to its own parent table. They are not aliases.

## Critical existing behavior
On `main`, `app/api/community-posts/route.ts` currently inserts **every new Community post** into `ummah_feed_posts`. When media is attached, it **also inserts** a separate `posts` record and a `post_media` record, with *different IDs and no persisted mapping*. This is a real dual-write, not just a naming discrepancy. Existing `posts` rows must not be blindly migrated or duplicated.

## Required implementation before merging
1. Inventory all readers/writers of both families, including For You and All Videos, and establish which `posts` records are already surfaced elsewhere.
2. Add an idempotent, indexed mapping `ummah_post_id -> canonical_post_id` with unique constraints and explicit backfill rules. For historical media records without provable identity linkage, leave unmapped and flag for manual reconciliation; never infer by text/time alone.
3. Make Community publishing transactional through a server-side RPC, writing one canonical `posts` record and linking a Community feed projection, without creating duplicate media uploads.
4. Route Bot A's threaded comment UI to the canonical post ID via a compatibility API, preserving existing `ummah_post_comments` and likes. Backfill with preserved authors, timestamps, parent-child ordering and like attribution, in a reversible, idempotent migration.
5. Ensure the new adapter supports 3-level threaded replies, comment likes, share counts, realtime subscriptions, RLS, anonymous reading, and authenticated posting; do not assume current `comments` schema supports nesting.
6. Test old and new records, image/video/Qur'an/YouTube posts, repost reuse, iOS keyboard/scroll, no autoplay, all six themes and reduced motion.
7. Verify migration and tests in an isolated environment before any production database mutation. No migration has been applied during this audit.

## Related work
Bot A PR #297 stacked on #295; Bot B PR #300 stacked on #296. Both have preview builds but no integrated QA. Keep their branches separate until canonical adapter tests pass.
