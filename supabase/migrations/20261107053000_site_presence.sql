create table if not exists public.site_presence (
  session_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  page text not null default '/',
  last_seen timestamptz not null default now(),
  last_active timestamptz not null default now()
);
create index if not exists site_presence_last_seen_idx on public.site_presence(last_seen);
create index if not exists site_presence_user_idx on public.site_presence(user_id);
alter table public.site_presence enable row level security;
revoke all on public.site_presence from anon, authenticated;
-- Service-role server endpoints only; no direct client reads or writes.
