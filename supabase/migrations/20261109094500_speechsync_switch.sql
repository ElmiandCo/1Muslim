create table if not exists public.admin_feature_switches (key text primary key,enabled boolean not null default false,updated_at timestamptz not null default now());
alter table public.admin_feature_switches enable row level security;
insert into public.admin_feature_switches(key,enabled) values ('speechsync',false) on conflict(key) do nothing;
