-- Phase 1: one-time, authenticated educational discovery rewards.
create table if not exists public.discovery_rewards (
 user_id uuid not null references auth.users(id) on delete cascade,
 lesson_id text not null check (lesson_id in ('bismillah','salam','alhamdulillah','tawhid')),
 xp integer not null default 25 check (xp = 25),
 earned_at timestamptz not null default now(),
 primary key (user_id, lesson_id)
);
alter table public.discovery_rewards enable row level security;
drop policy if exists "Read own discovery rewards" on public.discovery_rewards;
create policy "Read own discovery rewards" on public.discovery_rewards for select to authenticated using (user_id=auth.uid());
-- No direct INSERT/UPDATE/DELETE policy. Only controlled RPC can grant rewards.
create or replace function public.claim_discovery_reward(p_lesson text)
returns table(awarded boolean, total_xp bigint, unlocked_document text, unlocked_avatar text)
language plpgsql security definer set search_path=public
as $$
declare v_uid uuid := auth.uid(); v_count bigint; v_awarded boolean := false;
begin
 if v_uid is null then raise exception 'Sign in required'; end if;
 if p_lesson not in ('bismillah','salam','alhamdulillah','tawhid') then raise exception 'Unknown discovery'; end if;
 insert into public.discovery_rewards(user_id,lesson_id) values(v_uid,p_lesson) on conflict do nothing;
 get diagnostics v_count = row_count;
 v_awarded := v_count > 0;
 select count(*) into v_count from public.discovery_rewards where user_id=v_uid;
 return query select v_awarded,v_count*25,
 case when v_count>=2 then 'My First Islamic Words'::text else null::text end,
 case when v_count>=4 then 'Discovery Star'::text else null::text end;
end $$;
revoke all on function public.claim_discovery_reward(text) from public;
grant execute on function public.claim_discovery_reward(text) to authenticated;
