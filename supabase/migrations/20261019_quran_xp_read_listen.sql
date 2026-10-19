-- Applied to Supabase project njilnqgdfrvpvgbkodwl on 2026-10-19.
-- Server grants are unique per user/verse/activity; reading and listening only.
-- IMPORTANT: browser-side activity is not cryptographically attested.
create table if not exists public.quran_xp_claims (
 user_id uuid not null references auth.users(id) on delete cascade,
 chapter integer not null check(chapter between 1 and 114),
 verse integer not null check(verse between 1 and 286),
 activity text not null check(activity in ('read','listen','recite','chapter')),
 created_at timestamptz not null default now(),
 primary key(user_id,chapter,verse,activity)
);
alter table public.quran_xp_claims enable row level security;
revoke all on public.quran_xp_claims from anon,authenticated;
create or replace function public.claim_quran_xp(p_chapter integer,p_verse integer,p_activity text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); pts integer; total integer; inserted integer;
begin
 if uid is null then return jsonb_build_object('awarded',0); end if;
 if p_chapter not between 1 and 114 or p_verse not between 1 and 286 or p_activity not in ('read','listen') then return jsonb_build_object('awarded',0); end if;
 pts:=case p_activity when 'read' then 250 else 500 end;
 insert into public.quran_xp_claims(user_id,chapter,verse,activity) values(uid,p_chapter,p_verse,p_activity) on conflict do nothing;
 get diagnostics inserted=row_count;
 if inserted=0 then return jsonb_build_object('awarded',0); end if;
 update public.profiles set xp_total=coalesce(xp_total,0)+pts,updated_at=now() where id=uid returning xp_total into total;
 if total is null then raise exception 'Profile not found'; end if;
 insert into public.xp_events(user_id,source_type,source_id,points,description,action_key,page_key)
 values(uid,'engagement',p_chapter::text||':'||p_verse::text,pts,'Quran verse '||p_activity,'quran_'||p_activity,'quran');
 return jsonb_build_object('awarded',pts,'xp_total',total);
end $$;
revoke all on function public.claim_quran_xp(integer,integer,text) from public;
grant execute on function public.claim_quran_xp(integer,integer,text) to authenticated;
