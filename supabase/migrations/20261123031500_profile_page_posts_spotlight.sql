-- 1Muslim: Page Posts are visitor notes on another member's profile.
-- Signature Spotlight is curated by the owner and ONLY rendered in cinematic profile.
create table if not exists public.profile_page_posts (
 id uuid primary key default gen_random_uuid(),
 profile_id uuid not null references public.profiles(id) on delete cascade,
 author_id uuid not null references public.profiles(id) on delete cascade,
 body text not null default '',
 media_url text,
 media_kind text not null default 'none' check (media_kind in ('none','image','video')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint profile_page_posts_not_self check (profile_id<>author_id),
 constraint profile_page_posts_body_size check (char_length(body)<=1200),
 constraint profile_page_posts_has_content check (length(btrim(body))>0 or media_url is not null),
 constraint profile_page_posts_media_link check (media_url is null or (char_length(media_url)<=2048 and media_url ~ '^https://[^[:space:]]+$')),
 constraint profile_page_posts_media_match check ((media_kind='none' and media_url is null) or (media_kind in ('image','video') and media_url is not null))
);
create index if not exists profile_page_posts_profile_recent_idx on public.profile_page_posts(profile_id,created_at desc);
create index if not exists profile_page_posts_author_idx on public.profile_page_posts(author_id);

create table if not exists public.profile_page_post_comments (
 id uuid primary key default gen_random_uuid(),
 post_id uuid not null references public.profile_page_posts(id) on delete cascade,
 author_id uuid not null references public.profiles(id) on delete cascade,
 body text not null check (char_length(btrim(body)) between 1 and 500),
 created_at timestamptz not null default now()
);
create index if not exists profile_page_post_comments_post_idx on public.profile_page_post_comments(post_id,created_at);

create table if not exists public.profile_page_post_reactions (
 post_id uuid not null references public.profile_page_posts(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 reaction text not null check (reaction in ('like','heart')),
 created_at timestamptz not null default now(),
 primary key (post_id,user_id,reaction)
);
create index if not exists profile_page_post_reactions_post_idx on public.profile_page_post_reactions(post_id);

create table if not exists public.profile_spotlights (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 title text not null default 'My Spotlight' check (char_length(title) between 1 and 100),
 caption text not null default '' check (char_length(caption)<=300),
 media_kind text not null check (media_kind in ('image','video')),
 media_url text not null check (media_url ~ '^https://[^[:space:]]+$' and char_length(media_url)<=2048),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

alter table public.profile_page_posts enable row level security;
alter table public.profile_page_post_comments enable row level security;
alter table public.profile_page_post_reactions enable row level security;
alter table public.profile_spotlights enable row level security;

grant select on public.profile_page_posts,public.profile_page_post_comments,public.profile_page_post_reactions,public.profile_spotlights to anon,authenticated;
grant insert,update,delete on public.profile_page_posts,public.profile_page_post_comments,public.profile_page_post_reactions,public.profile_spotlights to authenticated;

drop policy if exists page_posts_read on public.profile_page_posts;
create policy page_posts_read on public.profile_page_posts for select to anon,authenticated using (true);
drop policy if exists page_posts_insert on public.profile_page_posts;
create policy page_posts_insert on public.profile_page_posts for insert to authenticated with check ((select auth.uid())=author_id and author_id<>profile_id);
drop policy if exists page_posts_delete on public.profile_page_posts;
create policy page_posts_delete on public.profile_page_posts for delete to authenticated using ((select auth.uid())=author_id or (select auth.uid())=profile_id);

drop policy if exists page_comments_read on public.profile_page_post_comments;
create policy page_comments_read on public.profile_page_post_comments for select to anon,authenticated using (true);
drop policy if exists page_comments_write on public.profile_page_post_comments;
create policy page_comments_write on public.profile_page_post_comments for insert to authenticated with check ((select auth.uid())=author_id);
drop policy if exists page_comments_delete on public.profile_page_post_comments;
create policy page_comments_delete on public.profile_page_post_comments for delete to authenticated using (
 (select auth.uid())=author_id or exists(
  select 1 from public.profile_page_posts p where p.id=post_id and p.profile_id=(select auth.uid())
 )
);

drop policy if exists page_reactions_read on public.profile_page_post_reactions;
create policy page_reactions_read on public.profile_page_post_reactions for select to anon,authenticated using (true);
drop policy if exists page_reactions_insert on public.profile_page_post_reactions;
create policy page_reactions_insert on public.profile_page_post_reactions for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists page_reactions_delete on public.profile_page_post_reactions;
create policy page_reactions_delete on public.profile_page_post_reactions for delete to authenticated using ((select auth.uid())=user_id);

drop policy if exists profile_spotlights_read on public.profile_spotlights;
create policy profile_spotlights_read on public.profile_spotlights for select to anon,authenticated using (true);
drop policy if exists profile_spotlights_write on public.profile_spotlights;
create policy profile_spotlights_write on public.profile_spotlights for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists profile_spotlights_update on public.profile_spotlights;
create policy profile_spotlights_update on public.profile_spotlights for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists profile_spotlights_delete on public.profile_spotlights;
create policy profile_spotlights_delete on public.profile_spotlights for delete to authenticated using ((select auth.uid())=user_id);

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('profile-page-media','profile-page-media',true,52428800,array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set public=true,file_size_limit=52428800,
 allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists profile_page_media_public_read on storage.objects;
create policy profile_page_media_public_read on storage.objects for select to public
using (bucket_id='profile-page-media');

drop policy if exists profile_page_media_upload_self on storage.objects;
create policy profile_page_media_upload_self on storage.objects for insert to authenticated
with check (bucket_id='profile-page-media' and (storage.foldername(name))[1]=(select auth.uid())::text);

drop policy if exists profile_page_media_delete_self on storage.objects;
create policy profile_page_media_delete_self on storage.objects for delete to authenticated
using (bucket_id='profile-page-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
