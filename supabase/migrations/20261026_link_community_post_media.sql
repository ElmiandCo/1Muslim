ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS community_post_id uuid REFERENCES public.ummah_feed_posts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS posts_community_post_id_idx ON public.posts(community_post_id);
