-- Explicitly consented, admin-curated Shahada archive. Never auto-publish private recordings.
create table if not exists public.for_allah_shahada_archive (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 storage_bucket text not null check (storage_bucket in ('secure-vault','shahada-safe-vault')),
 storage_path text not null,
 display_name text,
 real_name text,
 duration_seconds integer,
 consented_at timestamptz not null,
 approved_at timestamptz not null,
 created_at timestamptz not null default now(),
 unique (storage_bucket,storage_path)
);
alter table public.for_allah_shahada_archive enable row level security;
-- No public policies: service role only. Approval and consent must be verified before inserting.
create index if not exists for_allah_archive_created_idx on public.for_allah_shahada_archive(created_at desc);
