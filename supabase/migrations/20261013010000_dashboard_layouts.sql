-- Per-user dashboard layouts; isolated by Supabase auth and RLS.
create table if not exists public.dashboard_layouts (
 user_id uuid primary key references auth.users(id) on delete cascade,
 layout jsonb not null,
 updated_at timestamptz not null default now()
);
alter table public.dashboard_layouts enable row level security;
drop policy if exists "dashboard_layouts_select_own" on public.dashboard_layouts;
create policy "dashboard_layouts_select_own" on public.dashboard_layouts for select to authenticated using (auth.uid() = user_id);
drop policy if exists "dashboard_layouts_insert_own" on public.dashboard_layouts;
create policy "dashboard_layouts_insert_own" on public.dashboard_layouts for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "dashboard_layouts_update_own" on public.dashboard_layouts;
create policy "dashboard_layouts_update_own" on public.dashboard_layouts for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
