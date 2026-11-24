-- Staged interface only: no existing view, table grant, policy, or consumer changes.
-- A view owner must be able to read the protected source rows; verify ownership,
-- grants and RLS on staging before using this interface or applying this migration.
-- This does NOT close direct profiles or existing-view access.
create view public.profile_directory_safe_v1 with (security_barrier = true) as
select
 p.id,
 p.display_name,
 case when p.hide_1muslim_id is false then p.username else null end as username,
 p.country
from public.profiles as p
join public.member_region_preferences as consent on consent.user_id = p.id
where consent.directory_visible is true and consent.consented_at is not null;

revoke all on public.profile_directory_safe_v1 from public, anon, authenticated;
grant select on public.profile_directory_safe_v1 to authenticated;
comment on view public.profile_directory_safe_v1 is
 'Staged authenticated country directory projection; not a replacement for direct profiles access control.';
