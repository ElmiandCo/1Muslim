-- Live 2.0 server-side watchdog: least-recently-observed active streams
-- and bounded dedupe retention. No production migration is applied here.
-- This migration depends on 20261031052500_live_2_event_presence.sql.
create or replace function public.list_live_presence_reconciliation_candidates(p_limit integer default 50)
returns table(stream_id uuid, room_name text, host_id uuid)
language plpgsql security definer set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'Service role required' using errcode = '42501';
  end if;
  return query
    select s.id, s.room_name::text, s.host_id
    from public.live_streams s
    left join public.live_presence_observations o on o.stream_id = s.id
    where s.status = 'live'
    order by coalesce(o.observed_at, '-infinity'::timestamptz) asc, s.started_at asc
    limit least(greatest(coalesce(p_limit, 50), 1), 100);
end;
$$;
revoke all on function public.list_live_presence_reconciliation_candidates(integer)
  from public, anon, authenticated;
grant execute on function public.list_live_presence_reconciliation_candidates(integer)
  to service_role;

-- Prune only old dedupe IDs, never active presence or observation rows.
-- Duplicates older than seven days are irrelevant to a Live session.
create or replace function public.prune_live_presence_webhook_events(p_limit integer default 2000)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_deleted integer;
begin
  if auth.role() <> 'service_role' then
    raise exception 'Service role required' using errcode = '42501';
  end if;
  with old_events as (
    select event_id from public.live_presence_webhook_events
    where received_at < now() - interval '7 days'
    order by received_at asc
    limit least(greatest(coalesce(p_limit, 2000), 1), 5000)
    for update skip locked
  )
  delete from public.live_presence_webhook_events e
  using old_events old
  where e.event_id = old.event_id;
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;
revoke all on function public.prune_live_presence_webhook_events(integer)
  from public, anon, authenticated;
grant execute on function public.prune_live_presence_webhook_events(integer)
  to service_role;
