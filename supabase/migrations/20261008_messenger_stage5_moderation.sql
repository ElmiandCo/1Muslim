create or replace function public.dm_is_moderator() returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.admin_users where user_id=(select auth.uid())) $$;
revoke all on function public.dm_is_moderator() from public;
grant execute on function public.dm_is_moderator() to authenticated;
create policy dm_reports_admin_read on public.dm_reports for select to authenticated using(public.dm_is_moderator());
create policy dm_reports_admin_update on public.dm_reports for update to authenticated using(public.dm_is_moderator()) with check(public.dm_is_moderator());
grant update(status) on public.dm_reports to authenticated;