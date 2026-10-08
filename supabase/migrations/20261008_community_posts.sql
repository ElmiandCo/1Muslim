create table if not exists public.community_posts (
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null references auth.users(id) on delete cascade,
 body text not null check(char_length(trim(body)) between 1 and 2000),
 created_at timestamptz not null default now()
);
create index if not exists community_posts_latest on public.community_posts(created_at desc);
alter table public.community_posts enable row level security;
create policy "Anyone can read community posts" on public.community_posts for select to anon,authenticated using(true);
create policy "Authors create community posts" on public.community_posts for insert to authenticated with check(author_id=auth.uid());
create policy "Authors delete community posts" on public.community_posts for delete to authenticated using(author_id=auth.uid());
