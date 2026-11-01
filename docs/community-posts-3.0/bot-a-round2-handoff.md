# Community Posts 3.0 — Bot A Round Two handoff

**Scope:** interaction, realtime, keyboard navigation and migration correctness. **No production merge or deployment authorized.**

## Provenance and image references
- Base: `bot-a/community-posts-3-interactions-20261031`, which branches from `main` at `c62d6f112b3d64fa0879e443c892c08140ad2611`.
- Round-one PR: [#295](https://github.com/ElmiandCo/1Muslim/pull/295). Bot B round-one PR: [#296](https://github.com/ElmiandCo/1Muslim/pull/296).
- Source reference branch: `docs/community-posts-3-reference-folder`, folder `docs/community-posts-3.0/references/`.
- [Image 1: 91972156-9A1F-41A8-BF17-8CB8484984AE.png](https://github.com/ElmiandCo/1Muslim/blob/docs/community-posts-3-reference-folder/docs/community-posts-3.0/references/91972156-9A1F-41A8-BF17-8CB8484984AE.png): user-provided screenshot visibly shows emerald glass feed cards, gold highlights, compact actions, author avatars, Qur'an card, video thumbnail and media mosaic. The conversation viewer echoes this treatment with a thin theme-aware luminous top edge, layered glass and restrained tap feedback.
- [Image 2: EFB1C829-EAE6-42DA-8AEF-8C681871E2B7.png](https://github.com/ElmiandCo/1Muslim/blob/docs/community-posts-3-reference-folder/docs/community-posts-3.0/references/EFB1C829-EAE6-42DA-8AEF-8C681871E2B7.png): confirmed GitHub blob SHA `f5cff9553a74f3c4bf5cec0d723e411792c57d1c`. **Visual inspection incomplete** because available GitHub connector returns no PNG bytes and raw GitHub downloads were unavailable. Do not claim fidelity to this image until a browser or artifact runner compares it.
- Both reference files remain on the docs branch; neither was copied into app assets.

## Round-two changes
1. **Fixed invalid PL/pgSQL delimiter** in the like-count trigger of `supabase/migrations/20261101004000_community_posts_3_interactions.sql` (`as $` / `$;` → `as $$` / `$$;`). Without this correction the migration cannot be applied.
2. **Fixed escaped newline syntax errors** in `scripts/community-posts-3.test.mjs`, added static guards for SQL function delimiters, focus navigation and comment-like validation.
3. **Improved `UmmahConversation` mobile and keyboard navigation:** preserves scroll position when drilling into and back out of a comment thread; traps Tab focus within the active post/profile dialog; moves focus into and out of profile popup.
4. **Prevented duplicate optimistic like toggles** while an API request is in flight, with failure rollback.
5. **Hardened `/api/ummah-comment-likes`** with same-origin request check, UUID validation, readable comment existence check and no-store responses.
6. **Polished `UmmahConversation.module.css`** with restrained theme-aware luminous edge, reflective card trim, short tactile transforms and visible keyboard focus. No perpetual animation, scroll sizing change or autoplay; reduced-motion disables transitions.

## Integration contract for Bot B
- **Preserve** `UmmahConversation.tsx`, `UmmahConversation.module.css`, `/api/ummah-* ` endpoints and SQL migration from this branch. Bot B should own feed media presentation and styling; avoid touching those files.
- **Critical architectural gap remains:** Bot A comments/likes currently reference `ummah_feed_posts` and `ummah_post_comments`; Bot B canonical media uses `posts`, `post_media`, `comments`, `post_likes`. Their existing foreign keys are distinct. Do not fake single-record architecture by duplicating posts. Integration needs an explicit canonical media interaction adapter/migration before full unified three-level comment UX is promised.
- Files with conflicts between round-one PRs: `app/community/page.tsx`, `app/components/CanvasSecondaryApp.tsx`, `app/api/community-posts/route.ts`. Round-two Bot A intentionally did not touch these.

## Verification and release gates
- Static test command: `node --test scripts/community-posts-3.test.mjs`; TypeScript: `npx tsc --noEmit`; build: `npm run build`. **Not run locally in this connector-only environment; GitHub/Vercel CI must validate the PR head.**
- The connected Supabase SecureApp database was queried **read-only**: confirmed original `ummah_post_comments_body_check`, post FK, and public comment read policies. **No migration was applied to any database.**
- Stage-only DB tests: three reply levels; reject fourth, cross-post and forged image path; image-only comment; RLS on shares; two-device realtime updates; authenticated and guest flows.
- Browser visual QA outstanding: compare actual iPhone and desktop screenshots with both PNG references, six themes, Day/Night, keyboard open/close, full-height scrolling, reduced-motion and media playback.
- **No screenshots captured in this run; do not claim pixel-perfect parity.** Preview and production are unchanged until approved.

## Handoff to Bot B
Read this file and both PNG references. Preserve the round-two interaction fixes and avoid parallel modifications to the viewer/API/migration. Add real media to the full-screen post experience only through a deliberate canonical adapter; never duplicate a media upload or post row. Document image-to-component mapping and actual before/after screenshots in Bot B's PR.
