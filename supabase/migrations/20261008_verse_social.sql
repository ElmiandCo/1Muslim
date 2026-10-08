-- Verse engagement: public read, authenticated writes. Apply only to verified 1Muslim database.
create table if not exists public.verse_likes (
 verse_key text not null check (verse_key ~ '^[0-9]{1,3}:[0-9]{1,3}$'),
 user_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key (verse_key,user_id)
);
create index if not exists verse_likes_verse_created on public.verse_likes(verse_key,created_at desc);
alter table public.verse_likes enable row level security;
create policy "Anyone can read verse likes" on public.verse_likes for select to anon,authenticated using (true);
create policy "Members like verses" on public.verse_likes for insert to authenticated with check (auth.uid()=user_id);
create policy "Members unlike verses" on public.verse_likes for delete to authenticated using (auth.uid()=user_id);
-- Existing comments table was introduced in an earlier, not-yet-applied migration.
drop policy if exists "Read public verse comments" on public.verse_comments;
create policy "Anyone can read verse comments" on public.verse_comments for select to anon,authenticated using (true);
-- Counts are derived from the actual rows, not client-generated counters.
-- Names/avatars should be resolved from the application's public profile view
-- after verifying its schema and RLS, not from auth.users.
