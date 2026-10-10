-- Private HudHud learning memory: per-user preferences and Tajweed goals.
create table if not exists public.hudhud_learning_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 preferred_language text not null default 'en',
 preferred_reciter text,
 daily_verse_goal smallint not null default 3 check (daily_verse_goal between 1 and 30),
 practice_focus text not null default 'tajweed',
 last_surah smallint check (last_surah between 1 and 114),
 last_ayah smallint check (last_ayah > 0),
 updated_at timestamptz not null default now()
);
alter table public.hudhud_learning_profiles enable row level security;
grant select,insert,update on public.hudhud_learning_profiles to authenticated;
create policy "Read own HudHud learning profile" on public.hudhud_learning_profiles for select to authenticated using(auth.uid()=user_id);
create policy "Create own HudHud learning profile" on public.hudhud_learning_profiles for insert to authenticated with check(auth.uid()=user_id);
create policy "Update own HudHud learning profile" on public.hudhud_learning_profiles for update to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);

-- Only trusted evaluation services can grant a first-pass rank.
create table if not exists public.tajweed_first_pass_awards (
 surah_number smallint not null check (surah_number between 1 and 114),
 ayah_number smallint not null check (ayah_number > 0),
 user_id uuid not null references auth.users(id) on delete cascade,
 attempt_id uuid not null unique references public.tajweed_attempts(id),
 awarded_at timestamptz not null default now(),
 primary key(surah_number,ayah_number)
);
alter table public.tajweed_first_pass_awards enable row level security;
revoke all on public.tajweed_first_pass_awards from anon,authenticated;
-- Aggregate verse counts are exposed without recording paths or learner identities.
create or replace function public.tajweed_verse_community_stats(p_surah smallint,p_ayah smallint)
returns table(total_attempts bigint,unique_learners bigint,passing_attempts bigint,first_pass_awarded boolean)
language sql security definer set search_path = '' stable as $$
 select count(*)::bigint,count(distinct t.user_id)::bigint,
 count(*) filter(where t.evaluation_status='evaluated' and t.result='close')::bigint,
 exists(select 1 from public.tajweed_first_pass_awards a where a.surah_number=p_surah and a.ayah_number=p_ayah)
 from public.tajweed_attempts t where t.surah_number=p_surah and t.ayah_number=p_ayah;
$$;
revoke all on function public.tajweed_verse_community_stats(smallint,smallint) from public;
grant execute on function public.tajweed_verse_community_stats(smallint,smallint) to anon,authenticated;
-- Called only by trusted backend after independently validated Tajweed evaluation.
create or replace function public.award_tajweed_first_pass(p_attempt uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare a public.tajweed_attempts%rowtype; inserted_count integer;
begin
 if auth.role() <> 'service_role' then raise exception 'service role required'; end if;
 select * into a from public.tajweed_attempts where id=p_attempt and evaluation_status='evaluated' and result='close' for update;
 if not found then return false; end if;
 insert into public.tajweed_first_pass_awards(surah_number,ayah_number,user_id,attempt_id)
 values(a.surah_number,a.ayah_number,a.user_id,a.id) on conflict do nothing;
 get diagnostics inserted_count = row_count;
 return inserted_count=1;
end $$;
revoke all on function public.award_tajweed_first_pass(uuid) from public,anon,authenticated;
grant execute on function public.award_tajweed_first_pass(uuid) to service_role;
