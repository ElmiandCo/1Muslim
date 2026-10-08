-- Explicit opt-in for public group meeting broadcasts; private by default.
alter table public.dm_group_calls add column if not exists is_public boolean not null default false;
alter table public.dm_group_calls add column if not exists broadcast_started_at timestamptz;
create index if not exists dm_group_calls_public_air on public.dm_group_calls (broadcast_started_at desc) where is_public=true;
-- Public listings are served by a narrow server endpoint, not a public RLS policy.
