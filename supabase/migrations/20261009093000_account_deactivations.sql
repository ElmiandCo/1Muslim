-- User-controlled temporary account deactivation. Does not delete content.
create table if not exists public.account_deactivations (
 user_id uuid primary key references auth.users(id) on delete cascade,
 deactivated_at timestamptz not null default now()
);
alter table public.account_deactivations enable row level security;
drop policy if exists "Users can read their deactivation" on public.account_deactivations;
create policy "Users can read their deactivation" on public.account_deactivations for select to authenticated using (auth.uid()=user_id);
drop policy if exists "Users can deactivate themselves" on public.account_deactivations;
create policy "Users can deactivate themselves" on public.account_deactivations for insert to authenticated with check (auth.uid()=user_id);
drop policy if exists "Users can reactivate themselves" on public.account_deactivations;
create policy "Users can reactivate themselves" on public.account_deactivations for delete to authenticated using (auth.uid()=user_id);
