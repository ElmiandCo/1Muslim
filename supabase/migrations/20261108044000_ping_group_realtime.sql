-- Publish Ping navigation and invitation changes to Supabase Realtime.
do $$ begin
 if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='muslim_sync_sessions') then
   alter publication supabase_realtime add table public.muslim_sync_sessions;
 end if;
 if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='muslim_sync_members') then
   alter publication supabase_realtime add table public.muslim_sync_members;
 end if;
 if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='muslim_sync_lead_requests') then
   alter publication supabase_realtime add table public.muslim_sync_lead_requests;
 end if;
end $$;
-- Only the leader can invite; invited members may accept their own invitation.
drop policy if exists "sync members invite" on public.muslim_sync_members;
create policy "ping leader invites members" on public.muslim_sync_members for insert to authenticated
 with check (user_id <> auth.uid() and exists (
 select 1 from public.muslim_sync_sessions s where s.id=session_id and s.status='accepted' and s.leader_id=auth.uid()));
-- Prevent accepted members from changing their identity or reviving invitations.
drop policy if exists "sync members respond" on public.muslim_sync_members;
create policy "ping invitee responds" on public.muslim_sync_members for update to authenticated
 using (user_id=auth.uid() and status in ('pending','accepted'))
 with check (user_id=auth.uid() and status in ('accepted','declined'));
-- Realtime and read policies must include the invited participant before acceptance.
