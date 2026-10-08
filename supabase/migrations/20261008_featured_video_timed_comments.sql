-- Timed comments are separate from the existing threaded discussion.
create table if not exists public.featured_video_timed_comments (
 id uuid primary key default gen_random_uuid(),
 video_key text not null check(char_length(video_key) between 3 and 120),
 user_id uuid not null references auth.users(id) on delete cascade,
 body text not null check(char_length(trim(body)) between 1 and 180),
 at_seconds integer not null check(at_seconds between 0 and 86400),
 created_at timestamptz not null default now()
);
create index if not exists featured_video_timed_lookup on public.featured_video_timed_comments(video_key,at_seconds);
alter table public.featured_video_timed_comments enable row level security;
create policy "Timed video comments readable" on public.featured_video_timed_comments for select to anon,authenticated using(true);
create policy "Signed-in members create timed comments" on public.featured_video_timed_comments for insert to authenticated with check(user_id=auth.uid());
create policy "Authors remove timed comments" on public.featured_video_timed_comments for delete to authenticated using(user_id=auth.uid());
