-- Persist Activity email notification preferences per authenticated member.
create table if not exists public.notification_preferences(
 user_id uuid primary key references auth.users(id) on delete cascade,
 email_messages boolean not null default true,
 email_replies boolean not null default true,
 email_comments boolean not null default true,
 email_xp boolean not null default true,
 updated_at timestamptz not null default now()
);
alter table public.notification_preferences enable row level security;
grant select,insert,update on public.notification_preferences to authenticated;
drop policy if exists "notification_prefs_read_own" on public.notification_preferences;
create policy "notification_prefs_read_own" on public.notification_preferences for select to authenticated using (user_id=auth.uid());
drop policy if exists "notification_prefs_insert_own" on public.notification_preferences;
create policy "notification_prefs_insert_own" on public.notification_preferences for insert to authenticated with check (user_id=auth.uid());
drop policy if exists "notification_prefs_update_own" on public.notification_preferences;
create policy "notification_prefs_update_own" on public.notification_preferences for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
