-- Server-owned daily authenticated activity rollups for retention cohorts.
create table if not exists public.user_activity_days(
 user_id uuid not null references auth.users(id) on delete cascade,
 activity_date date not null,
 first_seen timestamptz not null default now(),
 last_seen timestamptz not null default now(),
 primary key(user_id,activity_date)
);
create index if not exists user_activity_days_date_idx on public.user_activity_days(activity_date);
alter table public.user_activity_days enable row level security;
revoke all on public.user_activity_days from anon,authenticated;
-- Activity is written by the authenticated /api/presence endpoint via service role.
