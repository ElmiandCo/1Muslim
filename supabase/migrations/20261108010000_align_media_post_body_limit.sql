-- Align media-backed posts with the existing 2,000-character Ummah feed limit.
-- Qibla Magazine and Newsletter remain editorial articles, not public feed posts.
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_body_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_body_check CHECK (char_length(body) BETWEEN 0 AND 2000);
