-- Historical live analytics: sampled audience snapshots plus comment timestamps.
create table if not exists public.live_analytics_samples(
 stream_id uuid not null references public.live_streams(id) on delete cascade,
 captured_at timestamptz not null default now(),
 viewers integer not null check(viewers>=0 and viewers<=10000000),
 primary key(stream_id,captured_at)
);
create index if not exists live_analytics_samples_stream_time on public.live_analytics_samples(stream_id,captured_at);
alter table public.live_analytics_samples enable row level security;
drop policy if exists "Hosts read own live analytics" on public.live_analytics_samples;
create policy "Hosts read own live analytics" on public.live_analytics_samples for select to authenticated using(
 exists(select 1 from public.live_streams s where s.id=stream_id and s.host_id=auth.uid())
);
-- No client insert/update policy. Sampling endpoint uses service role after host authentication.
