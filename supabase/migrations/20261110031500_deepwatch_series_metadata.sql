-- DeepWatch normalized series metadata. Existing video records remain intact.
create table if not exists public.deepwatch_series (
 id uuid primary key default gen_random_uuid(),
 canonical_title text not null,
 original_title text,
 slug text unique,
 synopsis text,
 cover_url text,
 backdrop_url text,
 publisher text,
 language text,
 genres text[] not null default '{}',
 categories text[] not null default '{}',
 status text not null default 'draft' check(status in ('draft','approved','hidden')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.deepwatch_series enable row level security;
drop policy if exists "Public approved DeepWatch series" on public.deepwatch_series;
create policy "Public approved DeepWatch series" on public.deepwatch_series for select to anon,authenticated using(status='approved');
drop policy if exists "Video admins manage DeepWatch series" on public.deepwatch_series;
create policy "Video admins manage DeepWatch series" on public.deepwatch_series for all to authenticated using(exists(select 1 from public.islamic_video_admins a where a.user_id=(select auth.uid()))) with check(exists(select 1 from public.islamic_video_admins a where a.user_id=(select auth.uid())));
alter table public.islamic_video_registry
 add column if not exists series_id uuid references public.deepwatch_series(id) on delete set null,
 add column if not exists canonical_title text,
 add column if not exists original_title text,
 add column if not exists content_type text,
 add column if not exists season_number integer,
 add column if not exists episode_number integer,
 add column if not exists episode_title text,
 add column if not exists cover_url text,
 add column if not exists original_language text,
 add column if not exists subtitle_languages text[] not null default '{}',
 add column if not exists genres text[] not null default '{}',
 add column if not exists metadata_review_status text not null default 'unreviewed';
alter table public.islamic_video_registry
 add constraint deepwatch_season_positive check(season_number is null or season_number > 0),
 add constraint deepwatch_episode_positive check(episode_number is null or episode_number > 0),
 add constraint deepwatch_duration_nonnegative check(duration_seconds is null or duration_seconds >= 0);
create index if not exists deepwatch_video_series_order on public.islamic_video_registry(series_id,season_number,episode_number);
create index if not exists deepwatch_video_categories on public.islamic_video_registry using gin(categories);
comment on column public.islamic_video_registry.duration_seconds is 'YouTube video duration in seconds; format as hours/minutes in DeepWatch.';
comment on column public.islamic_video_registry.metadata_review_status is 'AI suggestions must be reviewed before public grouping.';
