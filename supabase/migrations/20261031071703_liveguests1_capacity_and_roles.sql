-- LiveGuests1.0: atomic host approval and separate video/audio seat caps.
-- Additive migration. Apply in staging before enabling guest API routes.
-- Backfill the original guest table if earlier migrations were not applied.
-- This is intentionally idempotent for projects that already have the table.
create table if not exists public.live_guest_requests (
  id uuid primary key default gen_random_uuid(),
  stream_id uuid not null references public.live_streams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','removed')),
  mode text not null default 'pfp' check (mode in ('pfp','camera')),
  created_at timestamptz not null default now(),
  unique (stream_id,user_id)
);
alter table public.live_guest_requests enable row level security;
drop policy if exists "Guest and host read requests" on public.live_guest_requests;
create policy "Guest and host read requests" on public.live_guest_requests
  for select to authenticated using (
    user_id = (select auth.uid()) or exists (
      select 1 from public.live_streams s
      where s.id = stream_id and s.host_id = (select auth.uid())
    )
  );
drop policy if exists "Guest requests own seat" on public.live_guest_requests;
create policy "Guest requests own seat" on public.live_guest_requests
  for insert to authenticated with check (
    user_id = (select auth.uid()) and status = 'pending'
    and exists (select 1 from public.live_streams s
      where s.id = stream_id and s.status = 'live')
  );
grant select, insert on public.live_guest_requests to authenticated;

alter table public.live_guest_requests
  add column if not exists approved_at timestamptz,
  add column if not exists host_muted boolean not null default false;
create index if not exists live_guest_requests_roster_idx
  on public.live_guest_requests(stream_id, status, approved_at, created_at);

-- Never allow direct authenticated UPDATE; moderation goes through the locked RPC.
revoke update, delete on public.live_guest_requests from anon, authenticated;

create or replace function public.request_live_guest(
  p_stream uuid, p_mode text default 'pfp'
) returns void language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_host uuid;
  v_status text;
  v_ratio text;
begin
  if v_user is null then
    raise exception 'Sign in required' using errcode = '42501';
  end if;
  if p_mode is null or p_mode not in ('pfp', 'camera') then
    raise exception 'Invalid guest mode' using errcode = '22023';
  end if;
  -- The stream lock serializes request/moderation/mode transitions.
  select host_id, status, aspect_ratio into v_host, v_status, v_ratio
    from public.live_streams where id = p_stream for update;
  if not found or v_status <> 'live' or v_host = v_user then
    raise exception 'Stream unavailable' using errcode = '42501';
  end if;
  if v_ratio = '1:1' and p_mode = 'camera' then
    raise exception 'Audio rooms are microphone-only' using errcode = '22023';
  end if;
  insert into public.live_guest_requests(stream_id, user_id, mode, status)
    values (p_stream, v_user, p_mode, 'pending')
  on conflict (stream_id, user_id) do update
    set mode = excluded.mode, status = 'pending',
        approved_at = null, host_muted = false, created_at = now()
    where public.live_guest_requests.status <> 'approved';
end;
$$;

create or replace function public.moderate_live_guest(
  p_request uuid, p_status text
) returns void language plpgsql security definer set search_path = public as $$
declare
  v_stream uuid;
  v_host uuid;
  v_stream_status text;
  v_ratio text;
  v_current_status text;
  v_limit integer;
  v_count integer;
