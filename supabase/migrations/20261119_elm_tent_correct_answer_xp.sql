-- Elm Tent: authenticated, server-verified, once-per-question 150 XP.
create or replace function public.claim_elm_tent_answer_xp(
 p_lesson integer, p_question integer, p_answer integer
) returns table(awarded_points integer)
language plpgsql security definer set search_path=public
as $$
declare
 v_uid uuid := auth.uid();
 v_correct integer;
 v_key text;
begin
 if v_uid is null then raise exception 'Sign in to earn XP' using errcode='28000'; end if;
 if p_lesson=2 and p_question between 0 and 27 then
   v_correct := p_question;
 elsif p_lesson=4 and p_question between 0 and 27 then
   v_correct := 3;
 elsif p_lesson=5 and p_question between 0 and 83 then
   v_correct := mod(p_question,3);
 elsif p_lesson=6 and p_question between 0 and 19 then
   v_correct := 0;
 else
   raise exception 'Invalid Elm Tent question';
 end if;
 if p_answer is distinct from v_correct then
   return query select 0;
   return;
 end if;
 v_key := 'elm-tent:lesson-'||p_lesson||':question-'||p_question||':correct';
 -- Serialize claims for this user/question to prevent concurrent double awards.
 perform pg_advisory_xact_lock(hashtextextended(v_uid::text||':'||v_key,0));
 if exists(select 1 from public.xp_events where user_id=v_uid and action_key=v_key) then
   return query select 0;
   return;
 end if;
 update public.profiles set xp_total=coalesce(xp_total,0)+150 where id=v_uid;
 if not found then raise exception 'Profile not found'; end if;
 insert into public.xp_events(user_id,source_type,source_id,points,description,action_key,page_key)
 values(v_uid,'elm_tent',null,150,'Correct Elm Tent answer',v_key,'home');
 return query select 150;
end;
$$;
revoke all on function public.claim_elm_tent_answer_xp(integer,integer,integer) from public;
grant execute on function public.claim_elm_tent_answer_xp(integer,integer,integer) to authenticated;
