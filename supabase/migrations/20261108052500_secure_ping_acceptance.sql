-- Applied to production Supabase on 2026-11-08. Authenticated invitees only; no profile dependency.
create or replace function public.ping_accept_session(p_session_id uuid)
returns public.muslim_sync_sessions
language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := auth.uid(); v_session public.muslim_sync_sessions%rowtype;
begin
 if v_uid is null then raise exception 'Sign in required' using errcode='28000'; end if;
 select * into v_session from public.muslim_sync_sessions where id=p_session_id for update;
 if not found then raise exception 'Ping invitation not found' using errcode='P0002'; end if;
 if v_session.invitee_id <> v_uid then raise exception 'Only the invited member may accept' using errcode='42501'; end if;
 if v_session.status not in ('pending','accepted') then raise exception 'Ping invitation is no longer active' using errcode='P0001'; end if;
 if v_session.status='pending' then
  update public.muslim_sync_sessions set status='accepted',leader_id=coalesce(leader_id,initiator_id),updated_at=now() where id=p_session_id returning * into v_session;
 end if;
 insert into public.muslim_sync_members(session_id,user_id,status)
 values(p_session_id,v_session.initiator_id,'accepted'),(p_session_id,v_session.invitee_id,'accepted')
 on conflict (session_id,user_id) do update set status='accepted';
 return v_session;
end $$;
revoke all on function public.ping_accept_session(uuid) from public,anon;
grant execute on function public.ping_accept_session(uuid) to authenticated;