begin
  if auth.uid() is null then
    raise exception 'Sign in required' using errcode = '42501';
  end if;
  if p_status is null or p_status not in ('approved','rejected','removed') then
    raise exception 'Invalid moderation status' using errcode = '22023';
  end if;
  select stream_id into v_stream
    from public.live_guest_requests where id = p_request;
  if v_stream is null then
    raise exception 'Guest request unavailable' using errcode = '42501';
  end if;
  -- All approval decisions and studio mode changes lock the same stream row.
  select host_id, status, aspect_ratio
    into v_host, v_stream_status, v_ratio
    from public.live_streams where id = v_stream for update;
  if not found or v_host is distinct from auth.uid() or v_stream_status <> 'live' then
    raise exception 'Host access required' using errcode = '42501';
  end if;
  select status into v_current_status from public.live_guest_requests
    where id = p_request and stream_id = v_stream for update;
  if not found then
    raise exception 'Guest request unavailable' using errcode = '42501';
  end if;
  if v_current_status = p_status then return; end if; -- retry-safe
  if p_status = 'approved' then
    if v_current_status <> 'pending' then
      raise exception 'Only pending requests can be approved' using errcode = '22023';
    end if;
    v_limit := case when v_ratio = '1:1' then 11 else 3 end;
    select count(*) into v_count from public.live_guest_requests
      where stream_id = v_stream and status = 'approved';
    if v_count >= v_limit then
      raise exception 'Guest stage is full (% seats)', v_limit using errcode = '23514';
    end if;
    update public.live_guest_requests
      set status = 'approved', approved_at = now(), host_muted = false where id = p_request;
  elsif p_status = 'rejected' then
    if v_current_status <> 'pending' then
      raise exception 'Only pending requests can be declined' using errcode = '22023';
    end if;
    update public.live_guest_requests set status = 'rejected', approved_at = null
      where id = p_request;
  else
    if v_current_status not in ('approved','pending') then
      raise exception 'Guest is not on stage or waiting' using errcode = '22023';
    end if;
    update public.live_guest_requests set status = 'removed', approved_at = null, host_muted = false
      where id = p_request;
  end if;
end;
$$;

-- The host-only route calls this service-role RPC after verifying the session.
-- The same stream lock prevents switching into a 3-seat video stage with >3
-- approved audio guests. No silent guest eviction.
create or replace function public.set_live_guest_stream_mode(
  p_stream uuid, p_mode text
) returns void language plpgsql security definer set search_path = public as $$
declare
  v_status text;
  v_approved integer;
begin
  if auth.role() <> 'service_role' then
    raise exception 'Service role required' using errcode = '42501';
  end if;
  if p_mode is null or p_mode not in ('phone','desktop','voice') then
    raise exception 'Invalid studio mode' using errcode = '22023';
  end if;
  select status into v_status from public.live_streams
    where id = p_stream for update;
  if not found or v_status <> 'live' then
    raise exception 'Active stream required' using errcode = '22023';
  end if;
  if p_mode <> 'voice' then
    select count(*) into v_approved from public.live_guest_requests
      where stream_id = p_stream and status = 'approved';
    if v_approved > 3 then
      raise exception 'Remove audio guests until only three remain before switching to video'
        using errcode = '23514';
    end if;
  end if;
  update public.live_streams set
    aspect_ratio = case p_mode
      when 'voice' then '1:1' when 'desktop' then '16:9' else '9:16' end,
    video_width = case p_mode when 'desktop' then 1280 else 720 end,
    video_height = case p_mode when 'desktop' then 720
      when 'voice' then 720 else 1280 end
  where id = p_stream and status = 'live';
end;
$$;

revoke all on function public.request_live_guest(uuid,text) from public,anon;
revoke all on function public.moderate_live_guest(uuid,text) from public,anon;
revoke all on function public.set_live_guest_stream_mode(uuid,text) from public,anon,authenticated;
grant execute on function public.request_live_guest(uuid,text) to authenticated;
grant execute on function public.moderate_live_guest(uuid,text) to authenticated;
grant execute on function public.set_live_guest_stream_mode(uuid,text) to service_role;

-- Host microphone moderation is persisted and checked during token issuance.
create or replace function public.set_live_guest_host_mute(
  p_request uuid, p_muted boolean
) returns void language plpgsql security definer set search_path = public as $$
declare
  v_stream uuid;
  v_host uuid;
  v_status text;
  v_request_status text;
begin
  if auth.uid() is null or p_muted is null then
    raise exception 'Invalid mute request' using errcode = '42501';
  end if;
  select stream_id into v_stream from public.live_guest_requests where id = p_request;
  if v_stream is null then
    raise exception 'Guest request unavailable' using errcode = '42501';
  end if;
  select host_id, status into v_host, v_status
    from public.live_streams where id = v_stream for update;
  if v_host is distinct from auth.uid() or v_status <> 'live' then
    raise exception 'Host access required' using errcode = '42501';
  end if;
  select status into v_request_status from public.live_guest_requests
    where id = p_request and stream_id = v_stream for update;
  if v_request_status is distinct from 'approved' then
    raise exception 'Guest is not on stage' using errcode = '22023';
  end if;
  update public.live_guest_requests set host_muted = p_muted where id = p_request;
end;
$$;
revoke all on function public.set_live_guest_host_mute(uuid,boolean) from public,anon;
grant execute on function public.set_live_guest_host_mute(uuid,boolean) to authenticated;
