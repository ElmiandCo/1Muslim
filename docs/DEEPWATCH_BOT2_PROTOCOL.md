# DeepWatch Bot 2 — mandatory operational protocol

Scope: **50 distinct Somali videos and 50 distinct Turkish drama episodes**. Never restart Bot 1. Never auto-approve, publish, overwrite, or delete existing videos.

1. **Preflight (fail closed):** Require server-side YouTube Data API key, Supabase URL and service-role key, scheduler, and reachable tables. A missing dependency is a failed run, not zero discovered.
2. **Canonical sources:** Resolve @KOKOBULLE-it5so (Game Shows), @astaanmedia, @BestEverFoodReviewShow (Somalia/Somaliland-related only), @TurkishDramas-EnglishSubtitles and @turkishdramatv using the official YouTube channels API. Record canonical channel IDs. Never guess channel IDs.
3. **Enumerate:** Scan each official uploads playlist through playlistItems pagination; fetch videos details in batches. Scan window is capped per run to control quota and runtime; expand systematically for complete historical series coverage.
4. **Validate:** Require official channel ownership, public status, embeddable=true, plausible full-length duration, and category-appropriate title. Reject Shorts, clips, trailers, teasers, fan mirrors. YouTube embeddable=true is **not** a license; publisher rights remain a manual approval requirement.
5. **Catalog:** Preserve video ID, publisher, duration, publication date, URL, category, language, season/episode when extractable. Never invent episode numbers. A future catalog pass must reconcile playlists and explicitly report missing episodes.
6. **Deduplicate:** Check BOTH islamic_video_registry.video_id and dw_videos.provider_video_id before inserting. Existing app/components/videoRegistry.ts and app/deepwatch/page.tsx IDs also require cross-check before promotion. Database unique constraint must prevent concurrent duplicates.
7. **Stage only:** Insert only new qualifying candidates with status=pending and rights_review=pending_manual_publisher_license_check. Never approve automatically. The reviewer must check ownership, rights, series order, and playability.
8. **Observe:** Print BOT2_REPORT JSON including verified channel IDs, scanned, eligible, duplicates, exclusions, staged by language, existing by language, failures. On failure, exit nonzero and identify stage.
9. **Recovery:** Fix configuration and API failures rather than rerunning ineffective general web searches. Verify database row counts and workflow status before claiming successful additions.
10. **Acceptance:** 50 Somali + 50 Turkish *distinct* candidates, pending review; then proceed to comprehensive playlist and series enumeration. Report unknown metadata honestly.

GitHub Actions workflow: .github/workflows/deepwatch-bot2.yml
Runner: scripts/discover-deepwatch-bot2.mjs

**Important limitation:** the first-pass script scans uploads playlists, not every show-specific playlist. Series completeness and repository static-ID deduplication remain separate acceptance gates before any approval.
