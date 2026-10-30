create table if not exists public.arabic_letter_practice_xp (
 user_id uuid not null references auth.users(id) on delete cascade,
 lesson integer not null check(lesson between 1 and 2),
 letter_index integer not null check(letter_index between 0 and 27),
 awarded_at timestamptz not null default now(),
 primary key(user_id,lesson,letter_index)
);
alter table public.arabic_letter_practice_xp enable row level security;
create or replace function public.claim_arabic_letter_practice_xp(p_lesson integer,p_letter_index integer)
returns table(awarded integer,xp_total integer) language plpgsql security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid()); v_new integer;
begin
 if v_user is null then raise exception 'Authentication required'; end if;
 if p_lesson not between 1 and 2 or p_letter_index not between 0 and 27 then raise exception 'Invalid letter'; end if;
 insert into public.arabic_letter_practice_xp(user_id,lesson,letter_index)
 values(v_user,p_lesson,p_letter_index) on conflict do nothing;
 if found then
  update public.profiles set xp_total=coalesce(public.profiles.xp_total,0)+250
  where id=v_user returning public.profiles.xp_total into v_new;
  awarded:=250;
 else
  select coalesce(p.xp_total,0) into v_new from public.profiles p where p.id=v_user;
  awarded:=0;
 end if;
 xp_total:=coalesce(v_new,0);return next;
end $$;
revoke all on function public.claim_arabic_letter_practice_xp(integer,integer) from public;
grant execute on function public.claim_arabic_letter_practice_xp(integer,integer) to authenticated;