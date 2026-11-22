-- Optional visual metadata for *existing* LiveKit streams.
-- Audio-only viewers render the selected ambience locally without any extra video bandwidth.
alter table public.live_streams
 add column if not exists recital_chapter integer check (recital_chapter between 1 and 114),
 add column if not exists recital_visual text check (recital_visual in ('clean','starlight','emerald'));

-- Public, opt-in audio-only recitations. Microphone recordings stay local until Publish.
-- Strict RLS; no public write or user-selected XP amount.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('quran-community-recitals','quran-community-recitals',true,31457280,
 array['audio/webm','audio/mp4','audio/ogg','audio/mpeg'])
on conflict (id) do update set public=true,file_size_limit=31457280,
 allowed_mime_types=excluded.allowed_mime_types;

create table if not exists public.quran_chapter_recitals (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 chapter_number integer not null check(chapter_number between 1 and 114),
 storage_path text not null unique,
 mime_type text not null check(mime_type in ('audio/webm','audio/mp4','audio/ogg','audio/mpeg')),
 duration_seconds integer not null check(duration_seconds between 5 and 3600),
 file_size_bytes bigint not null check(file_size_bytes between 10240 and 31457280),
 visibility text not null default 'public' check (visibility in ('public')),
 created_at timestamptz not null default now(),
 constraint recital_owner_path check (split_part(storage_path,'/',1)=user_id::text)
);
create index if not exists quran_chapter_recitals_latest on public.quran_chapter_recitals(created_at desc);
create index if not exists quran_chapter_recitals_chapter_latest on public.quran_chapter_recitals(chapter_number,created_at desc);
alter table public.quran_chapter_recitals enable row level security;
create policy "Published chapter recitations are discoverable" on public.quran_chapter_recitals
 for select to anon,authenticated using (visibility='public');
create policy "Reciter publishes own audio" on public.quran_chapter_recitals
 for insert to authenticated with check ((select auth.uid())=user_id and visibility='public');
create policy "Reciter deletes own audio" on public.quran_chapter_recitals
 for delete to authenticated using ((select auth.uid())=user_id);
grant select on public.quran_chapter_recitals to anon,authenticated;
grant insert,delete on public.quran_chapter_recitals to authenticated;

create policy "Reciter uploads own public recital" on storage.objects
 for insert to authenticated with check(
  bucket_id='quran-community-recitals' and
  (storage.foldername(name))[1]=(select auth.uid())::text
 );
create policy "Reciter lists own uploaded recitals" on storage.objects
 for select to authenticated using(
  bucket_id='quran-community-recitals' and
  (storage.foldername(name))[1]=(select auth.uid())::text
 );
create policy "Reciter deletes own public recital" on storage.objects
 for delete to authenticated using(
  bucket_id='quran-community-recitals' and
  (storage.foldername(name))[1]=(select auth.uid())::text
 );

-- 1,000 XP once per chapter ever and at most once per UTC day.
-- This rewards documented participation, not an automated claim of Tajweed accuracy.
create table if not exists public.quran_chapter_recital_xp_awards(
 id uuid primary key default gen_random_uuid(),
 recital_id uuid not null unique references public.quran_chapter_recitals(id) on delete restrict,
 user_id uuid not null references auth.users(id) on delete cascade,
 chapter_number integer not null check(chapter_number between 1 and 114),
 awarded_on date not null default (now() at time zone 'UTC')::date,
 xp_awarded integer not null default 1000 check(xp_awarded=1000),
 created_at timestamptz not null default now(),
 unique(user_id,chapter_number),
 unique(user_id,awarded_on)
);
alter table public.quran_chapter_recital_xp_awards enable row level security;
create policy "Members see own recital awards" on public.quran_chapter_recital_xp_awards
 for select to authenticated using ((select auth.uid())=user_id);
grant select on public.quran_chapter_recital_xp_awards to authenticated;

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
grant execute on function public.claim_quran_chapter_recital_xp(uuid) to authenticated;
