-- HudHud reward: certified 1Muslim members with strictly more than 100,000 XP.
-- Certification is the trusted shahada verification timestamp, not a client-supplied flag.
create or replace function public.hudhud_my_free_eligibility()
returns table(eligible boolean, certified boolean, xp integer, xp_required integer)
language sql stable security definer set search_path='' as $$
 select (p.shahada_verified_at is not null and coalesce(p.xp_total,0)>100000),
        (p.shahada_verified_at is not null),
        coalesce(p.xp_total,0),100001
 from public.profiles p where p.id=(select auth.uid())
$$;
revoke all on function public.hudhud_my_free_eligibility() from public;
grant execute on function public.hudhud_my_free_eligibility() to authenticated;
