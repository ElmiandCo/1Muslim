-- Video intelligence recommendations: no automatic editorial publication.
alter table public.islamic_video_registry add column if not exists quality_score numeric(5,2);
alter table public.islamic_video_registry add column if not exists recommended_start_seconds integer not null default 0;
alter table public.islamic_video_registry add column if not exists is_classic boolean not null default false;
alter table public.islamic_video_registry add column if not exists last_verified_at timestamptz;
alter table public.islamic_video_registry add column if not exists verification_status text not null default 'unverified';
alter table public.islamic_video_registry add column if not exists ranking_reason text;
create table if not exists public.islamic_video_swap_suggestions(
 id bigint generated always as identity primary key,
 candidate_video_id text not null references public.islamic_video_registry(video_id) on delete cascade,
 replace_video_id text references public.islamic_video_registry(video_id) on delete set null,
 reason text not null,
 score_gain numeric(5,2),
 status text not null default 'pending' check(status in ('pending','accepted','dismissed')),
 created_at timestamptz not null default now(),
 unique(candidate_video_id,replace_video_id)
);
alter table public.islamic_video_swap_suggestions enable row level security;
create policy "video admins view swaps" on public.islamic_video_swap_suggestions for select to authenticated using(exists(select 1 from public.islamic_video_admins a where a.user_id=(select auth.uid())));
create policy "video admins manage swaps" on public.islamic_video_swap_suggestions for all to authenticated using(exists(select 1 from public.islamic_video_admins a where a.user_id=(select auth.uid()))) with check(exists(select 1 from public.islamic_video_admins a where a.user_id=(select auth.uid())));
