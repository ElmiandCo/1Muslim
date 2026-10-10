-- Enforce one Ummah community post per author per UTC calendar day.
-- Resolve any pre-existing same-day duplicates before applying this migration.
CREATE UNIQUE INDEX IF NOT EXISTS community_posts_one_per_author_utc_day
ON public.community_posts (author_id, ((created_at AT TIME ZONE 'UTC')::date));
