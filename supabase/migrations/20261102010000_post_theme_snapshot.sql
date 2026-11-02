alter table public.ummah_feed_posts add column if not exists post_theme text not null default 'emerald';
alter table public.ummah_feed_posts drop constraint if exists ummah_feed_posts_post_theme_check;
alter table public.ummah_feed_posts add constraint ummah_feed_posts_post_theme_check check (post_theme in ('emerald','sapphire','ruby','amethyst','titanium','obsidian'));
