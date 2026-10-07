-- 1Muslim reconnect trivia XP
-- Keeps the multiplier server-side so the browser cannot award arbitrary XP.

create or replace function public.award_trivia_xp(
  p_action_key text,
  p_page_key text,
  p_base_points integer default 25,
  p_streak integer default 1
)
returns table(awarded_points integer, multiplier integer, streak integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_multiplier integer;
  v_points integer;
  v_existing integer;
begin
  if v_user_id is null then
    return query select 0, 1, 0;
    return;
  end if;

  v_multiplier := case
    when p_streak >= 8 then 100
    when p_streak = 7 then 50
    when p_streak = 6 then 25
    when p_streak = 5 then 15
    when p_streak = 4 then 10
    when p_streak = 3 then 5
    when p_streak = 2 then 2
    else 1
  end;

  v_points := greatest(1, least(1000, coalesce(p_base_points,25))) * v_multiplier;

  select count(*) into v_existing
  from public.xp_events
  where user_id = v_user_id
    and action_key = p_action_key;

  if v_existing > 0 then
    return query select 0, v_multiplier, p_streak;
    return;
  end if;

  if not exists (select 1 from public.profiles where id = v_user_id) then
    return query select 0, v_multiplier, p_streak;
    return;
  end if;

  update public.profiles
     set xp_total = coalesce(xp_total,0) + v_points
   where id = v_user_id;

  insert into public.xp_events(user_id, source_type, source_id, points, description, action_key, page_key)
  values (
    v_user_id,
    'trivia',
    null,
    v_points,
    'Correct 1Muslim reconnect trivia — streak x' || v_multiplier,
    p_action_key,
    p_page_key
  );

  return query select v_points, v_multiplier, p_streak;
end;
$$;

revoke all on function public.award_trivia_xp(text,text,integer,integer) from public;
grant execute on function public.award_trivia_xp(text,text,integer,integer) to authenticated;
