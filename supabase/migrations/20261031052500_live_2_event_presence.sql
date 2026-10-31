-- Live 2.0: event-driven, server-verified discovery. Apply before enabling LiveKit webhook.
-- No change to existing live_streams.status or UI.
create table if not exists public.live_presence (
  stream_id uuid primary key references public.live_streams(id) on delete cascade,
  session_id uuid not null,
  state text not null check (state in ('STARTING','READY_AUDIO','READY_VIDEO','RECONNECTING','ENDED')),
  media_type text not null check (media_type in ('none','audio','video')),
  version bigint not null default 1 check (version > 0),
  changed_at timestamptz not null default now()
);
create index if not exists live_presence_ready_idx on public.live_presence(changed_at desc)
  where state in ('READY_AUDIO','READY_VIDEO');

-- Observation timestamps are NOT published; viewers receive only state changes.
create table if not exists public.live_presence_observations (
  stream_id uuid primary key references public.live_streams(id) on delete cascade,
  observed_at timestamptz not null,
  event_id text not null
);
create table if not exists public.live_presence_webhook_events (
  event_id text primary key,
  stream_id uuid not null references public.live_streams(id) on delete cascade,
  received_at timestamptz not null default now()
);
create index if not exists live_presence_webhook_events_received_idx
  on public.live_presence_webhook_events(received_at);

alter table public.live_presence enable row level security;
alter table public.live_presence_observations enable row level security;
alter table public.live_presence_webhook_events enable row level security;
revoke all on public.live_presence from public, anon, authenticated;
revoke all on public.live_presence_observations from public, anon, authenticated;
revoke all on public.live_presence_webhook_events from public, anon, authenticated;
grant select on public.live_presence to anon, authenticated;
drop policy if exists "live presence readable for public streams or host" on public.live_presence;
create policy "live presence readable for public streams or host"
on public.live_presence for select to anon, authenticated using (
  exists (
    select 1 from public.live_streams s
    where s.id = live_presence.stream_id
      and (s.visibility = 'public' or s.host_id = (select auth.uid()))
  )
);

-- The service role alone can apply signed LiveKit observations.
-- Locking live_streams serializes a webhook with an explicit End Live transaction.
create or replace function public.apply_livekit_presence_snapshot(
  p_stream_id uuid,
  p_event_id text,
  p_observed_at timestamptz,
  p_host_connected boolean,
  p_has_audio boolean,
  p_has_video boolean
) returns table(changed boolean, state text, version bigint)
language plpgsql security definer set search_path = public
as $$
declare
  v_status text;
  v_state text;
  v_media text;
  v_current_state text;
  v_current_version bigint;
  v_rows integer;
begin
  if auth.role() <> 'service_role' then
    raise exception 'Service role required' using errcode = '42501';
  end if;
  if p_stream_id is null or p_observed_at is null or p_event_id is null
    or length(p_event_id) < 1 or length(p_event_id) > 128 then
    raise exception 'Invalid presence observation' using errcode = '22023';
  end if;
  select s.status into v_status from public.live_streams s
    where s.id = p_stream_id for update;
  if not found then return; end if;
  if v_status <> 'live' then
    select p.state, p.version into v_current_state, v_current_version
      from public.live_presence p where p.stream_id = p_stream_id;
    return query select false, coalesce(v_current_state, 'ENDED')::text,
      coalesce(v_current_version, 0)::bigint;
    return;
  end if;

  insert into public.live_presence_webhook_events(event_id, stream_id)
    values (p_event_id, p_stream_id) on conflict (event_id) do nothing;
  if not found then
    select p.state, p.version into v_current_state, v_current_version
      from public.live_presence p where p.stream_id = p_stream_id;
    return query select false, coalesce(v_current_state, 'STARTING')::text,
      coalesce(v_current_version, 0)::bigint;
    return;
  end if;

  insert into public.live_presence_observations(stream_id, observed_at, event_id)
    values (p_stream_id, p_observed_at, p_event_id)
    on conflict (stream_id) do update
      set observed_at = excluded.observed_at, event_id = excluded.event_id
      where public.live_presence_observations.observed_at < excluded.observed_at;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    select p.state, p.version into v_current_state, v_current_version
      from public.live_presence p where p.stream_id = p_stream_id;
    return query select false, coalesce(v_current_state, 'STARTING')::text,
      coalesce(v_current_version, 0)::bigint;
    return;
  end if;

  -- Initial room creation without a host/track is STARTING, not a
  -- false host-disconnect notification. After a stream has been READY,
  -- loss of all published media or host presence means RECONNECTING.
  select p.state into v_current_state from public.live_presence p
    where p.stream_id = p_stream_id;
  v_state := case
    when coalesce(p_host_connected, false) and coalesce(p_has_video, false) then 'READY_VIDEO'
    when coalesce(p_host_connected, false) and coalesce(p_has_audio, false) then 'READY_AUDIO'
    when v_current_state in ('READY_AUDIO','READY_VIDEO','RECONNECTING') then 'RECONNECTING'
    else 'STARTING' end;
  v_media := case when v_state = 'READY_VIDEO' then 'video'
    when v_state = 'READY_AUDIO' then 'audio' else 'none' end;

  insert into public.live_presence(stream_id, session_id, state, media_type, version)
    values (p_stream_id, p_stream_id, v_state, v_media, 1)
    on conflict (stream_id) do update
      set state = excluded.state, media_type = excluded.media_type,
        version = public.live_presence.version + 1, changed_at = now()
      where public.live_presence.state is distinct from excluded.state
         or public.live_presence.media_type is distinct from excluded.media_type;
  get diagnostics v_rows = row_count;
  select p.state, p.version into v_current_state, v_current_version
    from public.live_presence p where p.stream_id = p_stream_id;
  return query select (v_rows > 0), v_current_state, v_current_version;
end;
$$;
revoke all on function public.apply_livekit_presence_snapshot(uuid,text,timestamptz,boolean,boolean,boolean)
  from public, anon, authenticated;
grant execute on function public.apply_livekit_presence_snapshot(uuid,text,timestamptz,boolean,boolean,boolean)
  to service_role;

-- Every terminal status update (including existing host fallback and cron) is
-- atomically reflected in presence, even if the LiveKit room teardown fails.
create or replace function public.end_live_presence_on_terminal_status()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.status in ('ended','cancelled') and old.status is distinct from new.status then
    insert into public.live_presence(stream_id, session_id, state, media_type, version)
      values (new.id, new.id, 'ENDED', 'none', 1)
      on conflict (stream_id) do update
        set state = 'ENDED', media_type = 'none',
          version = public.live_presence.version + 1, changed_at = now()
        where public.live_presence.state <> 'ENDED';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_end_live_presence on public.live_streams;
create trigger trg_end_live_presence
after update of status on public.live_streams
for each row execute function public.end_live_presence_on_terminal_status();

do $$
begin
  alter publication supabase_realtime add table public.live_presence;
exception when duplicate_object then null;
end $$;

-- Operational follow-up: periodically prune old live_presence_webhook_events
-- and reconcile active rooms server-side. Do not delete active presence rows.
