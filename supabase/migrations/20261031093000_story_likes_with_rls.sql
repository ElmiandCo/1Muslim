-- Story likes: one like per signed-in member per story.
create table if not exists public.story_likes (
 story_id uuid not null references public.stories(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(story_id,user_id)
);
create index if not exists story_likes_user_id_idx on public.story_likes(user_id);
alter table public.story_likes enable row level security;
grant select on public.story_likes to anon,authenticated;
grant insert,delete on public.story_likes to authenticated;
create policy "Story likes readable" on public.story_likes for select to anon,authenticated using (true);
create policy "Like active stories as self" on public.story_likes for insert to authenticated with check (user_id=(select auth.uid()) and exists(select 1 from public.stories s where s.id=story_id and s.expires_at>now()));
create policy "Remove own story likes" on public.story_likes for delete to authenticated using (user_id=(select auth.uid()));