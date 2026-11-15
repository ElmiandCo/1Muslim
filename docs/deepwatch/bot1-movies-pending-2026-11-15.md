# DeepWatch Bot 1 — MOVIES ONLY — pending review (2026-11-15)

This is a **non-published editorial discovery list**. Nothing here authorizes embedding, sublicensing, or public release. No catalog or database records changed.

## Candidate 1 — Muhammad: The Last Prophet (2002)
- Category: Animated Movies / Islamic History; direct Islamic narrative; US/Egypt/Lebanon production.
- Identified feature: 95 minutes; English (film metadata, **not independently checked upload runtime**).
- Candidate YouTube upload A: https://www.youtube.com/watch?v=vGxVWDLO87I — uploader Rachid82UK, published 2012-11-09; advertised as full animated movie.
- Candidate YouTube upload B: https://www.youtube.com/watch?v=SSRTOqh7JwA — uploader uSubmit2Allah, published 2013-09-22; advertised as full movie.
- Evidence: https://en.wikipedia.org/wiki/Muhammad:_The_Last_Prophet ; indexed YouTube listing.
- Needs verification: uploaded durations; current playability, embedding and restrictions; uploader authorization from Fine Media Group/Badr International or applicable rights-holder; parental suitability review; canonical channel IDs.
- **Status: PENDING REVIEW — NOT PUBLISHABLE**. Two uploads represent ONE film; choose at most one authorized upload.

## Previously discovered film — Bilal: A New Breed of Hero (2015/2016)
- Category: Animated Movies / Islamic History; 107–110 minute versions reported; English; PG-13, older-family audience.
- https://www.youtube.com/watch?v=krRTgW3tEr8 — Family Central, 2022-05-21; uploader states licensed by Vision Films.
- Film information: https://shahid.mbc.net/en/movies/Bilal%3A-A-New-Breed-Of-Hero/movie-807668
- Needs verification: actual upload duration, current embedding/playability, terms and scope of license for third-party DeepWatch embedding, content review, channel ID.
- **Status: PENDING REVIEW — NOT PUBLISHABLE**. Carried forward; not counted as a newly discovered film.

## Discovery exclusions (no suitable full YouTube upload)
- Time Hoppers: The Silk Road (2025), official production/distribution confirmed but only trailer identified; no full-film YouTube URL: https://www.fathomentertainment.com/news/milo-productions-selects-fathom-entertainment-to-bring-time-hoppers-the-silk-road-to-theatres-nationwide-on-february-7-8-2026-landmark-industry-first-for-a-muslim-animated-feature-film/
- Ramadan America (2026), 81-minute American Muslim narrative anthology; only transactional distribution identified, not complete YouTube film: https://tv.apple.com/us/movie/ramadan-america/umc.cmc.5xqsjt69pkg1387fu8lvd7sih
- The Islamic States of America (2025), 46:47, below 60-minute feature minimum and standup-driven: https://isa.az.tv/press
- The Message (1976), 178 minutes, exceeds preferred 150-minute range (not categorically disqualified), but no verified complete authorized YouTube link identified: https://en.wikipedia.org/wiki/The_Message_(1976_film)
- An Act of Worship (2022), documentary, explicitly outside MOVIES ONLY: https://www.amdoc.org/watch/actofworship

## Deduplication and safety
Checked main-branch `app/components/videoRegistry.ts`, `app/deepwatch/page.tsx`, and Supabase `islamic_video_registry` / `dw_videos` by video ID and title pattern on 2026-11-15. No matches for the three YouTube IDs or the two film titles in those checked sources. This does not establish absence from all collections or other unpublished queues.

**This run:** 1 newly discovered distinct movie; 1 newly pending review; 0 verified publishable; 0 approved/published; 0 rejected after full verification. One previously pending film retained. Neither database nor public Movie Bank modified.

Before publication, use YouTube Data API videos.list for contentDetails.duration, status.embeddable, privacy/region restrictions and snippet.channelId, then independently confirm rights/permission and suitability.
