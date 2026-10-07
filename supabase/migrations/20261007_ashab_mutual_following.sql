-- 1Muslim: Ashab is mutual following (no artificial limit)
create or replace function public.get_profile_relationship_stats(p_profile_id uuid)
returns table(followers bigint, following bigint, ashab bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select
    (select count(*) from public.profile_follows where following_id = p_profile_id),
    (select count(*) from public.profile_follows where follower_id = p_profile_id),
    (select count(*)
       from public.profile_follows f
      where f.follower_id = p_profile_id
        and exists (
          select 1 from public.profile_follows mutual
           where mutual.follower_id = f.following_id
             and mutual.following_id = p_profile_id
        ));
$$;

create or replace function public.get_ashab_ids(p_profile_id uuid)
returns table(user_id uuid)
language sql
stable
security invoker
set search_path = public
as $$
  select f.following_id
    from public.profile_follows f
   where f.follower_id = p_profile_id
     and exists (
       select 1 from public.profile_follows mutual
        where mutual.follower_id = f.following_id
          and mutual.following_id = p_profile_id
     );
$$;

revoke all on function public.get_profile_relationship_stats(uuid) from public, anon;
grant execute on function public.get_profile_relationship_stats(uuid) to authenticated;

revoke all on function public.get_ashab_ids(uuid) from public, anon;
grant execute on function public.get_ashab_ids(uuid) to authenticated;
