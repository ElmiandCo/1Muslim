-- Community Posts 3.0 / Bot A round three.
-- CANONICAL MEDIA INTERACTIONS: posts -> comments, post_likes, comment_likes.
-- Compatibility: existing ummah_feed_posts -> ummah_post_comments/ummah_post_likes unchanged.
-- PREVIEW/STAGING ONLY until approved. No backfill or post duplication.
begin;

alter table public.comments add column if not exists parent_id uuid;
alter table public.comments add column if not exists image_path text;

do $constraints$
begin
  if not exists (select 1 from pg_constraint where conrelid='public.comments'::regclass and conname='comments_parent_id_fkey') then
    alter table public.comments add constraint comments_parent_id_fkey
      foreign key (parent_id) references public.comments(id) on delete cascade;
  end if;
end;
$constraints$;

-- Existing 30+ comments remain intact. Allow 1,500 characters and image-only replies.
alter table public.comments drop constraint if exists comments_body_check;
alter table public.comments drop constraint if exists canonical_comments_content_check;
alter table public.comments add constraint canonical_comments_content_check check (
  char_length(body) <= 1500
  and (char_length(body) > 0 or image_path is not null)
  and (image_path is null or (
    char_length(image_path) <= 300
    and image_path like user_id::text || '/ummah-comments/%'
    and image_path ~ '^[0-9a-f-]{36}/ummah-comments/[A-Za-z0-9._-]+\.(png|jpg|jpeg|webp)$'
  ))
);
create index if not exists canonical_comments_post_created_idx on public.comments(post_id,created_at);
create index if not exists canonical_comments_parent_idx on public.comments(parent_id);

create or replace function public.canonical_validate_comment_thread()
returns trigger language plpgsql set search_path=public,pg_temp as $thread$
declare p_post uuid; p_parent uuid; gp_post uuid; gp_parent uuid;
begin
  if tg_op='UPDATE' and (
    new.post_id is distinct from old.post_id or
    new.user_id is distinct from old.user_id or
    new.parent_id is distinct from old.parent_id
  ) then
    raise exception 'Comment ancestry cannot be changed' using errcode='23514';
  end if;
  if new.parent_id is not null then
    if new.parent_id=new.id then raise exception 'Self-reply forbidden' using errcode='23514'; end if;
    select post_id,parent_id into p_post,p_parent from public.comments where id=new.parent_id;
    if not found or p_post is distinct from new.post_id then
      raise exception 'Reply target must belong to the same post' using errcode='23514';
    end if;
    if p_parent is not null then
      select post_id,parent_id into gp_post,gp_parent from public.comments where id=p_parent;
      if not found or gp_post is distinct from new.post_id or gp_parent is not null then
        raise exception 'Maximum three comment levels' using errcode='23514';
      end if;
    end if;
  end if;
  return new;
end;
$thread$;
drop trigger if exists canonical_comment_thread_guard on public.comments;
create trigger canonical_comment_thread_guard before insert or update on public.comments
for each row execute function public.canonical_validate_comment_thread();

-- Public counters do not disclose liker identities.
create table if not exists public.post_like_counts (
  post_id uuid primary key references public.posts(id) on delete cascade,
  like_count integer not null default 0 check(like_count>=0),
  updated_at timestamptz not null default now()
);
create table if not exists public.comment_like_counts (
  comment_id uuid primary key references public.comments(id) on delete cascade,
  like_count integer not null default 0 check(like_count>=0),
  updated_at timestamptz not null default now()
);
alter table public.post_like_counts enable row level security;
alter table public.comment_like_counts enable row level security;
drop policy if exists "Public canonical post like counts" on public.post_like_counts;
create policy "Public canonical post like counts" on public.post_like_counts
for select to anon,authenticated using (true);
drop policy if exists "Public canonical comment like counts" on public.comment_like_counts;
create policy "Public canonical comment like counts" on public.comment_like_counts
for select to anon,authenticated using (true);
revoke all on public.post_like_counts from public,anon,authenticated;
revoke all on public.comment_like_counts from public,anon,authenticated;
grant select on public.post_like_counts to anon,authenticated;
grant select on public.comment_like_counts to anon,authenticated;

create or replace function public.canonical_sync_post_likes()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $count$
begin
  if tg_op='INSERT' then
    insert into public.post_like_counts(post_id,like_count) values(new.post_id,1)
    on conflict(post_id) do update set like_count=public.post_like_counts.like_count+1,updated_at=now();
  else
    update public.post_like_counts set like_count=greatest(0,like_count-1),updated_at=now()
    where post_id=old.post_id;
  end if;
  return null;
end;
$count$;
create or replace function public.canonical_sync_comment_likes()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $count$
begin
  if tg_op='INSERT' then
    insert into public.comment_like_counts(comment_id,like_count) values(new.comment_id,1)
    on conflict(comment_id) do update set like_count=public.comment_like_counts.like_count+1,updated_at=now();
  else
    update public.comment_like_counts set like_count=greatest(0,like_count-1),updated_at=now()
    where comment_id=old.comment_id;
  end if;
  return null;
end;
$count$;
revoke all on function public.canonical_sync_post_likes() from public,anon,authenticated;
revoke all on function public.canonical_sync_comment_likes() from public,anon,authenticated;
drop trigger if exists canonical_post_like_counter on public.post_likes;
create trigger canonical_post_like_counter after insert or delete on public.post_likes
for each row execute function public.canonical_sync_post_likes();
drop trigger if exists canonical_comment_like_counter on public.comment_likes;
create trigger canonical_comment_like_counter after insert or delete on public.comment_likes
for each row execute function public.canonical_sync_comment_likes();

insert into public.post_like_counts(post_id,like_count)
select post_id,count(*)::integer from public.post_likes group by post_id
on conflict(post_id) do update set like_count=excluded.like_count,updated_at=now();
insert into public.comment_like_counts(comment_id,like_count)
select comment_id,count(*)::integer from public.comment_likes group by comment_id
on conflict(comment_id) do update set like_count=excluded.like_count,updated_at=now();

-- Guest comments and posts are readable; posting and liking remain authenticated.
-- Do not expose individual like rows to guests.
drop policy if exists "Public canonical posts read" on public.posts;
create policy "Public canonical posts read" on public.posts for select to anon,authenticated using (true);
drop policy if exists "Public canonical comments read" on public.comments;
create policy "Public canonical comments read" on public.comments for select to anon,authenticated using (true);
grant select on public.posts to anon,authenticated;
grant select on public.comments to anon,authenticated;
grant insert on public.comments to authenticated;
grant select,insert,delete on public.post_likes to authenticated;
grant select,insert,delete on public.comment_likes to authenticated;

-- Realtime for post/comment changes and aggregate counts, without exposing liker identities.
do $realtime$
declare target text;
begin
  foreach target in array array['comments','post_like_counts','comment_like_counts'] loop
    if not exists(select 1 from pg_publication_tables
      where pubname='supabase_realtime' and schemaname='public' and tablename=target) then
      execute format('alter publication supabase_realtime add table public.%I',target);
    end if;
  end loop;
end;
$realtime$;
commit;
