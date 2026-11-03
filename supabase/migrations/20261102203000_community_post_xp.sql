-- One-time XP for published Community posts; verified Qur'an references receive 1000 instead of 500.
create table if not exists public.community_post_xp_awards (
 post_id uuid primary key references public.ummah_feed_posts(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 xp_awarded integer not null check (xp_awarded in (500,1000)),
 awarded_at timestamptz not null default now()
);
alter table public.community_post_xp_awards enable row level security;
create or replace function public.claim_community_post_xp(p_post_id uuid)
returns table(awarded integer,xp_total integer)
language plpgsql security definer set search_path='' as $$
declare
 v_user uuid := (select auth.uid());
 v_body text;
 v_ref text[];
 v_surah integer;
 v_ayah integer;
 v_reward integer := 500;
 v_total integer;
begin
 if v_user is null then raise exception 'Authentication required'; end if;
 select body into v_body from public.ummah_feed_posts where id=p_post_id and author_id=v_user;
 if not found then raise exception 'Published post not found'; end if;
 -- A Qur'an reference must have a valid chapter:verse identifier, not merely mention "Qur'an".
 v_ref := regexp_match(coalesce(v_body,''), '(^|[^0-9])([0-9]{1,3}):([0-9]{1,3})([^0-9]|$)');
 if v_ref is not null then
  v_surah := v_ref[2]::integer; v_ayah := v_ref[3]::integer;
  if v_surah between 1 and 114 and v_ayah between 1 and 286 then v_reward := 1000; end if;
 end if;
 insert into public.community_post_xp_awards(post_id,user_id,xp_awarded)
 values(p_post_id,v_user,v_reward) on conflict (post_id) do nothing;
 if found then
  update public.profiles set xp_total=coalesce(public.profiles.xp_total,0)+v_reward
  where id=v_user returning public.profiles.xp_total into v_total;
  awarded:=v_reward;
 else
  select coalesce(p.xp_total,0) into v_total from public.profiles p where p.id=v_user;
  awarded:=0;
 end if;
 xp_total:=coalesce(v_total,0);
 return next;
end $$;
revoke all on function public.claim_community_post_xp(uuid) from public;
grant execute on function public.claim_community_post_xp(uuid) to authenticated;
