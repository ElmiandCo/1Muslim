-- Keep Live status truthful even when a browser closes without sending a final end request.
-- Supabase Cron runs this once per minute.

create or replace function public.finalize_stale_live_streams()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  changed_count integer;
begin
  update public.live_streams
  set
    status = 'ended',
    ended_at = coalesce(
      ended_at,
      case
        when scheduled_end_at is not null and scheduled_end_at <= now()
          then scheduled_end_at
        when last_heartbeat_at is not null
          then last_heartbeat_at
        else now()
      end
    ),
    last_heartbeat_at = null,
    updated_at = now()
  where status = 'live'
    and (
      (scheduled_end_at is not null and scheduled_end_at <= now())
      or last_heartbeat_at is null
      or last_heartbeat_at < now() - interval '75 seconds'
    );

  get diagnostics changed_count = row_count;

  update public.live_schedule_slots s
  set status = 'completed', updated_at = now()
  where s.status = 'live'
    and not exists (
      select 1
      from public.live_streams l
      where l.schedule_slot_id = s.id
        and l.status = 'live'
    )
    and (
      s.ends_at <= now()
      or exists (
        select 1
        from public.live_streams l
        where l.schedule_slot_id = s.id
          and l.status = 'ended'
      )
    );

  return changed_count;
end;
$$;

revoke all on function public.finalize_stale_live_streams() from public, anon, authenticated;
grant execute on function public.finalize_stale_live_streams() to postgres;

select cron.schedule(
  'onemuslim-finalize-stale-lives',
  '* * * * *',
  'select public.finalize_stale_live_streams();'
)
where not exists (
  select 1 from cron.job where jobname = 'onemuslim-finalize-stale-lives'
);
