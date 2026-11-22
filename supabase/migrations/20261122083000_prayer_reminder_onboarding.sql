-- Private, per-member prayer reminder setup and one-time onboarding notification.
-- Location remains in the existing profile city/state/country fields.
create table if not exists public.prayer_reminder_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  method text not null default '2' check (method in ('2','3','4','5')),
  volume numeric(4,3) not null default 0.8 check (volume between 0 and 1),
  prayers jsonb not null default '{"Fajr":true,"Dhuhr":true,"Asr":true,"Maghrib":true,"Isha":true}'::jsonb,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.prayer_reminder_preferences enable row level security;
grant select,insert,update on public.prayer_reminder_preferences to authenticated;
drop policy if exists "prayer_preferences_select_own" on public.prayer_reminder_preferences;
create policy "prayer_preferences_select_own" on public.prayer_reminder_preferences for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists "prayer_preferences_insert_own" on public.prayer_reminder_preferences;
create policy "prayer_preferences_insert_own" on public.prayer_reminder_preferences for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists "prayer_preferences_update_own" on public.prayer_reminder_preferences;
create policy "prayer_preferences_update_own" on public.prayer_reminder_preferences for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

-- Completion is permanent, so editing reminders cannot retrigger onboarding.
create or replace function public.guard_prayer_setup_completion()
returns trigger language plpgsql set search_path='' as $$
begin
  if old.completed_at is not null then new.completed_at := old.completed_at; end if;
  new.updated_at := now();
  return new;
end $$;
revoke all on function public.guard_prayer_setup_completion() from public,anon,authenticated;
drop trigger if exists guard_prayer_setup_completion on public.prayer_reminder_preferences;
create trigger guard_prayer_setup_completion before update on public.prayer_reminder_preferences
for each row execute function public.guard_prayer_setup_completion();

-- Notification is written server-side only when the setup first completes.
-- A client cannot spoof notifications and subsequent saves never create duplicates.
create or replace function public.notify_prayer_setup_completion()
returns trigger language plpgsql security definer set search_path='' as $$
declare newly_completed boolean := false;
begin
  if tg_op = 'INSERT' then
    newly_completed := new.completed_at is not null;
  else
    newly_completed := old.completed_at is null and new.completed_at is not null;
  end if;
  if newly_completed then
    insert into public.notifications(recipient_id,type,title,body,entity_type,metadata)
    values(
      new.user_id,'system','Prayer journey begins',
      'Your prayer times are set. Discover the story and meaning behind the five daily prayers.',
      'prayer_story',jsonb_build_object('href','/widget-tools/prayer/story')
    );
  end if;
  return new;
end $$;
revoke all on function public.notify_prayer_setup_completion() from public,anon,authenticated;
drop trigger if exists notify_prayer_setup_completion on public.prayer_reminder_preferences;
create trigger notify_prayer_setup_completion
after insert or update of completed_at on public.prayer_reminder_preferences
for each row execute function public.notify_prayer_setup_completion();
