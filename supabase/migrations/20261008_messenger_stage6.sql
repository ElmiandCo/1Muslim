-- Messenger Stage 6: member preferences and optional enhancements. No AI provider or payment bypass.
create table if not exists public.dm_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 translate_to text not null default 'off' check (translate_to in ('off','en','ar','so','fr','es','ur')),
 ai_assistance boolean not null default false,
 updated_at timestamptz not null default now()
);
alter table public.dm_preferences enable row level security;
create policy dm_preferences_read on public.dm_preferences for select to authenticated using(user_id=(select auth.uid()));
create policy dm_preferences_insert on public.dm_preferences for insert to authenticated with check(user_id=(select auth.uid()));
create policy dm_preferences_update on public.dm_preferences for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
grant select,insert,update on public.dm_preferences to authenticated;
-- Badges are read-only for users; only the existing trusted badge-award process may grant them.
create or replace function public.dm_my_badges() returns table(badge_key text,badge_name text) language sql stable security invoker set search_path='' as $$
 select b.badge_key,b.badge_name from public.profile_badges b where b.user_id=(select auth.uid())
$$;
revoke all on function public.dm_my_badges() from public;
grant execute on function public.dm_my_badges() to authenticated;