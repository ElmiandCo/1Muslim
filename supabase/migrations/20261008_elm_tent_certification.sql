create table if not exists public.elm_tent_progress(
 user_id uuid not null references auth.users(id) on delete cascade,
 lesson integer not null check(lesson between 1 and 12),
 completed_at timestamptz not null default now(),
 primary key(user_id,lesson)
);
alter table public.elm_tent_progress enable row level security;
drop policy if exists "Read own elm tent progress" on public.elm_tent_progress;
create policy "Read own elm tent progress" on public.elm_tent_progress for select to authenticated using(user_id=auth.uid());
create or replace function public.complete_elm_tent_lesson(p_lesson integer)
returns table(awarded boolean,completed integer,certified boolean)
language plpgsql security definer set search_path=public
as $$
declare v_user uuid:=auth.uid();v_count integer;v_insert integer;
begin
 if v_user is null then raise exception 'Sign in required';end if;
 if p_lesson<1 or p_lesson>12 then raise exception 'Invalid lesson';end if;
 select count(*) into v_count from public.elm_tent_progress where user_id=v_user;
 if p_lesson<>v_count+1 then raise exception 'Lessons must be completed in order';end if;
 insert into public.elm_tent_progress(user_id,lesson) values(v_user,p_lesson) on conflict do nothing;
 get diagnostics v_insert=row_count;
 select count(*) into v_count from public.elm_tent_progress where user_id=v_user;
 return query select v_insert>0,v_count,v_count=12;
end $$;
revoke all on function public.complete_elm_tent_lesson(integer) from public;
-- Grading is performed on the server API. Do not grant execute to clients.
revoke all on function public.complete_elm_tent_lesson(integer) from anon,authenticated;
