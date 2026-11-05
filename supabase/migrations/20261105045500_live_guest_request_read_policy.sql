-- Allow the stream host to review join requests and each requester to track their own status.
create policy "live_guest_requests_host_and_self_read" on public.live_guest_requests
 for select to authenticated using (
 user_id=(select auth.uid()) or exists (
 select 1 from public.live_streams s where s.id=stream_id and s.host_id=(select auth.uid())
 ));
grant select on public.live_guest_requests to authenticated;
