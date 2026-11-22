-- 1Muslim Qur’an Live participation XP, one eligible Live surah/day and once per chapter.
-- Granted by authoritative host-only /api/live-end after LiveKit webhook observation.
create table if not exists public.quran_chapter_live_xp_awards (
 live_id uuid primary key references public.live_streams(id) on delete restrict,
 user_id uuid not null references auth.users(id) on delete cascade,
 chapter_number integer not null check(chapter_number between 1 and 114),
 awarded_on date not null default (now() at time zone 'UTC')::date,
 xp_awarded integer not null default 1500 check(xp_awarded=1500),
 created_at timestamptz not null default now(),
 unique(user_id,chapter_number),
 unique(user_id,awarded_on)
);
alter table public.quran_chapter_live_xp_awards enable row level security;
create policy "Reciters read own Live awards" on public.quran_chapter_live_xp_awards
 for select to authenticated using ((select auth.uid())=user_id);
grant select on public.quran_chapter_live_xp_awards to authenticated;

create or replace function public.grant_quran_chapter_live_xp(p_stream uuid,p_host uuid)
returns integer
language plpgsql security definer set search_path='' as $$
declare
 v_stream record;
 v_total integer;
 v_awarded boolean := false;
 v_today date := (now() at time zone 'UTC')::date;
begin
 -- This function is service-role-only. Caller /api/live-end verifies user and stream ownership.
 select id,host_id,status,category,recital_chapter,started_at,ended_at,last_heartbeat_at
 into v_stream from public.live_streams
 where id=p_stream and host_id=p_host and status='ended' and recital_chapter between 1 and 114
 and lower(category) in ('qur''an','quran') for update;
 if not found then return 0; end if;
 if v_stream.started_at is null or v_stream.ended_at is null or
    v_stream.ended_at-v_stream.started_at<interval '90 seconds' or
    v_stream.last_heartbeat_at is null or
    v_stream.last_heartbeat_at-v_stream.started_at<interval '30 seconds'
 then return 0; end if;
 if not exists(select 1 from public.live_presence_webhook_events w
   where w.stream_id=p_stream)
 then return 0; end if;
 select coalesce(p.xp_total,0) into v_total from public.profiles p where p.id=p_host for update;
 if not found then return 0; end if;
 if exists (select 1 from public.quran_chapter_live_xp_awards x where x.user_id=p_host and (x.awarded_on=v_today or x.chapter_number=v_stream.recital_chapter))
 or exists(select 1 from public.quran_chapter_recital_xp_awards a where a.user_id=p_host and a.awarded_on=v_today)
 then return 0; end if;
 insert into public.quran_chapter_live_xp_awards(live_id,user_id,chapter_number,awarded_on)
 values(p_stream,p_host,v_stream.recital_chapter,v_today) on conflict do nothing;
 v_awarded:=found;
 if v_awarded then update public.profiles p set xp_total=coalesce(xp_total,0)+1500 where p.id=p_host; end if;
 return case when v_awarded then 1500 else 0 end;
end $$;
revoke all on function public.grant_quran_chapter_live_xp(uuid,uuid) from public;
revoke all on function public.grant_quran_chapter_live_xp(uuid,uuid) from anon;
revoke all on function public.grant_quran_chapter_live_xp(uuid,uuid) from authenticated;
grant execute on function public.grant_quran_chapter_live_xp(uuid,uuid) to service_role;

-- Reciprocal daily cap: a Live bonus and audio upload do not both award on one UTC date.
create or replace function public.claim_quran_chapter_recital_xp(p_recital uuid)
returns table(awarded integer,xp_total integer)
language plpgsql security definer set search_path='' as $$
declare
 v_user uuid := (select auth.uid());
 v_recital record;
 v_object_bytes bigint;
 v_total integer;
 v_today date := (now() at time zone 'UTC')::date;
 v_awarded boolean := false;
begin
 if v_user is null then raise exception 'Sign in required'; end if;
 select r.* into v_recital from public.quran_chapter_recitals r
 where r.id=p_recital and r.user_id=v_user and r.visibility='public';
 if not found then raise exception 'Your published recitation was not found'; end if;
 if v_recital.duration_seconds < 30 or v_recital.file_size_bytes < 20000 then
  select coalesce(p.xp_total,0) into v_total from public.profiles p where p.id=v_user;
  awarded:=0;xp_total:=coalesce(v_total,0);return next;return;
 end if;
 select coalesce((o.metadata->>'size')::bigint,0) into v_object_bytes
 from storage.objects o where o.bucket_id='quran-community-recitals'
 and o.name=v_recital.storage_path;
 if coalesce(v_object_bytes,0)<20000 or v_object_bytes<v_recital.file_size_bytes then
  raise exception 'Uploaded recitation file is missing or incomplete';
 end if;
 -- Serialize awarding across tabs/devices for this user.
 select coalesce(p.xp_total,0) into v_total from public.profiles p where p.id=v_user for update;
 if not found then raise exception 'Profile unavailable'; end if;
 if not exists(
  select 1 from public.quran_chapter_recital_xp_awards a
  where a.user_id=v_user and (a.awarded_on=v_today or a.chapter_number=v_recital.chapter_number)
 ) and not exists (
  select 1 from public.quran_chapter_live_xp_awards x
  where x.user_id=v_user and x.awarded_on=v_today
 ) then
  insert into public.quran_chapter_recital_xp_awards(recital_id,user_id,chapter_number,awarded_on)
  values(p_recital,v_user,v_recital.chapter_number,v_today)
  on conflict do nothing;
  v_awarded:=found;
 end if;
 if v_awarded then
  update public.profiles p set xp_total=coalesce(p.xp_total,0)+1000
  where p.id=v_user returning p.xp_total into v_total;
 end if;
 awarded:=case when v_awarded then 1000 else 0 end;
 xp_total:=coalesce(v_total,0);return next;
end $$;
revoke all on function public.claim_quran_chapter_recital_xp(uuid) from public;
revoke execute on function public.claim_quran_chapter_recital_xp(uuid) from anon;
grant execute on function public.claim_quran_chapter_recital_xp(uuid) to authenticated;

