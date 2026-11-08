-- Ping GroupSync: member access to accepted sessions without recursive RLS.
create schema if not exists private;
create or replace function private.ping_accepted_member(p_session uuid)
returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.muslim_sync_members m where m.session_id=p_session and m.user_id=(select auth.uid()) and m.status='accepted');
$$;
revoke all on function private.ping_accepted_member(uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.ping_accepted_member(uuid) to authenticated;
create policy "accepted group members read sync session" on public.muslim_sync_sessions
 for select to authenticated using (private.ping_accepted_member(id));
-- Session updates remain restricted to initiator and original invitee by existing policy;
-- group members only read shared navigation.
create policy "accepted group members read roster" on public.muslim_sync_members
 for select to authenticated using (private.ping_accepted_member(session_id));
