-- One-time 10,000 XP reward for a genuine five-second Elmi Light verse hold.
create table if not exists public.elmi_verse_holds (
 user_id uuid primary key references auth.users(id) on delete cascade,
 started_at timestamptz not null default now(),
 claimed_at timestamptz
);
alter table public.elmi_verse_holds enable row level security;
revoke all on public.elmi_verse_holds from anon, authenticated;
create or replace function public.begin_elmi_verse_hold()
returns void language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 insert into public.elmi_verse_holds(user_id,started_at)
 values(auth.uid(),clock_timestamp())
 on conflict(user_id) do update set started_at=case when public.elmi_verse_holds.claimed_at is null then clock_timestamp() else public.elmi_verse_holds.started_at end;
end $$;
create or replace function public.claim_elmi_verse_hold()
returns table(awarded integer,xp_total integer)
language plpgsql security definer set search_path=public as $$
declare v_hold public.elmi_verse_holds%rowtype; v_xp integer;
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 select * into v_hold from public.elmi_verse_holds where user_id=auth.uid() for update;
 if not found then raise exception 'Start holding the verse first'; end if;
 if v_hold.claimed_at is not null then
  return query select 0,coalesce((select p.xp_total from public.profiles p where p.id=auth.uid()),0);return;
 end if;
 if clock_timestamp()-v_hold.started_at < interval '5 seconds' then raise exception 'Hold the verse for five seconds'; end if;
 update public.elmi_verse_holds set claimed_at=clock_timestamp() where user_id=auth.uid();
 update public.profiles set xp_total=coalesce(public.profiles.xp_total,0)+10000 where id=auth.uid() returning public.profiles.xp_total into v_xp;
 if v_xp is null then raise exception 'Profile unavailable'; end if;
 return query select 10000,v_xp;
end $$;
revoke all on function public.begin_elmi_verse_hold() from public;
revoke all on function public.claim_elmi_verse_hold() from public;
grant execute on function public.begin_elmi_verse_hold() to authenticated;
grant execute on function public.claim_elmi_verse_hold() to authenticated;