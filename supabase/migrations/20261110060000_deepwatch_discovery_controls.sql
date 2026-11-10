create table if not exists public.deepwatch_discovery_channels (
 id uuid primary key default gen_random_uuid(),
 channel_id text not null unique check (channel_id ~ '^UC[A-Za-z0-9_-]{22}$'),
 channel_title text not null default '',
 channel_url text not null default '',
 enabled boolean not null default true,
 created_at timestamptz not null default now()
);
alter table public.deepwatch_discovery_channels enable row level security;
revoke all on public.deepwatch_discovery_channels from anon, authenticated;
create index if not exists deepwatch_discovery_channels_enabled_idx on public.deepwatch_discovery_channels(enabled);
create table if not exists public.deepwatch_discovery_runs (
 id uuid primary key default gen_random_uuid(),
 github_run_id bigint unique,
 status text not null default 'queued' check(status in ('queued','running','success','failure')),
 requested_channel_id text,
 scanned integer not null default 0,
 new_pending integer not null default 0,
 message text,
 created_at timestamptz not null default now(),
 finished_at timestamptz
);
alter table public.deepwatch_discovery_runs enable row level security;
revoke all on public.deepwatch_discovery_runs from anon, authenticated;
create index if not exists deepwatch_discovery_runs_created_idx on public.deepwatch_discovery_runs(created_at desc);
