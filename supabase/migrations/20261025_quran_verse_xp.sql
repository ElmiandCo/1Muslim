-- Once-per-user, per-verse rewards. Run this migration before enabling the UI.
create table if not exists public.quran_verse_xp_claims (
 user_id uuid not null references auth.users(id) on delete cascade,
 verse_key text not null,
 activity text not null check (activity in ('view','listen')),
 claimed_at timestamptz not null default now(),
 primary key(user_id,verse_key,activity),
 constraint valid_quran_verse_key check (verse_key ~ '^([1-9]|[1-9][0-9]|1[01][0-4]):[1-9][0-9]{0,2}$')
);
alter table public.quran_verse_xp_claims enable row level security;
revoke all on public.quran_verse_xp_claims from anon, authenticated;
create or replace function public.claim_quran_verse_xp(p_verse_key text,p_activity text)
returns table(awarded integer,xp_total integer)
language plpgsql security definer set search_path=public as $$
declare v_amount integer;v_inserted integer;v_total integer;
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 if p_verse_key !~ '^([1-9]|[1-9][0-9]|1[01][0-4]):[1-9][0-9]{0,2}$' then raise exception 'Invalid verse'; end if;
 if p_activity not in ('view','listen') then raise exception 'Invalid activity'; end if;
 v_amount:=case when p_activity='view' then 100 else 250 end;
 insert into public.quran_verse_xp_claims(user_id,verse_key,activity)
 values(auth.uid(),p_verse_key,p_activity) on conflict do nothing;
 get diagnostics v_inserted=row_count;
 if v_inserted=1 then
  update public.profiles set xp_total=coalesce(public.profiles.xp_total,0)+v_amount
  where id=auth.uid() returning public.profiles.xp_total into v_total;
  if v_total is null then raise exception 'Profile unavailable'; end if;
 else
  select coalesce(p.xp_total,0) into v_total from public.profiles p where p.id=auth.uid();
 end if;
 return query select case when v_inserted=1 then v_amount else 0 end,coalesce(v_total,0);
end $$;
revoke all on function public.claim_quran_verse_xp(text,text) from public;
grant execute on function public.claim_quran_verse_xp(text,text) to authenticated;
