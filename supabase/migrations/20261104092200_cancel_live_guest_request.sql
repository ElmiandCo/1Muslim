-- A viewer may withdraw only their own pending request; never a host-approved guest.
create or replace function public.cancel_live_guest_request(p_stream uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  delete from public.live_guest_requests
  where stream_id=p_stream and user_id=auth.uid() and status='pending';
end;$$;
revoke all on function public.cancel_live_guest_request(uuid) from public,anon;
grant execute on function public.cancel_live_guest_request(uuid) to authenticated;
