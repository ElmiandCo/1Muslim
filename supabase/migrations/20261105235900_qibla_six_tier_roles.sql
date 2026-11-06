-- 1Qibla role hierarchy. Isolated from existing platform admin_users and
-- pending editorial tables in #558. No account is elevated by this migration.
create table if not exists public.qibla_role_assignments (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role_level smallint not null check (role_level between 2 and 6),
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now()
);
comment on table public.qibla_role_assignments is
  '1Qibla explicit roles: 2 writer, 3 editor, 4 approver, 5 administrator, 6 owner. Missing row means level 1 member.';
alter table public.qibla_role_assignments enable row level security;
-- No user-editable policies: privileged provisioning only through a verified
-- server-side service role process. Never expose service role credentials.
revoke all on public.qibla_role_assignments from anon, authenticated;
grant select on public.qibla_role_assignments to authenticated;
create policy qibla_role_self_read on public.qibla_role_assignments
  for select to authenticated using (user_id = (select auth.uid()));
-- This invoker function only returns the caller's own role.
create or replace function public.qibla_my_role_level()
returns smallint language sql stable security invoker set search_path = ''
as $$
  select coalesce(
    (select role_level from public.qibla_role_assignments
      where user_id = (select auth.uid())), 1)::smallint
$$;
revoke all on function public.qibla_my_role_level() from public, anon;
grant execute on function public.qibla_my_role_level() to authenticated;
