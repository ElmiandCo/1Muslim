-- Persistent, sanitized diagnostics. Run through the Supabase SQL migration workflow.
create table if not exists public.developer_incidents (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(),
 source text not null check (length(source) between 1 and 80),
 severity text not null default 'error' check (severity in ('info','warning','error','critical')),
 message text not null check (length(message) between 1 and 500),
 occurrences integer not null default 1 check (occurrences > 0)
);
create index if not exists developer_incidents_created_at_idx on public.developer_incidents(created_at desc);
alter table public.developer_incidents enable row level security;
revoke all on public.developer_incidents from anon, authenticated;
-- Only service-role server routes may read/write this table.
