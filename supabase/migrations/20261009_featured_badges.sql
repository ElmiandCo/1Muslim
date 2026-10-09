-- Public badge display; only privileged server-side processes may award/revoke badges.
create table if not exists public.member_badges (
 user_id uuid not null references auth.users(id) on delete cascade,
 badge_key text not null check (badge_key in ('shahada','dua','live','steward','guardian')),
 earned_at timestamptz not null default now(),
 primary key(user_id,badge_key)
);
alter table public.member_badges enable row level security;
drop policy if exists "Read member earned badges" on public.member_badges;
create policy "Read member earned badges" on public.member_badges for select using(true);
alter table public.profiles add column if not exists featured_badge_key text;
alter table public.profiles add constraint profiles_featured_badge_valid check (featured_badge_key is null or featured_badge_key in ('shahada','dua','live','steward','guardian'));
create or replace function public.set_featured_badge(chosen_badge text) returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
 if uid is null then raise exception 'Authentication required'; end if;
 if chosen_badge is not null and not exists (
  select 1 from public.member_badges where user_id=uid and badge_key=chosen_badge
  union all select 1 from public.profiles where id=uid and chosen_badge='shahada' and shahada_verified_at is not null
 ) then raise exception 'Badge not earned'; end if;
 update public.profiles set featured_badge_key=chosen_badge where id=uid;
end $$;
revoke all on function public.set_featured_badge(text) from public;
grant execute on function public.set_featured_badge(text) to authenticated;
