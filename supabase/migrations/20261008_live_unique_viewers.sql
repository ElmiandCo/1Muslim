-- One row per authenticated viewer per livestream. Requires applying to 1Muslim Supabase.
create table if not exists public.live_unique_viewers (
 stream_id uuid not null references public.live_streams(id) on delete cascade,
 viewer_id uuid not null references auth.users(id) on delete cascade,
 first_seen_at timestamptz not null default now(),
 primary key (stream_id, viewer_id)
);
create index if not exists live_unique_viewers_viewer_idx on public.live_unique_viewers(viewer_id);
alter table public.live_unique_viewers enable row level security;
-- Client reads and writes are intentionally prohibited. Server service role records attendance.
revoke all on public.live_unique_viewers from anon, authenticated;
