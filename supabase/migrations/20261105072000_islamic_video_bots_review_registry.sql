create table if not exists public.islamic_video_registry (
 video_id text primary key check (video_id ~ '^[A-Za-z0-9_-]{11}$'),
 title text not null, channel_id text not null, channel_title text not null,
 description text not null default '', thumbnail_url text, duration_seconds integer,
 format text not null check (format in ('short','full')),
 language text, published_at timestamptz, view_count bigint,
 categories text[] not null default '{}', source_query text,
 status text not null default 'pending' check (status in ('pending','approved','rejected')),
 bot_b_reason text, reviewed_by uuid references auth.users(id),
 reviewed_at timestamptz, discovered_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.islamic_video_admins (
 user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.islamic_video_registry enable row level security;
alter table public.islamic_video_admins enable row level security;
drop policy if exists "approved videos are public" on public.islamic_video_registry;
create policy "approved videos are public" on public.islamic_video_registry for select to anon,authenticated using (status='approved');
drop policy if exists "admins can review registry" on public.islamic_video_registry;
create policy "admins can review registry" on public.islamic_video_registry for all to authenticated using (exists(select 1 from public.islamic_video_admins a where a.user_id=(select auth.uid()))) with check (exists(select 1 from public.islamic_video_admins a where a.user_id=(select auth.uid())));
drop policy if exists "admins can see their membership" on public.islamic_video_admins;
create policy "admins can see their membership" on public.islamic_video_admins for select to authenticated using(user_id=(select auth.uid()));
create or replace function public.review_islamic_video(p_video_id text,p_status text,p_categories text[] default null)
returns void language plpgsql security invoker set search_path=public as $$
begin
 if p_status not in ('approved','rejected') then raise exception 'Invalid review status'; end if;
 update public.islamic_video_registry set status=p_status,categories=coalesce(p_categories,categories),reviewed_by=auth.uid(),reviewed_at=now(),updated_at=now() where video_id=p_video_id;
 if not found then raise exception 'Video not found or insufficient privileges'; end if;
end $$;
