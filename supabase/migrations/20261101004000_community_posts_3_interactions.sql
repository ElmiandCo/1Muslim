-- Community Posts 3.0 / Bot A: additive schema, database-enforced thread limits and realtime.
-- DO NOT apply to production before review. Existing post/media tables remain untouched.
begin;

alter table public.ummah_post_comments
  add column if not exists image_path text;

alter table public.ummah_post_comments
  drop constraint if exists ummah_post_comments_body_check;
alter table public.ummah_post_comments
  drop constraint if exists ummah_post_comments_content_check;
alter table public.ummah_post_comments
  add constraint ummah_post_comments_content_check
  check (
    char_length(body) <= 1500
    and (char_length(btrim(body)) > 0 or image_path is not null)
    and (
      image_path is null
      or (
        image_path like author_id::text || '/ummah-comments/%'
        and image_path ~ '^[0-9a-f-]{36}/ummah-comments/[A-Za-z0-9._-]+\.(png|jpg|jpeg|webp)$'
        and char_length(image_path) <= 300
      )
    )
  );

create or replace function public.ummah_validate_comment_thread()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  parent_post uuid;
  grandparent_id uuid;
  ancestor_post uuid;
  great_grandparent_id uuid;
begin
  -- Prevent rewriting a thread's ancestry even if an UPDATE grant is added later.
  if tg_op = 'UPDATE' and (
    new.post_id is distinct from old.post_id or
    new.parent_id is distinct from old.parent_id or
    new.author_id is distinct from old.author_id
  ) then
    raise exception 'Comment ancestry cannot be changed' using errcode = '23514';
  end if;

  if new.parent_id is not null then
    if new.parent_id = new.id then
      raise exception 'A comment cannot reply to itself' using errcode = '23514';
    end if;
    select post_id, parent_id into parent_post, grandparent_id
      from public.ummah_post_comments where id = new.parent_id;
    if not found or parent_post is distinct from new.post_id then
      raise exception 'Reply target must belong to the same post' using errcode = '23514';
    end if;
    if grandparent_id is not null then
      select post_id, parent_id into ancestor_post, great_grandparent_id
        from public.ummah_post_comments where id = grandparent_id;
      if not found or ancestor_post is distinct from new.post_id or great_grandparent_id is not null then
        raise exception 'Replies are limited to three comment levels' using errcode = '23514';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists ummah_comment_thread_guard on public.ummah_post_comments;
create trigger ummah_comment_thread_guard
  before insert or update on public.ummah_post_comments
  for each row execute function public.ummah_validate_comment_thread();

-- Public like aggregates avoid exposing who liked a post to anonymous visitors.
create table if not exists public.ummah_post_like_counts (
  post_id uuid primary key references public.ummah_feed_posts(id) on delete cascade,
  like_count integer not null default 0 check (like_count >= 0),
  updated_at timestamptz not null default now()
);
alter table public.ummah_post_like_counts enable row level security;
drop policy if exists "Read Ummah like aggregates" on public.ummah_post_like_counts;
create policy "Read Ummah like aggregates" on public.ummah_post_like_counts
  for select to anon, authenticated using (true);
revoke all on table public.ummah_post_like_counts from public, anon, authenticated;
grant select on table public.ummah_post_like_counts to anon, authenticated;

create or replace function public.ummah_sync_post_like_count()
returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $
begin
  if tg_op = 'INSERT' then
    insert into public.ummah_post_like_counts(post_id,like_count,updated_at)
    values(new.post_id,1,now())
    on conflict (post_id) do update
      set like_count = public.ummah_post_like_counts.like_count + 1, updated_at = now();
  elsif tg_op = 'DELETE' then
    update public.ummah_post_like_counts
      set like_count = greatest(0,like_count - 1), updated_at = now()
      where post_id = old.post_id;
  end if;
  return null;
end;
$;
revoke all on function public.ummah_sync_post_like_count() from public, anon, authenticated;
drop trigger if exists ummah_post_like_count_trigger on public.ummah_post_likes;
create trigger ummah_post_like_count_trigger
  after insert or delete on public.ummah_post_likes
  for each row execute function public.ummah_sync_post_like_count();

insert into public.ummah_post_like_counts(post_id,like_count)
select post_id,count(*)::integer from public.ummah_post_likes group by post_id
on conflict (post_id) do update set like_count = excluded.like_count,updated_at = now();

-- An authenticated share event is one row, not a duplicate of the post or media.
create table if not exists public.ummah_post_shares (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.ummah_feed_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists ummah_post_shares_post_created_idx
  on public.ummah_post_shares(post_id, created_at desc);
alter table public.ummah_post_shares enable row level security;
-- Share identities are private. Only the sharer can read their own event rows.
drop policy if exists "Read Ummah post share counts" on public.ummah_post_shares;
drop policy if exists "Read your own Ummah share events" on public.ummah_post_shares;
create policy "Read your own Ummah share events" on public.ummah_post_shares
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Share Ummah posts as yourself" on public.ummah_post_shares;
create policy "Share Ummah posts as yourself" on public.ummah_post_shares
  for insert to authenticated with check (user_id = (select auth.uid()));
revoke all on table public.ummah_post_shares from public, anon, authenticated;
grant select, insert on table public.ummah_post_shares to authenticated;

-- Public aggregate contains no user IDs; safe to read and subscribe to via Realtime.
create table if not exists public.ummah_post_share_counts (
  post_id uuid primary key references public.ummah_feed_posts(id) on delete cascade,
  share_count integer not null default 0 check (share_count >= 0),
  updated_at timestamptz not null default now()
);
alter table public.ummah_post_share_counts enable row level security;
drop policy if exists "Read Ummah share aggregates" on public.ummah_post_share_counts;
create policy "Read Ummah share aggregates" on public.ummah_post_share_counts
  for select to anon, authenticated using (true);
revoke all on table public.ummah_post_share_counts from public, anon, authenticated;
grant select on table public.ummah_post_share_counts to anon, authenticated;

create or replace function public.ummah_sync_post_share_count()
returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.ummah_post_share_counts(post_id,share_count,updated_at)
    values(new.post_id,1,now())
    on conflict (post_id) do update
      set share_count = public.ummah_post_share_counts.share_count + 1, updated_at = now();
  elsif tg_op = 'DELETE' then
    update public.ummah_post_share_counts
      set share_count = greatest(0,share_count - 1), updated_at = now()
      where post_id = old.post_id;
  end if;
  return null;
end;
$$;
revoke all on function public.ummah_sync_post_share_count() from public, anon, authenticated;
drop trigger if exists ummah_post_share_count_trigger on public.ummah_post_shares;
create trigger ummah_post_share_count_trigger
  after insert or delete on public.ummah_post_shares
  for each row execute function public.ummah_sync_post_share_count();

-- Idempotent backfill, if a preview database already contains share rows.
insert into public.ummah_post_share_counts(post_id,share_count)
select post_id,count(*)::integer from public.ummah_post_shares group by post_id
on conflict (post_id) do update set share_count = excluded.share_count,updated_at = now();

-- Supabase Realtime postgres_changes: read access is still filtered by each table's RLS.
do $realtime$
declare
  target text;
begin
  foreach target in array array[
    'ummah_feed_posts', 'ummah_post_comments', 'ummah_comment_likes',
    'ummah_post_like_counts', 'ummah_post_share_counts'
  ] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = target
    ) then
      execute format('alter publication supabase_realtime add table public.%I', target);
    end if;
  end loop;
end;
$realtime$;

commit;
