# DeepWatch Bot 1 — movies-only review (2026-11-15 05:00 CST)

**Non-public research only. No production, Supabase, or viewer-facing catalog modifications.**

## Audit
- Read `app/components/videoRegistry.ts` and `app/deepwatch/page.tsx` on main; neither contains the five candidate YouTube IDs listed below.
- Queried `public.islamic_video_registry` and `public.dw_videos` for these IDs and exact movie-title patterns; no matching rows returned.
- Candidate-stage metadata and source URLs below are not proof of upload playability, embedding authorization, or rights.
- Two previously discovered films are retained in this review rather than counted as newly discovered titles.

## Candidate 1: Bilal: A New Breed of Hero (2015 film / 2018 US release)
- **Stage:** PENDING REVIEW; previously discovered, not a new distinct film.
- **Priority:** High. **Category:** Animated Movies; Islamic History; Family (older children).
- **Muslim representation:** Direct; dramatizes Bilal ibn Rabah and early Islam.
- **Best source:** Family Central, verified YouTube publisher, full-movie upload published 2022-05-21: https://www.youtube.com/watch?v=krRTgW3tEr8
- **Other upload IDs previously identified:** 3tjQ8G7BrO8, vwIlhDl1sHc. Same movie; do not count or publish as separate movies.
- **Rights indication:** Family Central description explicitly says film licensed from Vision Films; this is promising but does not establish 1Muslim's embedding/distribution rights.
- **Feature runtime:** Apple TV lists 1h45m (105 min), theatrical sources 105 min; film cuts may differ. Uploaded video runtime not verified via YouTube API.
- **Language:** English listed by Apple TV; verify upload audio.
- **Suitability:** PG-13; violence/warfare and slavery; family-oriented for older children, not unrestricted kids.
- **Blockers:** video API duration, video status, embeddable flag, canonical channel ID, license/embedding scope and current availability.

## Candidate 2: Muhammad: The Last Prophet (2002)
- **Stage:** PENDING REVIEW; previously discovered.
- **Priority:** High. **Category:** Animated Movies; Islamic History; Family.
- **Muslim representation:** Direct; American-produced animated historical feature.
- **Candidate uploads:** https://www.youtube.com/watch?v=vGxVWDLO87I ; https://www.youtube.com/watch?v=SSRTOqh7JwA
- **Feature runtime:** 95 min from film catalog/JustWatch, not independently confirmed for either upload.
- **Language:** English film exists; confirm audio of specific upload.
- **Blockers:** uploader ownership and distribution rights, upload runtime, playability/embeddability, canonical channel IDs and availability. No license established.

## Run accounting
- **New distinct films discovered:** 0
- **Existing candidates re-reviewed:** 2
- **Pending review in this tracked shortlist:** 2
- **New verified/publishable:** 0
- **New approved/published:** 0
- **Rejected:** 0
- **Database admin-queue records created:** 0 (no safe, validated staging path for incomplete channel/duration fields established)
- **Progress toward 100-film target:** 2 tracked distinct candidate titles, neither cleared for publication.

## Evidence and follow-up
- Bilal Family Central YouTube listing: https://www.youtube.com/watch?v=krRTgW3tEr8 (licensed-from-Vision-Films statement).
- Apple TV film information and 105-minute runtime: https://tv.apple.com/us/movie/bilal-a-new-breed-of-hero/umc.cmc.447v5h8iz893gmq3dtfy9hjyo
- Bilal parental advisory: https://www.commonsensemedia.org/movie-reviews/bilal-a-new-breed-of-hero
- Muhammad film catalog runtime: https://www.justwatch.com/us/movie/muhammad-the-last-prophet
- Next pass: YouTube Data API videos.list (snippet,contentDetails,status) for five IDs; then rights-holder verification and private admin staging. Do not publish on search results alone.
