-- Private, opt-in masjid preference for the Ummah region invitation.
-- This must be applied to Supabase before enabling the invitation in production.
-- Public profile country/state/city fields remain the user's existing profile fields.
create table if not exists public.member_region_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 masjid_name text,
 region_level text not null default 'country' check (region_level in ('country','state','city','masjid')),
 consented_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint member_masjid_len check (masjid_name is null or char_length(masjid_name) <= 140)
);
alter table public.member_region_preferences enable row level security;
revoke all on table public.member_region_preferences from anon;
grant select,insert,update,delete on table public.member_region_preferences to authenticated;
drop policy if exists member_region_private_select on public.member_region_preferences;
create policy member_region_private_select on public.member_region_preferences for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists member_region_private_insert on public.member_region_preferences;
create policy member_region_private_insert on public.member_region_preferences for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists member_region_private_update on public.member_region_preferences;
create policy member_region_private_update on public.member_region_preferences for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists member_region_private_delete on public.member_region_preferences;
create policy member_region_private_delete on public.member_region_preferences for delete to authenticated using ((select auth.uid())=user_id);
