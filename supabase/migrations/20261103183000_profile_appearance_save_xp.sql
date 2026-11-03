-- Reward actual appearance changes once per save, with a short anti-farming cooldown.
-- Apply this migration to the production Supabase project before advertising XP as active.
create table if not exists public.profile_appearance_rewards (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_awarded_at timestamptz not null default now()
);
alter table public.profile_appearance_rewards enable row level security;
revoke all on public.profile_appearance_rewards from anon, authenticated;

create or replace function public.reward_profile_appearance_update()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare last_reward timestamptz;
begin
  if auth.uid() is distinct from new.id then return new; end if;
  if new.profile_accent is not distinct from old.profile_accent
     and new.profile_background is not distinct from old.profile_background
     and new.avatar_package is not distinct from old.avatar_package then return new; end if;
  select last_awarded_at into last_reward from public.profile_appearance_rewards where user_id=new.id for update;
  if last_reward is not null and last_reward > now() - interval '60 seconds' then return new; end if;
  insert into public.profile_appearance_rewards(user_id,last_awarded_at)
  values(new.id,now())
  on conflict(user_id) do update set last_awarded_at=excluded.last_awarded_at;
  new.xp_total=coalesce(old.xp_total,0)+10;
  return new;
end;
$$;
drop trigger if exists trg_reward_profile_appearance_update on public.profiles;
create trigger trg_reward_profile_appearance_update
before update of profile_accent,profile_background,avatar_package on public.profiles
for each row execute function public.reward_profile_appearance_update();
