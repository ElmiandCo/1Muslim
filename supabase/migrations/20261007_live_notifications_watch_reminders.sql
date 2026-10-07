-- 1Muslim in-app notifications and Live watch reminders
create table if not exists public.live_watch_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  schedule_slot_id uuid not null references public.live_schedule_slots(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, schedule_slot_id)
);

alter table public.live_watch_reminders enable row level security;
drop policy if exists "users manage own live watch reminders" on public.live_watch_reminders;
create policy "users manage own live watch reminders" on public.live_watch_reminders
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create index if not exists live_watch_reminders_user_idx on public.live_watch_reminders(user_id, created_at desc);
create index if not exists live_watch_reminders_slot_idx on public.live_watch_reminders(schedule_slot_id);
grant select, insert, update, delete on public.live_watch_reminders to authenticated;

create or replace function public.create_1muslim_notification(
  p_recipient_id uuid, p_actor_id uuid, p_type text, p_title text, p_body text,
  p_entity_type text default null, p_entity_id uuid default null, p_metadata jsonb default '{}'::jsonb
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if p_recipient_id is null then return null; end if;
  insert into public.notifications
    (recipient_id, actor_id, type, title, body, entity_type, entity_id, metadata)
  values
    (p_recipient_id, p_actor_id, p_type, left(coalesce(p_title,''),160),
     left(coalesce(p_body,''),500), p_entity_type, p_entity_id, coalesce(p_metadata,'{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.create_1muslim_notification(uuid,uuid,text,text,text,text,uuid,jsonb) from public, anon, authenticated;

create or replace function public.notify_followers_about_live_schedule()
returns trigger language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if tg_op = 'INSERT' then
    for r in select follower_id from public.profile_follows where following_id = new.host_id loop
      perform public.create_1muslim_notification(
        r.follower_id,new.host_id,'live_scheduled','Live scheduled',
        coalesce((select display_name from public.profiles where id=new.host_id),'Someone you follow') ||
        ' scheduled “' || new.title || '”.','live_schedule',new.id,jsonb_build_object('starts_at',new.starts_at));
    end loop;
  elsif tg_op = 'UPDATE' then
    if new.status='cancelled' and old.status is distinct from 'cancelled' then
      for r in
        select recipient_id from (
          select follower_id recipient_id from public.profile_follows where following_id=new.host_id
          union select user_id from public.live_watch_reminders where schedule_slot_id=new.id
        ) q loop
        perform public.create_1muslim_notification(
          r.recipient_id,new.host_id,'live_cancelled','Live canceled',
          coalesce((select display_name from public.profiles where id=new.host_id),'A host') ||
          ' canceled “' || new.title || '”.','live_schedule',new.id);
      end loop;
    elsif new.starts_at is distinct from old.starts_at then
      for r in
        select recipient_id from (
          select follower_id recipient_id from public.profile_follows where following_id=new.host_id
          union select user_id from public.live_watch_reminders where schedule_slot_id=new.id
        ) q loop
        perform public.create_1muslim_notification(
          r.recipient_id,new.host_id,'live_rescheduled','Live time changed',
          coalesce((select display_name from public.profiles where id=new.host_id),'A host') ||
          ' moved “' || new.title || '”.','live_schedule',new.id,
          jsonb_build_object('starts_at',new.starts_at));
      end loop;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.notify_followers_about_live_schedule() from public, anon, authenticated;

drop trigger if exists trg_1muslim_live_schedule_notifications on public.live_schedule_slots;
create trigger trg_1muslim_live_schedule_notifications
after insert or update of starts_at,status on public.live_schedule_slots
for each row execute function public.notify_followers_about_live_schedule();

create or replace function public.notify_followers_about_live()
returns trigger language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if new.status='live' and old.status is distinct from 'live' then
    for r in
      select follower_id recipient_id from public.profile_follows where following_id=new.host_id
      union select user_id recipient_id from public.live_watch_reminders where schedule_slot_id=new.schedule_slot_id
    loop
      perform public.create_1muslim_notification(
        r.recipient_id,new.host_id,'live_started','Live now',
        coalesce((select display_name from public.profiles where id=new.host_id),'Someone you follow') ||
        ' is Live now' || case when nullif(new.title,'') is not null then ': '||new.title else '.' end,
        'live_stream',new.id,jsonb_build_object('room_name',new.room_name));
    end loop;
  end if;
  return new;
end;
$$;
revoke all on function public.notify_followers_about_live() from public, anon, authenticated;

drop trigger if exists trg_1muslim_live_notifications on public.live_streams;
create trigger trg_1muslim_live_notifications
after update of status on public.live_streams
for each row execute function public.notify_followers_about_live();
