# Community Posts 3.0 — References and bot notes

Upload reference screenshots here using **Add file → Upload files**. Suggested filenames: `post-verse-video-mobile.png`, `comment-thread-expanded.png`, `youtube-thumbnail.png`.

## Bot A — interactions
Supabase realtime post likes/comments/shares, comment likes, replies (maximum 3 nested levels), collapsible staggered comment threads, comment images only (GIFs later; no videos), full-screen scrollable post/comment drill-down with back navigation and author profile popups. Reuse existing schema and enforce RLS. Preserve scrolling and production features.

## Bot B — templates and styling
Five adaptive templates: text, Qur'an verse, image, video, Qur'an + video. Real video poster frames and playable YouTube previews (no black player, no autoplay). Single uploaded video asset surfaces in Posts, For You, and All Videos. Theme-aware glass design across six themes, polished subtle animations and compact actions.

## Handoff
Bot B begins four minutes after Bot A. Both must inspect reference images and cite which image guided which component in PR notes. Work in separate branches, avoid conflicting edits, run tests, create PRs; no merge or deployment without user approval.
