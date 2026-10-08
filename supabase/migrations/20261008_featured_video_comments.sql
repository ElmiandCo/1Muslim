-- Comments on editorially featured videos; public reading, authenticated posting.
create table if not exists public.featured_video_comments (
  id uuid primary key default gen_random_uuid(),
  video_id text not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists featured_video_comments_video_created_idx
  on public.featured_video_comments (video_id, created_at desc);
alter table public.featured_video_comments enable row level security;
drop policy if exists "Anyone can read featured video comments" on public.featured_video_comments;
create policy "Anyone can read featured video comments" on public.featured_video_comments
  for select to anon, authenticated using (true);
drop policy if exists "Members can comment as themselves" on public.featured_video_comments;
create policy "Members can comment as themselves" on public.featured_video_comments
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Members can delete own comments" on public.featured_video_comments;
create policy "Members can delete own comments" on public.featured_video_comments
  for delete to authenticated using (auth.uid() = user_id);
