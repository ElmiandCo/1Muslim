-- OneMuslim: host-controlled Live visibility
alter table public.live_streams
  add column if not exists visibility text not null default 'public'
  check (visibility in ('public','ashab'));

update public.live_streams
set visibility = 'public'
where visibility is null;

drop policy if exists "Public can view live streams" on public.live_streams;
drop policy if exists "Users can view accessible live streams" on public.live_streams;

create policy "Users can view accessible live streams"
on public.live_streams
for select
to authenticated
using (
  (
    status = 'live'
    and (
      visibility = 'public'
      or host_id = (select auth.uid())
      or (
        visibility = 'ashab'
        and exists (
          select 1
          from public.ashab_friendships f
          where f.status = 'accepted'
            and (
              (f.requester_id = (select auth.uid()) and f.addressee_id = live_streams.host_id)
              or
              (f.addressee_id = (select auth.uid()) and f.requester_id = live_streams.host_id)
            )
        )
      )
    )
  )
  or recording_id is not null
);