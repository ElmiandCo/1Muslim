-- Server-enforced daily and active-minute XP. One reward per user per cooldown across devices.
create table if not exists public.xp_presence_rewards (
 user_id uuid primary key references auth.users(id) on delete cascade,
 last_daily_at timestamptz,
 last_minute_at timestamptz
);
alter table public.xp_presence_rewards enable row level security;

create or replace function public.claim_daily_presence_xp()
returns table(awarded integer,xp_total integer)
language plpgsql security definer set search_path='' as $$
declare v_user uuid := (select auth.uid()); v_last timestamptz; v_total integer;
begin
 if v_user is null then raise exception 'Authentication required'; end if;
 insert into public.xp_presence_rewards(user_id,last_minute_at) values(v_user,clock_timestamp()) on conflict (user_id) do update set last_minute_at=coalesce(public.xp_presence_rewards.last_minute_at,excluded.last_minute_at);
 select last_daily_at into v_last from public.xp_presence_rewards where user_id=v_user for update;
 awarded:=0;
 if v_last is null or clock_timestamp()-v_last>=interval '18 hours' then
  update public.xp_presence_rewards set last_daily_at=clock_timestamp() where user_id=v_user;
  update public.profiles set xp_total=coalesce(public.profiles.xp_total,0)+250 where id=v_user returning public.profiles.xp_total into v_total;
  if found then awarded:=250; end if;
 end if;
 if awarded=0 then select coalesce(p.xp_total,0) into v_total from public.profiles p where p.id=v_user; end if;
 xp_total:=coalesce(v_total,0);return next;
end $$;

create or replace function public.claim_active_minute_xp()
returns table(awarded integer,xp_total integer)
language plpgsql security definer set search_path='' as $$
declare v_user uuid := (select auth.uid()); v_last timestamptz; v_total integer;
begin
 if v_user is null then raise exception 'Authentication required'; end if;
 insert into public.xp_presence_rewards(user_id,last_minute_at) values(v_user,clock_timestamp()) on conflict do nothing;
 select last_minute_at into v_last from public.xp_presence_rewards where user_id=v_user for update;
 awarded:=0;
 if v_last is not null and clock_timestamp()-v_last>=interval '60 seconds' then
  update public.xp_presence_rewards set last_minute_at=clock_timestamp() where user_id=v_user;
  update public.profiles set xp_total=coalesce(public.profiles.xp_total,0)+50 where id=v_user returning public.profiles.xp_total into v_total;
  if found then awarded:=50; end if;
 end if;
 if awarded=0 then select coalesce(p.xp_total,0) into v_total from public.profiles p where p.id=v_user; end if;
 xp_total:=coalesce(v_total,0);return next;
end $$;
revoke all on function public.claim_daily_presence_xp() from public;
revoke all on function public.claim_active_minute_xp() from public;
grant execute on function public.claim_daily_presence_xp() to authenticated;
grant execute on function public.claim_active_minute_xp() to authenticated;
