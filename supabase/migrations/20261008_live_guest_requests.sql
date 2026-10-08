create table if not exists public.live_guest_requests(
 id uuid primary key default gen_random_uuid(),
 stream_id uuid not null references public.live_streams(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 status text not null default 'pending' check(status in ('pending','approved','rejected','removed')),
 mode text not null default 'pfp' check(mode in ('pfp','camera')),
 created_at timestamptz not null default now(),
 unique(stream_id,user_id)
);
alter table public.live_guest_requests enable row level security;
drop policy if exists "Guest and host read requests" on public.live_guest_requests;
create policy "Guest and host read requests" on public.live_guest_requests for select to authenticated
 using(user_id=auth.uid() or exists(select 1 from public.live_streams s where s.id=stream_id and s.host_id=auth.uid()));
drop policy if exists "Guest requests own seat" on public.live_guest_requests;
create policy "Guest requests own seat" on public.live_guest_requests for insert to authenticated
 with check(user_id=auth.uid() and status='pending' and exists(select 1 from public.live_streams s where s.id=stream_id and s.status='live'));
-- Updates are mediated through these restricted RPCs, not direct client UPDATE.
create or replace function public.request_live_guest(p_stream uuid,p_mode text default 'pfp')
returns void language plpgsql security definer set search_path=public as $$
begin
 if p_mode not in ('pfp','camera') then raise exception 'Invalid mode'; end if;
 if not exists(select 1 from public.live_streams where id=p_stream and status='live' and host_id<>auth.uid()) then raise exception 'Stream unavailable'; end if;
 insert into public.live_guest_requests(stream_id,user_id,mode,status) values(p_stream,auth.uid(),p_mode,'pending')
 on conflict(stream_id,user_id) do update set mode=excluded.mode,status='pending',created_at=now();
end;$$;
create or replace function public.moderate_live_guest(p_request uuid,p_status text)
returns void language plpgsql security definer set search_path=public as $$
declare sid uuid; count_approved int;
begin
 if p_status not in ('approved','rejected','removed') then raise exception 'Invalid status'; end if;
 select r.stream_id into sid from public.live_guest_requests r join public.live_streams s on s.id=r.stream_id where r.id=p_request and s.host_id=auth.uid() and s.status='live' for update of r;
 if sid is null then raise exception 'Not authorized'; end if;
 if p_status='approved' then
  select count(*) into count_approved from public.live_guest_requests where stream_id=sid and status='approved';
  if count_approved>=4 then raise exception 'All four guest seats are occupied'; end if;
 end if;
 update public.live_guest_requests set status=p_status where id=p_request;
end;$$;
revoke all on function public.request_live_guest(uuid,text) from public,anon;
revoke all on function public.moderate_live_guest(uuid,text) from public,anon;
grant execute on function public.request_live_guest(uuid,text) to authenticated;
grant execute on function public.moderate_live_guest(uuid,text) to authenticated;
