-- Idempotent 250 XP for each Qur'an verse visibly studied for at least 2 seconds.
create table if not exists public.quran_verse_view_xp (
 user_id uuid not null references auth.users(id) on delete cascade,
 verse_key text not null,
 awarded_at timestamptz not null default now(),
 primary key(user_id,verse_key)
);
create table if not exists public.quran_verse_view_sessions (
 user_id uuid not null references auth.users(id) on delete cascade,
 verse_key text not null,
 started_at timestamptz not null default now(),
 primary key(user_id,verse_key)
);
alter table public.quran_verse_view_xp enable row level security;
alter table public.quran_verse_view_sessions enable row level security;
create or replace function public.begin_quran_verse_view(p_verse_key text)
returns void language plpgsql security definer set search_path='' as $$
declare v_user uuid := (select auth.uid()); v_surah integer; v_ayah integer;
begin
 if v_user is null then raise exception 'Authentication required'; end if;
 if p_verse_key !~ '^[0-9]{1,3}:[0-9]{1,3}$' then raise exception 'Invalid verse'; end if;
 v_surah:=split_part(p_verse_key,':',1)::integer;
 v_ayah:=split_part(p_verse_key,':',2)::integer;
 if v_surah not between 1 and 114 or v_ayah not between 1 and 286 then raise exception 'Invalid verse'; end if;
 insert into public.quran_verse_view_sessions(user_id,verse_key) values(v_user,p_verse_key)
 on conflict(user_id,verse_key) do update set started_at=now();
end $$;
create or replace function public.claim_quran_verse_view_xp(p_verse_key text)
returns table(awarded integer,xp_total integer) language plpgsql security definer set search_path='' as $$
declare v_user uuid := (select auth.uid()); v_started timestamptz; v_new integer;
begin
 if v_user is null then raise exception 'Authentication required'; end if;
 select started_at into v_started from public.quran_verse_view_sessions
 where user_id=v_user and verse_key=p_verse_key for update;
 if v_started is null or clock_timestamp()-v_started < interval '2 seconds' then
  raise exception 'Verse must be viewed for at least two seconds';
 end if;
 insert into public.quran_verse_view_xp(user_id,verse_key) values(v_user,p_verse_key)
 on conflict do nothing;
 if found then
  update public.profiles set xp_total=coalesce(public.profiles.xp_total,0)+250
  where id=v_user returning public.profiles.xp_total into v_new;
  awarded:=250;
 else
  select coalesce(p.xp_total,0) into v_new from public.profiles p where p.id=v_user;
  awarded:=0;
 end if;
 xp_total:=coalesce(v_new,0);
 return next;
end $$;
revoke all on function public.begin_quran_verse_view(text) from public;
revoke all on function public.claim_quran_verse_view_xp(text) from public;
grant execute on function public.begin_quran_verse_view(text) to authenticated;
grant execute on function public.claim_quran_verse_view_xp(text) to authenticated;
