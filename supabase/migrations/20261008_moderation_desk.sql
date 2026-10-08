-- Review and apply to the confirmed 1Muslim Supabase project before using moderation.
create table if not exists public.moderation_reports (
 id uuid primary key default gen_random_uuid(),
 reporter_id uuid not null references auth.users(id) on delete cascade,
 target_type text not null check(target_type in ('profile','post','comment','live','community')),
 target_id uuid not null,
 reason text not null check(char_length(reason) between 3 and 1000),
 status text not null default 'open' check(status in ('open','reviewing','resolved','dismissed')),
 created_at timestamptz not null default now(),
 resolved_at timestamptz,
 resolved_by uuid references auth.users(id) on delete set null
);
create index if not exists moderation_reports_status_idx on public.moderation_reports(status,created_at desc);
alter table public.moderation_reports enable row level security;
drop policy if exists "reporters submit" on public.moderation_reports;
create policy "reporters submit" on public.moderation_reports for insert to authenticated with check(reporter_id=auth.uid());
drop policy if exists "admins view reports" on public.moderation_reports;
create policy "admins view reports" on public.moderation_reports for select to authenticated using (public.is_1muslim_admin());
drop policy if exists "admins update reports" on public.moderation_reports;
create policy "admins update reports" on public.moderation_reports for update to authenticated using(public.is_1muslim_admin()) with check(public.is_1muslim_admin());
create table if not exists public.moderation_audit (
 id uuid primary key default gen_random_uuid(),
 admin_id uuid not null references auth.users(id),
 action text not null,
 target_type text not null,
 target_id uuid not null,
 created_at timestamptz not null default now()
);
alter table public.moderation_audit enable row level security;
drop policy if exists "admins read audit" on public.moderation_audit;
create policy "admins read audit" on public.moderation_audit for select to authenticated using(public.is_1muslim_admin());
