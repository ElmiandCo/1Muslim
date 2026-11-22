-- Server-owned HudHud Discover free-tier message quota.
-- Do not grant table or RPC access to browser clients.
create table if not exists public.discover_hudhud_usage (
  usage_key text primary key check(length(usage_key) between 4 and 180),
  turns_used integer not null default 0 check(turns_used between 0 and 3),
  updated_at timestamptz not null default now()
);
alter table public.discover_hudhud_usage enable row level security;
revoke all on public.discover_hudhud_usage from public, anon, authenticated;
grant select,insert,update on public.discover_hudhud_usage to service_role;

create or replace function public.reserve_discover_hudhud_turn(p_key text)
returns integer language plpgsql security definer set search_path='' as $$
declare v_turns integer;
begin
  if p_key is null or length(p_key) not between 4 and 180 then
    raise exception 'Invalid HudHud usage key';
  end if;
  insert into public.discover_hudhud_usage(usage_key,turns_used)
  values(p_key,1)
  on conflict (usage_key) do update
    set turns_used=public.discover_hudhud_usage.turns_used+1,updated_at=now()
    where public.discover_hudhud_usage.turns_used<3
  returning turns_used into v_turns;
  return v_turns; -- null means the three-turn free limit has been reached
end $$;

create or replace function public.refund_discover_hudhud_turn(p_key text)
returns void language plpgsql security definer set search_path='' as $$
begin
  update public.discover_hudhud_usage
     set turns_used=greatest(turns_used-1,0),updated_at=now()
   where usage_key=p_key;
end $$;

revoke all on function public.reserve_discover_hudhud_turn(text) from public,anon,authenticated;
revoke all on function public.refund_discover_hudhud_turn(text) from public,anon,authenticated;
grant execute on function public.reserve_discover_hudhud_turn(text) to service_role;
grant execute on function public.refund_discover_hudhud_turn(text) to service_role;
