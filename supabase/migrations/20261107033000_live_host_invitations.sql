-- Host invitation is an offer, never permission to publish media.
create table if not exists public.live_guest_invitations (
 id uuid primary key default gen_random_uuid(),
 stream_id uuid not null references public.live_streams(id) on delete cascade,
 viewer_id uuid not null references auth.users(id) on delete cascade,
 host_id uuid not null references auth.users(id) on delete cascade,
 status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled')),
 created_at timestamptz not null default now(),
 unique(stream_id,viewer_id)
);
alter table public.live_guest_invitations enable row level security;
create policy "live invitations host or recipient read" on public.live_guest_invitations for select to authenticated
 using(host_id=(select auth.uid()) or viewer_id=(select auth.uid()));
grant select on public.live_guest_invitations to authenticated;
create or replace function public.invite_live_viewer(p_stream uuid,p_viewer uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v_host uuid;
begin
 select host_id into v_host from public.live_streams where id=p_stream and status='live';
 if v_host is distinct from auth.uid() or p_viewer=v_host then raise exception 'Not authorized'; end if;
 if not exists(select 1 from auth.users where id=p_viewer) then raise exception 'Viewer unavailable'; end if;
 insert into public.live_guest_invitations(stream_id,viewer_id,host_id,status)
 values(p_stream,p_viewer,v_host,'pending')
 on conflict(stream_id,viewer_id) do update set status='pending',created_at=now();
end;$$;
create or replace function public.respond_live_invitation(p_invitation uuid,p_accept boolean)
returns void language plpgsql security definer set search_path=public as $$
declare v_inv public.live_guest_invitations%rowtype; v_count integer;
begin
 select * into v_inv from public.live_guest_invitations where id=p_invitation for update;
 if not found or v_inv.viewer_id is distinct from auth.uid() or v_inv.status<>'pending' then raise exception 'Invitation unavailable'; end if;
 if not exists(select 1 from public.live_streams where id=v_inv.stream_id and status='live') then raise exception 'Stream ended'; end if;
 if p_accept then
  perform 1 from public.live_streams where id=v_inv.stream_id for update;
  select count(*) into v_count from public.live_guest_requests where stream_id=v_inv.stream_id and status='approved';
  if v_count>=4 then raise exception 'Guest stage full'; end if;
  insert into public.live_guest_requests(stream_id,user_id,mode,status)
  values(v_inv.stream_id,v_inv.viewer_id,'pfp','approved')
  on conflict(stream_id,user_id) do update set status='approved',mode='pfp',created_at=now();
 end if;
 update public.live_guest_invitations set status=case when p_accept then 'accepted' else 'declined' end where id=p_invitation;
end;$$;
revoke all on function public.invite_live_viewer(uuid,uuid) from public,anon;
revoke all on function public.respond_live_invitation(uuid,boolean) from public,anon;
grant execute on function public.invite_live_viewer(uuid,uuid) to authenticated;
grant execute on function public.respond_live_invitation(uuid,boolean) to authenticated;
