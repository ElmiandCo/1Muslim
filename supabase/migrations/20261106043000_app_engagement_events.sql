-- Engagement telemetry: authenticated, privacy-minimal aggregateable events.
create table if not exists public.app_engagement_events (
 id bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 section text not null check (section in ('Live','Quran','Post','Messages','Elm Tent','Community','Profile','Home Video')),
 event_type text not null check (event_type in ('active_seconds','finish_watching_tap')),
 duration_seconds integer not null default 0 check (duration_seconds between 0 and 120),
 video_id text,
 created_at timestamptz not null default now()
);
create index if not exists app_engagement_events_created_idx on public.app_engagement_events(created_at desc);
create index if not exists app_engagement_events_section_idx on public.app_engagement_events(section,created_at desc);
alter table public.app_engagement_events enable row level security;
create policy "Users can record own engagement" on public.app_engagement_events for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Users can view own engagement" on public.app_engagement_events for select to authenticated using ((select auth.uid())=user_id);
grant select,insert on public.app_engagement_events to authenticated;
grant usage,select on sequence public.app_engagement_events_id_seq to authenticated;
-- Admin reporting query: select section,sum(duration_seconds) as seconds,count(distinct user_id) as users
-- from public.app_engagement_events where event_type='active_seconds' group by section order by seconds desc;
